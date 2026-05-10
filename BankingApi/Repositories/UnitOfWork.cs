using BankingApi.Data;

namespace BankingApi.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly BankingDbContext _context;
    private IAccountRepository? _accounts;
    private ITransactionRepository? _transactions;
    private IAuditRepository? _auditLogs;

    public UnitOfWork(BankingDbContext context)
    {
        _context = context;
    }

    public BankingDbContext Context => _context;
    public IAccountRepository Accounts => _accounts ??= new AccountRepository(_context);
    public ITransactionRepository Transactions => _transactions ??= new TransactionRepository(_context);
    public IAuditRepository AuditLogs => _auditLogs ??= new AuditRepository(_context);

    public async Task<int> CommitAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
