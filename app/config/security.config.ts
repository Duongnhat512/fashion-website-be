import { config } from './env';

/**
 * Security configuration
 */
export const securityConfig = {
  cors: {
    origin: [
      'https://your-frontend.vercel.app', // Production frontend
      'https://your-app-git-main.vercel.app', // Vercel preview
      'https://your-app-git-feature-branch.vercel.app', // Feature branches
      ...(config.nodeEnv === 'development'
        ? ['http://localhost:3636', 'http://localhost:3001']
        : []),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
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
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  // Request size limits
  requestLimits: {
    json: 10 * 1024 * 1024, // 10MB
    urlencoded: 10 * 1024 * 1024, // 10MB
    text: 1 * 1024 * 1024, // 1MB
  },
};
