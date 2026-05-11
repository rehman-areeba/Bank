using BankingApi.DTOs;
using BankingApi.Repositories;
using BankingApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AccountsController(IAccountService accountService, ITransactionRepository transactionRepository) : ControllerBase
{
    private readonly IAccountService _accountService = accountService;
    private readonly ITransactionRepository _transactionRepository = transactionRepository;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountDto>>> GetAccounts(CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var accounts = await _accountService.GetAccountsByUserIdAsync(userId, cancellationToken);
        return Ok(accounts);
    }

    [HttpGet("{id}/balance")]
    public async Task<ActionResult<object>> GetBalance(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var balance = await _accountService.GetBalanceAsync(id, userId, cancellationToken);
        return Ok(new { accountId = id, balance });
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> CreateAccount(
        [FromBody] CreateAccountDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var account = await _accountService.CreateAccountAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetBalance), new { id = account.Id }, account);
    }

    [HttpGet("{id}/transactions")]
    public async Task<ActionResult<object>> GetTransactions(
        Guid id,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserIdFromClaims();

        // Verify ownership
        await _accountService.GetBalanceAsync(id, userId, cancellationToken);

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var (transactions, totalCount) = await _transactionRepository.GetByAccountIdAsync(
            id,
            pageNumber,
            pageSize,
            cancellationToken);

        var transactionDtos = transactions.Select(t => new TransactionDto(
            t.Id,
            t.Type,
            t.Amount,
            t.Description,
            t.CreatedAt,
            t.Status
        ));

        return Ok(new
        {
            data = transactionDtos,
            pageNumber,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpPost("{id}/deposit")]
    public async Task<ActionResult<object>> Deposit(
        Guid id,
        [FromBody] DepositWithdrawDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var newBalance = await _accountService.DepositAsync(id, userId, dto.Amount, dto.Description, cancellationToken);
        return Ok(new { accountId = id, newBalance, message = "Deposit successful" });
    }

    [HttpPost("{id}/withdraw")]
    public async Task<ActionResult<object>> Withdraw(
        Guid id,
        [FromBody] DepositWithdrawDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var newBalance = await _accountService.WithdrawAsync(id, userId, dto.Amount, dto.Description, cancellationToken);
        return Ok(new { accountId = id, newBalance, message = "Withdrawal successful" });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeactivateAccount(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        await _accountService.DeactivateAccountAsync(id, userId, cancellationToken);
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
