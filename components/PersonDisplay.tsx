import React, { useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import {
  Calendar,
  Bookmark,
  Clapperboard,
  ExternalLink,
  Film,
  MapPin,
  Tv,
  UserRound,
  X
} from 'lucide-react';
import { useRenderCounter } from '../lib/perfDebug';
import { PersonCredit, PersonRoleBucket, WatchlistFolder } from '../types';
import type { QuickSaveTitle } from '../lib/quickSave';
import { buildPersonCardPresentation } from '../services/personPresentation';
import { TagIcon, WatchedIcon } from './icons';
import SeoHead from './SeoHead';
import { buildPersonJsonLd, toMetaDescription } from '../lib/seo';

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
  otherCredits: PersonCredit[];
  topWork: DisplayCredit[];
  roleDistribution: { acting: number; directing: number; other: number };
  careerSpan: { start_year?: number; end_year?: number; active_years?: number };
  tags: string[];
};

export type PersonCreditSort = 'newest' | 'oldest' | 'popular' | 'title';
export type PersonMediaFilter = 'all' | 'movie' | 'tv';

export type DisplayCredit = PersonCredit & {
  displayRoles: string[];
  displayCharacters: string[];
  roleCount: number;
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
  const otherCredits = (data.credits_other && data.credits_other.length > 0
    ? data.credits_other
    : allCredits.filter((item) => item.role_bucket === 'other')) as PersonCredit[];
  const topWork = dedupePersonCredits(data.top_work && data.top_work.length > 0 ? data.top_work as PersonCredit[] : [...allCredits]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 12));
  const tags = Array.isArray(data.known_for_tags) ? data.known_for_tags : [];
  const roleDistribution = data.role_distribution || {
    acting: actingCredits.length,
    directing: directingCredits.length,
    other: otherCredits.length
  };
  const careerSpan = data.career_span || {};

  return {
    allCredits,
    actingCredits,
    directingCredits,
    otherCredits,
    topWork,
    roleDistribution,
    careerSpan,
    tags
  };
}

export function selectVisibleCredits(
  activeTab: PersonRoleBucket,
  buckets: Pick<PersonCreditBuckets, 'allCredits' | 'actingCredits' | 'directingCredits'> & Partial<Pick<PersonCreditBuckets, 'otherCredits'>>
): PersonCredit[] {
  if (activeTab === 'acting') return buckets.actingCredits;
  if (activeTab === 'directing') return buckets.directingCredits;
  if (activeTab === 'other') return buckets.otherCredits || [];
  return buckets.allCredits;
}

export function toOpenTitlePayload(credit: Pick<PersonCredit, 'id' | 'media_type'>): { id: number; mediaType: 'movie' | 'tv' } | null {
  if (!credit?.id) return null;
  return {
    id: credit.id,
    mediaType: credit.media_type === 'tv' ? 'tv' : 'movie'
  };
}

export function dedupePersonCredits(credits: PersonCredit[]): DisplayCredit[] {
  const byTitle = new Map<string, DisplayCredit>();

  credits.forEach((credit) => {
    const mediaType = credit.media_type === 'tv' ? 'tv' : 'movie';
    const key = `${mediaType}:${credit.id}`;
    const role = String(credit.role || credit.job || credit.department || '').trim();
    const character = String(credit.character || '').trim();
    const existing = byTitle.get(key);

    if (!existing) {
      byTitle.set(key, {
        ...credit,
        media_type: mediaType,
        displayRoles: role ? [role] : [],
        displayCharacters: character ? [character] : [],
        roleCount: 1
      });
      return;
    }

    if (role && !existing.displayRoles.includes(role)) {
      existing.displayRoles.push(role);
    }
    if (character && !existing.displayCharacters.includes(character)) {
      existing.displayCharacters.push(character);
    }
    existing.roleCount += 1;
    existing.popularity = Math.max(existing.popularity || 0, credit.popularity || 0);
    existing.year = existing.year || credit.year;
    existing.poster_url = existing.poster_url || credit.poster_url;
  });

  return Array.from(byTitle.values());
}

