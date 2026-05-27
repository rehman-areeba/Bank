using BankingApi.Data;
using BankingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApi.Repositories;

public class TransactionRepository(BankingDbContext context) : ITransactionRepository
{
    private readonly BankingDbContext _context = context;

    public async Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .Include(t => t.FromAccount)
            .Include(t => t.ToAccount)
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
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(t => t.FromAccount)
            .Include(t => t.ToAccount)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Transaction> CreateAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        await _context.Transactions.AddAsync(transaction, cancellationToken);
        return transaction;
    }

    public async Task<IEnumerable<Transaction>> GetRecentByAccountIdsAsync(
        IEnumerable<Guid> accountIds,
        int count,
        CancellationToken cancellationToken = default)
    {
        return await _context.Transactions
            .Where(t => accountIds.Contains(t.FromAccountId) || (t.ToAccountId.HasValue && accountIds.Contains(t.ToAccountId.Value)))
            .OrderByDescending(t => t.CreatedAt)
            .Take(count)
            .Include(t => t.FromAccount)
            .Include(t => t.ToAccount)
            .ToListAsync(cancellationToken);
    }
}
