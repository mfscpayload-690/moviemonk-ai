import type { RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

async function getRedis(): Promise<RedisClientType> {
  if (redisClient) return redisClient;
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    throw new Error('REDIS_URL is required for caching');
  }
  const { createClient } = await import('redis');
  const client = createClient({ url: REDIS_URL });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  redisClient = client as RedisClientType;
  return redisClient;
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  const r = await getRedis();
  const raw = await r.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return String(raw) as unknown as T;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  const r = await getRedis();
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  await r.set(key, payload, { EX: ttlSeconds });
}

export function withCacheKey(prefix: string, parts: Record<string, any>): string {
  const stable = Object.keys(parts)
    .sort()
    .map((k) => `${k}:${String(parts[k])}`)
    .join('|');
  return `${prefix}:${stable}`;
}
