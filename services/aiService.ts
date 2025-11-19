import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { fetchMovieData as fetchFromGemini } from './geminiService';
import { fetchMovieData as fetchFromDeepSeek } from './deepseekService';

export type AIProvider = 'gemini' | 'deepseek';

// Track last error times for availability checking
const lastErrors: Record<AIProvider, number | null> = {
  gemini: null,
  deepseek: null
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
 * Unified fetch function that routes to the selected provider
 */
export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  provider: AIProvider,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  try {
    let result: FetchResult;
    
    if (provider === 'gemini') {
      result = await fetchFromGemini(query, complexity, chatHistory);
    } else {
      result = await fetchFromDeepSeek(query, complexity, chatHistory);
    }
    
    // If successful, clear error tracking
    if (result.movieData) {
      lastErrors[provider] = null;
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
 * Test provider availability with a lightweight check
 */
export async function testProviderAvailability(provider: AIProvider): Promise<boolean> {
  try {
    const result = await fetchMovieData(
      'test', 
      QueryComplexity.SIMPLE, 
      provider
    );
    return !!result.movieData || !result.error;
  } catch {
    return false;
  }
}
