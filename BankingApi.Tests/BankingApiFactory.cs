using BankingApi.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace BankingApi.Tests;

public class BankingApiFactory : WebApplicationFactory<Program>
{
    // Each factory instance gets its own isolated database name so test
    // classes that share a factory via IClassFixture never see each other's data.
    private readonly string _dbName = $"BankingTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Replace Serilog with the standard test logger to avoid
        // "The logger is already frozen" when WebApplicationFactory
        // re-enters Program.cs for a second test class in the same run.
        // The static Log.Logger bootstrap logger is frozen after the first
        // UseSerilog call; subsequent calls throw InvalidOperationException.
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
        });

        builder.UseEnvironment("Test");

        // Supply a test JWT key via ConfigureAppConfiguration so AuthService can
        // sign tokens during tests. This runs before builder.Build() in the
        // minimal hosting model, making the key available to IConfiguration at
        // runtime without touching environment variables or static state.
        builder.ConfigureAppConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"]      = "test-only-secret-key-min-32-characters-long!",
                ["Jwt:Issuer"]   = "BankingApi",
                ["Jwt:Audience"] = "BankingClient"
            });
        });

        builder.ConfigureServices(services =>
        {
            // AddDbContext<T> in EF Core 9 registers four service types.
            // ALL four must be removed before re-adding with a different provider,
            // otherwise EF Core throws "two database providers registered".
            //
            // 1. DbContextOptions<BankingDbContext>  — typed options
            // 2. DbContextOptions                    — non-generic base options
            // 3. BankingDbContext                    — the context itself
            // 4. IDbContextOptionsConfiguration<T>  — the provider configuration action
            //
            // RemoveAll<T>() removes every descriptor for that service type,
            // which is safer than SingleOrDefault + Remove when multiple
            // descriptors exist (e.g. from multiple AddDbContext calls).
            services.RemoveAll<DbContextOptions<BankingDbContext>>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<BankingDbContext>();
            services.RemoveAll(typeof(IDbContextOptionsConfiguration<BankingDbContext>));

            // Register InMemory as the sole EF Core provider for tests.
            // Each factory instance gets its own named database so test classes
            // running in parallel never share state.
            services.AddDbContext<BankingDbContext>(options =>
                options.UseInMemoryDatabase(_dbName)
                       .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning)));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
    }

    public BankingDbContext CreateDbContext()
    {
        var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BankingDbContext>();
        db.Database.EnsureCreated();
        return db;
    }
}
