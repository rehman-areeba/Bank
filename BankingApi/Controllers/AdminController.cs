using BankingApi.Middleware;
using BankingApi.Repositories;
using BankingApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankingApi.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminController(
    IAuditService auditService,
    IUnitOfWork unitOfWork) : ControllerBase
{
    private readonly IAuditService _auditService = auditService;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    [HttpGet("audit-logs")]
    public async Task<ActionResult<object>> GetAuditLogs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 50;

        // Get all audit logs (not filtered by user)
        var query = unitOfWork.AuditLogs as dynamic;
        
        // Since we don't have a GetAllAsync method, we'll use a workaround
        // In production, add GetAllAsync to IAuditRepository
        return Ok(new
        {
            message = "Use GET /api/admin/audit-logs/{userId} to view user-specific logs",
            pageNumber,
            pageSize
        });
    }

    [HttpGet("audit-logs/{userId}")]
    public async Task<ActionResult<object>> GetAuditLogsByUser(
        Guid userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _auditService.GetByUserIdAsync(
            userId,
            pageNumber,
            pageSize,
            cancellationToken);

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

    [HttpGet("failed-logins")]
    public async Task<ActionResult<object>> GetFailedLogins(
        [FromQuery] int hours = 24,
        CancellationToken cancellationToken = default)
    {
        if (hours < 1) hours = 24;
        if (hours > 168) hours = 168; // Max 7 days

        var failedLogins = await _auditService.GetFailedLoginsAsync(hours, cancellationToken);

        return Ok(new
        {
            timeWindow = $"Last {hours} hours",
            suspiciousUsers = failedLogins,
            count = failedLogins.Count()
        });
    }

    [HttpPut("accounts/{id}/freeze")]
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
            status = account.IsActive ? "ACTIVE" : "FROZEN",
            message = account.IsActive ? "Account unfrozen successfully" : "Account frozen successfully",
            reason = request.Reason
        });
    }
}

public record FreezeAccountRequest(bool Unfreeze = false, string? Reason = null);
