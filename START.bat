@echo off
echo ===============================================
echo STARTING BANKING APPLICATION
echo ===============================================
echo.

echo Starting Backend API...
start "Banking API" cmd /k "cd /d %~dp0BankingApi && dotnet run"

timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "Banking UI" cmd /k "cd /d %~dp0banking-ui && npm run dev"

echo.
echo ===============================================
echo BOTH SERVERS STARTING...
echo ===============================================
echo.
echo Backend: https://localhost:7253
echo Frontend: http://localhost:5173
echo Swagger: https://localhost:7253/swagger
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:5173

echo.
echo To stop servers, close the terminal windows
echo or press Ctrl+C in each window
