# ==============================================================================
#            ZIONA HOSPITAL MANAGEMENT SYSTEM - ONE-CLICK MIGRATOR (PowerShell)
#           Safe Zero-Downtime Live Database Upgrade for 24/7 Hospitals          
# ==============================================================================

param(
    [string]$TargetDatabase = ""
)

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "            ZIONA HOSPITAL MANAGEMENT SYSTEM - ONE-CLICK MIGRATOR             " -ForegroundColor Yellow
Write-Host "           Safe Zero-Downtime Live Database Upgrade for 24/7 Hospitals        " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Check for node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found in system PATH." -ForegroundColor Red
    Write-Host "Please install Node.js (v18+) to run this migration tool."
    exit 1
}

$scriptPath = Join-Path $PSScriptRoot "migrate_customer_live.js"

if ($TargetDatabase) {
    node $scriptPath $TargetDatabase
} else {
    node $scriptPath
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Upgrade complete! The hospital system is live and fully compatible." -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Red
    Write-Host "[ERROR] Migration encountered an error. All changes were safely rolled back." -ForegroundColor Red
    Write-Host "==============================================================================" -ForegroundColor Red
}
