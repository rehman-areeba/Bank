namespace BankingApi.DTOs;

public record TransferResponseDto(
    Guid TransactionId,
    string Status,
    decimal Amount,
    DateTime Timestamp,
    decimal UpdatedBalance
);
