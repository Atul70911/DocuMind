import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const search = useSearch();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    search.mutate({ query: query.trim() });
  }

  return (
    <div className="search-page">
      <h1>Search your documents</h1>

      <form onSubmit={handleSubmit} className="search-page__form">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by meaning, not just keywords..."
          autoFocus
        />
        <button type="submit" disabled={search.isPending}>
          {search.isPending ? 'Searching...' : 'Search'}
        </button>
      </form>

      {search.isError && (
        <p className="search-page__error" role="alert">
          {search.error instanceof Error ? search.error.message : 'Search failed'}
        </p>
      )}

      {search.isSuccess && search.data.results.length === 0 && (
        <p className="search-page__empty">No matching content found.</p>
      )}

      {search.isSuccess && search.data.results.length > 0 && (
        <ul className="search-page__results">
          {search.data.results.map((result, i) => (
            <li key={i} className="search-result">
              <Link to={`/chat/${result.documentId}`} className="search-result__title">
                {result.documentTitle}
              </Link>
              <p className="search-result__excerpt">{result.text}</p>
              <span className="search-result__meta">
                Chunk {result.chunkIndex} · {Math.round(result.score * 100)}% match
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}