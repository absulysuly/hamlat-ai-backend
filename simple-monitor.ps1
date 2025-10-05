# Election Campaign Monitor (Simple PowerShell Version)
# Run this for real-time monitoring

Write-Host "============================================" -ForegroundColor Green
Write-Host "    ELECTION CAMPAIGN MONITOR" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting monitoring..." -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    Write-Host ""
    Write-Host "[$timestamp] Checking status..." -ForegroundColor Yellow

    try {
        # Check if server is running
        $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue
        if ($health) {
            Write-Host "Server Status: RUNNING" -ForegroundColor Green
            Write-Host "Health: $($health.status)" -ForegroundColor Green
        } else {
            Write-Host "Server Status: NOT RUNNING" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Server Status: NOT RUNNING" -ForegroundColor Red
    }

    try {
        # Check collection status
        $status = Invoke-RestMethod -Uri "http://localhost:3000/api/social/collection-status" -ErrorAction SilentlyContinue
        if ($status -and $status.data) {
            Write-Host "Collection Active: $($status.data.collection_active)" -ForegroundColor Cyan
            Write-Host "Statistics:" -ForegroundColor Cyan
            foreach ($stat in $status.data.statistics) {
                Write-Host "  $($stat.platform): $($stat.total_collected) total" -ForegroundColor White
            }
        }
    }
    catch {
        Write-Host "Collection API not responding" -ForegroundColor Yellow
    }

    try {
        # Check Kurdistan data
        $kurdistan = Invoke-RestMethod -Uri "http://localhost:3000/api/social/priority-analytics?period=24h" -ErrorAction SilentlyContinue
        if ($kurdistan -and $kurdistan.data) {
            Write-Host "Kurdistan Mentions (24h): $($kurdistan.data.total_kurdistan_mentions)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Kurdistan API not responding" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Next check in 2 minutes... Press Ctrl+C to stop" -ForegroundColor Gray
    Start-Sleep -Seconds 120
    Clear-Host

    Write-Host "============================================" -ForegroundColor Green
    Write-Host "    ELECTION CAMPAIGN MONITOR" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
}
