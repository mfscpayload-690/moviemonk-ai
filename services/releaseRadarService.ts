import { DiscoveryItem, WatchlistFolder } from '../types';

const RELEASE_RADAR_CACHE_KEY = 'moviemonk_release_radar_v1';
const MAX_RADAR_ITEMS_DAILY = 12;
const MAX_RADAR_ITEMS_WEEKLY = 20;

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

  return { genres: topGenres, actors: topActors };
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
    // Ignore storage quota/private mode issues.
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

function normalizeCandidate(raw: any, genreIds: Set<number>): RadarCandidate | null {
  if (!raw || typeof raw?.id !== 'number') return null;
  const title = typeof raw?.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;

  const releaseDate = typeof raw?.release_date === 'string' ? raw.release_date : '';
  if (!releaseDate) return null;

  const genreList = Array.isArray(raw?.genre_ids)
    ? raw.genre_ids.filter((id: unknown) => typeof id === 'number')
    : [];
  const overlapScore = genreList.reduce((score: number, genreId: number) => score + (genreIds.has(genreId) ? 1 : 0), 0);

  return {
    id: raw.id,
    tmdb_id: String(raw.id),
    media_type: 'movie',
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

function dedupeAndRank(
  buckets: any[][],
  genreIdSet: Set<number>,
  startDate: string,
  endDate: string,
  limit: number
): DiscoveryItem[] {
  const seen = new Set<string>();
  const candidates: RadarCandidate[] = [];

  buckets.flat().forEach((raw) => {
    const candidate = normalizeCandidate(raw, genreIdSet);
    if (!candidate) return;
    if (!withinWindow(candidate.releaseDate, startDate, endDate)) return;

    const key = `${candidate.media_type}-${candidate.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  });

  candidates.sort((a, b) => {
    if (a.releaseDate !== b.releaseDate) return a.releaseDate.localeCompare(b.releaseDate);
    if (b.overlapScore !== a.overlapScore) return b.overlapScore - a.overlapScore;
    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
    return b.popularity - a.popularity;
  });

  return candidates.slice(0, limit).map(({ releaseDate: _releaseDate, overlapScore: _overlapScore, popularity: _popularity, ...item }) => item);
}

async function fetchRadarWindow(
  daysAhead: number,
  genreIds: number[],
  actorIds: number[]
): Promise<DiscoveryItem[]> {
  const now = new Date();
  const startDate = toIsoDate(now);
  const endDate = toIsoDate(addDays(now, daysAhead));
  const baseParams = {
    language: 'en-US',
    sort_by: 'primary_release_date.asc',
    include_adult: 'false',
    include_video: 'false',
    page: 1,
    'primary_release_date.gte': startDate,
    'primary_release_date.lte': endDate
  } as Record<string, string | number | undefined>;

  const calls: Promise<any[]>[] = [];

  if (genreIds.length > 0) {
    calls.push(fetchTmdbResults('discover/movie', {
      ...baseParams,
      with_genres: genreIds.join(',')
    }));
  }

  if (actorIds.length > 0) {
    calls.push(fetchTmdbResults('discover/movie', {
      ...baseParams,
      with_cast: actorIds.join(',')
    }));
  }

  calls.push(fetchTmdbResults('movie/upcoming', { language: 'en-US', page: 1 }));

  const groups = await Promise.all(calls);
  return dedupeAndRank(groups, new Set<number>(genreIds), startDate, endDate, daysAhead <= 2 ? MAX_RADAR_ITEMS_DAILY : MAX_RADAR_ITEMS_WEEKLY);
}

export function hasRadarInputs(watchlists: WatchlistFolder[]): boolean {
  return watchlists.some((folder) => folder.items.length > 0);
}

export async function loadReleaseRadarSnapshot(watchlists: WatchlistFolder[]): Promise<ReleaseRadarSnapshot | null> {
  const profile = deriveProfile(watchlists);
  if (profile.genres.length === 0 && profile.actors.length === 0) {
    return null;
  }

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

