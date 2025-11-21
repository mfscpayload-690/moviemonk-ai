/**
 * Query Parser Utility
 * Extracts structured information from natural language movie/show queries
 */

export interface ParsedQuery {
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  type?: 'movie' | 'show' | 'auto';
  isRecent: boolean; // 2024-2025
  hasSeasonInfo: boolean;
  hasDetailedRequest: boolean; // Keywords like "detailed", "full plot", "spoilers"
  originalQuery: string;
}

/**
 * Parse user query to extract title, year, season, episode
 * Examples:
 *   "Interstellar 2014" → {title: "Interstellar", year: 2014}
 *   "You season 5" → {title: "You", season: 5, type: "show"}
 *   "Breaking Bad S03E02" → {title: "Breaking Bad", season: 3, episode: 2}
 *   "Dune Part Two" → {title: "Dune Part Two"}
 */
export function parseQuery(query: string): ParsedQuery {
  const original = query.trim();
  let remaining = original;

  const result: ParsedQuery = {
    title: '',
    originalQuery: original,
    isRecent: false,
    hasSeasonInfo: false,
    hasDetailedRequest: false,
    type: 'auto'
  };

  // Check for detailed plot requests
  const detailedKeywords = /\b(detailed|full plot|complete|spoilers?|breakdown|analysis|in-depth)\b/i;
  result.hasDetailedRequest = detailedKeywords.test(remaining);

  // Extract year (4 digits)
  const yearMatch = remaining.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1]);
    result.isRecent = result.year >= 2024;
    remaining = remaining.replace(yearMatch[0], '').trim();
  } else {
    // Check if query mentions "2024" or "2025" without it being a year
    const currentYearCheck = /\b(2024|2025)\b/i;
    if (currentYearCheck.test(remaining)) {
      result.isRecent = true;
    }
  }

  // Extract season/episode - Format: S01E02, Season 1, s01, etc.
  const seasonEpisodeMatch = remaining.match(/\bS(\d{1,2})E(\d{1,2})\b/i);
  if (seasonEpisodeMatch) {
    result.season = parseInt(seasonEpisodeMatch[1]);
    result.episode = parseInt(seasonEpisodeMatch[2]);
    result.hasSeasonInfo = true;
    result.type = 'show';
    remaining = remaining.replace(seasonEpisodeMatch[0], '').trim();
  } else {
    // Try "Season X" or "season X" format
    const seasonMatch = remaining.match(/\bseason\s+(\d{1,2})\b/i);
    if (seasonMatch) {
      result.season = parseInt(seasonMatch[1]);
      result.hasSeasonInfo = true;
      result.type = 'show';
      remaining = remaining.replace(seasonMatch[0], '').trim();
    } else {
      // Try "S01" or "s1" format
      const shortSeasonMatch = remaining.match(/\bs(\d{1,2})\b/i);
      if (shortSeasonMatch) {
        result.season = parseInt(shortSeasonMatch[1]);
        result.hasSeasonInfo = true;
        result.type = 'show';
        remaining = remaining.replace(shortSeasonMatch[0], '').trim();
      }
    }

    // Try "Episode X" format (only if season was found)
    if (result.season) {
      const episodeMatch = remaining.match(/\bepisode\s+(\d{1,2})\b/i);
      if (episodeMatch) {
        result.episode = parseInt(episodeMatch[1]);
        remaining = remaining.replace(episodeMatch[0], '').trim();
      }
    }
  }

  // Clean up common words
  remaining = remaining
    .replace(/\b(movie|film|show|series|tv\s+show|tv\s+series)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading/trailing punctuation and extra spaces
  result.title = remaining
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If title is empty, use original query
  if (!result.title) {
    result.title = original;
  }

  return result;
}

/**
 * Auto-detect if query should use complex model
 */
export function shouldUseComplexModel(parsed: ParsedQuery): boolean {
  // Use complex model for:
  // 1. Detailed plot requests
  // 2. Recent releases (may need more reasoning)
  // 3. Season/episode specific queries (needs context)
  return (
    parsed.hasDetailedRequest ||
    parsed.isRecent ||
    parsed.hasSeasonInfo
  );
}

/**
 * Format query for TMDB search
 */
export function formatForTMDBSearch(parsed: ParsedQuery): string {
  let searchQuery = parsed.title;
  if (parsed.year) {
    searchQuery += ` ${parsed.year}`;
  }
  return searchQuery;
}

/**
 * Format query for AI prompt (include all context)
 */
export function formatForAIPrompt(parsed: ParsedQuery): string {
  const parts: string[] = [];
  
  parts.push(`Title: "${parsed.title}"`);
  
  if (parsed.year) {
    parts.push(`Year: ${parsed.year}`);
  }
  
  if (parsed.season) {
    parts.push(`Season: ${parsed.season}`);
    if (parsed.episode) {
      parts.push(`Episode: ${parsed.episode}`);
    }
  }
  
  if (parsed.type !== 'auto') {
    parts.push(`Type: ${parsed.type}`);
  }
  
  return parts.join(', ');
}
