# 🚀 Full-Stack Deployment Guide - Banking System

## ✅ Pre-Deployment Status

Both frontend and backend are **READY FOR CLOUD DEPLOYMENT**.

| Component | Status | Build | Configuration |
|-----------|--------|-------|---------------|
| **BankingApi** (.NET 8) | ✅ Ready | ✅ Success | ✅ Dynamic PORT, 0.0.0.0 binding |
| **banking-ui** (React) | ✅ Ready | ✅ Success | ✅ Centralized API config |

---

## 🎯 Deployment Strategy

### **Recommended Order**

1. **Deploy Backend First** → Get production API URL
2. **Configure Frontend** → Point to production API
3. **Deploy Frontend** → Get production frontend URL
4. **Update Backend CORS** → Allow frontend origin
5. **Test End-to-End** → Verify full functionality

---

## 📦 Backend Deployment (BankingApi)

### **Platform Options**

- **Render** (Recommended - Free tier available)
- **Azure App Service**
- **AWS Elastic Beanstalk**
- **Railway**
- **Fly.io**

### **Step 1: Prepare Database**

Choose a database provider:
- **Azure SQL Database** (Recommended for production)
- **AWS RDS SQL Server**
- **Render PostgreSQL** (if migrating from SQL Server)

Get connection string:
```
Server=<host>;Database=BankingDb;User Id=<user>;Password=<pass>;TrustServerCertificate=True
```

### **Step 2: Set Environment Variables**

Required variables for cloud platform:

```bash
# Database
ConnectionStrings__DefaultConnection="Server=<host>;Database=BankingDb;User Id=<user>;Password=<pass>;TrustServerCertificate=True"

# JWT (Generate secure key!)
Jwt__Key="<GENERATE-32-PLUS-CHARACTER-SECRET>"
Jwt__Issuer="BankingApi"
Jwt__Audience="BankingClient"
Jwt__ExpiryHours="24"

# CORS (Leave empty initially, update after frontend deployment)
Cors__AllowedOrigins__0=""

# Environment
ASPNETCORE_ENVIRONMENT="Production"

# Port (usually auto-set by platform)
PORT="8080"
```

### **Step 3: Deploy to Render**

#### **Option A: Using Render Dashboard**

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   ```
   Name: banking-api
   Environment: Docker
   Branch: main
   Build Command: dotnet publish -c Release -o out
   Start Command: dotnet out/BankingApi.dll
   ```
5. Add environment variables (from Step 2)
6. Click "Create Web Service"

#### **Option B: Using render.yaml**

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: banking-api
    env: docker
    buildCommand: dotnet publish BankingApi/BankingApi.csproj -c Release -o out
    startCommand: dotnet out/BankingApi.dll
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: ConnectionStrings__DefaultConnection
        sync: false  # Set in dashboard
      - key: Jwt__Key
        sync: false  # Set in dashboard
      - key: Jwt__Issuer
        value: BankingApi
      - key: Jwt__Audience
        value: BankingClient
      - key: Jwt__ExpiryHours
        value: 24
```

Push to GitHub and connect in Render dashboard.

### **Step 4: Run Database Migrations**

After deployment, run migrations:

```bash
# Connect to production database
dotnet ef database update --connection "<production-connection-string>"
```

Or use Render Shell:
```bash
# In Render dashboard → Shell
dotnet ef database update
```

### **Step 5: Verify Backend**

Test health endpoint:
```bash
curl https://your-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-08T...",
  "environment": "Production",
  "version": "1.0.0"
}
```

**Save your API URL**: `https://your-api.onrender.com`

---

## 🎨 Frontend Deployment (banking-ui)

### **Platform Options**

- **Vercel** (Recommended - Optimized for React)
- **Netlify**
- **Cloudflare Pages**
- **AWS S3 + CloudFront**

### **Step 1: Update Environment Variables**

Update `.env.production`:

```bash
VITE_API_URL=https://your-api.onrender.com
```

### **Step 2: Deploy to Vercel**

#### **Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd banking-ui
vercel --prod

# Set environment variable
vercel env add VITE_API_URL production
# Enter: https://your-api.onrender.com
```

#### **Option B: Using Vercel Dashboard**

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   ```
   Framework Preset: Vite
   Root Directory: banking-ui
   Build Command: npm run build
   Output Directory: dist
   ```
5. Add environment variable:
   ```
   Key: VITE_API_URL
   Value: https://your-api.onrender.com
   ```
6. Click "Deploy"

#### **Option C: Using vercel.json**

Create `banking-ui/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-api.onrender.com"
  }
}
```

### **Step 3: Deploy to Netlify (Alternative)**

#### **Using Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd banking-ui
netlify deploy --prod

# Set environment variable
netlify env:set VITE_API_URL https://your-api.onrender.com
```

#### **Using netlify.toml**

Create `banking-ui/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "https://your-api.onrender.com"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **Step 4: Verify Frontend**

Visit your deployed URL:
```
https://your-app.vercel.app
```

**Save your frontend URL**: `https://your-app.vercel.app`

---

## 🔗 Connect Frontend & Backend

### **Step 1: Update Backend CORS**

Update backend environment variables to allow frontend origin:

#### **On Render**

Go to your backend service → Environment → Add:

```bash
Cors__AllowedOrigins__0=https://your-app.vercel.app
```

