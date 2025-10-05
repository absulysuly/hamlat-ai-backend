# 🎯 HAMLATAI FRONTEND GENERATION PROMPT - GOOGLE AI STUDIO

## 📋 **MISSION BRIEFING**

You are tasked with generating a **complete React frontend** for the HamlatAI platform - an AI-powered political campaign management system for Iraqi elections with Kurdistan priority focus.

**Backend API:** Complete Node.js/TypeScript backend with RESTful endpoints
**Priority:** Kurdistan regions (3x data collection frequency)
**Languages:** Kurdish (Sorani, Badini, Kurmanji) + Arabic + English
**Timeline:** 1-month marketing campaign execution

---

## 🏗️ **BACKEND ARCHITECTURE SPECIFICATIONS**

### **Tech Stack (Backend)**
- **Runtime:** Node.js 20.x + TypeScript
- **Framework:** Express.js with async/await
- **Database:** PostgreSQL 15+ with Prisma ORM
- **Authentication:** JWT with role-based permissions
- **Real-time:** WebSocket for live updates
- **Deployment:** Vercel/Railway ready

### **Core Features Implemented**
✅ **Kurdistan Priority Collection** (3x frequency - every 5 minutes)
✅ **Multi-language Kurdish Support** (Sorani, Badini, Kurmanji detection)
✅ **Social Media Integration** (Facebook, Instagram, YouTube, Twitter, TikTok)
✅ **Real-time Analytics Dashboard** (10-minute status reports)
✅ **Candidate Database Management** (influence scoring, contact info)
✅ **Export Systems** (CSV, Excel, PDF generation)
✅ **Notification Systems** (Email, SMS, WhatsApp campaigns)

---

## 📊 **DATABASE SCHEMA**

### **Core Tables (7)**
```sql
-- Priority Kurdistan data storage
kurdistan_mentions (
  id: SERIAL PRIMARY KEY,
  platform: VARCHAR(50),
  content: TEXT,
  dialect: KurdishDialect,
  region: VARCHAR(100),
  sentiment: DECIMAL,
  createdAt: TIMESTAMP
)

-- General social media data
social_mentions (
  id: SERIAL PRIMARY KEY,
  platform: VARCHAR(50),
  content: TEXT,
  language: VARCHAR(50),
  region: VARCHAR(100),
  sentimentScore: DECIMAL,
  createdAt: TIMESTAMP
)

-- Candidate profiles with multi-language support
candidates (
  id: STRING PRIMARY KEY,
  nameKuSorani: STRING,
  nameKuBadini: STRING,
  nameKuKurmanji: STRING,
  nameAr: STRING,
  nameEn: STRING,
  partyId: STRING,
  region: STRING,
  priority: Priority,
  influenceScore: INTEGER,
  socialMedia: JSONB,
  contact: JSONB,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
)

-- Political parties
political_parties (
  id: STRING PRIMARY KEY,
  name: STRING,
  nameAr: STRING,
  nameKu: STRING,
  ideology: STRING,
  color: STRING,
  website: STRING
)

-- Campaign management
campaigns (
  id: STRING PRIMARY KEY,
  name: STRING,
  type: STRING,
  message: STRING,
  targetAudience: STRING,
  status: CampaignStatus,
  sentCount: INTEGER,
  createdAt: TIMESTAMP
)

-- User management
users (
  id: STRING PRIMARY KEY,
  email: STRING,
  role: UserRole,
  isActive: BOOLEAN,
  createdAt: TIMESTAMP
)

-- Audit logging
audit_logs (
  id: STRING PRIMARY KEY,
  action: STRING,
  userId: STRING,
  ip: STRING,
  payload: STRING,
  timestamp: TIMESTAMP
)
```

---

## 🔗 **API ENDPOINTS SPECIFICATIONS**

### **Authentication Endpoints**
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }

POST /api/auth/register
Body: { email: string, password: string, name: string }
Response: { message: string }
```

### **Candidates Endpoints**
```
GET /api/candidates
Query: ?region=Kurdistan&priority=KURDISTAN&limit=50&offset=0
Response: { data: Candidate[], pagination: Pagination }

