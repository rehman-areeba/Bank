# Quick Start Guide - Backend & Frontend Connection

## ✅ Fixes Applied

1. **Created TransactionsController** - Added missing `/api/transactions/recent` endpoint
2. **Added GetRecentByAccountIdsAsync** - Repository method to fetch recent transactions
3. **Fixed AccountDto JSON mapping** - Backend now returns `accountType` instead of `Type`

## 🚀 Start the Application

### Option 1: Using Command Prompt (Recommended)

**Terminal 1 - Backend:**
```cmd
cd BankingApi
dotnet run
```

**Terminal 2 - Frontend:**
```cmd
cd banking-ui
npm run dev
```

### Option 2: Using the Batch Script

```cmd
start-dev.bat
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5245
- **Swagger Docs**: https://localhost:7253/swagger

## 📝 First Time Setup

1. **Ensure SQL Server is running**
2. **Apply migrations** (if not done):
   ```cmd
   cd BankingApi
   dotnet ef database update
   ```
3. **Install frontend dependencies**:
   ```cmd
   cd banking-ui
   npm install
   ```

## 🔧 Configuration

### Backend (appsettings.Development.json)
- Database: `DESKTOP-BD0D62J\SQLEXPRESS`
- JWT Key: Configured
- CORS: Enabled for `http://localhost:5173`

### Frontend (.env.development)
- API URL: `http://localhost:5245`

## ✨ Test the Connection

1. Open http://localhost:5173
2. Register a new account
3. Login with your credentials
4. Dashboard should load with:
   - Your accounts
   - Total balance
   - Recent transactions
   - Quick actions

## 🐛 Troubleshooting

### Dashboard Not Loading
- Check browser console for errors
- Verify backend is running on port 5245
- Check network tab for failed API calls

### CORS Errors
- Ensure frontend is on port 5173
- Backend CORS is configured for this port

### Database Errors
- Verify SQL Server is running
- Check connection string in appsettings.Development.json
- Run `dotnet ef database update`

### Authentication Issues
- Clear browser localStorage
- Re-login to get fresh JWT token
- Check token expiry (24 hours)

## 📊 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Accounts
- GET `/api/accounts` - Get all user accounts
- POST `/api/accounts` - Create new account
- GET `/api/accounts/{id}/balance` - Get balance
- GET `/api/accounts/{id}/transactions` - Get transactions
- POST `/api/accounts/{id}/deposit` - Deposit money
- POST `/api/accounts/{id}/withdraw` - Withdraw money

### Transactions
- GET `/api/transactions/recent` - Get recent transactions (NEW)

### Transfers
- POST `/api/transfers` - Transfer money
- GET `/api/transfers/history` - Transfer history

## 🎯 Next Steps

After successful startup:
1. Create multiple accounts (Savings, Checking, Business)
2. Make deposits to your accounts
3. Transfer money between accounts
4. View transaction history
5. Test the admin panel (if admin user)

## 💡 Development Tips

- Both services have hot reload enabled
- Backend changes require rebuild
- Frontend changes reflect immediately
- Use Swagger UI for API testing
- Check browser DevTools for frontend debugging
