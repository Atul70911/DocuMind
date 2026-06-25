import type { MiddlewareHandler } from 'hono';
import type { z } from 'zod';

export function validateBody<T extends z.ZodType>(schema: T): MiddlewareHandler {
  return async (c, next) => {
    const body = await c.req.json().catch(() => null);

    if (body === null) {
      return c.json({ error: 'Invalid or missing JSON body' }, 400);
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        400
      );
    }

    // Stash the parsed, type-safe body for the route handler to use
    c.set('validatedBody' as never, result.data as never);

    await next();
  };
}