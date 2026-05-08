using BankingApi.Data;
using BankingApi.Models;

namespace BankingApi.Repositories;

public class AuditRepository(BankingDbContext context) : IAuditRepository
{
    private readonly BankingDbContext _context = context;

    public async Task<AuditLog> CreateAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
    {
        await _context.AuditLogs.AddAsync(auditLog, cancellationToken);
        return auditLog;
    }
}
