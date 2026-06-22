import mongoose from 'mongoose';
import { env } from '../config/env.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(env.MONGO_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

export function getDB() {
  return mongoose.connection;
}