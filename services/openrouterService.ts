import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';

// Use serverless proxy endpoint instead of direct API call
const PROXY_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api/openrouter'  // Local dev (if running Vercel dev)
  : '/api/openrouter';  // Production (Vercel deployment)

const parseJsonResponse = (text: string): MovieData | null => {
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as MovieData;
  } catch (e) {
    console.error('OpenRouter parse JSON failed:', e);
    console.error('Raw text:', text);
    return null;
  }
};

export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  // Skip empty or ping queries
  if (!query || query.trim().length < 3 || query.toLowerCase() === 'ping') {
    return { movieData: null, sources: null, provider: 'openrouter' };
  }

  // Model selection: Use Meta Llama models via OpenRouter
  const model = complexity === QueryComplexity.COMPLEX 
    ? 'meta-llama/llama-3.1-70b-instruct'  // Best for complex reasoning
    : 'meta-llama/llama-3.1-8b-instruct';  // Fast for simple queries

  let userPrompt = `${INITIAL_PROMPT}\n\nUser query: "${query}"`;
  if (chatHistory && chatHistory.length) {
    userPrompt += '\n\nConversation so far: ' + chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
  }

  const payload = {
    model,
    messages: [
      { role: 'system', content: 'You are MovieMonk. Return a single JSON object matching the schema, JSON only.' },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.0
  };

  try {
    // Call our serverless proxy instead of OpenRouter directly
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      // Special-case payment/credit errors and 401s
      if (res.status === 402) {
        // OpenRouter might return JSON with message
        try {
          const info = JSON.parse(txt || '{}');
          const msg = info?.error?.message || txt || 'Insufficient balance';
          return { movieData: null, sources: null, error: `OpenRouter error 402: ${msg}` };
        } catch {
          return { movieData: null, sources: null, error: 'OpenRouter error 402: Insufficient balance' };
        }
      }
      if (res.status === 401) {
        return { movieData: null, sources: null, error: 'OpenRouter API key invalid. Check OPENROUTER_API_KEY' };
      }
      return { movieData: null, sources: null, error: `OpenRouter proxy error ${res.status}: ${txt || res.statusText}` };
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? '';

    const parsed = parseJsonResponse(text);
    if (!parsed) return { movieData: null, sources: null, error: 'Failed to parse OpenRouter JSON response' };

    try {
      if (!parsed.poster_url || !parsed.backdrop_url || !parsed.extra_images || parsed.extra_images.length === 0) {
        const enriched = await enrichWithTMDB(parsed);
        return { movieData: enriched, sources: null };
      }
    } catch (e) {
      console.warn('TMDB enrichment failed for OpenRouter:', e);
    }

    return { movieData: parsed, sources: null };
  } catch (e: any) {
    // Network errors
    const message = e?.message || '';
    return { movieData: null, sources: null, error: `OpenRouter proxy request failed: ${message || 'unknown'}` };
  }
}
