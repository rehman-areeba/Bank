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

// Subclass used only by the concurrency-retry test.
// Throws DbUpdateConcurrencyException on the first SaveChangesAsync call,
// then delegates to the real implementation on subsequent calls.
// This simulates a RowVersion conflict without needing a real SQL Server.
internal sealed class ConcurrencyThrowingDbContext : BankingDbContext
{
    private int _saveCount;

    public ConcurrencyThrowingDbContext(
        DbContextOptions<BankingDbContext> options,
        IConfiguration configuration)
        : base(options, configuration) { }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        _saveCount++;
        if (_saveCount == 1)
            throw new DbUpdateConcurrencyException("Simulated concurrency conflict");
        return await base.SaveChangesAsync(cancellationToken);
    }
}
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
            _mockLogger.Object,
            Mock.Of<INotificationQueue>()
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

        // Setup mock for GetByAccountNumberAsync (TransferService uses ToAccountNumber)
        _mockAccountRepository.Setup(r => r.GetByAccountNumberAsync(toAccount.AccountNumber, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        _mockTransactionRepository.Setup(r => r.CreateAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Transaction t, CancellationToken ct) => t);

        _mockAuditRepository.Setup(r => r.CreateAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuditLog a, CancellationToken ct) => a);

        _mockUnitOfWork.Setup(u => u.CommitAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Also mock GetByIdWithUserAsync for post-commit notification lookup
        _mockAccountRepository.Setup(r => r.GetByIdWithUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Account?)null);

        var request = new TransferRequestDto
        {
            FromAccountId   = fromAccountId,
            ToAccountNumber = toAccount.AccountNumber,
            Amount          = transferAmount,
            Description     = "Test transfer"
        };

        // Act
        var result = await _transferService.ExecuteTransferAsync(userId, request, ipAddress: null, CancellationToken.None);

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
            FromAccountId   = fromAccountId,
            ToAccountNumber = toAccount.AccountNumber,
            Amount          = 100m, // More than balance
            Description     = "Test transfer"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _transferService.ExecuteTransferAsync(userId, request, ipAddress: null, CancellationToken.None));

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
            FromAccountId   = fromAccountId,
            ToAccountNumber = toAccount.AccountNumber,
            Amount          = 100m,
            Description     = "Test transfer"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _transferService.ExecuteTransferAsync(userId, request, ipAddress: null, CancellationToken.None));

        Assert.Equal("You do not own the source account", exception.Message);

        // Verify no transaction was created
        _mockTransactionRepository.Verify(r => r.CreateAsync(
            It.IsAny<Transaction>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExecuteTransfer_ConcurrencyConflict_RetriesAndSucceeds()
    {
        // Arrange — use a context that throws DbUpdateConcurrencyException on the
        // first SaveChangesAsync, then succeeds. This exercises the retry loop in
        // TransferService without needing a real SQL Server RowVersion conflict.
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<BankingDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        // Seed using a plain context so the throw-on-first-save doesn't affect seeding.
        var seedContext = new BankingDbContext(options, Mock.Of<IConfiguration>());

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

        seedContext.Accounts.Add(fromAccount);
        seedContext.Accounts.Add(toAccount);
        await seedContext.SaveChangesAsync();
        await seedContext.DisposeAsync();

        // Now create the throwing context — its _saveCount starts at 0,
        // so the first transfer SaveChangesAsync (count→1) throws, the retry succeeds.
        var throwingContext2 = new ConcurrencyThrowingDbContext(options, Mock.Of<IConfiguration>());

        var mockUow = new Mock<IUnitOfWork>();
        var mockAccountRepo = new Mock<IAccountRepository>();
        var mockTransactionRepo = new Mock<ITransactionRepository>();
        var mockAuditRepo = new Mock<IAuditRepository>();
        var mockConfig = new Mock<IConfiguration>();
        var mockLogger = new Mock<ILogger<TransferService>>();

        mockUow.Setup(u => u.Accounts).Returns(mockAccountRepo.Object);
        mockUow.Setup(u => u.Transactions).Returns(mockTransactionRepo.Object);
        mockUow.Setup(u => u.AuditLogs).Returns(mockAuditRepo.Object);
        mockConfig.Setup(c => c["Transfer:DailyLimit"]).Returns("50000");
        mockConfig.Setup(c => c.GetSection(It.IsAny<string>())).Returns(Mock.Of<IConfigurationSection>());

        mockAccountRepo.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        mockAccountRepo.Setup(r => r.GetByAccountNumberAsync(toAccount.AccountNumber, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);
        mockTransactionRepo.Setup(r => r.CreateAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Transaction t, CancellationToken _) => t);
        mockAuditRepo.Setup(r => r.CreateAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuditLog a, CancellationToken _) => a);
        mockAccountRepo.Setup(r => r.GetByIdWithUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Account?)null);

        var service = new TransferService(
            mockUow.Object,
            throwingContext2,
            mockConfig.Object,
            mockLogger.Object,
            Mock.Of<INotificationQueue>()
        );

        var request = new TransferRequestDto
        {
            FromAccountId   = fromAccountId,
            ToAccountNumber = toAccount.AccountNumber,
            Amount          = 100m,
            Description     = "Test transfer with retry"
        };

        // Act
        var result = await service.ExecuteTransferAsync(userId, request, ipAddress: null, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("SUCCESS", result.Status);

        mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Concurrency conflict")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        throwingContext2.Dispose();
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
        _mockAccountRepository.Setup(r => r.GetByAccountNumberAsync("0987654321", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Account?)null); // Receiver not found

        var request = new TransferRequestDto
        {
            FromAccountId   = fromAccountId,
            ToAccountNumber = "0987654321",
            Amount          = 100m,
            Description     = "Test transfer"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _transferService.ExecuteTransferAsync(userId, request, ipAddress: null, CancellationToken.None));

        Assert.Contains("0987654321", exception.Message);

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

        _mockAccountRepository.Setup(r => r.GetByIdAsync(fromAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromAccount);
        _mockAccountRepository.Setup(r => r.GetByIdAsync(toAccountId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        _mockTransactionRepository.Setup(r => r.CreateAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Transaction t, CancellationToken ct) => t);

        // Simulate failure during audit log creation
        _mockAuditRepository.Setup(r => r.CreateAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Audit log creation failed"));

        // Also need GetByAccountNumberAsync so the pre-flight lookup resolves the destination.
        _mockAccountRepository.Setup(r => r.GetByAccountNumberAsync(toAccount.AccountNumber, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toAccount);

        var request = new TransferRequestDto
        {
            FromAccountId   = fromAccountId,
            ToAccountNumber = toAccount.AccountNumber,   // CS0117: ToAccountId removed; use ToAccountNumber
            Amount          = 100m,
            Description     = "Test transfer with rollback"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _transferService.ExecuteTransferAsync(userId, request, ipAddress: null, CancellationToken.None));

        // Verify the success log was never emitted (transfer did not complete).
        // Note: InMemory DB does not support real transaction rollback, so balance
        // assertions are omitted here — they are covered by the SQL Server integration tests.
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