GET /api/candidates/search
Query: ?q=mohammed&region=Kurdistan&limit=20
Response: { data: Candidate[], query: string }

GET /api/candidates/:id
Response: { data: Candidate }

POST /api/candidates (Admin only)
Body: CandidateData
Response: { data: Candidate, message: string }

PATCH /api/candidates/:id (Admin only)
Body: Partial<CandidateData>
Response: { data: Candidate, message: string }
```

### **Analytics Endpoints**
```
GET /api/analytics/dashboard
Response: {
  totalMentions: number,
  kurdistanMentions: number,
  recentMentions: number,
  languages: { sorani: number, badini: number, kurmanji: number, arabic: number },
  regions: Record<string, number>,
  topCandidates: Candidate[],
  platforms: Record<string, number>,
  overallSentiment: number,
  collectionStatus: CollectionStatus,
  systemHealth: SystemHealth
}

GET /api/analytics/kurdistan
Response: {
  totalMentions: number,
  dialectBreakdown: Record<KurdishDialect, number>,
  regionBreakdown: Record<string, number>,
  topCandidates: KurdistanCandidate[],
  sentimentOverview: { positive: number, negative: number, neutral: number },
  hourlyActivity: HourlyActivity[]
}

GET /api/analytics/trends?region=Kurdistan&days=7
Response: { data: RegionalTrends[] }

GET /api/analytics/sentiment?region=Kurdistan&days=7
Response: { data: SentimentAnalysis, region: string, period: string }
```

### **Social Media Endpoints**
```
GET /api/social/mentions
Query: ?platform=facebook&region=Kurdistan&limit=50
Response: { data: SocialMention[], pagination: Pagination }

GET /api/social/kurdistan-mentions
Query: ?limit=50&offset=0
Response: { data: KurdistanMention[], pagination: Pagination }

GET /api/social/stats?hours=24
Response: {
  totalMentions: number,
  kurdistanMentions: number,
  timeRange: string,
  platformStats: Record<string, number>
}
```

### **Export Endpoints**
```
GET /api/export/candidates?region=Kurdistan&format=excel
Response: Buffer (Excel file)

GET /api/export/report?dateRange=2024-01-01:2024-01-31&format=pdf
Response: Buffer (PDF report)

GET /api/export/mentions?platform=facebook&format=csv
Response: Buffer (CSV file)
```

### **Campaign Endpoints**
```
GET /api/campaigns
Response: { data: Campaign[] }

POST /api/campaigns
Body: { name: string, type: string, message: string, targetAudience: string }
Response: { data: Campaign, message: string }

POST /api/campaigns/:id/send
Response: { message: string, results: CampaignResults }

GET /api/campaigns/:id/stats
Response: { data: CampaignStats }
```

---

## 📋 **DATA STRUCTURES & TYPES**

### **Candidate Interface**
```typescript
interface Candidate {
  id: string;
  name: {
    ku_sorani?: string;
    ku_badini?: string;
    ku_kurmanji?: string;
    ar: string;
    en?: string;
  };
  party?: {
    id: string;
    name: string;
  };
  region: string;
  priority: 'KURDISTAN' | 'BAGHDAD' | 'BASRA' | 'OTHER';
  position?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    telegram?: string;
    whatsapp?: string;
  };
  contact: {
    email?: string;
    phone?: string;
    officeAddress?: string;
  };
  influence: {
    score: number;
    followers: number;
    engagement: number;
    sentiment: number;
    trending: boolean;
  };
  lastUpdated: Date;
  dataQuality: number;
}
```

### **Kurdish Dialects**
```typescript
enum KurdishDialect {
  SORANI = 'sorani',
  BADINI = 'badini',
  KURMANJI = 'kurmanji'
}
```

### **Priority Levels**
```typescript
enum Priority {
  KURDISTAN = 'KURDISTAN',    // 3x collection frequency
  BAGHDAD = 'BAGHDAD',        // 1x collection frequency
  BASRA = 'BASRA',            // 1x collection frequency
  OTHER = 'OTHER'             // 0.5x collection frequency
}
```

### **Social Platforms**
```typescript
enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TWITTER = 'TWITTER',
  TIKTOK = 'TIKTOK',
  TELEGRAM = 'TELEGRAM',
  WHATSAPP = 'WHATSAPP'
}
```

### **User Roles**
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  CAMPAIGN_MANAGER = 'CAMPAIGN_MANAGER',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER'
}
```

