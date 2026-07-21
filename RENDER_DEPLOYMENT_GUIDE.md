# 🚀 Complete Render Deployment Guide - BankingApi (Docker)

## 📁 File Structure (CRITICAL - Verify This First!)

```
Bank/                                    ← Repository root
├── Dockerfile                           ← MUST be here (root level)
├── .dockerignore                        ← MUST be here (root level)
├── render.yaml                          ← MUST be here (root level)
├── BankingApi/                          ← Your project folder
│   ├── BankingApi.csproj               ← Project file
│   ├── Program.cs                       ← Entry point
│   ├── Controllers/                     ← API controllers
│   ├── Models/                          ← Data models
│   ├── Services/                        ← Business logic
│   ├── Repositories/                    ← Data access
│   ├── Data/                            ← DbContext
│   ├── DTOs/                            ← Data transfer objects
│   ├── Middleware/                      ← Custom middleware
│   ├── appsettings.json                 ← Default config
│   └── appsettings.Production.json      ← Production config
└── banking-ui/                          ← Frontend (separate deployment)
```

**⚠️ CRITICAL**: Dockerfile, .dockerignore, and render.yaml MUST be at repository root!

---

## 🗄️ STEP 1: Setup Database (Choose One)

### Option A: Render PostgreSQL (Recommended for Free Tier)

**WHY**: Free tier available, managed by Render, automatic backups

1. **Create PostgreSQL Database**:
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `banking-db`
   - Database: `bankingdb`
   - User: `bankinguser`
   - Region: Same as your API (e.g., Oregon)
   - Plan: Free

2. **Get Connection String**:
   - After creation, go to database → Info
   - Copy **Internal Connection String** (faster, free)
   - Format: `postgresql://user:pass@host:5432/dbname`

3. **Update BankingApi for PostgreSQL**:

   **Install Npgsql Package**:
   ```bash
   cd BankingApi
   dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.11
   ```

   **Update Program.cs** (line 25):
   ```csharp
   // Replace this:
   builder.Services.AddDbContext<BankingDbContext>(options =>
       options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

   // With this:
   builder.Services.AddDbContext<BankingDbContext>(options =>
       options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
   ```

   **Update BankingDbContext.cs**:
   ```csharp
   // Add this method to BankingDbContext class:
   protected override void OnModelCreating(ModelBuilder modelBuilder)
   {
       base.OnModelCreating(modelBuilder);
       
       // PostgreSQL uses 'timestamp without time zone' instead of 'datetime2'
       foreach (var entityType in modelBuilder.Model.GetEntityTypes())
       {
           foreach (var property in entityType.GetProperties())
           {
               if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
               {
                   property.SetColumnType("timestamp without time zone");
               }
           }
       }
   }
   ```

### Option B: Azure SQL Database (Recommended for Production)

**WHY**: Full SQL Server compatibility, no code changes needed

1. **Create Azure SQL Database**:
   - Go to Azure Portal → Create SQL Database
   - Server: Create new or use existing
   - Database: `BankingDb`
   - Pricing: Basic ($5/month) or Standard

2. **Configure Firewall**:
   - SQL Server → Firewalls and virtual networks
   - Add rule: `AllowRender` with IP `0.0.0.0` - `255.255.255.255`
   - ⚠️ This allows all IPs - restrict after getting Render's IP

3. **Get Connection String**:
   ```
   Server=tcp:yourserver.database.windows.net,1433;
   Initial Catalog=BankingDb;
   Persist Security Info=False;
   User ID=yourusername;
   Password=yourpassword;
   MultipleActiveResultSets=False;
   Encrypt=True;
   TrustServerCertificate=False;
   Connection Timeout=30;
   ```

### Option C: Render SQL Server (Not Available)

**⚠️ Render does NOT support SQL Server**. Use PostgreSQL or external Azure SQL.

---

## 🚀 STEP 2: Deploy to Render

### Method 1: Using Render Dashboard (Recommended for Beginners)

