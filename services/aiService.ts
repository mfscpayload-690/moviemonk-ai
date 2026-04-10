import { ChatMessage, MovieData, QueryComplexity, FetchResult, AIProvider } from '../types';
import { fetchMovieData as fetchFromGroq } from './groqService';
import { fetchMovieData as fetchFromPerplexity } from './perplexityService';
import { getCachedResponse, cacheResponse, clearOldCacheEntries } from './cacheService';
import { getFromIndexedDB, saveToIndexedDB, clearOldIndexedDBEntries } from './indexedDBService';
import { parseQuery, shouldUseComplexModel } from './queryParser';
import { getFromTMDB } from './tmdbService';
import { fetchFromBestSource } from './hybridDataService'; // NEW: Multi-source data fetcher
import { searchWithPerplexity } from './perplexityService';
import { CREATIVE_ONLY_PROMPT } from '../constants';
import { hasDisplayableTitle } from './movieDataValidation';
import {
  startProviderTimer,
  recordProviderSuccess,
  recordProviderError,
  recordFallback,
  recordFinalProvider
} from './observability';

const debugLog = (...args: any[]) => {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
  if (typeof window !== 'undefined' && isDev) {
    console.log(...args);
  }
};

const scheduleIdle = (fn: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    // @ts-ignore requestIdleCallback exists in modern browsers
    window.requestIdleCallback(fn, { timeout: 500 });
  } else {
    setTimeout(fn, 50);
  }
};

// AIProvider is declared in types.ts

// Track last error times for availability checking
const lastErrors: Record<AIProvider, number | null> = {
  groq: null,
  perplexity: null
};

const ERROR_COOLDOWN = 30000; // 30 seconds

// Timeout helper for provider calls
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((val) => { clearTimeout(id); resolve(val); })
      .catch((err) => { clearTimeout(id); reject(err); });
  });
}

// Try providers in order within a total time budget
async function tryProvidersInOrder(
  prompt: string,
  complexity: QueryComplexity,
  chatHistory: ChatMessage[] | undefined,
  order: AIProvider[] = ['groq'],
  totalBudgetMs = 10000,
  requestId = 'unknown'
): Promise<FetchResult> {
  const start = Date.now();
  for (const prov of order) {
    const elapsed = Date.now() - start;
    const remaining = totalBudgetMs - elapsed;
    if (remaining <= 500) {
      return { movieData: null, sources: null, error: 'Timeout: no provider responded in time' };
    }

    const timer = startProviderTimer();
    try {
      const call: Promise<FetchResult> = fetchFromGroq(prompt, complexity, chatHistory);

      const result = await withTimeout(call, Math.max(1000, remaining), `${prov} summarization`);
      if (result.movieData) {
        // success
        recordProviderSuccess(prov, timer, requestId);
        recordFinalProvider(prov, requestId);
        return { ...result, provider: prov };
      }
      recordProviderError(prov, timer, requestId, result.error || 'empty_response');
      // If provider returned error, continue to next
    } catch (e: any) {
      // Continue to next provider on timeout/network errors
      lastErrors[prov] = Date.now();
      recordProviderError(prov, timer, requestId, e?.message || 'provider_call_failed');

      const nextProvider = order[order.indexOf(prov) + 1];
      if (nextProvider) {
        recordFallback(prov, nextProvider, requestId, e?.message || 'provider_failure');
      }
      continue;
    }
  }
  return { movieData: null, sources: null, error: 'All providers failed during summarization' };
}

