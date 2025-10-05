import { Router } from 'express';
import { CandidateController, AnalyticsController, AuthController, SocialController } from '../controllers/candidates.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Initialize controllers
const candidateController = new CandidateController();
const analyticsController = new AnalyticsController();
const authController = new AuthController();
const socialController = new SocialController();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Authentication routes
router.post('/auth/login', authController.login.bind(authController));
router.post('/auth/register', authController.register.bind(authController));

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Apply authentication middleware to all routes below
router.use(authenticate);

// Candidates routes
router.get('/candidates', candidateController.list.bind(candidateController));
router.get('/candidates/search', candidateController.search.bind(candidateController));
router.get('/candidates/:id', candidateController.get.bind(candidateController));
router.post('/candidates', authorize('admin'), candidateController.create.bind(candidateController));
router.patch('/candidates/:id', authorize('admin'), candidateController.update.bind(candidateController));

// Analytics routes
router.get('/analytics/dashboard', analyticsController.getDashboard.bind(analyticsController));
router.get('/analytics/kurdistan', analyticsController.getKurdistanAnalytics.bind(analyticsController));
router.get('/analytics/trends', analyticsController.getTrends.bind(analyticsController));
router.get('/analytics/sentiment', analyticsController.getSentiment.bind(analyticsController));

// Social media routes
router.get('/social/mentions', socialController.getMentions.bind(socialController));
router.get('/social/kurdistan-mentions', socialController.getKurdistanMentions.bind(socialController));
router.get('/social/stats', socialController.getStats.bind(socialController));

// Export routes (would need separate controller)
// router.get('/export/candidates', exportController.exportCandidates);
// router.get('/export/report', exportController.generateReport);

// Campaign routes (would need separate controller)
// router.get('/campaigns', campaignController.list);
// router.post('/campaigns', campaignController.create);

// Admin routes (would need separate controller)
// router.get('/admin/users', authorize('admin'), adminController.list);
// router.get('/admin/system-status', authorize('admin'), adminController.getStatus);

export default router;
