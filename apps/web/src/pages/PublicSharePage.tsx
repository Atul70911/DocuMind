import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect, type FormEvent } from 'react';

interface PublicDocumentView {
  title: string;
  summary?: string;
  sourceType: string;
  allowChat: boolean;
  history: { role: 'user' | 'assistant'; content: string }[];
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-share', token],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/public/share/${token}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'This link is not available');
      }
      return res.json() as Promise<PublicDocumentView>;
    },
  });

  useEffect(() => {
    if (data?.history) setMessages(data.history);
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/public/share/${token}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(body.error);
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
          const dataLine = rawEvent.split('\n').find((l) => l.startsWith('data: '));
          const eventLine = rawEvent.split('\n').find((l) => l.startsWith('event: '));
          if (!dataLine) continue;

          const data = dataLine.slice('data: '.length);
          if (eventLine?.includes('token')) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: last.content + data };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong' },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="public-share__error">{error instanceof Error ? error.message : 'Not found'}</p>;
  if (!data) return null;

  return (
    <div className="public-share-page">
      <header>
        <h1>{data.title}</h1>
        <p className="public-share__badge">Shared via DocuMind</p>
      </header>

      {data.summary && (
        <div className="public-share__summary">
          <h2>Summary</h2>
          <p>{data.summary}</p>
        </div>
      )}

      {data.allowChat ? (
        <div className="public-share__chat">
          <div className="public-share__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message-bubble message-bubble--${msg.role}`}>
                {msg.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this document..."
              disabled={isStreaming}
            />
            <button type="submit" disabled={isStreaming || !input.trim()}>
              {isStreaming ? 'Thinking...' : 'Ask'}
            </button>
          </form>
        </div>
      ) : (
        <p className="public-share__readonly-notice">
          This is a read-only view. The owner has not enabled questions for this link.
        </p>
      )}
    </div>
  );
}