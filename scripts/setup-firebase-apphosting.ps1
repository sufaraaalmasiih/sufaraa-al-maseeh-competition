# One-time setup: Firebase App Hosting for سفراء المسيح
# Prerequisites:
#   1. Blaze plan: https://console.firebase.google.com/project/sufaraaalmasiih-53478/usage/details
#   2. firebase login (npx firebase-tools login)
#   3. .env.local with CLOUDINARY_* and optional service account JSON path

$ErrorActionPreference = "Stop"
$ProjectId = "sufaraaalmasiih-53478"
$BackendId = "sufaraa-web"
$Region = "europe-west1"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Invoke-Firebase {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & npx firebase-tools @Args
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "=== Firebase App Hosting setup ($ProjectId) ===" -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
  Write-Host "Missing .env.local — copy from .env.example and fill values." -ForegroundColor Red
  exit 1
}

$envMap = @{}
Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $pair = $_ -split '=', 2
  if ($pair.Length -eq 2) {
    $envMap[$pair[0].Trim()] = $pair[1].Trim()
  }
}

Write-Host "`n[1/5] Deploy Firestore rules..." -ForegroundColor Yellow
Invoke-Firebase deploy --only firestore:rules --project $ProjectId --non-interactive

Write-Host "`n[2/5] Upload secrets to Secret Manager..." -ForegroundColor Yellow
if ($envMap["CLOUDINARY_API_KEY"]) {
  $envMap["CLOUDINARY_API_KEY"] | Invoke-Firebase apphosting:secrets:set CLOUDINARY_API_KEY --project $ProjectId --force
}
if ($envMap["CLOUDINARY_API_SECRET"]) {
  $envMap["CLOUDINARY_API_SECRET"] | Invoke-Firebase apphosting:secrets:set CLOUDINARY_API_SECRET --project $ProjectId --force
}

$serviceAccountPath = $envMap["FIREBASE_SERVICE_ACCOUNT_PATH"]
if (-not $serviceAccountPath -and $envMap["FIREBASE_SERVICE_ACCOUNT"] -match '^\s*\{') {
  $serviceAccountPath = ".firebase-service-account.json"
  $envMap["FIREBASE_SERVICE_ACCOUNT"] | Set-Content -Encoding utf8 $serviceAccountPath
}
if ($serviceAccountPath -and (Test-Path $serviceAccountPath)) {
  Get-Content -Raw $serviceAccountPath | Invoke-Firebase apphosting:secrets:set FIREBASE_SERVICE_ACCOUNT --project $ProjectId --force
} else {
  Write-Host "Skip FIREBASE_SERVICE_ACCOUNT — add FIREBASE_SERVICE_ACCOUNT_PATH in .env.local or paste JSON." -ForegroundColor DarkYellow
}

Write-Host "`n[3/5] Create App Hosting backend (if missing)..." -ForegroundColor Yellow
$backends = Invoke-Firebase apphosting:backends:list --project $ProjectId --json 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "App Hosting requires Blaze plan. Upgrade then re-run this script." -ForegroundColor Red
  Write-Host "https://console.firebase.google.com/project/$ProjectId/usage/details"
  exit 1
}

$existing = ($backends | ConvertFrom-Json).result.backends | Where-Object { $_.name -match $BackendId }
if (-not $existing) {
  Invoke-Firebase apphosting:backends:create `
    --project $ProjectId `
    --backend $BackendId `
    --primary-region $Region `
    --runtime nodejs22 `
    --root-dir / `
    --app 1:118820359157:web:ded14cbe45cb2f5a5baebc
}

Write-Host "`n[4/5] Grant secret access to backend..." -ForegroundColor Yellow
foreach ($secret in @("CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "FIREBASE_SERVICE_ACCOUNT")) {
  Invoke-Firebase apphosting:secrets:grantaccess $secret --backend $BackendId --project $ProjectId 2>$null
}

Write-Host "`n[5/5] Connect GitHub in Firebase Console (once):" -ForegroundColor Yellow
Write-Host "  App Hosting -> $BackendId -> Settings -> Git repository -> main branch"
Write-Host "  Or push to main after connection for automatic rollout."
Write-Host "`nDone. Open: https://console.firebase.google.com/project/$ProjectId/apphosting" -ForegroundColor Green