1. **Login to Render**:
   - Go to https://render.com
   - Sign in with GitHub

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select repository: `Bank`

3. **Configure Service**:
   ```
   Name: banking-api
   Region: Oregon (or closest to you)
   Branch: main
   Runtime: Docker
   ```

4. **Docker Settings**:
   ```
   Dockerfile Path: ./Dockerfile
   Docker Context: ./
   Docker Command: (leave empty - uses ENTRYPOINT from Dockerfile)
   ```

5. **Instance Type**:
   ```
   Plan: Free (or Starter $7/month for always-on)
   ```

6. **Advanced Settings**:
   ```
   Health Check Path: /health
   Auto-Deploy: Yes
   ```

7. **Click "Create Web Service"** (Don't deploy yet!)

### Method 2: Using render.yaml (Automatic)

1. **Commit Files to Git**:
   ```bash
   git add Dockerfile .dockerignore render.yaml BankingApi/
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create Service from Blueprint**:
   - Render Dashboard → New → Blueprint
   - Connect repository
   - Render will detect `render.yaml` automatically
   - Click "Apply"

---

## 🔐 STEP 3: Configure Environment Variables

**⚠️ DO THIS BEFORE FIRST DEPLOYMENT!**

Go to: Render Dashboard → Your Service → Environment

### Required Variables:

#### 1. Database Connection String

**Key**: `ConnectionStrings__DefaultConnection`

**For PostgreSQL (Render)**:
```
postgresql://bankinguser:password@dpg-xxxxx-a.oregon-postgres.render.com/bankingdb
```

**For Azure SQL**:
```
Server=tcp:yourserver.database.windows.net,1433;Initial Catalog=BankingDb;User ID=yourusername;Password=yourpassword;Encrypt=True;TrustServerCertificate=False;
```

**How to Add**:
- Click "Add Environment Variable"
- Key: `ConnectionStrings__DefaultConnection`
- Value: (paste your connection string)
- Click "Save Changes"

#### 2. JWT Secret Key

**Key**: `Jwt__Key`

**Option A - Auto-Generate** (Recommended):
- Render Dashboard → Environment
- Click "Generate Value" button
- Render creates a secure random key

**Option B - Manual**:
```bash
# Generate on Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate on Linux/Mac:
openssl rand -base64 32
```

**How to Add**:
- Key: `Jwt__Key`
- Value: (paste generated key or click "Generate Value")

#### 3. JWT Configuration

**Key**: `Jwt__Issuer`  
**Value**: `BankingApi`

**Key**: `Jwt__Audience`  
**Value**: `BankingClient`

**Key**: `Jwt__ExpiryHours`  
**Value**: `24`

#### 4. CORS Configuration (Add After Frontend Deployment)

**Key**: `Cors__AllowedOrigins__0`  
**Value**: (leave empty for now)

**After deploying frontend**:
```
https://your-frontend.vercel.app
```

### Optional Variables:

**Key**: `ASPNETCORE_ENVIRONMENT`  
**Value**: `Production` (already set in render.yaml)

---

## 🗄️ STEP 4: Run Database Migrations

**⚠️ CRITICAL**: Do this AFTER first deployment succeeds!

### Method 1: Using Render Shell (Recommended)

1. **Wait for Deployment to Complete**:
   - Render Dashboard → Your Service → Logs
   - Wait for "Application started" message

2. **Open Shell**:
   - Render Dashboard → Your Service → Shell
   - Click "Launch Shell"

3. **Run Migrations**:
   ```bash
   # For PostgreSQL:
   dotnet ef database update --project /app/BankingApi.dll

   # If above fails, try:
   cd /app
   dotnet BankingApi.dll --migrate
   ```

### Method 2: Using Local Machine (Alternative)

1. **Update Connection String Locally**:
   ```bash
   # Windows PowerShell:
   $env:ConnectionStrings__DefaultConnection="your-render-db-connection-string"

   # Linux/Mac:
   export ConnectionStrings__DefaultConnection="your-render-db-connection-string"
   ```

2. **Run Migrations**:
   ```bash
   cd BankingApi
   dotnet ef database update
   ```

### Method 3: Add Migration Command to Dockerfile (Advanced)

**⚠️ Not recommended for production** - migrations should be manual

---

## ✅ STEP 5: Verify Deployment

### 1. Check Deployment Status

**Render Dashboard → Your Service → Events**

Look for:
```
✓ Build succeeded
✓ Deploy succeeded
✓ Service is live
```

### 2. Test Health Endpoint

```bash
curl https://your-app.onrender.com/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-08T12:34:56.789Z",
  "environment": "Production",
  "version": "1.0.0"
}
```

### 3. Test API Endpoints

**Register User**:
```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'
```

**Expected Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2025-01-09T12:34:56.789Z",
  "userId": "guid-here",
  "fullName": "Test User",
  "role": "Customer"
}
```

