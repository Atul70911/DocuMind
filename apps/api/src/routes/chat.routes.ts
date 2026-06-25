import { Hono } from 'hono';
import { z } from 'zod';
import { streamSSE } from 'hono/streaming';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  prepareRagRequest,
  saveMessageExchange,
  getConversationHistory,
  ChatError,
} from '../services/chat.service.js';
import { env } from '../config/env.js';

const chat = new Hono();

chat.use('*', authMiddleware);
chat.use('/:documentId/message', rateLimit({ windowSeconds: 60, maxRequests: 20 }));

const sendMessageSchema = z.object({
  message: z.string().min(1, 'message is required').max(4000, 'message too long'),
});

chat.post('/:documentId/message', validateBody(sendMessageSchema), async (c) => {
  const userId = c.get('userId');
  const documentId = c.req.param('documentId');
  const { message } = c.get('validatedBody' as never) as z.infer<typeof sendMessageSchema>;

  let prepared;
  try {
    prepared = await prepareRagRequest({ userId, documentId, userMessage: message });
  } catch (err) {
    if (err instanceof ChatError) {
      return c.json({ error: err.message }, err.statusCode as 404 | 409);
    }
    throw err;
  }

  const { conversation, ollamaMessages, citedChunks } = prepared;

  return streamSSE(c, async (stream) => {
    let fullResponse = '';
    let streamCompleted = false;
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

     
      streamCompleted = true;
    } catch (err) {
      await stream.writeSSE({
        event: 'error',
        data: err instanceof Error ? err.message : 'Streaming failed',
      });
    }
    finally {
      if (fullResponse.trim().length > 0) {
        await saveMessageExchange(conversation, message, fullResponse, citedChunks).catch(
          (err) => {
            console.error('Failed to save message exchange after stream interruption', err);
          }
        );
      }
    }
  });
});

chat.get('/:documentId/history', async (c) => {
  const userId = c.get('userId');
  const documentId = c.req.param('documentId');

  const history = await getConversationHistory(documentId, userId);
  return c.json({ messages: history });
});

export default chat;