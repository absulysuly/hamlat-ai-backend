@echo off
echo.
echo ========================================
echo   HamlatAI Demo - Starting...
echo ========================================
echo.

echo Starting Backend Server...
start "HamlatAI Backend" cmd /k "cd /d %~dp0 && npm run demo"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "HamlatAI Frontend" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   HamlatAI Demo Started!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Demo Login:
echo   Email: demo@hamlatai.com
echo   Password: demo123
echo.
echo Opening browser in 3 seconds...
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to close this window...
pause >nul
