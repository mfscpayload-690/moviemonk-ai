import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { generateSummary } from '../services/ai';

interface ParseRequest {
  url: string;
  title: string;
  snippet: string;
  type: 'movie' | 'person' | 'review';
  selectedModel: 'groq' | 'mistral' | 'openrouter' | 'perplexity';
}

interface ParseResponse {
  ok: boolean;
  title: string;
  type: string;
  summary: {
    short: string;
    long: string;
  };
  details?: any;
  error?: string;
}

// Fetch IMDB data if URL is IMDB
async function fetchIMDBData(url: string) {
  try {
    if (!url.includes('imdb.com')) return null;

    // Extract IMDB ID
    const idMatch = url.match(/imdb\.com\/(?:title|name)\/([^\/]+)/);
    if (!idMatch) return null;

    const imdbId = idMatch[1];

    // For now, return structured data from URL parsing
    // In production, you might use OMDB API with known IMDB ID
    return {
      imdbId,
      url,
      type: url.includes('/title/') ? 'movie' : 'person'
    };
  } catch (error) {
    console.error('IMDB fetch error:', error);
    return null;
  }
}

// Extract key information from snippet
function parseSnippet(snippet: string, type: 'movie' | 'person' | 'review') {
  const lines = snippet.split('\n').filter(l => l.trim());

  if (type === 'person') {
    return {
      bio: lines.join(' ').slice(0, 500),
      role: extractRole(snippet)
    };
  }

  if (type === 'movie') {
    return {
      plot: lines.join(' ').slice(0, 500),
      genres: extractGenres(snippet),
      year: extractYear(snippet)
    };
  }

  return { content: lines.join(' ').slice(0, 500) };
}

function extractRole(text: string): string | undefined {
  const roleMatch = text.match(
    /(actor|actress|director|writer|producer|composer)/i
  );
  return roleMatch?.[1];
}

function extractGenres(text: string): string[] {
  const genreKeywords = [
    'action',
    'comedy',
    'drama',
    'thriller',
    'horror',
    'romance',
    'sci-fi',
    'fantasy',
    'animation',
    'adventure'
  ];
  const found: string[] = [];
  for (const genre of genreKeywords) {
    if (text.toLowerCase().includes(genre)) {
      found.push(genre);
    }
  }
  return found.slice(0, 3);
}

function extractYear(text: string): string | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      title: '',
      type: 'unknown',
      summary: { short: '', long: '' },
      error: 'Method not allowed'
    });
  }

  try {
    const { url, title, snippet, type, selectedModel } = req.body as ParseRequest;

    if (!url || !title || !snippet || !type) {
      return res.status(400).json({
        ok: false,
        title,
        type,
        summary: { short: '', long: '' },
        error: 'Missing required fields: url, title, snippet, type'
      });
    }

    // Check cache
    const cacheKey = withCacheKey('parse_result', {
      url,
      type,
      model: selectedModel
    });
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cached: true });
    }

    // Fetch IMDB data if available
    const imdbData = await fetchIMDBData(url);

    // Parse snippet for key details
    const parsed = parseSnippet(snippet, type);

    // Build evidence for AI
    let evidence = `Title: ${title}\n`;
    evidence += `Source: ${url}\n`;
    evidence += `Type: ${type}\n\n`;
    evidence += `Content: ${snippet}\n`;

    if (type === 'movie' && parsed.year) {
      evidence += `Year: ${parsed.year}\n`;
    }
    if (type === 'movie' && parsed.genres?.length) {
      evidence += `Genres: ${parsed.genres.join(', ')}\n`;
    }
    if (type === 'person' && parsed.role) {
      evidence += `Role: ${parsed.role}\n`;
    }

    // Generate AI summary
    const schema = {
      summary_short: 'string',
      summary_long: 'string'
    } as const;

    const genResult = await generateSummary({
      evidence,
      query: title,
      schema,
      timeoutMs: 15000,
      preferred: selectedModel as any
    });

    if (!genResult.ok) {
      return res.status(500).json({
        ok: false,
        title,
        type,
        summary: { short: '', long: '' },
        error: 'AI summarization failed'
      });
    }

    const response: ParseResponse = {
      ok: true,
      title,
      type,
      summary: {
        short: genResult.json.summary_short || '',
        long: genResult.json.summary_long || ''
      },
      details: {
        ...parsed,
        imdbId: imdbData?.imdbId
      }
    };

    // Cache for 24 hours
    await setCache(cacheKey, response, 24 * 60 * 60);

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Parse error:', error);
    return res.status(500).json({
      ok: false,
      title: '',
      type: 'unknown',
      summary: { short: '', long: '' },
      error: error.message || 'Parsing failed'
    });
  }
}
