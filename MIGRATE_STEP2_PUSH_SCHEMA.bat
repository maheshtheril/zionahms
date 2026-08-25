@echo off
setlocal
title ZIONA - STEP 2: PUSH LATEST SCHEMA TO CLOUD
color 0B
cd /d "%~dp0"

echo ========================================================
echo   ZIONA HEALTHCARE ERP - SYNC CLOUD SCHEMA
echo ========================================================
echo.

npx prisma db push --accept-data-loss

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Schema push failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   STEP 2 DONE - Now run MIGRATE_STEP3_IMPORT.bat
echo ========================================================
echo.
pause