export function sortPersonCredits(credits: DisplayCredit[], sort: PersonCreditSort): DisplayCredit[] {
  const sorted = [...credits];

  if (sort === 'title') {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sort === 'oldest') {
    return sorted.sort((a, b) => (a.year || 9999) - (b.year || 9999) || a.title.localeCompare(b.title));
  }

  if (sort === 'popular') {
    return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || (b.year || 0) - (a.year || 0));
  }

  return sorted.sort((a, b) => (b.year || 0) - (a.year || 0) || (b.popularity || 0) - (a.popularity || 0));
}

export function filterPersonCredits(credits: DisplayCredit[], mediaFilter: PersonMediaFilter): DisplayCredit[] {
  if (mediaFilter === 'all') return credits;
  return credits.filter((credit) => credit.media_type === mediaFilter);
}

export function getAvailableMediaFilters(credits: PersonCredit[]): PersonMediaFilter[] {
  const types = new Set(credits.map((credit) => credit.media_type === 'tv' ? 'tv' : 'movie'));
  const mediaTypes: Array<'movie' | 'tv'> = ['movie', 'tv'];
  return ['all', ...mediaTypes.filter((type) => types.has(type))];
}

export function truncateBiography(biography = '', maxLength = 420): { text: string; isTruncated: boolean } {
  const normalized = biography.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return { text: normalized, isTruncated: false };
  const clipped = normalized.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  return {
    text: `${clipped.slice(0, lastSpace > 260 ? lastSpace : maxLength).trim()}...`,
    isTruncated: true
  };
}

export function formatCreditMeta(credit: Pick<PersonCredit, 'year' | 'media_type'>): string {
  const mediaType = credit.media_type === 'tv' ? 'TV' : 'Movie';
  return `${credit.year || 'Unknown'} - ${mediaType}`;
}

export function toQuickSaveTitle(credit: Pick<PersonCredit, 'id' | 'media_type' | 'title' | 'year' | 'poster_url'>): QuickSaveTitle {
  return {
    id: credit.id,
    media_type: credit.media_type === 'tv' ? 'tv' : 'movie',
    title: credit.title,
    year: credit.year ? String(credit.year) : undefined,
    poster_url: credit.poster_url || null
  };
}

export function isCreditSavedToWatchlist(
  credit: Pick<PersonCredit, 'id' | 'media_type' | 'title'>,
  watchlists: WatchlistFolder[] = []
): boolean {
  const mediaType = credit.media_type === 'tv' ? 'tv' : 'movie';
  const id = String(credit.id);
  const title = credit.title.trim().toLowerCase();

  return watchlists.some((folder) =>
    folder.items.some((item) => {
      const movie = item.movie;
      const savedMediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
      return (
        savedMediaType === mediaType &&
        (String(movie.tmdb_id) === id || movie.title?.trim().toLowerCase() === title)
      );
    })
  );
}

function formatCareerSpan(careerSpan: PersonCreditBuckets['careerSpan']): string {
  if (careerSpan.start_year && careerSpan.end_year) return `${careerSpan.start_year} - ${careerSpan.end_year}`;
  if (careerSpan.start_year) return `${careerSpan.start_year} - Present`;
  return 'Not enough data';
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MM';
}

function formatPrimaryRole(credit: DisplayCredit): string {
  if (credit.displayRoles.length > 0) return credit.displayRoles.slice(0, 2).join(', ');
  if (credit.character) return `as ${credit.character}`;
  return credit.role || 'Credit';
}

function formatSecondaryRole(credit: DisplayCredit): string {
  const character = credit.displayCharacters[0];
  if (character) return `as ${character}`;
  if (credit.roleCount > 1) return `${credit.roleCount} roles`;
  return credit.role_bucket === 'directing' ? 'Creative credit' : 'Screen credit';
}

