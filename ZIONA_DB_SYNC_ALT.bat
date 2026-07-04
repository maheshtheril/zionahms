@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title ZIONA DATABASE SYNC (ALTERNATIVE)
color 0B

echo ===================================================
echo      ZIONA DATABASE SYNC - SMART VERSION
echo ===================================================
echo.

:: -------------------------------------------------------
:: STEP 1: FIND NODE.JS IN COMMON LOCATIONS
:: -------------------------------------------------------
set "NODE_EXE="
set "NPX_EXE="

:: Check if already in PATH
where node.exe >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    for /f "delims=" %%i in ('where node.exe') do set "NODE_EXE=%%i"
)

:: If not in PATH, search common install folders
if "!NODE_EXE!"=="" (
    echo [INFO] Node.js not found in PATH. Searching common install locations...
    for %%d in (
        "C:\Program Files\nodejs\node.exe"
        "C:\Program Files (x86)\nodejs\node.exe"
        "%APPDATA%\nvm\current\node.exe"
        "C:\nvm\current\node.exe"
        "%LOCALAPPDATA%\Programs\node\node.exe"
    ) do (
        if exist %%d (
            set "NODE_EXE=%%~d"
            echo [FOUND] Node.js at: %%~d
        )
    )
)

if "!NODE_EXE!"=="" (
    echo.
    echo [ERROR] Node.js is NOT installed on this computer!
    echo.
    echo  SOLUTION OPTIONS:
    echo  ─────────────────────────────────────────────────
    echo  Option A: Install Node.js
    echo    1. Go to https://nodejs.org
    echo    2. Download the LTS version
    echo    3. Install it and run this file again.
    echo.
    echo  Option B: Use pgAdmin (No Node.js needed)
    echo    1. Open pgAdmin
    echo    2. Connect to the hms_db database
    echo    3. Open and run: ZIONA_DB_SYNC_PGADMIN.sql
    echo  ─────────────────────────────────────────────────
    pause
    exit /b 1
)

:: Get the folder of node to find npx
for %%i in ("!NODE_EXE!") do set "NODE_DIR=%%~dpi"
set "NPX_EXE=!NODE_DIR!npx.cmd"

if not exist "!NPX_EXE!" (
    set "NPX_EXE=!NODE_DIR!npx"
)

echo [OK] Node.js found: !NODE_EXE!
echo.

:: -------------------------------------------------------
:: STEP 2: STOP RUNNING APP
:: -------------------------------------------------------
echo [1/3] Stopping the application if it is running...
taskkill /F /IM node.exe /T >nul 2>&1
echo [OK] Done.
echo.

:: -------------------------------------------------------
:: STEP 3: CHECK DATABASE IS REACHABLE
:: -------------------------------------------------------
echo [2/3] Checking database connection...

:: Try to find psql to verify connection first
set "PSQL_EXE="
for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%d\bin\psql.exe" set "PSQL_EXE=%%d\bin\psql.exe"
)

if not "!PSQL_EXE!"=="" (
    "!PSQL_EXE!" postgresql://postgres:hms2035@localhost:5432/hms_db -c "SELECT 1;" >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo [ERROR] Cannot connect to the database!
        echo.
        echo  Please check:
        echo  1. Is PostgreSQL service running?
        echo     - Press Win+R, type: services.msc
        echo     - Find "postgresql-x64-*" and Start it
        echo  2. Is the password correct? (expected: hms2035)
        echo  3. Is the database "hms_db" created?
        echo.
        pause
        exit /b 1
    )
    echo [OK] Database is reachable.
) else (
    echo [INFO] psql not found, skipping pre-check. Will try sync anyway...
)

echo.

:: -------------------------------------------------------
:: STEP 4: RUN PRISMA DB PUSH
:: -------------------------------------------------------
echo [3/3] Updating Database Structure...
echo Please wait, this might take 1-2 minutes...
echo.

"!NPX_EXE!" prisma db push

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Database update FAILED!
    echo.
    echo  Common fixes:
    echo  ─────────────────────────────────────────────────
    echo  1. Make sure PostgreSQL is running
    echo  2. Run as Administrator (right-click this file)
    echo  3. Check .env file has correct DATABASE_URL
    echo  4. Try the pgAdmin option:
    echo     Open pgAdmin and run ZIONA_DB_SYNC_PGADMIN.sql
    echo  ─────────────────────────────────────────────────
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   SUCCESS: Database updated successfully!
echo   Your data is safe. You can now start the software.
echo ===================================================
echo.
pause
