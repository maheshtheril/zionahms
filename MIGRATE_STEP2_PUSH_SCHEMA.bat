@echo off
setlocal
title ZIONA - STEP 2: PUSH LATEST SCHEMA TO CLOUD
color 0B
cd /d "%~dp0"

echo ========================================================
echo   ZIONA HEALTHCARE ERP - SYNC CLOUD SCHEMA
echo   Run this on YOUR machine BEFORE importing data
echo ========================================================
echo.
echo This updates the cloud database structure to the latest version.
echo No data will be lost.
echo.
pause

set NEON_URL=postgresql://neondb_owner:npg_LKIg3tRXfbp9@ep-flat-firefly-a19fhxoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

echo [1/2] Pushing latest schema to Neon cloud...
set DATABASE_URL=%NEON_URL%
call npx prisma db push --skip-generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Schema push failed. Check internet connection and Neon credentials.
    pause
    exit /b 1
)

echo.
echo [2/2] Schema sync complete.
echo.
echo ========================================================
echo   STEP 2 DONE - Now run MIGRATE_STEP3_IMPORT.bat
echo ========================================================
echo.
pause
