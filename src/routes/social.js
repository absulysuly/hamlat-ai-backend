import express from 'express';
import { query } from '../../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { analyzeSentiment } from '../services/ai/contentGenerator.js';
import { socialDataCollector } from '../services/collectors/socialDataCollector.js';
import { socialMediaAPI } from '../services/social/socialMediaAPI.js';
import { webScrapingService } from '../services/scrapers/webScrapingService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Get social mentions with enhanced filtering
 */
router.get('/mentions', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    sentiment,
    platform,
    region,
    language,
    unread_only,
    limit = 50,
    date_from,
    date_to
  } = req.query;

  let queryText = `
    SELECT sm.*, u.name as candidate_name, u.governorate
    FROM social_mentions sm
    LEFT JOIN users u ON sm.user_id = u.id
    WHERE sm.user_id = $1 OR sm.user_id IS NULL
  `;
  const params = [userId];
  let paramCount = 2;

  // Add filters
  if (sentiment) {
    queryText += ` AND sm.sentiment = $${paramCount++}`;
    params.push(sentiment);
  }

  if (platform) {
    queryText += ` AND sm.platform = $${paramCount++}`;
    params.push(platform);
  }

  if (region) {
    queryText += ` AND sm.region = $${paramCount++}`;
    params.push(region);
  }

  if (language) {
    queryText += ` AND sm.language = $${paramCount++}`;
    params.push(language);
  }

  if (unread_only === 'true') {
    queryText += ` AND sm.is_read = false`;
  }

  if (date_from) {
    queryText += ` AND sm.detected_at >= $${paramCount++}`;
    params.push(date_from);
  }

  if (date_to) {
    queryText += ` AND sm.detected_at <= $${paramCount++}`;
    params.push(date_to);
  }

  queryText += ` ORDER BY sm.detected_at DESC LIMIT $${paramCount}`;
  params.push(limit);

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
    total: result.rows.length
  });
}));

/**
 * Get priority-based collection analytics
 */
router.get('/priority-analytics', asyncHandler(async (req, res) => {
  const { period = '24h' } = req.query;

  // Calculate date range
  const now = new Date();
  const hoursBack = period === '24h' ? 24 : period === '7d' ? 168 : 720; // 30 days
  const startDate = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));

  // Get priority-based metrics
  const priorityMetrics = await query(`
    SELECT
      region,
      region_type,
      priority_level,
      COUNT(*) as total_mentions,
      COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '1 hour') as recent_mentions,
      AVG(CAST(engagement_metrics->>'likes' AS INTEGER)) as avg_likes,
      language,
      COUNT(*) FILTER (WHERE language IN ('sorani', 'badini', 'kurmanji')) as kurdish_mentions
    FROM (
      SELECT
        sm.*,
        CASE
          WHEN sm.region IN ('erbil', 'sulaymaniyah', 'duhok', 'halabja') THEN 'kurdistan'
          WHEN sm.region = 'baghdad' THEN 'central'
          WHEN sm.region = 'basra' THEN 'south'
          WHEN sm.region IN ('najaf', 'karbala') THEN 'religious'
          WHEN sm.region = 'kirkuk' THEN 'disputed'
          ELSE 'other'
        END as region_type,
        CASE
          WHEN sm.region IN ('erbil', 'sulaymaniyah', 'duhok', 'halabja') THEN 1
          WHEN sm.region = 'baghdad' THEN 2
          WHEN sm.region = 'basra' THEN 3
          WHEN sm.region IN ('najaf', 'karbala') THEN 4
          WHEN sm.region = 'kirkuk' THEN 5
          ELSE 6
        END as priority_level
      FROM social_mentions sm
      WHERE sm.detected_at >= $1
    ) priority_data
    GROUP BY region, region_type, priority_level, language
    ORDER BY priority_level, total_mentions DESC
  `, [startDate]);

  // Get Kurdistan-specific breakdown
  const kurdistanBreakdown = await query(`
    SELECT
      language,
      COUNT(*) as mentions,
      COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '1 hour') as recent
    FROM social_mentions
    WHERE detected_at >= $1
    AND region IN ('erbil', 'sulaymaniyah', 'duhok', 'halabja')
    GROUP BY language
    ORDER BY mentions DESC
  `, [startDate]);

  res.json({
    success: true,
    data: {
      priority_metrics: priorityMetrics.rows,
      kurdistan_breakdown: kurdistanBreakdown.rows,
      period,
      total_kurdistan_mentions: kurdistanBreakdown.rows.reduce((sum, row) => sum + parseInt(row.mentions), 0),
      collection_priorities: {
        '1_kurdistan': 'Erbil, Sulaymaniyah, Duhok, Halabja (Sorani, Badini, Kurmanji)',
        '2_baghdad': 'Central Iraq (Arabic)',
        '3_basra': 'Southern Iraq (Arabic)',
        '4_religious': 'Najaf, Karbala (Arabic)',
        '5_kirkuk': 'Disputed territory (Multi-language)',
        '6_other': 'Remaining governorates'
      }
    }
  });
}));