function groupCreditsByDecade(credits: DisplayCredit[]): Array<{ label: string; credits: DisplayCredit[] }> {
  const groups = new Map<string, DisplayCredit[]>();

  credits.forEach((credit) => {
    const label = credit.year ? `${Math.floor(credit.year / 10) * 10}s` : 'Undated';
    const group = groups.get(label) || [];
    group.push(credit);
    groups.set(label, group);
  });

  return Array.from(groups.entries()).map(([label, groupCredits]) => ({ label, credits: groupCredits }));
}

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="person-empty-state">
    <strong>{title}</strong>
    <span>{body}</span>
  </div>
);

const PosterFrame: React.FC<{ credit: Pick<PersonCredit, 'title' | 'poster_url' | 'media_type' | 'year'>; compact?: boolean }> = ({ credit, compact }) => (
  <div className={compact ? 'person-credit-thumb' : 'person-rail-poster'}>
    {credit.poster_url ? (
      <img src={credit.poster_url} alt={`${credit.title} poster`} loading="lazy" />
    ) : (
      <div className="person-poster-fallback">
        {credit.media_type === 'tv' ? (
          <Tv size={compact ? 18 : 32} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Film size={compact ? 18 : 32} strokeWidth={1.5} aria-hidden="true" />
        )}
      </div>
    )}
  </div>
);

const SkeletonCard: React.FC = () => (
  <div className="person-credit-skeleton">
    <div className="person-credit-skeleton-poster" />
    <div className="person-credit-skeleton-lines">
      <div />
      <div />
    </div>
  </div>
);

// Action handlers removed

const CareerStats: React.FC<{
  roleDistribution: PersonCreditBuckets['roleDistribution'];
  careerSpan: PersonCreditBuckets['careerSpan'];
  allCount: number;
}> = ({ roleDistribution, careerSpan, allCount }) => (
  <section className="person-career-snapshot" aria-label="Career snapshot">
    <article>
      <p>All credits</p>
      <strong>{allCount}</strong>
    </article>
    <article>
      <p>Acting</p>
      <strong>{roleDistribution.acting}</strong>
    </article>
    <article>
      <p>Directing</p>
      <strong>{roleDistribution.directing}</strong>
    </article>
    <article>
      <p>Career span</p>
      <strong>{formatCareerSpan(careerSpan)}</strong>
    </article>
  </section>
);

function formatBirthDate(birthdayStr: string): string {
  const birthDate = new Date(birthdayStr);
  if (isNaN(birthDate.getTime())) return birthdayStr;

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const formattedDate = birthDate.toLocaleDateString('en-US', options);
  return `${formattedDate} (age ${age})`;
}

