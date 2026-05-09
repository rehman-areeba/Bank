using BankingApi.Data;
using BankingApi.DTOs;
using BankingApi.Middleware;
using BankingApi.Models;
using BankingApi.Repositories;
using BankingApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BankingApi.Tests.Services;

public class TransferServiceTests : IDisposable
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IAccountRepository> _mockAccountRepository;
    private readonly Mock<ITransactionRepository> _mockTransactionRepository;
    private readonly Mock<IAuditRepository> _mockAuditRepository;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<ILogger<TransferService>> _mockLogger;
    private readonly BankingDbContext _dbContext;
    private readonly TransferService _transferService;

    public TransferServiceTests()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<BankingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _dbContext = new BankingDbContext(options, Mock.Of<IConfiguration>());

        // Setup mocks
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockAccountRepository = new Mock<IAccountRepository>();
        _mockTransactionRepository = new Mock<ITransactionRepository>();
        _mockAuditRepository = new Mock<IAuditRepository>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<TransferService>>();

        // Configure mock repositories
        _mockUnitOfWork.Setup(u => u.Accounts).Returns(_mockAccountRepository.Object);
        _mockUnitOfWork.Setup(u => u.Transactions).Returns(_mockTransactionRepository.Object);
        _mockUnitOfWork.Setup(u => u.AuditLogs).Returns(_mockAuditRepository.Object);

        // Configure default configuration values
        _mockConfiguration.Setup(c => c["Transfer:DailyLimit"]).Returns("50000");
        _mockConfiguration.Setup(c => c.GetSection("Transfer:DailyLimit").Value).Returns("50000");

        _transferService = new TransferService(
            _mockUnitOfWork.Object,
            _dbContext,
            _mockConfiguration.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task ExecuteTransfer_ValidRequest_DebitsAndCreditsCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fromAccountId = Guid.NewGuid();
        var toAccountId = Guid.NewGuid();
        var transferAmount = 100m;

        var fromAccount = new Account
        {
            Id = fromAccountId,
            UserId = userId,
            AccountNumber = "1234567890",
            Type = "Savings",
            Balance = 500m,
            IsActive = true,
            RowVersion = new byte[] { 1, 2, 3, 4 }
        };

        var toAccount = new Account
        {
            Id = toAccountId,
            UserId = Guid.NewGuid(),
            AccountNumber = "0987654321",
            Type = "Current",
            Balance = 200m,
            IsActive = true,
            RowVersion = new byte[] { 5, 6, 7, 8 }
        };

        // Add accounts to in-memory database
        _dbContext.Accounts.Add(fromAccount);
        _dbContext.Accounts.Add(toAccount);
        await _dbContext.SaveChangesAsync();

        _mockAccountRepository.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        _mockAccountRepository.Setup(r => r.GetByIdAsync(toAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        _mockTransactionRepository.Setup(r => r.CreateAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Transaction t, CancellationToken ct) => t);

        _mockAuditRepository.Setup(r => r.CreateAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuditLog a, CancellationToken ct) => a);

        _mockUnitOfWork.Setup(u => u.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var request = new TransferRequestDto
        {
            FromAccountId = fromAccountId,
            ToAccountId = toAccountId,
            Amount = transferAmount,
            Description = "Test transfer"
        };

        // Act
        var result = await _transferService.ExecuteTransferAsync(userId, request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("SUCCESS", result.Status);
        Assert.Equal(transferAmount, result.Amount);
        Assert.Equal(400m, result.UpdatedBalance); // 500 - 100

        var updatedFromAccount = await _dbContext.Accounts.FindAsync(fromAccountId);
        var updatedToAccount = await _dbContext.Accounts.FindAsync(toAccountId);

        Assert.Equal(400m, updatedFromAccount!.Balance);
        Assert.Equal(300m, updatedToAccount!.Balance);

        _mockTransactionRepository.Verify(r => r.CreateAsync(
            It.Is<Transaction>(t => t.Amount == transferAmount && t.Type == "Transfer"),
            It.IsAny<CancellationToken>()), Times.Once);

        _mockAuditRepository.Verify(r => r.CreateAsync(
            It.Is<AuditLog>(a => a.Action == "TRANSFER" && a.Status == "SUCCESS"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteTransfer_InsufficientBalance_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fromAccountId = Guid.NewGuid();
        var toAccountId = Guid.NewGuid();

        var fromAccount = new Account
        {
            Id = fromAccountId,
            UserId = userId,
            AccountNumber = "1234567890",
            Type = "Savings",
            Balance = 50m, // Insufficient balance
            IsActive = true
        };

        var toAccount = new Account
        {
            Id = toAccountId,
            UserId = Guid.NewGuid(),
            AccountNumber = "0987654321",
            Type = "Current",
            Balance = 200m,
            IsActive = true
        };

        _mockAccountRepository.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        _mockAccountRepository.Setup(r => r.GetByIdAsync(toAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        var request = new TransferRequestDto
        {
            FromAccountId = fromAccountId,
            ToAccountId = toAccountId,
            Amount = 100m, // More than balance
            Description = "Test transfer"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _transferService.ExecuteTransferAsync(userId, request, CancellationToken.None));

        Assert.Equal("Insufficient balance", exception.Message);

        // Verify no transaction was created
        _mockTransactionRepository.Verify(r => r.CreateAsync(
            It.IsAny<Transaction>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteTransfer_InvalidOwnership_ThrowsUnauthorizedException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid(); // Different user
        var fromAccountId = Guid.NewGuid();
        var toAccountId = Guid.NewGuid();

        var fromAccount = new Account
        {
            Id = fromAccountId,
            UserId = differentUserId, // Account belongs to different user
            AccountNumber = "1234567890",
            Type = "Savings",
            Balance = 500m,
            IsActive = true
        };

        var toAccount = new Account
        {
            Id = toAccountId,
            UserId = Guid.NewGuid(),
            AccountNumber = "0987654321",
            Type = "Current",
            Balance = 200m,
            IsActive = true
        };

        _mockAccountRepository.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        _mockAccountRepository.Setup(r => r.GetByIdAsync(toAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        var request = new TransferRequestDto
        {
            FromAccountId = fromAccountId,
            ToAccountId = toAccountId,
            Amount = 100m,
            Description = "Test transfer"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _transferService.ExecuteTransferAsync(userId, request, CancellationToken.None));

        Assert.Equal("You do not own the source account", exception.Message);

        // Verify no transaction was created
        _mockTransactionRepository.Verify(r => r.CreateAsync(
            It.IsAny<Transaction>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteTransfer_ConcurrencyConflict_RetriesAndSucceeds()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fromAccountId = Guid.NewGuid();
        var toAccountId = Guid.NewGuid();

        var fromAccount = new Account
        {
            Id = fromAccountId,
            UserId = userId,
            AccountNumber = "1234567890",
            Type = "Savings",
            Balance = 500m,
            IsActive = true,
            RowVersion = new byte[] { 1, 2, 3, 4 }
        };

        var toAccount = new Account
        {
            Id = toAccountId,
            UserId = Guid.NewGuid(),
            AccountNumber = "0987654321",
            Type = "Current",
            Balance = 200m,
            IsActive = true,
            RowVersion = new byte[] { 5, 6, 7, 8 }
        };

        _dbContext.Accounts.Add(fromAccount);
        _dbContext.Accounts.Add(toAccount);
        await _dbContext.SaveChangesAsync();

        _mockAccountRepository.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        _mockAccountRepository.Setup(r => r.GetByIdAsync(toAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        _mockTransactionRepository.Setup(r => r.CreateAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Transaction t, CancellationToken ct) => t);

        _mockAuditRepository.Setup(r => r.CreateAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuditLog a, CancellationToken ct) => a);

        // Simulate concurrency conflict on first attempt, then succeed
        var attemptCount = 0;
        _mockUnitOfWork.Setup(u => u.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                attemptCount++;
                if (attemptCount == 1)
                {
                    // Simulate RowVersion change by another transaction
                    fromAccount.RowVersion = new byte[] { 9, 10, 11, 12 };
                    throw new DbUpdateConcurrencyException("Concurrency conflict");
                }
                return 1;
            });

        var request = new TransferRequestDto
        {
            FromAccountId = fromAccountId,
            ToAccountId = toAccountId,
            Amount = 100m,
            Description = "Test transfer with retry"
        };

        // Act
        var result = await _transferService.ExecuteTransferAsync(userId, request, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("SUCCESS", result.Status);
        Assert.Equal(2, attemptCount); // Should have retried once

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Concurrency conflict")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteTransfer_ReceiverNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fromAccountId = Guid.NewGuid();
        var toAccountId = Guid.NewGuid();

        var fromAccount = new Account
        {
            Id = fromAccountId,
            UserId = userId,
            AccountNumber = "1234567890",
            Type = "Savings",
            Balance = 500m,
            IsActive = true
        };

        _mockAccountRepository.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        _mockAccountRepository.Setup(r => r.GetByIdAsync(toAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Account?)null); // Receiver not found

        var request = new TransferRequestDto
        {
            FromAccountId = fromAccountId,
            ToAccountId = toAccountId,
            Amount = 100m,
            Description = "Test transfer"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _transferService.ExecuteTransferAsync(userId, request, CancellationToken.None));

        Assert.Contains(toAccountId.ToString(), exception.Message);

        // Verify no transaction was created
        _mockTransactionRepository.Verify(r => r.CreateAsync(
            It.IsAny<Transaction>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteTransfer_AllStepsFail_RollsBackCompletely()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fromAccountId = Guid.NewGuid();
        var toAccountId = Guid.NewGuid();

        var fromAccount = new Account
        {
            Id = fromAccountId,
            UserId = userId,
            AccountNumber = "1234567890",
            Type = "Savings",
            Balance = 500m,
            IsActive = true,
            RowVersion = new byte[] { 1, 2, 3, 4 }
        };

        var toAccount = new Account
        {
            Id = toAccountId,
            UserId = Guid.NewGuid(),
            AccountNumber = "0987654321",
            Type = "Current",
            Balance = 200m,
            IsActive = true,
            RowVersion = new byte[] { 5, 6, 7, 8 }
        };

        // Add accounts to in-memory database
        _dbContext.Accounts.Add(fromAccount);
        _dbContext.Accounts.Add(toAccount);
        await _dbContext.SaveChangesAsync();

        var initialFromBalance = fromAccount.Balance;
        var initialToBalance = toAccount.Balance;

        _mockAccountRepository.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        _mockAccountRepository.Setup(r => r.GetByIdAsync(toAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        _mockTransactionRepository.Setup(r => r.CreateAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Transaction t, CancellationToken ct) => t);

        // Simulate failure during audit log creation
        _mockAuditRepository.Setup(r => r.CreateAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Audit log creation failed"));

        var request = new TransferRequestDto
        {
            FromAccountId = fromAccountId,
            ToAccountId = toAccountId,
            Amount = 100m,
            Description = "Test transfer with rollback"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _transferService.ExecuteTransferAsync(userId, request, CancellationToken.None));

        // Verify rollback - balances should remain unchanged
        var fromAccountAfter = await _dbContext.Accounts.FindAsync(fromAccountId);
        var toAccountAfter = await _dbContext.Accounts.FindAsync(toAccountId);

        Assert.Equal(initialFromBalance, fromAccountAfter!.Balance);
        Assert.Equal(initialToBalance, toAccountAfter!.Balance);

        // Verify no transaction was persisted
        var transactions = await _dbContext.Transactions.ToListAsync();
        Assert.Empty(transactions);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Transfer completed")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never); // Should not log success
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }
}