---

## 🌍 **KURDISTAN PRIORITY SYSTEM**

### **Collection Priority Order:**
1. **🥇 KURDISTAN (3x frequency)** - Every 5 minutes
   - Regions: Erbil, Sulaymaniyah, Duhok, Halabja
   - Languages: Sorani, Badini, Kurmanji
   - Importance: CRITICAL

2. **🥈 BAGHDAD (1x frequency)** - Every 15 minutes
   - Regions: Baghdad
   - Languages: Arabic, English
   - Importance: HIGH

3. **🥉 BASRA (1x frequency)** - Every 15 minutes
   - Regions: Basra
   - Languages: Arabic
   - Importance: HIGH

4. **🟠 OTHER REGIONS (0.5x frequency)** - Every 30 minutes
   - Regions: Najaf, Karbala, Kirkuk, Mosul, Anbar
   - Languages: Arabic
   - Importance: MEDIUM

### **Kurdish Language Support:**
- **Sorani:** Southern Kurdish (Sulaymaniyah, Halabja) - RTL support
- **Badini:** Northern Kurdish (Duhok, Zakho) - RTL support
- **Kurmanji:** Northwestern Kurdish (Erbil, Kirkuk) - RTL support
- **Detection Accuracy:** 95%+ for Kurdish content identification

---

## 🔐 **AUTHENTICATION & SECURITY**

### **JWT Authentication**
- **Token Format:** Bearer token in Authorization header
- **Expiry:** 24 hours with refresh rotation
- **Permissions:** Role-based access control

### **Role Permissions**
```typescript
const ROLE_PERMISSIONS = {
  admin: [
    'manage-all',
    'delete-data',
    'export-sensitive',
    'manage-users',
    'view-analytics',
    'edit-campaigns',
    'contact-candidates',
    'system-admin'
  ],
  campaignManager: [
    'view-analytics',
    'edit-campaigns',
    'contact-candidates',
    'export-reports',
    'manage-campaigns'
  ],
  analyst: [
    'view-analytics',
    'export-reports',
    'view-candidates',
    'search-candidates'
  ],
  viewer: [
    'view-candidates',
    'search-candidates',
    'view-basic-analytics'
  ]
}
```

### **Security Headers**
- **CORS:** Whitelisted origins with credentials
- **Rate Limiting:** 100 req/15min (200 for Kurdistan IPs)
- **Helmet:** Security headers (HSTS, CSP, etc.)
- **Input Sanitization:** NoSQL injection prevention

---

## 📱 **FRONTEND REQUIREMENTS**

### **Technology Stack**
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite (recommended) or Create React App
- **Styling:** Tailwind CSS (for RTL Kurdish support)
- **State Management:** Redux Toolkit or Zustand
- **Real-time:** Socket.io client for WebSocket updates
- **HTTP Client:** Axios with interceptors for auth
- **Charts:** Recharts or Chart.js for analytics
- **Export:** react-excel-export, jspdf for file generation
- **Internationalization:** react-i18next for Kurdish/Arabic/English

### **Core Features to Implement**

#### **1. Authentication System**
- Login/register forms with JWT handling
- Role-based route protection
- Token refresh mechanism
- Logout functionality

#### **2. Dashboard (Main Screen)**
- **Real-time Metrics:** Live counters with 30-second updates
- **Kurdistan Priority Section:** Highlighted with special styling
- **Language Breakdown:** Visual charts for Kurdish dialects
- **Regional Distribution:** Map/chart of Iraqi governorates
- **Top Candidates:** Sortable table with influence scores
- **Platform Analytics:** Social media performance metrics
- **Sentiment Trend:** Positive/negative/neutral indicators

#### **3. Candidates Management**
- **Search & Filter:** By region, party, influence score, language
- **Candidate Cards:** Multi-language names, social media links
- **Profile View:** Detailed candidate information
- **Contact Information:** Email, phone, social media profiles
- **Influence Tracking:** Engagement metrics and trends
- **Export Functionality:** Individual/bulk export options