Or update `appsettings.Production.json` and redeploy:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://your-app.vercel.app"
    ]
  }
}
```

#### **Multiple Frontend URLs**

If you have staging + production:

```bash
Cors__AllowedOrigins__0=https://your-app.vercel.app
Cors__AllowedOrigins__1=https://staging-your-app.vercel.app
```

### **Step 2: Redeploy Backend**

After updating CORS, redeploy the backend service.

---

## 🧪 End-to-End Testing

### **1. Test Health Endpoint**

```bash
curl https://your-api.onrender.com/health
```

### **2. Test Registration**

```bash
curl -X POST https://your-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'
```

### **3. Test Frontend**

1. Open `https://your-app.vercel.app`
2. Register a new account
3. Login
4. Create an account
5. Make a transfer
6. Check transaction history

### **4. Check Browser Console**

Should see:
```
[App Config] { apiUrl: 'https://your-api.onrender.com', mode: 'production' }
```

---

## 🔒 Security Checklist

### **Backend**

- [ ] Strong JWT secret key (32+ characters)
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] CORS restricted to frontend origin only
- [ ] Database connection string in secrets/environment variables
- [ ] Rate limiting enabled
- [ ] Swagger disabled in production
- [ ] SQL Server authentication (not Windows auth)

### **Frontend**

- [ ] API URL points to HTTPS backend
- [ ] No sensitive data in localStorage (only JWT token)
- [ ] Environment variables set correctly
- [ ] Build artifacts don't contain secrets
- [ ] HTTPS enforced (automatic on Vercel/Netlify)

### **Database**

- [ ] Strong database password
- [ ] Firewall rules configured
- [ ] SSL/TLS connection enabled
- [ ] Regular backups configured
- [ ] Access restricted to backend IP only

---

## 📊 Monitoring & Maintenance

### **Backend Monitoring**

- **Render**: Built-in logs and metrics
- **Azure**: Application Insights
- **AWS**: CloudWatch

### **Frontend Monitoring**

- **Vercel**: Analytics dashboard
- **Netlify**: Analytics and logs

### **Database Monitoring**

- Check connection pool usage
- Monitor query performance
- Set up automated backups
- Configure alerts for failures

---

## 🐛 Troubleshooting

### **CORS Errors**

**Symptom**: Frontend shows "CORS policy" error

**Solution**:
1. Verify backend `Cors__AllowedOrigins__0` matches frontend URL exactly
2. Include protocol (`https://`) and no trailing slash
3. Redeploy backend after CORS changes

### **401 Unauthorized**

**Symptom**: All API calls return 401

**Solution**:
1. Check JWT token in localStorage
2. Verify `Jwt__Key` is set in backend
3. Check token expiry (24 hours default)

### **Connection Refused**

**Symptom**: "Cannot connect to server"

**Solution**:
1. Verify backend is running: `curl https://your-api.onrender.com/health`
2. Check `VITE_API_URL` in frontend environment variables
3. Rebuild frontend after changing environment variables

### **Database Connection Failed**

**Symptom**: Backend logs show database errors

**Solution**:
1. Verify connection string format
2. Check database firewall allows backend IP
3. Ensure database is running
4. Test connection string locally first

---

## 💰 Cost Estimates

### **Free Tier Options**

| Service | Provider | Limits |
|---------|----------|--------|
| Backend | Render Free | 750 hours/month, sleeps after 15min inactivity |
| Frontend | Vercel Free | Unlimited bandwidth, 100GB/month |
| Database | Azure SQL Free | 32MB storage (very limited) |
| Database | Render PostgreSQL | 1GB storage, 90 days retention |

### **Paid Tier (Recommended for Production)**

| Service | Provider | Cost |
|---------|----------|------|
| Backend | Render Starter | $7/month |
| Frontend | Vercel Pro | $20/month |
| Database | Azure SQL Basic | $5/month |

**Total**: ~$32/month for production-ready setup

---

## 📝 Deployment Summary

### **What Was Done**

✅ **Backend (BankingApi)**
- Fixed NuGet package versions (10.x → 8.x)
- Fixed compilation error in TransactionRepository
- Verified dynamic PORT binding (0.0.0.0)
- Confirmed CORS configuration
- Verified Release build succeeds

✅ **Frontend (banking-ui)**
- Verified centralized API configuration
- Fixed hardcoded localhost in NetworkError component
- Confirmed all API calls use axiosClient
- Verified production build succeeds

### **Deployment URLs**

After deployment, you'll have:

```
Backend:  https://banking-api.onrender.com
Frontend: https://banking-app.vercel.app
Database: <cloud-provider-connection-string>
```

### **Environment Variables Summary**

**Backend**:
```bash
ConnectionStrings__DefaultConnection=<db-connection-string>
Jwt__Key=<32-char-secret>
Cors__AllowedOrigins__0=https://banking-app.vercel.app
ASPNETCORE_ENVIRONMENT=Production
```

**Frontend**:
```bash
VITE_API_URL=https://banking-api.onrender.com
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads without console errors
- [ ] User can register a new account
- [ ] User can login and receive JWT token
- [ ] User can create bank accounts
- [ ] User can make transfers
- [ ] Transaction history displays correctly
- [ ] Admin features work (if applicable)
- [ ] CORS allows frontend requests
- [ ] HTTPS is enforced on both frontend and backend

---

## 📚 Additional Resources

- [BankingApi Deployment Guide](../CLOUD_DEPLOYMENT_READY.md)
- [Frontend API Analysis](./FRONTEND_API_ANALYSIS.md)
- [Environment Variables Reference](../BankingApi/ENV_VARIABLES_DEPLOYMENT.md)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Generated**: 2025-01-08  
**Status**: ✅ Ready for Production Deployment  
**Estimated Deployment Time**: 30-45 minutes
