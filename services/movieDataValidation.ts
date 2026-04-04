import { MovieData, Rating, WatchOption, CastMember, Crew } from '../types';

const toStringSafe = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toStringSafe(item).trim()).filter(Boolean);
};

const normalizeMovieType = (value: unknown): MovieData['type'] => {
  const raw = toStringSafe(value).toLowerCase();
  if (raw === 'show' || raw === 'song' || raw === 'franchise') return raw;
  return 'movie';
};

const normalizeWatchType = (value: unknown): WatchOption['type'] => {
  const raw = toStringSafe(value).toLowerCase();
  if (raw === 'subscription' || raw === 'rent' || raw === 'free' || raw === 'buy') return raw;
  return 'subscription';
};

const sanitizeCast = (value: unknown): CastMember[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;
      const name = toStringSafe(data.name).trim();
      const role = toStringSafe(data.role).trim();
      const known_for = toStringSafe(data.known_for).trim();
      if (!name && !role) return null;
      return { name, role, known_for };
    })
    .filter((item): item is CastMember => item !== null)
    .slice(0, 40);
};

const sanitizeCrew = (value: unknown): Crew => {
  if (!value || typeof value !== 'object') {
    return { director: '', writer: '', music: '' };
  }
  const data = value as Record<string, unknown>;
  return {
    director: toStringSafe(data.director),
    writer: toStringSafe(data.writer),
    music: toStringSafe(data.music)
  };
};

const sanitizeRatings = (value: unknown): Rating[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;
      const source = toStringSafe(data.source).trim();
      const score = toStringSafe(data.score).trim();
      if (!source && !score) return null;
      return { source, score };
    })
    .filter((item): item is Rating => item !== null)
    .slice(0, 20);
};

const sanitizeWhereToWatch = (value: unknown): WatchOption[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): WatchOption | null => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;
      const platform = toStringSafe(data.platform).trim();
      const link = toStringSafe(data.link).trim();
      if (!platform && !link) return null;
      const normalized: WatchOption = {
        platform,
        link,
        type: normalizeWatchType(data.type),
        confidence: typeof data.confidence === 'number'
          ? Math.max(0, Math.min(100, Math.round(data.confidence)))
          : undefined,
        last_checked_at: toStringSafe(data.last_checked_at) || undefined,
        region: toStringSafe(data.region) || undefined
      };
      return normalized;
    })
    .filter((item): item is WatchOption => item !== null)
    .slice(0, 20);
};

export function sanitizeMovieData(input: unknown): MovieData | null {
  if (!input || typeof input !== 'object') return null;

  const data = input as Record<string, unknown>;
  const movie: MovieData = {
    tmdb_id: toStringSafe(data.tmdb_id) || undefined,
    title: toStringSafe(data.title),
    year: toStringSafe(data.year),
    type: normalizeMovieType(data.type),
    media_type: toStringSafe(data.media_type) || undefined,
    genres: toStringArray(data.genres),
    poster_url: toStringSafe(data.poster_url),
    backdrop_url: toStringSafe(data.backdrop_url),
    trailer_url: toStringSafe(data.trailer_url),
    ratings: sanitizeRatings(data.ratings),
    cast: sanitizeCast(data.cast),
    crew: sanitizeCrew(data.crew),
    summary_short: toStringSafe(data.summary_short),
    summary_medium: toStringSafe(data.summary_medium),
    summary_long_spoilers: toStringSafe(data.summary_long_spoilers),
    suspense_breaker: toStringSafe(data.suspense_breaker),
    where_to_watch: sanitizeWhereToWatch(data.where_to_watch),
    extra_images: toStringArray(data.extra_images),
    ai_notes: toStringSafe(data.ai_notes)
  };

  if (data.tvShow && typeof data.tvShow === 'object') {
    movie.tvShow = data.tvShow as MovieData['tvShow'];
  }

  return movie;
}

export function hasDisplayableTitle(movieData: MovieData | null | undefined): boolean {
  return Boolean(movieData && movieData.title && movieData.title.trim().length > 0);
}
