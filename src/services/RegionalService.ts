import { prisma, logger } from '../server.js';
import { KurdishDialect } from './LanguageService.js';

export enum Priority {
  SULAYMANIYAH = 'SULAYMANIYAH',  // 1st priority - Mania
  ERBIL = 'ERBIL',                // 2nd priority - Our Bill
  BAGHDAD = 'BAGHDAD',           // 3rd priority
  BASRA = 'BASRA',               // 4th priority
  DUHOK = 'DUHOK',               // 5th priority - Duhog
  KIRKUK = 'KIRKUK',             // 6th priority
  OTHER = 'OTHER'                // 7th priority - remaining regions
}

export interface RegionConfig {
  frequency: number; // Collection frequency multiplier
  regions: string[];
  languages: string[];
  importance: string;
  priorityOrder: number;
}

export class RegionalService {
  private regionPriority: Record<string, RegionConfig> = {
    sulaymaniyah: {
      frequency: 6, // 6x data collection (highest priority)
      regions: ['Sulaymaniyah', 'Mania'],
      languages: [KurdishDialect.SORANI, KurdishDialect.BADINI, KurdishDialect.KURMANJI],
      importance: 'CRITICAL_1',
      priorityOrder: 1
    },
    erbil: {
      frequency: 5, // 5x data collection
      regions: ['Erbil', 'Our Bill'],
      languages: [KurdishDialect.SORANI, KurdishDialect.BADINI, KurdishDialect.KURMANJI],
      importance: 'CRITICAL_2',
      priorityOrder: 2
    },
    baghdad: {
      frequency: 4, // 4x data collection
      regions: ['Baghdad'],
      languages: ['arabic', 'english'],
      importance: 'HIGH_1',
      priorityOrder: 3
    },
    basra: {
      frequency: 3, // 3x data collection
      regions: ['Basra'],
      languages: ['arabic'],
      importance: 'HIGH_2',
      priorityOrder: 4
    },
    duhok: {
      frequency: 2, // 2x data collection
      regions: ['Duhok', 'Duhog'],
      languages: [KurdishDialect.BADINI, KurdishDialect.KURMANJI],
      importance: 'MEDIUM_HIGH',
      priorityOrder: 5
    },
    kirkuk: {
      frequency: 1.5, // 1.5x data collection
      regions: ['Kirkuk'],
      languages: [KurdishDialect.KURMANJI, 'arabic'],
      importance: 'MEDIUM',
      priorityOrder: 6
    },
    other: {
      frequency: 0.5, // 0.5x data collection (lowest priority)
      regions: ['Najaf', 'Karbala', 'Mosul', 'Anbar', 'Salahuddin', 'Diyala', 'Muthanna', 'Qadisiyah', 'Maysan', 'Wasit', 'Babil'],
      languages: ['arabic'],
      importance: 'LOW',
      priorityOrder: 7
    }
  };

  private kurdistanIPs = [
    '104.28.0.0/20',    // Kurdistan region IP ranges
    '185.11.0.0/20',    // Iraqi telecom ranges
    '37.237.0.0/16'     // Additional ranges
  ];

  isKurdistanIP(ip: string): boolean {
    // Simple IP range check for Kurdistan region
    // In production, use a proper geo-IP service
    return this.kurdistanIPs.some(range => this.ipInRange(ip, range));
  }

  private ipInRange(ip: string, cidr: string): boolean {
    const [range, bits = 24] = cidr.split('/');
    const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1);
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  // Utility method to check if region is high priority (Sulaymaniyah, Erbil, Baghdad, Basra)
  isHighPriorityRegion(region: string): boolean {
    const priority = this.getRegionPriority(region);
    return [Priority.SULAYMANIYAH, Priority.ERBIL, Priority.BAGHDAD, Priority.BASRA].includes(priority);
  }

