import { Hono } from 'hono';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  resolvePublicShareLink,
  getPublicConversationHistory,
  ShareLinkError,
} from '../services/shareLink.service.js';
import { semanticSearch } from '../services/search.service.js';
import { prepareRagRequest, saveMessageExchange } from '../services/chat.service.js';
import { env } from '../config/env.js';
import { streamSSE } from 'hono/streaming';

const publicRoutes = new Hono();

publicRoutes.use('*', rateLimit({ windowSeconds: 60, maxRequests: 10 }));

publicRoutes.get('/share/:token', async (c) => {
  const token = c.req.param('token');

  try {
    const { shareLink, document } = await resolvePublicShareLink(token);
    const history = await getPublicConversationHistory(document._id.toString());

    return c.json({
      title: document.title,
      summary: document.summary,
      sourceType: document.sourceType,
      allowChat: shareLink.allowChat,
      history,
    });
  } catch (err) {
    if (err instanceof ShareLinkError) {
      return c.json({ error: err.message }, err.statusCode as 404 | 410);
    }
    throw err;
  }
});

const publicMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

publicRoutes.post('/share/:token/message', validateBody(publicMessageSchema), async (c) => {
  const token = c.req.param('token');
  const { message } = c.get('validatedBody' as never) as z.infer<typeof publicMessageSchema>;

  let resolved;
  try {
    resolved = await resolvePublicShareLink(token);
  } catch (err) {
    if (err instanceof ShareLinkError) {
      return c.json({ error: err.message }, err.statusCode as 404 | 410);
    }
    throw err;
  }

  const { shareLink, document } = resolved;

  if (!shareLink.allowChat) {
    return c.json({ error: 'Chat is not enabled for this shared link' }, 403);
  }

  let prepared;
  try {
  
    prepared = await prepareRagRequest({
      userId: document.userId.toString(),
      documentId: document._id.toString(),
      userMessage: message,
    });
  } catch (err) {
    return c.json({ error: 'Unable to process this question right now' }, 500);
  }

  const { conversation, ollamaMessages, citedChunks } = prepared;

  return streamSSE(c, async (stream) => {
    let fullResponse = '';

    try {
      const res = await fetch(`${env.AI_WORKER_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ messages: ollamaMessages }),
      });

      if (!res.ok || !res.body) {
        await stream.writeSSE({ event: 'error', data: 'AI worker request failed' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice('data: '.length);

          if (data === '[DONE]') {
            await stream.writeSSE({ event: 'done', data: 'done' });
            continue;
          }

          fullResponse += data;
          await stream.writeSSE({ event: 'token', data });
        }
      }
    } catch (err) {
      await stream.writeSSE({
        event: 'error',
        data: err instanceof Error ? err.message : 'Streaming failed',
      });
    } finally {
      if (fullResponse.trim().length > 0) {
        await saveMessageExchange(conversation, message, fullResponse, citedChunks).catch(() => {});
      }
    }
  });
});

export default publicRoutes;