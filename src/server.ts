import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Import routes
import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidates.js';
import analyticsRoutes from './routes/analytics.js';
import socialRoutes from './routes/social.js';
import exportRoutes from './routes/export.js';
import campaignRoutes from './routes/campaigns.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { securityMiddleware } from './middleware/security.js';
import { validateAPIKey } from './middleware/auth.js';

// Import services
import { LanguageService } from './services/LanguageService.js';
import { RegionalService } from './services/RegionalService.js';
import { CandidateService } from './services/CandidateService.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { NotificationService } from './services/NotificationService.js';
import { DataCollectionWorker } from './workers/DataCollectionWorker.js';

// Import WebSocket handler
import { setupWebSocket } from './websocket/websocketHandler.js';

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hamlat-ai-backend' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class HamlatAIServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private port: number;

  // Services
  public languageService: LanguageService;
  public regionalService: RegionalService;
  public candidateService: CandidateService;
  public analyticsService: AnalyticsService;
  public notificationService: NotificationService;
  public dataCollectionWorker: DataCollectionWorker;

  constructor() {
    this.port = parseInt(process.env.PORT || '5000');
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();

    // Initialize services
    this.initializeServices();

    // Create HTTP server
    this.server = createServer(this.app);

    // Setup WebSocket
    this.wss = new WebSocketServer({ server: this.server });
    setupWebSocket(this.wss);

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(securityMiddleware);

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limit for Kurdistan IPs if needed
        return this.regionalService?.isKurdistanIP?.(req.ip) || false;
      }
    }));

    // CORS
    this.app.use(cors({
      origin: (origin, callback) => {
        const whitelist = [
          'https://hamlatai.com',
          'https://www.hamlatai.com',
          'http://localhost:3000',
          'http://localhost:5173'
        ];

        if (!origin || whitelist.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(requestLogger);
  }

  private setupRoutes() {
    // Health check (public)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/candidates', validateAPIKey, candidateRoutes);
    this.app.use('/api/analytics', validateAPIKey, analyticsRoutes);
    this.app.use('/api/social', validateAPIKey, socialRoutes);
    this.app.use('/api/export', validateAPIKey, exportRoutes);
    this.app.use('/api/campaigns', validateAPIKey, campaignRoutes);
    this.app.use('/api/admin', validateAPIKey, adminRoutes);

    // Swagger documentation
    this.app.use('/api-docs', (req, res) => {
      res.redirect('/swagger');
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
          '/health',
          '/api/auth/*',
          '/api/candidates/*',
          '/api/analytics/*',
          '/api/social/*',
          '/api/export/*',
          '/api/campaigns/*',
          '/api/admin/*'
        ]
      });
    });
  }

  private setupErrorHandling() {
    this.app.use(errorHandler);
  }

  private async initializeServices() {
    try {
      logger.info('🚀 Initializing HamlatAI services...');

      // Initialize core services
      this.languageService = new LanguageService();
      this.regionalService = new RegionalService();
      this.candidateService = new CandidateService();
      this.analyticsService = new AnalyticsService();
      this.notificationService = new NotificationService();

      // Initialize data collection worker
      this.dataCollectionWorker = new DataCollectionWorker();

      // Start background jobs
      await this.dataCollectionWorker.start();

      // Start notification service
      await this.notificationService.start();

      logger.info('✅ All services initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`📴 Received ${signal}, shutting down gracefully...`);

      try {
        // Close WebSocket server
        this.wss.close();

        // Close HTTP server
        this.server.close();

        // Close database connection
        await prisma.$disconnect();

        // Close data collection worker
        await this.dataCollectionWorker.stop();

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);

      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async start() {
    try {
      // Ensure database connection
      await prisma.$connect();

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 HamlatAI Backend Server running on port ${this.port}`);
        logger.info(`📊 Kurdistan Priority Collection: ACTIVE`);
        logger.info(`🌐 API Documentation: http://localhost:${this.port}/api-docs`);
        logger.info(`🔗 WebSocket: ws://localhost:${this.port}`);
      });

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new HamlatAIServer();
  server.start();
}

export default HamlatAIServer;
