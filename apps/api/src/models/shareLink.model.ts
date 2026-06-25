import { Schema, model, Types, HydratedDocument } from 'mongoose';
import { randomBytes } from 'crypto';

// ✅ Plain interface — no extends MongoDocument
export interface IShareLink {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;      // ✅ Types.ObjectId, not Schema.Types.ObjectId
  userId: Types.ObjectId;
  token: string;
  allowChat: boolean;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IShareLinkDocument = HydratedDocument<IShareLink>;

const shareLinkSchema = new Schema<IShareLink>(
  {
    documentId: { type: Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true },
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