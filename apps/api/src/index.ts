import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { env } from './config/env.js';
import { connectDB } from './lib/db.js';

import { requestLogger } from './middleware/logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';

const app = new Hono();

app.use('*', corsMiddleware);
app.use('*', requestLogger);
app.onError(errorHandler);
app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/api/auth', authRoutes);


async function main() {
  await connectDB();

  serve({
    fetch: app.fetch,
    port: env.PORT,
  });

  console.log(`🚀 Server running on port ${env.PORT}`);
}

main();