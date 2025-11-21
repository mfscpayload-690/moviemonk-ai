import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';

const API_KEY = process.env.MISTRAL_API_KEY;
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

const parseJsonResponse = (text: string): MovieData | null => {
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as MovieData;
  } catch (error) {
    console.warn("Mistral direct parse failed, trying extraction...");
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as MovieData;
      }
    } catch (e) {
      console.warn("Mistral extraction failed");
    }
    
    console.error('Mistral JSON parsing failed');
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
    return { movieData: null, sources: null, provider: 'mistral' };
  }

  if (!API_KEY) {
    return { movieData: null, sources: null, error: 'MISTRAL_API_KEY is not set' };
  }

  // Model selection: Use FREE open-weight models for free tier
  // Free models: open-mistral-7b, open-mixtral-8x7b, open-mixtral-8x22b
  const model = complexity === QueryComplexity.COMPLEX 
    ? 'open-mixtral-8x22b'   // Free, best reasoning (22B params)
    : 'open-mixtral-8x7b';   // Free, fast and efficient (8x7B)

  // Build proper multi-turn message array
  const messages: Array<{role: string; content: string}> = [
    { role: 'system', content: INITIAL_PROMPT }
  ];
  
  // Add chat history if present (map 'model' to 'assistant', skip 'system')
  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach(msg => {
      if (msg.role === 'system') return; // Skip system messages from history
      const apiRole = msg.role === 'model' ? 'assistant' : msg.role;
      messages.push({ role: apiRole, content: msg.content });
    });
  }
  
  // Add current query
  messages.push({ role: 'user', content: query });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2, // Standardized for accuracy
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error:', response.status, errorText);
      return { 
        movieData: null, 
        sources: null, 
        error: `Mistral API error: ${response.status} - ${errorText}` 
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Mistral returned empty content');
      return { movieData: null, sources: null, error: 'Mistral returned empty response' };
    }

    const movieData = parseJsonResponse(content);

    if (!movieData) {
      console.error('Failed to parse Mistral response:', content);
      return { movieData: null, sources: null, error: 'Failed to parse Mistral JSON response' };
    }

    // Enrich with TMDB data
    const enriched = await enrichWithTMDB(movieData);

    return {
      movieData: enriched || movieData,
      sources: null,
      provider: 'mistral'
    };

  } catch (error: any) {
    console.error('Mistral service error:', error);
    return {
      movieData: null,
      sources: null,
      error: `Mistral error: ${error?.message || 'Unknown error'}`
    };
  }
}
