-- HamlatAI Database Schema
-- Multi-tenant Political Campaign Management Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'candidate', 'staff', 'viewer');
CREATE TYPE user_tier AS ENUM ('free', 'basic', 'professional', 'premium');
CREATE TYPE language_type AS ENUM ('ar', 'ku', 'en');
CREATE TYPE dialect_type AS ENUM ('iraqi_arabic', 'baghdad', 'basra', 'mosul', 'sorani', 'kurmanji');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    
    -- Profile
    governorate VARCHAR(100) NOT NULL,
    political_party VARCHAR(255),
    is_independent BOOLEAN DEFAULT false,
    profile_image_url TEXT,
    voice_sample_url TEXT,
    voice_clone_id VARCHAR(255), -- For ElevenLabs/D-ID
    
    -- Language & Preferences
    language language_type DEFAULT 'ar',
    dialect dialect_type,
    voice_enabled BOOLEAN DEFAULT true,
    
    -- Subscription
    role user_role DEFAULT 'candidate',
    tier user_tier DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'trial',
    trial_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trial_end_date TIMESTAMP,
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT valid_phone CHECK (phone ~ '^\+?[0-9]{10,15}$')
);

-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Campaign Details
    name VARCHAR(255) NOT NULL,
    status campaign_status DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    
    -- Target Audience
    target_audience JSONB DEFAULT '{}'::jsonb,
    -- Example: {"age_range": [18, 65], "gender": "all", "regions": ["Baghdad", "Karkh"]}
    
    -- Key Messages & Issues
    key_issues TEXT[] DEFAULT '{}',
    campaign_promises TEXT[] DEFAULT '{}',
    key_messages JSONB DEFAULT '[]'::jsonb,
    
    -- Content Preferences
    content_preferences JSONB DEFAULT '{}'::jsonb,
    -- Example: {"tone": "professional", "emoji_usage": "moderate", "post_frequency": 3}
    
    -- Branding
    campaign_logo_url TEXT,
    brand_colors JSONB DEFAULT '{"primary": "#4f46e5", "secondary": "#10b981"}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SOCIAL MEDIA ACCOUNTS
-- ============================================

CREATE TYPE platform_type AS ENUM ('facebook', 'instagram', 'telegram', 'tiktok', 'twitter', 'youtube');
CREATE TYPE account_status AS ENUM ('connected', 'disconnected', 'error', 'pending');

CREATE TABLE social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    platform platform_type NOT NULL,
    account_id VARCHAR(255),
    account_name VARCHAR(255),
    account_url TEXT,
    
    -- Authentication
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    
    status account_status DEFAULT 'pending',
    
    -- Metadata
    followers_count INT DEFAULT 0,
    last_synced_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, platform, account_id)
);

-- ============================================
-- GENERATED CONTENT
-- ============================================

CREATE TYPE content_type AS ENUM ('post', 'video', 'image', 'story', 'reel');
CREATE TYPE content_status AS ENUM ('draft', 'scheduled', 'published', 'failed', 'locked');

CREATE TABLE generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Content Details
    type content_type NOT NULL,
    platform platform_type,
    language language_type NOT NULL,
    
    -- Content
    title VARCHAR(500),
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    
    -- AI Metadata
    ai_model VARCHAR(100), -- 'groq-llama-3.1', 'gemini-pro', etc.
    generation_prompt TEXT,
    
    -- Scheduling
    status content_status DEFAULT 'draft',
    scheduled_time TIMESTAMP,
    published_at TIMESTAMP,
    
    -- Performance Predictions (AI-generated)
    predicted_reach INT,
    predicted_engagement INT,
    predicted_sentiment VARCHAR(50),
    
    -- Actual Performance (after publishing)
    actual_reach INT,
    actual_likes INT,
    actual_comments INT,
    actual_shares INT,
    engagement_rate DECIMAL(5,2),
    
    -- Post ID on platform (after publishing)
    platform_post_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick filtering
CREATE INDEX idx_content_user_status ON generated_content(user_id, status);
CREATE INDEX idx_content_scheduled ON generated_content(scheduled_time) WHERE status = 'scheduled';

-- ============================================
-- SOCIAL MENTIONS & MONITORING
-- ============================================

CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE social_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Source
    platform platform_type NOT NULL,
    source_url TEXT,
    author_name VARCHAR(255),
    author_id VARCHAR(255),
    
    -- Content
    content TEXT NOT NULL,
    language language_type,
    
    -- Analysis
    sentiment sentiment_type,
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    emotion VARCHAR(50), -- 'supportive', 'angry', 'questioning', etc.
    urgency urgency_level DEFAULT 'low',
    
    -- Response Management
    requires_response BOOLEAN DEFAULT false,
    responded BOOLEAN DEFAULT false,
    suggested_response TEXT,
    actual_response TEXT,
    responded_at TIMESTAMP,
    
    -- Metadata
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for real-time monitoring
CREATE INDEX idx_mentions_user_unread ON social_mentions(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_mentions_urgent ON social_mentions(user_id, urgency) WHERE urgency IN ('high', 'critical');

-- ============================================
-- ANALYTICS & METRICS
-- ============================================

CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Follower Metrics
    followers_start INT DEFAULT 0,
    followers_end INT DEFAULT 0,
    followers_gained INT DEFAULT 0,
    followers_lost INT DEFAULT 0,
    
    -- Engagement Metrics
    total_reach INT DEFAULT 0,
    total_impressions INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    total_comments INT DEFAULT 0,
    total_shares INT DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    
    -- Content Metrics
    posts_published INT DEFAULT 0,
    videos_published INT DEFAULT 0,
    
    -- Sentiment Metrics
    positive_mentions INT DEFAULT 0,
    neutral_mentions INT DEFAULT 0,
    negative_mentions INT DEFAULT 0,
    sentiment_score DECIMAL(3,2), -- Average daily sentiment
    
    -- Platform Breakdown
    platform_metrics JSONB DEFAULT '{}'::jsonb,
    -- Example: {"facebook": {"reach": 1000, "engagement": 50}, "instagram": {...}}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, date)
);

-- Index for time-series queries
CREATE INDEX idx_analytics_user_date ON analytics_daily(user_id, date DESC);

-- ============================================
-- PAYMENTS & SUBSCRIPTIONS
-- ============================================

CREATE TYPE payment_method AS ENUM ('zain_cash', 'qi_card', 'bank_transfer', 'cash_delivery', 'usdt', 'stripe');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE plan_type AS ENUM ('free_trial', 'basic', 'professional', 'premium');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payment Details
    plan plan_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IQD',
    method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    
    -- Payment Gateway Reference
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- For cash delivery
    representative_id UUID,
    scheduled_delivery_time TIMESTAMP,
    delivery_address TEXT,
    
    -- Metadata
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    
    plan plan_type NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    
    -- Features enabled
    features_enabled JSONB DEFAULT '{}'::jsonb,
    
    -- Cancellation
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AI RESPONSES & AUTOMATION
-- ============================================

CREATE TYPE response_status AS ENUM ('pending_approval', 'approved', 'rejected', 'auto_posted');

CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mention_id UUID REFERENCES social_mentions(id) ON DELETE CASCADE,
    
    -- Original Comment
    original_comment TEXT NOT NULL,
    
    -- AI Generated Response
    suggested_response TEXT NOT NULL,
    ai_model VARCHAR(100),
    confidence_score DECIMAL(3,2),
    
    -- Human Review
    status response_status DEFAULT 'pending_approval',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Final Response (may be edited by human)
    final_response TEXT,
    posted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VOICE COMMANDS & INTERACTIONS
-- ============================================

CREATE TABLE voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Voice Input
    spoken_text TEXT NOT NULL,
    language language_type NOT NULL,
    audio_url TEXT,
    
    -- AI Processing
    detected_intent VARCHAR(100),
    intent_confidence DECIMAL(3,2),
    extracted_parameters JSONB,
    
    -- Action Taken
    action_executed VARCHAR(255),
    execution_result JSONB,
    success BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NOTIFICATIONS & ALERTS
-- ============================================

CREATE TYPE notification_type AS ENUM ('mention', 'milestone', 'alert', 'system', 'payment');
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'email', 'in_app', 'sms');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type notification_type NOT NULL,
    channel notification_channel NOT NULL,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    
    -- Status
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ACTIVITY LOGS (Audit Trail)
-- ============================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    
    -- Details
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Request Info
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_user_time ON activity_logs(user_id, created_at DESC);

-- ============================================
-- COMPETITOR ANALYSIS
-- ============================================

CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    governorate VARCHAR(100),
    political_party VARCHAR(255),
    
    -- Social Media
    social_accounts JSONB DEFAULT '{}'::jsonb,
    
    -- Tracking
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE competitor_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Metrics
    followers INT,
    avg_engagement_rate DECIMAL(5,2),
    posts_count INT,
    
    -- Content Analysis
    top_topics TEXT[],
    sentiment_score DECIMAL(3,2),
    
    metrics JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(competitor_id, date)
);

-- ============================================
-- DEMO CONTENT (For Free Tier)
-- ============================================

