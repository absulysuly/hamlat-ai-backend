@echo off
REM 🚀 HAMLATAI ACTIVATION SCRIPT - WINDOWS VERSION
REM This script will activate your data collection system immediately

echo 🚀 HAMLATAI DATA COLLECTION ACTIVATION
echo ======================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ❌ .env file not found!
    echo 📋 Please copy .env.example to .env and add your credentials
    pause
    exit /b 1
)

REM Check for required environment variables
echo 🔍 Checking environment configuration...
echo.

set "MISSING_COUNT=0"

findstr /C:"DATABASE_URL=" .env >nul 2>&1
if errorlevel 1 (
    echo ❌ DATABASE_URL is missing
    set /a "MISSING_COUNT+=1"
)

findstr /C:"FACEBOOK_ACCESS_TOKEN=" .env >nul 2>&1
if errorlevel 1 (
    echo ❌ FACEBOOK_ACCESS_TOKEN is missing
    set /a "MISSING_COUNT+=1"
)

findstr /C:"YOUTUBE_API_KEY=" .env >nul 2>&1
if errorlevel 1 (
    echo ❌ YOUTUBE_API_KEY is missing
    set /a "MISSING_COUNT+=1"
)

findstr /C:"TWITTER_BEARER_TOKEN=" .env >nul 2>&1
if errorlevel 1 (
    echo ❌ TWITTER_BEARER_TOKEN is missing
    set /a "MISSING_COUNT+=1"
)

if %MISSING_COUNT% gtr 0 (
    echo.
    echo 📋 Please add missing variables to your .env file
    echo 💡 See ACTIVATION_CHECKLIST.md for setup instructions
    pause
    exit /b 1
)

echo ✅ Environment configuration complete
echo.

REM Install dependencies if needed
echo 📦 Installing dependencies...
call npm install
echo.

REM Build TypeScript
echo 🔨 Building TypeScript...
call npm run build
echo.

REM Run database migrations
echo 🗄️ Setting up database...
call npm run db:deploy
echo.

REM Start the server
echo 🚀 Starting HamlatAI server...
echo.
echo 🟢 KURDISTAN PRIORITY DATA COLLECTION ACTIVATING...
echo 📊 Dashboard: http://localhost:5000
echo 🔗 API: http://localhost:5000/api
echo 📚 Documentation: http://localhost:5000/api-docs
echo.

REM Start server in new window
start "HamlatAI Server" cmd /k "npm start"

echo.
echo ✅ ACTIVATION COMPLETE!
echo.
echo 🎯 Your system is now collecting:
echo    🥇 Kurdistan data ^(3x frequency^)
echo    📱 Social media from all platforms
echo    🌍 Kurdish language content
echo    👥 Candidate information
echo.
echo 📊 Monitor progress at: http://localhost:5000
echo 🔍 Check logs in: logs/ directory
echo.
echo ⏰ Data collection starts immediately!
echo 🔔 You should see activity in 5-10 minutes
echo.
echo Happy campaigning! 🟢📊
echo.
pause
