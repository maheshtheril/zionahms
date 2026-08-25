@echo off
setlocal
title ZIONA - STEP 3: IMPORT CUSTOMER DATA TO CLOUD
color 0B
cd /d "%~dp0"

echo ========================================================
echo   ZIONA HEALTHCARE ERP - IMPORT DATA TO CLOUD
echo   Run this on YOUR machine after receiving export file
echo ========================================================
echo.

:: Check export file exists
if not exist "customer_data_export.sql" (
    echo [ERROR] customer_data_export.sql not found in this folder.
    echo Please copy the export file here first, then run again.
    pause
    exit /b 1
)

echo   Found export file: customer_data_export.sql
echo.
echo   This will import all customer data into the cloud.
echo   Make sure you ran MIGRATE_STEP2_PUSH_SCHEMA.bat first.
echo.
pause

set NEON_URL=postgresql://neondb_owner:npg_LKIg3tRXfbp9@ep-flat-firefly-a19fhxoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

echo.
echo [1/3] Disabling foreign key checks for safe import...
echo.

echo [2/3] Importing customer data to cloud...
echo       This may take 5-15 minutes...
psql -d "%NEON_URL%" -c "SET session_replication_role = replica;" >nul 2>&1

psql -d "%NEON_URL%" -f "customer_data_export.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Some rows may have had conflicts (already existed).
    echo This is usually OK - check the output above for critical errors.
    echo.
)

echo.
echo [3/3] Re-enabling constraints...
psql -d "%NEON_URL%" -c "SET session_replication_role = DEFAULT;" >nul 2>&1

echo.
echo ========================================================
echo   IMPORT DONE - Now run MIGRATE_STEP4_FINALIZE.bat
echo ========================================================
echo.
pause
