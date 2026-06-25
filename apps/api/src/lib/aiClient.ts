// lib/aiClient.ts
import { env } from '../config/env.js';

const AI_WORKER_BASE = env.AI_WORKER_URL;

export class AIWorkerError extends Error {
  constructor(message: string, public statusCode: number = 502) {
    super(message);
    this.name = 'AIWorkerError';
  }
}
async function request<T>(path: string, body: unknown): Promise<T> {
   let res: Response;

  try {
    res = await fetch(`${AI_WORKER_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.INTERNAL_API_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AIWorkerError('AI worker is unreachable', 503);
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new AIWorkerError(`AI worker request failed (${res.status}): ${errorText}`, 502)
  }

  return res.json() as Promise<T>;
}



export const aiClient = {
  embed: (texts: string[]) =>
    request<{ embeddings: number[][] }>('/embed', {
      method: 'POST',
      body: JSON.stringify({ texts }),
    }),

  transcribe: (audioUrl: string) =>
    request<{ text: string }>('/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioUrl }),
    }),

  parse: (fileUrl: string) =>
    request<{ markdown: string }>('/parse', {
      method: 'POST',
      body: JSON.stringify({ fileUrl }),
    }),

};