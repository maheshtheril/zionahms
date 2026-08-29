@echo off
title ZIONA HMS - DATABASE AUTO-HEAL
echo ===================================================
echo   ZIONA HMS - REPAIRING DATABASE CONSTRAINTS & IDs
echo ===================================================
node scripts/fix-database-constraints.js
pause
