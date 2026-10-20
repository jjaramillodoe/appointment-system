import { NextRequest, NextResponse } from 'next/server';
import getRedisClient from '@/lib/redis';
import { getClientIpAddress } from '@/lib/auditLogger';

interface RateLimitRule {
  /** Bucket name, e.g. 'login' */
  name: string;
  /** Max requests allowed per window */
  limit: number;
  /** Window length in seconds */
  windowSeconds: number;
}

// Fallback when Redis is unavailable. Per-instance only, so it is a best-effort limit.
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

async function hit(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }> {
  try {
    const client = await getRedisClient();
    if (client) {
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSeconds);
      const ttl = await client.ttl(key);
      return { count, ttl: ttl > 0 ? ttl : windowSeconds };
    }
  } catch {
    // Fall through to the in-memory limiter
  }

  const now = Date.now();
  if (memoryBuckets.size > 10_000) {
    for (const [k, b] of memoryBuckets) if (b.resetAt <= now) memoryBuckets.delete(k);
  }
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { count: 1, ttl: windowSeconds };
  }
  bucket.count += 1;
  return { count: bucket.count, ttl: Math.ceil((bucket.resetAt - now) / 1000) };
}

/**
 * Returns a 429 response when the caller exceeds the rule, otherwise null.
 * `identifier` adds a second dimension (e.g. the email being targeted) on top of the client IP.
 */
export async function enforceRateLimit(
  request: NextRequest,
  rule: RateLimitRule,
  identifier?: string
): Promise<NextResponse | null> {
  const ip = getClientIpAddress(request) || 'unknown';
  const keys = [`ratelimit:${rule.name}:ip:${ip}`];
  if (identifier) keys.push(`ratelimit:${rule.name}:id:${identifier.toLowerCase().trim()}`);

  for (const key of keys) {
    const { count, ttl } = await hit(key, rule.windowSeconds);
    if (count > rule.limit) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(ttl) } }
      );
    }
  }

  return null;
}

export const RATE_LIMITS = {
  login: { name: 'login', limit: 10, windowSeconds: 15 * 60 },
  register: { name: 'register', limit: 10, windowSeconds: 60 * 60 },
  forgotPassword: { name: 'forgot-password', limit: 5, windowSeconds: 60 * 60 },
  resetPassword: { name: 'reset-password', limit: 10, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitRule>;
