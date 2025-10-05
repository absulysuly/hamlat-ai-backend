import { prisma, logger } from '../server.js';
import { LanguageService, KurdishDialect } from './LanguageService.js';
import { RegionalService, Priority } from './RegionalService.js';

export interface Candidate {
  id: string;
  name: {
    ku_sorani?: string;
    ku_badini?: string;
    ku_kurmanji?: string;
    ar: string;
    en?: string;
  };
  party?: {
    id: string;
    name: string;
  };
  region: string;
  priority: Priority;
  position?: string;

  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    telegram?: string;
    whatsapp?: string;
  };

  contact: {
    email?: string;
    phone?: string;
    officeAddress?: string;
  };

  influence: {
    score: number;
    followers: number;
    engagement: number;
    sentiment: number;
    trending: boolean;
  };

  lastUpdated: Date;
  dataQuality: number;
}

export interface SearchQuery {
  query?: string;
  region?: string;
  priority?: Priority;
  party?: string;
  minInfluence?: number;
  language?: string;
  limit?: number;
  offset?: number;
}

export interface CandidateFilter {
  region?: string;
  priority?: Priority;
  partyId?: string;
  minInfluence?: number;
  isActive?: boolean;
}

export class CandidateService {
  private languageService: LanguageService;
  private regionalService: RegionalService;

  constructor() {
    this.languageService = new LanguageService();
    this.regionalService = new RegionalService();
  }

  async discoverCandidates(region?: string): Promise<Candidate[]> {
    try {
      logger.info(`🔍 Discovering candidates${region ? ` in ${region}` : ' across all regions'}`);

      // This would integrate with social media APIs and web scraping
      // For now, return mock data to demonstrate the system

      const mockCandidates: Candidate[] = [
        {
          id: 'candidate-1',
          name: {
            ku_sorani: 'محەمەد عەلی',
            ku_badini: 'مه‌حه‌مه‌د عه‌لی',
            ar: 'محمد علي',
            en: 'Mohammed Ali'
          },
          party: {
            id: 'kdp-1',
            name: 'KDP'
          },
          region: 'Erbil',
          priority: Priority.KURDISTAN,
          position: 'Parliamentary Candidate',
          socialMedia: {
            facebook: 'https://facebook.com/mohammed.ali.kdp',
            twitter: 'https://twitter.com/mohammed_ali_kdp',
            instagram: 'https://instagram.com/mohammed.ali.kdp'
          },
          contact: {
            email: 'mohammed.ali@kdp.org',
            phone: '+9647501234567'
          },
          influence: {
            score: 85,
            followers: 15000,
            engagement: 0.12,
            sentiment: 0.8,
            trending: true
          },
          lastUpdated: new Date(),
          dataQuality: 90
        },
        {
          id: 'candidate-2',
          name: {
            ku_sorani: 'فاتمە حەسەن',
            ar: 'فاطمة حسن',
            en: 'Fatima Hassan'
          },
          party: {
            id: 'puk-1',
            name: 'PUK'
          },
          region: 'Sulaymaniyah',
          priority: Priority.KURDISTAN,
          position: 'Governorate Council Candidate',
          socialMedia: {
            facebook: 'https://facebook.com/fatima.hassan.puk',
            instagram: 'https://instagram.com/fatima.hassan.puk'
          },
          contact: {
            email: 'fatima.hassan@puk.org'
          },
          influence: {
            score: 72,
            followers: 8200,
            engagement: 0.15,
            sentiment: 0.75,
            trending: false
          },
          lastUpdated: new Date(),
          dataQuality: 85
        }
      ];

      // Filter by region if specified
      let candidates = mockCandidates;
      if (region) {
        candidates = mockCandidates.filter(c => c.region === region);
      }

      // Save to database
      for (const candidate of candidates) {
        await this.upsertCandidate(candidate);
      }

      logger.info(`✅ Discovered ${candidates.length} candidates`);
      return candidates;

    } catch (error) {
      logger.error('Failed to discover candidates:', error);
      throw error;
    }
  }

  async enrichProfile(candidateId: string): Promise<Candidate> {
    try {
      logger.info(`🔍 Enriching profile for candidate ${candidateId}`);

      // Get existing candidate
      const existingCandidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { party: true }
      });

      if (!existingCandidate) {
        throw new Error(`Candidate ${candidateId} not found`);
      }

