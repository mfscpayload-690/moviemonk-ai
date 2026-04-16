import type { MovieData } from '../types';

type SeoPersonPayload = {
  person: {
    id: number;
    name: string;
    biography?: string;
    birthday?: string;
    place_of_birth?: string;
    profile_url?: string;
    known_for_department?: string;
  };
  top_work?: Array<{
    id: number;
    title: string;
    media_type?: 'movie' | 'tv';
  }>;
  known_for_tags?: string[];
  sources?: Array<{ url: string }>;
};

export const SITE_NAME = 'MovieMonk';
export const SITE_URL = 'https://moviemonk-ai.vercel.app';
export const DEFAULT_DESCRIPTION = 'Discover trending movies and TV shows, then dive deeper with MovieMonk\'s AI-assisted details.';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/asset/android-chrome-512x512.png`;

export function buildAbsoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, SITE_URL).toString();
}

export function buildPageTitle(title: string): string {
  const normalized = String(title || '').trim();
  if (!normalized) return SITE_NAME;
  if (normalized.toLowerCase().includes(SITE_NAME.toLowerCase())) return normalized;
  return `${normalized} | ${SITE_NAME}`;
}

export function toMetaDescription(value?: string | null, fallback = DEFAULT_DESCRIPTION): string {
  const normalized = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return fallback;
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157).trimEnd()}...`;
}

export function stripHtmlTags(value?: string | null): string {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeRatingValue(score: string): number | null {
  const normalized = String(score || '').trim();
  if (!normalized) return null;

  const outOfTenMatch = normalized.match(/(\d+(?:\.\d+)?)\s*\/\s*10/i);
  if (outOfTenMatch) return Number(outOfTenMatch[1]);

  const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) return Math.round((Number(percentMatch[1]) / 10) * 10) / 10;

  const plainNumber = Number(normalized);
  if (Number.isFinite(plainNumber)) {
    return plainNumber > 10 ? Math.round((plainNumber / 10) * 10) / 10 : plainNumber;
  }

  return null;
}

export function buildMovieJsonLd(movie: MovieData): Record<string, unknown> {
  const isTv = Boolean(movie.tvShow);
  const description = toMetaDescription(movie.summary_short || movie.summary_medium);
  const directorName = movie.crew?.director?.trim();
  const writerName = movie.crew?.writer?.trim();
  const aggregateRatingSource = Array.isArray(movie.ratings)
    ? movie.ratings.find((rating) => rating.source.toLowerCase().includes('imdb') || rating.source.toLowerCase().includes('tmdb'))
    : undefined;
  const aggregateRatingValue = aggregateRatingSource ? normalizeRatingValue(aggregateRatingSource.score) : null;

  const baseData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isTv ? 'TVSeries' : 'Movie',
    name: movie.title,
    description,
    image: movie.poster_url || movie.backdrop_url || DEFAULT_SOCIAL_IMAGE,
    url: buildAbsoluteUrl(`/${isTv ? 'tv' : 'movie'}/${movie.tmdb_id || ''}`),
    genre: Array.isArray(movie.genres) ? movie.genres : undefined,
    inLanguage: movie.language || undefined
  };

  if (movie.year) {
    baseData.datePublished = movie.year;
  }

  if (movie.cast?.length) {
    baseData.actor = movie.cast.slice(0, 6).map((member) => ({
      '@type': 'Person',
      name: member.name
    }));
  }

  if (directorName) {
    baseData.director = {
      '@type': 'Person',
      name: directorName
    };
  }

  if (writerName) {
    baseData.creator = {
      '@type': 'Person',
      name: writerName
    };
  }

  if (aggregateRatingValue !== null) {
    baseData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRatingValue,
      bestRating: 10,
      worstRating: 0
    };
  }

  return baseData;
}

export function buildPersonJsonLd(data: SeoPersonPayload): Record<string, unknown> {
  const notableWork = (data.top_work || []).slice(0, 6).map((credit) => ({
    '@type': credit.media_type === 'tv' ? 'TVSeries' : 'Movie',
    name: credit.title,
    url: buildAbsoluteUrl(`/${credit.media_type === 'tv' ? 'tv' : 'movie'}/${credit.id}`)
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.person.name,
    description: toMetaDescription(data.person.biography, `${data.person.name} filmography and biography on ${SITE_NAME}.`),
    image: data.person.profile_url || DEFAULT_SOCIAL_IMAGE,
    url: buildAbsoluteUrl(`/person/${data.person.id}`),
    birthDate: data.person.birthday || undefined,
    birthPlace: data.person.place_of_birth
      ? {
          '@type': 'Place',
          name: data.person.place_of_birth
        }
      : undefined,
    jobTitle: data.person.known_for_department || undefined,
    knowsAbout: Array.isArray(data.known_for_tags) ? data.known_for_tags : undefined,
    sameAs: Array.isArray(data.sources) ? data.sources.map((source) => source.url).filter(Boolean) : undefined,
    notableWork: notableWork.length > 0 ? notableWork : undefined
  };
}
