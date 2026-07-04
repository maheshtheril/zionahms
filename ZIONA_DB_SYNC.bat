@echo off
setlocal
cd /d "%~dp0"
title ZIONA DATABASE SYNC
color 0B

echo ===================================================
echo      ZIONA DATABASE SYNCHRONIZATION TOOL
echo ===================================================
echo.
echo  If this fails, use one of these alternatives:
echo  -- ZIONA_DB_SYNC_ALT.bat   (Smart auto-detect)
echo  -- ZIONA_DB_SYNC_PGADMIN.sql  (pgAdmin, no Node.js needed)
echo.
echo This will update the customer's database structure to 
echo match the latest software update.
echo.
echo [1/2] Stopping the application if it is running...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo [2/2] Updating Database Structure...
echo Please wait, this might take a minute...
call npx.cmd prisma db push

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Database update failed! Please check the error above.
    echo Ensure your database is running and .env is correct.
) else (
    echo.
    echo ===================================================
    echo   SUCCESS: Database updated successfully!
    echo   No data was lost. You can now start the software.
    echo ===================================================
)

echo.
pause
