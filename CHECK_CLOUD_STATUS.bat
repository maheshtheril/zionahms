@echo off
title ZIONA HMS - NEON CLOUD DATABASE AUDIT
color 0B

echo ==============================================================================
echo              AUDITING NEON SERVERLESS CLOUD DATABASE (AWS)                     
echo ==============================================================================
echo.

node scripts/inspect_cloud_db.js

pause
