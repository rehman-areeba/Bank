using Asp.Versioning;
using Asp.Versioning.ApiExplorer;
using BankingApi.Data;
using BankingApi.Infrastructure;
using BankingApi.DTOs;
using BankingApi.HealthChecks;
using BankingApi.Middleware;
using BankingApi.Repositories;
using BankingApi.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using Swashbuckle.AspNetCore.Annotations;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ───────────────────────────────────────────────────────────────────
// Bootstrap from configuration so appsettings.{Environment}.json controls all
// sink/level settings without recompiling. The try/catch/finally ensures the
// logger is always flushed even if startup itself throws.
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{

// Skip Serilog in Test environment to avoid "logger already frozen" when
// WebApplicationFactory creates multiple app instances in the same process.
if (!builder.Environment.IsEnvironment("Test"))
{
    builder.Host.UseSerilog((ctx, services, config) =>
        config.ReadFrom.Configuration(ctx.Configuration)
              .ReadFrom.Services(services)
              .Enrich.FromLogContext());
}

// ── Configure Kestrel for dynamic PORT binding (Render, Azure, etc.) ──────────
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(int.Parse(port));
});

// ── Database (SQL Server) ────────────────────────────────────────────────────
// Connection string comes from configuration or environment variable:
// ConnectionStrings__DefaultConnection
builder.Services.AddDbContext<BankingDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpContextAccessor();

// ── Repositories & Unit of Work ───────────────────────────────────────────────
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IAuditRepository, AuditRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITransferService, TransferService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<INotificationService, EmailNotificationService>();
builder.Services.AddScoped<IScheduledPaymentService, ScheduledPaymentService>();
builder.Services.AddSingleton<BackgroundTransactionProcessor>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<BackgroundTransactionProcessor>());
// Register the interface so TransferService (and any future service) depends on
// the abstraction, not the concrete Channel-backed processor. Swapping to a
// Redis-backed queue later requires only a new registration here.
builder.Services.AddSingleton<INotificationQueue>(sp =>
    sp.GetRequiredService<BackgroundTransactionProcessor>());
builder.Services.AddHostedService<ScheduledPaymentProcessor>();

// ── Validators ────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IValidator<RegisterRequestDto>, RegisterRequestDtoValidator>();
builder.Services.AddScoped<IValidator<TransferRequestDto>, TransferRequestDtoValidator>();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Get allowed origins from configuration (supports multiple origins)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Allow all origins if none configured (for initial cloud deployment).
            // Set Cors__AllowedOrigins__0 in the Render dashboard to lock this down.
            if (builder.Environment.IsProduction())
                Log.Warning("CORS: Cors:AllowedOrigins is not configured — falling back to AllowAnyOrigin. " +
                            "Set Cors__AllowedOrigins__0 in the Render dashboard to restrict access.");

            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
    
    options.AddPolicy("Development", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── Authentication (JWT) ──────────────────────────────────────────────────────
// Register JWT bearer with placeholder parameters. The real key, issuer, and
// audience are applied by JwtBearerPostConfigureOptions below, which runs after
// the DI container is fully built — meaning WebApplicationFactory's
// ConfigureAppConfiguration overrides are already in IConfiguration by the time
// the options are first resolved. This is the correct ASP.NET Core pattern for
// options that depend on configuration that may be overridden by the host.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

// IPostConfigureOptions<T> is resolved lazily when the options are first
// requested (i.e. on the first authenticated HTTP request), not at startup.
// By that time WebApplicationFactory has already applied its
// ConfigureAppConfiguration additions, so IConfiguration contains the test key.
builder.Services.AddSingleton<IPostConfigureOptions<JwtBearerOptions>,
    JwtBearerOptionsConfigurator>();

builder.Services.AddAuthorization();

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Global policy: authenticated users get 500 req/min keyed by user ID;
// anonymous users get 100 req/min keyed by IP address.
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
    {
        var isAuthenticated = ctx.User.Identity?.IsAuthenticated ?? false;

        if (isAuthenticated)
        {
            var userId = ctx.User.Identity!.Name ?? ctx.User.Claims
                .FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? "authenticated";

            return RateLimitPartition.GetFixedWindowLimiter(userId, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit          = 500,
                Window               = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0
            });
        }

        var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit          = 100,
            Window               = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit           = 0
        });
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            success    = false,
            message    = "Too many requests. Please try again later.",
            errors     = Array.Empty<string>(),
            retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                ? (double?)retryAfter.TotalSeconds
                : null
        }, cancellationToken);
    };
});

