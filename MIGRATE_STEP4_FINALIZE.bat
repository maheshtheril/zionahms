@echo off
setlocal
title ZIONA - STEP 4: FINALIZE CLOUD SETUP
color 0B
cd /d "%~dp0"

echo ========================================================
echo   ZIONA HEALTHCARE ERP - FINALIZE & VERIFY
echo   Run this on YOUR machine after import
echo ========================================================
echo.

node finalize_migration.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Finalize encountered an issue.
    pause
    exit /b 1
)

echo.
pause
