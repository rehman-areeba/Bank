namespace BankingApi.DTOs;

public record AccountDto(
    Guid Id,
    string AccountNumber,
    string Type,
    decimal Balance,
    bool IsActive,
    DateTime CreatedAt
);
