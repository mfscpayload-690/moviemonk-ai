import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../../lib/cache';
import { fetchRelatedPeopleForPerson } from '../../services/tmdbService';
import { applyCors } from '../_utils/cors';
import { PersonCredit, PersonRoleBucket } from '../../types';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdb(path: string, params: Record<string, string | number | undefined>) {
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const url = new URL(`${TMDB_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
  if (TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);
  const headers: Record<string, string> = TMDB_READ_TOKEN ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` } : {};
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error(`TMDB ${path} failed ${r.status}`);
  return r.json();
}

function inferRoleBucket(credit: any): PersonRoleBucket {
  const department = String(credit?.department || credit?.known_for_department || '').toLowerCase();
  const job = String(credit?.job || '').toLowerCase();
  const hasCharacter = Boolean(credit?.character);

  if (hasCharacter || department.includes('acting') || job.includes('actor') || job.includes('actress')) {
    return 'acting';
  }

  if (job.includes('director') || department.includes('direct')) {
    return 'directing';
  }

  return 'other';
}

function mapCredit(credit: any): PersonCredit | null {
  const mediaType = credit?.media_type === 'tv' ? 'tv' : 'movie';
  const title = mediaType === 'tv'
    ? (credit?.name || credit?.original_name || '')
    : (credit?.title || credit?.original_title || '');

  if (!credit?.id || !title) return null;

  const date = mediaType === 'tv' ? credit?.first_air_date : credit?.release_date;
  const year = typeof date === 'string' && date.length >= 4 ? Number(date.slice(0, 4)) : undefined;
  const bucket = inferRoleBucket(credit);
  const roleText = bucket === 'acting'
    ? 'cast'
    : bucket === 'directing'
      ? (credit?.job || 'Director')
      : (credit?.job || credit?.department || 'crew');

  return {
    id: credit.id,
    media_type: mediaType,
    title,
    year,
    role: roleText,
    role_bucket: bucket,
    character: credit?.character || undefined,
    job: credit?.job || undefined,
    department: credit?.department || undefined,
    popularity: typeof credit?.popularity === 'number' ? credit.popularity : undefined,
    poster_url: credit?.poster_path ? `https://image.tmdb.org/t/p/w342${credit.poster_path}` : undefined
  };
}

function dedupeCredits(credits: PersonCredit[]): PersonCredit[] {
  const seen = new Set<string>();
  const unique: PersonCredit[] = [];
  for (const credit of credits) {
    const key = `${credit.media_type}:${credit.id}:${credit.role_bucket}:${credit.role}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(credit);
  }
  return unique;
}

function buildKnownForTags(person: any, credits: PersonCredit[]): string[] {
  const tags = new Set<string>();
  if (typeof person?.known_for_department === 'string' && person.known_for_department.trim()) {
    tags.add(person.known_for_department.trim());
  }

  const roleCounts = credits.reduce<Record<string, number>>((acc, credit) => {
    const key = credit.role_bucket;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  if ((roleCounts.acting || 0) > 0) tags.add('Acting');
  if ((roleCounts.directing || 0) > 0) tags.add('Directing');
  if ((roleCounts.other || 0) > 0) tags.add('Production');

  const mediaMix = new Set(credits.map((credit) => credit.media_type));
  if (mediaMix.has('movie') && mediaMix.has('tv')) tags.add('Film & TV');
  else if (mediaMix.has('tv')) tags.add('TV');
  else if (mediaMix.has('movie')) tags.add('Film');

  return Array.from(tags).slice(0, 8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');
  if (req.headers.origin && !originAllowed) {
    return res.status(403).json({ ok: false, error: 'Origin is not allowed' });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const cacheKey = withCacheKey('person_v2', { id });
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    const [person, credits] = (await Promise.all([
      tmdb(`person/${id}`, { language: 'en-US' }),
      tmdb(`person/${id}/combined_credits`, { language: 'en-US' }),
    ])) as any[];

    const combinedCreditsRaw = [
      ...((credits as any).cast || []),
      ...((credits as any).crew || [])
    ];

    const creditsAll = dedupeCredits(
      combinedCreditsRaw
        .map(mapCredit)
        .filter((credit): credit is PersonCredit => Boolean(credit))
    ).sort((a, b) => {
      if ((b.year || 0) !== (a.year || 0)) return (b.year || 0) - (a.year || 0);
      return (b.popularity || 0) - (a.popularity || 0);
    });

    const creditsActing = creditsAll.filter((credit) => credit.role_bucket === 'acting');
    const creditsDirecting = creditsAll.filter((credit) => credit.role_bucket === 'directing');
    const creditsOther = creditsAll.filter((credit) => credit.role_bucket === 'other');

    const topWork = [...creditsAll]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 12);

    // Backward-compatible legacy field.
    const filmography = creditsAll.map((credit) => ({
      id: credit.id,
      title: credit.title,
      year: credit.year,
      role: credit.role,
      media_type: credit.media_type,
      character: credit.character,
      poster_url: credit.poster_url
    }));

    const years = creditsAll.map((credit) => credit.year).filter((year): year is number => typeof year === 'number');
    const startYear = years.length > 0 ? Math.min(...years) : undefined;
    const endYear = years.length > 0 ? Math.max(...years) : undefined;
    const activeYears = startYear && endYear ? Math.max(1, endYear - startYear + 1) : undefined;

    // People Also Search (related people) with 6h cache
    let related_people: any[] = [];
    try {
      const relatedKey = withCacheKey('related_person', { id });
      const cachedRelated = await getCache(relatedKey);
      if (cachedRelated) {
        related_people = cachedRelated;
      } else {
        related_people = await fetchRelatedPeopleForPerson(Number(id));
        await setCache(relatedKey, related_people, 6 * 60 * 60);
      }
    } catch (e) {
      console.warn('Related people fetch failed:', e);
    }

    const payload = {
      person: {
        id: person.id,
        name: person.name,
        biography: person.biography,
        birthday: person.birthday,
        place_of_birth: person.place_of_birth,
        profile_url: person.profile_path ? `https://image.tmdb.org/t/p/w342${person.profile_path}` : undefined,
        known_for_department: person.known_for_department
      },
      filmography,
      top_work: topWork,
      credits_all: creditsAll,
      credits_acting: creditsActing,
      credits_directing: creditsDirecting,
      credits_other: creditsOther,
      role_distribution: {
        acting: creditsActing.length,
        directing: creditsDirecting.length,
        other: creditsOther.length
      },
      career_span: {
        start_year: startYear,
        end_year: endYear,
        active_years: activeYears
      },
      known_for_tags: buildKnownForTags(person, creditsAll),
      related_people,
      sources: [
        { name: 'TMDB', url: `https://www.themoviedb.org/person/${person.id}` },
      ],
      cached: false,
    };

    await setCache(cacheKey, payload, 60 * 60 * 24); // 24h
    return res.status(200).json(payload);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
