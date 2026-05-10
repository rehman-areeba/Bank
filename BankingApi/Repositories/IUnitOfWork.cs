using BankingApi.Data;

namespace BankingApi.Repositories;

public interface IUnitOfWork : IDisposable
{
    BankingDbContext Context { get; }
    IAccountRepository Accounts { get; }
    ITransactionRepository Transactions { get; }
    IAuditRepository AuditLogs { get; }
    Task<int> CommitAsync(CancellationToken cancellationToken = default);
}
