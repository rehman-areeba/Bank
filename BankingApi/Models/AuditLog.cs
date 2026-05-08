using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BankingApi.Models;

public class AuditLog
{
    [Key]
    public Guid Id { get; init; }

    [Required]
    public Guid UserId { get; init; }

    public Guid? TransactionId { get; init; }

    [Required]
    [MaxLength(100)]
    public string Action { get; init; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Amount { get; init; }

    [Required]
    [MaxLength(20)]
    public string Status { get; init; } = string.Empty;

    [MaxLength(45)]
    public string? IpAddress { get; init; }

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public User User { get; init; } = null!;

    [ForeignKey(nameof(TransactionId))]
    public Transaction? Transaction { get; init; }
}
