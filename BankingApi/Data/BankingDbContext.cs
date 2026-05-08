using BankingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApi.Data;

public class BankingDbContext(DbContextOptions<BankingDbContext> options, IConfiguration configuration)
    : DbContext(options)
{
    private readonly IConfiguration _configuration = configuration;

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ScheduledPayment> ScheduledPayments => Set<ScheduledPayment>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
            optionsBuilder.UseSqlServer(_configuration.GetConnectionString("DefaultConnection"));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Account>(entity =>
        {
            entity.Property(a => a.Balance)
                  .HasPrecision(18, 2);

            entity.Property(a => a.RowVersion)
                  .IsRowVersion()
                  .IsConcurrencyToken();

            entity.ToTable(t => t.HasCheckConstraint("CK_Account_Balance", "[Balance] >= 0"));

            entity.HasIndex(a => a.UserId);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.Property(t => t.Amount)
                  .HasPrecision(18, 2);

            entity.HasIndex(t => t.CreatedAt);

            entity.HasOne(t => t.FromAccount)
                  .WithMany(a => a.TransactionsFrom)
                  .HasForeignKey(t => t.FromAccountId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.ToAccount)
                  .WithMany(a => a.TransactionsTo)
                  .HasForeignKey(t => t.ToAccountId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(a => a.Amount)
                  .HasPrecision(18, 2);

            entity.ToTable(t => t.HasTrigger("TR_AuditLog_NoUpdate"));
        });
    }
}