const PersonHero: React.FC<{
  person: PersonPayload['person'];
  tags: string[];
  careerSpan: PersonCreditBuckets['careerSpan'];
  topWork: DisplayCredit[];
  biographyExcerpt: string;
  hasBiography: boolean;
  onOpenBiography: () => void;
  onOpenCredit?: (credit: PersonCredit) => void;
}> = ({ person, tags, careerSpan, topWork, biographyExcerpt, hasBiography, onOpenBiography, onOpenCredit }) => {
  const birthDateAndAge = person.birthday ? formatBirthDate(person.birthday) : null;

  return (
    <section className="person-editorial-hero" aria-labelledby="person-profile-title">
      <div className="person-hero-backdrop" aria-hidden="true">
        {person.profile_url && <img src={person.profile_url} alt="" />}
      </div>
      <div className="person-editorial-identity">
        {person.profile_url ? (
          <img
            src={person.profile_url}
            alt={person.name}
            className="person-editorial-avatar"
            loading="eager"
            decoding="async"
            sizes="(min-width: 768px) 190px, 132px"
          />
        ) : (
          <div className="person-editorial-avatar person-editorial-avatar-fallback" aria-label={`${person.name} profile image unavailable`}>
            <span>{getInitials(person.name)}</span>
          </div>
        )}

        <div className="person-editorial-header">
          <div className="person-hero-kicker">Person Profile</div>
          <h2 id="person-profile-title" className="person-editorial-name">{person.name}</h2>

          {(birthDateAndAge || person.place_of_birth || person.known_for_department) && (
            <div className="person-hero-meta-row" aria-label="Person details">
              {birthDateAndAge && (
                <span className="person-hero-meta-item">
                  <Calendar size={14} aria-hidden="true" />
                  <span>{birthDateAndAge}</span>
                </span>
              )}
              {person.place_of_birth && (
                <span className="person-hero-meta-item">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{person.place_of_birth}</span>
                </span>
              )}
              {person.known_for_department && (
                <span className="person-hero-meta-item">
                  <UserRound size={14} aria-hidden="true" />
                  <span>{person.known_for_department}</span>
                </span>
              )}
            </div>
          )}

          {tags.length > 0 && (
            <div className="person-hero-tags-row" aria-label="Department tags">
              {tags.slice(0, 5).map((tag) => (
                <span key={tag} className="person-hero-tag-badge">{tag}</span>
              ))}
            </div>
          )}

          {biographyExcerpt ? (
            <div className="person-hero-bio-container">
              <p className="person-hero-bio">
                {biographyExcerpt}
                {hasBiography && (
                  <button
                    type="button"
                    className="person-hero-bio-more"
                    onClick={onOpenBiography}
                    aria-haspopup="dialog"
                  >
                    Read full biography
                  </button>
                )}
              </p>
            </div>
          ) : (
            <p className="person-hero-bio person-hero-bio-empty">Biography unavailable.</p>
          )}

          <div className="person-hero-known-row" aria-label="Top known works">
            <span className="person-hero-known-label">Known for</span>
            <div className="person-hero-known-list">
              {topWork.slice(0, 5).map((credit, index) => (
                <React.Fragment key={`${credit.media_type}-${credit.id}`}>
                  {index > 0 && <span className="person-hero-known-divider">•</span>}
                  <button
                    type="button"
                    className="person-hero-known-link"
                    onClick={() => onOpenCredit?.(credit)}
                    aria-label={`Open ${credit.title}`}
                  >
                    {credit.title}
                  </button>
                </React.Fragment>
              ))}
              {topWork.length === 0 && <span className="person-hero-known-empty">No top works yet</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CreditRail: React.FC<{
  title: string;
  credits: DisplayCredit[];
  emptyTitle: string;
  emptyBody: string;
  onOpenCredit: (credit: PersonCredit) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: QuickSaveTitle) => void;
  onQuickSaveToWatchlist?: (item: QuickSaveTitle) => void;
  watchlists?: WatchlistFolder[];
}> = ({
  title,
  credits,
  emptyTitle,
  emptyBody,
  onOpenCredit,
  isWatched,
  onToggleWatched,
  onQuickSaveToWatchlist,
  watchlists = []
}) => (
  <section className="person-editorial-section" aria-labelledby={`person-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <header className="person-section-header">
      <h3 id={`person-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</h3>
      {credits.length > 0 && <span>{credits.length} titles</span>}
    </header>
    {credits.length > 0 ? (
      <div className="person-credit-rail">
        {credits.map((credit) => (
          <article
            key={`${title}-${credit.media_type}-${credit.id}`}
            className="person-rail-card group"
            onClick={() => onOpenCredit(credit)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onOpenCredit(credit);
            }}
            aria-label={`Open ${credit.title}`}
          >
            <div className="person-rail-poster-wrapper relative">
              <PosterFrame credit={credit} />
              {onQuickSaveToWatchlist && (
                <button
                  type="button"
                  className={`absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${
                    isCreditSavedToWatchlist(credit, watchlists)
                      ? 'bg-violet-500 text-white scale-100 border border-violet-400/30'
                      : 'bg-black/50 text-white/70 hover:bg-violet-500/90 hover:text-white hover:scale-110 border border-white/20'
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuickSaveToWatchlist(toQuickSaveTitle(credit));
                  }}
                  aria-label={isCreditSavedToWatchlist(credit, watchlists) ? `${credit.title} is saved. Open save dialog` : `Save ${credit.title} to watchlist`}
                  aria-pressed={isCreditSavedToWatchlist(credit, watchlists)}
                  title={isCreditSavedToWatchlist(credit, watchlists) ? 'Saved' : 'Save'}
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span className="sr-only">Save</span>
                </button>
              )}
              {onToggleWatched && (
                <button
                  type="button"
                  className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${
                    isWatched?.(credit.id, credit.media_type)
                      ? 'bg-green-500 text-white scale-100'
                      : 'bg-black/50 text-white/60 hover:bg-green-500/90 hover:text-white hover:scale-110 border border-white/20'
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleWatched(toQuickSaveTitle(credit));
                  }}
                  aria-label={isWatched?.(credit.id, credit.media_type) ? `Mark ${credit.title} as unwatched` : `Mark ${credit.title} as watched`}
                  aria-pressed={Boolean(isWatched?.(credit.id, credit.media_type))}
                  title={isWatched?.(credit.id, credit.media_type) ? 'Watched' : 'Mark watched'}
                >
                  <WatchedIcon className="w-3.5 h-3.5" filled={isWatched?.(credit.id, credit.media_type)} />
                  <span className="sr-only">Watched</span>
                </button>
              )}
            </div>
            <span className="person-rail-media">{credit.media_type === 'tv' ? 'TV' : 'Movie'}</span>
            <p className="person-rail-title">{credit.title}</p>
            <p className="person-rail-meta">{formatCreditMeta(credit)}</p>
            <p className="person-rail-role">{formatPrimaryRole(credit)}</p>
          </article>
        ))}
      </div>
    ) : (
      <EmptyState title={emptyTitle} body={emptyBody} />
    )}
  </section>
);

const CreditsExplorer: React.FC<{
  allCredits: PersonCredit[];
  actingCredits: PersonCredit[];
  directingCredits: PersonCredit[];
  otherCredits: PersonCredit[];
  isLoading?: boolean;
  onOpenCredit: (credit: PersonCredit) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: QuickSaveTitle) => void;
  onQuickSaveToWatchlist?: (item: QuickSaveTitle) => void;
  watchlists?: WatchlistFolder[];
}> = ({
  allCredits,
  actingCredits,
  directingCredits,
  otherCredits,
  isLoading,
  onOpenCredit,
  isWatched,
  onToggleWatched,
  onQuickSaveToWatchlist,
  watchlists = []
}) => {
  const [activeTab, setActiveTab] = useState<PersonRoleBucket>('all');
  const [mediaFilter, setMediaFilter] = useState<PersonMediaFilter>('all');
  const [sort, setSort] = useState<PersonCreditSort>('newest');

  const baseCredits = useMemo(
    () => selectVisibleCredits(activeTab, { allCredits, actingCredits, directingCredits, otherCredits }),
    [activeTab, allCredits, actingCredits, directingCredits, otherCredits]
  );
  const availableMediaFilters = useMemo(() => getAvailableMediaFilters(baseCredits), [baseCredits]);
  const visibleCredits = useMemo(
    () => sortPersonCredits(filterPersonCredits(dedupePersonCredits(baseCredits), mediaFilter), sort),
    [baseCredits, mediaFilter, sort]
  );
  const decadeGroups = useMemo(() => groupCreditsByDecade(visibleCredits), [visibleCredits]);

  const tabCounts = {
    all: dedupePersonCredits(allCredits).length,
    acting: dedupePersonCredits(actingCredits).length,
    directing: dedupePersonCredits(directingCredits).length,
    other: dedupePersonCredits(otherCredits).length
  };

  return (
    <section className="person-editorial-section person-credits-explorer" aria-labelledby="person-filmography-title">
      <header className="person-filmography-header">
        <div>
          <h3 id="person-filmography-title">Filmography</h3>
          <p>Explore credits by role, format, and release order.</p>
        </div>
        <div className="person-credit-count">{visibleCredits.length} shown</div>
      </header>

      <div className="person-explorer-controls">
        <div className="person-filmography-tabs" aria-label="Credit role filters">
          {(['all', 'acting', 'directing', 'other'] as PersonRoleBucket[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setMediaFilter('all');
              }}
              className={activeTab === tab ? 'is-active' : ''}
              aria-pressed={activeTab === tab}
            >
              {tab === 'all' ? 'All' : tab[0].toUpperCase() + tab.slice(1)}
              <span>{tabCounts[tab]}</span>
            </button>
          ))}
        </div>

        <div className="person-filter-row">
          <div className="person-media-filters" aria-label="Media type filters">
            {availableMediaFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setMediaFilter(filter)}
                className={mediaFilter === filter ? 'is-active' : ''}
                aria-pressed={mediaFilter === filter}
              >
                {filter === 'all' ? <Clapperboard size={15} aria-hidden="true" /> : filter === 'movie' ? <Film size={15} aria-hidden="true" /> : <Tv size={15} aria-hidden="true" />}
                <span>{filter === 'all' ? 'All media' : filter === 'movie' ? 'Movies' : 'TV'}</span>
              </button>
            ))}
          </div>

          <label className="person-sort-control">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as PersonCreditSort)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Popularity</option>
              <option value="title">Title</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading && visibleCredits.length === 0 ? (
        <div className="person-filmography-list">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : visibleCredits.length > 0 ? (
        <div className="person-filmography-timeline">
          {decadeGroups.map((group) => (
            <div className="person-decade-group" key={group.label}>
              <div className="person-decade-label">{group.label}</div>
              <div className="person-filmography-list">
                {group.credits.map((credit) => (
                  <article
                    key={`${credit.media_type || 'movie'}-${credit.id}`}
                    className="person-filmography-card group"
                    onClick={() => onOpenCredit(credit)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      onOpenCredit(credit);
                    }}
                    aria-label={`Open ${credit.title}`}
                  >
                    <div className="person-filmography-poster-wrapper relative">
                      <PosterFrame credit={credit} compact={false} />
                      {onQuickSaveToWatchlist && (
                        <button
                          type="button"
                          className={`absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${
                            isCreditSavedToWatchlist(credit, watchlists)
                              ? 'bg-violet-500 text-white scale-100 border border-violet-400/30'
                              : 'bg-black/50 text-white/70 hover:bg-violet-500/90 hover:text-white hover:scale-110 border border-white/20'
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onQuickSaveToWatchlist(toQuickSaveTitle(credit));
                          }}
                          aria-label={isCreditSavedToWatchlist(credit, watchlists) ? `${credit.title} is saved. Open save dialog` : `Save ${credit.title} to watchlist`}
                          aria-pressed={isCreditSavedToWatchlist(credit, watchlists)}
                          title={isCreditSavedToWatchlist(credit, watchlists) ? 'Saved' : 'Save'}
                        >
                          <TagIcon className="w-3.5 h-3.5" />
                          <span className="sr-only">Save</span>
                        </button>
                      )}
                      {onToggleWatched && (
                        <button
                          type="button"
                          className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${
                            isWatched?.(credit.id, credit.media_type)
                              ? 'bg-green-500 text-white scale-100'
                              : 'bg-black/50 text-white/60 hover:bg-green-500/90 hover:text-white hover:scale-110 border border-white/20'
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleWatched(toQuickSaveTitle(credit));
                          }}
                          aria-label={isWatched?.(credit.id, credit.media_type) ? `Mark ${credit.title} as unwatched` : `Mark ${credit.title} as watched`}
                          aria-pressed={Boolean(isWatched?.(credit.id, credit.media_type))}
                          title={isWatched?.(credit.id, credit.media_type) ? 'Watched' : 'Mark watched'}
                        >
                          <WatchedIcon className="w-3.5 h-3.5" filled={isWatched?.(credit.id, credit.media_type)} />
                          <span className="sr-only">Watched</span>
                        </button>
                      )}
                    </div>
                    <div className="person-filmography-body">
                      <div className="person-title-row-heading">
                        <p className="person-filmography-title">{credit.title}</p>
                        <span className={`person-media-chip is-${credit.media_type === 'tv' ? 'tv' : 'movie'}`}>
                          {credit.media_type === 'tv' ? 'TV' : 'Movie'}
                        </span>
                      </div>
                      <div className="person-title-row-meta">
                        <span>{credit.year || 'Unknown year'}</span>
                        <span>{formatPrimaryRole(credit)}</span>
                        <span>{formatSecondaryRole(credit)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No credits match these filters" body="Try a different role, media type, or sort option." />
      )}
    </section>
  );
};

const RelatedPeopleRail: React.FC<{
  relatedPeople?: PersonPayload['related_people'];
  onOpenPerson?: (id: number, name: string) => void;
  onQuickSearch?: (q: string) => void;
}> = ({ relatedPeople, onOpenPerson, onQuickSearch }) => (
  <section className="person-editorial-section" aria-labelledby="person-related-title">
    <header className="person-section-header">
      <h3 id="person-related-title">Related People</h3>
      {Array.isArray(relatedPeople) && relatedPeople.length > 0 && <span>{relatedPeople.length} collaborators</span>}
    </header>
    {Array.isArray(relatedPeople) && relatedPeople.length > 0 ? (
      <div className="person-related-grid">
        {relatedPeople.slice(0, 12).map((relatedPerson) => {
          const personCard = buildPersonCardPresentation({
            name: relatedPerson.name,
            profile_url: relatedPerson.profile_url,
            known_for: relatedPerson.known_for
          });
          return (
            <button
              key={relatedPerson.id}
              className="person-related-card"
              onClick={() => {
                track('related_tile_click', { type: 'person', id: relatedPerson.id, name: relatedPerson.name });
                if (onOpenPerson && relatedPerson.id) {
                  onOpenPerson(relatedPerson.id, relatedPerson.name);
                } else if (onQuickSearch) {
                  onQuickSearch(relatedPerson.name);
                }
              }}
              aria-label={`Open ${relatedPerson.name}`}
            >
              <div className="person-related-avatar">
                {relatedPerson.profile_url ? (
                  <img src={relatedPerson.profile_url} alt={`${relatedPerson.name} profile`} loading="lazy" />
                ) : (
                  <div className="person-related-avatar-fallback">{getInitials(relatedPerson.name)}</div>
                )}
              </div>
              <p className="person-related-name">{relatedPerson.name}</p>
              <p className="person-related-snippet">{personCard.snippet}</p>
            </button>
          );
        })}
      </div>
    ) : (
      <EmptyState title="No collaborator graph yet" body="Related people appear when enough shared-credit data is available." />
    )}
  </section>
);

const SourcesSection: React.FC<{ sources?: PersonPayload['sources'] }> = ({ sources }) => (
  <section className="person-editorial-section person-sources-section" aria-labelledby="person-sources-title">
    <header>
      <h3 id="person-sources-title">Sources</h3>
    </header>
    {sources && sources.length > 0 ? (
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.name}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState title="Sources unavailable" body="Source links will appear when provider metadata includes them." />
    )}
  </section>
);

const BiographyModal: React.FC<{ personName: string; biography: string; onClose: () => void }> = ({ personName, biography, onClose }) => (
  <div className="person-biography-modal-shell" role="presentation" onMouseDown={onClose}>
    <section
      className="person-biography-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-biography-modal-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header>
        <div>
          <p>Biography</p>
          <h3 id="person-biography-modal-title">{personName}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Close biography">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="person-biography-modal-body">
        <p>{biography}</p>
      </div>
    </section>
  </div>
);

const PersonDisplay: React.FC<{
  data: PersonPayload;
  isLoading?: boolean;
  onQuickSearch?: (q: string) => void;
  onBriefMe?: (name: string) => void;
  onOpenTitle?: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  onOpenPerson?: (id: number, name: string) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: QuickSaveTitle) => void;
  onQuickSaveToWatchlist?: (item: QuickSaveTitle) => void;
  watchlists?: WatchlistFolder[];
}> = ({
  data,
  isLoading,
  onQuickSearch,
  onBriefMe,
  onOpenTitle,
  onOpenPerson,
  isWatched,
  onToggleWatched,
  onQuickSaveToWatchlist,
  watchlists = []
}) => {
  const [isBiographyOpen, setIsBiographyOpen] = useState(false);
  useRenderCounter('PersonDisplay');

  if (!data) return null;

  const { person, filmography, sources, related_people } = data;
  const {
    allCredits,
    actingCredits,
    directingCredits,
    otherCredits,
    topWork,
    roleDistribution,
    careerSpan,
    tags
  } = derivePersonCreditBuckets({ ...data, filmography });
  const dedupedAllCredits = useMemo(() => dedupePersonCredits(allCredits), [allCredits]);
  const recentCredits = useMemo(
    () => sortPersonCredits(dedupedAllCredits, 'newest').slice(0, 12),
    [dedupedAllCredits]
  );
  const normalizedBiography = String(person.biography || '').replace(/\s+/g, ' ').trim();
  const { text: heroBiography, isTruncated: isBioTruncated } = useMemo(
    () => truncateBiography(normalizedBiography, 360),
    [normalizedBiography]
  );

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

  // Action handlers removed

  return (
    <div className="person-editorial-page">
      <SeoHead
        title={person.name}
        description={toMetaDescription(person.biography, `${person.name} biography, credits, and top works on MovieMonk.`)}
        path={`/person/${person.id}`}
        image={person.profile_url || undefined}
        type="profile"
        structuredData={[buildPersonJsonLd(data)]}
      />

      <PersonHero
        person={person}
        tags={tags}
        careerSpan={careerSpan}
        topWork={topWork}
        biographyExcerpt={heroBiography}
        hasBiography={isBioTruncated}
        onOpenBiography={() => setIsBiographyOpen(true)}
        onOpenCredit={handleOpenCredit}
      />

      <CareerStats roleDistribution={roleDistribution} careerSpan={careerSpan} allCount={dedupedAllCredits.length} />

      <div className="person-editorial-main-grid">
        <CreditRail
          title="Top Works"
          credits={topWork.slice(0, 12)}
          emptyTitle="Top works unavailable"
          emptyBody="Top work rankings appear when provider popularity data is available."
          onOpenCredit={handleOpenCredit}
          isWatched={isWatched}
          onToggleWatched={onToggleWatched}
          onQuickSaveToWatchlist={onQuickSaveToWatchlist}
          watchlists={watchlists}
        />
        <CreditRail
          title="Recent Credits"
          credits={recentCredits}
          emptyTitle="Recent credits unavailable"
          emptyBody="Recent credits appear when filmography dates are available."
          onOpenCredit={handleOpenCredit}
          isWatched={isWatched}
          onToggleWatched={onToggleWatched}
          onQuickSaveToWatchlist={onQuickSaveToWatchlist}
          watchlists={watchlists}
        />
        <CreditsExplorer
          allCredits={allCredits}
          actingCredits={actingCredits}
          directingCredits={directingCredits}
          otherCredits={otherCredits}
          isLoading={isLoading}
          onOpenCredit={handleOpenCredit}
          isWatched={isWatched}
          onToggleWatched={onToggleWatched}
          onQuickSaveToWatchlist={onQuickSaveToWatchlist}
          watchlists={watchlists}
        />
        <RelatedPeopleRail relatedPeople={related_people} onOpenPerson={onOpenPerson} onQuickSearch={onQuickSearch} />
        <SourcesSection sources={sources} />
      </div>

      {isBiographyOpen && normalizedBiography && (
        <BiographyModal
          personName={person.name}
          biography={normalizedBiography}
          onClose={() => setIsBiographyOpen(false)}
        />
      )}

      {isLoading && (
        <div className="person-loading-note" role="status" aria-live="polite">
          <div className="person-loading-spinner" />
          Updating data...
        </div>
      )}

    </div>
  );
};

export default PersonDisplay;
