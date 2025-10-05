import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, logger } from '../server.js';
import { CandidateService } from '../services/CandidateService.js';
import { AnalyticsService } from '../services/AnalyticsService.js';

const candidateService = new CandidateService();
const analyticsService = new AnalyticsService();

export class CandidateController {
  async list(req: Request, res: Response) {
    try {
      const {
        region,
        priority,
        party,
        minInfluence,
        limit = 50,
        offset = 0
      } = req.query;

      const candidates = await candidateService.searchCandidates({
        region: region as string,
        priority: priority as any,
        party: party as string,
        minInfluence: minInfluence ? parseInt(minInfluence as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: candidates,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: candidates.length
        }
      });

    } catch (error) {
      logger.error('Failed to list candidates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve candidates',
        message: error.message
      });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: {
          party: true,
          mentions: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          error: 'Candidate not found'
        });
      }

      res.json({
        success: true,
        data: candidate
      });

    } catch (error) {
      logger.error('Failed to get candidate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve candidate',
        message: error.message
      });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { q, region, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query required'
        });
      }

      const candidates = await candidateService.searchCandidates({
        query: q as string,
        region: region as string,
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: candidates,
        query: q
      });

    } catch (error) {
      logger.error('Failed to search candidates:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const candidateData = req.body;

      const candidate = await candidateService.upsertCandidate(candidateData);

      res.status(201).json({
        success: true,
        data: candidate,
        message: 'Candidate created successfully'
      });

    } catch (error) {
      logger.error('Failed to create candidate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create candidate',
        message: error.message
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if candidate exists
      const existing = await prisma.candidate.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Candidate not found'
        });
      }

      const candidate = await candidateService.upsertCandidate({
        ...updateData,
        id
      });

      res.json({
        success: true,
        data: candidate,
        message: 'Candidate updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update candidate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update candidate',
        message: error.message
      });
    }
  }
}

export class AnalyticsController {
  async getDashboard(req: Request, res: Response) {
    try {
      const metrics = await analyticsService.getDashboardMetrics();

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get dashboard metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard metrics',
        message: error.message
      });
    }
  }

  async getKurdistanAnalytics(req: Request, res: Response) {
    try {
      const analytics = await analyticsService.getKurdistanPriorityAnalytics();

      res.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get Kurdistan analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve Kurdistan analytics',
        message: error.message
      });
    }
  }

  async getTrends(req: Request, res: Response) {
    try {
      const { region, days = 7 } = req.query;

      // Get trends for specified region or all regions
      if (region) {
        const trends = await analyticsService.regionalService.getRegionalTrends(region as string);
        res.json({
          success: true,
          data: trends
        });
      } else {
        // Get trends for all regions
        const regions = ['Erbil', 'Sulaymaniyah', 'Duhok', 'Baghdad', 'Basra'];
        const trends = await Promise.all(
          regions.map(region => analyticsService.regionalService.getRegionalTrends(region))
        );

        res.json({
          success: true,
          data: trends
        });
      }

    } catch (error) {
      logger.error('Failed to get trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trends',
        message: error.message
      });
    }
  }

  async getSentiment(req: Request, res: Response) {
    try {
      const { region, days = 7 } = req.query;
      const since = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

      // Get sentiment data
      const sentimentData = await analyticsService.getSentimentAnalysis(since);

      res.json({
        success: true,
        data: sentimentData,
        region: region as string,
        period: `${days} days`
      });

    } catch (error) {
      logger.error('Failed to get sentiment data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve sentiment data',
        message: error.message
      });
    }
  }
}

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password required'
        });
      }

      // For now, return mock token
      // TODO: Implement proper authentication
      const mockUser = {
        id: 'user-1',
        email,
        role: 'admin',
        permissions: ['manage-all']
      };

      const token = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: mockUser
        }
      });

    } catch (error) {
      logger.error('Login failed:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: error.message
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // TODO: Implement proper user registration
      res.status(201).json({
        success: true,
        message: 'User registration not yet implemented'
      });

    } catch (error) {
      logger.error('Registration failed:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: error.message
      });
    }
  }
}

export class SocialController {
  async getMentions(req: Request, res: Response) {
    try {
      const {
        platform,
        region,
        language,
        limit = 50,
        offset = 0
      } = req.query;

      const where: any = {};

      if (platform) where.platform = platform;
      if (region) where.region = region;
      if (language) where.language = language;

      const mentions = await prisma.socialMention.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: mentions,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: mentions.length
        }
      });

    } catch (error) {
      logger.error('Failed to get mentions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve mentions',
        message: error.message
      });
    }
  }

  async getKurdistanMentions(req: Request, res: Response) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const mentions = await prisma.kurdistanMention.findMany({
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: mentions,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: mentions.length
        }
      });

    } catch (error) {
      logger.error('Failed to get Kurdistan mentions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve Kurdistan mentions',
        message: error.message
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { hours = 24 } = req.query;
      const since = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

      const [totalMentions, kurdistanMentions, platformStats] = await Promise.all([
        prisma.socialMention.count({ where: { createdAt: { gte: since } } }),
        prisma.kurdistanMention.count({ where: { createdAt: { gte: since } } }),
        // Platform breakdown would go here
        {}
      ]);

      res.json({
        success: true,
        data: {
          totalMentions,
          kurdistanMentions,
          timeRange: `${hours} hours`,
          platformStats
        }
      });

    } catch (error) {
      logger.error('Failed to get social stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve social statistics',
        message: error.message
      });
    }
  }
}
