import Redis from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ — don't change this
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});