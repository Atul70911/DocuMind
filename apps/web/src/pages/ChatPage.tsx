import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useRetrySummary } from '../hooks/useDocuments';
import type { DocumentItem } from '../hooks/useDocuments';

export function ChatPage() {
  const { documentId } = useParams<{ documentId: string }>();

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => api.get<DocumentItem & { summary?: string }>(`/documents/${documentId}`),
    enabled: !!documentId,
    refetchInterval: (query) => (query.state.data?.status === 'ready' ? false : 3000),
  });

  const retrySummary = useRetrySummary(documentId ?? '');

  if (isLoading) return <p>Loading...</p>;
  if (!document || !documentId) return <p>Document not found</p>;

  return (
    <div className="chat-page">
      <header className="chat-page__header">
        <h1>{document.title}</h1>
        <span className={`status-badge status-badge--${document.status}`}>
          {document.status}
        </span>
      </header>

      {document.status === 'ready' && (
        <div className="chat-page__summary">
          {document.summary ? (
            <>
              <h2>Summary</h2>
              <p>{document.summary}</p>
            </>
          ) : (
            <div className="chat-page__summary-unavailable">
              <p>Summary unavailable for this document — you can still chat and search below.</p>
              <button onClick={() => retrySummary.mutate()} disabled={retrySummary.isPending}>
                {retrySummary.isPending ? 'Generating...' : 'Try generating summary again'}
              </button>
              {retrySummary.isError && (
                <p className="chat-page__summary-error" role="alert">
                  Failed to generate summary. Please try again.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <ChatWindow documentId={documentId} documentStatus={document.status} />
    </div>
  );
}