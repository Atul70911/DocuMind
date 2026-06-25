import { Schema, model,Types, type Document as MongoDocument } from 'mongoose';

export type DocumentStatus = 'queued' | 'parsing' | 'embedding' | 'ready' | 'failed';
export type DocumentSourceType = 'pdf' | 'docx' | 'audio' | 'video' | 'url';

export interface IDocument extends MongoDocument {
  userId: Types.ObjectId;
  title: string;
  sourceType: DocumentSourceType;
  originalFilename?: string;
  storageKey: string;     
  sourceUrl?: string;        
  status: DocumentStatus;
  summary?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ['pdf', 'docx', 'audio', 'video', 'url'],
      required: true,
    },
    originalFilename: { type: String },
    storageKey: { type: String, required: true },
    sourceUrl: { type: String },
    status: {
      type: String,
      enum: ['queued', 'parsing', 'embedding', 'ready', 'failed'],
      default: 'queued',
      index: true,
    },
    summary: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const DocumentModel = model<IDocument>('Document', documentSchema);