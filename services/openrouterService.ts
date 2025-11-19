import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://api.openrouter.ai/v1/chat/completions';

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
  if (!API_KEY) {
    return { movieData: null, sources: null, error: 'OPENROUTER_API_KEY is not set' };
  }

  const model = complexity === QueryComplexity.COMPLEX ? 'deepseek/deepseek-reasoner' : 'deepseek/deepseek-chat';

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
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
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
      return { movieData: null, sources: null, error: `OpenRouter error ${res.status}: ${txt || res.statusText}` };
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
    // Failed to fetch often means a network/CORS issue when running from the browser.
    const message = e?.message || '';
    if (message.includes('Failed to fetch') || message.toLowerCase().includes('network')) {
      return {
        movieData: null,
        sources: null,
        error: 'OpenRouter request failed: Network/CORS error. Browser requests may be blocked — use a serverless proxy or move this key to a backend.'
      };
    }
    return { movieData: null, sources: null, error: `OpenRouter request failed: ${message || 'unknown'}` };
  }
}
