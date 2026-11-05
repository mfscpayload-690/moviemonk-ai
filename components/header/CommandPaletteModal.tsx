import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { track } from '@vercel/analytics/react';
import {
  Search,
  X,
  Zap,
  FlaskConical,
  SlidersHorizontal,
  Film,
  Tv,
  User,
  Sparkles,
  TrendingUp,
  BookmarkPlus,
  Loader2,
  Clock,
  CornerDownLeft
} from 'lucide-react';
import { QueryComplexity, SuggestionItem, SearchFilters, DiscoveryGenre } from '../../types';
import { QuickSaveTitle } from '../../lib/quickSave';
import { FilterPanel } from '../FilterPanel';
import { buildPersonCardPresentation } from '../../services/personPresentation';
import { useDebounce } from '../../hooks/useDebounce';
import { apiGet } from '../../lib/apiClient';
import { getNextHighlightIndex } from '../../services/suggestInteraction';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSearch: (query: string, complexity: QueryComplexity) => void;
  onSuggestionSelect?: (suggestion: SuggestionItem) => void;
  onQuickSaveToWatchlist?: (title: QuickSaveTitle) => void;
  isLoading?: boolean;
}

const STORAGE_KEY_ANALYSIS = 'moviemonk_analysis_mode';
const STORAGE_KEY_RECENT_SEARCHES = 'moviemonk_recent_palette_searches_v1';
const SUGGEST_DEBOUNCE_MS = 150;

const CURATED_AI_VIBES = [
  'Mind-bending 90s sci-fi thrillers',
  'Aesthetic rainy day comfort films',
  'Dark psychological thrillers like Severance',
  'High-octane neo-noir heist movies',
  'Smart British comedy with witty banter'
];

const sanitizeImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const hostname = parsed.hostname.toLowerCase();
      const isAllowedHost =
        hostname === 'image.tmdb.org' ||
        hostname === 'static.tvmaze.com' ||
        hostname === 'images.unsplash.com' ||
        hostname === 'moviemonk-ai.vercel.app' ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.googleusercontent.com') ||
        hostname.endsWith('.supabase.co');

      if (isAllowedHost) {
        return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      }
    }
  } catch {
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      if (/^\/[a-zA-Z0-9_./-]+$/.test(trimmed)) {
        return trimmed;
      }
    }
  }
  return '';
};

const getSuggestionIcon = (type: string, media_type?: string) => {
  if (type === 'movie' || media_type === 'movie') return Film;
  if (type === 'show' || media_type === 'tv') return Tv;
  if (type === 'person') return User;
  return Sparkles;
};

