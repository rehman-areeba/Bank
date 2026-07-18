using BankingApi.DTOs;

namespace BankingApi.Services;

public interface ITransferService
{
    Task<TransferResponseDto> ExecuteTransferAsync(
        Guid userId,
        TransferRequestDto request,
        string? ipAddress,
        CancellationToken cancellationToken = default);
}
