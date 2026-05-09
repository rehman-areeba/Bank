namespace BankingApi.DTOs;

public record TransactionDto(
    Guid Id,
    string Type,
    decimal Amount,
    string? Description,
    DateTime CreatedAt,
    string Status
);
