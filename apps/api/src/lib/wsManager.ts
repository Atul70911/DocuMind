import type { WebSocket } from 'ws';
import { redis } from './redis.js';
import Redis from 'ioredis';

const connections = new Map<string, Set<WebSocket>>();


const subscriber = new Redis(process.env.REDIS_URL!);

const CHANNEL = 'document-status-updates';

subscriber.subscribe(CHANNEL);

subscriber.on('message', (_channel, message) => {
  const { userId, payload } = JSON.parse(message);
  deliverToLocalConnections(userId, payload);
});

function deliverToLocalConnections(userId: string, payload: unknown): void {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const message = JSON.stringify(payload);
  for (const ws of userConnections) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

export function registerConnection(userId: string, ws: WebSocket): void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(ws);
}

export function removeConnection(userId: string, ws: WebSocket): void {
  connections.get(userId)?.delete(ws);
  if (connections.get(userId)?.size === 0) {
    connections.delete(userId);
  }
}


export async function sendToUser(userId: string, payload: unknown): Promise<void> {
  await redis.publish(CHANNEL, JSON.stringify({ userId, payload }));
}