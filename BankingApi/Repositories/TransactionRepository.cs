using BankingApi.Data;
using BankingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApi.Repositories;

public class TransactionRepository(BankingDbContext context) : ITransactionRepository
{
    private readonly BankingDbContext _context = context;

    // GetTransferStatus only needs FromAccountId/ToAccountId for the ownership
    // check — loading full Account navigation objects was pure waste.
    public async Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public async Task<(IEnumerable<Transaction> Items, int TotalCount)> GetByAccountIdAsync(
        Guid accountId, 
        int pageNumber, 
        int pageSize, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Transactions
            .Where(t => t.FromAccountId == accountId || t.ToAccountId == accountId)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        // TransactionDto only uses Id/Type/Amount/Description/CreatedAt/Status —
        // FromAccount and ToAccount navigations are never read by the projection.
        // AsNoTracking: these are read-only list results.
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Transaction> CreateAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        await _context.Transactions.AddAsync(transaction, cancellationToken);
        return transaction;
    }

    // Returns only the IDs of accounts belonging to userId — avoids loading
    // full Account entities just to extract Guid values for the IN clause.
    public async Task<List<Guid>> GetAccountIdsForUserAsync(Guid userId, CancellationToken cancellationToken = default)
        => await _context.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => a.Id)
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<Transaction>> GetRecentByAccountIdsAsync(
        IEnumerable<Guid> accountIds,
        int count,
        CancellationToken cancellationToken = default)
    {
        // AsNoTracking: read-only projection to TransactionDto.
        // No Account includes — TransactionDto does not use navigation properties.
        return await _context.Transactions
            .Where(t => accountIds.Contains(t.FromAccountId) ||
                        (t.ToAccountId.HasValue && accountIds.Contains(t.ToAccountId.Value)))
            .OrderByDescending(t => t.CreatedAt)
            .Take(count)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
