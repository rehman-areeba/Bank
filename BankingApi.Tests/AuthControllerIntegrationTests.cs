using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BankingApi.Data;
using BankingApi.DTOs;
using BankingApi.Models;
using Microsoft.Extensions.DependencyInjection;

namespace BankingApi.Tests;

public class AuthControllerIntegrationTests : IClassFixture<BankingApiFactory>
{
    private readonly HttpClient _client;
    private readonly BankingApiFactory _factory;

    public AuthControllerIntegrationTests(BankingApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AuthController_Register_ReturnsJwtToken()
    {
        // Arrange
        var registerRequest = new RegisterRequestDto
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "Test@1234",
            ConfirmPassword = "Test@1234"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(result);
        Assert.NotNull(result.Token);
        Assert.NotEmpty(result.Token);
        Assert.Equal("John Doe", result.FullName);
        Assert.Equal("Customer", result.Role);
        Assert.NotEqual(Guid.Empty, result.UserId);
    }

    [Fact]
    public async Task AuthController_Register_DuplicateEmail_Returns400()
    {
        // Arrange
        var registerRequest = new RegisterRequestDto
        {
            FullName = "Jane Smith",
            Email = "duplicate@example.com",
            Password = "Test@1234",
            ConfirmPassword = "Test@1234"
        };

        // Register first time
        await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        // Act - Try to register again with same email
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AuthController_Login_ValidCredentials_ReturnsJwtToken()
    {
        // Arrange - First register a user
        var registerRequest = new RegisterRequestDto
        {
            FullName = "Login Test User",
            Email = "login.test@example.com",
            Password = "Test@1234",
            ConfirmPassword = "Test@1234"
        };
        await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        var loginRequest = new LoginRequestDto
        {
            Email = "login.test@example.com",
            Password = "Test@1234"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(result);
        Assert.NotNull(result.Token);
        Assert.NotEmpty(result.Token);
        Assert.Equal("Login Test User", result.FullName);
    }

    [Fact]
    public async Task AuthController_Login_InvalidPassword_Returns401()
    {
        // Arrange - First register a user
        var registerRequest = new RegisterRequestDto
        {
            FullName = "Invalid Password User",
            Email = "invalid.password@example.com",
            Password = "Test@1234",
            ConfirmPassword = "Test@1234"
        };
        await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

        var loginRequest = new LoginRequestDto
        {
            Email = "invalid.password@example.com",
            Password = "WrongPassword@123"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthController_Login_NonExistentUser_Returns401()
    {
        // Arrange
        var loginRequest = new LoginRequestDto
        {
            Email = "nonexistent@example.com",
            Password = "Test@1234"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuthController_GetMe_WithValidToken_ReturnsUserInfo()
    {
        // Arrange - Register and login
        var registerRequest = new RegisterRequestDto
        {
            FullName = "GetMe Test User",
            Email = "getme.test@example.com",
            Password = "Test@1234",
            ConfirmPassword = "Test@1234"
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
        var authResult = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Add token to request
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authResult!.Token);

        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("GetMe Test User", result.GetProperty("fullName").GetString());
        Assert.Equal("getme.test@example.com", result.GetProperty("email").GetString());
    }

    [Fact]
    public async Task AuthController_GetMe_WithoutToken_Returns401()
    {
        // Arrange - No token

        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
