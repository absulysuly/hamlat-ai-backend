# 🪟 Windows Setup Guide for HamlatAI

## ⚠️ Before You Start

You need to install PostgreSQL first. Here's how:

### Step 1: Install PostgreSQL

1. **Download PostgreSQL**:
   - Go to: https://www.postgresql.org/download/windows/
   - Download the installer (version 14 or higher)
   - Run the installer

2. **During Installation**:
   - Set a password for `postgres` user (remember this!)
   - Port: Keep default `5432`
   - Install all components

3. **Verify Installation**:
   ```powershell
   # Add PostgreSQL to PATH (if not done automatically)
   # Then test:
   psql --version
   ```

### Step 2: Create Database

```powershell
# Open PowerShell as Administrator
# Login to PostgreSQL
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE hamlatai;
\q
```

### Step 3: Run Database Migrations

```powershell
# From project root
psql -U postgres -d hamlatai -f config/database.sql
```

### Step 4: Update .env File

Edit `e:/Election-campaign/.env`:

```env
# Update this line with your PostgreSQL password:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/hamlatai

# Update JWT secret (use any random string):
JWT_SECRET=some-random-secret-key-here-change-this

# Get free Groq API key from https://console.groq.com
GROQ_API_KEY=your-groq-api-key
```

### Step 5: Start the Platform

```powershell
# Terminal 1: Start Backend
npm run dev

# Terminal 2: Start Frontend (new terminal)
cd client
npm run dev
```

### Step 6: Access Platform

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

---

## 🚀 Alternative: Use SQLite (No PostgreSQL needed)

If you don't want to install PostgreSQL, I can modify the code to use SQLite:

```powershell
npm install better-sqlite3
```

Let me know if you want this option!

---

## ✅ Quick Checklist

- [ ] PostgreSQL installed
- [ ] Database `hamlatai` created
- [ ] Migrations run (`config/database.sql`)
- [ ] `.env` file updated with correct DATABASE_URL
- [ ] Groq API key added (free from https://console.groq.com)
- [ ] Backend running (`npm run dev`)
- [ ] Frontend running (`cd client && npm run dev`)

---

## 🆘 Troubleshooting

### PostgreSQL not found?
- Reinstall PostgreSQL
- Add to PATH: `C:\Program Files\PostgreSQL\15\bin`

### Can't connect to database?
- Check PostgreSQL service is running
- Verify password in DATABASE_URL
- Check port 5432 is not blocked

### Port 3000 already in use?
- Change PORT in `.env` to 3001 or 3002
