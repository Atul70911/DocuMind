import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface ShareLink {
  _id: string;
  token: string;
  allowChat: boolean;
  expiresAt?: string;
  createdAt: string;
}

export function useShareLinks(documentId: string) {
  return useQuery({
    queryKey: ['shareLinks', documentId],
    queryFn: () => api.get<{ shareLinks: ShareLink[] }>(`/share-links/document/${documentId}`),
  });
}

export function useCreateShareLink(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { allowChat?: boolean; expiresInDays?: number }) =>
      api.post<ShareLink>('/share-links', { documentId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLinks', documentId] });
    },
  });
}

export function useRevokeShareLink(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareLinkId: string) => api.delete(`/share-links/${shareLinkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLinks', documentId] });
    },
  });
}