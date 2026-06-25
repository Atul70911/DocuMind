import { ShareLink, generateShareToken } from '../models/shareLink.model.js';
import { DocumentModel } from '../models/document.model.js';
import { Conversation } from '../models/conversation.model.js';

export class ShareLinkError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ShareLinkError';
  }
}

interface CreateShareLinkInput {
  documentId: string;
  userId: string;
  allowChat?: boolean;
  expiresInDays?: number;
}

export async function createShareLink(input: CreateShareLinkInput) {
  const { documentId, userId, allowChat = false, expiresInDays } = input;

  const document = await DocumentModel.findOne({ _id: documentId, userId });
  if (!document) {
    throw new ShareLinkError('Document not found', 404);
  }

  if (document.status !== 'ready') {
    throw new ShareLinkError('Document must be fully processed before it can be shared', 409);
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  const shareLink = await ShareLink.create({
    documentId,
    userId,
    token: generateShareToken(),
    allowChat,
    expiresAt,
  });

  return shareLink;
}

export async function revokeShareLink(shareLinkId: string, userId: string) {
  const shareLink = await ShareLink.findOne({ _id: shareLinkId, userId });

  if (!shareLink) {
    throw new ShareLinkError('Share link not found', 404);
  }

  shareLink.revokedAt = new Date();
  await shareLink.save();
}

export async function listShareLinksForDocument(documentId: string, userId: string) {
  const document = await DocumentModel.findOne({ _id: documentId, userId });
  if (!document) {
    throw new ShareLinkError('Document not found', 404);
  }

  return ShareLink.find({ documentId, userId }).sort({ createdAt: -1 });
}

export async function resolvePublicShareLink(token: string) {
  const shareLink = await ShareLink.findOne({ token });

  if (!shareLink) {
    throw new ShareLinkError('This link is invalid', 404);
  }

  if (shareLink.revokedAt) {
    throw new ShareLinkError('This link has been revoked by its owner', 410);
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    throw new ShareLinkError('This link has expired', 410);
  }

  const document = await DocumentModel.findById(shareLink.documentId);

  if (!document || document.status !== 'ready') {
    throw new ShareLinkError('This document is no longer available', 404);
  }

  return { shareLink, document };
}

export async function getPublicConversationHistory(documentId: string) {
  const conversation = await Conversation.findOne({ documentId });
  return conversation?.messages ?? [];
}