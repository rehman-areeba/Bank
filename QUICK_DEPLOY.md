# Quick Deployment Reference

## 🚀 Deploy to Render (Easiest)

### 1. Push to GitHub
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Create Render Service
1. Go to [render.com](https://render.com)
2. New + → Web Service
3. Connect GitHub repo
4. Select: **BankingApi**

### 3. Configure
```
Build Command: dotnet publish BankingApi/BankingApi.csproj -c Release -o out
Start Command: dotnet out/BankingApi.dll
```

### 4. Environment Variables
```bash
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=YOUR_DB_CONNECTION_STRING
Jwt__Key=YOUR_32_CHAR_SECRET_KEY
Cors__AllowedOrigins__0=https://your-frontend.onrender.com
```

### 5. Deploy
- Click "Create Web Service"
- Wait for deployment
- Access: `https://your-service.onrender.com/health`

---

## 🔧 Environment Variables Template

```bash
# Required
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Server=YOUR_SERVER;Database=BankingDb;User Id=USER;Password=PASS;TrustServerCertificate=True
Jwt__Key=your-super-secret-jwt-key-minimum-32-characters-long
Cors__AllowedOrigins__0=https://your-frontend.com

# Optional
PORT=5000
Jwt__Issuer=BankingApi
Jwt__Audience=BankingClient
Jwt__ExpiryHours=24
```

---

## ✅ Verification Checklist

```bash
# 1. Health Check
curl https://your-api.com/health
# Expected: {"status":"healthy",...}

# 2. CORS Test
curl -H "Origin: https://your-frontend.com" -I https://your-api.com/health
# Expected: Access-Control-Allow-Origin header present

# 3. API Test
curl https://your-api.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## 🐛 Common Issues

### Issue: 502 Bad Gateway
**Fix:** Check PORT environment variable is set

### Issue: CORS Error
**Fix:** Add frontend URL to `Cors__AllowedOrigins__0`

### Issue: Database Connection Failed
**Fix:** Verify connection string format and credentials

### Issue: JWT Error
**Fix:** Ensure `Jwt__Key` is at least 32 characters

---

## 📞 Quick Links

- **Health Check:** `https://your-api.com/health`
- **Swagger (Dev only):** `https://your-api.com/swagger`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Full Summary:** See `DEPLOYMENT_SUMMARY.md`

---

## 🎯 What Changed

| Before | After |
|--------|-------|
| Hardcoded PORT 5245 | Dynamic PORT from env |
| Hardcoded CORS localhost:5173 | Configurable CORS |
| Swagger always on | Only in Dev/Staging |
| No health check | /health endpoint |
| HTTPS always enforced | Environment-specific |

---

**Ready to deploy!** 🎉
