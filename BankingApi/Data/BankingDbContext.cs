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
        // Only configure if not already configured (allows testing with InMemory DB)
        if (!optionsBuilder.IsConfigured)
            optionsBuilder.UseSqlServer(_configuration.GetConnectionString("DefaultConnection"));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ────────────────────────────────────────────────────────────────────────
        // Account Entity Configuration
        // ────────────────────────────────────────────────────────────────────────
        modelBuilder.Entity<Account>(entity =>
        {
            entity.Property(a => a.Balance)
                  .HasPrecision(18, 2);

            entity.Property(a => a.RowVersion)
                  .IsRowVersion();

            // Guard relational-only APIs: HasCheckConstraint uses SQL Server syntax
            // and throws on the InMemory provider used in tests.
            if (Database.IsRelational())
                entity.ToTable(t => t.HasCheckConstraint("CK_Account_Balance", "[Balance] >= 0"));

            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.AccountNumber).IsUnique();
        });

        // ────────────────────────────────────────────────────────────────────────
        // Transaction Entity Configuration
        // ────────────────────────────────────────────────────────────────────────
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

        // ────────────────────────────────────────────────────────────────────────
        // AuditLog Entity Configuration
        // ────────────────────────────────────────────────────────────────────────
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(a => a.Amount)
                  .HasPrecision(18, 2);

            // Guard relational-only API: HasTrigger is SQL Server-specific and
            // throws on the InMemory provider used in tests.
            if (Database.IsRelational())
                entity.ToTable(t => t.HasTrigger("TR_AuditLog_NoUpdate"));
        });

        // ────────────────────────────────────────────────────────────────────────
        // User Entity Configuration
        // ────────────────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            // Unique constraint: one account per email address.
            // This is the database-level guarantee that backs the application-level
            // duplicate-email check in AuthService.RegisterAsync. Even if two
            // concurrent requests both pass the application check, SQL Server will
            // reject the second INSERT with a unique constraint violation, which
            // AuthService catches and converts to a clean InvalidOperationException.
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // SQL Server maps DateTime to datetime2 by default — no override needed.
    }
}
