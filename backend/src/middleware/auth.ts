import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';
import { logger, logSecurityEvent } from '../config/logger';
import { AppError } from './errorHandler';

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        builderId: string;
      };
      builder?: {
        id: string;
        name: string;
        subdomain: string;
      };
    }
  }
}

const prisma = new PrismaClient();

// JWT token verification
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      logSecurityEvent({
        type: 'unauthorized',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: { path: req.path },
      });
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required',
        },
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      logSecurityEvent({
        type: 'unauthorized',
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: { reason: 'User not found or inactive', path: req.path },
      });
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    // Attach user and builder to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      builderId: user.builderId,
    };
    req.builder = user.builder;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent({
        type: 'unauthorized',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: { reason: 'Invalid JWT', error: error.message, path: req.path },
      });
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid access token',
        },
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent({
        type: 'unauthorized',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: { reason: 'Token expired', error: error.message, path: req.path },
      });
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token has expired',
        },
      });
    }

    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

// Role-based access control
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent({
        type: 'unauthorized',
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: {
          requiredRoles: roles,
          userRole: req.user.role,
          path: req.path,
        },
      });
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

// Resource ownership validation
export const requireOwnership = (resourceType: 'builder' | 'user' | 'project' | 'lead') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    try {
      const resourceId = req.params.id || req.params.userId || req.params.projectId || req.params.leadId;

      if (!resourceId) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Resource ID is required',
          },
        });
      }

      let hasAccess = false;
      const builderId = req.user.builderId;

      switch (resourceType) {
        case 'builder':
          // Only admins can access builder resources directly
          hasAccess = req.user.role === 'ADMIN' && req.user.builderId === resourceId;
          break;

        case 'user':
          if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
            // Admins and managers can access users from same builder
            const user = await prisma.user.findUnique({
              where: { id: resourceId },
              select: { builderId: true },
            });
            hasAccess = user?.builderId === builderId;
          } else if (req.user.id === resourceId) {
            // Users can access their own profile
            hasAccess = true;
          }
          break;

        case 'project':
          // All authenticated users can access projects from their builder
          const project = await prisma.project.findUnique({
            where: { id: resourceId },
            select: { builderId: true },
          });
          hasAccess = project?.builderId === builderId;
          break;

        case 'lead':
          // Agents can only access leads assigned to them
          // Managers and admins can access all leads from their builder
          if (req.user.role === 'AGENT') {
            const lead = await prisma.lead.findUnique({
              where: { id: resourceId },
              select: { builderId: true, assignedTo: true },
            });
            hasAccess = lead?.builderId === builderId && lead?.assignedTo === req.user.id;
          } else {
            const lead = await prisma.lead.findUnique({
              where: { id: resourceId },
              select: { builderId: true },
            });
            hasAccess = lead?.builderId === builderId;
          }
          break;

        default:
          hasAccess = false;
      }

      if (!hasAccess) {
        logSecurityEvent({
          type: 'unauthorized',
          userId: req.user.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: {
            resourceType,
            resourceId,
            attemptedAccess: true,
            path: req.path,
          },
        });
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access to this resource is not permitted',
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership validation error:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate resource access',
        },
      });
    }
  };
};

// Optional authentication (does not return error if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return next(); // Continue without user context
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        builderId: user.builderId,
      };
      req.builder = user.builder;
    }

    next();
  } catch (error) {
    // Log but continue without failing
    logger.debug('Optional auth failed:', error);
    next();
  }
};

export default authMiddleware;