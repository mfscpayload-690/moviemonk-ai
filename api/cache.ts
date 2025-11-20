import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * Serverless caching API for MovieMonk
 * Uses Vercel KV (Redis) for edge caching across all users globally
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;

  try {
    // GET: Retrieve cached data
    if (method === 'GET') {
      const { key } = query;
      
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid key parameter' });
      }

      const cached = await kv.get(key);
      
      if (!cached) {
        return res.status(404).json({ error: 'Not found in cache' });
      }

      return res.status(200).json({
        data: cached,
        cached: true,
        timestamp: Date.now()
      });
    }

    // POST: Save to cache
    if (method === 'POST') {
      const { key, data, ttl = 60 * 60 * 24 * 7 } = body; // Default 7 days

      if (!key || !data) {
        return res.status(400).json({ error: 'Missing key or data in request body' });
      }

      // Save to KV with expiration
      await kv.set(key, data, { ex: ttl });

      return res.status(200).json({
        success: true,
        key,
        ttl,
        message: 'Cached successfully'
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Cache API error:', error);
    return res.status(500).json({
      error: 'Cache operation failed',
      details: error.message
    });
  }
}
