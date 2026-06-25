// models/shareLink.model.ts
import { Schema, model, type Document as MongoDocument } from 'mongoose';
import { randomBytes } from 'crypto';

export interface IShareLink extends MongoDocument {
  documentId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId; 
  token: string;
  allowChat: boolean;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

const shareLinkSchema = new Schema<IShareLink>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    allowChat: { type: Boolean, default: false },
    expiresAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}

export const ShareLink = model<IShareLink>('ShareLink', shareLinkSchema);