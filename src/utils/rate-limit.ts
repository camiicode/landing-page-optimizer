import { LRUCache } from 'lru-cache';

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const cache = new LRUCache<string, RateLimitRecord>({
  max: 5000,
  ttl: 24 * 60 * 60 * 1000,
});

const DAILY_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true; remaining: number; resetSeconds: number }
  | { allowed: false; remaining: 0; resetSeconds: number };

export function checkRateLimit(
  visitorId: string | null,
  clientIp: string,
): RateLimitResult {
  const identifier =
    visitorId && visitorId !== 'null' ? `visitor:${visitorId}` : `ip:${clientIp}`;

  const now = Date.now();
  let record = cache.get(identifier);

  if (!record) {
    record = { count: 1, windowStart: now };
    cache.set(identifier, record);
    return {
      allowed: true,
      remaining: DAILY_LIMIT - 1,
      resetSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  const elapsed = now - record.windowStart;

  if (elapsed >= WINDOW_MS) {
    record.count = 1;
    record.windowStart = now;
    cache.set(identifier, record);
    return {
      allowed: true,
      remaining: DAILY_LIMIT - 1,
      resetSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (record.count >= DAILY_LIMIT) {
    const resetSeconds = Math.ceil((record.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, resetSeconds };
  }

  record.count++;
  cache.set(identifier, record);
  const resetSeconds = Math.ceil((record.windowStart + WINDOW_MS - now) / 1000);
  return {
    allowed: true,
    remaining: DAILY_LIMIT - record.count,
    resetSeconds,
  };
}
