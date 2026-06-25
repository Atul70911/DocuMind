import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createShareLink,
  revokeShareLink,
  listShareLinksForDocument,
  ShareLinkError,
} from '../services/shareLink.service.js';

const shareLinks = new Hono();

shareLinks.use('*', authMiddleware);

const createSchema = z.object({
  documentId: z.string(),
  allowChat: z.boolean().optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

shareLinks.post('/', validateBody(createSchema), async (c) => {
  const userId = c.get('userId');
  const input = c.get('validatedBody' as never) as z.infer<typeof createSchema>;

  try {
    const shareLink = await createShareLink({ ...input, userId });
    return c.json(shareLink, 201);
  } catch (err) {
    if (err instanceof ShareLinkError) {
      return c.json({ error: err.message }, err.statusCode as 404 | 409);
    }
    throw err;
  }
});

shareLinks.get('/document/:documentId', async (c) => {
  const userId = c.get('userId');
  const documentId = c.req.param('documentId');

  try {
    const links = await listShareLinksForDocument(documentId, userId);
    return c.json({ shareLinks: links });
  } catch (err) {
    if (err instanceof ShareLinkError) {
      return c.json({ error: err.message }, err.statusCode as 404);
    }
    throw err;
  }
});

shareLinks.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const shareLinkId = c.req.param('id');

  try {
    await revokeShareLink(shareLinkId, userId);
    return c.json({ message: 'Share link revoked' });
  } catch (err) {
    if (err instanceof ShareLinkError) {
      return c.json({ error: err.message }, err.statusCode as 404);
    }
    throw err;
  }
});

export default shareLinks;