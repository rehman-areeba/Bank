using BankingApi.DTOs;
using BankingApi.Middleware;
using BankingApi.Models;
using BankingApi.Repositories;

namespace BankingApi.Services;

public class AccountService(IUnitOfWork unitOfWork) : IAccountService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    public async Task<IEnumerable<AccountDto>> GetAccountsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var accounts = await _unitOfWork.Accounts.GetByUserIdAsync(userId, cancellationToken);
        
        return accounts.Select(a => new AccountDto(
            a.Id,
            a.AccountNumber,
            a.Type,
            a.Balance,
            a.IsActive,
            DateTime.SpecifyKind(a.User?.CreatedAt ?? DateTime.UtcNow, DateTimeKind.Utc)
        ));
    }

    public async Task<decimal> GetBalanceAsync(Guid accountId, Guid userId, CancellationToken cancellationToken = default)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account with ID {accountId} not found");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("You do not have permission to access this account");

        return account.Balance;
    }

    public async Task<AccountDto> CreateAccountAsync(Guid userId, CreateAccountDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Type != "Savings" && dto.Type != "Current")
            throw new InvalidOperationException("Account type must be either 'Savings' or 'Current'");

        var accountNumber = await GenerateUniqueAccountNumberAsync(cancellationToken);

        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountNumber = accountNumber,
            Type = dto.Type,
            Balance = 0,
            IsActive = true
        };

        await _unitOfWork.Accounts.CreateAsync(account, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new AccountDto(
            account.Id,
            account.AccountNumber,
            account.Type,
            account.Balance,
            account.IsActive,
            DateTime.UtcNow
        );
    }

    public async Task DeactivateAccountAsync(Guid accountId, Guid userId, CancellationToken cancellationToken = default)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account with ID {accountId} not found");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("You do not have permission to deactivate this account");

        if (account.Balance != 0)
            throw new InvalidOperationException("Cannot deactivate account with non-zero balance");

        if (!account.IsActive)
            throw new InvalidOperationException("Account is already deactivated");

        account.IsActive = false;
        await _unitOfWork.Accounts.UpdateAsync(account, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    private async Task<string> GenerateUniqueAccountNumberAsync(CancellationToken cancellationToken)
    {
        string accountNumber;
        Account? existing;

        do
        {
            accountNumber = GenerateAccountNumber();
            existing = await _unitOfWork.Accounts.GetByAccountNumberAsync(accountNumber, cancellationToken);
        }
        while (existing != null);

        return accountNumber;
    }

    private static string GenerateAccountNumber()
    {
        var random = new Random();
        return $"{random.Next(1000000000, 999999999)}";
    }
}
