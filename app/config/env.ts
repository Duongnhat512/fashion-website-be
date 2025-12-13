import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(process.env.PORT || 3000),

  // Database
  PG_HOST: Joi.string().default('localhost'),
  PG_PORT: Joi.number().default(5432),
  PG_USER: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  PG_PASSWORD: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  PG_DATABASE: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DATABASE_URL: Joi.string().optional(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().default('redis123'),
  REDIS_USERNAME: Joi.string().optional(),

  // JWT
  SECRET_TOKEN: Joi.string(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),

  // Email
  GOOGLE_SENDER: Joi.string().email().required(),
  GOOGLE_PASSWORD: Joi.string().required(),

  // Security
  SALT_ROUNDS: Joi.number().min(10).default(12),
  ALLOWED_ORIGINS: Joi.string().optional(),
  ADMIN_IP_WHITELIST: Joi.string().optional(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  // Gemini AI (for embeddings only)
  GEMINI_API_KEY: Joi.string().when('GEMINI_API_KEYS', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }), // Deprecated, use GEMINI_API_KEYS instead
  GEMINI_API_KEYS: Joi.string().optional(), // Comma-separated list of API keys
  GEMINI_MODEL: Joi.string().default('gemini-1.5-flash'),

  // Groq AI (for chatbot responses)
  GROQ_API_KEY: Joi.string().required(),
  GROQ_MODEL: Joi.string().default('llama-3.3-70b-versatile'),

  // Company Info
  COMPANY_NAME: Joi.string().required(),
  COMPANY_TAX_CODE: Joi.string().required(),
  COMPANY_ADDRESS: Joi.string().required(),
  COMPANY_PHONE: Joi.string().required(),
  COMPANY_EMAIL: Joi.string().email().required(),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  pg: {
    host: envVars.PG_HOST,
    port: envVars.PG_PORT,
    user: envVars.PG_USER,
    password: envVars.PG_PASSWORD,
    database: envVars.PG_DATABASE,
    url: envVars.DATABASE_URL,
  },
  redisCache: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
  },
  redisQueue: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT + 1,
    password: envVars.REDIS_PASSWORD,
  },
  saltRounds: envVars.SALT_ROUNDS,
  jwtRefreshTokenExpiresIn: envVars.JWT_REFRESH_TOKEN_EXPIRES_IN,
  jwtAccessTokenExpiresIn: envVars.JWT_ACCESS_TOKEN_EXPIRES_IN,
  secretToken: envVars.SECRET_TOKEN,
  email: {
    user: envVars.GOOGLE_SENDER,
    password: envVars.GOOGLE_PASSWORD,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    username: envVars.REDIS_USERNAME,
  },
  vnpay: {
    tmnCode: envVars.VNPAY_TMN_CODE,
    secretKey: envVars.VNPAY_SECRET_KEY,
    url: envVars.VNPAY_URL,
    vnpayVersion: envVars.VNPAY_VERSION,
    vnpayApi: envVars.VNPAY_API,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  gemini: {
    apiKey: envVars.GEMINI_API_KEY, // Deprecated - use apiKeys array instead
    apiKeys: envVars.GEMINI_API_KEYS
      ? envVars.GEMINI_API_KEYS.split(',').map((k: string) => k.trim())
      : envVars.GEMINI_API_KEY
      ? [envVars.GEMINI_API_KEY.trim()]
      : [],
    model: envVars.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  groq: {
    apiKey: envVars.GROQ_API_KEY,
    model: envVars.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  companyInfo: {
    name: envVars.COMPANY_NAME,
    taxCode: envVars.COMPANY_TAX_CODE,
    address: envVars.COMPANY_ADDRESS,
    phone: envVars.COMPANY_PHONE,
    email: envVars.COMPANY_EMAIL,
  },
};
