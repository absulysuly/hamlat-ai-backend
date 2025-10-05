/**
 * Database Migration: Create social_mentions table
 * Stores all collected social media mentions and candidate data
 */

export const up = async (client) => {
  // Create social_mentions table for persistent data storage
  await client.query(`
    CREATE TABLE IF NOT EXISTS social_mentions (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(50) NOT NULL,
      content TEXT,
      author_name VARCHAR(255),
      author_handle VARCHAR(255),
      post_id VARCHAR(255),
      media_url TEXT,
      engagement_metrics JSONB,
      sentiment VARCHAR(50),
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      url TEXT,
      region VARCHAR(100),
      language VARCHAR(50),
      user_id INTEGER REFERENCES users(id),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- Indexes for fast querying
      INDEX idx_platform_detected (platform, detected_at),
      INDEX idx_region (region),
      INDEX idx_language (language),
      INDEX idx_sentiment (sentiment),
      INDEX idx_user_id (user_id),
      INDEX idx_author (author_name, author_handle)
    );
  `);

  // Create scraped_content table for web scraping data
  await client.query(`
    CREATE TABLE IF NOT EXISTS scraped_content (
      id SERIAL PRIMARY KEY,
      title TEXT,
      content TEXT,
      url TEXT UNIQUE,
      source VARCHAR(255),
      source_type VARCHAR(50), -- 'news', 'official', 'party', etc.
      relevance_score DECIMAL(3,2),
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      language VARCHAR(50),
      region VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- Indexes
      INDEX idx_source_type (source_type),
      INDEX idx_relevance (relevance_score),
      INDEX idx_scraped_detected (detected_at)
    );
  `);

  // Create kurdistan_mentions table for separate Kurdistan data storage
  await client.query(`
    CREATE TABLE IF NOT EXISTS kurdistan_mentions (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(50) NOT NULL,
      content TEXT,
      author_name VARCHAR(255),
      author_handle VARCHAR(255),
      post_id VARCHAR(255),
      media_url TEXT,
      engagement_metrics JSONB,
      sentiment VARCHAR(50),
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      url TEXT,
      region VARCHAR(100),
      language VARCHAR(50), -- 'sorani', 'badini', 'kurmanji'
      governorate VARCHAR(100),
      candidate_type VARCHAR(50), -- 'kdp', 'puk', 'gorran', etc.
      user_id INTEGER REFERENCES users(id),
      is_read BOOLEAN DEFAULT FALSE,
      priority_level INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- Indexes for Kurdistan-specific queries
      INDEX idx_kurdistan_region (region),
      INDEX idx_kurdistan_language (language),
      INDEX idx_kurdistan_governorate (governorate),
      INDEX idx_kurdistan_priority (priority_level)
    );
  `);

  // Create candidates table for comprehensive candidate profiles
  await client.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      party_affiliation VARCHAR(255),
      governorate VARCHAR(100),
      position VARCHAR(255), -- MP, candidate, party leader, etc.
      social_media JSONB, -- Facebook, Instagram, YouTube, Twitter handles
      contact_info JSONB, -- Email, phone, address
      languages VARCHAR(255) ARRAY,
      priority_level INTEGER DEFAULT 6,
      region_type VARCHAR(50), -- 'kurdistan', 'central', 'south', etc.
      influence_score DECIMAL(5,2) DEFAULT 0,
      last_activity TIMESTAMP,
      profile_complete BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- Indexes
      INDEX idx_candidates_governorate (governorate),
      INDEX idx_candidates_party (party_affiliation),
      INDEX idx_candidates_priority (priority_level),
      INDEX idx_candidates_influence (influence_score)
    );
  `);

  console.log('✅ Database tables created for persistent data storage');
};

export const down = async (client) => {
  // Drop tables in reverse order (respecting foreign keys)
  await client.query('DROP TABLE IF EXISTS kurdistan_mentions');
  await client.query('DROP TABLE IF EXISTS scraped_content');
  await client.query('DROP TABLE IF EXISTS social_mentions');
  await client.query('DROP TABLE IF EXISTS candidates');

  console.log('✅ Database tables dropped');
};
