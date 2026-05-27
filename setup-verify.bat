@echo off
echo Banking System Setup Verification
echo ================================
echo.

REM Check .NET SDK
echo 1. Checking .NET SDK...
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: .NET SDK not found. Please install .NET 8.0 SDK
    goto :error
) else (
    echo .NET SDK: OK
)

REM Check Node.js
echo 2. Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    goto :error
) else (
    echo Node.js: OK
)

REM Check SQL Server connection
echo 3. Checking SQL Server connection...
sqlcmd -S "DESKTOP-BD0D62J\SQLEXPRESS" -E -Q "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to SQL Server
    echo Please ensure SQL Server Express is installed and running
    echo Connection string: DESKTOP-BD0D62J\SQLEXPRESS
    goto :error
) else (
    echo SQL Server: OK
)

REM Check if database exists
echo 4. Checking database...
sqlcmd -S "DESKTOP-BD0D62J\SQLEXPRESS" -E -Q "SELECT name FROM sys.databases WHERE name = 'BankingDb'" -h -1 | findstr "BankingDb" >nul
if %errorlevel% neq 0 (
    echo Database 'BankingDb' not found. Running migrations...
    cd BankingApi
    dotnet ef database update
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create database
        goto :error
    )
    cd ..
    echo Database created successfully
) else (
    echo Database: OK
)

REM Check frontend dependencies
echo 5. Checking frontend dependencies...
if not exist "banking-ui\node_modules" (
    echo Installing frontend dependencies...
    cd banking-ui
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        goto :error
    )
    cd ..
)
echo Frontend dependencies: OK

echo.
echo ================================
echo Setup verification complete!
echo All systems ready for development.
echo.
echo To start the application:
echo 1. Run 'start-dev.bat' to start both services
echo 2. Open http://localhost:5173 in your browser
echo 3. Register a new account to get started
echo.
pause
exit /b 0

:error
echo.
echo Setup verification failed!
echo Please fix the errors above and run this script again.
pause
exit /b 1