### 4. Check Logs

**Render Dashboard → Your Service → Logs**

Look for:
```
Banking API started on port 10000 in Production mode
CORS Policy: AllowFrontend, Allowed Origins: 
```

---

## 🐛 STEP 6: Troubleshooting Common Issues

### Issue 1: "Application failed to start"

**Symptoms**: Logs show "Exited with code 1"

**Causes & Solutions**:

1. **Missing Environment Variables**:
   ```
   Error: Jwt:Key is not configured
   ```
   **Fix**: Add `Jwt__Key` in Render Dashboard → Environment

2. **Database Connection Failed**:
   ```
   Error: Cannot connect to database
   ```
   **Fix**: 
   - Verify connection string is correct
   - Check database is running
   - For Azure SQL: Verify firewall allows Render IPs

3. **Port Binding Failed**:
   ```
   Error: Address already in use
   ```
   **Fix**: Ensure Program.cs reads `PORT` environment variable (already fixed)

### Issue 2: "Health check failed"

**Symptoms**: Render shows "Service unhealthy"

**Causes & Solutions**:

1. **Health Endpoint Not Responding**:
   ```bash
   # Test locally:
   curl http://localhost:5000/health
   ```
   **Fix**: Verify `/health` endpoint exists in Program.cs (already exists)

2. **App Crashed After Start**:
   - Check logs for exceptions
   - Common: Database migration needed

### Issue 3: "502 Bad Gateway"

**Symptoms**: API returns 502 error

**Causes & Solutions**:

1. **App Not Listening on Correct Port**:
   - Render sets `PORT` environment variable (e.g., 10000)
   - Your app must listen on that port
   - **Fix**: Already handled in Program.cs

2. **HTTPS Redirect Loop**:
   ```
   Error: Too many redirects
   ```
   **Fix**: Already disabled in Program.cs

### Issue 4: "CORS Error" (After Frontend Deployment)

**Symptoms**: Frontend shows "CORS policy blocked"

**Causes & Solutions**:

1. **Missing CORS Origin**:
   - Add frontend URL to `Cors__AllowedOrigins__0`
   - Example: `https://your-frontend.vercel.app`
   - **No trailing slash!**

2. **Wrong Protocol**:
   - Use `https://` not `http://`
   - Vercel/Netlify always use HTTPS

### Issue 5: "Database Migration Failed"

**Symptoms**: Logs show "Table does not exist"

**Causes & Solutions**:

1. **Migrations Not Run**:
   ```bash
   # Run migrations via Render Shell:
   dotnet ef database update
   ```

2. **Wrong Database Provider**:
   - If using PostgreSQL, ensure you installed Npgsql package
   - If using SQL Server, ensure connection string is correct

---

## 📊 STEP 7: Monitor Your Deployment

### Render Dashboard Metrics

**Render Dashboard → Your Service → Metrics**

Monitor:
- **CPU Usage**: Should be < 50% normally
- **Memory Usage**: Should be < 512MB for free tier
- **Response Time**: Should be < 500ms
- **Error Rate**: Should be 0%

