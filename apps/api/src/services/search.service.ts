import { qdrant } from '../lib/qdrant.js';
import { aiClient } from '../lib/aiClient.js';

const COLLECTION_NAME = 'document_chunks';

export interface SearchResult {
  documentId: string;
  chunkIndex: number;
  text: string;
  score: number;
}

interface SemanticSearchOptions {
  userId: string;
  query: string;
  documentId?: string;
  limit?: number;
}

export async function semanticSearch(options: SemanticSearchOptions): Promise<SearchResult[]> {
  const { userId, query, documentId, limit = 5 } = options;

  const { embeddings } = await aiClient.embed([query]);
  const queryVector = embeddings[0];

  const filter: Record<string, unknown> = {
    must: [{ key: 'userId', match: { value: userId } }],
  };

  if (documentId) {
    (filter.must as unknown[]).push({ key: 'documentId', match: { value: documentId } });
  }

  const results = await qdrant.search(COLLECTION_NAME, {
    vector: queryVector,
    filter,
    limit,
    with_payload: true,
  });

  return results.map((r) => ({
    documentId: r.payload?.documentId as string,
    chunkIndex: r.payload?.chunkIndex as number,
    text: r.payload?.text as string,
    score: r.score,
  }));
}