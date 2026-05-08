using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BankingApi.Models;

public class ScheduledPayment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid AccountId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(20)]
    public string RecipientAccount { get; set; } = string.Empty;

    [Required]
    public int FrequencyDays { get; set; }

    [Required]
    public DateTime NextRunDate { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(AccountId))]
    public Account Account { get; set; } = null!;
}
