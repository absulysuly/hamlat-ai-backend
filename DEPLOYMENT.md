# 🚀 HamlatAI Deployment Guide

## Production Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Create Railway Account**: https://railway.app
2. **Install Railway CLI**:
```bash
npm i -g @railway/cli
railway login
```

3. **Deploy**:
```bash
railway init
railway up
```

4. **Add PostgreSQL**:
- Go to Railway dashboard
- Click "New" → "Database" → "PostgreSQL"
- Copy DATABASE_URL to environment variables

5. **Set Environment Variables**:
```bash
railway variables set GROQ_API_KEY=your-key
railway variables set JWT_SECRET=your-secret
# Add all other .env variables
```

### Option 2: Render

1. **Create Render Account**: https://render.com
2. **New Web Service**:
   - Connect GitHub repo
   - Build Command: `npm install && cd client && npm install && npm run build`
   - Start Command: `npm start`

3. **Add PostgreSQL**:
   - New → PostgreSQL
   - Copy Internal Database URL

4. **Environment Variables**:
   - Add all from `.env.example`

### Option 3: DigitalOcean App Platform

1. **Create DO Account**: https://digitalocean.com
2. **Apps → Create App**:
   - Connect GitHub
   - Detect Node.js
   - Add PostgreSQL database

3. **Configure**:
   - Build: `npm run build`
   - Run: `npm start`

### Option 4: VPS (Ubuntu 22.04)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 4. Install Redis
sudo apt install redis-server -y

# 5. Install Nginx
sudo apt install nginx -y

# 6. Clone repository
git clone https://github.com/yourusername/hamlatai.git
cd hamlatai

# 7. Install dependencies
npm install
cd client && npm install && npm run build && cd ..

# 8. Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE hamlatai;
CREATE USER hamlatai WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE hamlatai TO hamlatai;
\q

# 9. Run migrations
psql -U hamlatai -d hamlatai -f config/database.sql

# 10. Setup PM2 (Process Manager)
sudo npm install -g pm2
pm2 start server.js --name hamlatai
pm2 startup
pm2 save

# 11. Configure Nginx
sudo nano /etc/nginx/sites-available/hamlatai
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hamlatai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 12. SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## Environment Variables Checklist

### Required (Minimum to run):
- ✅ `DATABASE_URL`
- ✅ `JWT_SECRET`
- ✅ `GROQ_API_KEY` (Free from https://console.groq.com)
- ✅ `NODE_ENV=production`
- ✅ `PORT=3000`

### Optional (Full features):
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `FACEBOOK_APP_ID` & `FACEBOOK_APP_SECRET`
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`
- `ZAINCASH_MERCHANT_ID` & `ZAINCASH_SECRET`
- `DID_API_KEY` (for AI videos)

## Database Migration

```bash
# Production migration
psql $DATABASE_URL -f config/database.sql
```

## Performance Optimization

### 1. Enable Gzip Compression
Already configured in `server.js` via `compression` middleware.

### 2. Use CDN for Static Assets
```javascript
// In production, serve from CDN
const CDN_URL = process.env.CDN_URL || '';
```

### 3. Database Connection Pooling
Already configured in `config/database.js` with max 20 connections.

### 4. Redis Caching
```bash
# Install Redis
npm install ioredis

# Use for caching API responses
```

### 5. PM2 Cluster Mode
```bash
pm2 start server.js -i max --name hamlatai
```

## Monitoring & Logging

### Setup Sentry (Error Tracking)
```bash
npm install @sentry/node
```

```javascript
// In server.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Setup LogTail (Log Management)
```bash
npm install @logtail/node
```

## Backup Strategy

### Automated PostgreSQL Backups
```bash
# Create backup script
nano /home/deploy/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U hamlatai hamlatai > /backups/hamlatai_$DATE.sql
find /backups -name "*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /home/deploy/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /home/deploy/backup.sh
```

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable SSL/HTTPS
- [ ] Set up firewall (UFW)
- [ ] Disable root SSH login
- [ ] Enable fail2ban
- [ ] Regular security updates
- [ ] Environment variables not in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (parameterized queries ✅)
- [ ] XSS protection (helmet ✅)

## Scaling

### Horizontal Scaling
```bash
# Use PM2 cluster mode
pm2 start server.js -i 4

# Or use load balancer (Nginx)
upstream hamlatai {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

### Database Scaling
- Use PostgreSQL read replicas
- Implement Redis caching
- Use connection pooling (already configured)

## Cost Estimation

### Free Tier (Development/Testing):
- **Railway**: Free $5/month credit
- **Render**: Free tier available
- **Groq API**: Free (generous limits)

### Production (100 candidates):
- **VPS (DigitalOcean)**: $12-24/month
- **Database**: $15/month (managed PostgreSQL)
- **Redis**: $10/month
- **CDN (Cloudflare)**: Free
- **Total**: ~$40-50/month

### Enterprise (1000+ candidates):
- **VPS**: $100-200/month
- **Database**: $50-100/month
- **Redis**: $30/month
- **CDN**: $20/month
- **Total**: ~$200-350/month

## Troubleshooting

### Issue: Database connection fails
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL
```

### Issue: Port already in use
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Issue: Out of memory
```bash
# Increase Node.js memory
node --max-old-space-size=4096 server.js

# Or in PM2
pm2 start server.js --node-args="--max-old-space-size=4096"
```

## Post-Deployment

1. **Test all features**:
   - Registration/Login
   - Content generation
   - Voice commands
   - Analytics
   - Payment flow

2. **Monitor logs**:
```bash
pm2 logs hamlatai
```

3. **Set up alerts**:
   - Uptime monitoring (UptimeRobot)
   - Error tracking (Sentry)
   - Performance (New Relic)

4. **Create admin user**:
```sql
INSERT INTO users (email, password_hash, name, governorate, language, role, tier)
VALUES ('admin@hamlatai.com', 'hashed_password', 'Admin', 'Baghdad', 'ar', 'admin', 'premium');
```

---

**Deployment Complete! 🎉**

Access your platform at: https://yourdomain.com
