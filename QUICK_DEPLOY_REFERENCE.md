# ⚡ Quick Deployment Reference

## 🎯 TL;DR - Deploy in 5 Steps

```bash
# 1. Deploy Backend (Render)
# - Connect GitHub repo
# - Set environment variables (see below)
# - Deploy → Get API URL

# 2. Update Frontend Config
cd banking-ui
echo VITE_API_URL=https://your-api.onrender.com > .env.production

# 3. Deploy Frontend (Vercel)
vercel --prod
# Set VITE_API_URL in dashboard

# 4. Update Backend CORS
# Add frontend URL to Cors__AllowedOrigins__0

# 5. Test
# Visit frontend URL and test registration/login
```

---

## 🔑 Required Environment Variables

### **Backend (BankingApi)**

```bash
ConnectionStrings__DefaultConnection="Server=<host>;Database=BankingDb;User Id=<user>;Password=<pass>;TrustServerCertificate=True"
Jwt__Key="<32-CHAR-SECRET>"
Jwt__Issuer="BankingApi"
Jwt__Audience="BankingClient"
Cors__AllowedOrigins__0="https://your-frontend.vercel.app"
ASPNETCORE_ENVIRONMENT="Production"
```

### **Frontend (banking-ui)**

```bash
VITE_API_URL="https://your-api.onrender.com"
```

---

## 🏗️ Build Commands

### **Backend**

```bash
# Build
dotnet build -c Release

# Publish
dotnet publish -c Release -o out

# Run
dotnet out/BankingApi.dll
```

### **Frontend**

```bash
# Install
npm install

# Build
npm run build

# Preview
npm run preview
```

---

## 🧪 Quick Tests

### **Backend Health Check**

```bash
curl https://your-api.onrender.com/health
```

Expected:
```json
{"status":"healthy","timestamp":"...","environment":"Production","version":"1.0.0"}
```

### **Frontend Config Check**

Open browser console:
```
[App Config] { apiUrl: 'https://your-api.onrender.com', mode: 'production' }
```

### **Test Registration**

```bash
curl -X POST https://your-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","password":"Test123!","confirmPassword":"Test123!"}'
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| **CORS Error** | Update `Cors__AllowedOrigins__0` with exact frontend URL |
| **401 Unauthorized** | Check `Jwt__Key` is set in backend |
| **Cannot connect** | Verify `VITE_API_URL` matches backend URL |
| **Build fails** | Run `dotnet restore` or `npm install` |
| **Database error** | Check connection string and firewall rules |

---

## 📊 Project Status

| Component | Status | Build | Notes |
|-----------|--------|-------|-------|
| **Backend** | ✅ Ready | ✅ Success | Dynamic PORT, CORS configured |
| **Frontend** | ✅ Ready | ✅ Success | Centralized API config |
| **Database** | ⚠️ Setup Required | N/A | Need cloud database |

---

## 🔗 Quick Links

- **Backend Deployment**: [CLOUD_DEPLOYMENT_READY.md](./CLOUD_DEPLOYMENT_READY.md)
- **Frontend Analysis**: [banking-ui/FRONTEND_API_ANALYSIS.md](./banking-ui/FRONTEND_API_ANALYSIS.md)
- **Full Guide**: [FULL_STACK_DEPLOYMENT_GUIDE.md](./FULL_STACK_DEPLOYMENT_GUIDE.md)
- **Render**: https://render.com
- **Vercel**: https://vercel.com

---

## 🎯 Deployment Order

```
1. Setup Cloud Database
   ↓
2. Deploy Backend (with DB connection)
   ↓
3. Run Database Migrations
   ↓
4. Deploy Frontend (with Backend URL)
   ↓
5. Update Backend CORS (with Frontend URL)
   ↓
6. Test End-to-End
```

---

## 💡 Pro Tips

- **Generate JWT Key**: `openssl rand -base64 32`
- **Test Locally First**: Use `.env.local` to test production URLs locally
- **CORS**: No trailing slash in URLs
- **Logs**: Check platform logs if deployment fails
- **Secrets**: Never commit `.env` files to Git

---

**Last Updated**: 2025-01-08  
**Deployment Time**: ~30-45 minutes  
**Status**: ✅ Ready to Deploy
