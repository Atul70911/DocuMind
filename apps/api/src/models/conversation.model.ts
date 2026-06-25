import { Schema, model,Types, type Document as MongoDocument } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  citedChunks?: { documentId: string; chunkIndex: number }[];
  createdAt: Date;
}

export interface IConversation extends MongoDocument {
  userId: Schema.Types.ObjectId;
  documentId: Schema.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citedChunks: [
      {
        documentId: { type: String },
        chunkIndex: { type: Number },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: Types.ObjectId, ref: 'Document', required: true, index: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

export const Conversation = model<IConversation>('Conversation', conversationSchema);