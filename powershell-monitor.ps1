# Election Campaign Data Collection Monitor (PowerShell Version)
# Run this script for real-time monitoring without browser dependency

Write-Host "============================================" -ForegroundColor Green
Write-Host "    ELECTION CAMPAIGN DATA MONITOR" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting real-time monitoring..." -ForegroundColor Cyan
Write-Host "Reports every 2 minutes with Kurdistan priority" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    Write-Host ""
    Write-Host "[$timestamp] Checking data collection status..." -ForegroundColor Yellow
    Write-Host ""

    try {
        # Check collection status
        $statusResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/social/collection-status" -ErrorAction SilentlyContinue
        if ($statusResponse -and $statusResponse.data) {
            Write-Host "✅ Collection Status: $($statusResponse.data.collection_active)" -ForegroundColor Green
            Write-Host "📊 Statistics:" -ForegroundColor Cyan
            foreach ($stat in $statusResponse.data.statistics) {
                Write-Host "   $($stat.platform): $($stat.total_collected) total, $($stat.last_24h) last 24h" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Server not responding - check if server is running" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Connection failed - server may not be running" -ForegroundColor Red
    }

    Write-Host ""

    try {
        # Check Kurdistan priority data
        $kurdistanResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/social/priority-analytics?period=24h" -ErrorAction SilentlyContinue
        if ($kurdistanResponse -and $kurdistanResponse.data) {
            Write-Host "🟢 Kurdistan Priority Data:" -ForegroundColor Green
            Write-Host "   Total Mentions (24h): $($kurdistanResponse.data.total_kurdistan_mentions)" -ForegroundColor White

            if ($kurdistanResponse.data.kurdistan_breakdown) {
                Write-Host "   Language Breakdown:" -ForegroundColor Cyan
                foreach ($lang in $kurdistanResponse.data.kurdistan_breakdown) {
                    Write-Host "      $($lang.language): $($lang.mentions) mentions" -ForegroundColor White
                }
            }
        } else {
            Write-Host "🟡 No Kurdistan data yet (collection in progress)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Kurdistan API not responding" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Next update in 2 minutes... Press Ctrl+C to stop" -ForegroundColor Gray
    Start-Sleep -Seconds 120
    Clear-Host

    Write-Host "============================================" -ForegroundColor Green
    Write-Host "    ELECTION CAMPAIGN DATA MONITOR" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
}
