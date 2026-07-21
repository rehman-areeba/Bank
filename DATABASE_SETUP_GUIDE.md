# 🗄️ Database Setup Quick Reference

## Option 1: PostgreSQL on Render (Recommended for Free Tier)

### Step 1: Install PostgreSQL Package

```bash
cd BankingApi
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.11
```

### Step 2: Update Program.cs

**Find this line** (around line 25):
```csharp
builder.Services.AddDbContext<BankingDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

**Replace with**:
```csharp
builder.Services.AddDbContext<BankingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### Step 3: Update Using Statement

**Add to top of Program.cs**:
```csharp
using Npgsql.EntityFrameworkCore.PostgreSQL;  // Add this line
```

### Step 4: Create Database on Render

1. Render Dashboard → New → PostgreSQL
2. Name: `banking-db`
3. Database: `bankingdb`
4. User: `bankinguser`
5. Region: Same as API (Oregon)
6. Plan: Free

### Step 5: Get Connection String

Render Dashboard → Database → Info → **Internal Connection String**

Format:
```
postgresql://user:password@host:5432/database
```

Example:
```
postgresql://bankinguser:abc123@dpg-xxxxx-a.oregon-postgres.render.com/bankingdb
```

### Step 6: Add to Render Environment

Render Dashboard → API Service → Environment

**Key**: `ConnectionStrings__DefaultConnection`  
**Value**: (paste PostgreSQL connection string)

---

## Option 2: Azure SQL Database (Recommended for Production)

### Step 1: Create Azure SQL Database

1. Azure Portal → Create Resource → SQL Database
2. Server: Create new
3. Database: `BankingDb`
4. Pricing: Basic ($5/month)

### Step 2: Configure Firewall

SQL Server → Firewalls and virtual networks

Add rule:
- Name: `AllowRender`
- Start IP: `0.0.0.0`
- End IP: `255.255.255.255`

⚠️ This allows all IPs - restrict after deployment

### Step 3: Get Connection String

Azure Portal → SQL Database → Connection strings

Format:
```
Server=tcp:yourserver.database.windows.net,1433;
Initial Catalog=BankingDb;
Persist Security Info=False;
User ID=yourusername;
Password=yourpassword;
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

### Step 4: Add to Render Environment

Render Dashboard → API Service → Environment

**Key**: `ConnectionStrings__DefaultConnection`  
**Value**: (paste Azure SQL connection string)

### Step 5: No Code Changes Needed

Azure SQL uses SQL Server - your existing code works!

---

## Running Migrations

### Method 1: Render Shell (After Deployment)

1. Render Dashboard → Your Service → Shell
2. Click "Launch Shell"
3. Run:
   ```bash
   cd /app
   dotnet ef database update
   ```

### Method 2: Local Machine (Before Deployment)

**Windows PowerShell**:
```powershell
$env:ConnectionStrings__DefaultConnection="your-connection-string"
cd BankingApi
dotnet ef database update
```

**Linux/Mac**:
```bash
export ConnectionStrings__DefaultConnection="your-connection-string"
cd BankingApi
dotnet ef database update
```

---

## Troubleshooting

### Error: "Cannot connect to database"

**PostgreSQL**:
- Verify connection string is correct
- Check database is running on Render
- Use **Internal** connection string (not External)

**Azure SQL**:
- Verify firewall allows Render IPs
- Check username/password are correct
- Ensure database exists

### Error: "Table does not exist"

**Solution**: Run migrations (see above)

### Error: "SSL connection required"

**PostgreSQL**: Add to connection string:
```
?sslmode=require
```

**Azure SQL**: Already included in connection string

---

## Connection String Examples

### PostgreSQL (Render)

**Basic**:
```
postgresql://user:pass@host:5432/database
```

**With SSL**:
```
postgresql://user:pass@host:5432/database?sslmode=require
```

### Azure SQL

**Basic**:
```
Server=tcp:server.database.windows.net,1433;Initial Catalog=BankingDb;User ID=user;Password=pass;Encrypt=True;TrustServerCertificate=False;
```

**With Connection Pooling**:
```
Server=tcp:server.database.windows.net,1433;Initial Catalog=BankingDb;User ID=user;Password=pass;Encrypt=True;TrustServerCertificate=False;Max Pool Size=50;
```

---

## Quick Comparison

| Feature | PostgreSQL (Render) | Azure SQL |
|---------|---------------------|-----------|
| **Free Tier** | ✅ Yes (1GB) | ❌ No (min $5/mo) |
| **Code Changes** | ✅ Minimal (1 line) | ✅ None |
| **Setup Time** | ⚡ 2 minutes | ⏱️ 10 minutes |
| **Managed Backups** | ✅ Yes | ✅ Yes |
| **SQL Server Features** | ❌ No | ✅ Yes |
| **Best For** | Development/Testing | Production |

---

**Recommendation**: 
- **Development**: PostgreSQL on Render (free)
- **Production**: Azure SQL (full SQL Server compatibility)
