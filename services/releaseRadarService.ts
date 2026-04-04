import { DiscoveryItem, WatchlistFolder } from '../types';

const RELEASE_RADAR_CACHE_KEY = 'moviemonk_release_radar_v2';
const MAX_RADAR_ITEMS_DAILY = 12;
const MAX_RADAR_ITEMS_WEEKLY = 20;
const DEFAULT_PROFILE_GENRES = ['Action', 'Drama', 'Science Fiction'];

type ReleaseRadarProfile = {
  genres: string[];
  actors: string[];
};

type CachedReleaseRadar = {
  day: string;
  profileKey: string;
  daily: DiscoveryItem[];
  weekly: DiscoveryItem[];
  checkedAt: string;
  profile: ReleaseRadarProfile;
};

type ReleaseRadarSnapshot = {
  daily: DiscoveryItem[];
  weekly: DiscoveryItem[];
  checkedAt: string;
  profile: ReleaseRadarProfile;
};

type RadarCandidate = DiscoveryItem & {
  releaseDate: string;
  overlapScore: number;
  popularity: number;
};

type NormalizedBucket = {
  key: string;
  items: RadarCandidate[];
};

function toDayKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildProfileKey(profile: ReleaseRadarProfile): string {
  return `${profile.genres.join('|').toLowerCase()}::${profile.actors.join('|').toLowerCase()}`;
}

function deriveProfile(watchlists: WatchlistFolder[]): ReleaseRadarProfile {
  const genreCounts = new Map<string, number>();
  const actorCounts = new Map<string, number>();

  watchlists.forEach((folder) => {
    folder.items.forEach((item) => {
      (item.movie?.genres || []).forEach((genre) => {
        const normalized = genre.trim();
        if (!normalized) return;
        genreCounts.set(normalized, (genreCounts.get(normalized) || 0) + 1);
      });

      (item.movie?.cast || []).slice(0, 6).forEach((member) => {
        const normalized = (member.name || '').trim();
        if (!normalized) return;
        actorCounts.set(normalized, (actorCounts.get(normalized) || 0) + 1);
      });
    });
  });

  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  const topActors = Array.from(actorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    genres: topGenres.length > 0 ? topGenres : DEFAULT_PROFILE_GENRES,
    actors: topActors
  };
}

