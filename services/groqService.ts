import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';

// Use proxy for Groq calls (API key stays server-side)
const GROQ_PROXY = import.meta.env.DEV
  ? 'http://localhost:3000/api/groq'
  : `${window.location.origin}/api/groq`;

const parseJsonResponse = (text: string): MovieData | null => {
  try {
    // Strategy 1: Clean and parse directly
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as MovieData;
  } catch (error) {
    console.warn("Groq direct parse failed, trying extraction...");
    
    try {
      // Strategy 2: Extract JSON from surrounding text using regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = jsonMatch[0];
        return JSON.parse(extracted) as MovieData;
      }
    } catch (e) {
      console.warn("Groq regex extraction failed");
    }
    
    try {
      // Strategy 3: Find balanced braces
      const firstBrace = text.indexOf('{');
      if (firstBrace === -1) return null;
      
      let depth = 0;
      let endBrace = -1;
      for (let i = firstBrace; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') depth--;
        if (depth === 0) {
          endBrace = i;
          break;
        }
      }
      
      if (endBrace !== -1) {
        const extracted = text.substring(firstBrace, endBrace + 1);
        return JSON.parse(extracted) as MovieData;
      }
    } catch (e) {
      console.warn("Groq brace matching failed");
    }
    
    console.error('All Groq JSON parsing strategies failed');
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
    return { movieData: null, sources: null, provider: 'groq' };
  }

  // Model selection based on complexity
  // Updated models: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
  const model = complexity === QueryComplexity.COMPLEX 
    ? 'llama-3.3-70b-versatile'  // Best for complex reasoning
    : 'llama-3.1-8b-instant';     // Fastest for simple queries (not deprecated)

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
    const response = await fetch(GROQ_PROXY, {
      method: 'POST',
      headers: {
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
      console.error('Groq API error:', response.status, errorText);
      return { 
        movieData: null, 
        sources: null, 
        error: `Groq API error: ${response.status} - ${errorText}` 
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Groq returned empty content');
      return { movieData: null, sources: null, error: 'Groq returned empty response' };
    }

    const movieData = parseJsonResponse(content);

    if (!movieData) {
      console.error('Failed to parse Groq response:', content);
      return { movieData: null, sources: null, error: 'Failed to parse Groq JSON response' };
    }

    // Enrich with TMDB data
    const enriched = await enrichWithTMDB(movieData);

    return {
      movieData: enriched || movieData,
      sources: null, // Groq doesn't provide grounding sources
      provider: 'groq'
    };

  } catch (error: any) {
    console.error('Groq service error:', error);
    return {
      movieData: null,
      sources: null,
      error: `Groq error: ${error?.message || 'Unknown error'}`
    };
  }
}
