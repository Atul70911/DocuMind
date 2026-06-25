import { cors } from 'hono/cors';
import { env } from '../config/env.js';

const allowedOrigins =
  env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // replace with your real production domain later
    : ['http://localhost:5173', 'http://localhost:80', 'http://localhost'];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  credentials: true,
  exposeHeaders: ['x-correlation-id'],
});