### Logs

**Render Dashboard → Your Service → Logs**

Look for:
- ✅ "Application started"
- ✅ "Banking API started on port..."
- ❌ Any exceptions or errors

### Health Checks

Render automatically pings `/health` every 30 seconds.

If health check fails 3 times, Render restarts your service.

---

## 🔄 STEP 8: Update and Redeploy

### Automatic Deployment (Recommended)

1. **Make Changes Locally**:
   ```bash
   # Edit your code
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Render Auto-Deploys**:
   - Render detects push to `main` branch
   - Automatically rebuilds Docker image
   - Deploys new version
   - Zero-downtime deployment

### Manual Deployment

1. **Render Dashboard → Your Service**
2. **Click "Manual Deploy"**
3. **Select branch: main**
4. **Click "Deploy"**

---

## 🎯 STEP 9: Prepare for Frontend Deployment

### Get Your API URL

**Render Dashboard → Your Service**

Copy the URL:
```
https://banking-api-xxxx.onrender.com
```

### Update Frontend Environment Variable

**In your frontend project** (banking-ui):

**File**: `.env.production`
```env
VITE_API_URL=https://banking-api-xxxx.onrender.com
```

### Update Backend CORS

**After deploying frontend**, update CORS:

**Render Dashboard → Your Service → Environment**

**Key**: `Cors__AllowedOrigins__0`  
**Value**: `https://your-frontend.vercel.app`

**Click "Save Changes"** → Render will redeploy automatically

---

## 📋 Render Settings Reference

### Which Settings to Fill vs Leave Empty

| Setting | Value | Notes |
|---------|-------|-------|
| **Name** | `banking-api` | Your choice |
| **Region** | `Oregon` | Choose closest to users |
| **Branch** | `main` | Or your default branch |
| **Runtime** | `Docker` | CRITICAL: Must be Docker |
| **Dockerfile Path** | `./Dockerfile` | Relative to repo root |
| **Docker Context** | `./` | Repo root |
| **Docker Command** | (empty) | Uses ENTRYPOINT from Dockerfile |
| **Health Check Path** | `/health` | Must match your endpoint |
| **Auto-Deploy** | `Yes` | Deploy on git push |

### Environment Variables to Set

| Variable | Set When | Value |
|----------|----------|-------|
| `ConnectionStrings__DefaultConnection` | Before first deploy | Your database connection string |
| `Jwt__Key` | Before first deploy | Click "Generate Value" |
| `Jwt__Issuer` | Before first deploy | `BankingApi` |
| `Jwt__Audience` | Before first deploy | `BankingClient` |
| `Jwt__ExpiryHours` | Before first deploy | `24` |
| `Cors__AllowedOrigins__0` | After frontend deploy | `https://your-frontend.com` |
| `ASPNETCORE_ENVIRONMENT` | (auto-set) | `Production` |
| `PORT` | (auto-set by Render) | Don't set manually |

---

## 🎓 Understanding Render's Docker Deployment

### How Render Deploys Your Docker App

1. **Build Phase**:
   ```
   Render clones your repo
   → Finds Dockerfile at root
   → Runs: docker build -f ./Dockerfile -t app:latest ./
   → Creates Docker image
   ```

2. **Deploy Phase**:
   ```
   Render starts container
   → Sets PORT environment variable (e.g., 10000)
   → Runs: docker run -p 10000:10000 -e PORT=10000 app:latest
   → Your app reads PORT and listens on it
   ```

3. **Health Check**:
   ```
   Render pings: http://container:10000/health
   → If 200 OK: Service is healthy
   → If fails 3 times: Restart container
   ```

4. **Traffic Routing**:
   ```
   User requests: https://your-app.onrender.com
   → Render's load balancer (HTTPS)
   → Terminates SSL
   → Forwards HTTP to your container
   → Your app receives HTTP (not HTTPS)
   ```

