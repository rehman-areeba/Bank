using BankingApi.Models;

namespace BankingApi.Repositories;

public interface ITransactionRepository
{
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IEnumerable<Transaction> Items, int TotalCount)> GetByAccountIdAsync(
        Guid accountId, 
        int pageNumber, 
        int pageSize, 
        CancellationToken cancellationToken = default);
    Task<Transaction> CreateAsync(Transaction transaction, CancellationToken cancellationToken = default);
}
