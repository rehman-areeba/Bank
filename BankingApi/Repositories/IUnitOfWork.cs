namespace BankingApi.Repositories;

public interface IUnitOfWork : IDisposable
{
    IAccountRepository Accounts { get; }
    ITransactionRepository Transactions { get; }
    IAuditRepository AuditLogs { get; }
    Task<int> CommitAsync(CancellationToken cancellationToken = default);
}
