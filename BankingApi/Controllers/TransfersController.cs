using Asp.Versioning;
using BankingApi.DTOs;
using BankingApi.Repositories;
using BankingApi.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Swashbuckle.AspNetCore.Annotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

/// <summary>Transfers — move funds between accounts with ACID guarantees.</summary>
[ApiVersion("1.0")]
[Authorize]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[SwaggerTag("Execute and query fund transfers. All transfers are ACID-compliant with Serializable isolation and optimistic concurrency control.")]
public class TransfersController(
    ITransferService transferService,
    IValidator<TransferRequestDto> validator,
    IUnitOfWork unitOfWork,
    IOutputCacheStore outputCacheStore) : ControllerBase
{
    private readonly ITransferService _transferService = transferService;
    private readonly IValidator<TransferRequestDto> _validator = validator;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IOutputCacheStore _outputCacheStore = outputCacheStore;

    /// <summary>Execute a fund transfer between two accounts.</summary>
    [HttpPost]
    [SwaggerOperation(
        Summary     = "Execute transfer",
        Description = """
            Transfers funds from one of your accounts to any destination account number.

            **ACID guarantees:**
            - Atomic: both debit and credit commit together or not at all.
            - Consistent: balance constraints are enforced inside the transaction.
            - Isolated: Serializable isolation prevents phantom reads and race conditions.
            - Durable: committed data survives crashes.

            **Concurrency:** uses RowVersion optimistic locking with up to 3 automatic retries on conflict.

            **Daily limit:** PKR 50,000 per source account.
            """)]
    [SwaggerResponse(201, "Transfer completed successfully.", typeof(TransferResponseDto))]
    [SwaggerResponse(400, "Insufficient balance, frozen account, same-account transfer, or daily limit exceeded.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Source account does not belong to the authenticated user.")]
    [SwaggerResponse(404, "Source or destination account not found.")]
    [SwaggerResponse(422, "Request validation failed.")]
    [SwaggerResponse(429, "Transfer rate limit exceeded (500 req/min for authenticated users).")]
    public async Task<ActionResult<TransferResponseDto>> ExecuteTransfer(
        [FromBody] TransferRequestDto request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                errors = validationResult.Errors.Select(e => new
                {
                    property = e.PropertyName,
                    message = e.ErrorMessage
                })
            });
        }

        var userId    = GetUserIdFromClaims();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response  = await _transferService.ExecuteTransferAsync(userId, request, ipAddress, cancellationToken);
        await _outputCacheStore.EvictByTagAsync("user-data", cancellationToken);

        return CreatedAtAction(
            nameof(GetTransferStatus),
            new { id = response.TransactionId },
            response);
    }

    /// <summary>Get the status of a transfer by transaction ID.</summary>
    [HttpGet("{id}")]
    [SwaggerOperation(Summary = "Get transfer status", Description = "Returns the status of a previously executed transfer by its transaction ID.")]
    [SwaggerResponse(200, "Transfer status.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(404, "Transaction not found.")]
    public async Task<ActionResult<object>> GetTransferStatus(Guid id, CancellationToken cancellationToken)
    {
        var transaction = await _unitOfWork.Transactions.GetByIdAsync(id, cancellationToken)
            ?? throw new Middleware.NotFoundException($"Transaction {id} not found");

        var userId = GetUserIdFromClaims();
        // GetAccountIdsForUserAsync issues SELECT Id FROM Accounts WHERE UserId = @userId
        // — no Account entity materialisation, no User JOIN, no change tracking.
        // Previously GetByUserIdAsync was used here, which loaded full Account+User rows
        // just to extract Guid values for the participant check.
        var userAccountIds = (await _unitOfWork.Transactions.GetAccountIdsForUserAsync(userId, cancellationToken)).ToHashSet();

        var isParticipant = userAccountIds.Contains(transaction.FromAccountId) ||
            (transaction.ToAccountId != null && userAccountIds.Contains(transaction.ToAccountId.Value));

        if (!isParticipant)
            return Forbid();

        return Ok(new
        {
            transactionId = transaction.Id,
            type          = transaction.Type,
            amount        = transaction.Amount,
            status        = transaction.Status,
            description   = transaction.Description,
            createdAt     = transaction.CreatedAt
        });
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");

        return Guid.Parse(userIdClaim);
    }
}
