import express from 'express';
import { query } from '../../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Get candidate dashboard overview
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get latest analytics
  const analyticsResult = await query(
    `SELECT * FROM analytics_daily
    WHERE user_id = $1
    ORDER BY date DESC
    LIMIT 7`,
    [userId]
  );

  // Get recent content
  const contentResult = await query(
    `SELECT * FROM generated_content
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 10`,
    [userId]
  );

  // Get unread mentions
  const mentionsResult = await query(
    `SELECT COUNT(*) as count FROM social_mentions
    WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  // Get today's stats
  const todayStats = await query(
    `SELECT * FROM analytics_daily
    WHERE user_id = $1 AND date = CURRENT_DATE`,
    [userId]
  );

  // Calculate trial days left
  const userResult = await query(
    `SELECT trial_end_date, subscription_end_date, tier, subscription_status
    FROM users WHERE id = $1`,
    [userId]
  );

  const user = userResult.rows[0];
  let daysLeft = 0;
  
  if (user.subscription_status === 'trial' && user.trial_end_date) {
    const endDate = new Date(user.trial_end_date);
    const today = new Date();
    daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  }

  res.json({
    success: true,
    data: {
      analytics: analyticsResult.rows,
      recent_content: contentResult.rows,
      unread_mentions: parseInt(mentionsResult.rows[0].count),
      today_stats: todayStats.rows[0] || null,
      subscription: {
        tier: user.tier,
        status: user.subscription_status,
        days_left: daysLeft,
      },
    },
  });
}));

/**
 * Get campaign details
 */
router.get('/campaign', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT * FROM campaigns WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found',
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * Update campaign settings
 */
router.put('/campaign', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    key_issues,
    campaign_promises,
    target_audience,
    content_preferences,
  } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (key_issues) {
    updates.push(`key_issues = $${paramCount++}`);
    values.push(key_issues);
  }

  if (campaign_promises) {
    updates.push(`campaign_promises = $${paramCount++}`);
    values.push(campaign_promises);
  }

  if (target_audience) {
    updates.push(`target_audience = $${paramCount++}`);
    values.push(JSON.stringify(target_audience));
  }

  if (content_preferences) {
    updates.push(`content_preferences = $${paramCount++}`);
    values.push(JSON.stringify(content_preferences));
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update',
    });
  }

  values.push(userId);

  const result = await query(
    `UPDATE campaigns
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $${paramCount}
    RETURNING *`,
    values
  );

  res.json({
    success: true,
    message: 'Campaign updated successfully',
    data: result.rows[0],
  });
}));

/**
 * Update profile
 */
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    phone,
    whatsapp,
    profile_image_url,
    voice_sample_url,
    language,
    dialect,
    settings,
  } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }

  if (phone) {
    updates.push(`phone = $${paramCount++}`);
    values.push(phone);
  }

  if (whatsapp) {
    updates.push(`whatsapp = $${paramCount++}`);
    values.push(whatsapp);
  }

  if (profile_image_url) {
    updates.push(`profile_image_url = $${paramCount++}`);
    values.push(profile_image_url);
  }

  if (voice_sample_url) {
    updates.push(`voice_sample_url = $${paramCount++}`);
    values.push(voice_sample_url);
  }

  if (language) {
    updates.push(`language = $${paramCount++}`);
    values.push(language);
  }

  if (dialect) {
    updates.push(`dialect = $${paramCount++}`);
    values.push(dialect);
  }

  if (settings) {
    updates.push(`settings = $${paramCount++}`);
    values.push(JSON.stringify(settings));
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No fields to update',
    });
  }

  values.push(userId);

  const result = await query(
    `UPDATE users
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount}
    RETURNING id, name, email, phone, whatsapp, governorate, language, dialect, profile_image_url`,
    values
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: result.rows[0],
  });
}));

/**
 * Get social media accounts
 */
router.get('/social-accounts', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT id, platform, account_name, account_url, status, followers_count, last_synced_at
    FROM social_accounts
    WHERE user_id = $1`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * Connect social media account
 */
router.post('/social-accounts', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { platform, account_id, account_name, account_url, access_token } = req.body;

  if (!platform || !account_name) {
    return res.status(400).json({
      success: false,
      message: 'Platform and account name are required',
    });
  }

  const result = await query(
    `INSERT INTO social_accounts (
      user_id, platform, account_id, account_name, account_url, access_token, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, platform, account_id)
    DO UPDATE SET
      account_name = EXCLUDED.account_name,
      account_url = EXCLUDED.account_url,
      access_token = EXCLUDED.access_token,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [userId, platform, account_id, account_name, account_url, access_token, 'connected']
  );

  res.json({
    success: true,
    message: 'Social account connected successfully',
    data: result.rows[0],
  });
}));

/**
 * Get notifications
 */
router.get('/notifications', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { unread_only } = req.query;

  let queryText = `
    SELECT * FROM notifications
    WHERE user_id = $1
  `;

  if (unread_only === 'true') {
    queryText += ` AND read = false`;
  }

  queryText += ` ORDER BY created_at DESC LIMIT 50`;

  const result = await query(queryText, [userId]);

  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * Mark notification as read
 */
router.put('/notifications/:id/read', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await query(
    `UPDATE notifications
    SET read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

export default router;
