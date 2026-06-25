import type { ChatMessage } from '../../hooks/useChat';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-bubble message-bubble--${isUser ? 'user' : 'assistant'}`}>
      <div className="message-bubble__content">
        {message.content || (!isUser && <span className="message-bubble__cursor" />)}
      </div>

      {message.citedChunks && message.citedChunks.length > 0 && (
        <div className="message-bubble__citations">
          Sources: {message.citedChunks.map((c) => `Chunk ${c.chunkIndex}`).join(', ')}
        </div>
      )}
    </div>
  );
}