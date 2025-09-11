import Redis from 'ioredis';
import { config } from './env';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export async function initRedis(): Promise<void> {
  try {
    await redis.connect();
    console.log('Redis connected');
  } catch (error) {
    console.error('Redis connection error', error);
    process.exit(1);
  }
}

export default redis;
