import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
  const log = c.get('log');
  log?.error?.({ err }, 'unhandled error');

  if (err instanceof ZodError) {
    return c.json(
      { error: 'Validation failed', details: err.flatten().fieldErrors },
      400
    );
  }

  // Don't leak internal error details in production
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return c.json({ error: message }, 500);
};