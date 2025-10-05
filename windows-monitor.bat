@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    ELECTION CAMPAIGN DATA MONITOR
echo ========================================
echo.
echo Starting real-time monitoring...
echo Reports every 10 minutes with Kurdistan priority
echo.

:loop
echo.
echo [%date% %time%] Checking data collection status...
echo.

REM Try to get collection status via API
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/social/collection-status' -ErrorAction SilentlyContinue; if ($response) { Write-Host 'Collection Status: ' $response.data.collection_active } else { Write-Host 'Server not responding - check if server is running' } } catch { Write-Host 'Connection failed' }"

echo.
echo [%date% %time%] Checking Kurdistan priority collection...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/social/priority-analytics?period=24h' -ErrorAction SilentlyContinue; if ($response.data.total_kurdistan_mentions) { Write-Host 'Kurdistan Mentions (24h): ' $response.data.total_kurdistan_mentions } else { Write-Host 'No Kurdistan data yet' } } catch { Write-Host 'API not responding' }"

echo.
echo [%date% %time%] Platform activity check...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/social/analytics?period=1h' -ErrorAction SilentlyContinue; if ($response.data.metrics) { foreach ($metric in $response.data.metrics) { Write-Host $metric.platform ': ' $metric.total_mentions ' mentions' } } else { Write-Host 'No platform data yet' } } catch { Write-Host 'API not responding' }"

echo.
echo Next update in 2 minutes... Press Ctrl+C to stop
timeout /t 120 >nul
goto loop
