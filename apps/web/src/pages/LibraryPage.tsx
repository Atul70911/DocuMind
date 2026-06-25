import { Link } from 'react-router-dom';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { UploadCard } from '../components/documents/UploadCard';
import { useAuth } from '../hooks/useAuth';

export function LibraryPage() {
  const { data, isLoading } = useDocuments();
  const deleteDoc = useDeleteDocument();
  const { logout } = useAuth();

  return (
    <div className="library-page">
      <header className="library-page__header">
        <h1>Your Documents</h1>
        <button onClick={logout}>Log out</button>
      </header>

      <UploadCard />

      {isLoading ? (
        <p>Loading documents...</p>
      ) : data?.documents.length === 0 ? (
        <p className="library-page__empty">No documents yet. Upload one to get started.</p>
      ) : (
        <ul className="library-page__list">
          {data?.documents.map((doc) => (
            <li key={doc._id} className="document-card">
              <Link to={`/chat/${doc._id}`}>
                <span>{doc.title}</span>
                <span className={`status-badge status-badge--${doc.status}`}>{doc.status}</span>
              </Link>
              <button onClick={() => deleteDoc.mutate(doc._id)} aria-label={`Delete ${doc.title}`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}