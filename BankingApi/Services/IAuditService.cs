using BankingApi.Models;

namespace BankingApi.Services;

public interface IAuditService
{
    Task LogAsync(AuditLog entry, CancellationToken cancellationToken = default);
    Task<(IEnumerable<AuditLog> Items, int TotalCount)> GetByUserIdAsync(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<IEnumerable<AuditLog>> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<AuditLog> Items, int TotalCount)> GetAllAsync(
        int pageNumber,
        int pageSize,
        string? action = null,
        string? status = null,
        string? userEmail = null,
        DateTime? from = null,
        DateTime? to = null,
        string sortBy = "createdAt",
        bool descending = true,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<object>> GetFailedLoginsAsync(int hours, CancellationToken cancellationToken = default);
}
