using Asp.Versioning.ApiExplorer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace BankingApi.Infrastructure;

public class ConfigureSwaggerOptions(IApiVersionDescriptionProvider provider)
    : IConfigureOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        // ── JWT Bearer security scheme ────────────────────────────────────────
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name         = "Authorization",
            Type         = SecuritySchemeType.Http,
            Scheme       = "bearer",
            BearerFormat = "JWT",
            In           = ParameterLocation.Header,
            Description  =
                "Enter your JWT token in the field below.\n\n" +
                "Obtain a token via **POST /api/v1/auth/login**.\n\n" +
                "Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`"
        });

        // AuthorizeOperationFilter stamps individual endpoints — this global
        // requirement is intentionally omitted so anonymous endpoints stay clean.

        // ── One SwaggerDoc per discovered API version ─────────────────────────
        foreach (var description in provider.ApiVersionDescriptions)
        {
            options.SwaggerDoc(description.GroupName, BuildInfo(description));
        }
    }

    private static OpenApiInfo BuildInfo(ApiVersionDescription description)
    {
        var info = new OpenApiInfo
        {
            Title   = "Banking API",
            Version = description.ApiVersion.ToString(),
            Description = """
                A production-grade banking REST API demonstrating ACID-compliant fund transfers,
                optimistic concurrency control, append-only audit logging, and JWT-based authentication.

                ## Authentication
                Most endpoints require a **Bearer JWT token**.
                1. Call `POST /api/v1/auth/register` to create an account.
                2. Call `POST /api/v1/auth/login` to receive a token.
                3. Click **Authorize** (🔒) and paste the token.

                ## Rate Limiting
                - **Anonymous**: 100 requests / minute (keyed by IP)
                - **Authenticated**: 500 requests / minute (keyed by user ID)

                Exceeded limits return `429 Too Many Requests`.

                ## Error Format
                All errors follow a consistent shape:
                ```json
                { "success": false, "message": "...", "errors": [] }
                ```
                """,
            Contact = new OpenApiContact
            {
                Name = "Areeba Rehman",
                Url  = new Uri("https://github.com/rehman-areeba/Bank")
            },
            License = new OpenApiLicense
            {
                Name = "MIT",
                Url  = new Uri("https://opensource.org/licenses/MIT")
            }
        };

        if (description.IsDeprecated)
            info.Description += "\n\n> ⚠️ **This API version is deprecated.** Please migrate to a newer version.";

        return info;
    }
}
