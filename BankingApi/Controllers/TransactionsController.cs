using BankingApi.DTOs;
using BankingApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController(ITransactionRepository transactionRepository, IAccountRepository accountRepository) : ControllerBase
{
    private readonly ITransactionRepository _transactionRepository = transactionRepository;
    private readonly IAccountRepository _accountRepository = accountRepository;

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<TransactionDto>>> GetRecentTransactions(CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        
        // Get all user accounts
        var accounts = await _accountRepository.GetByUserIdAsync(userId, cancellationToken);
        var accountIds = accounts.Select(a => a.Id).ToList();
        
        if (!accountIds.Any())
        {
            return Ok(Array.Empty<TransactionDto>());
        }

        // Get recent transactions across all accounts (last 10)
        var transactions = await _transactionRepository.GetRecentByAccountIdsAsync(accountIds, 10, cancellationToken);
        
        var transactionDtos = transactions.Select(t => new TransactionDto(
            t.Id,
            t.Type,
            t.Amount,
            t.Description,
            t.CreatedAt,
            t.Status
        ));

        return Ok(transactionDtos);
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");

        return Guid.Parse(userIdClaim);
    }
}
