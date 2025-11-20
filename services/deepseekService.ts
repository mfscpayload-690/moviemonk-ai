import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';

const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/chat/completions';

const parseJsonResponse = (text: string): MovieData | null => {
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as MovieData;
  } catch (e) {
    console.error('Failed to parse DeepSeek JSON:', e);
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
    return { movieData: null, sources: null, provider: 'deepseek' };
  }

  if (!API_KEY) {
    return { movieData: null, sources: null, error: 'DEEPSEEK_API_KEY is not set' };
  }

  const model = complexity === QueryComplexity.COMPLEX ? 'deepseek-reasoner' : 'deepseek-chat';

  let userPrompt = `${INITIAL_PROMPT}\n\nUser query: "${query}"`;
  if (chatHistory && chatHistory.length) {
    const hist = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    userPrompt += `\n\nConversation so far:\n${hist}`;
  }

  const body = {
    model,
    temperature: 0.6,
    messages: [
      { role: 'system', content: 'You are MovieMonk. Respond with JSON only (no markdown).'},
      { role: 'user', content: userPrompt }
    ]
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { movieData: null, sources: null, error: `DeepSeek error ${res.status}: ${errText || res.statusText}` };
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonResponse(text);
    if (!parsed) {
      return { movieData: null, sources: null, error: 'Failed to parse AI response.' };
    }

    try {
      if (!parsed.poster_url || !parsed.backdrop_url || !parsed.extra_images || parsed.extra_images.length === 0) {
        const enriched = await enrichWithTMDB(parsed);
        return { movieData: enriched, sources: null };
      }
    } catch (e) {
      console.warn('TMDB enrichment failed:', e);
    }

    return { movieData: parsed, sources: null };
  } catch (e: any) {
    return { movieData: null, sources: null, error: e?.message || 'DeepSeek request failed' };
  }
}