// ── API Versioning ────────────────────────────────────────────────────────────
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion                   = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions                   = true;
    options.ApiVersionReader                    = new UrlSegmentApiVersionReader();
}).AddApiExplorer(options =>
{
    options.GroupNameFormat           = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// ── Swagger (only in Development and Staging) ─────────────────────────────────
if (!builder.Environment.IsProduction())
{
    builder.Services.AddEndpointsApiExplorer();
    // ConfigureSwaggerOptions is resolved after DI is built, avoiding BuildServiceProvider
    builder.Services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();
    builder.Services.AddSwaggerGen(options =>
    {
        options.OperationFilter<AuthorizeOperationFilter>();
        options.EnableAnnotations();

        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
            options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    });
}

// ── Response Compression ──────────────────────────────────────────────────────
// Brotli is preferred over gzip — it achieves 15–25 % better compression on
// JSON at the same CPU cost. The middleware negotiates via Accept-Encoding and
// falls back to gzip for clients that don't advertise br support.
//
// Fastest level is used deliberately: for a REST API the marginal size saving
// from Optimal is rarely worth the extra CPU time per request.
//
// MIME types: only compressible text-based formats are listed. Binary formats
// (images, audio, video) are already compressed and re-compressing them wastes
// CPU while making the payload slightly larger.
//
// EnableForHttps: compression over HTTPS is safe for API responses because
// BREACH/CRIME attacks require an attacker to inject chosen plaintext into the
// response body — not applicable to JSON API payloads that don't reflect
// user-controlled secrets verbatim.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = new[]
    {
        "application/json",
        "application/problem+json",
        "application/json; charset=utf-8",
        "text/plain",
        "text/html",
        "text/css",
        "text/javascript",
        "application/javascript",
        "application/xml",
        "text/xml",
        "image/svg+xml",
    };
});

builder.Services.Configure<BrotliCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);

builder.Services.Configure<GzipCompressionProviderOptions>(o =>
    o.Level = CompressionLevel.Fastest);

builder.Services.AddControllers();

// ── Output Caching ────────────────────────────────────────────────────────────
// User-scoped reads (account list, recent transactions) are identical for the
// same user within a short window. A 10-second cache cuts DB round-trips on
// dashboards that poll aggressively without affecting correctness for financial
// operations (transfers/deposits always bypass the cache via POST).
// The cache is keyed by the Authorization header so one user never sees
// another user's data.
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy("UserScoped", policy =>
        policy.Expire(TimeSpan.FromSeconds(10))
              .SetVaryByHeader("Authorization")
              .Tag("user-data"));
});

// ── Health Checks ─────────────────────────────────────────────────────────────
// /health  → liveness:  process is alive, no DB check (never restarts healthy pods)
// /ready   → readiness: DB is reachable, gates load-balancer traffic
builder.Services.AddHealthChecks()
    .AddCheck<SqlServerHealthCheck>("sql_server", tags: ["ready"]);

// ── Pipeline ──────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Response Compression ─────────────────────────────────────────────────────
// Must be first in the pipeline so it wraps the response stream before any
// other middleware writes to it. Placing it after middleware that writes
// headers (e.g. security headers) would compress those responses but miss
// the Content-Encoding header being set in time.
app.UseResponseCompression();

