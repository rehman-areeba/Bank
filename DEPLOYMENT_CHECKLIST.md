# ✅ Production Deployment Checklist

Use this checklist to deploy the Banking System to production.

---

## 📋 Pre-Deployment Setup

### 1. Create Accounts
- [ ] Create [Render](https://render.com) account
- [ ] Create [Vercel](https://vercel.com) account
- [ ] Verify GitHub repository is accessible

### 2. Install Tools
```bash
# Install Vercel CLI
npm install -g vercel

# Verify installations
vercel --version
dotnet --version
node --version
```

---

## 🗄️ Database Setup

### Option A: Render PostgreSQL (Recommended)
- [ ] Go to Render Dashboard → New → PostgreSQL
- [ ] Name: `banking-db`
- [ ] Region: Choose closest to users
- [ ] Plan: Free (or paid)
- [ ] Click "Create Database"
- [ ] Copy **Internal Database URL**

### Option B: Azure SQL Database
- [ ] Create Azure SQL Database
- [ ] Configure firewall rules
- [ ] Copy connection string

---

## 🔧 Backend Deployment (Render)

### 1. Create Web Service
- [ ] Render Dashboard → New → Web Service
- [ ] Connect GitHub repository
- [ ] Configure:
  - Name: `banking-api`
  - Branch: `main`
  - Runtime: `.NET`
  - Build Command: `dotnet publish BankingApi/BankingApi.csproj -c Release -o out`
  - Start Command: `dotnet out/BankingApi.dll`

### 2. Add Environment Variables

Copy these to Render → Environment tab:

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
ConnectionStrings__DefaultConnection=[PASTE_DB_CONNECTION_STRING]
Jwt__Key=[GENERATE_32_CHAR_SECRET]
Jwt__Issuer=BankingApi
Jwt__Audience=BankingClient
Jwt__ExpiryHours=24
Transfer__DailyLimit=50000
```

**Generate JWT Key:**
```bash
openssl rand -base64 32
```

- [ ] All environment variables added
- [ ] JWT key is 32+ characters
- [ ] Database connection string is correct

### 3. Deploy Backend
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Note your API URL: `https://banking-api-xxxx.onrender.com`
- [ ] Test health endpoint:
  ```bash
  curl https://banking-api-xxxx.onrender.com/health
  ```

### 4. Run Database Migrations

**Option 1: Local Machine**
```bash
export ConnectionStrings__DefaultConnection="[Production DB Connection]"
cd BankingApi
dotnet ef database update
```

**Option 2: Render Shell**
- [ ] Render Dashboard → Your Service → Shell tab
- [ ] Run: `cd BankingApi && dotnet ef database update`

---

## 🎨 Frontend Deployment (Vercel)

### 1. Link Project
```bash
cd banking-ui
vercel login
vercel link
```

- [ ] Project linked successfully
- [ ] Note IDs from `.vercel/project.json`

### 2. Add Environment Variables

Vercel Dashboard → Your Project → Settings → Environment Variables:

```bash
VITE_API_URL=https://banking-api-xxxx.onrender.com
```

- [ ] Environment variable added
- [ ] API URL matches your Render backend URL

### 3. Deploy Frontend

**Option 1: Automatic (GitHub Actions)**
```bash
git push origin main
```

**Option 2: Manual (Vercel CLI)**
```bash
cd banking-ui
vercel --prod
```

- [ ] Deployment successful
- [ ] Note your app URL: `https://your-app.vercel.app`

---

## 🔗 Connect Frontend and Backend

### Update Backend CORS

Render Dashboard → Your Service → Environment:

```bash
Cors__AllowedOrigins__0=https://your-app.vercel.app
```

- [ ] CORS origin added (exact Vercel URL)
- [ ] Backend redeployed (automatic)

---

## 🔐 GitHub Secrets (for CI/CD)

GitHub → Settings → Secrets and variables → Actions:

```bash
VERCEL_TOKEN=[From https://vercel.com/account/tokens]
VERCEL_ORG_ID=[From .vercel/project.json]
VERCEL_PROJECT_ID=[From .vercel/project.json]
```

**Get Vercel IDs:**
```bash
cd banking-ui
cat .vercel/project.json
```

- [ ] All 3 secrets added to GitHub
- [ ] Secrets are correct

---

## ✅ Post-Deployment Verification

### 1. Backend Health Check
```bash
curl https://your-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "Production",
  "version": "1.0.0"
}
```

- [ ] Health check returns 200 OK
- [ ] Environment is "Production"

### 2. Frontend Loading
- [ ] Visit `https://your-app.vercel.app`
- [ ] Page loads without errors
- [ ] No console errors (F12)
- [ ] Login page displays correctly

### 3. API Connectivity
- [ ] Open browser console (F12)
- [ ] Check for: `[App Config] apiUrl: https://your-api.onrender.com`
- [ ] No CORS errors

### 4. Full Application Flow
- [ ] Register new user
- [ ] Login successfully
- [ ] Create new account
- [ ] Make deposit
- [ ] Transfer funds between accounts
- [ ] View transaction history
- [ ] Logout and login again

---

## 🔒 Security Checklist

- [ ] JWT key is strong (32+ characters)
- [ ] Database password is strong
- [ ] CORS allows only your Vercel domain
- [ ] HTTPS is enforced (automatic on Render/Vercel)
- [ ] Swagger is disabled in production
- [ ] No secrets in code or repository
- [ ] Environment variables are set correctly
- [ ] Rate limiting is enabled

---

## 📊 Monitoring Setup

### Render
- [ ] Enable email alerts for downtime
- [ ] Check logs regularly
- [ ] Monitor resource usage

### Vercel
- [ ] Enable Analytics
- [ ] Enable Speed Insights
- [ ] Check deployment logs

### External Monitoring (Optional)
- [ ] Set up UptimeRobot for health check monitoring
- [ ] Set up Sentry for error tracking

---

## 🐛 Troubleshooting

### Backend Issues

**Build fails:**
```bash
# Check logs in Render dashboard
# Verify .NET version is 8.0 in BankingApi.csproj
```

**Database connection fails:**
```bash
# Verify connection string format
# Check database is running
# Run migrations
```

**Application crashes:**
```bash
# Check all environment variables are set
# Verify JWT key is 32+ characters
# Check logs for specific error
```

### Frontend Issues

**CORS errors:**
```bash
# Verify Cors__AllowedOrigins__0 in Render
# Must match Vercel URL exactly (https://)
# Redeploy backend after CORS change
```

**API calls fail:**
```bash
# Verify VITE_API_URL in Vercel
# Check backend is healthy
# Redeploy frontend after env var change
```

**Build fails:**
```bash
# Test locally: npm run build
# Check TypeScript errors: npx tsc --noEmit
# Verify all dependencies installed
```

---

## 🔄 Rollback Procedure

### Backend (Render)
1. Render Dashboard → Your Service → Events
2. Find previous successful deployment
3. Click "Rollback to this version"

### Frontend (Vercel)
```bash
vercel ls
vercel promote <previous-deployment-url>
```

Or use Vercel Dashboard → Deployments → Promote to Production

---

## 📚 Documentation Reference

- **Complete Guide:** `PRODUCTION_DEPLOYMENT_COMPLETE.md`
- **Environment Variables:** `ENV_VARIABLES_REFERENCE.md`
- **Vercel Specific:** `VERCEL_DEPLOYMENT.md`
- **Summary:** `PRODUCTION_READY_SUMMARY.md`

---

## 🎉 Deployment Complete!

Once all checkboxes are checked:

✅ Backend is deployed and healthy  
✅ Frontend is deployed and accessible  
✅ API connectivity works  
✅ Full application flow tested  
✅ Security measures in place  
✅ Monitoring configured  

**Your Banking System is now live in production! 🚀**

---

## 📞 Need Help?

1. Check troubleshooting section above
2. Review `PRODUCTION_DEPLOYMENT_COMPLETE.md`
3. Check deployment logs in Render/Vercel
4. Verify all environment variables
5. Test locally to isolate issues

---

**Estimated Time:** 30-45 minutes for first deployment  
**Difficulty:** Intermediate  
**Cost:** Free tier available on both platforms
