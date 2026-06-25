import type { MiddlewareHandler } from 'hono';
import { redis } from '../lib/redis.js';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
}
const RATE_LIMIT_SCRIPT = `
  local current = redis.call("INCR", KEYS[1])
  if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  return current
`;



export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {

    const userId = c.get('userId' as never) as string | undefined;
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const identifier = userId ?? ip;

    const key = `ratelimit:${c.req.path}:${identifier}`;

    const current = (await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      key,
      options.windowSeconds.toString()
    )) as number;


    if (current > options.maxRequests) {
      const log = c.get('log' as never);
      log?.warn?.({ identifier, path: c.req.path }, 'rate limit exceeded');
        c.res.headers.set('Retry-After', options.windowSeconds.toString());
      return c.json(
        { error: 'Too many requests, please try again later' },
        429
      );
    }

    await next();
  };
}