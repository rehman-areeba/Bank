@echo off
echo Starting Banking System Development Environment...
echo.

REM Check if SQL Server is running
echo Checking SQL Server connection...
sqlcmd -S "DESKTOP-BD0D62J\SQLEXPRESS" -E -Q "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to SQL Server. Please ensure SQL Server is running.
    echo Connection string: DESKTOP-BD0D62J\SQLEXPRESS
    pause
    exit /b 1
)
echo SQL Server connection: OK

REM Start Backend API
echo.
echo Starting Backend API...
start "Banking API" cmd /k "cd /d BankingApi && dotnet run"

REM Wait a moment for API to start
timeout /t 5 /nobreak >nul

REM Start Frontend
echo.
echo Starting Frontend...
start "Banking UI" cmd /k "cd /d banking-ui && npm run dev"

echo.
echo Both services are starting...
echo Backend API: http://localhost:5245 (HTTP) / https://localhost:7253 (HTTPS)
echo Frontend UI: http://localhost:5173
echo Swagger API Docs: https://localhost:7253/swagger
echo.
echo Press any key to close this window (services will continue running)...
pause >nul