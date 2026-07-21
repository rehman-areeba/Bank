# ✅ Pre-Deployment Checklist - BankingApi on Render

## 📋 Before You Deploy

Use this checklist to ensure everything is ready for deployment.

---

## 1️⃣ File Structure Verification

### Check File Locations

- [ ] `Dockerfile` is at **repository root** (not inside BankingApi/)
- [ ] `.dockerignore` is at **repository root**
- [ ] `render.yaml` is at **repository root**
- [ ] `BankingApi/` folder exists at repository root
- [ ] `BankingApi/BankingApi.csproj` exists
- [ ] `BankingApi/Program.cs` exists

**How to Verify**:
```bash
cd Bank
ls -la Dockerfile .dockerignore render.yaml
ls -la BankingApi/BankingApi.csproj
```

**Expected Output**:
```
Dockerfile
.dockerignore
render.yaml
BankingApi/BankingApi.csproj
```

---

## 2️⃣ Code Verification

### Check Program.cs

- [ ] Program.cs reads `PORT` environment variable
- [ ] Program.cs uses `ListenAnyIP()` for 0.0.0.0 binding
- [ ] HTTPS redirection is **disabled** (commented out)
- [ ] Health check endpoint exists at `/health`
- [ ] CORS is configured

**How to Verify**:
```bash
# Check for PORT reading:
grep "Environment.GetEnvironmentVariable(\"PORT\")" BankingApi/Program.cs

# Check for ListenAnyIP:
grep "ListenAnyIP" BankingApi/Program.cs

# Check HTTPS redirection is disabled:
grep "UseHttpsRedirection" BankingApi/Program.cs
# Should be commented out: // app.UseHttpsRedirection();

# Check health endpoint:
grep "/health" BankingApi/Program.cs
```

### Check Dockerfile

- [ ] Dockerfile uses multi-stage build
- [ ] Dockerfile does NOT have hardcoded `ASPNETCORE_URLS`
- [ ] Dockerfile does NOT have hardcoded port in EXPOSE
- [ ] Dockerfile uses `mcr.microsoft.com/dotnet/aspnet:8.0` for runtime

**How to Verify**:
```bash
# Check for hardcoded ASPNETCORE_URLS:
grep "ASPNETCORE_URLS" Dockerfile
# Should NOT find: ENV ASPNETCORE_URLS=http://+:5000

# Check runtime image:
grep "FROM mcr.microsoft.com/dotnet/aspnet:8.0" Dockerfile
```

### Check render.yaml

- [ ] `runtime: docker` (NOT `env: dotnet`)
- [ ] `dockerfilePath: ./Dockerfile`
- [ ] `dockerContext: ./`
- [ ] `healthCheckPath: /health`
- [ ] Environment variables are defined

**How to Verify**:
```bash
# Check runtime:
grep "runtime: docker" render.yaml

# Check Dockerfile path:
grep "dockerfilePath" render.yaml
```

---

## 3️⃣ Database Setup

### Choose Database Option

- [ ] **Option A**: PostgreSQL on Render (Free)
  - [ ] Created PostgreSQL database on Render
  - [ ] Installed Npgsql package: `dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] Updated Program.cs: `UseSqlServer` → `UseNpgsql`
  - [ ] Got connection string from Render

- [ ] **Option B**: Azure SQL Database (Paid)
  - [ ] Created Azure SQL Database
  - [ ] Configured firewall to allow Render IPs
  - [ ] Got connection string from Azure Portal
  - [ ] No code changes needed

**Connection String Format**:

**PostgreSQL**:
```
postgresql://user:password@host:5432/database
```

**Azure SQL**:
```
Server=tcp:server.database.windows.net,1433;Initial Catalog=BankingDb;User ID=user;Password=pass;Encrypt=True;
```

---

## 4️⃣ Environment Variables Preparation

### Required Variables

- [ ] **ConnectionStrings__DefaultConnection**
  - Value: (your database connection string)
  - Ready to paste into Render Dashboard

- [ ] **Jwt__Key**
  - Option A: Let Render generate (click "Generate Value")
  - Option B: Generated manually (32+ characters)
  - Value: ________________________________

- [ ] **Jwt__Issuer**
  - Value: `BankingApi`

- [ ] **Jwt__Audience**
  - Value: `BankingClient`

- [ ] **Jwt__ExpiryHours**
  - Value: `24`

### Optional Variables (Set After Frontend Deployment)

- [ ] **Cors__AllowedOrigins__0**
  - Value: (leave empty for now)
  - Will set to: `https://your-frontend.vercel.app`

---

## 5️⃣ Git Repository

### Verify Git Status

- [ ] All changes are committed
- [ ] Changes are pushed to GitHub
- [ ] Repository is public or Render has access
- [ ] Default branch is `main` (or you know which branch to use)

**How to Verify**:
```bash
git status
# Should show: "nothing to commit, working tree clean"

git log -1
# Should show your latest commit

git remote -v
# Should show your GitHub repository URL
```

### Commit and Push

