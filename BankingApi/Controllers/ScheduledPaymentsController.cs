using Asp.Versioning;
using BankingApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

/// <summary>Scheduled Payments — create and manage recurring transfers.</summary>
[ApiVersion("1.0")]
[Authorize]
[ApiController]
[Route("api/v{version:apiVersion}/scheduled-payments")]
[SwaggerTag("Create, list, and cancel recurring scheduled payments.")]
public class ScheduledPaymentsController(IScheduledPaymentService scheduledPaymentService) : ControllerBase
{
    private readonly IScheduledPaymentService _service = scheduledPaymentService;

    /// <summary>Create a scheduled recurring payment.</summary>
    [HttpPost]
    [SwaggerOperation(Summary = "Create scheduled payment", Description = "Creates a recurring payment that executes automatically on the given frequency.")]
    [SwaggerResponse(201, "Scheduled payment created.")]
    [SwaggerResponse(400, "Invalid request.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Account does not belong to the authenticated user.")]
    public async Task<ActionResult<object>> Create(
        [FromBody] CreateScheduledPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var payment = await _service.CreateAsync(userId, request, cancellationToken);

        return CreatedAtAction(nameof(GetAll), null, new
        {
            payment.Id,
            payment.AccountId,
            payment.RecipientAccount,
            payment.Amount,
            payment.FrequencyDays,
            payment.NextRunDate,
            payment.IsActive
        });
    }

    /// <summary>List all scheduled payments for the authenticated user.</summary>
    [HttpGet]
    [SwaggerOperation(Summary = "List scheduled payments", Description = "Returns all active and inactive scheduled payments for the authenticated user.")]
    [SwaggerResponse(200, "List of scheduled payments.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    public async Task<ActionResult<object>> GetAll(CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        var payments = await _service.GetByUserIdAsync(userId, cancellationToken);

        return Ok(payments.Select(p => new
        {
            p.Id,
            p.AccountId,
            p.RecipientAccount,
            p.Amount,
            p.FrequencyDays,
            p.NextRunDate,
            p.IsActive
        }));
    }

    /// <summary>Cancel a scheduled payment.</summary>
    [HttpDelete("{id}")]
    [SwaggerOperation(Summary = "Cancel scheduled payment", Description = "Cancels a scheduled payment. The payment must belong to the authenticated user.")]
    [SwaggerResponse(204, "Scheduled payment cancelled.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Payment does not belong to the authenticated user.")]
    [SwaggerResponse(404, "Scheduled payment not found.")]
    public async Task<ActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims();
        await _service.CancelAsync(id, userId, cancellationToken);
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
