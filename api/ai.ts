import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { generateSummary } from '../services/ai';

// ============================================================================
// UNIFIED API ENDPOINT: /api/ai?action=search|parse|selectModel
// ============================================================================

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  image?: string;
  type: 'movie' | 'person' | 'review';
  confidence: number;
  year?: string;
  language?: string;
}

// Parse complex queries like "RRR Telugu 2022", "Malayalum movie Ponniyin Selvan 1987"
function parseComplexQuery(q: string): {
  title: string;
  year?: string;
  language?: string;
  genre?: string;
  isComplex: boolean;
} {
  let title = q.trim();
  let year: string | undefined;
  let language: string | undefined;
  let genre: string | undefined;
  let isComplex = false;

  // Regional language detection
  const regionalMap: Record<string, string> = {
    malayalam: 'Malayalam',
    tamil: 'Tamil',
    telugu: 'Telugu',
    kannada: 'Kannada',
    hindi: 'Hindi',
    bengali: 'Bengali',
    marathi: 'Marathi',
    gujarati: 'Gujarati',
    punjabi: 'Punjabi',
    mollywood: 'Malayalam',
    kollywood: 'Tamil',
    tollywood: 'Telugu',
    sandalwood: 'Kannada',
    bollywood: 'Hindi',
  };

  // Extract year (4 digits)
  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = yearMatch[0];
    title = title.replace(yearMatch[0], '').trim();
    isComplex = true;
  }

  // Extract language
  for (const [keyword, lang] of Object.entries(regionalMap)) {
    if (title.toLowerCase().includes(keyword)) {
      language = lang;
      title = title.replace(new RegExp(keyword, 'gi'), '').trim();
      isComplex = true;
      break;
    }
  }

  // Extract genre keywords
  const genreKeywords = ['action', 'comedy', 'drama', 'thriller', 'horror', 'romance', 'sci-fi', 'fantasy', 'animation', 'documentary'];
  for (const g of genreKeywords) {
    if (title.toLowerCase().includes(g)) {
      genre = g;
      title = title.replace(new RegExp(g, 'gi'), '').trim();
      isComplex = true;
      break;
    }
  }

  // Remove "movie" keyword
  title = title.replace(/\b(movie|film|series|show)\b/gi, '').trim();

  return { title, year, language, genre, isComplex };
}

// Build optimized DuckDuckGo search query
function buildSearchQuery(parsed: ReturnType<typeof parseComplexQuery>): string {
  let searchQuery = parsed.title;

  if (parsed.language) {
    searchQuery += ` ${parsed.language}`;
  }

  if (parsed.year) {
    searchQuery += ` ${parsed.year}`;
  }

  if (parsed.genre) {
    searchQuery += ` ${parsed.genre}`;
  }

  searchQuery += ' movie cast';

  return searchQuery;
}

// Scrape DuckDuckGo search results
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('DuckDuckGo request failed:', response.status);
      return [];
    }

    const html = await response.text();

    // Parse HTML for results
    const resultRegex = /<result\s+(?:[^>]*\s+)?href="([^"]+)"[^>]*>/g;
    const titleRegex = /<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/g;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]+)<\/a>/g;

    const results: SearchResult[] = [];

    const hrefMatches = Array.from(html.matchAll(resultRegex));
    const titleMatches = Array.from(html.matchAll(titleRegex));
    const snippetMatches = Array.from(html.matchAll(snippetRegex));

    for (let i = 0; i < Math.min(hrefMatches.length, titleMatches.length, snippetMatches.length, 10); i++) {
      const url = hrefMatches[i]?.[1] || '';
      const title = titleMatches[i]?.[1]?.trim() || '';
      const snippet = snippetMatches[i]?.[1]?.trim() || '';

      if (!title || !url) continue;

      // Detect type from URL and title
      let type: 'movie' | 'person' | 'review' = 'movie';
      if (
        url.includes('imdb.com/name/') ||
        title.toLowerCase().includes('actor') ||
        title.toLowerCase().includes('director') ||
        title.toLowerCase().includes('cast')
      ) {
        type = 'person';
      } else if (
        title.toLowerCase().includes('review') ||
        title.toLowerCase().includes('rating') ||
        url.includes('/review')
      ) {
        type = 'review';
      }

      // Extract image from IMDB or other sources
      let image: string | undefined;
      if (url.includes('imdb.com')) {
        const idMatch = url.match(/imdb\.com\/(?:title|name)\/([^\/]+)/);
        if (idMatch) {
          if (type === 'person') {
            image = `https://www.imdb.com/name/${idMatch[1]}/`;
          } else {
            image = `https://www.imdb.com/title/${idMatch[1]}/`;
          }
        }
      }

      // Calculate confidence
      let confidence = 0.5;
      if (url.includes('imdb.com')) confidence = 0.95;
      if (url.includes('wikipedia.org')) confidence = 0.85;
      if (type === 'movie' || type === 'person') confidence += 0.2;

      results.push({
        title,
        snippet,
        url,
        image,
        type,
        confidence: Math.min(confidence, 1),
        year: extractYear(title),
        language: extractLanguage(title)
      });
    }

    return results.slice(0, 10);
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

