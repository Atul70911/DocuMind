import Redis from 'ioredis';
import { env } from '../config/env.js';

export const redisConnectionOptions = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port) || 6379,
  password: new URL(env.REDIS_URL).password || undefined,
  maxRetriesPerRequest: null, // required by BullMQ — don't change this
};

// App-level client for non-BullMQ uses (rate limiting, etc.)
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));