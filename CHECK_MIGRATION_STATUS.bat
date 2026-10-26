@echo off
title ZIONA HMS - CUSTOMER DB HEALTH & COMPATIBILITY CHECK
color 0B

echo ==============================================================================
echo         RUNNING DIAGNOSTIC & HEALTH AUDIT ON MIGRATED CUSTOMER DATABASE        
echo ==============================================================================
echo.

node scripts/verify_customer_db.js rmh_staging

pause
