# 🏗️ Render Deployment Architecture

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS / CLIENTS                          │
│                    (Browser, Mobile App)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    RENDER LOAD BALANCER                          │
│  • Terminates SSL/TLS (HTTPS → HTTP)                            │
│  • Routes traffic to your container                             │
│  • Health checks every 30 seconds                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (not HTTPS!)
                             │ Port: Dynamic (e.g., 10000)
┌────────────────────────────▼────────────────────────────────────┐
│                    YOUR DOCKER CONTAINER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              BankingApi.dll (ASP.NET Core 8)             │  │
│  │  • Reads PORT environment variable                       │  │
│  │  • Listens on 0.0.0.0:{PORT}                            │  │
│  │  • NO HTTPS redirection (Render handles it)             │  │
│  │  • Health endpoint: /health                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Environment Variables:                                          │
│  • PORT=10000 (set by Render)                                   │
│  • ASPNETCORE_ENVIRONMENT=Production                            │
│  • ConnectionStrings__DefaultConnection=...                     │
│  • Jwt__Key=...                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Database Connection
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                         DATABASE                                 │
│  Option A: PostgreSQL on Render (Free)                          │
│  Option B: Azure SQL Database (Paid)                            │
│  • Stores users, accounts, transactions                         │
│  • Connection via environment variable                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### 1. User Makes Request

```
User Browser
    │
    │ HTTPS Request
    │ https://banking-api.onrender.com/api/auth/login
    │
    ▼
Render Load Balancer
    │
    │ Terminates SSL
    │ Converts HTTPS → HTTP
    │
    ▼
Your Docker Container
    │
    │ Receives HTTP on port 10000
    │ http://localhost:10000/api/auth/login
    │
    ▼
ASP.NET Core Pipeline
    │
    ├─→ ExceptionMiddleware (catches errors)
    ├─→ RateLimiter (prevents abuse)
    ├─→ CORS (validates origin)
    ├─→ Authentication (validates JWT)
    ├─→ Authorization (checks permissions)
    │
    ▼
Controller (AuthController)
    │
    ▼
Service (AuthService)
    │
    ▼
Repository (UserRepository)
    │
    ▼
Database (PostgreSQL/Azure SQL)
    │
    ▼
Response flows back up the chain
```

---

## 🐳 Docker Build Process

### What Happens When You Deploy

```
1. TRIGGER
   ├─ You push to GitHub main branch
   └─ Render detects change

2. BUILD PHASE
   ├─ Render clones your repository
   ├─ Finds Dockerfile at root
   ├─ Runs: docker build -f ./Dockerfile -t app:latest ./
   │
   ├─ Stage 1: Build (SDK image)
   │   ├─ Restore NuGet packages
   │   ├─ Build project (Release mode)
   │   └─ Output: /app/build
   │
   ├─ Stage 2: Publish (SDK image)
   │   ├─ Publish project
   │   └─ Output: /app/publish
   │
   └─ Stage 3: Runtime (ASP.NET image)
       ├─ Copy published files
       ├─ Create non-root user
       └─ Set ENTRYPOINT

3. DEPLOY PHASE
   ├─ Render starts container
   ├─ Sets PORT environment variable (e.g., 10000)
   ├─ Runs: docker run -p 10000:10000 -e PORT=10000 app:latest
   └─ Your app starts and listens on port 10000

4. HEALTH CHECK
   ├─ Render pings: http://container:10000/health
   ├─ If 200 OK: Service is healthy ✅
   └─ If fails 3 times: Restart container ❌

5. TRAFFIC ROUTING
   ├─ Render updates load balancer
   ├─ Routes traffic to new container
   └─ Old container is shut down (zero-downtime)
```

---

## 📁 File Locations (CRITICAL!)

