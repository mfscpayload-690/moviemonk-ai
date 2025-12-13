import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { searchPerplexity } from '../services/perplexityService';
import { searchSerpApi } from '../services/serpApiService';
import { CREATIVE_ONLY_PROMPT } from '../constants';
import { MovieData } from '../types';
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
  media_type?: string;
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
        id: item.id,
        title: name,
        snippet: item.overview || item.known_for_department || '',
        url: `https://www.tmdb.org/${mediaType}/${item.id}`,
        type,
        confidence: item.popularity ? Math.min(item.popularity / 100, 1) : 0.7,
        year: item.release_date ? item.release_date.substring(0, 4) : undefined,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : (item.profile_path ? `https://image.tmdb.org/t/p/w500${item.profile_path}` : undefined),
        media_type: mediaType
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

type ProviderChoice = 'groq' | 'mistral' | 'openrouter';

function buildGalleryImages(images: any): string[] {
  if (!images) return [];
  const galleryPaths: string[] = [];
  (images.backdrops || []).slice(0, 6).forEach((b: any) => b?.file_path && galleryPaths.push(b.file_path));
  (images.posters || []).slice(0, 2).forEach((p: any) => p?.file_path && galleryPaths.push(p.file_path));
  return galleryPaths
    .map((p) => `https://image.tmdb.org/t/p/w780${p}`)
    .filter(Boolean)
    .slice(0, 6);
}

function buildCreativePrompt(movie: MovieData): string {
  const castList = movie.cast.slice(0, 6).map((c) => `${c.name} as ${c.role}`).join('; ');
  return `Movie/Show: "${movie.title}" (${movie.year})
Type: ${movie.type}
Genres: ${movie.genres.join(', ') || 'Unknown'}
Director: ${movie.crew?.director || 'Unknown'}
Writer: ${movie.crew?.writer || 'Unknown'}
Music: ${movie.crew?.music || 'Unknown'}
Top Cast: ${castList || 'N/A'}
Overview: ${movie.summary_medium || movie.summary_short || 'N/A'}

Fill ONLY creative fields (summary_short, summary_medium, summary_long_spoilers, suspense_breaker, ai_notes). Do not change factual fields.`;
}

function parseCreativeFields(text: string): Partial<MovieData> | null {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e2) {
      console.error('Failed to parse creative JSON', e2);
    }
  }
  return null;
}

async function callCreativeProvider(provider: ProviderChoice, prompt: string): Promise<Partial<MovieData> | null> {
  const messages = [
    { role: 'system', content: CREATIVE_ONLY_PROMPT },
    { role: 'user', content: prompt }
  ];

  const withAbort = async (fn: (signal: AbortSignal) => Promise<Response>) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const res = await fn(controller.signal);
      return res;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    if (provider === 'groq') {
      const key = process.env.GROQ_API_KEY;
      if (!key) return null;
      const res = await withAbort((signal) => fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        }),
        signal
      }));
      if (!res.ok) return null;
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content || '';
      return parseCreativeFields(text);
    }

    if (provider === 'mistral') {
      const key = process.env.MISTRAL_API_KEY;
      if (!key) return null;
      const res = await withAbort((signal) => fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages,
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        }),
        signal
      }));
      if (!res.ok) return null;
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content || '';
      return parseCreativeFields(text);
    }

    if (provider === 'openrouter') {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) return null;
      const res = await withAbort((signal) => fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'https://moviemonk-ai.vercel.app',
          'X-Title': 'MovieMonk'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages,
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        }),
        signal
      }));
      if (!res.ok) return null;
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content || '';
      return parseCreativeFields(text);
    }
  } catch (error) {
    console.warn(`Creative provider ${provider} failed:`, (error as any)?.message || error);
    return null;
  }

  return null;
}

