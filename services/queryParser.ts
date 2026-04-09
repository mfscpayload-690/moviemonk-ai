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

export type VibeIntentType = 'title_lookup' | 'vibe_discovery' | 'mixed';

export interface VibeParseResult {
  query_raw: string;
  intent_type: VibeIntentType;
  hard_constraints: {
    include_genres: string[];
    exclude_genres: string[];
    languages: string[];
    release_year_min: number | null;
    release_year_max: number | null;
    max_runtime_minutes: number | null;
    min_runtime_minutes: number | null;
    media_type: 'movie' | 'tv' | 'any';
    include_people: string[];
    exclude_people: string[];
  };
  soft_preferences: {
    tone_tags: string[];
    story_cues: string[];
    pace: 'slow' | 'medium' | 'fast' | 'any';
    intensity: 'low' | 'medium' | 'high' | 'any';
    reference_titles: string[];
  };
  ranking_hints: {
    boost_overview_terms: string[];
    boost_keyword_terms: string[];
    penalize_terms: string[];
  };
  fallback_query_terms: string[];
  confidence: number;
  notes_for_retrieval: string[];
}

const LANGUAGE_ALIASES: Record<string, string> = {
  english: 'en',
  en: 'en',
  hindi: 'hi',
  tamil: 'ta',
  telugu: 'te',
  malayalam: 'ml',
  kannada: 'kn',
  bengali: 'bn',
  marathi: 'mr',
  gujarati: 'gu',
  punjabi: 'pa',
  spanish: 'es',
  korean: 'ko',
  japanese: 'ja',
  french: 'fr',
  german: 'de',
  italian: 'it',
  chinese: 'zh',
  mandarin: 'zh',
};

const TONE_KEYWORDS: Record<string, string> = {
  'mind-bending': 'mind-bending',
  psychological: 'psychological',
  brainy: 'brainy',
  smart: 'smart',
  cerebral: 'cerebral',
  cozy: 'cozy',
  dark: 'dark',
  gritty: 'gritty',
  uplifting: 'uplifting',
  'feel-good': 'feel-good',
  'slow-burn': 'slow-burn',
  'high-octane': 'high-octane',
};

const STORY_CUE_KEYWORDS = [
  'tiger hunter',
  'local driver',
  'heist',
  'courtroom',
  'survival',
  'revenge',
];

const GENRE_ALIAS_ENTRIES: Array<{ alias: string; canonical: string[] }> = [
  { alias: 'sci fi', canonical: ['science fiction'] },
  { alias: 'scifi', canonical: ['science fiction'] },
  { alias: 'science fiction', canonical: ['science fiction'] },
  { alias: 'romcom', canonical: ['romance', 'comedy'] },
  { alias: 'suspense', canonical: ['thriller'] },
  { alias: 'kids', canonical: ['family'] },
  { alias: 'family-friendly', canonical: ['family'] },
  { alias: 'action', canonical: ['action'] },
  { alias: 'adventure', canonical: ['adventure'] },
  { alias: 'animation', canonical: ['animation'] },
  { alias: 'comedy', canonical: ['comedy'] },
  { alias: 'crime', canonical: ['crime'] },
  { alias: 'documentary', canonical: ['documentary'] },
  { alias: 'drama', canonical: ['drama'] },
  { alias: 'family', canonical: ['family'] },
  { alias: 'fantasy', canonical: ['fantasy'] },
  { alias: 'history', canonical: ['history'] },
  { alias: 'horror', canonical: ['horror'] },
  { alias: 'mystery', canonical: ['mystery'] },
  { alias: 'romance', canonical: ['romance'] },
  { alias: 'thriller', canonical: ['thriller'] },
  { alias: 'war', canonical: ['war'] },
  { alias: 'western', canonical: ['western'] },
];

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at', 'with', 'about',
  'show', 'series', 'tv', 'movie', 'film', 'please', 'find', 'me', 'something', 'that',
  'from', 'like', 'similar', 'than', 'between', 'under', 'over', 'below', 'above', 'less',
  'more', 'minutes', 'minute', 'min', 'hours', 'hour', 'hr', 'hrs', 'without', 'exclude',
  'not', 'no', 'any', 'is', 'are'
]);

