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
pause

set NEON_URL=postgresql://neondb_owner:npg_LKIg3tRXfbp9@ep-flat-firefly-a19fhxoa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
set TENANT_ID=41537389-7316-4a86-97a3-de21ff9833f7

echo [1/5] Fixing accounting setup for this tenant...
psql -d "%NEON_URL%" -f "FIX_ACCOUNTING_SETUP.sql"
echo       Done.

echo.
echo [2/5] Ensuring modules are enabled for this tenant...
psql -d "%NEON_URL%" -c "UPDATE tenant_module SET enabled = true WHERE tenant_id = '%TENANT_ID%' AND module_key IN ('hms','finance','inventory','system');"
echo       Done.

echo.
echo [3/5] Verifying data counts...
echo.
echo --- PATIENT COUNT ---
psql -d "%NEON_URL%" -c "SELECT COUNT(*) as patients FROM hms_patient WHERE tenant_id = '%TENANT_ID%';"
echo.
echo --- INVOICE COUNT ---
psql -d "%NEON_URL%" -c "SELECT COUNT(*) as invoices FROM hms_invoice WHERE tenant_id = '%TENANT_ID%';"
echo.
echo --- USER COUNT ---
psql -d "%NEON_URL%" -c "SELECT email, created_at FROM app_user WHERE tenant_id = '%TENANT_ID%';"
echo.

echo [4/5] Forcing password reset for customer user...
psql -d "%NEON_URL%" -c "UPDATE app_user SET must_reset_password = true WHERE tenant_id = '%TENANT_ID%';" >nul 2>&1
echo       Users will be asked to set a new password on first login.

echo.
echo [5/5] Clearing old local sessions (security cleanup)...
psql -d "%NEON_URL%" -c "DELETE FROM sessions WHERE tenant_id = '%TENANT_ID%';" >nul 2>&1
psql -d "%NEON_URL%" -c "DELETE FROM refresh_tokens WHERE tenant_id = '%TENANT_ID%';" >nul 2>&1
echo       Done.

echo.
echo ========================================================
echo   MIGRATION COMPLETE!
echo ========================================================
echo.
echo   Tell your customer:
echo   1. Open browser and go to: https://www.zionahms.com
echo   2. Login with their email: kkk@live.com
echo   3. Click FORGOT PASSWORD to set a new password
echo   4. All their data (patients, bills, etc.) will be there
echo.
echo   They NEVER need to use the .bat files again!
echo.
pause
