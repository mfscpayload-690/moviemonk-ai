import React, { useEffect, useMemo, useState } from 'react';
import type { SearchPageResponse, SearchResult, SuggestionItem } from '../types';
import type { QuickSaveTitle } from '../lib/quickSave';
import RatingDisplay from './RatingDisplay';
import { TagIcon, WatchedIcon } from './icons';
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

  const normalizedQuery = normalizeText(query);

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

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            q: query.trim(),
            page
          })
        });
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        const data = (await response.json()) as SearchPageResponse;
        setPayload(data);

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
    const loadHeroSnippet = async () => {
      try {
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: `${hero.title}${hero.year ? ` ${hero.year}` : ''}`,
            mode: 'short'
          })
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
    };

    setHeroAiSnippet('');
    void loadHeroSnippet();

    return () => {
      cancelled = true;
    };
  }, [payload?.hero?.id, payload?.hero?.title, payload?.hero?.year]);

  const alsoMatching = useMemo(() => {
    if (!payload) return [];
    const heroKey = payload.hero ? resultKey(payload.hero) : null;
    if (!heroKey) return payload.results;
    return payload.results.filter((item) => resultKey(item) !== heroKey);
  }, [payload]);

  const hasResults = Boolean(payload && ((payload.hero && payload.hero.id) || payload.results.length > 0));

  const renderDidYouMean = payload?.did_you_mean && payload.did_you_mean.length > 0
    ? payload.did_you_mean
    : [];

  return (
    <div className="search-page-shell">
      <section className="search-page-toolbar">
        <div>
          <p className="search-page-kicker">Search Results</p>
          <h2 className="search-page-title">
            {query.trim() ? `Results for "${query.trim()}"` : 'Search titles and people'}
          </h2>
          {payload && (
            <p className="search-page-subtitle">
              {payload.total_results.toLocaleString()} total matches on TMDB
            </p>
          )}
        </div>
      </section>

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
          className="search-hero-card"
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
            <p className="search-hero-label">Best Match</p>
            <h3 className="search-hero-title">{payload.hero.title}</h3>
            <div className="search-hero-meta">
              <span>{payload.hero.year || 'TBA'}</span>
              <span>{payload.hero.type === 'show' ? 'TV Show' : 'Movie'}</span>
              {typeof payload.hero.rating === 'number' && <span>{payload.hero.rating.toFixed(1)} / 10</span>}
            </div>
            {payload.hero.genres && payload.hero.genres.length > 0 && (
              <p className="search-hero-genres">{payload.hero.genres.join(' | ')}</p>
            )}
            <p className="search-hero-summary">
              {heroAiSnippet || payload.hero.summary_snippet || payload.hero.overview || 'No synopsis available yet.'}
            </p>
            <div className="search-hero-actions">
              {onQuickSaveToWatchlist && (
                <button
                  type="button"
                  className="search-btn-secondary"
                  onClick={(event) => {
                    event.stopPropagation();
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
                  className="search-btn-secondary"
                  onClick={(event) => {
                    event.stopPropagation();
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
                  {isWatched?.(payload.hero.id, payload.hero.media_type) ? 'Watched' : 'Mark Watched'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {query.trim() && (
        <section className="search-results-section">
          <div className="search-results-header">
            <h3>Also matching "{query.trim()}"</h3>
            {isLoading && <span>Refreshing...</span>}
          </div>

          {renderDidYouMean.length > 0 && (
            <div className="search-did-you-mean">
              <span>Did you mean:</span>
              {renderDidYouMean.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onSearchQuery(term)}
                  className="search-did-you-mean-chip"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {alsoMatching.length > 0 && (
            <div className="search-results-grid">
              {alsoMatching.map((item) => {
                const watched = Boolean(isWatched?.(item.id, item.media_type));
                return (
                  <article className="search-result-card" key={resultKey(item)}>
                    <button
                      type="button"
                      className="search-result-main"
                      onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
                    >
                      <div className="search-result-poster-frame">
                        {item.poster_url ? (
                          <img src={item.poster_url} alt={`${item.title} poster`} loading="lazy" />
                        ) : (
                          <div className="search-result-poster-empty">No poster</div>
                        )}
                      </div>
                      <div className="search-result-body">
                        <h4>{item.title}</h4>
                        <div className="search-result-meta">
                          <span>{item.year || 'TBA'}</span>
                          <span>{item.type === 'show' ? 'TV' : 'Movie'}</span>
                          <RatingDisplay score={item.rating ?? null} size="sm" compact />
                        </div>
                        <p>{item.summary_snippet || item.overview || 'No synopsis available yet.'}</p>
                      </div>
                    </button>
                    <div className="search-result-actions">
                      {onQuickSaveToWatchlist && (
                        <button
                          type="button"
                          onClick={() => onQuickSaveToWatchlist(mapToQuickSave(item))}
                          className="search-card-chip"
                        >
                          <TagIcon className="w-3.5 h-3.5" />
                          Watchlist
                        </button>
                      )}
                      {onToggleWatched && (
                        <button
                          type="button"
                          onClick={() => onToggleWatched({
                            id: item.id,
                            media_type: item.media_type,
                            title: item.title,
                            poster_url: item.poster_url ?? null,
                            year: item.year ?? null
                          })}
                          className="search-card-chip"
                        >
                          <WatchedIcon className="w-3.5 h-3.5" filled={watched} />
                          {watched ? 'Watched' : 'Mark watched'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="search-page-empty-state">
              <h3>No exact matches found</h3>
              <p>Try a broader query, remove filters, or use one of these suggestions.</p>
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
        <section className="search-people-section">
          <h3>People matching "{query.trim()}"</h3>
          <div className="search-people-strip">
            {payload.people.map((person) => (
              <button
                key={person.id}
                type="button"
                className="search-person-card"
                onClick={() => onOpenPerson(person.id, person.name)}
              >
                <div className="search-person-avatar">
                  {person.profile_url ? (
                    <img src={person.profile_url} alt={person.name} loading="lazy" />
                  ) : (
                    <span>{person.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="search-person-body">
                  <strong>{person.name}</strong>
                  <span>{person.known_for_department || 'Film & TV'}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {query.trim() && payload && payload.total_pages > 1 && (
        <section className="search-pagination">
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
