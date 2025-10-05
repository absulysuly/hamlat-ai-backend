import { prisma, logger } from '../server.js';
import { RegionalService, Priority } from './RegionalService.js';
import { CandidateService } from './CandidateService.js';

export interface DashboardMetrics {
  // Real-time counters
  totalMentions: number;
  kurdistanMentions: number;
  recentMentions: number; // Last 5 minutes

  // Language breakdown
  languages: {
    sorani: number;
    badini: number;
    kurmanji: number;
    arabic: number;
    english: number;
  };

  // Regional distribution
  regions: Record<string, number>;

  // Candidate rankings
  topCandidates: Array<{
    id: string;
    name: string;
    region: string;
    influenceScore: number;
    trending: boolean;
  }>;

  risingCandidates: Array<{
    id: string;
    name: string;
    region: string;
    growth: number;
  }>;

  // Platform breakdown
  platforms: Record<string, number>;

  // Sentiment analysis
  overallSentiment: number;
  sentimentTrend: 'up' | 'down' | 'stable';

  // Collection health
  collectionStatus: {
    lastUpdate: Date;
    successRate: number;
    errorCount: number;
    queueSize: number;
  };

  // System health
  systemHealth: {
    database: 'healthy' | 'degraded' | 'down';
    redis: 'healthy' | 'degraded' | 'down';
    api: 'healthy' | 'degraded' | 'down';
  };
}

export interface KurdistanAnalytics {
  totalMentions: number;
  dialectBreakdown: Record<string, number>;
  regionBreakdown: Record<string, number>;
  topCandidates: Array<{
    name: string;
    region: string;
    influenceScore: number;
    dialect: string;
  }>;
  sentimentOverview: {
    positive: number;
    negative: number;
    neutral: number;
  };
  hourlyActivity: Array<{
    hour: number;
    mentions: number;
    sentiment: number;
  }>;
}

export class AnalyticsService {
  private regionalService: RegionalService;
  private candidateService: CandidateService;

