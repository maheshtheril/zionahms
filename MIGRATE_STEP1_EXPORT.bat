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

node export_database.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Export encountered an issue.
    pause
    exit /b 1
)

echo.
pause
