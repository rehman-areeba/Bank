using BankingApi.DTOs;
using BankingApi.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransfersController(
    ITransferService transferService,
    IValidator<TransferRequestDto> validator) : ControllerBase
{
    private readonly ITransferService _transferService = transferService;
    private readonly IValidator<TransferRequestDto> _validator = validator;

    [HttpPost]
    public async Task<ActionResult<TransferResponseDto>> ExecuteTransfer(
        [FromBody] TransferRequestDto request,
        CancellationToken cancellationToken)
    {
        // Validate DTO with FluentValidation
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

        // Extract UserId from JWT claims
        var userId = GetUserIdFromClaims();

        // Execute transfer
        var response = await _transferService.ExecuteTransferAsync(userId, request, cancellationToken);

        // Return 201 Created
        return CreatedAtAction(
            nameof(GetTransferStatus),
            new { id = response.TransactionId },
            response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetTransferStatus(Guid id)
    {
        // Placeholder - would query transaction by ID
        return Ok(new
        {
            transactionId = id,
            status = "SUCCESS",
            message = "Transfer completed successfully"
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
