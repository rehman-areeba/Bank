using System.Threading.Channels;

namespace BankingApi.Services;

public class BackgroundTransactionProcessor(
    ILogger<BackgroundTransactionProcessor> logger,
    IServiceScopeFactory serviceScopeFactory) : BackgroundService, INotificationQueue
{
    private readonly ILogger<BackgroundTransactionProcessor> _logger = logger;
    private readonly IServiceScopeFactory _serviceScopeFactory = serviceScopeFactory;
    // Bounded capacity of 10 000 prevents unbounded memory growth under load.
    // BoundedChannelFullMode.Wait back-pressures the producer (TransferService)
    // rather than silently dropping notifications.
    private readonly Channel<TransactionNotification> _channel =
        Channel.CreateBounded<TransactionNotification>(
            new BoundedChannelOptions(10_000)
            {
                FullMode            = BoundedChannelFullMode.Wait,
                SingleReader        = true,   // only ExecuteAsync reads
                SingleWriter        = false   // multiple request threads may enqueue
            });

    public ChannelWriter<TransactionNotification> Writer => _channel.Writer;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("BackgroundTransactionProcessor started");

        await foreach (var notification in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessNotificationAsync(notification, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error processing notification for transaction {TransactionId}",
                    notification.TransactionId);
            }
        }

        _logger.LogInformation("BackgroundTransactionProcessor stopped");
    }

    private async Task ProcessNotificationAsync(
        TransactionNotification notification,
        CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        _logger.LogInformation(
            "Processing notification for transaction {TransactionId}",
            notification.TransactionId);

        // Send notification to sender
        await notificationService.SendTransferNotificationAsync(
            notification.SenderEmail,
            notification.Amount,
            "SENT",
            notification.TransactionId.ToString(),
            cancellationToken);

        // Send notification to receiver
        await notificationService.SendTransferNotificationAsync(
            notification.ReceiverEmail,
            notification.Amount,
            "RECEIVED",
            notification.TransactionId.ToString(),
            cancellationToken);

        _logger.LogInformation(
            "Notification processed successfully for transaction {TransactionId}",
            notification.TransactionId);
    }

    // INotificationQueue implementation.
    // TryWrite is non-blocking: if the channel is at capacity (10 000 items) the
    // notification is dropped with a warning rather than blocking the request thread
    // that just committed a transfer. A blocked request thread under load would
    // exhaust the thread pool and degrade API throughput for all users.
    public void Enqueue(TransactionNotification notification)
    {
        if (!_channel.Writer.TryWrite(notification))
            _logger.LogWarning(
                "Notification channel full — dropping notification for transaction {TransactionId}",
                notification.TransactionId);
        else
            _logger.LogDebug("Notification enqueued for transaction {TransactionId}", notification.TransactionId);
    }
}

public record TransactionNotification(
    Guid TransactionId,
    string SenderEmail,
    string ReceiverEmail,
    decimal Amount
);
