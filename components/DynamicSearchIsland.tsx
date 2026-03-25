/**
 * DynamicSearchIsland Component
 * 
 * Modern header-integrated search interface for MovieMonk.
 * - Two search modes: 🚀 Quick Search (fast) vs 🔬 Deep Dive (detailed)
 * - Auto-completes with icon-tagged suggestions
 * - Keyboard shortcuts: Cmd+K / Ctrl+K to focus, / or K as fallbacks
 * - Accessibility: ARIA labels, keyboard navigation, focus management
 * - Responsive: Header slot on all breakpoints
 */

import React, { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics/react';
import { QueryComplexity, SuggestionItem } from '../types';
import { Logo, SearchIcon, SendIcon } from './icons';
import { getNextHighlightIndex, resolveEnterAction } from '../services/suggestInteraction';
import '../styles/dynamic-search-island.css';

// Helper to get icon by suggestion type
const getSuggestionIcon = (type: string, media_type?: string) => {
  if (type === 'movie' || media_type === 'movie') return '🎬';
  if (type === 'show' || media_type === 'tv') return '📺';
  if (type === 'person') return '🎭';
  return '✨';
};

interface DynamicSearchIslandProps {
  onSearch: (query: string, complexity: QueryComplexity) => void;
  onSuggestionSelect?: (suggestion: SuggestionItem) => void;
  isLoading?: boolean;
}

const STORAGE_KEY_ANALYSIS = 'moviemonk_analysis_mode';
const SUGGEST_DEBOUNCE_MS = 200;
const SUGGEST_CACHE_TTL_MS = 45 * 1000;
const AUTO_SELECT_CONFIDENCE = 0.82;

const DynamicSearchIsland: React.FC<DynamicSearchIslandProps> = ({ onSearch, onSuggestionSelect, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'complex'>('quick');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const suggestCacheRef = useRef<Map<string, { createdAt: number; data: SuggestionItem[] }>>(new Map());
  const inFlightRef = useRef<Map<string, Promise<SuggestionItem[]>>>(new Map());
  const latestQueryRef = useRef('');

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

    const trimmed = query.trim();
    latestQueryRef.current = trimmed;

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      setInlinePrompt(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSuggesting(true);
      const next = await fetchSuggestions(trimmed);
      if (latestQueryRef.current !== trimmed) {
        setIsSuggesting(false);
        return;
      }

      setSuggestions(next);
      setShowSuggestions(next.length > 0);
      setHighlightedIndex(next.length > 0 ? 0 : -1);
      setIsSuggesting(false);
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, isExpanded]);

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

      const action = resolveEnterAction({
        highlightedIndex,
        suggestionsCount: showSuggestions ? suggestions.length : 0,
        topConfidence: suggestions[0]?.confidence,
        confidenceThreshold: AUTO_SELECT_CONFIDENCE
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

  // Expanded panel state
  return (
    <div
      ref={islandRef}
      className="search-island expanded"
      role="dialog"
      aria-label="Search movies and shows"
      aria-modal="false"
      id="search-island-content"
    >
      <div className="island-content">
        {/* Header with close button */}
        <div className="island-header">
          <div className="header-title">
            <SearchIcon className="w-5 h-5" />
            <span>Find Your Next Watch</span>
          </div>
          <button
            className="close-btn"
            onClick={handleCollapse}
            aria-label="Close search (Esc)"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setInlinePrompt(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
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
              className="search-input"
            />
            {isSuggesting && <div className="suggest-loading">Searching...</div>}

            {/* Suggestions Dropdown with Icons */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggest-dropdown" role="listbox" id="search-suggestion-list">
                {suggestions.map((suggestion, index) => (
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
                    <div className="suggest-poster-wrap">
                      {suggestion.poster_url ? (
                        <img src={suggestion.poster_url} alt={suggestion.title} className="suggest-poster" loading="lazy" />
                      ) : (
                        <div className="suggest-poster placeholder">{getSuggestionIcon(suggestion.type, suggestion.media_type)}</div>
                      )}
                    </div>
                    
                    {/* Title and Metadata */}
                    <div className="suggest-meta">
                      <div className="suggest-title-row">
                        <span className="suggest-title">{suggestion.title}</span>
                        <span className="suggest-icon-tag">{getSuggestionIcon(suggestion.type, suggestion.media_type)}</span>
                      </div>
                      <div className="suggest-subtitle">
                        {suggestion.year && <span>{suggestion.year}</span>}
                        {suggestion.type && <span>•</span>}
                        <span className="capitalize">{suggestion.type}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {inlinePrompt && <div className="suggest-inline-hint">💡 {inlinePrompt}</div>}

          {/* Mode Selector: Two Button Tabs */}
          <div className="mode-selector">
            <button
              type="button"
              onClick={() => {
                setAnalysisMode('quick');
                localStorage.setItem(STORAGE_KEY_ANALYSIS, 'quick');
                track('analysis_mode_toggled', { from: analysisMode, to: 'quick', source: 'search_island' });
              }}
              className={`mode-btn ${analysisMode === 'quick' ? 'active' : ''}`}
              aria-pressed={analysisMode === 'quick'}
              title="Fast results with summary"
            >
              <span className="mode-icon">🚀</span>
              <div className="mode-content">
                <span className="mode-label">Quick Search</span>
                <span className="mode-desc">Find a movie fast</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAnalysisMode('complex');
                localStorage.setItem(STORAGE_KEY_ANALYSIS, 'complex');
                track('analysis_mode_toggled', { from: analysisMode, to: 'complex', source: 'search_island' });
              }}
              className={`mode-btn ${analysisMode === 'complex' ? 'active' : ''}`}
              aria-pressed={analysisMode === 'complex'}
              title="Detailed analysis with cast, crew, ratings"
            >
              <span className="mode-icon">🔬</span>
              <div className="mode-content">
                <span className="mode-label">Deep Dive</span>
                <span className="mode-desc">Analyze in detail</span>
              </div>
            </button>
          </div>

          {/* Helper text */}
          <div className="mode-helper-text">
            {analysisMode === 'quick' ? (
              <span>⚡ Get instant results with key details and summaries</span>
            ) : (
              <span>🔍 Full analysis with cast, crew, ratings, and web context</span>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="search-action-btn"
            disabled={!query.trim() || isLoading}
            aria-label={isLoading ? 'Searching' : 'Search'}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <SendIcon className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </form>

        {/* Keyboard hints at bottom */}
        <div className="search-hints">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>⏎</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default DynamicSearchIsland;
