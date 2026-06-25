import { pino } from 'pino';
import type { MiddlewareHandler } from 'hono';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
});

// Augment Hono's context so c.get('correlationId') and c.get('log') are typed
declare module 'hono' {
  interface ContextVariableMap {
    correlationId: string;
    log: typeof logger;
  }
}

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const correlationId = c.req.header('x-correlation-id') ?? randomUUID();
  const start = Date.now();

  // Attach a child logger with correlationId baked into every line
  const requestLog = logger.child({ correlationId });

  c.set('correlationId', correlationId);
  c.set('log', requestLog);

  requestLog.info({ method: c.req.method, path: c.req.path }, 'request started');

  await next();

  const duration = Date.now() - start;
  requestLog.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, duration },
    'request completed'
  );

  // Echo the correlation ID back so clients (or load balancers) can trace it
  c.res.headers.set('x-correlation-id', correlationId);
};