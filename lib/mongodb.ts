import { logger } from '@/lib/logger';
export {};

import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: any = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
    };

    // Only add retry options if not already in URI
    if (!MONGODB_URI.includes('retryWrites')) {
      opts.retryWrites = true;
    }
    if (!MONGODB_URI.includes('retryReads')) {
      opts.retryReads = true;
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.debug('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      logger.error('❌ MongoDB connection error:', error.message);
      logger.error('Connection URI format:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    // Provide helpful error messages
    if (e.code === 'ECONNREFUSED' || e.message?.includes('ECONNREFUSED')) {
      logger.error('❌ MongoDB Connection Refused');
      logger.error('   Possible causes:');
      logger.error('   1. MongoDB server is not running');
      logger.error('   2. Network connectivity issues');
      logger.error('   3. Firewall blocking connection');
      logger.error('   4. Incorrect connection string');
      if (MONGODB_URI.includes('mongodb+srv://')) {
        logger.error('   5. DNS resolution issue (SRV records)');
        logger.error('   6. MongoDB Atlas IP whitelist restrictions');
      }
    }
    throw e;
  }

  return cached.conn;
}

export default dbConnect; 