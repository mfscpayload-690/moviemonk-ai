import { SoundtrackData, SoundtrackTrack } from '../types';

/**
 * Normalizes strings by lowercasing, stripping special punctuation, and collapsing whitespace.
 */
export function normalizeText(str = ''): string {
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether text contains a whole phrase/token sequence rather than a partial substring
 * (e.g., prevents "Up" from matching "Super 8").
 */
export function containsPhrase(haystack: string, phrase: string): boolean {
  if (!haystack || !phrase) return false;
  // Boundary check with word start/end or space boundaries
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
  return regex.test(haystack);
}

export const RAW_SPAM_ALBUM_KEYWORDS = [
  'karaoke',
  'tribute',
  'ringtone',
  '8-bit',
  'lullaby',
  'cover band',
  'made famous by',
  'in the style of',
  'piano version',
  'instrumental cover',
];

// Pre-normalized spam keywords to ensure punctuation (e.g. 8-bit -> 8 bit) matches normalized album text
export const SPAM_ALBUM_KEYWORDS = RAW_SPAM_ALBUM_KEYWORDS.map((kw) => normalizeText(kw));

interface FetchTitleSoundtrackOptions {
  title: string;
  originalTitle?: string;
  releaseYear?: string | number;
  composer?: string;
  countryCode?: string;
  signal?: AbortSignal;
}

// In-memory cache to avoid repeated iTunes network hits within the session
const soundtrackMemoryCache = new Map<string, SoundtrackData>();
const MAX_CACHE_SIZE = 50;

/**
 * Resolves user region for iTunes search, defaulting to 'US'.
 */
export function getSoundtrackRegion(override?: string): string {
  if (override && /^[A-Za-z]{2}$/.test(override)) {
    return override.toUpperCase();
  }
  if (typeof window !== 'undefined') {
    const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
    for (const locale of candidates) {
      if (typeof locale !== 'string') continue;
      const region = locale.split('-')[1];
      if (region && /^[A-Za-z]{2}$/.test(region)) {
        return region.toUpperCase();
      }
    }
  }
  return 'US';
}

/**
 * Clears the soundtrack in-memory cache (primarily for tests).
 */
export function clearSoundtrackCache(): void {
  soundtrackMemoryCache.clear();
}

/**
 * Helper to validate candidate tracks against title, spam, year, and deduplication.
 */
function validateTracks(
  items: any[],
  normTitle: string,
  normOriginalTitle: string,
  normComposer: string,
  parsedYear: number | null,
  seenTracks: Set<string>,
  rawTitle: string
): SoundtrackTrack[] {
  const verified: SoundtrackTrack[] = [];

  for (const item of items) {
    if (!item.trackName || !item.collectionName) continue;

    const normCollection = normalizeText(item.collectionName);
    const normArtist = normalizeText(item.artistName || '');
    const normTrack = normalizeText(item.trackName);

    // Rule 1: Album name or track title must match title or originalTitle phrase
    const titleInAlbum =
      containsPhrase(normCollection, normTitle) ||
      (normOriginalTitle && containsPhrase(normCollection, normOriginalTitle));

    const titleInTrack =
      containsPhrase(normTrack, normTitle) ||
      (normOriginalTitle && containsPhrase(normTrack, normOriginalTitle));

    const matchesTitle = titleInAlbum || titleInTrack;

    // Reject tracks that don't match the title, even if artist matches composer
    if (!matchesTitle) continue;

    // Rule 2: Exclude karaoke, tribute, ringtone, and cover spam albums
    const isSpamAlbum = SPAM_ALBUM_KEYWORDS.some((kw) =>
      normCollection.includes(kw)
    );
    if (isSpamAlbum) continue;

    // Rule 3: Release year proximity check (-1 to +2 years from release)
    if (parsedYear && item.releaseDate) {
      const trackYear = parseInt(String(item.releaseDate).slice(0, 4), 10);
      if (!isNaN(trackYear) && (trackYear < parsedYear - 1 || trackYear > parsedYear + 2)) {
        continue;
      }
    }

    // Rule 4: Deduplicate identical track names
    if (seenTracks.has(normTrack)) continue;
    seenTracks.add(normTrack);

    // Format duration (m:ss)
    const totalSeconds = Math.floor((item.trackTimeMillis || 0) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = String(totalSeconds % 60).padStart(2, '0');

    // High-res cover art (300x300)
    const coverArt = item.artworkUrl100
      ? item.artworkUrl100.replace('100x100bb', '300x300bb')
      : null;

    // Deep link search queries
    const songSearchQuery = encodeURIComponent(
      `${item.trackName} ${item.artistName} ${rawTitle}`.trim()
    );

    verified.push({
      id: item.trackId,
      title: item.trackName,
      artist: item.artistName || 'Unknown Artist',
      album: item.collectionName,
      duration: totalSeconds > 0 ? `${mins}:${secs}` : null,
      coverArt,
      previewUrl: item.previewUrl || null,
      spotifyUrl: `https://open.spotify.com/search/${songSearchQuery}`,
      youtubeUrl: `https://www.youtube.com/results?search_query=${songSearchQuery}`,
    });
  }

  return verified;
}

/**
 * Fetches and strictly validates official soundtrack tracks for a title from Apple iTunes Search API.
 */
export async function fetchTitleSoundtrack({
  title,
  originalTitle,
  releaseYear,
  composer,
  countryCode,
  signal,
}: FetchTitleSoundtrackOptions): Promise<SoundtrackData> {
  const fallbackQuery = encodeURIComponent(
    `${title} ${composer || ''} soundtrack`.trim()
  );

  const fallbackLinks = {
    spotifyUrl: `https://open.spotify.com/search/${fallbackQuery}`,
    youtubeUrl: `https://www.youtube.com/results?search_query=${fallbackQuery}`,
  };

  if (!title || !title.trim()) {
    return { tracks: [], fallbackLinks };
  }

  const region = getSoundtrackRegion(countryCode);
  const normTitle = normalizeText(title);
  const normOriginalTitle = originalTitle ? normalizeText(originalTitle) : '';
  const normComposer = composer ? normalizeText(composer) : '';
  const parsedYear = releaseYear ? parseInt(String(releaseYear), 10) : null;

  // Cache key includes composer to avoid collisions when composer changes
  const cacheKey = `${normTitle}_${normOriginalTitle}_${parsedYear || ''}_${normComposer}_${region}`;

  if (soundtrackMemoryCache.has(cacheKey)) {
    return soundtrackMemoryCache.get(cacheKey)!;
  }

  const queryItunes = async (searchTerm: string): Promise<any[]> => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      searchTerm
    )}&media=music&entity=song&country=${region}&limit=30`;

    const res = await fetch(url, { signal });
    if (!res.ok) {
      // Throw on HTTP error so we do not cache broken/rate-limited responses as empty results
      throw new Error(`iTunes API HTTP error: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  };

  try {
    const seenTracks = new Set<string>();

    // Step 1: Primary search: Title + Composer + soundtrack
    const primaryTerm = `${title} ${composer || ''} soundtrack`.trim();
    const primaryRaw = await queryItunes(primaryTerm);

    const verifiedTracks = validateTracks(
      primaryRaw,
      normTitle,
      normOriginalTitle,
      normComposer,
      parsedYear,
      seenTracks,
      title
    );

    // Step 2: Fallback search if validated primary results yield fewer than 2 tracks
    if (verifiedTracks.length < 2) {
      const secondaryTerm = `${
        originalTitle || title
      } original motion picture soundtrack`.trim();
      const secondaryRaw = await queryItunes(secondaryTerm);

      const secondaryVerified = validateTracks(
        secondaryRaw,
        normTitle,
        normOriginalTitle,
        normComposer,
        parsedYear,
        seenTracks,
        title
      );

      verifiedTracks.push(...secondaryVerified);
    }

    const result: SoundtrackData = {
      tracks: verifiedTracks,
      fallbackLinks,
    };

    // Cache valid results
    if (soundtrackMemoryCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = soundtrackMemoryCache.keys().next().value;
      if (oldestKey) soundtrackMemoryCache.delete(oldestKey);
    }
    soundtrackMemoryCache.set(cacheKey, result);

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { tracks: [], fallbackLinks };
    }
    console.warn('[MovieMonk AI] Soundtrack fetch error:', error);
    return { tracks: [], fallbackLinks };
  }
}
