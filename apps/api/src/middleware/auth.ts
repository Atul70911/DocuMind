import type { MiddlewareHandler } from 'hono';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JWTPayload {
  userId: string;
  email: string;
}

// Extend Hono's context so c.get('userId') / c.get('userEmail') are typed everywhere
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);

    await next();
  } catch (err) {
    const log = c.get('log');
    log?.warn?.({ err }, 'JWT verification failed');

    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};