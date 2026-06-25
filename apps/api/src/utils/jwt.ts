// utils/jwt.ts
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { redis } from '../lib/redis.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export async function signRefreshToken(userId: string): Promise<string> {
  const tokenId = randomUUID();

  await redis.set(
    `refresh:${tokenId}`,
    userId,
    'EX',
    REFRESH_TOKEN_EXPIRES_IN_SECONDS
  );

  const payload: RefreshTokenPayload = { userId, tokenId };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  });
}

export async function verifyRefreshToken(token: string): Promise<string> {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

  const storedUserId = await redis.get(`refresh:${payload.tokenId}`);

  if (!storedUserId || storedUserId !== payload.userId) {
    throw new Error('Refresh token has been revoked or is invalid');
  }

  return payload.userId;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  try {
    const payload = jwt.decode(token) as RefreshTokenPayload | null;
    if (payload?.tokenId) {
      await redis.del(`refresh:${payload.tokenId}`);
    }
  } catch {
  }
}

export async function revokeAllUserTokens(userId: string): Promise<void> {

  const stream = redis.scanStream({ match: 'refresh:*' });

  for await (const keys of stream) {
    if (keys.length === 0) continue;
    const values = await redis.mget(...keys);
    const toDelete = keys.filter((_: string, i: number) => values[i] === userId);
    if (toDelete.length > 0) {
      await redis.del(...toDelete);
    }
  }
}