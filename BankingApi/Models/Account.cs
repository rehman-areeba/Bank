using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BankingApi.Models;

public class Account
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(20)]
    public string AccountNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; }

    public bool IsActive { get; set; } = true;

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<Transaction> TransactionsFrom { get; set; } = new List<Transaction>();
    public ICollection<Transaction> TransactionsTo { get; set; } = new List<Transaction>();
    public ICollection<ScheduledPayment> ScheduledPayments { get; set; } = new List<ScheduledPayment>();
}