function readCache(profileKey: string): CachedReleaseRadar | null {
  try {
    const raw = localStorage.getItem(RELEASE_RADAR_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedReleaseRadar;
    if (!parsed || parsed.day !== toDayKey()) return null;
    if (parsed.profileKey !== profileKey) return null;
    if (!Array.isArray(parsed.daily) || !Array.isArray(parsed.weekly)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(profileKey: string, snapshot: ReleaseRadarSnapshot): void {
  try {
    const payload: CachedReleaseRadar = {
      day: toDayKey(),
      profileKey,
      daily: snapshot.daily,
      weekly: snapshot.weekly,
      checkedAt: snapshot.checkedAt,
      profile: snapshot.profile
    };
    localStorage.setItem(RELEASE_RADAR_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

async function fetchTmdbResults(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<any[]> {
  const query = new URLSearchParams();
  query.set('endpoint', endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  try {
    const response = await fetch(`/api/tmdb?${query.toString()}`);
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.results) ? payload.results : [];
  } catch {
    return [];
  }
}

async function fetchGenreIdMap(): Promise<Map<string, number>> {
  const response = await fetch('/api/tmdb?endpoint=genre/movie/list&language=en-US');
  if (!response.ok) return new Map();
  const payload = await response.json();
  const genres = Array.isArray(payload?.genres) ? payload.genres : [];
  const map = new Map<string, number>();
  genres.forEach((entry: any) => {
    if (typeof entry?.id !== 'number') return;
    const name = typeof entry?.name === 'string' ? entry.name.trim().toLowerCase() : '';
    if (!name) return;
    map.set(name, entry.id);
  });
  return map;
}

async function resolvePersonIds(names: string[]): Promise<number[]> {
  const results = await Promise.all(
    names.map(async (name) => {
      const items = await fetchTmdbResults('search/person', {
        query: name,
        include_adult: 'false',
        language: 'en-US',
        page: 1
      });
      const top = items[0];
      return typeof top?.id === 'number' ? top.id : null;
    })
  );
  return results.filter((id): id is number => typeof id === 'number');
}

function normalizeCandidate(raw: any, genreIds: Set<number>, mediaTypeHint?: 'movie' | 'tv'): RadarCandidate | null {
  if (!raw || typeof raw?.id !== 'number') return null;

  const mediaType: 'movie' | 'tv' =
    raw?.media_type === 'tv' ||
    mediaTypeHint === 'tv' ||
    (!raw?.title && typeof raw?.name === 'string')
      ? 'tv'
      : 'movie';
  const title = mediaType === 'movie'
    ? (typeof raw?.title === 'string' ? raw.title.trim() : '')
    : (typeof raw?.name === 'string' ? raw.name.trim() : '');
  if (!title) return null;

  const releaseDate = mediaType === 'movie'
    ? (typeof raw?.release_date === 'string' ? raw.release_date : '')
    : (typeof raw?.first_air_date === 'string' ? raw.first_air_date : '');
  if (!releaseDate) return null;

  const genreList = Array.isArray(raw?.genre_ids)
    ? raw.genre_ids.filter((id: unknown) => typeof id === 'number')
    : [];
  const overlapScore = genreList.reduce((score: number, genreId: number) => score + (genreIds.has(genreId) ? 1 : 0), 0);

  return {
    id: raw.id,
    tmdb_id: String(raw.id),
    media_type: mediaType,
    original_language: typeof raw?.original_language === 'string' ? raw.original_language : undefined,
    title,
    year: releaseDate.slice(0, 4),
    overview: typeof raw?.overview === 'string' ? raw.overview : '',
    poster_url: typeof raw?.poster_path === 'string' && raw.poster_path
      ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
      : '',
    backdrop_url: typeof raw?.backdrop_path === 'string' && raw.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${raw.backdrop_path}`
      : '',
    rating: typeof raw?.vote_average === 'number' ? raw.vote_average : null,
    genre_ids: genreList,
    releaseDate,
    overlapScore,
    popularity: typeof raw?.popularity === 'number' ? raw.popularity : 0
  };
}

function withinWindow(releaseDate: string, start: string, end: string): boolean {
  return releaseDate >= start && releaseDate <= end;
}

function normalizeBucket(
  rawItems: any[],
  key: string,
  genreIds: Set<number>,
  startDate: string,
  endDate: string,
  mediaTypeHint?: 'movie' | 'tv'
): NormalizedBucket {
  const seen = new Set<string>();
  const items: RadarCandidate[] = [];

  rawItems.forEach((raw) => {
    const candidate = normalizeCandidate(raw, genreIds, mediaTypeHint);
    if (!candidate) return;
    if (!withinWindow(candidate.releaseDate, startDate, endDate)) return;
    const candidateKey = `${candidate.media_type}-${candidate.id}`;
    if (seen.has(candidateKey)) return;
    seen.add(candidateKey);
    items.push(candidate);
  });

  items.sort((a, b) => {
    if (a.releaseDate !== b.releaseDate) return a.releaseDate.localeCompare(b.releaseDate);
    if (b.overlapScore !== a.overlapScore) return b.overlapScore - a.overlapScore;
    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
    return b.popularity - a.popularity;
  });

  return { key, items };
}

function composeBalancedRadar(
  limit: number,
  buckets: Record<string, RadarCandidate[]>
): DiscoveryItem[] {
  const selected: RadarCandidate[] = [];
  const seen = new Set<string>();

  const pushFrom = (items: RadarCandidate[], count: number, preferMediaType?: 'movie' | 'tv') => {
    let remaining = count;
    if (remaining <= 0) return;

    const ordered = preferMediaType
      ? [...items].sort((a, b) => Number(b.media_type === preferMediaType) - Number(a.media_type === preferMediaType))
      : items;

    for (const item of ordered) {
      if (remaining <= 0 || selected.length >= limit) break;
      const key = `${item.media_type}-${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(item);
      remaining -= 1;
    }
  };

  // Guaranteed diversity first.
  pushFrom(buckets.eastAsian, 1);
  // Explicitly prioritize Indian movie for Bollywood intent.
  pushFrom(buckets.indianMovies, 1, 'movie');
  // Mostly Hollywood movies/series.
  const hollywoodTarget = Math.max(0, Math.floor(limit * 0.7));
  pushFrom(buckets.hollywood, hollywoodTarget);
  // Personalized reinforcement if available.
  pushFrom(buckets.personalized, Math.max(0, Math.floor(limit * 0.2)));
  // Fill remaining with global merged candidates.
  pushFrom(buckets.all, limit);

  return selected
    .slice(0, limit)
    .map(({ releaseDate: _releaseDate, overlapScore: _overlapScore, popularity: _popularity, ...item }) => item);
}

async function fetchRadarWindow(
  daysAhead: number,
  genreIds: number[],
  actorIds: number[]
): Promise<DiscoveryItem[]> {
  const now = new Date();
  const startDate = toIsoDate(now);
  const endDate = toIsoDate(addDays(now, daysAhead));

  const movieDateParams = {
    language: 'en-US',
    sort_by: 'primary_release_date.asc',
    include_adult: 'false',
    include_video: 'false',
    page: 1,
    'primary_release_date.gte': startDate,
    'primary_release_date.lte': endDate
  } as Record<string, string | number | undefined>;

  const tvDateParams = {
    language: 'en-US',
    sort_by: 'first_air_date.asc',
    include_adult: 'false',
    page: 1,
    'first_air_date.gte': startDate,
    'first_air_date.lte': endDate
  } as Record<string, string | number | undefined>;

  const calls = await Promise.all([
    fetchTmdbResults('discover/movie', { ...movieDateParams, with_original_language: 'en' }),
    fetchTmdbResults('discover/tv', { ...tvDateParams, with_original_language: 'en' }),

    fetchTmdbResults('discover/movie', { ...movieDateParams, with_original_language: 'ko' }),
    fetchTmdbResults('discover/movie', { ...movieDateParams, with_original_language: 'ja' }),
    fetchTmdbResults('discover/movie', { ...movieDateParams, with_original_language: 'zh' }),
    fetchTmdbResults('discover/tv', { ...tvDateParams, with_original_language: 'ko' }),
    fetchTmdbResults('discover/tv', { ...tvDateParams, with_original_language: 'ja' }),
    fetchTmdbResults('discover/tv', { ...tvDateParams, with_original_language: 'zh' }),

    fetchTmdbResults('discover/movie', { ...movieDateParams, with_original_language: 'hi' }),
    fetchTmdbResults('discover/movie', { ...movieDateParams, region: 'IN' }),
    fetchTmdbResults('discover/tv', { ...tvDateParams, with_original_language: 'hi' }),

    genreIds.length > 0
      ? fetchTmdbResults('discover/movie', { ...movieDateParams, with_genres: genreIds.join(',') })
      : Promise.resolve([]),
    actorIds.length > 0
      ? fetchTmdbResults('discover/movie', { ...movieDateParams, with_cast: actorIds.join(',') })
      : Promise.resolve([]),

    fetchTmdbResults('movie/upcoming', { language: 'en-US', page: 1 })
  ]);

  const genreSet = new Set<number>(genreIds);
  const [
    hollywoodMoviesRaw,
    hollywoodTvRaw,
    koMoviesRaw,
    jaMoviesRaw,
    zhMoviesRaw,
    koTvRaw,
    jaTvRaw,
    zhTvRaw,
    indianHiMoviesRaw,
    indianRegionMoviesRaw,
    indianHiTvRaw,
    personalizedGenresRaw,
    personalizedActorsRaw,
    upcomingRaw
  ] = calls;

  const hollywoodMovies = normalizeBucket(hollywoodMoviesRaw, 'hollywood-movies', genreSet, startDate, endDate, 'movie').items;
  const hollywoodTv = normalizeBucket(hollywoodTvRaw, 'hollywood-tv', genreSet, startDate, endDate, 'tv').items;

  const eastAsianMovies = [
    ...normalizeBucket(koMoviesRaw, 'ko-movies', genreSet, startDate, endDate, 'movie').items,
    ...normalizeBucket(jaMoviesRaw, 'ja-movies', genreSet, startDate, endDate, 'movie').items,
    ...normalizeBucket(zhMoviesRaw, 'zh-movies', genreSet, startDate, endDate, 'movie').items
  ];
  const eastAsianTv = [
    ...normalizeBucket(koTvRaw, 'ko-tv', genreSet, startDate, endDate, 'tv').items,
    ...normalizeBucket(jaTvRaw, 'ja-tv', genreSet, startDate, endDate, 'tv').items,
    ...normalizeBucket(zhTvRaw, 'zh-tv', genreSet, startDate, endDate, 'tv').items
  ];

  const indianMovies = [
    ...normalizeBucket(indianHiMoviesRaw, 'indian-hi-movies', genreSet, startDate, endDate, 'movie').items,
    ...normalizeBucket(indianRegionMoviesRaw, 'indian-region-movies', genreSet, startDate, endDate, 'movie').items
  ];
  const indianTv = normalizeBucket(indianHiTvRaw, 'indian-hi-tv', genreSet, startDate, endDate, 'tv').items;

  const personalized = [
    ...normalizeBucket(personalizedGenresRaw, 'personalized-genres', genreSet, startDate, endDate, 'movie').items,
    ...normalizeBucket(personalizedActorsRaw, 'personalized-actors', genreSet, startDate, endDate, 'movie').items
  ];
  const upcoming = normalizeBucket(upcomingRaw, 'upcoming', genreSet, startDate, endDate, 'movie').items;

  const all = [
    ...hollywoodMovies,
    ...hollywoodTv,
    ...eastAsianMovies,
    ...eastAsianTv,
    ...indianMovies,
    ...indianTv,
    ...personalized,
    ...upcoming
  ];

  const limit = daysAhead <= 2 ? MAX_RADAR_ITEMS_DAILY : MAX_RADAR_ITEMS_WEEKLY;
  return composeBalancedRadar(limit, {
    hollywood: [...hollywoodMovies, ...hollywoodTv],
    eastAsian: [...eastAsianMovies, ...eastAsianTv],
    indianMovies,
    personalized,
    all
  });
}

export function hasRadarInputs(watchlists: WatchlistFolder[]): boolean {
  return watchlists.some((folder) => folder.items.length > 0);
}

export async function loadReleaseRadarSnapshot(watchlists: WatchlistFolder[]): Promise<ReleaseRadarSnapshot> {
  const profile = deriveProfile(watchlists);
  const profileKey = buildProfileKey(profile);
  const cached = readCache(profileKey);
  if (cached) {
    return {
      daily: cached.daily,
      weekly: cached.weekly,
      checkedAt: cached.checkedAt,
      profile: cached.profile
    };
  }

  const [genreMap, actorIds] = await Promise.all([
    fetchGenreIdMap(),
    resolvePersonIds(profile.actors)
  ]);

  const genreIds = profile.genres
    .map((genre) => genreMap.get(genre.trim().toLowerCase()))
    .filter((id): id is number => typeof id === 'number');

  const [daily, weekly] = await Promise.all([
    fetchRadarWindow(2, genreIds, actorIds),
    fetchRadarWindow(10, genreIds, actorIds)
  ]);

  const snapshot: ReleaseRadarSnapshot = {
    daily,
    weekly,
    checkedAt: new Date().toISOString(),
    profile
  };
  writeCache(profileKey, snapshot);
  return snapshot;
}

