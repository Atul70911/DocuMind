import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ChatWindow } from '../components/chat/ChatWindow';
import type { DocumentItem } from '../hooks/useDocuments';

export function ChatPage() {
  const { documentId } = useParams<{ documentId: string }>();

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => api.get<DocumentItem>(`/documents/${documentId}`),
    enabled: !!documentId,
    refetchInterval: (query) => (query.state.data?.status === 'ready' ? false : 3000),
  });

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

      <ChatWindow documentId={documentId} documentStatus={document.status} />
    </div>
  );
}