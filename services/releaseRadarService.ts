import { DiscoveryItem, WatchlistFolder } from '../types';

const RELEASE_RADAR_CACHE_KEY = 'moviemonk_release_radar_v3';
const RELEASE_RADAR_LIMIT = 12;
const RELEASE_WINDOW_DAYS = 45;
const DEFAULT_PROFILE_GENRES = ['Action', 'Drama', 'Science Fiction'];
const BANNED_TV_GENRES = '99,10764,10767,10763';
const BANNED_MOVIE_GENRES = '99';
const BANNED_KEYWORD_PATTERN = /\b(wwe|nxt|wrestl|ufc|boxing|stand\s*&\s*deliver|countdown|world\s*tour|encore|concert|live\s*event|sports?|documentary|docu-?series|short\s*film)\b/i;

type ReleaseRadarProfile = {
  genres: string[];
  actors: string[];
};

type CachedReleaseRadar = {
  day: string;
  profileKey: string;
  items: DiscoveryItem[];
  checkedAt: string;
  profile: ReleaseRadarProfile;
};

export type ReleaseRadarSnapshot = {
  items: DiscoveryItem[];
  checkedAt: string;
  profile: ReleaseRadarProfile;
};

type RadarCandidate = DiscoveryItem & {
  releaseDate: string;
  overlapScore: number;
  popularity: number;
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
    if (!Array.isArray(parsed.items)) return null;
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
      items: snapshot.items,
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
    raw?.media_type === 'tv' || mediaTypeHint === 'tv' || (!raw?.title && typeof raw?.name === 'string')
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

  const textForFiltering = `${title} ${(typeof raw?.overview === 'string' ? raw.overview : '')}`.toLowerCase();
  if (BANNED_KEYWORD_PATTERN.test(textForFiltering)) return null;
  if (raw?.adult === true) return null;

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
  genreIds: Set<number>,
  startDate: string,
  endDate: string,
  mediaTypeHint?: 'movie' | 'tv'
): RadarCandidate[] {
  const seen = new Set<string>();
  const items: RadarCandidate[] = [];

  rawItems.forEach((raw) => {
    const candidate = normalizeCandidate(raw, genreIds, mediaTypeHint);
    if (!candidate) return;
    if (!withinWindow(candidate.releaseDate, startDate, endDate)) return;
    if (!candidate.poster_url) return;

    const key = `${candidate.media_type}-${candidate.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(candidate);
  });

  items.sort((a, b) => {
    if (a.releaseDate !== b.releaseDate) return a.releaseDate.localeCompare(b.releaseDate);
    if (b.overlapScore !== a.overlapScore) return b.overlapScore - a.overlapScore;
    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
    return b.popularity - a.popularity;
  });

  return items;
}

function pushUnique(target: RadarCandidate[], source: RadarCandidate[], count: number): void {
  if (count <= 0) return;
  const existing = new Set(target.map((item) => `${item.media_type}-${item.id}`));
  let remaining = count;
  for (const item of source) {
    if (remaining <= 0) break;
    const key = `${item.media_type}-${item.id}`;
    if (existing.has(key)) continue;
    existing.add(key);
    target.push(item);
    remaining -= 1;
  }
}

function buildReleaseRadar(
  hollywood: RadarCandidate[],
  eastAsian: RadarCandidate[],
  indian: RadarCandidate[],
  personalized: RadarCandidate[],
  fallback: RadarCandidate[]
): DiscoveryItem[] {
  const chosen: RadarCandidate[] = [];

  // Must-have regional diversity.
  pushUnique(chosen, eastAsian, 1);
  pushUnique(chosen, indian, 1);

  // Main body is mostly Hollywood movies/series.
  pushUnique(chosen, hollywood, 8);

  // Personalization adds precision when watchlists exist.
  pushUnique(chosen, personalized, 2);

  // Fill to target.
  pushUnique(chosen, fallback, RELEASE_RADAR_LIMIT);

  return chosen
    .slice(0, RELEASE_RADAR_LIMIT)
    .map(({ releaseDate: _releaseDate, overlapScore: _overlapScore, popularity: _popularity, ...item }) => item);
}

async function fetchReleaseRadarItems(genreIds: number[], actorIds: number[]): Promise<DiscoveryItem[]> {
  const now = new Date();
  const startDate = toIsoDate(now);
  const endDate = toIsoDate(addDays(now, RELEASE_WINDOW_DAYS));
  const genreSet = new Set<number>(genreIds);

  const movieParams = {
    language: 'en-US',
    sort_by: 'primary_release_date.asc',
    include_adult: 'false',
    include_video: 'false',
    with_runtime_gte: 70,
    without_genres: BANNED_MOVIE_GENRES,
    page: 1,
    'primary_release_date.gte': startDate,
    'primary_release_date.lte': endDate
  } as Record<string, string | number | undefined>;

  const tvParams = {
    language: 'en-US',
    sort_by: 'first_air_date.asc',
    include_adult: 'false',
    without_genres: BANNED_TV_GENRES,
    page: 1,
    'first_air_date.gte': startDate,
    'first_air_date.lte': endDate
  } as Record<string, string | number | undefined>;

  const [
    hollywoodMoviesRaw,
    hollywoodSeriesRaw,
    koMoviesRaw,
    jaMoviesRaw,
    zhMoviesRaw,
    koSeriesRaw,
    jaSeriesRaw,
    zhSeriesRaw,
    indianMoviesHiRaw,
    indianMoviesRegionRaw,
    indianSeriesRaw,
    personalizedGenresRaw,
    personalizedActorsRaw
  ] = await Promise.all([
    fetchTmdbResults('discover/movie', { ...movieParams, with_original_language: 'en' }),
    fetchTmdbResults('discover/tv', { ...tvParams, with_original_language: 'en' }),

    fetchTmdbResults('discover/movie', { ...movieParams, with_original_language: 'ko' }),
    fetchTmdbResults('discover/movie', { ...movieParams, with_original_language: 'ja' }),
    fetchTmdbResults('discover/movie', { ...movieParams, with_original_language: 'zh' }),
    fetchTmdbResults('discover/tv', { ...tvParams, with_original_language: 'ko' }),
    fetchTmdbResults('discover/tv', { ...tvParams, with_original_language: 'ja' }),
    fetchTmdbResults('discover/tv', { ...tvParams, with_original_language: 'zh' }),

    fetchTmdbResults('discover/movie', { ...movieParams, with_original_language: 'hi' }),
    fetchTmdbResults('discover/movie', { ...movieParams, region: 'IN' }),
    fetchTmdbResults('discover/tv', { ...tvParams, with_original_language: 'hi' }),

    genreIds.length > 0
      ? fetchTmdbResults('discover/movie', { ...movieParams, with_genres: genreIds.join(',') })
      : Promise.resolve([]),
    actorIds.length > 0
      ? fetchTmdbResults('discover/movie', { ...movieParams, with_cast: actorIds.join(',') })
      : Promise.resolve([])
  ]);

  const hollywood = [
    ...normalizeBucket(hollywoodMoviesRaw, genreSet, startDate, endDate, 'movie'),
    ...normalizeBucket(hollywoodSeriesRaw, genreSet, startDate, endDate, 'tv')
  ];
  const eastAsian = [
    ...normalizeBucket(koMoviesRaw, genreSet, startDate, endDate, 'movie'),
    ...normalizeBucket(jaMoviesRaw, genreSet, startDate, endDate, 'movie'),
    ...normalizeBucket(zhMoviesRaw, genreSet, startDate, endDate, 'movie'),
    ...normalizeBucket(koSeriesRaw, genreSet, startDate, endDate, 'tv'),
    ...normalizeBucket(jaSeriesRaw, genreSet, startDate, endDate, 'tv'),
    ...normalizeBucket(zhSeriesRaw, genreSet, startDate, endDate, 'tv')
  ];
  const indian = [
    ...normalizeBucket(indianMoviesHiRaw, genreSet, startDate, endDate, 'movie'),
    ...normalizeBucket(indianMoviesRegionRaw, genreSet, startDate, endDate, 'movie'),
    ...normalizeBucket(indianSeriesRaw, genreSet, startDate, endDate, 'tv')
  ];
  const personalized = [
    ...normalizeBucket(personalizedGenresRaw, genreSet, startDate, endDate, 'movie'),
    ...normalizeBucket(personalizedActorsRaw, genreSet, startDate, endDate, 'movie')
  ];
  const fallback = [...hollywood, ...eastAsian, ...indian, ...personalized];

  return buildReleaseRadar(hollywood, eastAsian, indian, personalized, fallback);
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
      items: cached.items,
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

  const items = await fetchReleaseRadarItems(genreIds, actorIds);
  const snapshot: ReleaseRadarSnapshot = {
    items,
    checkedAt: new Date().toISOString(),
    profile
  };
  writeCache(profileKey, snapshot);
  return snapshot;
}

