using BankingApi.DTOs;
using BankingApi.Models;
using BankingApi.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BankingApi.Services;

public class AuthService(
    IUnitOfWork unitOfWork,
    IConfiguration configuration,
    IAuditService auditService,
    IHttpContextAccessor httpContextAccessor) : IAuthService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IConfiguration _configuration = configuration;
    private readonly IAuditService _auditService = auditService;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    // Read once at construction — IConfiguration.GetValue re-parses the string on
    // every call. ExpiryHours never changes at runtime so caching it is safe.
    private readonly int _jwtExpiryHours = configuration.GetValue<int>("Jwt:ExpiryHours", 24);

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _unitOfWork.Context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (existingUser != null)
            throw new InvalidOperationException("Email already registered");

        var user = new User
        {
            Id           = Guid.NewGuid(),
            FullName     = request.FullName,
            Email        = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role         = "Customer",
            CreatedAt    = DateTime.UtcNow
        };

        await _unitOfWork.Context.Users.AddAsync(user, cancellationToken);

        var account = new Account
        {
            Id            = Guid.NewGuid(),
            UserId        = user.Id,
            AccountNumber = await GenerateUniqueAccountNumberAsync(cancellationToken),
            Type          = "Savings",
            Balance       = 0,
            IsActive      = true
        };

        await _unitOfWork.Accounts.CreateAsync(account, cancellationToken);

        try
        {
            await _unitOfWork.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException?.Message.Contains("IX_Users_Email",
                StringComparison.OrdinalIgnoreCase) == true)
        {
            throw new InvalidOperationException("Email already registered");
        }

        var token     = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(_jwtExpiryHours);

        return new AuthResponseDto(token, expiresAt, user.Id, user.FullName, user.Email, user.Role);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var ipAddress     = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
        var correlationId  = _httpContextAccessor.HttpContext?.Items["CorrelationId"] as string;

        var user = await _unitOfWork.Context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        // Evaluate password even when user is null to prevent timing-based
        // user enumeration. BCrypt.Verify on a dummy hash takes the same time.
        var passwordValid = user != null &&
                            BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!passwordValid)
        {
            // Only write a failed-login audit entry when we know the user —
            // otherwise there is no UserId to associate the log with.
            if (user != null)
            {
                await _auditService.LogAsync(new AuditLog
                {
                    Id            = Guid.NewGuid(),
                    UserId        = user.Id,
                    Action        = "LOGIN",
                    Status        = "FAILED",
                    IpAddress     = ipAddress,
                    Reason        = "Invalid password",
                    CorrelationId = correlationId,
                    CreatedAt     = DateTime.UtcNow
                }, cancellationToken);
            }

            throw new UnauthorizedAccessException("Invalid email or password");
        }

        await _auditService.LogAsync(new AuditLog
        {
            Id            = Guid.NewGuid(),
            UserId        = user!.Id,
            Action        = "LOGIN",
            Status        = "SUCCESS",
            IpAddress     = ipAddress,
            CorrelationId = correlationId,
            CreatedAt     = DateTime.UtcNow
        }, cancellationToken);

        var token     = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(_jwtExpiryHours);

        return new AuthResponseDto(token, expiresAt, user!.Id, user.FullName, user.Email, user.Role);
    }

    private string GenerateJwtToken(User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role,               user.Role),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:            _configuration["Jwt:Issuer"],
            audience:          _configuration["Jwt:Audience"],
            claims:            claims,
            expires:           DateTime.UtcNow.AddHours(_jwtExpiryHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> GenerateUniqueAccountNumberAsync(CancellationToken cancellationToken)
    {
        while (true)
        {
            var accountNumber = Random.Shared.Next(100_000_000, 999_999_999).ToString();
            // ExistsByAccountNumberAsync issues SELECT 1 — no entity materialisation.
            if (!await _unitOfWork.Accounts.ExistsByAccountNumberAsync(accountNumber, cancellationToken))
                return accountNumber;
        }
    }
}
