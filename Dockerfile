# ── Stage 1: restore ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src
COPY BankingApi/BankingApi.csproj BankingApi/
RUN dotnet restore BankingApi/BankingApi.csproj

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM restore AS build
COPY BankingApi/ BankingApi/
RUN dotnet build BankingApi/BankingApi.csproj -c Release --no-restore

# ── Stage 3: EF migrations bundle ─────────────────────────────────────────────
# Produces a self-contained binary that applies pending migrations and exits.
# No dotnet CLI or EF tools needed at runtime.
FROM build AS migrate
RUN dotnet tool install --global dotnet-ef --version 9.*
ENV PATH="$PATH:/root/.dotnet/tools"
RUN dotnet ef migrations bundle \
    --project BankingApi/BankingApi.csproj \
    --configuration Release \
    --self-contained \
    --output /app/efbundle

# ── Stage 4: publish ──────────────────────────────────────────────────────────
FROM build AS publish
RUN dotnet publish BankingApi/BankingApi.csproj \
    -c Release \
    -o /app/publish \
    --no-build

# ── Stage 5: migrations runner ────────────────────────────────────────────────
# Separate image used only by the db-migrate compose service.
# Must come BEFORE the runtime stage so that Render (which builds the last
# stage by default) builds the runtime image, not this one.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS migrator
WORKDIR /app
COPY --from=migrate /app/efbundle ./efbundle
RUN chmod +x ./efbundle
ENTRYPOINT ["./efbundle"]

# ── Stage 6: runtime ──────────────────────────────────────────────────────────
# THIS MUST BE THE LAST STAGE.
# Render builds the final stage of the Dockerfile when no target is specified.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN groupadd --system appgroup && useradd --system --no-create-home --gid appgroup appuser
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

COPY --from=publish --chown=appuser:appgroup /app/publish .
COPY --from=migrate --chown=appuser:appgroup /app/efbundle ./efbundle

USER appuser

# Render injects PORT at runtime (typically 10000 on free tier).
# Program.cs reads PORT via Environment.GetEnvironmentVariable("PORT")
# and calls ListenAnyIP(port), so the app binds to whatever Render assigns.
# EXPOSE is documentation only — Render's port scanner detects the open port
# automatically. Do NOT set ASPNETCORE_URLS; ConfigureKestrel takes precedence
# and ASPNETCORE_URLS would be silently ignored, causing confusion.
EXPOSE 10000

ENTRYPOINT ["dotnet", "BankingApi.dll"]
