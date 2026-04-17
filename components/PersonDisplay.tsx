import React, { useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import { useRenderCounter } from '../lib/perfDebug';
import { PersonCredit, PersonRoleBucket } from '../types';
import { buildPersonCardPresentation } from '../services/personPresentation';
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
  topWork: PersonCredit[];
  roleDistribution: { acting: number; directing: number; other: number };
  careerSpan: { start_year?: number; end_year?: number; active_years?: number };
  tags: string[];
};

const BIOGRAPHY_MOBILE_LINES = 6;
const BIOGRAPHY_DESKTOP_LINES = 5;

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

export function selectVisibleCredits(
  activeTab: PersonRoleBucket,
  buckets: Pick<PersonCreditBuckets, 'allCredits' | 'actingCredits' | 'directingCredits'>
): PersonCredit[] {
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

const SkeletonCard: React.FC = () => (
  <div className="person-credit-skeleton">
    <div className="person-credit-skeleton-poster" />
    <div className="person-credit-skeleton-lines">
      <div />
      <div />
    </div>
  </div>
);

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

  const visibleCredits = useMemo(
    () => selectVisibleCredits(activeTab, { allCredits, actingCredits, directingCredits }),
    [activeTab, allCredits, actingCredits, directingCredits]
  );

  const recentCredits = useMemo(
    () => [...allCredits].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 12),
    [allCredits]
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


  const metadataParts = [
    person.birthday ? person.birthday : null,
    person.place_of_birth ? person.place_of_birth : null,
    person.known_for_department ? person.known_for_department : null
  ].filter(Boolean) as string[];

  const filmographyCounts = {
    all: allCredits.length,
    acting: actingCredits.length,
    directing: directingCredits.length
  };

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
      <section className="person-editorial-hero">
        <div className="person-editorial-identity">
          {person.profile_url ? (
              <img
                src={person.profile_url}
                alt={person.name}
                className="person-editorial-avatar"
                loading="eager"
                decoding="async"
                sizes="160px"
              />
          ) : (
            <div className="person-editorial-avatar person-editorial-avatar-fallback">No Photo</div>
          )}
          <div className="person-editorial-header">
            <h2 className="person-editorial-name">{person.name}</h2>
            {metadataParts.length > 0 && (
              <p className="person-editorial-meta-line">{metadataParts.join(' \u2022 ')}</p>
            )}
            {tags.length > 0 && (
              <div className="person-editorial-tags">
                {tags.slice(0, 4).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="person-career-snapshot">
        <article>
          <p>Acting</p>
          <strong>{roleDistribution.acting}</strong>
        </article>
        <article>
          <p>Directing</p>
          <strong>{roleDistribution.directing}</strong>
        </article>
        <article>
          <p>Career Span</p>
          <strong>{careerSpan.start_year && careerSpan.end_year ? `${careerSpan.start_year} - ${careerSpan.end_year}` : 'N/A'}</strong>
        </article>
      </section>

      {person.biography && (
        <section className="person-editorial-section person-biography-section">
          <header>
            <h3>Biography</h3>
          </header>
          <p
            className={`person-biography-text ${bioExpanded ? 'is-expanded' : ''}`}
            style={
              bioExpanded
                ? undefined
                : ({
                    ['--person-mobile-lines' as string]: String(BIOGRAPHY_MOBILE_LINES),
                    ['--person-desktop-lines' as string]: String(BIOGRAPHY_DESKTOP_LINES)
                  } as React.CSSProperties)
            }
          >
            {person.biography}
          </p>
          <button type="button" className="person-biography-toggle" onClick={() => setBioExpanded((value) => !value)}>
            {bioExpanded ? 'Show less' : 'Read more'}
          </button>
        </section>
      )}

      {topWork.length > 0 && (
        <section className="person-editorial-section">
          <header>
            <h3>Top Works</h3>
          </header>
          <div className="person-credit-rail">
            {topWork.slice(0, 10).map((credit) => (
              <button
                key={`top-${credit.media_type}-${credit.id}-${credit.role}`}
                className="person-rail-card"
                onClick={() => handleOpenCredit(credit)}
                aria-label={`Open ${credit.title}`}
              >
                <div className="person-rail-poster">
                  {credit.poster_url ? (
                    <img src={credit.poster_url} alt={`${credit.title} poster`} loading="lazy" />
                  ) : (
                    <div className="person-rail-poster-fallback">No Poster</div>
                  )}
                </div>
                <p className="person-rail-title">{credit.title}</p>
                <p className="person-rail-meta">{credit.year || '—'} • {credit.media_type === 'tv' ? 'TV' : 'Movie'}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {recentCredits.length > 0 && (
        <section className="person-editorial-section">
          <header>
            <h3>Recent Credits</h3>
          </header>
          <div className="person-credit-rail">
            {recentCredits.map((credit) => (
              <button
                key={`recent-${credit.media_type}-${credit.id}-${credit.role}`}
                className="person-rail-card"
                onClick={() => handleOpenCredit(credit)}
                aria-label={`Open ${credit.title}`}
              >
                <div className="person-rail-poster">
                  {credit.poster_url ? (
                    <img src={credit.poster_url} alt={`${credit.title} poster`} loading="lazy" />
                  ) : (
                    <div className="person-rail-poster-fallback">No Poster</div>
                  )}
                </div>
                <p className="person-rail-title">{credit.title}</p>
                <p className="person-rail-meta">{credit.year || '—'} • {credit.role}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="person-editorial-section">
        <header className="person-filmography-header">
          <h3>Filmography</h3>
          <div className="person-filmography-tabs">
            {(['all', 'acting', 'directing'] as PersonRoleBucket[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? 'is-active' : ''}
              >
                {tab === 'all'
                  ? `All (${filmographyCounts.all})`
                  : tab === 'acting'
                    ? `Acting (${filmographyCounts.acting})`
                    : `Directing (${filmographyCounts.directing})`}
              </button>
            ))}
          </div>
        </header>
        {isLoading && visibleCredits.length === 0 ? (
          <div className="person-filmography-grid">
            {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : (
          <div className="person-filmography-grid">
            {visibleCredits.map((credit) => (
              <button
                key={`${credit.media_type || 'movie'}-${credit.id}-${credit.role}`}
                className="person-filmography-card"
                onClick={() => handleOpenCredit(credit)}
                aria-label={`Open ${credit.title}`}
              >
                <div className="person-filmography-poster">
                  {credit.poster_url ? (
                    <img src={credit.poster_url} alt={credit.title} loading="lazy" />
                  ) : (
                    <div className="person-rail-poster-fallback">No Poster</div>
                  )}
                </div>
                <div className="person-filmography-body">
                  <p className="person-filmography-title">{credit.title}</p>
                  <p className="person-filmography-meta">{credit.year || '—'} • {credit.media_type === 'tv' ? 'TV' : 'Movie'}</p>
                  <p className="person-filmography-role">{credit.role}{credit.character ? ` as ${credit.character}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {Array.isArray(related_people) && related_people.length > 0 && (
        <section className="person-editorial-section">
          <header>
            <h3>Related People</h3>
          </header>
          <div className="person-related-rail">
            {related_people.slice(0, 12).map((relatedPerson) => {
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
                    if (onQuickSearch) onQuickSearch(relatedPerson.name);
                  }}
                  aria-label={`Open ${relatedPerson.name}`}
                >
                  <div className="person-related-avatar">
                    {relatedPerson.profile_url ? (
                      <img src={relatedPerson.profile_url} alt={`${relatedPerson.name} profile`} loading="lazy" />
                    ) : (
                      <div className="person-related-avatar-fallback">{relatedPerson.name.slice(0, 1).toUpperCase()}</div>
                    )}
                  </div>
                  <p className="person-related-name">{relatedPerson.name}</p>
                  <p className="person-related-snippet">{personCard.snippet}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {sources && sources.length > 0 && (
        <section className="person-editorial-section person-sources-section">
          <header>
            <h3>Sources</h3>
          </header>
          <ul>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>
              </li>
            ))}
          </ul>
        </section>
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
