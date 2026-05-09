using BankingApi.Data;
using BankingApi.DTOs;
using BankingApi.Middleware;
using BankingApi.Models;
using BankingApi.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;

namespace BankingApi.Services;

public class TransferService(
    IUnitOfWork unitOfWork,
    BankingDbContext dbContext,
    IConfiguration configuration,
    ILogger<TransferService> logger) : ITransferService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly BankingDbContext _dbContext = dbContext;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<TransferService> _logger = logger;
    private const int MaxRetries = 3;

    public async Task<TransferResponseDto> ExecuteTransferAsync(
        Guid userId,
        TransferRequestDto request,
        CancellationToken cancellationToken = default)
    {
        // ── Step 1: Validate ──────────────────────────────────────────────────────
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

        var toAccount = await _unitOfWork.Accounts.GetByIdAsync(request.ToAccountId, cancellationToken)
            ?? throw new NotFoundException($"Destination account {request.ToAccountId} not found");

        if (!toAccount.IsActive)
            throw new InvalidOperationException("Destination account is not active");

        var dailyLimit = _configuration.GetValue<decimal>("Transfer:DailyLimit", 50000);
        var todayTotal = await GetTodayTransferTotalAsync(request.FromAccountId, cancellationToken);

        if (todayTotal + request.Amount > dailyLimit)
            throw new InvalidOperationException($"Daily transfer limit of {dailyLimit:C} exceeded");

        // ── Step 2-10: Execute Transfer with Retry Logic ──────────────────────────
        var retryCount = 0;
        while (retryCount < MaxRetries)
        {
            try
            {
                return await ExecuteTransferWithTransactionAsync(
                    userId,
                    request,
                    fromAccount,
                    toAccount,
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

                // Reload entities from database
                await _dbContext.Entry(fromAccount).ReloadAsync(cancellationToken);
                await _dbContext.Entry(toAccount).ReloadAsync(cancellationToken);

                // Re-validate balance after reload
                if (fromAccount.Balance < request.Amount)
                    throw new InvalidOperationException("Insufficient balance after reload");

                await Task.Delay(100 * retryCount, cancellationToken); // Exponential backoff
            }
        }

        throw new InvalidOperationException("Transfer failed unexpectedly");
    }

    private async Task<TransferResponseDto> ExecuteTransferWithTransactionAsync(
        Guid userId,
        TransferRequestDto request,
        Account fromAccount,
        Account toAccount,
        CancellationToken cancellationToken)
    {
        // ── Step 2: Begin Database Transaction ────────────────────────────────────
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            // ── Step 3: Pessimistic Lock (UPDLOCK, ROWLOCK) ───────────────────────
            var lockedFromAccount = await _dbContext.Accounts
                .FromSqlRaw("SELECT * FROM Accounts WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", request.FromAccountId)
                .FirstOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException($"Source account {request.FromAccountId} not found");

            var lockedToAccount = await _dbContext.Accounts
                .FromSqlRaw("SELECT * FROM Accounts WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}", request.ToAccountId)
                .FirstOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException($"Destination account {request.ToAccountId} not found");

            // ── Step 4: Re-check Balance (TOCTOU Prevention) ──────────────────────
            if (lockedFromAccount.Balance < request.Amount)
                throw new InvalidOperationException("Insufficient balance (verified in transaction)");

            // ── Step 5: Debit Sender ──────────────────────────────────────────────
            lockedFromAccount.Balance -= request.Amount;

            // ── Step 6: Credit Receiver ───────────────────────────────────────────
            lockedToAccount.Balance += request.Amount;

            // ── Step 7: Create Transaction Record ─────────────────────────────────
            var transactionId = Guid.NewGuid();
            var transactionRecord = new Transaction
            {
                Id = transactionId,
                FromAccountId = request.FromAccountId,
                ToAccountId = request.ToAccountId,
                Amount = request.Amount,
                Type = "Transfer",
                Status = "PENDING",
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Transactions.CreateAsync(transactionRecord, cancellationToken);

            // ── Step 8: Create AuditLog Entry ─────────────────────────────────────
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TransactionId = transactionId,
                Action = "TRANSFER",
                Amount = request.Amount,
                Status = "SUCCESS",
                IpAddress = null, // Set from HttpContext in controller
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.AuditLogs.CreateAsync(auditLog, cancellationToken);

            // Update transaction status to SUCCESS
            transactionRecord.Status = "SUCCESS";

            // ── Step 9: SaveChangesAsync (EF detects RowVersion conflict) ─────────
            await _dbContext.SaveChangesAsync(cancellationToken);

            // ── Step 10: Commit Transaction ───────────────────────────────────────
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Transfer completed: {TransactionId}, From: {FromAccountId}, To: {ToAccountId}, Amount: {Amount}",
                transactionId, request.FromAccountId, request.ToAccountId, request.Amount);

            // ── Step 11: Fire-and-Forget Notification ─────────────────────────────
            _ = Task.Run(async () =>
            {
                try
                {
                    await SendTransferNotificationAsync(userId, transactionId, request.Amount);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send transfer notification for transaction {TransactionId}", transactionId);
                }
            }, CancellationToken.None);

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
            // Automatic rollback on any exception
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<decimal> GetTodayTransferTotalAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var transactions = await _dbContext.Transactions
            .Where(t => t.FromAccountId == accountId
                     && t.Type == "Transfer"
                     && t.Status == "SUCCESS"
                     && t.CreatedAt >= today
                     && t.CreatedAt < tomorrow)
            .ToListAsync(cancellationToken);

        return transactions.Sum(t => t.Amount);
    }

    private async Task SendTransferNotificationAsync(Guid userId, Guid transactionId, decimal amount)
    {
        // Placeholder for notification logic (email, SMS, push notification, etc.)
        await Task.Delay(100); // Simulate async notification
        _logger.LogInformation(
            "Notification sent for user {UserId}, transaction {TransactionId}, amount {Amount}",
            userId, transactionId, amount);
    }
}
