namespace BankingApi.Services;

/// <summary>
/// Abstraction over the notification dispatch mechanism.
/// Decouples TransferService from the concrete Channel-backed processor so the
/// implementation can be swapped (e.g. Redis Streams, Azure Service Bus) without
/// touching business logic, and makes unit-testing trivial via a mock.
/// </summary>
public interface INotificationQueue
{
    void Enqueue(TransactionNotification notification);
}
