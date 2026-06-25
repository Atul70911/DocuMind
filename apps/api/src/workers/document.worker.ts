// workers/document.worker.ts
import { Worker, type Job } from 'bullmq';
import { redis } from '../lib/redis.js';
import { DocumentModel } from '../models/document.model.js';
import type { DocumentJobData } from '../queues/document.queue.js';
import { aiClient, AIWorkerError } from '../lib/aiClient.js';
import { getFileUrl } from '../lib/storage.js';
import { chunkText } from '../utils/chunking.js';
import { qdrant, ensureCollection } from '../lib/qdrant.js';
import { pino } from 'pino';
import { sendToUser } from '../lib/wsManager.js';

const logger = pino({ name: 'document-worker' });

const EMBEDDING_DIMENSIONS = 384;
const COLLECTION_NAME = 'document_chunks';
const EMBED_BATCH_SIZE = 20;

async function fetchSourceText(document: InstanceType<typeof DocumentModel>): Promise<string> {
    if (document.sourceType === 'pdf' || document.sourceType === 'docx') {
        const fileUrl = await getFileUrl(document.storageKey, 600);
        const result = await aiClient.parse(fileUrl);
        return result.markdown;
    }

    if (document.sourceType === 'audio' || document.sourceType === 'video') {
        const fileUrl = await getFileUrl(document.storageKey, 600);
        const result = await aiClient.transcribe(fileUrl);
        return result.text;
    }

    if (document.sourceType === 'url') {

        const res = await fetch(document.sourceUrl!);
        if (!res.ok) {
            throw new Error(`Failed to fetch URL: ${res.status}`);
        }
        return res.text();
    }

    throw new Error(`Unsupported source type: ${document.sourceType}`);
}

async function processDocument(job: Job<DocumentJobData>) {
    const { documentId } = job.data;
    const log = logger.child({ jobId: job.id, documentId });

    const document = await DocumentModel.findById(documentId);

    if (!document) {
        log.error('document not found, skipping job');
        return;
    }

    try {
        document.status = 'parsing';
        await document.save();
        sendToUser(document.userId.toString(), {
            type: 'document-status',
            documentId: document._id.toString(),
            status: 'parsing',
        });
        log.info('stage: parsing');

        const sourceText = await fetchSourceText(document);

        if (!sourceText || sourceText.trim().length === 0) {
            throw new Error('No extractable text content found in document');
        }

        document.status = 'embedding';
        await document.save();
        log.info('stage: embedding');

        const chunks = chunkText(sourceText);
        log.info({ chunkCount: chunks.length }, 'text chunked');

        if (chunks.length === 0) {
            throw new Error('Chunking produced no usable chunks');
        }

        await ensureCollection(COLLECTION_NAME, EMBEDDING_DIMENSIONS);

        for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
            const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
            const texts = batch.map((c) => c.text);

            const { embeddings } = await aiClient.embed(texts);

            const points = batch.map((chunk, j) => ({
                id: `${documentId}-${chunk.index}`,
                vector: embeddings[j],
                payload: {
                    documentId,
                    userId: document.userId.toString(),
                    chunkIndex: chunk.index,
                    text: chunk.text,
                },
            }));

            await qdrant.upsert(COLLECTION_NAME, { points });
            log.info({ batchStart: i, batchSize: batch.length }, 'batch embedded and stored');
        }

        document.status = 'ready';
        await document.save();
        log.info('stage: ready');
    } catch (err) {
        document.status = 'failed';
        document.errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await document.save();

        if (err instanceof AIWorkerError) {
            log.error({ err, statusCode: err.statusCode }, 'AI worker error during processing');
        } else {
            log.error({ err }, 'processing failed');
        }

        throw err;
    }
}

export const documentWorker = new Worker<DocumentJobData>(
    'document-processing',
    processDocument,
    {
        connection: redis,
        concurrency: 2,
    }
);

documentWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'job completed');
});

documentWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'job failed (will retry if attempts remain)');
});