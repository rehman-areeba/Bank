# BankingApi Production Deployment Guide

## 🎯 Overview

The BankingApi has been configured for production deployment on cloud platforms including Render, Azure App Service, and containerized environments.

---

## ✅ Changes Made for Production

### 1. Dynamic PORT Binding

**File:** `Program.cs`

**Changes:**
```csharp
// Reads PORT from environment variable (required by Render, Heroku, etc.)
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(int.Parse(port));
});
```

**Why:** Cloud platforms like Render dynamically assign ports. The application must bind to the PORT environment variable.

---

### 2. Configurable CORS

**File:** `Program.cs`

**Changes:**
```csharp
// Reads allowed origins from appsettings.json
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});
```

**File:** `appsettings.json`

**Added:**
```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173",
    "http://localhost:3000"
  ]
}
```

**Why:** Allows configuring frontend URLs per environment without code changes.

---

### 3. Environment-Specific Configuration

**File:** `Program.cs`

**Changes:**
- Swagger only enabled in Development/Staging (not Production)
- HTTPS redirection disabled in Development
- Environment-specific CORS policies
- Startup logging for debugging

**File:** `appsettings.Production.json`

**Updated:** Empty placeholders for environment variables

**Why:** Production should not expose Swagger, and configuration should come from environment variables.

---

### 4. Health Check Endpoint

**File:** `Program.cs`

**Added:**
```csharp
app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    environment = app.Environment.EnvironmentName,
    version = "1.0.0"
})).AllowAnonymous();
```

**Why:** Cloud platforms use health checks to monitor application status.

---

### 5. Removed Hardcoded URLs

**Before:**
- CORS: `http://localhost:5173` (hardcoded)
- Port: `5245` (hardcoded in launchSettings.json)

**After:**
- CORS: Configurable via `appsettings.json`
- Port: Dynamic via `PORT` environment variable

---

## 🚀 Deployment Options

### Option 1: Render.com (Recommended for Free Tier)

#### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** banking-api
   - **Environment:** Docker (or .NET)
   - **Build Command:** `dotnet publish BankingApi/BankingApi.csproj -c Release -o out`
   - **Start Command:** `dotnet out/BankingApi.dll`

#### Step 3: Set Environment Variables

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT

# Database (use Render PostgreSQL or external SQL Server)
ConnectionStrings__DefaultConnection=Server=YOUR_SERVER;Database=BankingDb;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True

# JWT Secret (generate a secure 32+ character string)
Jwt__Key=YOUR_SECURE_JWT_SECRET_KEY_MIN_32_CHARACTERS

# CORS (your frontend URL)
Cors__AllowedOrigins__0=https://your-frontend.onrender.com
Cors__AllowedOrigins__1=https://www.yourdomain.com
```

#### Step 4: Deploy
- Render automatically deploys on push to main branch
- Access your API at: `https://banking-api.onrender.com`
- Health check: `https://banking-api.onrender.com/health`

---

### Option 2: Azure App Service

#### Step 1: Create App Service
```bash
# Login to Azure
az login

# Create resource group
az group create --name BankingApiRG --location eastus

# Create App Service plan
az appservice plan create --name BankingApiPlan --resource-group BankingApiRG --sku B1 --is-linux

# Create web app
az webapp create --resource-group BankingApiRG --plan BankingApiPlan --name banking-api-app --runtime "DOTNET|8.0"
```

#### Step 2: Configure App Settings
```bash
# Set environment variables
az webapp config appsettings set --resource-group BankingApiRG --name banking-api-app --settings \
  ASPNETCORE_ENVIRONMENT=Production \
  ConnectionStrings__DefaultConnection="YOUR_CONNECTION_STRING" \
  Jwt__Key="YOUR_JWT_SECRET" \
  Cors__AllowedOrigins__0="https://your-frontend.azurewebsites.net"
```

#### Step 3: Deploy
```bash
# Publish locally
dotnet publish BankingApi/BankingApi.csproj -c Release -o ./publish

# Deploy to Azure
cd publish
zip -r ../deploy.zip .
az webapp deployment source config-zip --resource-group BankingApiRG --name banking-api-app --src ../deploy.zip
```

#### Step 4: Verify
- Access: `https://banking-api-app.azurewebsites.net`
- Health: `https://banking-api-app.azurewebsites.net/health`

---

### Option 3: Docker Container

#### Step 1: Build Image
```bash
# Build Docker image
docker build -t banking-api:latest .

# Test locally
docker run -p 5000:5000 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__DefaultConnection="YOUR_CONNECTION_STRING" \
  -e Jwt__Key="YOUR_JWT_SECRET" \
  -e Cors__AllowedOrigins__0="http://localhost:3000" \
  banking-api:latest
```

#### Step 2: Deploy to Container Registry
```bash
# Tag for Docker Hub
docker tag banking-api:latest yourusername/banking-api:latest

# Push to Docker Hub
docker push yourusername/banking-api:latest
```

#### Step 3: Deploy to Cloud
- **Azure Container Instances**
- **AWS ECS**
- **Google Cloud Run**
- **DigitalOcean App Platform**