```
Your GitHub Repository
│
├── Dockerfile                    ← MUST BE HERE (root)
│   └─ Builds your Docker image
│
├── .dockerignore                 ← MUST BE HERE (root)
│   └─ Excludes files from Docker build
│
├── render.yaml                   ← MUST BE HERE (root)
│   └─ Tells Render how to deploy
│
├── BankingApi/                   ← Your project folder
│   ├── BankingApi.csproj        ← Project file
│   ├── Program.cs               ← Entry point (reads PORT)
│   ├── Controllers/             ← API endpoints
│   ├── Services/                ← Business logic
│   ├── Repositories/            ← Data access
│   ├── Models/                  ← Entities
│   ├── DTOs/                    ← Data transfer objects
│   ├── Middleware/              ← Custom middleware
│   ├── Data/                    ← DbContext
│   ├── appsettings.json         ← Default config
│   └── appsettings.Production.json  ← Production config
│
└── banking-ui/                   ← Frontend (separate deployment)
```

**⚠️ CRITICAL**: If Dockerfile is inside BankingApi/ folder, deployment will FAIL!

---

## 🔐 Environment Variables Flow

```
Render Dashboard
    │
    │ You set environment variables:
    │ • ConnectionStrings__DefaultConnection
    │ • Jwt__Key
    │ • Jwt__Issuer
    │ • Jwt__Audience
    │ • Cors__AllowedOrigins__0
    │
    ▼
Render Platform
    │
    │ Injects variables into container
    │
    ▼
Docker Container
    │
    │ Environment variables available as:
    │ • process.env (Node.js)
    │ • Environment.GetEnvironmentVariable() (C#)
    │
    ▼
ASP.NET Core Configuration
    │
    │ builder.Configuration reads from:
    │ 1. appsettings.json
    │ 2. appsettings.Production.json
    │ 3. Environment variables (HIGHEST PRIORITY)
    │
    ▼
Your Code
    │
    │ builder.Configuration["Jwt:Key"]
    │ builder.Configuration.GetConnectionString("DefaultConnection")
    │
    └─ Values come from Render environment variables
```

**Priority Order** (highest to lowest):
1. Environment variables (Render Dashboard)
2. appsettings.Production.json
3. appsettings.json

---

## 🚦 Health Check Flow

```
Every 30 seconds:

Render Health Checker
    │
    │ HTTP GET http://container:10000/health
    │
    ▼
Your App (/health endpoint)
    │
    │ Returns:
    │ {
    │   "status": "healthy",
    │   "timestamp": "2025-01-08T12:34:56Z",
    │   "environment": "Production",
    │   "version": "1.0.0"
    │ }
    │
    ▼
Render Evaluates Response
    │
    ├─ 200 OK → Service is healthy ✅
    │   └─ Continue routing traffic
    │
    └─ Non-200 or timeout → Service is unhealthy ❌
        └─ After 3 failures: Restart container
```

---

## 🔄 Deployment Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    INITIAL DEPLOYMENT                        │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ 1. Create service on Render
    ├─ 2. Set environment variables
    ├─ 3. Render builds Docker image
    ├─ 4. Render starts container
    ├─ 5. Health check passes
    └─ 6. Service is live ✅

┌─────────────────────────────────────────────────────────────┐
│                    CODE UPDATE                               │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ 1. You push to GitHub
    ├─ 2. Render detects change
    ├─ 3. Render builds new Docker image
    ├─ 4. Render starts new container
    ├─ 5. Health check passes on new container
    ├─ 6. Render routes traffic to new container
    └─ 7. Old container is shut down (zero-downtime) ✅

┌─────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLE UPDATE               │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ 1. You update variable in Render Dashboard
    ├─ 2. Click "Save Changes"
    ├─ 3. Render restarts container (brief downtime ~10s)
    └─ 4. New variable is available ✅

┌─────────────────────────────────────────────────────────────┐
│                    HEALTH CHECK FAILURE                      │
└─────────────────────────────────────────────────────────────┘
    │
    ├─ 1. Health check fails 3 times
    ├─ 2. Render marks service as unhealthy
    ├─ 3. Render restarts container
    ├─ 4. If still fails: Check logs for errors
    └─ 5. Fix issue and redeploy ✅
```

---

## 🌐 HTTPS vs HTTP (Why Redirection Breaks)

### ❌ What Happens With HTTPS Redirection Enabled

```
User
  │ HTTPS Request
  │ https://your-app.onrender.com/api/auth/login
  ▼
