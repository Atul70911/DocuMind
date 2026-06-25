import { Schema, model, Types, HydratedDocument } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  citedChunks?: { documentId: string; chunkIndex: number }[];
  createdAt: Date;
}

export interface IConversation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type IConversationDocument = HydratedDocument<IConversation>;

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
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export const Conversation = model<IConversation>('Conversation', conversationSchema);