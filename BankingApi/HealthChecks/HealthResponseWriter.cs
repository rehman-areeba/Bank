using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json;

namespace BankingApi.HealthChecks;

public static class HealthResponseWriter
{
    private static readonly JsonSerializerOptions _options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public static async Task WriteAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = report.Status == HealthStatus.Healthy
            ? StatusCodes.Status200OK
            : StatusCodes.Status503ServiceUnavailable;

        var response = new
        {
            status = report.Status.ToString().ToLowerInvariant(),
            duration = report.TotalDuration.TotalMilliseconds,
            timestamp = DateTime.UtcNow,
            checks = report.Entries.Select(e => new
            {
                name        = e.Key,
                status      = e.Value.Status.ToString().ToLowerInvariant(),
                description = e.Value.Description,
                duration    = e.Value.Duration.TotalMilliseconds,
                data        = e.Value.Data.Count > 0 ? e.Value.Data : null,
                error       = e.Value.Exception?.Message
            })
        };

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response, _options));
    }
}
