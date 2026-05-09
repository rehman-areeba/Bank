using BankingApi.DTOs;

namespace BankingApi.Services;

public interface ITransferService
{
    Task<TransferResponseDto> ExecuteTransferAsync(Guid userId, TransferRequestDto request, CancellationToken cancellationToken = default);
}
