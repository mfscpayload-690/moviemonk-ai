/**
 * Web search API using DuckDuckGo HTML scraping
 * Provides additional context for movies/actors not well-covered in TMDB
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * DuckDuckGo HTML search (no API key needed)
 * Better for Indian regional cinema than TMDB alone
 */
async function searchDuckDuckGo(query: string, limit = 5): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: ${response.status}`);
  }

  const html = await response.text();
  const results: SearchResult[] = [];

  // Parse HTML for results (DuckDuckGo has a simple structure)
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  let count = 0;
  while ((match = resultRegex.exec(html)) !== null && count < limit) {
    const url = match[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/%2F/g, '/');
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const snippet = match[3].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
    
    if (url && title && snippet) {
      results.push({ title, snippet, url: decodeURIComponent(url) });
      count++;
    }
  }

  return results;
}

/**
 * Wikipedia API search for enhanced biographical/movie data
 */
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) return [];

  const [_, titles, snippets, urls] = await response.json();
  
  return titles.map((title: string, idx: number) => ({
    title,
    snippet: snippets[idx] || '',
    url: urls[idx] || ''
  }));
}

/**
 * IMDB search via Google Custom Search (if configured)
 * Falls back to DuckDuckGo with site:imdb.com
 */
async function searchIMDB(query: string): Promise<SearchResult[]> {
  // Use DuckDuckGo with IMDB site filter
  const imdbQuery = `site:imdb.com ${query}`;
  return searchDuckDuckGo(imdbQuery, 3);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Only GET supported' });
  }

  const { q, sources = 'all' } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing query parameter "q"' });
  }

  const query = q.trim();
  if (query.length < 2) {
    return res.status(400).json({ ok: false, error: 'Query too short' });
  }

  // Check cache
  const cacheKey = withCacheKey('websearch', { q: query.toLowerCase(), sources: String(sources) });
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, cached: true });
  }

  try {
    const sourcesArray = String(sources).split(',');
    const results: Record<string, SearchResult[]> = {};

    // Parallel search across sources
    const promises: Promise<void>[] = [];

    if (sourcesArray.includes('all') || sourcesArray.includes('web')) {
      promises.push(
        searchDuckDuckGo(query, 5).then(r => { results.web = r; }).catch(() => { results.web = []; })
      );
    }

    if (sourcesArray.includes('all') || sourcesArray.includes('wikipedia')) {
      promises.push(
        searchWikipedia(query).then(r => { results.wikipedia = r; }).catch(() => { results.wikipedia = []; })
      );
    }

    if (sourcesArray.includes('all') || sourcesArray.includes('imdb')) {
      promises.push(
        searchIMDB(query).then(r => { results.imdb = r; }).catch(() => { results.imdb = []; })
      );
    }

    await Promise.all(promises);

    const response = {
      ok: true,
      query,
      results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
      cached: false
    };

    // Cache for 1 hour
    await setCache(cacheKey, response, 3600);

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Web search error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Search failed',
      details: error.message
    });
  }
}
