namespace BankingApi.DTOs;

public record CreateAccountDto(string Type);

// Used by integration tests and the create-account endpoint.
// AccountType maps to the internal Type field; InitialDeposit is optional.
public record CreateAccountRequestDto
{
    public string AccountType { get; init; } = string.Empty;
    public decimal InitialDeposit { get; init; } = 0;
}
