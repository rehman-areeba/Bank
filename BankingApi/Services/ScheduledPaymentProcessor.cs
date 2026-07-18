namespace BankingApi.Services;

public class ScheduledPaymentProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<ScheduledPaymentProcessor> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly ILogger<ScheduledPaymentProcessor> _logger = logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ScheduledPaymentProcessor started");

        // PeriodicTimer fires on a fixed wall-clock interval regardless of how
        // long ProcessDuePaymentsAsync takes. Unlike Task.Delay it does not drift
        // and does not allocate a new Task object on every tick.
        using var timer = new PeriodicTimer(Interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IScheduledPaymentService>();
                await service.ProcessDuePaymentsAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "ScheduledPaymentProcessor encountered an error");
            }
        }

        _logger.LogInformation("ScheduledPaymentProcessor stopped");
    }
}
