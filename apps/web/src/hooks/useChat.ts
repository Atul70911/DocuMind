import { useState, useCallback, useRef } from 'react';
import { getAccessToken } from '../services/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citedChunks?: { documentId: string; chunkIndex: number }[];
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function useChat(documentId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadHistory = useCallback(async () => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/chat/${documentId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
  }, [documentId]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = getAccessToken();
        const res = await fetch(`${API_BASE}/chat/${documentId}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: userMessage }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({ error: 'Chat request failed' }));
          throw new Error(body.error || 'Chat request failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const rawEvent of events) {
            const lines = rawEvent.split('\n');
            const eventLine = lines.find((l) => l.startsWith('event: '));
            const dataLine = lines.find((l) => l.startsWith('data: '));

            const eventType = eventLine?.slice('event: '.length);
            const data = dataLine?.slice('data: '.length) ?? '';

            if (eventType === 'token') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, content: last.content + data };
                return updated;
              });
            } else if (eventType === 'error') {
              throw new Error(data);
            }
            // 'done' event needs no handling — the loop just ends naturally
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Streaming failed');
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [documentId]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, sendMessage, isStreaming, error, loadHistory, stopStreaming };
}