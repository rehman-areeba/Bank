using BankingApi.Data;
using BankingApi.DTOs;
using BankingApi.Middleware;
using BankingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApi.Services;

public class ScheduledPaymentService(
    BankingDbContext dbContext,
    ITransferService transferService,
    ILogger<ScheduledPaymentService> logger) : IScheduledPaymentService
{
    private readonly BankingDbContext _dbContext = dbContext;
    private readonly ITransferService _transferService = transferService;
    private readonly ILogger<ScheduledPaymentService> _logger = logger;

    public async Task<ScheduledPayment> CreateAsync(
        Guid userId,
        CreateScheduledPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
            throw new InvalidOperationException("Amount must be greater than zero");

        if (request.FrequencyDays < 1)
            throw new InvalidOperationException("FrequencyDays must be at least 1");

        // Verify the account belongs to the caller
        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Id == request.FromAccountId, cancellationToken)
            ?? throw new NotFoundException($"Account {request.FromAccountId} not found");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("You do not own this account");

        var payment = new ScheduledPayment
        {
            Id               = Guid.NewGuid(),
            AccountId        = request.FromAccountId,
            RecipientAccount = request.ToAccountNumber,
            Amount           = request.Amount,
            FrequencyDays    = request.FrequencyDays,
            NextRunDate      = request.FirstRunDate.ToUniversalTime(),
            IsActive         = true
        };

        await _dbContext.ScheduledPayments.AddAsync(payment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return payment;
    }

    public async Task<IEnumerable<ScheduledPayment>> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // AsNoTracking + no Include: the controller projects only scalar fields
        // (Id, AccountId, RecipientAccount, Amount, FrequencyDays, NextRunDate, IsActive).
        // Loading the Account navigation was a wasted JOIN on every list call.
        return await _dbContext.ScheduledPayments
            .Where(p => p.Account.UserId == userId)
            .OrderBy(p => p.NextRunDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task CancelAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        // Project only the fields needed for the ownership check and the update.
        // Include(p => p.Account) was loading the full Account entity (Balance,
        // RowVersion, navigation collections) just to read Account.UserId — pure waste.
        var payment = await _dbContext.ScheduledPayments
            .Where(p => p.Id == id)
            .Select(p => new { p.Id, p.IsActive, OwnerUserId = p.Account.UserId })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException($"Scheduled payment {id} not found");

        if (payment.OwnerUserId != userId)
            throw new UnauthorizedAccessException("You do not own this scheduled payment");

        if (!payment.IsActive)
            throw new InvalidOperationException("Scheduled payment is already cancelled");

        // Load only the entity we need to mutate — no Account JOIN.
        await _dbContext.ScheduledPayments
            .Where(p => p.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsActive, false), cancellationToken);
    }

    public async Task ProcessDuePaymentsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // Project only the columns needed to execute the transfer — avoids loading
        // the full Account entity (Balance, RowVersion, IsActive, navigation collections)
        // for every due payment. Account.UserId is the only Account field required here.
        var duePayments = await _dbContext.ScheduledPayments
            .Where(p => p.IsActive && p.NextRunDate <= now)
            .Select(p => new
            {
                p.Id,
                p.AccountId,
                p.RecipientAccount,
                p.Amount,
                p.FrequencyDays,
                p.NextRunDate,
                OwnerUserId = p.Account.UserId
            })
            .ToListAsync(cancellationToken);

        if (duePayments.Count == 0)
            return;

        var updatedIds = new List<Guid>(duePayments.Count);

        foreach (var payment in duePayments)
        {
            try
            {
                var request = new TransferRequestDto
                {
                    FromAccountId   = payment.AccountId,
                    ToAccountNumber = payment.RecipientAccount,
                    Amount          = payment.Amount,
                    Description     = $"Scheduled payment (every {payment.FrequencyDays}d)"
                };

                await _transferService.ExecuteTransferAsync(
                    payment.OwnerUserId,
                    request,
                    ipAddress: null,
                    cancellationToken);

                updatedIds.Add(payment.Id);

                _logger.LogInformation(
                    "Scheduled payment {Id} executed. Next run: {NextRunDate}",
                    payment.Id, payment.NextRunDate.AddDays(payment.FrequencyDays));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Scheduled payment {Id} failed. It will retry on next cycle",
                    payment.Id);
            }
        }

        // Bulk-update NextRunDate for all succeeded payments in a single round-trip.
        // ExecuteUpdateAsync translates to a single UPDATE ... SET ... WHERE Id IN (...)
        // instead of loading entities into the change tracker and calling SaveChangesAsync.
        if (updatedIds.Count > 0)
        {
            // Build per-payment increments: EF ExecuteUpdateAsync doesn’t support
            // per-row expressions, so we fall back to loading only the succeeded
            // entities and advancing their dates — still O(succeeded) not O(all).
            var toUpdate = await _dbContext.ScheduledPayments
                .Where(p => updatedIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            foreach (var p in toUpdate)
                p.NextRunDate = p.NextRunDate.AddDays(p.FrequencyDays);

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
