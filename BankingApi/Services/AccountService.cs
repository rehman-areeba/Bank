using BankingApi.DTOs;
using BankingApi.Middleware;
using BankingApi.Models;
using BankingApi.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace BankingApi.Services;

public class AccountService(IUnitOfWork unitOfWork, IHttpContextAccessor httpContextAccessor) : IAccountService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    private string? CorrelationId => _httpContextAccessor.HttpContext?.Items["CorrelationId"] as string;

    public async Task<IEnumerable<AccountDto>> GetAccountsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var accounts = await _unitOfWork.Accounts.GetByUserIdAsync(userId, cancellationToken);

        return accounts.Select(a => new AccountDto(
            a.Id,
            a.UserId,
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

    // Ownership check used by GetTransactions — does not load balance, avoids
    // abusing GetBalanceAsync as an authorization side-effect.
    public async Task VerifyOwnershipAsync(Guid accountId, Guid userId, CancellationToken cancellationToken = default)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account with ID {accountId} not found");

        if (account.UserId != userId)
            throw new UnauthorizedAccessException("You do not have permission to access this account");
    }

    public async Task<AccountDto> CreateAccountAsync(Guid userId, CreateAccountRequestDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.AccountType != "Savings" && dto.AccountType != "Current" && dto.AccountType != "Checking")
            throw new InvalidOperationException("Account type must be Savings, Current, or Checking");

        if (dto.InitialDeposit < 0)
            throw new InvalidOperationException("Initial deposit cannot be negative");

        var accountNumber = await GenerateUniqueAccountNumberAsync(cancellationToken);

        var account = new Account
        {
            Id            = Guid.NewGuid(),
            UserId        = userId,
            AccountNumber = accountNumber,
            Type          = dto.AccountType,
            Balance       = dto.InitialDeposit,
            IsActive      = true
        };

        await _unitOfWork.Accounts.CreateAsync(account, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return new AccountDto(
            account.Id,
            account.UserId,
            account.AccountNumber,
            account.Type,
            account.Balance,
            account.IsActive,
            DateTime.UtcNow
        );
    }

    // Called by customers to close their own account.
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

    // Called by admins — skips the ownership check that would always fail
    // because the admin's UserId never matches the account's UserId.
    public async Task AdminDeactivateAccountAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(accountId, cancellationToken)
            ?? throw new NotFoundException($"Account with ID {accountId} not found");

        if (account.Balance != 0)
            throw new InvalidOperationException("Cannot deactivate account with non-zero balance");

        if (!account.IsActive)
            throw new InvalidOperationException("Account is already deactivated");

        account.IsActive = false;
        await _unitOfWork.Accounts.UpdateAsync(account, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
    }

    public async Task<decimal> DepositAsync(
        Guid accountId,
        Guid userId,
        decimal amount,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (amount < 100)
            throw new InvalidOperationException("Minimum deposit amount is PKR 100");

        // Explicit transaction + UPDLOCK prevents two concurrent deposits from
        // reading the same balance and both committing, which would pass the
        // CK_Account_Balance check but produce an incorrect final balance.
        await using var tx = await _unitOfWork.Context.Database
            .BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            var account = await _unitOfWork.Context.Accounts
                .FromSqlRaw("SELECT * FROM [Accounts] WITH (UPDLOCK, ROWLOCK) WHERE [Id] = {0}", accountId)
                .FirstOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException($"Account {accountId} not found");

            if (account.UserId != userId)
                throw new UnauthorizedAccessException("You do not have permission to access this account");

            if (!account.IsActive)
                throw new InvalidOperationException("Cannot deposit to a frozen account");

            account.Balance += amount;

            var transactionId = Guid.NewGuid();
            var transactionRecord = new Transaction
            {
                Id            = transactionId,
                FromAccountId = accountId,
                ToAccountId   = accountId,
                Type          = "Deposit",
                Amount        = amount,
                Description   = description ?? "Cash Deposit",
                Status        = "Completed",
                CreatedAt     = DateTime.UtcNow
            };

            await _unitOfWork.Context.Transactions.AddAsync(transactionRecord, cancellationToken);

            // Audit every deposit so the admin panel shows a complete money trail.
            await _unitOfWork.AuditLogs.CreateAsync(new AuditLog
            {
                Id            = Guid.NewGuid(),
                UserId        = userId,
                TransactionId = transactionId,
                Action        = "DEPOSIT",
                Amount        = amount,
                Status        = "SUCCESS",
                CorrelationId = CorrelationId,
                CreatedAt     = DateTime.UtcNow
            }, cancellationToken);

            await _unitOfWork.CommitAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return account.Balance;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<decimal> WithdrawAsync(
        Guid accountId,
        Guid userId,
        decimal amount,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (amount < 100)
            throw new InvalidOperationException("Minimum withdrawal amount is PKR 100");

        await using var tx = await _unitOfWork.Context.Database
            .BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            var account = await _unitOfWork.Context.Accounts
                .FromSqlRaw("SELECT * FROM [Accounts] WITH (UPDLOCK, ROWLOCK) WHERE [Id] = {0}", accountId)
                .FirstOrDefaultAsync(cancellationToken)
                ?? throw new NotFoundException($"Account {accountId} not found");

            if (account.UserId != userId)
                throw new UnauthorizedAccessException("You do not have permission to access this account");

            if (!account.IsActive)
                throw new InvalidOperationException("Cannot withdraw from a frozen account");

            // Re-check balance inside the lock — prevents double-spend when two
            // concurrent withdrawals both read the same balance before either commits.
            if (account.Balance < amount)
                throw new InvalidOperationException("Insufficient balance");

            account.Balance -= amount;

            var transactionId = Guid.NewGuid();
            var transactionRecord = new Transaction
            {
                Id            = transactionId,
                FromAccountId = accountId,
                ToAccountId   = null,
                Type          = "Withdrawal",
                Amount        = amount,
                Description   = description ?? "Cash Withdrawal",
                Status        = "Completed",
                CreatedAt     = DateTime.UtcNow
            };

            await _unitOfWork.Context.Transactions.AddAsync(transactionRecord, cancellationToken);

            await _unitOfWork.AuditLogs.CreateAsync(new AuditLog
            {
                Id            = Guid.NewGuid(),
                UserId        = userId,
                TransactionId = transactionId,
                Action        = "WITHDRAWAL",
                Amount        = amount,
                Status        = "SUCCESS",
                CorrelationId = CorrelationId,
                CreatedAt     = DateTime.UtcNow
            }, cancellationToken);

            await _unitOfWork.CommitAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return account.Balance;
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<string> GenerateUniqueAccountNumberAsync(CancellationToken cancellationToken)
    {
        while (true)
        {
            var accountNumber = Random.Shared.Next(100_000_000, 999_999_999).ToString();
            if (!await _unitOfWork.Accounts.ExistsByAccountNumberAsync(accountNumber, cancellationToken))
                return accountNumber;
        }
    }
}
