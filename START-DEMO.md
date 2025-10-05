# 🚀 Start HamlatAI Demo

## Quick Start (No Database Required!)

### Step 1: Start Backend (Demo Server)
Open a terminal and run:
```powershell
cd e:/Election-campaign
npm run demo
```

You should see:
```
🎉 HamlatAI DEMO Server Running!

📍 Backend: http://localhost:3000
🌐 Frontend: http://localhost:5173

🔐 Demo Login:
   Email: demo@hamlatai.com
   Password: demo123

👨‍💼 Admin Login:
   Email: admin@hamlatai.com
   Password: admin123
```

### Step 2: Start Frontend
Open a **NEW** terminal and run:
```powershell
cd e:/Election-campaign/client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 3: Open Browser
Go to: **http://localhost:5173**

### Step 4: Login
Use demo credentials:
- **Email**: `demo@hamlatai.com`
- **Password**: `demo123`

---

## 🎯 What You Can Test

### ✅ Multi-Language Interface
- Click globe icon (top right)
- Switch between: العربية / کوردی / English
- UI changes direction (RTL/LTR)

### ✅ Dashboard
- View analytics overview
- See follower stats
- Check engagement metrics
- View sentiment score

### ✅ Content Generation
- Go to "Content" page
- Click "Generate Content"
- See AI-generated posts (mock data)
- Try "Publish Now" button

### ✅ Analytics
- Go to "Analytics" page
- View engagement charts
- See performance metrics

### ✅ Social Mentions
- Go to "Mentions" page
- See comments with sentiment analysis
- View AI-suggested responses

### ✅ Voice Commands (Chrome/Edge only)
- Click microphone icon (bottom right)
- Say: "افتح التحليلات" (open analytics)
- Or: "open analytics" (English)

### ✅ Admin Dashboard
- Logout
- Login as admin:
  - Email: `admin@hamlatai.com`
  - Password: `admin123`
- View all candidates
- See platform statistics

---

## 📝 Demo Features

✅ **Working**:
- Login/Register
- Multi-language (AR/KU/EN)
- Dashboard with stats
- Content management
- Analytics charts
- Social mentions
- Voice commands (UI only)
- Admin panel

⚠️ **Mock Data** (Not Real):
- All content is pre-generated
- Analytics are sample data
- No actual AI generation (demo mode)
- No real social media integration

---

## 🔄 To Stop

Press `Ctrl + C` in both terminals

---

## 🚀 Next Steps

To use the **FULL VERSION** with real AI:
1. Install PostgreSQL
2. Get Groq API key (free)
3. Update `.env` file
4. Run: `npm run dev` (instead of `npm run demo`)

See `SETUP-WINDOWS.md` for full setup guide.

---

**Enjoy the demo! 🎉**
