/**
 * Perplexity API Service
 * Web search fallback for movies/shows not found in TMDB
 * Uses Perplexity's online model for real-time information
 */

import { MovieData, ChatMessage, QueryComplexity, FetchResult } from '../types';
import { ParsedQuery, formatForAIPrompt } from './queryParser';

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';

/**
 * Fetch movie data using Perplexity (matches interface of other services)
 */
export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return {
        movieData: null,
        sources: null,
        error: 'PERPLEXITY_API_KEY not configured'
      };
    }

    console.log(`🔍 Perplexity: Fetching data for "${query}"`);

    // Build comprehensive prompt
    const prompt = `Search the web and provide comprehensive information about: ${query}

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "year": "string",
  "type": "movie or show",
  "genres": ["string"],
  "poster_url": "string",
  "backdrop_url": "string",
  "trailer_url": "string (YouTube)",
  "ratings": [{"source": "IMDb|Rotten Tomatoes|Metacritic", "score": "string"}],
  "cast": [{"name": "string", "role": "string", "known_for": "string"}],
  "crew": {"director": "string", "writer": "string", "music": "string"},
  "summary_short": "200 chars, NO spoilers",
  "summary_medium": "500 chars, NO spoilers",
  "summary_long_spoilers": "Full plot with spoilers",
  "suspense_breaker": "One-line spoiler warning",
  "where_to_watch": [{"platform": "string", "link": "string", "type": "subscription|rent|buy|free"}],
  "ai_notes": "Interesting trivia or notes",
  "extra_images": []
}`;

    const response = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: complexity === QueryComplexity.COMPLEX 
          ? 'sonar-pro' 
          : 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a movie database expert with web access. Provide accurate, factual information. Return ONLY valid JSON.'
          },
          ...(chatHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: complexity === QueryComplexity.COMPLEX ? 8000 : 4000,
        return_citations: true,
        return_images: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Perplexity API error ${response.status}:`, errorText);
      return {
        movieData: null,
        sources: null,
        error: `Perplexity API error: ${response.status}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        movieData: null,
        sources: null,
        error: 'Perplexity returned empty response'
      };
    }

    const movieData = parsePerplexityResponse(content);
    
    if (!movieData || movieData.error) {
      return {
        movieData: null,
        sources: null,
        error: 'Movie not found or parsing failed'
      };
    }

    console.log(`✅ Perplexity: Successfully fetched "${movieData.title}"`);

    // Extract sources from citations
    const sources = data.citations?.map((cite: any) => ({
      uri: cite.url,
      title: cite.title || cite.url
    })) || null;

    return {
      movieData,
      sources,
      provider: 'perplexity'
    };

  } catch (error: any) {
    console.error('❌ Perplexity error:', error);
    return {
      movieData: null,
      sources: null,
      error: error?.message || 'Unknown Perplexity error'
    };
  }
}

/**
 * Search web using Perplexity for movie/show information
 */
export async function searchWithPerplexity(parsed: ParsedQuery): Promise<MovieData | null> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  PERPLEXITY_API_KEY not configured - skipping web search');
      return null;
    }

    console.log(`🔍 Perplexity: Searching web for "${parsed.title}"`);

    const searchPrompt = `Find comprehensive information about the ${parsed.type === 'show' ? 'TV show' : 'movie'}: ${formatForAIPrompt(parsed)}

Search the web and provide factual information about:
- Official title and release year
- Type (movie or TV show)
- Genres
- Main cast members (top 10) with their character names
- Director, writer, and composer
- IMDb and Rotten Tomatoes ratings
- Official poster and backdrop image URLs (from IMDb or official sources)
- YouTube trailer URL
- Streaming platforms where it's available (subscription/rent/buy)
- Brief plot summary (200 characters max, NO spoilers)
- Medium plot summary (500 characters max, NO spoilers)

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "year": "string",
  "type": "movie or show",
  "genres": ["string"],
  "poster_url": "string",
  "backdrop_url": "string",
  "trailer_url": "string",
  "ratings": [{"source": "string", "score": "string"}],
  "cast": [{"name": "string", "role": "string", "known_for": "string"}],
  "crew": {"director": "string", "writer": "string", "music": "string"},
  "summary_short": "string",
  "summary_medium": "string",
  "where_to_watch": [{"platform": "string", "link": "string", "type": "subscription|rent|buy|free"}],
  "extra_images": []
}

If not found, return: {"error": "not_found"}`;

    const response = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar', // Online model with web access
        messages: [
          {
            role: 'system',
            content: 'You are a movie database expert. Search the web for accurate, factual information about movies and TV shows. Return ONLY valid JSON, no markdown.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.1, // Very low for factual accuracy
        max_tokens: 4000,
        return_citations: true, // Get sources
        return_images: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Perplexity API error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('⚠️  Perplexity returned empty response');
      return null;
    }

    // Parse JSON response (avoid shadowing function parameter "parsed")
    const parsedResponse = parsePerplexityResponse(content);
    
    if (!parsedResponse || parsedResponse.error === 'not_found') {
      console.log(`❌ Perplexity: "${parsedResponse?.title || parsed.title}" not found on web`);
      return null;
    }

    console.log(`✅ Perplexity: Found data for "${parsedResponse.title}"`);
    
    // Fill in missing fields with empty values
    return {
      ...parsedResponse,
      summary_long_spoilers: '', // AI will provide
      suspense_breaker: '', // AI will provide
      ai_notes: '', // AI will provide
      extra_images: parsedResponse.extra_images || []
    };

  } catch (error) {
    console.error('❌ Perplexity search error:', error);
    return null;
  }
}

/**
 * Parse Perplexity JSON response
 */
function parsePerplexityResponse(content: string): any {
  let parsed: any = null;
  try {
    // Remove markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\s*/g, '');
    }

    // Try to extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    console.error('Failed to parse Perplexity response:', e);
    console.error('Raw content:', content);
    return null;
  }
}
