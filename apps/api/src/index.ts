import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { redis } from './lib/redis.js';
import { env } from './config/env.js';
import { connectDB } from './lib/db.js';
import {ensureBucketExists} from './lib/storage.js'
import { WebSocketServer, type WebSocket } from 'ws';


import { globalBodyLimit } from './middleware/bodyLimit.js';
import { requestLogger } from './middleware/logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import healthRoutes from './routes/health.routes.js';
import { documentQueue } from './queues/document.queue.js';
import searchRoutes from './routes/search.routes.js';
import chatRoutes from './routes/chat.routes.js';

import shareLinkRoutes from './routes/shareLink.routes.js';
import publicRoutes from './routes/public.routes.js';


import mongoose from 'mongoose';
import { AccessTokenPayload } from './utils/jwt.js';




const app = new Hono();
let server: ReturnType<typeof serve>;

app.use('*', corsMiddleware);
app.use('*', requestLogger);
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/documents/upload') {
    return next();
  }
  return globalBodyLimit(c, next);
});
app.onError(errorHandler);
app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/api/auth', authRoutes);
app.route('/api/documents', documentRoutes);
app.route('/health', healthRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/chat', chatRoutes);


app.route('/api/share-links', shareLinkRoutes);
app.route('/api/public', publicRoutes);



async function main() {
  await connectDB();
  await ensureBucketExists();

  const server = serve({ fetch: app.fetch, port: env.PORT });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '', `http://${request.headers.host}`);

    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get('token');

    if (!token) {
      socket.destroy();
      return;
    }

    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    } catch {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      registerConnection(payload.userId, ws);

      ws.on('close', () => {
        removeConnection(payload.userId, ws);
      });

      ws.on('error', () => {
        removeConnection(payload.userId, ws);
      });
    });
  });

  console.log(`🚀 Server running on port ${env.PORT}`);
}

main();

async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully...`);

  server?.close();
  await documentQueue.close();
  await mongoose.connection.close();
  await redis.quit();

  console.log('✅ Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));