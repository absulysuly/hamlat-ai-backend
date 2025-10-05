import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import authRoutes from './src/routes/auth.js';
import candidateRoutes from './src/routes/candidate.js';
import adminRoutes from './src/routes/admin.js';
import contentRoutes from './src/routes/content.js';
import analyticsRoutes from './src/routes/analytics.js';
import socialRoutes from './src/routes/social.js';
import paymentRoutes from './src/routes/payment.js';
import voiceRoutes from './src/routes/voice.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { authenticate } from './src/middleware/auth.js';

// Import services
import { initializeDatabase } from './config/database.js';
import { startBackgroundJobs } from './src/services/jobs/index.js';
import { dataCollectionMonitor } from './src/services/monitoring/dataCollectionMonitor.js';
import { startPersistentCollection } from './src/services/data/persistentDataService.js';
import logger from './src/utils/logger.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/candidate', authenticate, candidateRoutes);
app.use('/api/admin', authenticate, adminRoutes);
app.use('/api/content', authenticate, contentRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/social', authenticate, socialRoutes);
app.use('/api/payment', authenticate, paymentRoutes);
app.use('/api/voice', authenticate, voiceRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'client/dist' });
  });
}

// Error handling
app.use(errorHandler);

// ============================================
// WEBSOCKET FOR REAL-TIME UPDATES
// ============================================

const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.url.split('userId=')[1];

  if (userId) {
    clients.set(userId, ws);
    logger.info(`WebSocket client connected: ${userId}`);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(userId, data);
    } catch (error) {
      logger.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    logger.info(`WebSocket client disconnected: ${userId}`);
  });
});

function handleWebSocketMessage(userId, data) {
  // Handle real-time voice commands, notifications, etc.
  logger.info(`WebSocket message from ${userId}:`, data);
}

// Broadcast function for real-time updates
export function broadcastToUser(userId, data) {
  const client = clients.get(userId);
  if (client && client.readyState === 1) {
    client.send(JSON.stringify(data));
  }
}

// ============================================
// STARTUP
// ============================================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database connected');

    // Start background jobs (includes data collection)
    await startBackgroundJobs();
    logger.info('Background jobs started');

    // Start persistent data collection service
    await startPersistentCollection();
    logger.info('Persistent data collection service started');

    // Start data collection monitoring (reports every 10 minutes)
    dataCollectionMonitor.startMonitoring();
    logger.info('Data collection monitoring started');

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 HamlatAI server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 API: http://localhost:${PORT}/api`);
      logger.info(`💻 Admin: http://localhost:${PORT}/admin`);
      logger.info(`📊 Monitoring: Reports every 10 minutes`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
