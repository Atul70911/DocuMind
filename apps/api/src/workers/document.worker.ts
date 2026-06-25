import { Worker, type Job } from 'bullmq';
import { redis } from '../lib/redis.js';
import { DocumentModel } from '../models/document.model.js';
import type { DocumentJobData } from '../queues/document.queue.js';
import { pino } from 'pino';

const logger = pino({ name: 'document-worker' });

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
    log.info('stage: parsing');


    document.status = 'embedding';
    await document.save();
    log.info('stage: embedding');


    document.status = 'ready';
    await document.save();
    log.info('stage: ready');
  } catch (err) {
    document.status = 'failed';
    document.errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await document.save();
    log.error({ err }, 'processing failed');
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