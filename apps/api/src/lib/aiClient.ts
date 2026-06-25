// lib/aiClient.ts
import { env } from '../config/env.js';

const AI_WORKER_BASE = env.AI_WORKER_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${AI_WORKER_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Api-Key': env.INTERNAL_API_KEY, // shared secret
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AI worker request failed (${res.status}): ${errorText}`);
  }

  return res.json() as Promise<T>;
}

// ...rest unchanged

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

  // chat is streamed (SSE) so it's handled separately in chat.service.ts later, not here
};