import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '../services/api';

const WS_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/^http/, 'ws').replace('/api', '/ws');

export function useDocumentStatusSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'document-status') {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['document', data.documentId] });
      }
    };

    ws.onerror = () => {
     
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);
}