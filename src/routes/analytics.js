import express from 'express';
import { query } from '../../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Get analytics overview
 */
router.get('/overview', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { days = 30 } = req.query;

  const result = await query(
    `SELECT * FROM analytics_daily
    WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
    ORDER BY date DESC`,
    [userId]
  );

  // Calculate totals
  const totals = result.rows.reduce((acc, day) => ({
    total_followers_gained: acc.total_followers_gained + (day.followers_gained || 0),
    total_reach: acc.total_reach + (day.total_reach || 0),
    total_engagement: acc.total_engagement + (day.total_likes + day.total_comments + day.total_shares || 0),
    avg_sentiment: acc.avg_sentiment + (day.sentiment_score || 0),
  }), { total_followers_gained: 0, total_reach: 0, total_engagement: 0, avg_sentiment: 0 });

  totals.avg_sentiment = totals.avg_sentiment / result.rows.length || 0;

  res.json({
    success: true,
    data: {
      daily: result.rows,
      totals,
    },
  });
}));

/**
 * Get performance metrics
 */
router.get('/performance', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT 
      COUNT(*) as total_posts,
      AVG(engagement_rate) as avg_engagement_rate,
      SUM(actual_reach) as total_reach,
      SUM(actual_likes) as total_likes,
      SUM(actual_comments) as total_comments,
      SUM(actual_shares) as total_shares
    FROM generated_content
    WHERE user_id = $1 AND status = 'published'`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

export default router;
