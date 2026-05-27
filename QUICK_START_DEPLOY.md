# ⚡ Quick Start - Deploy in 15 Minutes

Get your Banking System live in production in 15 minutes or less.

---

## 🎯 Prerequisites (2 minutes)

- [ ] GitHub account
- [ ] [Render account](https://render.com) (sign up with GitHub)
- [ ] [Vercel account](https://vercel.com) (sign up with GitHub)

```bash
# Install Vercel CLI
npm install -g vercel
```

---

## 🚀 Deployment Steps

### 1️⃣ Deploy Backend (5 minutes)

**A. Create Database**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Name: `banking-db`, Click **Create**
4. Copy **Internal Database URL**

**B. Create Web Service**
1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - Name: `banking-api`
   - Build: `dotnet publish BankingApi/BankingApi.csproj -c Release -o out`
   - Start: `dotnet out/BankingApi.dll`

**C. Add Environment Variables**

Click **Environment** tab, add these:

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
ConnectionStrings__DefaultConnection=[PASTE_DB_URL_FROM_STEP_A]
Jwt__Key=[GENERATE_BELOW]
Jwt__Issuer=BankingApi
Jwt__Audience=BankingClient
Jwt__ExpiryHours=24
```

**Generate JWT Key:**
```bash
openssl rand -base64 32
```

**D. Deploy**
- Click **Create Web Service**
- Wait 3-5 minutes
- Copy your API URL: `https://banking-api-xxxx.onrender.com`

---

### 2️⃣ Deploy Frontend (5 minutes)

**A. Link to Vercel**
```bash
cd banking-ui
vercel login
vercel link
```

**B. Add Environment Variable**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Your Project → **Settings** → **Environment Variables**
3. Add:
   ```
   VITE_API_URL=https://banking-api-xxxx.onrender.com
   ```
   (Use your actual Render URL from step 1D)

**C. Deploy**
```bash
vercel --prod
```

Copy your app URL: `https://your-app.vercel.app`

---

### 3️⃣ Connect Frontend & Backend (2 minutes)

**Update CORS in Render:**
1. Render Dashboard → Your Service → **Environment**
2. Add:
   ```
   Cors__AllowedOrigins__0=https://your-app.vercel.app
   ```
   (Use your actual Vercel URL from step 2C)
3. Service will auto-redeploy

---

### 4️⃣ Setup CI/CD (3 minutes)

**Add GitHub Secrets:**

GitHub → Settings → Secrets and variables → Actions

```bash
# Get these values:
cd banking-ui
cat .vercel/project.json
```

Add 3 secrets:
- `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
- `VERCEL_ORG_ID` - From `.vercel/project.json`
- `VERCEL_PROJECT_ID` - From `.vercel/project.json`

---

### 5️⃣ Run Database Migrations (2 minutes)

**Option 1: Local Machine**
```bash
export ConnectionStrings__DefaultConnection="[Your Render DB URL]"
cd BankingApi
dotnet ef database update
```

**Option 2: Render Shell**
- Render Dashboard → Your Service → **Shell** tab
- Run: `cd BankingApi && dotnet ef database update`

---

## ✅ Verify Deployment (1 minute)

**Test Backend:**
```bash
curl https://your-api.onrender.com/health
```

Expected: `{"status":"healthy","environment":"Production"}`

**Test Frontend:**
1. Visit `https://your-app.vercel.app`
2. Register new user
3. Login
4. Create account
5. Make transfer

---

## 🎉 Done!

Your Banking System is now live!

- **Backend:** https://banking-api-xxxx.onrender.com
- **Frontend:** https://your-app.vercel.app
- **Auto-Deploy:** Push to main branch

---

## 🐛 Quick Troubleshooting

**CORS Error?**
```bash
# Verify Cors__AllowedOrigins__0 in Render matches Vercel URL exactly
# Must include https:// and no trailing slash
```

**API 404?**
```bash
# Verify VITE_API_URL in Vercel
# Should be: https://your-api.onrender.com (no /api)
```

**Build Failed?**
```bash
# Check logs in Render/Vercel dashboard
# Verify all environment variables are set
```

---

## 📚 Full Documentation

- **Complete Guide:** `PRODUCTION_DEPLOYMENT_COMPLETE.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Environment Vars:** `ENV_VARIABLES_REFERENCE.md`
- **Full Analysis:** `FULL_STACK_ANALYSIS_COMPLETE.md`

---

## 💡 Pro Tips

1. **Free Tier Limitation:** Render free tier sleeps after 15 min inactivity (first request takes 30s to wake up)
2. **Upgrade:** For production use, upgrade to Render Starter ($7/month) for always-on
3. **Monitoring:** Set up UptimeRobot to ping `/health` every 5 minutes to keep it awake
4. **Custom Domain:** Add custom domain in Vercel dashboard (free)
5. **Database Backups:** Enable automatic backups in Render dashboard

---

**Time to Deploy:** ~15 minutes  
**Cost:** Free (with limitations) or $34/month (production)  
**Difficulty:** Easy (just copy-paste)
