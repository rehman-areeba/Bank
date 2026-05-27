# 🚀 Production Deployment Guide - Banking System

This guide provides complete instructions for deploying the Banking System full-stack application to production.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│   Frontend (Vercel)                 │
│   React + TypeScript + Vite         │
│   https://your-app.vercel.app       │
└──────────────┬──────────────────────┘
               │ HTTPS + JWT
┌──────────────▼──────────────────────┐
│   Backend (Render)                  │
│   ASP.NET Core 8 Web API            │
│   https://your-api.onrender.com     │
└──────────────┬──────────────────────┘
               │ SQL Connection
┌──────────────▼──────────────────────┐
│   Database (Render PostgreSQL       │
│   or Azure SQL Database)            │
└─────────────────────────────────────┘
```

---

## ✅ Prerequisites

### Required Accounts
- [x] GitHub account (for repository and CI/CD)
- [x] Render account (for backend hosting) - https://render.com
- [x] Vercel account (for frontend hosting) - https://vercel.com
- [x] Database provider (Render PostgreSQL or Azure SQL)

### Required Tools
- [x] Git
- [x] .NET 8 SDK (for local testing)
- [x] Node.js 18+ (for local testing)
- [x] Vercel CLI: `npm install -g vercel`

---

## 🔧 Backend Deployment (Render)

### Step 1: Create Database

#### Option A: Render PostgreSQL (Recommended for Free Tier)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name**: `banking-db`
   - **Database**: `bankingdb`
   - **User**: `bankinguser`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

#### Option B: Azure SQL Database

1. Create Azure SQL Database
2. Get connection string in format:
   ```
   Server=tcp:yourserver.database.windows.net,1433;Initial Catalog=BankingDb;Persist Security Info=False;User ID=yourusername;Password=yourpassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `banking-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `.` if needed)
   - **Runtime**: `.NET`
   - **Build Command**: `dotnet publish BankingApi/BankingApi.csproj -c Release -o out`
   - **Start Command**: `dotnet out/BankingApi.dll`
   - **Plan**: Free (or paid for production)

### Step 3: Configure Environment Variables on Render

Add these environment variables in Render dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` | Required |
| `ASPNETCORE_URLS` | `http://0.0.0.0:$PORT` | Required for Render |
| `ConnectionStrings__DefaultConnection` | `[Your database connection string]` | From Step 1 |
| `Jwt__Key` | `[Generate 32+ char random string]` | Use password generator |
| `Jwt__Issuer` | `BankingApi` | Required |
| `Jwt__Audience` | `BankingClient` | Required |
| `Jwt__ExpiryHours` | `24` | Token expiry time |
| `Cors__AllowedOrigins__0` | `https://your-app.vercel.app` | Add after Vercel deployment |
| `Transfer__DailyLimit` | `50000` | Optional |

**Generate JWT Key:**
```bash
# Use this command to generate a secure key
openssl rand -base64 32
```

### Step 4: Deploy Backend

1. Click **Create Web Service**
2. Render will automatically:
   - Clone your repository
   - Run build command
   - Start the application
3. Monitor deployment logs
4. Once deployed, note your API URL: `https://banking-api-xxxx.onrender.com`

### Step 5: Run Database Migrations

**Option 1: Using Render Shell**
```bash
# In Render dashboard, go to Shell tab
dotnet ef database update --project BankingApi
```

**Option 2: Using Local Machine**
```bash
# Set connection string temporarily
export ConnectionStrings__DefaultConnection="[Your production DB connection string]"
cd BankingApi
dotnet ef database update
```

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Link Project to Vercel

```bash
cd banking-ui
vercel login
vercel link
```

This creates `.vercel/project.json` with your project IDs.

### Step 3: Configure Environment Variables on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://banking-api-xxxx.onrender.com` | Production |

**Important:** Use your actual Render API URL from backend deployment.

### Step 4: Deploy Frontend

**Option 1: Automatic (via GitHub Actions)**
```bash
# Just push to main branch
git push origin main
```

**Option 2: Manual (via Vercel CLI)**
```bash
cd banking-ui
vercel --prod
```

### Step 5: Update Backend CORS

After frontend is deployed:

1. Go to Render dashboard → Your web service
2. Update environment variable:
   - `Cors__AllowedOrigins__0` = `https://your-actual-app.vercel.app`
3. Trigger redeploy (or it will auto-redeploy)

---

## 🔐 Environment Variables Reference

### Backend (Render)

```bash
# Required
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
ConnectionStrings__DefaultConnection=Server=...;Database=BankingDb;...
Jwt__Key=your-32-character-secret-key-here
Jwt__Issuer=BankingApi
Jwt__Audience=BankingClient
Jwt__ExpiryHours=24

# CORS (add after frontend deployment)
Cors__AllowedOrigins__0=https://your-app.vercel.app

# Optional
Transfer__DailyLimit=50000
```

### Frontend (Vercel)

```bash
# Required
VITE_API_URL=https://your-api.onrender.com
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

The repository includes 4 workflows:

1. **`backend.yml`** - Backend CI (build, test, security scan)
2. **`frontend.yml`** - Frontend CI (build, lint, type check)
3. **`vercel-deploy.yml`** - Frontend deployment to Vercel
4. **`deploy-production.yml`** - Full-stack deployment orchestration

### Required GitHub Secrets

Add these secrets in **Settings** → **Secrets and variables** → **Actions**:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | From `.vercel/project.json` |

**Get Vercel IDs:**
```bash
cd banking-ui
vercel link
cat .vercel/project.json
```

### Automatic Deployment Flow

```
Push to main
    ↓
