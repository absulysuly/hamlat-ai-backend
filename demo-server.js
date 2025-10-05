import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Data
const mockUsers = [
  {
    id: '1',
    email: 'demo@hamlatai.com',
    password_hash: bcrypt.hashSync('demo123', 10),
    name: 'أحمد المرشح',
    phone: '07701234567',
    whatsapp: '07701234567',
    governorate: 'Baghdad',
    political_party: 'Independent',
    language: 'ar',
    dialect: 'iraqi_arabic',
    role: 'candidate',
    tier: 'professional',
    subscription_status: 'active',
    trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    voice_enabled: true,
    profile_image_url: 'https://ui-avatars.com/api/?name=Ahmed&background=4f46e5&color=fff',
  },
  {
    id: '2',
    email: 'admin@hamlatai.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    name: 'Admin User',
    governorate: 'Baghdad',
    language: 'ar',
    role: 'admin',
    tier: 'premium',
    subscription_status: 'active',
  }
];

const mockContent = [
  {
    id: '1',
    user_id: '1',
    type: 'post',
    platform: 'facebook',
    language: 'ar',
    content: 'صباح الخير لأهلنا الكرام في بغداد! 🌅\n\nاليوم نبدأ بطاقة جديدة وعزيمة أقوى لخدمة مدينتنا الحبيبة. وعدي لكم: سأعمل ليل نهار لتحسين الخدمات وتوفير فرص العمل لشبابنا.\n\nمعاً نبني مستقبل أفضل! 💪',
    hashtags: ['#بغداد', '#الانتخابات_2025', '#خدمة_المواطن'],
    status: 'draft',
    predicted_reach: 2400,
    predicted_engagement: 180,
    ai_model: 'groq-llama-3.1',
    created_at: new Date(),
  },
  {
    id: '2',
    user_id: '1',
    type: 'post',
    platform: 'facebook',
    language: 'ar',
    content: 'قضية البطالة من أهم التحديات التي نواجهها 📊\n\nخطتنا:\n✅ دعم المشاريع الصغيرة\n✅ تدريب الشباب على المهارات الحديثة\n✅ جذب الاستثمارات\n\nشبابنا يستحق فرصة حقيقية!',
    hashtags: ['#فرص_عمل', '#الشباب', '#التنمية'],
    status: 'locked',
    predicted_reach: 3200,
    predicted_engagement: 250,
    ai_model: 'groq-llama-3.1',
    created_at: new Date(),
  },
  {
    id: '3',
    user_id: '1',
    type: 'post',
    platform: 'facebook',
    language: 'ar',
    content: 'زيارة ميدانية اليوم لحي الكرادة 🏘️\n\nاستمعت لمطالب الأهالي وهمومهم. مشاكل الكهرباء والماء والطرق كلها على طاولة العمل.\n\nصوتكم مسموع، ووعودنا ليست كلام فارغ!',
    hashtags: ['#الكرادة', '#زيارات_ميدانية', '#نسمعكم'],
    status: 'published',
    predicted_reach: 4100,
    predicted_engagement: 320,
    actual_reach: 3850,
    actual_likes: 298,
    actual_comments: 45,
    actual_shares: 23,
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
  }
];

const mockMentions = [
  {
    id: '1',
    user_id: '1',
    platform: 'facebook',
    author_name: 'علي محمد',
    content: 'الله يوفقك أخي أحمد، نحتاج ناس مثلك صادقين وشغيلين',
    sentiment: 'positive',
    sentiment_score: 0.85,
    emotion: 'supportive',
    urgency: 'low',
    requires_response: true,
    suggested_response: 'شكراً جزيلاً أخي علي! ثقتكم تزيدنا عزيمة وإصرار. معاً نبني مستقبل أفضل 🙏',
    detected_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
    is_read: false,
  },
  {
    id: '2',
    user_id: '1',
    platform: 'instagram',
    author_name: 'فاطمة أحمد',
    content: 'شنو رأيك بموضوع الكهرباء؟ متى راح تحلون هذه المشكلة؟',
    sentiment: 'neutral',
    sentiment_score: 0.0,
    emotion: 'questioning',
    urgency: 'medium',
    requires_response: true,
    suggested_response: 'أختي فاطمة، موضوع الكهرباء من أولوياتنا. عندنا خطة واضحة للتعاون مع الوزارة وتحسين الخدمة. راح نشارككم التفاصيل قريباً',
    detected_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
    is_read: false,
  },
  {
    id: '3',
    user_id: '1',
    platform: 'facebook',
    author_name: 'حسين كريم',
    content: 'كلام فاضي مثل كل المرشحين، وعود وعود وبالآخر ما يصير شي',
    sentiment: 'negative',
    sentiment_score: -0.7,
    emotion: 'disappointed',
    urgency: 'high',
    requires_response: true,
    suggested_response: 'أخي حسين، أتفهم إحباطك تماماً. لكن أعدك إني مختلف، وراح تشوف الفرق بالأفعال مو بالكلام. تابعنا وحاسبنا على كل وعد',
    detected_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
    is_read: false,
  }
];

