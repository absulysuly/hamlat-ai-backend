# ⚡ HamlatAI Quick Start Guide

Get your AI campaign platform running in **5 minutes**!

## 🎯 Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- A Groq API key (free from https://console.groq.com)

## 📦 Step 1: Install

```bash
# Clone repository
git clone https://github.com/yourusername/hamlatai.git
cd hamlatai

# Install dependencies
npm install
cd client && npm install && cd ..
```

## 🗄️ Step 2: Database Setup

```bash
# Create database
createdb hamlatai

# Run migrations
psql hamlatai < config/database.sql
```

## ⚙️ Step 3: Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit .env - MINIMUM required:
DATABASE_URL=postgresql://user:password@localhost:5432/hamlatai
JWT_SECRET=your-random-secret-key-here
GROQ_API_KEY=your-groq-api-key
```

## 🚀 Step 4: Run

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd client && npm run dev
```

## 🌐 Step 5: Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

## 👤 Create First User

1. Go to http://localhost:5173
2. Click "Register"
3. Fill in:
   - Name: Your name
   - Email: your@email.com
   - Password: (your choice)
   - Governorate: Baghdad (or any)
   - Language: العربية / کوردی / English
4. Click "Register"

## ✅ Test Features

### 1. Generate Content
- Go to "Content" page
- Click "Generate Content"
- See AI-generated posts in Arabic/Kurdish/English

### 2. Voice Commands (Chrome/Edge only)
- Click microphone icon (bottom right)
- Say: "افتح التحليلات" (Arabic) or "open analytics" (English)
- Dashboard navigates automatically

### 3. View Analytics
- Go to "Analytics" page
- See engagement charts and metrics

## 🎨 Customize

### Change Language
- Click globe icon (top right)
- Select: العربية / کوردی / English

### Add Social Accounts
- Go to Settings
- Connect Facebook/Instagram

## 🔧 Troubleshooting

### Database Error?
```bash
# Check PostgreSQL is running
pg_isready

# Recreate database
dropdb hamlatai
createdb hamlatai
psql hamlatai < config/database.sql
```

### Port Already in Use?
```bash
# Change port in .env
PORT=3001
```

### Groq API Error?
- Get free key: https://console.groq.com
- Add to .env: `GROQ_API_KEY=your-key`

## 📚 Next Steps

1. **Read Full Docs**: See `README.md`
2. **Deploy to Production**: See `DEPLOYMENT.md`
3. **Configure Payments**: Add Zain Cash/Qi Card keys
4. **Enable AI Videos**: Add D-ID API key
5. **Connect Social Media**: Add Facebook/Instagram APIs

## 🆘 Need Help?

- **Documentation**: `/README.md`
- **Installation Guide**: `/INSTALLATION.md`
- **Deployment Guide**: `/DEPLOYMENT.md`
- **Issues**: GitHub Issues

---

**You're all set! 🎉 Start managing campaigns with AI!**
