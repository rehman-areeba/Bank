using BankingApi.Models;

namespace BankingApi.Services;

public interface IScheduledPaymentService
{
    Task<ScheduledPayment> CreateAsync(Guid userId, CreateScheduledPaymentRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScheduledPayment>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task CancelAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task ProcessDuePaymentsAsync(CancellationToken cancellationToken = default);
}

public record CreateScheduledPaymentRequest(
    Guid FromAccountId,
    string ToAccountNumber,
    decimal Amount,
    int FrequencyDays,
    DateTime FirstRunDate);
