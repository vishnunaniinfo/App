import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { config } from './config/config';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authMiddleware } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import leadRoutes from './routes/leads';
import pipelineRoutes from './routes/pipeline';
import automationRoutes from './routes/automation';
import templateRoutes from './routes/templates';
import whatsappRoutes from './routes/whatsapp';
import dashboardRoutes from './routes/dashboard';
import publicRoutes from './routes/public';

const app = express();

// Trust proxy for rate limiting and secure headers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Basic middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Public webhook rate limit exceeded. Please try again later.',
    },
  },
});

app.use('/api/', limiter);
app.use('/api/public/', publicLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.nodeEnv,
  });
});

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Xavira Lead Engine API',
      version: '1.0.0',
      description: 'Real estate lead management SaaS with WhatsApp automation',
      contact: {
        name: 'Xavira Team',
        email: 'support@xavira.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.apiUrl,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/leads', authMiddleware, leadRoutes);
app.use('/api/pipeline', authMiddleware, pipelineRoutes);
app.use('/api/automation', authMiddleware, automationRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/whatsapp', authMiddleware, whatsappRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/public', publicRoutes);

// Static files for uploads (if any)
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port || 3001;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;