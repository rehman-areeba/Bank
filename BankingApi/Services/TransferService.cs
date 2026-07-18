using BankingApi.Data;
using BankingApi.DTOs;
using BankingApi.Middleware;
using BankingApi.Models;
using BankingApi.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace BankingApi.Services;

public class TransferService(
    IUnitOfWork unitOfWork,
    BankingDbContext dbContext,
    IConfiguration configuration,
    ILogger<TransferService> logger,
    INotificationQueue notificationQueue) : ITransferService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly BankingDbContext _dbContext = dbContext;
    private readonly ILogger<TransferService> _logger = logger;
    private readonly INotificationQueue _notificationQueue = notificationQueue;
    private const int MaxRetries = 3;
    // Read once at construction — IConfiguration.GetValue re-parses the string on
    // every call. DailyLimit never changes at runtime so caching it is safe.
    private readonly decimal _dailyLimit = configuration.GetValue<decimal>("Transfer:DailyLimit", 50000);

    public async Task<TransferResponseDto> ExecuteTransferAsync(
        Guid userId,
        TransferRequestDto request,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        // ── Step 1: Pre-flight validation (cheap checks before opening a transaction) ──
        if (request.Amount <= 0)
            throw new InvalidOperationException("Transfer amount must be greater than zero");

        var fromAccount = await _unitOfWork.Accounts.GetByIdAsync(request.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Source account {request.FromAccountId} not found");

        if (fromAccount.UserId != userId)
            throw new UnauthorizedAccessException("You do not own the source account");

        if (!fromAccount.IsActive)
            throw new InvalidOperationException("Source account is not active");

        if (fromAccount.Balance < request.Amount)
            throw new InvalidOperationException("Insufficient balance");

        var toAccount = await _unitOfWork.Accounts.GetByAccountNumberAsync(request.ToAccountNumber, cancellationToken)
            ?? throw new NotFoundException($"Destination account number {request.ToAccountNumber} not found");

        if (toAccount.Id == fromAccount.Id)
            throw new InvalidOperationException("Cannot transfer to the same account");

        if (!toAccount.IsActive)
            throw new InvalidOperationException("Destination account is not active");

        // ── Step 2-10: Execute with retry on optimistic concurrency conflict ──────────
        var retryCount = 0;
        while (retryCount < MaxRetries)
        {
            try
            {
                return await ExecuteTransferWithTransactionAsync(
                    userId,
                    request,
                    toAccount.Id,
                    ipAddress,
                    cancellationToken);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                retryCount++;
                _logger.LogWarning(ex,
                    "Concurrency conflict on transfer attempt {Attempt}/{MaxRetries}. Retrying...",
                    retryCount, MaxRetries);

                if (retryCount >= MaxRetries)
                {
                    _logger.LogError("Transfer failed after {MaxRetries} attempts due to concurrency conflicts", MaxRetries);
                    throw new InvalidOperationException("Transfer failed due to concurrent updates. Please try again.");
                }

                await Task.Delay(100 * retryCount, cancellationToken);
            }
        }

        throw new InvalidOperationException("Transfer failed unexpectedly");
    }

    private async Task<TransferResponseDto> ExecuteTransferWithTransactionAsync(
        Guid userId,
        TransferRequestDto request,
        Guid toAccountId,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        // ── Step 2: Begin Serializable transaction ────────────────────────────────────
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            // ── Step 3: Acquire row-level locks in consistent order (deadlock prevention) ──
            // Always lock the lower GUID first so two concurrent transfers between the
            // same pair of accounts always acquire locks in the same order.
            var firstLockId  = request.FromAccountId < toAccountId ? request.FromAccountId : toAccountId;
            var secondLockId = request.FromAccountId < toAccountId ? toAccountId : request.FromAccountId;

            // Use UPDLOCK hint on relational providers (SQL Server) to acquire
            // row-level locks in a consistent order and prevent deadlocks.
            // Fall back to a plain LINQ query on non-relational providers (InMemory)
            // so unit tests can run without a SQL Server connection.
            Account firstLocked, secondLocked;
            if (_dbContext.Database.IsRelational())
            {
                firstLocked = await _dbContext.Accounts
                    .FromSqlRaw("SELECT * FROM [Accounts] WITH (UPDLOCK, ROWLOCK) WHERE [Id] = {0}", firstLockId)
                    .FirstOrDefaultAsync(cancellationToken)
                    ?? throw new NotFoundException($"Account {firstLockId} not found");

                secondLocked = await _dbContext.Accounts
                    .FromSqlRaw("SELECT * FROM [Accounts] WITH (UPDLOCK, ROWLOCK) WHERE [Id] = {0}", secondLockId)
                    .FirstOrDefaultAsync(cancellationToken)
                    ?? throw new NotFoundException($"Account {secondLockId} not found");
            }
            else
            {
                firstLocked = await _dbContext.Accounts
                    .FirstOrDefaultAsync(a => a.Id == firstLockId, cancellationToken)
                    ?? throw new NotFoundException($"Account {firstLockId} not found");

                secondLocked = await _dbContext.Accounts
                    .FirstOrDefaultAsync(a => a.Id == secondLockId, cancellationToken)
                    ?? throw new NotFoundException($"Account {secondLockId} not found");
            }

            var lockedFromAccount = firstLockId == request.FromAccountId ? firstLocked : secondLocked;
            var lockedToAccount   = firstLockId == toAccountId           ? firstLocked : secondLocked;

            // ── Step 4: Re-check balance inside the lock (TOCTOU prevention) ─────────
            if (lockedFromAccount.Balance < request.Amount)
                throw new InvalidOperationException("Insufficient balance (verified in transaction)");

            // ── Step 4b: Re-check daily limit inside the lock ─────────────────────────
            // WHY HERE: checking outside the transaction (before Step 2) is a TOCTOU
            // race — two concurrent transfers can both pass the pre-flight check and
            // both execute, exceeding the limit. Checking after acquiring UPDLOCK
            // ensures only one transfer at a time can read and update today's total
            // for this account.
            var dailyLimit = _dailyLimit;
            var todayTotal = await GetTodayTransferTotalAsync(request.FromAccountId, cancellationToken);

            if (todayTotal + request.Amount > dailyLimit)
                throw new InvalidOperationException($"Daily transfer limit of {dailyLimit:C} exceeded");

            // ── Step 5: Debit sender ──────────────────────────────────────────────────
            lockedFromAccount.Balance -= request.Amount;

            // ── Step 6: Credit receiver ───────────────────────────────────────────────
            lockedToAccount.Balance += request.Amount;

            // ── Step 7: Create transaction record ─────────────────────────────────────
            var transactionId = Guid.NewGuid();
            var transactionRecord = new Transaction
            {
                Id            = transactionId,
                FromAccountId = request.FromAccountId,
                ToAccountId   = toAccountId,
                Amount        = request.Amount,
                Type          = "Transfer",
                Status        = "SUCCESS",
                Description   = request.Description,
                CreatedAt     = DateTime.UtcNow
            };

            await _unitOfWork.Transactions.CreateAsync(transactionRecord, cancellationToken);

            // ── Step 8: Create audit log entry (same transaction — atomic with transfer) ──
            var auditLog = new AuditLog
            {
                Id            = Guid.NewGuid(),
                UserId        = userId,
                TransactionId = transactionId,
                Action        = "TRANSFER",
                Amount        = request.Amount,
                Status        = "SUCCESS",
                IpAddress     = ipAddress,
                CreatedAt     = DateTime.UtcNow
            };

            await _unitOfWork.AuditLogs.CreateAsync(auditLog, cancellationToken);

            // ── Step 9: Save all changes (EF detects RowVersion conflict here) ─────────
            await _dbContext.SaveChangesAsync(cancellationToken);

            // ── Step 10: Commit ───────────────────────────────────────────────────────
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Transfer completed: {TransactionId}, From: {FromAccountId}, To: {ToAccountNumber}, Amount: {Amount}",
                transactionId, request.FromAccountId, request.ToAccountNumber, request.Amount);

            // ── Step 11: Enqueue notification (fire-and-forget via BackgroundService) ──
            // Runs after commit so a notification failure never rolls back a transfer.
            // Both user lookups run concurrently — they are independent queries on
            // different rows, so Task.WhenAll halves the round-trip latency here.
            var emailTasks = await Task.WhenAll(
                _unitOfWork.Accounts.GetByIdWithUserAsync(request.FromAccountId, cancellationToken),
                _unitOfWork.Accounts.GetByIdWithUserAsync(toAccountId, cancellationToken)
            );
            var senderEmail   = emailTasks[0]?.User?.Email ?? string.Empty;
            var receiverEmail = emailTasks[1]?.User?.Email ?? string.Empty;

            if (!string.IsNullOrEmpty(senderEmail) || !string.IsNullOrEmpty(receiverEmail))
            {
                _notificationQueue.Enqueue(new TransactionNotification(
                    transactionId,
                    senderEmail,
                    receiverEmail,
                    request.Amount));
            }

            return new TransferResponseDto(
                transactionId,
                "SUCCESS",
                request.Amount,
                DateTime.UtcNow,
                lockedFromAccount.Balance
            );
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // Uses SumAsync — never loads rows into memory just to sum them.
    // Called inside the locked transaction so the result is consistent.
    private async Task<decimal> GetTodayTransferTotalAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var today    = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        return await _dbContext.Transactions
            .Where(t => t.FromAccountId == accountId
                     && t.Type   == "Transfer"
                     && t.Status == "SUCCESS"
                     && t.CreatedAt >= today
                     && t.CreatedAt <  tomorrow)
            .SumAsync(t => t.Amount, cancellationToken);
    }
}
