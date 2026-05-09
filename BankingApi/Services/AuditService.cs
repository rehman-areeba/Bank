using BankingApi.Data;
using BankingApi.Models;
using BankingApi.Repositories;
using Microsoft.EntityFrameworkCore;

namespace BankingApi.Services;

public class AuditService(IUnitOfWork unitOfWork, BankingDbContext dbContext) : IAuditService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly BankingDbContext _dbContext = dbContext;

    public async Task LogAsync(AuditLog entry, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.AuditLogs.CreateAsync(entry, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task<(IEnumerable<AuditLog> Items, int TotalCount)> GetByUserIdAsync(
        Guid userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _dbContext.AuditLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(a => a.User)
            .Include(a => a.Transaction)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IEnumerable<AuditLog>> GetByTransactionIdAsync(
        Guid transactionId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.AuditLogs
            .Where(a => a.TransactionId == transactionId)
            .Include(a => a.User)
            .Include(a => a.Transaction)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<object>> GetFailedLoginsAsync(
        int hours,
        CancellationToken cancellationToken = default)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-hours);

        var failedLogins = await _dbContext.AuditLogs
            .Where(a => a.Action == "LOGIN"
                     && a.Status == "FAILED"
                     && a.CreatedAt >= cutoffTime)
            .Include(a => a.User)
            .GroupBy(a => a.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                User = g.First().User,
                FailedAttempts = g.Count(),
                LastAttempt = g.Max(a => a.CreatedAt),
                IpAddresses = g.Select(a => a.IpAddress).Distinct().ToList()
            })
            .Where(x => x.FailedAttempts >= 5)
            .OrderByDescending(x => x.FailedAttempts)
            .ToListAsync(cancellationToken);

        return failedLogins.Select(f => new
        {
            f.UserId,
            Email = f.User?.Email,
            FullName = f.User?.FullName,
            f.FailedAttempts,
            f.LastAttempt,
            f.IpAddresses,
            RiskLevel = f.FailedAttempts switch
            {
                >= 10 => "CRITICAL",
                >= 7 => "HIGH",
                _ => "MEDIUM"
            }
        });
    }
}
