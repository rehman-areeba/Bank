namespace BankingApi.DTOs;

public record DepositWithdrawDto(decimal Amount, string? Description = null);
