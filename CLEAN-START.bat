@echo off
cls
echo ========================================
echo   HamlatAI - CLEAN START
echo ========================================
echo.

echo [1/4] Killing all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Changing to correct directory...
cd /d E:\Election-campaign

echo [3/4] Starting Backend (Demo Server)...
start "HamlatAI-Backend" cmd /k "cd /d E:\Election-campaign && npm run demo"
timeout /t 4 /nobreak >nul

echo [4/4] Starting Frontend...
start "HamlatAI-Frontend" cmd /k "cd /d E:\Election-campaign\client && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo ========================================
echo   DONE! Now do this:
echo ========================================
echo.
echo 1. Close ALL browser tabs
echo 2. Clear browser cache (Ctrl+Shift+Delete)
echo 3. Open NEW tab: http://localhost:5173
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:5173
