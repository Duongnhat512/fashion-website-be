import dotenv from 'dotenv';
import type { StringValue } from 'ms';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 3000,
  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: process.env.PG_DATABASE || 'postgres',
  },
  redisCache: {
    host: process.env.REDIS_CACHE_HOST || 'localhost',
    port: Number(process.env.REDIS_CACHE_PORT) || 6379,
  },
  redisQueue: {
    host: process.env.REDIS_QUEUE_HOST || 'localhost',
    port: Number(process.env.REDIS_QUEUE_PORT) || 6380,
  },
  saltRounds: Number(process.env.SALT_ROUNDS) || 10,
  jwtRefreshTokenExpiresIn:
    (process.env.JWT_REFRESH_TOKEN_EXPIRES_IN as StringValue) || '7d',
  jwtAccessTokenExpiresIn:
    (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN as StringValue) || '15d',
  secretToken: process.env.SECRET_TOKEN,
};