  getRegionPriority(region: string): Priority {
    if (this.regionPriority.sulaymaniyah.regions.includes(region)) {
      return Priority.SULAYMANIYAH;
    }
    if (this.regionPriority.erbil.regions.includes(region)) {
      return Priority.ERBIL;
    if (this.regionPriority.baghdad.regions.includes(region)) {
      return Priority.BAGHDAD;
    }
    if (this.regionPriority.basra.regions.includes(region)) {
      return Priority.BASRA;
    }
    if (this.regionPriority.duhok.regions.includes(region)) {
      return Priority.DUHOK;
    }
    if (this.regionPriority.kirkuk.regions.includes(region)) {
      return Priority.KIRKUK;
    }
    return Priority.OTHER;
  }
  getCollectionSchedule(): Array<{
    region: string;
    cron: string;
    priority: Priority;
    frequency: number;
    priorityOrder: number;
  }> {
    return [
      {
        region: 'Sulaymaniyah (Mania)',
        cron: '*/2 * * * *', // Every 2 minutes (6x frequency)
        priority: Priority.SULAYMANIYAH,
        frequency: 6,
        priorityOrder: 1
      },
      {
        region: 'Erbil (Our Bill)',
        cron: '*/2.4 * * * *', // Every 2.4 minutes (5x frequency)
        priority: Priority.ERBIL,
        frequency: 5,
        priorityOrder: 2
      },
      {
        region: 'Baghdad',
        cron: '*/3 * * * *', // Every 3 minutes (4x frequency)
        priority: Priority.BAGHDAD,
        frequency: 4,
        priorityOrder: 3
      },
      {
        region: 'Basra',
        cron: '*/4 * * * *', // Every 4 minutes (3x frequency)
        priority: Priority.BASRA,
        frequency: 3,
        priorityOrder: 4
      },
      {
        region: 'Duhok (Duhog)',
        cron: '*/6 * * * *', // Every 6 minutes (2x frequency)
        priority: Priority.DUHOK,
        frequency: 2,
        priorityOrder: 5
      },
      {
        region: 'Kirkuk',
        cron: '*/8 * * * *', // Every 8 minutes (1.5x frequency)
        priority: Priority.KIRKUK,
        frequency: 1.5,
        priorityOrder: 6
      },
      {
        region: 'Other Regions',
        cron: '*/24 * * * *', // Every 24 minutes (0.5x frequency)
        priority: Priority.OTHER,
        frequency: 0.5,
        priorityOrder: 7
      }
    ];
  }

  calculatePriorityScore(candidateRegion: string, influenceScore: number): number {
    let score = influenceScore;

    // Apply priority multipliers based on your specified order
    if (candidateRegion === Priority.SULAYMANIYAH) {
      score *= 6; // 6x boost for Sulaymaniyah (Mania)
    } else if (candidateRegion === Priority.ERBIL) {
      score *= 5; // 5x boost for Erbil (Our Bill)
    } else if (candidateRegion === Priority.BAGHDAD) {
      score *= 4; // 4x boost for Baghdad
    } else if (candidateRegion === Priority.BASRA) {
      score *= 3; // 3x boost for Basra
    } else if (candidateRegion === Priority.DUHOK) {
      score *= 2; // 2x boost for Duhok (Duhog)
    } else if (candidateRegion === Priority.KIRKUK) {
      score *= 1.5; // 1.5x boost for Kirkuk
    }

    return Math.round(score);
  }

  async getRegionalTrends(region: string): Promise<{
    region: string;
    priority: Priority;
    priorityOrder: number;
    mentionCount: number;
    topCandidates: Array<{
      name: string;
      influenceScore: number;
      sentiment: number;
    }>;
    trendingTopics: string[];
    sentimentTrend: 'up' | 'down' | 'stable';
  }> {
    try {
      const priority = this.getRegionPriority(region);
      const config = this.getRegionConfig(region);

      // Get recent mentions for the region
      const recentMentions = await prisma.socialMention.findMany({
        where: {
          region: region,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          candidate: {
            select: {
              nameKuSorani: true,
              nameAr: true,
              influenceScore: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });

      // Calculate metrics
      const mentionCount = recentMentions.length;

      // Get top candidates
      const candidateStats = new Map();
      for (const mention of recentMentions) {
        if (mention.candidate) {
          const key = mention.candidate.nameKuSorani || mention.candidate.nameAr;
          if (!candidateStats.has(key)) {
            candidateStats.set(key, {
              name: key,
              influenceScore: mention.candidate.influenceScore,
              sentiment: mention.sentimentScore || 0,
              mentionCount: 0
            });
          }
          candidateStats.get(key).mentionCount++;
        }
      }

      const topCandidates = Array.from(candidateStats.values())
        .sort((a, b) => b.influenceScore - a.influenceScore)
        .slice(0, 5);

      // Extract trending topics
      const trendingTopics = this.extractTrendingTopics(recentMentions);

      // Calculate sentiment trend
      const sentimentTrend = this.calculateSentimentTrend(recentMentions);

      return {
        region,
        priority,
        priorityOrder: config?.priorityOrder || 7,
        mentionCount,
        topCandidates,
        trendingTopics,
        sentimentTrend
      };

    } catch (error) {
      logger.error(`Failed to get regional trends for ${region}:`, error);
      throw error;
    }
  }

  private extractTrendingTopics(mentions: any[]): string[] {
    const topicCount = new Map<string, number>();
    const topics = [
      'election', 'government', 'economy', 'security', 'education',
      'healthcare', 'infrastructure', 'corruption', 'development'
    ];

    for (const mention of mentions) {
      for (const topic of topics) {
        if (mention.content?.toLowerCase().includes(topic)) {
          topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
        }
      }
    }

    return Array.from(topicCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private calculateSentimentTrend(mentions: any[]): 'up' | 'down' | 'stable' {
    if (mentions.length < 10) return 'stable';

    const recent = mentions.slice(0, 5);
    const older = mentions.slice(5, 10);

    const recentAvg = recent.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + (m.sentimentScore || 0), 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  }

  async getKurdistanPriorityAnalytics(): Promise<{
    totalMentions: number;
    dialectBreakdown: Record<KurdishDialect, number>;
    regionBreakdown: Record<string, number>;
    topCandidates: Array<{
      name: string;
      region: string;
      influenceScore: number;
      dialect: KurdishDialect;
    }>;
    sentimentOverview: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }> {
    try {
      // Get Kurdistan mentions from last 24 hours
      const kurdistanMentions = await prisma.kurdistanMention.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        include: {
          // We don't have candidate relation in kurdistan_mentions yet
          // This would need to be added to the schema
        }
      });

      // Calculate dialect breakdown
      const dialectBreakdown = {
        [KurdishDialect.SORANI]: 0,
        [KurdishDialect.BADINI]: 0,
        [KurdishDialect.KURMANJI]: 0
      };

      for (const mention of kurdistanMentions) {
        dialectBreakdown[mention.dialect]++;
      }

      // Calculate region breakdown
      const regionBreakdown: Record<string, number> = {};
      for (const mention of kurdistanMentions) {
        const region = mention.region || 'Unknown';
        regionBreakdown[region] = (regionBreakdown[region] || 0) + 1;
      }

      // Get top candidates (this would need candidate relation)
      const topCandidates = []; // Placeholder

      // Calculate sentiment overview
      const sentimentOverview = {
        positive: kurdistanMentions.filter(m => m.sentiment === 'POSITIVE').length,
        negative: kurdistanMentions.filter(m => m.sentiment === 'NEGATIVE').length,
        neutral: kurdistanMentions.filter(m => m.sentiment === 'NEUTRAL').length
      };

      return {
        totalMentions: kurdistanMentions.length,
        dialectBreakdown,
        regionBreakdown,
        topCandidates,
        sentimentOverview
      };

    } catch (error) {
      logger.error('Failed to get Kurdistan priority analytics:', error);
      throw error;
    }
  }

  // Get region configuration
  getRegionConfig(region: string): RegionConfig | null {
    for (const [key, config] of Object.entries(this.regionPriority)) {
      if (config.regions.includes(region)) {
        return config;
      }
    }
    return null;
  }

  // Get priority regions in collection order
  getPriorityRegionsInOrder(): Array<{region: string, priority: Priority, frequency: number}> {
    return [
      {region: 'Sulaymaniyah (Mania)', priority: Priority.SULAYMANIYAH, frequency: 6},
      {region: 'Erbil (Our Bill)', priority: Priority.ERBIL, frequency: 5},
      {region: 'Baghdad', priority: Priority.BAGHDAD, frequency: 4},
      {region: 'Basra', priority: Priority.BASRA, frequency: 3},
      {region: 'Duhok (Duhog)', priority: Priority.DUHOK, frequency: 2},
      {region: 'Kirkuk', priority: Priority.KIRKUK, frequency: 1.5}
    ];
  }
}
