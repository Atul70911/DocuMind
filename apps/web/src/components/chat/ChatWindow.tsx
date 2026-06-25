import { useEffect, useRef, type FormEvent } from 'react';
import { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { MessageBubble } from './MessageBubble';

export function ChatWindow({ documentId, documentStatus }: { documentId: string; documentStatus: string }) {
  const { messages, sendMessage, isStreaming, error, loadHistory, stopStreaming } = useChat(documentId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput('');
  }

  const isReady = documentStatus === 'ready';

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length === 0 && (
          <p className="chat-window__empty">
            {isReady
              ? 'Ask a question about this document to get started.'
              : `This document is still processing (${documentStatus}). Chat will be available once it's ready.`}
          </p>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {error && <p className="chat-window__error" role="alert">{error}</p>}

        <div ref={bottomRef} />
      </div>

      <form className="chat-window__input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isReady ? 'Ask a question...' : 'Document not ready yet'}
          disabled={!isReady || isStreaming}
        />

        {isStreaming ? (
          <button type="button" onClick={stopStreaming}>
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!isReady || !input.trim()}>
            Send
          </button>
        )}
      </form>
    </div>
  );
}