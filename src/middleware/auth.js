import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

/**
 * Authentication middleware
 */
export async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await query(
      'SELECT id, email, name, role, tier, subscription_status, language FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Attach user to request
    req.user = result.rows[0];
    
    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

/**
 * Role-based authorization
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * Subscription tier check
 */
export function requireTier(...tiers) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!tiers.includes(req.user.tier)) {
      return res.status(403).json({
        success: false,
        message: 'This feature requires a higher subscription tier',
        required_tiers: tiers,
        current_tier: req.user.tier,
      });
    }

    next();
  };
}

/**
 * Check if subscription is active
 */
export function requireActiveSubscription(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (req.user.subscription_status !== 'active' && req.user.subscription_status !== 'trial') {
    return res.status(403).json({
      success: false,
      message: 'Subscription expired or inactive',
      subscription_status: req.user.subscription_status,
    });
  }

  next();
}

export default {
  authenticate,
  authorize,
  requireTier,
  requireActiveSubscription,
};
