@echo off
cls
echo.
echo ========================================
echo   HamlatAI Demo - Clean Start
echo ========================================
echo.

cd /d E:\Election-campaign

echo [1/3] Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend Server...
start "HamlatAI-Backend" cmd /k "cd /d E:\Election-campaign && npm run demo"
timeout /t 4 /nobreak >nul

echo [3/3] Starting Frontend Server...
start "HamlatAI-Frontend" cmd /k "cd /d E:\Election-campaign\client && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo ========================================
echo   HamlatAI Demo is Running!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Login Credentials:
echo   Email: demo@hamlatai.com
echo   Password: demo123
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Done! Check the browser.
echo Press any key to exit...
pause >nul
