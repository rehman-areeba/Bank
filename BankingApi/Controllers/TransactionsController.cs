using Asp.Versioning;
using BankingApi.DTOs;
using BankingApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Swashbuckle.AspNetCore.Annotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

/// <summary>Transactions — query recent activity across all accounts.</summary>
[ApiVersion("1.0")]
[Authorize]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[SwaggerTag("Query transaction history across all accounts owned by the authenticated user.")]
public class TransactionsController(ITransactionRepository transactionRepository) : ControllerBase
{
    private readonly ITransactionRepository _transactionRepository = transactionRepository;

    /// <summary>Get the 10 most recent transactions across all accounts.</summary>
    [HttpGet("recent")]
    [OutputCache(PolicyName = "UserScoped")]
    [SwaggerOperation(Summary = "Recent transactions", Description = "Returns the 10 most recent transactions across all accounts owned by the authenticated user, ordered by date descending.")]
    [SwaggerResponse(200, "List of recent transactions.", typeof(IEnumerable<TransactionDto>))]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    public async Task<ActionResult<IEnumerable<TransactionDto>>> GetRecentTransactions(CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();

        // GetAccountIdsForUserAsync issues SELECT Id FROM Accounts WHERE UserId = @userId
        // — no Account entity materialisation, no User JOIN, no change tracking.
        var accountIds = await _transactionRepository.GetAccountIdsForUserAsync(userId, cancellationToken);

        if (accountIds.Count == 0)
            return Ok(Array.Empty<TransactionDto>());

        var transactions = await _transactionRepository.GetRecentByAccountIdsAsync(accountIds, 10, cancellationToken);

        var transactionDtos = transactions.Select(t => new TransactionDto(
            t.Id, t.Type, t.Amount, t.Description, t.CreatedAt, t.Status));

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
