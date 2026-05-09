using FluentValidation;

namespace BankingApi.DTOs;

public record TransferRequestDto
{
    public Guid FromAccountId { get; init; }
    public Guid ToAccountId { get; init; }
    public decimal Amount { get; init; }
    public string? Description { get; init; }
}

public class TransferRequestDtoValidator : AbstractValidator<TransferRequestDto>
{
    public TransferRequestDtoValidator()
    {
        RuleFor(x => x.FromAccountId)
            .NotEmpty()
            .WithMessage("Source account is required");

        RuleFor(x => x.ToAccountId)
            .NotEmpty()
            .WithMessage("Destination account is required");

        RuleFor(x => x.ToAccountId)
            .NotEqual(x => x.FromAccountId)
            .WithMessage("Cannot transfer to the same account");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be greater than zero")
            .LessThanOrEqualTo(1000000)
            .WithMessage("Amount cannot exceed 1,000,000");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("Description cannot exceed 500 characters");
    }
}
