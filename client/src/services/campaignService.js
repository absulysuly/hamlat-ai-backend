// Campaign-specific service layer
import { contentAPI, analyticsAPI, socialAPI } from './apiService';
import { loggingService } from './loggingService';
import { notificationService } from './notificationService';

class CampaignService {
  // AI Content Generation
  async generateContent(params) {
    try {
      loggingService.trackEvent('content_generation_started', params);
      
      const response = await contentAPI.generate({
        topic: params.topic,
        tone: params.tone || 'professional',
        language: params.language || 'ar',
        type: params.type || 'post',
        platform: params.platform || 'facebook',
        keywords: params.keywords || [],
        length: params.length || 'medium'
      });
      
      loggingService.trackEvent('content_generation_success', {
        contentId: response.data.id,
        type: params.type
      });
      
      // Notify user
      await notificationService.notifyContentReady(
        response.data.id,
        params.type
      );
      
      return response.data;
    } catch (error) {
      loggingService.logError(error, {
        context: 'generateContent',
        params
      });
      throw error;
    }
  }

  // Batch content generation for 30-day calendar
  async generateContentCalendar(candidateId, days = 30) {
    try {
      const topics = this.getDefaultCampaignTopics();
      const calendar = [];
      
      for (let i = 0; i < days; i++) {
        const topic = topics[i % topics.length];
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + i);
        
        calendar.push({
          topic,
          scheduledDate: scheduledDate.toISOString(),
          day: i + 1
        });
      }
      
      loggingService.trackEvent('content_calendar_generated', {
        candidateId,
        days
      });
      
      return calendar;
    } catch (error) {
      loggingService.logError(error, { context: 'generateContentCalendar' });
      throw error;
    }
  }

  getDefaultCampaignTopics() {
    return [
      'Education Reform',
      'Healthcare Access',
      'Economic Development',
      'Infrastructure Improvement',
      'Youth Employment',
      'Women Empowerment',
      'Environmental Protection',
      'Public Safety',
      'Corruption Fighting',
      'Technology Innovation',
      'Agriculture Support',
      'Small Business Growth',
      'Veterans Support',
      'Disability Rights',
      'Housing Affordability'
    ];
  }

  // Sentiment Analysis
  async analyzeSentiment(candidateId, dateRange) {
    try {
      const response = await analyticsAPI.getSentiment(candidateId, dateRange);
      
      const sentimentData = response.data;
      
      // Check for alerts
      if (sentimentData.current < -0.3) {
        await notificationService.notifySentimentAlert('negative', 'declining');
      } else if (sentimentData.trend === 'improving' && sentimentData.current > 0.5) {
        await notificationService.notifySentimentAlert('positive', 'improving');
      }
      
      return sentimentData;
    } catch (error) {
      loggingService.logError(error, { context: 'analyzeSentiment' });
      throw error;
    }
  }

  // Competitor Analysis
  async analyzeCompetitors(candidateId) {
    try {
      const response = await analyticsAPI.getCompetitor(candidateId);
      const competitors = response.data;
      
      // Check for significant competitor activity
      competitors.forEach(competitor => {
        if (competitor.viralContent) {
          notificationService.notifyCompetitorActivity(
            competitor.name,
            'has viral content'
          );
        }
      });
      
      return competitors;
    } catch (error) {
      loggingService.logError(error, { context: 'analyzeCompetitors' });
      throw error;
    }
  }

  // Multi-platform Publishing
  async publishToMultiplePlatforms(contentId, platforms) {
    try {
      loggingService.trackEvent('multi_platform_publish_started', {
        contentId,
        platforms
      });
      
      const response = await socialAPI.publishNow(contentId, platforms);
      
      loggingService.trackEvent('multi_platform_publish_success', {
        contentId,
        platforms
      });
      
      return response.data;
    } catch (error) {
      loggingService.logError(error, {
        context: 'publishToMultiplePlatforms',
        contentId,
        platforms
      });
      throw error;
    }
  }

  // Budget Monitoring
  async checkBudget(candidateId, spent, budget) {
    const percentage = (spent / budget) * 100;
    
    // Alert at 75%, 90%, and 100%
    if (percentage >= 75 && percentage < 90) {
      await notificationService.notifyBudgetAlert(spent, budget);
    } else if (percentage >= 90 && percentage < 100) {
      await notificationService.notifyBudgetAlert(spent, budget);
    } else if (percentage >= 100) {
      await notificationService.notifyBudgetAlert(spent, budget);
    }
    
    return {
      spent,
      budget,
      remaining: budget - spent,
      percentage
    };
  }

  // Campaign Milestones
  async checkMilestones(candidateId, metrics) {
    const milestones = [];
    
    // Check various milestone thresholds
    if (metrics.followers >= 1000 && !this.hasMilestone('1k_followers')) {
      milestones.push('Reached 1,000 followers!');
      this.setMilestone('1k_followers');
    }
    
    if (metrics.followers >= 10000 && !this.hasMilestone('10k_followers')) {
      milestones.push('Reached 10,000 followers!');
      this.setMilestone('10k_followers');
    }
    
    if (metrics.totalPosts >= 100 && !this.hasMilestone('100_posts')) {
      milestones.push('Published 100 posts!');
      this.setMilestone('100_posts');
    }
    
    if (metrics.totalEngagement >= 10000 && !this.hasMilestone('10k_engagement')) {
      milestones.push('Reached 10,000 total engagements!');
      this.setMilestone('10k_engagement');
    }
    
    // Notify for each milestone
    for (const milestone of milestones) {
      await notificationService.notifyCampaignMilestone(milestone);
    }
    
    return milestones;
  }

  hasMilestone(key) {
    const milestones = JSON.parse(localStorage.getItem('campaign_milestones') || '[]');
    return milestones.includes(key);
  }

  setMilestone(key) {
    const milestones = JSON.parse(localStorage.getItem('campaign_milestones') || '[]');
    if (!milestones.includes(key)) {
      milestones.push(key);
      localStorage.setItem('campaign_milestones', JSON.stringify(milestones));
    }
  }

  // Voice Command Processing (for future integration)
  async processVoiceCommand(command, language = 'ar') {
    try {
      loggingService.trackEvent('voice_command', { command, language });
      
      // Parse command intent
      const intent = this.parseCommandIntent(command, language);
      
      switch (intent.action) {
        case 'generate_post':
          return await this.generateContent({
            topic: intent.topic,
            language,
            type: 'post'
          });
          
        case 'show_analytics':
          return { action: 'navigate', path: '/analytics' };
          
        case 'check_sentiment':
          return { action: 'navigate', path: '/analytics', tab: 'sentiment' };
          
        default:
          return { action: 'unknown', command };
      }
    } catch (error) {
      loggingService.logError(error, { context: 'processVoiceCommand' });
      throw error;
    }
  }

  parseCommandIntent(command, language) {
    // Simple intent parsing (in production, use NLP service)
    const lowerCommand = command.toLowerCase();
    
    const patterns = {
      ar: {
        generate_post: ['اكتب', 'انشئ', 'اصنع'],
        show_analytics: ['أرني', 'اعرض', 'احصائيات'],
        check_sentiment: ['معنويات', 'شعور', 'رأي']
      },
      en: {
        generate_post: ['write', 'create', 'generate'],
        show_analytics: ['show', 'display', 'analytics'],
        check_sentiment: ['sentiment', 'opinion', 'feeling']
      }
    };
    
    const langPatterns = patterns[language] || patterns.en;
    
    for (const [action, keywords] of Object.entries(langPatterns)) {
      if (keywords.some(keyword => lowerCommand.includes(keyword))) {
        return {
          action,
          topic: command,
          language
        };
      }
    }
    
    return { action: 'unknown', topic: command };
  }

  // Governorate-specific campaign data
  getGovernorateList() {
    return [
      { id: 'baghdad', name: { en: 'Baghdad', ar: 'بغداد', ku: 'بەغدا' } },
      { id: 'basra', name: { en: 'Basra', ar: 'البصرة', ku: 'بەسرە' } },
      { id: 'mosul', name: { en: 'Mosul', ar: 'الموصل', ku: 'موسڵ' } },
      { id: 'erbil', name: { en: 'Erbil', ar: 'أربيل', ku: 'هەولێر' } },
      { id: 'sulaymaniyah', name: { en: 'Sulaymaniyah', ar: 'السليمانية', ku: 'سلێمانی' } },
      { id: 'najaf', name: { en: 'Najaf', ar: 'النجف', ku: 'نەجەف' } },
      { id: 'karbala', name: { en: 'Karbala', ar: 'كربلاء', ku: 'کەربەلا' } },
      { id: 'kirkuk', name: { en: 'Kirkuk', ar: 'كركوك', ku: 'کەرکووک' } },
      { id: 'anbar', name: { en: 'Anbar', ar: 'الأنبار', ku: 'ئەنبار' } },
      { id: 'diyala', name: { en: 'Diyala', ar: 'ديالى', ku: 'دیالە' } },
      { id: 'babylon', name: { en: 'Babylon', ar: 'بابل', ku: 'بابل' } },
      { id: 'wasit', name: { en: 'Wasit', ar: 'واسط', ku: 'واسط' } },
      { id: 'saladin', name: { en: 'Saladin', ar: 'صلاح الدين', ku: 'سەلاحەددین' } },
      { id: 'dohuk', name: { en: 'Dohuk', ar: 'دهوك', ku: 'دهۆک' } },
      { id: 'maysan', name: { en: 'Maysan', ar: 'ميسان', ku: 'مەیسان' } },
      { id: 'dhi_qar', name: { en: 'Dhi Qar', ar: 'ذي قار', ku: 'زیقار' } },
      { id: 'muthanna', name: { en: 'Al-Muthanna', ar: 'المثنى', ku: 'موسەننا' } },
      { id: 'qadisiyyah', name: { en: 'Al-Qadisiyyah', ar: 'القادسية', ku: 'قادسیە' } }
    ];
  }
}

export const campaignService = new CampaignService();
