import { query } from '../../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Persistent Data Access Service
 * Ensures all collected data is immediately saved and accessible
 */

class PersistentDataService {
  constructor() {
    this.isCollecting = false;
    this.lastSaveTime = new Date();
  }

  /**
   * Save social mention immediately to database
   */
  async saveSocialMention(data) {
    try {
      const result = await query(`
        INSERT INTO social_mentions (
          platform, content, author_name, author_handle, post_id,
          media_url, engagement_metrics, sentiment, detected_at,
          url, region, language, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (platform, post_id) DO UPDATE SET
          content = EXCLUDED.content,
          engagement_metrics = EXCLUDED.engagement_metrics,
          detected_at = EXCLUDED.detected_at,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [
        data.platform,
        data.content,
        data.author_name,
        data.author_handle,
        data.post_id,
        data.media_url,
        JSON.stringify(data.engagement_metrics || {}),
        data.sentiment,
        data.detected_at || new Date(),
        data.url,
        data.region,
        data.language,
        data.user_id
      ]);

      this.lastSaveTime = new Date();
      logger.debug(`✅ Saved social mention: ${data.platform}/${data.post_id}`);

      return result.rows[0].id;

    } catch (error) {
      logger.error('Failed to save social mention:', error);
      throw error;
    }
  }

  /**
   * Save Kurdistan-specific mention (separate storage)
   */
  async saveKurdistanMention(data) {
    try {
      const result = await query(`
        INSERT INTO kurdistan_mentions (
          platform, content, author_name, author_handle, post_id,
          media_url, engagement_metrics, sentiment, detected_at,
          url, region, language, governorate, candidate_type, user_id, priority_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (platform, post_id) DO UPDATE SET
          content = EXCLUDED.content,
          engagement_metrics = EXCLUDED.engagement_metrics,
          detected_at = EXCLUDED.detected_at,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [
        data.platform,
        data.content,
        data.author_name,
        data.author_handle,
        data.post_id,
        data.media_url,
        JSON.stringify(data.engagement_metrics || {}),
        data.sentiment,
        data.detected_at || new Date(),
        data.url,
        data.region,
        data.language,
        data.governorate,
        data.candidate_type,
        data.user_id,
        data.priority_level || 1
      ]);

      logger.debug(`✅ Saved Kurdistan mention: ${data.region}/${data.language}`);

      return result.rows[0].id;

    } catch (error) {
      logger.error('Failed to save Kurdistan mention:', error);
      throw error;
    }
  }

  /**
   * Save scraped content
   */
  async saveScrapedContent(data) {
    try {
      await query(`
        INSERT INTO scraped_content (
          title, content, url, source, source_type, relevance_score,
          language, region
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (url) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          relevance_score = EXCLUDED.relevance_score,
          detected_at = CURRENT_TIMESTAMP
      `, [
        data.title,
        data.content,
        data.url,
        data.source,
        data.source_type,
        data.relevance_score || 0.8,
        data.language,
        data.region
      ]);

      logger.debug(`✅ Saved scraped content: ${data.source}`);

    } catch (error) {
      logger.error('Failed to save scraped content:', error);
      throw error;
    }
  }

  /**
   * Update candidate profile
   */
  async updateCandidateProfile(data) {
    try {
      const result = await query(`
        INSERT INTO candidates (
          name, party_affiliation, governorate, position, social_media,
          languages, priority_level, region_type, influence_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (name, governorate) DO UPDATE SET
          party_affiliation = EXCLUDED.party_affiliation,
          position = EXCLUDED.position,
          social_media = EXCLUDED.social_media,
          languages = EXCLUDED.languages,
          priority_level = EXCLUDED.priority_level,
          region_type = EXCLUDED.region_type,
          influence_score = EXCLUDED.influence_score,
          last_activity = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [
        data.name,
        data.party_affiliation,
        data.governorate,
        data.position,
        JSON.stringify(data.social_media || {}),
        data.languages || [],
        data.priority_level || 6,
        data.region_type || 'other',
        data.influence_score || 0
      ]);

      logger.debug(`✅ Updated candidate profile: ${data.name}`);

      return result.rows[0].id;

    } catch (error) {
      logger.error('Failed to update candidate profile:', error);
      throw error;
    }
  }

  /**
   * Get recent mentions for immediate access
   */
  async getRecentMentions(limit = 100, hours = 24) {
    try {
      const result = await query(`
        SELECT * FROM social_mentions
        WHERE detected_at >= NOW() - INTERVAL '${hours} hours'
        ORDER BY detected_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows;

    } catch (error) {
      logger.error('Failed to get recent mentions:', error);
      throw error;
    }
  }

  /**
   * Get Kurdistan mentions (separate access)
   */
  async getKurdistanMentions(limit = 100, hours = 24) {
    try {
      const result = await query(`
        SELECT * FROM kurdistan_mentions
        WHERE detected_at >= NOW() - INTERVAL '${hours} hours'
        ORDER BY detected_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows;

    } catch (error) {
      logger.error('Failed to get Kurdistan mentions:', error);
      throw error;
    }
  }

  /**
   * Get candidate contacts for immediate outreach
   */
  async getCandidateContacts(minInfluence = 0, region = null) {
    try {
      let queryText = `
        SELECT * FROM candidates
        WHERE influence_score >= $1
        AND profile_complete = true
      `;
      const params = [minInfluence];
      let paramCount = 2;

      if (region) {
        queryText += ` AND governorate = $${paramCount++}`;
        params.push(region);
      }

      queryText += ` ORDER BY influence_score DESC, last_activity DESC`;

      const result = await query(queryText, params);

      return result.rows;

    } catch (error) {
      logger.error('Failed to get candidate contacts:', error);
      throw error;
    }
  }

  /**
   * Check data collection health
   */
  async getCollectionHealth() {
    try {
      const stats = await query(`
        SELECT
          COUNT(*) as total_mentions,
          COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '1 hour') as last_hour,
          COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '24 hours') as last_24h,
          MAX(detected_at) as latest_mention
        FROM social_mentions
      `);

      const kurdistanStats = await query(`
        SELECT
          COUNT(*) as kurdistan_mentions,
          COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '1 hour') as kurdistan_recent
        FROM kurdistan_mentions
      `);

      return {
        total_mentions: parseInt(stats.rows[0].total_mentions),
        last_hour: parseInt(stats.rows[0].last_hour),
        last_24h: parseInt(stats.rows[0].last_24h),
        latest_mention: stats.rows[0].latest_mention,
        kurdistan_mentions: parseInt(kurdistanStats.rows[0].kurdistan_mentions),
        kurdistan_recent: parseInt(kurdistanStats.rows[0].kurdistan_recent),
        is_healthy: stats.rows[0].last_hour > 0,
        last_save: this.lastSaveTime
      };

    } catch (error) {
      logger.error('Failed to get collection health:', error);
      return {
        is_healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Emergency data export (for backup)
   */
  async exportAllData() {
    try {
      const [mentions, kurdistan, candidates, scraped] = await Promise.all([
        query('SELECT * FROM social_mentions ORDER BY detected_at DESC'),
        query('SELECT * FROM kurdistan_mentions ORDER BY detected_at DESC'),
        query('SELECT * FROM candidates ORDER BY influence_score DESC'),
        query('SELECT * FROM scraped_content ORDER BY detected_at DESC')
      ]);

      return {
        mentions: mentions.rows,
        kurdistan: kurdistan.rows,
        candidates: candidates.rows,
        scraped: scraped.rows,
        exported_at: new Date(),
        record_counts: {
          mentions: mentions.rows.length,
          kurdistan: kurdistan.rows.length,
          candidates: candidates.rows.length,
          scraped: scraped.rows.length
        }
      };

    } catch (error) {
      logger.error('Failed to export data:', error);
      throw error;
    }
  }
}

export const persistentDataService = new PersistentDataService();

/**
 * Initialize persistent data collection
 */
export async function startPersistentCollection() {
  logger.info('💾 Starting persistent data collection service');

  // Ensure collections are running
  persistentDataService.isCollecting = true;

  // Monitor data saving every minute
  setInterval(async () => {
    try {
      const health = await persistentDataService.getCollectionHealth();

      if (!health.is_healthy) {
        logger.warn('⚠️  Data collection may not be saving properly');
      } else {
        logger.debug(`💾 Data persistence healthy: ${health.last_hour} mentions/hour`);
      }
    } catch (error) {
      logger.error('❌ Health check failed:', error);
    }
  }, 60 * 1000); // Every minute

  logger.info('✅ Persistent data collection service started');
}

export default persistentDataService;
