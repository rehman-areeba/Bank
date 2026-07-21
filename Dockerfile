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

# ── Stage 5: runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

COPY --from=publish --chown=appuser:appgroup /app/publish .
COPY --from=migrate --chown=appuser:appgroup /app/efbundle ./efbundle

USER appuser

EXPOSE 5000

ENTRYPOINT ["dotnet", "BankingApi.dll"]

# ── Stage 6: migrations runner ────────────────────────────────────────────────
# Separate image used only by the db-migrate compose service.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS migrator
WORKDIR /app
COPY --from=migrate /app/efbundle ./efbundle
RUN chmod +x ./efbundle
ENTRYPOINT ["./efbundle"]
