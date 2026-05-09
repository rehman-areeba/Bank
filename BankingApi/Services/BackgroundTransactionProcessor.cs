using System.Threading.Channels;

namespace BankingApi.Services;

public class BackgroundTransactionProcessor(
    ILogger<BackgroundTransactionProcessor> logger,
    IServiceScopeFactory serviceScopeFactory) : BackgroundService
{
    private readonly ILogger<BackgroundTransactionProcessor> _logger = logger;
    private readonly IServiceScopeFactory _serviceScopeFactory = serviceScopeFactory;
    private readonly Channel<TransactionNotification> _channel = Channel.CreateUnbounded<TransactionNotification>();

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

    public async Task EnqueueNotificationAsync(TransactionNotification notification)
    {
        await _channel.Writer.WriteAsync(notification);
        _logger.LogDebug("Notification enqueued for transaction {TransactionId}", notification.TransactionId);
    }
}

public record TransactionNotification(
    Guid TransactionId,
    string SenderEmail,
    string ReceiverEmail,
    decimal Amount
);