const getActiveFilterCount = (filters: SearchFilters): number => {
  let count = 0;
  if (Array.isArray(filters.genres) && filters.genres.length > 0) count++;
  if (filters.yearMin !== undefined) count++;
  if (filters.yearMax !== undefined) count++;
  if (filters.ratingMin !== undefined) count++;
  if (Array.isArray(filters.languages) && filters.languages.length > 0) count++;
  if (filters.sortBy) count++;
  return count;
};

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onSearch,
  onSuggestionSelect,
  onQuickSaveToWatchlist,
  isLoading = false
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [analysisMode, setAnalysisMode] = useState<QueryComplexity>(QueryComplexity.SIMPLE);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<DiscoveryGenre[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounce(query, SUGGEST_DEBOUNCE_MS);

  // Initialize preferences & recent searches
  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem(STORAGE_KEY_ANALYSIS) as QueryComplexity | null;
      if (savedAnalysis === QueryComplexity.COMPLEX || savedAnalysis === QueryComplexity.SIMPLE) {
        setAnalysisMode(savedAnalysis);
      }
      const rawRecents = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES);
      if (rawRecents) {
        setRecentSearches(JSON.parse(rawRecents));
      } else {
        const rawLegacy = localStorage.getItem('moviemonk_search_history_v1');
        if (rawLegacy) {
          const parsed = JSON.parse(rawLegacy);
          if (Array.isArray(parsed)) {
            const list = parsed
              .map((item: any) => (typeof item === 'string' ? item : item?.query))
              .filter(Boolean)
              .slice(0, 5);
            setRecentSearches(list);
          }
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Pre-fetch genres for filter drawer
    const fetchGenres = async () => {
      try {
        const data = await apiGet<any>('/api/tmdb', { endpoint: 'genre/movie/list' });
        if (Array.isArray(data?.genres)) setGenres(data.genres);
      } catch {
        // Fallback gracefully
      }
    };
    fetchGenres();
  }, []);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setHighlightedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen, initialQuery]);

  // Handle Autocomplete
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSuggesting(true);
    apiGet<any>('/api/suggest', { q: trimmed })
      .then((data) => {
        if (!controller.signal.aborted) {
          const rawList = Array.isArray(data)
            ? data
            : Array.isArray(data?.suggestions)
            ? data.suggestions
            : [];
          setSuggestions(rawList.slice(0, 7));
          setIsSuggesting(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setIsSuggesting(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const saveRecentSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const next = [cleaned, ...recentSearches.filter((s) => s.toLowerCase() !== cleaned.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    try {
      localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY_RECENT_SEARCHES);
      localStorage.removeItem('moviemonk_search_history_v1');
      localStorage.removeItem('moviemonk_autocomplete_cache_v1');
    } catch {
      // Ignore
    }
  };

  const handleSubmit = (searchQuery: string) => {
    const cleaned = searchQuery.trim();
    if (!cleaned) return;
    saveRecentSearch(cleaned);
    onSearch(cleaned, analysisMode);
    track('search_submitted_island', { query: cleaned, complexity: analysisMode, source: 'command_palette' });
    onClose();
  };

  const handleSelectSuggestion = (suggestion: SuggestionItem) => {
    saveRecentSearch(suggestion.title);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onSearch(suggestion.title, analysisMode);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => getNextHighlightIndex(prev, 'next', suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => getNextHighlightIndex(prev, 'prev', suggestions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        handleSubmit(query);
      }
    }
  };

  const activeFilterCount = getActiveFilterCount(filters);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        role="dialog"
        aria-modal="true"
        aria-label="Search and command palette"
        className="relative w-full max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[82vh] bg-neutral-950/95 border-b sm:border border-white/10 sm:rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Row */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, TV shows, cast, vibes, tropes…"
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-white/40 focus:outline-none"
            aria-label="Search query"
          />

          {isSuggesting && <Loader2 className="w-4 h-4 text-brand-primary animate-spin flex-shrink-0" />}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Filter Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className={`relative p-1.5 rounded-lg border transition-all ${
              activeFilterCount > 0
                ? 'bg-brand-primary/20 border-brand-primary/40 text-brand-primary'
                : 'bg-white/[0.04] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Search filters (year, genre, rating)"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-primary text-[9px] font-bold text-white flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Strip */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/60 border-b border-white/5 text-xs text-white/60">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">AI Analysis Mode</span>
          <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAnalysisMode(QueryComplexity.SIMPLE);
                try {
                  localStorage.setItem(STORAGE_KEY_ANALYSIS, QueryComplexity.SIMPLE);
                } catch {
                  // Ignore
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                analysisMode === QueryComplexity.SIMPLE
                  ? 'bg-amber-400/20 text-amber-300 font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Quick AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalysisMode(QueryComplexity.COMPLEX);
                try {
                  localStorage.setItem(STORAGE_KEY_ANALYSIS, QueryComplexity.COMPLEX);
                } catch {
                  // Ignore
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                analysisMode === QueryComplexity.COMPLEX
                  ? 'bg-purple-500/20 text-purple-300 font-medium'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3 h-3 text-purple-400" />
              <span>Deep CineMatch</span>
            </button>
          </div>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5">
          {/* Active Suggestions List (when user is typing) */}
          {suggestions.length > 0 && query.trim().length >= 2 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 px-2 mb-2">
                Top Matches
              </p>
              {suggestions.map((suggestion, index) => {
                const Icon = getSuggestionIcon(suggestion.type, suggestion.media_type);
                const isSelected = highlightedIndex === index;
                const safePoster = sanitizeImageUrl(suggestion.poster_url);
                const isPerson = suggestion.type === 'person';
                const personCard = isPerson
                  ? buildPersonCardPresentation({
                      name: suggestion.title,
                      profile_url: suggestion.poster_url,
                      known_for_department: suggestion.known_for_department,
                      known_for_titles: suggestion.known_for_titles
                    })
                  : null;

                return (
                  <div
                    key={`${suggestion.media_type || suggestion.type}-${suggestion.id}`}
                    className={`group flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border border-purple-500/30'
                        : 'hover:bg-white/[0.06] border border-transparent'
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Poster or Thumbnail */}
                      <div className="w-9 h-12 rounded-lg bg-neutral-800 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {safePoster ? (
                          <img src={safePoster} alt={suggestion.title} className="w-full h-full object-cover" />
                        ) : (
                          <Icon className="w-4 h-4 text-white/40" />
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{suggestion.title}</span>
                          {suggestion.year && (
                            <span className="text-xs text-white/40 flex-shrink-0">{suggestion.year}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                          {isPerson && personCard ? (
                            personCard.snippet
                          ) : (
                            <span className="capitalize">{suggestion.type || suggestion.media_type || 'Title'}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons on card hover */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!isPerson && onQuickSaveToWatchlist && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickSaveToWatchlist({
                              id: typeof suggestion.id === 'number' ? suggestion.id : 0,
                              title: suggestion.title,
                              media_type: (suggestion.media_type === 'tv' || suggestion.type === 'show') ? 'tv' : 'movie',
                              year: suggestion.year ? String(suggestion.year) : undefined,
                              poster_url: suggestion.poster_url || null
                            });
                          }}
                          className="p-1.5 rounded-lg text-white/40 hover:text-brand-primary hover:bg-white/10 transition-colors"
                          title="Save to Watchlist"
                          aria-label={`Save ${suggestion.title} to Watchlist`}
                        >
                          <BookmarkPlus className="w-4 h-4" />
                        </button>
                      )}
                      <CornerDownLeft className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Zero Query State (when no search query has been typed) */}
          {query.trim().length === 0 && (
            <>
              {/* Curated AI Vibe Prompts */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5 px-1 text-white/60">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Explore with AI Vibes
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CURATED_AI_VIBES.map((vibe) => (
                    <button
                      key={vibe}
                      type="button"
                      onClick={() => handleSubmit(vibe)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-brand-primary/40 transition-all text-left flex items-center gap-1.5 active:scale-95"
                    >
                      <span>{vibe}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                        Recent Searches
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[11px] text-white/40 hover:text-white/80 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSubmit(item)}
                        className="px-2.5 py-1 rounded-lg text-xs text-white/70 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-white/[0.02] text-[11px] text-white/40 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/60">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/60">↵</kbd> search
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/60">esc</kbd> close
            </span>
          </div>
          <span>MovieMonk AI Spotlight</span>
        </div>
      </motion.div>

      {/* Filter Panel Sub-drawer */}
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setShowFilters(false)}
        genres={genres}
        isOpen={showFilters}
      />
    </div>
  );

  const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') || document.body : null;
  return modalRoot ? createPortal(content, modalRoot) : content;
};

export default CommandPaletteModal;

