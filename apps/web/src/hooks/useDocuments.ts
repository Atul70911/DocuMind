import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface DocumentItem {
  _id: string;
  title: string;
  sourceType: string;
  status: string;
  createdAt: string;
}

export function useDocuments(page = 1) {
  return useQuery({
    queryKey: ['documents', page],
    queryFn: () =>
      api.get<{ documents: DocumentItem[]; pagination: unknown }>(`/documents?page=${page}`),
    refetchInterval: 5000,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(body.error || 'Upload failed');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => api.delete(`/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useRetrySummary(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<{ summary: string }>(`/documents/${documentId}/retry-summary`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });
}