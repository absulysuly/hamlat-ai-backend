import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, logger } from '../server.js';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      apiKey?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Token is missing'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    if (!decoded || !decoded.userId) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: 'User not found or inactive',
        message: 'Please contact support'
      });
      return;
    }

    // Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: getRolePermissions(user.role)
    };

    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

export const authorize = (requiredPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
      return;
    }

    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const userPermissions = req.user.permissions || [];

    const hasPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required permissions: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

export const validateAPIKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        message: 'Please provide X-API-Key header'
      });
      return;
    }

    // Check if API key exists in database
    const key = await prisma.aPIKey.findUnique({
      where: {
        key: apiKey,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!key) {
      res.status(401).json({
        error: 'Invalid API key',
        message: 'API key not found or inactive'
      });
      return;
    }

    // Check if key is expired
    if (key.expiresAt && key.expiresAt < new Date()) {
      res.status(401).json({
        error: 'API key expired',
        message: 'Please renew your API key'
      });
      return;
    }

    // Add API key info to request
    req.apiKey = key;
    req.user = {
      id: key.user.id,
      email: key.user.email,
      role: key.user.role,
      permissions: JSON.parse(key.permissions || '[]')
    };

    // Update last used timestamp
    await prisma.aPIKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() }
    });

    next();

  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate API key'
    });
  }
};

function getRolePermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'manage-all',
      'delete-data',
      'export-sensitive',
      'manage-users',
      'view-analytics',
      'edit-campaigns',
      'contact-candidates',
      'system-admin'
    ],
    campaignManager: [
      'view-analytics',
      'edit-campaigns',
      'contact-candidates',
      'export-reports',
      'manage-campaigns'
    ],
    analyst: [
      'view-analytics',
      'export-reports',
      'view-candidates',
      'search-candidates'
    ],
    viewer: [
      'view-candidates',
      'search-candidates',
      'view-basic-analytics'
    ]
  };

  return rolePermissions[role] || [];
}
