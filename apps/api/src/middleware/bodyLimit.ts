import { bodyLimit } from 'hono/body-limit';

export const globalBodyLimit = bodyLimit({
  maxSize: 1024 * 1024,
  onError: (c) => {
    return c.json({ error: 'Request body too large' }, 413);
  },
});