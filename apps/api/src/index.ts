import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { env } from './config/env.js';
import { connectDB } from './lib/db.js';
import { redis } from './lib/redis.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

async function main() {
  await connectDB();

  serve({
    fetch: app.fetch,
    port: env.PORT,
  });

  console.log(`🚀 Server running on port ${env.PORT}`);
}

main();