// ── Correlation ID ────────────────────────────────────────────────────────────
// Runs first so every subsequent middleware and log line carries CorrelationId.
app.UseMiddleware<CorrelationIdMiddleware>();

// Global exception handling
app.UseMiddleware<ExceptionMiddleware>();

// ── Security Headers ──────────────────────────────────────────────────────────
// Runs early so every response — including error responses from
// ExceptionMiddleware — carries the full set of security headers.
app.UseMiddleware<SecurityHeadersMiddleware>();

// Swagger (only in non-production)
if (!app.Environment.IsProduction())
{
    var apiVersionDescriptionProvider =
        app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        foreach (var description in apiVersionDescriptionProvider.ApiVersionDescriptions)
        {
            c.SwaggerEndpoint(
                $"/swagger/{description.GroupName}/swagger.json",
                $"Banking API {description.GroupName.ToUpperInvariant()}");
        }
        c.RoutePrefix = "swagger";
    });
}

// HTTPS redirection (DISABLED for Render - Render handles HTTPS at proxy level)
// Render terminates SSL at the load balancer and forwards HTTP to your app
// Enabling this causes infinite redirect loops on Render
// if (!app.Environment.IsDevelopment())
// {
//     app.UseHttpsRedirection();
// }

// ── Health Check Endpoints ────────────────────────────────────────────────────
// Liveness: always 200 while the process is running — no DB involved.
// Kubernetes/Render uses this to decide whether to restart the container.
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false,   // exclude all named checks — pure liveness
    ResponseWriter = HealthResponseWriter.WriteAsync
}).AllowAnonymous();

// Readiness: runs the SQL Server check — 200 only when DB is reachable.
// Load balancers use this to decide whether to route traffic to this instance.
app.MapHealthChecks("/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = HealthResponseWriter.WriteAsync
}).AllowAnonymous();

// CORS - use appropriate policy based on environment
var corsPolicy = app.Environment.IsDevelopment() ? "Development" : "AllowFrontend";
app.UseCors(corsPolicy);

// Authentication & Authorization must run before rate limiting so that
// ctx.User.Identity.IsAuthenticated is populated when the rate limiter
// partitions requests by user ID vs. IP address.
app.UseAuthentication();
app.UseAuthorization();

// Rate limiting — runs after auth so authenticated users get the higher
// 500 req/min limit keyed by user ID instead of the 100 req/min IP limit.
app.UseRateLimiter();

// Output cache sits after auth so the Authorization header is available for
// cache-key variation. Placing it before auth would cache unauthenticated
// responses and serve them to authenticated users.
app.UseOutputCache();

// ── Serilog Request Logging ───────────────────────────────────────────────────
if (!app.Environment.IsEnvironment("Test"))
{
    app.UseSerilogRequestLogging(opts =>
    {
        opts.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        opts.GetLevel = (ctx, elapsed, ex) =>
            ex is not null || ctx.Response.StatusCode >= 500
                ? LogEventLevel.Error
                : ctx.Response.StatusCode >= 400
                    ? LogEventLevel.Warning
                    : LogEventLevel.Information;
        opts.EnrichDiagnosticContext = (diag, ctx) =>
        {
            diag.Set("RequestHost", ctx.Request.Host.Value);
            diag.Set("UserAgent",   ctx.Request.Headers.UserAgent.ToString());
            if (ctx.Items["CorrelationId"] is string cid)
                diag.Set("CorrelationId", cid);
        };
    });
}

// Map controllers
app.MapControllers();

// Log startup information
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Banking API started on port {Port} in {Environment} mode",
    port, app.Environment.EnvironmentName);
logger.LogInformation("CORS Policy: {CorsPolicy}, Allowed Origins: {Origins}",
    corsPolicy, string.Join(", ", allowedOrigins));

app.Run();

}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Banking API failed to start");
}
finally
{
    Log.CloseAndFlush();
}

// Make Program class accessible for integration tests
public partial class Program { }
