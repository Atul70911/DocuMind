import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  uploadDocument,
  ingestUrl,
  getDocumentById,
  listUserDocuments,
  DocumentError,
  deleteDocument
} from '../services/document.service.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { getFileUrl } from '../lib/storage.js';

const documents = new Hono();

documents.use('*', authMiddleware);
documents.use('/upload', rateLimit({ windowSeconds: 3600, maxRequests: 20 }));
documents.use('/ingest-url', rateLimit({ windowSeconds: 3600, maxRequests: 20 }));

const ingestUrlSchema = z.object({
  url: z.string().url(),
});

documents.post('/upload', async (c) => {
  const userId = c.get('userId');

  const body = await c.req.parseBody();
  const file = body['file'];

  if (!(file instanceof File)) {
    return c.json({ error: 'No file provided under "file" field' }, 400);
  }

  try {
    const document = await uploadDocument({ userId, file });

    return c.json(
      {
        documentId: document._id,
        status: document.status,
        message: 'Document received and queued for processing',
      },
      202
    );
  } catch (err) {
    if (err instanceof DocumentError) {
      return c.json({ error: err.message }, err.statusCode as 400 | 413 | 415);
    }
    throw err;
  }
});

documents.post('/ingest-url', validateBody(ingestUrlSchema), async (c) => {
  const userId = c.get('userId');
  const { url } = c.get('validatedBody' as never) as z.infer<typeof ingestUrlSchema>;

  try {
    const document = await ingestUrl({ userId, url });

    return c.json(
      {
        documentId: document._id,
        status: document.status,
        message: 'URL received and queued for processing',
      },
      202
    );
  } catch (err) {
    if (err instanceof DocumentError) {
      return c.json({ error: err.message }, err.statusCode as 400);
    }
    throw err;
  }
});

documents.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const documentId = c.req.param('id');

  try {
    await deleteDocument(documentId, userId);
    return c.json({ message: 'Document deleted successfully' }, 200);
  } catch (err) {
    if (err instanceof DocumentError) {
      return c.json({ error: err.message }, err.statusCode as 404);
    }
    throw err;
  }
});

documents.get('/', async (c) => {
  const userId = c.get('userId');
  const docs = await listUserDocuments(userId);
  return c.json(docs);
});

documents.get('/:id/download-url', async (c) => {
  const userId = c.get('userId');
  const documentId = c.req.param('id');

  try {
    const document = await getDocumentById(documentId, userId);

    if (!document.storageKey) {
      return c.json({ error: 'No file available for this document' }, 404);
    }

    const url = await getFileUrl(document.storageKey, 3600); // 1 hour expiry
    return c.json({ url, expiresIn: 3600 });
  } catch (err) {
    if (err instanceof DocumentError) {
      return c.json({ error: err.message }, err.statusCode as 404);
    }
    throw err;
  }
});

documents.post('/:id/retry-summary', async (c) => {
  const userId = c.get('userId');
  const documentId = c.req.param('id');

  try {
    const summary = await retrySummary(documentId, userId);
    return c.json({ summary });
  } catch (err) {
    if (err instanceof DocumentError) {
      return c.json({ error: err.message }, err.statusCode as 404 | 409);
    }
    throw err;
  }
});

export default documents;