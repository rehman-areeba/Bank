using BankingApi.Data;
using BankingApi.DTOs;
using BankingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApi.Repositories;

public class AccountRepository(BankingDbContext context) : IAccountRepository
{
    private readonly BankingDbContext _context = context;

    // No Include(User) — callers that need User (e.g. notification email) use
    // GetByIdWithUserAsync. Ownership/balance checks never touch User, so the
    // JOIN was pure waste on every account lookup.
    public async Task<Account?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    // Used by TransferService after commit to read sender/receiver email for
    // the notification enqueue — the only place User.Email is actually needed.
    public async Task<Account?> GetByIdWithUserAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Accounts
            .Include(a => a.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    // Used by AccountsController.GetAccount — single-row lookup filtered by both
    // Id and UserId so we never load all accounts just to find one.
    // Projects directly to AccountDto to avoid materialising the Account entity
    // and the User navigation when only scalar fields are needed.
    public async Task<AccountDto?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
        => await _context.Accounts
            .Where(a => a.Id == id && a.UserId == userId)
            .Select(a => new AccountDto(
                a.Id,
                a.UserId,
                a.AccountNumber,
                a.Type,
                a.Balance,
                a.IsActive,
                DateTime.SpecifyKind(a.User.CreatedAt, DateTimeKind.Utc)))
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

    // AsNoTracking: list is read-only (projected to DTOs immediately).
    // Include(User) kept because AccountDto.CreatedAt is sourced from User.CreatedAt.
    public async Task<IEnumerable<Account>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        => await _context.Accounts
            .Where(a => a.UserId == userId)
            .Include(a => a.User)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

    // AsNoTracking + no User include: callers only need AccountId/UserId for
    // ownership checks or to resolve the destination of a transfer.
    public async Task<Account?> GetByAccountNumberAsync(string accountNumber, CancellationToken cancellationToken = default)
        => await _context.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AccountNumber == accountNumber, cancellationToken);

    // Lightweight existence check used by GenerateUniqueAccountNumberAsync —
    // avoids loading the full Account row just to see if a number is taken.
    public async Task<bool> ExistsByAccountNumberAsync(string accountNumber, CancellationToken cancellationToken = default)
        => await _context.Accounts
            .AnyAsync(a => a.AccountNumber == accountNumber, cancellationToken);

    public async Task<Account> CreateAsync(Account account, CancellationToken cancellationToken = default)
    {
        await _context.Accounts.AddAsync(account, cancellationToken);
        return account;
    }

    public Task UpdateAsync(Account account, CancellationToken cancellationToken = default)
    {
        _context.Accounts.Update(account);
        return Task.CompletedTask;
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Accounts.AnyAsync(a => a.Id == id, cancellationToken);
}
