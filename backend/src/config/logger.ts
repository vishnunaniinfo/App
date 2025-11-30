import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './config';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    if (stack) {
      log += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: config.debug.enabled ? 'debug' : config.logging.level,
    format: config.logging.format === 'simple' ? consoleFormat : fileFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
];

// Add file transports in non-test environments
if (config.nodeEnv !== 'test') {
  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: config.logging.filePath.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: config.logging.level,
      format: fileFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );

  // Error-only log file
  transports.push(
    new DailyRotateFile({
      filename: config.logging.filePath.replace('.log', '-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: fileFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: fileFormat,
  transports,
  exitOnError: false,
  silent: config.nodeEnv === 'test',
});

// Add request context helper
export const createRequestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;

    const logLevel = statusCode >= 400 ? 'error' : 'info';
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;

    logger[logLevel](message, {
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent: req.get('User-Agent'),
      contentLength: req.get('Content-Length'),
    });
  });

  next();
};

// Add WhatsApp logging helper
export const logWhatsAppMessage = (data: {
  direction: 'outbound' | 'inbound';
  provider: string;
  leadId: string;
  templateId?: string;
  status: string;
  content: string;
  error?: string;
}) => {
  const level = data.error ? 'error' : 'info';
  logger[level](`WhatsApp ${data.direction} message`, {
    type: 'whatsapp',
    direction: data.direction,
    provider: data.provider,
    leadId: data.leadId,
    templateId: data.templateId,
    status: data.status,
    content: data.content.substring(0, 100), // Truncate long messages
    error: data.error,
  });
};

// Add automation logging helper
export const logAutomationEvent = (data: {
  type: 'sequence_start' | 'step_execute' | 'sequence_complete' | 'sequence_error';
  leadId: string;
  sequenceId: string;
  stepIndex?: number;
  templateId?: string;
  error?: string;
}) => {
  const level = data.error ? 'error' : 'info';
  logger[level](`Automation ${data.type}`, {
    type: 'automation',
    eventType: data.type,
    leadId: data.leadId,
    sequenceId: data.sequenceId,
    stepIndex: data.stepIndex,
    templateId: data.templateId,
    error: data.error,
  });
};

// Add security logging helper
export const logSecurityEvent = (data: {
  type: 'login' | 'logout' | 'register' | 'password_reset' | 'unauthorized' | 'rate_limit';
  userId?: string;
  email?: string;
  ip: string;
  userAgent?: string;
  details?: any;
}) => {
  const level = data.type === 'unauthorized' || data.type === 'rate_limit' ? 'warn' : 'info';
  logger[level](`Security event: ${data.type}`, {
    type: 'security',
    eventType: data.type,
    userId: data.userId,
    email: data.email,
    ip: data.ip,
    userAgent: data.userAgent,
    details: data.details,
  });
};

// Add performance logging helper
export const logPerformance = (data: {
  operation: string;
  duration: number;
  details?: any;
}) => {
  const level = data.duration > 5000 ? 'warn' : 'debug'; // Log as warning if > 5s
  logger[level](`Performance: ${data.operation}`, {
    type: 'performance',
    operation: data.operation,
    duration: data.duration,
    details: data.details,
  });
};

export default logger;