/**
 * Perplexity API Service
 * Web search fallback for movies/shows not found in TMDB
 * Uses Perplexity's online model for real-time information
 */

import { MovieData } from '../types';
import { ParsedQuery, formatForAIPrompt } from './queryParser';

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';

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
        model: 'llama-3.1-sonar-large-128k-online', // Online model with web access
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

    // Parse JSON response
    const parsed = parsePerplexityResponse(content);
    
    if (!parsed || parsed.error === 'not_found') {
      console.log(`❌ Perplexity: "${parsed.title}" not found on web`);
      return null;
    }

    console.log(`✅ Perplexity: Found data for "${parsed.title}"`);
    
    // Fill in missing fields with empty values
    return {
      ...parsed,
      summary_long_spoilers: '', // AI will provide
      suspense_breaker: '', // AI will provide
      ai_notes: '', // AI will provide
      extra_images: parsed.extra_images || []
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
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Perplexity response:', e);
    console.error('Raw content:', content);
    return null;
  }
}
