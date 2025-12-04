import type { RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisAvailable = true;

async function getRedis(): Promise<RedisClientType | null> {
  if (!redisAvailable) return null;
  if (redisClient) return redisClient;
  
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    console.warn('⚠️ REDIS_URL not found - caching disabled');
    redisAvailable = false;
    return null;
  }
  
  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: REDIS_URL });
    client.on('error', (err) => {
      console.error('Redis error:', err);
      redisAvailable = false;
    });
    await client.connect();
    redisClient = client as RedisClientType;
    console.log('✅ Redis connected');
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    redisAvailable = false;
    return null;
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const r = await getRedis();
    if (!r) return null;
    
    const raw = await r.get(key);
    if (!raw) return null;
    
    try {
      return JSON.parse(String(raw)) as T;
    } catch {
      return String(raw) as unknown as T;
    }
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    const r = await getRedis();
    if (!r) return; // Skip caching if Redis unavailable
    
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    await r.set(key, payload, { EX: ttlSeconds });
  } catch (error) {
    console.error('Cache set error:', error);
    // Fail silently - don't break the app if caching fails
  }
}

export function withCacheKey(prefix: string, parts: Record<string, any>): string {
  const stable = Object.keys(parts)
    .sort()
    .map((k) => `${k}:${String(parts[k])}`)
    .join('|');
  return `${prefix}:${stable}`;
}