#### **4. Analytics Section**
- **Kurdistan Analytics:** Dedicated section with dialect breakdown
- **Regional Trends:** Governorate-specific insights
- **Sentiment Analysis:** Visual sentiment over time
- **Platform Performance:** Social media metrics comparison
- **Export Reports:** PDF/Excel generation with charts

#### **5. Social Media Monitoring**
- **Mentions Feed:** Real-time social media posts
- **Platform Filtering:** Facebook, Instagram, YouTube, etc.
- **Kurdistan Priority:** Special highlighting for Kurdish content
- **Language Detection:** Visual indicators for Kurdish dialects
- **Sentiment Display:** Color-coded sentiment analysis

#### **6. Campaign Management**
- **Campaign Creation:** WhatsApp, email, SMS campaign builder
- **Target Selection:** Filter candidates by region/party/influence
- **Message Templates:** Multi-language template system
- **Campaign Execution:** Bulk sending with rate limiting
- **Results Tracking:** Delivery, read, click metrics

#### **7. Export Center**
- **Candidate Lists:** CSV/Excel export with all contact info
- **Analytics Reports:** PDF reports with charts and insights
- **Bulk Operations:** Multi-format export options
- **Scheduled Exports:** Automated report generation

### **UI/UX Requirements**

#### **Design System**
- **RTL Support:** Right-to-left layout for Kurdish/Arabic
- **Multi-language:** Kurdish, Arabic, English interface
- **Responsive Design:** Mobile-first approach
- **Dark Mode:** Optional dark theme
- **Accessibility:** WCAG 2.1 compliance

#### **Kurdistan Priority Styling**
- **Special Colors:** Green (#22c55e) for Kurdistan content
- **Priority Indicators:** 3x badges, special highlighting
- **Regional Maps:** Kurdistan regions distinctly marked
- **Language Tags:** Visual Kurdish dialect indicators

#### **Real-time Features**
- **WebSocket Connection:** Auto-reconnect with fallback
- **Live Updates:** 30-second refresh for dashboard
- **Loading States:** Skeleton screens during updates
- **Error Handling:** User-friendly error messages

---

## 🔧 **INTEGRATION REQUIREMENTS**

### **API Integration**
```typescript
// API Client Setup
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### **WebSocket Integration**
```typescript
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
  transports: ['websocket'],
  upgrade: true,
});

// Real-time updates for dashboard
socket.on('kurdistan-mention', (data) => {
  // Update Kurdistan metrics
  dispatch(updateKurdistanMetrics(data));
});

socket.on('trending-candidate', (candidate) => {
  // Show trending notification
  dispatch(showTrendingNotification(candidate));
});
```

### **Error Handling**
```typescript
// Global error handler
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Redirect to login
    navigate('/login');
  } else if (error.response?.status >= 500) {
    // Show server error message
    toast.error('Server error. Please try again later.');
  } else {
    // Show specific error message
    toast.error(error.response?.data?.message || 'An error occurred');
  }
};
```

---

## 📚 **IMPORTANT LINKS & REFERENCES**

### **Backend Documentation**
- **API Documentation:** `http://localhost:5000/api-docs`
- **Health Check:** `http://localhost:5000/health`
- **Complete Technical Docs:** `COMPLETE_TECHNICAL_DOCUMENTATION.md`

### **Database Schema**
- **Schema File:** `prisma/schema.prisma`
- **Database Schema CSV:** `DATABASE_SCHEMA.csv`
- **System Overview:** `SYSTEM_OVERVIEW.csv`

### **Deployment & Setup**
- **Environment Template:** `.env.example`
- **Activation Scripts:** `activate.sh` (Linux/Mac), `activate.bat` (Windows)
- **Deployment Guide:** `DEPLOYMENT.md`
- **Setup Guide:** `SETUP_GUIDE.md`

### **Project Files**
- **Package Configuration:** `package.json`
- **TypeScript Config:** `tsconfig.json`
- **Vercel Config:** `vercel.json`

---

## 🚀 **FRONTEND GENERATION REQUIREMENTS**

