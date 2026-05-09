namespace BankingApi.Services;

public class EmailNotificationService(ILogger<EmailNotificationService> logger) : INotificationService
{
    private readonly ILogger<EmailNotificationService> _logger = logger;

    public async Task SendTransferNotificationAsync(
        string email,
        decimal amount,
        string direction,
        string transactionId,
        CancellationToken cancellationToken = default)
    {
        // Placeholder for real SMTP implementation
        // In production: use SendGrid, AWS SES, or SMTP client

        _logger.LogInformation(
            "Email notification sent to {Email}: {Direction} transfer of {Amount:C}, Transaction ID: {TransactionId}",
            email, direction, amount, transactionId);

        // Simulate async email sending
        await Task.Delay(50, cancellationToken);

        // TODO: Replace with actual SMTP implementation
        // Example with MailKit:
        // var message = new MimeMessage();
        // message.From.Add(new MailboxAddress("Banking System", "noreply@bank.com"));
        // message.To.Add(new MailboxAddress(email, email));
        // message.Subject = $"Transfer {direction}: {amount:C}";
        // message.Body = new TextPart("html") { Text = BuildEmailTemplate(...) };
        // using var client = new SmtpClient();
        // await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls, cancellationToken);
        // await client.AuthenticateAsync("username", "password", cancellationToken);
        // await client.SendAsync(message, cancellationToken);
        // await client.DisconnectAsync(true, cancellationToken);
    }
}
