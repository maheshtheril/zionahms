@echo off
title ZIONA HMS - DATABASE AUTO-HEAL
echo ===================================================
echo   ZIONA HMS - REPAIRING DATABASE CONSTRAINTS AND IDs
echo ===================================================
echo.
set "NODE_PATH=%~dp0node_modules;%~dp0.next\standalone\node_modules;%~dp0..\node_modules"
node "%~dp0scripts\fix-database-constraints.js"
echo.
echo ===================================================
echo   Database repair finished. Press any key to exit.
echo ===================================================
pause