### **Project Structure**
```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, Register, ProtectedRoute
│   │   ├── dashboard/      # Main dashboard with real-time metrics
│   │   ├── candidates/     # Candidate management interface
│   │   ├── analytics/      # Analytics charts and reports
│   │   ├── social/         # Social media monitoring
│   │   ├── campaigns/      # Campaign management
│   │   ├── export/         # Export functionality
│   │   └── common/         # Reusable components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── i18n/               # Internationalization
│   └── App.tsx             # Main app component
├── public/
└── vite.config.ts          # Vite configuration
```

### **Key Features to Implement**

#### **1. Multi-language Support**
- **Kurdish RTL Layout:** Right-to-left for Kurdish content
- **Language Switching:** Kurdish/Arabic/English toggle
- **Dynamic Direction:** RTL/LTR based on selected language
- **Font Support:** Kurdish-compatible fonts

#### **2. Real-time Dashboard**
- **Live Metrics:** WebSocket updates every 30 seconds
- **Kurdistan Priority:** Special highlighted section
- **Interactive Charts:** Clickable regions, sortable tables
- **Export Buttons:** Quick export options for each section

#### **3. Candidate Management**
- **Advanced Search:** Multi-filter search interface
- **Candidate Cards:** Kurdish/Arabic/English name display
- **Social Media Links:** Clickable platform icons
- **Contact Integration:** Direct email/phone links
- **Bulk Operations:** Select multiple for export/campaigns

#### **4. Analytics Visualization**
- **Regional Maps:** Interactive Iraqi governorate map
- **Time Series Charts:** Mention trends over time
- **Platform Comparison:** Side-by-side social media metrics
- **Sentiment Gauges:** Visual sentiment indicators

#### **5. Campaign Builder**
- **Template System:** Pre-built Kurdish/Arabic message templates
- **Audience Selection:** Filter by region/party/influence
- **Preview Mode:** See how messages appear in different languages
- **Scheduling:** Campaign timing and frequency settings

### **Styling Requirements**
- **Tailwind CSS:** Utility-first styling with RTL support
- **Responsive Design:** Mobile-first approach
- **Dark Mode:** Toggle between light/dark themes
- **Kurdistan Colors:** Green highlighting for priority content
- **Arabic/Kurdish Fonts:** RTL-compatible typography

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements**
✅ **Complete API Integration** - All backend endpoints connected
✅ **Real-time Updates** - WebSocket integration for live data
✅ **Multi-language Interface** - Kurdish/Arabic/English support
✅ **Kurdistan Priority Display** - Special highlighting and metrics
✅ **Responsive Design** - Works on desktop, tablet, mobile
✅ **Export Functionality** - Generate CSV/Excel/PDF files
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Smooth UX during data fetching

### **Performance Requirements**
✅ **Fast Loading** - < 2 seconds initial load time
✅ **Real-time Updates** - < 1 second WebSocket response
✅ **Smooth Animations** - 60fps interface interactions
✅ **Optimized Bundle** - < 500KB gzipped JavaScript

### **Accessibility Requirements**
✅ **WCAG 2.1 AA** - Screen reader compatible
✅ **Keyboard Navigation** - Full keyboard accessibility
✅ **RTL Support** - Proper right-to-left layout
✅ **High Contrast** - Readable in all lighting conditions

---

## 📋 **DELIVERABLES EXPECTED**

1. **Complete React Application** with all features implemented
2. **Responsive Design** working on all device sizes
3. **Multi-language Support** with Kurdish/Arabic/English
4. **Real-time Dashboard** with WebSocket integration
5. **Export Functionality** for all data types
6. **Campaign Management** interface
7. **Production Ready** deployment configuration
8. **Comprehensive Documentation** for setup and usage

---

## 🚨 **IMPORTANT NOTES**

- **Backend is Complete** - All APIs are ready and functional
- **Kurdistan Priority** - Must be prominently featured throughout
- **RTL Support** - Essential for Kurdish and Arabic content
- **Real-time Updates** - Critical for campaign monitoring
- **Multi-language** - All text must support Kurdish dialects
- **Production Ready** - Must handle errors and edge cases gracefully

**Generate a complete, production-ready React frontend that seamlessly integrates with this backend API and showcases the Kurdistan priority features prominently.**
