import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { VoiceCommandProcessor, TextToSpeechService } from '../services/voice/voiceCommandProcessor.js';
import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Process voice command
 */
router.post('/command', asyncHandler(async (req, res) => {
  const { spoken_text, language, audio_url } = req.body;
  const userId = req.user.id;

  if (!spoken_text) {
    return res.status(400).json({
      success: false,
      message: 'Spoken text is required',
    });
  }

  // Initialize voice processor
  const processor = new VoiceCommandProcessor(
    language || req.user.language,
    req.user.dialect
  );

  // Process command
  const intent = await processor.processCommand(spoken_text, userId);

  // Execute action
  const result = await processor.executeAction(intent, userId);

  // Log to database
  await query(
    `INSERT INTO voice_commands (
      user_id, spoken_text, language, audio_url,
      detected_intent, intent_confidence, extracted_parameters,
      action_executed, execution_result, success
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      userId,
      spoken_text,
      language || req.user.language,
      audio_url,
      intent.intent,
      intent.confidence,
      JSON.stringify(intent.parameters),
      intent.action,
      JSON.stringify(result),
      result.success,
    ]
  );

  res.json({
    success: true,
    data: {
      intent,
      result,
      natural_response: intent.natural_response,
    },
  });
}));

/**
 * Get TTS configuration for text
 */
router.post('/tts', asyncHandler(async (req, res) => {
  const { text, language } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text is required',
    });
  }

  const ttsService = new TextToSpeechService(language || req.user.language);
  const config = ttsService.getSpeechConfig(text);

  res.json({
    success: true,
    data: config,
  });
}));

/**
 * Get recent comments formatted for TTS
 */
router.get('/read-comments', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 5;

  // Get recent comments
  const result = await query(
    `SELECT author_name as author, content as text
    FROM social_mentions
    WHERE user_id = $1 AND is_read = false
    ORDER BY detected_at DESC
    LIMIT $2`,
    [userId, limit]
  );

  const ttsService = new TextToSpeechService(req.user.language);
  const formattedComments = ttsService.formatCommentsForSpeech(
    result.rows,
    req.user.language
  );

  res.json({
    success: true,
    data: formattedComments,
  });
}));

/**
 * Get voice command history
 */
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 20;

  const result = await query(
    `SELECT spoken_text, detected_intent, intent_confidence, success, created_at
    FROM voice_commands
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2`,
    [userId, limit]
  );

  res.json({
    success: true,
    data: result.rows,
  });
}));

/**
 * Get available voice commands for user's language
 */
router.get('/commands', asyncHandler(async (req, res) => {
  const language = req.user.language;

  const commands = {
    ar: [
      { command: 'افتح التحليلات', description: 'فتح صفحة التحليلات', action: 'navigate_analytics' },
      { command: 'انشئ منشور', description: 'إنشاء محتوى جديد', action: 'create_post' },
      { command: 'وريني المتابعين', description: 'عرض عدد المتابعين', action: 'show_followers' },
      { command: 'اقرأ التعليقات', description: 'قراءة آخر التعليقات', action: 'read_comments' },
      { command: 'شنو الجديد', description: 'عرض الإشعارات', action: 'show_notifications' },
      { command: 'جدول منشور', description: 'جدولة منشور', action: 'schedule_post' },
      { command: 'ساعدني', description: 'عرض المساعدة', action: 'show_help' },
    ],
    ku: [
      { command: 'شیکاری پیشان بدە', description: 'پیشاندانی شیکاری', action: 'navigate_analytics' },
      { command: 'پۆست نوێ', description: 'دروستکردنی ناوەڕۆکی نوێ', action: 'create_post' },
      { command: 'شوێنکەوتووان پیشان بدە', description: 'پیشاندانی ژمارەی شوێنکەوتووان', action: 'show_followers' },
      { command: 'کۆمێنتەکان بخوێنەوە', description: 'خوێندنەوەی کۆمێنتەکان', action: 'read_comments' },
      { command: 'یارمەتیم بدە', description: 'پیشاندانی یارمەتی', action: 'show_help' },
    ],
    en: [
      { command: 'open analytics', description: 'Open analytics page', action: 'navigate_analytics' },
      { command: 'create post', description: 'Create new content', action: 'create_post' },
      { command: 'show followers', description: 'Display follower count', action: 'show_followers' },
      { command: 'read comments', description: 'Read recent comments', action: 'read_comments' },
      { command: 'show notifications', description: 'Show notifications', action: 'show_notifications' },
      { command: 'help', description: 'Show help', action: 'show_help' },
    ],
  };

  res.json({
    success: true,
    data: commands[language] || commands.en,
  });
}));

export default router;
