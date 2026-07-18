using Asp.Versioning;
using BankingApi.Middleware;
using BankingApi.Repositories;
using BankingApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace BankingApi.Controllers;

/// <summary>Admin — audit logs, failed login monitoring, and account management.</summary>
[ApiVersion("1.0")]
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[SwaggerTag("Admin-only endpoints for compliance, security monitoring, and account management. Requires the **Admin** role.")]
public class AdminController(
    IAuditService auditService,
    IUnitOfWork unitOfWork) : ControllerBase
{
    private readonly IAuditService _auditService = auditService;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    /// <summary>List all audit logs (paginated).</summary>
    [HttpGet("audit-logs")]
    [SwaggerOperation(Summary = "List audit logs", Description = "Returns a paginated list of all audit log entries across all users. Use the user-specific endpoint for filtered results.")]
    [SwaggerResponse(200, "Paginated audit log list.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Admin role required.")]
    public async Task<ActionResult<object>> GetAuditLogs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? action = null,
        [FromQuery] string? status = null,
        [FromQuery] string? userEmail = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] bool descending = true,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 50;

        var (items, totalCount) = await _auditService.GetAllAsync(
            pageNumber, pageSize, action, status, userEmail, from, to, sortBy, descending, cancellationToken);

        var logs = items.Select(a => new
        {
            a.Id,
            a.UserId,
            UserEmail     = a.User?.Email,
            a.TransactionId,
            a.Action,
            a.Amount,
            a.Status,
            a.IpAddress,
            a.Reason,
            a.CorrelationId,
            a.CreatedAt
        });

        return Ok(new
        {
            data       = logs,
            pageNumber,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    /// <summary>Get audit logs for a specific user.</summary>
    [HttpGet("audit-logs/{userId}")]
    [SwaggerOperation(Summary = "Get user audit logs", Description = "Returns a paginated audit trail for the specified user, including all transfers, deposits, withdrawals, and login events.")]
    [SwaggerResponse(200, "Paginated audit log list for the user.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Admin role required.")]
    [SwaggerResponse(404, "User not found.")]
    public async Task<ActionResult<object>> GetAuditLogsByUser(
        Guid userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _auditService.GetByUserIdAsync(
            userId, pageNumber, pageSize, cancellationToken);

        var logs = items.Select(a => new
        {
            a.Id,
            a.UserId,
            UserEmail = a.User?.Email,
            a.TransactionId,
            a.Action,
            a.Amount,
            a.Status,
            a.IpAddress,
            a.CreatedAt
        });

        return Ok(new
        {
            data = logs,
            pageNumber,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    /// <summary>Get failed login attempts within a time window.</summary>
    [HttpGet("failed-logins")]
    [SwaggerOperation(Summary = "Get failed logins", Description = "Returns users with failed login attempts within the specified time window (default 24 hours, max 168 hours / 7 days). Useful for detecting brute-force attacks.")]
    [SwaggerResponse(200, "List of users with failed login attempts.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Admin role required.")]
    public async Task<ActionResult<object>> GetFailedLogins(
        [FromQuery] int hours = 24,
        CancellationToken cancellationToken = default)
    {
        if (hours < 1) hours = 24;
        if (hours > 168) hours = 168;

        var failedLogins = await _auditService.GetFailedLoginsAsync(hours, cancellationToken);

        return Ok(new
        {
            timeWindow = $"Last {hours} hours",
            suspiciousUsers = failedLogins,
            count = failedLogins.Count
        });
    }

    /// <summary>Freeze or unfreeze a user account.</summary>
    [HttpPut("accounts/{id}/freeze")]
    [SwaggerOperation(Summary = "Freeze / unfreeze account", Description = "Freezes or unfreezes a bank account. A frozen account cannot send or receive funds. Set `unfreeze: true` to reactivate.")]
    [SwaggerResponse(200, "Account status updated.")]
    [SwaggerResponse(400, "Account is already in the requested state.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    [SwaggerResponse(403, "Admin role required.")]
    [SwaggerResponse(404, "Account not found.")]
    public async Task<ActionResult> FreezeAccount(
        Guid id,
        [FromBody] FreezeAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Account {id} not found");

        if (!account.IsActive && !request.Unfreeze)
            return BadRequest(new { message = "Account is already frozen" });

        if (account.IsActive && request.Unfreeze)
            return BadRequest(new { message = "Account is not frozen" });

        account.IsActive = request.Unfreeze;
        await _unitOfWork.Accounts.UpdateAsync(account, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        return Ok(new
        {
            accountId = id,
            status    = account.IsActive ? "ACTIVE" : "FROZEN",
            message   = account.IsActive ? "Account unfrozen successfully" : "Account frozen successfully",
            reason    = request.Reason
        });
    }
}

public record FreezeAccountRequest(bool Unfreeze = false, string? Reason = null);
