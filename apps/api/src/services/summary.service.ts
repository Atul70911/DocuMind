import { DocumentModel } from '../models/document.model.js';
import { aiClient } from '../lib/aiClient.js';

const SUMMARY_SYSTEM_PROMPT = `You are a summarization assistant. Given the full text of a document, write a concise TL;DR summary.

Rules:
1. 3-5 sentences maximum.
2. Capture the core topic and most important points only.
3. Write in plain, direct language — no filler phrases like "This document discusses..."
4. If the text is fragmented or low-quality (e.g. poorly transcribed audio), summarize what's discernible and don't invent missing details.`;

const MAX_SUMMARY_INPUT_CHARS = 8000;

export async function generateSummary(fullText: string): Promise<string> {
  const truncatedText = fullText.slice(0, MAX_SUMMARY_INPUT_CHARS);

  const messages = [
    { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
    { role: 'user', content: truncatedText },
  ];


  return aiClient.chatCompletion(messages);
}

export async function saveSummary(documentId: string, summary: string): Promise<void> {
  await DocumentModel.findByIdAndUpdate(documentId, { summary });
}