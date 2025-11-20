import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { fetchMovieData as fetchFromGemini } from './geminiService';
import { fetchMovieData as fetchFromDeepSeek } from './deepseekService';
import { fetchMovieData as fetchFromOpenRouter } from './openrouterService';
import { getCachedResponse, cacheResponse, clearOldCacheEntries } from './cacheService';
import { getFromIndexedDB, saveToIndexedDB, clearOldIndexedDBEntries } from './indexedDBService';

export type AIProvider = 'gemini' | 'deepseek' | 'openrouter';

// Track last error times for availability checking
const lastErrors: Record<AIProvider, number | null> = {
  gemini: null,
  deepseek: null,
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
 * Unified fetch function with multi-tier caching:
 * 1. IndexedDB (fastest, 30 days)
 * 2. localStorage (fast, 24 hours)  
 * 3. Vercel KV (medium, 7 days) - coming soon
 * 4. AI APIs (slowest)
 */
export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  provider: AIProvider,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  // Only cache simple queries without chat history (fresh searches)
  const shouldCache = complexity === QueryComplexity.SIMPLE && (!chatHistory || chatHistory.length === 0);
  
  // Check IndexedDB first (instant, per-user, 30 days)
  if (shouldCache) {
    const indexedDBResult = await getFromIndexedDB(query, provider);
    if (indexedDBResult) {
      return {
        ...indexedDBResult,
        error: undefined
      };
    }
  }
  
  // Check localStorage second (instant, per-user, 24 hours)
  if (shouldCache) {
    const cached = getCachedResponse(query, provider);
    if (cached) {
      // Also save to IndexedDB for longer persistence
      saveToIndexedDB(query, provider, cached.movieData, cached.sources);
      return {
        ...cached,
        error: undefined
      };
    }
  }
  
  // TODO: Check Vercel KV third (fast, global, 7 days)
  // Will implement once Vercel KV is set up
  
  // Clear old cache entries periodically (every 10th request)
  if (Math.random() < 0.1) {
    clearOldCacheEntries();
    clearOldIndexedDBEntries();
  }
  
  try {
    let result: FetchResult;
    
    if (provider === 'gemini') {
      result = await fetchFromGemini(query, complexity, chatHistory);
    } else if (provider === 'deepseek') {
      result = await fetchFromDeepSeek(query, complexity, chatHistory);
    } else {
      result = await fetchFromOpenRouter(query, complexity, chatHistory);
      // If OpenRouter failed, fallback to DeepSeek (if available) then Gemini.
      if (!result.movieData) {
        // track error
        lastErrors[provider] = Date.now();
        // try DeepSeek
        const deep = await fetchFromDeepSeek(query, complexity, chatHistory);
        if (deep.movieData) {
          return { movieData: deep.movieData, sources: deep.sources, error: `OpenRouter failed — fallback to DeepSeek: ${result.error || 'unknown'}` };
        }
        // try Gemini
        const gem = await fetchFromGemini(query, complexity, chatHistory);
        if (gem.movieData) {
          return { movieData: gem.movieData, sources: gem.sources, error: `OpenRouter & DeepSeek failed — fallback to Gemini: ${result.error || 'unknown'}` };
        }
        // all failed, return original OpenRouter error
      }
    }
    
    // If successful, clear error tracking and cache the result
    if (result.movieData) {
      lastErrors[provider] = null;
      
      // Cache successful responses in multiple tiers
      if (shouldCache) {
        // Save to localStorage (24 hours)
        cacheResponse(query, provider, result.movieData, result.sources);
        
        // Save to IndexedDB (30 days)
        saveToIndexedDB(query, provider, result.movieData, result.sources);
        
        // TODO: Save to Vercel KV (7 days, global)
        // Will implement once Vercel KV is configured
      }
    } else if (result.error) {
      // Track error for availability checking
      lastErrors[provider] = Date.now();
    }
    
    return result;
  } catch (error: any) {
    // Track error
    lastErrors[provider] = Date.now();
    
    return {
      movieData: null,
      sources: null,
      error: `${provider.charAt(0).toUpperCase() + provider.slice(1)} provider error: ${error?.message || 'Unknown error'}`
    };
  }
}

/**
 * Test provider availability with a lightweight check (removed - providers are always assumed available)
 */
export async function testProviderAvailability(provider: AIProvider): Promise<boolean> {
  // Always return true - let actual usage determine availability
  return true;
}
