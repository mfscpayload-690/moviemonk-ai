import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { fetchMovieData as fetchFromGroq } from './groqService';
import { fetchMovieData as fetchFromMistral } from './mistralService';
import { fetchMovieData as fetchFromOpenRouter } from './openrouterService';
import { getCachedResponse, cacheResponse, clearOldCacheEntries } from './cacheService';
import { getFromIndexedDB, saveToIndexedDB, clearOldIndexedDBEntries } from './indexedDBService';
import { parseQuery, shouldUseComplexModel } from './queryParser';
import { getFromTMDB } from './tmdbService';
import { searchWithPerplexity } from './perplexityService';
import { CREATIVE_ONLY_PROMPT } from '../constants';

export type AIProvider = 'groq' | 'mistral' | 'openrouter';

// Track last error times for availability checking
const lastErrors: Record<AIProvider, number | null> = {
  groq: null,
  mistral: null,
  openrouter: null
};

const ERROR_COOLDOWN = 30000; // 30 seconds

/**
 * Check if a provider is likely available based on recent errors
 */
export function checkProviderAvailability(provider: AIProvider): 'available' | 'unavailable' | 'checking' {
  const lastError = lastErrors[provider];
  if (!lastError) return 'available';
  
  const timeSinceError = Date.now() - lastError;
  if (timeSinceError < ERROR_COOLDOWN) {
    return 'unavailable';
  }
  
  // Clear old error after cooldown
  lastErrors[provider] = null;
  return 'available';
}

/**
 * NEW HYBRID FLOW - TMDB First, Web Search Fallback, AI for Creative Content
 * 
 * 1. Parse query (extract title, year, season)
 * 2. Auto-detect complexity
 * 3. Check cache
 * 4. Try TMDB (100% factual data)
 * 5. If TMDB found: Use facts + AI for creative summaries
 * 6. If TMDB not found: Try Perplexity web search
 * 7. If Perplexity found: Use web data + AI for creative content
 * 8. Last resort: Full AI generation (with disclaimer)
 */
export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  provider: AIProvider,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  // Step 1: Parse query
  const parsed = parseQuery(query);
  console.log('📝 Parsed query:', parsed);
  
  // Step 2: Auto-detect complexity
  const autoComplexity = shouldUseComplexModel(parsed) ? QueryComplexity.COMPLEX : complexity;
  console.log(`🎯 Complexity: ${autoComplexity} (user: ${complexity}, auto: ${shouldUseComplexModel(parsed)})`);
  
  // Step 3: Check cache (only for fresh searches without chat history)
  const shouldCache = !chatHistory || chatHistory.length === 0;
  
  if (shouldCache) {
    // Check IndexedDB first
    const indexedDBResult = await getFromIndexedDB(query, provider);
    if (indexedDBResult) {
      console.log('✅ Cache hit from IndexedDB');
      return {
        ...indexedDBResult,
        error: undefined
      };
    }
    
    // Check localStorage second
    const cached = getCachedResponse(query, provider);
    if (cached) {
      console.log('✅ Cache hit from localStorage');
      // Also save to IndexedDB for longer persistence
      saveToIndexedDB(query, provider, cached.movieData, cached.sources);
      return {
        ...cached,
        error: undefined
      };
    }
  }
  
  // Clear old cache entries periodically
  if (Math.random() < 0.1) {
    clearOldCacheEntries();
    clearOldIndexedDBEntries();
  }
  
  try {
    // Step 4: Try TMDB first (most accurate for popular titles)
    console.log('🎬 Searching TMDB...');
    const tmdbData = await getFromTMDB(parsed);
    
    if (tmdbData) {
      console.log('✅ TMDB: Found factual data, requesting AI summaries...');
      
      // Use AI to fill in creative content only
      const enriched = await enrichWithAIContent(tmdbData, autoComplexity, provider, chatHistory);
      
      if (enriched.movieData) {
        // Cache successful hybrid results
        if (shouldCache) {
          cacheResponse(query, provider, enriched.movieData, enriched.sources);
          saveToIndexedDB(query, provider, enriched.movieData, enriched.sources);
        }
        
        return {
          ...enriched,
          error: undefined
        };
      }
    }
    
    // Step 5: TMDB not found, try Perplexity web search
    console.log('🔍 TMDB not found, trying Perplexity web search...');
    const perplexityData = await searchWithPerplexity(parsed);
    
    if (perplexityData) {
      console.log('✅ Perplexity: Found data from web, requesting AI summaries...');
      
      // Use AI to fill in creative content
      const enriched = await enrichWithAIContent(perplexityData, autoComplexity, provider, chatHistory);
      
      if (enriched.movieData) {
        // Cache web search + AI results
        if (shouldCache) {
          cacheResponse(query, provider, enriched.movieData, enriched.sources);
          saveToIndexedDB(query, provider, enriched.movieData, enriched.sources);
        }
        
        return {
          ...enriched,
          error: undefined
        };
      }
    }
    
    // Step 6: Last resort - full AI generation (legacy fallback)
    console.log('⚠️  No TMDB/Perplexity data, falling back to pure AI...');
    const result = await fallbackToAI(query, autoComplexity, provider, chatHistory);
    
    // Track errors
    if (result.error) {
      lastErrors[provider] = Date.now();
    } else if (result.movieData) {
      lastErrors[provider] = null;
      
      // Cache AI-only results (shorter TTL would be ideal)
      if (shouldCache) {
        cacheResponse(query, provider, result.movieData, result.sources);
        saveToIndexedDB(query, provider, result.movieData, result.sources);
      }
    }
    
    return result;
    
  } catch (error: any) {
    lastErrors[provider] = Date.now();
    
    return {
      movieData: null,
      sources: null,
      error: `Error: ${error?.message || 'Unknown error'}`
    };
  }
}