Render Load Balancer
  │ Terminates SSL
  │ Forwards HTTP
  ▼
Your App (receives HTTP)
  │ Sees HTTP request
  │ HTTPS redirection enabled
  │ Redirects to HTTPS
  ▼
Render Load Balancer
  │ Receives HTTPS redirect
  │ Terminates SSL again
  │ Forwards HTTP again
  ▼
Your App (receives HTTP again)
  │ Sees HTTP request again
  │ Redirects to HTTPS again
  ▼
INFINITE LOOP! ❌
```

### ✅ What Happens With HTTPS Redirection Disabled

```
User
  │ HTTPS Request
  │ https://your-app.onrender.com/api/auth/login
  ▼
Render Load Balancer
  │ Terminates SSL
  │ Forwards HTTP
  ▼
Your App (receives HTTP)
  │ Sees HTTP request
  │ HTTPS redirection DISABLED
  │ Processes request normally
  ▼
Response
  │ Returns response
  ▼
Render Load Balancer
  │ Encrypts response with SSL
  │ Sends HTTPS response
  ▼
User
  │ Receives HTTPS response
  ✅ SUCCESS!
```

**Key Insight**: Render handles HTTPS. Your app only sees HTTP. Don't redirect!

---

## 🎯 Port Binding (Why Dynamic PORT Matters)

### ❌ Hardcoded Port (Breaks on Render)

```
Dockerfile:
ENV ASPNETCORE_URLS=http://+:5000

Render assigns PORT=10000
    │
    ▼
Your app listens on port 5000
Render expects app on port 10000
    │
    ▼
Render can't connect to app
Health check fails
Deployment fails ❌
```

### ✅ Dynamic PORT (Works on Render)

```
Program.cs:
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
serverOptions.ListenAnyIP(int.Parse(port));

Render assigns PORT=10000
    │
    ▼
Your app reads PORT=10000
Your app listens on port 10000
Render connects to port 10000
    │
    ▼
Health check passes
Deployment succeeds ✅
```

---

## 📊 Monitoring Dashboard

```
Render Dashboard → Your Service

┌─────────────────────────────────────────────────────────────┐
│  OVERVIEW                                                    │
│  • Status: Live ✅                                          │
│  • URL: https://banking-api-xxxx.onrender.com              │
│  • Last Deploy: 2 minutes ago                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  METRICS                                                     │
│  • CPU: 15% (avg)                                           │
│  • Memory: 256 MB / 512 MB                                  │
│  • Response Time: 120ms (avg)                               │
│  • Requests: 1,234 (last hour)                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  LOGS (Real-time)                                           │
│  [12:34:56] Banking API started on port 10000               │
│  [12:34:57] Application started. Press Ctrl+C to shut down. │
│  [12:35:00] POST /api/auth/register → 200 OK (45ms)        │
│  [12:35:05] POST /api/auth/login → 200 OK (32ms)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EVENTS                                                      │
│  ✅ Deploy succeeded (2 minutes ago)                        │
│  ✅ Build succeeded (3 minutes ago)                         │
│  ✅ Health check passed (30 seconds ago)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Success Indicators

### ✅ Deployment Succeeded

**Render Dashboard → Events**:
```
✅ Build succeeded
✅ Deploy succeeded
✅ Service is live
```

**Render Dashboard → Logs**:
```
Banking API started on port 10000 in Production mode
Application started. Press Ctrl+C to shut down.
CORS Policy: AllowFrontend, Allowed Origins: 
```

**Health Check**:
```bash
curl https://your-app.onrender.com/health

{
  "status": "healthy",
  "timestamp": "2025-01-08T12:34:56.789Z",
  "environment": "Production",
  "version": "1.0.0"
}
```

**API Test**:
```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.com","password":"Test123!","confirmPassword":"Test123!"}'

{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "...",
  "fullName": "Test",
  "role": "Customer"
}
```

---

**Last Updated**: 2025-01-08  
**Status**: Production Ready ✅  
**Deployment Method**: Docker on Render
