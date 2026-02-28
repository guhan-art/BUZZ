<#
.SYNOPSIS
    BUZZ App – Clean build & start both backend + frontend.

.DESCRIPTION
    0. Ensures MySQL is running (auto-starts via UAC if stopped).
    1. Kills any lingering Node / Expo processes on the backend & frontend ports.
    2. Clears Expo cache, Metro bundler cache, and Android build artifacts.
    3. Installs / refreshes npm dependencies for both projects.
    4. Starts the backend (nodemon) in the background.
    5. Starts the Expo dev server in the foreground.

.NOTES
    Run from the project root:  .\start-app.ps1
    Requires: Node.js, npm, npx, MySQL
#>

param(
    [int]$BackendPort = 5000,
    [switch]$SkipInstall,
    [switch]$Web            # pass -Web to auto-open web instead of default
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BUZZ App  -  Clean Start Script"      -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Ensure MySQL is running ──────────────────────────────────────────────
Write-Host "[0/7] Checking MySQL service..." -ForegroundColor Yellow
$mysqlSvc = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $mysqlSvc) {
    Write-Host "  -> No MySQL service found. Make sure MySQL is installed." -ForegroundColor Red
} elseif ($mysqlSvc.Status -ne "Running") {
    Write-Host "  -> $($mysqlSvc.Name) is $($mysqlSvc.Status). Starting (UAC prompt may appear)..." -ForegroundColor DarkYellow
    try {
        Start-Process powershell -Verb RunAs -ArgumentList "-Command", "Start-Service '$($mysqlSvc.Name)'" -Wait
        Start-Sleep -Seconds 2
        $mysqlSvc = Get-Service -Name $mysqlSvc.Name
        if ($mysqlSvc.Status -eq "Running") {
            Write-Host "  -> $($mysqlSvc.Name) is now Running" -ForegroundColor Green
        } else {
            Write-Host "  -> $($mysqlSvc.Name) status: $($mysqlSvc.Status) — check MySQL logs" -ForegroundColor Red
        }
    } catch {
        Write-Host "  -> Failed to start MySQL: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  -> $($mysqlSvc.Name) is Running" -ForegroundColor Green
}

# ── 1. Kill processes on Backend port ────────────────────────────────────────
Write-Host ""
Write-Host "[1/7] Killing processes on port $BackendPort..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object {
        try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } catch {}
    }
    Write-Host "  -> Killed existing process(es) on port $BackendPort" -ForegroundColor Green
} else {
    Write-Host "  -> Port $BackendPort is free" -ForegroundColor Green
}

# ── 2. Clean Expo / Metro / Android caches ───────────────────────────────────
Write-Host ""
Write-Host "[2/7] Clearing old build caches..." -ForegroundColor Yellow

$cachePaths = @(
    "$root\.expo",
    "$root\node_modules\.cache",
    "$root\android\build",
    "$root\android\app\build",
    "$root\android\.gradle",
    "$root\backend\node_modules\.cache",
    "$env:TEMP\metro-*",
    "$env:TEMP\haste-map-*",
    "$env:TEMP\expo-*"
)

foreach ($p in $cachePaths) {
    $resolved = Resolve-Path $p -ErrorAction SilentlyContinue
    if ($resolved) {
        foreach ($item in $resolved) {
            Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
            Write-Host "  -> Removed $item" -ForegroundColor DarkGray
        }
    }
}

Write-Host "  -> Caches cleared" -ForegroundColor Green

# ── 3. Install dependencies ──────────────────────────────────────────────────
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "[3/7] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $root
    npm install --legacy-peer-deps 2>&1 | Out-Null
    Pop-Location
    Write-Host "  -> Frontend deps ready" -ForegroundColor Green

    Write-Host ""
    Write-Host "[4/7] Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location "$root\backend"
    npm install 2>&1 | Out-Null
    Pop-Location
    Write-Host "  -> Backend deps ready" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[3/7] Skipping frontend install (-SkipInstall)" -ForegroundColor DarkGray
    Write-Host "[4/7] Skipping backend install (-SkipInstall)" -ForegroundColor DarkGray
}

# ── 4. Generate Prisma client (in case schema changed) ───────────────────────
Write-Host ""
Write-Host "[5/7] Generating Prisma client..." -ForegroundColor Yellow
Push-Location "$root\backend"
npx prisma generate 2>&1 | Out-Null
Pop-Location
Write-Host "  -> Prisma client generated" -ForegroundColor Green

# ── 5. Start backend in background ──────────────────────────────────────────
Write-Host ""
Write-Host "[6/7] Starting backend & frontend..." -ForegroundColor Yellow

$backendJob = Start-Job -Name "BuzzBackend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    $env:PORT = $using:BackendPort
    npx nodemon server.js 2>&1
} -ArgumentList "$root\backend"

Write-Host "  -> Backend starting on port $BackendPort (Job Id: $($backendJob.Id))" -ForegroundColor Green

# Give the backend a moment to boot
Start-Sleep -Seconds 2

# Quick health-check
try {
    $health = Invoke-WebRequest -Uri "http://localhost:$BackendPort" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($health.StatusCode -lt 400) {
        Write-Host "  -> Backend is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "  -> Backend still starting (check logs with: Receive-Job -Name BuzzBackend)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Expo dev server...          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Useful commands while running:" -ForegroundColor DarkGray
Write-Host "    Receive-Job -Name BuzzBackend   # view backend logs" -ForegroundColor DarkGray
Write-Host "    Stop-Job    -Name BuzzBackend   # stop backend" -ForegroundColor DarkGray
Write-Host ""

# ── 6. Start Expo (foreground – blocks until you press Ctrl+C) ───────────────
Push-Location $root
if ($Web) {
    npx expo start --web --clear
} else {
    npx expo start --clear
}
Pop-Location

# ── Cleanup on exit ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Stopping backend job..." -ForegroundColor Yellow
Stop-Job -Name "BuzzBackend" -ErrorAction SilentlyContinue
Remove-Job -Name "BuzzBackend" -Force -ErrorAction SilentlyContinue
Write-Host "Done. Goodbye!" -ForegroundColor Green
