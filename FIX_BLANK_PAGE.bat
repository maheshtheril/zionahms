@echo off
title FIXING BLANK PAGE...
color 0A
cd /d "%~dp0"
echo.
echo  Fixing blank page - please wait...
echo.
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
if exist ".next\static" (
    if not exist ".next\standalone\.next\static" mkdir ".next\standalone\.next\static"
    xcopy /E /Y /Q ".next\static" ".next\standalone\.next\static\" >nul 2>&1
)
if exist "public" (
    if not exist ".next\standalone\public" mkdir ".next\standalone\public"
    xcopy /E /Y /Q "public" ".next\standalone\public\" >nul 2>&1
)
echo  Done! Starting application on port 3002...
echo.
set PORT=3002
set HOSTNAME=0.0.0.0
timeout /t 2 /nobreak >nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3002/ >nul 2>&1
if exist ".next\standalone\server.js" (
    node .next/standalone/server.js
) else (
    call npx next start -p 3002 -H 0.0.0.0
)
pause
