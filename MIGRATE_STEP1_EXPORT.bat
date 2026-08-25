@echo off
setlocal
title ZIONA - STEP 1: EXPORT YOUR DATA FOR CLOUD MIGRATION
color 0B
cd /d "%~dp0"

echo ========================================================
echo   ZIONA HEALTHCARE ERP - DATA EXPORT FOR CLOUD
echo   Run this on the CUSTOMER'S machine
echo ========================================================
echo.
echo This will export all your data safely.
echo Your local system will NOT be affected.
echo.
pause

set PGPASSWORD=hms2035
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=hms_db
set DB_USER=postgres
set EXPORT_FILE=customer_data_export.sql

:: Try to find psql
set PSQL=psql
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" set PSQL="C:\Program Files\PostgreSQL\16\bin\psql.exe"
    if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" set PSQL="C:\Program Files\PostgreSQL\15\bin\psql.exe"
    if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" set PSQL="C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

set PGDUMP=pg_dump
where pg_dump >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" set PGDUMP="C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
    if exist "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" set PGDUMP="C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    if exist "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" set PGDUMP="C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
)

echo [1/3] Verifying database connection...
%PSQL% -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'Connected OK' as status;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot connect to local database.
    echo Make sure PostgreSQL is running and password is correct.
    pause
    exit /b 1
)
echo       Connected OK.

echo.
echo [2/3] Exporting all data (patients, billing, staff, everything)...
echo       This may take 2-5 minutes depending on data size...
%PGDUMP% ^
    --data-only ^
    --no-owner ^
    --no-privileges ^
    --no-comments ^
    --disable-triggers ^
    --exclude-table=sessions ^
    --exclude-table=refresh_tokens ^
    --exclude-table=express_session ^
    --exclude-table=email_verification_tokens ^
    --exclude-table=hms_idempotency_keys ^
    --exclude-table=audit_log ^
    --exclude-table=hms_appointment_logs ^
    --exclude-table=agent_task_log ^
    -d "postgresql://%DB_USER%:%PGPASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%" ^
    -f "%EXPORT_FILE%"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Export failed. Check errors above.
    pause
    exit /b 1
)

echo.
echo [3/3] Verifying export file...
for %%A in ("%EXPORT_FILE%") do set FILESIZE=%%~zA
echo       Export file size: %FILESIZE% bytes

echo.
echo ========================================================
echo   EXPORT COMPLETE!
echo ========================================================
echo.
echo   File created: %EXPORT_FILE%
echo   Location: %~dp0%EXPORT_FILE%
echo.
echo   NEXT STEP: Send this file to your provider.
echo   (WhatsApp, USB drive, Google Drive, etc.)
echo.
pause
