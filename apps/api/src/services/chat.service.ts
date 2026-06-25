import { Conversation, type IMessage } from '../models/conversation.model.js';
import { DocumentModel } from '../models/document.model.js';
import { semanticSearch } from './search.service.js';
import { RAG_SYSTEM_PROMPT, buildRagPrompt } from '../config/prompts.js';
import { env } from '../config/env.js';

export class ChatError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ChatError';
  }
}

const MAX_HISTORY_MESSAGES = 10; 
const RETRIEVAL_CHUNK_LIMIT = 5;

interface PrepareRagInput {
  userId: string;
  documentId: string;
  userMessage: string;
}

interface PreparedRag {
  conversation: InstanceType<typeof Conversation>;
  ollamaMessages: { role: string; content: string }[];
  citedChunks: { documentId: string; chunkIndex: number }[];
}

export async function prepareRagRequest(input: PrepareRagInput): Promise<PreparedRag> {
  const { userId, documentId, userMessage } = input;

  const document = await DocumentModel.findOne({ _id: documentId, userId });
  if (!document) {
    throw new ChatError('Document not found', 404);
  }

  if (document.status !== 'ready') {
    throw new ChatError(
      `Document is not ready for chat yet (status: ${document.status})`,
      409
    );
  }

  let conversation = await Conversation.findOne({ userId, documentId });
  if (!conversation) {
    conversation = await Conversation.create({ userId, documentId, messages: [] });
  }

  const searchResults = await semanticSearch({
    userId,
    query: userMessage,
    documentId,
    limit: RETRIEVAL_CHUNK_LIMIT,
  });

  if (searchResults.length === 0) {
    throw new ChatError(
      'No relevant content found in this document for your question',
      404
    );
  }

  const contextBlock = buildRagPrompt(
    searchResults.map((r) => ({ text: r.text, chunkIndex: r.chunkIndex }))
  );

  const recentHistory = conversation.messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));

  const ollamaMessages = [
    { role: 'system', content: RAG_SYSTEM_PROMPT },
    { role: 'system', content: contextBlock },
    ...recentHistory,
    { role: 'user', content: userMessage },
  ];

  const citedChunks = searchResults.map((r) => ({
    documentId: r.documentId,
    chunkIndex: r.chunkIndex,
  }));

  return { conversation, ollamaMessages, citedChunks };
}

export async function saveMessageExchange(
  conversation: InstanceType<typeof Conversation>,
  userMessage: string,
  assistantMessage: string,
  citedChunks: { documentId: string; chunkIndex: number }[]
) {
  conversation.messages.push(
    { role: 'user', content: userMessage, createdAt: new Date() } as IMessage,
    {
      role: 'assistant',
      content: assistantMessage,
      citedChunks,
      createdAt: new Date(),
    } as IMessage
  );

  await conversation.save();
}

export async function getConversationHistory(documentId: string, userId: string) {
  const conversation = await Conversation.findOne({ userId, documentId });
  return conversation?.messages ?? [];
}