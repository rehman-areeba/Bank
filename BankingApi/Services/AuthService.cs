using BankingApi.DTOs;
using BankingApi.Models;
using BankingApi.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BankingApi.Services;

public class AuthService(IUnitOfWork unitOfWork, IConfiguration configuration) : IAuthService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IConfiguration _configuration = configuration;

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _unitOfWork.Accounts.GetByAccountNumberAsync(request.Email, cancellationToken);
        if (existingUser != null)
            throw new InvalidOperationException("Email already registered");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Customer",
            CreatedAt = DateTime.UtcNow
        };

        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            AccountNumber = GenerateAccountNumber(),
            Type = "Savings",
            Balance = 0,
            IsActive = true
        };

        await _unitOfWork.Accounts.CreateAsync(account, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(_configuration.GetValue<int>("Jwt:ExpiryHours", 24));

        return new AuthResponseDto(token, expiresAt, user.Id, user.FullName, user.Role);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var accounts = await _unitOfWork.Accounts.GetByUserIdAsync(Guid.Empty, cancellationToken);
        var user = accounts.FirstOrDefault()?.User;

        if (user == null || user.Email != request.Email)
            throw new UnauthorizedAccessException("Invalid email or password");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password");

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(_configuration.GetValue<int>("Jwt:ExpiryHours", 24));

        return new AuthResponseDto(token, expiresAt, user.Id, user.FullName, user.Role);
    }

    private string GenerateJwtToken(User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_configuration.GetValue<int>("Jwt:ExpiryHours", 24)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateAccountNumber()
    {
        var random = new Random();
        return $"{random.Next(1000, 9999)}{random.Next(1000, 9999)}{random.Next(1000, 9999)}";
    }
}
