import { Hono } from 'hono';
import mongoose from 'mongoose';
import { redis } from '../lib/redis.js';
import { qdrant } from '../lib/qdrant.js';

const health = new Hono();

health.get('/', async (c) => {
  const checks = {
    mongodb: false,
    redis: false,
    qdrant: false,
  };

  try {
    checks.mongodb = mongoose.connection.readyState === 1;
  } catch {
    checks.mongodb = false;
  }

  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG';
  } catch {
    checks.redis = false;
  }

  try {
    await qdrant.getCollections();
    checks.qdrant = true;
  } catch {
    checks.qdrant = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return c.json(
    { status: allHealthy ? 'ok' : 'degraded', checks },
    allHealthy ? 200 : 503
  );
});

export default health;