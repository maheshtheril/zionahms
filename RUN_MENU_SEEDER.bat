@echo off
title ZIONA HMS - RUN MENU SEEDER
color 0B

echo ===================================================
echo      ZIONA HMS - SAFE MENU SEEDER
echo ===================================================
echo.
echo This tool safely recreates any missing default menus
echo without erasing any patient or clinical data.
echo.

echo [1/1] Running Menu Seeder...
call npx tsx SEED_MENUS.ts

echo.
echo ===================================================
echo   COMPLETED!
echo   You can safely close this window now.
echo ===================================================
pause
