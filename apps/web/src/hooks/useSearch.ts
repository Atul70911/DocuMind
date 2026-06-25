import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

export interface SearchResult {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  text: string;
  score: number;
}

interface SearchInput {
  query: string;
  documentId?: string;
}

export function useSearch() {
  return useMutation({
    mutationFn: (input: SearchInput) =>
      api.post<{ results: SearchResult[] }>('/search', input),
  });
}