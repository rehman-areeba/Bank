# Backend-Frontend Connection Guide

## Current Configuration

### Backend (ASP.NET Core API)
- **URL**: `http://localhost:5245` (HTTP) / `https://localhost:7253` (HTTPS)
- **Database**: SQL Server Express (`DESKTOP-BD0D62J\SQLEXPRESS`)
- **CORS**: Configured for `http://localhost:5173`
- **Authentication**: JWT Bearer tokens

### Frontend (React + Vite)
- **URL**: `http://localhost:5173`
- **API Base URL**: `http://localhost:5245` (configured in `.env.development`)
- **State Management**: Zustand + TanStack Query
- **HTTP Client**: Axios with interceptors

## Quick Start

### 1. Verify Setup
```bash
# Run setup verification
setup-verify.bat
```

### 2. Start Both Services
```bash
# Start both backend and frontend
start-dev.bat
```

### 3. Access Application
- **Frontend**: http://localhost:5173
- **API Documentation**: https://localhost:7253/swagger
- **API Health**: http://localhost:5245/api/auth/test

## Manual Startup (Alternative)

### Backend
```bash
cd BankingApi
dotnet run
```

### Frontend
```bash
cd banking-ui
npm run dev
```

## Connection Flow

1. **Frontend Request** → Axios client adds JWT token from localStorage
2. **CORS Check** → Backend validates origin (localhost:5173)
3. **Authentication** → JWT token validated if present
4. **API Processing** → Controller → Service → Repository → Database
5. **Response** → JSON data returned to frontend
6. **Error Handling** → 401 errors automatically redirect to login

## Key Configuration Files

### Backend Configuration
- `appsettings.Development.json` - Database connection, JWT settings
- `Program.cs` - CORS, authentication, services registration

### Frontend Configuration
- `.env.development` - API URL configuration
- `src/api/axiosClient.ts` - HTTP client with interceptors
- `src/store/authStore.ts` - Authentication state management

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured for `http://localhost:5173`
   - Check that frontend is running on port 5173

2. **Database Connection**
   - Verify SQL Server Express is running
   - Check connection string in `appsettings.Development.json`
   - Run `dotnet ef database update` if needed

3. **Authentication Issues**
   - Check JWT configuration in backend
   - Verify token is stored in localStorage
   - Check token expiry (24 hours default)

4. **Port Conflicts**
   - Backend: 5245 (HTTP), 7253 (HTTPS)
   - Frontend: 5173
   - Change ports in configuration if needed

### Testing Connection
```bash
# Test backend-frontend connectivity
test-connection.bat
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - Get user accounts
- `POST /api/accounts` - Create new account
- `GET /api/accounts/{id}/balance` - Get account balance

### Transfers
- `POST /api/transfers` - Transfer money
- `GET /api/transfers/history` - Transfer history

### Transactions
- `GET /api/accounts/{id}/transactions` - Account transactions

## Security Features

- **JWT Authentication**: Stateless token-based auth
- **CORS Protection**: Restricts frontend origins
- **Rate Limiting**: Prevents abuse (10 auth/min, 5 transfers/min)
- **Input Validation**: FluentValidation on all inputs
- **HTTPS Enforcement**: Production redirects to HTTPS

## Development Workflow

1. **Start Services**: Use `start-dev.bat`
2. **Make Changes**: Hot reload enabled for both services
3. **Test API**: Use Swagger UI at https://localhost:7253/swagger
4. **Debug**: Check browser console and API logs
5. **Database Changes**: Run `dotnet ef migrations add` and `dotnet ef database update`

## Production Deployment

For production deployment, update:
- Frontend: Change `VITE_API_URL` to production API URL
- Backend: Update CORS origins, connection strings, JWT keys
- Database: Use production SQL Server instance
- HTTPS: Configure SSL certificates

## Support

If you encounter issues:
1. Run `setup-verify.bat` to check configuration
2. Check browser console for frontend errors
3. Check API logs for backend errors
4. Verify database connectivity
5. Test with `test-connection.bat`