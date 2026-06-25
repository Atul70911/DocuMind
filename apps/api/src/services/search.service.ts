import { qdrant } from '../lib/qdrant.js';
import { aiClient } from '../lib/aiClient.js';
import { DocumentModel } from '../models/document.model.js';

const COLLECTION_NAME = 'document_chunks';

export interface SearchResult {
  documentId: string;
  documentTitle: string;
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

  if (results.length === 0) return [];


  const documentIds = [...new Set(results.map((r) => r.payload?.documentId as string))];
  const documents = await DocumentModel.find({ _id: { $in: documentIds } }, 'title');

  const titleMap = new Map(documents.map((d) => [d._id.toString(), d.title]));

  return results.map((r) => {
    const docId = r.payload?.documentId as string;
    return {
      documentId: docId,
      documentTitle: titleMap.get(docId) ?? 'Unknown document',
      chunkIndex: r.payload?.chunkIndex as number,
      text: r.payload?.text as string,
      score: r.score,
    };
  });
}