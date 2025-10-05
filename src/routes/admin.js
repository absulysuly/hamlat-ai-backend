import express from 'express';
import { query } from '../../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authorize } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All admin routes require admin role
router.use(authorize('admin'));

/**
 * Get all candidates overview
 */
router.get('/candidates', asyncHandler(async (req, res) => {
  const { tier, status, governorate } = req.query;

  let queryText = `
    SELECT 
      u.id, u.name, u.email, u.governorate, u.political_party,
      u.language, u.tier, u.subscription_status,
      u.trial_end_date, u.subscription_end_date,
      u.created_at,
      COUNT(DISTINCT gc.id) as total_posts,
      COUNT(DISTINCT sm.id) as total_mentions,
      COALESCE(AVG(ad.sentiment_score), 0) as avg_sentiment
    FROM users u
    LEFT JOIN generated_content gc ON u.id = gc.user_id
    LEFT JOIN social_mentions sm ON u.id = sm.user_id
    LEFT JOIN analytics_daily ad ON u.id = ad.user_id AND ad.date >= CURRENT_DATE - INTERVAL '7 days'
    WHERE u.role = 'candidate' AND u.is_active = true
  `;

  const params = [];
  let paramCount = 1;

  if (tier) {
    queryText += ` AND u.tier = $${paramCount++}`;
    params.push(tier);
  }

  if (status) {
    queryText += ` AND u.subscription_status = $${paramCount++}`;
    params.push(status);
  }

  if (governorate) {
    queryText += ` AND u.governorate = $${paramCount++}`;
    params.push(governorate);
  }

  queryText += `
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * Get platform statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  // Total users by tier
  const tierStats = await query(`
    SELECT tier, COUNT(*) as count
    FROM users
    WHERE role = 'candidate' AND is_active = true
    GROUP BY tier
  `);

  // Revenue (from payments)
  const revenueStats = await query(`
    SELECT 
      SUM(amount) as total_revenue,
      COUNT(*) as total_transactions,
      AVG(amount) as avg_transaction
    FROM payments
    WHERE status = 'completed'
  `);

  // Content generated
  const contentStats = await query(`
    SELECT 
      COUNT(*) as total_content,
      COUNT(*) FILTER (WHERE status = 'published') as published_content,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as content_this_week
    FROM generated_content
  `);

  // Active users (logged in last 7 days)
  const activeUsers = await query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE last_login >= CURRENT_DATE - INTERVAL '7 days'
    AND role = 'candidate'
  `);

  // Trial conversions
  const conversionStats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE subscription_status = 'trial') as active_trials,
      COUNT(*) FILTER (WHERE subscription_status = 'active') as paid_users,
      COUNT(*) FILTER (WHERE subscription_status = 'expired') as expired_users
    FROM users
    WHERE role = 'candidate'
  `);

  res.json({
    success: true,
    data: {
      tiers: tierStats.rows,
      revenue: revenueStats.rows[0],
      content: contentStats.rows[0],
      active_users: parseInt(activeUsers.rows[0].count),
      conversions: conversionStats.rows[0],
    },
  });
}));

/**
 * Get candidate details
 */
router.get('/candidates/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userResult = await query(
    `SELECT u.*, c.*
    FROM users u
    LEFT JOIN campaigns c ON u.id = c.user_id
    WHERE u.id = $1`,
    [id]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found',
    });
  }

  // Get analytics
  const analyticsResult = await query(
    `SELECT * FROM analytics_daily
    WHERE user_id = $1
    ORDER BY date DESC
    LIMIT 30`,
    [id]
  );

  // Get recent activity
  const activityResult = await query(
    `SELECT * FROM activity_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20`,
    [id]
  );

  res.json({
    success: true,
    data: {
      user: userResult.rows[0],
      analytics: analyticsResult.rows,
      activity: activityResult.rows,
    },
  });
}));

/**
 * Update candidate subscription
 */
router.put('/candidates/:id/subscription', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tier, subscription_status, subscription_end_date } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (tier) {
    updates.push(`tier = $${paramCount++}`);
    values.push(tier);
  }

  if (subscription_status) {
    updates.push(`subscription_status = $${paramCount++}`);
    values.push(subscription_status);
  }

  if (subscription_end_date) {
    updates.push(`subscription_end_date = $${paramCount++}`);
    values.push(subscription_end_date);
  }

  values.push(id);

  const result = await query(
    `UPDATE users
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount}
    RETURNING *`,
    values
  );

  logger.info('Admin updated subscription:', { candidateId: id, updates: req.body });

  res.json({
    success: true,
    message: 'Subscription updated successfully',
    data: result.rows[0],
  });
}));

/**
 * Bulk content generation for all active candidates
 */
router.post('/bulk-generate-content', asyncHandler(async (req, res) => {
  const { tier_filter } = req.body;

  let queryText = `
    SELECT id FROM users
    WHERE role = 'candidate' AND is_active = true
    AND subscription_status IN ('active', 'trial')
  `;

  if (tier_filter) {
    queryText += ` AND tier = $1`;
  }

  const result = await query(
    queryText,
    tier_filter ? [tier_filter] : []
  );

  // Queue bulk generation job
  logger.info('Bulk content generation queued for candidates:', result.rows.length);

  res.json({
    success: true,
    message: `Content generation queued for ${result.rows.length} candidates`,
    count: result.rows.length,
  });
}));

/**
 * Get payment transactions
 */
router.get('/payments', asyncHandler(async (req, res) => {
  const { status, method, limit = 50 } = req.query;

  let queryText = `
    SELECT p.*, u.name as candidate_name, u.email
    FROM payments p
    JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 1;

  if (status) {
    queryText += ` AND p.status = $${paramCount++}`;
    params.push(status);
  }

  if (method) {
    queryText += ` AND p.method = $${paramCount++}`;
    params.push(method);
  }

  queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount}`;
  params.push(limit);

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * Confirm payment manually
 */
router.put('/payments/:id/confirm', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `UPDATE payments
    SET status = 'completed', paid_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found',
    });
  }

  // Activate subscription
  const payment = result.rows[0];
  
  await query(
    `UPDATE users
    SET 
      tier = $1,
      subscription_status = 'active',
      subscription_start_date = CURRENT_TIMESTAMP,
      subscription_end_date = $2
    WHERE id = $3`,
    [
      payment.plan,
      new Date(process.env.ELECTION_DATE || '2025-12-15'),
      payment.user_id,
    ]
  );

  logger.info('Admin confirmed payment:', { paymentId: id });

  res.json({
    success: true,
    message: 'Payment confirmed and subscription activated',
    data: result.rows[0],
  });
}));

/**
 * Get system activity logs
 */
router.get('/activity-logs', asyncHandler(async (req, res) => {
  const { user_id, action, limit = 100 } = req.query;

  let queryText = `
    SELECT al.*, u.name as user_name
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;

  const params = [];
  let paramCount = 1;

  if (user_id) {
    queryText += ` AND al.user_id = $${paramCount++}`;
    params.push(user_id);
  }

  if (action) {
    queryText += ` AND al.action = $${paramCount++}`;
    params.push(action);
  }

  queryText += ` ORDER BY al.created_at DESC LIMIT $${paramCount}`;
  params.push(limit);

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
  });
}));

export default router;
