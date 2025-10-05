# 🚀 HamlatAI Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v7 or higher) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/hamlatai.git
cd hamlatai
```

## Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

## Step 3: Database Setup

### Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hamlatai;

# Exit psql
\q
```

### Run Database Migrations

```bash
# Run the SQL schema
psql -U postgres -d hamlatai -f config/database.sql
```

## Step 4: Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure the following **required** variables:

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/hamlatai

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Groq API (FREE - Get from https://console.groq.com)
GROQ_API_KEY=your-groq-api-key
```

### Optional API Keys (for full functionality):

```env
# Google Gemini (for content generation)
GEMINI_API_KEY=your-gemini-api-key

# OpenAI (for advanced features)
OPENAI_API_KEY=your-openai-api-key

# Social Media APIs
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Payment Gateways (Iraq-specific)
ZAINCASH_MERCHANT_ID=your-zaincash-merchant-id
ZAINCASH_SECRET=your-zaincash-secret

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# AI Avatar Video (D-ID or HeyGen)
DID_API_KEY=your-d-id-api-key
```

## Step 5: Start Redis

```bash
# On Windows (if installed via installer)
redis-server

# On Linux/Mac
sudo service redis-server start
```

## Step 6: Run the Application

### Development Mode

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### Production Mode

```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
npm start
```

## Step 7: Access the Platform

- **Frontend**: http://localhost:5173 (development) or http://localhost:3000 (production)
- **API**: http://localhost:3000/api
- **Admin Dashboard**: http://localhost:3000/admin

## Step 8: Create Admin User

Run this SQL to create an admin account:

```sql
INSERT INTO users (
  email, password_hash, name, governorate, language, role, tier, subscription_status
) VALUES (
  'admin@hamlatai.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash 'admin123'
  'Admin User',
  'Baghdad',
  'ar',
  'admin',
  'premium',
  'active'
);
```

Or use this Node.js script:

```javascript
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('admin123', 10);
console.log(hash); // Copy this hash to the SQL above
```

## Step 9: Test the Installation

1. **Register a test candidate**:
   - Go to http://localhost:5173
   - Click "Register"
   - Fill in the form
   - Select language (Arabic/Kurdish/English)

2. **Test voice commands**:
   - Login to dashboard
   - Click microphone icon
   - Say: "افتح التحليلات" (Arabic) or "open analytics" (English)

3. **Generate content**:
   - Go to Content section
   - Click "Generate Daily Content"
   - Review AI-generated posts

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection string in .env
DATABASE_URL=postgresql://user:password@localhost:5432/hamlatai
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

### Groq API Error

- Verify your API key at https://console.groq.com
- Check rate limits (Groq free tier is generous but has limits)

## Next Steps

1. **Configure Payment Gateways**: Set up Zain Cash, Qi Card for Iraqi payments
2. **Connect Social Media**: Add Facebook/Instagram API credentials
3. **Set Up WhatsApp**: Configure Twilio for notifications
4. **Enable AI Videos**: Add D-ID or HeyGen API keys
5. **Deploy to Production**: Use services like Railway, Render, or DigitalOcean

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT_SECRET
- [ ] Enable SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure CDN for media files
- [ ] Enable rate limiting
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure email service
- [ ] Set up CI/CD pipeline

## Support

For issues or questions:
- Email: support@hamlatai.com
- Documentation: https://docs.hamlatai.com
- GitHub Issues: https://github.com/yourusername/hamlatai/issues

---

**HamlatAI** - Empowering Iraqi candidates with AI-driven campaign management.
