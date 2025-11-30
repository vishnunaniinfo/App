import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any[];

  constructor(message: string, statusCode: number = 500, code?: string, details?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends AppError {
  constructor(message: string, details?: any[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

// Authentication error class
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// Authorization error class
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// Conflict error class
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// Rate limit error class
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED');
  }
}

// WhatsApp error class
export class WhatsAppError extends AppError {
  constructor(message: string, provider?: string) {
    super(message, 503, 'WHATSAPP_ERROR', { provider });
  }
}

// Handle Prisma errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] || [];
      const field = target[0] || 'field';
      return new ConflictError(`${field} already exists`);

    case 'P2025':
      // Record not found
      return new NotFoundError('Record');

    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Invalid reference to related record');

    case 'P2014':
      // Related record conflict
      return new ConflictError('Cannot delete record with related data');

    case 'P2021':
      // Table does not exist
      return new AppError('Database schema error', 500, 'DATABASE_ERROR');

    case 'P2022':
      // Column does not exist
      return new ValidationError('Invalid field in request');

    default:
      logger.error('Unhandled Prisma error:', error);
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

// Handle JWT errors
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid access token');
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Access token has expired');
  }
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Access token not active');
  }
  return new AuthenticationError('Token validation failed');
};

// Handle validation errors (express-validator)
const handleValidationError = (error: any): ValidationError => {
  const details = Array.isArray(error.array)
    ? error.array().map((err: any) => ({
        field: err.param || err.path || 'unknown',
        message: err.msg || 'Validation failed',
        value: err.value,
      }))
    : [{ field: 'unknown', message: 'Validation failed', value: undefined }];

  return new ValidationError('Invalid input data', details);
};

// Main error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  // Convert to AppError if not already
  if (!(error instanceof AppError)) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      err = handlePrismaError(error);
    } else if (error.name && error.name.includes('JsonWebToken')) {
      err = handleJWTError(error);
    } else if (error.array && typeof error.array === 'function') {
      err = handleValidationError(error);
    } else if (error.name === 'MulterError') {
      if (error.message.includes('File too large')) {
        err = new ValidationError('File size exceeds limit');
      } else if (error.message.includes('Unexpected field')) {
        err = new ValidationError('Invalid file field');
      } else {
        err = new ValidationError('File upload failed');
      }
    } else {
      logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user?.id,
        builder: req.user?.builderId,
      });

      err = new AppError(
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
        500,
        'INTERNAL_ERROR'
      );
    }
  }

  // Log error if it's not a client error or if it's operational
  if (err.statusCode >= 500 || !err.isOperational) {
    logger.error('Application error:', {
      error: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      code: err.code,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user?.id,
      builder: req.user?.builderId,
      details: err.details,
    });
  } else {
    // Log client errors at info level for monitoring
    logger.info('Client error:', {
      error: err.message,
      statusCode: err.statusCode,
      code: err.code,
      url: req.url,
      method: req.method,
      ip: req.ip,
      user: req.user?.id,
      builder: req.user?.builderId,
      details: err.details,
    });
  }

  // Send error response
  const response: any = {
    error: {
      code: err.code,
      message: err.message,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Add details for validation errors
  if (err.details && err.details.length > 0) {
    response.error.details = err.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Add request ID if available
  const requestId = req.headers['x-request-id'] as string;
  if (requestId) {
    response.requestId = requestId;
  }

  res.status(err.statusCode).json(response);
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.info('404 - Route not found:', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom async error with context
export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  context?: any
): AppError => {
  const error = new AppError(message, statusCode, code);
  if (context) {
    error.details = [context];
  }
  return error;
};

export default errorHandler;