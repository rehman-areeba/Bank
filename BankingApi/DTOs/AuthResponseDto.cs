namespace BankingApi.DTOs;

public record AuthResponseDto(
    string Token,
    DateTime ExpiresAt,
    Guid UserId,
    string FullName,
    string Email,
    string Role
);
