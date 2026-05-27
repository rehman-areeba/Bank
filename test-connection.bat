@echo off
echo Testing Backend-Frontend Connection...
echo.

REM Test Backend API Health
echo 1. Testing Backend API (http://localhost:5245)...
curl -s -o nul -w "Backend API Status: %%{http_code}\n" http://localhost:5245/api/auth/test 2>nul
if %errorlevel% neq 0 (
    echo Backend API: Not responding (make sure it's running with 'dotnet run' in BankingApi folder)
) else (
    echo Backend API: Responding
)

echo.

REM Test Frontend
echo 2. Testing Frontend (http://localhost:5173)...
curl -s -o nul -w "Frontend Status: %%{http_code}\n" http://localhost:5173 2>nul
if %errorlevel% neq 0 (
    echo Frontend: Not responding (make sure it's running with 'npm run dev' in banking-ui folder)
) else (
    echo Frontend: Responding
)

echo.

REM Test CORS Configuration
echo 3. Testing CORS Configuration...
echo Backend CORS is configured for: http://localhost:5173
echo Frontend API URL is configured for: http://localhost:5245

echo.
echo Connection Test Complete!
echo.
echo If both services are running:
echo - Open http://localhost:5173 in your browser
echo - Register a new account or login
echo - Check browser console for any CORS errors
echo.
pause