function extractYear(text: string): string | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

function extractLanguage(text: string): string | undefined {
  const languages: Record<string, string> = {
    malayalam: 'Malayalam',
    tamil: 'Tamil',
    telugu: 'Telugu',
    kannada: 'Kannada',
    hindi: 'Hindi'
  };

  for (const [keyword, lang] of Object.entries(languages)) {
    if (text.toLowerCase().includes(keyword)) {
      return lang;
    }
  }
  return undefined;
}

function detectQueryType(
  title: string,
  type: 'movie' | 'person' | 'review'
): 'movie' | 'person' | 'review' | 'complex' {
  if (type === 'review') return 'review';
  if (type === 'person') return 'person';

  const complexKeywords = [
    'production',
    'budget',
    'box office',
    'awards',
    'analysis',
    'breakdown',
    'comparison'
  ];

  if (complexKeywords.some(kw => title.toLowerCase().includes(kw))) {
    return 'complex';
  }

  return 'movie';
}

function checkProviderAvailability(provider: string): boolean {
  // Simplified: assume all available unless in cooldown
  return true;
}

const modelMatrix: Record<string, string[]> = {
  movie: ['groq', 'mistral', 'openrouter', 'perplexity'],
  person: ['mistral', 'groq', 'openrouter', 'perplexity'],
  review: ['perplexity', 'openrouter', 'mistral', 'groq'],
  complex: ['openrouter', 'perplexity', 'mistral', 'groq']
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query.action as string) || 'search';

  try {
    // ====== SEARCH ACTION ======
    if (action === 'search' && req.method === 'GET') {
      const q = (req.query.q as string) || '';

      if (!q.trim()) {
        return res.status(400).json({
          ok: false,
          query: q,
          total: 0,
          results: [],
          error: 'Missing search query'
        });
      }

      const cacheKey = withCacheKey('duckduckgo_search', { q: q.trim().toLowerCase() });
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.status(200).json({ ...cached, cached: true });
      }

      const parsed = parseComplexQuery(q);
      const searchQuery = buildSearchQuery(parsed);

      console.log('🔍 Parsed Query:', parsed);
      console.log('🔍 Search Query:', searchQuery);

      const results = await searchDuckDuckGo(searchQuery);

      results.sort((a, b) => {
        const aImdb = a.url.includes('imdb.com') ? 10 : 0;
        const bImdb = b.url.includes('imdb.com') ? 10 : 0;
        return (b.confidence + bImdb) - (a.confidence + aImdb);
      });

      const response = {
        ok: true,
        query: q,
        total: results.length,
        results: results.slice(0, 6),
        parsedQuery: {
          title: parsed.title,
          year: parsed.year,
          language: parsed.language,
          genre: parsed.genre
        }
      };

      await setCache(cacheKey, response, 6 * 60 * 60);

      return res.status(200).json(response);
    }

    // ====== SELECT MODEL ACTION ======
    if (action === 'selectModel' && req.method === 'GET') {
      const resultType = (req.query.type as 'movie' | 'person' | 'review') || 'movie';
      const resultTitle = (req.query.title as string) || '';

      const queryType = detectQueryType(resultTitle, resultType);
      const preferences = modelMatrix[queryType] || modelMatrix['movie'];

      const availableModels: string[] = [];
      for (const model of preferences) {
        if (checkProviderAvailability(model)) {
          availableModels.push(model);
        }
      }

      const selectedModel = availableModels[0] || preferences[0];

      const reasons: Record<string, string> = {
        movie: '🎬 Movie query - using Groq for fast, accurate summaries',
        person: '👤 Person query - using Mistral for detailed biographical information',
        review: '⭐ Review query - using Perplexity for web-aware opinions and analysis',
        complex: '🧠 Complex query - using OpenRouter for comprehensive analysis'
      };

      return res.status(200).json({
        ok: true,
        selectedModel,
        reason: reasons[queryType],
        alternatives: availableModels.slice(1),
        queryType
      });
    }

    // ====== PARSE ACTION ======
    if (action === 'parse' && req.method === 'POST') {
      const { url, title, snippet, type, selectedModel } = req.body;

      if (!url || !title || !snippet || !type) {
        return res.status(400).json({
          ok: false,
          title,
          type,
          summary: { short: '', long: '' },
          error: 'Missing required fields: url, title, snippet, type'
        });
      }

      const cacheKey = withCacheKey('parse_result', { url, type, model: selectedModel });
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.status(200).json({ ...cached, cached: true });
      }

      let evidence = `Title: ${title}\n`;
      evidence += `Source: ${url}\n`;
      evidence += `Type: ${type}\n\n`;
      evidence += `Content: ${snippet}\n`;

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

      const response = {
        ok: true,
        title,
        type,
        summary: {
          short: genResult.json.summary_short || '',
          long: genResult.json.summary_long || ''
        }
      };

      await setCache(cacheKey, response, 24 * 60 * 60);

      return res.status(200).json(response);
    }

    // Fallback
    return res.status(400).json({
      ok: false,
      error: `Unknown action: ${action}`
    });
  } catch (error: any) {
    console.error(`Error in action '${action}':`, error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Server error'
    });
  }
}
