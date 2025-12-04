import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';

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

interface SearchResponse {
  ok: boolean;
  query: string;
  total: number;
  results: SearchResult[];
  parsedQuery?: {
    title?: string;
    year?: string;
    language?: string;
    genre?: string;
  };
  error?: string;
}

// Parse complex queries like "RRR Telugu 2022", "Malayalum movie Ponniyin Selvan 2023"
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
    const imageRegex = /<img[^>]*src="([^"]+)"[^>]*>/g;

    const results: SearchResult[] = [];
    let hrefMatch;
    let titleMatch;
    let snippetMatch;

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

      // Calculate confidence: higher for IMDB, movie/person types
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

// Extract year from text
function extractYear(text: string): string | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

// Extract language from text
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      query: '',
      total: 0,
      results: [],
      error: 'Method not allowed'
    });
  }

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

  // Check cache first
  const cacheKey = withCacheKey('duckduckgo_search', { q: q.trim().toLowerCase() });
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, cached: true });
  }

  try {
    // Parse complex query
    const parsed = parseComplexQuery(q);
    const searchQuery = buildSearchQuery(parsed);

    console.log('🔍 Parsed Query:', parsed);
    console.log('🔍 Search Query:', searchQuery);

    // Search DuckDuckGo
    const results = await searchDuckDuckGo(searchQuery);

    // Sort by confidence and prioritize IMDB results
    results.sort((a, b) => {
      const aImdb = a.url.includes('imdb.com') ? 10 : 0;
      const bImdb = b.url.includes('imdb.com') ? 10 : 0;
      return (b.confidence + bImdb) - (a.confidence + aImdb);
    });

    const response: SearchResponse = {
      ok: true,
      query: q,
      total: results.length,
      results: results.slice(0, 6), // Max 6 results
      parsedQuery: {
        title: parsed.title,
        year: parsed.year,
        language: parsed.language,
        genre: parsed.genre
      }
    };

    // Cache for 6 hours
    await setCache(cacheKey, response, 6 * 60 * 60);

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({
      ok: false,
      query: q,
      total: 0,
      results: [],
      error: error.message || 'Search failed'
    });
  }
}
