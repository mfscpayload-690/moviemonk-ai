import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { searchPerplexity } from '../services/perplexityService';
import { searchSerpApi } from '../services/serpApiService';
// Note: generateSummary is client-side code, cannot be imported in serverless functions
// import { generateSummary } from '../services/ai';

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

// Search using TMDB API - more reliable than DuckDuckGo scraping
async function searchTMDB(title: string, limit = 6): Promise<SearchResult[]> {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      console.warn('⚠️ TMDB_API_KEY not set, using DuckDuckGo fallback');
      return [];
    }

    const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&page=1`;
    const response = await fetch(url);
    const data: any = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.log('⚠️ No TMDB results');
      return [];
    }

    return data.results.slice(0, limit).map((item: any) => {
      const name = item.title || item.name || '';
      const mediaType = item.media_type || 'movie';
      const type: 'movie' | 'person' | 'review' = mediaType === 'person' ? 'person' : 'movie';

      return {
        title: name,
        snippet: item.overview || item.known_for_department || '',
        url: `https://www.tmdb.org/${mediaType}/${item.id}`,
        type,
        confidence: item.popularity ? Math.min(item.popularity / 100, 1) : 0.7,
        year: item.release_date ? item.release_date.substring(0, 4) : undefined
      };
    });
  } catch (error) {
    console.error('TMDB search error:', error);
    return [];
  }
}

// Scrape DuckDuckGo search results - PROVEN WORKING VERSION
// Search using SerpApi - Google Search Results (High Accuracy)
async function searchWeb(query: string, limit = 6): Promise<SearchResult[]> {
  try {
    const serpResults = await searchSerpApi(query, limit);

    return serpResults.map(item => {
      let type: 'movie' | 'person' | 'review' = 'movie';
      if (item.type === 'person') type = 'person';
      if (item.type === 'review') type = 'review';

      // Boost confidence for Knowledge Graph items or official sources
      let confidence = 0.7;
      if (item.link.includes('imdb.com')) confidence = 0.95;
      if (item.link.includes('wikipedia.org')) confidence = 0.9;
      if (item.link.includes('rotten') || item.link.includes('letterboxd')) confidence = 0.85;

      return {
        title: item.title,
        snippet: item.snippet,
        url: item.link,
        image: item.thumbnail,
        type,
        confidence: Math.min(confidence, 1),
        year: item.year,
        language: undefined
      };
    });
  } catch (error) {
    console.error('Web search error:', error);
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

// Detect result type from text
function detectResultType(text: string): 'movie' | 'person' | 'review' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('actor') || lowerText.includes('director') || lowerText.includes('actress')) {
    return 'person';
  }
  if (lowerText.includes('review') || lowerText.includes('rating')) {
    return 'review';
  }
  return 'movie';
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
    console.log(`[API] ${req.method} /api/ai?action=${action}`);
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

      try {
        const cacheKey = withCacheKey('duckduckgo_search', { q: q.trim().toLowerCase() });
        const cached = await getCache(cacheKey);
        if (cached) {
          console.log('✅ Returning cached search results');
          return res.status(200).json({ ...cached, cached: true });
        }

        const parsed = parseComplexQuery(q);
        const searchQuery = buildSearchQuery(parsed);

        console.log('🔍 Parsed Query:', parsed);
        console.log('🔍 Search Query:', searchQuery);

        // Try TMDB first (more reliable)
        let results = await searchTMDB(parsed.title, 6);
        console.log(`📺 TMDB returned ${results.length} results`);

        // Fallback or Enrichment with SerpApi
        if (results.length === 0 || parsed.language) {
          console.log('🔄 Searching SerpApi for better results...');
          const serpResults = await searchWeb(searchQuery, 6);

          // Merge results, preferring SerpApi for regional content if TMDB failed
          if (results.length === 0) {
            results = serpResults;
          } else {
            // De-duplicate by url or title
            const existingUrls = new Set(results.map(r => r.url));
            for (const res of serpResults) {
              if (!existingUrls.has(res.url)) {
                results.push(res);
              }
            }
          }
        }

        // Final Fallback to Perplexity if EVERYTHING fails
        if (results.length === 0) {
          console.log('🔄 Falling back to Perplexity as last resort...');
          results = await searchPerplexity(searchQuery, 6);
        }

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
      } catch (searchError: any) {
        console.error('❌ Search error:', searchError);
        return res.status(500).json({
          ok: false,
          query: q,
          total: 0,
          results: [],
          error: searchError.message || 'Search failed'
        });
      }
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

      try {
        // For now, use a simple summarization approach
        // In production, you'd integrate with your chosen AI provider directly
        const summary_short = `${title} - ${snippet.substring(0, 150)}...`;
        const summary_long = `${title}\n\nSource: ${url}\n\n${snippet}`;

        const response = {
          ok: true,
          title,
          type,
          summary: {
            short: summary_short,
            long: summary_long
          }
        };

        await setCache(cacheKey, response, 24 * 60 * 60);
        return res.status(200).json(response);
      } catch (parseError: any) {
        console.error('❌ Parse error:', parseError);
        return res.status(500).json({
          ok: false,
          title,
          type,
          summary: { short: '', long: '' },
          error: parseError.message || 'Parsing failed'
        });
      }
    }

    // Fallback
    return res.status(400).json({
      ok: false,
      error: `Unknown action: ${action}`
    });
  } catch (error: any) {
    console.error(`[API ERROR] action='${action}':`, error);
    console.error(`Stack:`, error.stack);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Server error',
      action,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
