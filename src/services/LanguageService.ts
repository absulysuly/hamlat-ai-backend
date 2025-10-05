import { prisma, logger } from '../server.js';

export enum KurdishDialect {
  SORANI = 'sorani',
  BADINI = 'badini',
  KURMANJI = 'kurmanji'
}

export class LanguageService {
  private kurdishPatterns = {
    sorani: /[ەەەە]/,  // Sorani uses ە (U+06D5)
    badini: /[هە]/,   // Badini uses هە
    kurmanji: /^[ئاێیۆوەهەئەبپتجچحخددرڕزژسشعغفڤقکگلڵمنوۆێھەئە]+$/  // Kurmanji pattern
  };

  private languageKeywords = {
    kurdish: {
      sorani: [
        'هەڵبژاردن', 'کاندید', 'کامپەین', 'سیاسەت', 'پەرلەمان',
        'حکومەت', 'وەزارەت', 'قەزایە', 'شارەوانی', 'دەنگدەر'
      ],
      badini: [
        'هه‌ڵبژاردن', 'کاندید', 'کامپه‌ین', 'سیاسه‌ت', 'په‌رله‌مان',
        'حکومه‌ت', 'وه‌زاره‌ت', 'قه‌زایه‌', 'شاره‌وانی', 'ده‌نگده‌ر'
      ],
      kurmanji: [
        'hilbijartin', 'kandid', 'kampanya', 'siyaset', 'parlement',
        'hikûmet', 'wezaret', 'qeza', 'şaredarî', 'dengder'
      ]
    },
    arabic: [
      'انتخابات', 'مرشح', 'حملة انتخابية', 'سياسة', 'برلمان',
      'حكومة', 'وزارة', 'قضاء', 'بلدية', 'ناخب'
    ],
    english: [
      'election', 'candidate', 'campaign', 'politics', 'parliament',
      'government', 'ministry', 'judiciary', 'municipality', 'voter'
    ]
  };

  detectKurdishDialect(text: string): KurdishDialect {
    // Check for Sorani characters
    if (this.kurdishPatterns.sorani.test(text)) {
      return KurdishDialect.SORANI;
    }

    // Check for Badini pattern
    if (this.kurdishPatterns.badini.test(text)) {
      return KurdishDialect.BADINI;
    }

    // Default to Kurmanji for Kurdish text
    if (this.kurdishPatterns.kurmanji.test(text)) {
      return KurdishDialect.KURMANJI;
    }

    return KurdishDialect.SORANI; // Default fallback
  }

  detectLanguage(text: string): string {
    // Check for Kurdish dialects first
    if (this.detectKurdishDialect(text) !== null) {
      return this.detectKurdishDialect(text);
    }

    // Check for Arabic
    if (/[\u0600-\u06FF]/.test(text) && !this.kurdishPatterns.sorani.test(text)) {
      return 'arabic';
    }

    // Default to English
    return 'english';
  }

  async translateText(
    text: string,
    fromLanguage: string,
    toLanguage: KurdishDialect
  ): Promise<string> {
    // For now, return original text
    // TODO: Integrate with AI translation service
    logger.info(`Translation requested: ${fromLanguage} → ${toLanguage}`);
    return text;
  }

  async analyzeSentiment(text: string, language: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: string[];
    topics: string[];
  }> {
    // Basic sentiment analysis
    // TODO: Integrate with AI service for better accuracy

    const positiveWords = ['مثبت', 'جيد', 'رائع', 'ناجح', 'قوي'];
    const negativeWords = ['سلبي', 'سيء', 'فشل', 'ضعيف', 'فساد'];

    let score = 0;
    const emotions: string[] = [];
    const topics: string[] = [];

    // Simple keyword-based analysis
    for (const word of positiveWords) {
      if (text.includes(word)) {
        score += 0.1;
        emotions.push('hopeful');
      }
    }

    for (const word of negativeWords) {
      if (text.includes(word)) {
        score -= 0.1;
        emotions.push('angry');
      }
    }

    // Normalize score
    score = Math.max(-1, Math.min(1, score));

    let sentiment: 'positive' | 'negative' | 'neutral';
    if (score > 0.1) sentiment = 'positive';
    else if (score < -0.1) sentiment = 'negative';
    else sentiment = 'neutral';

    return {
      sentiment,
      confidence: Math.abs(score),
      emotions,
      topics: this.extractTopics(text)
    };
  }

  private extractTopics(text: string): string[] {
    const topics: string[] = [];

    // Political topics
    if (text.includes('انتخابات') || text.includes('هەڵبژاردن')) topics.push('election');
    if (text.includes('حكومة') || text.includes('حکومەت')) topics.push('government');
    if (text.includes('اقتصاد') || text.includes('ئابوور')) topics.push('economy');
    if (text.includes('أمن') || text.includes('ئاسایش')) topics.push('security');
    if (text.includes('تعليم') || text.includes('پەروەردە')) topics.push('education');

    return topics;
  }

  async generateCampaignContent(
    candidateName: string,
    party: string,
    region: string,
    dialect: KurdishDialect,
    topic: string
  ): Promise<string> {
    // Generate culturally appropriate campaign message
    const templates = {
      sorani: `بەڕێز ${candidateName} لە پارتی ${party}، کاندیدی هەڵبژاردنەکانی ${region}.
      بۆ ${topic} باشتر، دەنگ بە من بدەن.
      #هەڵبژاردن #${region} #${party}`,

      badini: `به‌ڕێز ${candidateName} له‌ پارتی ${party}، کاندیدی هه‌ڵبژاردنه‌کانی ${region}.
      بۆ ${topic} باشتر، ده‌نگ به‌ من بده‌ن.
      #هه‌ڵبژاردن #${region} #${party}`,

      kurmanji: `Birêz ${candidateName} ji partiya ${party}, kandidê hilbijartina ${region}.
      Ji bo ${topic} çêtir, dengê xwe bidin min.
      #hilbijartin #${region} #${party}`
    };

    return templates[dialect] || templates.sorani;
  }
}
