import React, { useEffect, useMemo, useState } from 'react';
import type { SearchPageResponse, SearchResult, SuggestionItem, VibeParseResult } from '../types';
import type { QuickSaveTitle } from '../lib/quickSave';
import RatingDisplay from './RatingDisplay';
import LoadingScreen from './LoadingScreen';
import { TagIcon, WatchedIcon } from './icons';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { useAdaptiveImageTone } from '../hooks/useAdaptiveImageTone';
import { buildRevealStyle, getRevealClassName, useScrollReveal } from '../hooks/useScrollReveal';
import SeoHead from './SeoHead';
import { toMetaDescription } from '../lib/seo';
import { emitClientEvent } from '../services/clientObservability';
import { applyRankingFeedback, recordQueryFeedback, recordResultFeedback } from '../services/rankingFeedback';
import { streamGroqText } from '../services/groqService';
import '../styles/search-results-page.css';

interface SearchResultsPageProps {
  query: string;
  onSearchQuery: (nextQuery: string) => void;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  onOpenPerson: (personId: number, name?: string) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: {
    id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_url?: string | null;
    year?: string | null;
  }) => void;
  onQuickSaveToWatchlist?: (item: QuickSaveTitle) => void;
}

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

function broadenSearchQuery(input: string): string {
  return input
    .replace(/\b(202\d|201\d|19\d{2})\b/g, '')
    .replace(/\b(movie|movies|show|series|tv|actor|director)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resultKey(item: SearchResult): string {
  return `${item.media_type}:${item.id}`;
}

function mapToQuickSave(item: SearchResult): QuickSaveTitle {
  return {
    id: item.id,
    media_type: item.media_type,
    title: item.title,
    year: item.year,
    poster_url: item.poster_url || null
  };
}

interface SearchResultCardProps {
  item: SearchResult;
  index: number;
  watched: boolean;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  onToggleWatched?: (item: {
    id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_url?: string | null;
    year?: string | null;
  }) => void;
  onQuickSaveToWatchlist?: (item: QuickSaveTitle) => void;
  onResultFeedback?: (item: SearchResult, signal: 'up' | 'down') => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = React.memo(({
  item,
  index,
  watched,
  onOpenTitle,
  onToggleWatched,
  onQuickSaveToWatchlist,
  onResultFeedback
}) => {
  const { ref, isRevealed } = useScrollReveal<HTMLElement>();
  const { triggerFeedback, isFeedbackActive } = useActionFeedback();

  return (
    <article
      ref={ref}
      className={getRevealClassName(isRevealed, 'rise-up', 'search-result-card group')}
      data-reveal-variant="rise-up"
      style={buildRevealStyle(Math.max(0, Math.min(index, 8)) * 35, 260)}
      onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenTitle({ id: item.id, mediaType: item.media_type });
        }
      }}
    >
      <div className="search-result-poster-frame">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={`${item.title} poster`}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 30vw, 220px"
          />
        ) : (
          <div className="search-result-poster-empty">No poster</div>
        )}
        {!(onQuickSaveToWatchlist || onToggleWatched) && (
          <span className="discovery-poster-plus" aria-hidden="true">+</span>
        )}
        {onQuickSaveToWatchlist && (
          <button
            type="button"
            className={`absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-black/50 text-white/70 hover:bg-violet-500/90 hover:text-white hover:scale-110 border border-white/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${isFeedbackActive('save') ? 'is-feedback-active' : ''}`}
            title="Add to Watchlist"
            onClick={(e) => {
              e.stopPropagation();
              triggerFeedback('save');
              onQuickSaveToWatchlist(mapToQuickSave(item));
            }}
          >
            <TagIcon className="w-3.5 h-3.5" />
          </button>
        )}
        {onToggleWatched && (
          <button
            type="button"
            className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${isFeedbackActive('watch') ? 'is-feedback-active' : ''} ${watched
                ? 'bg-green-500 text-white scale-100'
                : 'bg-black/50 text-white/60 hover:bg-green-500/90 hover:text-white hover:scale-110 border border-white/20'
              }`}
            title={watched ? "Watched" : "Mark watched"}
            onClick={(e) => {
              e.stopPropagation();
              triggerFeedback('watch');
              onToggleWatched({
                id: item.id,
                media_type: item.media_type,
                title: item.title,
                poster_url: item.poster_url ?? null,
                year: item.year ?? null
              });
            }}
          >
            <WatchedIcon className="w-3.5 h-3.5" filled={watched} />
          </button>
        )}
        {typeof item.rating === 'number' && item.rating > 0 && (
          <div className="search-result-floating-rating">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5z" />
            </svg>
            <span>{item.rating.toFixed(1)}</span>
          </div>
        )}
        {onResultFeedback && (
          <div className="search-result-feedback-strip">
            <button
              type="button"
              className="search-result-feedback-btn"
              onClick={(event) => {
                event.stopPropagation();
                onResultFeedback(item, 'up');
              }}
              aria-label={`Helpful recommendation for ${item.title}`}
            >
              Helpful
            </button>
            <button
              type="button"
              className="search-result-feedback-btn is-negative"
              onClick={(event) => {
                event.stopPropagation();
                onResultFeedback(item, 'down');
              }}
              aria-label={`Not relevant for ${item.title}`}
            >
              Not relevant
            </button>
          </div>
        )}
      </div>
      <div className="search-result-body">
        <h4>{item.title}</h4>
        <div className="search-result-meta">
          <span>{item.year || 'TBA'}</span>
          <span>{item.type === 'show' ? 'TV Show' : 'Movie'}</span>
        </div>
        {(typeof item.vibe_score === 'number' || (item.match_reasons?.length || 0) > 0) && (
          <div className="search-result-vibe-block">
            {typeof item.vibe_score === 'number' && (
              <span className="search-result-vibe-score">{item.vibe_score}% vibe</span>
            )}
            {(item.match_reasons?.length || 0) > 0 && (
              <div className="search-result-reason-chips" aria-label={`Why ${item.title} matches the vibe`}>
                {item.match_reasons!.slice(0, 4).map((reason) => (
                  <span key={reason} className="search-result-reason-chip">
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
});

interface SearchPersonCardProps {
  person: SearchPageResponse['people'][number];
  index: number;
  query: string;
  onOpenPerson: (personId: number, name?: string) => void;
}

const SearchPersonCard: React.FC<SearchPersonCardProps> = React.memo(({ person, index, query, onOpenPerson }) => {
  const { ref, isRevealed } = useScrollReveal<HTMLButtonElement>();

  return (
    <button
      ref={ref}
      type="button"
      className={getRevealClassName(isRevealed, 'rise-up', 'search-person-card')}
      data-reveal-variant="rise-up"
      style={buildRevealStyle(Math.max(0, Math.min(index, 8)) * 35, 260)}
      onClick={() => onOpenPerson(person.id, person.name)}
    >
      <div className="search-person-avatar">
        {person.profile_url ? (
          <img src={person.profile_url} alt={person.name} loading="lazy" decoding="async" sizes="64px" />
        ) : (
          <span>{person.name.slice(0, 1)}</span>
        )}
      </div>
      <div className="search-person-body">
        <strong>{person.name}</strong>
        <span>{person.known_for_department || `Matching "${query.trim()}"`}</span>
      </div>
    </button>
  );
});

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  query,
  onSearchQuery,
  onOpenTitle,
  onOpenPerson,
  isWatched,
  onToggleWatched,
  onQuickSaveToWatchlist
}) => {
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState<SearchPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptySuggestions, setEmptySuggestions] = useState<SuggestionItem[]>([]);
  const [heroAiSnippet, setHeroAiSnippet] = useState<string>('');
  const [rankingRefreshToken, setRankingRefreshToken] = useState(0);

  const { ref: heroRevealRef, isRevealed: isHeroRevealed } = useScrollReveal<HTMLElement>();
  const { ref: resultsRevealRef, isRevealed: isResultsRevealed } = useScrollReveal<HTMLElement>();
  const { ref: peopleRevealRef, isRevealed: isPeopleRevealed } = useScrollReveal<HTMLElement>();
  const { ref: paginationRevealRef, isRevealed: isPaginationRevealed } = useScrollReveal<HTMLElement>();
  const { triggerFeedback, isFeedbackActive } = useActionFeedback();

  const normalizedQuery = normalizeText(query);
  const heroTone = useAdaptiveImageTone(payload?.hero?.backdrop_url);
  const searchMode = payload?.search_mode || (payload?.vibe ? 'vibe' : 'keyword');
  const isVibeMode = searchMode !== 'keyword';

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery]);

  useEffect(() => {
    if (!normalizedQuery) {
      setPayload(null);
      setError(null);
      setEmptySuggestions([]);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setError(null);
      emitClientEvent({
        event: 'search_request_started',
        data: {
          query: query.trim(),
          page
        }
      });

      try {
        const searchBody: Record<string, unknown> = {
          q: query.trim(),
          page
        };

        try {
          const vibeResponse = await fetch('/api/vibe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({ q: query.trim() })
          });

          if (vibeResponse.ok) {
            const vibe = (await vibeResponse.json()) as VibeParseResult;
            searchBody.vibe = vibe;
            const fallback = (vibe.fallback_query_terms || []).join(' ').trim();
            if (fallback) {
              searchBody.q = fallback;
            }

            if (vibe.hard_constraints.media_type === 'movie' || vibe.hard_constraints.media_type === 'tv') {
              searchBody.type = vibe.hard_constraints.media_type;
            }

            if (typeof vibe.hard_constraints.release_year_min === 'number') {
              searchBody.yearMin = vibe.hard_constraints.release_year_min;
            }
            if (typeof vibe.hard_constraints.release_year_max === 'number') {
              searchBody.yearMax = vibe.hard_constraints.release_year_max;
            }
          }
        } catch {
          // Fall back to raw search query when vibe parsing fails.
        }

        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(searchBody)
        });
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        const data = (await response.json()) as SearchPageResponse;
        setPayload(data);
        emitClientEvent({
          event: 'search_request_succeeded',
          data: {
            query: query.trim(),
            page,
            total_results: data.total_results
          }
        });

        const noTitles = (data.results?.length || 0) === 0;
        if (noTitles) {
          const suggestRes = await fetch(`/api/suggest?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
          if (suggestRes.ok) {
            const suggestData = await suggestRes.json();
            const nextSuggestions = Array.isArray(suggestData?.suggestions) ? suggestData.suggestions : [];
            setEmptySuggestions(nextSuggestions.slice(0, 5));
          } else {
            setEmptySuggestions([]);
          }
        } else {
          setEmptySuggestions([]);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Failed to load search results');
        setPayload(null);
        emitClientEvent({
          event: 'search_request_failed',
          level: 'warn',
          data: {
            query: query.trim(),
            page,
            message: err?.message || 'unknown_error'
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [query, normalizedQuery, page]);

  useEffect(() => {
    const hero = payload?.hero;
    if (!hero) {
      setHeroAiSnippet('');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const loadHeroSnippet = async () => {
      try {
        const system = 'You write short, spoiler-free movie and TV teaser blurbs.';
        const userPrompt = [
          `Title: ${hero.title}${hero.year ? ` (${hero.year})` : ''}`,
          `Type: ${hero.type === 'show' ? 'TV Show' : 'Movie'}`,
          `Overview: ${hero.overview || hero.summary_snippet || ''}`,
          'Task: Return one spoiler-free teaser sentence under 150 characters. Plain text only.'
        ].join('\n');

        let streamed = '';
        await streamGroqText({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.35,
          max_tokens: 120,
          signal: controller.signal,
          onDelta: (delta) => {
            streamed += delta;
            if (!cancelled) {
              setHeroAiSnippet(streamed.trim());
            }
          }
        });

        if (!cancelled && streamed.trim()) {
          setHeroAiSnippet(streamed.trim());
          return;
        }
      } catch {
        // Fallback to query endpoint when stream fails.
        try {
          const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: `${hero.title}${hero.year ? ` ${hero.year}` : ''}`,
              mode: 'short'
            }),
            signal: controller.signal
          });

          if (!response.ok) return;
          const data = await response.json();
          const nextSnippet = data?.summary?.summary_short;
          if (!cancelled && typeof nextSnippet === 'string' && nextSnippet.trim()) {
            setHeroAiSnippet(nextSnippet.trim());
          }
        } catch {
          // Keep fallback synopsis when AI snippet fails.
        }
      }
    };

    setHeroAiSnippet('');
    void loadHeroSnippet();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [payload?.hero?.id, payload?.hero?.title, payload?.hero?.year]);

  const alsoMatching = useMemo(() => {
    if (!payload) return [];
    const heroKey = payload.hero ? resultKey(payload.hero) : null;
    if (!heroKey) return payload.results;
    return payload.results.filter((item) => resultKey(item) !== heroKey);
  }, [payload]);

  const rerankedAlsoMatching = useMemo(
    () => applyRankingFeedback(alsoMatching),
    [alsoMatching, rankingRefreshToken]
  );

  const hasResults = Boolean(payload && ((payload.hero && payload.hero.id) || payload.results.length > 0));

  const renderDidYouMean = !isVibeMode && payload?.did_you_mean && payload.did_you_mean.length > 0
    ? payload.did_you_mean
    : [];
  const searchDescription = payload?.hero
    ? toMetaDescription(
        heroAiSnippet ||
        payload.hero.summary_snippet ||
        payload.hero.overview ||
        `Search results for ${query.trim()} on MovieMonk.`
      )
    : payload?.vibe
      ? `${payload.vibe.summary}. Search MovieMonk for "${query.trim()}" across movies, TV shows, actors, and directors.`
    : `Search MovieMonk for "${query.trim()}" across movies, TV shows, actors, and directors.`;

  const handleResultFeedback = (item: SearchResult, signal: 'up' | 'down') => {
    recordResultFeedback(query, item, signal);
    setRankingRefreshToken((value) => value + 1);
    emitClientEvent({
      event: 'search_result_feedback_submitted',
      data: {
        query: query.trim(),
        result_id: item.id,
        media_type: item.media_type,
        signal
      }
    });
  };


  return (
    <div className="search-page-shell">
      {query.trim() && (
        <SeoHead
          title={`Search results for "${query.trim()}"`}
          description={searchDescription}
          path={`/search?q=${encodeURIComponent(query.trim())}`}
          image={payload?.hero?.poster_url || payload?.hero?.backdrop_url || undefined}
          robots="noindex,follow"
        />
      )}
      <LoadingScreen type="movie" visible={isLoading} />


      {error && (
        <section className="search-page-error" role="alert">
          <p>{error}</p>
        </section>
      )}

      {!query.trim() && (
        <section className="search-page-empty-state">
          <h3>Start with a movie, show, actor, or director</h3>
          <p>Example: Hell, Dune 2021, Denis Villeneuve, or Dark TV series.</p>
        </section>
      )}

      {query.trim() && payload?.hero && (
        <section
          ref={heroRevealRef}
          className={getRevealClassName(isHeroRevealed, 'rise-up', 'search-hero-card')}
          data-reveal-variant="rise-up"
          style={buildRevealStyle(60, 420)}
          role="button"
          tabIndex={0}
          aria-label={`Open ${payload.hero.title}${payload.hero.year ? ` (${payload.hero.year})` : ''}`}
          onClick={() => onOpenTitle({ id: payload.hero!.id, mediaType: payload.hero!.media_type })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpenTitle({ id: payload.hero!.id, mediaType: payload.hero!.media_type });
            }
          }}
        >
          <div
            className="search-hero-backdrop"
            style={payload.hero.backdrop_url ? { backgroundImage: `url(${payload.hero.backdrop_url})` } : undefined}
          />
          <div className="search-hero-overlay" />
          <div className="search-hero-content">
            <div className="search-hero-top-row">
              <span className="search-hero-label">{isVibeMode ? 'Best Vibe Match' : 'Best Match'}</span>
              {typeof payload.hero.rating === 'number' && (
                <div className="search-hero-rating">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5z" />
                  </svg>
                  <span>{payload.hero.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <h3 className="search-hero-title">{payload.hero.title}</h3>
            
            <div className="search-hero-meta">
              <span>{payload.hero.year || 'TBA'}</span>
              {(payload.hero.genres && payload.hero.genres.length > 0) && (
                <>
                  <span className="search-hero-meta-dot" />
                  <span className="search-hero-genres">{payload.hero.genres.join(', ')}</span>
                </>
              )}
              <span className="search-hero-meta-dot" />
              <span>{payload.hero.type === 'show' ? 'TV Show' : 'Movie'}</span>
            </div>
            
            <p className="search-hero-summary">
              {heroAiSnippet || payload.hero.summary_snippet || payload.hero.overview || 'The story is kept under wraps.'}
            </p>
            
            <div className="search-hero-actions">
              {onQuickSaveToWatchlist && (
                <button
                  type="button"
                  className={`search-btn-primary mm-action-feedback ${isFeedbackActive('hero-save') ? 'is-feedback-active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    triggerFeedback('hero-save');
                    onQuickSaveToWatchlist(mapToQuickSave(payload.hero!));
                  }}
                >
                  <TagIcon className="w-4 h-4" />
                  Add to Watchlist
                </button>
              )}
              {onToggleWatched && (
                <button
                  type="button"
                  className={`search-btn-secondary mm-action-feedback ${isFeedbackActive('hero-watch') ? 'is-feedback-active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    triggerFeedback('hero-watch');
                    onToggleWatched({
                      id: payload.hero!.id,
                      media_type: payload.hero!.media_type,
                      title: payload.hero!.title,
                      poster_url: payload.hero!.poster_url ?? null,
                      year: payload.hero!.year ?? null
                    });
                  }}
                >
                  <WatchedIcon
                    className="w-4 h-4"
                    filled={Boolean(isWatched?.(payload.hero.id, payload.hero.media_type))}
                  />
                  {isWatched?.(payload.hero.id, payload.hero.media_type) ? 'Watched' : 'Mark As Watched'}
                </button>
              )}
            </div>
          </div>
          
          <div className="search-hero-glow-edge" />
        </section>
      )}

      {query.trim() && (
        <section
          ref={resultsRevealRef}
          className={getRevealClassName(isResultsRevealed, 'fade', 'search-results-section')}
          data-reveal-variant="fade"
          style={buildRevealStyle(0, 420)}
        >
          {isVibeMode && payload?.vibe && (
            <div className="search-vibe-banner" aria-label="Vibe search summary">
              <div className="search-vibe-copy">
                <span className="search-vibe-kicker">Vibe mode</span>
                <strong>{payload.vibe.summary}</strong>
                <p>Ranked from mood signals, not just the exact words you typed.</p>
              </div>
              {payload.vibe.signals.length > 0 && (
                <div className="search-vibe-signals">
                  {payload.vibe.signals.slice(0, 5).map((signal) => (
                    <span key={signal} className="search-vibe-signal">
                      {signal}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="search-results-header">
            <h3>{isVibeMode ? 'Vibe matches' : 'Also matching'}</h3>
            <div className="search-results-divider" />
          </div>


          {renderDidYouMean.length > 0 && (
            <div className="search-did-you-mean">
              <span>Did you mean?</span>
              <div className="search-did-you-mean-chips">
                {renderDidYouMean.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      emitClientEvent({
                        event: 'search_did_you_mean_clicked',
                        data: {
                          original_query: query.trim(),
                          selected_query: term
                        }
                      });
                      onSearchQuery(term);
                    }}
                    className="search-did-you-mean-chip"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {rerankedAlsoMatching.length > 0 && (
            <div className="search-results-grid">
              {rerankedAlsoMatching.map((item, index) => {
                const watched = Boolean(isWatched?.(item.id, item.media_type));
                return (
                  <SearchResultCard
                    key={resultKey(item)}
                    item={item}
                    index={index}
                    watched={watched}
                    onOpenTitle={onOpenTitle}
                    onToggleWatched={onToggleWatched}
                    onQuickSaveToWatchlist={onQuickSaveToWatchlist}
                    onResultFeedback={handleResultFeedback}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="search-page-empty-state mm-empty-state">
              <h3>No exact matches found</h3>
              <p>Try a broader query, check the spelling, or jump back into discovery while MovieMonk suggests a few nearby matches.</p>
              <div className="mm-empty-state-actions">
                <button
                  type="button"
                  className="mm-empty-state-cta"
                  onClick={() => onSearchQuery(broadenSearchQuery(query) || query.trim())}
                >
                  Try broader search
                </button>
                <a href="/" className="mm-empty-state-cta-secondary">
                  Go to discovery
                </a>
              </div>
              {emptySuggestions.length > 0 && (
                <div className="search-empty-suggestions">
                  {emptySuggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.media_type}-${suggestion.id}`}
                      type="button"
                      className="search-did-you-mean-chip"
                      onClick={() => onSearchQuery(suggestion.title)}
                    >
                      {suggestion.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {payload?.people && payload.people.length > 0 && (
        <section
          ref={peopleRevealRef}
          className={getRevealClassName(isPeopleRevealed, 'fade', 'search-people-section')}
          data-reveal-variant="fade"
          style={buildRevealStyle(0, 420)}
        >
          <h3>{isVibeMode ? 'Related people' : `People matching "${query.trim()}"`}</h3>
          <div className="search-people-strip">
            {payload.people.map((person, index) => (
              <SearchPersonCard
                key={person.id}
                person={person}
                index={index}
                query={query}
                onOpenPerson={onOpenPerson}
              />
            ))}
          </div>
        </section>
      )}

      {query.trim() && payload && payload.total_pages > 1 && (
        <section
          ref={paginationRevealRef}
          className={getRevealClassName(isPaginationRevealed, 'fade', 'search-pagination')}
          data-reveal-variant="fade"
          style={buildRevealStyle(0, 420)}
        >
          <button
            type="button"
            className="search-btn-secondary"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span>Page {page} of {Math.min(payload.total_pages, 20)}</span>
          <button
            type="button"
            className="search-btn-secondary"
            disabled={page >= Math.min(payload.total_pages, 20) || isLoading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </section>
      )}
    </div>
  );
};

export default SearchResultsPage;
