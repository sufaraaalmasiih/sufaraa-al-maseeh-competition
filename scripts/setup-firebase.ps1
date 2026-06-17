# Firebase setup — سفراء المسيح
# Run in PowerShell from project root.

$ErrorActionPreference = "Stop"
$ProjectId = "sufaraaalmasiih-53478"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $Root "..")

Write-Host "=== 1) Firebase login ===" -ForegroundColor Cyan
Write-Host "Use the Google account that OWNS project: $ProjectId"
npx firebase-tools login

Write-Host "`n=== 2) Select project ===" -ForegroundColor Cyan
npx firebase-tools use $ProjectId

Write-Host "`n=== 3) Deploy rules + indexes + storage ===" -ForegroundColor Cyan
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project $ProjectId

Write-Host "`n=== 4) Seed Firestore (optional — needs service account JSON) ===" -ForegroundColor Cyan
if ($env:FIREBASE_SERVICE_ACCOUNT) {
    node scripts/seed-firestore-bootstrap.mjs
} else {
    Write-Host "Skipped seed. Either:" -ForegroundColor Yellow
    Write-Host "  A) set FIREBASE_SERVICE_ACCOUNT=path\to\key.json then re-run step 4"
    Write-Host "  B) Open deployed site -> /facilitator -> Settings -> Initialize database"
}

Write-Host "`n=== 5) App Hosting ===" -ForegroundColor Cyan
Write-Host "Deploy from Firebase Console -> App Hosting -> Roll out"
Write-Host "Add NEXT_PUBLIC_FIREBASE_* env vars (see .env.local)"
Write-Host "`nDone." -ForegroundColor Green
