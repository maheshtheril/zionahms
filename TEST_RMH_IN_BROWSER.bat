@echo off
title PREVIEW REVIVE MEDICITY HOSPITAL (MIGRATED DB)
color 0A

echo ==============================================================================
echo       LAUNCHING HMS APPLICATION CONNECTED TO MIGRATED CUSTOMER DB (RMH)       
echo ==============================================================================
echo.
echo Target Database: rmh_staging (Revive Medicity Hospital)
echo Records Ready  : 713 Patients, 1,894 Invoices, 3,721 Pharmacy Products
echo Admin Email    : maheshtheril@live.com
echo.
echo Starting Next.js Web Server on http://localhost:3000...
echo.

set DATABASE_URL=postgresql://postgres:hms2035@localhost:5432/rmh_staging
npm run dev
pause