function toLowerUnique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function toUniquePreserveCase(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function wordsToMinutes(value: number, unit: string): number {
  const normalized = unit.toLowerCase();
  if (normalized.startsWith('h')) return Math.round(value * 60);
  return Math.round(value);
}

function extractRuntimeBounds(lowerQuery: string): {
  min_runtime_minutes: number | null;
  max_runtime_minutes: number | null;
} {
  let min_runtime_minutes: number | null = null;
  let max_runtime_minutes: number | null = null;

  const betweenMatch = lowerQuery.match(/\bbetween\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)?\s+(?:and|to|-)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)?\b/i);
  if (betweenMatch) {
    const firstValue = Number(betweenMatch[1]);
    const firstUnit = betweenMatch[2] || betweenMatch[4] || 'minutes';
    const secondValue = Number(betweenMatch[3]);
    const secondUnit = betweenMatch[4] || firstUnit;
    const firstMinutes = wordsToMinutes(firstValue, firstUnit);
    const secondMinutes = wordsToMinutes(secondValue, secondUnit);
    min_runtime_minutes = Math.min(firstMinutes, secondMinutes);
    max_runtime_minutes = Math.max(firstMinutes, secondMinutes);
    return { min_runtime_minutes, max_runtime_minutes };
  }

  const underMatch = lowerQuery.match(/\b(?:under|less than|below)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)\b/i);
  if (underMatch) {
    max_runtime_minutes = wordsToMinutes(Number(underMatch[1]), underMatch[2]);
  }

  const overMatch = lowerQuery.match(/\b(?:over|more than|above)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)\b/i);
  if (overMatch) {
    min_runtime_minutes = wordsToMinutes(Number(overMatch[1]), overMatch[2]);
  }

  return { min_runtime_minutes, max_runtime_minutes };
}

function extractYearBounds(lowerQuery: string): { min: number | null; max: number | null } {
  let min: number | null = null;
  let max: number | null = null;

  const betweenYears = lowerQuery.match(/\bbetween\s+(19\d{2}|20\d{2})\s+(?:and|to|-)\s+(19\d{2}|20\d{2})\b/i);
  if (betweenYears) {
    const a = Number(betweenYears[1]);
    const b = Number(betweenYears[2]);
    min = Math.min(a, b);
    max = Math.max(a, b);
    return { min, max };
  }

  const after = lowerQuery.match(/\b(?:after|since)\s+(19\d{2}|20\d{2})\b/i);
  if (after) min = Number(after[1]);

  const before = lowerQuery.match(/\b(?:before|older than)\s+(19\d{2}|20\d{2})\b/i);
  if (before) max = Number(before[1]);

  const inYear = lowerQuery.match(/\bin\s+(19\d{2}|20\d{2})\b/i);
  if (inYear) {
    const exact = Number(inYear[1]);
    min = exact;
    max = exact;
  }

  return { min, max };
}