function createRequestId(): string {
  return `ui_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

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
  const requestId = createRequestId();
  debugLog(JSON.stringify({ event: 'user_request_start', request_id: requestId, provider, complexity, query }));

  // Step 1: Parse query
  const parsed = parseQuery(query);
  debugLog('[ai] parsed query:', parsed);

  // Step 2: Auto-detect complexity
  const autoComplexity = shouldUseComplexModel(parsed) ? QueryComplexity.COMPLEX : complexity;
  debugLog(`[ai] complexity: ${autoComplexity} (user: ${complexity}, auto: ${shouldUseComplexModel(parsed)})`);

  // Step 3: Check cache (only for fresh searches without chat history)
  const shouldCache = !chatHistory || chatHistory.length === 0;

  if (shouldCache) {
    // Check IndexedDB first
    const indexedDBResult = await getFromIndexedDB(query, provider);
    if (indexedDBResult) {
      debugLog('[ai] cache hit from IndexedDB');
      return {
        ...indexedDBResult,
        error: undefined
      };
    }

    // Check localStorage second
    const cached = getCachedResponse(query, provider);
    if (cached) {
      debugLog('[ai] cache hit from localStorage');
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
    scheduleIdle(() => {
      clearOldCacheEntries();
      clearOldIndexedDBEntries();
    });
  }

  try {
    // Step 4: Try HYBRID source (TVMaze for TV, TMDB for movies) - IMPROVED!
    debugLog('[ai] searching best data source (TVMaze for TV, TMDB for movies)...');
    const hybridResult = await fetchFromBestSource(parsed);

    if (hybridResult.data) {
      debugLog(`[ai] ${hybridResult.source.toUpperCase()}: Found factual data (confidence: ${(hybridResult.confidence * 100).toFixed(0)}%), requesting AI summaries...`);

      // Use AI to fill in creative content only
      const enriched = await enrichWithAIContent(hybridResult.data, autoComplexity, provider, requestId, chatHistory);

      if (enriched.movieData) {
        // Add data source info to AI notes
        if (enriched.movieData.ai_notes) {
          const sourceInfo = hybridResult.source === 'tvmaze'
            ? '**Data Source**: TVMaze (comprehensive TV show database)'
            : hybridResult.source === 'tmdb'
              ? '**Data Source**: The Movie Database (TMDB)'
              : '**Data Source**: Multiple databases';

          enriched.movieData.ai_notes = `${sourceInfo}\n\n${enriched.movieData.ai_notes}`;
        }

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
    } else if (hybridResult.error) {
      console.warn(`[ai] Hybrid search failed: ${hybridResult.error}`);
    }

    // Step 5: TMDB not found, try Perplexity web search
    debugLog('[ai] TMDB not found, trying Perplexity web search...');
    const perplexityData = await searchWithPerplexity(parsed);

    if (perplexityData) {
      debugLog('[ai] Perplexity: Found data from web, requesting AI summaries...');

      // Use AI to fill in creative content
      const enriched = await enrichWithAIContent(perplexityData, autoComplexity, provider, requestId, chatHistory);

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
    debugLog('[ai] no TMDB/Perplexity data, falling back to pure AI...');
    const result = await fallbackToAI(query, autoComplexity, provider, requestId, chatHistory);

    // Track errors
    if (result.error) {
      lastErrors[provider] = Date.now();
    } else if (result.movieData) {
      if (!hasDisplayableTitle(result.movieData)) {
        return {
          movieData: null,
          sources: null,
          error: 'AI response missing required title field'
        };
      }

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
  requestId: string,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  try {
    // Create prompt for AI to fill creative fields only
    const creativePrompt = `${CREATIVE_ONLY_PROMPT}

Movie/Show: "${factualData.title}" (${factualData.year})
Type: ${factualData.type}
Genres: ${factualData.genres.join(', ')}

Provide engaging creative content (summaries, spoilers, trivia) for this title.`;
    // Try Groq provider for creative text enrichment.
    let aiResult: FetchResult | null = null;
    const preferredOrder: AIProvider[] = ['groq'];

    // If user selected a specific provider, try it first inside the same 10s budget
    const order = preferredOrder.includes(provider)
      ? [provider, ...preferredOrder.filter((p) => p !== provider)]
      : preferredOrder;

    aiResult = await tryProvidersInOrder(creativePrompt, complexity, chatHistory, order, 10000, requestId);

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
  requestId: string,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  let result: FetchResult;

  if (provider === 'groq') {
    result = await fetchFromGroq(query, complexity, chatHistory);
  } else if (provider === 'perplexity') {
    result = await fetchFromPerplexity(query, complexity, chatHistory);
  } else {
    result = await fetchFromGroq(query, complexity, chatHistory);
  }

  if (result.movieData && result.provider) {
    recordFinalProvider(result.provider, requestId);
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

    result = await fetchFromGroq(prompt, QueryComplexity.COMPLEX);

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