---

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | Environment name | `Production` |
| `ConnectionStrings__DefaultConnection` | Database connection | `Server=...;Database=BankingDb;...` |
| `Jwt__Key` | JWT signing key (32+ chars) | `your-super-secret-key-min-32-chars` |
| `Cors__AllowedOrigins__0` | Frontend URL | `https://your-frontend.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to bind | `5000` |
| `Jwt__Issuer` | JWT issuer | `BankingApi` |
| `Jwt__Audience` | JWT audience | `BankingClient` |
| `Jwt__ExpiryHours` | Token expiry | `24` |
| `Transfer__DailyLimit` | Daily transfer limit | `50000` |

### Setting Array Values

For multiple CORS origins:
```bash
Cors__AllowedOrigins__0=https://frontend1.com
Cors__AllowedOrigins__1=https://frontend2.com
Cors__AllowedOrigins__2=https://frontend3.com
```

---

## 🗄️ Database Setup

### Option 1: Azure SQL Database

```bash
# Create SQL Server
az sql server create --name banking-sql-server --resource-group BankingApiRG --location eastus --admin-user sqladmin --admin-password YOUR_PASSWORD

# Create database
az sql db create --resource-group BankingApiRG --server banking-sql-server --name BankingDb --service-objective S0

# Get connection string
az sql db show-connection-string --client ado.net --name BankingDb --server banking-sql-server
```

### Option 2: Render PostgreSQL (Free Tier)

1. Create PostgreSQL database in Render
2. Get connection string
3. Update `BankingDbContext` to use PostgreSQL (requires Npgsql.EntityFrameworkCore.PostgreSQL)

### Option 3: External SQL Server

Use any SQL Server instance (on-premises or cloud) and provide connection string.

---

## 🔒 Security Checklist

### Before Deployment

- [ ] Generate strong JWT secret (32+ characters)
- [ ] Use secure database password
- [ ] Configure CORS with specific origins (no wildcards in production)
- [ ] Enable HTTPS
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Disable Swagger in production
- [ ] Review rate limiting settings
- [ ] Enable database connection encryption

### After Deployment

- [ ] Test health endpoint
- [ ] Verify CORS works with frontend
- [ ] Test authentication flow
- [ ] Check logs for errors
- [ ] Monitor performance
- [ ] Set up alerts

---

## 📊 Monitoring

### Health Check

```bash
curl https://your-api.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-27T12:00:00Z",
  "environment": "Production",
  "version": "1.0.0"
}
```

### Logs

**Render:**
- View logs in Render dashboard
- Real-time log streaming

**Azure:**
```bash
az webapp log tail --resource-group BankingApiRG --name banking-api-app
```

**Docker:**
```bash
docker logs <container-id>
```

---

## 🐛 Troubleshooting

### Issue: Application won't start

**Check:**
1. PORT environment variable is set
2. Database connection string is correct
3. JWT key is configured
4. Check logs for startup errors

### Issue: CORS errors

**Check:**
1. Frontend URL is in `Cors:AllowedOrigins`
2. URL includes protocol (http/https)
3. No trailing slashes in URLs
4. Credentials are enabled if using cookies

### Issue: Database connection fails

**Check:**
1. Connection string format is correct
2. Database server is accessible
3. Firewall rules allow connection
4. Credentials are correct

### Issue: 502 Bad Gateway

**Check:**
1. Application is listening on correct port
2. Health check endpoint responds
3. Application logs for errors
4. Memory/CPU limits not exceeded

---

## 🔄 CI/CD Integration

### GitHub Actions (Already Configured)

The existing `.github/workflows/backend.yml` can be extended for deployment:

```yaml
- name: Deploy to Render
  if: github.ref == 'refs/heads/main'
  run: |
    curl -X POST https://api.render.com/deploy/YOUR_DEPLOY_HOOK
```

### Automatic Deployments

**Render:**
- Automatically deploys on push to main
- Configure in Render dashboard

**Azure:**
- Set up GitHub Actions deployment
- Or use Azure DevOps pipelines

---

## 📝 Post-Deployment Checklist

- [ ] API is accessible at production URL
- [ ] Health endpoint returns 200 OK
- [ ] Swagger is NOT accessible (production)
- [ ] Frontend can connect to API
- [ ] Authentication works
- [ ] Database migrations applied
- [ ] CORS configured correctly
- [ ] HTTPS is enforced
- [ ] Logs are being generated
- [ ] Monitoring is set up

---

## 🆘 Support

### Common Commands

```bash
# Test health endpoint
curl https://your-api.com/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-api.com/api/accounts

# Check CORS
curl -H "Origin: https://your-frontend.com" -I https://your-api.com/health
```

### Resources

- [Render Documentation](https://render.com/docs)
- [Azure App Service Docs](https://docs.microsoft.com/en-us/azure/app-service/)
- [ASP.NET Core Deployment](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/)

---

**Last Updated:** 2026-05-27  
**Version:** 1.0.0
