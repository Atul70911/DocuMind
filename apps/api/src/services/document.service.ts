import { randomUUID } from 'crypto';
import { DocumentModel, type DocumentSourceType } from '../models/document.model.js';
import { uploadFile } from '../lib/storage.js';
import { enqueueDocumentJob } from '../queues/document.queue.js';
import { fileTypeFromBuffer } from 'file-type';
import { sanitizeText } from '../utils/sanitize.js';
import { sanitizeFilename } from '../utils/sanitizeFilename.js';


export class DocumentError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'DocumentError';
  }
}

const ALLOWED_MIME_TYPES: Record<string, DocumentSourceType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'video/mp4': 'video',
};

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

interface UploadFileInput {
  userId: string;
  file: File; 
}

interface IngestUrlInput {
  userId: string;
  url: string;
}

export async function uploadDocument(input: UploadFileInput) {
  const { userId, file } = input;

  const declaredType = ALLOWED_MIME_TYPES[file.type];
  if (!declaredType) {
    throw new DocumentError(
      `Unsupported file type: ${file.type}. Allowed: PDF, DOCX, MP3, WAV, MP4`,
      415
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new DocumentError('File exceeds 100MB limit', 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

 
  const detected = await fileTypeFromBuffer(buffer);
  const detectedMime = detected?.mime;

  const isValidMatch =
    detectedMime === file.type ||
    (file.type.includes('wordprocessingml') && detected?.ext === 'docx');

  if (!isValidMatch) {
    throw new DocumentError(
      'File content does not match its declared type',
      415
    );
  }

  const sourceType = declaredType;
  const safeFilename = sanitizeFilename(file.name);
  const storageKey = `${userId}/${randomUUID()}-${safeFilename}`;

  await uploadFile(storageKey, buffer, file.type);

  const document = await DocumentModel.create({
    userId,
    title: sanitizeText(file.name),
    sourceType,
    originalFilename: file.name,
    storageKey,
    status: 'queued',
  });

  await enqueueDocumentJob({ documentId: document._id.toString(), userId });

  return document;
}


export async function ingestUrl(input: IngestUrlInput) {
  const { userId, url } = input;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new DocumentError('Invalid URL', 400);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new DocumentError('URL must use http or https', 400);
  }

  const document = await DocumentModel.create({
    userId,
    title: parsedUrl.hostname,
    sourceType: 'url',
    sourceUrl: url,
    storageKey: '', 
    status: 'queued',
  });

  await enqueueDocumentJob({ documentId: document._id.toString(), userId });

  return document;
}

export async function getDocumentById(documentId: string, userId: string) {
  const document = await DocumentModel.findOne({ _id: documentId, userId });

  if (!document) {
    throw new DocumentError('Document not found', 404);
  }

  return document;
}

export async function listUserDocuments(userId: string) {
  return DocumentModel.find({ userId }).sort({ createdAt: -1 });
}