CREATE TABLE demo_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    content_id UUID REFERENCES generated_content(id) ON DELETE CASCADE,
    
    -- Display to free users
    is_visible BOOLEAN DEFAULT true,
    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Track if it converted them
    led_to_conversion BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate trial end date automatically
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trial_start_date IS NOT NULL AND NEW.trial_end_date IS NULL THEN
        NEW.trial_end_date = NEW.trial_start_date + INTERVAL '14 days';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_user_trial_end BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION set_trial_end_date();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active candidates with subscription info
CREATE VIEW active_candidates AS
SELECT 
    u.id,
    u.name,
    u.governorate,
    u.language,
    u.tier,
    u.subscription_status,
    u.subscription_end_date,
    COUNT(DISTINCT gc.id) as total_posts,
    COUNT(DISTINCT sm.id) as total_mentions,
    COALESCE(AVG(ad.sentiment_score), 0) as avg_sentiment
FROM users u
LEFT JOIN generated_content gc ON u.id = gc.user_id
LEFT JOIN social_mentions sm ON u.id = sm.user_id
LEFT JOIN analytics_daily ad ON u.id = ad.user_id
WHERE u.is_active = true AND u.role = 'candidate'
GROUP BY u.id;

-- Daily performance summary
CREATE VIEW daily_performance AS
SELECT 
    user_id,
    date,
    followers_gained,
    total_reach,
    engagement_rate,
    sentiment_score,
    (positive_mentions::float / NULLIF(positive_mentions + neutral_mentions + negative_mentions, 0)) * 100 as positive_percentage
FROM analytics_daily
ORDER BY date DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_tier_status ON users(tier, subscription_status);

-- Content queries
CREATE INDEX idx_content_platform ON generated_content(platform);
CREATE INDEX idx_content_language ON generated_content(language);

-- Mentions monitoring
CREATE INDEX idx_mentions_platform ON social_mentions(platform);
CREATE INDEX idx_mentions_sentiment ON social_mentions(sentiment);

-- Full-text search
CREATE INDEX idx_content_text_search ON generated_content USING gin(to_tsvector('english', content));
CREATE INDEX idx_mentions_text_search ON social_mentions USING gin(to_tsvector('english', content));

-- ============================================
-- SEED DATA (Iraqi Governorates)
-- ============================================

CREATE TABLE governorates (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ku VARCHAR(100),
    region VARCHAR(50), -- 'central', 'south', 'north', 'kurdistan'
    population INT,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO governorates (name_ar, name_en, name_ku, region, population) VALUES
('بغداد', 'Baghdad', 'بەغدا', 'central', 8000000),
('البصرة', 'Basra', 'بەسرە', 'south', 2500000),
('الموصل', 'Mosul', 'مووسڵ', 'north', 1800000),
('أربيل', 'Erbil', 'هەولێر', 'kurdistan', 1600000),
('السليمانية', 'Sulaymaniyah', 'سلێمانی', 'kurdistan', 1800000),
('النجف', 'Najaf', 'نەجەف', 'south', 1400000),
('كربلاء', 'Karbala', 'کەربەلا', 'central', 1200000),
('دهوك', 'Duhok', 'دهۆک', 'kurdistan', 600000),
('كركوك', 'Kirkuk', 'کەرکووک', 'north', 1500000),
('الأنبار', 'Anbar', 'ئەنبار', 'west', 1700000),
('ديالى', 'Diyala', 'دیالە', 'central', 1500000),
('صلاح الدين', 'Saladin', 'سەلاحەدین', 'north', 1500000),
('واسط', 'Wasit', 'واسیت', 'central', 1300000),
('ميسان', 'Maysan', 'مەیسان', 'south', 1000000),
('ذي قار', 'Dhi Qar', 'زیقار', 'south', 2000000),
('المثنى', 'Muthanna', 'موسەنا', 'south', 800000),
('بابل', 'Babil', 'بابل', 'central', 2000000),
('حلبجة', 'Halabja', 'هەڵەبجە', 'kurdistan', 100000);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Multi-tenant user accounts (candidates, admins, staff)';
COMMENT ON TABLE campaigns IS 'Campaign configurations and settings per candidate';
COMMENT ON TABLE generated_content IS 'AI-generated content (posts, videos, images)';
COMMENT ON TABLE social_mentions IS 'Social media monitoring and sentiment tracking';
COMMENT ON TABLE analytics_daily IS 'Daily aggregated performance metrics';
COMMENT ON TABLE payments IS 'Payment transactions and subscription billing';
COMMENT ON TABLE ai_responses IS 'AI-generated responses awaiting approval';
COMMENT ON TABLE voice_commands IS 'Voice command history and processing logs';
