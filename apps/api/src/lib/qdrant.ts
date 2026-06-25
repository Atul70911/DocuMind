import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env.js';

export const qdrant = new QdrantClient({
  url: env.QDRANT_URL,
});

export async function ensureCollection(collectionName: string, vectorSize: number) {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === collectionName);

  if (!exists) {
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });
    await qdrant.createPayloadIndex(collectionName, {
      field_name: 'userId',
      field_schema: 'keyword',
    });

    await qdrant.createPayloadIndex(collectionName, {
      field_name: 'documentId',
      field_schema: 'keyword',
    });
    console.log(`✅ Qdrant collection "${collectionName}" created`);
  }
}