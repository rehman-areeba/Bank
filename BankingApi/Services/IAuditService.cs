using BankingApi.Models;

namespace BankingApi.Services;

public interface IAuditService
{
    Task LogAsync(AuditLog entry, CancellationToken cancellationToken = default);
    Task<(IEnumerable<AuditLog> Items, int TotalCount)> GetByUserIdAsync(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<IEnumerable<AuditLog>> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default);
    Task<IEnumerable<object>> GetFailedLoginsAsync(int hours, CancellationToken cancellationToken = default);
}
