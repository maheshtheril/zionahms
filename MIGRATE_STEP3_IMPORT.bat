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

node import_database.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Import encountered an issue.
    pause
    exit /b 1
)

echo.
pause
