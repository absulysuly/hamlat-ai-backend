# 🎯 HamlatAI - حملة - کەمپینی بەهێز

**AI-Powered Political Campaign Management Platform for Iraqi Candidates**

## 🌟 Overview

HamlatAI is a comprehensive, centralized AI-powered political campaign management platform specifically designed for Iraqi candidates across all governorates. The platform handles unlimited candidates from one central dashboard while providing each candidate with their own personalized experience.

## ✨ Key Features

### 🌍 Multi-Language Support
- **Arabic** (Iraqi dialect)
- **Kurdish** (Sorani & Kurmanji)
- **English**
- Voice command support in all languages
- RTL/LTR automatic switching

### 🤖 AI-Powered Features
- **Content Generation**: 3+ posts daily using Groq/Gemini AI
- **Sentiment Analysis**: Iraqi dialect-aware emotion detection
- **Predictive Analytics**: Campaign performance forecasting
- **Auto-Response**: Smart comment replies with human approval
- **Crisis Management**: Real-time alert system

### 🎥 Media Generation
- AI Avatar videos with candidate's voice
- Automated image creation
- Video script generation
- Multi-platform content optimization

### 📊 Analytics & Monitoring
- Real-time social media monitoring
- Competitor analysis
- Engagement predictions
- Daily/weekly reports

### 💳 Freemium Business Model
- **Free Trial**: 14 days with content previews
- **Basic Plan**: $2,500 - Essential features
- **Professional Plan**: $4,000 - AI videos + advanced analytics
- **Premium Plan**: $7,000 - Full suite + dedicated support

### 💰 Iraqi Payment Methods
- Zain Cash
- Qi Card
- Bank Transfer
- Cash Delivery
- USDT (Crypto)

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│      MASTER ADMIN DASHBOARD             │
│  (Multi-tenant Control Center)          │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   [Candidate A] [Candidate B] [Candidate C]
   (Baghdad)     (Basra)       (Erbil)
        │           │           │
        └───────────┼───────────┘
                    │
            ┌───────▼────────┐
            │   AI ENGINE    │
            │  - Groq LLaMA  │
            │  - Gemini Pro  │
            │  - OpenAI      │
            └────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- FFmpeg (for video processing)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/hamlatai.git
cd hamlatai
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Set up database**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start development server**
```bash
npm run dev
```

6. **Access the platform**
- Admin Dashboard: http://localhost:3000/admin
- Candidate Portal: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

## 📁 Project Structure

```
hamlatai/
├── server.js                 # Main server entry
├── config/                   # Configuration files
│   ├── database.js
│   ├── ai-models.js
│   └── payment-gateways.js
├── src/
│   ├── models/              # Database models
│   ├── controllers/         # Route controllers
│   ├── services/            # Business logic
│   │   ├── ai/             # AI services
│   │   ├── social/         # Social media integrations
│   │   └── payment/        # Payment processing
│   ├── middleware/          # Express middleware
│   ├── utils/              # Utility functions
│   └── routes/             # API routes
├── client/                  # Frontend React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── public/
├── scripts/                 # Utility scripts
├── workers/                 # Background job workers
└── tests/                   # Test files
```

## 🔑 Core Technologies

### Backend
- **Node.js + Express**: REST API server
- **PostgreSQL**: Multi-tenant database
- **Redis**: Caching & job queues
- **Bull**: Background job processing

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **shadcn/ui**: Component library
- **Lucide Icons**: Icon system

### AI & ML
- **Groq**: Fast LLM inference (Free tier)
- **Google Gemini**: Content generation
- **OpenAI**: Advanced analysis
- **D-ID/HeyGen**: Avatar video generation
- **ElevenLabs**: Voice cloning

### Integrations
- **Facebook Graph API**: Social media management
- **Instagram API**: Content posting
- **Telegram Bot API**: Channel monitoring
- **Twilio**: WhatsApp notifications
- **Zain Cash/Qi Card**: Iraqi payment gateways

## 🎨 Key Features Implementation

### 1. Voice Commands
```javascript
// Supports natural language in Arabic, Kurdish, English
"افتح التحليلات" → Navigate to analytics
"انشئ منشور" → Create new post
"وريني المتابعين" → Show followers
```

### 2. AI Content Generation
```javascript
// Generates culturally-appropriate content
- Iraqi dialect awareness
- Regional customization
- Issue-based messaging
- Engagement optimization
```

### 3. Social Listening
```javascript
// Real-time monitoring across platforms
- Facebook mentions
- Instagram hashtags
- Telegram channels
- News websites
```

### 4. Sentiment Analysis
```javascript
// Iraqi-specific emotion detection
- Positive/Negative/Neutral
- Urgency level
- Auto-response suggestions
- Crisis alerts
```

## 🔒 Security & Privacy

- **AES-256 Encryption**: All sensitive data
- **JWT Authentication**: Secure API access
- **Role-based Access Control**: Multi-tenant isolation
- **Data Retention**: 90 days post-election
- **GDPR Compliant**: User data deletion on request
- **No Data Selling**: Strict privacy policy

## 📱 Mobile Support

- **Progressive Web App (PWA)**: Installable on any device
- **Responsive Design**: Mobile-first approach
- **Offline Mode**: Basic functionality without internet
- **Push Notifications**: Real-time alerts

## 🌐 Supported Regions

All 18 Iraqi governorates + Kurdistan Region:
- Baghdad, Basra, Mosul, Erbil, Sulaymaniyah
- Najaf, Karbala, Duhok, Kirkuk, Anbar
- Diyala, Saladin, Wasit, Maysan, Dhi Qar
- Muthanna, Babil, Halabja

## 📊 Analytics & Reporting

- **Daily Reports**: Engagement metrics
- **Weekly Summaries**: Performance trends
- **Predictive Insights**: AI-powered forecasts
- **Competitor Analysis**: Benchmark against rivals
- **ROI Tracking**: Campaign effectiveness

## 🤝 Support

- **24/7 WhatsApp Support**: Instant help
- **Dedicated Success Manager**: For paid plans
- **Video Tutorials**: Multi-language guides
- **Knowledge Base**: Comprehensive docs

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with ❤️ for Iraqi democracy and political engagement.

---

**HamlatAI** - Empowering Iraqi candidates with AI-driven campaign management.
