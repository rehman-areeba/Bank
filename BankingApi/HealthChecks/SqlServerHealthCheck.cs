using BankingApi.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BankingApi.HealthChecks;

public class SqlServerHealthCheck(IServiceScopeFactory scopeFactory) : IHealthCheck
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(5));

            await db.Database.CanConnectAsync(cts.Token);
            sw.Stop();

            return HealthCheckResult.Healthy(
                "SQL Server is reachable.",
                new Dictionary<string, object>
                {
                    ["responseTimeMs"] = sw.ElapsedMilliseconds
                });
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return HealthCheckResult.Unhealthy(
                "SQL Server health check timed out after 5 seconds.",
                data: new Dictionary<string, object>
                {
                    ["responseTimeMs"] = sw.ElapsedMilliseconds
                });
        }
        catch (Exception ex)
        {
            sw.Stop();
            return HealthCheckResult.Unhealthy(
                "SQL Server is unreachable.",
                ex,
                new Dictionary<string, object>
                {
                    ["responseTimeMs"] = sw.ElapsedMilliseconds
                });
        }
    }
}