GitHub Actions triggered
    ↓
├─→ Backend: Build → Test → Render auto-deploys
└─→ Frontend: Build → TypeScript check → Deploy to Vercel
    ↓
Deployment complete
```

---

## ✅ Post-Deployment Verification

### 1. Check Backend Health

```bash
curl https://your-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "Production",
  "version": "1.0.0"
}
```

### 2. Check Frontend

Visit: `https://your-app.vercel.app`

- [ ] Page loads without errors
- [ ] Login page displays correctly
- [ ] Dark mode toggle works

### 3. Test API Connectivity

1. Open browser console on frontend
2. Try to register/login
3. Check Network tab for API calls
4. Verify no CORS errors

### 4. Test Full Flow

- [ ] Register new user
- [ ] Login successfully
- [ ] Create account
- [ ] Make deposit
- [ ] Transfer funds
- [ ] View transaction history

---

## 🐛 Troubleshooting

### Backend Issues

#### Build Fails on Render

**Error:** `Build failed with exit code 1`

**Solutions:**
```bash
# Check .NET version in BankingApi.csproj
<TargetFramework>net8.0</TargetFramework>

# Verify build command
dotnet publish BankingApi/BankingApi.csproj -c Release -o out
```

#### Database Connection Fails

**Error:** `Cannot connect to database`

**Solutions:**
1. Verify connection string format
2. Check database is running
3. Verify firewall rules allow Render IP
4. For PostgreSQL, use Internal Database URL

#### Application Crashes on Startup

**Error:** `Application failed to start`

**Check:**
```bash
# View logs in Render dashboard
# Common issues:
- Missing environment variables
- Invalid JWT key
- Database migration not run
```

### Frontend Issues

#### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solutions:**
1. Verify `Cors__AllowedOrigins__0` in Render matches Vercel URL exactly
2. Include protocol: `https://` not `http://`
3. No trailing slash: `https://app.vercel.app` not `https://app.vercel.app/`
4. Redeploy backend after CORS change

#### API Calls Fail

**Error:** `Network Error` or `404 Not Found`

**Solutions:**
1. Verify `VITE_API_URL` in Vercel environment variables
2. Check backend is deployed and healthy
3. Verify API URL format: `https://your-api.onrender.com` (no `/api`)
4. Redeploy frontend after environment variable change

#### Build Fails on Vercel

**Error:** `Build failed`

**Solutions:**
```bash
# Test build locally first
cd banking-ui
npm ci
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify environment variables are set in Vercel
```

### Database Migration Issues

#### Migrations Not Applied

**Error:** `Table 'Users' doesn't exist`

**Solutions:**
```bash
# Option 1: Run from local machine
export ConnectionStrings__DefaultConnection="[Production DB]"
cd BankingApi
dotnet ef database update

# Option 2: Use Render Shell
# In Render dashboard → Shell tab
cd BankingApi
dotnet ef database update

# Option 3: Generate SQL script and run manually
dotnet ef migrations script -o migration.sql
# Then run migration.sql in database client
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Use strong JWT secret key (32+ characters)
- [ ] Enable HTTPS only (Render and Vercel do this automatically)
- [ ] Verify CORS allows only your frontend domain
- [ ] Review and limit database access
- [ ] Enable rate limiting (already configured)
- [ ] Set up monitoring and alerts
- [ ] Review audit logs regularly
- [ ] Keep dependencies updated
- [ ] Enable database backups

---

## 📊 Monitoring

### Render Monitoring

- **Logs**: Dashboard → Your service → Logs tab
- **Metrics**: Dashboard → Your service → Metrics tab
- **Alerts**: Set up email alerts for downtime

### Vercel Monitoring

- **Analytics**: Dashboard → Your project → Analytics
- **Logs**: Dashboard → Your project → Deployments → View logs
- **Speed Insights**: Enable in project settings

### Application Monitoring

- **Health Endpoint**: `https://your-api.onrender.com/health`
- **Uptime Monitoring**: Use UptimeRobot or similar
- **Error Tracking**: Consider Sentry integration

---

## 🔄 Rollback Procedure

### Backend Rollback (Render)

1. Go to Render dashboard
2. Select your web service
3. Go to **Events** tab
4. Find previous successful deployment
5. Click **Rollback to this version**

### Frontend Rollback (Vercel)

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

Or use Vercel dashboard:
1. Go to Deployments
2. Find previous deployment
3. Click **Promote to Production**

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [ASP.NET Core Deployment](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

## 🎯 Quick Commands Reference

```bash
# Backend - Test locally
cd BankingApi
dotnet run

# Frontend - Test locally
cd banking-ui
npm run dev

# Backend - Build for production
dotnet publish BankingApi/BankingApi.csproj -c Release -o out

# Frontend - Build for production
cd banking-ui
npm run build

# Deploy frontend to Vercel
cd banking-ui
vercel --prod

# Check backend health
curl https://your-api.onrender.com/health

# View Render logs
# Use Render dashboard → Logs tab

# View Vercel logs
vercel logs
```

---

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review deployment logs
3. Check GitHub Actions workflow runs
4. Verify all environment variables are set correctly
5. Test locally to isolate the issue

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0