  constructor() {
    this.regionalService = new RegionalService();
    this.candidateService = new CandidateService();
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get recent mentions
      const [recentMentions, totalMentions, kurdistanMentions] = await Promise.all([
        // Recent mentions (last 5 minutes)
        prisma.socialMention.count({
          where: { createdAt: { gte: fiveMinutesAgo } }
        }),

        // Total mentions (last 24 hours)
        prisma.socialMention.count({
          where: { createdAt: { gte: twentyFourHoursAgo } }
        }),

        // Kurdistan mentions (last 24 hours)
        prisma.kurdistanMention.count({
          where: { createdAt: { gte: twentyFourHoursAgo } }
        })
      ]);

      // Language breakdown
      const languageStats = await this.getLanguageBreakdown(twentyFourHoursAgo);

      // Regional distribution
      const regionStats = await this.getRegionBreakdown(twentyFourHoursAgo);

      // Top candidates
      const topCandidates = await this.getTopCandidates(10);

      // Rising candidates (based on recent growth)
      const risingCandidates = await this.getRisingCandidates(5);

      // Platform breakdown
      const platformStats = await this.getPlatformBreakdown(twentyFourHoursAgo);

      // Sentiment analysis
      const sentimentData = await this.getSentimentAnalysis(twentyFourHoursAgo);

      // Collection health
      const collectionStatus = await this.getCollectionHealth();

      // System health
      const systemHealth = await this.getSystemHealth();

      return {
        totalMentions,
        kurdistanMentions,
        recentMentions,
        languages: languageStats,
        regions: regionStats,
        topCandidates,
        risingCandidates,
        platforms: platformStats,
        overallSentiment: sentimentData.average,
        sentimentTrend: sentimentData.trend,
        collectionStatus,
        systemHealth
      };

    } catch (error) {
      logger.error('Failed to get dashboard metrics:', error);
      throw error;
    }
  }

  async getKurdistanPriorityAnalytics(): Promise<KurdistanAnalytics> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get Kurdistan mentions
      const kurdistanMentions = await prisma.kurdistanMention.findMany({
        where: {
          createdAt: { gte: twentyFourHoursAgo }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Dialect breakdown
      const dialectBreakdown: Record<string, number> = {
        sorani: 0,
        badini: 0,
        kurmanji: 0
      };

      for (const mention of kurdistanMentions) {
        dialectBreakdown[mention.dialect]++;
      }

      // Region breakdown
      const regionBreakdown: Record<string, number> = {};
      for (const mention of kurdistanMentions) {
        const region = mention.region || 'Unknown';
        regionBreakdown[region] = (regionBreakdown[region] || 0) + 1;
      }

      // Top candidates in Kurdistan
      const topCandidates = await this.getTopKurdistanCandidates(5);

      // Sentiment overview
      const sentimentOverview = {
        positive: kurdistanMentions.filter(m => m.sentiment === 'POSITIVE').length,
        negative: kurdistanMentions.filter(m => m.sentiment === 'NEGATIVE').length,
        neutral: kurdistanMentions.filter(m => m.sentiment === 'NEUTRAL').length
      };

      // Hourly activity pattern
      const hourlyActivity = await this.getHourlyActivity(kurdistanMentions);

      return {
        totalMentions: kurdistanMentions.length,
        dialectBreakdown,
        regionBreakdown,
        topCandidates,
        sentimentOverview,
        hourlyActivity
      };

    } catch (error) {
      logger.error('Failed to get Kurdistan priority analytics:', error);
      throw error;
    }
  }

  private async getLanguageBreakdown(since: Date): Promise<DashboardMetrics['languages']> {
    const mentions = await prisma.socialMention.findMany({
      where: { createdAt: { gte: since } },
      select: { language: true }
    });

    const breakdown = {
      sorani: 0,
      badini: 0,
      kurmanji: 0,
      arabic: 0,
      english: 0
    };

    for (const mention of mentions) {
      const lang = mention.language?.toLowerCase();
      if (lang?.includes('sorani')) breakdown.sorani++;
      else if (lang?.includes('badini')) breakdown.badini++;
      else if (lang?.includes('kurmanji')) breakdown.kurmanji++;
      else if (lang === 'arabic') breakdown.arabic++;
      else if (lang === 'english') breakdown.english++;
    }

    return breakdown;
  }

  private async getRegionBreakdown(since: Date): Promise<Record<string, number>> {
    const mentions = await prisma.socialMention.findMany({
      where: { createdAt: { gte: since } },
      select: { region: true }
    });

    const breakdown: Record<string, number> = {};
    for (const mention of mentions) {
      const region = mention.region || 'Unknown';
      breakdown[region] = (breakdown[region] || 0) + 1;
    }

    return breakdown;
  }

  private async getTopCandidates(limit: number): Promise<DashboardMetrics['topCandidates']> {
    const candidates = await prisma.candidate.findMany({
      orderBy: { influenceScore: 'desc' },
      take: limit,
      select: {
        id: true,
        nameKuSorani: true,
        nameAr: true,
        region: true,
        influenceScore: true
      }
    });

    return candidates.map(c => ({
      id: c.id,
      name: c.nameKuSorani || c.nameAr,
      region: c.region,
      influenceScore: c.influenceScore,
      trending: c.influenceScore > 80
    }));
  }

  private async getRisingCandidates(limit: number): Promise<DashboardMetrics['risingCandidates']> {
    // Get candidates with recent activity increase
    // This is a simplified version - in reality would compare recent vs older periods
    const candidates = await prisma.candidate.findMany({
      orderBy: { lastUpdated: 'desc' },
      take: limit,
      select: {
        id: true,
        nameKuSorani: true,
        nameAr: true,
        region: true,
        influenceScore: true,
        lastUpdated: true
      }
    });

    return candidates.map(c => ({
      id: c.id,
      name: c.nameKuSorani || c.nameAr,
      region: c.region,
      growth: Math.floor(Math.random() * 50) + 10 // Mock growth percentage
    }));
  }

  private async getPlatformBreakdown(since: Date): Promise<Record<string, number>> {
    const mentions = await prisma.socialMention.findMany({
      where: { createdAt: { gte: since } },
      select: { platform: true }
    });

    const breakdown: Record<string, number> = {};
    for (const mention of mentions) {
      const platform = mention.platform.toLowerCase();
      breakdown[platform] = (breakdown[platform] || 0) + 1;
    }

    return breakdown;
  }

  private async getSentimentAnalysis(since: Date): Promise<{
    average: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const mentions = await prisma.socialMention.findMany({
      where: { createdAt: { gte: since } },
      select: { sentimentScore: true }
    });

    if (mentions.length === 0) {
      return { average: 0, trend: 'stable' };
    }

    const scores = mentions.map(m => m.sentimentScore || 0);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Simple trend calculation
    const recentScores = scores.slice(0, Math.floor(scores.length / 2));
    const olderScores = scores.slice(Math.floor(scores.length / 2));

    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

    const trend = recentAvg > olderAvg + 0.1 ? 'up' :
                  recentAvg < olderAvg - 0.1 ? 'down' : 'stable';

    return { average, trend };
  }

  private async getCollectionHealth(): Promise<DashboardMetrics['collectionStatus']> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [totalMentions, recentMentions, failedMentions] = await Promise.all([
      prisma.socialMention.count(),
      prisma.socialMention.count({
        where: { createdAt: { gte: oneHourAgo } }
      }),
      prisma.socialMention.count({
        where: {
          createdAt: { gte: oneHourAgo },
          errorMessage: { not: null }
        }
      })
    ]);

    const successRate = recentMentions > 0 ?
      ((recentMentions - failedMentions) / recentMentions) * 100 : 100;

    return {
      lastUpdate: now,
      successRate: Math.round(successRate),
      errorCount: failedMentions,
      queueSize: 0 // Would need Redis queue integration
    };
  }

  private async getSystemHealth(): Promise<DashboardMetrics['systemHealth']> {
    const health = {
      database: 'healthy' as const,
      redis: 'healthy' as const,
      api: 'healthy' as const
    };

    try {
      // Test database
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      health.database = 'down';
      logger.error('Database health check failed:', error);
    }

    // Redis and API health would be checked here

    return health;
  }

  private async getTopKurdistanCandidates(limit: number): Promise<KurdistanAnalytics['topCandidates']> {
    // This would need to join with candidate data
    // For now, return mock data
    return [
      {
        name: 'محەمەد عەلی',
        region: 'Erbil',
        influenceScore: 85,
        dialect: 'sorani'
      },
      {
        name: 'فاتمە حەسەن',
        region: 'Sulaymaniyah',
        influenceScore: 72,
        dialect: 'sorani'
      }
    ];
  }

  private async getHourlyActivity(mentions: any[]): Promise<KurdistanAnalytics['hourlyActivity']> {
    const hourlyData: Record<number, { count: number; sentiment: number }> = {};

    for (const mention of mentions) {
      const hour = mention.createdAt.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { count: 0, sentiment: 0 };
      }
      hourlyData[hour].count++;
      hourlyData[hour].sentiment += mention.sentimentScore || 0;
    }

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      mentions: hourlyData[hour]?.count || 0,
      sentiment: hourlyData[hour] ?
        hourlyData[hour].sentiment / hourlyData[hour].count : 0
    }));
  }
}