### Why HTTPS Redirection Breaks on Render

```
User → HTTPS → Render Load Balancer → HTTP → Your App

If your app redirects HTTP → HTTPS:
Your App → HTTPS → Render Load Balancer → HTTP → Your App (loop!)
```

**Solution**: Disable HTTPS redirection (already done in Program.cs)

---

## 🔐 Security Best Practices

### 1. Never Commit Secrets

**❌ Don't**:
```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=prod.database.com;User=admin;Password=secret123"
  }
}
```

**✅ Do**:
```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  }
}
```

Set actual value in Render Dashboard → Environment

### 2. Use Strong JWT Keys

**❌ Don't**:
```
Jwt__Key=mysecretkey
```

**✅ Do**:
```
Jwt__Key=8x9K2mP5nQ7rT4vW6yZ1aC3eF8hJ0kM2oP5sU7wX9zA1bD4gH6jL9nQ2tV5yB8eF
```

Use Render's "Generate Value" button.

### 3. Restrict CORS

**❌ Don't** (in production):
```csharp
policy.AllowAnyOrigin()
```

**✅ Do**:
```csharp
policy.WithOrigins("https://your-frontend.vercel.app")
```

### 4. Use Environment-Specific Settings

**Development** (`appsettings.Development.json`):
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  }
}
```

**Production** (`appsettings.Production.json`):
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  }
}
```

---

## 📞 Getting Help

### Render Support

- **Documentation**: https://render.com/docs
- **Community**: https://community.render.com
- **Status**: https://status.render.com

### Check Logs First

**Render Dashboard → Your Service → Logs**

90% of issues are visible in logs:
- Missing environment variables
- Database connection errors
- Port binding issues
- Application exceptions

### Common Log Messages

**✅ Success**:
```
Banking API started on port 10000 in Production mode
Application started. Press Ctrl+C to shut down.
```

**❌ Error - Missing JWT Key**:
```
System.InvalidOperationException: Jwt:Key is not configured.
```
**Fix**: Add `Jwt__Key` in Environment

**❌ Error - Database Connection**:
```
Microsoft.Data.SqlClient.SqlException: Cannot connect to database
```
**Fix**: Check connection string

**❌ Error - Port Binding**:
```
System.IO.IOException: Failed to bind to address http://0.0.0.0:5000
```
**Fix**: Ensure Program.cs reads PORT env var (already fixed)

---

## ✅ Deployment Checklist

Before deploying, verify:

- [ ] Dockerfile is at repository root
- [ ] .dockerignore is at repository root
- [ ] render.yaml is at repository root
- [ ] Program.cs reads PORT environment variable
- [ ] HTTPS redirection is disabled
- [ ] Health check endpoint exists at /health
- [ ] Database is created (PostgreSQL or Azure SQL)
- [ ] Connection string is ready
- [ ] JWT key is generated
- [ ] All environment variables are documented

After deploying:

- [ ] Deployment succeeded (check Events)
- [ ] Health check passes (check Metrics)
- [ ] /health endpoint returns 200 OK
- [ ] Database migrations ran successfully
- [ ] Test registration endpoint works
- [ ] Test login endpoint works
- [ ] Logs show no errors
- [ ] API URL is saved for frontend

---

## 🎉 Success!

Your BankingApi is now deployed to Render!

**Next Steps**:
1. Deploy frontend (banking-ui) to Vercel
2. Update CORS with frontend URL
3. Test end-to-end functionality
4. Monitor logs and metrics
5. Setup custom domain (optional)

**Your API URL**:
```
https://banking-api-xxxx.onrender.com
```

**Health Check**:
```
https://banking-api-xxxx.onrender.com/health
```

**API Endpoints**:
```
POST /api/auth/register
POST /api/auth/login
GET  /api/accounts
POST /api/transfers
...
```

---

**Last Updated**: 2025-01-08  
**Render Version**: Docker  
**ASP.NET Core**: 8.0  
**Status**: Production Ready ✅
