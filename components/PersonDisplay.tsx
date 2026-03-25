import React, { useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import { BirthdayIcon, LocationIcon, SparklesIcon } from './icons';
import { useRenderCounter } from '../lib/perfDebug';
import { PersonCredit, PersonRoleBucket } from '../types';

interface FilmItem {
  id: number;
  title: string;
  year?: number;
  role: string;
  media_type?: 'movie' | 'tv';
  role_bucket?: PersonRoleBucket;
  character?: string;
  poster_url?: string;
  popularity?: number;
}

export interface PersonPayload {
  person: {
    id: number;
    name: string;
    biography?: string;
    birthday?: string;
    place_of_birth?: string;
    profile_url?: string;
    known_for_department?: string;
  };
  filmography: FilmItem[];
  top_work?: FilmItem[];
  credits_all?: FilmItem[];
  credits_acting?: FilmItem[];
  credits_directing?: FilmItem[];
  credits_other?: FilmItem[];
  role_distribution?: { acting: number; directing: number; other: number };
  career_span?: { start_year?: number; end_year?: number; active_years?: number };
  known_for_tags?: string[];
  sources?: { name: string; url: string }[];
  related_people?: { id: number; name: string; profile_url?: string; known_for?: string }[];
}

type PersonCreditBuckets = {
  allCredits: PersonCredit[];
  actingCredits: PersonCredit[];
  directingCredits: PersonCredit[];
  topWork: PersonCredit[];
  roleDistribution: { acting: number; directing: number; other: number };
  careerSpan: { start_year?: number; end_year?: number; active_years?: number };
  tags: string[];
};

export function derivePersonCreditBuckets(data: PersonPayload): PersonCreditBuckets {
  const normalizedFallback = (data.filmography || []).map((item) => ({
    ...item,
    media_type: item.media_type || 'movie',
    role_bucket: item.role_bucket || (String(item.role || '').toLowerCase().includes('director') ? 'directing' : 'acting')
  })) as PersonCredit[];

  const allCredits = (data.credits_all && data.credits_all.length > 0 ? data.credits_all : normalizedFallback) as PersonCredit[];
  const actingCredits = (data.credits_acting && data.credits_acting.length > 0
    ? data.credits_acting
    : allCredits.filter((item) => item.role_bucket === 'acting')) as PersonCredit[];
  const directingCredits = (data.credits_directing && data.credits_directing.length > 0
    ? data.credits_directing
    : allCredits.filter((item) => item.role_bucket === 'directing')) as PersonCredit[];
  const topWork = (data.top_work && data.top_work.length > 0 ? data.top_work : [...allCredits]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10)) as PersonCredit[];
  const tags = Array.isArray(data.known_for_tags) ? data.known_for_tags : [];
  const roleDistribution = data.role_distribution || {
    acting: actingCredits.length,
    directing: directingCredits.length,
    other: Math.max(0, allCredits.length - actingCredits.length - directingCredits.length)
  };
  const careerSpan = data.career_span || {};

  return {
    allCredits,
    actingCredits,
    directingCredits,
    topWork,
    roleDistribution,
    careerSpan,
    tags
  };
}

export function selectVisibleCredits(activeTab: PersonRoleBucket, buckets: Pick<PersonCreditBuckets, 'allCredits' | 'actingCredits' | 'directingCredits'>): PersonCredit[] {
  if (activeTab === 'acting') return buckets.actingCredits;
  if (activeTab === 'directing') return buckets.directingCredits;
  return buckets.allCredits;
}

export function toOpenTitlePayload(credit: Pick<PersonCredit, 'id' | 'media_type'>): { id: number; mediaType: 'movie' | 'tv' } | null {
  if (!credit?.id) return null;
  return {
    id: credit.id,
    mediaType: credit.media_type === 'tv' ? 'tv' : 'movie'
  };
}

// Skeleton card component for loading states
const SkeletonCard: React.FC = () => (
  <div className="rounded-lg border border-white/10 overflow-hidden bg-white/5 animate-pulse">
    <div className="w-full h-40 bg-white/10" />
    <div className="p-2 space-y-2">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
    </div>
  </div>
);

const BIO_LIMIT = 600;