/**
 * Enrich TMDB/Perplexity factual data with AI creative content
 */
async function enrichWithAIContent(
  factualData: MovieData,
  complexity: QueryComplexity,
  provider: AIProvider,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  try {
    // Create prompt for AI to fill creative fields only
    const creativePrompt = `${CREATIVE_ONLY_PROMPT}

Movie/Show: "${factualData.title}" (${factualData.year})
Type: ${factualData.type}
Genres: ${factualData.genres.join(', ')}

Provide engaging creative content (summaries, spoilers, trivia) for this title.`;

    let aiResult: FetchResult;
    
    if (provider === 'groq') {
      aiResult = await fetchFromGroq(creativePrompt, complexity, chatHistory);
    } else if (provider === 'mistral') {
      aiResult = await fetchFromMistral(creativePrompt, complexity, chatHistory);
    } else {
      aiResult = await fetchFromOpenRouter(creativePrompt, complexity, chatHistory);
    }
    
    if (aiResult.movieData) {
      // Merge: Keep factual data from TMDB/Perplexity, add AI creative content
      const merged: MovieData = {
        ...factualData, // TMDB/Perplexity facts (title, year, cast, crew, ratings, etc.)
        summary_short: aiResult.movieData.summary_short || factualData.summary_short,
        summary_medium: aiResult.movieData.summary_medium || factualData.summary_medium,
        summary_long_spoilers: aiResult.movieData.summary_long_spoilers || '',
        suspense_breaker: aiResult.movieData.suspense_breaker || '',
        ai_notes: aiResult.movieData.ai_notes || ''
      };
      
      return {
        movieData: merged,
        sources: aiResult.sources,
        provider: aiResult.provider
      };
    }
    
    // AI failed, return factual data with basic summaries
    return {
      movieData: factualData,
      sources: null,
      provider
    };
    
  } catch (error) {
    console.error('AI enrichment error:', error);
    // Return factual data without AI enrichment
    return {
      movieData: factualData,
      sources: null,
      provider
    };
  }
}

/**
 * Legacy fallback: Full AI generation when TMDB and Perplexity fail
 */
async function fallbackToAI(
  query: string,
  complexity: QueryComplexity,
  provider: AIProvider,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  let result: FetchResult;
  
  if (provider === 'groq') {
    result = await fetchFromGroq(query, complexity, chatHistory);
  } else if (provider === 'mistral') {
    result = await fetchFromMistral(query, complexity, chatHistory);
  } else {
    result = await fetchFromOpenRouter(query, complexity, chatHistory);
    
    // OpenRouter fallback chain
    if (!result.movieData) {
      lastErrors[provider] = Date.now();
      
      const mistral = await fetchFromMistral(query, complexity, chatHistory);
      if (mistral.movieData) {
        return {
          ...mistral,
          error: `OpenRouter failed, used Mistral: ${result.error || 'unknown'}`
        };
      }
      
      const groq = await fetchFromGroq(query, complexity, chatHistory);
      if (groq.movieData) {
        return {
          ...groq,
          error: `OpenRouter & Mistral failed, used Groq: ${result.error || 'unknown'}`
        };
      }
    }
  }
  
  return result;
}

/**
 * Fetch detailed plot/spoilers on demand (lazy loading)
 */
export async function fetchFullPlotDetails(
  title: string,
  year: string,
  type: string,
  provider: AIProvider
): Promise<string> {
  try {
    const prompt = `Provide a comprehensive, detailed plot summary with FULL SPOILERS for "${title}" (${year}, ${type}). 

Include:
- Complete plot breakdown from beginning to end
- All major plot twists and reveals
- Character arcs and development
- Ending explanation
- Any post-credit scenes or epilogues

Format: Start with "SPOILER WARNING — Full plot explained below." then provide 3-5 detailed paragraphs.`;

    let result: FetchResult;
    
    if (provider === 'groq') {
      result = await fetchFromGroq(prompt, QueryComplexity.COMPLEX);
    } else if (provider === 'mistral') {
      result = await fetchFromMistral(prompt, QueryComplexity.COMPLEX);
    } else {
      result = await fetchFromOpenRouter(prompt, QueryComplexity.COMPLEX);
    }
    
    if (result.movieData && result.movieData.summary_long_spoilers) {
      return result.movieData.summary_long_spoilers;
    }
    
    // Fallback if AI doesn't provide summary_long_spoilers field
    if (result.movieData && result.movieData.summary_medium) {
      return `SPOILER WARNING — Full plot explained below.\n\n${result.movieData.summary_medium}\n\nNote: Full spoiler details could not be generated at this time.`;
    }
    
    return "Unable to fetch full plot details at this time. Please try again.";
    
  } catch (error) {
    console.error('Full plot fetch error:', error);
    return "Error loading full plot details. Please try again later.";
  }
}

/**
 * Test provider availability with a lightweight check (removed - providers are always assumed available)
 */
export async function testProviderAvailability(provider: AIProvider): Promise<boolean> {
  // Always return true - let actual usage determine availability
  return true;
}
