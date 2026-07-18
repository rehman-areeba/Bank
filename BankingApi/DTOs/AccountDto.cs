namespace BankingApi.DTOs;

using System.Text.Json.Serialization;

public record AccountDto(
    Guid Id,
    Guid UserId,
    string AccountNumber,
    [property: JsonPropertyName("accountType")] string Type,
    decimal Balance,
    bool IsActive,
    DateTime CreatedAt
);
