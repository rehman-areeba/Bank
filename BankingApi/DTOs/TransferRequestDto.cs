using FluentValidation;

namespace BankingApi.DTOs;

public record TransferRequestDto
{
    public Guid FromAccountId { get; init; }
    public string ToAccountNumber { get; init; } = string.Empty;
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

        RuleFor(x => x.ToAccountNumber)
            .NotEmpty()
            .WithMessage("Destination account number is required")
            .Length(9, 10)
            .WithMessage("Account number must be 9 or 10 digits")
            .Matches(@"^\d+$")
            .WithMessage("Account number must contain only digits");

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
