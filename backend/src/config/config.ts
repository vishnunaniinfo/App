import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  API_URL: Joi.string().default('http://localhost:3001/api'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  BCRYPT_SALT_ROUNDS: Joi.number().default(12),

  // WhatsApp Provider
  WHATSAPP_PROVIDER: Joi.string()
    .valid('TWILIO', 'ULTRAMSG', 'MOCK')
    .default('MOCK'),

  // Twilio
  TWILIO_ACCOUNT_SID: Joi.string().when('WHATSAPP_PROVIDER', {
    is: 'TWILIO',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  TWILIO_AUTH_TOKEN: Joi.string().when('WHATSAPP_PROVIDER', {
    is: 'TWILIO',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  TWILIO_PHONE_NUMBER: Joi.string().when('WHATSAPP_PROVIDER', {
    is: 'TWILIO',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // UltraMsg
  ULTRAMSG_TOKEN: Joi.string().when('WHATSAPP_PROVIDER', {
    is: 'ULTRAMSG',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  ULTRAMSG_INSTANCE: Joi.string().when('WHATSAPP_PROVIDER', {
    is: 'ULTRAMSG',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  ULTRAMSG_PHONE_NUMBER: Joi.string().when('WHATSAPP_PROVIDER', {
    is: 'ULTRAMSG',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Rate Limiting
  WHATSAPP_RATE_LIMIT_PER_SECOND: Joi.number().default(1),
  WHATSAPP_RATE_LIMIT_PER_MINUTE: Joi.number().default(30),
  WHATSAPP_RATE_LIMIT_PER_HOUR: Joi.number().default(1000),

  // Business Hours
  BUSINESS_HOURS_START: Joi.string().default('09:00'),
  BUSINESS_HOURS_END: Joi.string().default('18:00'),
  BUSINESS_HOURS_TIMEZONE: Joi.string().default('UTC'),
  BUSINESS_DAYS: Joi.string().default('MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY'),

  // SendGrid (Email)
  SENDGRID_API_KEY: Joi.string().optional(),
  SENDGRID_FROM_EMAIL: Joi.string().default('noreply@xavira.com'),
  SENDGRID_FROM_NAME: Joi.string().default('Xavira Lead Engine'),

  // Sentry (Error Tracking)
  SENTRY_DSN: Joi.string().optional(),
  SENTRY_ENVIRONMENT: Joi.string().default('development'),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().default(0.1),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),
  LOG_FILE_PATH: Joi.string().default('./logs/app.log'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Rate Limiting (General API)
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Session Security
  SESSION_SECRET: Joi.string().min(32).optional(),
  SESSION_MAX_AGE: Joi.number().default(86400000), // 24 hours

  // File Storage (AWS S3 - Optional)
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET: Joi.string().optional(),
  AWS_CLOUDFRONT_DOMAIN: Joi.string().optional(),

  // Demo Mode
  DEMO_MODE: Joi.boolean().default(false),
  DEMO_DATA_LIMIT: Joi.number().default(100),
  DEMO_MESSAGE_INTERVAL: Joi.number().default(5000),

  // Debugging
  DEBUG: Joi.boolean().default(false),
  DEBUG_SQL: Joi.boolean().default(false),
  DEBUG_WHATSAPP: Joi.boolean().default(false),
}).unknown(true);

// Validate and extract environment variables
const { value: envVars, error } = envSchema.validate(process.env, {
  stripUnknown: true,
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Configuration object
export const config = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  frontendUrl: envVars.FRONTEND_URL,
  apiUrl: envVars.API_URL,

  // Database
  database: {
    url: envVars.DATABASE_URL,
  },

  // Redis
  redis: {
    url: envVars.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
    saltRounds: envVars.BCRYPT_SALT_ROUNDS,
  },

  // WhatsApp
  whatsapp: {
    provider: envVars.WHATSAPP_PROVIDER,
    rateLimit: {
      perSecond: envVars.WHATSAPP_RATE_LIMIT_PER_SECOND,
      perMinute: envVars.WHATSAPP_RATE_LIMIT_PER_MINUTE,
      perHour: envVars.WHATSAPP_RATE_LIMIT_PER_HOUR,
    },
    businessHours: {
      start: envVars.BUSINESS_HOURS_START,
      end: envVars.BUSINESS_HOURS_END,
      timezone: envVars.BUSINESS_HOURS_TIMEZONE,
      days: envVars.BUSINESS_DAYS.split(','),
    },
    twilio: {
      accountSid: envVars.TWILIO_ACCOUNT_SID,
      authToken: envVars.TWILIO_AUTH_TOKEN,
      phoneNumber: envVars.TWILIO_PHONE_NUMBER,
    },
    ultramsg: {
      token: envVars.ULTRAMSG_TOKEN,
      instance: envVars.ULTRAMSG_INSTANCE,
      phoneNumber: envVars.ULTRAMSG_PHONE_NUMBER,
    },
  },

  // Email
  email: {
    sendgridApiKey: envVars.SENDGRID_API_KEY,
    fromEmail: envVars.SENDGRID_FROM_EMAIL,
    fromName: envVars.SENDGRID_FROM_NAME,
  },

  // Error Tracking
  sentry: {
    dsn: envVars.SENTRY_DSN,
    environment: envVars.SENTRY_ENVIRONMENT,
    tracesSampleRate: envVars.SENTRY_TRACES_SAMPLE_RATE,
  },

  // Logging
  logging: {
    level: envVars.LOG_LEVEL,
    format: envVars.LOG_FORMAT,
    filePath: envVars.LOG_FILE_PATH,
  },

  // CORS
  cors: {
    origins: envVars.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: envVars.CORS_CREDENTIALS,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },

  // AWS S3
  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION,
    s3Bucket: envVars.AWS_S3_BUCKET,
    cloudfrontDomain: envVars.AWS_CLOUDFRONT_DOMAIN,
  },

  // Demo Mode
  demo: {
    enabled: envVars.DEMO_MODE,
    dataLimit: envVars.DEMO_DATA_LIMIT,
    messageInterval: envVars.DEMO_MESSAGE_INTERVAL,
  },

  // Debugging
  debug: {
    enabled: envVars.DEBUG,
    sql: envVars.DEBUG_SQL,
    whatsapp: envVars.DEBUG_WHATSAPP,
  },

  // Security
  security: {
    sessionSecret: envVars.SESSION_SECRET,
    sessionMaxAge: envVars.SESSION_MAX_AGE,
  },
} as const;

export type Config = typeof config;