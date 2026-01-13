import { createClient, RedisClientType } from 'redis';

declare global {
  // eslint-disable-next-line no-var
  var redis: {
    client: RedisClientType | null;
    promise: Promise<RedisClientType> | null;
    isAvailable: boolean | null;
    lastError: number | null;
  };
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'; // Default to true, can be disabled with REDIS_ENABLED=false
const REDIS_ERROR_RETRY_INTERVAL = 60000; // Retry connection after 1 minute if it failed

let cached = global.redis;

if (!cached) {
  cached = global.redis = { client: null, promise: null, isAvailable: null, lastError: null };
}

async function getRedisClient(): Promise<RedisClientType | null> {
  // If Redis is explicitly disabled, return null
  if (!REDIS_ENABLED) {
    return null;
  }

  // If we know Redis is not available and we recently tried, skip
  if (cached.isAvailable === false) {
    const timeSinceLastError = cached.lastError ? Date.now() - cached.lastError : Infinity;
    if (timeSinceLastError < REDIS_ERROR_RETRY_INTERVAL) {
      return null;
    }
    // Reset availability to retry
    cached.isAvailable = null;
    cached.lastError = null;
  }

  // If client is already connected, return it
  if (cached.client?.isOpen) {
    cached.isAvailable = true;
    return cached.client;
  }

  // Try to create new connection
  if (!cached.promise) {
    cached.promise = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 3000, // Reduced timeout
        reconnectStrategy: false, // Don't auto-reconnect
      },
    }).connect() as Promise<RedisClientType>;
  }

  try {
    cached.client = await cached.promise;
    cached.isAvailable = true;
    cached.lastError = null;
    return cached.client;
  } catch (e) {
    cached.promise = null;
    cached.client = null;
    cached.isAvailable = false;
    cached.lastError = Date.now();
    // Only log error once per retry interval
    if (!cached.lastError || Date.now() - cached.lastError > REDIS_ERROR_RETRY_INTERVAL) {
      console.warn('Redis connection failed. Caching disabled. Set REDIS_ENABLED=false to suppress this message.');
    }
    return null;
  }
}

export class AvailabilityCache {
  private static TTL = 5 * 60; // 5 minutes

  static getKey(hubId: string, date: string): string {
    return `availability:${hubId}:${date}`;
  }

  static async get(hubId: string, date: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        return null; // Redis not available, return null to fetch from DB
      }
      const key = this.getKey(hubId, date);
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Silently fail - Redis is optional
      return null;
    }
  }

  static async set(hubId: string, date: string, data: any) {
    try {
      const client = await getRedisClient();
      if (!client) {
        return; // Redis not available, skip caching
      }
      const key = this.getKey(hubId, date);
      await client.setEx(key, this.TTL, JSON.stringify(data));
    } catch (error) {
      // Silently fail - Redis is optional
    }
  }

  static async invalidate(hubId: string, date: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        return; // Redis not available, skip invalidation
      }
      const key = this.getKey(hubId, date);
      await client.del(key);
    } catch (error) {
      // Silently fail - Redis is optional
    }
  }

  static async invalidateHub(hubId: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        return; // Redis not available, skip invalidation
      }
      const pattern = `availability:${hubId}:*`;
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      // Silently fail - Redis is optional
    }
  }
}

export default getRedisClient; 