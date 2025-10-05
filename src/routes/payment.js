import express from 'express';
import { query } from '../../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Get pricing plans
 */
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = {
    basic: {
      name: { ar: 'الباقة الأساسية', ku: 'گورزەی بنەڕەتی', en: 'Basic Plan' },
      price_usd: 2500,
      price_iqd: 3275000,
      features: ['3 posts daily', 'Analytics', 'Auto-responses'],
    },
    professional: {
      name: { ar: 'الباقة الاحترافية', ku: 'گورزەی پیشەیی', en: 'Professional Plan' },
      price_usd: 4000,
      price_iqd: 5240000,
      features: ['All Basic features', '2 AI videos weekly', 'Crisis management'],
      popular: true,
    },
    premium: {
      name: { ar: 'الباقة المتقدمة', ku: 'گورزەی باڵا', en: 'Premium Plan' },
      price_usd: 7000,
      price_iqd: 9170000,
      features: ['All Professional features', '5 AI videos weekly', 'Dedicated support'],
    },
  };

  res.json({
    success: true,
    data: plans,
  });
}));

/**
 * Create payment
 */
router.post('/create', asyncHandler(async (req, res) => {
  const { plan, method, amount, currency } = req.body;
  const userId = req.user.id;

  const result = await query(
    `INSERT INTO payments (user_id, plan, amount, currency, method, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING *`,
    [userId, plan, amount, currency || 'IQD', method]
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

export default router;
