import Redis from 'ioredis';
import { config } from './env';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  username: config.redis.username,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export async function initRedis(): Promise<void> {
  try {
    if (redis.status === 'ready') {
      console.log('Redis already connected');
      return;
    }
    
    if (redis.status === 'connecting') {
      console.log('Redis is connecting, waiting...');
      await new Promise((resolve) => {
        redis.once('ready', resolve);
        redis.once('error', resolve);
      });
      return;
    }
    
    await redis.connect();
    console.log('Redis connected');
  } catch (error: any) {
    if (
      error.message?.includes('already connecting') ||
      error.message?.includes('already connected')
    ) {
      console.log('Redis connection already established');
      return;
    }
    console.error('Redis connection error', error);
  }
}

export default redis;
