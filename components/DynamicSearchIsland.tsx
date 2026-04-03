/**
 * DynamicSearchIsland Component
 * 
 * Modern header-integrated search interface for MovieMonk.
 * - Two search modes: Quick Search (fast) vs Deep Dive (detailed)
 * - Auto-completes with icon-tagged suggestions
 * - Keyboard shortcuts: Cmd+K / Ctrl+K to focus, / or K as fallbacks
 * - Accessibility: ARIA labels, keyboard navigation, focus management
 * - Responsive: Header slot on all breakpoints
 */

import React, { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics/react';
import { Zap, FlaskConical, Film, Tv, User, Sparkles, Lightbulb } from 'lucide-react';
import { QueryComplexity, SuggestionItem } from '../types';
import { SearchIcon, SendIcon } from './icons';
import { getNextHighlightIndex, inferInteractionIntent, resolveEnterAction } from '../services/suggestInteraction';
import { buildPersonCardPresentation } from '../services/personPresentation';
import { useDebounce } from '../hooks/useDebounce';
import '../styles/dynamic-search-island.css';

// Helper to get icon component by suggestion type
const getSuggestionIconComponent = (type: string, media_type?: string) => {
  if (type === 'movie' || media_type === 'movie') return Film;
  if (type === 'show' || media_type === 'tv') return Tv;
  if (type === 'person') return User;
  return Sparkles;
};

interface DynamicSearchIslandProps {
  onSearch: (query: string, complexity: QueryComplexity) => void;
  onSuggestionSelect?: (suggestion: SuggestionItem) => void;
  isLoading?: boolean;
}

const STORAGE_KEY_ANALYSIS = 'moviemonk_analysis_mode';
const STORAGE_KEY_DAILY_TRENDING = 'moviemonk_daily_trending_searches_v1';
const SUGGEST_DEBOUNCE_MS = 150;
const SUGGEST_CACHE_TTL_MS = 45 * 1000;
const AUTO_SELECT_CONFIDENCE = 0.82;
const DAILY_TRENDING_LIMIT = 6;
const DAILY_TRENDING_ENGLISH_COUNT = 4;

type TrendingSuggestionItem = SuggestionItem & {
  trendLabel: string;
  banner_url?: string;
};

const EAST_ASIAN_LANGUAGES = new Set(['ko', 'ja']);
const INDIAN_LANGUAGES = new Set(['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa']);

const getTodayKey = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const normalizeTrendingSuggestion = (item: any, trendLabel: string): TrendingSuggestionItem | null => {
  if (!item || typeof item.id !== 'number' || item.media_type !== 'movie') return null;
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title) return null;

  const year = typeof item.release_date === 'string' && item.release_date.length >= 4
    ? item.release_date.slice(0, 4)
    : undefined;

  return {
    id: item.id,
    title,
    year,
    type: 'movie',
    media_type: 'movie',
    poster_url: typeof item.poster_path === 'string' && item.poster_path
      ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
      : undefined,
    banner_url: typeof item.backdrop_path === 'string' && item.backdrop_path
      ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}`
      : undefined,
    confidence: 0.99,
    trendLabel
  };
};

const pickTrendingMix = (results: any[]): TrendingSuggestionItem[] => {
  const movies = Array.isArray(results)
    ? results.filter((item: any) => item?.media_type === 'movie' || (!item?.media_type && item?.title))
    : [];

  const english = movies.filter((item: any) => item?.original_language === 'en');
  const eastAsian = movies.filter((item: any) => EAST_ASIAN_LANGUAGES.has(String(item?.original_language || '')));
  const indian = movies.filter((item: any) => INDIAN_LANGUAGES.has(String(item?.original_language || '')));

  const pickedIds = new Set<number>();
  const picked: TrendingSuggestionItem[] = [];

  const pushFromBucket = (bucket: any[], count: number, labelFor: (item: any) => string) => {
    for (const item of bucket) {
      if (picked.length >= DAILY_TRENDING_LIMIT || count <= 0) break;
      if (pickedIds.has(item.id)) continue;
      const normalized = normalizeTrendingSuggestion(item, labelFor(item));
      if (!normalized) continue;
      picked.push(normalized);
      pickedIds.add(normalized.id);
      count -= 1;
    }
  };

  pushFromBucket(english, DAILY_TRENDING_ENGLISH_COUNT, () => 'English trending');
  pushFromBucket(eastAsian, 1, (item) => item?.original_language === 'ko' ? 'Korean pick' : 'Japanese pick');
  pushFromBucket(indian, 1, () => 'Indian pick');

  if (picked.length < DAILY_TRENDING_LIMIT) {
    pushFromBucket(english, DAILY_TRENDING_LIMIT, () => 'English trending');
  }

  if (picked.length < DAILY_TRENDING_LIMIT) {
    pushFromBucket(movies, DAILY_TRENDING_LIMIT, (item) => {
      const language = String(item?.original_language || '').toLowerCase();
      if (language === 'en') return 'English trending';
      if (language === 'ko') return 'Korean pick';
      if (language === 'ja') return 'Japanese pick';
      if (INDIAN_LANGUAGES.has(language)) return 'Indian pick';
      return 'Global trending';
    });
  }

  return picked.slice(0, DAILY_TRENDING_LIMIT);
};

const readDailyTrendingCache = (): TrendingSuggestionItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_TRENDING);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { day?: string; items?: TrendingSuggestionItem[] };
    if (parsed?.day !== getTodayKey() || !Array.isArray(parsed?.items)) return [];
    return parsed.items.filter((item) => typeof item?.title === 'string' && typeof item?.id === 'number');
  } catch {
    return [];
  }
};

const writeDailyTrendingCache = (items: TrendingSuggestionItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_TRENDING, JSON.stringify({
      day: getTodayKey(),
      items
    }));
  } catch {
    // Ignore localStorage failures in private mode / quota pressure.
  }
};

const DynamicSearchIsland: React.FC<DynamicSearchIslandProps> = ({ onSearch, onSuggestionSelect, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'complex'>('quick');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [dailyTrending, setDailyTrending] = useState<TrendingSuggestionItem[]>([]);
  const [showTrending, setShowTrending] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, SUGGEST_DEBOUNCE_MS);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const suggestCacheRef = useRef<Map<string, { createdAt: number; data: SuggestionItem[] }>>(new Map());
  const inFlightRef = useRef<Map<string, Promise<SuggestionItem[]>>>(new Map());
  const latestQueryRef = useRef('');
  const trendingLoadedRef = useRef(false);

  // Load persisted preferences on mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(STORAGE_KEY_ANALYSIS) as 'quick' | 'complex' | null;
    if (savedAnalysis && (savedAnalysis === 'quick' || savedAnalysis === 'complex')) {
      setAnalysisMode(savedAnalysis);
    }
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isExpanded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        track('search_island_opened', { trigger: 'keyboard_shortcut', key: 'cmd+k' });
        return;
      }

      // "/" or "k" to focus search (legacy shortcuts)
      if ((e.key === '/' || (e.key === 'k' && !e.ctrlKey && !e.metaKey)) && 
          !isExpanded && 
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsExpanded(true);
        track('search_island_opened', { trigger: 'keyboard_shortcut', key: e.key });
      }
      
      // Escape to collapse
      if (e.key === 'Escape' && isExpanded) {
        e.preventDefault();
        handleCollapse();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isExpanded]);

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        handleCollapse();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
    track('search_island_opened', { trigger: 'click' });
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery('');
    setInlinePrompt(null);
    setShowSuggestions(false);
    setShowTrending(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // Restore focus to trigger button
    if (triggerButtonRef.current) {
      triggerButtonRef.current.focus();
    }
    track('search_island_closed', {});
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    const complexity = analysisMode === 'complex' ? QueryComplexity.COMPLEX : QueryComplexity.SIMPLE;
    
    track('search_submitted_island', {
      query_length: query.trim().length,
      analysis_mode: analysisMode
    });

    onSearch(query, complexity);
    handleCollapse();
  };

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    track('search_suggestion_selected', {
      title_length: suggestion.title.length,
      type: suggestion.type,
      confidence: suggestion.confidence
    });

    setQuery(suggestion.title);
    setInlinePrompt(null);
    setShowSuggestions(false);
    setHighlightedIndex(-1);

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
      handleCollapse();
      return;
    }

    onSearch(suggestion.title, analysisMode === 'complex' ? QueryComplexity.COMPLEX : QueryComplexity.SIMPLE);
    handleCollapse();
  };

  const fetchDailyTrending = async (): Promise<TrendingSuggestionItem[]> => {
    const cached = readDailyTrendingCache();
    if (cached.length > 0) return cached;

    const response = await fetch('/api/tmdb?endpoint=trending/movie/day&language=en-US&page=1');
    if (!response.ok) return [];

    const payload = await response.json();
    const nextItems = pickTrendingMix(payload?.results || []);
    writeDailyTrendingCache(nextItems);
    return nextItems;
  };

  const fetchSuggestions = async (rawQuery: string): Promise<SuggestionItem[]> => {
    const normalizedQuery = rawQuery.trim().toLowerCase();
    if (normalizedQuery.length < 2) return [];

    const cached = suggestCacheRef.current.get(normalizedQuery);
    if (cached && Date.now() - cached.createdAt < SUGGEST_CACHE_TTL_MS) {
      return cached.data;
    }

    const inFlight = inFlightRef.current.get(normalizedQuery);
    if (inFlight) {
      return inFlight;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const request = fetch(`/api/suggest?q=${encodeURIComponent(rawQuery.trim())}`, {
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          return [] as SuggestionItem[];
        }

        const payload = await response.json();
        const nextSuggestions = Array.isArray(payload?.suggestions)
          ? payload.suggestions.filter((candidate: any) => typeof candidate?.title === 'string')
          : [];

        suggestCacheRef.current.set(normalizedQuery, {
          createdAt: Date.now(),
          data: nextSuggestions
        });

        return nextSuggestions;
      })
      .catch(() => [] as SuggestionItem[])
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        inFlightRef.current.delete(normalizedQuery);
      });

    inFlightRef.current.set(normalizedQuery, request);
    return request;
  };

  useEffect(() => {
    if (!isExpanded) return;

    if (!trendingLoadedRef.current && !isTrendingLoading) {
      let isCancelled = false;
      setIsTrendingLoading(true);
      fetchDailyTrending()
        .then((items) => {
          if (isCancelled) return;
          setDailyTrending(items);
          trendingLoadedRef.current = true;
        })
        .catch(() => {
          if (isCancelled) return;
          setDailyTrending([]);
          trendingLoadedRef.current = true;
        })
        .finally(() => {
          if (!isCancelled) {
            setIsTrendingLoading(false);
          }
        });

      return () => {
        isCancelled = true;
      };
    }
  }, [isExpanded, isTrendingLoading]);

  useEffect(() => {
    if (!isExpanded) return;

    const trimmed = debouncedQuery.trim();
    latestQueryRef.current = trimmed;

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setShowTrending(isTrendingLoading || dailyTrending.length > 0);
      setHighlightedIndex(-1);
      setIsSuggesting(false);
      setInlinePrompt(null);
      return;
    }

    setShowTrending(false);

    let isCancelled = false;

    const loadSuggestions = async () => {
      setIsSuggesting(true);
      const next = await fetchSuggestions(trimmed);
      if (isCancelled || latestQueryRef.current !== trimmed) {
        setIsSuggesting(false);
        return;
      }

      setSuggestions(next);
      setShowSuggestions(next.length > 0);
      setHighlightedIndex(next.length > 0 ? 0 : -1);
      setIsSuggesting(false);
    };

    loadSuggestions();

    return () => {
      isCancelled = true;
    };
  }, [dailyTrending.length, debouncedQuery, isExpanded, isTrendingLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSuggestions || suggestions.length === 0) {
        return;
      }
      setHighlightedIndex((current) => getNextHighlightIndex(current, 'next', suggestions.length));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showSuggestions || suggestions.length === 0) {
        return;
      }
      setHighlightedIndex((current) => getNextHighlightIndex(current, 'prev', suggestions.length));
      return;
    }

    if (e.key === 'Escape') {
      if (showSuggestions) {
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        setInlinePrompt(null);
        return;
      }
      e.preventDefault();
      handleCollapse();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      const interactionIntent = inferInteractionIntent(query);

      const action = resolveEnterAction({
        highlightedIndex,
        suggestionsCount: showSuggestions ? suggestions.length : 0,
        topConfidence: suggestions[0]?.confidence,
        confidenceThreshold: Math.max(AUTO_SELECT_CONFIDENCE, interactionIntent.confidenceThreshold)
      });

      if (action === 'select_highlighted') {
        handleSuggestionSelect(suggestions[highlightedIndex]);
        return;
      }

      if (action === 'select_top') {
        handleSuggestionSelect(suggestions[0]);
        return;
      }

      if (action === 'prompt_inline_selection') {
        setInlinePrompt('Multiple close matches found. Pick one from the list.');
        setShowSuggestions(true);
        return;
      }

      handleSubmit();
    }
  };

  if (!isExpanded) {
    // Collapsed state: minimal search pill with hint
    return (
      <div
        ref={islandRef}
        className="search-island collapsed"
        role="button"
        tabIndex={0}
        aria-label="Open search"
        aria-expanded="false"
        aria-controls="search-island-content"
        onClick={handleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleExpand();
          }
        }}
      >
        <SearchIcon className="search-icon" />
        <span className="collapsed-text">Find a movie...</span>
        <div className="collapsed-kbd">
          <span className="kbd-tag">⌘K</span>
        </div>
      </div>
    );
  }

  const shouldExpandForResults = query.trim().length >= 2 || isSuggesting || (showSuggestions && suggestions.length > 0);

  // Expanded panel state
  return (
    <>
      <div className="search-island-backdrop" onClick={handleCollapse} aria-hidden="true" />
      <div
        ref={islandRef}
        className={`search-island expanded ${shouldExpandForResults ? 'has-results' : 'is-compact'}`}
        role="dialog"
        aria-label="Search movies and shows"
        aria-modal="false"
        id="search-island-content"
      >
        <div className="island-content">
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <SearchIcon className="search-input-left-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setShowTrending(false);
                }
                setInlinePrompt(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                } else if (query.trim().length < 2 && (dailyTrending.length > 0 || isTrendingLoading)) {
                  setShowTrending(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search movies, shows, actors, directors..."
              disabled={isLoading}
              aria-label="Search query"
              aria-autocomplete="list"
              aria-controls="search-suggestion-list"
              aria-expanded={showSuggestions}
              aria-activedescendant={highlightedIndex >= 0 ? `search-suggestion-${highlightedIndex}` : undefined}
              className="search-input has-icons"
            />
            {isLoading ? (
              <button type="button" className="search-input-action" disabled aria-label="Searching">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className="search-input-action"
                disabled={!query.trim()}
                aria-label="Search"
                title="Search"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            )}
            {isSuggesting && !isLoading && <div className="suggest-loading">Searching...</div>}

            {showTrending && query.trim().length < 2 && (
              <div className="suggest-dropdown trending-dropdown" role="listbox" aria-label="Daily trending searches">
                <div className="trending-header">
                  <span className="trending-title">Trending Searches</span>
                </div>
                {isTrendingLoading && (
                  <div className="trending-loading-row">Loading daily picks...</div>
                )}
                {!isTrendingLoading && dailyTrending.map((suggestion) => {
                  const IconComponent = getSuggestionIconComponent(suggestion.type, suggestion.media_type);
                  return (
                    <button
                      type="button"
                      key={`trending-${suggestion.id}`}
                      role="option"
                      className="suggest-row trending-row"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div className="suggest-poster-wrap is-title">
                        {suggestion.banner_url ? (
                          <img src={suggestion.banner_url} alt={suggestion.title} className="suggest-poster" loading="lazy" />
                        ) : suggestion.poster_url ? (
                          <img src={suggestion.poster_url} alt={suggestion.title} className="suggest-poster" loading="lazy" />
                        ) : (
                          <div className="suggest-poster placeholder">
                            <IconComponent size={24} className="poster-icon" />
                          </div>
                        )}
                      </div>
                      <div className="suggest-meta">
                        <div className="suggest-title-row">
                          <span className="suggest-title">{suggestion.title}</span>
                          <span className="trending-chip">{suggestion.trendLabel}</span>
                        </div>
                        <div className="suggest-subtitle">
                          {suggestion.year && <span>{suggestion.year}</span>}
                          <span>•</span>
                          <span className="capitalize">movie</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Suggestions Dropdown with Icons */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggest-dropdown" role="listbox" id="search-suggestion-list">
                {suggestions.map((suggestion, index) => {
                  const IconComponent = getSuggestionIconComponent(suggestion.type, suggestion.media_type);
                  const personCard = suggestion.type === 'person'
                    ? buildPersonCardPresentation({
                        name: suggestion.title,
                        profile_url: suggestion.poster_url,
                        known_for_department: suggestion.known_for_department,
                        known_for_titles: suggestion.known_for_titles
                      })
                    : null;
                  return (
                    <button
                      type="button"
                      key={`${suggestion.media_type}-${suggestion.id}`}
                      id={`search-suggestion-${index}`}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      className={`suggest-row ${highlightedIndex === index ? 'active' : ''}`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      {/* Poster */}
                      <div className={`suggest-poster-wrap ${suggestion.type === 'person' ? 'is-person' : 'is-title'}`}>
                        {suggestion.poster_url ? (
                          <img src={suggestion.poster_url} alt={suggestion.title} className="suggest-poster" loading="lazy" />
                        ) : (
                          <div className="suggest-poster placeholder">
                            <IconComponent size={24} className="poster-icon" />
                          </div>
                        )}
                      </div>
                      
                      {/* Title and Metadata */}
                      <div className="suggest-meta">
                        <div className="suggest-title-row">
                          <span className="suggest-title">{suggestion.title}</span>
                          {suggestion.type === 'person' && personCard ? (
                            <span className="suggest-role-chip">{personCard.roleChip}</span>
                          ) : (
                            <IconComponent size={18} className="suggest-icon-tag" />
                          )}
                        </div>
                        {suggestion.type === 'person' && personCard ? (
                          <div className="suggest-person-snippet">{personCard.snippet}</div>
                        ) : (
                          <div className="suggest-subtitle">
                            {suggestion.year && <span>{suggestion.year}</span>}
                            {suggestion.type && <span>•</span>}
                            <span className="capitalize">{suggestion.type}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {inlinePrompt && (
            <div className="suggest-inline-hint">
              <Lightbulb size={16} className="inline mr-1" />
              {inlinePrompt}
            </div>
          )}

          {/* Mode Selector: Single-line pill toggle */}
          <div className="mode-selector-pill" role="tablist" aria-label="Search mode">
            <button
              type="button"
              onClick={() => {
                setAnalysisMode('quick');
                localStorage.setItem(STORAGE_KEY_ANALYSIS, 'quick');
                track('analysis_mode_toggled', { from: analysisMode, to: 'quick', source: 'search_island' });
              }}
              className={`mode-pill-btn ${analysisMode === 'quick' ? 'active' : ''}`}
              role="tab"
              aria-selected={analysisMode === 'quick'}
              aria-pressed={analysisMode === 'quick'}
              title="Fast results with summary"
              aria-label="Quick Search"
            >
              <Zap size={14} className="mode-icon-inline" />
              <span className="mode-label-group">
                <span className="mode-label-inline">Quick</span>
                <span className="mode-desc-inline">Fast summary</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAnalysisMode('complex');
                localStorage.setItem(STORAGE_KEY_ANALYSIS, 'complex');
                track('analysis_mode_toggled', { from: analysisMode, to: 'complex', source: 'search_island' });
              }}
              className={`mode-pill-btn ${analysisMode === 'complex' ? 'active' : ''}`}
              role="tab"
              aria-selected={analysisMode === 'complex'}
              aria-pressed={analysisMode === 'complex'}
              title="Detailed analysis with cast, crew, ratings"
              aria-label="Deep Dive"
            >
              <FlaskConical size={14} className="mode-icon-inline" />
              <span className="mode-label-group">
                <span className="mode-label-inline">Deep</span>
                <span className="mode-desc-inline">Richer analysis</span>
              </span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
};

export default DynamicSearchIsland;
