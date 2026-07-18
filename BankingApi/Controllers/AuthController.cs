using Asp.Versioning;
using BankingApi.DTOs;
using BankingApi.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BankingApi.Controllers;

/// <summary>Authentication — register, login, and retrieve the current user.</summary>
[ApiVersion("1.0")]
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[SwaggerTag("Register a new account, log in, and inspect the authenticated user.")]
public class AuthController(IAuthService authService, IValidator<RegisterRequestDto> registerValidator) : ControllerBase
{
    private readonly IAuthService _authService = authService;
    private readonly IValidator<RegisterRequestDto> _registerValidator = registerValidator;

    /// <summary>Register a new user account.</summary>
    [HttpPost("register")]
    [SwaggerOperation(Summary = "Register", Description = "Creates a new user account and returns a JWT token. A default Savings account is created automatically.")]
    [SwaggerResponse(201, "Account created successfully.", typeof(AuthResponseDto))]
    [SwaggerResponse(400, "Validation failed.")]
    [SwaggerResponse(409, "Email address is already in use.")]
    public async Task<ActionResult<AuthResponseDto>> Register(
        [FromBody] RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var validationResult = await _registerValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                message = "Validation failed",
                errors = validationResult.Errors.Select(e => new
                {
                    property = e.PropertyName,
                    message = e.ErrorMessage
                })
            });
        }

        var response = await _authService.RegisterAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetMe), new { id = response.UserId }, response);
    }

    /// <summary>Log in and receive a JWT token.</summary>
    [HttpPost("login")]
    [SwaggerOperation(Summary = "Login", Description = "Authenticates with email and password. Returns a signed JWT valid for 24 hours. Use the token in the **Authorize** dialog above.")]
    [SwaggerResponse(200, "Login successful.", typeof(AuthResponseDto))]
    [SwaggerResponse(401, "Invalid email or password.")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>Get the currently authenticated user.</summary>
    [Authorize]
    [HttpGet("me")]
    [SwaggerOperation(Summary = "Get current user", Description = "Returns the user ID, email, role, and full name extracted from the JWT claims.")]
    [SwaggerResponse(200, "Current user details.")]
    [SwaggerResponse(401, "Token is missing or invalid.")]
    public ActionResult<object> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var fullName = User.FindFirst(ClaimTypes.Name)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Invalid token" });

        return Ok(new
        {
            userId = Guid.Parse(userId),
            email,
            role,
            fullName
        });
    }
}
