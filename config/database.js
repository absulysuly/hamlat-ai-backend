import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import logger from '../src/utils/logger.js';

dotenv.config();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

// Initialize database
export async function initializeDatabase() {
  try {
    const client = await pool.connect();

    // Test query
    const result = await client.query('SELECT NOW()');
    logger.info('Database time:', result.rows[0].now);

    client.release();

    // Run migrations to ensure tables exist for persistent data
    await runMigrations();
    logger.info('Database migrations completed');

    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Run migrations inline to avoid circular dependency
async function runMigrations() {
  logger.info('🔄 Running database migrations for persistent data storage');

  try {
    const client = await pool.connect();

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if migrations already ran
    const existingMigrations = await client.query(
      `SELECT name FROM schema_migrations`
    );

    const ranMigrations = new Set(existingMigrations.rows.map(row => row.name));

    // Create social_mentions table
    if (!ranMigrations.has('001_create_social_tables')) {
      logger.info('🚀 Running migration: 001_create_social_tables');

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
          user_id INTEGER,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS scraped_content (
          id SERIAL PRIMARY KEY,
          title TEXT,
          content TEXT,
          url TEXT UNIQUE,
          source VARCHAR(255),
          source_type VARCHAR(50),
          relevance_score DECIMAL(3,2),
          detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          language VARCHAR(50),
          region VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

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
          language VARCHAR(50),
          governorate VARCHAR(100),
          candidate_type VARCHAR(50),
          user_id INTEGER,
          is_read BOOLEAN DEFAULT FALSE,
          priority_level INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS candidates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          party_affiliation VARCHAR(255),
          governorate VARCHAR(100),
          position VARCHAR(255),
          social_media JSONB,
          contact_info JSONB,
          languages VARCHAR(255) ARRAY,
          priority_level INTEGER DEFAULT 6,
          region_type VARCHAR(50),
          influence_score DECIMAL(5,2) DEFAULT 0,
          last_activity TIMESTAMP,
          profile_complete BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Record migration
      await client.query(
        `INSERT INTO schema_migrations (name, run_at) VALUES ($1, $2)`,
        ['001_create_social_tables', new Date()]
      );

      logger.info('✅ Migration completed: 001_create_social_tables');
    }

    client.release();
    logger.info('🎯 All database migrations completed');

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
}

// Query helper
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error:', { text, error: error.message });
    throw error;
  }
}

// Transaction helper
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
