# 🔐 Environment Variables Quick Reference

## Backend (Render) - Required Environment Variables

Copy these to Render Dashboard → Your Service → Environment

```bash
# Core Configuration
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT

# Database Connection
ConnectionStrings__DefaultConnection=Server=tcp:yourserver.database.windows.net,1433;Initial Catalog=BankingDb;User ID=yourusername;Password=yourpassword;Encrypt=True;TrustServerCertificate=False

# JWT Authentication (Generate secure key: openssl rand -base64 32)
Jwt__Key=your-32-character-minimum-secret-key-here-change-this
Jwt__Issuer=BankingApi
Jwt__Audience=BankingClient
Jwt__ExpiryHours=24

# CORS (Add after Vercel deployment)
Cors__AllowedOrigins__0=https://your-app.vercel.app

# Optional
Transfer__DailyLimit=50000
```

---

## Frontend (Vercel) - Required Environment Variables

Copy these to Vercel Dashboard → Your Project → Settings → Environment Variables

```bash
# API Configuration
VITE_API_URL=https://your-api.onrender.com
```

---

## GitHub Secrets - Required for CI/CD

Copy these to GitHub → Settings → Secrets and variables → Actions

```bash
# Vercel Deployment
VERCEL_TOKEN=your-vercel-token-from-account-settings
VERCEL_ORG_ID=team_xxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
```

---

## How to Get Values

### JWT Key
```bash
# Generate secure random key (32+ characters)
openssl rand -base64 32
# Or use: https://generate-secret.vercel.app/32
```

### Database Connection String

**Render PostgreSQL:**
```
postgresql://user:password@host:5432/database
```

**Azure SQL:**
```
Server=tcp:yourserver.database.windows.net,1433;Initial Catalog=BankingDb;User ID=yourusername;Password=yourpassword;Encrypt=True;TrustServerCertificate=False
```

### Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create new token
3. Copy token value

### Vercel IDs
```bash
cd banking-ui
vercel link
cat .vercel/project.json
```

---

## Environment Variable Checklist

### Before First Deployment

Backend (Render):
- [ ] `ASPNETCORE_ENVIRONMENT` = Production
- [ ] `ASPNETCORE_URLS` = http://0.0.0.0:$PORT
- [ ] `ConnectionStrings__DefaultConnection` = [Your DB connection]
- [ ] `Jwt__Key` = [32+ character secret]
- [ ] `Jwt__Issuer` = BankingApi
- [ ] `Jwt__Audience` = BankingClient
- [ ] `Jwt__ExpiryHours` = 24

Frontend (Vercel):
- [ ] `VITE_API_URL` = [Leave empty initially, add after backend deployed]

GitHub:
- [ ] `VERCEL_TOKEN` = [Your Vercel token]
- [ ] `VERCEL_ORG_ID` = [From .vercel/project.json]
- [ ] `VERCEL_PROJECT_ID` = [From .vercel/project.json]

### After Backend Deployment

Frontend (Vercel):
- [ ] Update `VITE_API_URL` = https://your-api.onrender.com

Backend (Render):
- [ ] Add `Cors__AllowedOrigins__0` = https://your-app.vercel.app

---

## Common Mistakes to Avoid

❌ **Wrong:** `VITE_API_URL=http://localhost:5245` (in production)  
✅ **Right:** `VITE_API_URL=https://your-api.onrender.com`

❌ **Wrong:** `Cors__AllowedOrigins__0=http://your-app.vercel.app` (http)  
✅ **Right:** `Cors__AllowedOrigins__0=https://your-app.vercel.app` (https)

❌ **Wrong:** `Jwt__Key=secret` (too short)  
✅ **Right:** `Jwt__Key=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1` (32+ chars)

❌ **Wrong:** `ASPNETCORE_URLS=http://localhost:5000`  
✅ **Right:** `ASPNETCORE_URLS=http://0.0.0.0:$PORT`

---

## Testing Environment Variables

### Test Backend
```bash
curl https://your-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "Production"
}
```

### Test Frontend
1. Open https://your-app.vercel.app
2. Open browser console (F12)
3. Look for: `[App Config] apiUrl: https://your-api.onrender.com`
4. Try to login - check Network tab for API calls

---

## Quick Copy Templates

### Render Environment Variables (Copy-Paste Format)

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT
ConnectionStrings__DefaultConnection=PASTE_YOUR_DB_CONNECTION_STRING_HERE
Jwt__Key=PASTE_YOUR_32_CHAR_SECRET_KEY_HERE
Jwt__Issuer=BankingApi
Jwt__Audience=BankingClient
Jwt__ExpiryHours=24
Cors__AllowedOrigins__0=https://your-app.vercel.app
Transfer__DailyLimit=50000
```

### Vercel Environment Variables (Copy-Paste Format)

```
VITE_API_URL=https://your-api.onrender.com
```

---

## Troubleshooting

**Problem:** CORS errors in browser console  
**Solution:** Verify `Cors__AllowedOrigins__0` matches Vercel URL exactly (including https://)

**Problem:** API calls return 404  
**Solution:** Verify `VITE_API_URL` is set correctly in Vercel (no trailing slash)

**Problem:** Backend won't start  
**Solution:** Check all required environment variables are set in Render

**Problem:** JWT token errors  
**Solution:** Ensure `Jwt__Key` is at least 32 characters long

---

**Pro Tip:** Use a password manager to store all these values securely!