const PersonDisplay: React.FC<{
  data: PersonPayload;
  isLoading?: boolean;
  onQuickSearch?: (q: string) => void;
  onBriefMe?: (name: string) => void;
  onOpenTitle?: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}> = ({ data, isLoading, onQuickSearch, onBriefMe, onOpenTitle }) => {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<PersonRoleBucket>('all');
  useRenderCounter('PersonDisplay');

  if (!data) return null;
  const { person, filmography, sources, related_people } = data;
  const { allCredits, actingCredits, directingCredits, topWork, roleDistribution, careerSpan, tags } = derivePersonCreditBuckets({
    ...data,
    filmography
  });

  const visibleCredits = useMemo(() => {
    return selectVisibleCredits(activeTab, { allCredits, actingCredits, directingCredits });
  }, [activeTab, allCredits, actingCredits, directingCredits]);

  const bioTruncated = person.biography && person.biography.length > BIO_LIMIT;
  const displayBio = bioExpanded || !bioTruncated ? person.biography : person.biography?.slice(0, BIO_LIMIT) + '…';

  const handleOpenCredit = (credit: PersonCredit) => {
    const openPayload = toOpenTitlePayload(credit);
    if (!openPayload) return;
    if (onOpenTitle) {
      onOpenTitle(openPayload);
      return;
    }
    if (onQuickSearch) {
      onQuickSearch(`${credit.title}${credit.year ? ` ${credit.year}` : ''}`);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-fade-in relative z-10 person-editorial-page">
      {/* Hero */}
      <section className="mb-8 glass-panel p-6 rounded-2xl person-hero-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
        {person.profile_url ? (
          <img
            src={person.profile_url}
            alt={person.name}
            className="w-28 h-28 sm:w-48 sm:h-48 rounded-full sm:rounded-xl object-cover border-2 border-white/10 shadow-xl person-profile-circular sm:!rounded-xl"
          />
        ) : (
          <div className="w-28 h-28 sm:w-48 sm:h-48 rounded-full sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted text-sm glass-panel">No Photo</div>
        )}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gradient tracking-tight">{person.name}</h2>
          <div className="text-base text-muted flex flex-wrap justify-center sm:justify-start gap-2 items-center">
            {person.birthday && (
              <span className="bg-white/5 px-2 py-1 rounded-md inline-flex items-center gap-2">
                <BirthdayIcon className="w-4 h-4" />
                <span>{person.birthday}</span>
              </span>
            )}
            {person.place_of_birth && (
              <span className="bg-white/5 px-2 py-1 rounded-md inline-flex items-center gap-2">
                <LocationIcon className="w-4 h-4" />
                <span>{person.place_of_birth}</span>
              </span>
            )}
            {person.known_for_department && (
              <span className="bg-violet-500/20 text-violet-300 px-2 py-1 rounded-md inline-flex items-center gap-2 text-sm">
                {person.known_for_department}
              </span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-white/10 text-brand-text-light border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-brand-text-dark">Acting</p>
              <p className="text-xl font-semibold text-white">{roleDistribution.acting}</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-brand-text-dark">Directing</p>
              <p className="text-xl font-semibold text-white">{roleDistribution.directing}</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-brand-text-dark">Career Span</p>
              <p className="text-xl font-semibold text-white">
                {careerSpan.start_year && careerSpan.end_year ? `${careerSpan.start_year} - ${careerSpan.end_year}` : 'N/A'}
              </p>
            </div>
          </div>
          {(onQuickSearch || onBriefMe) && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-2">
              {onQuickSearch && (
                <>
                  <button className="btn-primary text-sm shadow-lg shadow-violet-500/20 touch-target" onClick={() => onQuickSearch(`${person.name} best movies`)}>Best Movies</button>
                  <button className="btn-glass text-sm touch-target" onClick={() => onQuickSearch(`Movies by ${person.name}`)}>Movies by {person.name}</button>
                </>
              )}
              {onBriefMe && (
                <button className="btn-glass text-sm border-violet-500/30 text-violet-300 touch-target flex items-center gap-2" onClick={() => {
                  track('brief_me_clicked', { person_name: person.name });
                  onBriefMe(person.name);
                }} aria-label="Brief Me">
                  <SparklesIcon className="w-4 h-4" />
                  Brief Me
                </button>
              )}
            </div>
          )}
        </div>
        </div>
      </section>

      {/* Top Work */}
      {topWork.length > 0 && (
        <section className="mb-8">
          <h3 className="font-bold mb-4 text-xl text-white pl-2 border-l-4 border-primary section-title-enhanced">Top Works</h3>
          <div className="horizontal-scroll-fade-right relative">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {topWork.slice(0, 12).map((credit) => (
                <button
                  key={`top-${credit.media_type}-${credit.id}-${credit.role}`}
                  className="flex-shrink-0 w-32 text-left group touch-target"
                  onClick={() => handleOpenCredit(credit)}
                  aria-label={`Open ${credit.title}`}
                >
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 group-hover:border-brand-primary/50 transition-colors">
                    {credit.poster_url ? (
                      <img src={credit.poster_url} alt={`${credit.title} poster`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-white/10" />
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">{credit.title}</p>
                  <p className="text-[11px] text-brand-text-dark">{credit.year || '—'} • {credit.media_type === 'tv' ? 'TV' : 'Movie'}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Biography */}
      {person.biography && (
        <section className="mb-8 glass-panel p-6 rounded-2xl">
          <h3 className="font-bold mb-4 text-xl border-b border-white/5 pb-2 text-white">Biography</h3>
          <p className="text-base leading-relaxed text-gray-300 whitespace-pre-wrap">
            {displayBio}
          </p>
          {bioTruncated && (
            <button className="mt-3 text-primary font-semibold hover:text-accent transition-colors" onClick={() => setBioExpanded(!bioExpanded)}>
              {bioExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </section>
      )}

      {/* Filmography */}
      <section className="mb-8">
        <h3 className="font-bold mb-6 text-xl text-white pl-2 border-l-4 border-primary section-title-enhanced">Filmography</h3>
        <div className="flex gap-2 mb-4">
          {(['all', 'acting', 'directing'] as PersonRoleBucket[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                activeTab === tab
                  ? 'bg-brand-primary/20 text-white border-brand-primary/40'
                  : 'bg-white/5 text-brand-text-dark border-white/10 hover:border-brand-primary/40'
              }`}
            >
              {tab === 'all' ? `All (${allCredits.length})` : tab === 'acting' ? `Acting (${actingCredits.length})` : `Directing (${directingCredits.length})`}
            </button>
          ))}
        </div>
        {isLoading && visibleCredits.length === 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4 sm:overflow-visible">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="filmography-mobile-scroll horizontal-scroll-fade-right sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4 sm:overflow-visible content-visibility-auto">
            {visibleCredits.map((f) => (
              <button
                key={`${f.media_type || 'movie'}-${f.id}-${f.role}`}
                className="glass-panel p-0 rounded-xl overflow-hidden hover:border-violet-500/50 hover:scale-[1.02] transition-all duration-300 group touch-target text-left"
                onClick={() => handleOpenCredit(f)}
                aria-label={`Open ${f.title}`}
              >
                {f.poster_url ? (
                  <img src={f.poster_url} alt={f.title} className="w-full aspect-[2/3] object-cover group-hover:brightness-110 transition-all" loading="lazy" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-xs text-muted">No Poster</div>
                )}
                <div className="p-3 sm:p-4">
                  <div className="text-sm sm:text-base font-bold truncate text-white group-hover:text-primary transition-colors" title={f.title}>{f.title}</div>
                  <div className="text-xs text-muted mt-1 font-medium">{f.year || '—'}</div>
                  <div className="text-xs text-gray-400 mt-1 truncate">
                    {(f.media_type === 'tv' ? 'TV' : 'Movie')} • {f.role}{f.character ? ` as ${f.character}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* People Also Search */}
      {Array.isArray(related_people) && related_people.length > 0 && (
        <section className="mb-8 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xl text-white section-title-enhanced">People Also Search</h3>
            <button className="text-sm px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors touch-target" onClick={() => track('related_see_all_open', { type: 'person', id: person.id })}>See all</button>
          </div>
          <div className="horizontal-scroll-fade-right relative">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {related_people.slice(0, 12).map((p) => (
                <button key={p.id} className="flex-shrink-0 w-24 text-left group touch-target" onClick={() => {
                  track('related_tile_click', { type: 'person', id: p.id, name: p.name });
                  onQuickSearch && onQuickSearch(p.name);
                }} aria-label={`Open ${p.name}`}>
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 group-hover:border-brand-primary/50 transition-colors">
                    {p.profile_url ? (
                      <img src={p.profile_url} alt={`${p.name} profile`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-white/10" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">{p.name}</p>
                  {p.known_for && <p className="text-[10px] text-brand-text-dark">{p.known_for}</p>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <section className="mb-8 glass-panel p-4 rounded-xl">
          <h3 className="font-semibold mb-2 text-lg text-white">Sources</h3>
          <ul className="flex flex-wrap gap-4 text-sm text-gray-400">
            {sources.map((s) => (
              <li key={s.url}><a href={s.url} className="text-primary hover:text-accent underline decoration-white/20 hover:decoration-accent transition-colors" target="_blank" rel="noreferrer">{s.name}</a></li>
            ))}
          </ul>
        </section>
      )}

      {/* Global Loading */}
      {isLoading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted animate-pulse">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          Updating data...
        </div>
      )}
    </div>
  );
};

export default PersonDisplay;
