@echo off
title ZIONA - FIX ACCOUNTING SETUP
color 0A
cd /d "%~dp0"
echo.
echo ========================================================
echo   ZIONA HEALTHCARE ERP - ACCOUNTING SETUP FIX
echo ========================================================
echo.
echo This will seed the Chart of Accounts and fix billing.
echo.
pause

set PGPASSWORD=hms2035
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=hms_db
set DB_USER=postgres

echo.
echo [1/2] Running accounting fix...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "FIX_ACCOUNTING_SETUP.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fix failed. Trying alternate psql path...
    "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "FIX_ACCOUNTING_SETUP.sql"
    if %ERRORLEVEL% NEQ 0 (
        "C:\Program Files\PostgreSQL\15\bin\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "FIX_ACCOUNTING_SETUP.sql"
    )
)

echo.
echo [2/2] Done! Restart the app and try billing again.
echo.
pause
