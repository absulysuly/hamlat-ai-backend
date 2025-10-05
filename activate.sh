#!/bin/bash

# 🚀 HAMLATAI ACTIVATION SCRIPT
# This script will activate your data collection system immediately

echo "🚀 HAMLATAI DATA COLLECTION ACTIVATION"
echo "======================================"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "📋 Please copy .env.example to .env and add your credentials"
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking environment configuration..."

REQUIRED_VARS=("DATABASE_URL" "FACEBOOK_ACCESS_TOKEN" "YOUTUBE_API_KEY" "TWITTER_BEARER_TOKEN")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📋 Please add these to your .env file"
    echo "💡 See ACTIVATION_CHECKLIST.md for setup instructions"
    exit 1
fi

echo "✅ Environment configuration complete"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Run database migrations
echo "🗄️ Setting up database..."
npm run db:deploy

# Start the server
echo "🚀 Starting HamlatAI server..."
echo ""
echo "🟢 KURDISTAN PRIORITY DATA COLLECTION ACTIVATING..."
echo "📊 Dashboard: http://localhost:5000"
echo "🔗 API: http://localhost:5000/api"
echo "📚 Documentation: http://localhost:5000/api-docs"
echo ""

# Start server in background
npm start &

echo ""
echo "✅ ACTIVATION COMPLETE!"
echo ""
echo "🎯 Your system is now collecting:"
echo "   🥇 Kurdistan data (3x frequency)"
echo "   📱 Social media from all platforms"
echo "   🌍 Kurdish language content"
echo "   👥 Candidate information"
echo ""
echo "📊 Monitor progress at: http://localhost:5000"
echo "🔍 Check logs in: logs/ directory"
echo ""
echo "⏰ Data collection starts immediately!"
echo "🔔 You should see activity in 5-10 minutes"
echo ""
echo "Happy campaigning! 🟢📊"
