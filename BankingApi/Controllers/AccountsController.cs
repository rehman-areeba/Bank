using Asp.Versioning;
using BankingApi.DTOs;
using BankingApi.Repositories;
using BankingApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Swashbuckle.AspNetCore.Annotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

/// <summary>Accounts — create and manage bank accounts, deposits, and withdrawals.</summary>
[ApiVersion("1.0")]
[Authorize]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[SwaggerTag("Manage bank accounts: create, view balances, deposit, withdraw, and browse transaction history.")]
public class AccountsController(IAccountService accountService, ITransactionRepository transactionRepository, IAccountRepository accountRepository, IOutputCacheStore outputCacheStore) : ControllerBase
{
    private readonly IAccountService _accountService = accountService;
    private readonly ITransactionRepository _transactionRepository = transactionRepository;
    private readonly IAccountRepository _accountRepository = accountRepository;
    private readonly IOutputCacheStore _outputCacheStore = outputCacheStore;

    /// <summary>List all accounts for the authenticated user.</summary>
    [HttpGet]
    [OutputCache(PolicyName = "UserScoped")]
    [SwaggerOperation(Summary = "List accounts", Description = "Returns all bank accounts owned by the authenticated user.")]
    [SwaggerResponse(200, "List of accounts.", typeof(IEnumerable<AccountDto>))]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    public async Task<ActionResult<IEnumerable<AccountDto>>> GetAccounts(CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var accounts = await _accountService.GetAccountsByUserIdAsync(userId, cancellationToken);
        return Ok(accounts);
    }

    /// <summary>Get a specific account by ID.</summary>
    [HttpGet("{id}")]
    [OutputCache(PolicyName = "UserScoped")]
    [SwaggerOperation(Summary = "Get account", Description = "Returns account details for the specified account. The account must belong to the authenticated user.")]
    [SwaggerResponse(200, "Account details.", typeof(AccountDto))]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Account does not belong to the authenticated user.")]
    [SwaggerResponse(404, "Account not found.")]
    public async Task<ActionResult<AccountDto>> GetAccount(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        // Single-row lookup filtered by Id AND UserId — avoids loading all accounts
        // for the user just to find one. Returns null (404) if the account doesn't
        // exist or belongs to a different user, preventing account-existence leakage.
        var account = await _accountRepository.GetByIdForUserAsync(id, userId, cancellationToken);
        if (account is null)
            return NotFound();
        return Ok(account);
    }

    /// <summary>Get the current balance of an account.</summary>
    [HttpGet("{id}/balance")]
    [OutputCache(PolicyName = "UserScoped")]
    [SwaggerOperation(Summary = "Get balance", Description = "Returns the current balance for the specified account. The account must belong to the authenticated user.")]
    [SwaggerResponse(200, "Account balance.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Account does not belong to the authenticated user.")]
    [SwaggerResponse(404, "Account not found.")]
    public async Task<ActionResult<object>> GetBalance(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var balance = await _accountService.GetBalanceAsync(id, userId, cancellationToken);
        return Ok(new { accountId = id, balance });
    }

    /// <summary>Create a new bank account.</summary>
    [HttpPost]
    [SwaggerOperation(Summary = "Create account", Description = "Creates a new bank account (Savings, Current) for the authenticated user.")]
    [SwaggerResponse(201, "Account created.", typeof(AccountDto))]
    [SwaggerResponse(400, "Invalid account type.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    public async Task<ActionResult<AccountDto>> CreateAccount(
        [FromBody] CreateAccountRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var account = await _accountService.CreateAccountAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetBalance), new { id = account.Id }, account);
    }

    /// <summary>Get paginated transaction history for an account.</summary>
    [HttpGet("{id}/transactions")]
    [SwaggerOperation(Summary = "Get transactions", Description = "Returns a paginated list of transactions for the specified account. Defaults to page 1, 20 items per page (max 100).")]
    [SwaggerResponse(200, "Paginated transaction list.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Account does not belong to the authenticated user.")]
    [SwaggerResponse(404, "Account not found.")]
    public async Task<ActionResult<object>> GetTransactions(
        Guid id,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserIdFromClaims();

        // VerifyOwnershipAsync is a dedicated ownership check — it does not load
        // the balance and does not abuse GetBalanceAsync as an auth side-effect.
        await _accountService.VerifyOwnershipAsync(id, userId, cancellationToken);

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var (transactions, totalCount) = await _transactionRepository.GetByAccountIdAsync(
            id, pageNumber, pageSize, cancellationToken);

        var transactionDtos = transactions.Select(t => new TransactionDto(
            t.Id, t.Type, t.Amount, t.Description, t.CreatedAt, t.Status));

        return Ok(new
        {
            data       = transactionDtos,
            pageNumber,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    /// <summary>Deposit funds into an account.</summary>
    [HttpPost("{id}/deposit")]
    [SwaggerOperation(Summary = "Deposit", Description = "Deposits the specified amount into the account. Minimum deposit is PKR 100. The account must be active and owned by the authenticated user.")]
    [SwaggerResponse(200, "Deposit successful. Returns new balance.")]
    [SwaggerResponse(400, "Amount below minimum or account is frozen.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(404, "Account not found.")]
    public async Task<ActionResult<object>> Deposit(
        Guid id,
        [FromBody] DepositWithdrawDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var newBalance = await _accountService.DepositAsync(id, userId, dto.Amount, dto.Description, cancellationToken);
        await _outputCacheStore.EvictByTagAsync("user-data", cancellationToken);
        return Ok(new { accountId = id, newBalance, message = "Deposit successful" });
    }

    /// <summary>Withdraw funds from an account.</summary>
    [HttpPost("{id}/withdraw")]
    [SwaggerOperation(Summary = "Withdraw", Description = "Withdraws the specified amount from the account. Minimum withdrawal is PKR 100. Fails if balance is insufficient or account is frozen.")]
    [SwaggerResponse(200, "Withdrawal successful. Returns new balance.")]
    [SwaggerResponse(400, "Insufficient balance, amount below minimum, or account is frozen.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(404, "Account not found.")]
    public async Task<ActionResult<object>> Withdraw(
        Guid id,
        [FromBody] DepositWithdrawDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var newBalance = await _accountService.WithdrawAsync(id, userId, dto.Amount, dto.Description, cancellationToken);
        await _outputCacheStore.EvictByTagAsync("user-data", cancellationToken);
        return Ok(new { accountId = id, newBalance, message = "Withdrawal successful" });
    }

    /// <summary>Deactivate an account. Admin only.</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "Deactivate account", Description = "Permanently deactivates a bank account. Requires Admin role. Account balance must be zero.")]
    [SwaggerResponse(204, "Account deactivated.")]
    [SwaggerResponse(400, "Account has a non-zero balance or is already deactivated.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Admin role required.")]
    [SwaggerResponse(404, "Account not found.")]
    public async Task<ActionResult> DeactivateAccount(Guid id, CancellationToken cancellationToken)
    {
        // AdminDeactivateAccountAsync skips the ownership check — an admin's UserId
        // never matches a customer's account UserId, so the old DeactivateAccountAsync
        // always threw UnauthorizedAccessException for admins.
        await _accountService.AdminDeactivateAccountAsync(id, cancellationToken);
        return NoContent();
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");

        return Guid.Parse(userIdClaim);
    }
}
