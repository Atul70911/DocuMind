import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../lib/redis.js';

export interface DocumentJobData {
  documentId: string;
  userId: string;
}

export const documentQueue = new Queue<DocumentJobData>('document-processing', {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: false,
  },
});

export async function enqueueDocumentJob(data: DocumentJobData) {
  return documentQueue.add('process-document', data);
}