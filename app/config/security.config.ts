import { config } from './env';

/**
 * Security configuration
 */
export const securityConfig = {
  cors: {
    origin: [
      'https://fashion-website-fe1.vercel.app', // Production frontend
      'https://*.vercel.app', // Vercel preview domains
      ...(config.nodeEnv === 'development'
        ? ['http://localhost:3636', 'http://localhost:5173','http://localhost:3000']
        : []),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 2 * 60 * 1000,
    max: config.nodeEnv === 'production' ? 100 : 1000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Auth rate limiting
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
  },

  // JWT configuration
  jwt: {
    accessTokenExpiry: config.jwtAccessTokenExpiresIn || '15m',
    refreshTokenExpiry: config.jwtRefreshTokenExpiresIn || '7d',
    issuer: 'fashion-website',
    audience: 'fashion-website-users',
  },

  // Password policy
  passwordPolicy: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxConsecutiveChars: 3,
    minUniqueChars: 4,
  },

  // Session configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },

  // IP whitelist for admin operations
  adminIPWhitelist: process.env.ADMIN_IP_WHITELIST?.split(',') || [],

  // File upload restrictions
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/json',
      'text/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
      'text/plain',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  // Request size limits
  requestLimits: {
    json: 10 * 1024 * 1024, // 10MB
    urlencoded: 10 * 1024 * 1024, // 10MB
    text: 1 * 1024 * 1024, // 1MB
  },
};
