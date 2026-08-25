@echo off
setlocal
title ZIONA HEALTHCARE ERP - EMERGENCY REPAIR
color 0C
cd /d "%~dp0"

echo ========================================================
echo   ZIONA HEALTHCARE ERP - BLANK PAGE REPAIR TOOL
echo ========================================================
echo.
echo This tool will diagnose and fix the blank page issue.
echo Do NOT close this window until it says DONE.
echo.
pause

echo.
echo [1/6] Stopping all running services...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Done.

echo.
echo [2/6] Checking build integrity...
if not exist ".next" goto REBUILD
if not exist ".next\BUILD_ID" goto REBUILD
echo       Build exists. Checking standalone...

echo.
echo [3/6] Fixing standalone static files (most common blank page cause)...
if exist ".next\standalone" (
    echo       Standalone build detected. Copying static assets...
    if exist "public" (
        if not exist ".next\standalone\public" mkdir ".next\standalone\public"
        xcopy /E /Y /Q "public" ".next\standalone\public\" >nul 2>&1
        echo       [OK] Public assets copied.
    )
    if exist ".next\static" (
        if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static"
        xcopy /E /Y /Q ".next\static" ".next\standalone\.next\static\" >nul 2>&1
        echo       [OK] Static JS/CSS chunks copied.
    )
    echo       Static files fixed.
) else (
    echo       Not standalone mode. Skipping.
)
goto PRISMA

:REBUILD
echo.
echo [3/6] Build missing or corrupt. Clean rebuilding...
if exist ".next" rd /s /q ".next" >nul 2>&1
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed. Check errors above.
    pause
    exit /b 1
)
echo       [OK] Rebuild complete.
if exist ".next\standalone" (
    if exist "public" (
        if not exist ".next\standalone\public" mkdir ".next\standalone\public"
        xcopy /E /Y /Q "public" ".next\standalone\public\" >nul 2>&1
    )
    if exist ".next\static" (
        if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static"
        xcopy /E /Y /Q ".next\static" ".next\standalone\.next\static\" >nul 2>&1
    )
)

:PRISMA
echo.
echo [4/6] Regenerating Prisma database engine...
call npx prisma generate >nul 2>&1
echo       Done.

echo.
echo [5/6] Reconfiguring network IP...
if exist "configure_ip.js" (
    node configure_ip.js
) else (
    echo       Skipping - configure_ip.js not found.
)

echo.
echo [6/6] Launching application...
echo.
echo ========================================================
echo   REPAIR COMPLETE - Starting now...
echo ========================================================
echo.

set PORT=3002
set HOSTNAME=0.0.0.0
set "URL=http://localhost:3002/"
timeout /t 3 /nobreak >nul

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=%URL%
) else (
    start %URL%
)

if exist "whatsapp-bridge\server.js" (
    cd /d "%~dp0whatsapp-bridge"
    start /B "HMS_BRIDGE" cmd /c "node server.js > bridge.log 2>&1"
    cd /d "%~dp0"
)

if exist ".next\standalone\server.js" (
    echo Starting in HIGH-SPEED Standalone Mode...
    node .next/standalone/server.js
) else (
    echo Starting in Standard Mode...
    call npx next start -p 3002 -H 0.0.0.0
)

echo.
echo Application stopped.
pause