```bash
# If you have uncommitted changes:
git add Dockerfile .dockerignore render.yaml BankingApi/
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## 6️⃣ Render Account

### Account Setup

- [ ] Created Render account at https://render.com
- [ ] Connected GitHub account to Render
- [ ] Verified email address
- [ ] Render can access your repository

**How to Verify**:
- Login to Render Dashboard
- Click "New +" → "Web Service"
- You should see your GitHub repositories

---

## 7️⃣ Local Build Test

### Test Docker Build Locally (Optional but Recommended)

- [ ] Docker Desktop is installed
- [ ] Docker build succeeds locally
- [ ] Docker run succeeds locally

**How to Test**:
```bash
# Build Docker image:
docker build -t banking-api:test -f Dockerfile .

# Run container:
docker run -p 5000:5000 -e PORT=5000 banking-api:test

# Test health endpoint:
curl http://localhost:5000/health
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

---

## 8️⃣ Documentation Review

### Read These Guides

- [ ] Read [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)
- [ ] Read [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md)
- [ ] Read [RENDER_DEPLOYMENT_SUMMARY.md](./RENDER_DEPLOYMENT_SUMMARY.md)
- [ ] Understand [RENDER_ARCHITECTURE.md](./RENDER_ARCHITECTURE.md)

---

## 9️⃣ Deployment Plan

### Know Your Steps

- [ ] I know how to create a Web Service on Render
- [ ] I know where to set environment variables
- [ ] I know how to check deployment logs
- [ ] I know how to run database migrations
- [ ] I know how to test the deployed API

---

## 🔟 Backup Plan

### In Case of Issues

- [ ] I have access to Render logs
- [ ] I know how to rollback deployment
- [ ] I have database backup (if using existing data)
- [ ] I can revert Git commits if needed

---

## ✅ Final Verification

### All Systems Go?

- [ ] File structure is correct
- [ ] Code changes are verified
- [ ] Database is ready
- [ ] Environment variables are prepared
- [ ] Git repository is up to date
- [ ] Render account is set up
- [ ] Documentation is reviewed
- [ ] Deployment plan is clear

---

## 🚀 Ready to Deploy!

If all checkboxes are checked, you're ready to deploy!

### Next Steps:

1. **Go to Render Dashboard**: https://render.com/dashboard
2. **Click "New +" → "Web Service"**
3. **Follow**: [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)

---

## 📞 Quick Reference

### Important Files

| File | Location | Purpose |
|------|----------|---------|
| `Dockerfile` | Repository root | Builds Docker image |
| `.dockerignore` | Repository root | Excludes files from build |
| `render.yaml` | Repository root | Render configuration |
| `Program.cs` | BankingApi/ | App entry point |

### Important Settings

| Setting | Value |
|---------|-------|
| Runtime | `docker` |
| Dockerfile Path | `./Dockerfile` |
| Docker Context | `./` |
| Health Check | `/health` |
| Auto Deploy | `Yes` |

### Important Commands

```bash
# Build locally:
docker build -t banking-api:test -f Dockerfile .

# Run locally:
docker run -p 5000:5000 -e PORT=5000 banking-api:test

# Test health:
curl http://localhost:5000/health

# Check Git status:
git status

# Push to GitHub:
git push origin main
```

---

## 🐛 Common Pre-Deployment Issues

### Issue: "Dockerfile not found"

**Cause**: Dockerfile is not at repository root

**Fix**: Move Dockerfile to repository root
```bash
mv BankingApi/Dockerfile ./Dockerfile
```

### Issue: "Build fails - cannot find BankingApi.csproj"

**Cause**: Dockerfile COPY path is wrong

**Fix**: Verify Dockerfile has:
```dockerfile
COPY [\"BankingApi/BankingApi.csproj\", \"BankingApi/\"]
```

### Issue: "HTTPS redirection enabled"

**Cause**: Program.cs has `app.UseHttpsRedirection()`

**Fix**: Comment out HTTPS redirection:
```csharp
// app.UseHttpsRedirection();
```

### Issue: "No database connection string"

**Cause**: Forgot to prepare connection string

**Fix**: Create database first, then get connection string

---

## 📊 Deployment Timeline

**Estimated Time**: 15-30 minutes

| Step | Time | Description |
|------|------|-------------|
| Database Setup | 5-10 min | Create database, get connection string |
| Render Service Creation | 2 min | Create web service on Render |
| Environment Variables | 3 min | Set all required variables |
| First Deployment | 5-10 min | Render builds and deploys |
| Database Migrations | 2 min | Run migrations via Shell |
| Testing | 3 min | Test health and API endpoints |

---

## 🎯 Success Criteria

You'll know deployment succeeded when:

- [ ] Render Dashboard shows "Service is live" ✅
- [ ] Health endpoint returns 200 OK
- [ ] Logs show "Banking API started on port..."
- [ ] No errors in logs
- [ ] Registration endpoint works
- [ ] Login endpoint works

---

**Last Updated**: 2025-01-08  
**Status**: Ready for Deployment ✅  
**Deployment Method**: Docker on Render
