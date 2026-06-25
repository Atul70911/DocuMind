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
} from '../services/document.service.js';

const documents = new Hono();

documents.use('*', authMiddleware);

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

documents.get('/:id', async (c) => {
  const userId = c.get('userId');
  const documentId = c.req.param('id');

  try {
    const document = await getDocumentById(documentId, userId);
    return c.json(document);
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

export default documents;