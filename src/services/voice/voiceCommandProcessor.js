import Groq from 'groq-sdk';
import logger from '../../utils/logger.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================
// VOICE COMMAND MAPPINGS
// ============================================

const commandMappings = {
  arabic: {
    'افتح التحليلات': 'navigate_analytics',
    'عرض المتابعين': 'show_followers',
    'انشئ منشور': 'create_post',
    'اقرأ التعليقات': 'read_comments',
    'شنو آخر الأخبار': 'show_latest_mentions',
    'وريني الإحصائيات': 'show_stats',
    'جدول منشور': 'schedule_post',
    'ساعدني': 'show_help',
    'افتح الرسائل': 'navigate_messages',
    'شنو الجديد': 'show_notifications',
    'نشر المحتوى': 'publish_content',
    'عرض التقارير': 'show_reports',
  },
  kurdish: {
    'شیکاری پیشان بدە': 'navigate_analytics',
    'پۆست نوێ': 'create_post',
    'کۆمێنتەکان بخوێنەوە': 'read_comments',
    'ئاماری پیشان بدە': 'show_stats',
    'یارمەتیم بدە': 'show_help',
    'شوێنکەوتووان پیشان بدە': 'show_followers',
    'ناوەڕۆک بڵاوبکەوە': 'publish_content',
  },
  english: {
    'open analytics': 'navigate_analytics',
    'show followers': 'show_followers',
    'create post': 'create_post',
    'read comments': 'read_comments',
    'show stats': 'show_stats',
    'help': 'show_help',
    'show notifications': 'show_notifications',
    'publish content': 'publish_content',
    'schedule post': 'schedule_post',
  },
};

// ============================================
// VOICE COMMAND PROCESSOR CLASS
// ============================================

export class VoiceCommandProcessor {
  constructor(language = 'ar', dialect = 'iraqi_arabic') {
    this.language = language;
    this.dialect = dialect;
  }

  /**
   * Process spoken text and extract intent
   */
  async processCommand(spokenText, userId) {
    try {
      // First, try direct mapping
      const directCommand = this.getDirectMapping(spokenText);
      if (directCommand) {
        logger.info('Direct command match:', directCommand);
        return {
          intent: directCommand,
          confidence: 1.0,
          parameters: {},
          action: directCommand,
          method: 'direct_mapping',
        };
      }

      // If no direct match, use AI for intent detection
      const aiIntent = await this.detectIntentWithAI(spokenText);
      
      // Log the command
      await this.logVoiceCommand(userId, spokenText, aiIntent);
      
      return aiIntent;
    } catch (error) {
      logger.error('Voice command processing failed:', error);
      throw error;
    }
  }

  /**
   * Check for direct command mapping
   */
  getDirectMapping(spokenText) {
    const normalizedText = spokenText.toLowerCase().trim();
    const langMap = commandMappings[this.getLanguageKey()] || {};
    
    for (const [phrase, action] of Object.entries(langMap)) {
      if (normalizedText.includes(phrase.toLowerCase())) {
        return action;
      }
    }
    
    return null;
  }

