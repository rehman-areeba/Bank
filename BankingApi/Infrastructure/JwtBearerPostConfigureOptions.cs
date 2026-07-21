using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

namespace BankingApi.Infrastructure;

/// <summary>
/// Configures <see cref="JwtBearerOptions"/> after the DI container is fully
/// built, so that <see cref="IConfiguration"/> values injected by
/// WebApplicationFactory (via ConfigureAppConfiguration) are already present
/// when the options are first resolved.
///
/// This is the correct ASP.NET Core pattern for options that depend on
/// configuration that may be overridden by the test host. Eager reads of
/// IConfiguration inside AddJwtBearer(...) capture values before
/// WebApplicationFactory's ConfigureAppConfiguration callbacks run.
/// </summary>
internal sealed class JwtBearerOptionsConfigurator(
    IConfiguration configuration,
    IWebHostEnvironment environment) : IPostConfigureOptions<JwtBearerOptions>
{
    public void PostConfigure(string? name, JwtBearerOptions options)
    {
        var key = configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException(
                "Jwt:Key is not configured. Set the Jwt__Key environment variable.");

        if (environment.IsProduction() &&
            (key.Contains("dev-only") || key.Contains("dev-secret") || key.Length < 32))
            throw new InvalidOperationException(
                "Jwt:Key is a development placeholder or too short. " +
                "Set a strong Jwt__Key environment variable in production.");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = configuration["Jwt:Issuer"],
            ValidAudience            = configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            // Explicitly keep the default mapping so JwtRegisteredClaimNames.Sub
            // is always available as ClaimTypes.NameIdentifier in every controller.
            // Without this, a future TokenValidationParameters change could silently
            // break GetUserIdFromClaims() across all controllers.
            NameClaimType            = ClaimTypes.NameIdentifier
        };
    }
}
