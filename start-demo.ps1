# start-demo.ps1
# Run this once at the start of your session.
# It opens the Hardhat node in its own persistent window,
# then deploys, seeds, and starts the frontend.
#
# Usage (from project root):
#   .\start-demo.ps1

$root = $PSScriptRoot

Write-Host ""
Write-Host "=== SupplyChain DApp — Demo Startup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Kill anything already on 8545 or 5173
$ports = @(8545, 5173)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "  Cleared port $port" -ForegroundColor Yellow
    }
}
Start-Sleep -Milliseconds 500

# 2. Open Hardhat node in its own terminal window (stays open permanently)
Write-Host "  Starting Hardhat node in new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root'; Write-Host '=== Hardhat Node ===' -ForegroundColor Cyan; npx hardhat node"
)

# 3. Wait for node to be ready
Write-Host "  Waiting for node on :8545..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-RestMethod -Uri "http://127.0.0.1:8545" -Method Post `
            -ContentType "application/json" `
            -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' `
            -ErrorAction Stop
        if ($r.result -eq "0x7a69") { $ready = $true; break }
    } catch {}
}

if (-not $ready) {
    Write-Host "  ERROR: Hardhat node did not start. Check the new window." -ForegroundColor Red
    exit 1
}
Write-Host "  Node ready (chainId 31337)" -ForegroundColor Green

# 4. Deploy contract
Write-Host ""
Write-Host "  Deploying contract..." -ForegroundColor Yellow
& npx hardhat run scripts/deploy.ts --network localhost 2>&1 | Where-Object { $_ -notmatch "WARNING" } | Write-Host

# 5. Seed products
Write-Host ""
Write-Host "  Seeding demo products..." -ForegroundColor Yellow
& npx hardhat run scripts/seedProducts.ts --network localhost 2>&1 | Where-Object { $_ -notmatch "WARNING" } | Write-Host

# 6. Start frontend in its own terminal window
Write-Host ""
Write-Host "  Starting frontend in new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\frontend'; Write-Host '=== Frontend ===' -ForegroundColor Cyan; npm run dev"
)

# 7. Wait for frontend
Write-Host "  Waiting for frontend on :5173..." -ForegroundColor Yellow
$feReady = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -ErrorAction Stop
        $feReady = $true; break
    } catch {}
}

Write-Host ""
if ($feReady) {
    Write-Host "=== All services ready ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Hardhat node  : http://localhost:8545  (keep that window open)" -ForegroundColor White
    Write-Host "  Frontend      : http://localhost:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "  Products on-chain:" -ForegroundColor White
    & npx hardhat run scripts/inspect.ts --network localhost 2>&1 | Where-Object { $_ -notmatch "WARNING" } | Write-Host
    Write-Host ""
    Write-Host "  Run demo:    npx hardhat run scripts/live-demo.ts --network localhost" -ForegroundColor Green
    Write-Host "  Run cheats:  npx hardhat run scripts/try-cheat.ts --network localhost" -ForegroundColor Green
    Write-Host ""
    Start-Process "http://localhost:5173"
} else {
    Write-Host "  Frontend window opened but :5173 not responding yet — check that window." -ForegroundColor Yellow
}
