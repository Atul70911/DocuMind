import type { MiddlewareHandler } from 'hono';
import { redis } from '../lib/redis.js';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
}



export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    // Prefer authenticated user ID if available, else fall back to IP
    const userId = c.get('userId' as never) as string | undefined;
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const identifier = userId ?? ip;

    const key = `ratelimit:${c.req.path}:${identifier}`;

    const current = await redis.incr(key);

    if (current === 1) {
      // First request in this window — set expiry
      await redis.expire(key, options.windowSeconds);
    }

    if (current > options.maxRequests) {
      const log = c.get('log' as never);
      log?.warn?.({ identifier, path: c.req.path }, 'rate limit exceeded');

      return c.json(
        { error: 'Too many requests, please try again later' },
        429
      );
    }

    await next();
  };
}