function normalizeGenreCue(phrase: string): string[] {
  const lower = phrase.toLowerCase();
  const out: string[] = [];
  for (const entry of GENRE_ALIAS_ENTRIES) {
    const pattern = new RegExp(`\\b${entry.alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(lower)) {
      out.push(...entry.canonical);
    }
  }
  return toLowerUnique(out);
}

function splitNames(raw: string): string[] {
  return raw
    .split(/,|\band\b|&|\//i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && /[a-zA-Z]/.test(part));
}

function extractPeople(rawQuery: string): { include: string[]; exclude: string[]; notes: string[] } {
  const include: string[] = [];
  const exclude: string[] = [];
  const notes: string[] = [];

  const includePatterns = [
    /\b(?:starring|featuring|with actor|with actress|actor|actress|directed by|director|by)\s+([^,.;!?]+)/ig,
  ];

  for (const pattern of includePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(rawQuery)) !== null) {
      const names = splitNames(match[1]);
      include.push(...names);
    }
  }

  const excludePattern = /\b(?:without|exclude|excluding|not)\s+([^,.;!?]+)/ig;
  let excludeMatch: RegExpExecArray | null;
  while ((excludeMatch = excludePattern.exec(rawQuery)) !== null) {
    const names = splitNames(excludeMatch[1]).filter((candidate) => {
      const genres = normalizeGenreCue(candidate);
      return genres.length === 0;
    });
    exclude.push(...names);
  }

  const uniqueInclude = toUniquePreserveCase(include);
  const uniqueExclude = toUniquePreserveCase(exclude);
  if (uniqueInclude.length > 0 || uniqueExclude.length > 0) {
    notes.push('Resolve include_people/exclude_people candidates against cast and crew credits during retrieval.');
  }

  return {
    include: uniqueInclude,
    exclude: uniqueExclude,
    notes,
  };
}

function extractReferenceTitles(rawQuery: string): string[] {
  const titles: string[] = [];
  const regex = /\b(?:like|similar to)\s+([^,.;!?]+)/ig;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawQuery)) !== null) {
    const segment = match[1]
      .split(/\b(?:but|without|exclude|excluding|with no|not|starring|featuring|directed by|with actor|with actress|in)\b/i)[0]
      .trim();
    if (!segment) continue;
    for (const part of segment.split(/\band\b|,|\//i)) {
      const title = part.trim();
      if (title) titles.push(title);
    }
  }
  return toUniquePreserveCase(titles);
}

function detectMediaType(lowerQuery: string): 'movie' | 'tv' | 'any' {
  const movieMentioned = /\b(movie|film)\b/i.test(lowerQuery);
  const tvMentioned = /\b(show|series|tv)\b/i.test(lowerQuery);
  if (movieMentioned && !tvMentioned) return 'movie';
  if (tvMentioned && !movieMentioned) return 'tv';
  return 'any';
}

function inferIntentType(
  rawQuery: string,
  includeGenres: string[],
  toneTags: string[],
  storyCues: string[],
  referenceTitles: string[]
): VibeIntentType {
  const tokenCount = rawQuery.trim().split(/\s+/).filter(Boolean).length;
  const hasVibeSignals = includeGenres.length > 0 || toneTags.length > 0 || storyCues.length > 0;
  const hasReferenceSignals = referenceTitles.length > 0;
  const hasLookupSignals = /\b(plot|cast|ending|runtime|who is in|what is)\b/i.test(rawQuery) || /\b(19\d{2}|20\d{2})\b/.test(rawQuery);

  if (!hasVibeSignals && !hasReferenceSignals && (hasLookupSignals || tokenCount <= 4)) {
    return 'title_lookup';
  }
  if (hasVibeSignals && hasReferenceSignals) {
    return 'mixed';
  }
  return 'vibe_discovery';
}

function clampConfidence(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(2));
}

export function parseVibeQuery(query: string): VibeParseResult {
  const query_raw = (query || '').trim();
  const lowerQuery = query_raw.toLowerCase();

  const includeGenres = normalizeGenreCue(lowerQuery);
  const excludeGenres: string[] = [];
  const negatedTerms: string[] = [];

  const negationRegex = /\b(not|no|exclude|excluding|without)\s+([^,.;!?]+)/ig;
  let negationMatch: RegExpExecArray | null;
  while ((negationMatch = negationRegex.exec(query_raw)) !== null) {
    const negWord = negationMatch[1].toLowerCase();
    const phraseRaw = negationMatch[2]
      .split(/\b(?:with|starring|featuring|directed by|in|like|similar to|between|under|over|less than|more than|above|below)\b/i)[0]
      .trim();
    if (!phraseRaw) continue;
    const phraseLower = phraseRaw.toLowerCase();
    const excludedGenres = normalizeGenreCue(phraseLower);
    if (excludedGenres.length > 0) {
      excludeGenres.push(...excludedGenres);
    }
    negatedTerms.push(`${negWord} ${phraseLower}`);
  }

  const languages = toLowerUnique(
    Object.keys(LANGUAGE_ALIASES)
      .filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(lowerQuery))
      .map((term) => LANGUAGE_ALIASES[term])
  );

  const { min: releaseYearMin, max: releaseYearMax } = extractYearBounds(lowerQuery);
  const runtimeBounds = extractRuntimeBounds(lowerQuery);
  const mediaType = detectMediaType(lowerQuery);

  const people = extractPeople(query_raw);

  const toneTags = toLowerUnique(
    Object.keys(TONE_KEYWORDS)
      .filter((term) => new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(lowerQuery))
      .map((term) => TONE_KEYWORDS[term])
  );

  const storyCues = toLowerUnique(
    STORY_CUE_KEYWORDS.filter((cue) => new RegExp(`\\b${cue.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(lowerQuery))
  );

  const referenceTitles = extractReferenceTitles(query_raw);

  let pace: 'slow' | 'medium' | 'fast' | 'any' = 'any';
  if (/\b(slow-burn|slow)\b/i.test(lowerQuery)) pace = 'slow';
  if (/\b(high-octane|fast-paced|fast)\b/i.test(lowerQuery)) pace = 'fast';

  let intensity: 'low' | 'medium' | 'high' | 'any' = 'any';
  if (/\b(cozy|feel-good|light)\b/i.test(lowerQuery)) intensity = 'low';
  if (/\b(gritty|dark|intense|high-octane)\b/i.test(lowerQuery)) intensity = 'high';

  const includeGenresClean = toLowerUnique(includeGenres);
  const excludeGenresClean = toLowerUnique(excludeGenres);
  const excludedGenreSet = new Set(excludeGenresClean);
  const includeGenresFinal = includeGenresClean.filter((genre) => !excludedGenreSet.has(genre));

  const includePeople = toUniquePreserveCase(people.include);
  const excludePeople = toUniquePreserveCase(people.exclude);
  const excludePeopleSet = new Set(excludePeople.map((name) => name.toLowerCase()));
  const includePeopleFinal = includePeople.filter((name) => !excludePeopleSet.has(name.toLowerCase()));

  const boostOverviewTerms = toLowerUnique([...toneTags, ...storyCues]);
  const boostKeywordTerms = toLowerUnique([
    ...includeGenresFinal,
    ...languages,
    ...storyCues,
    ...toneTags,
    ...includePeopleFinal.map((name) => name.toLowerCase()),
  ]);
  const penalizeTerms = toLowerUnique([
    ...negatedTerms,
    ...excludeGenresClean,
    ...excludePeople.map((name) => name.toLowerCase()),
  ]);

  const fallbackQueryTerms = toLowerUnique(
    lowerQuery
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1 && !STOPWORDS.has(token))
  );

  const intentType = inferIntentType(query_raw, includeGenresFinal, toneTags, storyCues, referenceTitles);

  let confidence = 0.84;
  if (!query_raw) confidence = 0.05;
  if (query_raw && query_raw.split(/\s+/).length <= 3) confidence -= 0.2;
  if (fallbackQueryTerms.length === 0) confidence -= 0.25;
  if (
    includeGenresFinal.length === 0 &&
    excludeGenresClean.length === 0 &&
    toneTags.length === 0 &&
    storyCues.length === 0 &&
    referenceTitles.length === 0 &&
    includePeopleFinal.length === 0
  ) {
    confidence -= 0.25;
  }

  const notesForRetrieval = [...people.notes];
  if (runtimeBounds.min_runtime_minutes !== null || runtimeBounds.max_runtime_minutes !== null) {
    notesForRetrieval.push('Apply runtime bounds as hard filters where runtime metadata is available.');
  }
  if (referenceTitles.length > 0) {
    notesForRetrieval.push('Use reference_titles for similarity reranking after broad retrieval.');
  }
  if (confidence < 0.55) {
    notesForRetrieval.push('Parser uncertainty is high; keep retrieval broad and rely on reranking signals.');
  }

  return {
    query_raw,
    intent_type: intentType,
    hard_constraints: {
      include_genres: includeGenresFinal,
      exclude_genres: excludeGenresClean,
      languages,
      release_year_min: releaseYearMin,
      release_year_max: releaseYearMax,
      max_runtime_minutes: runtimeBounds.max_runtime_minutes,
      min_runtime_minutes: runtimeBounds.min_runtime_minutes,
      media_type: mediaType,
      include_people: includePeopleFinal,
      exclude_people: excludePeople,
    },
    soft_preferences: {
      tone_tags: toneTags,
      story_cues: storyCues,
      pace,
      intensity,
      reference_titles: referenceTitles,
    },
    ranking_hints: {
      boost_overview_terms: boostOverviewTerms,
      boost_keyword_terms: boostKeywordTerms,
      penalize_terms: penalizeTerms,
    },
    fallback_query_terms: fallbackQueryTerms,
    confidence: clampConfidence(confidence),
    notes_for_retrieval: toLowerUnique(notesForRetrieval),
  };
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

  // Check for explicit media type with common typos
  if (result.type === 'auto') {
    if (/\b(show|series|serees|seris|tv|tv\s+show|tv\s+series|season)\b/i.test(remaining)) {
      result.type = 'show';
    } else if (/\b(movie|moive|film|movies)\b/i.test(remaining)) {
      result.type = 'movie';
    }
  }

  // Clean up common noise and action words
  const noiseRegex = /\b(movie|moive|film|movies|show|series|serees|seris|tv|tv\s+show|tv\s+series|watch|online|free|download|hd|1080p|4k)\b/gi;
  remaining = remaining
    .replace(noiseRegex, '')
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
