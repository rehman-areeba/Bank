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

        // CountAsync before Include — avoids JOIN overhead in the COUNT query.
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(a => a.User)
            .Include(a => a.Transaction)
            .AsNoTracking()
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
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<AuditLog> Items, int TotalCount)> GetAllAsync(
        int pageNumber,
        int pageSize,
        string? action = null,
        string? status = null,
        string? userEmail = null,
        DateTime? from = null,
        DateTime? to = null,
        string sortBy = "createdAt",
        bool descending = true,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 50;

        // Build the base filter query WITHOUT includes so CountAsync runs a
        // lean SELECT COUNT(*) with no JOIN overhead.
        var baseQuery = _dbContext.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(action))
            baseQuery = baseQuery.Where(a => a.Action == action.ToUpperInvariant());

        if (!string.IsNullOrWhiteSpace(status))
            baseQuery = baseQuery.Where(a => a.Status == status.ToUpperInvariant());

        if (!string.IsNullOrWhiteSpace(userEmail))
            baseQuery = baseQuery.Where(a => a.User != null && a.User.Email == userEmail);

        if (from.HasValue)
            baseQuery = baseQuery.Where(a => a.CreatedAt >= from.Value.ToUniversalTime());

        if (to.HasValue)
            baseQuery = baseQuery.Where(a => a.CreatedAt <= to.Value.ToUniversalTime());

        // CountAsync on the lean query — no User/Transaction JOIN.
        var totalCount = await baseQuery.CountAsync(cancellationToken);

        // Now apply sort + includes only for the page fetch.
        var query = baseQuery
            .Include(a => a.User)
            .Include(a => a.Transaction)
            .AsQueryable();

        query = sortBy.ToLowerInvariant() switch
        {
            "action"  => descending ? query.OrderByDescending(a => a.Action)  : query.OrderBy(a => a.Action),
            "amount"  => descending ? query.OrderByDescending(a => a.Amount)  : query.OrderBy(a => a.Amount),
            "status"  => descending ? query.OrderByDescending(a => a.Status)  : query.OrderBy(a => a.Status),
            _         => descending ? query.OrderByDescending(a => a.CreatedAt) : query.OrderBy(a => a.CreatedAt)
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<object>> GetFailedLoginsAsync(
        int hours,
        CancellationToken cancellationToken = default)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-hours);

        // Project User.Email/FullName inside the GroupBy so EF generates a single
        // JOIN query rather than loading AuditLog entities and then doing a
        // client-side Include. GroupBy + Include is not translatable in EF Core.
        // Single Select avoids the intermediate anonymous-type allocation that the
        // previous double-projection (GroupBy → Select → Where → Select(x => (object)new{...}))
        // was creating for every row.
        return await _dbContext.AuditLogs
            .Where(a => a.Action == "LOGIN"
                     && a.Status == "FAILED"
                     && a.CreatedAt >= cutoffTime)
            .GroupBy(a => new { a.UserId, a.User.Email, a.User.FullName })
            .Where(g => g.Count() >= 5)
            .OrderByDescending(g => g.Count())
            .Select(g => (object)new
            {
                g.Key.UserId,
                g.Key.Email,
                g.Key.FullName,
                FailedAttempts = g.Count(),
                LastAttempt    = g.Max(a => a.CreatedAt),
                IpAddresses    = g.Select(a => a.IpAddress).Distinct().ToList(),
                RiskLevel      = g.Count() >= 10 ? "CRITICAL"
                               : g.Count() >= 7  ? "HIGH"
                               : "MEDIUM"
            })
            .ToListAsync(cancellationToken);
    }
}