  /**
   * Use AI to detect intent from natural language
   */
  async detectIntentWithAI(spokenText) {
    const intentPrompt = `
    User said (in ${this.language}): "${spokenText}"
    
    Detect the intent and extract parameters:
    
    Possible intents:
    - navigate: Go to a specific page (analytics, content, mentions, settings, dashboard)
    - create_post: Create new content
    - schedule: Schedule a post
    - show_stats: Display statistics (followers, engagement, reach, etc.)
    - read_comments: Read recent comments aloud
    - respond: Respond to a comment
    - search: Search for something
    - help: Show help
    - publish: Publish content
    - show_notifications: Show recent notifications
    
    Return JSON:
    {
      "intent": "intent_name",
      "confidence": 0.0-1.0,
      "parameters": {
        "page": "page_name (if navigate)",
        "metric": "metric_name (if show_stats)",
        "query": "search_query (if search)",
        "content_id": "id (if publish/schedule)"
      },
      "action": "specific_function_to_call",
      "natural_response": "Confirmation message in ${this.language}"
    }
    
    Examples:
    Arabic: "افتح التحليلات" → {"intent": "navigate", "parameters": {"page": "analytics"}}
    Kurdish: "پۆست نوێ دروست بکە" → {"intent": "create_post"}
    English: "Show me my followers" → {"intent": "show_stats", "parameters": {"metric": "followers"}}
    Arabic: "شنو عدد المتابعين" → {"intent": "show_stats", "parameters": {"metric": "followers"}}
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: intentPrompt }],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent intent detection
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    return {
      ...result,
      original_text: spokenText,
      language: this.language,
    };
  }

  /**
   * Execute the detected action
   */
  async executeAction(intent, userId) {
    const actions = {
      navigate_analytics: () => this.navigateToPage('analytics'),
      navigate_dashboard: () => this.navigateToPage('dashboard'),
      navigate_content: () => this.navigateToPage('content'),
      navigate_mentions: () => this.navigateToPage('mentions'),
      navigate_settings: () => this.navigateToPage('settings'),
      
      create_post: () => this.openContentCreator(),
      schedule_post: (params) => this.scheduleContent(params),
      publish_content: (params) => this.publishContent(params),
      
      show_stats: (params) => this.displayMetric(params.metric),
      show_followers: () => this.displayMetric('followers'),
      show_notifications: () => this.showNotifications(),
      
      read_comments: () => this.readCommentsAloud(userId),
      respond: (params) => this.initiateResponse(params),
      
      search: (params) => this.performSearch(params.query),
      show_help: () => this.showHelp(),
    };

    const actionFunc = actions[intent.action] || actions[intent.intent];
    
    if (actionFunc) {
      return await actionFunc(intent.parameters);
    } else {
      logger.warn('Unknown action:', intent.action);
      return {
        success: false,
        message: 'Command not recognized',
      };
    }
  }

  /**
   * Navigation actions
   */
  navigateToPage(page) {
    return {
      type: 'navigation',
      page,
      success: true,
    };
  }

  openContentCreator() {
    return {
      type: 'modal',
      modal: 'content_creator',
      success: true,
    };
  }

  /**
   * Display metrics
   */
  async displayMetric(metric) {
    return {
      type: 'display_metric',
      metric,
      success: true,
    };
  }

  showNotifications() {
    return {
      type: 'show_notifications',
      success: true,
    };
  }

  /**
   * Content actions
   */
  async scheduleContent(params) {
    return {
      type: 'schedule_content',
      content_id: params.content_id,
      success: true,
    };
  }

  async publishContent(params) {
    return {
      type: 'publish_content',
      content_id: params.content_id,
      success: true,
    };
  }

  /**
   * Read comments aloud (returns data for TTS)
   */
  async readCommentsAloud(userId) {
    // This will be handled by the frontend TTS
    return {
      type: 'read_aloud',
      data_type: 'comments',
      user_id: userId,
      success: true,
    };
  }

  /**
   * Search functionality
   */
  async performSearch(query) {
    return {
      type: 'search',
      query,
      success: true,
    };
  }

  /**
   * Help system
   */
  showHelp() {
    const helpCommands = {
      arabic: [
        'افتح التحليلات - لعرض التحليلات',
        'انشئ منشور - لإنشاء محتوى جديد',
        'وريني المتابعين - لعرض عدد المتابعين',
        'اقرأ التعليقات - لسماع آخر التعليقات',
        'شنو الجديد - لعرض الإشعارات',
      ],
      kurdish: [
        'شیکاری پیشان بدە - بۆ پیشاندانی شیکاری',
        'پۆست نوێ - بۆ دروستکردنی ناوەڕۆکی نوێ',
        'شوێنکەوتووان پیشان بدە - بۆ پیشاندانی ژمارەی شوێنکەوتووان',
      ],
      english: [
        'open analytics - to view analytics',
        'create post - to create new content',
        'show followers - to display follower count',
        'read comments - to hear recent comments',
        'show notifications - to view notifications',
      ],
    };

    return {
      type: 'help',
      commands: helpCommands[this.getLanguageKey()] || helpCommands.english,
      success: true,
    };
  }

  /**
   * Log voice command for analytics
   */
  async logVoiceCommand(userId, spokenText, intent) {
    // This would save to database
    logger.info('Voice command logged', {
      userId,
      spokenText,
      intent: intent.intent,
      confidence: intent.confidence,
    });
  }

  /**
   * Get language key for mappings
   */
  getLanguageKey() {
    const langMap = {
      ar: 'arabic',
      ku: 'kurdish',
      en: 'english',
    };
    return langMap[this.language] || 'english';
  }
}

// ============================================
// TEXT-TO-SPEECH HELPER
// ============================================

export class TextToSpeechService {
  constructor(language = 'ar') {
    this.language = language;
  }

  /**
   * Generate speech configuration for frontend
   */
  getSpeechConfig(text) {
    const voiceMap = {
      ar: {
        lang: 'ar-SA',
        voice: 'Microsoft Hamed - Arabic (Saudi Arabia)',
        rate: 0.9,
      },
      ku: {
        lang: 'ar-SA', // Kurdish uses Arabic TTS as fallback
        voice: 'Microsoft Hamed - Arabic (Saudi Arabia)',
        rate: 0.85,
      },
      en: {
        lang: 'en-US',
        voice: 'Microsoft David - English (United States)',
        rate: 1.0,
      },
    };

    return {
      text,
      ...voiceMap[this.language] || voiceMap.en,
    };
  }

  /**
   * Format comments for reading aloud
   */
  formatCommentsForSpeech(comments, language = 'ar') {
    const templates = {
      ar: (comment) => `تعليق من ${comment.author}: ${comment.text}`,
      ku: (comment) => `کۆمێنت لە ${comment.author}: ${comment.text}`,
      en: (comment) => `Comment from ${comment.author}: ${comment.text}`,
    };

    const template = templates[language] || templates.en;
    
    return comments.map(comment => ({
      text: template(comment),
      config: this.getSpeechConfig(template(comment)),
    }));
  }
}

export default VoiceCommandProcessor;
