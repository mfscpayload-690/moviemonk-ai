import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';
import { sanitizeMovieData } from './movieDataValidation';

import { apiPost, getApiUrl } from '../lib/apiClient';
import { emitClientError } from './clientObservability';

// Use backend for Groq calls (API key stays server-side)
const GROQ_PROXY = getApiUrl('/api/groq');

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
    
    emitClientError(new Error('All Groq JSON parsing strategies failed'), { textLength: text.length });
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
  // Updated models: openai/gpt-oss-120b, openai/gpt-oss-20b
  const model = complexity === QueryComplexity.COMPLEX 
    ? 'openai/gpt-oss-120b'  // Best for complex reasoning
    : 'openai/gpt-oss-20b';    // Fastest for simple queries

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
    const data = await apiPost<any>(GROQ_PROXY, {
      model,
      messages,
      temperature: 0.2, // Standardized for accuracy
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      emitClientError(new Error('Groq returned empty content'));
      return { movieData: null, sources: null, error: 'Groq returned empty response' };
    }

    const movieData = sanitizeMovieData(parseJsonResponse(content));

    if (!movieData) {
      emitClientError(new Error('Failed to parse Groq response'), { rawContent: content });
      return { movieData: null, sources: null, error: 'Failed to parse Groq JSON response' };
    }

    // Enrich with TMDB data
    const enriched = sanitizeMovieData(await enrichWithTMDB(movieData));

    return {
      movieData: enriched || movieData,
      sources: null, // Groq doesn't provide grounding sources
      provider: 'groq'
    };

  } catch (error: any) {
    emitClientError(error, { service: 'groq' });
    return {
      movieData: null,
      sources: null,
      error: 'An error occurred while communicating with the AI service'
    };
  }
}

type StreamGroqTextArgs = {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
  onDelta?: (delta: string) => void;
};

/**
 * Streams plain text completions from Groq proxy (SSE) and returns the full text.
 */
export async function streamGroqText(args: StreamGroqTextArgs): Promise<string> {
  const {
    messages,
    model = 'openai/gpt-oss-20b',
    temperature = 0.2,
    max_tokens = 700,
    signal,
    onDelta
  } = args;

  const response = await fetch(GROQ_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true
    }),
    signal
  });

  if (!response.ok || !response.body) {
    const details = await response.text().catch(() => '');
    throw new Error(`Streaming request failed (${response.status}): ${details}`);
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;

      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          full += delta;
          onDelta?.(delta);
        }
      } catch {
        // Ignore non-JSON heartbeat/control frames.
      }
    }
  }

  return full;
}