/**
 * Manual data collection trigger
 */
router.post('/collect-data', asyncHandler(async (req, res) => {
  const { collection_type = 'all' } = req.body;

  logger.info(`Manual data collection triggered by user ${req.user.id}: ${collection_type}`);

  try {
    if (collection_type === 'all' || collection_type === 'api') {
      await socialMediaAPI.collectFromAllAPIs();
    }

    if (collection_type === 'all' || collection_type === 'scraping') {
      await webScrapingService.startScraping();
    }

    if (collection_type === 'all' || collection_type === 'comprehensive') {
      await socialDataCollector.startAggressiveCollection();
    }

    res.json({
      success: true,
      message: 'Data collection completed successfully'
    });

  } catch (error) {
    logger.error('Manual data collection failed:', error);
    res.status(500).json({
      success: false,
      message: 'Data collection failed',
      error: error.message
    });
  }
}));

/**
 * Get candidate profiles from collected data
 */
router.get('/candidates', asyncHandler(async (req, res) => {
  const { region, party, language } = req.query;

  let queryText = `
    SELECT DISTINCT
      author_name as candidate_name,
      author_handle as social_handle,
      platform,
      COUNT(*) as mention_count,
      MAX(detected_at) as last_seen,
      AVG(CAST(engagement_metrics->>'likes' AS INTEGER)) as avg_likes
    FROM social_mentions
    WHERE author_name IS NOT NULL
  `;
  const params = [];
  let paramCount = 1;

  if (region) {
    queryText += ` AND region = $${paramCount++}`;
    params.push(region);
  }

  if (language) {
    queryText += ` AND language = $${paramCount++}`;
    params.push(language);
  }

  queryText += `
    GROUP BY author_name, author_handle, platform
    HAVING COUNT(*) >= 3
    ORDER BY mention_count DESC, last_seen DESC
    LIMIT 100
  `;

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
    total: result.rows.length
  });
}));

/**
 * Analyze comment sentiment (enhanced)
 */
router.post('/analyze-sentiment', asyncHandler(async (req, res) => {
  const { comment, language, platform } = req.body;

  if (!comment) {
    return res.status(400).json({
      success: false,
      message: 'Comment is required',
    });
  }

  const analysis = await analyzeSentiment(comment, language || req.user.language);

  // Store the analyzed comment if platform provided
  if (platform) {
    await query(`
      INSERT INTO social_mentions (
        platform, content, sentiment, language, detected_at, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      platform,
      comment,
      analysis.sentiment,
      language || req.user.language,
      new Date(),
      req.user.id
    ]);
  }

  res.json({
    success: true,
    data: analysis,
  });
}));

/**
 * Get trending topics and hashtags
 */
router.get('/trends', asyncHandler(async (req, res) => {
  const { region, language, hours = 24 } = req.query;

  const trends = await query(`
    SELECT
      content,
      COUNT(*) as frequency,
      MAX(detected_at) as last_seen,
      platform
    FROM social_mentions
    WHERE detected_at >= NOW() - INTERVAL '${hours} hours'
    AND ($1::text IS NULL OR region = $1)
    AND ($2::text IS NULL OR language = $2)
    GROUP BY content, platform
    HAVING COUNT(*) >= 3
    ORDER BY frequency DESC, last_seen DESC
    LIMIT 50
  `, [region, language]);

  res.json({
    success: true,
    data: trends.rows,
    period: `${hours} hours`,
    region: region || 'all',
    language: language || 'all'
  });
}));

/**
 * Mark mention as read
 */
router.put('/mentions/:id/read', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await query(
    `UPDATE social_mentions SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * Get data collection status and statistics
 */
router.get('/collection-status', asyncHandler(async (req, res) => {
  // Get collection statistics
  const stats = await query(`
    SELECT
      platform,
      COUNT(*) as total_collected,
      COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '24 hours') as last_24h,
      COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '7 days') as last_7d,
      MAX(detected_at) as last_collection
    FROM social_mentions
    GROUP BY platform
    ORDER BY total_collected DESC
  `);

  res.json({
    success: true,
    data: {
      statistics: stats.rows,
      last_updated: new Date(),
      collection_active: true
    }
  });
}));

export default router;
