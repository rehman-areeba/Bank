namespace BankingApi.Services;

public interface INotificationService
{
    Task SendTransferNotificationAsync(
        string email,
        decimal amount,
        string direction,
        string transactionId,
        CancellationToken cancellationToken = default);
}
