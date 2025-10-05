import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Register new candidate
 */
router.post('/register', asyncHandler(async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    whatsapp,
    governorate,
    political_party,
    is_independent,
    language,
    dialect,
    key_issues,
  } = req.body;

  // Validate required fields
  if (!name || !governorate || !language) {
    return res.status(400).json({
      success: false,
      message: 'Name, governorate, and language are required',
    });
  }

  // Hash password if provided
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // Create user
  const result = await query(
    `INSERT INTO users (
      email, password_hash, name, phone, whatsapp, governorate,
      political_party, is_independent, language, dialect
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, name, email, governorate, language, tier, trial_end_date`,
    [
      email,
      passwordHash,
      name,
      phone || whatsapp,
      whatsapp,
      governorate,
      political_party,
      is_independent || false,
      language,
      dialect,
    ]
  );

  const user = result.rows[0];

  // Create campaign
  await query(
    `INSERT INTO campaigns (user_id, name, key_issues)
    VALUES ($1, $2, $3)`,
    [user.id, `${name} Campaign`, key_issues || []]
  );

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  logger.info('New user registered:', { userId: user.id, name: user.name });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user,
      token,
    },
  });
}));

/**
 * Login
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/phone and password are required',
    });
  }

  // Find user
  const result = await query(
    `SELECT * FROM users 
    WHERE (email = $1 OR phone = $2) AND is_active = true`,
    [email, phone]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  // Remove sensitive data
  delete user.password_hash;

  logger.info('User logged in:', { userId: user.id });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
}));

/**
 * Get current user
 */
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const result = await query(
    `SELECT id, email, name, phone, whatsapp, governorate, political_party,
    language, dialect, role, tier, subscription_status, trial_end_date,
    subscription_end_date, profile_image_url, voice_enabled
    FROM users WHERE id = $1 AND is_active = true`,
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

export default router;
