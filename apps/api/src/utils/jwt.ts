import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JWTPayload } from '../middleware/auth.js';

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}