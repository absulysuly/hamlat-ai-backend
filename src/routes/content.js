import express from 'express';
import { query } from '../../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireActiveSubscription, requireTier } from '../middleware/auth.js';
import { generateCampaignContent, generateDailyContent } from '../services/ai/contentGenerator.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Generate daily content for candidate
 */
router.post('/generate-daily', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get candidate data
  const userResult = await query(
    `SELECT u.*, c.key_issues, c.target_audience, c.content_preferences
    FROM users u
    LEFT JOIN campaigns c ON u.id = c.user_id
    WHERE u.id = $1`,
    [userId]
  );

  const candidateData = {
    id: userId,
    name: userResult.rows[0].name,
    governorate: userResult.rows[0].governorate,
    party: userResult.rows[0].political_party,
    language: userResult.rows[0].language,
    dialect: userResult.rows[0].dialect,
    tier: userResult.rows[0].tier,
    issues: userResult.rows[0].key_issues || [],
    audience: userResult.rows[0].target_audience || {},
  };

  // Generate content
  const generatedContent = await generateDailyContent(candidateData);

  // Save to database
  for (const content of generatedContent) {
    const status = candidateData.tier === 'free' ? 'locked' : 'draft';
    
    await query(
      `INSERT INTO generated_content (
        user_id, type, language, content, hashtags, status,
        predicted_reach, predicted_engagement, ai_model
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        'post',
        candidateData.language,
        content.content,
        content.hashtags,
        status,
        content.predicted_engagement.reach,
        content.predicted_engagement.likes,
        content.ai_model,
      ]
    );
  }

  logger.info('Daily content generated:', { userId, count: generatedContent.length });

  res.json({
    success: true,
    message: 'Daily content generated successfully',
    data: generatedContent,
  });
}));

/**
 * Generate custom content
 */
router.post('/generate', requireActiveSubscription, asyncHandler(async (req, res) => {
  const { topic, contentType, platform } = req.body;
  const userId = req.user.id;

  if (!topic) {
    return res.status(400).json({
      success: false,
      message: 'Topic is required',
    });
  }

  // Get candidate data
  const userResult = await query(
    `SELECT u.*, c.key_issues, c.target_audience
    FROM users u
    LEFT JOIN campaigns c ON u.id = c.user_id
    WHERE u.id = $1`,
    [userId]
  );

  const candidateData = {
    id: userId,
    name: userResult.rows[0].name,
    governorate: userResult.rows[0].governorate,
    party: userResult.rows[0].political_party,
    language: userResult.rows[0].language,
    dialect: userResult.rows[0].dialect,
    issues: userResult.rows[0].key_issues || [],
    audience: userResult.rows[0].target_audience || {},
    platform: platform || 'facebook',
  };

  // Generate content
  const content = await generateCampaignContent(candidateData, topic, {
    contentType: contentType || 'post',
    platform: platform || 'facebook',
  });

  // Save to database
  const result = await query(
    `INSERT INTO generated_content (
      user_id, type, platform, language, content, hashtags,
      predicted_reach, predicted_engagement, ai_model, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      userId,
      contentType || 'post',
      platform || 'facebook',
      candidateData.language,
      content.content,
      content.hashtags,
      content.predicted_engagement.reach,
      content.predicted_engagement.likes,
      content.ai_model,
      'draft',
    ]
  );

  res.json({
    success: true,
    message: 'Content generated successfully',
    data: result.rows[0],
  });
}));

/**
 * Get all content for user
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, type, limit = 50 } = req.query;

  let queryText = `
    SELECT * FROM generated_content
    WHERE user_id = $1
  `;
  const params = [userId];

  if (status) {
    params.push(status);
    queryText += ` AND status = $${params.length}`;
  }

  if (type) {
    params.push(type);
    queryText += ` AND type = $${params.length}`;
  }

  queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * Schedule content
 */
router.post('/:id/schedule', requireActiveSubscription, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduled_time } = req.body;
  const userId = req.user.id;

  if (!scheduled_time) {
    return res.status(400).json({
      success: false,
      message: 'Scheduled time is required',
    });
  }

  const result = await query(
    `UPDATE generated_content
    SET status = 'scheduled', scheduled_time = $1
    WHERE id = $2 AND user_id = $3
    RETURNING *`,
    [scheduled_time, id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
    });
  }

  res.json({
    success: true,
    message: 'Content scheduled successfully',
    data: result.rows[0],
  });
}));

/**
 * Publish content immediately
 */
router.post('/:id/publish', requireActiveSubscription, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get content
  const contentResult = await query(
    `SELECT * FROM generated_content WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (contentResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
    });
  }

  // TODO: Implement actual publishing to social media platforms
  // For now, just mark as published

  const result = await query(
    `UPDATE generated_content
    SET status = 'published', published_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *`,
    [id, userId]
  );

  res.json({
    success: true,
    message: 'Content published successfully',
    data: result.rows[0],
  });
}));

/**
 * Delete content
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await query(
    `DELETE FROM generated_content WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
    });
  }

  res.json({
    success: true,
    message: 'Content deleted successfully',
  });
}));

export default router;