      // Mock enrichment - in reality, this would scrape social media
      const enrichedData = {
        influenceScore: Math.floor(Math.random() * 100),
        followerCount: Math.floor(Math.random() * 50000),
        engagementRate: Math.random() * 0.2,
        sentimentScore: (Math.random() - 0.5) * 2,
        lastScraped: new Date()
      };

      // Update candidate
      const updatedCandidate = await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          ...enrichedData,
          dataQuality: Math.min(100, (existingCandidate.dataQuality || 0) + 10)
        },
        include: { party: true }
      });

      logger.info(`✅ Enriched profile for candidate ${candidateId}`);
      return this.transformToCandidate(updatedCandidate);

    } catch (error) {
      logger.error(`Failed to enrich profile for candidate ${candidateId}:`, error);
      throw error;
    }
  }

  async searchCandidates(query: SearchQuery): Promise<Candidate[]> {
    try {
      logger.info(`🔍 Searching candidates with query:`, query);

      const {
        query: searchQuery,
        region,
        priority,
        party,
        minInfluence = 0,
        language,
        limit = 50,
        offset = 0
      } = query;

      // Build where clause
      const where: any = {};

      if (searchQuery) {
        where.OR = [
          { nameKuSorani: { contains: searchQuery, mode: 'insensitive' } },
          { nameAr: { contains: searchQuery, mode: 'insensitive' } },
          { nameEn: { contains: searchQuery, mode: 'insensitive' } }
        ];
      }

      if (region) {
        where.region = region;
      }

      if (priority) {
        where.priority = priority;
      }

      if (party) {
        where.partyId = party;
      }

      if (minInfluence > 0) {
        where.influenceScore = { gte: minInfluence };
      }

      // Execute search
      const candidates = await prisma.candidate.findMany({
        where,
        include: { party: true },
        orderBy: [
          { priority: 'desc' }, // Kurdistan first
          { influenceScore: 'desc' }, // Then by influence
          { updatedAt: 'desc' } // Most recently updated
        ],
        take: limit,
        skip: offset
      });

      logger.info(`✅ Found ${candidates.length} candidates matching query`);
      return candidates.map(c => this.transformToCandidate(c));

    } catch (error) {
      logger.error('Failed to search candidates:', error);
      throw error;
    }
  }

  async upsertCandidate(candidateData: Partial<Candidate>): Promise<Candidate> {
    try {
      const data: any = {
        nameKuSorani: candidateData.name?.ku_sorani,
        nameKuBadini: candidateData.name?.ku_badini,
        nameKuKurmanji: candidateData.name?.ku_kurmanji,
        nameAr: candidateData.name?.ar,
        nameEn: candidateData.name?.en,
        region: candidateData.region,
        priority: candidateData.priority,
        position: candidateData.position,
        facebook: candidateData.socialMedia?.facebook,
        instagram: candidateData.socialMedia?.instagram,
        twitter: candidateData.socialMedia?.twitter,
        youtube: candidateData.socialMedia?.youtube,
        tiktok: candidateData.socialMedia?.tiktok,
        telegram: candidateData.socialMedia?.telegram,
        whatsapp: candidateData.socialMedia?.whatsapp,
        email: candidateData.contact?.email,
        phone: candidateData.contact?.phone,
        officeAddress: candidateData.contact?.officeAddress,
        influenceScore: candidateData.influence?.score || 0,
        followerCount: candidateData.influence?.followers || 0,
        engagementRate: candidateData.influence?.engagement || 0,
        sentimentScore: candidateData.influence?.sentiment || 0,
        dataQuality: candidateData.dataQuality || 50
      };

      // Handle party relation
      if (candidateData.party?.id) {
        data.partyId = candidateData.party.id;
      }

      const candidate = await prisma.candidate.upsert({
        where: {
          // Try to find by name and region
          nameAr_region: {
            nameAr: candidateData.name?.ar || '',
            region: candidateData.region || ''
          }
        },
        update: data,
        create: data,
        include: { party: true }
      });

      return this.transformToCandidate(candidate);

    } catch (error) {
      logger.error('Failed to upsert candidate:', error);
      throw error;
    }
  }

  async updateInfluenceScore(candidateId: string): Promise<void> {
    try {
      // Get recent mentions for this candidate
      const recentMentions = await prisma.socialMention.findMany({
        where: {
          candidateId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      // Calculate new influence score
      let totalScore = 0;
      let mentionCount = recentMentions.length;

      for (const mention of recentMentions) {
        // Base score from engagement
        const engagementScore = (mention.likes || 0) * 0.1 +
                               (mention.comments || 0) * 0.2 +
                               (mention.shares || 0) * 0.3;

        // Sentiment multiplier
        const sentimentMultiplier = mention.sentimentScore ?
          1 + (mention.sentimentScore * 0.5) : 1;

        totalScore += engagementScore * sentimentMultiplier;
      }

      const avgScore = mentionCount > 0 ? totalScore / mentionCount : 0;

      // Update candidate
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          influenceScore: Math.round(avgScore),
          lastUpdated: new Date()
        }
      });

      logger.info(`✅ Updated influence score for candidate ${candidateId}: ${Math.round(avgScore)}`);

    } catch (error) {
      logger.error(`Failed to update influence score for candidate ${candidateId}:`, error);
      throw error;
    }
  }

  async exportContacts(
    filters: CandidateFilter,
    format: 'csv' | 'excel' | 'json' = 'csv'
  ): Promise<Buffer> {
    try {
      logger.info(`📤 Exporting candidate contacts with filters:`, filters);

      // Get candidates based on filters
      const candidates = await this.searchCandidates({
        region: filters.region,
        priority: filters.priority,
        minInfluence: filters.minInfluence,
        limit: 1000
      });

      if (format === 'json') {
        return Buffer.from(JSON.stringify(candidates, null, 2), 'utf8');
      }

      // For CSV and Excel, create structured data
      const exportData = candidates.map(candidate => ({
        'Name (Kurdish)': candidate.name.ku_sorani || candidate.name.ar,
        'Name (Arabic)': candidate.name.ar,
        'Name (English)': candidate.name.en || '',
        'Party': candidate.party?.name || '',
        'Region': candidate.region,
        'Position': candidate.position || '',
        'Influence Score': candidate.influence.score,
        'Followers': candidate.influence.followers,
        'Engagement Rate': candidate.influence.engagement,
        'Sentiment': candidate.influence.sentiment,
        'Email': candidate.contact.email || '',
        'Phone': candidate.contact.phone || '',
        'Facebook': candidate.socialMedia.facebook || '',
        'Instagram': candidate.socialMedia.instagram || '',
        'Twitter': candidate.socialMedia.twitter || '',
        'YouTube': candidate.socialMedia.youtube || '',
        'TikTok': candidate.socialMedia.tiktok || '',
        'WhatsApp': candidate.socialMedia.whatsapp || '',
        'Last Updated': candidate.lastUpdated.toISOString(),
        'Data Quality': candidate.dataQuality
      }));

      if (format === 'csv') {
        // Simple CSV format
        const headers = Object.keys(exportData[0] || {});
        const csvRows = [
          headers.join(','),
          ...exportData.map(row =>
            headers.map(header => `"${row[header] || ''}"`).join(',')
          )
        ];

        return Buffer.from(csvRows.join('\n'), 'utf8');
      }

      // For Excel format, would need exceljs library
      // For now, return CSV
      return Buffer.from(JSON.stringify(exportData, null, 2), 'utf8');

    } catch (error) {
      logger.error('Failed to export candidate contacts:', error);
      throw error;
    }
  }

  private transformToCandidate(dbCandidate: any): Candidate {
    return {
      id: dbCandidate.id,
      name: {
        ku_sorani: dbCandidate.nameKuSorani,
        ku_badini: dbCandidate.nameKuBadini,
        ku_kurmanji: dbCandidate.nameKuKurmanji,
        ar: dbCandidate.nameAr,
        en: dbCandidate.nameEn
      },
      party: dbCandidate.party ? {
        id: dbCandidate.party.id,
        name: dbCandidate.party.name
      } : undefined,
      region: dbCandidate.region,
      priority: dbCandidate.priority,
      position: dbCandidate.position,
      socialMedia: {
        facebook: dbCandidate.facebook,
        instagram: dbCandidate.instagram,
        twitter: dbCandidate.twitter,
        youtube: dbCandidate.youtube,
        tiktok: dbCandidate.tiktok,
        telegram: dbCandidate.telegram,
        whatsapp: dbCandidate.whatsapp
      },
      contact: {
        email: dbCandidate.email,
        phone: dbCandidate.phone,
        officeAddress: dbCandidate.officeAddress
      },
      influence: {
        score: dbCandidate.influenceScore,
        followers: dbCandidate.followerCount,
        engagement: dbCandidate.engagementRate,
        sentiment: dbCandidate.sentimentScore,
        trending: dbCandidate.influenceScore > 80
      },
      lastUpdated: dbCandidate.lastUpdated,
      dataQuality: dbCandidate.dataQuality
    };
  }
}
