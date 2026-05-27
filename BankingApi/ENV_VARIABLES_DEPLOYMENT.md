# 🔐 Environment Variables - Quick Reference

## Required for Cloud Deployment

Copy and configure these environment variables in your cloud platform:

```bash
# ═══════════════════════════════════════════════════════════
# DATABASE CONNECTION
# ═══════════════════════════════════════════════════════════
ConnectionStrings__DefaultConnection="Server=<your-server>;Database=BankingDb;User Id=<user>;Password=<password>;TrustServerCertificate=True"

# ═══════════════════════════════════════════════════════════
# JWT AUTHENTICATION (REQUIRED)
# ═══════════════════════════════════════════════════════════
Jwt__Key="<GENERATE-RANDOM-32-PLUS-CHARACTER-SECRET-KEY>"
Jwt__Issuer="BankingApi"
Jwt__Audience="BankingClient"
Jwt__ExpiryHours="24"

# ═══════════════════════════════════════════════════════════
# CORS - FRONTEND ORIGINS
# ═══════════════════════════════════════════════════════════
# Leave empty to allow all origins (initial deployment)
# Or set specific origins for production:
Cors__AllowedOrigins__0="https://your-frontend.vercel.app"
Cors__AllowedOrigins__1="https://your-frontend.netlify.app"

# ═══════════════════════════════════════════════════════════
# ENVIRONMENT
# ═══════════════════════════════════════════════════════════
ASPNETCORE_ENVIRONMENT="Production"

# ═══════════════════════════════════════════════════════════
# PORT (Usually auto-set by cloud platform)
# ═══════════════════════════════════════════════════════════
PORT="8080"
```

---

## 🔑 Generate JWT Secret Key

Use one of these methods to generate a secure JWT key:

### PowerShell (Windows)
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Bash (Linux/Mac)
```bash
openssl rand -base64 32
```

### Online
- https://generate-secret.vercel.app/32

---

## 📝 Platform-Specific Format

### Render (render.yaml)
```yaml
envVars:
  - key: ConnectionStrings__DefaultConnection
    value: "Server=..."
  - key: Jwt__Key
    sync: false  # Use Render secret
  - key: ASPNETCORE_ENVIRONMENT
    value: Production
```

### Azure App Service (Portal)
```
Name: ConnectionStrings__DefaultConnection
Value: Server=...

Name: Jwt__Key
Value: <your-secret>
```

### AWS Elastic Beanstalk (.ebextensions/environment.config)
```yaml
option_settings:
  - namespace: aws:elasticbeanstalk:application:environment
    option_name: ConnectionStrings__DefaultConnection
    value: "Server=..."
```

### Docker (.env file)
```env
ConnectionStrings__DefaultConnection=Server=...
Jwt__Key=<your-secret>
ASPNETCORE_ENVIRONMENT=Production
```

---

## ⚠️ Security Notes

1. **Never commit secrets to Git**
2. **Use platform secret management** for sensitive values (Jwt__Key, connection strings)
3. **Rotate JWT keys periodically** in production
4. **Use strong database passwords** (16+ characters, mixed case, numbers, symbols)
5. **Restrict CORS origins** after frontend deployment (remove wildcard)

---

## ✅ Verification

After setting environment variables, verify:

```bash
# Check if API responds
curl https://your-api.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-08T...",
  "environment": "Production",
  "version": "1.0.0"
}
```

---

**Last Updated**: 2025-01-08
