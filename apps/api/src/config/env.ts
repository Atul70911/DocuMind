import {z} from 'zod';

const envSchema=z.object({
    NODE_ENV:z.enum(['development','production','test']).default('development'),
    PORT:z.coerce.number().default(3001),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  QDRANT_URL: z.string().min(1, 'QDRANT_URL is required'),
  AI_WORKER_URL: z.string().min(1, 'AI_WORKER_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data; 