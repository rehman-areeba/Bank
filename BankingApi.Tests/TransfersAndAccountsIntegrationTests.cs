using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BankingApi.Data;
using BankingApi.DTOs;
using BankingApi.Models;
using Microsoft.Extensions.DependencyInjection;

namespace BankingApi.Tests;

public class TransfersAndAccountsIntegrationTests : IClassFixture<BankingApiFactory>
{
    private readonly HttpClient _client;
    private readonly BankingApiFactory _factory;

    public TransfersAndAccountsIntegrationTests(BankingApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(string Token, Guid UserId, string AccountNumber)> CreateUserWithAccount(
        string name, string email, decimal initialBalance = 10000)
    {
        // Register user
        var registerRequest = new RegisterRequestDto
        {
            FullName = name,
            Email = email,
            Password = "Test@1234",
            ConfirmPassword = "Test@1234"
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Get the account number from database
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();
        var user = await db.Users.FindAsync(authResult!.UserId);
        var account = db.Accounts.FirstOrDefault(a => a.UserId == user!.Id);

        // Update balance if needed
        if (account != null && initialBalance != 0)
        {
            account.Balance = initialBalance;
            await db.SaveChangesAsync();
        }

        return (authResult.Token, authResult.UserId, account?.AccountNumber ?? "");
    }

    [Fact]
    public async Task TransfersController_Transfer_WithoutAuth_Returns401()
    {
        // Arrange
        var transferRequest = new TransferRequestDto
        {
            FromAccountId = Guid.NewGuid(),
            ToAccountNumber = "1234567890",
            Amount = 100,
            Description = "Test transfer"
        };

        // Act - No authorization header
        var response = await _client.PostAsJsonAsync("/api/transfers", transferRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TransfersController_Transfer_ValidRequest_Returns201AndDebitsBalance()
    {
        // Arrange - Create two users with accounts
        var (senderToken, senderId, senderAccountNumber) = 
            await CreateUserWithAccount("Sender User", "sender@example.com", 5000);
        var (_, receiverId, receiverAccountNumber) = 
            await CreateUserWithAccount("Receiver User", "receiver@example.com", 1000);

        // Get sender's account ID
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();
        var senderAccount = db.Accounts.First(a => a.AccountNumber == senderAccountNumber);
        var initialSenderBalance = senderAccount.Balance;

        var transferRequest = new TransferRequestDto
        {
            FromAccountId = senderAccount.Id,
            ToAccountNumber = receiverAccountNumber,
            Amount = 500,
            Description = "Test transfer"
        };

        // Set authorization header
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);

        // Act
        var response = await _client.PostAsJsonAsync("/api/transfers", transferRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(500, result.GetProperty("amount").GetDecimal());
        Assert.Equal("Completed", result.GetProperty("status").GetString());

        // Verify balance was debited
        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<BankingDbContext>();
        var updatedSenderAccount = await verifyDb.Accounts.FindAsync(senderAccount.Id);
        Assert.Equal(initialSenderBalance - 500, updatedSenderAccount!.Balance);
    }

    [Fact]
    public async Task TransfersController_Transfer_InsufficientBalance_Returns400()
    {
        // Arrange - Create two users with accounts
        var (senderToken, senderId, senderAccountNumber) = 
            await CreateUserWithAccount("Poor Sender", "poor.sender@example.com", 100);
        var (_, receiverId, receiverAccountNumber) = 
            await CreateUserWithAccount("Lucky Receiver", "lucky.receiver@example.com", 1000);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();
        var senderAccount = db.Accounts.First(a => a.AccountNumber == senderAccountNumber);

        var transferRequest = new TransferRequestDto
        {
            FromAccountId = senderAccount.Id,
            ToAccountNumber = receiverAccountNumber,
            Amount = 5000, // More than balance
            Description = "Test transfer"
        };

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);

        // Act
        var response = await _client.PostAsJsonAsync("/api/transfers", transferRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task TransfersController_Transfer_ToNonExistentAccount_Returns404()
    {
        // Arrange
        var (senderToken, senderId, senderAccountNumber) = 
            await CreateUserWithAccount("Sender", "sender2@example.com", 5000);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();
        var senderAccount = db.Accounts.First(a => a.AccountNumber == senderAccountNumber);

        var transferRequest = new TransferRequestDto
        {
            FromAccountId = senderAccount.Id,
            ToAccountNumber = "9999999999", // Non-existent
            Amount = 100,
            Description = "Test transfer"
        };

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", senderToken);

        // Act
        var response = await _client.PostAsJsonAsync("/api/transfers", transferRequest);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AccountsController_GetBalance_OwnAccount_Returns200()
    {
        // Arrange
        var (token, userId, accountNumber) = 
            await CreateUserWithAccount("Account Owner", "owner@example.com", 3000);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();
        var account = db.Accounts.First(a => a.AccountNumber == accountNumber);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/api/accounts/{account.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3000, result.GetProperty("balance").GetDecimal());
    }

    [Fact]
    public async Task AccountsController_GetBalance_OtherUsersAccount_Returns403()
    {
        // Arrange - Create two users
        var (user1Token, user1Id, user1AccountNumber) = 
            await CreateUserWithAccount("User One", "user1@example.com", 2000);
        var (user2Token, user2Id, user2AccountNumber) = 
            await CreateUserWithAccount("User Two", "user2@example.com", 3000);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();
        var user2Account = db.Accounts.First(a => a.AccountNumber == user2AccountNumber);

        // User 1 tries to access User 2's account
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user1Token);

        // Act
        var response = await _client.GetAsync($"/api/accounts/{user2Account.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AccountsController_GetAccounts_ReturnsOnlyUserAccounts()
    {
        // Arrange
        var (token, userId, accountNumber) = 
            await CreateUserWithAccount("Multi Account User", "multi@example.com", 5000);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/accounts");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        var accounts = result.EnumerateArray().ToList();
        
        // Should only return accounts belonging to this user
        Assert.All(accounts, account => 
        {
            var accountUserId = Guid.Parse(account.GetProperty("userId").GetString()!);
            Assert.Equal(userId, accountUserId);
        });
    }

    [Fact]
    public async Task AccountsController_CreateAccount_ValidRequest_Returns201()
    {
        // Arrange
        var (token, userId, _) = 
            await CreateUserWithAccount("New Account User", "newaccount@example.com", 1000);

        var createAccountRequest = new CreateAccountRequestDto
        {
            AccountType = "Checking",
            InitialDeposit = 500
        };

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PostAsJsonAsync("/api/accounts", createAccountRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Checking", result.GetProperty("accountType").GetString());
        Assert.Equal(500, result.GetProperty("balance").GetDecimal());
    }
}