const mockAnalytics = {
  daily: [
    { date: '2025-10-01', followers_gained: 45, total_reach: 8500, total_likes: 320, total_comments: 45, total_shares: 23, sentiment_score: 0.72 },
    { date: '2025-10-02', followers_gained: 52, total_reach: 9200, total_likes: 380, total_comments: 52, total_shares: 28, sentiment_score: 0.75 },
    { date: '2025-10-03', followers_gained: 38, total_reach: 7800, total_likes: 290, total_comments: 38, total_shares: 19, sentiment_score: 0.68 },
    { date: '2025-10-04', followers_gained: 61, total_reach: 10500, total_likes: 425, total_comments: 61, total_shares: 34, sentiment_score: 0.78 },
  ],
  totals: {
    total_followers_gained: 196,
    total_reach: 36000,
    total_engagement: 1715,
    avg_sentiment: 0.73,
  }
};

const mockDashboard = {
  today_stats: {
    followers_end: 1247,
    followers_gained: 48,
    total_reach: 12400,
    total_likes: 680,
    total_comments: 125,
    sentiment_score: 0.72,
  },
  recent_content: mockContent,
  unread_mentions: 3,
  subscription: {
    tier: 'professional',
    status: 'active',
    days_left: 7,
  },
  analytics: mockAnalytics.daily,
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email);
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, 'demo-secret-key', { expiresIn: '7d' });
  const { password_hash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: { user: userWithoutPassword, token }
  });
});

app.post('/api/auth/register', async (req, res) => {
  const newUser = {
    id: String(mockUsers.length + 1),
    ...req.body,
    password_hash: bcrypt.hashSync(req.body.password, 10),
    role: 'candidate',
    tier: 'free',
    subscription_status: 'trial',
    trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    voice_enabled: true,
  };
  
  mockUsers.push(newUser);
  const token = jwt.sign({ userId: newUser.id }, 'demo-secret-key', { expiresIn: '7d' });
  const { password_hash, ...userWithoutPassword } = newUser;

  res.json({
    success: true,
    data: { user: userWithoutPassword, token }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, 'demo-secret-key');
    const user = mockUsers.find(u => u.id === decoded.userId);
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch {
    res.status(401).json({ success: false });
  }
});

// Candidate Routes
app.get('/api/candidate/dashboard', (req, res) => {
  res.json({ success: true, data: mockDashboard });
});

app.get('/api/candidate/campaign', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      user_id: '1',
      name: 'أحمد المرشح Campaign',
      key_issues: ['الكهرباء والخدمات', 'فرص العمل', 'التعليم'],
      target_audience: { age_range: [18, 65], regions: ['Baghdad', 'Karkh'] },
    }
  });
});

// Content Routes
app.get('/api/content', (req, res) => {
  res.json({ success: true, data: mockContent });
});

app.post('/api/content/generate-daily', (req, res) => {
  const newContent = {
    id: String(mockContent.length + 1),
    user_id: '1',
    type: 'post',
    language: 'ar',
    content: 'محتوى جديد تم إنشاؤه بواسطة الذكاء الاصطناعي! 🤖',
    hashtags: ['#جديد', '#AI'],
    status: 'draft',
    predicted_reach: 2000,
    predicted_engagement: 150,
    ai_model: 'groq-llama-3.1',
    created_at: new Date(),
  };
  mockContent.unshift(newContent);
  res.json({ success: true, data: [newContent] });
});

app.post('/api/content/:id/publish', (req, res) => {
  const content = mockContent.find(c => c.id === req.params.id);
  if (content) {
    content.status = 'published';
    content.published_at = new Date();
  }
  res.json({ success: true, data: content });
});

// Analytics Routes
app.get('/api/analytics/overview', (req, res) => {
  res.json({ success: true, data: mockAnalytics });
});

// Social Routes
app.get('/api/social/mentions', (req, res) => {
  res.json({ success: true, data: mockMentions });
});

// Voice Routes
app.post('/api/voice/command', (req, res) => {
  const { spoken_text } = req.body;
  res.json({
    success: true,
    data: {
      intent: { intent: 'navigate_analytics', confidence: 0.95 },
      result: { type: 'navigation', page: 'analytics', success: true },
      natural_response: 'تم فتح صفحة التحليلات'
    }
  });
});

// Admin Routes
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      active_users: 45,
      revenue: { total_revenue: 125000, total_transactions: 32, avg_transaction: 3906 },
      content: { total_content: 1250, published_content: 890, content_this_week: 156 },
      conversions: { active_trials: 12, paid_users: 33, expired_users: 8 },
      tiers: [
        { tier: 'free', count: 12 },
        { tier: 'basic', count: 15 },
        { tier: 'professional', count: 12 },
        { tier: 'premium', count: 6 },
      ]
    }
  });
});

app.get('/api/admin/candidates', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'أحمد المرشح', governorate: 'Baghdad', tier: 'professional', subscription_status: 'active', total_posts: 45, avg_sentiment: 0.72 },
      { id: '3', name: 'سارة علي', governorate: 'Basra', tier: 'basic', subscription_status: 'active', total_posts: 32, avg_sentiment: 0.68 },
      { id: '4', name: 'محمد حسن', governorate: 'Erbil', tier: 'premium', subscription_status: 'active', total_posts: 67, avg_sentiment: 0.81 },
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', mode: 'DEMO' });
});

app.listen(PORT, () => {
  console.log(`
  🎉 HamlatAI DEMO Server Running!
  
  📍 Backend: http://localhost:${PORT}
  🌐 Frontend: http://localhost:5173
  
  🔐 Demo Login:
     Email: demo@hamlatai.com
     Password: demo123
  
  👨‍💼 Admin Login:
     Email: admin@hamlatai.com
     Password: admin123
  
  ⚠️  This is a DEMO with mock data (no database required)
  `);
});
