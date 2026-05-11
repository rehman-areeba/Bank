using BankingApi.DTOs;

namespace BankingApi.Services;

public interface IAccountService
{
    Task<IEnumerable<AccountDto>> GetAccountsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<decimal> GetBalanceAsync(Guid accountId, Guid userId, CancellationToken cancellationToken = default);
    Task<AccountDto> CreateAccountAsync(Guid userId, CreateAccountDto dto, CancellationToken cancellationToken = default);
    Task DeactivateAccountAsync(Guid accountId, Guid userId, CancellationToken cancellationToken = default);
    Task<decimal> DepositAsync(Guid accountId, Guid userId, decimal amount, string? description, CancellationToken cancellationToken = default);
    Task<decimal> WithdrawAsync(Guid accountId, Guid userId, decimal amount, string? description, CancellationToken cancellationToken = default);
}
