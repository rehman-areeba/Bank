using BankingApi.Models;

namespace BankingApi.Repositories;

public interface IAuditRepository
{
    Task<AuditLog> CreateAsync(AuditLog auditLog, CancellationToken cancellationToken = default);
}
