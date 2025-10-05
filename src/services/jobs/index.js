import cron from 'node-cron';
import { query } from '../../../config/database.js';
import { generateDailyContent } from '../ai/contentGenerator.js';
import { startDataCollection } from '../collectors/socialDataCollector.js';
import { startWebScraping } from '../scrapers/webScrapingService.js';
import { startAPICollection } from '../social/socialMediaAPI.js';
import logger from '../../utils/logger.js';

/**
 * Enhanced Background Jobs Service with Aggressive Data Collection
 */
export async function startBackgroundJobs() {
  logger.info('🚀 Starting enhanced background jobs with data collection');

  // Generate daily content at 8 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Starting daily content generation job');

    const result = await query(
      `SELECT id, name, governorate, language, dialect, tier
      FROM users
      WHERE role = 'candidate' AND is_active = true
      AND subscription_status IN ('active', 'trial')`
    );

    for (const user of result.rows) {
      try {
        await generateDailyContent({
          id: user.id,
          name: user.name,
          governorate: user.governorate,
          language: user.language,
          dialect: user.dialect,
          tier: user.tier,
          issues: [],
          audience: {},
        });

        logger.info(`Daily content generated for user ${user.id}`);
      } catch (error) {
        logger.error(`Failed to generate content for user ${user.id}:`, error);
      }
    }
  });

  // Aggressive data collection every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('🔥 Starting aggressive data collection cycle');

    try {
      await startAPICollection();
      await startWebScraping();
      await startDataCollection();
      logger.info('✅ Aggressive data collection cycle completed');
    } catch (error) {
      logger.error('❌ Aggressive data collection cycle failed:', error);
    }
  });

  // Deep data collection every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('🔍 Starting deep data collection');

    try {
      // More comprehensive data collection
      await startDataCollection();
      await startWebScraping();
      logger.info('✅ Deep data collection completed');
    } catch (error) {
      logger.error('❌ Deep data collection failed:', error);
    }
  });

  // Sentiment analysis update every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('📊 Updating sentiment analysis');

    try {
      // Update sentiment for recent mentions
      await query(`
        UPDATE social_mentions
        SET sentiment = analyze_sentiment(content)
        WHERE detected_at > NOW() - INTERVAL '1 hour'
        AND sentiment IS NULL
      `);
      logger.info('✅ Sentiment analysis updated');
    } catch (error) {
      logger.error('❌ Sentiment analysis update failed:', error);
    }
  });

  logger.info('✅ Enhanced background jobs initialized with aggressive data collection');
}

export default { startBackgroundJobs };
