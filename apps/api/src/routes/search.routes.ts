import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { semanticSearch } from '../services/search.service.js';

const search = new Hono();

search.use('*', authMiddleware);
search.use('*', rateLimit({ windowSeconds: 60, maxRequests: 30 }));

const searchSchema = z.object({
  query: z.string().min(1, 'query is required').max(1000, 'query too long'),
  documentId: z.string().optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

search.post('/', validateBody(searchSchema), async (c) => {
  const userId = c.get('userId');
  const { query, documentId, limit } = c.get('validatedBody' as never) as z.infer<typeof searchSchema>;

  const results = await semanticSearch({ userId, query, documentId, limit });

  return c.json({ results });
});

export default search;