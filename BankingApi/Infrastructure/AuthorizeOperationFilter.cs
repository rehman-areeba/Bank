using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace BankingApi.Infrastructure;

/// <summary>
/// Adds the JWT Bearer security requirement to any operation that has
/// [Authorize] (and is not overridden by [AllowAnonymous]).
/// This makes the padlock icon appear only on protected endpoints.
/// </summary>
public class AuthorizeOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasAllowAnonymous = context.MethodInfo
            .GetCustomAttributes(true)
            .OfType<AllowAnonymousAttribute>()
            .Any()
            || (context.MethodInfo.DeclaringType?
                .GetCustomAttributes(true)
                .OfType<AllowAnonymousAttribute>()
                .Any() ?? false);

        if (hasAllowAnonymous)
            return;

        var hasAuthorize = context.MethodInfo
            .GetCustomAttributes(true)
            .OfType<AuthorizeAttribute>()
            .Any()
            || (context.MethodInfo.DeclaringType?
                .GetCustomAttributes(true)
                .OfType<AuthorizeAttribute>()
                .Any() ?? false);

        if (!hasAuthorize)
            return;

        operation.Security =
        [
            new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id   = "Bearer"
                        }
                    },
                    []
                }
            }
        ];

        operation.Responses.TryAdd("401", new OpenApiResponse { Description = "Unauthorized — JWT token is missing or invalid." });
        operation.Responses.TryAdd("403", new OpenApiResponse { Description = "Forbidden — you do not have permission to access this resource." });
    }
}