async function enrichCreativeFields(movie: MovieData, preferred: ProviderChoice): Promise<Partial<MovieData>> {
  const order: ProviderChoice[] = ([preferred, 'groq', 'mistral', 'openrouter'] as ProviderChoice[])
    .filter((p, idx, arr) => arr.indexOf(p) === idx);
  const prompt = buildCreativePrompt(movie);

  for (const provider of order) {
    const creative = await callCreativeProvider(provider, prompt);
    if (creative && (creative.summary_short || creative.summary_medium || creative.summary_long_spoilers || creative.suspense_breaker || creative.ai_notes)) {
      return creative;
    }
  }

  return {};
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
          const lowerQ = parsed.title.toLowerCase();
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();

          const aExact = aTitle === lowerQ ? 20 : 0;
          const bExact = bTitle === lowerQ ? 20 : 0;

          const aImdb = a.url.includes('imdb.com') ? 10 : 0;
          const bImdb = b.url.includes('imdb.com') ? 10 : 0;
          return (b.confidence + bImdb + bExact) - (a.confidence + aImdb + aExact);
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

    // ====== DETAILS ACTION ======
    if (action === 'details' && req.method === 'GET') {
      const id = req.query.id;
      const mediaType = (req.query.media_type as string) || 'movie'; // 'movie' or 'tv'
      const preferredProvider = ((req.query.provider as string) || 'groq').toLowerCase() as ProviderChoice;

      if (!id) {
        return res.status(400).json({ ok: false, error: 'Missing id' });
      }

      const cacheKey = `details_${mediaType}_${id}_${preferredProvider}`;
      const cached = await getCache(cacheKey);
      if (cached) return res.status(200).json(cached);

      try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        if (!TMDB_API_KEY) {
          throw new Error('TMDB_API_KEY not configured');
        }
        const append = 'credits,videos,recommendations,watch/providers,release_dates,content_ratings,external_ids,images';
        const url = new URL(`https://api.themoviedb.org/3/${mediaType}/${id}`);
        url.searchParams.set('api_key', TMDB_API_KEY);
        url.searchParams.set('append_to_response', append);
        url.searchParams.set('include_image_language', 'en,null');

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`TMDB error: ${response.status}`);
        }
        const data: any = await response.json();

        // Process Crew
        const crew = { director: 'Unknown', writer: 'Unknown', music: 'Unknown' };
        if (data.credits?.crew) {
          const directors = data.credits.crew.filter((c: any) => c.job === 'Director').map((c: any) => c.name);
          const writers = data.credits.crew.filter((c: any) => ['Screenplay', 'Writer', 'Story'].includes(c.job)).map((c: any) => c.name);
          const composers = data.credits.crew.filter((c: any) => ['Original Music Composer', 'Music'].includes(c.job)).map((c: any) => c.name);

          if (directors.length) crew.director = directors.slice(0, 2).join(', ');
          if (writers.length) crew.writer = writers.slice(0, 2).join(', ');
          if (composers.length) crew.music = composers.slice(0, 2).join(', ');
        }

        // Process Cast
        const cast = data.credits?.cast?.slice(0, 12).map((c: any) => ({
          name: c.name,
          role: c.character,
          known_for: c.known_for_department
        })) || [];

        // Ratings
        const ratings = [
          { source: 'TMDB', score: `${Math.round(data.vote_average * 10)}%` }
        ];

        // Helper to build streaming platform URLs
        const buildPlatformUrl = (providerName: string, movieTitle: string): string => {
          const encoded = encodeURIComponent(movieTitle);
          const provider = providerName.toLowerCase();
          
          if (provider.includes('netflix')) return `https://www.netflix.com/search?q=${encoded}`;
          if (provider.includes('prime') || provider.includes('amazon')) return `https://www.amazon.com/s?k=${encoded}&i=instant-video`;
          if (provider.includes('hulu')) return `https://www.hulu.com/search?q=${encoded}`;
          if (provider.includes('disney')) return `https://www.disneyplus.com/search?q=${encoded}`;
          if (provider.includes('hbo') || provider.includes('max')) return `https://www.max.com/search?q=${encoded}`;
          if (provider.includes('apple')) return `https://tv.apple.com/search?q=${encoded}`;
          if (provider.includes('paramount')) return `https://www.paramountplus.com/search/?q=${encoded}`;
          if (provider.includes('peacock')) return `https://www.peacocktv.com/search?q=${encoded}`;
          if (provider.includes('youtube')) return `https://www.youtube.com/results?search_query=${encoded}`;
          if (provider.includes('hotstar')) return `https://www.hotstar.com/in/search?q=${encoded}`;
          if (provider.includes('zee5')) return `https://www.zee5.com/search?q=${encoded}`;
          if (provider.includes('sonyliv')) return `https://www.sonyliv.com/search?q=${encoded}`;
          
          // Fallback to JustWatch
          return `https://www.justwatch.com/us/search?q=${encoded}`;
        };

        // Process Watch Providers
        const watchProviders: any[] = [];
        const movieTitle = data.title || data.name || '';
        
        if (data['watch/providers']?.results?.IN) { // Default to India as per user request
          const inProvider = data['watch/providers'].results.IN;
          if (inProvider.flatrate) watchProviders.push(...inProvider.flatrate.map((p: any) => ({ 
            platform: p.provider_name, 
            type: 'subscription',
            link: buildPlatformUrl(p.provider_name, movieTitle)
          })));
          if (inProvider.rent) watchProviders.push(...inProvider.rent.map((p: any) => ({ 
            platform: p.provider_name, 
            type: 'rent',
            link: buildPlatformUrl(p.provider_name, movieTitle)
          })));
          if (inProvider.buy) watchProviders.push(...inProvider.buy.map((p: any) => ({ 
            platform: p.provider_name, 
            type: 'buy',
            link: buildPlatformUrl(p.provider_name, movieTitle)
          })));
        }

        // Trailer
        const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');

        // Images/Gallery
        const extra_images = buildGalleryImages(data.images);
        const poster_url = data.poster_path
          ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
          : (data.images?.posters?.[0]?.file_path ? `https://image.tmdb.org/t/p/w500${data.images.posters[0].file_path}` : '');
        const backdrop_url = data.backdrop_path
          ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
          : extra_images[0] || '';

        const movieData: MovieData = {
          title: data.title || data.name,
          year: (data.release_date || data.first_air_date || '').substring(0, 4),
          type: mediaType === 'tv' ? 'show' : 'movie',
          genres: data.genres?.map((g: any) => g.name) || [],
          poster_url,
          backdrop_url,
          trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '',
          ratings: ratings,
          cast: cast,
          crew: crew,
          summary_short: data.overview || '',
          summary_medium: data.overview || '',
          summary_long_spoilers: '', // Populated by AI below
          suspense_breaker: '',
          where_to_watch: watchProviders,
          extra_images,
          ai_notes: ''
        };

        const creative = await enrichCreativeFields(movieData, preferredProvider);
        const enriched: MovieData = {
          ...movieData,
          summary_short: creative.summary_short || movieData.summary_short,
          summary_medium: creative.summary_medium || movieData.summary_medium,
          summary_long_spoilers: creative.summary_long_spoilers || movieData.summary_long_spoilers,
          suspense_breaker: creative.suspense_breaker || movieData.suspense_breaker,
          ai_notes: creative.ai_notes || movieData.ai_notes
        };

        await setCache(cacheKey, enriched, 24 * 60 * 60);
        return res.status(200).json(enriched);

      } catch (e: any) {
        console.error('Details fetch error:', e);
        return res.status(500).json({ ok: false, error: e.message });
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
