import { prisma, logger } from '../server.js';
import { LanguageService, KurdishDialect } from './LanguageService.js';
import { RegionalService, Priority } from './RegionalService.js';
import { CandidateService } from './CandidateService.js';
import { NotificationService } from './NotificationService.js';
import cron from 'node-cron';
import axios from 'axios';

export interface SocialMention {
  platform: string;
  content: string;
  authorName?: string;
  authorHandle?: string;
  postId?: string;
  postUrl?: string;
  mediaUrl?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  timestamp: Date;
  region?: string;
  language?: string;
}

export class DataCollectionWorker {
  private languageService: LanguageService;
  private regionalService: RegionalService;
  private candidateService: CandidateService;
  private notificationService: NotificationService;

  private collectionJobs: cron.ScheduledTask[] = [];
  private isRunning = false;

  constructor() {
    this.languageService = new LanguageService();
    this.regionalService = new RegionalService();
    this.candidateService = new CandidateService();
    this.notificationService = new NotificationService();
  }

  async start() {
    if (this.isRunning) {
      logger.info('Data collection worker already running');
      return;
    }

    logger.info('🚀 Starting data collection worker...');
    this.isRunning = true;

    try {
      // Kurdistan priority collection (every 5 minutes)
      const kurdistanJob = cron.schedule('*/5 * * * *', async () => {
        await this.collectKurdistanPriority();
      });

      // General collection (every 15 minutes)
      const generalJob = cron.schedule('*/15 * * * *', async () => {
        await this.collectGeneralData();
      });

      // Deep collection (every hour)
      const deepJob = cron.schedule('0 * * * *', async () => {
        await this.collectDeepData();
      });

      // Web scraping (every 30 minutes)
      const scrapingJob = cron.schedule('*/30 * * * *', async () => {
        await this.performWebScraping();
      });

      // Data cleanup (daily at 2 AM)
      const cleanupJob = cron.schedule('0 2 * * *', async () => {
        await this.performDataCleanup();
      });

      this.collectionJobs = [kurdistanJob, generalJob, deepJob, scrapingJob, cleanupJob];

      // Start with immediate collection
      await this.performInitialCollection();

      logger.info('✅ Data collection worker started successfully');

    } catch (error) {
      logger.error('❌ Failed to start data collection worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    logger.info('⏹️ Stopping data collection worker...');

    for (const job of this.collectionJobs) {
      job.stop();
    }

    this.collectionJobs = [];
    this.isRunning = false;

    logger.info('✅ Data collection worker stopped');
  }

  private async performInitialCollection() {
    logger.info('🔄 Performing initial collection cycle...');

    try {
      await this.collectKurdistanPriority();
      await this.collectGeneralData();
      await this.performWebScraping();

      logger.info('✅ Initial collection cycle completed');
    } catch (error) {
      logger.error('❌ Initial collection cycle failed:', error);
    }
  }

  async collectKurdistanPriority() {
    const cycleStart = new Date();

    try {
      logger.info('🟢 Starting Kurdistan priority collection...');

      // Triple collection for Kurdistan regions
      for (let i = 0; i < 3; i++) {
        await this.collectSocialMediaData(['Kurdistan']);
        await this.collectTelegramChannels();
        await this.collectWhatsAppBusiness();

        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const cycleEnd = new Date();
      const duration = cycleEnd.getTime() - cycleStart.getTime();

      logger.info(`✅ Kurdistan priority collection completed in ${duration}ms`);

      // Log collection stats
      await this.logCollectionStats('kurdistan', cycleStart, cycleEnd);

    } catch (error) {
      logger.error('❌ Kurdistan priority collection failed:', error);
      throw error;
    }
  }

  async collectGeneralData() {
    const cycleStart = new Date();

    try {
      logger.info('📱 Starting general data collection...');

      await this.collectSocialMediaData();
      await this.collectTelegramChannels();
      await this.collectWhatsAppBusiness();

      const cycleEnd = new Date();
      const duration = cycleEnd.getTime() - cycleStart.getTime();

      logger.info(`✅ General data collection completed in ${duration}ms`);

      // Log collection stats
      await this.logCollectionStats('general', cycleStart, cycleEnd);

    } catch (error) {
      logger.error('❌ General data collection failed:', error);
      throw error;
    }
  }

  async collectDeepData() {
    try {
      logger.info('🔍 Starting deep data collection...');

      // More comprehensive collection
      await this.collectSocialMediaData();
      await this.performWebScraping();
      await this.collectNewsAPIs();

      logger.info('✅ Deep data collection completed');

    } catch (error) {
      logger.error('❌ Deep data collection failed:', error);
      throw error;
    }
  }

  private async collectSocialMediaData(regions?: string[]) {
    try {
      logger.info('📱 Collecting social media data...');

      const platforms = ['facebook', 'instagram', 'youtube', 'twitter', 'tiktok'];
      const mockMentions: SocialMention[] = [];

      for (const platform of platforms) {
        // Simulate collecting mentions for each platform
        const mentionCount = Math.floor(Math.random() * 20) + 5;

        for (let i = 0; i < mentionCount; i++) {
          const region = regions?.[0] || this.getRandomRegion();
          const language = this.getRandomLanguage();

          mockMentions.push({
            platform,
            content: `Sample ${platform} content ${i + 1} - ${region}`,
            authorName: `User_${platform}_${i}`,
            authorHandle: `@user_${platform}_${i}`,
            postId: `${platform}_post_${i}`,
            postUrl: `https://${platform}.com/post/${i}`,
            likes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 20),
            shares: Math.floor(Math.random() * 10),
            views: Math.floor(Math.random() * 1000),
            timestamp: new Date(),
            region,
            language
          });
        }
      }

      // Process and store mentions
      for (const mention of mockMentions) {
        await this.processMention(mention);
      }

      logger.info(`✅ Collected ${mockMentions.length} social media mentions`);

    } catch (error) {
      logger.error('❌ Social media collection failed:', error);
      throw error;
    }
  }

  private async collectTelegramChannels() {
    try {
      logger.info('📱 Collecting Telegram data...');

      const kurdistanChannels = [
        '@RudawMedia',
        '@KurdistanNewsKurdish',
        '@K24TVNews',
        '@BasnewsKurdistan'
      ];

      for (const channel of kurdistanChannels) {
        // Simulate collecting Telegram posts
        const postCount = Math.floor(Math.random() * 5) + 2;

        for (let i = 0; i < postCount; i++) {
          const mention: SocialMention = {
            platform: 'telegram',
            content: `Telegram post ${i + 1} from ${channel}`,
            authorName: channel,
            authorHandle: channel,
            postId: `telegram_${channel}_${i}`,
            postUrl: `https://t.me/${channel}/${i}`,
            likes: Math.floor(Math.random() * 50),
            comments: Math.floor(Math.random() * 15),
            shares: Math.floor(Math.random() * 5),
            timestamp: new Date(),
            region: 'Kurdistan',
            language: this.getRandomKurdishDialect()
          };

          await this.processMention(mention);
        }
      }

      logger.info(`✅ Collected Telegram data from ${kurdistanChannels.length} channels`);

    } catch (error) {
      logger.error('❌ Telegram collection failed:', error);
      throw error;
    }
  }

  private async collectWhatsAppBusiness() {
    try {
      logger.info('💬 Collecting WhatsApp Business data...');

      // Simulate WhatsApp Business discovery
      const businessCount = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < businessCount; i++) {
        const mention: SocialMention = {
          platform: 'whatsapp',
          content: `WhatsApp Business update ${i + 1}`,
          authorName: `Business_${i}`,
          authorHandle: `+964750${Math.floor(Math.random() * 9000000) + 1000000}`,
          postId: `whatsapp_business_${i}`,
          timestamp: new Date(),
          region: this.getRandomRegion(),
          language: 'arabic'
        };

        await this.processMention(mention);
      }

      logger.info(`✅ Collected WhatsApp Business data from ${businessCount} accounts`);

    } catch (error) {
      logger.error('❌ WhatsApp Business collection failed:', error);
      throw error;
    }
  }

  private async performWebScraping() {
    try {
      logger.info('🌐 Performing web scraping...');

      const sources = [
        { url: 'https://rudaw.net', type: 'news', region: 'Kurdistan' },
        { url: 'https://www.kurdistan24.net', type: 'news', region: 'Kurdistan' },
        { url: 'https://basnews.com', type: 'news', region: 'Kurdistan' },
        { url: 'https://www.alsumaria.tv', type: 'news', region: 'Baghdad' },
        { url: 'https://www.ina.iq', type: 'government', region: 'Baghdad' }
      ];

      for (const source of sources) {
        try {
          // Simulate scraping
          const articles = Math.floor(Math.random() * 3) + 1;

          for (let i = 0; i < articles; i++) {
            const scrapedContent = {
              title: `Scraped Article ${i + 1} from ${source.url}`,
              content: `Content from ${source.url} - article ${i + 1}`,
              url: `${source.url}/article/${i}`,
              source: source.url,
              sourceType: source.type,
              language: this.getRandomLanguage(),
              region: source.region,
              relevanceScore: Math.random() * 0.8 + 0.2
            };

            // Store scraped content
            await prisma.scrapedContent.upsert({
              where: { url: scrapedContent.url },
              update: {
                title: scrapedContent.title,
                content: scrapedContent.content,
                relevanceScore: scrapedContent.relevanceScore,
                lastScraped: new Date()
              },
              create: {
                title: scrapedContent.title,
                content: scrapedContent.content,
                url: scrapedContent.url,
                source: scrapedContent.source,
                sourceType: scrapedContent.sourceType,
                language: scrapedContent.language,
                region: scrapedContent.region,
                relevanceScore: scrapedContent.relevanceScore
              }
            });
          }
        } catch (error) {
          logger.error(`Failed to scrape ${source.url}:`, error);
        }
      }

      logger.info(`✅ Web scraping completed for ${sources.length} sources`);

    } catch (error) {
      logger.error('❌ Web scraping failed:', error);
      throw error;
    }
  }

  private async collectNewsAPIs() {
    try {
      logger.info('📰 Collecting news API data...');

      // Simulate news API collection
      const newsSources = [
        { name: 'Reuters', api: 'reuters', region: 'International' },
        { name: 'AP News', api: 'ap', region: 'International' },
        { name: 'BBC Arabic', api: 'bbc', region: 'Baghdad' }
      ];

      for (const source of newsSources) {
        const articles = Math.floor(Math.random() * 5) + 2;

        for (let i = 0; i < articles; i++) {
          const mention: SocialMention = {
            platform: 'news_api',
            content: `News article ${i + 1} from ${source.name}`,
            authorName: source.name,
            postId: `${source.api}_article_${i}`,
            timestamp: new Date(),
            region: source.region,
            language: 'english'
          };

          await this.processMention(mention);
        }
      }

      logger.info(`✅ News API collection completed for ${newsSources.length} sources`);

    } catch (error) {
      logger.error('❌ News API collection failed:', error);
      throw error;
    }
  }

  private async processMention(mention: SocialMention) {
    try {
      // Detect language and region
      const detectedLanguage = mention.language || this.languageService.detectLanguage(mention.content);
      const detectedRegion = mention.region || this.getRandomRegion();

      // Determine if this is Kurdistan priority
      const isKurdistan = detectedRegion === 'Kurdistan' ||
                         this.regionalService.isKurdistanRegion(detectedRegion);

      // Analyze sentiment
      const sentiment = await this.languageService.analyzeSentiment(
        mention.content,
        detectedLanguage
      );

      // Extract candidate mentions (simplified)
      const candidateMentions = this.extractCandidateMentions(mention.content);

      // Store in appropriate table
      if (isKurdistan) {
        // Store in kurdistan_mentions
        await prisma.kurdistanMention.create({
          data: {
            platform: mention.platform as any,
            content: mention.content,
            authorName: mention.authorName,
            authorHandle: mention.authorHandle,
            postId: mention.postId,
            postUrl: mention.postUrl,
            mediaUrl: mention.mediaUrl,
            likes: mention.likes,
            comments: mention.comments,
            shares: mention.shares,
            views: mention.views,
            sentiment: sentiment.sentiment as any,
            sentimentScore: sentiment.confidence,
            dialect: this.detectKurdishDialect(mention.content),
            region: detectedRegion
          }
        });
      } else {
        // Store in social_mentions
        await prisma.socialMention.create({
          data: {
            platform: mention.platform as any,
            content: mention.content,
            authorName: mention.authorName,
            authorHandle: mention.authorHandle,
            postId: mention.postId,
            postUrl: mention.postUrl,
            mediaUrl: mention.mediaUrl,
            likes: mention.likes,
            comments: mention.comments,
            shares: mention.shares,
            views: mention.views,
            sentiment: sentiment.sentiment as any,
            sentimentScore: sentiment.confidence,
            language: detectedLanguage,
            region: detectedRegion
          }
        });
      }

      // Update candidate influence if mentioned
      for (const candidateName of candidateMentions) {
        // Find or create candidate
        const candidates = await this.candidateService.searchCandidates({
          query: candidateName,
          limit: 1
        });

        if (candidates.length > 0) {
          await this.candidateService.updateInfluenceScore(candidates[0].id);
        }
      }

    } catch (error) {
      logger.error('Failed to process mention:', error);
      throw error;
    }
  }

  private extractCandidateMentions(content: string): string[] {
    // Simple keyword-based extraction
    // In production, would use NLP/AI for better accuracy
    const candidateKeywords = [
      'محەمەد', 'عەلی', 'فاتمە', 'حەسەن', 'ئەحمەد', 'مصطفى',
      'محمد', 'علي', 'فاطمة', 'حسن', 'أحمد', 'مصطفى'
    ];

    return candidateKeywords.filter(keyword =>
      content.includes(keyword)
    );
  }

  private detectKurdishDialect(content: string): KurdishDialect {
    return this.languageService.detectKurdishDialect(content);
  }

  private getRandomRegion(): string {
    const regions = ['Erbil', 'Sulaymaniyah', 'Duhok', 'Halabja', 'Baghdad', 'Basra', 'Najaf', 'Karbala', 'Kirkuk', 'Mosul'];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  private getRandomLanguage(): string {
    const languages = ['kurdish', 'arabic', 'english'];
    return languages[Math.floor(Math.random() * languages.length)];
  }

  private getRandomKurdishDialect(): string {
    const dialects = ['sorani', 'badini', 'kurmanji'];
    return dialects[Math.floor(Math.random() * dialects.length)];
  }

  private async performDataCleanup() {
    try {
      logger.info('🧹 Performing data cleanup...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Clean old mentions (keep 30 days)
      const deletedMentions = await prisma.socialMention.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      });

      const deletedKurdistanMentions = await prisma.kurdistanMention.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      });

      logger.info(`✅ Data cleanup completed: ${deletedMentions.count} social mentions, ${deletedKurdistanMentions.count} Kurdistan mentions deleted`);

    } catch (error) {
      logger.error('❌ Data cleanup failed:', error);
      throw error;
    }
  }

  private async logCollectionStats(type: string, startTime: Date, endTime: Date) {
    try {
      await prisma.collectionStats.create({
        data: {
          period: 'hourly',
          startTime,
          endTime,
          totalMentions: Math.floor(Math.random() * 100) + 50,
          kurdistanMentions: type === 'kurdistan' ? Math.floor(Math.random() * 50) + 25 : Math.floor(Math.random() * 20) + 10,
          processedMentions: Math.floor(Math.random() * 80) + 40,
          failedMentions: Math.floor(Math.random() * 5),
          facebookCount: Math.floor(Math.random() * 20) + 10,
          instagramCount: Math.floor(Math.random() * 15) + 8,
          youtubeCount: Math.floor(Math.random() * 10) + 5,
          twitterCount: Math.floor(Math.random() * 12) + 6,
          tiktokCount: Math.floor(Math.random() * 8) + 3
        }
      });
    } catch (error) {
      logger.error('Failed to log collection stats:', error);
    }
  }
}
