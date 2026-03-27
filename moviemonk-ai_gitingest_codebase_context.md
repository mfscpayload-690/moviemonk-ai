Directory structure:
└── mfscpayload-690-moviemonk-ai/
    ├── README.md
    ├── App-Responsive.tsx
    ├── constants.ts
    ├── CONTRIBUTING.md
    ├── index.html
    ├── index.tsx
    ├── jest.config.js
    ├── LICENSE
    ├── metadata.json
    ├── package.json
    ├── SECURITY.md
    ├── SKILL.md
    ├── tsconfig.json
    ├── types.ts
    ├── vercel.json
    ├── vite-env.d.ts
    ├── vite.config.ts
    ├── .env.example
    ├── .vercelignore
    ├── __tests__/
    │   ├── api/
    │   │   ├── contractSnapshots.test.ts
    │   │   ├── errorContract.test.ts
    │   │   ├── person.test.ts
    │   │   ├── query.test.ts
    │   │   ├── resolveEntity.test.ts
    │   │   ├── suggest.test.ts
    │   │   └── __snapshots__/
    │   │       └── contractSnapshots.test.ts.snap
    │   ├── components/
    │   │   ├── ambiguousModal.test.ts
    │   │   ├── discoveryPage.test.ts
    │   │   ├── personDisplay.test.ts
    │   │   └── personDisplayLayout.test.ts
    │   ├── hooks/
    │   │   └── useDiscovery.test.ts
    │   ├── integration/
    │   │   ├── discoveryDetailsFlow.test.ts
    │   │   ├── personSearchFlow.test.ts
    │   │   └── userJourneySmoke.test.ts
    │   ├── lib/
    │   │   └── cache.test.ts
    │   └── services/
    │       ├── ai.test.ts
    │       ├── movieDataValidation.test.ts
    │       ├── personIntent.test.ts
    │       ├── personPresentation.test.ts
    │       ├── suggestInteraction.test.ts
    │       ├── suggestRanking.test.ts
    │       └── tmdbDiscovery.test.ts
    ├── api/
    │   ├── README.md
    │   ├── ai.ts
    │   ├── groq.ts
    │   ├── mistral.ts
    │   ├── omdb.ts
    │   ├── openrouter.ts
    │   ├── query.ts
    │   ├── resolveEntity.ts
    │   ├── suggest.ts
    │   ├── tmdb.ts
    │   ├── tsconfig.json
    │   ├── websearch.ts
    │   ├── _utils/
    │   │   ├── cors.ts
    │   │   ├── http.ts
    │   │   └── observability.ts
    │   └── person/
    │       └── [id].ts
    ├── asset/
    │   └── site.webmanifest
    ├── components/
    │   ├── AmbiguousModal.tsx
    │   ├── ContentCarousel.tsx
    │   ├── DiscoveryPage.tsx
    │   ├── DynamicSearchIsland.tsx
    │   ├── ErrorBanner.tsx
    │   ├── GenrePills.tsx
    │   ├── HeroSpotlight.tsx
    │   ├── icons.tsx
    │   ├── LoadingScreen.tsx
    │   ├── PersonDisplay.tsx
    │   ├── PosterCard.tsx
    │   ├── SimilarCarousel.tsx
    │   ├── SkeletonCard.tsx
    │   ├── TVShowDisplay.tsx
    │   └── VirtualizedList.tsx
    ├── docs/
    │   ├── API.md
    │   ├── ARCHITECTURE.md
    │   ├── CACHING.md
    │   ├── DEPLOYMENT.md
    │   ├── DEVELOPMENT.md
    │   ├── DYNAMIC_SEARCH_ISLAND.md
    │   └── PERFORMANCE.md
    ├── hooks/
    │   ├── useDebounce.ts
    │   ├── useDiscovery.ts
    │   ├── useMovieSearch.ts
    │   ├── useWatchlists.ts
    │   └── watchlistStore.ts
    ├── lib/
    │   ├── cache.ts
    │   └── perfDebug.ts
    ├── scripts/
    │   └── check-no-emoji.js
    ├── services/
    │   ├── ai.ts
    │   ├── aiService.ts
    │   ├── cacheService.ts
    │   ├── groqService.ts
    │   ├── hybridDataService.ts
    │   ├── indexedDBService.ts
    │   ├── mistralService.ts
    │   ├── movieDataValidation.ts
    │   ├── observability.ts
    │   ├── openrouterService.ts
    │   ├── perplexityService.ts
    │   ├── personIntent.ts
    │   ├── personPresentation.ts
    │   ├── queryParser.ts
    │   ├── serpApiService.ts
    │   ├── suggestInteraction.ts
    │   ├── suggestRanking.ts
    │   ├── tmdbService.ts
    │   └── tvmazeService.ts
    ├── styles/
    │   ├── dynamic-search-island.css
    │   └── tv-show.css
    ├── types/
    │   └── react-window.d.ts
    └── .github/
        ├── codeql-config.yml
        ├── dependabot.yml
        └── workflows/
            ├── ci.yml
            └── regenerate-lockfile.yml


Files Content:

================================================
FILE: README.md
================================================
# MovieMonk

MovieMonk is an AI-powered movie and TV discovery experience that helps users go from curiosity to confident watch decisions fast.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview
MovieMonk combines trusted entertainment metadata with high-quality AI explanation.  
It supports both search-first users who know exactly what they want and browse-first users who want to discover what to watch next.

## What You Can Do With MovieMonk
- Discover trending, top-rated, now-playing, and upcoming titles from the landing experience.
- Search movies, series, actors, actresses, and directors with smart ranking and disambiguation.
- Open rich title pages with synopsis, cast/crew context, ratings, and watch options.
- Explore editorial-style person pages with biography, top works, and role-based filmography.
- Move from person profile to movie/show details in one tap.
- Save titles into watchlists and share deep links.

## Core Product Features
- Discovery home with hero spotlight, swipe-friendly carousels, and genre filtering.
- Intent-aware search that understands person-focused queries and role cues.
- Confidence-based resolution that prompts shortlist selection when names are ambiguous.
- TMDB-first data foundation with normalized movie/TV/person payloads.
- AI-enriched summaries layered on factual metadata for better decision support.
- Fast, mobile-optimized UI with loading states and smooth transitions.

## Typical User Flow
1. Start on Discovery and browse what is trending or filter by genre.
2. Open a title to view full details and decide quickly.
3. Search for a person (for example, an actor or director) and review their profile.
4. Tap filmography cards to jump directly into movie/show details.
5. Save promising picks to watchlists and share links with others.

## Why MovieMonk
- Reduces search friction with a true browse + search hybrid.
- Improves result quality for people queries through role-aware ranking.
- Keeps the interface focused, minimal, and content-first on both desktop and mobile.



================================================
FILE: App-Responsive.tsx
================================================
import React, { useCallback, useEffect, useRef, useState, startTransition } from 'react';
import MovieDisplay from './components/MovieDisplay';
import PersonDisplay from './components/PersonDisplay';
import DiscoveryPage from './components/DiscoveryPage';
import ErrorBanner from './components/ErrorBanner';
import AmbiguousModal, { Candidate as AmbiguousCandidate } from './components/AmbiguousModal';
import DynamicSearchIsland from './components/DynamicSearchIsland';
import LoadingScreen from './components/LoadingScreen';
import { MovieData, QueryComplexity, GroundingSource, AIProvider, SuggestionItem } from './types';
import { fetchMovieData, fetchFullPlotDetails } from './services/aiService';
import { ClipboardIcon, EditIcon, FolderIcon, Logo, ShareIcon, TrashIcon, XMarkIcon } from './components/icons';
import { track } from '@vercel/analytics/react';
import { useWatchlists } from './hooks/useWatchlists';
import { VirtualizedList } from './components/VirtualizedList';
import { initPerfDebug, useRenderCounter } from './lib/perfDebug';

const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const WATCHLIST_COLORS = ['#7c3aed', '#db2777', '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7'];
type AppView = 'discovery' | 'movie' | 'person';
const GLOBAL_LOADING_MIN_VISIBLE_MS = 300;

const App: React.FC = () => {
  useRenderCounter('App');
  useEffect(() => {
    initPerfDebug('app-shell');
  }, []);

  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [personData, setPersonData] = useState<any | null>(null);
  const [sources, setSources] = useState<GroundingSource[] | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryModal, setSummaryModal] = useState<{ title: string; short?: string; long?: string } | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentView, setCurrentView] = useState<AppView>('discovery');
  const [globalLoadingVisible, setGlobalLoadingVisible] = useState(false);
  const [shortlistCandidates, setShortlistCandidates] = useState<AmbiguousCandidate[] | null>(null);
  const loadingStartedAtRef = useRef<number | null>(null);
  const loadingHideTimeoutRef = useRef<number | null>(null);
  const { folders: watchlists, addFolder, saveToFolder, findItem, refresh, renameFolder, setFolderColor, moveItem, deleteItem } = useWatchlists();
  const [showWatchlistsModal, setShowWatchlistsModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('#7c3aed');
  const [draggedItem, setDraggedItem] = useState<{ folderId: string; itemId: string } | null>(null);

  const scrollMainContentToTop = useCallback((behavior: ScrollBehavior | 'contextual' = 'contextual') => {
    const main = document.querySelector('.main-content');
    if (main instanceof HTMLElement) {
      let resolvedBehavior: ScrollBehavior;
      if (behavior === 'contextual') {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
        const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        resolvedBehavior = prefersReducedMotion || isMobileViewport || isCoarsePointer ? 'auto' : 'smooth';
      } else {
        resolvedBehavior = behavior;
      }

      main.scrollTo({ top: 0, behavior: resolvedBehavior });
    }
  }, []);

  const handleLoadSavedItem = useCallback((folderId: string, itemId: string) => {
    const found = findItem(folderId, itemId);
    if (!found) return;
    const { item } = found;
    startTransition(() => {
      setMovieData(item.movie);
      setPersonData(null);
      setSources(item.movie.tmdb_id ? [{ web: { uri: `https://www.themoviedb.org/${item.movie.media_type || 'movie'}/${item.movie.tmdb_id}`, title: 'The Movie Database (TMDB)' } }] : null);
      setCurrentQuery(item.saved_title || item.movie.title);
      setCurrentView('movie');
    });
    debugLog('[watchlists] loaded saved item', item.saved_title);
    setShowWatchlistsModal(false);
    scrollMainContentToTop();
  }, [findItem, scrollMainContentToTop]);

  // Load shared link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedQuery = params.get('q');
    const sharedType = params.get('type');

    if (sharedQuery) {
      track('shared_link_opened', { query: sharedQuery, type: sharedType || 'unknown' });
      setCurrentQuery(sharedQuery);

      // Auto-load the shared content
      if (sharedType === 'person') {
        const personId = params.get('id');
        if (personId) {
          loadPersonFromShare(parseInt(personId));
        }
      } else {
        handleSendMessage(sharedQuery, QueryComplexity.SIMPLE, 'groq');
      }
    }
  }, []);

  useEffect(() => {
    if (showWatchlistsModal) {
      refresh();
    }
  }, [showWatchlistsModal, refresh]);

  useEffect(() => {
    if (isLoading) {
      if (loadingHideTimeoutRef.current !== null) {
        window.clearTimeout(loadingHideTimeoutRef.current);
        loadingHideTimeoutRef.current = null;
      }
      loadingStartedAtRef.current = Date.now();
      setGlobalLoadingVisible(true);
      return;
    }

    if (!globalLoadingVisible) {
      return;
    }

    const elapsed = loadingStartedAtRef.current ? Date.now() - loadingStartedAtRef.current : GLOBAL_LOADING_MIN_VISIBLE_MS;
    const remaining = Math.max(0, GLOBAL_LOADING_MIN_VISIBLE_MS - elapsed);

    loadingHideTimeoutRef.current = window.setTimeout(() => {
      setGlobalLoadingVisible(false);
      loadingHideTimeoutRef.current = null;
      loadingStartedAtRef.current = null;
    }, remaining);
  }, [isLoading, globalLoadingVisible]);

  useEffect(() => {
    return () => {
      if (loadingHideTimeoutRef.current !== null) {
        window.clearTimeout(loadingHideTimeoutRef.current);
      }
    };
  }, []);

  const startEditFolder = useCallback((folder: any) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color || '#7c3aed');
  }, []);

  const saveFolderEdits = useCallback(() => {
    if (!editingFolderId) return;
    renameFolder(editingFolderId, editFolderName);
    setFolderColor(editingFolderId, editFolderColor);
    setEditingFolderId(null);
  }, [editingFolderId, editFolderName, editFolderColor, renameFolder, setFolderColor]);

  const handleDragStart = useCallback((e: React.DragEvent, folderId: string, itemId: string) => {
    setDraggedItem({ folderId, itemId });
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.folderId === targetFolderId) {
      setDraggedItem(null);
      return;
    }
    moveItem(draggedItem.folderId, draggedItem.itemId, targetFolderId);
    setDraggedItem(null);
  }, [draggedItem, moveItem]);

  const openPersonById = useCallback(async (
    personId: number,
    titleHint?: string,
    options: { manageLoading?: boolean } = {}
  ) => {
    const manageLoading = options.manageLoading !== false;
    if (manageLoading) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const data = await fetch(`/api/person/${personId}`).then(r => r.json());
      setPersonData(data);
      setMovieData(null);
      setSources(data?.sources || null);
      setCurrentView('person');
      if (titleHint || data?.person?.name) {
        setCurrentQuery(titleHint || data?.person?.name || '');
      }
      scrollMainContentToTop();
    } catch (e) {
      setError('Failed to load person details');
    } finally {
      if (manageLoading) {
        setIsLoading(false);
      }
    }
  }, [scrollMainContentToTop]);

  const loadPersonFromShare = async (personId: number) => {
    await openPersonById(personId, undefined, { manageLoading: true });
  };

  const handleShare = useCallback(async () => {
    let shareUrl = window.location.origin;

    if (movieData) {
      shareUrl += `?q=${encodeURIComponent(movieData.title)}&type=movie&year=${movieData.year}`;
    } else if (personData) {
      const personName = personData?.person?.name || personData?.name || '';
      const personId = personData?.person?.id || personData?.id;
      shareUrl += `?q=${encodeURIComponent(personName)}&type=person&id=${personId}`;
    } else if (currentQuery) {
      shareUrl += `?q=${encodeURIComponent(currentQuery)}`;
    } else {
      return; // Nothing to share
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);

      track('share_link_copied', {
        type: movieData ? 'movie' : personData ? 'person' : 'query',
        title: movieData?.title || personData?.person?.name || personData?.name || currentQuery
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 3000);
      } catch (e) {
        alert(`Share this link: ${shareUrl}`);
      }
      document.body.removeChild(textarea);
    }
  }, [currentQuery, movieData, personData]);

  const handleGoHome = useCallback(() => {
    startTransition(() => {
      setCurrentView('discovery');
      setMovieData(null);
      setPersonData(null);
      setSources(null);
      setCurrentQuery('');
    });
    scrollMainContentToTop();
  }, [scrollMainContentToTop]);

  const handleOpenTitle = useCallback(async (
    item: { id: number; mediaType: 'movie' | 'tv' },
    provider?: AIProvider
  ) => {
    setIsLoading(true);
    setError(null);
    scrollMainContentToTop();

    const activeProvider = provider || selectedProvider || 'groq';
    setSelectedProvider(activeProvider);

    try {
      const detailsRes = await fetch(
        `/api/ai?action=details&id=${item.id}&media_type=${item.mediaType}&provider=${activeProvider}`
      );
      if (!detailsRes.ok) {
        throw new Error('Failed to load title details');
      }

      const detailsData = await detailsRes.json();
      startTransition(() => {
        setMovieData(detailsData);
        setPersonData(null);
        setSources([
          {
            web: {
              uri: `https://www.themoviedb.org/${item.mediaType}/${item.id}`,
              title: 'The Movie Database (TMDB)'
            }
          }
        ]);
        setCurrentView('movie');
        setCurrentQuery(detailsData?.title || '');
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to open title');
    } finally {
      setIsLoading(false);
    }
  }, [scrollMainContentToTop, selectedProvider]);

  const classifyError = (raw: string | undefined, provider: 'groq' | 'mistral'): string => {
    if (!raw) return `Unknown error from ${provider}. Try again or switch provider.`;
    const lower = raw.toLowerCase();
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return `Request to ${provider} timed out. Network was slow or provider overloaded. Retry or switch provider.`;
    }
    if (lower.includes('unauthorized') || lower.includes('auth') || lower.includes('api key')) {
      return `Authorization failed for ${provider}. Check API key configuration in environment settings.`;
    }
    if (lower.includes('safety') || lower.includes('blocked')) {
      return `Query blocked by safety filters (${provider}). Try rephrasing without explicit or sensitive content.`;
    }
    if (lower.includes('limit') || lower.includes('quota')) {
      return `${provider} usage limit reached. Wait a moment or change provider.`;
    }
    if (lower.includes('json') || lower.includes('parse')) {
      return `Response formatting issue from ${provider}. Model returned unexpected structure. Try a simpler phrasing.`;
    }
    return raw;
  };

  const handleSendMessage = useCallback(async (message: string, complexity: QueryComplexity, provider: AIProvider = 'groq') => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(message);

    try {
      debugLog('[search] fetching search results');
      const searchRes = await fetch(`/api/ai?action=search&q=${encodeURIComponent(message)}`);
      const searchData = await searchRes.json();

      if (!searchData.ok || searchData.total === 0) {
        throw new Error('No search results found');
      }

      const selectedResult = searchData.results[0];
      debugLog('[search] using top ranked match', selectedResult.title);

      const modelRes = await fetch(
        `/api/ai?action=selectModel&type=${selectedResult.type}&title=${encodeURIComponent(selectedResult.title)}`
      );
      const modelData = await modelRes.json();
      const selectedModel: AIProvider = (modelData.selectedModel as AIProvider) || provider;
      setSelectedProvider(selectedModel);

      debugLog('[search] selected model', selectedModel);

      const resolveRes = await fetch(`/api/resolveEntity?q=${encodeURIComponent(message)}`);
      if (resolveRes.ok) {
        const resolved = await resolveRes.json();
        if (resolved?.confidence_band === 'shortlist' && Array.isArray(resolved?.shortlisted) && resolved.shortlisted.length > 0) {
          setShortlistCandidates(
            resolved.shortlisted.map((item: any) => ({
              id: item.id,
              title: item.name,
              type: 'person',
              score: item.score || item.confidence || 0,
              confidence: item.confidence,
              popularity: item.popularity,
              image: item.profile_url,
              snippet: item.known_for_titles?.slice?.(0, 3)?.join(' • ') || item.known_for_department || '',
              media_type: 'person',
              role_match: item.role_match,
              known_for_department: item.known_for_department,
              known_for_titles: item.known_for_titles
            }))
          );
          return;
        }

        if (resolved?.confidence_band === 'confident' && resolved?.chosen?.type === 'person' && resolved?.chosen?.id) {
          await openPersonById(Number(resolved.chosen.id), resolved.chosen.name, { manageLoading: false });
          return;
        }
      }

      if (selectedResult.type === 'person') {
        await openPersonById(Number(selectedResult.id), selectedResult.title, { manageLoading: false });
      } else {
        const result = await fetchMovieData(
          message,
          complexity,
          selectedModel
        );

        if (result.movieData) {
          startTransition(() => {
            setMovieData(result.movieData);
            setPersonData(null);
            setSources(result.sources || []);
            setCurrentView('movie');
          });
          scrollMainContentToTop();
        } else {
          throw new Error(result.error || 'Failed to load data');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Search and parse failed';
      setError(errorMsg);
      startTransition(() => {
        setSources(null);
      });
    } finally {
      setIsLoading(false);
    }
  }, [openPersonById, scrollMainContentToTop]);

  const handleQuickSearch = useCallback((title: string) => {
    handleSendMessage(title, QueryComplexity.SIMPLE, 'groq');
  }, [handleSendMessage]);

  const handleBriefMe = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: name, mode: 'detailed' })
      });
      const json = await res.json();
      if (json?.ok) {
        startTransition(() => {
          setSummaryModal({ title: name, short: json?.summary?.summary_short, long: json?.summary?.summary_long });
        });
      } else {
        setError(json?.error || 'Failed to summarize');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to summarize');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSuggestionSelect = useCallback(async (suggestion: SuggestionItem) => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(suggestion.title);

    try {
      if (suggestion.type === 'person') {
        await openPersonById(Number(suggestion.id), suggestion.title, { manageLoading: false });
      } else {
        const mediaType = suggestion.media_type === 'tv' ? 'tv' : 'movie';
        await handleOpenTitle({ id: suggestion.id, mediaType }, selectedProvider);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load selected title';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [handleOpenTitle, openPersonById, selectedProvider]);

  const handleShortlistSelect = useCallback(async (candidate: AmbiguousCandidate) => {
    setShortlistCandidates(null);
    if (candidate.type === 'person') {
      await openPersonById(candidate.id, candidate.title);
      return;
    }

    const mediaType = candidate.media_type === 'tv' ? 'tv' : 'movie';
    await handleOpenTitle({ id: candidate.id, mediaType });
  }, [handleOpenTitle, openPersonById]);

  return (
    <>
      <div className="app-container">
        {/* Header */}
        <header className="app-header flex-shrink-0 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 glass-panel border-b-0 z-50">
          <button type="button" className="flex items-center gap-2.5 sm:gap-3 text-left" onClick={handleGoHome} aria-label="Go to discovery home">
            <Logo className="w-9 h-9 sm:w-10 sm:h-10 text-primary drop-shadow-glow" />
            <h1 className="text-xl sm:text-2xl font-bold text-gradient title-font tracking-tight">MovieMonk</h1>
          </button>
          <div className="header-search-slot col-span-2 sm:col-span-1 order-3 sm:order-none px-0 sm:px-3">
            <DynamicSearchIsland
              onSearch={handleSendMessage}
              onSuggestionSelect={handleSuggestionSelect}
              isLoading={isLoading}
            />
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => setShowWatchlistsModal(true)}
              className="btn-glass flex items-center gap-2"
              aria-label="Open watch later"
            >
              <FolderIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Watchlists</span>
            </button>
            {(movieData || personData) && (
              <button
                onClick={handleShare}
                className="btn-glass flex items-center gap-2"
                aria-label="Share this result"
              >
                <ShareIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </header>

        {/* Copy Toast Notification */}
        {
          showCopyToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] animate-fade-in">
              <div className="bg-brand-primary text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-brand-primary/50">
                <ClipboardIcon className="w-5 h-5" />
                <span className="font-semibold">Link copied to clipboard!</span>
              </div>
            </div>
          )
        }

        {/* Error Banner */}
        {
          error && (
            <div className="flex-shrink-0 px-3 md:px-6 py-2">
              <ErrorBanner message={error} onClose={() => setError(null)} />
            </div>
          )
        }

        {/* Main Content Area - Full width Featured UI */}
        <div className="main-content pb-24">
          {currentView === 'discovery' ? (
            <DiscoveryPage onOpenTitle={(item) => handleOpenTitle(item)} />
          ) : currentView === 'person' && personData ? (
            <PersonDisplay
              data={personData}
              isLoading={isLoading}
              onQuickSearch={handleQuickSearch}
              onBriefMe={handleBriefMe}
              onOpenTitle={(item) => handleOpenTitle(item, selectedProvider)}
            />
          ) : (
            <MovieDisplay
              movie={movieData}
              isLoading={isLoading}
              sources={sources}
              selectedProvider={selectedProvider}
              onFetchFullPlot={fetchFullPlotDetails}
              onQuickSearch={handleQuickSearch}
              watchlists={watchlists}
              onCreateWatchlist={addFolder}
              onSaveToWatchlist={saveToFolder}
            />
          )}
        </div>

      </div >
      {/* Determine loading screen type based on current view and data */}
      {globalLoadingVisible && (
        <LoadingScreen
          visible={globalLoadingVisible}
          type={
            personData ? 'person' : 
            movieData?.tvShow ? 'tv' : 
            'movie'
          }
        />
      )}
      {/* Summary Modal */}
      {
        summaryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-2xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-5 modal-mobile-slide">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Brief: {summaryModal.title}</h3>
                <button onClick={() => setSummaryModal(null)} className="p-2.5 rounded-lg hover:bg-white/10 touch-target" aria-label="Close">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              {summaryModal.short && (
                <div className="mb-3 text-sm text-brand-text-light">{summaryModal.short}</div>
              )}
              {summaryModal.long && (
                <div className="text-sm whitespace-pre-wrap text-brand-text-light max-h-[60vh] overflow-y-auto">{summaryModal.long}</div>
              )}
            </div>
          </div>
        )
      }

      {/* Watchlists Modal */}
      {showWatchlistsModal && (
        <div
          className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowWatchlistsModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 modal-mobile-slide max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-white">Your Watchlists</h3>
              <button onClick={() => setShowWatchlistsModal(false)} className="p-2.5 rounded-lg hover:bg-white/10 touch-target" aria-label="Close watchlists">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {watchlists.length === 0 && (
              <p className="text-brand-text-dark text-sm">No watchlists yet. Save a title with "Save to List" to get started.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1 overscroll-contain content-visibility-auto">
              {watchlists.map(folder => (
                <div
                  key={folder.id}
                  className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2 min-h-[300px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, folder.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }}></span>
                    <p className="text-white font-semibold text-sm">{folder.name}</p>
                    <span className="text-xs text-brand-text-dark ml-auto">{folder.items.length} saved</span>
                    <button onClick={() => startEditFolder(folder)} className="ml-2 text-xs text-brand-text-dark hover:text-white p-1 rounded hover:bg-white/10 inline-flex items-center gap-1 transition-[background-color,color,transform] duration-150 ease-out hover:-translate-y-px transform-gpu">
                      <EditIcon className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {editingFolderId === folder.id && (
                    <div className="space-y-2 p-2 rounded-lg border border-white/10 bg-white/5">
                      <label className="text-xs text-brand-text-light">Folder name</label>
                      <input
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                      <div className="flex items-center gap-2">
                        {WATCHLIST_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditFolderColor(color)}
                            className={`w-6 h-6 rounded-full border ${editFolderColor === color ? 'border-white ring-2 ring-white/80' : 'border-white/20'}`}
                            style={{ backgroundColor: color }}
                            aria-label={`Choose ${color}`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingFolderId(null)} className="px-3 py-1.5 rounded-lg border border-white/15 text-white text-xs hover:bg-white/10 transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-px transform-gpu">Cancel</button>
                        <button onClick={saveFolderEdits} className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-secondary transition-[background-color,transform] duration-150 ease-out hover:-translate-y-px transform-gpu">Save</button>
                      </div>
                    </div>
                  )}

                  {folder.items.length === 0 ? (
                    <p className="text-xs text-brand-text-dark">Empty folder. Drag items here.</p>
                  ) : (
                    <div className="space-y-2">
                      {folder.items.length > 10 ? (
                        <VirtualizedList
                          items={folder.items}
                          itemHeight={90}
                          height={Math.min(420, folder.items.length * 90)}
                          renderItem={(item) => (
                            <div className="px-0.5 py-0.5">
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, folder.id, item.id)}
                                className={`w-full flex items-start justify-between gap-2 p-2 rounded-lg border cursor-move transform-gpu transition-[background-color,border-color,transform,opacity] duration-150 ease-out ${draggedItem?.itemId === item.id
                                  ? 'opacity-50 border-brand-primary bg-brand-primary/10'
                                  : 'border-white/10 hover:border-brand-primary/50 hover:bg-white/5 hover:-translate-y-px'
                                  }`}
                              >
                                <button
                                  onClick={() => handleLoadSavedItem(folder.id, item.id)}
                                  className="flex-1 text-left"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white">{item.saved_title}</span>
                                    <span className="text-xs text-brand-text-dark">{item.movie.year} • {item.movie.genres?.slice(0, 3).join(', ')}</span>
                                  </div>
                                </button>
                                <span className="text-[10px] text-brand-text-dark whitespace-nowrap">Added {new Date(item.added_at).toLocaleDateString()}</span>
                                <button
                                  onClick={() => deleteItem(folder.id, item.id)}
                                  className="ml-2 text-xs text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-500/10 inline-flex items-center justify-center transition-[background-color,color,transform] duration-150 ease-out hover:-translate-y-px transform-gpu"
                                  aria-label="Delete item"
                                  title="Delete from watchlist"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        />
                      ) : (
                        folder.items.map(item => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, folder.id, item.id)}
                            className={`w-full flex items-start justify-between gap-2 p-2 rounded-lg border cursor-move transform-gpu transition-[background-color,border-color,transform,opacity] duration-150 ease-out ${draggedItem?.itemId === item.id
                              ? 'opacity-50 border-brand-primary bg-brand-primary/10'
                              : 'border-white/10 hover:border-brand-primary/50 hover:bg-white/5 hover:-translate-y-px'
                              }`}
                          >
                            <button
                              onClick={() => handleLoadSavedItem(folder.id, item.id)}
                              className="flex-1 text-left"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">{item.saved_title}</span>
                                <span className="text-xs text-brand-text-dark">{item.movie.year} • {item.movie.genres?.slice(0, 3).join(', ')}</span>
                              </div>
                            </button>
                            <span className="text-[10px] text-brand-text-dark whitespace-nowrap">Added {new Date(item.added_at).toLocaleDateString()}</span>
                            <button
                              onClick={() => deleteItem(folder.id, item.id)}
                              className="ml-2 text-xs text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-500/10 inline-flex items-center justify-center transition-[background-color,color,transform] duration-150 ease-out hover:-translate-y-px transform-gpu"
                              aria-label="Delete item"
                              title="Delete from watchlist"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {shortlistCandidates && shortlistCandidates.length > 0 && (
        <AmbiguousModal
          mode="person-shortlist"
          candidates={shortlistCandidates}
          onSelect={handleShortlistSelect}
          onClose={() => setShortlistCandidates(null)}
        />
      )}

    </>
  );
};

export default App;



================================================
FILE: constants.ts
================================================
// Schema guidance for AI providers (Groq, Mistral, OpenRouter)
export const MOVIE_DATA_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'The official title of the movie/show.' },
    year: { type: 'string', description: 'The release year.' },
    type: { type: 'string', description: "The type of content (e.g., 'movie', 'show')." },
    genres: {
      type: 'array',
      items: { type: 'string' },
      description: 'A list of genres.'
    },
    poster_url: { type: 'string', description: 'URL to a high-quality poster image.' },
    backdrop_url: { type: 'string', description: 'URL to a high-quality backdrop image.' },
    trailer_url: { type: 'string', description: 'YouTube trailer URL or empty string.' },
    ratings: {
      type: 'array',
      description: 'Ratings like IMDb, Rotten Tomatoes.',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          score: { type: 'string' }
        },
        required: ['source', 'score']
      }
    },
    cast: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          known_for: { type: 'string' }
        },
        required: ['name', 'role', 'known_for']
      }
    },
    crew: {
      type: 'object',
      properties: {
        director: { type: 'string' },
        writer: { type: 'string' },
        music: { type: 'string' }
      },
      required: ['director', 'writer', 'music']
    },
    summary_short: { type: 'string' },
    summary_medium: { type: 'string' },
    summary_long_spoilers: { type: 'string' },
    suspense_breaker: { type: 'string' },
    where_to_watch: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          link: { type: 'string' },
          type: { type: 'string' }
        },
        required: ['platform', 'link', 'type']
      }
    },
    extra_images: {
      type: 'array',
      items: { type: 'string' }
    },
    ai_notes: { type: 'string' }
  },
  required: ['title','year','type','genres','poster_url','backdrop_url','cast','crew','summary_short','summary_medium','summary_long_spoilers','suspense_breaker','where_to_watch','extra_images','ai_notes','trailer_url','ratings']
};

// Concise prompt - AI provides CREATIVE content only (summaries, trivia, suspense breakers)
// Factual data (cast, crew, ratings, release dates) comes from TMDB
export const INITIAL_PROMPT = `You are MovieMonk. You receive factual movie/show data from databases (TMDB/IMDB). Your role is to provide creative, engaging content.

You will receive partial data with these fields already filled by TMDB:
- title, year, type, genres, cast, crew, ratings, poster_url, backdrop_url, trailer_url, where_to_watch, extra_images

Your job: Fill ONLY these creative fields:
- summary_short: 150-200 chars, spoiler-free, engaging hook
- summary_medium: 400-500 chars, spoiler-free plot overview
- summary_long_spoilers: 1000+ chars, FULL detailed plot with ALL spoilers, start with "SPOILER WARNING — Full plot explained below."
- suspense_breaker: ONE sentence revealing the main twist/ending
- ai_notes: Markdown-formatted trivia, memorable quotes, themes, similar recommendations (3-5 bullet points)

Rules:
- DO NOT change any existing factual fields (title, year, cast, crew, ratings, etc.)
- If a factual field is empty, leave it empty (do NOT hallucinate data)
- Be engaging and insightful in your creative content
- summary_long_spoilers must reveal EVERYTHING about the plot
- ai_notes should be fun trivia, not just Wikipedia facts

Return the COMPLETE JSON object with all fields (factual + creative).`;

export const CREATIVE_ONLY_PROMPT = `You are MovieMonk AI. Provide creative summaries and trivia for this movie/show.

Generate ONLY these fields:
- summary_short: 150-200 chars, spoiler-free hook
- summary_medium: 400-500 chars, spoiler-free plot
- summary_long_spoilers: Full detailed plot with ALL spoilers (start with "SPOILER WARNING")
- suspense_breaker: One sentence revealing the twist/ending
- ai_notes: Markdown trivia, quotes, themes, similar titles (3-5 bullets)

Return as JSON:
{
  "summary_short": "...",
  "summary_medium": "...",
  "summary_long_spoilers": "SPOILER WARNING — ...",
  "suspense_breaker": "...",
  "ai_notes": "..."
}

Be creative and insightful!`;


================================================
FILE: CONTRIBUTING.md
================================================
# Contributing to MovieMonk

Thanks for helping improve the project! Please follow the steps below to keep changes smooth and reviewable.

## How to contribute
1. **Fork and branch**: create a feature branch from `main` (e.g., `feature/search-copy-update` or `fix/cache-key`).
2. **Set up locally**: install dependencies (`npm install`) and configure `.env.local` with the required API keys.
3. **Make focused changes**: keep PRs small and scoped to one concern.
4. **Validate**:
   - Tests: `npm test -- --runInBand`
   - Type check: `npm run lint`
   - Build: `npm run build`
5. **Submit a PR**: describe the change, risks, and any configuration updates. Include screenshots when UI changes are visible.

## Coding expectations
- Keep TypeScript types up to date and prefer typed helpers over `any`.
- Preserve shared utilities in `api/_utils` (CORS, observability, error helpers) when touching API routes.
- Avoid committing secrets or `.env` files; environment variables belong in deployment settings.

## Reporting issues
Open an issue with a clear description, steps to reproduce, and expected vs. actual behavior. For security concerns, follow `SECURITY.md`.



================================================
FILE: index.html
================================================
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="/asset/favicon.ico" />
  <link rel="icon" type="image/png" sizes="16x16" href="/asset/favicon-16x16.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/asset/favicon-32x32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/asset/apple-touch-icon.png" />
  <link rel="manifest" href="/asset/site.webmanifest" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Discover trending movies and TV shows, then dive deeper with MovieMonk's AI-assisted details." />
  <title>MovieMonk | Discover Movies & TV</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
          colors: {
            'brand-bg': '#121212',
            'brand-surface': '#1e1e1e',
            'brand-primary': '#6a44ff',
            'brand-secondary': '#a855f7',
            'brand-accent': '#f472b6',
            'brand-text-light': '#e5e7eb',
            'brand-text-dark': '#9ca3af',
          },
          animation: {
            'fade-in': 'fadeIn 0.5s ease-in-out',
            'slide-up': 'slideUp 0.5s ease-in-out',
            'spin': 'spin 1s linear infinite',
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
            slideUp: {
              '0%': { transform: 'translateY(20px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 },
            },
            spin: {
              'from': { transform: 'rotate(0deg)' },
              'to': { transform: 'rotate(360deg)' },
            },
          }
        }
      }
    }
  </script>
  <style>
    /* Custom Scrollbar for a cleaner look */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(30, 30, 30, 0.5);
    }

    ::-webkit-scrollbar-thumb {
      background: #4a4a4a;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #6a44ff;
    }

    /* Smooth mobile scrolling for chat interface */
    .chat-scroll {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      touch-action: auto;
    }
  </style>
</head>

<body class="bg-brand-bg text-brand-text-light font-sans">
  <div id="root"></div>
  <div id="modal-root"></div>
  <script type="module" src="/index.tsx"></script>
</body>

</html>



================================================
FILE: index.tsx
================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './styles/modern.css';
import './styles/dynamic-search-island.css';
import App from './App-Responsive';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    {/* Only track in production to keep dev data clean */}
    {import.meta.env.PROD && <Analytics />}
    {import.meta.env.PROD && <SpeedInsights />}
  </React.StrictMode>
);



================================================
FILE: jest.config.js
================================================
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  moduleNameMapper: {
    '^../lib/(.*)$': '<rootDir>/lib/$1',
    '^../services/(.*)$': '<rootDir>/services/$1'
  },
  clearMocks: true
};



================================================
FILE: LICENSE
================================================
MIT License

Copyright (c) 2025 Aravind Lal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



================================================
FILE: metadata.json
================================================
{
  "name": "MovieMonk",
  "description": "An AI-powered movie and series search engine. MovieMonk provides verified details, real-time where-to-watch links, cast and crew information, and AI-generated summaries with both spoiler-safe and spoiler-full explanations. Users can ask anything — plot breakdowns, character arcs, ending clarifications, franchise info — and get fast, grounded responses using Groq (Llama 3.3) and Mistral AI. Perfect for entertainment lovers wanting deeper insights into their favorite titles.",
  "requestFramePermissions": []
}


================================================
FILE: package.json
================================================
{
  "name": "moviemonk",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "lint": "tsc --noEmit",
    "check:no-emoji": "node ./scripts/check-no-emoji.js",
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "security-check": "npm audit && npm run lint && npm run build"
  },
  "dependencies": {
    "@google/genai": "^1.46.0",
    "@vercel/analytics": "^2.0.1",
    "@vercel/kv": "^3.0.0",
    "@vercel/speed-insights": "^2.0.0",
    "fuse.js": "^7.1.0",
    "lucide-react": "^1.6.0",
    "react": "^19.2.1",
    "react-dom": "^19.2.4",
    "react-window": "^2.2.7",
    "redis": "^5.11.0"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/node": "^25.5.0",
    "@types/react-window": "^1.8.8",
    "@vercel/node": "^5.6.21",
    "@vitejs/plugin-react": "^5.1.4",
    "jest": "^30.3.0",
    "node-mocks-http": "^1.14.1",
    "ts-jest": "^29.4.6",
    "typescript": "~5.9.3",
    "vite": "^7.3.1"
  },
  "engines": {
    "node": ">=20.x"
  }
}



================================================
FILE: SECURITY.md
================================================
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in MovieMonk, please **do not** open a public GitHub issue. Instead, please follow these steps:

### Report Process

1. **Email us directly** at your organization's security contact (or open a private security advisory on GitHub)
2. **Include the following information:**
   - Description of the vulnerability
   - Steps to reproduce (if possible)
   - Potential impact
   - Suggested fix (if you have one)

3. **Wait for confirmation** before making any public disclosures

### Response Timeline

- **Acknowledgment:** Within 24 hours
- **Assessment:** Within 48 hours
- **Fix & Patch:** Within 1-2 weeks (depending on severity)
- **Release:** Public disclosure after fix is deployed

## Supported Versions

We follow semantic versioning and support:
- Latest major version (`main` branch) - **Full support**
- Previous major version - **Security patches only**
- Older versions - **No support**

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**
   - Run `npm audit` regularly
   - Enable Dependabot in your fork
   - Update to latest version when patches are released

2. **Environment Variables**
   - Store API keys in `.env.local` (never commit)
   - Use Vercel environment variables for production
   - Never log sensitive data

3. **CORS & API Security**
   - All external API requests go through Vercel serverless functions
   - API keys are server-side only
   - Share links are URL-safe encoded

### For Contributors

1. **Code Review**
   - All PRs require review before merge
   - Security-sensitive changes require additional scrutiny

2. **Dependency Management**
   - Use `npm audit` before committing
   - Run `npm run security-check` before PRs
   - Keep dependencies up-to-date

3. **Data Handling**
   - Never store user data without consent
   - Use secure headers (CSP, HSTS, etc.)
   - Sanitize user inputs

## Known Security Controls

### Client-Side

- **Content Security Policy (CSP)** - Prevents XSS attacks
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **Referrer-Policy** - Limits referrer information leakage

### Server-Side

- **HTTPS/TLS** - All communication encrypted
- **No Server Components** - Client-side React only, no SSR vulnerabilities
- **API Key Isolation** - Keys stored as environment variables
- **Rate Limiting** - Implemented via Vercel/API providers

## Dependency Security

### Current Status (Updated: December 2024)

- ✅ React: ^19.2.1 (patched for CVE-2025-55182)
- ✅ React-DOM: ^19.2.1 (patched)
- ✅ All production dependencies audited
- ✅ Dependabot enabled for automated checks

### Audit Process

Run the security check before each release:

```bash
npm run security-check  # runs audit + lint + build
```

## Security Features

### URL Sharing

- Links are URL-encoded (safe)
- No sensitive data in query params
- Links expire on logout (cache only)

### Data Handling

- No user database (stateless)
- Search history in localStorage only (user's device)
- API responses cached securely
- No third-party tracking (except Vercel Analytics)

### API Integrations

- TMDB, OMDB, Groq, Mistral, etc. are called server-side via Vercel functions
- API keys never exposed to client
- Requests authenticated server-side only

## Compliance

- ✅ OWASP Top 10 hardened
- ✅ CSP Level 3 compliant
- ✅ HSTS preload ready
- ✅ No mixed-content
- ✅ Secure cookie handling

## Questions?

For security questions or concerns, contact: [your security contact]

For vulnerability reports: Use the process above.

---

**Last Updated:** December 4, 2025  
**Version:** 1.0.0  
**Maintainer:** MovieMonk Security Team



================================================
FILE: SKILL.md
================================================
---
name: moviemonk-ux-build-safety
description: "Full build and safety test workflow for MovieMonk UX/Component changes. Validates that UI modifications maintain type safety, component consistency, responsive behavior, and test coverage before deployment. Runs linting, unit tests, integration tests, and regression checks with automated validation of component consistency patterns. WHEN: after making UI component changes, before deploying UX improvements, validating movie/show/person display consistency, ensuring responsive behavior is preserved, testing ambiguity modal or hero metadata changes."
license: MIT
metadata:
  author: Aravind Lal
  version: "1.0.0"
  project: moviemonk-ai
---

# MovieMonk UX Build & Safety Test

> **AUTHORITATIVE WORKFLOW — MANDATORY FOR DEPLOYMENT**
>
> This skill ensures all UI/UX changes are production-ready by validating type safety, component consistency, test coverage, and responsive behavior. **MUST** be completed before merging to `main` branch.

## Triggers

Activate this skill when you want to:
- Validate UX changes across movie/show/person display components
- Ensure component consistency patterns (metadata formatting, spacing, affordances)
- Verify TypeScript types match component implementations
- Test responsive behavior (mobile and desktop viewports)
- Validate that schema changes propagate correctly through the data pipeline (types → services → components)
- Run comprehensive regression testing before deployment
- Check for breaking changes to existing UI behavior

> **Scope**: This skill orchestrates validation of UI/component changes. It does NOT create new components or features — it validates existing changes for safety and consistency.

## Prerequisites

- All target component files edited and saved
- `.env.local` configured with valid `GEMINI_API_KEY` (for local testing)
- No uncommitted changes in unrelated files (clean git state recommended)
- Node modules installed (`npm install` completed)

## Rules

1. **Sequential Validation** — Run steps in order; don't skip stages
2. **Test Isolation** — Run linting first, then unit tests per component, then integration tests
3. **Type Safety First** — Fix TypeScript errors before running tests
4. **100% Pass Rate** — All tests must pass; no known failures allowed
5. **Responsive Coverage** — Test affects both mobile and desktop breakpoints
6. **Component Consistency** — Validate that related components (Movie/TV/Person display) use matching patterns
7. **Zero Regressions** — Integration tests must verify story flows unchanged

---

## Steps

| # | Stage | Action | Validation |
|---|-------|--------|-----------|
| 1 | **Type Check** | `npm run lint` | No TypeScript errors, all imports valid |
| 2 | **Unit Tests** | `npm test -- __tests__/components/` (affected components) | 100% pass (affected files only) |
| 3 | **Integration Tests** | `npm test -- __tests__/integration/userJourneySmoke.test.ts` | 100% pass (user stories intact) |
| 4 | **Consistency Audit** | Visual inspection of component pattern alignment | [Component Consistency Checklist](#component-consistency-checklist) |
| 5 | **Responsive Verify** | Dev tools: test mobile and desktop viewports | Spacing, affordances, scroll behavior consistent |
| 6 | **Edge Cases** | Manual testing of boundary conditions | Empty states, long text, slow networks |
| 7 | **Report & Approve** | Summarize all validation results | All stages passed, ready for merge |

---

## STAGE 1: Type Check

**Command:**
```bash
npm run lint
```

**Expected Output:**
```
✓ No errors found
✓ All files pass TypeScript checks
```

**Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| `Property 'language' does not exist on type 'MovieData'` | Schema mismatch between types.ts and component | Update types.ts first, then constants.ts INITIAL_PROMPT schema, then components |
| `Cannot find module '@/types'` | Import path incorrect | Verify file exists at path and tsconfig paths are correct |
| `Expected value of type 'string \| undefined' but got 'string'` | Optional field treated as required | Add `?:` to type definition or use optional chaining `?.` in component |
| `Unused variable 'tempVar'` | Dead code from refactoring | Remove variable if not needed, or prefix with `_` if intentional |

**Remediation:** Fix all errors before proceeding to Stage 2. If errors are in unrelated files, they must be resolved first.

---

## STAGE 2: Unit Tests (Component-Specific)

**Target:** Run tests for affected components only to isolate changes

**Command by component type:**
```bash
# Movie/Show display changes
npm test -- __tests__/components/movieDisplay.test.ts
npm test -- __tests__/components/tvShowDisplay.test.ts

# Person display / shortlist changes  
npm test -- __tests__/components/personDisplay.test.ts
npm test -- __tests__/components/ambiguousModal.test.ts

# All component tests (comprehensive)
npm test -- __tests__/components/
```

**Expected Output for each test file:**
```
PASS  __tests__/components/ambiguousModal.test.ts
  AmbiguousModal
    ✓ renders default mode with generic search title (41 ms)
    ✓ renders person-shortlist mode with role cues (4 ms)

Test Suites: 1 passed, 1 total
Tests: 2 passed, 2 total
```

**Common Failures & Fixes:**

| Test | Failure | Root Cause | Fix |
|------|---------|-----------|-----|
| `renders with language field` | Field undefined in output | Language not extracted from TMDB service | Update tmdbService.ts fetchDetails() to extract from `spoken_languages[0].english_name` |
| `metadata uses bullet format` | Expects ` • ` separator, got other text | Component not using `join(' \u2022 ')` | Update component to apply required format: `metadataParts.join(' \u2022 ')` |
| `desktop spacing applied on sm:` | Tailwind class not rendering | Breakpoint not included in template | Verify `sm:px-7 sm:py-5` is in className string, not in conditional |
| `scroll affordance visible on overflow` | Gradient not rendering | Scroll height not constrained or gradient condition wrong | Verify modal has fixed height (h-[92vh]), check canScrollDown state logic |

**Stage 2 Complete When:** All affected component tests pass at 100%

---

## STAGE 3: Integration Tests (Story Validation)

**Command:**
```bash
npm test -- __tests__/integration/userJourneySmoke.test.ts
```

**Expected Output:**
```
PASS  __tests__/integration/userJourneySmoke.test.ts
  User Journey Smoke Tests
    ✓ discovery page loads with hero metadata (120 ms)
    ✓ search results render and filter correctly (85 ms)
    ✓ modal selection resolves to detail view (200 ms)

Test Suites: 1 passed, 1 total
Tests: 3 passed, 3 total
```

**What This Validates:**
- End-to-end user flows unbroken (search → ambiguity → detail)
- Hero metadata visible and formatted correctly
- Modal filtering and selection work
- Detail display renders all sections (overview, cast, similar, etc.)
- No console errors during flow

**If Test Fails:**
1. Check test output for which step broke (e.g., "renders movie detail on selection")
2. Verify component that changed is related to that step
3. Look for console errors in test output
4. May need to update test snapshot or expectations if UI intentionally changed

**Stage 3 Complete When:** 100% of user journey tests pass, no skipped tests

---

## STAGE 4: Consistency Audit

**Component Consistency Checklist:**

### Metadata Format Consistency
- [ ] All detail headers use format: `Year • Type • Language` (e.g., "2014 • Movie • Japanese")
- [ ] For TV: `Year • Type • Language` (e.g., "2024 • TV Series • English")
- [ ] For Person: `Birthday • Location • Department` (e.g., "1970-01-15 • Los Angeles • Acting")
- [ ] Verify bullets use `' \u2022 '` separator (not dash, comma, or other character)
- [ ] Check that genre does NOT appear in hero metadata line (should be in chips row below)

### Field Presence Across Components
Run this search across codebase:
```bash
grep -r "formatDisplayLanguage\|LANGUAGE_NAME_BY_CODE" src/components/
```

Expected: MovieDisplay.tsx and TVShowDisplay.tsx both have these; PersonDisplay does not (person doesn't have language field)

### Responsive Spacing Validation
- [ ] Desktop breakpoint: `sm:px-7 sm:py-5` applied to card rows (ambiguous modal shortlist)
- [ ] Mobile: Default `px-4 py-3` preserved for small screens
- [ ] Thumbnail sizes: `sm:w-24 sm:h-32` for person avatars on desktop
- [ ] No hardcoded pixels; all spacing uses Tailwind utilities

### Scroll Behavior Validation
- [ ] Modal has fixed height: `h-[92vh] max-h-[92vh]` mobile, `h-[86vh] max-h-[86vh]` desktop
- [ ] Outer dialog locked to `overflow-hidden` (prevents competing scroll)
- [ ] Inner results list set to `overflow-y-auto` (exclusive scroll target)
- [ ] Top/bottom gradient affordances render when overflow exists
- [ ] "Scroll for more" hint visible on first render, hides after first scroll

### No Regressions in Related Sections
- [ ] Movie/Show detail pages still render full content (plot, cast, media gallery)
- [ ] Person detail page shows biography and filmography
- [ ] Search results still filterable by all tabs (Movies, Shows, People)
- [ ] Keyboard shortcuts still functional (if applicable)

**Audit Complete When:** All checkboxes validated via code inspection or manual testing

---

## STAGE 5: Responsive Verification

**Test on both viewports:**

### Desktop (sm: breakpoint, 768px+)
```bash
# Command to start dev server in separate terminal
npm run dev
```
1. Open http://localhost:3000 in browser
2. Open DevTools (F12) → Device Toolbar → Select "Desktop" or iPad Pro
3. Trigger search to show ambiguous modal (e.g., search "Avatar")
4. **Verify:**
   - [ ] Modal is horizontally centered with padding
   - [ ] Metadata shows with bullet separators (Year • Type • Language)
   - [ ] Person shortlist cards have increased padding (sm:px-7 sm:py-5)
   - [ ] Thumbnails are larger on desktop (sm:w-24 sm:h-32)
   - [ ] Scroll affordance gradients visible when content overflows
   - [ ] No horizontal scrollbars appear

### Mobile (default viewport, <640px)
1. In DevTools → Device Toolbar → Select "iPhone 12" or "Pixel 5"
2. Trigger same search flow
3. **Verify:**
   - [ ] Modal fills viewport (bottom sheet style on mobile, h-[92vh])
   - [ ] No padding override breaks mobile layout
   - [ ] Scroll affordances still visible
   - [ ] "Scroll for more" hint readable
   - [ ] Cards fit without horizontal overflow

**Responsive Complete When:** All checks pass on both mobile and desktop

---

## STAGE 6: Edge Cases

**Manual testing scenarios:**

| Scenario | Steps | Expected Outcome |
|----------|-------|------------------|
| Long title | Search for very long movie/show title | Metadata text wraps properly, doesn't break layout |
| Missing language | Search movie with no spoken_languages data in TMDB | Language field empty or shows "Unknown", doesn't crash |
| Many results | Search term with 50+ results | Scroll works smoothly, affordances update, no performance lag |
| Fast scroll to top | Scroll down 10+ items, then scroll to top immediately | "Scroll for more" hint doesn't reappear (shows once per render) |
| No results | Search for gibberish term | Error state displays cleanly, no console errors |
| Slow network | Browser DevTools → Network → Throttle to "Slow 3G" | Data loads incrementally, affordances responsive |

**Edge Cases Complete When:** No unexpected behavior or console errors observed

---

## STAGE 7: Report & Approve

**Generate validation summary:**

```markdown
## MovieMonk UX Build & Safety Test Report

**Date:** [YYYY-MM-DD HH:MM]
**Branch:** improvements/general-ux-polish
**Components Changed:** [list files]

### Validation Results

| Stage | Status | Evidence |
|-------|--------|----------|
| Type Check (npm run lint) | ✅ PASS | 0 errors, 0 warnings |
| Unit Tests | ✅ PASS | 12/12 tests passed |
| Integration Tests | ✅ PASS | 3/3 user journey tests passed |
| Consistency Audit | ✅ PASS | All 8 checkboxes verified |
| Responsive (Desktop) | ✅ PASS | Verified on 1920x1080 viewport |
| Responsive (Mobile) | ✅ PASS | Verified on 375x812 viewport |
| Edge Cases | ✅ PASS | 5/5 scenarios tested |

### Summary

All validation stages passed. The following UX improvements are production-ready:
- Language field now displays in hero metadata (movie/TV)
- Metadata standardized across all detail views (Year • Type • Language)
- Desktop spacing enhanced (increased padding, row height, thumbnails)
- Scroll affordance cues implemented (gradients + hint)
- Modal footer removed; desktop scroll restored

### Approval

✅ **READY FOR MERGE TO MAIN**

Recommendation: Merge to main branch for production deployment.
```

**Report Complete When:** All stages documented with pass/fail evidence

---

## Common Patterns in MovieMonk

### Adding a New Field to MovieData

When adding a field (e.g., `language`), follow this sequence:

1. **types.ts** — Add field to interface:
   ```typescript
   export interface MovieData {
     // ... existing fields
     language?: string;  // Add optional field
   }
   ```

2. **constants.ts** — Update schema AND prompt:
   ```typescript
   export const MOVIE_DATA_SCHEMA = `{
     // ... existing schema
     "language": "string (e.g., 'Japanese', 'Korean')",
   }`;
   
   export const INITIAL_PROMPT = `...
     Include language field extracted from...
   `;
   ```

3. **services/tmdbService.ts** — Extract from API:
   ```typescript
   language: details.spoken_languages[0]?.english_name || details.original_language
   ```

4. **components/MovieDisplay.tsx** — Render with formatting:
   ```typescript
   const formatDisplayLanguage = (code: string) => {
     const LANGUAGE_NAME_BY_CODE = { ja: 'Japanese', ko: 'Korean', ... };
     return LANGUAGE_NAME_BY_CODE[code] || code;
   };
   ```

5. **All Related Components** — Apply same format (TVShowDisplay, PersonDisplay, etc.)

6. **Run Full Validation** — Execute this skill's complete workflow

### Standardizing Metadata Format Across Components

Target pattern: `Year • Type • Language` (bullets with `' \u2022 '` separator)

1. **Update each detail component:**
   ```typescript
   const metadataParts = [
     movieData.releaseYear,
     movieData.type, // "Movie" or "TV Series"
     formatDisplayLanguage(movieData.language)
   ].filter(Boolean);
   
   const metadata = metadataParts.join(' \u2022 ');
   ```

2. **Remove** genre, director, or other fields from hero line (move to chips/sections below)

3. **Test** that metadata appears identically formatted across Movie/TV/Person detail views

4. **Run Stage 2-3** to verify consistency is tested

### Improving Desktop Spacing

Use Tailwind's `sm:` breakpoint (768px+):

```tsx
<div className="px-4 py-3 sm:px-7 sm:py-5">
  {/* mobile: 16px horizontal, 12px vertical */}
  {/* desktop: 28px horizontal, 20px vertical */}
</div>
```

Verify with Stage 5 responsive testing.

---

## Troubleshooting

### Lint Errors After Changes

**Error:** `Property 'X' does not exist on type 'MovieData'`

**Root Causes:**
- Field added to component but not to types.ts interface
- Field added to types.ts but not exported
- Import path to types incorrect in component

**Fix:**
1. Verify types.ts has the field defined
2. Check component imports: `import { MovieData } from '@/types'` (adjust path as needed)
3. Run `npm run lint -- --fix` to auto-fix fixable issues

---

### Test Snapshots Out of Date

**Error:** `Snapshot does not match` or `1 snapshot outdated`

**Root Cause:** Component output changed intentionally (e.g., metadata format), test snapshot needs update

**Fix:**
```bash
npm test -- -u  # Update all snapshots
# OR
npm test -- __tests__/components/ambiguousModal.test.ts -u  # Update specific test
```

**⚠️ Review snapshot diff:** Before committing snapshot updates, inspect the diff to ensure changes are intentional (not bugs).

---

### Tests Pass But Console Errors Appear

**Symptom:** Tests pass, but chrome/browser console shows error about missing field

**Root Cause:** Service not extracting field, component accessing undefined path without null-check

**Fix:**
1. Check service (e.g., tmdbService.ts) to verify field extraction logic
2. Add fallback in component: `movieData.language || ''`
3. Update test mock to include the field with test data
4. Re-run tests to verify console errors gone

---

### Desktop Scrolling Still Broken

**Symptom:** Modal scrolls on mobile but not desktop

**Root Causes:**
- Outer dialog not locked to `overflow-hidden`
- Modal height not constrained (height auto, not fixed vh)
- Results list doesn't have explicit scroll container

**Fix:**
1. Verify modal outer div: `overflow-hidden` (not `overflow-y-auto`)
2. Verify modal container: `h-[86vh] max-h-[86vh]` on sm: breakpoint
3. Verify results list: `overflow-y-auto h-full` to take remaining height
4. Disable any scroll-on-parent logic (e.g., prevent wheel bubbling)

Re-test Stage 5 after fixes.

---

## References

- **MovieDisplay.tsx** — Movie hero + detail rendering
- **TVShowDisplay.tsx** — TV series metadata + cast + similar
- **PersonDisplay.tsx** — Person bio + filmography
- **AmbiguousModal.tsx** — Search result shortlist + modal scroll UX
- **types.ts** — MovieData interface (source of truth for shape)
- **constants.ts** — INITIAL_PROMPT + MOVIE_DATA_SCHEMA (AI instruction + validation)
- **services/tmdbService.ts** — TMDB API extraction + normalization

---

## Checklist for Merge

Before opening a PR or merging to main, verify:

- [ ] Stage 1 (Lint): `npm run lint` passes with 0 errors
- [ ] Stage 2 (Unit): All affected component tests pass (100%)
- [ ] Stage 3 (Integration): User journey smoke tests pass (3/3)
- [ ] Stage 4 (Consistency): Component patterns aligned (checklist above)
- [ ] Stage 5 (Responsive): Desktop and mobile viewports tested
- [ ] Stage 6 (Edge Cases): No regressions in edge scenarios
- [ ] Stage 7 (Report): Validation report generated and reviewed
- [ ] No console errors in browser during manual testing
- [ ] Git commit message references ticket/issue if applicable
- [ ] Latest changes from main branch are pulled (no conflicts)

**Ready to merge when:** All checkboxes checked and no remediations pending.




================================================
FILE: tsconfig.json
================================================
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "types": [
      "node",
      "jest"
    ],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}


================================================
FILE: types.ts
================================================

export interface CastMember {
  name: string;
  role: string;
  known_for: string;
}

export interface Crew {
  director: string;
  writer: string;
  music: string;
}

export interface WatchOption {
  platform: string;
  link: string;
  type: 'subscription' | 'rent' | 'free' | 'buy';
}

export interface DiscoveryItem {
  id: number;
  tmdb_id: string;
  media_type: 'movie' | 'tv';
  title: string;
  year: string;
  overview: string;
  poster_url: string;
  backdrop_url: string;
  rating: number | null;
  genre_ids: number[];
}

export interface DiscoveryGenre {
  id: number;
  name: string;
}

export type PersonRoleBucket = 'all' | 'acting' | 'directing' | 'other';

export interface PersonIntent {
  raw_query: string;
  normalized_query: string;
  stripped_query: string;
  tokens: string[];
  year?: string;
  requested_role: 'any' | 'actor' | 'actress' | 'director';
  is_person_focused: boolean;
}

export interface PersonCredit {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year?: number;
  role: string;
  role_bucket: PersonRoleBucket;
  character?: string;
  job?: string;
  department?: string;
  popularity?: number;
  poster_url?: string;
}

export interface PersonSearchCandidate {
  id: number;
  name: string;
  type: 'person';
  score: number;
  confidence: number;
  popularity?: number;
  role_match?: 'match' | 'mismatch' | 'neutral';
  known_for_department?: string;
  known_for_titles?: string[];
  profile_url?: string;
}

export interface PersonProfile {
  person: {
    id: number;
    name: string;
    biography?: string;
    birthday?: string;
    place_of_birth?: string;
    profile_url?: string;
    known_for_department?: string;
  };
  top_work: PersonCredit[];
  credits_all: PersonCredit[];
  credits_acting: PersonCredit[];
  credits_directing: PersonCredit[];
  credits_other: PersonCredit[];
  role_distribution: {
    acting: number;
    directing: number;
    other: number;
  };
  career_span: {
    start_year?: number;
    end_year?: number;
    active_years?: number;
  };
  known_for_tags: string[];
}

// Related content types for Similar/People Also Search
export type RelatedTitle = {
  id: number;
  title: string;
  year?: string;
  media_type: 'movie' | 'tv';
  poster_url?: string;
  popularity?: number;
  source: 'tmdb-similar' | 'tmdb-recommendations' | 'serpapi';
};

export type RelatedPerson = {
  id: number;
  name: string;
  known_for?: string;
  profile_url?: string;
  popularity?: number;
  source: 'tmdb-co-star' | 'tmdb-similar' | 'serpapi';
};

export interface Rating {
  source: 'Rotten Tomatoes' | 'IMDb' | string;
  score: string;
}

// TV Show specific types
export interface TVShowSeason {
  number: number;
  name: string;
  episodeCount: number;
  premiereDate: string | null;
  endDate: string | null;
  image: string | null;
  summary: string | null;
}

export interface TVShowEpisode {
  id: number;
  season: number;
  episode: number;
  name: string;
  airdate: string;
  runtime: number | null;
  rating: number | null;
  image: string | null;
  summary: string | null;
}

export interface TVShowData {
  status: string; // "Running", "Ended", "In Development"
  premiered: string | null;
  ended: string | null;
  totalSeasons: number;
  totalEpisodes: number;
  network: string;
  language: string;
  officialSite: string | null;
  seasons: TVShowSeason[];
  episodes: TVShowEpisode[];
}

export interface MovieData {
  tmdb_id?: string;
  title: string;
  year: string;
  language?: string;
  type: 'movie' | 'show' | 'song' | 'franchise';
  media_type?: string;
  genres: string[];
  poster_url: string;
  backdrop_url: string;
  trailer_url: string; // Added trailer URL
  ratings: Rating[]; // Added ratings
  cast: CastMember[];
  crew: Crew;
  summary_short: string;
  summary_medium: string;
  summary_long_spoilers: string;
  suspense_breaker: string;
  where_to_watch: WatchOption[];
  extra_images: string[];
  ai_notes: string;

  // TV Show specific data (optional, only for type === 'show')
  tvShow?: TVShowData;
}

export interface WatchlistItem {
  id: string;
  saved_title: string;
  movie: MovieData;
  added_at: string;
}

export interface WatchlistFolder {
  id: string;
  name: string;
  color: string;
  items: WatchlistItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
}

export enum QueryComplexity {
  SIMPLE = 'SIMPLE',
  COMPLEX = 'COMPLEX',
  FOLLOW_UP = 'FOLLOW_UP'
}

// Added types for grounding sources
export interface WebSource {
  uri: string;
  title: string;
}

export interface GroundingSource {
  web: WebSource;
}

export type AIProvider = 'groq' | 'mistral' | 'perplexity' | 'openrouter';

export interface FetchResult {
  movieData: MovieData | null;
  sources: GroundingSource[] | null;
  error?: string;
  provider?: AIProvider;
}

export interface SuggestionItem {
  id: number;
  title: string;
  year?: string;
  type: 'movie' | 'show' | 'person';
  media_type: 'movie' | 'tv' | 'person';
  poster_url?: string;
  confidence: number;
  known_for_department?: string;
  known_for_titles?: string[];
}



================================================
FILE: vercel.json
================================================
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.vercel.com https://vercel.live https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; img-src 'self' data: https: https://image.tmdb.org https://static.tvmaze.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.vercel.com https://vercel.live https://api.groq.com https://api.mistral.ai https://api.perplexity.ai https://openrouter.ai https://www.themoviedb.org https://api.themoviedb.org https://api.tvmaze.com https://api.omdbapi.com https://www.rottentomatoescdn.com; media-src 'self' https: data:; frame-src 'self' https://www.youtube.com https://vercel.live; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}


================================================
FILE: vite-env.d.ts
================================================
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ORIGIN?: string;
  readonly VITE_ALLOWED_ORIGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}



================================================
FILE: vite.config.ts
================================================
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: process.env.GITHUB_ACTIONS ? '/moviemonk-ai/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'mock-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/query', (req, res) => {
            // Mock response for "Inception" to allow UI testing
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ok: true,
              type: 'movie',
              data: {
                movie: {
                  id: 27205,
                  title: 'Inception (Local Mock)',
                  year: '2010',
                  overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".',
                  genres: ['Action', 'Science Fiction', 'Adventure'],
                  poster_url: 'https://image.tmdb.org/t/p/w500/8Z8dptZQl1qPhQrJ4howsCorgw.jpg',
                  backdrop_url: 'https://image.tmdb.org/t/p/w780/s3TBrRGB1jav7fwSaGj7w94Gnin.jpg',
                  cast: [
                    { name: 'Leonardo DiCaprio', role: 'Dom Cobb' },
                    { name: 'Joseph Gordon-Levitt', role: 'Arthur' },
                    { name: 'Elliot Page', role: 'Ariadne' }
                  ],
                  crew: { director: 'Christopher Nolan', writer: 'Christopher Nolan', music: 'Hans Zimmer' }
                }
              },
              summary: {
                summary_short: 'This is a mocked response because the backend API is not running. The UI is working perfectly!',
                summary_long: 'This is a mocked response to demonstrate the UI capabilities without requiring the Vercel backend functions to be running. In production, this would fetch real data from TMDB and Perplexity.'
              },
              sources: [{ name: 'Local Mock', url: '#' }],
              cached: false
            }));
          });

          server.middlewares.use('/api/resolveEntity', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ type: 'movie', chosen: { id: 27205 } }));
          });
        }
      }
    ],
    define: {
      // Safe defines (if any)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});



================================================
FILE: .env.example
================================================
# Environment Variables Setup

## Security Update: API Keys Moved to Backend

All API keys are now **server-side only** via Vercel serverless functions. Keys are never exposed to browsers.

---

## Vercel Environment Variables

Set these in your Vercel dashboard or via CLI:

### Required Variables

```bash
# TMDB API (get from https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_v3_api_key
TMDB_READ_TOKEN=your_tmdb_v4_read_token  # Optional, v3 key is enough

# OMDB API (get from https://www.omdbapi.com/apikey.aspx)
OMDB_API_KEY=your_omdb_api_key

# Groq API (get from https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key

# Mistral API (get from https://console.mistral.ai/)
MISTRAL_API_KEY=your_mistral_api_key

# OpenRouter API (get from https://openrouter.ai/keys)
OPENROUTER_API_KEY=your_openrouter_api_key


# Perplexity API (optional - for web search fallback)
PERPLEXITY_API_KEY=your_perplexity_api_key

# SerpApi Key (for Google web search)
SERPAPI_KEY=your_serpapi_key
```

---

## Setting Variables via Vercel CLI

```bash
# Set production variables
vercel env add TMDB_API_KEY production
vercel env add OMDB_API_KEY production
vercel env add GROQ_API_KEY production
vercel env add MISTRAL_API_KEY production
vercel env add OPENROUTER_API_KEY production
vercel env add SERPAPI_KEY production

# Set preview variables (optional)
vercel env add TMDB_API_KEY preview
vercel env add OMDB_API_KEY preview
vercel env add GROQ_API_KEY preview
vercel env add MISTRAL_API_KEY preview
vercel env add OPENROUTER_API_KEY preview
vercel env add SERPAPI_KEY preview

# Set development variables (optional - for local Vercel dev)
vercel env add TMDB_API_KEY development
vercel env add OMDB_API_KEY development
vercel env add GROQ_API_KEY development
vercel env add MISTRAL_API_KEY development
vercel env add OPENROUTER_API_KEY development
vercel env add SERPAPI_KEY development
```

---

## Setting Variables via Vercel Dashboard

1. Go to https://vercel.com/your-username/moviemonk-ai/settings/environment-variables
2. Add each variable:
   - **Key**: Variable name (e.g., `TMDB_API_KEY`)
   - **Value**: Your API key
   - **Environments**: Select `Production`, `Preview`, and `Development`
3. Click **Save**

---

## Local Development (Optional)

If running `vercel dev` locally, you can use `.env.local`:

```bash
# .env.local (DO NOT commit to git!)
TMDB_API_KEY=your_key
OMDB_API_KEY=your_key
GROQ_API_KEY=your_key
MISTRAL_API_KEY=your_key
OPENROUTER_API_KEY=your_key
SERPAPI_KEY=your_key
```

**Important**: `.env.local` is only for local Vercel dev server. Production uses Vercel's environment variables.

---

## Verifying Setup

After setting variables:

1. **Redeploy** your app: `vercel --prod`
2. **Test** by searching for a movie
3. **Check browser Network tab** (F12):
   - ✅ You should see calls to `/api/tmdb`, `/api/omdb`, `/api/groq`
   - ✅ You should **NOT** see API keys in any requests
   - ✅ All external API calls are from Vercel servers, not your browser

---

## Migration from Old Setup

If you were using `VITE_*` variables before:

1. **Delete** all `VITE_*` variables from Vercel dashboard
2. **Remove** `.env.local` from your project (or remove `VITE_*` entries)
3. **Add** new server-side variables (without `VITE_` prefix)
4. **Redeploy**

Old variables like `VITE_TMDB_API_KEY` are no longer needed and should be removed.

---

## Security Notes

✅ **Secure**: API keys stored in Vercel's encrypted environment variables  
✅ **Never exposed**: Keys never sent to browsers or visible in Network tab  
✅ **CORS protected**: Serverless functions only accept requests from your domain  
✅ **Free**: All proxies run on Vercel's free tier (no extra cost)

---

## Troubleshooting

### "API key not configured" error

- Check that you set the variable in the correct environment (production/preview/development)
- Variable names must be **exact** (case-sensitive, no `VITE_` prefix)
- Redeploy after adding new variables

### "CORS error" in development

- Use `vercel dev` instead of `npm run dev` for local testing with serverless functions
- Or update proxy URLs in service files to point to your deployed Vercel URL

### Variables not updating

- After changing variables, **redeploy**: `vercel --prod`
- Variables are loaded at build time, not runtime



================================================
FILE: .vercelignore
================================================
node_modules
.env
.env.local
dist
.git
.github
*.log



================================================
FILE: __tests__/api/contractSnapshots.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/ai', () => ({
  generateSummary: jest.fn().mockResolvedValue({
    ok: true,
    json: { summary_short: 'short', summary_long: 'long' },
    provider: 'groq'
  })
}));

jest.mock('../../services/serpApiService', () => ({
  searchSerpApi: jest.fn().mockResolvedValue([])
}));

jest.mock('../../services/perplexityService', () => ({
  searchPerplexity: jest.fn().mockResolvedValue([])
}));

jest.mock('../../services/tmdbService', () => ({
  fetchSimilarTitles: jest.fn().mockResolvedValue([]),
  fetchRelatedPeopleForPerson: jest.fn().mockResolvedValue([])
}));

import aiHandler from '../../api/ai';
import queryHandler from '../../api/query';
import resolveEntityHandler from '../../api/resolveEntity';
import websearchHandler from '../../api/websearch';
import personHandler from '../../api/person/[id]';

const groqHandler = require('../../api/groq');
const mistralHandler = require('../../api/mistral');
const openrouterHandler = require('../../api/openrouter');
const omdbHandler = require('../../api/omdb');
const tmdbHandler = require('../../api/tmdb');

const contract = (res: any) => ({ status: res.statusCode, body: res._getJSONData() });

describe('API contract snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'tmdb-key';
  });

  it('api/ai search success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            title: 'Inception',
            media_type: 'movie',
            overview: 'Dream thriller',
            popularity: 87,
            release_date: '2010-07-16',
            poster_path: '/inception.jpg'
          }
        ]
      })
    });

    const req = createRequest({ method: 'GET', query: { action: 'search', q: 'Inception' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await aiHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/query missing query contract', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await queryHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/resolveEntity success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ id: 11, title: 'Inception', popularity: 70, release_date: '2010-07-16' }] })
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ id: 99, name: 'Christopher Nolan', popularity: 20 }] })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Inception' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await resolveEntityHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/websearch success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<a class="result__a" href="https://example.com/inception">Inception review</a><a class="result__snippet">Great movie</a>'
    });

    const req = createRequest({ method: 'GET', query: { q: 'Inception', sources: 'web' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await websearchHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/person/[id] success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 99,
        name: 'Christopher Nolan',
        biography: 'Director',
        birthday: '1970-07-30',
        place_of_birth: 'London',
        profile_path: '/nolan.jpg'
      })
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cast: [{ id: 1, title: 'Inception', release_date: '2010-07-16', character: 'N/A', poster_path: '/inception.jpg' }],
        crew: []
      })
    });

    const req = createRequest({ method: 'GET', query: { id: '99' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await personHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/groq missing key contract', async () => {
    delete process.env.GROQ_API_KEY;
    const req = createRequest({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await groqHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });

  it('api/mistral missing key contract', async () => {
    delete process.env.MISTRAL_API_KEY;
    const req = createRequest({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await mistralHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });

  it('api/openrouter missing key contract', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const req = createRequest({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await openrouterHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });

  it('api/omdb missing id contract', async () => {
    process.env.OMDB_API_KEY = 'omdb-key';
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await omdbHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });

  it('api/tmdb missing endpoint contract', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await tmdbHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });
});


================================================
FILE: __tests__/api/errorContract.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/ai', () => ({
  generateSummary: jest.fn().mockResolvedValue({ ok: true, json: { summary_short: 'short', summary_long: 'long' }, provider: 'groq' })
}));

import queryHandler from '../../api/query';
import resolveEntityHandler from '../../api/resolveEntity';
import websearchHandler from '../../api/websearch';

describe('api error contract', () => {
  it('query returns standardized forbidden_origin error', async () => {
    const req = createRequest({
      method: 'GET',
      query: { q: 'Interstellar' },
      headers: { host: 'localhost:3000', origin: 'https://evil.example.com' }
    });
    const res = createResponse();

    await queryHandler(req as any, res as any);
    const body = res._getJSONData();

    expect(res.statusCode).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe('forbidden_origin');
    expect(typeof body.error).toBe('string');
  });

  it('resolveEntity returns standardized missing_query error', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await resolveEntityHandler(req as any, res as any);
    const body = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe('missing_query');
  });

  it('websearch returns standardized query_too_short error', async () => {
    const req = createRequest({ method: 'GET', query: { q: 'a' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await websearchHandler(req as any, res as any);
    const body = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe('query_too_short');
  });
});



================================================
FILE: __tests__/api/person.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import handler from '../../api/person/[id]';

describe('/api/person/[id]', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns enriched person profile with backward-compatible filmography', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 99,
          name: 'Christopher Nolan',
          biography: 'Famous director.',
          birthday: '1970-07-30',
          place_of_birth: 'London',
          profile_path: '/nolan.jpg'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cast: [
            {
              id: 2,
              media_type: 'movie',
              title: 'Oppenheimer',
              release_date: '2023-07-21',
              character: 'Narrator',
              poster_path: '/oppenheimer.jpg',
              popularity: 99
            }
          ],
          crew: [
            {
              id: 1,
              media_type: 'movie',
              title: 'Inception',
              release_date: '2010-07-16',
              job: 'Director',
              department: 'Directing',
              poster_path: '/inception.jpg',
              popularity: 100
            }
          ]
        })
      });

    const req = createRequest({ method: 'GET', query: { id: '99' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.person.name).toBe('Christopher Nolan');
    expect(data.filmography.length).toBeGreaterThan(0);
    expect(Array.isArray(data.top_work)).toBe(true);
    expect(Array.isArray(data.credits_all)).toBe(true);
    expect(Array.isArray(data.credits_acting)).toBe(true);
    expect(Array.isArray(data.credits_directing)).toBe(true);
    expect(data.role_distribution).toEqual(expect.objectContaining({
      acting: expect.any(Number),
      directing: expect.any(Number),
      other: expect.any(Number)
    }));
    expect(data.career_span).toEqual(expect.objectContaining({
      start_year: expect.any(Number),
      end_year: expect.any(Number),
      active_years: expect.any(Number)
    }));
    expect(data.filmography[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      title: expect.any(String),
      role: expect.any(String),
      media_type: expect.stringMatching(/movie|tv/)
    }));
    expect(data.sources).toBeDefined();
  });

  it('returns 400 if id is missing', async () => {
    const req = createRequest({ method: 'GET', query: {} });
    const res = createResponse();
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });
});



================================================
FILE: __tests__/api/query.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/ai', () => ({
  generateSummary: jest.fn().mockResolvedValue({ ok: true, json: { summary_short: 'short', summary_long: 'long' }, provider: 'groq' })
}));

import handler from '../../api/query';

describe('/api/query', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns person summary when resolved as person', async () => {
    // resolveEntity → person
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'person', chosen: { id: 99, name: 'Christopher Nolan', type: 'person' }, candidates: [] })
    });
    // person API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ person: { id: 99, name: 'Christopher Nolan', biography: 'Director.' }, filmography: [], sources: [] })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Christopher Nolan' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.type).toBe('person');
    expect(data.summary).toBeDefined();
  });

  it('returns movie summary when resolved as movie', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'movie', chosen: { id: 1, name: 'Interstellar', type: 'movie' }, candidates: [] })
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        title: 'Interstellar',
        release_date: '2014-11-07',
        overview: 'Space epic.',
        genres: [{ name: 'Sci-Fi' }],
        poster_path: '/inter.jpg',
        backdrop_path: '/back.jpg'
      })
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cast: [{ name: 'Matthew McConaughey', character: 'Cooper' }],
        crew: [{ name: 'Christopher Nolan', job: 'Director' }]
      })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Interstellar 2014' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.type).toBe('movie');
    expect(data.data?.movie?.title).toBe('Interstellar');
    expect(data.summary).toBeDefined();
  });

  it('returns 400 when q is missing', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });
});



================================================
FILE: __tests__/api/resolveEntity.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

// Mock TMDB fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Ensure REDIS_URL is ignored in test
jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import handler from '../../api/resolveEntity';

describe('/api/resolveEntity', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns person type when person match is confident', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, title: 'Interstellar', popularity: 50, release_date: '2014-11-07' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 99, name: 'Christopher Nolan', popularity: 150 }] })
      });

    const req = createRequest({ method: 'GET', query: { q: 'Christopher Nolan' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('person');
    expect(data.confidence_band).toBe('confident');
    expect(data.chosen?.name).toBe('Christopher Nolan');
  });

  it('returns movie type when movie match is confident', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, title: 'Interstellar', popularity: 200, release_date: '2014-11-07' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      });

    const req = createRequest({ method: 'GET', query: { q: 'Interstellar 2014' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('movie');
    expect(data.confidence_band).toBe('confident');
    expect(data.chosen?.name).toBe('Interstellar');
  });

  it('returns ambiguous when scores are close', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, title: 'Inception', popularity: 100 }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 2, name: 'Inception Documentary', popularity: 100 }] })
      });

    const req = createRequest({ method: 'GET', query: { q: 'Inception' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    // Could be movie or ambiguous depending on similarity tie; either acceptable
    expect(['movie', 'ambiguous']).toContain(data.type);
  });

  it('returns shortlist confidence band for ambiguous person-like query', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 10, name: 'Chris Evans', popularity: 80, known_for_department: 'Acting', known_for: [{ title: 'Avengers' }] },
            { id: 11, name: 'Chris Hemsworth', popularity: 80, known_for_department: 'Acting', known_for: [{ title: 'Thor' }] }
          ]
        })
      });

    const req = createRequest({ method: 'GET', query: { q: 'Chris' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('ambiguous');
    expect(data.confidence_band).toBe('shortlist');
    expect(Array.isArray(data.shortlisted)).toBe(true);
    expect(data.shortlisted.length).toBeGreaterThan(0);
  });

  it('returns confident person for role-qualified query', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 100, title: 'Director', popularity: 5 }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 99,
              name: 'Christopher Nolan',
              popularity: 150,
              known_for_department: 'Directing',
              known_for: [{ title: 'Inception' }, { title: 'Interstellar' }]
            }
          ]
        })
      });

    const req = createRequest({ method: 'GET', query: { q: 'director christopher nolan' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('person');
    expect(data.confidence_band).toBe('confident');
    expect(data.chosen).toEqual({ id: 99, name: 'Christopher Nolan', type: 'person' });
    expect(data.intent).toEqual(expect.objectContaining({ requested_role: 'director', is_person_focused: true }));
  });

  it('returns 400 if q is missing', async () => {
    const req = createRequest({ method: 'GET', query: {} });
    const res = createResponse();
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });
});



================================================
FILE: __tests__/api/suggest.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/perplexityService', () => ({
  searchPerplexity: jest.fn().mockResolvedValue([])
}));

import handler from '../../api/suggest';
import { searchPerplexity } from '../../services/perplexityService';

describe('/api/suggest', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns empty list for short query', async () => {
    const req = createRequest({ method: 'GET', query: { q: 'f' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.suggestions).toEqual([]);
  });

  it('ranks exact match above partial match', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            title: 'Fresh',
            media_type: 'movie',
            popularity: 20,
            release_date: '2022-03-01',
            poster_path: '/fresh.jpg'
          },
          {
            id: 2,
            title: 'Fresh Prince',
            media_type: 'tv',
            popularity: 60,
            first_air_date: '1990-01-01',
            poster_path: '/fresh-prince.jpg'
          },
          {
            id: 3,
            title: 'Not Related',
            media_type: 'movie',
            popularity: 99,
            release_date: '2024-01-01'
          }
        ]
      })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Fresh' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
    expect(data.suggestions[0].title).toBe('Fresh');
    expect(data.suggestions[0].type).toBe('movie');
    expect(data.suggestions[0]).not.toHaveProperty('score');
    expect(data.suggestions[0]).not.toHaveProperty('popularity');
  });

  it('applies year boost when query contains year', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 11,
            title: 'Dune',
            media_type: 'movie',
            popularity: 10,
            release_date: '2021-10-22'
          },
          {
            id: 12,
            title: 'Dune',
            media_type: 'movie',
            popularity: 10,
            release_date: '1984-12-14'
          }
        ]
      })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Dune 2021' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.suggestions[0].year).toBe('2021');
  });

  it('uses fallback source only when TMDB returns no candidates', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] })
    });

    (searchPerplexity as jest.Mock).mockResolvedValueOnce([
      {
        title: 'Fresh',
        year: '2022',
        image: 'https://image.tmdb.org/t/p/w154/fresh.jpg'
      }
    ]);

    const req = createRequest({ method: 'GET', query: { q: 'Fresh' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(searchPerplexity).toHaveBeenCalledTimes(1);
    expect(data.suggestions[0].title).toBe('Fresh');
  });

  it('returns person role metadata for person suggestions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 99,
            name: 'Christopher Nolan',
            media_type: 'person',
            popularity: 80,
            profile_path: '/nolan.jpg',
            known_for_department: 'Directing',
            known_for: [{ title: 'Inception' }, { title: 'Interstellar' }]
          }
        ]
      })
    });

    const req = createRequest({ method: 'GET', query: { q: 'director nolan' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.suggestions[0].type).toBe('person');
    expect(data.suggestions[0].known_for_department).toBe('Directing');
    expect(data.suggestions[0].known_for_titles).toEqual(expect.arrayContaining(['Inception', 'Interstellar']));
  });
});



================================================
FILE: __tests__/api/__snapshots__/contractSnapshots.test.ts.snap
================================================
// Jest Snapshot v1, https://jestjs.io/docs/snapshot-testing

exports[`API contract snapshots api/ai search success contract 1`] = `
{
  "body": {
    "ok": true,
    "parsedQuery": {
      "title": "Inception",
    },
    "query": "Inception",
    "results": [
      {
        "confidence": 0.87,
        "id": 1,
        "image": "https://image.tmdb.org/t/p/w500/inception.jpg",
        "media_type": "movie",
        "snippet": "Dream thriller",
        "title": "Inception",
        "type": "movie",
        "url": "https://www.tmdb.org/movie/1",
        "year": "2010",
      },
    ],
    "total": 1,
  },
  "status": 200,
}
`;

exports[`API contract snapshots api/groq missing key contract 1`] = `
{
  "body": {
    "error": {
      "code": "missing_api_key",
      "message": "Groq API key not configured",
      "provider": "groq",
    },
  },
  "status": 400,
}
`;

exports[`API contract snapshots api/mistral missing key contract 1`] = `
{
  "body": {
    "error": {
      "code": "missing_api_key",
      "message": "Mistral API key not configured",
      "provider": "mistral",
    },
  },
  "status": 400,
}
`;

exports[`API contract snapshots api/omdb missing id contract 1`] = `
{
  "body": {
    "error": {
      "code": "missing_imdb_id",
      "message": "Missing IMDB ID parameter (i)",
      "provider": "omdb",
    },
  },
  "status": 400,
}
`;

exports[`API contract snapshots api/openrouter missing key contract 1`] = `
{
  "body": {
    "error": {
      "code": "missing_api_key",
      "message": "OpenRouter API key not configured",
      "provider": "openrouter",
    },
  },
  "status": 400,
}
`;

exports[`API contract snapshots api/person/[id] success contract 1`] = `
{
  "body": {
    "cached": false,
    "career_span": {
      "active_years": 1,
      "end_year": 2010,
      "start_year": 2010,
    },
    "credits_acting": [
      {
        "character": "N/A",
        "id": 1,
        "media_type": "movie",
        "poster_url": "https://image.tmdb.org/t/p/w342/inception.jpg",
        "role": "cast",
        "role_bucket": "acting",
        "title": "Inception",
        "year": 2010,
      },
    ],
    "credits_all": [
      {
        "character": "N/A",
        "id": 1,
        "media_type": "movie",
        "poster_url": "https://image.tmdb.org/t/p/w342/inception.jpg",
        "role": "cast",
        "role_bucket": "acting",
        "title": "Inception",
        "year": 2010,
      },
    ],
    "credits_directing": [],
    "credits_other": [],
    "filmography": [
      {
        "character": "N/A",
        "id": 1,
        "media_type": "movie",
        "poster_url": "https://image.tmdb.org/t/p/w342/inception.jpg",
        "role": "cast",
        "title": "Inception",
        "year": 2010,
      },
    ],
    "known_for_tags": [
      "Acting",
      "Film",
    ],
    "person": {
      "biography": "Director",
      "birthday": "1970-07-30",
      "id": 99,
      "name": "Christopher Nolan",
      "place_of_birth": "London",
      "profile_url": "https://image.tmdb.org/t/p/w342/nolan.jpg",
    },
    "related_people": [],
    "role_distribution": {
      "acting": 1,
      "directing": 0,
      "other": 0,
    },
    "sources": [
      {
        "name": "TMDB",
        "url": "https://www.themoviedb.org/person/99",
      },
    ],
    "top_work": [
      {
        "character": "N/A",
        "id": 1,
        "media_type": "movie",
        "poster_url": "https://image.tmdb.org/t/p/w342/inception.jpg",
        "role": "cast",
        "role_bucket": "acting",
        "title": "Inception",
        "year": 2010,
      },
    ],
  },
  "status": 200,
}
`;

exports[`API contract snapshots api/query missing query contract 1`] = `
{
  "body": {
    "error": "Missing q",
    "error_code": "missing_query",
    "ok": false,
  },
  "status": 400,
}
`;

exports[`API contract snapshots api/resolveEntity success contract 1`] = `
{
  "body": {
    "cached": false,
    "candidates": [
      {
        "id": 11,
        "name": "Inception",
        "score": 0.816,
        "type": "movie",
      },
      {
        "id": 99,
        "name": "Christopher Nolan",
        "score": 0.164,
        "type": "person",
      },
    ],
    "chosen": {
      "id": 11,
      "name": "Inception",
      "type": "movie",
    },
    "confidence_band": "confident",
    "intent": {
      "is_person_focused": false,
      "requested_role": "any",
    },
    "ok": true,
    "query": "Inception",
    "shortlisted": [
      {
        "confidence": 0.164,
        "id": 99,
        "known_for_titles": [],
        "name": "Christopher Nolan",
        "popularity": 20,
        "role_match": "neutral",
        "score": 0.164,
        "type": "person",
      },
    ],
    "type": "movie",
  },
  "status": 200,
}
`;

exports[`API contract snapshots api/tmdb missing endpoint contract 1`] = `
{
  "body": {
    "error": {
      "code": "missing_endpoint",
      "message": "Missing endpoint parameter",
      "provider": "tmdb",
    },
  },
  "status": 400,
}
`;

exports[`API contract snapshots api/websearch success contract 1`] = `
{
  "body": {
    "cached": false,
    "ok": true,
    "query": "Inception",
    "results": {
      "web": [
        {
          "snippet": "Great movie",
          "title": "Inception review",
          "url": "https://example.com/inception",
        },
      ],
    },
    "total": 1,
  },
  "status": 200,
}
`;



================================================
FILE: __tests__/components/ambiguousModal.test.ts
================================================
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AmbiguousModal from '../../components/AmbiguousModal';

describe('AmbiguousModal', () => {
  const candidates = [
    {
      id: 1,
      title: 'Christopher Nolan',
      type: 'person' as const,
      score: 0.91,
      known_for_department: 'Directing',
      role_match: 'match' as const,
      known_for_titles: ['Inception']
    },
    {
      id: 2,
      title: 'Inception',
      type: 'movie' as const,
      score: 0.88
    }
  ];

  it('renders default mode with generic search title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AmbiguousModal, {
        candidates,
        onSelect: () => undefined,
        onClose: () => undefined
      })
    );

    expect(html).toContain('Search Results');
    expect(html).toContain('Inception');
  });

  it('renders person-shortlist mode with role cues and no generic tabs', () => {
    const html = renderToStaticMarkup(
      React.createElement(AmbiguousModal, {
        mode: 'person-shortlist',
        candidates,
        onSelect: () => undefined,
        onClose: () => undefined
      })
    );

    expect(html).toContain('Choose the right person');
    expect(html).toContain('Directing');
    expect(html).toContain('Role match');
    expect(html).not.toContain('All (');
  });
});



================================================
FILE: __tests__/components/discoveryPage.test.ts
================================================
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../../hooks/useDiscovery', () => ({
  useDiscovery: jest.fn()
}));
jest.mock('../../components/icons', () => ({
  ArrowLeftIcon: () => React.createElement('span', null, '<'),
  ArrowRightIcon: () => React.createElement('span', null, '>')
}));

import { useDiscovery } from '../../hooks/useDiscovery';
import DiscoveryPage from '../../components/DiscoveryPage';

const mockUseDiscovery = useDiscovery as jest.Mock;

function renderPage() {
  return renderToStaticMarkup(
    React.createElement(DiscoveryPage, {
      onOpenTitle: () => undefined
    })
  );
}

describe('DiscoveryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty hero copy when no data is available', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      isLoading: false,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('Browse what is trending right now.');
  });

  it('renders error state with retry affordance', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      isLoading: false,
      isGenreLoading: false,
      error: 'Network failed',
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('Discovery unavailable');
    expect(html).toContain('Try Again');
    expect(html).toContain('Network failed');
  });

  it('renders hero skeleton while loading', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      isLoading: true,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('discovery-hero-skeleton');
  });

  it('renders dashboard sections in the expected order', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [
        { key: 'trending-movies', title: 'Trending Movies', items: [] },
        { key: 'upcoming', title: 'Upcoming', items: [] },
        { key: 'now-playing-mix', title: 'Now Playing', items: [] },
        { key: 'top-rated-movies-series', title: 'Top Rated Movies & Series', items: [] },
        { key: 'global-web-series-tv', title: 'Global Web Series and TV Shows', items: [] },
        { key: 'kdrama-asian-series', title: 'K-Drama and Asian Series', items: [] }
      ],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      isLoading: false,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html.indexOf('Trending Movies')).toBeLessThan(html.indexOf('Upcoming'));
    expect(html.indexOf('Upcoming')).toBeLessThan(html.indexOf('Now Playing'));
    expect(html.indexOf('Now Playing')).toBeLessThan(html.indexOf('Top Rated Movies &amp; Series'));
    expect(html.indexOf('Top Rated Movies &amp; Series')).toBeLessThan(html.indexOf('Global Web Series and TV Shows'));
    expect(html.indexOf('Global Web Series and TV Shows')).toBeLessThan(html.indexOf('K-Drama and Asian Series'));
  });
});



================================================
FILE: __tests__/components/personDisplay.test.ts
================================================
jest.mock('../../components/icons', () => ({
  BirthdayIcon: () => null,
  LocationIcon: () => null,
  SparklesIcon: () => null
}));

jest.mock('../../lib/perfDebug', () => ({
  useRenderCounter: () => undefined
}));

jest.mock('@vercel/analytics/react', () => ({
  track: () => undefined
}));

import {
  derivePersonCreditBuckets,
  selectVisibleCredits,
  toOpenTitlePayload,
  PersonPayload
} from '../../components/PersonDisplay';

describe('PersonDisplay helpers', () => {
  const payload: PersonPayload = {
    person: {
      id: 9,
      name: 'Sample Person'
    },
    filmography: [],
    credits_all: [
      {
        id: 1,
        media_type: 'movie',
        title: 'Directed A',
        year: 2023,
        role: 'Director',
        role_bucket: 'directing',
        popularity: 50
      },
      {
        id: 2,
        media_type: 'tv',
        title: 'Acted B',
        year: 2024,
        role: 'cast',
        role_bucket: 'acting',
        popularity: 80
      }
    ],
    credits_acting: [
      {
        id: 2,
        media_type: 'tv',
        title: 'Acted B',
        year: 2024,
        role: 'cast',
        role_bucket: 'acting',
        popularity: 80
      }
    ],
    credits_directing: [
      {
        id: 1,
        media_type: 'movie',
        title: 'Directed A',
        year: 2023,
        role: 'Director',
        role_bucket: 'directing',
        popularity: 50
      }
    ]
  };

  it('derives buckets and role distribution', () => {
    const buckets = derivePersonCreditBuckets(payload);

    expect(buckets.allCredits).toHaveLength(2);
    expect(buckets.actingCredits).toHaveLength(1);
    expect(buckets.directingCredits).toHaveLength(1);
    expect(buckets.roleDistribution).toEqual({
      acting: 1,
      directing: 1,
      other: 0
    });
  });

  it('selects visible credits by active tab', () => {
    const buckets = derivePersonCreditBuckets(payload);

    expect(selectVisibleCredits('all', buckets)).toHaveLength(2);
    expect(selectVisibleCredits('acting', buckets).map((credit) => credit.id)).toEqual([2]);
    expect(selectVisibleCredits('directing', buckets).map((credit) => credit.id)).toEqual([1]);
  });

  it('maps person credit to title-open callback payload', () => {
    expect(toOpenTitlePayload({ id: 5, media_type: 'movie' })).toEqual({ id: 5, mediaType: 'movie' });
    expect(toOpenTitlePayload({ id: 6, media_type: 'tv' })).toEqual({ id: 6, mediaType: 'tv' });
  });
});



================================================
FILE: __tests__/components/personDisplayLayout.test.ts
================================================
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PersonDisplay, { PersonPayload } from '../../components/PersonDisplay';

jest.mock('../../components/icons', () => ({
  BirthdayIcon: () => React.createElement('span', null, 'B'),
  LocationIcon: () => React.createElement('span', null, 'L'),
  SparklesIcon: () => React.createElement('span', null, '*')
}));

jest.mock('../../lib/perfDebug', () => ({
  useRenderCounter: () => undefined
}));

jest.mock('@vercel/analytics/react', () => ({
  track: () => undefined
}));

describe('PersonDisplay layout', () => {
  const payload: PersonPayload = {
    person: {
      id: 99,
      name: 'Chris Hemsworth',
      biography: 'Australian actor with a wide filmography.',
      birthday: '1983-08-11',
      place_of_birth: 'Melbourne, Australia',
      profile_url: 'https://image.tmdb.org/t/p/w342/chris.jpg',
      known_for_department: 'Acting'
    },
    filmography: [],
    top_work: [
      { id: 1, title: 'Top Film', year: 2024, role: 'cast', media_type: 'movie', role_bucket: 'acting', poster_url: '/top.jpg' }
    ],
    credits_all: [
      { id: 2, title: 'Recent Film', year: 2025, role: 'cast', media_type: 'movie', role_bucket: 'acting', poster_url: '/recent.jpg' }
    ],
    credits_acting: [
      { id: 2, title: 'Recent Film', year: 2025, role: 'cast', media_type: 'movie', role_bucket: 'acting', poster_url: '/recent.jpg' }
    ],
    credits_directing: [],
    role_distribution: { acting: 1, directing: 0, other: 0 },
    career_span: { start_year: 2011, end_year: 2025, active_years: 15 },
    known_for_tags: ['Acting', 'Film']
  };

  it('renders editorial sections and keeps a single primary hero CTA label', () => {
    const html = renderToStaticMarkup(
      React.createElement(PersonDisplay, {
        data: payload,
        onQuickSearch: () => undefined,
        onBriefMe: () => undefined,
        onOpenTitle: () => undefined
      })
    );

    expect(html).toContain('Best Movies');
    expect(html).toContain('More');
    expect(html).toContain('Career Span');
    expect(html).toContain('Biography');
    expect(html).toContain('Top Works');
    expect(html).toContain('Recent Credits');
    expect(html).toContain('Filmography');
  });
});



================================================
FILE: __tests__/hooks/useDiscovery.test.ts
================================================
jest.mock('../../services/tmdbService', () => ({
  fetchTrending: jest.fn(),
  fetchPopular: jest.fn(),
  fetchTopRated: jest.fn(),
  fetchOnTheAir: jest.fn(),
  fetchDiscoverMovie: jest.fn(),
  fetchDiscoverTv: jest.fn(),
  fetchUpcoming: jest.fn(),
  fetchNowPlaying: jest.fn(),
  fetchByGenre: jest.fn(),
  fetchGenreList: jest.fn()
}));

import {
  buildBalancedMixRow,
  dedupeSectionsByTitle,
  getCuratedMovieGenres,
  loadDiscoverySnapshot,
  pickHeroItems
} from '../../hooks/useDiscovery';
import {
  fetchByGenre,
  fetchDiscoverMovie,
  fetchDiscoverTv,
  fetchGenreList,
  fetchNowPlaying,
  fetchOnTheAir,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming
} from '../../services/tmdbService';

describe('useDiscovery helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('picks curated genres in the requested order', () => {
    const sorted = getCuratedMovieGenres([
      { id: 99, name: 'Documentary' },
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 878, name: 'Science Fiction' }
    ]);

    expect(sorted).toEqual([
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science Fiction' },
      { id: 99, name: 'Documentary' }
    ]);
  });

  it('filters hero candidates to backdrop-ready items and limits count', () => {
    const heroes = pickHeroItems([
      { id: 1, tmdb_id: '1', media_type: 'movie', title: 'A', year: '2021', overview: '', poster_url: '', backdrop_url: '', rating: 7.2, genre_ids: [] },
      { id: 2, tmdb_id: '2', media_type: 'movie', title: 'B', year: '2021', overview: '', poster_url: '', backdrop_url: '/b.jpg', rating: 7.2, genre_ids: [] },
      { id: 3, tmdb_id: '3', media_type: 'movie', title: 'C', year: '2021', overview: '', poster_url: '', backdrop_url: '/c.jpg', rating: 7.2, genre_ids: [] }
    ], 1);

    expect(heroes).toHaveLength(1);
    expect(heroes[0].id).toBe(2);
  });

  it('builds deterministic mix rows with quota fallback when a pool is sparse', () => {
    const mixed = buildBalancedMixRow(
      10,
      {
        global: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Global A', year: '2024', overview: '', poster_url: '', backdrop_url: '/a.jpg', rating: 7.1, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Global B', year: '2024', overview: '', poster_url: '', backdrop_url: '/b.jpg', rating: 7.2, genre_ids: [] },
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Global C', year: '2024', overview: '', poster_url: '', backdrop_url: '/c.jpg', rating: 7.3, genre_ids: [] },
          { id: 4, tmdb_id: '4', media_type: 'movie', title: 'Global D', year: '2024', overview: '', poster_url: '', backdrop_url: '/d.jpg', rating: 7.4, genre_ids: [] },
          { id: 5, tmdb_id: '5', media_type: 'movie', title: 'Global E', year: '2024', overview: '', poster_url: '', backdrop_url: '/e.jpg', rating: 7.5, genre_ids: [] }
        ],
        bollywood: [
          { id: 21, tmdb_id: '21', media_type: 'movie', title: 'Bolly A', year: '2023', overview: '', poster_url: '', backdrop_url: '/x.jpg', rating: 7.6, genre_ids: [] }
        ],
        asian: [
          { id: 31, tmdb_id: '31', media_type: 'movie', title: 'Asian A', year: '2022', overview: '', poster_url: '', backdrop_url: '/y.jpg', rating: 7.7, genre_ids: [] }
        ]
      },
      [
        { pool: 'global', ratio: 0.7 },
        { pool: 'bollywood', ratio: 0.15 },
        { pool: 'asian', ratio: 0.15 }
      ]
    );

    expect(mixed.map((item) => item.title)).toEqual([
      'Global A',
      'Global B',
      'Global C',
      'Global D',
      'Global E',
      'Bolly A',
      'Asian A'
    ]);
  });

  it('falls back to global pool when regional pools are empty', () => {
    const mixed = buildBalancedMixRow(
      5,
      {
        global: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Global 1', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Global 2', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Global 3', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 4, tmdb_id: '4', media_type: 'movie', title: 'Global 4', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 5, tmdb_id: '5', media_type: 'movie', title: 'Global 5', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ],
        bollywood: [],
        asian: []
      },
      [
        { pool: 'global', ratio: 0.7 },
        { pool: 'bollywood', ratio: 0.15 },
        { pool: 'asian', ratio: 0.15 }
      ]
    );

    expect(mixed).toHaveLength(5);
    expect(mixed.map((item) => item.title)).toEqual(['Global 1', 'Global 2', 'Global 3', 'Global 4', 'Global 5']);
  });

  it('de-duplicates repeated titles across section priority order', () => {
    const sections = dedupeSectionsByTitle([
      {
        key: 'first',
        title: 'First',
        items: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Repeat', year: '2021', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Unique First', year: '2021', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      },
      {
        key: 'second',
        title: 'Second',
        items: [
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Repeat', year: '2022', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 4, tmdb_id: '4', media_type: 'movie', title: 'Unique Second', year: '2022', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      }
    ]);

    expect(sections[0].items.map((item) => item.title)).toEqual(['Repeat', 'Unique First']);
    expect(sections[1].items.map((item) => item.title)).toEqual(['Unique Second']);
  });

  it('loads discovery snapshot and fetches selected genre row from first curated genre', async () => {
    (fetchTrending as jest.Mock).mockImplementation((mediaType: string) => {
      if (mediaType === 'all') {
        return Promise.resolve([
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Hero A', year: '2024', overview: '', poster_url: '', backdrop_url: '/hero-a.jpg', rating: 8.1, genre_ids: [28] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Hero B', year: '2025', overview: '', poster_url: '', backdrop_url: '', rating: 8.0, genre_ids: [35] }
        ]);
      }
      if (mediaType === 'tv') {
        return Promise.resolve([
          { id: 11, tmdb_id: '11', media_type: 'tv', title: 'Trending Series', year: '2022', overview: '', poster_url: '', backdrop_url: '/ts.jpg', rating: 8.4, genre_ids: [18] }
        ]);
      }
      return Promise.resolve([
        { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Trending Movie', year: '2020', overview: '', poster_url: '', backdrop_url: '/x.jpg', rating: 7.1, genre_ids: [28] }
      ]);
    });
    (fetchUpcoming as jest.Mock).mockResolvedValue([
      { id: 41, tmdb_id: '41', media_type: 'movie', title: 'Upcoming Movie', year: '2026', overview: '', poster_url: '', backdrop_url: '/up.jpg', rating: 7.6, genre_ids: [28] }
    ]);
    (fetchNowPlaying as jest.Mock).mockResolvedValue([
      { id: 42, tmdb_id: '42', media_type: 'movie', title: 'Now Playing Hollywood', year: '2025', overview: '', poster_url: '', backdrop_url: '/np.jpg', rating: 7.4, genre_ids: [28] }
    ]);
    (fetchPopular as jest.Mock).mockResolvedValue([
      { id: 10, tmdb_id: '10', media_type: 'tv', title: 'Popular Show', year: '2023', overview: '', poster_url: '', backdrop_url: '/ps.jpg', rating: 8.9, genre_ids: [18] }
    ]);
    (fetchOnTheAir as jest.Mock).mockResolvedValue([
      { id: 12, tmdb_id: '12', media_type: 'tv', title: 'On Air Drama', year: '2024', overview: '', poster_url: '', backdrop_url: '/oa.jpg', rating: 8.6, genre_ids: [18] }
    ]);
    (fetchTopRated as jest.Mock).mockImplementation((mediaType: string) => {
      if (mediaType === 'tv') {
        return Promise.resolve([
          { id: 13, tmdb_id: '13', media_type: 'tv', title: 'Top Rated Series', year: '2021', overview: '', poster_url: '', backdrop_url: '/tv-top.jpg', rating: 9.1, genre_ids: [18] }
        ]);
      }
      return Promise.resolve([
        { id: 20, tmdb_id: '20', media_type: 'movie', title: 'Top Rated', year: '2019', overview: '', poster_url: '', backdrop_url: '/tr.jpg', rating: 9.2, genre_ids: [18] }
      ]);
    });
    (fetchDiscoverMovie as jest.Mock).mockImplementation((options: { withOriginalLanguage?: string }) => {
      const byLanguage: Record<string, any[]> = {
        hi: [{ id: 51, tmdb_id: '51', media_type: 'movie', title: 'Bollywood Pick', year: '2024', overview: '', poster_url: '', backdrop_url: '/hi.jpg', rating: 8.0, genre_ids: [18] }],
        ja: [{ id: 52, tmdb_id: '52', media_type: 'movie', title: 'Asian Pick', year: '2023', overview: '', poster_url: '', backdrop_url: '/ja.jpg', rating: 7.9, genre_ids: [18] }],
        ko: [{ id: 53, tmdb_id: '53', media_type: 'movie', title: 'Korean Pick', year: '2025', overview: '', poster_url: '', backdrop_url: '/ko.jpg', rating: 7.8, genre_ids: [18] }]
      };
      return Promise.resolve(byLanguage[options?.withOriginalLanguage || ''] || []);
    });
    (fetchGenreList as jest.Mock).mockImplementation((mediaType: string) => {
      if (mediaType === 'tv') {
        return Promise.resolve([
          { id: 18, name: 'Drama' },
          { id: 35, name: 'Comedy' }
        ]);
      }
      return Promise.resolve([
        { id: 35, name: 'Comedy' },
        { id: 28, name: 'Action' }
      ]);
    });
    (fetchDiscoverTv as jest.Mock).mockImplementation((options: { withOriginalLanguage?: string }) => {
      const byLanguage: Record<string, any[]> = {
        ko: [{ id: 31, tmdb_id: '31', media_type: 'tv', title: 'K-Drama Hit', year: '2024', overview: '', poster_url: '', backdrop_url: '/ko.jpg', rating: 8.8, genre_ids: [18] }],
        ja: [{ id: 32, tmdb_id: '32', media_type: 'tv', title: 'Japanese Drama', year: '2023', overview: '', poster_url: '', backdrop_url: '/ja.jpg', rating: 8.3, genre_ids: [18] }],
        zh: [{ id: 33, tmdb_id: '33', media_type: 'tv', title: 'Chinese Series', year: '2022', overview: '', poster_url: '', backdrop_url: '/zh.jpg', rating: 8.1, genre_ids: [18] }],
        th: [{ id: 34, tmdb_id: '34', media_type: 'tv', title: 'Thai Drama', year: '2023', overview: '', poster_url: '', backdrop_url: '/th.jpg', rating: 8.0, genre_ids: [18] }]
      };
      return Promise.resolve(byLanguage[options?.withOriginalLanguage || ''] || []);
    });
    (fetchByGenre as jest.Mock).mockResolvedValue([
      { id: 99, tmdb_id: '99', media_type: 'movie', title: 'Genre Match', year: '2018', overview: '', poster_url: '', backdrop_url: '/gm.jpg', rating: 7.3, genre_ids: [28] }
    ]);

    const snapshot = await loadDiscoverySnapshot();

    expect(snapshot.heroItems.map((x) => x.id)).toEqual([1]);
    expect(snapshot.sections).toHaveLength(6);
    expect(snapshot.sections[0].title).toBe('Trending Movies');
    expect(snapshot.sections[1].title).toBe('Upcoming');
    expect(snapshot.sections[2].title).toBe('Now Playing');
    expect(snapshot.sections[3].title).toBe('Top Rated Movies & Series');
    expect(snapshot.sections[4].title).toBe('Global Web Series and TV Shows');
    expect(snapshot.sections[5].title).toBe('K-Drama and Asian Series');
    expect(snapshot.sections[0].items.map((x) => x.id)).toEqual([3, 51, 52, 53]);
    expect(snapshot.sections[2].items.map((x) => x.id)).toEqual([42]);
    expect(snapshot.sections[3].items.map((x) => x.id)).toEqual([20, 13]);
    expect(snapshot.sections[4].items.map((x) => x.id)).toEqual([12, 10, 11]);
    expect(snapshot.sections[5].items.map((x) => x.id)).toEqual([31, 32, 33, 34]);

    const titlesAcrossSections = snapshot.sections.flatMap((section) => section.items.map((item) => item.title.toLowerCase()));
    expect(new Set(titlesAcrossSections).size).toBe(titlesAcrossSections.length);
    expect(snapshot.movieGenres).toEqual([
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' }
    ]);
    expect(snapshot.selectedGenre).toEqual({ id: 28, name: 'Action' });
    expect(fetchByGenre).toHaveBeenCalledWith(28, 'movie', { signal: undefined });
    expect(snapshot.selectedGenreItems[0].title).toBe('Genre Match');
  });
});



================================================
FILE: __tests__/integration/discoveryDetailsFlow.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import aiHandler from '../../api/ai';

describe('integration discovery details flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'test-key';
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.TMDB_READ_TOKEN;
  });

  it('returns detailed movie payload by direct tmdb id/media_type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 550,
        title: 'Fight Club',
        release_date: '1999-10-15',
        overview: 'An insomniac forms an underground fight club.',
        genres: [{ id: 18, name: 'Drama' }],
        poster_path: '/fight.jpg',
        backdrop_path: '/fight-bg.jpg',
        vote_average: 8.4,
        credits: {
          cast: [
            { name: 'Brad Pitt', character: 'Tyler Durden', known_for_department: 'Acting' }
          ],
          crew: [
            { name: 'David Fincher', job: 'Director' }
          ]
        },
        videos: { results: [] },
        images: { backdrops: [], posters: [] },
        recommendations: { results: [] },
        'watch/providers': { results: {} }
      })
    });

    const req = createRequest({
      method: 'GET',
      query: { action: 'details', id: '550', media_type: 'movie', provider: 'groq' },
      headers: { host: 'localhost:3000' }
    });
    const res = createResponse();

    await aiHandler(req as any, res as any);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.title).toBe('Fight Club');
    expect(data.tmdb_id).toBe('550');
    expect(data.media_type).toBe('movie');
    expect(data.type).toBe('movie');
    expect(Array.isArray(data.cast)).toBe(true);
    expect(data.cast[0].name).toBe('Brad Pitt');
    expect(data.summary_medium).toContain('insomniac');
  });
});



================================================
FILE: __tests__/integration/personSearchFlow.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import resolveEntityHandler from '../../api/resolveEntity';
import personHandler from '../../api/person/[id]';

describe('integration person search flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('supports shortlist then loads selected person profile', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 10, name: 'Chris Evans', popularity: 80, known_for_department: 'Acting', known_for: [{ title: 'Avengers' }] },
            { id: 11, name: 'Chris Hemsworth', popularity: 79, known_for_department: 'Acting', known_for: [{ title: 'Thor' }] }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          name: 'Chris Evans',
          biography: 'Bio',
          profile_path: '/cevans.jpg'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cast: [{ id: 100, media_type: 'movie', title: 'Captain America', release_date: '2011-07-22', character: 'Steve Rogers', poster_path: '/cap.jpg' }],
          crew: []
        })
      });

    const resolveReq = createRequest({ method: 'GET', query: { q: 'Chris' } });
    const resolveRes = createResponse();
    await resolveEntityHandler(resolveReq as any, resolveRes as any);

    const resolved = resolveRes._getJSONData();
    expect(resolved.confidence_band).toBe('shortlist');
    expect(resolved.shortlisted[0].id).toBe(10);

    const personReq = createRequest({ method: 'GET', query: { id: String(resolved.shortlisted[0].id) } });
    const personRes = createResponse();
    await personHandler(personReq as any, personRes as any);

    const profile = personRes._getJSONData();
    expect(personRes.statusCode).toBe(200);
    expect(profile.person.name).toBe('Chris Evans');
    expect(Array.isArray(profile.credits_all)).toBe(true);
    expect(profile.filmography[0].title).toBe('Captain America');
  });

  it('prioritizes role-qualified person query as confident person result', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 200, title: 'Director', popularity: 1 }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 99, name: 'Christopher Nolan', popularity: 150, known_for_department: 'Directing', known_for: [{ title: 'Inception' }] }
          ]
        })
      });

    const req = createRequest({ method: 'GET', query: { q: 'director christopher nolan' } });
    const res = createResponse();
    await resolveEntityHandler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('person');
    expect(data.confidence_band).toBe('confident');
    expect(data.chosen).toEqual({ id: 99, name: 'Christopher Nolan', type: 'person' });
  });
});



================================================
FILE: __tests__/integration/userJourneySmoke.test.ts
================================================
import { createRequest, createResponse } from 'node-mocks-http';
import { QueryComplexity, MovieData } from '../../types';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../services/cacheService', () => ({
  getCachedResponse: jest.fn().mockReturnValue(null),
  cacheResponse: jest.fn(),
  clearOldCacheEntries: jest.fn()
}));

jest.mock('../../services/indexedDBService', () => ({
  getFromIndexedDB: jest.fn().mockResolvedValue(null),
  saveToIndexedDB: jest.fn(),
  clearOldIndexedDBEntries: jest.fn()
}));

jest.mock('../../services/queryParser', () => ({
  parseQuery: jest.fn().mockImplementation((q: string) => ({ originalQuery: q, title: q, year: '', type: 'movie' })),
  shouldUseComplexModel: jest.fn().mockReturnValue(false)
}));

jest.mock('../../services/hybridDataService', () => ({
  fetchFromBestSource: jest.fn()
}));

jest.mock('../../services/perplexityService', () => ({
  searchWithPerplexity: jest.fn().mockResolvedValue(null),
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: null, sources: null, error: 'perplexity unavailable' })
}));

jest.mock('../../services/groqService', () => ({
  fetchMovieData: jest.fn()
}));

jest.mock('../../services/mistralService', () => ({
  fetchMovieData: jest.fn()
}));

jest.mock('../../services/openrouterService', () => ({
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: null, sources: null, error: 'openrouter unavailable' })
}));

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/serpApiService', () => ({
  searchSerpApi: jest.fn().mockResolvedValue([])
}));

jest.mock('../../services/tmdbService', () => ({
  fetchSimilarTitles: jest.fn().mockResolvedValue([])
}));

import aiHandler from '../../api/ai';
import { fetchMovieData } from '../../services/aiService';
import { fetchMovieData as fetchFromGroq } from '../../services/groqService';
import { fetchMovieData as fetchFromMistral } from '../../services/mistralService';
import { fetchFromBestSource } from '../../services/hybridDataService';
import { buildBalancedMixRow, dedupeSectionsByTitle } from '../../hooks/useDiscovery';
import {
  addFolderToWatchlists,
  saveMovieToFolder,
  saveWatchlistsToStorage,
  loadWatchlistsFromStorage,
  findFolderItem
} from '../../hooks/watchlistStore';

function makeMovie(title: string): MovieData {
  return {
    tmdb_id: '27205',
    title,
    year: '2010',
    type: 'movie',
    media_type: 'movie',
    genres: ['Sci-Fi'],
    poster_url: 'https://img/p.jpg',
    backdrop_url: 'https://img/b.jpg',
    trailer_url: '',
    ratings: [{ source: 'TMDB', score: '88%' }],
    cast: [{ name: 'Leonardo DiCaprio', role: 'Cobb', known_for: 'Inception' }],
    crew: { director: 'Christopher Nolan', writer: 'Christopher Nolan', music: 'Hans Zimmer' },
    summary_short: 'A thief enters dreams.',
    summary_medium: 'A skilled thief steals secrets through dream-sharing technology.',
    summary_long_spoilers: '',
    suspense_breaker: '',
    where_to_watch: [],
    extra_images: [],
    ai_notes: ''
  };
}

describe('integration smoke: user journey and provider fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('covers search -> disambiguation -> details -> watchlist save/load', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 27205,
            title: 'Inception',
            media_type: 'movie',
            overview: 'Dream heist',
            popularity: 99,
            release_date: '2010-07-16',
            poster_path: '/inception.jpg'
          },
          {
            id: 123,
            title: 'Inception: The Cobol Job',
            media_type: 'movie',
            overview: 'Animated prequel',
            popularity: 20,
            release_date: '2010-12-07',
            poster_path: '/cobol.jpg'
          }
        ]
      })
    });

    const searchReq = createRequest({ method: 'GET', query: { action: 'search', q: 'Inception' }, headers: { host: 'localhost:3000' } });
    const searchRes = createResponse();
    await aiHandler(searchReq as any, searchRes as any);

    const searchData = searchRes._getJSONData();
    expect(searchRes.statusCode).toBe(200);
    expect(searchData.ok).toBe(true);
    expect(searchData.total).toBeGreaterThan(1);
    expect(searchData.results[0].title).toContain('Inception');

    const selectReq = createRequest({ method: 'GET', query: { action: 'selectModel', type: 'movie', title: 'Inception' }, headers: { host: 'localhost:3000' } });
    const selectRes = createResponse();
    await aiHandler(selectReq as any, selectRes as any);
    const selectData = selectRes._getJSONData();
    expect(selectRes.statusCode).toBe(200);
    expect(selectData.ok).toBe(true);
    expect(selectData.selectedModel).toBeTruthy();

    (fetchFromBestSource as jest.Mock).mockResolvedValueOnce({
      data: makeMovie('Inception'),
      source: 'tmdb',
      confidence: 0.95
    });
    (fetchFromGroq as jest.Mock).mockResolvedValueOnce({
      movieData: {
        summary_short: 'A dream-thief accepts an impossible task.',
        summary_medium: 'Dom Cobb must plant an idea inside a target mind.',
        summary_long_spoilers: 'Spoilers...',
        suspense_breaker: 'The ending remains debated.',
        ai_notes: 'Creative overlay.'
      },
      sources: null
    });

    const details = await fetchMovieData('Inception', QueryComplexity.SIMPLE, 'groq');
    expect(details.movieData).toBeTruthy();
    expect(details.movieData?.title).toBe('Inception');
    expect(details.movieData?.summary_short).toContain('dream-thief');

    let folders: any[] = [];
    const add = addFolderToWatchlists(folders, 'Weekend Picks', '#7c3aed');
    expect(add.folderId).toBeTruthy();
    folders = saveMovieToFolder(add.next, add.folderId as string, details.movieData as MovieData, 'Inception (Saved)');

    const memoryStorage = {
      data: {} as Record<string, string>,
      getItem(key: string) {
        return this.data[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.data[key] = value;
      }
    };

    saveWatchlistsToStorage(memoryStorage as any, folders);
    const loaded = loadWatchlistsFromStorage(memoryStorage as any);
    expect(loaded.length).toBe(1);
    expect(loaded[0].items.length).toBe(1);

    const found = findFolderItem(loaded, loaded[0].id, loaded[0].items[0].id);
    expect(found?.item.saved_title).toBe('Inception (Saved)');
    expect(found?.item.movie.title).toBe('Inception');
  });

  it('falls back from Groq to Mistral when Groq fails', async () => {
    (fetchFromBestSource as jest.Mock).mockResolvedValueOnce({
      data: makeMovie('Interstellar'),
      source: 'tmdb',
      confidence: 0.94
    });

    (fetchFromGroq as jest.Mock).mockResolvedValueOnce({
      movieData: null,
      sources: null,
      error: 'Groq unavailable'
    });

    (fetchFromMistral as jest.Mock).mockResolvedValueOnce({
      movieData: {
        summary_short: 'A team travels through a wormhole to save humanity.',
        summary_medium: 'Earth is dying, and astronauts seek a new home.',
        summary_long_spoilers: '',
        suspense_breaker: '',
        ai_notes: 'Mistral fallback used.'
      },
      sources: null
    });

    const result = await fetchMovieData('Interstellar', QueryComplexity.SIMPLE, 'groq');

    expect(fetchFromGroq).toHaveBeenCalled();
    expect(fetchFromMistral).toHaveBeenCalled();
    expect(result.provider).toBe('mistral');
    expect(result.movieData?.title).toBe('Interstellar');
    expect(result.movieData?.summary_short).toContain('wormhole');
  });

  it('keeps dashboard mixes deterministic and globally de-duplicated', () => {
    const mixed = buildBalancedMixRow(
      6,
      {
        global: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Global One', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Global Two', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Global Three', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ],
        bollywood: [
          { id: 11, tmdb_id: '11', media_type: 'movie', title: 'Bollywood One', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ],
        asian: [
          { id: 21, tmdb_id: '21', media_type: 'movie', title: 'Asian One', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      },
      [
        { pool: 'global', ratio: 0.7 },
        { pool: 'bollywood', ratio: 0.15 },
        { pool: 'asian', ratio: 0.15 }
      ]
    );

    const dedupedSections = dedupeSectionsByTitle([
      { key: 'first', title: 'First', items: mixed },
      {
        key: 'second',
        title: 'Second',
        items: [
          { id: 30, tmdb_id: '30', media_type: 'movie', title: 'Global Two', year: '2025', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 31, tmdb_id: '31', media_type: 'movie', title: 'Second Unique', year: '2025', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      }
    ]);

    expect(mixed.map((item) => item.title)).toEqual([
      'Global One',
      'Global Two',
      'Global Three',
      'Bollywood One',
      'Asian One'
    ]);
    expect(dedupedSections[1].items.map((item) => item.title)).toEqual(['Second Unique']);
  });
});


================================================
FILE: __tests__/lib/cache.test.ts
================================================
jest.mock('redis', () => {
  const store: Record<string, { value: string; ex?: number }> = {};
  return {
    createClient: () => ({
      connect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn((key: string) => Promise.resolve(store[key]?.value || null)),
      set: jest.fn((key: string, value: string, opts?: { EX?: number }) => {
        store[key] = { value, ex: opts?.EX };
        return Promise.resolve('OK');
      })
    })
  };
});

process.env.REDIS_URL = 'redis://localhost:6379';

// Dynamic import after mock
let cacheModule: typeof import('../../lib/cache');

beforeAll(async () => {
  cacheModule = await import('../../lib/cache');
});

describe('lib/cache', () => {
  it('setCache stores and getCache retrieves', async () => {
    await cacheModule.setCache('test-key', { foo: 'bar' }, 60);
    const result = await cacheModule.getCache('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('withCacheKey generates stable key', () => {
    const k1 = cacheModule.withCacheKey('prefix', { a: 1, b: 2 });
    const k2 = cacheModule.withCacheKey('prefix', { b: 2, a: 1 });
    expect(k1).toBe(k2);
  });
});



================================================
FILE: __tests__/services/ai.test.ts
================================================
// Mock provider fetch calls
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../services/groqService', () => ({
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: { summary_short: 'Short', summary_long: 'Long' }, sources: null, provider: 'groq' })
}));

jest.mock('../services/mistralService', () => ({
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: null, sources: null, error: 'Mistral failed' })
}));

jest.mock('../services/openrouterService', () => ({
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: null, sources: null, error: 'OpenRouter failed' })
}));

import { generateSummary, parseJsonResponse } from '../../services/ai';

describe('services/ai', () => {
  it('parseJsonResponse extracts JSON from fenced code block', () => {
    const raw = '```json\n{"foo":"bar"}\n```';
    const result = parseJsonResponse(raw);
    expect(result).toEqual({ foo: 'bar' });
  });

  it('parseJsonResponse handles plain JSON', () => {
    const raw = '{"a":1}';
    const result = parseJsonResponse(raw);
    expect(result).toEqual({ a: 1 });
  });

  it('generateSummary returns json from first successful provider', async () => {
    const result = await generateSummary({ evidence: 'test', query: 'test', schema: { summary_short: 'string' }, timeoutMs: 5000 });
    // Our mock groqService returns movieData, which generateSummary should capture
    expect(result.ok).toBe(true);
  });
});



================================================
FILE: __tests__/services/movieDataValidation.test.ts
================================================
import { hasDisplayableTitle, sanitizeMovieData } from '../../services/movieDataValidation';

describe('services/movieDataValidation', () => {
  it('returns null for non-object input', () => {
    expect(sanitizeMovieData(null)).toBeNull();
    expect(sanitizeMovieData(undefined)).toBeNull();
    expect(sanitizeMovieData('bad')).toBeNull();
  });

  it('normalizes loose AI payload safely', () => {
    const payload = {
      title: 'Interstellar',
      year: 2014,
      type: 'unknown',
      genres: ['Sci-Fi', 42, '', null],
      cast: [{ name: 'Matthew McConaughey', role: 'Cooper' }, { foo: 'bar' }],
      crew: { director: 'Christopher Nolan' },
      where_to_watch: [{ platform: 'Prime Video', link: 123, type: 'invalid' }],
      ratings: [{ source: 'IMDb', score: 8.7 }, {}],
      poster_url: null,
      backdrop_url: undefined,
      trailer_url: 12,
      summary_short: 'Short',
      summary_medium: 'Medium',
      summary_long_spoilers: 'Long',
      suspense_breaker: '',
      extra_images: ['https://image.tmdb.org/a.jpg', 100],
      ai_notes: 'Notes'
    };

    const sanitized = sanitizeMovieData(payload);
    expect(sanitized).not.toBeNull();
    expect(sanitized?.title).toBe('Interstellar');
    expect(sanitized?.year).toBe('2014');
    expect(sanitized?.type).toBe('movie');
    expect(sanitized?.genres).toEqual(['Sci-Fi', '42']);
    expect(sanitized?.cast[0].name).toBe('Matthew McConaughey');
    expect(sanitized?.crew.director).toBe('Christopher Nolan');
    expect(sanitized?.where_to_watch[0].type).toBe('subscription');
    expect(sanitized?.ratings[0].score).toBe('8.7');
  });

  it('hasDisplayableTitle validates title safely', () => {
    expect(hasDisplayableTitle(null)).toBe(false);
    expect(hasDisplayableTitle(sanitizeMovieData({ title: '   ' }) as any)).toBe(false);
    expect(hasDisplayableTitle(sanitizeMovieData({ title: 'Dune', year: '2021' }) as any)).toBe(true);
  });
});



================================================
FILE: __tests__/services/personIntent.test.ts
================================================
import { parsePersonIntent, resolveRoleMatch } from '../../services/personIntent';

describe('personIntent', () => {
  it('parses director intent and year from mixed query', () => {
    const parsed = parsePersonIntent('best director Christopher Nolan 2010 movies');

    expect(parsed.requested_role).toBe('director');
    expect(parsed.year).toBe('2010');
    expect(parsed.is_person_focused).toBe(true);
    expect(parsed.tokens).toEqual(expect.arrayContaining(['christopher', 'nolan']));
  });

  it('parses actress intent and keeps person-focused signal', () => {
    const parsed = parsePersonIntent('actress emma stone');

    expect(parsed.requested_role).toBe('actress');
    expect(parsed.is_person_focused).toBe(true);
    expect(parsed.tokens).toEqual(expect.arrayContaining(['emma', 'stone']));
  });

  it('keeps role as any when no role cues are present', () => {
    const parsed = parsePersonIntent('Interstellar cast');

    expect(parsed.requested_role).toBe('any');
    expect(parsed.tokens).toEqual(expect.arrayContaining(['interstellar', 'cast']));
  });

  it('classifies role match against known-for department', () => {
    expect(resolveRoleMatch('director', 'Directing')).toBe('match');
    expect(resolveRoleMatch('actor', 'Acting')).toBe('match');
    expect(resolveRoleMatch('director', 'Acting')).toBe('mismatch');
    expect(resolveRoleMatch('any', 'Acting')).toBe('neutral');
  });
});



================================================
FILE: __tests__/services/personPresentation.test.ts
================================================
import {
  buildPersonCardPresentation,
  formatKnownForSnippet,
  sortPersonShortlist
} from '../../services/personPresentation';

describe('personPresentation', () => {
  it('builds role chip and known-for snippet from TMDB fields', () => {
    const card = buildPersonCardPresentation({
      name: 'Christopher Nolan',
      known_for_department: 'Directing',
      known_for_titles: ['Inception', 'Interstellar', 'Dunkirk']
    });

    expect(card.roleChip).toBe('Directing');
    expect(card.snippet).toContain('Inception');
  });

  it('uses fallback snippet when known_for_titles are missing', () => {
    const snippet = formatKnownForSnippet({ known_for: 'Known for dramatic biopics and action thrillers' });
    expect(snippet).toContain('Known for dramatic biopics');
  });

  it('sorts shortlist by confidence, role match, then popularity', () => {
    const sorted = sortPersonShortlist([
      { id: 1, score: 0.7, role_match: 'neutral', popularity: 90 },
      { id: 2, score: 0.7, role_match: 'match', popularity: 10 },
      { id: 3, score: 0.82, role_match: 'mismatch', popularity: 10 }
    ]);

    expect((sorted as any[]).map((item) => item.id)).toEqual([3, 2, 1]);
  });
});



================================================
FILE: __tests__/services/suggestInteraction.test.ts
================================================
import { getNextHighlightIndex, inferInteractionIntent, resolveEnterAction } from '../../services/suggestInteraction';

describe('suggestInteraction', () => {
  it('cycles highlight index forward and backward', () => {
    expect(getNextHighlightIndex(-1, 'next', 3)).toBe(0);
    expect(getNextHighlightIndex(0, 'next', 3)).toBe(1);
    expect(getNextHighlightIndex(2, 'next', 3)).toBe(0);

    expect(getNextHighlightIndex(-1, 'prev', 3)).toBe(2);
    expect(getNextHighlightIndex(0, 'prev', 3)).toBe(2);
  });

  it('selects highlighted item when present', () => {
    expect(
      resolveEnterAction({
        highlightedIndex: 1,
        suggestionsCount: 3,
        topConfidence: 0.1
      })
    ).toBe('select_highlighted');
  });

  it('auto-selects top candidate only when confidence is high', () => {
    expect(
      resolveEnterAction({
        highlightedIndex: -1,
        suggestionsCount: 3,
        topConfidence: 0.9
      })
    ).toBe('select_top');

    expect(
      resolveEnterAction({
        highlightedIndex: -1,
        suggestionsCount: 3,
        topConfidence: 0.6
      })
    ).toBe('prompt_inline_selection');
  });

  it('falls back to normal submit with no suggestions', () => {
    expect(
      resolveEnterAction({
        highlightedIndex: -1,
        suggestionsCount: 0,
        topConfidence: 0
      })
    ).toBe('submit_query');
  });

  it('infers stricter interaction intent when person cues or year are typed', () => {
    const personIntent = inferInteractionIntent('director christopher nolan');
    expect(personIntent.prefersPersonResult).toBe(true);
    expect(personIntent.confidenceThreshold).toBeGreaterThanOrEqual(0.88);

    const yearIntent = inferInteractionIntent('dune 2021');
    expect(yearIntent.typedYear).toBe('2021');
    expect(yearIntent.prefersExactTitle).toBe(true);
  });
});



================================================
FILE: __tests__/services/suggestRanking.test.ts
================================================
import { rankSuggestCandidates } from '../../services/suggestRanking';

describe('rankSuggestCandidates', () => {
  it('orders exact match before starts-with and partial', () => {
    const ranked = rankSuggestCandidates('Fresh', [
      {
        id: 1,
        title: 'Fresh',
        media_type: 'movie',
        type: 'movie',
        popularity: 10
      },
      {
        id: 2,
        title: 'Fresh Prince',
        media_type: 'tv',
        type: 'show',
        popularity: 50
      },
      {
        id: 3,
        title: 'Super Fresh Vibes',
        media_type: 'movie',
        type: 'movie',
        popularity: 100
      }
    ]);

    expect(ranked[0].title).toBe('Fresh');
    expect(ranked[1].title).toBe('Fresh Prince');
    expect(ranked[2].title).toBe('Super Fresh Vibes');
  });

  it('boosts matching year when typed', () => {
    const ranked = rankSuggestCandidates('Dune 2021', [
      {
        id: 11,
        title: 'Dune',
        media_type: 'movie',
        type: 'movie',
        year: '1984',
        popularity: 60
      },
      {
        id: 12,
        title: 'Dune',
        media_type: 'movie',
        type: 'movie',
        year: '2021',
        popularity: 1
      }
    ]);

    expect(ranked[0].year).toBe('2021');
  });

  it('boosts person candidates when query is person-focused with role cues', () => {
    const ranked = rankSuggestCandidates('director christopher nolan', [
      {
        id: 201,
        title: 'Christopher Nolan',
        media_type: 'person',
        type: 'person',
        popularity: 45,
        known_for_department: 'Directing',
        known_for_titles: ['Inception', 'Interstellar']
      },
      {
        id: 202,
        title: 'Christopher',
        media_type: 'movie',
        type: 'movie',
        popularity: 80
      }
    ]);

    expect(ranked[0].type).toBe('person');
    expect(ranked[0].title).toBe('Christopher Nolan');
  });

  it('penalizes person role mismatch without hard-excluding candidate', () => {
    const ranked = rankSuggestCandidates('director greta', [
      {
        id: 301,
        title: 'Greta Gerwig',
        media_type: 'person',
        type: 'person',
        popularity: 30,
        known_for_department: 'Directing'
      },
      {
        id: 302,
        title: 'Greta Lee',
        media_type: 'person',
        type: 'person',
        popularity: 30,
        known_for_department: 'Acting'
      }
    ]);

    expect(ranked.map((item) => item.title)).toEqual(['Greta Gerwig', 'Greta Lee']);
    expect(ranked[1].score).toBeGreaterThan(0);
  });
});



================================================
FILE: __tests__/services/tmdbDiscovery.test.ts
================================================
import {
  fetchByGenre,
  fetchGenreList,
  fetchNowPlaying,
  fetchOnTheAir,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming
} from '../../services/tmdbService';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function okJson(payload: any) {
  return {
    ok: true,
    json: async () => payload
  };
}

function getCalledUrl(index = 0): URL {
  const raw = mockFetch.mock.calls[index]?.[0];
  return new URL(String(raw));
}

describe('tmdb discovery service helpers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_PROXY = 'http://localhost:3000/api/tmdb';
  });

  it('normalizes trending all titles and filters unsupported media types', async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      results: [
        {
          id: 10,
          media_type: 'movie',
          title: 'Dune',
          release_date: '2021-10-22',
          overview: 'Spice and prophecy.',
          poster_path: '/dune.jpg',
          backdrop_path: '/dune-bg.jpg',
          vote_average: 8.3,
          genre_ids: [878, 12]
        },
        {
          id: 11,
          media_type: 'tv',
          name: 'The Last of Us',
          first_air_date: '2023-01-15',
          overview: 'Survival in a fungal apocalypse.',
          poster_path: '/tlou.jpg',
          backdrop_path: '/tlou-bg.jpg',
          vote_average: 8.8,
          genre_ids: [18]
        },
        {
          id: 12,
          media_type: 'person',
          name: 'Pedro Pascal'
        }
      ]
    }));

    const items = await fetchTrending('all', 'week');

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: 10,
      tmdb_id: '10',
      media_type: 'movie',
      title: 'Dune',
      year: '2021',
      rating: 8.3,
      genre_ids: [878, 12]
    });
    expect(items[1]).toMatchObject({
      id: 11,
      media_type: 'tv',
      title: 'The Last of Us',
      year: '2023'
    });

    const url = getCalledUrl();
    expect(url.searchParams.get('endpoint')).toBe('trending/all/week');
  });

  it('calls popular, top rated, upcoming, now playing, and on the air endpoints', async () => {
    mockFetch
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }));

    await fetchPopular('tv');
    await fetchTopRated('movie');
    await fetchUpcoming();
    await fetchNowPlaying();
    await fetchOnTheAir();

    expect(getCalledUrl(0).searchParams.get('endpoint')).toBe('tv/popular');
    expect(getCalledUrl(1).searchParams.get('endpoint')).toBe('movie/top_rated');
    expect(getCalledUrl(2).searchParams.get('endpoint')).toBe('movie/upcoming');
    expect(getCalledUrl(3).searchParams.get('endpoint')).toBe('movie/now_playing');
    expect(getCalledUrl(4).searchParams.get('endpoint')).toBe('tv/on_the_air');
  });

  it('passes with_genres for discover requests and normalizes genres list', async () => {
    mockFetch
      .mockResolvedValueOnce(okJson({
        results: [
          {
            id: 99,
            media_type: 'movie',
            title: 'Mad Max: Fury Road',
            release_date: '2015-05-15',
            poster_path: '/mm.jpg',
            backdrop_path: '/mm-bg.jpg',
            vote_average: 8.1,
            overview: '',
            genre_ids: [28, 12]
          }
        ]
      }))
      .mockResolvedValueOnce(okJson({
        genres: [
          { id: 28, name: 'Action' },
          { id: 35, name: 'Comedy' },
          { id: null, name: 'Bad' },
          { id: 99, name: '' }
        ]
      }));

    const discovered = await fetchByGenre(28, 'movie');
    const genreList = await fetchGenreList('movie');

    expect(discovered[0]).toMatchObject({ id: 99, title: 'Mad Max: Fury Road' });
    expect(genreList).toEqual([
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' }
    ]);

    expect(getCalledUrl(0).searchParams.get('endpoint')).toBe('discover/movie');
    expect(getCalledUrl(0).searchParams.get('with_genres')).toBe('28');
    expect(getCalledUrl(1).searchParams.get('endpoint')).toBe('genre/movie/list');
  });
});



================================================
FILE: api/README.md
================================================
# Serverless API Proxy

This directory contains Vercel serverless functions that act as a secure backend proxy for API requests.

## OpenRouter Proxy (`/api/openrouter`)

### Why?
OpenRouter's API has CORS restrictions that prevent direct browser calls. This proxy:
- Runs on the backend (Vercel Edge Functions)
- Keeps your API key secure (server-side only)
- Bypasses CORS issues

### Setup for Vercel Deployment

1. **Install Vercel CLI** (if not already):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Add Environment Variable**:
   ```bash
   vercel env add OPENROUTER_API_KEY
   ```
   When prompted, paste your OpenRouter API key.

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Local Development

To test the proxy locally:

1. **Install Vercel CLI** (if not done):
   ```bash
   npm i -g vercel
   ```

2. **Run Vercel dev server**:
   ```bash
   vercel dev
   ```

3. **In another terminal, start Vite**:
   ```bash
   npm run dev
   ```

The proxy will be available at `http://localhost:3000/api/openrouter`.

### How It Works

**Client** → `/api/openrouter` (Vercel Function) → **OpenRouter API** → **Response back to client**

- Client sends: `{ model, messages, max_tokens, temperature }`
- Proxy adds: `Authorization: Bearer <API_KEY>` (from env)
- Proxy returns: OpenRouter's JSON response

### Environment Variables

Make sure these are set in:
- **Vercel Dashboard**: Project Settings → Environment Variables
- **Local `.env.local`**: For local development (if using `vercel dev`)

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### Troubleshooting

**Error: "OpenRouter API key not configured"**
- Solution: Add `OPENROUTER_API_KEY` to Vercel environment variables

**Error: 502 Bad Gateway**
- Solution: Check Vercel function logs in dashboard

**Error: "Failed to fetch"**
- Solution: Ensure Vercel deployment is live and URL is correct



================================================
FILE: api/ai.ts
================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { searchPerplexity } from '../services/perplexityService';
import { searchSerpApi } from '../services/serpApiService';
import { CREATIVE_ONLY_PROMPT } from '../constants';
import { MovieData } from '../types';
import { fetchSimilarTitles } from '../services/tmdbService';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
// Note: generateSummary is client-side code, cannot be imported in serverless functions
// import { generateSummary } from '../services/ai';

// ============================================================================
// UNIFIED API ENDPOINT: /api/ai?action=search|parse|selectModel
// ============================================================================

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  image?: string;
  type: 'movie' | 'person' | 'review';
  confidence: number;
  year?: string;
  language?: string;
  media_type?: string;
}

// Parse complex queries like "RRR Telugu 2022", "Malayalum movie Ponniyin Selvan 1987"
function parseComplexQuery(q: string): {
  title: string;
  year?: string;
  language?: string;
  genre?: string;
  isComplex: boolean;
} {
  let title = q.trim();
  let year: string | undefined;
  let language: string | undefined;
  let genre: string | undefined;
  let isComplex = false;

  // Regional language detection
  const regionalMap: Record<string, string> = {
    malayalam: 'Malayalam',
    tamil: 'Tamil',
    telugu: 'Telugu',
    kannada: 'Kannada',
    hindi: 'Hindi',
    bengali: 'Bengali',
    marathi: 'Marathi',
    gujarati: 'Gujarati',
    punjabi: 'Punjabi',
    mollywood: 'Malayalam',
    kollywood: 'Tamil',
    tollywood: 'Telugu',
    sandalwood: 'Kannada',
    bollywood: 'Hindi',
  };

  // Extract year (4 digits)
  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = yearMatch[0];
    title = title.replace(yearMatch[0], '').trim();
    isComplex = true;
  }

  // Extract language
  for (const [keyword, lang] of Object.entries(regionalMap)) {
    if (title.toLowerCase().includes(keyword)) {
      language = lang;
      title = title.replace(new RegExp(keyword, 'gi'), '').trim();
      isComplex = true;
      break;
    }
  }

  // Extract genre keywords
  const genreKeywords = ['action', 'comedy', 'drama', 'thriller', 'horror', 'romance', 'sci-fi', 'fantasy', 'animation', 'documentary'];
  for (const g of genreKeywords) {
    if (title.toLowerCase().includes(g)) {
      genre = g;
      title = title.replace(new RegExp(g, 'gi'), '').trim();
      isComplex = true;
      break;
    }
  }

  // Remove "movie" keyword
  title = title.replace(/\b(movie|film|series|show)\b/gi, '').trim();

  return { title, year, language, genre, isComplex };
}

// Build optimized DuckDuckGo search query
function buildSearchQuery(parsed: ReturnType<typeof parseComplexQuery>): string {
  let searchQuery = parsed.title;

  if (parsed.language) {
    searchQuery += ` ${parsed.language}`;
  }

  if (parsed.year) {
    searchQuery += ` ${parsed.year}`;
  }

  if (parsed.genre) {
    searchQuery += ` ${parsed.genre}`;
  }

  searchQuery += ' movie cast';

  return searchQuery;
}

// Search using TMDB API - more reliable than DuckDuckGo scraping
async function searchTMDB(title: string, limit = 6): Promise<SearchResult[]> {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) {
      console.warn('[api] TMDB_API_KEY not set, using DuckDuckGo fallback');
      return [];
    }

    const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&page=1`;
    const response = await fetch(url);
    const data: any = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.log('[api] no TMDB results');
      return [];
    }

    return data.results.slice(0, limit).map((item: any) => {
      const name = item.title || item.name || '';
      const mediaType = item.media_type || 'movie';
      const type: 'movie' | 'person' | 'review' = mediaType === 'person' ? 'person' : 'movie';

      return {
        id: item.id,
        title: name,
        snippet: item.overview || item.known_for_department || '',
        url: `https://www.tmdb.org/${mediaType}/${item.id}`,
        type,
        confidence: item.popularity ? Math.min(item.popularity / 100, 1) : 0.7,
        year: item.release_date ? item.release_date.substring(0, 4) : undefined,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : (item.profile_path ? `https://image.tmdb.org/t/p/w500${item.profile_path}` : undefined),
        media_type: mediaType
      };
    });
  } catch (error) {
    console.error('TMDB search error:', error);
    return [];
  }
}

// Scrape DuckDuckGo search results - PROVEN WORKING VERSION
// Search using SerpApi - Google Search Results (High Accuracy)
async function searchWeb(query: string, limit = 6): Promise<SearchResult[]> {
  try {
    const serpResults = await searchSerpApi(query, limit);

    return serpResults.map(item => {
      let type: 'movie' | 'person' | 'review' = 'movie';
      if (item.type === 'person') type = 'person';
      if (item.type === 'review') type = 'review';

      // Boost confidence for Knowledge Graph items or official sources
      let confidence = 0.7;
      if (item.link.includes('imdb.com')) confidence = 0.95;
      if (item.link.includes('wikipedia.org')) confidence = 0.9;
      if (item.link.includes('rotten') || item.link.includes('letterboxd')) confidence = 0.85;

      return {
        title: item.title,
        snippet: item.snippet,
        url: item.link,
        image: item.thumbnail,
        type,
        confidence: Math.min(confidence, 1),
        year: item.year,
        language: undefined
      };
    });
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

function extractYear(text: string): string | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

function extractLanguage(text: string): string | undefined {
  const languages: Record<string, string> = {
    malayalam: 'Malayalam',
    tamil: 'Tamil',
    telugu: 'Telugu',
    kannada: 'Kannada',
    hindi: 'Hindi'
  };

  for (const [keyword, lang] of Object.entries(languages)) {
    if (text.toLowerCase().includes(keyword)) {
      return lang;
    }
  }
  return undefined;
}

// Detect result type from text
function detectResultType(text: string): 'movie' | 'person' | 'review' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('actor') || lowerText.includes('director') || lowerText.includes('actress')) {
    return 'person';
  }
  if (lowerText.includes('review') || lowerText.includes('rating')) {
    return 'review';
  }
  return 'movie';
}

function detectQueryType(
  title: string,
  type: 'movie' | 'person' | 'review'
): 'movie' | 'person' | 'review' | 'complex' {
  if (type === 'review') return 'review';
  if (type === 'person') return 'person';

  const complexKeywords = [
    'production',
    'budget',
    'box office',
    'awards',
    'analysis',
    'breakdown',
    'comparison'
  ];

  if (complexKeywords.some(kw => title.toLowerCase().includes(kw))) {
    return 'complex';
  }

  return 'movie';
}

type ProviderChoice = 'groq' | 'mistral' | 'openrouter';

function buildGalleryImages(images: any): string[] {
  if (!images) return [];
  const galleryPaths: string[] = [];
  (images.backdrops || []).slice(0, 6).forEach((b: any) => b?.file_path && galleryPaths.push(b.file_path));
  (images.posters || []).slice(0, 2).forEach((p: any) => p?.file_path && galleryPaths.push(p.file_path));
  return galleryPaths
    .map((p) => `https://image.tmdb.org/t/p/w780${p}`)
    .filter(Boolean)
    .slice(0, 6);
}

function buildCreativePrompt(movie: MovieData): string {
  const castList = movie.cast.slice(0, 6).map((c) => `${c.name} as ${c.role}`).join('; ');
  return `Movie/Show: "${movie.title}" (${movie.year})
Type: ${movie.type}
Genres: ${movie.genres.join(', ') || 'Unknown'}
Director: ${movie.crew?.director || 'Unknown'}
Writer: ${movie.crew?.writer || 'Unknown'}
Music: ${movie.crew?.music || 'Unknown'}
Top Cast: ${castList || 'N/A'}
Overview: ${movie.summary_medium || movie.summary_short || 'N/A'}

Fill ONLY creative fields (summary_short, summary_medium, summary_long_spoilers, suspense_breaker, ai_notes). Do not change factual fields.`;
}

function parseCreativeFields(text: string): Partial<MovieData> | null {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e2) {
      console.error('Failed to parse creative JSON', e2);
    }
  }
  return null;
}

async function callCreativeProvider(provider: ProviderChoice, prompt: string): Promise<Partial<MovieData> | null> {
  const messages = [
    { role: 'system', content: CREATIVE_ONLY_PROMPT },
    { role: 'user', content: prompt }
  ];

  const withAbort = async (fn: (signal: AbortSignal) => Promise<Response>) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const res = await fn(controller.signal);
      return res;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    if (provider === 'groq') {
      const key = process.env.GROQ_API_KEY;
      if (!key) return null;
      const res = await withAbort((signal) => fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        }),
        signal
      }));
      if (!res.ok) return null;
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content || '';
      return parseCreativeFields(text);
    }

    if (provider === 'mistral') {
      const key = process.env.MISTRAL_API_KEY;
      if (!key) return null;
      const res = await withAbort((signal) => fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages,
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        }),
        signal
      }));
      if (!res.ok) return null;
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content || '';
      return parseCreativeFields(text);
    }

    if (provider === 'openrouter') {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) return null;
      const res = await withAbort((signal) => fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.VERCEL_URL || 'https://moviemonk-ai.vercel.app',
          'X-Title': 'MovieMonk'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages,
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        }),
        signal
      }));
      if (!res.ok) return null;
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content || '';
      return parseCreativeFields(text);
    }
  } catch (error) {
    console.warn(`Creative provider ${provider} failed:`, (error as any)?.message || error);
    return null;
  }

  return null;
}

async function enrichCreativeFields(movie: MovieData, preferred: ProviderChoice): Promise<Partial<MovieData>> {
  const order: ProviderChoice[] = ([preferred, 'groq', 'mistral', 'openrouter'] as ProviderChoice[])
    .filter((p, idx, arr) => arr.indexOf(p) === idx);
  const prompt = buildCreativePrompt(movie);

  for (const provider of order) {
    const creative = await callCreativeProvider(provider, prompt);
    if (creative && (creative.summary_short || creative.summary_medium || creative.summary_long_spoilers || creative.suspense_breaker || creative.ai_notes)) {
      return creative;
    }
  }

  return {};
}

function checkProviderAvailability(provider: string): boolean {
  // Simplified: assume all available unless in cooldown
  return true;
}

const modelMatrix: Record<string, string[]> = {
  movie: ['groq', 'mistral', 'openrouter', 'perplexity'],
  person: ['mistral', 'groq', 'openrouter', 'perplexity'],
  review: ['perplexity', 'openrouter', 'mistral', 'groq'],
  complex: ['openrouter', 'perplexity', 'mistral', 'groq']
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/ai');
  const { originAllowed } = applyCors(req, res, 'GET, POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return res.status(403).json({ ok: false, error: 'Origin is not allowed' });
  }

  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  const action = (req.query.action as string) || 'search';

  try {
    console.log(`[API] ${req.method} /api/ai?action=${action}`);
    // ====== SEARCH ACTION ======
    if (action === 'search' && req.method === 'GET') {
      const q = (req.query.q as string) || '';

      if (!q.trim()) {
        obs.finish(400, { action, error_code: 'missing_search_query' });
        return sendApiError(res, 400, 'missing_search_query', 'Missing search query', { query: q });
      }

      try {
        const cacheKey = withCacheKey('duckduckgo_search', { q: q.trim().toLowerCase() });
        const cached = await getCache(cacheKey);
        if (cached) {
          console.log('[api] returning cached search results');
          obs.finish(200, { action, cached: true, total: cached.total || 0 });
          return res.status(200).json({ ...cached, cached: true });
        }

        const parsed = parseComplexQuery(q);
        const searchQuery = buildSearchQuery(parsed);

        console.log('[api] parsed query:', parsed);
        console.log('[api] search query:', searchQuery);

        // Try TMDB first (more reliable)
        let results = await searchTMDB(parsed.title, 6);
        console.log(`[api] TMDB returned ${results.length} results`);

        // Fallback or Enrichment with SerpApi
        if (results.length === 0 || parsed.language) {
          console.log('[api] searching SerpApi for better results...');
          const serpResults = await searchWeb(searchQuery, 6);

          // Merge results, preferring SerpApi for regional content if TMDB failed
          if (results.length === 0) {
            results = serpResults;
          } else {
            // De-duplicate by url or title
            const existingUrls = new Set(results.map(r => r.url));
            for (const res of serpResults) {
              if (!existingUrls.has(res.url)) {
                results.push(res);
              }
            }
          }
        }

        // Final Fallback to Perplexity if EVERYTHING fails
        if (results.length === 0) {
          console.log('[api] falling back to Perplexity as last resort...');
          results = await searchPerplexity(searchQuery, 6);
        }

        results.sort((a, b) => {
          const lowerQ = parsed.title.toLowerCase();
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();

          const aExact = aTitle === lowerQ ? 20 : 0;
          const bExact = bTitle === lowerQ ? 20 : 0;

          const aImdb = a.url.includes('imdb.com') ? 10 : 0;
          const bImdb = b.url.includes('imdb.com') ? 10 : 0;
          return (b.confidence + bImdb + bExact) - (a.confidence + aImdb + aExact);
        });

        const response = {
          ok: true,
          query: q,
          total: results.length,
          results: results.slice(0, 6),
          parsedQuery: {
            title: parsed.title,
            year: parsed.year,
            language: parsed.language,
            genre: parsed.genre
          }
        };

        await setCache(cacheKey, response, 6 * 60 * 60);

        obs.finish(200, { action, cached: false, total: response.total });
        return res.status(200).json(response);
      } catch (searchError: any) {
        console.error('[api] search error:', searchError);
        obs.log('search_failed', 'error', { action, error: searchError.message || 'Search failed' });
        obs.finish(500, { action, error_code: 'search_failed' });
        return sendApiError(res, 500, 'search_failed', searchError.message || 'Search failed', { query: q });
      }
    }

    // ====== DETAILS ACTION ======
    if (action === 'details' && req.method === 'GET') {
      const id = req.query.id;
      const mediaType = (req.query.media_type as string) || 'movie'; // 'movie' or 'tv'
      const preferredProvider = ((req.query.provider as string) || 'groq').toLowerCase() as ProviderChoice;

      if (!id) {
        obs.finish(400, { action, error_code: 'missing_id' });
        return sendApiError(res, 400, 'missing_id', 'Missing id');
      }

      const cacheKey = `details_${mediaType}_${id}_${preferredProvider}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        obs.finish(200, { action, cached: true });
        return res.status(200).json(cached);
      }

      try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        if (!TMDB_API_KEY) {
          throw new Error('TMDB_API_KEY not configured');
        }
        const append = 'credits,videos,recommendations,watch/providers,release_dates,content_ratings,external_ids,images';
        const url = new URL(`https://api.themoviedb.org/3/${mediaType}/${id}`);
        url.searchParams.set('api_key', TMDB_API_KEY);
        url.searchParams.set('append_to_response', append);
        url.searchParams.set('include_image_language', 'en,null');

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`TMDB error: ${response.status}`);
        }
        const data: any = await response.json();

        // Process Crew
        const crew = { director: 'Unknown', writer: 'Unknown', music: 'Unknown' };
        if (data.credits?.crew) {
          const directors = data.credits.crew.filter((c: any) => c.job === 'Director').map((c: any) => c.name);
          const writers = data.credits.crew.filter((c: any) => ['Screenplay', 'Writer', 'Story'].includes(c.job)).map((c: any) => c.name);
          const composers = data.credits.crew.filter((c: any) => ['Original Music Composer', 'Music'].includes(c.job)).map((c: any) => c.name);

          if (directors.length) crew.director = directors.slice(0, 2).join(', ');
          if (writers.length) crew.writer = writers.slice(0, 2).join(', ');
          if (composers.length) crew.music = composers.slice(0, 2).join(', ');
        }

        // Process Cast
        const cast = data.credits?.cast?.slice(0, 12).map((c: any) => ({
          name: c.name,
          role: c.character,
          known_for: c.known_for_department
        })) || [];

        // Ratings
        const ratings = [
          { source: 'TMDB', score: `${Math.round(data.vote_average * 10)}%` }
        ];

        // Helper to build streaming platform URLs
        const buildPlatformUrl = (providerName: string, movieTitle: string): string => {
          const encoded = encodeURIComponent(movieTitle);
          const provider = providerName.toLowerCase();

          if (provider.includes('netflix')) return `https://www.netflix.com/search?q=${encoded}`;
          if (provider.includes('prime') || provider.includes('amazon')) return `https://www.amazon.com/s?k=${encoded}&i=instant-video`;
          if (provider.includes('hulu')) return `https://www.hulu.com/search?q=${encoded}`;
          if (provider.includes('disney')) return `https://www.disneyplus.com/search?q=${encoded}`;
          if (provider.includes('hbo') || provider.includes('max')) return `https://www.max.com/search?q=${encoded}`;
          if (provider.includes('apple')) return `https://tv.apple.com/search?q=${encoded}`;
          if (provider.includes('paramount')) return `https://www.paramountplus.com/search/?q=${encoded}`;
          if (provider.includes('peacock')) return `https://www.peacocktv.com/search?q=${encoded}`;
          if (provider.includes('youtube')) return `https://www.youtube.com/results?search_query=${encoded}`;
          if (provider.includes('hotstar')) return `https://www.hotstar.com/in/search?q=${encoded}`;
          if (provider.includes('zee5')) return `https://www.zee5.com/search?q=${encoded}`;
          if (provider.includes('sonyliv')) return `https://www.sonyliv.com/search?q=${encoded}`;

          // Fallback to JustWatch
          return `https://www.justwatch.com/us/search?q=${encoded}`;
        };

        // Process Watch Providers
        const watchProviders: any[] = [];
        const movieTitle = data.title || data.name || '';

        if (data['watch/providers']?.results?.IN) { // Default to India as per user request
          const inProvider = data['watch/providers'].results.IN;
          if (inProvider.flatrate) watchProviders.push(...inProvider.flatrate.map((p: any) => ({
            platform: p.provider_name,
            type: 'subscription',
            link: buildPlatformUrl(p.provider_name, movieTitle)
          })));
          if (inProvider.rent) watchProviders.push(...inProvider.rent.map((p: any) => ({
            platform: p.provider_name,
            type: 'rent',
            link: buildPlatformUrl(p.provider_name, movieTitle)
          })));
          if (inProvider.buy) watchProviders.push(...inProvider.buy.map((p: any) => ({
            platform: p.provider_name,
            type: 'buy',
            link: buildPlatformUrl(p.provider_name, movieTitle)
          })));
        }

        // Trailer
        const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');

        // Images/Gallery
        const extra_images = buildGalleryImages(data.images);
        const poster_url = data.poster_path
          ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
          : (data.images?.posters?.[0]?.file_path ? `https://image.tmdb.org/t/p/w500${data.images.posters[0].file_path}` : '');
        const backdrop_url = data.backdrop_path
          ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
          : extra_images[0] || '';

        const movieData: MovieData = {
          tmdb_id: data.id ? String(data.id) : undefined,
          title: data.title || data.name,
          year: (data.release_date || data.first_air_date || '').substring(0, 4),
          type: mediaType === 'tv' ? 'show' : 'movie',
          media_type: mediaType,
          genres: data.genres?.map((g: any) => g.name) || [],
          poster_url,
          backdrop_url,
          trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '',
          ratings: ratings,
          cast: cast,
          crew: crew,
          summary_short: data.overview || '',
          summary_medium: data.overview || '',
          summary_long_spoilers: '', // Populated by AI below
          suspense_breaker: '',
          where_to_watch: watchProviders,
          extra_images,
          ai_notes: ''
        };

        // Fetch related titles for movie/tv with caching
        let related: any[] = [];
        try {
          if (mediaType === 'movie' || mediaType === 'tv') {
            const relatedKey = `related_${mediaType}_${id}`;
            const cachedRelated = await getCache(relatedKey);
            if (cachedRelated) {
              related = cachedRelated;
            } else {
              related = await fetchSimilarTitles(Number(id), mediaType as 'movie' | 'tv');
              await setCache(relatedKey, related, 6 * 60 * 60);
            }
          }
        } catch (relErr) {
          console.warn('Related titles fetch failed:', relErr);
        }

        const creative = await enrichCreativeFields(movieData, preferredProvider);
        const enriched: MovieData = {
          ...movieData,
          summary_short: creative.summary_short || movieData.summary_short,
          summary_medium: creative.summary_medium || movieData.summary_medium,
          summary_long_spoilers: creative.summary_long_spoilers || movieData.summary_long_spoilers,
          suspense_breaker: creative.suspense_breaker || movieData.suspense_breaker,
          ai_notes: creative.ai_notes || movieData.ai_notes
        };

        (enriched as any).related = related || [];

        await setCache(cacheKey, enriched, 24 * 60 * 60);
        obs.finish(200, { action, cached: false, media_type: mediaType, final_provider: preferredProvider });
        return res.status(200).json(enriched);

      } catch (e: any) {
        console.error('Details fetch error:', e);
        obs.log('details_fetch_failed', 'error', { action, error: e.message || 'Details fetch failed' });
        obs.finish(500, { action, error_code: 'details_fetch_failed' });
        return sendApiError(res, 500, 'details_fetch_failed', e.message || 'Details fetch failed');
      }
    }

    // ====== SELECT MODEL ACTION ======
    if (action === 'selectModel' && req.method === 'GET') {
      const resultType = (req.query.type as 'movie' | 'person' | 'review') || 'movie';
      const resultTitle = (req.query.title as string) || '';

      const queryType = detectQueryType(resultTitle, resultType);
      const preferences = modelMatrix[queryType] || modelMatrix['movie'];

      const availableModels: string[] = [];
      for (const model of preferences) {
        if (checkProviderAvailability(model)) {
          availableModels.push(model);
        }
      }

      const selectedModel = availableModels[0] || preferences[0];

      const reasons: Record<string, string> = {
        movie: 'Movie query - using Groq for fast, accurate summaries',
        person: 'Person query - using Mistral for detailed biographical information',
        review: 'Review query - using Perplexity for web-aware opinions and analysis',
        complex: 'Complex query - using OpenRouter for comprehensive analysis'
      };

      obs.finish(200, { action, selected_model: selectedModel, query_type: queryType });
      return res.status(200).json({
        ok: true,
        selectedModel,
        reason: reasons[queryType],
        alternatives: availableModels.slice(1),
        queryType
      });
    }

    // ====== PARSE ACTION ======
    if (action === 'parse' && req.method === 'POST') {
      const { url, title, snippet, type, selectedModel } = req.body;

      if (!url || !title || !snippet || !type) {
        obs.finish(400, { action, error_code: 'missing_parse_fields' });
        return sendApiError(
          res,
          400,
          'missing_parse_fields',
          'Missing required fields: url, title, snippet, type'
        );
      }

      const cacheKey = withCacheKey('parse_result', { url, type, model: selectedModel });
      const cached = await getCache(cacheKey);
      if (cached) {
        obs.finish(200, { action, cached: true });
        return res.status(200).json({ ...cached, cached: true });
      }

      try {
        // For now, use a simple summarization approach
        // In production, you'd integrate with your chosen AI provider directly
        const summary_short = `${title} - ${snippet.substring(0, 150)}...`;
        const summary_long = `${title}\n\nSource: ${url}\n\n${snippet}`;

        const response = {
          ok: true,
          title,
          type,
          summary: {
            short: summary_short,
            long: summary_long
          }
        };

        await setCache(cacheKey, response, 24 * 60 * 60);
        obs.finish(200, { action, cached: false });
        return res.status(200).json(response);
      } catch (parseError: any) {
        console.error('[api] parse error:', parseError);
        obs.log('parse_failed', 'error', { action, error: parseError.message || 'Parsing failed' });
        obs.finish(500, { action, error_code: 'parse_failed' });
        return sendApiError(res, 500, 'parse_failed', parseError.message || 'Parsing failed', {
          title,
          type
        });
      }
    }

    // Fallback
    obs.finish(400, { action, error_code: 'unknown_action' });
    return sendApiError(res, 400, 'unknown_action', `Unknown action: ${action}`);
  } catch (error: any) {
    console.error(`[API ERROR] action='${action}':`, error);
    console.error(`Stack:`, error.stack);
    obs.log('unhandled_server_error', 'error', { action, error: error.message || 'Server error' });
    obs.finish(500, { action, error_code: 'server_error' });
    return sendApiError(res, 500, 'server_error', error.message || 'Server error', {
      action,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}



================================================
FILE: api/groq.ts
================================================
/**
 * Secure Groq API proxy - keeps API key server-side
 */
const { applyCors } = require('./_utils/cors');

module.exports = async function handler(req: any, res: any) {
  const provider = 'groq';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  const { originAllowed } = applyCors(req, res, 'POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    return sendError(403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendError(405, 'method_not_allowed', 'Only POST supported');
  }

  const { messages, model, max_tokens, temperature, response_format } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return sendError(400, 'invalid_body', 'messages array required');
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return sendError(400, 'missing_api_key', 'Groq API key not configured');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-8b-instant',
        messages,
        max_tokens: max_tokens || 4000,
        temperature: temperature !== undefined ? temperature : 0.2,
        response_format: response_format || { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `Groq API error ${response.status}`, errorText);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Groq proxy error:', error);
    return sendError(500, 'proxy_error', 'Groq proxy request failed', error.message);
  }
}



================================================
FILE: api/mistral.ts
================================================
/**
 * Secure Mistral API proxy - keeps API key server-side
 */
const { applyCors } = require('./_utils/cors');

module.exports = async function handler(req: any, res: any) {
  const provider = 'mistral';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  const { originAllowed } = applyCors(req, res, 'POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    return sendError(403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendError(405, 'method_not_allowed', 'Only POST supported');
  }

  const { messages, model, max_tokens, temperature, response_format } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return sendError(400, 'invalid_body', 'messages array required');
  }

  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

  if (!MISTRAL_API_KEY) {
    return sendError(400, 'missing_api_key', 'Mistral API key not configured');
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'mistral-small-latest',
        messages,
        max_tokens: max_tokens || 4000,
        temperature: temperature !== undefined ? temperature : 0.2,
        response_format: response_format || { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `Mistral API error ${response.status}`, errorText);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Mistral proxy error:', error);
    return sendError(500, 'proxy_error', 'Mistral proxy request failed', error.message);
  }
}



================================================
FILE: api/omdb.ts
================================================
/**
 * Secure OMDB API proxy - keeps API key server-side
 */
const { applyCors } = require('./_utils/cors');

module.exports = async function handler(req: any, res: any) {
  const provider = 'omdb';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    return sendError(403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return sendError(405, 'method_not_allowed', 'Only GET supported');
  }

  const { i: imdbId } = req.query;

  if (!imdbId || typeof imdbId !== 'string') {
    return sendError(400, 'missing_imdb_id', 'Missing IMDB ID parameter (i)');
  }

  const OMDB_API_KEY = process.env.OMDB_API_KEY;

  if (!OMDB_API_KEY) {
    return sendError(400, 'missing_api_key', 'OMDB API key not configured');
  }

  try {
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OMDB API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `OMDB API error ${response.status}`, errorText);
    }

    const data = await response.json();
    
    // OMDB returns Response: "False" on error
    if (data.Response === 'False') {
      return sendError(404, 'not_found', 'OMDB not found', data.Error || 'Unknown error');
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('OMDB proxy error:', error);
    return sendError(500, 'proxy_error', 'OMDB proxy request failed', error.message);
  }
}



================================================
FILE: api/openrouter.ts
================================================
/**
 * Serverless proxy for OpenRouter API
 * This avoids CORS issues and keeps the API key secure on the backend
 */
const { applyCors } = require('./_utils/cors');

module.exports = async function handler(req: any, res: any) {
  const provider = 'openrouter';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  const { originAllowed } = applyCors(req, res, 'POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    return sendError(403, 'forbidden_origin', 'Origin is not allowed');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendError(405, 'method_not_allowed', 'Only POST supported');
  }

  const { messages, model, max_tokens, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return sendError(400, 'invalid_body', 'messages array required');
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return sendError(400, 'missing_api_key', 'OpenRouter API key not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://moviemonk-ai.vercel.app',
        'X-Title': 'MovieMonk AI'
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3.1-8b-instruct',
        messages,
        max_tokens: max_tokens || 4000,
        temperature: temperature || 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `OpenRouter API error ${response.status}`, errorText);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Proxy error:', error);
    return sendError(500, 'proxy_error', 'Proxy request failed', error.message);
  }
}



================================================
FILE: api/query.ts
================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { generateSummary } from '../services/ai';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';

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

function buildBaseUrl(req: VercelRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host as string;
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/query');
  const { originAllowed } = applyCors(req, res, 'GET, POST, OPTIONS');
  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }
  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  if (!['GET', 'POST'].includes(req.method || '')) {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  const body = req.method === 'POST' ? (req.body || {}) : {};
  const q = (req.query.q as string) || body.q || '';
  const mode = ((req.query.mode as string) || body.mode || 'detailed') as 'short' | 'detailed';

  if (!q.trim()) {
    obs.finish(400, { error_code: 'missing_query' });
    return sendApiError(res, 400, 'missing_query', 'Missing q');
  }

  const cacheKey = withCacheKey('hybridQuery', { q: q.trim().toLowerCase(), mode });
  const cached = await getCache(cacheKey);
  if (cached) {
    obs.finish(200, { cached: true });
    return res.status(200).json({ ...cached, cached: true });
  }

  try {
    const base = buildBaseUrl(req);
    
    // Detect regional Indian cinema keywords for enhanced search
    const regionalKeywords = ['malayalam', 'tamil', 'telugu', 'kannada', 'hindi', 'bengali', 'marathi', 'gujarati', 'punjabi', 'bollywood', 'kollywood', 'tollywood', 'mollywood', 'sandalwood'];
    const isRegionalQuery = regionalKeywords.some(kw => q.toLowerCase().includes(kw));
    
    // Resolve entity using our resolver endpoint
    const resolvedRes = await fetch(`${base}/api/resolveEntity?q=${encodeURIComponent(q)}`);
    const resolved = await resolvedRes.json();
    
    // If TMDB has low confidence or regional query, enhance with web search
    let webContext = '';
    if (isRegionalQuery || !resolved?.chosen?.id) {
      try {
        const webRes = await fetch(`${base}/api/websearch?q=${encodeURIComponent(q + ' movie actor director')}&sources=wikipedia,imdb`);
        const webData = await webRes.json();
        if (webData.ok && webData.total > 0) {
          // Build context from web results
          const snippets = Object.values(webData.results || {})
            .flat()
            .slice(0, 5)
            .map((r: any) => `${r.title}: ${r.snippet}`)
            .join('\n\n');
          webContext = `\n\nAdditional Web Context:\n${snippets}`;
        }
      } catch (webErr) {
        console.warn('Web search failed:', webErr);
      }
    }

    if (resolved?.type === 'person' && resolved?.chosen?.id) {
      const personRes = await fetch(`${base}/api/person/${resolved.chosen.id}`);
      const personPayload = await personRes.json();

      let summary: any = { summary_short: '', summary_long: '' };
      if (mode === 'short') {
        const bio = (personPayload?.person?.biography || '').trim();
        summary.summary_short = bio ? (bio.length > 280 ? bio.slice(0, 277) + '…' : bio) : `Brief about ${personPayload?.person?.name || 'this person'}.`;
        summary.summary_long = bio || '';
      } else {
        // Build evidence from biography + top filmography + web context
        const bio = (personPayload?.person?.biography || '').slice(0, 1200);
        const films = (personPayload?.filmography || []).slice(0, 8)
          .map((f: any) => `${f.year || '—'} • ${f.title}${f.role ? ` (${f.role}${f.character ? ` as ${f.character}` : ''})` : ''}`)
          .join('\n');
        const evidence = `Biography:\n${bio}\n\nSelected Filmography:\n${films}${webContext}`;

        const schema = { summary_short: 'string', summary_long: 'string' } as const;
        const gen = await generateSummary({ evidence, query: q, schema, timeoutMs: 10000 });
        if (gen.ok) summary = gen.json;
      }

      const response = {
        ok: true,
        type: 'person',
        data: personPayload,
        summary,
        sources: personPayload?.sources || [],
        cached: false
      };
      await setCache(cacheKey, response, 60 * 60);
      obs.finish(200, { entity_type: 'person', cached: false });
      return res.status(200).json(response);
    }

    // Movie path: fetch details + credits, summarize
    if (resolved?.type === 'movie' && resolved?.chosen?.id) {
      const id = resolved.chosen.id;
      const [movie, credits] = await Promise.all([
        tmdb(`movie/${id}`, { language: 'en-US' }),
        tmdb(`movie/${id}/credits`, { language: 'en-US' })
      ]);

      const year = movie.release_date ? String(movie.release_date).slice(0,4) : '';
      const genres = Array.isArray(movie.genres) ? movie.genres.map((g: any) => g.name) : [];
      const cast = (credits?.cast || []).slice(0, 12).map((c: any) => ({ name: c.name, role: c.character }));
      const crew = {
        director: (credits?.crew || []).find((c: any) => c.job === 'Director')?.name || '',
        writer: (credits?.crew || []).find((c: any) => c.job === 'Writer' || c.job === 'Screenplay')?.name || '',
        music: (credits?.crew || []).find((c: any) => c.job === 'Original Music Composer' || c.job === 'Composer')?.name || ''
      };

      const data = {
        movie: {
          id: movie.id,
          title: movie.title || movie.original_title,
          year,
          overview: movie.overview || '',
          genres,
          poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
          backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : undefined,
          cast,
          crew
        }
      };

      let summary: any = { summary_short: '', summary_long: '' };
      if (mode === 'short') {
        const short = data.movie.overview || '';
        summary.summary_short = short ? (short.length > 280 ? short.slice(0,277) + '…' : short) : `Brief about ${data.movie.title}.`;
        summary.summary_long = short;
      } else {
        const castLines = cast.slice(0,8).map((c) => `${c.name} as ${c.role || ''}`.trim()).join('\n');
        const evidence = `Title: ${data.movie.title} (${year})\nGenres: ${genres.join(', ')}\n\nOverview:\n${data.movie.overview}\n\nKey Cast:\n${castLines}\n\nCrew:\nDirector: ${crew.director}\nWriter: ${crew.writer}\nMusic: ${crew.music}${webContext}`;
        const schema = { summary_short: 'string', summary_long: 'string' } as const;
        const gen = await generateSummary({ evidence, query: `${data.movie.title} (${year})`, schema, timeoutMs: 10000 });
        if (gen.ok) summary = gen.json;
      }

      const response = {
        ok: true,
        type: 'movie',
        data,
        summary,
        sources: [{ name: 'TMDB', url: `https://www.themoviedb.org/movie/${movie.id}` }],
        cached: false
      };
      await setCache(cacheKey, response, 60 * 60);
      obs.finish(200, { entity_type: 'movie', cached: false });
      return res.status(200).json(response);
    }

    // Ambiguous or none
    obs.finish(200, { entity_type: resolved?.type || 'none', cached: false });
    return res.status(200).json({ ok: true, type: resolved?.type || 'none', data: null, summary: { summary_short: '', summary_long: '' }, sources: [], cached: false });
  } catch (e: any) {
    obs.log('query_handler_failed', 'error', { error: e?.message || 'Unknown error' });
    obs.finish(500, { error_code: 'query_handler_failed' });
    return sendApiError(res, 500, 'query_handler_failed', e?.message || 'Unknown error');
  }
}



================================================
FILE: api/resolveEntity.ts
================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
import { parsePersonIntent, resolveRoleMatch } from '../services/personIntent';
import { PersonSearchCandidate } from '../types';

const TMDB_BASE = 'https://api.themoviedb.org/3';

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a: string, b: string) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[bn][an];
}

function similarity(a: string, b: string) {
  const na = normalize(a);
  const nb = normalize(b);
  const maxLen = Math.max(na.length, nb.length) || 1;
  const dist = levenshtein(na, nb);
  return 1 - dist / maxLen; // 0..1
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function computeKnownForOverlap(tokens: string[], knownForTitles: string[]): number {
  if (!tokens.length || !knownForTitles.length) return 0;
  const haystack = knownForTitles.join(' ').toLowerCase();
  const matchCount = tokens.reduce((count, token) => count + (haystack.includes(token) ? 1 : 0), 0);
  return Math.min(0.12, matchCount * 0.04);
}

async function tmdb(path: string, params: Record<string, string | number | undefined>) {
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  
  // Sanitize path to prevent directory traversal
  const sanitizedPath = path.split('/').filter(seg => seg && !seg.startsWith('.')).join('/');
  const url = new URL(`${TMDB_BASE}/${sanitizedPath}`);
  
  // Only set safe parameter values
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) {
      const strVal = String(v);
      // Validate parameter values don't contain suspicious content
      if (!strVal.includes('\0') && !strVal.includes('\n') && !strVal.includes('\r')) {
        url.searchParams.set(k, strVal);
      }
    }
  }
  if (TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);
  const headers: Record<string, string> = TMDB_READ_TOKEN ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` } : {};
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error(`TMDB ${sanitizedPath} failed ${r.status}`);
  return r.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/resolveEntity');
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');
  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }
  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Only GET supported');
  }

  const q = (req.query.q as string) || '';
  if (!q.trim()) {
    obs.finish(400, { error_code: 'missing_query' });
    return sendApiError(res, 400, 'missing_query', 'Missing q');
  }

  const cacheKey = withCacheKey('resolveEntity', { q: q.trim().toLowerCase() });
  const cached = await getCache(cacheKey);
  if (cached) {
    obs.finish(200, { cached: true });
    return res.status(200).json({ ...cached, cached: true });
  }

  try {
    const intent = parsePersonIntent(q);

    // Detect regional queries and search in original language too
    const regionalMap: Record<string, string> = {
      'malayalam': 'ml',
      'tamil': 'ta',
      'telugu': 'te',
      'kannada': 'kn',
      'hindi': 'hi',
      'bengali': 'bn',
      'marathi': 'mr'
    };
    
    const qLower = q.toLowerCase();
    const regionalLang = Object.keys(regionalMap).find(key => qLower.includes(key));
    const languages = regionalLang ? ['en-US', regionalMap[regionalLang]] : ['en-US'];
    
    // Search in both English and regional language if applicable
    const searches = languages.map(lang => Promise.all([
      tmdb('search/movie', { query: q, include_adult: 'false', language: lang, page: 1 }),
      tmdb('search/person', { query: q, include_adult: 'false', language: lang, page: 1 }),
    ]));
    
    const allResults = await Promise.all(searches);
    
    // Merge results from all language searches
    const movieRes = { results: allResults.flatMap(([movies]: any) => movies.results || []) };
    const personRes = { results: allResults.flatMap(([_, people]: any) => people.results || []) };

    type Candidate = {
      id: number;
      name: string;
      type: 'movie' | 'person';
      score: number;
      popularity?: number;
      profile_url?: string;
      known_for_department?: string;
      known_for_titles?: string[];
      role_match?: 'match' | 'mismatch' | 'neutral';
      extra?: any;
    };
    const candidates: Candidate[] = [];

    for (const m of (movieRes as any).results || []) {
      const title = m.title || m.original_title;
      if (!title) continue;
      const s = similarity(title, q);
      const yearMatch = q.match(/\b(19|20)\d{2}\b/);
      const yearBoost = yearMatch && m.release_date?.startsWith(yearMatch[0]) ? 0.16 : 0;
      const popularity = clamp01((m.popularity || 0) / 100); // normalize approx
      const score = clamp01(s * 0.62 + popularity * 0.28 + yearBoost);
      candidates.push({
        id: m.id,
        name: title,
        type: 'movie',
        score,
        popularity: m.popularity,
        extra: { release_date: m.release_date }
      });
    }

    for (const p of (personRes as any).results || []) {
      const name = p.name;
      if (!name) continue;
      const s = similarity(name, q);
      const popularity = clamp01((p.popularity || 0) / 100);
      const knownForTitles = Array.isArray(p.known_for)
        ? p.known_for
            .map((entry: any) => entry?.title || entry?.name)
            .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
        : [];
      const roleMatch = resolveRoleMatch(intent.requested_role, p.known_for_department);
      const roleBoost = roleMatch === 'match' ? 0.2 : roleMatch === 'mismatch' ? -0.08 : 0;
      const knownForBoost = computeKnownForOverlap(intent.tokens, knownForTitles);
      const personFocusBoost = intent.is_person_focused ? 0.12 : 0;
      const score = clamp01(s * 0.56 + popularity * 0.16 + roleBoost + knownForBoost + personFocusBoost);

      candidates.push({
        id: p.id,
        name,
        type: 'person',
        score,
        popularity: p.popularity,
        profile_url: p.profile_path ? `https://image.tmdb.org/t/p/w342${p.profile_path}` : undefined,
        known_for_department: p.known_for_department,
        known_for_titles: knownForTitles,
        role_match: roleMatch
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    let type: 'movie' | 'person' | 'ambiguous' | 'none' = 'none';
    let confidence_band: 'confident' | 'shortlist' | 'none' = 'none';
    let chosen: { id: number; name: string; type: 'movie' | 'person' } | undefined;
    let shortlisted: PersonSearchCandidate[] = [];

    const personCandidates = candidates
      .filter((candidate): candidate is Candidate & { type: 'person' } => candidate.type === 'person')
      .sort((a, b) => b.score - a.score);
    shortlisted = personCandidates.slice(0, 8).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      type: 'person',
      score: Number(candidate.score.toFixed(3)),
      confidence: Number(candidate.score.toFixed(3)),
      popularity: candidate.popularity,
      role_match: candidate.role_match,
      known_for_department: candidate.known_for_department,
      known_for_titles: candidate.known_for_titles,
      profile_url: candidate.profile_url
    }));

    if (candidates.length > 0) {
      const top = candidates[0];
      const second = candidates[1];
      const gap = second ? top.score - second.score : top.score;
      const confident = top.score >= 0.86 || (top.score >= 0.72 && gap >= 0.12);

      if (intent.is_person_focused && shortlisted.length > 0) {
        if (top.type === 'person' && confident) {
          type = 'person';
          confidence_band = 'confident';
          chosen = { id: top.id, name: top.name, type: 'person' };
        } else {
          type = 'ambiguous';
          confidence_band = 'shortlist';
        }
      } else if (confident) {
        type = top.type;
        confidence_band = 'confident';
        chosen = { id: top.id, name: top.name, type: top.type };
      } else {
        type = 'ambiguous';
        confidence_band = top.type === 'person' && shortlisted.length > 0 ? 'shortlist' : 'none';
      }
    }

    const response = {
      ok: true,
      type,
      confidence_band,
      query: q,
      intent: {
        requested_role: intent.requested_role,
        is_person_focused: intent.is_person_focused,
        year: intent.year
      },
      candidates: candidates.slice(0, 10).map((c) => ({ id: c.id, name: c.name, type: c.type, score: Number(c.score.toFixed(3)) })),
      chosen,
      shortlisted,
      cached: false,
    };

    await setCache(cacheKey, response, 60 * 60); // 1 hour
    obs.finish(200, { cached: false, candidates: response.candidates.length, type: response.type });
    return res.status(200).json(response);
  } catch (e: any) {
    obs.log('resolve_entity_failed', 'error', { error: e.message || 'Resolve entity failed' });
    obs.finish(500, { error_code: 'resolve_entity_failed' });
    return sendApiError(res, 500, 'resolve_entity_failed', e.message || 'Resolve entity failed');
  }
}



================================================
FILE: api/suggest.ts
================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
import { searchPerplexity } from '../services/perplexityService';
import {
  rankSuggestCandidates,
  SuggestCandidate,
  RankedSuggestCandidate
} from '../services/suggestRanking';

const SUGGEST_CACHE_TTL_SECONDS = 45;
const MAX_SUGGESTIONS = 12;

function mapTmdbItemToCandidate(item: any): SuggestCandidate | null {
  const mediaType = item?.media_type;
  if (!mediaType || !['movie', 'tv', 'person'].includes(mediaType)) return null;

  const title = item.title || item.name;
  if (!title) return null;

  const yearSource = item.release_date || item.first_air_date;
  const year = typeof yearSource === 'string' && yearSource.length >= 4 ? yearSource.slice(0, 4) : undefined;

  return {
    id: item.id,
    title,
    year,
    type: mediaType === 'movie' ? 'movie' : mediaType === 'tv' ? 'show' : 'person',
    media_type: mediaType,
    poster_url: item.poster_path
      ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
      : item.profile_path
        ? `https://image.tmdb.org/t/p/w154${item.profile_path}`
        : undefined,
    popularity: typeof item.popularity === 'number' ? item.popularity : undefined,
    known_for_department: item.known_for_department,
    known_for_titles: Array.isArray(item.known_for)
      ? item.known_for
          .map((entry: any) => entry?.title || entry?.name)
          .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
      : undefined
  };
}

async function fetchTmdbSuggestions(query: string): Promise<SuggestCandidate[]> {
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!tmdbKey) {
    throw new Error('TMDB_API_KEY not configured');
  }

  const url = new URL('https://api.themoviedb.org/3/search/multi');
  url.searchParams.set('api_key', tmdbKey);
  url.searchParams.set('query', query);
  url.searchParams.set('page', '1');
  url.searchParams.set('include_adult', 'false');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB suggest request failed: ${response.status}`);
  }

  const data = await response.json();
  const rawResults = Array.isArray(data?.results) ? data.results : [];

  return rawResults
    .slice(0, 20)
    .map(mapTmdbItemToCandidate)
    .filter((candidate): candidate is SuggestCandidate => Boolean(candidate));
}

async function fetchFallbackSuggestions(query: string): Promise<SuggestCandidate[]> {
  const fallback = await searchPerplexity(query, 3);
  return fallback
    .map((item: any, idx: number): SuggestCandidate | null => {
      if (!item?.title) return null;
      return {
        id: item.id || Math.abs(`${query}-${idx}`.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)),
        title: item.title,
        year: item.year,
        type: 'movie',
        media_type: 'movie',
        poster_url: item.image,
        popularity: 1
      };
    })
    .filter((candidate): candidate is SuggestCandidate => Boolean(candidate));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/suggest');
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return res.status(403).json({ ok: false, error: 'Origin is not allowed' });
  }

  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    obs.finish(200, { total: 0, reason: 'query_too_short' });
    return res.status(200).json({ ok: true, query: q, total: 0, suggestions: [] });
  }

  try {
    const cacheKey = withCacheKey('suggest_v1', { q: q.toLowerCase() });
    const cached = await getCache(cacheKey);
    if (cached) {
      obs.finish(200, { cached: true, total: cached.total || 0 });
      return res.status(200).json({ ...cached, cached: true });
    }

    const tmdbCandidates = await fetchTmdbSuggestions(q);
    const candidates = tmdbCandidates.length > 0
      ? tmdbCandidates
      : await fetchFallbackSuggestions(q);

    // Fallback source is only used when TMDB yields no candidates.
    const ranked: RankedSuggestCandidate[] = rankSuggestCandidates(q, candidates)
      .slice(0, MAX_SUGGESTIONS);

    const payload = {
      ok: true,
      query: q,
      total: ranked.length,
      suggestions: ranked.map((item) => ({
        id: item.id,
        title: item.title,
        year: item.year,
        type: item.type,
        media_type: item.media_type,
        poster_url: item.poster_url,
        confidence: item.confidence,
        known_for_department: item.type === 'person' ? item.known_for_department : undefined,
        known_for_titles: item.type === 'person' ? item.known_for_titles : undefined
      }))
    };

    await setCache(cacheKey, payload, SUGGEST_CACHE_TTL_SECONDS);
    obs.finish(200, { cached: false, total: payload.total });
    return res.status(200).json(payload);
  } catch (error: any) {
    obs.log('suggest_failed', 'error', { error: error?.message || 'Suggest request failed' });
    obs.finish(500, { error_code: 'suggest_failed' });
    return sendApiError(res, 500, 'suggest_failed', error?.message || 'Suggest request failed');
  }
}



================================================
FILE: api/tmdb.ts
================================================
/**
 * Secure TMDB API proxy - keeps API key server-side
 */
const { applyCors } = require('./_utils/cors');

module.exports = async function handler(req: any, res: any) {
  const provider = 'tmdb';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    return sendError(403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return sendError(405, 'method_not_allowed', 'Only GET supported');
  }

  const { endpoint } = req.query;

  if (!endpoint || typeof endpoint !== 'string') {
    return sendError(400, 'missing_endpoint', 'Missing endpoint parameter');
  }

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;

  if (!TMDB_API_KEY && !TMDB_READ_TOKEN) {
    return sendError(400, 'missing_api_key', 'TMDB credentials not configured');
  }

  try {
    // Build TMDB URL
    const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
    
    // Forward query params (except endpoint)
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'endpoint' && value) {
        url.searchParams.set(key, String(value));
      }
    });

    // Add API key if using v3
    if (TMDB_API_KEY) {
      url.searchParams.set('api_key', TMDB_API_KEY);
    }

    // Use Bearer token for v4 or fallback to v3
    const headers: HeadersInit = TMDB_READ_TOKEN
      ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` }
      : {};

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `TMDB API error ${response.status}`, errorText);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('TMDB proxy error:', error);
    return sendError(500, 'proxy_error', 'TMDB proxy request failed', error.message);
  }
}



================================================
FILE: api/tsconfig.json
================================================
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": false,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}



================================================
FILE: api/websearch.ts
================================================
/**
 * Web search API using DuckDuckGo HTML scraping
 * Provides additional context for movies/actors not well-covered in TMDB
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * DuckDuckGo HTML search (no API key needed)
 * Better for Indian regional cinema than TMDB alone
 */
async function searchDuckDuckGo(query: string, limit = 5): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: ${response.status}`);
  }

  const html = await response.text();
  const results: SearchResult[] = [];

  // Parse HTML for results (DuckDuckGo has a simple structure)
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  let count = 0;
  while ((match = resultRegex.exec(html)) !== null && count < limit) {
    const rawUrl = match[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/%2F/g, '/');
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const snippet = match[3].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
    
    if (title && snippet) {
      try {
        // Validate and decode URL safely
        const decodedUrl = decodeURIComponent(rawUrl);
        const urlObj = new URL(decodedUrl); // Throws if invalid
        // Only allow http(s) URLs
        if (['http:', 'https:'].includes(urlObj.protocol)) {
          results.push({ title, snippet, url: urlObj.href });
          count++;
        }
      } catch {
        // Skip invalid URLs
        continue;
      }
    }
  }

  return results;
}

/**
 * Wikipedia API search for enhanced biographical/movie data
 */
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) return [];

  const [_, titles, snippets, urls] = await response.json();
  
  return titles.map((title: string, idx: number) => ({
    title,
    snippet: snippets[idx] || '',
    url: urls[idx] || ''
  }));
}

/**
 * IMDB search via Google Custom Search (if configured)
 * Falls back to DuckDuckGo with site:imdb.com
 */
async function searchIMDB(query: string): Promise<SearchResult[]> {
  // Use DuckDuckGo with IMDB site filter
  const imdbQuery = `site:imdb.com ${query}`;
  return searchDuckDuckGo(imdbQuery, 3);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/websearch');
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Only GET supported');
  }

  const { q, sources = 'all' } = req.query;

  if (!q || typeof q !== 'string') {
    obs.finish(400, { error_code: 'missing_query' });
    return sendApiError(res, 400, 'missing_query', 'Missing query parameter "q"');
  }

  const query = q.trim();
  if (query.length < 2) {
    obs.finish(400, { error_code: 'query_too_short' });
    return sendApiError(res, 400, 'query_too_short', 'Query too short');
  }

  // Check cache
  const cacheKey = withCacheKey('websearch', { q: query.toLowerCase(), sources: String(sources) });
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    obs.finish(200, { cached: true, total: cached.total || 0 });
    return res.status(200).json({ ...cached, cached: true });
  }

  try {
    const sourcesArray = String(sources).split(',');
    const results: Record<string, SearchResult[]> = {};

    // Parallel search across sources
    const promises: Promise<void>[] = [];

    if (sourcesArray.includes('all') || sourcesArray.includes('web')) {
      promises.push(
        searchDuckDuckGo(query, 5).then(r => { results.web = r; }).catch(() => { results.web = []; })
      );
    }

    if (sourcesArray.includes('all') || sourcesArray.includes('wikipedia')) {
      promises.push(
        searchWikipedia(query).then(r => { results.wikipedia = r; }).catch(() => { results.wikipedia = []; })
      );
    }

    if (sourcesArray.includes('all') || sourcesArray.includes('imdb')) {
      promises.push(
        searchIMDB(query).then(r => { results.imdb = r; }).catch(() => { results.imdb = []; })
      );
    }

    await Promise.all(promises);

    const response = {
      ok: true,
      query,
      results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
      cached: false
    };

    // Cache for 1 hour
    await setCache(cacheKey, response, 3600);

    obs.finish(200, { cached: false, total: response.total });
    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Web search error:', error);
    obs.log('web_search_failed', 'error', { error: error?.message || 'Search failed' });
    obs.finish(500, { error_code: 'web_search_failed' });
    return sendApiError(res, 500, 'web_search_failed', 'Search failed', error.message);
  }
}



================================================
FILE: api/_utils/cors.ts
================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function getAllowedOrigins(req: VercelRequest): Set<string> {
  const origins = new Set<string>(LOCAL_ORIGINS);

  const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const origin of envOrigins) {
    origins.add(origin);
  }

  const host = typeof req.headers.host === 'string' ? req.headers.host : '';
  if (host) {
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }

  return origins;
}

export function applyCors(
  req: VercelRequest,
  res: VercelResponse,
  methods: string
): { originAllowed: boolean } {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const allowedOrigins = getAllowedOrigins(req);
  const originAllowed = !origin || allowedOrigins.has(origin);

  if (origin && originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return { originAllowed };
}



================================================
FILE: api/_utils/http.ts
================================================
import type { VercelResponse } from '@vercel/node';

export function sendApiError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    ok: false,
    error: message,
    error_code: code,
    error_details: details
  });
}



================================================
FILE: api/_utils/observability.ts
================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';

type LogLevel = 'info' | 'warn' | 'error';

function createRequestId(): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `req_${Date.now()}_${rnd}`;
}

export type RequestObserver = {
  requestId: string;
  route: string;
  log: (event: string, level?: LogLevel, data?: Record<string, unknown>) => void;
  finish: (status: number, data?: Record<string, unknown>) => void;
};

export function beginRequestObservation(
  req: VercelRequest,
  res: VercelResponse,
  route: string
): RequestObserver {
  const incoming = req.headers['x-request-id'];
  const requestId = typeof incoming === 'string' && incoming.trim() ? incoming : createRequestId();
  const start = Date.now();

  res.setHeader('X-Request-Id', requestId);

  const log = (event: string, level: LogLevel = 'info', data: Record<string, unknown> = {}) => {
    const line = {
      ts: new Date().toISOString(),
      level,
      route,
      request_id: requestId,
      event,
      ...data
    };
    const serialized = JSON.stringify(line);
    if (level === 'error') console.error(serialized);
    else if (level === 'warn') console.warn(serialized);
    else console.log(serialized);
  };

  log('request_start', 'info', {
    method: req.method,
    has_origin: Boolean(req.headers.origin)
  });

  const finish = (status: number, data: Record<string, unknown> = {}) => {
    log('request_end', status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info', {
      status,
      duration_ms: Date.now() - start,
      ...data
    });
  };

  return { requestId, route, log, finish };
}


================================================
FILE: api/person/[id].ts
================================================
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



================================================
FILE: asset/site.webmanifest
================================================
{"name":"","short_name":"","icons":[{"src":"/android-chrome-192x192.png","sizes":"192x192","type":"image/png"},{"src":"/android-chrome-512x512.png","sizes":"512x512","type":"image/png"}],"theme_color":"#ffffff","background_color":"#ffffff","display":"standalone"}


================================================
FILE: components/AmbiguousModal.tsx
================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Film, User, Star } from 'lucide-react';
import { buildPersonCardPresentation, sortPersonShortlist } from '../services/personPresentation';

export interface Candidate {
  id: number;
  title: string;
  type: 'movie' | 'person' | 'review';
  score: number;
  confidence?: number;
  url?: string;
  snippet?: string;
  image?: string;
  year?: string;
  language?: string;
  media_type?: string;
  popularity?: number;
  role_match?: 'match' | 'mismatch' | 'neutral';
  known_for_department?: string;
  known_for_titles?: string[];
}

interface AmbiguousModalProps {
  candidates: Candidate[];
  onSelect: (c: Candidate) => void;
  onClose: () => void;
  mode?: 'default' | 'person-shortlist';
}

const AmbiguousModal: React.FC<AmbiguousModalProps> = ({ candidates, onSelect, onClose, mode = 'default' }) => {
  const [focused, setFocused] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'person' | 'review'>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [hasUserScrolledList, setHasUserScrolledList] = useState(false);
  const isPersonShortlist = mode === 'person-shortlist';

  // Keep the background page fixed while this modal is open so wheel/trackpad
  // gestures are applied to the modal list instead of the page beneath.
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Filter candidates based on selected type
  const filtered = isPersonShortlist
    ? sortPersonShortlist(candidates.filter(c => c.type === 'person'))
    : filterType === 'all'
    ? candidates
    : candidates.filter(c => c.type === filterType);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filtered.length === 0) return;
        setFocused((f) => (f + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filtered.length === 0) return;
        setFocused((f) => (f - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered.length === 0) return;
        onSelect(filtered[focused]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, focused, onSelect, onClose]);

  // Scroll into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${focused}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focused]);

  const updateScrollAffordance = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setHasOverflow(false);
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const threshold = 2;
    const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const overflow = maxScrollTop > threshold;
    setHasOverflow(overflow);
    setCanScrollUp(overflow && el.scrollTop > threshold);
    setCanScrollDown(overflow && el.scrollTop < maxScrollTop - threshold);
  }, []);

  useEffect(() => {
    updateScrollAffordance();
    setHasUserScrolledList(false);
  }, [filtered.length, updateScrollAffordance]);

  useEffect(() => {
    const handleResize = () => updateScrollAffordance();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollAffordance]);

  const handleListScroll = useCallback(() => {
    const el = listRef.current;
    if (el && el.scrollTop > 8 && !hasUserScrolledList) {
      setHasUserScrolledList(true);
    }
    updateScrollAffordance();
  }, [hasUserScrolledList, updateScrollAffordance]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie': return <Film size={24} />;
      case 'person': return <User size={24} />;
      case 'review': return <Star size={24} />;
      default: return <Film size={24} />;
    }
  };

  const typeColor: Record<string, string> = {
    movie: 'bg-pink-500/20 text-pink-300',
    person: 'bg-violet-500/20 text-violet-300',
    review: 'bg-yellow-500/20 text-yellow-300'
  };

  const typeCount = {
    all: candidates.length,
    movie: candidates.filter(c => c.type === 'movie').length,
    person: candidates.filter(c => c.type === 'person').length,
    review: candidates.filter(c => c.type === 'review').length
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden animate-fade-in modal-mobile-slide ambiguous-modal-mobile ambiguous-modal-editorial flex flex-col h-[92vh] max-h-[92vh] sm:h-[86vh] sm:max-h-[86vh] sm:my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-black/20 flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text-light">
              {isPersonShortlist ? 'Choose the right person' : 'Search Results'}
            </h2>
            <p className="text-sm text-brand-text-dark mt-1">
              {isPersonShortlist
                ? `Found ${filtered.length} matching people`
                : `Found ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg hover:bg-white/10 transition touch-target"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        {!isPersonShortlist && (
          <div className="px-4 sm:px-6 py-3 border-b border-white/5 bg-black/10 flex gap-2 flex-shrink-0 overflow-x-auto">
            {['all', 'movie', 'person', 'review'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type as any);
                  setFocused(0);
                }}
                className={`px-4 py-2.5 rounded-full font-semibold text-sm transition whitespace-nowrap filter-tab-mobile touch-target ${filterType === type
                  ? 'bg-brand-primary text-white border border-brand-primary'
                  : 'bg-white/5 text-brand-text-dark border border-white/10 hover:border-brand-primary/50 hover:bg-white/10'
                  }`}
              >
                <span className="flex items-center gap-1">
                  {getTypeIcon(type as string)}
                  <span>{typeof type === 'string' && type.length > 0 ? type.charAt(0).toUpperCase() + type.slice(1) : ''} ({typeCount[type as keyof typeof typeCount]})</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <div
            ref={listRef}
            className="overflow-y-auto h-full overscroll-contain"
            onScroll={handleListScroll}
          >
            <div className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-brand-text-dark">No results for this filter</p>
              </div>
            ) : (
              filtered.map((c, i) => {
                const personCard = c.type === 'person'
                  ? buildPersonCardPresentation({
                      name: c.title,
                      profile_url: c.image,
                      known_for_department: c.known_for_department,
                      known_for_titles: c.known_for_titles
                    })
                  : null;

                return (
                  <button
                    key={`${c.type}-${c.id}`}
                    data-idx={i}
                    onClick={() => onSelect(c)}
                    className={`w-full text-left px-4 py-4 sm:px-6 sm:py-4 ${isPersonShortlist ? 'sm:px-7 sm:py-5 sm:gap-5' : 'sm:gap-4'} transition-colors duration-150 flex gap-3 items-start hover:bg-white/5 border-l-4 touch-target ${focused === i
                      ? 'border-l-brand-primary bg-brand-primary/10'
                      : 'border-l-transparent hover:border-l-brand-primary/50'
                      }`}
                    aria-selected={focused === i}
                  >
                  {/* Thumbnail - larger on mobile */}
                  <div className={`flex-shrink-0 w-20 h-28 ${isPersonShortlist ? 'sm:w-24 sm:h-32' : 'sm:w-20 sm:h-28'} ambiguous-thumb-mobile rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center overflow-hidden border border-white/10`}>
                    {c.image ? (
                      <img src={c.image} alt={c.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="text-brand-primary/60">
                        {getTypeIcon(c.type)}
                      </div>
                    )}
                  </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className={`flex items-start gap-2 ${isPersonShortlist ? 'mb-3' : 'mb-2'}`}>
                      <h3 className="font-semibold text-lg text-brand-text-light leading-tight">{c.title}</h3>
                      {c.year && (
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-brand-text-dark flex-shrink-0 mt-0.5">
                          {c.year}
                        </span>
                      )}
                    </div>

                    {/* Type & Language Badge */}
                    <div className={`flex gap-2 ${isPersonShortlist ? 'mb-4' : 'mb-3'} flex-wrap`}>
                      {!isPersonShortlist && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColor[c.type]}`}>
                          {c.type.toUpperCase()}
                        </span>
                      )}
                      {isPersonShortlist && personCard && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-200">
                          {personCard.roleChip}
                        </span>
                      )}
                      {isPersonShortlist && c.role_match && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.role_match === 'match'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : c.role_match === 'mismatch'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-white/10 text-brand-text-dark'
                        }`}>
                          {c.role_match === 'match' ? 'Role match' : c.role_match === 'mismatch' ? 'Role mismatch' : 'Role neutral'}
                        </span>
                      )}
                      {c.language && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {c.language}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                        {Math.round(c.score * 100)}% Match
                      </span>
                    </div>

                    {/* Snippet */}
                    {(c.snippet || personCard?.snippet) && (
                      <p className="text-sm text-brand-text-dark line-clamp-2 mb-2">
                        {c.snippet || personCard?.snippet}
                      </p>
                    )}

                    {/* URL */}
                    {c.url && (
                      <p className="text-xs text-brand-primary/70 truncate">{c.url}</p>
                    )}
                  </div>

                  {/* Select Button */}
                  <div className="flex-shrink-0">
                    <div className="px-3 py-2.5 rounded-lg bg-brand-primary/20 text-brand-primary font-semibold text-xs border border-brand-primary/30 hover:border-brand-primary/50 hover:bg-brand-primary/30 transition touch-target">
                      Select
                    </div>
                  </div>
                  </button>
                );
              })
            )}
            </div>
          </div>

          {hasOverflow && canScrollUp && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/65 to-transparent z-10"
            />
          )}
          {hasOverflow && canScrollDown && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/75 to-transparent z-10"
              />
              {!hasUserScrolledList && (
                <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-20 flex justify-center">
                  <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-black/50 border border-white/10 text-brand-text-dark">
                    Scroll for more
                  </span>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AmbiguousModal;



================================================
FILE: components/ContentCarousel.tsx
================================================
import React, { useEffect, useRef } from 'react';
import { DiscoveryItem } from '../types';
import PosterCard from './PosterCard';
import SkeletonCard from './SkeletonCard';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface ContentCarouselProps {
  sectionKey: string;
  title: string;
  items: DiscoveryItem[];
  isLoading?: boolean;
  onSectionVisible?: (sectionKey: string, title: string, itemCount: number) => void;
  onSectionSkipped?: (sectionKey: string, title: string, itemCount: number) => void;
  onCardView?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onCardOpen?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({
  sectionKey,
  title,
  items,
  isLoading = false,
  onSectionVisible,
  onSectionSkipped,
  onCardView,
  onCardOpen,
  onOpenTitle
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current || typeof IntersectionObserver === 'undefined') return;

    let hasBeenVisible = false;
    let hasSkipBeenReported = false;
    let sectionEngaged = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          hasBeenVisible = true;
          onSectionVisible?.(sectionKey, title, items.length);
          return;
        }

        if (hasBeenVisible && !sectionEngaged && !hasSkipBeenReported) {
          hasSkipBeenReported = true;
          onSectionSkipped?.(sectionKey, title, items.length);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(sectionRef.current);

    const setEngaged = () => {
      sectionEngaged = true;
    };

    const scroller = scrollerRef.current;
    scroller?.addEventListener('pointerdown', setEngaged, { passive: true });
    scroller?.addEventListener('keydown', setEngaged);

    return () => {
      observer.disconnect();
      scroller?.removeEventListener('pointerdown', setEngaged);
      scroller?.removeEventListener('keydown', setEngaged);
    };
  }, [items.length, onSectionSkipped, onSectionVisible, sectionKey, title]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const amount = Math.max(scroller.clientWidth * 0.82, 280);
    scroller.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByAmount('left');
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByAmount('right');
    }
  };

  return (
    <section ref={sectionRef} className="discovery-section" aria-label={title}>
      <div className="discovery-section-heading">
        <div>
          <p className="discovery-section-kicker">Browse</p>
          <h2 className="discovery-section-title">{title}</h2>
        </div>
        <div className="discovery-carousel-controls" aria-hidden={isLoading}>
          <button
            type="button"
            className="discovery-carousel-arrow"
            onClick={() => scrollByAmount('left')}
            aria-label={`Scroll ${title} left`}
            disabled={isLoading}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="discovery-carousel-arrow"
            onClick={() => scrollByAmount('right')}
            aria-label={`Scroll ${title} right`}
            disabled={isLoading}
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="discovery-carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : items.map((item, index) => (
              <PosterCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                sectionKey={sectionKey}
                position={index}
                onView={onCardView}
                onOpen={onCardOpen}
                onOpenTitle={onOpenTitle}
              />
            ))}
      </div>
    </section>
  );
};

export default ContentCarousel;



================================================
FILE: components/DiscoveryPage.tsx
================================================
import React, { useCallback } from 'react';
import { track } from '@vercel/analytics/react';
import ContentCarousel from './ContentCarousel';
import GenrePills from './GenrePills';
import HeroSpotlight from './HeroSpotlight';
import { useDiscovery } from '../hooks/useDiscovery';
import {
  recordDiscoveryCardOpened,
  recordDiscoveryCardViewed,
  recordDiscoverySectionRendered,
  recordDiscoverySectionSkipped
} from '../services/observability';
import { DiscoveryItem } from '../types';

interface DiscoveryPageProps {
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onOpenTitle }) => {
  const {
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  } = useDiscovery();

  const heroCandidates = heroItems.length ? heroItems : (sections[0]?.items || []).slice(0, 5);

  const handleSectionVisible = useCallback((sectionKey: string, title: string, itemCount: number) => {
    recordDiscoverySectionRendered(sectionKey, title, itemCount);
    track('discovery_section_rendered', { section_key: sectionKey, section_title: title, item_count: itemCount });
  }, []);

  const handleSectionSkipped = useCallback((sectionKey: string, title: string, itemCount: number) => {
    recordDiscoverySectionSkipped(sectionKey, title, itemCount);
    track('discovery_section_skipped', { section_key: sectionKey, section_title: title, item_count: itemCount });
  }, []);

  const handleCardView = useCallback((item: DiscoveryItem, sectionKey: string, position: number) => {
    recordDiscoveryCardViewed(sectionKey, item.title, position);
    track('discovery_card_viewed', { section_key: sectionKey, title: item.title, media_type: item.media_type, position });
  }, []);

  const handleCardOpen = useCallback((item: DiscoveryItem, sectionKey: string, position: number) => {
    recordDiscoveryCardOpened(sectionKey, item.title, position);
    track('discovery_card_opened', { section_key: sectionKey, title: item.title, media_type: item.media_type, position });
  }, []);

  return (
    <div className="discovery-page animate-fade-in">
      <HeroSpotlight items={heroCandidates} isLoading={isLoading} onOpenTitle={onOpenTitle} />

      {error && (
        <section className="discovery-error" role="alert">
          <div>
            <p className="discovery-section-kicker">Discovery unavailable</p>
            <h2 className="discovery-section-title">Couldn’t load browse sections.</h2>
            <p className="discovery-error-copy">{error}</p>
          </div>
          <button type="button" className="discovery-cta discovery-cta-secondary" onClick={retry}>
            Try Again
          </button>
        </section>
      )}

      {sections.map((section) => (
        <ContentCarousel
          key={section.key}
          sectionKey={section.key}
          title={section.title}
          items={section.items}
          isLoading={isLoading}
          onSectionVisible={handleSectionVisible}
          onSectionSkipped={handleSectionSkipped}
          onCardView={handleCardView}
          onCardOpen={handleCardOpen}
          onOpenTitle={onOpenTitle}
        />
      ))}

      <section className="discovery-section">
        <div className="discovery-section-heading genre-heading">
          <div>
            <p className="discovery-section-kicker">Genres</p>
            <h2 className="discovery-section-title">Browse by mood</h2>
          </div>
          {selectedGenre && (
            <p className="discovery-genre-caption">
              {isGenreLoading ? 'Refreshing titles...' : `Showing ${selectedGenre.name}`}
            </p>
          )}
        </div>
        <GenrePills genres={movieGenres} selectedGenre={selectedGenre} onSelectGenre={selectGenre} />
        <ContentCarousel
          sectionKey="genre-picks"
          title={selectedGenre ? `${selectedGenre.name} Picks` : 'Genre Picks'}
          items={selectedGenreItems}
          isLoading={isLoading || isGenreLoading}
          onSectionVisible={handleSectionVisible}
          onSectionSkipped={handleSectionSkipped}
          onCardView={handleCardView}
          onCardOpen={handleCardOpen}
          onOpenTitle={onOpenTitle}
        />
      </section>
    </div>
  );
};

export default DiscoveryPage;



================================================
FILE: components/DynamicSearchIsland.tsx
================================================
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

  const debouncedQuery = useDebounce(query, SUGGEST_DEBOUNCE_MS);

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

    const trimmed = debouncedQuery.trim();
    latestQueryRef.current = trimmed;

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      setInlinePrompt(null);
      return;
    }

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
  }, [debouncedQuery, isExpanded]);

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
                      <div className={`suggest-poster-wrap ${suggestion.type === 'person' ? 'is-person' : ''}`}>
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



================================================
FILE: components/ErrorBanner.tsx
================================================
import React from 'react';
import { XMarkIcon } from './icons';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-600/90 text-white p-3 rounded-lg flex items-center justify-between animate-fade-in shadow-lg backdrop-blur-sm border border-red-400/50" role="alert">
      <p className="text-sm font-medium pr-4">{message}</p>
      <button 
        onClick={onClose} 
        aria-label="Dismiss error message"
        className="p-1 rounded-full hover:bg-red-500/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors flex-shrink-0"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ErrorBanner;



================================================
FILE: components/GenrePills.tsx
================================================
import React from 'react';
import { DiscoveryGenre } from '../types';

interface GenrePillsProps {
  genres: DiscoveryGenre[];
  selectedGenre: DiscoveryGenre | null;
  onSelectGenre: (genre: DiscoveryGenre) => void;
}

const GenrePills: React.FC<GenrePillsProps> = ({ genres, selectedGenre, onSelectGenre }) => {
  if (!genres.length) return null;

  return (
    <div className="discovery-genre-pills" role="tablist" aria-label="Browse by genre">
      {genres.map((genre) => {
        const isActive = selectedGenre?.id === genre.id;
        return (
          <button
            key={genre.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`discovery-genre-pill ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelectGenre(genre)}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
};

export default GenrePills;



================================================
FILE: components/HeroSpotlight.tsx
================================================
import React, { useEffect, useRef, useState } from 'react';
import { DiscoveryItem } from '../types';
import SkeletonCard from './SkeletonCard';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface HeroSpotlightProps {
  items: DiscoveryItem[];
  isLoading?: boolean;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const formatRating = (rating: number | null) => (
  typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : 'N/A'
);

const HeroSpotlight: React.FC<HeroSpotlightProps> = ({ items, isLoading = false, onOpenTitle }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const autoplayMs = 7000;
  const goPrev = () => setActiveIndex((current) => (current - 1 + items.length) % items.length);
  const goNext = () => setActiveIndex((current) => (current + 1) % items.length);
  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (!touchStartRef.current || items.length <= 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 42 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) {
      goNext();
    } else {
      goPrev();
    }
    setIsAutoPaused(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (items.length <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
      setIsAutoPaused(true);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
      setIsAutoPaused(true);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      setIsAutoPaused(true);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(0, items.length - 1));
      setIsAutoPaused(true);
    }
  };

  useEffect(() => {
    setActiveIndex(0);
    setIsAutoPaused(false);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1 || isAutoPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, autoplayMs);

    return () => window.clearInterval(timer);
  }, [isAutoPaused, items]);

  if (isLoading) {
    return <SkeletonCard variant="hero" />;
  }

  if (!items.length) {
    return (
      <section className="discovery-hero-wrapper discovery-hero-empty">
        <div className="discovery-hero-copy">
          <p className="discovery-hero-kicker">Discover</p>
          <h2 className="discovery-hero-title">Browse what is trending right now.</h2>
          <p className="discovery-hero-overview">
            Search still works exactly as before, but discovery now gives users a better starting point.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="discovery-hero-wrapper"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Featured discovery titles"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsAutoPaused(true)}
      onMouseLeave={() => setIsAutoPaused(false)}
      onFocusCapture={() => setIsAutoPaused(true)}
      onBlurCapture={() => setIsAutoPaused(false)}
    >
      <div 
        className="discovery-hero-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          // Render backgrounds for adjacent slides for smooth transition
          const isAdjacent = Math.abs(index - activeIndex) <= 1;

          return (
            <div key={`${item.id}-${index}`} className="discovery-hero-slide" aria-hidden={!isActive}>
              {(isActive || isAdjacent) && item.backdrop_url && (
                <img
                  src={item.backdrop_url}
                  alt={`${item.title} backdrop`}
                  className="discovery-hero-backdrop"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
              <div className="discovery-hero-overlay" />
              <div className="discovery-hero-copy">
                <p className="discovery-hero-kicker">Featured This Week</p>
                <h2 className="discovery-hero-title">{item.title}</h2>
                <div className="discovery-hero-meta">
                  <span>{item.media_type === 'tv' ? 'TV Show' : 'Movie'}</span>
                  <span>{item.year || 'TBA'}</span>
                  <span>{formatRating(item.rating)}</span>
                </div>
                <p className="discovery-hero-overview">{item.overview || 'No synopsis available yet.'}</p>
                <div className="discovery-hero-actions">
                  <button
                    type="button"
                    className="discovery-cta discovery-cta-primary"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
                  >
                    Learn More
                  </button>
                  <button
                    type="button"
                    className="discovery-cta discovery-cta-secondary"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
                  >
                    Add to Watchlist
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="discovery-hero-nav" aria-label="Hero slider controls">
          <button
            type="button"
            className="discovery-hero-nav-btn"
            aria-label="Previous featured title"
            onClick={() => {
              goPrev();
              setIsAutoPaused(true);
            }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="discovery-hero-nav-btn"
            aria-label="Next featured title"
            onClick={() => {
              goNext();
              setIsAutoPaused(true);
            }}
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {items.length > 1 && (
        <div className="discovery-hero-dots-global" aria-label="Featured titles">
          <div className="discovery-hero-dots">
            {items.map((item, index) => (
              <button
                key={`${item.id}-dot-${index}`}
                type="button"
                className={`discovery-hero-dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveIndex(index);
                  setIsAutoPaused(true);
                }}
                aria-label={`Show ${item.title}`}
                tabIndex={-1}
              >
                {index === activeIndex && (
                  <span
                    className={`discovery-hero-dot-progress ${isAutoPaused ? 'is-paused' : ''}`}
                    style={{ animationDuration: `${autoplayMs}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSpotlight;



================================================
FILE: components/icons.tsx
================================================
import React from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Bot,
    CheckCircle2,
    ClipboardCheck,
    Edit3,
    MapPin,
    Folder,
    Info,
    Link as LucideLink,
    Loader2,
    Cake,
    Search as LucideSearch,
    Share2,
    Sparkles as LucideSparkles,
    Trash2
} from 'lucide-react';
import logoUrl from '../asset/android-chrome-192x192.png';

type IconProps = { className?: string; 'aria-label'?: string };

const baseIconProps = { 'aria-hidden': true, focusable: false };

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <img src={logoUrl} alt="MovieMonk Logo" className={className} />
);

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className }) => (
    <LucideSearch {...baseIconProps} className={className} />
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
    <LucideSparkles {...baseIconProps} className={className} />
);

export const InfoIcon: React.FC<IconProps> = ({ className }) => (
    <Info {...baseIconProps} className={className} />
);

export const EyeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...baseIconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const EyeSlashIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...baseIconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
    </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ className }) => (
    <LucideLink {...baseIconProps} className={className} />
);

export const CheckIcon: React.FC<IconProps> = ({ className }) => (
    <CheckCircle2 {...baseIconProps} className={className} />
);

export const WarningIcon: React.FC<IconProps> = ({ className }) => (
    <AlertTriangle {...baseIconProps} className={className} />
);

export const ErrorIcon: React.FC<IconProps> = ({ className }) => (
    <AlertCircle {...baseIconProps} className={className} />
);

export const SpinnerIcon: React.FC<IconProps> = ({ className }) => (
    <Loader2 {...baseIconProps} className={className} />
);

export const BotIcon: React.FC<IconProps> = ({ className }) => (
    <Bot {...baseIconProps} className={className} />
);

export const ClipboardIcon: React.FC<IconProps> = ({ className }) => (
    <ClipboardCheck {...baseIconProps} className={className} />
);

export const ShareIcon: React.FC<IconProps> = ({ className }) => (
    <Share2 {...baseIconProps} className={className} />
);

export const EditIcon: React.FC<IconProps> = ({ className }) => (
    <Edit3 {...baseIconProps} className={className} />
);

export const TrashIcon: React.FC<IconProps> = ({ className }) => (
    <Trash2 {...baseIconProps} className={className} />
);

export const FolderIcon: React.FC<IconProps> = ({ className }) => (
    <Folder {...baseIconProps} className={className} />
);

export const LocationIcon: React.FC<IconProps> = ({ className }) => (
    <MapPin {...baseIconProps} className={className} />
);

export const BirthdayIcon: React.FC<IconProps> = ({ className }) => (
    <Cake {...baseIconProps} className={className} />
);

export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const FilmIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m-3.75-3.75v3.75m-3.75-3.75v3.75m9.75-15l-2.071 3.75m2.071-3.75H5.25m9.75 0l-2.071 3.75M3.75 18h16.5M3.75 12h16.5m-16.5 6V6a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H5.25A2.25 2.25 0 013.75 18z" />
    </svg>
);

export const TvIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
    </svg>
);

export const TicketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v9A2.25 2.25 0 005.25 18.75h1.5M16.5 18.75h-1.5m-6 0h1.5m-1.5 0h-1.5m6 0h-1.5m6 0h1.5m-6 0h-1.5" />
    </svg>
);

export const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

export const DollarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const RottenTomatoesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className={className}>
        <path d="M416 160c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zM96 160c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zM256 32C114.6 32 0 146.6 0 288c0 74.52 32.2 142 85.39 189.37 25.1 22.62 57.04 34.63 90.61 34.63h180c57.53 0 110.6-30.83 140.4-80.52C496.5 407.7 512 350.3 512 288c0-141.4-114.6-256-256-256zm-96 288c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm192 0c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z" />
    </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

export const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// New platform / UI icons
export const NetflixIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 3h4.2l4.05 11.6V3H16v18h-4.05L7.9 9.4V21H4V3Z" />
    </svg>
);

export const PrimeVideoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.04 3c-5 0-9.04 4.06-9.04 9.06 0 5 4.04 9.06 9.04 9.06 5 0 9.04-4.06 9.04-9.06C21.08 7.06 17.04 3 12.04 3Zm3.21 10.33c-.51.76-1.43 1.28-2.29 1.28-1.53 0-2.78-1.25-2.78-2.79 0-1.55 1.25-2.8 2.78-2.8.86 0 1.78.52 2.29 1.28V6.77h1.42v8.56h-1.42v-1.99Zm-2.29-3.92c-.77 0-1.39.63-1.39 1.41 0 .77.62 1.39 1.39 1.39.77 0 1.39-.62 1.39-1.39 0-.78-.62-1.41-1.39-1.41ZM7.5 11.82c0-1.54 1.25-2.79 2.78-2.79.87 0 1.78.52 2.29 1.28l-1.2.77c-.22-.33-.63-.55-1.09-.55-.77 0-1.39.62-1.39 1.39 0 .77.62 1.39 1.39 1.39.46 0 .87-.22 1.09-.55l1.2.77c-.51.76-1.42 1.28-2.29 1.28-1.53 0-2.78-1.25-2.78-2.79Z" />
        <path d="M5.5 16.75c3.73 3.05 9.26 3.08 13.02.03.27-.22.31-.62.09-.9-.22-.28-.62-.32-.9-.09-3.29 2.69-8.06 2.66-11.31-.02-.27-.22-.68-.18-.9.1-.23.28-.19.69.09.88Z" />
    </svg>
);

export const HuluIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 8h2v5.2c0 1.92 1.05 3.04 2.86 3.04 1.82 0 2.86-1.12 2.86-3.04V8h-2v5.12c0 .9-.38 1.34-.86 1.34-.48 0-.86-.44-.86-1.34V8H3Zm9 0h2v8h-2V8Zm3.5 0h2v5.2c0 1.92 1.05 3.04 2.86 3.04.64 0 1.2-.16 1.64-.46V13.8c-.34.26-.72.4-1.14.4-.66 0-1.36-.38-1.36-1.42V8h-2v8H15.5Z" />
    </svg>
);

export const MaxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 8h2.2l1.8 4.6L9.8 8h2.2v8h-2v-3.7l-1.2 3h-1.2l-1.2-3V16H4V8Zm11.2 0c1.74 0 3.16 1.42 3.16 3.16V16h-2v-1.2c-.38.76-1.18 1.26-2.16 1.26-1.74 0-3.16-1.42-3.16-3.16 0-1.74 1.42-3.16 3.16-3.16.98 0 1.78.5 2.16 1.26V11.16c0-.64-.52-1.16-1.16-1.16-.54 0-.98.34-1.12.82h-2.02c.22-1.34 1.42-2.32 3.02-2.32ZM16.36 13c0-.74-.6-1.34-1.34-1.34-.74 0-1.34.6-1.34 1.34 0 .74.6 1.34 1.34 1.34.74 0 1.34-.6 1.34-1.34Z" />
    </svg>
);

export const DisneyPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 5.5c3.78 0 7.18 1.8 9.31 4.72.26.36.18.86-.18 1.12-.36.26-.86.18-1.12-.18C18.31 8.78 15.31 7.5 12 7.5c-5.24 0-9.57 3.85-9.98 8.73-.04.44-.42.77-.86.72-.44-.04-.76-.42-.72-.86C1 10.04 6.02 5.5 12 5.5Z" />
        <path d="M7.5 13h1.7l1.3 3.4 1.3-3.4h1.7v5h-1.5v-2.3l-.9 2.3h-1.2l-.9-2.3V18H7.5v-5Zm9.25 0c1.23 0 2.25 1.02 2.25 2.25V18h-1.5v-.7c-.29.46-.82.75-1.38.75-1.23 0-2.25-1.02-2.25-2.25 0-1.23 1.02-2.25 2.25-2.25.56 0 1.09.29 1.38.75v-.75c0-.42-.34-.75-.75-.75-.35 0-.64.22-.73.53h-1.3c.17-.96 1.02-1.65 2.2-1.65Zm.75 2.25c0-.42-.34-.75-.75-.75-.41 0-.75.33-.75.75 0 .42.34.75.75.75.41 0 .75-.33.75-.75Z" />
    </svg>
);

export const AppleTvIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 8h10v8H7V8Zm5-5c.83 0 1.5.67 1.5 1.5S12.83 6 12 6s-1.5-.67-1.5-1.5S11.17 3 12 3Zm0 18c-.83 0-1.5-.67-1.5-1.5S11.17 18 12 18s1.5.67 1.5 1.5S12.83 21 12 21Z" />
    </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 12c-2.21 0-4.15-1.2-5.2-3.02.06-1.66 3.47-2.58 5.2-2.58 1.73 0 5.14.92 5.2 2.58A5.985 5.985 0 0 1 12 18Z" />
    </svg>
);

export const FilmReelIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12c0 3.87 2.74 7.16 6.45 8.19-.07-.4-.11-.82-.11-1.24 0-1.4.45-2.78 1.31-3.89-2.09-.27-3.72-2.05-3.72-4.21 0-2.36 1.92-4.28 4.28-4.28.69 0 1.35.16 1.93.45.7-.89 1.76-1.45 2.93-1.45 2.07 0 3.75 1.68 3.75 3.75 0 .76-.23 1.47-.62 2.06.99.86 1.62 2.12 1.62 3.52 0 .98-.3 1.92-.85 2.7A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10Zm-1.25 7.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm4.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM12 5.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm0 9.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12l7.5-7.5M21 12H3" />
    </svg>
);

export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M3 12h18" />
    </svg>
);

export const TrendingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
export const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);



================================================
FILE: components/LoadingScreen.tsx
================================================
import React from 'react';

interface LoadingScreenProps {
  type: 'movie' | 'tv' | 'person';
  visible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ type, visible }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[3500] bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-label={`Loading ${type} details`}
    >
      {type === 'movie' && <MovieLoadingScreen />}
      {type === 'tv' && <TVLoadingScreen />}
      {type === 'person' && <PersonLoadingScreen />}
    </div>
  );
};

/**
 * Movie Loading Screen - Film Reel Spinner
 * Features a cinematic film reel with spinning animation
 */
const MovieLoadingScreen: React.FC = () => (
  <div className="glass-panel px-8 py-8 rounded-2xl shadow-2xl border border-white/15 flex flex-col items-center gap-4">
    {/* Film Reel Container */}
    <div className="relative w-20 h-20 flex items-center justify-center">
      {/* Outer reel - main spin */}
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary border-r-brand-primary animate-spin"
        style={{ animation: 'spin 3s linear infinite' }} />
      
      {/* Middle accent glow */}
      <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-brand-accent/60"
        style={{ animation: 'spin 2s linear infinite reverse' }} />
      
      {/* Center dot */}
      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent shadow-lg"
        style={{ boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)' }} />

      {/* Film strip indicators */}
      <div className="absolute inset-8 rounded-full border border-brand-primary/20" 
        style={{ animation: 'pulse 2s ease-in-out infinite' }} />
    </div>

    {/* Loading text with icon */}
    <div className="flex flex-col items-center gap-2">
      <p className="text-base font-semibold text-brand-text-main">Finding the perfect film</p>
      <p className="text-sm text-brand-text-muted animate-pulse">Loading movie details...</p>
    </div>
  </div>
);

/**
 * TV Show Loading Screen - Scanning CRT Effect
 * Features a TV screen with animated scanning lines
 */
const TVLoadingScreen: React.FC = () => (
  <div className="glass-panel px-8 py-8 rounded-2xl shadow-2xl border border-white/15 flex flex-col items-center gap-4">
    {/* TV Screen Container */}
    <div className="relative w-24 h-20 bg-black rounded-lg border-4 border-brand-accent/40 overflow-hidden"
      style={{
        boxShadow: 'inset 0 0 20px rgba(219, 39, 119, 0.2), 0 0 30px rgba(219, 39, 119, 0.3)'
      }}>
      {/* Scanning lines - animated top to bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-accent/10 to-transparent"
        style={{
          animation: 'scanlines 8s linear infinite',
          backgroundSize: '100% 4px'
        }} />
      
      {/* Screen glow effect */}
      <div className="absolute inset-0 animate-pulse rounded-sm"
        style={{
          backgroundColor: 'rgba(219, 39, 119, 0.1)',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      
      {/* Horizontal frequency lines */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent"
        style={{ animation: 'flicker 0.15s infinite' }} />
    </div>

    {/* Loading text */}
    <div className="flex flex-col items-center gap-2">
      <p className="text-base font-semibold text-brand-text-main">Tuning to the series</p>
      <p className="text-sm text-brand-text-muted animate-pulse">Loading TV show details...</p>
    </div>

    {/* Signal strength indicator */}
    <div className="flex gap-1.5 mt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 rounded-full bg-brand-accent/60"
          style={{
            height: `${8 + i * 4}px`,
            animation: `signalBounce 0.6s ease-in-out ${i * 0.1}s infinite`
          }}
        />
      ))}
    </div>
  </div>
);

/**
 * Person Loading Screen - Portrait Shimmer
 * Features a portrait frame with elegant shimmer effect
 */
const PersonLoadingScreen: React.FC = () => (
  <div className="glass-panel px-8 py-8 rounded-2xl shadow-2xl border border-white/15 flex flex-col items-center gap-4">
    {/* Portrait Frame */}
    <div className="relative w-24 h-32 rounded-lg border-2 border-brand-primary/40 overflow-hidden bg-gradient-to-b from-brand-primary/5 to-brand-accent/5"
      style={{
        boxShadow: '0 0 30px rgba(124, 58, 237, 0.3), inset 0 0 20px rgba(124, 58, 237, 0.1)'
      }}>
      {/* Shimmer effect - moves across the portrait */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{
          animation: 'mm-loading-shimmer 2s infinite',
          transform: 'skewX(-20deg)'
        }}
      />
      
      {/* Inner frame highlight */}
      <div className="absolute inset-1 border border-brand-accent/30 rounded-md"
        style={{ animation: 'pulse 2s ease-in-out infinite' }} />
      
      {/* Subtle pulse glow */}
      <div className="absolute inset-0 rounded-lg"
        style={{
          animation: 'innerPulse 3s ease-in-out infinite',
          boxShadow: 'inset 0 0 20px rgba(219, 39, 119, 0.15)'
        }} />
    </div>

    {/* Loading text */}
    <div className="flex flex-col items-center gap-2">
      <p className="text-base font-semibold text-brand-text-main">Discovering talent</p>
      <p className="text-sm text-brand-text-muted animate-pulse">Loading person details...</p>
    </div>

    {/* Profile indicator dots */}
    <div className="flex gap-2 mt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
          style={{
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
    </div>
  </div>
);

export default LoadingScreen;

/**
 * Styles for animations - add to your CSS file
 * @keyframes scanlines
 * @keyframes flicker
 * @keyframes signalBounce
 * @keyframes shimmer
 * @keyframes innerPulse
 * @keyframes dotPulse
 */



================================================
FILE: components/PersonDisplay.tsx
================================================
import React, { useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import { SparklesIcon } from './icons';
import { useRenderCounter } from '../lib/perfDebug';
import { PersonCredit, PersonRoleBucket } from '../types';
import { buildPersonCardPresentation } from '../services/personPresentation';

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
  const [showMobileActions, setShowMobileActions] = useState(false);
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

  const canShowBestMovies = Boolean(onQuickSearch);
  const canShowMoviesBy = Boolean(onQuickSearch);
  const canShowBriefMe = Boolean(onBriefMe);
  const hasSecondaryActions = canShowMoviesBy || canShowBriefMe;

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

  const handleBestMovies = () => {
    if (!onQuickSearch) return;
    onQuickSearch(`${person.name} best movies`);
  };

  const handleMoviesBy = () => {
    if (!onQuickSearch) return;
    setShowMobileActions(false);
    onQuickSearch(`Movies by ${person.name}`);
  };

  const handleBriefMe = () => {
    if (!onBriefMe) return;
    setShowMobileActions(false);
    track('brief_me_clicked', { person_name: person.name });
    onBriefMe(person.name);
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
      <section className="person-editorial-hero">
        <div className="person-editorial-identity">
          {person.profile_url ? (
            <img
              src={person.profile_url}
              alt={person.name}
              className="person-editorial-avatar"
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
            <div className="person-editorial-actions">
              {canShowBestMovies && (
                <button type="button" className="person-editorial-primary-btn" onClick={handleBestMovies}>
                  Best Movies
                </button>
              )}
              {hasSecondaryActions && (
                <>
                  <div className="person-editorial-secondary-desktop">
                    {canShowMoviesBy && (
                      <button type="button" className="person-editorial-secondary-btn" onClick={handleMoviesBy}>
                        Movies by {person.name}
                      </button>
                    )}
                    {canShowBriefMe && (
                      <button type="button" className="person-editorial-secondary-btn" onClick={handleBriefMe}>
                        <SparklesIcon className="w-4 h-4" />
                        Brief Me
                      </button>
                    )}
                  </div>
                  <div className="person-editorial-secondary-mobile">
                    <button
                      type="button"
                      className="person-editorial-more-btn"
                      onClick={() => setShowMobileActions((value) => !value)}
                    >
                      More
                    </button>
                    {showMobileActions && (
                      <div className="person-editorial-more-sheet">
                        {canShowMoviesBy && (
                          <button type="button" onClick={handleMoviesBy}>
                            Movies by {person.name}
                          </button>
                        )}
                        {canShowBriefMe && (
                          <button type="button" onClick={handleBriefMe}>
                            <SparklesIcon className="w-4 h-4" />
                            Brief Me
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
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



================================================
FILE: components/PosterCard.tsx
================================================
import React, { useEffect, useRef } from 'react';
import { DiscoveryItem } from '../types';

interface PosterCardProps {
  item: DiscoveryItem;
  sectionKey?: string;
  position?: number;
  onView?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpen?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const formatRating = (rating: number | null) => (
  typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : 'N/A'
);

const PosterCard: React.FC<PosterCardProps> = ({
  item,
  sectionKey = 'unknown',
  position = -1,
  onView,
  onOpen,
  onOpenTitle
}) => {
  const cardRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === 'undefined' || !onView) return;

    let hasReportedView = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasReportedView) return;
        hasReportedView = true;
        onView(item, sectionKey, position);
        observer.disconnect();
      },
      { threshold: 0.55 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [item, onView, position, sectionKey]);

  return (
    <button
      ref={cardRef}
      type="button"
      className="discovery-poster-card"
      onClick={() => {
        onOpen?.(item, sectionKey, position);
        onOpenTitle({ id: item.id, mediaType: item.media_type });
      }}
      aria-label={`Open ${item.title}${item.year ? ` (${item.year})` : ''}`}
    >
      <div className="discovery-poster-frame">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={`${item.title} poster`}
            className="discovery-poster-image"
            loading="lazy"
          />
        ) : (
          <div className="discovery-poster-empty">
            <span>{item.media_type === 'tv' ? 'Show' : 'Movie'}</span>
          </div>
        )}
        <span className="discovery-poster-plus" aria-hidden="true">+</span>
      </div>
      <span className="discovery-poster-title">{item.title}</span>
      <span className="discovery-poster-meta">{item.year || 'TBA'} • {formatRating(item.rating)}</span>
    </button>
  );
};

export default PosterCard;



================================================
FILE: components/SimilarCarousel.tsx
================================================
import React, { useState } from 'react';
import { RelatedTitle } from '../types';

interface SimilarCarouselProps {
  label: string;
  items: RelatedTitle[];
  onOpenAll: () => void;
  onSelectTitle: (title: string) => void;
}

const SimilarCarousel: React.FC<SimilarCarouselProps> = ({ label, items, onOpenAll, onSelectTitle }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!items || items.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">{label}</h3>
        <button className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15" onClick={onOpenAll}>
          See all
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((it, idx) => (
          <button
            key={`${it.media_type}-${it.id}-${idx}`}
            className="flex-shrink-0 w-28 sm:w-32 text-left group"
            onMouseEnter={() => setHoverIndex(idx)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => onSelectTitle(it.title)}
            aria-label={`Open ${it.title}${it.year ? ` (${it.year})` : ''}`}
          >
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5">
              {it.poster_url ? (
                <img src={it.poster_url} alt={`${it.title} poster`} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
              <div className={`absolute inset-0 transition ${hoverIndex === idx ? 'bg-black/20' : 'bg-transparent'}`} />
            </div>
            <p className="mt-2 text-xs font-semibold text-white line-clamp-2">{it.title}</p>
            {it.year && <p className="text-[11px] text-brand-text-dark">{it.year}</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimilarCarousel;


================================================
FILE: components/SkeletonCard.tsx
================================================
import React from 'react';

interface SkeletonCardProps {
  variant?: 'poster' | 'hero';
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'poster', className = '' }) => {
  if (variant === 'hero') {
    return (
      <div className={`discovery-hero-skeleton ${className}`}>
        <div className="discovery-skeleton discovery-skeleton-backdrop" />
        <div className="discovery-hero-skeleton-copy">
          <div className="discovery-skeleton discovery-skeleton-eyebrow" />
          <div className="discovery-skeleton discovery-skeleton-title" />
          <div className="discovery-skeleton discovery-skeleton-meta" />
          <div className="discovery-skeleton discovery-skeleton-body" />
          <div className="discovery-skeleton discovery-skeleton-body short" />
        </div>
      </div>
    );
  }

  return (
    <div className={`discovery-poster-skeleton ${className}`}>
      <div className="discovery-skeleton discovery-skeleton-poster" />
      <div className="discovery-skeleton discovery-skeleton-caption" />
      <div className="discovery-skeleton discovery-skeleton-caption short" />
    </div>
  );
};

export default SkeletonCard;



================================================
FILE: components/TVShowDisplay.tsx
================================================
import React, { useState } from 'react';
import { MovieData, TVShowEpisode, TVShowSeason } from '../types';
import { PlayIcon, CalendarIcon, ClockIcon, StarIcon, TvIcon, LinkIcon } from './icons';
import '../styles/tv-show.css';

interface TVShowDisplayProps {
    movie: MovieData; // Actually a TV show with tvShow data
}

const LANGUAGE_NAME_BY_CODE: Record<string, string> = {
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    th: 'Thai',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    ml: 'Malayalam',
    bn: 'Bengali',
    mr: 'Marathi',
    pa: 'Punjabi',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    tr: 'Turkish',
    id: 'Indonesian'
};

const toSentenceCase = (value: string): string =>
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const formatDisplayLanguage = (value?: string): string => {
    if (!value || !value.trim()) return '';
    const normalized = value.trim();
    const lower = normalized.toLowerCase();

    if (LANGUAGE_NAME_BY_CODE[lower]) {
        return LANGUAGE_NAME_BY_CODE[lower];
    }

    if (normalized.length <= 3 && /^[a-zA-Z]{2,3}$/.test(normalized)) {
        return toSentenceCase(normalized);
    }

    return normalized;
};

const TVShowDisplay: React.FC<TVShowDisplayProps> = ({ movie }) => {
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

    if (!movie.tvShow) {
        return <div className="error">No TV show data available</div>;
    }

    const tvShow = movie.tvShow;
    const seasonsData = tvShow.seasons || [];
    const selectedSeasonData = seasonsData.find(s => s.number === selectedSeason);
    const episodesForSeason = (tvShow.episodes || []).filter(e => e.season === selectedSeason);
    const languageLabel = formatDisplayLanguage(movie.language || tvShow.language);
    const premieredYear = tvShow.premiered ? new Date(tvShow.premiered).getFullYear().toString() : movie.year;
    const headerMetaParts = [
        premieredYear,
        'TV Series',
        languageLabel
    ].filter((part) => typeof part === 'string' && part.trim().length > 0);

    // Status badge color
    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('running') || s.includes('returning')) return 'bg-green-500';
        if (s.includes('ended')) return 'bg-gray-500';
        if (s.includes('development')) return 'bg-blue-500';
        return 'bg-gray-400';
    };

    return (
        <div className="tv-show-display">
            {/* TV Show Header */}
            <div className="tv-show-header">
                <div className="backdrop-container" style={{
                    backgroundImage: movie.backdrop_url ? `url(${movie.backdrop_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <div className="backdrop-overlay"></div>
                </div>

                <div className="tv-show-info">
                    {movie.poster_url && (
                        <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="tv-show-poster"
                        />
                    )}

                    <div className="tv-show-meta">
                        <div className="tv-badge">
                            <TvIcon className="icon-small" />
                            <span>TV Series</span>
                        </div>

                        <h1 className="tv-show-title">{movie.title}</h1>

                        {headerMetaParts.length > 0 && (
                            <div className="tv-show-dates">
                                <span>{headerMetaParts.join(' \u2022 ')}</span>
                            </div>
                        )}

                        <div className="tv-show-stats">
                            <span className={`status-badge ${getStatusColor(tvShow.status)}`}>
                                {tvShow.status}
                            </span>

                            {movie.ratings.length > 0 && (
                                <div className="rating-badge">
                                    <StarIcon className="icon-small" />
                                    <span>{movie.ratings[0].score}</span>
                                </div>
                            )}

                            <div className="info-item">
                                <span>{tvShow.totalSeasons} Season{tvShow.totalSeasons !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="info-item">
                                <span>{tvShow.totalEpisodes} Episodes</span>
                            </div>

                            {tvShow.network && (
                                <div className="info-item">
                                    <span>{tvShow.network}</span>
                                </div>
                            )}
                        </div>

                        {tvShow.premiered && tvShow.ended && (
                            <div className="tv-show-dates">
                                <CalendarIcon className="icon-small" />
                                <span>
                                    {new Date(tvShow.premiered).getFullYear()} - {new Date(tvShow.ended).getFullYear()}
                                </span>
                            </div>
                        )}

                        {movie.genres.length > 0 && (
                            <div className="tv-show-genres">
                                {movie.genres.map(genre => (
                                    <span key={genre} className="genre-tag">{genre}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary */}
            {movie.summary_medium && (
                <div className="tv-show-section">
                    <h2>Overview</h2>
                    <p className="tv-show-summary">{movie.summary_medium}</p>
                </div>
            )}

            {/* Season Selector */}
            <div className="tv-show-section">
                <div className="season-selector-header">
                    <h2>Episodes</h2>
                    <div className="season-controls">
                        <select
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(Number(e.target.value))}
                            className="season-select"
                        >
                            {seasonsData.map(season => (
                                <option key={season.number} value={season.number}>
                                    Season {season.number} • {season.episodeCount} eps
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Season Info */}
                {selectedSeasonData && (
                    <div className="season-info-card">
                        {selectedSeasonData.premiereDate && (
                            <div className="season-meta">
                                <CalendarIcon className="icon-small" />
                                <span>
                                    Premiered: {new Date(selectedSeasonData.premiereDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                        <div className="season-progress-bar">
                            <div className="season-progress-fill" style={{ width: '0%' }}></div>
                        </div>
                        <div className="season-stats">
                            <span>{episodesForSeason.length} Episodes</span>
                        </div>
                    </div>
                )}

                {/* Episode List */}
                <div className="episode-list">
                    {episodesForSeason.length > 0 ? (
                        episodesForSeason.map((episode) => (
                            <div
                                key={episode.id}
                                className={`episode-card-enhanced ${expandedEpisode === episode.id ? 'expanded' : ''}`}
                                onClick={() => setExpandedEpisode(expandedEpisode === episode.id ? null : episode.id)}
                            >
                                <div className="episode-card-inner">
                                    {episode.image && (
                                        <div className="episode-thumbnail-container">
                                            <img
                                                src={episode.image}
                                                alt={episode.name}
                                                className="episode-thumbnail-enhanced"
                                            />
                                            <div className="episode-play-overlay">
                                                <PlayIcon className="play-icon" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="episode-content">
                                        <div className="episode-top">
                                            <div className="episode-number-badge">
                                                E{String(episode.episode).padStart(2, '0')}
                                            </div>
                                            {episode.rating && (
                                                <div className="episode-rating-badge">
                                                    <StarIcon className="icon-tiny" />
                                                    <span>{episode.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="episode-title-enhanced">{episode.name}</h3>

                                        <div className="episode-meta-enhanced">
                                            <div className="episode-meta-item">
                                                <CalendarIcon className="icon-tiny" />
                                                <span>{new Date(episode.airdate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}</span>
                                            </div>

                                            {episode.runtime && (
                                                <div className="episode-meta-item">
                                                    <ClockIcon className="icon-tiny" />
                                                    <span>{episode.runtime}m</span>
                                                </div>
                                            )}
                                        </div>

                                        {expandedEpisode === episode.id && episode.summary && (
                                            <div className="episode-summary-enhanced">
                                                <p>{episode.summary.replace(/<[^>]*>/g, '')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="episode-expand-indicator">
                                    <span className="expand-text">
                                        {expandedEpisode === episode.id ? 'Show less' : 'Show more'}
                                    </span>
                                    <svg
                                        className={`expand-arrow ${expandedEpisode === episode.id ? 'rotated' : ''}`}
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M4 6L8 10L12 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-episodes">
                            <TvIcon className="no-episodes-icon" />
                            <p>No episode data available for this season.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cast */}
            {movie.cast.length > 0 && (
                <div className="tv-show-section">
                    <h2>Cast</h2>
                    <div className="cast-grid">
                        {movie.cast.slice(0, 12).map((member, idx) => (
                            <div key={idx} className="cast-member">
                                <div className="cast-name">{member.name}</div>
                                <div className="cast-role">{member.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trivia/AI Notes */}
            {movie.ai_notes && (
                <div className="tv-show-section">
                    <h2>Trivia & Facts</h2>
                    <div
                        className="ai-notes"
                        dangerouslySetInnerHTML={{
                            __html: movie.ai_notes.replace(/\n/g, '<br />')
                        }}
                    />
                </div>
            )}

            {/* Official Site Link */}
            {tvShow.officialSite && (
                <div className="tv-show-section">
                    <a
                        href={tvShow.officialSite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="official-site-link inline-flex items-center gap-2"
                    >
                        <LinkIcon className="w-4 h-4" aria-hidden />
                        <span>Visit Official Website</span>
                    </a>
                </div>
            )}

        </div>
    );
};

export default TVShowDisplay;



================================================
FILE: components/VirtualizedList.tsx
================================================
import React from 'react';
import { List } from 'react-window';

type VirtualizedListProps<T> = {
    items: T[];
    itemHeight: number;
    height: number;
    overscan?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
};

export function VirtualizedList<T>({ items, itemHeight, height, overscan = 4, renderItem }: VirtualizedListProps<T>) {
    if (items.length === 0) return null;

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>{renderItem(items[index], index)}</div>
    );

    return (
        <List
            height={height}
            itemCount={items.length}
            itemSize={itemHeight}
            width="100%"
            overscanCount={overscan}
        >
            {Row}
        </List>
    );
}



================================================
FILE: docs/API.md
================================================
# API Guide

How MovieMonk uses AI and movie data APIs.

---

## AI Providers

We use free AI APIs to generate summaries:

- **Groq** (primary) - Fast and free, uses llama-3.3-70b-versatile model
- **Mistral** (backup) - Also free, uses mistral-large-latest model
- **OpenRouter** (fallback) - Last resort for when other providers are unavailable

### Getting API Keys

1. **Groq**: Sign up at [console.groq.com](https://console.groq.com)
2. **Mistral**: Sign up at [console.mistral.ai](https://console.mistral.ai)
3. **OpenRouter**: Sign up at [openrouter.ai/keys](https://openrouter.ai/keys)
4. **TMDB**: Get key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
5. **OMDB**: Get key at [omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)

### Query Modes

- **Simple Mode**: Quick responses, faster AI processing
- **Complex Mode**: Detailed analysis with extended thinking time

---

## TMDB API

We use TMDB for accurate movie data (cast, crew, images, ratings).

### Authentication

Add these to your `.env.local`:

```env
TMDB_API_KEY=your_key_here
TMDB_READ_TOKEN=your_token_here
```

### What We Get From TMDB

- Movie/show posters and backdrops
- Cast and crew info
- IMDB ratings (via OMDB integration)
- Gallery images
- Streaming availability
- Release dates and runtime

### Image URLs

TMDB provides images like this:
```
https://image.tmdb.org/t/p/w500/path-to-image.jpg
```

Sizes: `w300`, `w500`, `w780`, `original`

---

## How It All Works Together

1. **You search** for a movie
2. **TMDB finds** the movie data (cast, ratings, images)
3. **AI writes** summaries and trivia using Groq/Mistral/OpenRouter
4. **We merge** TMDB facts + AI-generated content
5. **You see** the complete result with accurate data and engaging summaries

---

## Error Handling

Common issues and fixes:

**"Invalid API key"**
- Check your `.env.local` file
- Make sure keys are correct
- Verify you've set all required keys (Groq, TMDB, OMDB)

**"Too many requests"**
- Wait a moment and try again
- We cache results to avoid this
- System automatically falls back to alternate AI providers

**"No results found"**
- Try different search terms
- Check spelling
- Try just the movie title without year
- For recent releases, ensure Perplexity API key is configured

---

## Rate Limits

- **Groq**: 30 requests/minute (free tier), unlimited daily
- **Mistral**: 2M tokens/month (free tier)
- **OpenRouter**: Varies by model, used as fallback
- **TMDB**: 40 requests/10 seconds
- **OMDB**: 1000 requests/day (free tier)

We cache responses to stay within limits and improve performance.

---

## Need Help?

Check the main [README](../README.md) or open an issue on GitHub.

---

## AI Service Architecture

MovieMonk uses a robust multi-provider AI architecture with automatic fallback:

### Provider Priority

1. **Groq (Primary)** - `groqService.ts`
   - Model: `llama-3.3-70b-versatile`
   - Fast inference, free tier with generous limits
   - 30 requests/minute

2. **Mistral (Backup)** - `mistralService.ts`
   - Model: `mistral-large-latest`
   - 2M tokens/month free tier
   - Activated when Groq is unavailable

3. **OpenRouter (Fallback)** - `openrouterService.ts`
   - Multiple models available
   - Used as last resort
   - Proxied through Vercel serverless function

### How AI Integration Works

**1. Query Processing:**
```typescript
// User query is sent to AI service with complexity mode
const result = await aiService.fetchMovieData(query, complexity);
```

**2. AI Provider Selection:**
```typescript
// Services/aiService.ts automatically tries providers in order:
try {
  return await groqService.fetchMovieData(query, complexity);
} catch (error) {
  try {
    return await mistralService.fetchMovieData(query, complexity);
  } catch (error) {
    return await openrouterService.fetchMovieData(query, complexity);
  }
}
```

**3. Response Format:**
All AI providers return structured JSON with movie data:
```typescript
{
  title: string;
  year: number;
  plot: string;
  genres: string[];
  cast: Array<{name: string, character: string}>;
  // ... additional fields
}
```

---

## Authentication & Setup

### Required Environment Variables

```env
# AI Providers
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
OPENROUTER_API_KEY=your_openrouter_key

# Movie Data
TMDB_API_KEY=your_tmdb_key
TMDB_READ_TOKEN=your_tmdb_token
OMDB_API_KEY=your_omdb_key

# Optional
PERPLEXITY_API_KEY=your_perplexity_key
```

### Getting API Keys

- **Groq**: [console.groq.com](https://console.groq.com)
- **Mistral**: [console.mistral.ai](https://console.mistral.ai)
- **OpenRouter**: [openrouter.ai/keys](https://openrouter.ai/keys)
- **TMDB**: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- **OMDB**: [omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)

---

## TMDB API

### Authentication

**Two authentication methods:**

1. **API Key (v3):**
   ```typescript
   const params = new URLSearchParams({
     api_key: process.env.TMDB_API_KEY!
   });
   ```

2. **Read Access Token (v4 - Recommended):**
   ```typescript
   const headers = {
     Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
     'Content-Type': 'application/json'
   };
   ```

**Get credentials:**
- [Sign up at TMDB](https://www.themoviedb.org/signup)
- Go to Settings → API
- Copy **API Key (v3 auth)** and **Read Access Token (v4 auth)**

**Add to `.env.local`:**
```env
TMDB_API_KEY=your_v3_key
TMDB_READ_TOKEN=your_v4_token
```

---

### Endpoints

**Base URL:**
```typescript
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
```

**Key endpoints used in MovieMonk:**

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/search/movie` | Search movies | `query`, `year` (optional) |
| `/search/tv` | Search TV shows | `query`, `first_air_date_year` (optional) |
| `/search/multi` | Search all media | `query` |
| `/movie/{id}` | Movie details | Movie ID |
| `/tv/{id}` | TV show details | Show ID |
| `/movie/{id}/images` | Movie images | Movie ID |
| `/tv/{id}/images` | TV show images | Show ID |

**Example implementations:**

```typescript
async function tmdbFetch(endpoint: string, params?: URLSearchParams) {
  const url = `${TMDB_BASE_URL}${endpoint}?${params || ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

---

### Image URLs

**TMDB Image CDN:**
```
https://image.tmdb.org/t/p/{size}{file_path}
```

**Available sizes:**

| Type | Sizes |
|------|-------|
| Poster | `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original` |
| Backdrop | `w300`, `w780`, `w1280`, `original` |
| Logo | `w45`, `w92`, `w154`, `w185`, `w300`, `w500`, `original` |

**Implementation:**

```typescript
function buildImageUrl(path: string, size: string = 'w500'): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Usage
const posterUrl = buildImageUrl(movie.poster_path, 'w500');
const backdropUrl = buildImageUrl(movie.backdrop_path, 'original');
```

**Responsive sizes in MovieMonk:**
- Posters: `w500` (default), `w780` (high-res)
- Backdrops: `original` (hero image), `w1280` (gallery)
- Gallery: `w780` for balance between quality and load time

---

### Search & Enrichment

**Search Strategy:**

MovieMonk uses a multi-step search:

1. **Extract title and year** from query
2. **Try movie search** with year filter
3. **Try TV search** if no movie found
4. **Fallback to multi-search** without year
5. **Return first result** (best match)

**Implementation:**

```typescript
async function searchMovieOrShow(title: string, year?: number) {
  // Try movie with year
  if (year) {
    const movieResults = await tmdbFetch('/search/movie', 
      new URLSearchParams({ query: title, year: year.toString() })
    );
    if (movieResults.results?.length > 0) {
      return { 
        result: movieResults.results[0], 
        mediaType: 'movie' as const 
      };
    }
  }

  // Try movie without year
  const movieResults = await tmdbFetch('/search/movie',
    new URLSearchParams({ query: title })
  );
  if (movieResults.results?.length > 0) {
    return { 
      result: movieResults.results[0], 
      mediaType: 'movie' as const 
    };
  }

  // Try TV
  const tvResults = await tmdbFetch('/search/tv',
    new URLSearchParams({ query: title })
  );
  if (tvResults.results?.length > 0) {
    return { 
      result: tvResults.results[0], 
      mediaType: 'tv' as const 
    };
  }

  return null;
}
```

**Image Enrichment:**

Always prefer TMDB images over AI-provided URLs:

```typescript
async function enrichWithTMDB(data: MovieData): Promise<MovieData> {
  const { result, mediaType } = await searchMovieOrShow(data.title, data.year);

  if (!result) return data;

  const imagesData = await tmdbFetch(`/${mediaType}/${result.id}/images`);

  return {
    ...data,
    poster_url: buildImageUrl(result.poster_path) || data.poster_url,
    backdrop_url: buildImageUrl(result.backdrop_path) || data.backdrop_url,
    gallery_images: [
      ...imagesData.backdrops.slice(0, 4).map(img => buildImageUrl(img.file_path, 'w780')),
      ...imagesData.posters.slice(0, 2).map(img => buildImageUrl(img.file_path, 'w780'))
    ].slice(0, 6)
  };
}
```

---

### Error Handling

**1. Network Errors:**
```typescript
try {
  const data = await tmdbFetch('/search/movie', params);
} catch (error) {
  console.warn('TMDB fetch failed:', error);
  return null; // Graceful fallback
}
```

**2. Invalid Credentials:**
```typescript
if (response.status === 401) {
  throw new Error('Invalid TMDB credentials. Check .env.local');
}
```

**3. Rate Limiting:**
```typescript
if (response.status === 429) {
  console.warn('TMDB rate limit hit. Retrying in 1s...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Retry logic
}
```

**4. Missing Images:**
```typescript
function isValidImagePath(path: string | null): boolean {
  return path !== null && path !== undefined && path.startsWith('/');
}

const posterUrl = isValidImagePath(result.poster_path)
  ? buildImageUrl(result.poster_path)
  : 'fallback.png';
```

---

### Example Requests

**Search for a movie:**

```bash
curl -X GET "https://api.themoviedb.org/3/search/movie?query=Inception&year=2010" \
  -H "Authorization: Bearer YOUR_READ_TOKEN"
```

**Response:**
```json
{
  "results": [{
    "id": 27205,
    "title": "Inception",
    "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    "release_date": "2010-07-16",
    "vote_average": 8.369
  }]
}
```

**Fetch movie images:**

```bash
curl -X GET "https://api.themoviedb.org/3/movie/27205/images" \
  -H "Authorization: Bearer YOUR_READ_TOKEN"
```

**Response:**
```json
{
  "backdrops": [
    { "file_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg", "width": 1920, "height": 1080 }
  ],
  "posters": [
    { "file_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", "width": 2000, "height": 3000 }
  ]
}
```

---

## Integration Patterns

### AI + TMDB Data Flow

**Complete request flow:**

1. **User sends query** → ChatInterface component
2. **AI service processes** → Tries Groq → Falls back to Mistral → Falls back to OpenRouter
3. **TMDB enrichment** → Adds accurate images, cast, ratings
4. **OMDB integration** → Fetches IMDB ratings
5. **Cache storage** → Saves to localStorage and IndexedDB
6. **Display result** → MovieDisplay renders complete data

**Implementation example:**

```typescript
async function fetchMovieData(query: string, complexity: QueryComplexity) {
  // Step 1: Check cache first
  const cached = await cacheService.get(query);
  if (cached) return cached;

  // Step 2: Get AI-generated content (with fallback)
  const aiResult = await aiService.fetchMovieData(query, complexity);
  
  // Step 3: Enrich with TMDB data
  const enrichedData = await tmdbService.enrichWithTMDB(aiResult.data);
  
  // Step 4: Add IMDB ratings via OMDB
  const withRatings = await omdbService.addRatings(enrichedData);
  
  // Step 5: Cache the result
  await cacheService.set(query, withRatings);
  
  return withRatings;
}
```

### When to Use Which Service

| Data Type | Primary Source | Fallback | Reason |
|-----------|---------------|----------|--------|
| Plot, themes, trivia | **Groq/Mistral** | OpenRouter | Fast, free, natural language |
| Images (poster, backdrop) | **TMDB** | AI placeholder | Reliable, high-quality URLs |
| IMDB ratings | **OMDB** | None | Official IMDB data |
| Cast & crew | **TMDB** | AI data | 100% accurate from database |
| Where to watch | **AI providers** | Perplexity | Real-time info |
| Gallery images | **TMDB** | None | High-resolution gallery |

---

## Rate Limits & Best Practices

### AI Provider Limits

**Groq:**
- **Limits**: 30 requests/minute, unlimited daily (free tier)
- **Best practices**:
  - Primary provider due to speed and generous limits
  - Cache responses aggressively
  - Use for both simple and complex queries

**Mistral:**
- **Limits**: 2M tokens/month (free tier)
- **Best practices**:
  - Backup provider when Groq unavailable
  - Monitor token usage
  - Good for detailed responses

**OpenRouter:**
- **Limits**: Varies by model, pay-per-use
- **Best practices**:
  - Use only as last resort
  - Consider cost implications
  - Proxied through Vercel serverless function for security

### TMDB API

**Limits:**
- ~40 requests per 10 seconds
- No daily cap

**Best practices:**
- Cache search results (localStorage + IndexedDB)
- Batch image requests
- Use appropriate image sizes (not always `original`)
- Prefer v4 Read Access Token over v3 API key

**Caching example:**
```typescript
const cacheKey = `tmdb_movie_${title}_${year}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const result = await searchMovieOrShow(title, year);
localStorage.setItem(cacheKey, JSON.stringify(result), { 
  expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
});
```

### Optimization Strategies

**Client-side optimizations:**
```typescript
// Debounce search input
const debouncedSearch = debounce((query: string) => {
  fetchMovieData(query, complexity);
}, 500);

// Lazy load images
<img loading="lazy" src={posterUrl} />

// Use React.memo for expensive components
const MovieCard = React.memo(({ movie }) => {
  // Expensive rendering logic
});
```

---

## Security & Best Practices

### API Key Protection

**Environment Variables:**
- Never commit `.env.local` to Git (already in `.gitignore`)
- Use GitHub Secrets or Vercel Environment Variables for deployment
- Rotate keys immediately if exposed

**Vercel Serverless Functions:**
- All API keys stored server-side only
- OpenRouter API proxied through `/api/openrouter` to hide key
- Keys never exposed to client-side code
- CORS protection on serverless endpoints

**Key Security Checklist:**
```bash
# ✅ Good: Server-side environment variables
GROQ_API_KEY=sk-...
MISTRAL_API_KEY=...

# ❌ Bad: Client-side exposed variables (don't use VITE_ prefix for keys)
# VITE_GROQ_API_KEY=sk-...
```

**Monitoring:**
- Monitor API usage in provider dashboards
- Set up usage alerts
- Review logs for unusual patterns
- Implement rate limiting on your endpoints

---

## TMDB API Reference

### Endpoints Used

**Base URL:** `https://api.themoviedb.org/3`

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/search/movie` | Search movies | `query`, `year` (optional) |
| `/search/tv` | Search TV shows | `query`, `first_air_date_year` (optional) |
| `/search/multi` | Search all media | `query` |
| `/movie/{id}` | Movie details | Movie ID |
| `/tv/{id}` | TV show details | Show ID |
| `/movie/{id}/images` | Movie images | Movie ID |
| `/tv/{id}/images` | TV show images | Show ID |
| `/movie/{id}/external_ids` | Get external IDs (IMDB) | Movie ID |

### Image URLs

**Format:** `https://image.tmdb.org/t/p/{size}{file_path}`

**Available sizes:**
- **Poster**: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`
- **Backdrop**: `w300`, `w780`, `w1280`, `original`
- **Logo**: `w45`, `w92`, `w154`, `w185`, `w300`, `w500`, `original`

**Implementation:**
```typescript
function buildImageUrl(path: string, size: string = 'w500'): string {
  if (!path || !path.startsWith('/')) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
```

---

## Troubleshooting

### AI Service Issues

**Issue: "API key not valid" or "Unauthorized"**
- Verify API keys in `.env.local`
- Check for extra spaces or newlines in keys
- Restart dev server after updating environment variables
- For Vercel deployment, check environment variables in dashboard

**Issue: All AI providers failing**
- Check API key validity for all providers
- Verify internet connectivity
- Check provider status pages:
  - Groq: [status.groq.com](https://status.groq.com)
  - Mistral: [status.mistral.ai](https://status.mistral.ai)
  - OpenRouter: [status.openrouter.ai](https://status.openrouter.ai)

**Issue: Slow responses**
- Use Simple mode for faster processing
- Check network throttling in DevTools
- Verify caching is working (check localStorage)
- Consider proximity to provider servers

### TMDB Issues

**Issue: Images not loading**
- Verify TMDB credentials (prefer Read Access Token)
- Check console for 401/404 errors
- Ensure `enrichWithTMDB` is being called
- Validate image URLs start with `https://image.tmdb.org/`

**Issue: Search returns no results**
- Try without year filter
- Check for typos in title
- Use multi-search endpoint as fallback
- Verify movie exists in TMDB database

### General Debugging

**Browser Console:**
- Check for error messages
- Look for failed network requests (F12 → Network tab)
- Verify API responses are valid JSON

**Service Logs:**
- AI services log errors to console
- TMDB service warns on image fetch failures
- Cache service logs hits/misses in development

---

## Resources & Documentation

### AI Providers
- [Groq Documentation](https://console.groq.com/docs)
- [Mistral AI Docs](https://docs.mistral.ai)
- [OpenRouter API Docs](https://openrouter.ai/docs)

### Movie Data APIs
- [TMDB API Documentation](https://developer.themoviedb.org/docs)
- [TMDB API Reference](https://developer.themoviedb.org/reference/intro/getting-started)
- [OMDB API Documentation](http://www.omdbapi.com/)

### Development Tools
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Deployment
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)

---

## Future Enhancements

**Potential additions:**
- WebSocket support for real-time updates
- GraphQL API wrapper
- Additional AI providers (Anthropic Claude, etc.)
- Redis caching layer for production
- Webhook integration for TMDB updates
- Batch processing for multiple queries
- User authentication and personalization
- Recommendation engine based on viewing history

---



================================================
FILE: docs/ARCHITECTURE.md
================================================
# How MovieMonk Works

Simple overview of the app structure.

---

## Main Parts

### 1. User Interface
- `ChatInterface.tsx` - Where you type your search
- `MovieDisplay.tsx` - Shows the movie/show info
- `App.tsx` - Connects everything together

### 2. Data Services
- `aiService.ts` - Manages AI provider fallback chain (Groq → Mistral → OpenRouter)
- `groqService.ts` - Primary AI provider (fast and free)
- `mistralService.ts` - Backup AI provider
- `openrouterService.ts` - Fallback AI provider
- `tmdbService.ts` - Gets movie data from TMDB
- `cacheService.ts` - Stores results to speed things up
- `perplexityService.ts` - Web search for recent releases (optional)

### 3. Data Flow

```
You search "Inception"
         ↓
App checks cache
         ↓
If not cached:
    → Call TMDB for movie data
    → Call AI (Groq → Mistral → OpenRouter fallback)
    → Merge the data
    → Save to cache
         ↓
Show results on screen
```

---

## How AI Works

1. You ask about a movie
2. We find it in TMDB database
3. AI (Groq/Mistral/OpenRouter) writes summaries and trivia
4. We combine TMDB facts + AI creativity
5. You see the complete result

---

## Why This Design?

- **TMDB First**: Always accurate cast, crew, ratings
- **AI Enhancement**: Creative summaries and trivia from multiple providers
- **Caching**: Makes repeat searches instant
- **Multiple AI Providers**: Automatic fallback if one fails (Groq → Mistral → OpenRouter)
- **Perplexity Integration**: Web search for recent or obscure titles

---

That's it! Simple and straightforward.



================================================
FILE: docs/CACHING.md
================================================
# Caching Strategy

How MovieMonk keeps responses fast and reduces AI/API calls.

---

## Layers at a glance
- **localStorage (client)** — short-lived cache for recent searches.
- **IndexedDB (client)** — longer-lived cache for structured results per user.
- **Redis (server, optional)** — shared cache when `REDIS_URL` is set; safely skipped if unavailable.

All caches store complete movie/person payloads and AI-enriched responses. Errors and partial responses are not cached.

## Default behavior
1. Check IndexedDB, then localStorage for a given query/provider.
2. If not cached, fetch TMDB data + AI summaries.
3. Save the full response back to IndexedDB/localStorage (and Redis if configured).
4. Periodically clear stale client cache entries to keep storage small.

## Enabling server cache
1. Provision a Redis instance (any managed Redis works).
2. Add `REDIS_URL` to `.env.local` (and your hosting provider’s env vars).
3. Deploy normally. If Redis is unreachable, the app logs a warning and falls back to client-only caching.

## Cache keys and TTLs
- Keys include query and provider to avoid mixing responses.
- Client cache entries are short lived (hours to days); Redis TTL is set by the API helper when writing.

## Troubleshooting
- **Seeing no cache hits**: confirm the same query/provider is reused and that cookies/storage are not blocked.
- **Redis warnings**: check `REDIS_URL` and connectivity; functionality continues without Redis.
- **Stale data**: clear browser storage and restart the dev server to refresh caches.



================================================
FILE: docs/DEPLOYMENT.md
================================================
# Deployment Guide

How to deploy MovieMonk to production.

---

## Recommended: Vercel
1. Install and log in:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. Add environment variables (repeat for each key you use):
   ```bash
   vercel env add TMDB_API_KEY
   vercel env add TMDB_READ_TOKEN
   vercel env add OMDB_API_KEY
   vercel env add GROQ_API_KEY
   vercel env add MISTRAL_API_KEY
   vercel env add OPENROUTER_API_KEY
   vercel env add PERPLEXITY_API_KEY   # optional
   vercel env add SERPAPI_KEY          # optional
   vercel env add REDIS_URL            # optional
   ```
3. Deploy:
   ```bash
   npm run build       # confirm it succeeds locally
   vercel --prod
   ```
Your app is live at the URL Vercel prints. Re-run `vercel --prod` after future changes.

## Other hosting options

### Railway
1. Create a Railway project from this repo.
2. Build command: `npm run build`; Start command: `npm run preview`.
3. Add the same environment variables listed above (including `REDIS_URL` if you want server caching).
4. Deploy from the Railway dashboard.

### Netlify
1. Import from Git and set:
   - Build command: `npm run build`
   - Publish directory: `dist`
2. Add required environment variables.
3. Deploy from the Netlify UI or CLI.

## Self-host (VPS / Docker)

### Using Node + PM2

```bash
# On your VPS
git clone https://github.com/YOUR_USERNAME/moviemonk-ai.git
cd moviemonk-ai

# Install dependencies
npm install

# Create .env.local with your API keys
nano .env.local

# Build
npm run build

# Install PM2
npm install -g pm2

# Serve with PM2
pm2 serve dist 3000 --spa
pm2 save
pm2 startup
```

### Using Nginx (Static Hosting)

```bash
# Build locally
npm run build

# Upload dist/ to VPS
scp -r dist/* user@your-vps:/var/www/moviemonk/

# Nginx config
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/moviemonk;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | **Yes** | Groq API key for AI queries (primary provider) |
| `MISTRAL_API_KEY` | Recommended | Mistral API key (backup provider) |
| `OPENROUTER_API_KEY` | Recommended | OpenRouter API key (fallback provider) |
| `TMDB_API_KEY` | **Yes** | TMDB v3 API Key for movie data |
| `TMDB_READ_TOKEN` | Recommended | TMDB v4 Read Access Token (preferred over v3) |
| `OMDB_API_KEY` | **Yes** | OMDB API key for IMDB ratings |
| `PERPLEXITY_API_KEY` | Optional | Perplexity API for web search (recent releases) |
| `SERPAPI_KEY` | Optional | Suggestion/search enrichment |
| `REDIS_URL` | Optional | Redis endpoint for shared server caching |

**Note**: You need at least Groq, TMDB, and OMDB credentials to run the app. Mistral and OpenRouter provide backup/fallback functionality.

---

## Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] Search functionality works
- [ ] Images display correctly (poster, backdrop, gallery)
- [ ] Trailers play
- [ ] "Where to watch" links populate
- [ ] Both Simple and Complex query modes work
- [ ] Mobile responsive design works
- [ ] Favicon displays
- [ ] Console has no critical errors

---

## Monitoring & Analytics

### Add Google Analytics (Optional)

1. Get tracking ID from Google Analytics
2. Add to `index.html` before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Rollback Strategy

### GitHub Pages

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Other Platforms

Most platforms (Railway, Vercel, Netlify) allow rollback to previous deployments via their dashboards.

---

## Performance Optimization

**For Production:**
- Enable Gzip/Brotli compression on server
- Use CDN for static assets
- Implement caching headers
- Consider lazy-loading images
- Add service worker for offline support (PWA)

---

## Support

For deployment issues:
- Check platform status pages
- Review build logs in Actions tab (GitHub)
- Verify environment variables are set correctly
- Test locally first: `npm run build && npm run preview`



================================================
FILE: docs/DEVELOPMENT.md
================================================
# Development Guide

How to work on MovieMonk locally with the current toolchain.

---

## Prerequisites
- Node.js 20+
- npm (installed with Node)
- Access to required API keys (see environment list below)

## Setup
1. Clone your fork and install dependencies:
   ```bash
   git clone https://github.com/mfscpayload-690/moviemonk-ai.git
   cd moviemonk-ai
   npm install
   ```
2. Create `.env.local` with the keys you need:
   ```env
   TMDB_API_KEY=...
   TMDB_READ_TOKEN=...
   OMDB_API_KEY=...
   GROQ_API_KEY=...
   MISTRAL_API_KEY=...
   OPENROUTER_API_KEY=...
   PERPLEXITY_API_KEY=...
   SERPAPI_KEY=...
   REDIS_URL=...        # optional for server cache
   ALLOWED_ORIGINS=...  # optional CORS allowlist
   APP_ORIGIN=...       # optional origin for CORS headers
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Vite serves the app at http://localhost:3000 with hot reload.

## Project layout
- `App-Responsive.tsx` — main UI shell that wires the search island and result views.
- `components/` — UI components (search island, displays, icons).
- `services/` — API integrations, AI provider orchestration, caching helpers.
- `api/` — Vercel-style serverless routes for TMDB/OMDB, AI providers, and search endpoints.
- `lib/` — shared utilities (e.g., Redis cache wrapper).
- `styles/` — global styles and component-specific CSS.
- `__tests__/` — Jest tests covering APIs and core services.

## Common workflows
- **Feature work**: create a branch, implement changes, `npm run dev` for manual verification, then `npm test -- --runInBand` and `npm run build`.
- **Bug fixes**: reproduce in dev, add or update tests alongside the fix, ensure `npm run lint` passes.
- **API changes**: update handlers under `api/`, keep observability/cors helpers intact, and refresh related docs in `docs/API.md`.

## Testing and quality
- Unit/integration tests: `npm test -- --runInBand`
- Type check: `npm run lint`
- Production build: `npm run build`

## Troubleshooting
- **Invalid API key**: confirm values in `.env.local` and ensure Vite picked up changes (restart dev server).
- **CORS issues**: set `ALLOWED_ORIGINS` or `APP_ORIGIN` when calling APIs from different origins.
- **Slow responses**: verify `REDIS_URL` is reachable if server caching is enabled; otherwise caching falls back to browser storage only.

## Contributing
See `../CONTRIBUTING.md` for branching, review, and PR expectations.

4. **Build** to ensure no errors:
   ```bash
   npm run build
   ```

5. **Commit** with descriptive message:
   ```bash
   git add .
   git commit -m "feat: Add [feature description]"
   ```

6. **Push** and create Pull Request:
   ```bash
   git push origin feature/my-new-feature
   ```

### Modifying AI Prompts

**Location**: `constants.ts` → `INITIAL_PROMPT`

**Guidelines:**
- Be explicit about expected output format
- Include examples for complex fields
- Update `MOVIE_DATA_SCHEMA` if adding/removing fields
- Sync changes with `types.ts`

**Testing prompts:**
```bash
npm run dev
# Try various queries: simple, complex, edge cases
# Check console logs for AI provider responses
# Verify all providers return consistent format
```

### Changing Data Schema

**Steps:**
1. Update `types.ts` → Add/modify interface
2. Update `constants.ts` → `MOVIE_DATA_SCHEMA`
3. Update `constants.ts` → `INITIAL_PROMPT` (describe new field)
4. Update UI → `MovieDisplay.tsx` to render new field
5. Test end-to-end

**Example** - Adding a `budget` field:

```typescript
// types.ts
export interface MovieData {
  // ...existing fields
  budget: string;
}

// constants.ts - MOVIE_DATA_SCHEMA
budget: { 
  type: Type.STRING, 
  description: "Production budget in USD (e.g., '$200 million')" 
}

// constants.ts - INITIAL_PROMPT
// Add instruction to fetch budget

// MovieDisplay.tsx
<p className="text-sm">
  <span className="font-semibold">Budget:</span> {movie.budget}
</p>
```

### Adding TMDB Features

**Location**: `services/tmdbService.ts`

**Available endpoints** (extend as needed):
- `/movie/{id}` - Movie details
- `/tv/{id}` - TV show details
- `/person/{id}` - Actor/director info
- `/discover/movie` - Browse movies
- `/trending/{media_type}/{time_window}` - Trending content

**Example** - Fetch similar movies:

```typescript
async function fetchSimilarMovies(mediaType: 'movie'|'tv', id: number): Promise<MovieData[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/similar`);
    return data.results.slice(0, 5).map(/* transform to MovieData */);
  } catch (e) {
    console.warn('Similar movies error:', e);
    return [];
  }
}
```

### Modifying AI Service Behavior

**Location**: `services/aiService.ts`, `services/groqService.ts`, `services/mistralService.ts`

**Provider fallback chain:**
1. Groq (primary)
2. Mistral (backup)
3. OpenRouter (fallback)

**Testing provider changes:**
```bash
npm run dev
# Try various queries in different complexity modes
# Check browser console for which provider was used
# Verify fallback works by temporarily disabling providers
```

---

## Debugging

### Browser DevTools

**Browser DevTools:**

**Console logs:**
- AI services log provider selection and errors
- TMDB service logs search/image errors
- Check for parsing failures
- Monitor which AI provider is being used

**Network tab:**
- Monitor API calls to `/api/*` endpoints
- Check request/response payloads
- Verify 200 status codes
- Watch for rate limiting errors

**React DevTools:**
- Install extension: [React DevTools](https://react.dev/learn/react-developer-tools)
- Inspect component state/props
- Profile performance

### Common Issues

**Issue: "API key not valid"**
- Check `.env.local` has correct key
- Restart dev server after env changes: `Ctrl+C` then `npm run dev`
- Verify no extra spaces or newlines in keys

**Issue: Images not loading**
- Verify TMDB credentials (prefer Read Access Token)
- Check console for 401 errors
- Ensure `enrichWithTMDB` is called in data flow

**Issue: JSON parsing fails**
- Log raw response in AI service files
- Check if AI returned unexpected format
- Verify schema matches `types.ts`

**Issue: Slow queries**
- Use Simple mode for testing
- Complex mode has longer processing time
- Check network throttling in DevTools
- Verify caching is working

**Issue: AI provider failures**
- Check provider status pages
- Verify all API keys are valid
- System should automatically fallback to next provider
- Check console logs for fallback messages

---

## Testing

**Manual testing checklist:**
- [ ] Search for a movie (e.g., "Inception")
- [ ] Toggle Simple vs Complex mode
- [ ] Verify all data fields populate
- [ ] Click spoiler sections
- [ ] Play trailer
- [ ] Check gallery images
- [ ] Test on mobile viewport
- [ ] Try edge cases (typos, non-existent titles)

**Future: Automated tests**
- Unit tests for services (Jest/Vitest)
- Component tests (React Testing Library)
- E2E tests (Playwright)

---

## Build & Preview

```bash
# Production build
npm run build

# Preview build locally
npm run preview
```

**Build output**: `dist/` directory

**Optimization:**
- Vite bundles and minifies
- Code splitting automatic
- Assets hashed for caching

---

## Environment Variables

**Development** (`.env.local`):
```env
# AI Providers
GROQ_API_KEY=your_key
MISTRAL_API_KEY=your_key
OPENROUTER_API_KEY=your_key

# Movie Data APIs
TMDB_READ_TOKEN=your_token
TMDB_API_KEY=your_key
OMDB_API_KEY=your_key

# Optional
PERPLEXITY_API_KEY=your_key
```

**Production** (Vercel Environment Variables):
- Add same variables in Vercel dashboard
- Go to Project Settings → Environment Variables
- Keys are injected at runtime via serverless functions

**Accessing in code:**
```typescript
const apiKey = process.env.GROQ_API_KEY;
```

**Security note:** With the current architecture, API keys for AI providers are accessed via Vercel serverless functions (`/api/*`), keeping them secure and never exposed to the browser.

---

## Git Workflow

### Branching Strategy

- `main` - production-ready code
- `feature/*` - new features
- `fix/*` - bug fixes
- `docs/*` - documentation updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add actor search functionality
fix: Resolve image loading issue
docs: Update API integration guide
style: Format code with Prettier
refactor: Simplify TMDB service
```

### Pull Requests

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Tested locally
- [ ] Build passes
- [ ] No console errors

## Screenshots (if UI changes)
[Attach screenshots]
```

---

## Code Quality

### Linting (Future)

**Recommended setup:**
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
```

**Run:**
```bash
npm run lint
npm run format
```

### Type Checking

```bash
npx tsc --noEmit
```

---

## Performance Tips

**Optimization strategies:**
- Lazy load images: `loading="lazy"`
- Debounce search input
- Cache TMDB responses (localStorage)
- Use React.memo for expensive components
- Code split routes (if adding navigation)

---

## Troubleshooting Dev Environment

**Node version issues:**
```bash
node -v  # Should be 18+
nvm use 20  # If using nvm
```

**Dependency issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in vite.config.ts
```

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Mistral AI Docs](https://docs.mistral.ai)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [TMDB API Docs](https://developer.themoviedb.org/docs)

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/mfscpayload-690/moviemonk-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mfscpayload-690/moviemonk-ai/discussions)
- **Email**: Check README for contact info

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow) for detailed workflow.



================================================
FILE: docs/DYNAMIC_SEARCH_ISLAND.md
================================================
# Dynamic Search Island - Implementation Summary

## Overview
Replaced the traditional chat-style sidebar with a floating "Dynamic Search Island" that provides a modern, unobtrusive search interface while preserving the full Featured UI.

## What Changed

### New Components
1. **`components/DynamicSearchIsland.tsx`**
   - Floating search interface with two states:
     - **Collapsed**: Animated pill (60x60px) with subtle bob and shimmer animations
     - **Expanded**: Full search panel with input, provider selector, and analysis mode toggle
   - Features:
     - Keyboard shortcuts: `/` or `K` to open, `Enter` to search, `Esc` to close
     - localStorage persistence for provider (`groq`/`mistral`) and analysis mode (`quick`/`complex`)
     - Full ARIA labels and focus management for accessibility
     - Respects `prefers-reduced-motion` for animations
     - Mobile-first responsive design with `safe-area-inset-bottom` support

2. **`styles/dynamic-search-island.css`**
   - CSS animations and transitions:
     - `gentle-bob`: Vertical bobbing animation (3s loop)
     - `shimmer`: Gradient shimmer effect (2s loop)
     - `expand-in`: Smooth expansion transition
   - Positioning:
     - Desktop: bottom-right with 2rem margins
     - Mobile: bottom-center for thumb accessibility
   - Custom form controls styled to match MovieMonk theme

3. **`components/icons.tsx`**
   - Added `SearchIcon` for the collapsed search island state

### Modified Files
1. **`App-Responsive.tsx`**
   - **Removed**: 
     - `ChatInterface` sidebar component
     - `ProviderSelector` component
     - Mobile chat expansion state and UI
     - Provider status management
   - **Added**:
     - `DynamicSearchIsland` component integration
     - Updated `handleSendMessage` to accept `provider` parameter
     - Simplified state (removed `selectedProvider`, `providerStatus`, `isMobileChatExpanded`)
   - **Preserved**:
     - All Featured UI (hero, tiles, "Explore" buttons)
     - Person search and disambiguation
     - Movie display logic
     - Summary modal
     - Error handling

### Analytics Integration
The new search island tracks:
- `search_island_opened`: When the island is expanded (via click or keyboard)
- `search_island_closed`: When collapsed
- `search_submitted_island`: Search submissions with metadata (query length, provider, analysis mode)
- `provider_changed`: Provider selection changes
- `analysis_mode_toggled`: Quick/Complex mode changes

All tracking preserves existing Vercel Web Analytics events from other components.

## Accessibility Features
- **ARIA labels**: `aria-label`, `aria-expanded`, `aria-controls`, `aria-modal`
- **Focus management**: Auto-focus on input when expanded, restore focus to trigger on close
- **Keyboard navigation**: 
  - `/` or `K` to open from anywhere
  - `Enter` to submit
  - `Esc` to close
  - Tab order preserved
- **Screen reader support**: Descriptive labels and state announcements
- **Reduced motion**: All animations disabled when `prefers-reduced-motion: reduce`

## localStorage Persistence
Two keys store user preferences:
- `moviemonk_provider`: `'groq'` (default) or `'mistral'`
- `moviemonk_analysis_mode`: `'quick'` (default) or `'complex'`

Preferences persist across sessions and are loaded on mount.

## Responsive Behavior
- **Desktop (≥768px)**: 
  - Floating bottom-right
  - Expanded width: 420px max
  - Clear of main content
  
- **Mobile (<768px)**:
  - Floating bottom-center
  - Expanded width: calc(100vw - 2rem)
  - Positioned with `safe-area-inset-bottom` for notch/home indicator
  - Input remains visible when keyboard opens (iOS/Android)

## Animation Performance
- Uses CSS `transform` and `opacity` for 60fps performance
- No animating of `top`/`left` (causes reflow)
- `will-change` hints for GPU acceleration (implicitly via transform)
- Animations pause when `prefers-reduced-motion` is detected

## Testing Results
✅ **Build**: Clean (`npm run build`)
✅ **TypeScript**: No errors (`npm run lint`)
✅ **Tests**: All pass (5 suites, 14 tests)
✅ **Bundle size**: 
   - Before: 284.06 KB gzipped
   - After: 275.01 KB gzipped (9 KB reduction, -3.2%)
   - CSS: +5.40 KB (1.61 KB gzipped)

## Browser Compatibility
Tested targets:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (desktop)
- ✅ iOS Safari (with safe-area support)
- ✅ Android Chrome

CSS features used:
- `env(safe-area-inset-*)` with fallback
- `backdrop-filter: blur()` with fallback background
- CSS Grid and Flexbox
- CSS animations and transforms
- Modern selectors (`:focus`, `:hover`, `::placeholder`)

## Migration Notes
- Old `ChatInterface` component still exists but is no longer imported in `App-Responsive.tsx`
- Backup created: `App-Responsive-Old.tsx.bak`
- Provider selection now happens in the search island; removed from sidebar
- Analysis mode (Quick/Complex) is now a simple toggle instead of a detailed explanation panel
- Mobile "floating AI button" removed in favor of always-visible search island

## Future Enhancements (Optional)
- Add provider status indicators (online/offline) in the dropdown
- Voice search integration via Web Speech API
- Recent searches stored in localStorage
- Animated search suggestions as you type
- Drag-to-reposition the island on desktop
- Custom themes/colors via CSS variables

## Acceptance Criteria Met
✅ Chat-style sidebar removed
✅ Main Featured UI preserved exactly as-is
✅ Floating search island with animated collapsed state
✅ Desktop: bottom-right positioning
✅ Mobile: bottom-center, thumb-accessible
✅ Provider selector with Groq default
✅ Analysis mode toggle (Quick default)
✅ localStorage persistence
✅ Keyboard shortcuts (/, K, Enter, Esc)
✅ Full accessibility (ARIA, focus management)
✅ Reduced-motion support
✅ Build passes with no errors
✅ Tests pass
✅ Mobile keyboard handling (safe-area-inset)

## Verification Steps
1. Run `npm run dev`
2. See floating purple pill in bottom-right (desktop) or bottom-center (mobile)
3. Press `/` or `K` to open
4. Type a query, select provider, toggle analysis mode
5. Press `Enter` to search
6. Verify preferences persist after reload
7. Test keyboard navigation with Tab
8. Test screen reader with NVDA/VoiceOver
9. Enable "Reduce motion" in OS and verify animations disabled
10. Test on iPhone/Android to verify keyboard doesn't obscure input



================================================
FILE: docs/PERFORMANCE.md
================================================
## Perf Debugging

- Enable perf instrumentation by running with `VITE_PERF_DEBUG=true npm run dev`.
- In perf mode the app logs:
  - Long tasks via `PerformanceObserver (longtask)` with duration.
  - Render counts for `App`, `MovieDisplay`, and `PersonDisplay`.

## What We Measured
- Baseline: Search actions triggered multiple rerenders of the full app and watchlist modal; long cast lists caused scroll jank.
- Observed main-thread spikes from synchronous cache cleanup and large list rendering.

## Fixes Implemented
- Added render-count and long-task logging guarded by `VITE_PERF_DEBUG`.
- Memoized handlers and wrapped heavy state updates in `startTransition` to keep input updates urgent.
- Virtualized large lists (cast grid when expanded, watchlist items) and added `content-visibility: auto` to heavy sections to defer painting.
- Moved cache and IndexedDB cleanup to idle time to avoid blocking interactions.
- Standardized icons (emoji-free) and reduced unnecessary state (progress/messages) to cut rerenders.

## How to Verify
- With `VITE_PERF_DEBUG=true`, perform a search and expand cast lists; render counts should stay steady and long-task logs should remain sparse.
- Scroll long cast lists and large watchlists; scrolling should remain smooth without layout thrash.
- Toggle watchlists modal and search island while typing to confirm UI remains responsive.



================================================
FILE: hooks/useDebounce.ts
================================================
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}



================================================
FILE: hooks/useDiscovery.ts
================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiscoveryGenre, DiscoveryItem } from '../types';
import {
  fetchByGenre,
  fetchDiscoverMovie,
  fetchDiscoverTv,
  fetchGenreList,
  fetchOnTheAir,
  fetchNowPlaying,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming
} from '../services/tmdbService';

export type DiscoverySection = {
  key: string;
  title: string;
  items: DiscoveryItem[];
};

export type DiscoverySnapshot = {
  heroItems: DiscoveryItem[];
  sections: DiscoverySection[];
  movieGenres: DiscoveryGenre[];
  selectedGenre: DiscoveryGenre | null;
  selectedGenreItems: DiscoveryItem[];
};

const CURATED_GENRE_NAMES: string[] = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Science Fiction',
  'Romance',
  'Documentary',
  'Animation'
];

export function getCuratedMovieGenres(genres: DiscoveryGenre[]): DiscoveryGenre[] {
  const order = new Map(CURATED_GENRE_NAMES.map((name, index) => [name, index]));
  return genres
    .filter((genre) => order.has(genre.name))
    .sort((a, b) => (order.get(a.name) ?? 0) - (order.get(b.name) ?? 0));
}

export function pickHeroItems(items: DiscoveryItem[], limit = 5): DiscoveryItem[] {
  return items.filter((item) => item.backdrop_url).slice(0, limit);
}

function getDiscoveryTitleKey(item: DiscoveryItem): string {
  return item.title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function mergeUniqueDiscoveryItems(...groups: DiscoveryItem[][]): DiscoveryItem[] {
  const seenByEntity = new Set<string>();
  const merged: DiscoveryItem[] = [];

  groups.flat().forEach((item) => {
    const key = `${item.media_type}-${item.id}`;
    if (seenByEntity.has(key)) return;
    seenByEntity.add(key);
    merged.push(item);
  });

  return merged;
}

export function buildBalancedMixRow(
  total: number,
  pools: Record<string, DiscoveryItem[]>,
  policy: Array<{ pool: string; ratio: number }>
): DiscoveryItem[] {
  const cappedTotal = Math.max(0, total);
  if (cappedTotal === 0 || policy.length === 0) return [];

  const prepared = new Map<string, DiscoveryItem[]>();
  policy.forEach(({ pool }) => {
    const seenTitles = new Set<string>();
    const source = pools[pool] || [];
    prepared.set(
      pool,
      source.filter((item) => {
        const titleKey = getDiscoveryTitleKey(item);
        if (!titleKey || seenTitles.has(titleKey)) return false;
        seenTitles.add(titleKey);
        return true;
      })
    );
  });

  const wanted = new Map<string, number>();
  let allocated = 0;
  policy.forEach(({ pool, ratio }) => {
    const count = Math.floor(cappedTotal * ratio);
    wanted.set(pool, count);
    allocated += count;
  });

  let remainingByRounding = cappedTotal - allocated;
  for (let i = 0; i < policy.length && remainingByRounding > 0; i += 1) {
    const pool = policy[i].pool;
    wanted.set(pool, (wanted.get(pool) || 0) + 1);
    remainingByRounding -= 1;
  }

  const takenByPool = new Map<string, number>();
  policy.forEach(({ pool }) => takenByPool.set(pool, 0));

  const selected: DiscoveryItem[] = [];
  const selectedTitles = new Set<string>();

  const takeFromPool = (pool: string, count: number) => {
    if (count <= 0) return 0;
    const items = prepared.get(pool) || [];
    let cursor = takenByPool.get(pool) || 0;
    let added = 0;

    while (cursor < items.length && added < count) {
      const candidate = items[cursor];
      cursor += 1;
      const titleKey = getDiscoveryTitleKey(candidate);
      if (!titleKey || selectedTitles.has(titleKey)) continue;
      selectedTitles.add(titleKey);
      selected.push(candidate);
      added += 1;
    }

    takenByPool.set(pool, cursor);
    return added;
  };

  policy.forEach(({ pool }) => {
    takeFromPool(pool, wanted.get(pool) || 0);
  });

  // Fallback fill in priority order when a pool is sparse.
  while (selected.length < cappedTotal) {
    let addedInPass = 0;
    for (let i = 0; i < policy.length && selected.length < cappedTotal; i += 1) {
      addedInPass += takeFromPool(policy[i].pool, 1);
    }
    if (addedInPass === 0) break;
  }

  return selected.slice(0, cappedTotal);
}

export function dedupeSectionsByTitle(sections: DiscoverySection[]): DiscoverySection[] {
  const seenTitles = new Set<string>();

  return sections.map((section) => {
    const uniqueItems = section.items.filter((item) => {
      const titleKey = getDiscoveryTitleKey(item);
      if (!titleKey || seenTitles.has(titleKey)) return false;
      seenTitles.add(titleKey);
      return true;
    });

    return {
      ...section,
      items: uniqueItems
    };
  });
}

export async function loadDiscoverySnapshot(signal?: AbortSignal): Promise<DiscoverySnapshot> {
  const [
    trendingAll,
    trendingMovies,
    trendingTv,
    upcoming,
    nowPlaying,
    popularTv,
    onTheAir,
    topRatedMovies,
    topRatedTv,
    movieGenres,
    tvGenres
  ] = await Promise.all([
    fetchTrending('all', 'week', { signal }),
    fetchTrending('movie', 'week', { signal }),
    fetchTrending('tv', 'week', { signal }),
    fetchUpcoming({ signal }),
    fetchNowPlaying({ signal }),
    fetchPopular('tv', { signal }),
    fetchOnTheAir({ signal }),
    fetchTopRated('movie', { signal }),
    fetchTopRated('tv', { signal }),
    fetchGenreList('movie', { signal }),
    fetchGenreList('tv', { signal })
  ]);

  const dramaGenreId = tvGenres.find((genre) => genre.name === 'Drama')?.id;

  const [bollywoodMovies, asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh] = await Promise.all([
    fetchDiscoverMovie({ withOriginalLanguage: 'hi' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'ja' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'ko' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'zh' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'th' }, { signal })
  ]);

  const asianMovies = mergeUniqueDiscoveryItems(asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh);

  const [koreanSeries, japaneseSeries, chineseSeries, thaiSeries] = await Promise.all([
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ko' }, { signal }),
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ja' }, { signal }),
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'zh' }, { signal }),
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'th' }, { signal })
  ]);

  const kDramaAndAsianSeries = mergeUniqueDiscoveryItems(
    koreanSeries,
    japaneseSeries,
    chineseSeries,
    thaiSeries
  ).slice(0, 24);

  const globalWebSeriesAndTv = mergeUniqueDiscoveryItems(onTheAir, topRatedTv, popularTv, trendingTv).slice(0, 24);
  const trendingMoviesMixed = buildBalancedMixRow(
    20,
    {
      global: trendingMovies,
      bollywood: bollywoodMovies,
      asian: asianMovies
    },
    [
      { pool: 'global', ratio: 0.7 },
      { pool: 'bollywood', ratio: 0.15 },
      { pool: 'asian', ratio: 0.15 }
    ]
  );

  const nowPlayingMixed = buildBalancedMixRow(
    20,
    {
      global: nowPlaying,
      bollywood: bollywoodMovies,
      asian: asianMovies
    },
    [
      { pool: 'global', ratio: 0.7 },
      { pool: 'bollywood', ratio: 0.15 },
      { pool: 'asian', ratio: 0.15 }
    ]
  );

  const topRatedMoviesAndSeries = mergeUniqueDiscoveryItems(topRatedMovies, topRatedTv).slice(0, 24);

  const curatedGenres = getCuratedMovieGenres(movieGenres);
  const selectedGenre = curatedGenres[0] || movieGenres[0] || null;
  const selectedGenreItems = selectedGenre
    ? await fetchByGenre(selectedGenre.id, 'movie', { signal })
    : [];

  const prioritizedSections: DiscoverySection[] = [
    { key: 'trending-movies', title: 'Trending Movies', items: trendingMoviesMixed },
    { key: 'upcoming', title: 'Upcoming', items: upcoming },
    { key: 'now-playing-mix', title: 'Now Playing', items: nowPlayingMixed },
    { key: 'top-rated-movies-series', title: 'Top Rated Movies & Series', items: topRatedMoviesAndSeries },
    { key: 'global-web-series-tv', title: 'Global Web Series and TV Shows', items: globalWebSeriesAndTv },
    { key: 'kdrama-asian-series', title: 'K-Drama and Asian Series', items: kDramaAndAsianSeries }
  ];

  return {
    heroItems: pickHeroItems(trendingAll),
    sections: dedupeSectionsByTitle(prioritizedSections),
    movieGenres: curatedGenres,
    selectedGenre,
    selectedGenreItems
  };
}

export function useDiscovery() {
  const genreRequestRef = useRef<AbortController | null>(null);
  const [heroItems, setHeroItems] = useState<DiscoveryItem[]>([]);
  const [sections, setSections] = useState<DiscoverySection[]>([]);
  const [movieGenres, setMovieGenres] = useState<DiscoveryGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<DiscoveryGenre | null>(null);
  const [selectedGenreItems, setSelectedGenreItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenreLoading, setIsGenreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await loadDiscoverySnapshot(signal);
      if (signal?.aborted) return;
      setHeroItems(snapshot.heroItems);
      setSections(snapshot.sections);
      setMovieGenres(snapshot.movieGenres);
      setSelectedGenre(snapshot.selectedGenre);
      setSelectedGenreItems(snapshot.selectedGenreItems);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Failed to load discovery.');
      setHeroItems([]);
      setSections([]);
      setMovieGenres([]);
      setSelectedGenre(null);
      setSelectedGenreItems([]);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadToken]);

  const selectGenre = useCallback(async (genre: DiscoveryGenre) => {
    if (!genre) return;
    genreRequestRef.current?.abort();
    const controller = new AbortController();
    genreRequestRef.current = controller;
    setSelectedGenre(genre);
    setIsGenreLoading(true);
    try {
      const items = await fetchByGenre(genre.id, 'movie', { signal: controller.signal });
      if (controller.signal.aborted) return;
      setSelectedGenreItems(items);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError(err?.message || 'Failed to load genre titles.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsGenreLoading(false);
      }
    }
  }, []);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  return useMemo(() => ({
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  }), [
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  ]);
}



================================================
FILE: hooks/useMovieSearch.ts
================================================
import { useMemo } from 'react';
import Fuse, { FuseOptionKey } from 'fuse.js';

export interface SearchableMovieItem {
  title: string;
  year?: string;
  genres?: string[];
  overview?: string;
  cast?: string[];
}

export interface UseMovieSearchOptions<T extends SearchableMovieItem> {
  limit?: number;
  threshold?: number;
  keys?: FuseOptionKey<T>[];
}

const DEFAULT_LIMIT = 20;
const DEFAULT_THRESHOLD = 0.34;

export function useMovieSearch<T extends SearchableMovieItem>(
  items: T[],
  query: string,
  options: UseMovieSearchOptions<T> = {}
): T[] {
  const { limit = DEFAULT_LIMIT, threshold = DEFAULT_THRESHOLD, keys } = options;

  const fuse = useMemo(() => {
    return new Fuse(items, {
      includeScore: true,
      threshold,
      shouldSort: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: keys || [
        { name: 'title', weight: 0.65 },
        { name: 'genres', weight: 0.15 },
        { name: 'overview', weight: 0.1 },
        { name: 'cast', weight: 0.1 }
      ]
    });
  }, [items, keys, threshold]);

  return useMemo(() => {
    const normalized = query.trim();
    if (!normalized) {
      return items.slice(0, limit);
    }

    return fuse.search(normalized, { limit }).map((result) => result.item);
  }, [fuse, items, limit, query]);
}



================================================
FILE: hooks/useWatchlists.ts
================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { MovieData, WatchlistFolder, WatchlistItem } from '../types';
import {
  addFolderToWatchlists,
  findFolderItem,
  loadWatchlistsFromStorage,
  saveMovieToFolder,
  saveWatchlistsToStorage
} from './watchlistStore';

export function useWatchlists() {
  const [folders, setFolders] = useState<WatchlistFolder[]>([]);
  const hydratedRef = useRef(false);

  const loadFromStorage = useCallback((): WatchlistFolder[] => {
    try {
      return loadWatchlistsFromStorage(localStorage);
    } catch (e) {
      console.warn('Failed to load watchlists', e);
      return [];
    }
  }, []);

  // Hydrate from storage once on mount
  useEffect(() => {
    const initial = loadFromStorage();
    setFolders(initial);
    hydratedRef.current = true;
  }, [loadFromStorage]);

  // Persist to storage after hydration
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      saveWatchlistsToStorage(localStorage, folders);
    } catch (e) {
      console.warn('Failed to save watchlists', e);
    }
  }, [folders]);

  // Use functional updates so add + save in one tick do not clobber state
  const persist = (updater: (prev: WatchlistFolder[]) => WatchlistFolder[]) => {
    setFolders(prev => updater(prev));
  };

  const addFolder = (name: string, color: string) => {
    const { folderId, next } = addFolderToWatchlists(folders, name, color);
    if (!folderId) return null;
    setFolders(next);
    return folderId;
  };

  const saveToFolder = (folderId: string, movie: MovieData, savedTitle?: string) => {
    persist(prev => saveMovieToFolder(prev, folderId, movie, savedTitle));
  };

  const renameFolder = (folderId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist(prev => prev.map(f => f.id === folderId ? { ...f, name: trimmed } : f));
  };

  const setFolderColor = (folderId: string, color: string) => {
    const nextColor = color && color.trim() ? color : undefined;
    if (!nextColor) return;
    persist(prev => prev.map(f => f.id === folderId ? { ...f, color: nextColor } : f));
  };

  const moveItem = (fromFolderId: string, itemId: string, toFolderId: string) => {
    if (!fromFolderId || !toFolderId || !itemId) return;
    if (fromFolderId === toFolderId) return; // no-op

    persist(prev => {
      const from = prev.find(f => f.id === fromFolderId);
      const to = prev.find(f => f.id === toFolderId);
      if (!from || !to) return prev;
      const idx = from.items.findIndex(i => i.id === itemId);
      if (idx === -1) return prev;
      const item = from.items[idx];
      const updatedFrom = { ...from, items: from.items.filter(i => i.id !== itemId) };
      const updatedTo = { ...to, items: [item, ...to.items] };
      return prev.map(f => {
        if (f.id === fromFolderId) return updatedFrom;
        if (f.id === toFolderId) return updatedTo;
        return f;
      });
    });
  };

  const deleteItem = (folderId: string, itemId: string) => {
    if (!folderId || !itemId) return;
    persist(prev => prev.map(f => 
      f.id === folderId 
        ? { ...f, items: f.items.filter(i => i.id !== itemId) }
        : f
    ));
  };

  const refresh = useCallback(() => {
    const fromStorage = loadFromStorage();
    setFolders(fromStorage);
  }, [loadFromStorage]);

  const findItem = (folderId: string, itemId: string) => {
    return findFolderItem(folders, folderId, itemId);
  };

  return {
    folders,
    addFolder,
    saveToFolder,
    findItem,
    refresh,
    renameFolder,
    setFolderColor,
    moveItem,
    deleteItem
  };
}



================================================
FILE: hooks/watchlistStore.ts
================================================
import { MovieData, WatchlistFolder, WatchlistItem } from '../types';

export const WATCHLIST_STORAGE_KEY = 'moviemonk_watchlists_v1';

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getMovieKey = (movie: MovieData) => {
  if (movie.tmdb_id) return `tmdb:${movie.tmdb_id}`;
  return `${movie.title}-${movie.year}-${movie.type}`.toLowerCase();
};

export function loadWatchlistsFromStorage(storage: Pick<Storage, 'getItem'>): WatchlistFolder[] {
  try {
    const raw = storage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatchlistsToStorage(
  storage: Pick<Storage, 'setItem'>,
  folders: WatchlistFolder[]
): void {
  storage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(folders));
}

export function addFolderToWatchlists(
  folders: WatchlistFolder[],
  name: string,
  color: string
): { next: WatchlistFolder[]; folderId: string | null } {
  const trimmed = name.trim();
  if (!trimmed) return { next: folders, folderId: null };
  const folderId = generateId();
  return {
    next: [{ id: folderId, name: trimmed, color: color || '#7c3aed', items: [] }, ...folders],
    folderId
  };
}

export function saveMovieToFolder(
  folders: WatchlistFolder[],
  folderId: string,
  movie: MovieData,
  savedTitle?: string
): WatchlistFolder[] {
  if (!folderId || !movie) return folders;
  const key = getMovieKey(movie);
  const title = (savedTitle && savedTitle.trim()) || movie.title;
  const now = new Date().toISOString();

  return folders.map(folder => {
    if (folder.id !== folderId) return folder;
    const existingIdx = folder.items.findIndex(i => getMovieKey(i.movie) === key);
    const item: WatchlistItem = {
      id: existingIdx >= 0 ? folder.items[existingIdx].id : generateId(),
      saved_title: title,
      movie: { ...movie },
      added_at: now
    };
    if (existingIdx >= 0) {
      const items = [...folder.items];
      items[existingIdx] = item;
      return { ...folder, items };
    }
    return { ...folder, items: [item, ...folder.items] };
  });
}

export function findFolderItem(
  folders: WatchlistFolder[],
  folderId: string,
  itemId: string
): { folder: WatchlistFolder; item: WatchlistItem } | null {
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return null;
  const item = folder.items.find(i => i.id === itemId);
  if (!item) return null;
  return { folder, item };
}


================================================
FILE: lib/cache.ts
================================================
import type { RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisAvailable = true;

async function getRedis(): Promise<RedisClientType | null> {
  if (!redisAvailable) return null;
  if (redisClient) return redisClient;
  
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) {
    console.warn('[cache] REDIS_URL not found - caching disabled');
    redisAvailable = false;
    return null;
  }
  
  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: REDIS_URL });
    client.on('error', (err) => {
      console.error('Redis error:', err);
      redisAvailable = false;
    });
    await client.connect();
    redisClient = client as RedisClientType;
    console.log('[cache] Redis connected');
    return redisClient;
  } catch (error) {
    console.error('[cache] Redis connection failed:', error);
    redisAvailable = false;
    return null;
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const r = await getRedis();
    if (!r) return null;
    
    const raw = await r.get(key);
    if (!raw) return null;
    
    try {
      return JSON.parse(String(raw)) as T;
    } catch {
      return String(raw) as unknown as T;
    }
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    const r = await getRedis();
    if (!r) return; // Skip caching if Redis unavailable
    
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    await r.set(key, payload, { EX: ttlSeconds });
  } catch (error) {
    console.error('Cache set error:', error);
    // Fail silently - don't break the app if caching fails
  }
}

export function withCacheKey(prefix: string, parts: Record<string, any>): string {
  const stable = Object.keys(parts)
    .sort()
    .map((k) => `${k}:${String(parts[k])}`)
    .join('|');
  return `${prefix}:${stable}`;
}



================================================
FILE: lib/perfDebug.ts
================================================
import { useEffect, useRef } from 'react';

const PERF_FLAG = import.meta.env.VITE_PERF_DEBUG === 'true' || import.meta.env.VITE_PERF_DEBUG === true;

let longTaskObserverStarted = false;

export function initPerfDebug(label = 'app') {
    if (!PERF_FLAG || typeof window === 'undefined' || longTaskObserverStarted) return;

    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    console.info('[perf] long task', {
                        label,
                        name: entry.name,
                        duration: Math.round(entry.duration)
                    });
                });
            });
            observer.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit);
            longTaskObserverStarted = true;
        } catch (err) {
            console.info('[perf] PerformanceObserver unavailable for long tasks', err);
        }
    }
}

export function useRenderCounter(label: string) {
    const renderCount = useRef(0);

    useEffect(() => {
        if (!PERF_FLAG) return;
        renderCount.current += 1;
        console.info('[perf] render', { label, count: renderCount.current, ts: performance.now().toFixed(1) });
    });
}



================================================
FILE: scripts/check-no-emoji.js
================================================
const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('git ls-files "*.ts" "*.tsx" "*.js" "*.css" "*.html"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const emojiRegex = /\p{Extended_Pictographic}/u;
const offenders = [];

for (const file of files) {
  if (file.startsWith('node_modules/') || file.startsWith('dist/')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (emojiRegex.test(content)) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error('Emoji characters found in source files:\n' + offenders.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}

console.log('No emojis detected in source files.');



================================================
FILE: services/ai.ts
================================================
import { ChatMessage, QueryComplexity } from '../types';
import { fetchMovieData as fetchFromGroq } from './groqService';
import { fetchMovieData as fetchFromMistral } from './mistralService';
import { fetchMovieData as fetchFromOpenRouter } from './openrouterService';

export type Provider = 'groq' | 'mistral' | 'openrouter';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then((v) => { clearTimeout(id); resolve(v); }).catch((e) => { clearTimeout(id); reject(e); });
  });
}

export function parseJsonResponse<T = any>(raw: string): T | null {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '');
    // Try direct parse
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

export async function generateSummary(args: {
  evidence: string;
  query: string;
  schema: Record<string, unknown>;
  timeoutMs?: number;
  preferred?: Provider;
  chatHistory?: ChatMessage[];
}): Promise<{ ok: true; json: any; provider: Provider } | { ok: false; error: string } > {
  const { evidence, query, schema, timeoutMs = 10000, preferred, chatHistory } = args;

  const system = `You are a film expert. Produce strictly valid JSON only. Match the schema exactly. Do not include markdown fences.`;
  const user = `Using the evidence below, write a concise brief about the subject. Return ONLY JSON matching this schema keys: ${Object.keys(schema).join(', ')}.

Query: ${query}

Evidence:
${evidence}
`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  const order: Provider[] = preferred ? [preferred, 'groq', 'mistral', 'openrouter'].filter((v, i, a) => a.indexOf(v) === i) as Provider[] : ['groq', 'mistral', 'openrouter'];
  const start = Date.now();
  for (const prov of order) {
    const elapsed = Date.now() - start;
    const remaining = timeoutMs - elapsed;
    if (remaining <= 400) return { ok: false, error: 'Timeout: no provider responded' };

    try {
      let call: Promise<any>;
      if (prov === 'groq') call = fetchFromGroq(JSON.stringify({ schema, messages }), QueryComplexity.SIMPLE, chatHistory);
      else if (prov === 'mistral') call = fetchFromMistral(JSON.stringify({ schema, messages }), QueryComplexity.SIMPLE, chatHistory);
      else call = fetchFromOpenRouter(JSON.stringify({ schema, messages }), QueryComplexity.SIMPLE, chatHistory);

      const result = await withTimeout(call, Math.max(1000, remaining), `${prov} summary`);
      const content = result?.movieData ? JSON.stringify(result.movieData) : result?.error ? '' : '';
      // Prefer model JSON body if it returned a movieData-like payload
      const raw = content && content !== '{}' ? content : (result?.choices?.[0]?.message?.content || '');
      const parsed = raw ? parseJsonResponse(raw) : result?.movieData || null;
      if (parsed && typeof parsed === 'object') {
        return { ok: true, json: parsed, provider: prov };
      }
    } catch (e: any) {
      continue;
    }
  }
  return { ok: false, error: 'All providers failed' };
}



================================================
FILE: services/aiService.ts
================================================
import { ChatMessage, MovieData, QueryComplexity, FetchResult, AIProvider } from '../types';
import { fetchMovieData as fetchFromGroq } from './groqService';
import { fetchMovieData as fetchFromMistral } from './mistralService';
import { fetchMovieData as fetchFromOpenRouter } from './openrouterService';
import { fetchMovieData as fetchFromPerplexity } from './perplexityService';
import { getCachedResponse, cacheResponse, clearOldCacheEntries } from './cacheService';
import { getFromIndexedDB, saveToIndexedDB, clearOldIndexedDBEntries } from './indexedDBService';
import { parseQuery, shouldUseComplexModel } from './queryParser';
import { getFromTMDB } from './tmdbService';
import { fetchFromBestSource } from './hybridDataService'; // NEW: Multi-source data fetcher
import { searchWithPerplexity } from './perplexityService';
import { CREATIVE_ONLY_PROMPT } from '../constants';
import { hasDisplayableTitle } from './movieDataValidation';
import {
  startProviderTimer,
  recordProviderSuccess,
  recordProviderError,
  recordFallback,
  recordFinalProvider
} from './observability';

const debugLog = (...args: any[]) => {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
  if (typeof window !== 'undefined' && isDev) {
    console.log(...args);
  }
};

const scheduleIdle = (fn: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    // @ts-ignore requestIdleCallback exists in modern browsers
    window.requestIdleCallback(fn, { timeout: 500 });
  } else {
    setTimeout(fn, 50);
  }
};

// AIProvider is declared in types.ts

// Track last error times for availability checking
const lastErrors: Record<AIProvider, number | null> = {
  groq: null,
  mistral: null,
  perplexity: null,
  openrouter: null
};

const ERROR_COOLDOWN = 30000; // 30 seconds

// Timeout helper for provider calls
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((val) => { clearTimeout(id); resolve(val); })
      .catch((err) => { clearTimeout(id); reject(err); });
  });
}

// Try providers in order within a total time budget
async function tryProvidersInOrder(
  prompt: string,
  complexity: QueryComplexity,
  chatHistory: ChatMessage[] | undefined,
  order: AIProvider[] = ['groq', 'mistral', 'openrouter'],
  totalBudgetMs = 10000,
  requestId = 'unknown'
): Promise<FetchResult> {
  const start = Date.now();
  for (const prov of order) {
    const elapsed = Date.now() - start;
    const remaining = totalBudgetMs - elapsed;
    if (remaining <= 500) {
      return { movieData: null, sources: null, error: 'Timeout: no provider responded in time' };
    }

    const timer = startProviderTimer();
    try {
      let call: Promise<FetchResult>;
      if (prov === 'groq') call = fetchFromGroq(prompt, complexity, chatHistory);
      else if (prov === 'mistral') call = fetchFromMistral(prompt, complexity, chatHistory);
      else if (prov === 'openrouter') call = fetchFromOpenRouter(prompt, complexity, chatHistory);
      else call = Promise.resolve({ movieData: null, sources: null, error: `Unsupported provider ${prov}` });

      const result = await withTimeout(call, Math.max(1000, remaining), `${prov} summarization`);
      if (result.movieData) {
        // success
        recordProviderSuccess(prov, timer, requestId);
        recordFinalProvider(prov, requestId);
        return { ...result, provider: prov };
      }
      recordProviderError(prov, timer, requestId, result.error || 'empty_response');
      // If provider returned error, continue to next
    } catch (e: any) {
      // Continue to next provider on timeout/network errors
      lastErrors[prov] = Date.now();
      recordProviderError(prov, timer, requestId, e?.message || 'provider_call_failed');

      const nextProvider = order[order.indexOf(prov) + 1];
      if (nextProvider) {
        recordFallback(prov, nextProvider, requestId, e?.message || 'provider_failure');
      }
      continue;
    }
  }
  return { movieData: null, sources: null, error: 'All providers failed during summarization' };
}

function createRequestId(): string {
  return `ui_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Check if a provider is likely available based on recent errors
 */
export function checkProviderAvailability(provider: AIProvider): 'available' | 'unavailable' | 'checking' {
  const lastError = lastErrors[provider];
  if (!lastError) return 'available';

  const timeSinceError = Date.now() - lastError;
  if (timeSinceError < ERROR_COOLDOWN) {
    return 'unavailable';
  }

  // Clear old error after cooldown
  lastErrors[provider] = null;
  return 'available';
}

/**
 * NEW HYBRID FLOW - TMDB First, Web Search Fallback, AI for Creative Content
 * 
 * 1. Parse query (extract title, year, season)
 * 2. Auto-detect complexity
 * 3. Check cache
 * 4. Try TMDB (100% factual data)
 * 5. If TMDB found: Use facts + AI for creative summaries
 * 6. If TMDB not found: Try Perplexity web search
 * 7. If Perplexity found: Use web data + AI for creative content
 * 8. Last resort: Full AI generation (with disclaimer)
 */
export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  provider: AIProvider,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  const requestId = createRequestId();
  debugLog(JSON.stringify({ event: 'user_request_start', request_id: requestId, provider, complexity, query }));

  // Step 1: Parse query
  const parsed = parseQuery(query);
  debugLog('[ai] parsed query:', parsed);

  // Step 2: Auto-detect complexity
  const autoComplexity = shouldUseComplexModel(parsed) ? QueryComplexity.COMPLEX : complexity;
  debugLog(`[ai] complexity: ${autoComplexity} (user: ${complexity}, auto: ${shouldUseComplexModel(parsed)})`);

  // Step 3: Check cache (only for fresh searches without chat history)
  const shouldCache = !chatHistory || chatHistory.length === 0;

  if (shouldCache) {
    // Check IndexedDB first
    const indexedDBResult = await getFromIndexedDB(query, provider);
    if (indexedDBResult) {
      debugLog('[ai] cache hit from IndexedDB');
      return {
        ...indexedDBResult,
        error: undefined
      };
    }

    // Check localStorage second
    const cached = getCachedResponse(query, provider);
    if (cached) {
      debugLog('[ai] cache hit from localStorage');
      // Also save to IndexedDB for longer persistence
      saveToIndexedDB(query, provider, cached.movieData, cached.sources);
      return {
        ...cached,
        error: undefined
      };
    }
  }

  // Clear old cache entries periodically
  if (Math.random() < 0.1) {
    scheduleIdle(() => {
      clearOldCacheEntries();
      clearOldIndexedDBEntries();
    });
  }

  try {
    // Step 4: Try HYBRID source (TVMaze for TV, TMDB for movies) - IMPROVED!
    debugLog('[ai] searching best data source (TVMaze for TV, TMDB for movies)...');
    const hybridResult = await fetchFromBestSource(parsed);

    if (hybridResult.data) {
      debugLog(`[ai] ${hybridResult.source.toUpperCase()}: Found factual data (confidence: ${(hybridResult.confidence * 100).toFixed(0)}%), requesting AI summaries...`);

      // Use AI to fill in creative content only
      const enriched = await enrichWithAIContent(hybridResult.data, autoComplexity, provider, requestId, chatHistory);

      if (enriched.movieData) {
        // Add data source info to AI notes
        if (enriched.movieData.ai_notes) {
          const sourceInfo = hybridResult.source === 'tvmaze'
            ? '**Data Source**: TVMaze (comprehensive TV show database)'
            : hybridResult.source === 'tmdb'
              ? '**Data Source**: The Movie Database (TMDB)'
              : '**Data Source**: Multiple databases';

          enriched.movieData.ai_notes = `${sourceInfo}\n\n${enriched.movieData.ai_notes}`;
        }

        // Cache successful hybrid results
        if (shouldCache) {
          cacheResponse(query, provider, enriched.movieData, enriched.sources);
          saveToIndexedDB(query, provider, enriched.movieData, enriched.sources);
        }

        return {
          ...enriched,
          error: undefined
        };
      }
    } else if (hybridResult.error) {
      console.warn(`[ai] Hybrid search failed: ${hybridResult.error}`);
    }

    // Step 5: TMDB not found, try Perplexity web search
    debugLog('[ai] TMDB not found, trying Perplexity web search...');
    const perplexityData = await searchWithPerplexity(parsed);

    if (perplexityData) {
      debugLog('[ai] Perplexity: Found data from web, requesting AI summaries...');

      // Use AI to fill in creative content
      const enriched = await enrichWithAIContent(perplexityData, autoComplexity, provider, requestId, chatHistory);

      if (enriched.movieData) {
        // Cache web search + AI results
        if (shouldCache) {
          cacheResponse(query, provider, enriched.movieData, enriched.sources);
          saveToIndexedDB(query, provider, enriched.movieData, enriched.sources);
        }

        return {
          ...enriched,
          error: undefined
        };
      }
    }

    // Step 6: Last resort - full AI generation (legacy fallback)
    debugLog('[ai] no TMDB/Perplexity data, falling back to pure AI...');
    const result = await fallbackToAI(query, autoComplexity, provider, requestId, chatHistory);

    // Track errors
    if (result.error) {
      lastErrors[provider] = Date.now();
    } else if (result.movieData) {
      if (!hasDisplayableTitle(result.movieData)) {
        return {
          movieData: null,
          sources: null,
          error: 'AI response missing required title field'
        };
      }

      lastErrors[provider] = null;

      // Cache AI-only results (shorter TTL would be ideal)
      if (shouldCache) {
        cacheResponse(query, provider, result.movieData, result.sources);
        saveToIndexedDB(query, provider, result.movieData, result.sources);
      }
    }

    return result;

  } catch (error: any) {
    lastErrors[provider] = Date.now();

    return {
      movieData: null,
      sources: null,
      error: `Error: ${error?.message || 'Unknown error'}`
    };
  }
}

/**
 * Enrich TMDB/Perplexity factual data with AI creative content
 */
async function enrichWithAIContent(
  factualData: MovieData,
  complexity: QueryComplexity,
  provider: AIProvider,
  requestId: string,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  try {
    // Create prompt for AI to fill creative fields only
    const creativePrompt = `${CREATIVE_ONLY_PROMPT}

Movie/Show: "${factualData.title}" (${factualData.year})
Type: ${factualData.type}
Genres: ${factualData.genres.join(', ')}

Provide engaging creative content (summaries, spoilers, trivia) for this title.`;
    // Try preferred provider first; if it fails or returns empty, fall back Groq → Mistral → OpenRouter within 10s total
    let aiResult: FetchResult | null = null;
    const preferredOrder: AIProvider[] = ['groq', 'mistral', 'openrouter'];

    // If user selected a specific provider, try it first inside the same 10s budget
    const order = preferredOrder.includes(provider)
      ? [provider, ...preferredOrder.filter((p) => p !== provider)]
      : preferredOrder;

    aiResult = await tryProvidersInOrder(creativePrompt, complexity, chatHistory, order, 10000, requestId);

    if (aiResult.movieData) {
      // Merge: Keep factual data from TMDB/Perplexity, add AI creative content
      const merged: MovieData = {
        ...factualData, // TMDB/Perplexity facts (title, year, cast, crew, ratings, etc.)
        summary_short: aiResult.movieData.summary_short || factualData.summary_short,
        summary_medium: aiResult.movieData.summary_medium || factualData.summary_medium,
        summary_long_spoilers: aiResult.movieData.summary_long_spoilers || '',
        suspense_breaker: aiResult.movieData.suspense_breaker || '',
        ai_notes: aiResult.movieData.ai_notes || ''
      };

      return {
        movieData: merged,
        sources: aiResult.sources,
        provider: aiResult.provider
      };
    }

    // AI failed, return factual data with basic summaries
    return {
      movieData: factualData,
      sources: null,
      provider
    };

  } catch (error) {
    console.error('AI enrichment error:', error);
    // Return factual data without AI enrichment
    return {
      movieData: factualData,
      sources: null,
      provider
    };
  }
}

/**
 * Legacy fallback: Full AI generation when TMDB and Perplexity fail
 */
async function fallbackToAI(
  query: string,
  complexity: QueryComplexity,
  provider: AIProvider,
  requestId: string,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  let result: FetchResult;

  if (provider === 'groq') {
    result = await fetchFromGroq(query, complexity, chatHistory);
  } else if (provider === 'mistral') {
    result = await fetchFromMistral(query, complexity, chatHistory);
  } else if (provider === 'perplexity') {
    result = await fetchFromPerplexity(query, complexity, chatHistory);
  } else {
    result = await fetchFromOpenRouter(query, complexity, chatHistory);

    // OpenRouter fallback chain
    if (!result.movieData) {
      lastErrors[provider] = Date.now();
      recordFallback('openrouter', 'mistral', requestId, result.error || 'openrouter_failed');

      const mistral = await fetchFromMistral(query, complexity, chatHistory);
      if (mistral.movieData) {
        recordFinalProvider('mistral', requestId);
        return {
          ...mistral,
          error: `OpenRouter failed, used Mistral: ${result.error || 'unknown'}`
        };
      }

      recordFallback('mistral', 'groq', requestId, mistral.error || 'mistral_failed');
      const groq = await fetchFromGroq(query, complexity, chatHistory);
      if (groq.movieData) {
        recordFinalProvider('groq', requestId);
        return {
          ...groq,
          error: `OpenRouter & Mistral failed, used Groq: ${result.error || 'unknown'}`
        };
      }
    }
  }

  if (result.movieData && result.provider) {
    recordFinalProvider(result.provider, requestId);
  }

  return result;
}

/**
 * Fetch detailed plot/spoilers on demand (lazy loading)
 */
export async function fetchFullPlotDetails(
  title: string,
  year: string,
  type: string,
  provider: AIProvider
): Promise<string> {
  try {
    const prompt = `Provide a comprehensive, detailed plot summary with FULL SPOILERS for "${title}" (${year}, ${type}). 

Include:
- Complete plot breakdown from beginning to end
- All major plot twists and reveals
- Character arcs and development
- Ending explanation
- Any post-credit scenes or epilogues

Format: Start with "SPOILER WARNING — Full plot explained below." then provide 3-5 detailed paragraphs.`;

    let result: FetchResult;

    if (provider === 'groq') {
      result = await fetchFromGroq(prompt, QueryComplexity.COMPLEX);
    } else if (provider === 'mistral') {
      result = await fetchFromMistral(prompt, QueryComplexity.COMPLEX);
    } else {
      result = await fetchFromOpenRouter(prompt, QueryComplexity.COMPLEX);
    }

    if (result.movieData && result.movieData.summary_long_spoilers) {
      return result.movieData.summary_long_spoilers;
    }

    // Fallback if AI doesn't provide summary_long_spoilers field
    if (result.movieData && result.movieData.summary_medium) {
      return `SPOILER WARNING — Full plot explained below.\n\n${result.movieData.summary_medium}\n\nNote: Full spoiler details could not be generated at this time.`;
    }

    return "Unable to fetch full plot details at this time. Please try again.";

  } catch (error) {
    console.error('Full plot fetch error:', error);
    return "Error loading full plot details. Please try again later.";
  }
}

/**
 * Test provider availability with a lightweight check (removed - providers are always assumed available)
 */
export async function testProviderAvailability(provider: AIProvider): Promise<boolean> {
  // Always return true - let actual usage determine availability
  return true;
}



================================================
FILE: services/cacheService.ts
================================================
import { MovieData, GroundingSource } from '../types';

interface CachedResponse {
  movieData: MovieData;
  sources: GroundingSource[] | null;
  timestamp: number;
  query: string;
  provider: string;
}

const CACHE_KEY_PREFIX = 'moviemonk_cache_';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours (reduced from 24h to prevent stale data)

/**
 * Generate a cache key from query
 */
function getCacheKey(query: string, provider: string): string {
  const normalized = query.toLowerCase().trim();
  return `${CACHE_KEY_PREFIX}${provider}_${normalized}`;
}

/**
 * Check if cache entry is still valid
 */
function isValidCache(cached: CachedResponse): boolean {
  const now = Date.now();
  return (now - cached.timestamp) < CACHE_DURATION;
}

/**
 * Get cached response if available and valid
 */
export function getCachedResponse(query: string, provider: string): { movieData: MovieData; sources: GroundingSource[] | null } | null {
  try {
    const key = getCacheKey(query, provider);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const parsedCache: CachedResponse = JSON.parse(cached);
    
    if (!isValidCache(parsedCache)) {
      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`[cache] hit for "${query}" with ${provider}`);
    return {
      movieData: parsedCache.movieData,
      sources: parsedCache.sources
    };
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Save response to cache
 */
export function cacheResponse(
  query: string,
  provider: string,
  movieData: MovieData,
  sources: GroundingSource[] | null
): void {
  try {
    const key = getCacheKey(query, provider);
    const cacheEntry: CachedResponse = {
      movieData,
      sources,
      timestamp: Date.now(),
      query: query.toLowerCase().trim(),
      provider
    };
    
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    console.log(`[cache] stored response for "${query}" with ${provider}`);
  } catch (error) {
    console.warn('Cache write error (storage might be full):', error);
    // Try to clear old cache entries
    clearOldCacheEntries();
  }
}

/**
 * Clear expired cache entries
 */
export function clearOldCacheEntries(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsedCache: CachedResponse = JSON.parse(cached);
            if ((now - parsedCache.timestamp) >= CACHE_DURATION) {
              keysToRemove.push(key);
            }
          } catch (e) {
            // Invalid cache entry, remove it
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`[cache] cleared ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.warn('Failed to clear old cache entries:', error);
  }
}

/**
 * Clear all MovieMonk cache
 */
export function clearAllCache(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[cache] cleared all cache (${keysToRemove.length} entries)`);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}



================================================
FILE: services/groqService.ts
================================================
import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';
import { sanitizeMovieData } from './movieDataValidation';

// Use proxy for Groq calls (API key stays server-side)
const GROQ_PROXY = import.meta.env.DEV
  ? 'http://localhost:3000/api/groq'
  : `${window.location.origin}/api/groq`;

const parseJsonResponse = (text: string): MovieData | null => {
  try {
    // Strategy 1: Clean and parse directly
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as MovieData;
  } catch (error) {
    console.warn("Groq direct parse failed, trying extraction...");
    
    try {
      // Strategy 2: Extract JSON from surrounding text using regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = jsonMatch[0];
        return JSON.parse(extracted) as MovieData;
      }
    } catch (e) {
      console.warn("Groq regex extraction failed");
    }
    
    try {
      // Strategy 3: Find balanced braces
      const firstBrace = text.indexOf('{');
      if (firstBrace === -1) return null;
      
      let depth = 0;
      let endBrace = -1;
      for (let i = firstBrace; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') depth--;
        if (depth === 0) {
          endBrace = i;
          break;
        }
      }
      
      if (endBrace !== -1) {
        const extracted = text.substring(firstBrace, endBrace + 1);
        return JSON.parse(extracted) as MovieData;
      }
    } catch (e) {
      console.warn("Groq brace matching failed");
    }
    
    console.error('All Groq JSON parsing strategies failed');
    return null;
  }
};

export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  // Skip empty or ping queries
  if (!query || query.trim().length < 3 || query.toLowerCase() === 'ping') {
    return { movieData: null, sources: null, provider: 'groq' };
  }

  // Model selection based on complexity
  // Updated models: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
  const model = complexity === QueryComplexity.COMPLEX 
    ? 'llama-3.3-70b-versatile'  // Best for complex reasoning
    : 'llama-3.1-8b-instant';     // Fastest for simple queries (not deprecated)

  // Build proper multi-turn message array
  const messages: Array<{role: string; content: string}> = [
    { role: 'system', content: INITIAL_PROMPT }
  ];
  
  // Add chat history if present (map 'model' to 'assistant', skip 'system')
  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach(msg => {
      if (msg.role === 'system') return; // Skip system messages from history
      const apiRole = msg.role === 'model' ? 'assistant' : msg.role;
      messages.push({ role: apiRole, content: msg.content });
    });
  }
  
  // Add current query
  messages.push({ role: 'user', content: query });

  try {
    const response = await fetch(GROQ_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2, // Standardized for accuracy
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return { 
        movieData: null, 
        sources: null, 
        error: `Groq API error: ${response.status} - ${errorText}` 
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Groq returned empty content');
      return { movieData: null, sources: null, error: 'Groq returned empty response' };
    }

    const movieData = sanitizeMovieData(parseJsonResponse(content));

    if (!movieData) {
      console.error('Failed to parse Groq response:', content);
      return { movieData: null, sources: null, error: 'Failed to parse Groq JSON response' };
    }

    // Enrich with TMDB data
    const enriched = sanitizeMovieData(await enrichWithTMDB(movieData));

    return {
      movieData: enriched || movieData,
      sources: null, // Groq doesn't provide grounding sources
      provider: 'groq'
    };

  } catch (error: any) {
    console.error('Groq service error:', error);
    return {
      movieData: null,
      sources: null,
      error: `Groq error: ${error?.message || 'Unknown error'}`
    };
  }
}



================================================
FILE: services/hybridDataService.ts
================================================
/**
 * Hybrid Data Service - Multi-Source Movie & TV Show Data
 * 
 * Strategy:
 * 1. For MOVIES => Try TMDB first (best for movies)
 * 2. For TV SHOWS => Try TVMaze first (better episode data), fallback to TMDB
 * 3. Always enrich with OMDB ratings (IMDB scores)
 * 4. Merge the best data from all sources
 * 
 * This solves the "404" problem by using multiple data sources!
 */

import { MovieData } from '../types';
import { ParsedQuery } from './queryParser';
import { getFromTMDB } from './tmdbService';
import {
    findBestTVShow,
    getTVShowDetails,
    convertTVMazeToMovieData,
    getSeasonEpisodes,
    getEpisode
} from './tvmazeService';

export interface DataSourceResult {
    data: MovieData | null;
    source: 'tmdb' | 'tvmaze' | 'hybrid' | 'none';
    confidence: number; // 0-1
    error?: string;
}

/**
 * Intelligent multi-source data fetcher
 * Returns the best available data from multiple sources
 */
export async function fetchFromBestSource(
    parsed: ParsedQuery
): Promise<DataSourceResult> {
    const isTVShow = parsed.type === 'show' || parsed.hasSeasonInfo;
    const isMovie = parsed.type === 'movie';

    // Strategy 1: If explicitly a movie, try TMDB only
    if (isMovie && !parsed.hasSeasonInfo) {
        console.log('[hybrid] detected MOVIE query, using TMDB...');
        const tmdbData = await getFromTMDB(parsed);
        if (tmdbData) {
            return {
                data: tmdbData,
                source: 'tmdb',
                confidence: 0.9
            };
        }
    }

    // Strategy 2: If TV show or has season info, try TVMaze first
    if (isTVShow || parsed.hasSeasonInfo) {
        console.log('[hybrid] detected TV SHOW query, trying TVMaze...');

        try {
            const tvmazeShow = await findBestTVShow(parsed.title, parsed.year?.toString());

            if (tvmazeShow) {
                console.log(`[hybrid] TVMaze found "${tvmazeShow.name}"`);

                // Get full details with episodes and cast
                const fullDetails = await getTVShowDetails(tvmazeShow.id);

                if (fullDetails) {
                    const movieData = convertTVMazeToMovieData(fullDetails);

                    // If user asked for specific season/episode, fetch that
                    if (parsed.season) {
                        const episodes = await getSeasonEpisodes(tvmazeShow.id, parsed.season);
                        if (movieData.tvShow) {
                            // Update episodes for this season
                            movieData.tvShow.episodes = episodes.map(e => ({
                                id: e.id,
                                season: e.season,
                                episode: e.number,
                                name: e.name,
                                airdate: e.airdate,
                                runtime: e.runtime,
                                rating: e.rating.average,
                                image: e.image?.original || null,
                                summary: e.summary ? e.summary.replace(/<[^>]*>/g, '') : null
                            }));
                        }

                        // If specific episode requested
                        if (parsed.episode) {
                            const episodeData = await getEpisode(tvmazeShow.id, parsed.season, parsed.episode);
                            if (episodeData && movieData.tvShow) {
                                // Focus on this specific episode
                                movieData.title = `${tvmazeShow.name} - S${String(parsed.season).padStart(2, '0')}E${String(parsed.episode).padStart(2, '0')}: ${episodeData.name}`;
                                movieData.summary_short = episodeData.summary ?
                                    episodeData.summary.replace(/<[^>]*>/g, '').substring(0, 200) + '...' :
                                    movieData.summary_short;
                            }
                        }
                    }

                    return {
                        data: movieData,
                        source: 'tvmaze',
                        confidence: 0.95 // TVMaze is very reliable for TV shows
                    };
                }
            }
        } catch (error) {
            console.warn('TVMaze fetch failed, falling back to TMDB:', error);
        }

        // Fallback to TMDB for TV shows
        console.log('[hybrid] TVMaze failed, trying TMDB for TV show...');
        const tmdbData = await getFromTMDB(parsed);
        if (tmdbData) {
            return {
                data: tmdbData,
                source: 'tmdb',
                confidence: 0.7 // Lower confidence since TMDB lacks episode data
            };
        }
    }

    // Strategy 3: Auto-detect (try both sources)
    console.log('[hybrid] auto-detecting media type, trying all sources...');

    // Try TMDB first (faster for movies)
    const tmdbData = await getFromTMDB(parsed);
    if (tmdbData) {
        // If it's a TV show from TMDB, also check TVMaze for episode data
        if (tmdbData.type === 'show') {
            try {
                const tvmazeShow = await findBestTVShow(parsed.title, parsed.year?.toString());
                if (tvmazeShow) {
                    const fullDetails = await getTVShowDetails(tvmazeShow.id);
                    if (fullDetails) {
                        const tvmazeData = convertTVMazeToMovieData(fullDetails);
                        // Merge TMDB data (better images/cast) with TVMaze data (episodes)
                        const merged: MovieData = {
                            ...tmdbData,
                            tvShow: tvmazeData.tvShow
                        };
                        return {
                            data: merged,
                            source: 'hybrid',
                            confidence: 0.95
                        };
                    }
                }
            } catch (error) {
                console.warn('TVMaze enhancement failed:', error);
            }
        }

        return {
            data: tmdbData,
            source: 'tmdb',
            confidence: 0.8
        };
    }

    // Last resort: Try TVMaze for any query
    try {
        const tvmazeShow = await findBestTVShow(parsed.title, parsed.year?.toString());
        if (tvmazeShow) {
            const fullDetails = await getTVShowDetails(tvmazeShow.id);
            if (fullDetails) {
                const movieData = convertTVMazeToMovieData(fullDetails);
                return {
                    data: movieData,
                    source: 'tvmaze',
                    confidence: 0.75
                };
            }
        }
    } catch (error) {
        console.warn('TVMaze last resort failed:', error);
    }

    // Nothing found
    return {
        data: null,
        source: 'none',
        confidence: 0,
        error: 'No results found in any database (TMDB, TVMaze)'
    };
}

/**
 * Search for content across all sources and return all matches
 * Useful for disambiguation UI
 */
export async function searchAllSources(query: string): Promise<{
    tmdb: MovieData[];
    tvmaze: MovieData[];
}> {
    const results = {
        tmdb: [] as MovieData[],
        tvmaze: [] as MovieData[]
    };

    // Search TMDB (handled by existing service)
    // Search TVMaze
    try {
        const { searchTVShows } = await import('./tvmazeService');
        const shows = await searchTVShows(query);
        results.tvmaze = shows.slice(0, 10).map(show => convertTVMazeToMovieData(show));
    } catch (error) {
        console.warn('TVMaze search error:', error);
    }

    return results;
}



================================================
FILE: services/indexedDBService.ts
================================================
import { MovieData, GroundingSource } from '../types';

const DB_NAME = 'MovieMonkDB';
const DB_VERSION = 1;
const STORE_NAME = 'movieCache';

interface CachedMovie {
  id: string;
  query: string;
  movieData: MovieData;
  sources: GroundingSource[] | null;
  timestamp: number;
  provider: string;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('query', 'query', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Generate cache key from query
 */
function generateKey(query: string, provider: string): string {
  return `${provider}_${query.toLowerCase().trim()}`;
}

/**
 * Get cached movie from IndexedDB
 */
export async function getFromIndexedDB(
  query: string,
  provider: string
): Promise<{ movieData: MovieData; sources: GroundingSource[] | null } | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const key = generateKey(query, provider);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const cached: CachedMovie | undefined = request.result;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is still valid (7 days - reduced from 30 for accuracy)
        const age = Date.now() - cached.timestamp;
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (age > MAX_AGE) {
          // Cache expired, delete it
          deleteFromIndexedDB(query, provider);
          resolve(null);
          return;
        }

        console.log(`[indexeddb] hit for "${query}" with ${provider}`);
        resolve({
          movieData: cached.movieData,
          sources: cached.sources
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB read error:', error);
    return null;
  }
}

/**
 * Save movie to IndexedDB
 */
export async function saveToIndexedDB(
  query: string,
  provider: string,
  movieData: MovieData,
  sources: GroundingSource[] | null
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cached: CachedMovie = {
      id: generateKey(query, provider),
      query: query.toLowerCase().trim(),
      movieData,
      sources,
      timestamp: Date.now(),
      provider
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cached);

      request.onsuccess = () => {
        console.log(`[indexeddb] saved "${query}" with ${provider}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB write error:', error);
  }
}

/**
 * Delete from IndexedDB
 */
export async function deleteFromIndexedDB(query: string, provider: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const key = generateKey(query, provider);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB delete error:', error);
  }
}

/**
 * Clear all old entries (older than 7 days)
 */
export async function clearOldIndexedDBEntries(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = Date.now() - MAX_AGE;

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          if (cursor.value.timestamp < cutoff) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`[indexeddb] cleared ${deletedCount} old entries`);
          }
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to clear old IndexedDB entries:', error);
  }
}

/**
 * Get all cached movies (for debugging/statistics)
 */
export async function getAllCachedMovies(): Promise<CachedMovie[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get all cached movies:', error);
    return [];
  }
}

/**
 * Clear all IndexedDB cache
 */
export async function clearAllIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[indexeddb] cleared all cache entries');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }
}



================================================
FILE: services/mistralService.ts
================================================
import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';
import { sanitizeMovieData } from './movieDataValidation';

// Use proxy for Mistral calls (API key stays server-side)
const MISTRAL_PROXY = import.meta.env.DEV
  ? 'http://localhost:3000/api/mistral'
  : `${window.location.origin}/api/mistral`;

const parseJsonResponse = (text: string): MovieData | null => {
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as MovieData;
  } catch (error) {
    console.warn("Mistral direct parse failed, trying extraction...");
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as MovieData;
      }
    } catch (e) {
      console.warn("Mistral extraction failed");
    }
    
    console.error('Mistral JSON parsing failed');
    return null;
  }
};

export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  // Skip empty or ping queries
  if (!query || query.trim().length < 3 || query.toLowerCase() === 'ping') {
    return { movieData: null, sources: null, provider: 'mistral' };
  }

  // Model selection: Use FREE open-weight models for free tier
  // Free models: open-mistral-7b, open-mixtral-8x7b, open-mixtral-8x22b
  const model = complexity === QueryComplexity.COMPLEX 
    ? 'open-mixtral-8x22b'   // Free, best reasoning (22B params)
    : 'open-mixtral-8x7b';   // Free, fast and efficient (8x7B)

  // Build proper multi-turn message array
  const messages: Array<{role: string; content: string}> = [
    { role: 'system', content: INITIAL_PROMPT }
  ];
  
  // Add chat history if present (map 'model' to 'assistant', skip 'system')
  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach(msg => {
      if (msg.role === 'system') return; // Skip system messages from history
      const apiRole = msg.role === 'model' ? 'assistant' : msg.role;
      messages.push({ role: apiRole, content: msg.content });
    });
  }
  
  // Add current query
  messages.push({ role: 'user', content: query });

  try {
    const response = await fetch(MISTRAL_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2, // Standardized for accuracy
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error:', response.status, errorText);
      return { 
        movieData: null, 
        sources: null, 
        error: `Mistral API error: ${response.status} - ${errorText}` 
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Mistral returned empty content');
      return { movieData: null, sources: null, error: 'Mistral returned empty response' };
    }

    const movieData = sanitizeMovieData(parseJsonResponse(content));

    if (!movieData) {
      console.error('Failed to parse Mistral response:', content);
      return { movieData: null, sources: null, error: 'Failed to parse Mistral JSON response' };
    }

    // Enrich with TMDB data
    const enriched = sanitizeMovieData(await enrichWithTMDB(movieData));

    return {
      movieData: enriched || movieData,
      sources: null,
      provider: 'mistral'
    };

  } catch (error: any) {
    console.error('Mistral service error:', error);
    return {
      movieData: null,
      sources: null,
      error: `Mistral error: ${error?.message || 'Unknown error'}`
    };
  }
}



================================================
FILE: services/movieDataValidation.ts
================================================
import { MovieData, Rating, WatchOption, CastMember, Crew } from '../types';

const toStringSafe = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toStringSafe(item).trim()).filter(Boolean);
};

const normalizeMovieType = (value: unknown): MovieData['type'] => {
  const raw = toStringSafe(value).toLowerCase();
  if (raw === 'show' || raw === 'song' || raw === 'franchise') return raw;
  return 'movie';
};

const normalizeWatchType = (value: unknown): WatchOption['type'] => {
  const raw = toStringSafe(value).toLowerCase();
  if (raw === 'subscription' || raw === 'rent' || raw === 'free' || raw === 'buy') return raw;
  return 'subscription';
};

const sanitizeCast = (value: unknown): CastMember[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;
      const name = toStringSafe(data.name).trim();
      const role = toStringSafe(data.role).trim();
      const known_for = toStringSafe(data.known_for).trim();
      if (!name && !role) return null;
      return { name, role, known_for };
    })
    .filter((item): item is CastMember => item !== null)
    .slice(0, 40);
};

const sanitizeCrew = (value: unknown): Crew => {
  if (!value || typeof value !== 'object') {
    return { director: '', writer: '', music: '' };
  }
  const data = value as Record<string, unknown>;
  return {
    director: toStringSafe(data.director),
    writer: toStringSafe(data.writer),
    music: toStringSafe(data.music)
  };
};

const sanitizeRatings = (value: unknown): Rating[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;
      const source = toStringSafe(data.source).trim();
      const score = toStringSafe(data.score).trim();
      if (!source && !score) return null;
      return { source, score };
    })
    .filter((item): item is Rating => item !== null)
    .slice(0, 20);
};

const sanitizeWhereToWatch = (value: unknown): WatchOption[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const data = item as Record<string, unknown>;
      const platform = toStringSafe(data.platform).trim();
      const link = toStringSafe(data.link).trim();
      if (!platform && !link) return null;
      return {
        platform,
        link,
        type: normalizeWatchType(data.type)
      };
    })
    .filter((item): item is WatchOption => item !== null)
    .slice(0, 20);
};

export function sanitizeMovieData(input: unknown): MovieData | null {
  if (!input || typeof input !== 'object') return null;

  const data = input as Record<string, unknown>;
  const movie: MovieData = {
    tmdb_id: toStringSafe(data.tmdb_id) || undefined,
    title: toStringSafe(data.title),
    year: toStringSafe(data.year),
    type: normalizeMovieType(data.type),
    media_type: toStringSafe(data.media_type) || undefined,
    genres: toStringArray(data.genres),
    poster_url: toStringSafe(data.poster_url),
    backdrop_url: toStringSafe(data.backdrop_url),
    trailer_url: toStringSafe(data.trailer_url),
    ratings: sanitizeRatings(data.ratings),
    cast: sanitizeCast(data.cast),
    crew: sanitizeCrew(data.crew),
    summary_short: toStringSafe(data.summary_short),
    summary_medium: toStringSafe(data.summary_medium),
    summary_long_spoilers: toStringSafe(data.summary_long_spoilers),
    suspense_breaker: toStringSafe(data.suspense_breaker),
    where_to_watch: sanitizeWhereToWatch(data.where_to_watch),
    extra_images: toStringArray(data.extra_images),
    ai_notes: toStringSafe(data.ai_notes)
  };

  if (data.tvShow && typeof data.tvShow === 'object') {
    movie.tvShow = data.tvShow as MovieData['tvShow'];
  }

  return movie;
}

export function hasDisplayableTitle(movieData: MovieData | null | undefined): boolean {
  return Boolean(movieData && movieData.title && movieData.title.trim().length > 0);
}



================================================
FILE: services/observability.ts
================================================
import { AIProvider } from '../types';

type ProviderStats = {
  calls: number;
  errors: number;
  totalLatencyMs: number;
  fallbackCount: number;
  lastError?: string;
  lastUsedAt?: string;
};

const metrics: Record<AIProvider, ProviderStats> = {
  groq: { calls: 0, errors: 0, totalLatencyMs: 0, fallbackCount: 0 },
  mistral: { calls: 0, errors: 0, totalLatencyMs: 0, fallbackCount: 0 },
  perplexity: { calls: 0, errors: 0, totalLatencyMs: 0, fallbackCount: 0 },
  openrouter: { calls: 0, errors: 0, totalLatencyMs: 0, fallbackCount: 0 }
};

const shouldLogInfo = (): boolean => {
  return typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
};

function log(event: string, data: Record<string, unknown>, level: 'info' | 'warn' | 'error' = 'info') {
  if (level === 'info' && !shouldLogInfo()) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    source: 'ai_provider_runtime',
    event,
    ...data
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function startProviderTimer(): number {
  return Date.now();
}

export function recordProviderSuccess(provider: AIProvider, startedAt: number, requestId: string): void {
  const elapsed = Date.now() - startedAt;
  metrics[provider].calls += 1;
  metrics[provider].totalLatencyMs += elapsed;
  metrics[provider].lastUsedAt = new Date().toISOString();

  log('provider_success', {
    request_id: requestId,
    provider,
    latency_ms: elapsed,
    avg_latency_ms: Math.round(metrics[provider].totalLatencyMs / Math.max(metrics[provider].calls, 1))
  });
}

export function recordProviderError(provider: AIProvider, startedAt: number, requestId: string, error: string): void {
  const elapsed = Date.now() - startedAt;
  metrics[provider].calls += 1;
  metrics[provider].errors += 1;
  metrics[provider].totalLatencyMs += elapsed;
  metrics[provider].lastError = error;
  metrics[provider].lastUsedAt = new Date().toISOString();

  log(
    'provider_error',
    {
      request_id: requestId,
      provider,
      latency_ms: elapsed,
      error
    },
    'warn'
  );
}

export function recordFallback(
  fromProvider: AIProvider,
  toProvider: AIProvider,
  requestId: string,
  reason: string
): void {
  metrics[toProvider].fallbackCount += 1;
  log('provider_fallback', { request_id: requestId, from_provider: fromProvider, to_provider: toProvider, reason }, 'warn');
}

export function recordFinalProvider(provider: AIProvider, requestId: string): void {
  log('provider_final_choice', { request_id: requestId, final_provider: provider });
}

export function getProviderMetricsSnapshot(): Record<AIProvider, ProviderStats> {
  return {
    groq: { ...metrics.groq },
    mistral: { ...metrics.mistral },
    perplexity: { ...metrics.perplexity },
    openrouter: { ...metrics.openrouter }
  };
}

const discoveryEventDedupe = new Set<string>();

function shouldEmitDiscoveryEvent(dedupeKey: string): boolean {
  if (discoveryEventDedupe.has(dedupeKey)) return false;
  discoveryEventDedupe.add(dedupeKey);
  return true;
}

export function recordDiscoverySectionRendered(sectionKey: string, title: string, itemCount: number): void {
  if (!shouldEmitDiscoveryEvent(`section:render:${sectionKey}`)) return;
  log('discovery_section_rendered', {
    section_key: sectionKey,
    section_title: title,
    item_count: itemCount
  });
}

export function recordDiscoverySectionSkipped(sectionKey: string, title: string, itemCount: number): void {
  if (!shouldEmitDiscoveryEvent(`section:skip:${sectionKey}`)) return;
  log('discovery_section_skipped', {
    section_key: sectionKey,
    section_title: title,
    item_count: itemCount
  }, 'warn');
}

export function recordDiscoveryCardViewed(sectionKey: string, title: string, position: number): void {
  if (!shouldEmitDiscoveryEvent(`card:view:${sectionKey}:${title}:${position}`)) return;
  log('discovery_card_viewed', {
    section_key: sectionKey,
    title,
    position
  });
}

export function recordDiscoveryCardOpened(sectionKey: string, title: string, position: number): void {
  log('discovery_card_opened', {
    section_key: sectionKey,
    title,
    position
  });
}


================================================
FILE: services/openrouterService.ts
================================================
import { ChatMessage, MovieData, QueryComplexity, FetchResult } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';
import { sanitizeMovieData } from './movieDataValidation';

// Use serverless proxy endpoint instead of direct API call
const PROXY_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api/openrouter'  // Local dev (if running Vercel dev)
  : `${window.location.origin}/api/openrouter`;  // Production (Vercel deployment)

const parseJsonResponse = (text: string): MovieData | null => {
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as MovieData;
  } catch (e) {
    console.error('OpenRouter parse JSON failed:', e);
    console.error('Raw text:', text);
    
    // Attempt to repair truncated JSON
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // If truncated mid-string, try closing the string and object
      let repaired = cleanedText;
      
      // Count unclosed quotes
      const quoteCount = (repaired.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        // Odd number of quotes - add closing quote
        repaired += '"';
      }
      
      // Count unclosed braces/brackets
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      
      // Close arrays first, then objects
      for (let i = 0; i < (openBrackets - closeBrackets); i++) {
        repaired += ']';
      }
      for (let i = 0; i < (openBraces - closeBraces); i++) {
        repaired += '}';
      }
      
      console.warn('Attempting to parse repaired JSON...');
      const parsed = JSON.parse(repaired) as MovieData;
      console.log('[openrouter] JSON repair successful');
      return parsed;
    } catch (repairError) {
      console.error('JSON repair also failed:', repairError);
      return null;
    }
  }
};

export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  // Skip empty or ping queries
  if (!query || query.trim().length < 3 || query.toLowerCase() === 'ping') {
    return { movieData: null, sources: null, provider: 'openrouter' };
  }

  // Model selection: Use Meta Llama models via OpenRouter
  const model = complexity === QueryComplexity.COMPLEX 
    ? 'meta-llama/llama-3.1-70b-instruct'  // Best for complex reasoning
    : 'meta-llama/llama-3.1-8b-instruct';  // Fast for simple queries

  // Build proper multi-turn message array
  const messages: Array<{role: string; content: string}> = [
    { role: 'system', content: INITIAL_PROMPT }
  ];
  
  // Add chat history if present (map 'model' to 'assistant', skip 'system')
  if (chatHistory && chatHistory.length > 0) {
    chatHistory.forEach(msg => {
      if (msg.role === 'system') return; // Skip system messages from history
      const apiRole = msg.role === 'model' ? 'assistant' : msg.role;
      messages.push({ role: apiRole, content: msg.content });
    });
  }
  
  // Add current query
  messages.push({ role: 'user', content: query });

  const payload = {
    model,
    messages,
    temperature: 0.2 // Standardized for accuracy
  };

  try {
    // Call our serverless proxy instead of OpenRouter directly
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      // Special-case payment/credit errors and 401s
      if (res.status === 402) {
        // OpenRouter might return JSON with message
        try {
          const info = JSON.parse(txt || '{}');
          const msg = info?.error?.message || txt || 'Insufficient balance';
          return { movieData: null, sources: null, error: `OpenRouter error 402: ${msg}` };
        } catch {
          return { movieData: null, sources: null, error: 'OpenRouter error 402: Insufficient balance' };
        }
      }
      if (res.status === 401) {
        return { movieData: null, sources: null, error: 'OpenRouter API key invalid. Check OPENROUTER_API_KEY' };
      }
      return { movieData: null, sources: null, error: `OpenRouter proxy error ${res.status}: ${txt || res.statusText}` };
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? '';

    const parsed = sanitizeMovieData(parseJsonResponse(text));
    if (!parsed) return { movieData: null, sources: null, error: 'Failed to parse OpenRouter JSON response' };

    try {
      if (!parsed.poster_url || !parsed.backdrop_url || !parsed.extra_images || parsed.extra_images.length === 0) {
        const enriched = sanitizeMovieData(await enrichWithTMDB(parsed));
        return { movieData: enriched, sources: null };
      }
    } catch (e) {
      console.warn('TMDB enrichment failed for OpenRouter:', e);
    }

    return { movieData: parsed, sources: null };
  } catch (e: any) {
    // Network errors
    const message = e?.message || '';
    return { movieData: null, sources: null, error: `OpenRouter proxy request failed: ${message || 'unknown'}` };
  }
}



================================================
FILE: services/perplexityService.ts
================================================
/**
 * Perplexity API Service
 * Web search fallback for movies/shows not found in TMDB
 * Uses Perplexity's online model for real-time information
 */

import { MovieData, ChatMessage, QueryComplexity, FetchResult } from '../types';
import { ParsedQuery, formatForAIPrompt, parseQuery } from './queryParser';
import { sanitizeMovieData } from './movieDataValidation';

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';

async function fetchViaServerDetails(parsed: ParsedQuery): Promise<MovieData | null> {
  try {
    const query = parsed.originalQuery || parsed.title;
    const searchRes = await fetch(`/api/ai?action=search&q=${encodeURIComponent(query)}`);
    if (!searchRes.ok) return null;

    const searchJson: any = await searchRes.json();
    const best = (searchJson?.results || []).find(
      (item: any) => item && item.type === 'movie' && Number.isFinite(item.id)
    );

    if (!best) return null;

    const mediaType = best.media_type === 'tv' ? 'tv' : 'movie';
    const detailsRes = await fetch(
      `/api/ai?action=details&id=${best.id}&media_type=${mediaType}&provider=perplexity`
    );

    if (!detailsRes.ok) return null;

    const details: any = await detailsRes.json();
    return sanitizeMovieData(details);
  } catch {
    return null;
  }
}

/**
 * Fetch movie data using Perplexity (matches interface of other services)
 */
export async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  if (typeof window !== 'undefined') {
    const parsed = parseQuery(query);
    const movieData = await fetchViaServerDetails(parsed);

    if (!movieData) {
      return {
        movieData: null,
        sources: null,
        error: 'Perplexity fallback did not return a result'
      };
    }

    return {
      movieData,
      sources: null,
      provider: 'perplexity'
    };
  }

  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return {
        movieData: null,
        sources: null,
        error: 'PERPLEXITY_API_KEY not configured'
      };
    }

    console.log(`[perplexity] fetching data for "${query}"`);

    // Build comprehensive prompt
    const prompt = `Search the web and provide comprehensive information about: ${query}

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "year": "string",
  "type": "movie or show",
  "genres": ["string"],
  "poster_url": "string",
  "backdrop_url": "string",
  "trailer_url": "string (YouTube)",
  "ratings": [{"source": "IMDb|Rotten Tomatoes|Metacritic", "score": "string"}],
  "cast": [{"name": "string", "role": "string", "known_for": "string"}],
  "crew": {"director": "string", "writer": "string", "music": "string"},
  "summary_short": "200 chars, NO spoilers",
  "summary_medium": "500 chars, NO spoilers",
  "summary_long_spoilers": "Full plot with spoilers",
  "suspense_breaker": "One-line spoiler warning",
  "where_to_watch": [{"platform": "string", "link": "string", "type": "subscription|rent|buy|free"}],
  "ai_notes": "Interesting trivia or notes",
  "extra_images": []
}`;

    const response = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: complexity === QueryComplexity.COMPLEX
          ? 'sonar-pro'
          : 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a movie database expert with web access. Provide accurate, factual information. Return ONLY valid JSON.'
          },
          ...(chatHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: complexity === QueryComplexity.COMPLEX ? 8000 : 4000,
        return_citations: true,
        return_images: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[perplexity] API error ${response.status}:`, errorText);
      return {
        movieData: null,
        sources: null,
        error: `Perplexity API error: ${response.status}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        movieData: null,
        sources: null,
        error: 'Perplexity returned empty response'
      };
    }

    const rawMovieData = parsePerplexityResponse(content);
    if (!rawMovieData || rawMovieData.error) {
      return {
        movieData: null,
        sources: null,
        error: 'Movie not found or parsing failed'
      };
    }

    const movieData = sanitizeMovieData(rawMovieData);
    if (!movieData) {
      return {
        movieData: null,
        sources: null,
        error: 'Movie response was invalid after normalization'
      };
    }

    console.log(`[perplexity] successfully fetched "${movieData.title}"`);

    // Extract sources from citations
    const sources = data.citations?.map((cite: any) => ({
      uri: cite.url,
      title: cite.title || cite.url
    })) || null;

    return {
      movieData,
      sources,
      provider: 'perplexity'
    };

  } catch (error: any) {
    console.error('[perplexity] error:', error);
    return {
      movieData: null,
      sources: null,
      error: error?.message || 'Unknown Perplexity error'
    };
  }
}

/**
 * Search web using Perplexity for movie/show information
 */
export async function searchWithPerplexity(parsed: ParsedQuery): Promise<MovieData | null> {
  if (typeof window !== 'undefined') {
    return fetchViaServerDetails(parsed);
  }

  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.warn('[perplexity] PERPLEXITY_API_KEY not configured - skipping web search');
      return null;
    }

    console.log(`[perplexity] searching web for "${parsed.title}"`);

    const searchPrompt = `Find comprehensive information about the ${parsed.type === 'show' ? 'TV show' : 'movie'}: ${formatForAIPrompt(parsed)}

Search the web and provide factual information about:
- Official title and release year
- Type (movie or TV show)
- Genres
- Main cast members (top 10) with their character names
- Director, writer, and composer
- IMDb and Rotten Tomatoes ratings
- Official poster and backdrop image URLs (from IMDb or official sources)
- YouTube trailer URL
- Streaming platforms where it's available (subscription/rent/buy)
- Brief plot summary (200 characters max, NO spoilers)
- Medium plot summary (500 characters max, NO spoilers)

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "year": "string",
  "type": "movie or show",
  "genres": ["string"],
  "poster_url": "string",
  "backdrop_url": "string",
  "trailer_url": "string",
  "ratings": [{"source": "string", "score": "string"}],
  "cast": [{"name": "string", "role": "string", "known_for": "string"}],
  "crew": {"director": "string", "writer": "string", "music": "string"},
  "summary_short": "string",
  "summary_medium": "string",
  "where_to_watch": [{"platform": "string", "link": "string", "type": "subscription|rent|buy|free"}],
  "extra_images": []
}

If not found, return: {"error": "not_found"}`;

    const response = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar', // Online model with web access
        messages: [
          {
            role: 'system',
            content: 'You are a movie database expert. Search the web for accurate, factual information about movies and TV shows. Return ONLY valid JSON, no markdown.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.1, // Very low for factual accuracy
        max_tokens: 4000,
        return_citations: true, // Get sources
        return_images: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[perplexity] API error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('[perplexity] empty response');
      return null;
    }

    // Parse JSON response (avoid shadowing function parameter "parsed")
    const rawParsedResponse = parsePerplexityResponse(content);
    if (!rawParsedResponse || rawParsedResponse.error === 'not_found') {
      console.log(`[perplexity] "${rawParsedResponse?.title || parsed.title}" not found on web`);
      return null;
    }

    const parsedResponse = sanitizeMovieData(rawParsedResponse);
    if (!parsedResponse) {
      return null;
    }

    console.log(`[perplexity] found data for "${parsedResponse.title}"`);

    // Fill in missing fields with empty values
    return {
      ...parsedResponse,
      summary_long_spoilers: '', // AI will provide
      suspense_breaker: '', // AI will provide
      ai_notes: '', // AI will provide
      extra_images: parsedResponse.extra_images || []
    };

  } catch (error) {
    console.error('[perplexity] search error:', error);
    return null;
  }
}

/**
 * Parse Perplexity JSON response
 */
function parsePerplexityResponse(content: string): any {
  let parsed: any = null;
  try {
    // Remove markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\s*/g, '');
    }

    // Try to extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    console.error('Failed to parse Perplexity response:', e);
    console.error('Raw content:', content);
    return null;
  }
}

/**
 * Adapter for global search interface (used by api/ai.ts)
 * Converts textual query to ParsedQuery and formats result as a search candidate
 */
export async function searchPerplexity(query: string, limit: number = 6): Promise<any[]> {
  try {
    const parsed = parseQuery(query);
    const data = await searchWithPerplexity(parsed);

    if (!data) return [];

    // Map MovieData to SearchResult shape expected by ai.ts
    // interface SearchResult { title, snippet, url, image, type, confidence, year, language }
    return [{
      title: data.title,
      snippet: data.summary_short || data.summary_medium || 'No summary available',
      url: data.trailer_url || data.where_to_watch?.[0]?.link || '',
      image: data.poster_url,
      type: data.type === 'show' ? 'movie' : 'movie', // Map 'show' to 'movie' as SearchResult only has 'movie'|'person'|'review'
      confidence: 0.9,
      year: data.year,
      language: 'en'
    }];
  } catch (e) {
    console.error('Wrapper searchPerplexity error:', e);
    return [];
  }
}



================================================
FILE: services/personIntent.ts
================================================
import { PersonIntent } from '../types';

const STOP_TOKENS = new Set([
  'best',
  'top',
  'movies',
  'movie',
  'films',
  'film',
  'shows',
  'show',
  'series',
  'about',
  'of',
  'the',
  'a',
  'an',
  'please',
  'find',
  'search',
  'for'
]);

const PERSON_ROLE_PATTERNS: Array<{ role: PersonIntent['requested_role']; pattern: RegExp }> = [
  { role: 'director', pattern: /\b(director|filmmaker|helmer)\b/i },
  { role: 'actor', pattern: /\b(actor|actors|male actor)\b/i },
  { role: 'actress', pattern: /\b(actress|actresses|female actor)\b/i }
];

function normalizeToken(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function parsePersonIntent(query: string): PersonIntent {
  const raw = String(query || '').trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  const requestedRole = PERSON_ROLE_PATTERNS.find((entry) => entry.pattern.test(raw))?.role || 'any';

  const stripped = normalized
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(actor|actors|actress|actresses|director|filmmaker|helmer|male actor|female actor)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = stripped
    .split(' ')
    .map(normalizeToken)
    .filter((token) => token.length > 1 && !STOP_TOKENS.has(token));

  const hasPersonCue = /\b(actor|actress|director|cast|starring|filmography|movies by|shows by|who is)\b/i.test(raw);
  const queryLooksLikeName = tokens.length >= 2 && tokens.length <= 4;
  const isPersonFocused = requestedRole !== 'any' || hasPersonCue || queryLooksLikeName;

  return {
    raw_query: raw,
    normalized_query: normalized,
    stripped_query: stripped || normalized,
    tokens,
    year: yearMatch?.[0],
    requested_role: requestedRole,
    is_person_focused: isPersonFocused
  };
}

export function resolveRoleMatch(
  requestedRole: PersonIntent['requested_role'],
  knownForDepartment?: string
): 'match' | 'mismatch' | 'neutral' {
  if (requestedRole === 'any') return 'neutral';
  const normalizedDepartment = (knownForDepartment || '').toLowerCase();
  if (!normalizedDepartment) return 'neutral';

  if (requestedRole === 'director') {
    return normalizedDepartment.includes('direct') ? 'match' : 'mismatch';
  }

  if (requestedRole === 'actor' || requestedRole === 'actress') {
    return normalizedDepartment.includes('acting') || normalizedDepartment.includes('actor')
      ? 'match'
      : 'mismatch';
  }

  return 'neutral';
}



================================================
FILE: services/personPresentation.ts
================================================
export type PersonRoleMatch = 'match' | 'mismatch' | 'neutral';

export interface PersonCardInput {
  name: string;
  profile_url?: string;
  known_for_department?: string;
  known_for_titles?: string[];
  known_for?: string;
}

export interface PersonCardPresentation {
  name: string;
  avatarUrl?: string;
  roleChip: string;
  snippet: string;
}

type ShortlistCandidate = {
  score?: number;
  confidence?: number;
  popularity?: number;
  role_match?: PersonRoleMatch;
};

const ROLE_RANK: Record<PersonRoleMatch, number> = {
  match: 2,
  neutral: 1,
  mismatch: 0
};

function sanitizeText(input?: string): string {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function truncateText(input: string, max = 70): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

export function formatRoleChip(knownForDepartment?: string): string {
  const normalized = sanitizeText(knownForDepartment);
  if (!normalized) return 'Person';
  return normalized;
}

export function formatKnownForSnippet(input: Pick<PersonCardInput, 'known_for_titles' | 'known_for'>): string {
  if (Array.isArray(input.known_for_titles) && input.known_for_titles.length > 0) {
    const snippet = input.known_for_titles
      .map((title) => sanitizeText(title))
      .filter(Boolean)
      .slice(0, 3)
      .join(' • ');
    if (snippet) return truncateText(snippet, 88);
  }

  const knownFor = sanitizeText(input.known_for);
  return knownFor ? truncateText(knownFor, 88) : 'Known for notable film and TV work';
}

export function buildPersonCardPresentation(input: PersonCardInput): PersonCardPresentation {
  return {
    name: sanitizeText(input.name),
    avatarUrl: input.profile_url,
    roleChip: formatRoleChip(input.known_for_department),
    snippet: formatKnownForSnippet(input)
  };
}

export function sortPersonShortlist<T extends ShortlistCandidate>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    const scoreA = typeof a.score === 'number' ? a.score : typeof a.confidence === 'number' ? a.confidence : 0;
    const scoreB = typeof b.score === 'number' ? b.score : typeof b.confidence === 'number' ? b.confidence : 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const roleA = ROLE_RANK[a.role_match || 'neutral'];
    const roleB = ROLE_RANK[b.role_match || 'neutral'];
    if (roleB !== roleA) return roleB - roleA;

    const popularityA = typeof a.popularity === 'number' ? a.popularity : 0;
    const popularityB = typeof b.popularity === 'number' ? b.popularity : 0;
    if (popularityB !== popularityA) return popularityB - popularityA;

    return 0;
  });
}



================================================
FILE: services/queryParser.ts
================================================
/**
 * Query Parser Utility
 * Extracts structured information from natural language movie/show queries
 */

export interface ParsedQuery {
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  type?: 'movie' | 'show' | 'auto';
  isRecent: boolean; // 2024-2025
  hasSeasonInfo: boolean;
  hasDetailedRequest: boolean; // Keywords like "detailed", "full plot", "spoilers"
  originalQuery: string;
}

/**
 * Parse user query to extract title, year, season, episode
 * Examples:
 *   "Interstellar 2014" → {title: "Interstellar", year: 2014}
 *   "You season 5" → {title: "You", season: 5, type: "show"}
 *   "Breaking Bad S03E02" → {title: "Breaking Bad", season: 3, episode: 2}
 *   "Dune Part Two" → {title: "Dune Part Two"}
 */
export function parseQuery(query: string): ParsedQuery {
  const original = query.trim();
  let remaining = original;

  const result: ParsedQuery = {
    title: '',
    originalQuery: original,
    isRecent: false,
    hasSeasonInfo: false,
    hasDetailedRequest: false,
    type: 'auto'
  };

  // Check for detailed plot requests
  const detailedKeywords = /\b(detailed|full plot|complete|spoilers?|breakdown|analysis|in-depth)\b/i;
  result.hasDetailedRequest = detailedKeywords.test(remaining);

  // Extract year (4 digits)
  const yearMatch = remaining.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1]);
    result.isRecent = result.year >= 2024;
    remaining = remaining.replace(yearMatch[0], '').trim();
  } else {
    // Check if query mentions "2024" or "2025" without it being a year
    const currentYearCheck = /\b(2024|2025)\b/i;
    if (currentYearCheck.test(remaining)) {
      result.isRecent = true;
    }
  }

  // Extract season/episode - Format: S01E02, Season 1, s01, etc.
  const seasonEpisodeMatch = remaining.match(/\bS(\d{1,2})E(\d{1,2})\b/i);
  if (seasonEpisodeMatch) {
    result.season = parseInt(seasonEpisodeMatch[1]);
    result.episode = parseInt(seasonEpisodeMatch[2]);
    result.hasSeasonInfo = true;
    result.type = 'show';
    remaining = remaining.replace(seasonEpisodeMatch[0], '').trim();
  } else {
    // Try "Season X" or "season X" format
    const seasonMatch = remaining.match(/\bseason\s+(\d{1,2})\b/i);
    if (seasonMatch) {
      result.season = parseInt(seasonMatch[1]);
      result.hasSeasonInfo = true;
      result.type = 'show';
      remaining = remaining.replace(seasonMatch[0], '').trim();
    } else {
      // Try "S01" or "s1" format
      const shortSeasonMatch = remaining.match(/\bs(\d{1,2})\b/i);
      if (shortSeasonMatch) {
        result.season = parseInt(shortSeasonMatch[1]);
        result.hasSeasonInfo = true;
        result.type = 'show';
        remaining = remaining.replace(shortSeasonMatch[0], '').trim();
      }
    }

    // Try "Episode X" format (only if season was found)
    if (result.season) {
      const episodeMatch = remaining.match(/\bepisode\s+(\d{1,2})\b/i);
      if (episodeMatch) {
        result.episode = parseInt(episodeMatch[1]);
        remaining = remaining.replace(episodeMatch[0], '').trim();
      }
    }
  }

  // Clean up common words
  remaining = remaining
    .replace(/\b(movie|film|show|series|tv\s+show|tv\s+series)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading/trailing punctuation and extra spaces
  result.title = remaining
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If title is empty, use original query
  if (!result.title) {
    result.title = original;
  }

  return result;
}

/**
 * Auto-detect if query should use complex model
 */
export function shouldUseComplexModel(parsed: ParsedQuery): boolean {
  // Use complex model for:
  // 1. Detailed plot requests
  // 2. Recent releases (may need more reasoning)
  // 3. Season/episode specific queries (needs context)
  return (
    parsed.hasDetailedRequest ||
    parsed.isRecent ||
    parsed.hasSeasonInfo
  );
}

/**
 * Format query for TMDB search
 */
export function formatForTMDBSearch(parsed: ParsedQuery): string {
  let searchQuery = parsed.title;
  if (parsed.year) {
    searchQuery += ` ${parsed.year}`;
  }
  return searchQuery;
}

/**
 * Format query for AI prompt (include all context)
 */
export function formatForAIPrompt(parsed: ParsedQuery): string {
  const parts: string[] = [];
  
  parts.push(`Title: "${parsed.title}"`);
  
  if (parsed.year) {
    parts.push(`Year: ${parsed.year}`);
  }
  
  if (parsed.season) {
    parts.push(`Season: ${parsed.season}`);
    if (parsed.episode) {
      parts.push(`Episode: ${parsed.episode}`);
    }
  }
  
  if (parsed.type !== 'auto') {
    parts.push(`Type: ${parsed.type}`);
  }
  
  return parts.join(', ');
}



================================================
FILE: services/serpApiService.ts
================================================
/**
 * SerpApi Service
 * Uses Google Search API to find movies, shows, persons, and reviews.
 * Provides rich metadata including knowledge graphs and organic results.
 */

import { FetchResult } from '../types';

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

export interface SerpApiResult {
    title: string;
    link: string;
    snippet: string;
    source?: string;
    thumbnail?: string;
    position?: number;
    type?: 'movie' | 'show' | 'person' | 'review';
    year?: string;
    rating?: string;
}

/**
 * Search Google via SerpApi
 */
export async function searchSerpApi(query: string, limit: number = 6): Promise<SerpApiResult[]> {
    const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;

    if (!apiKey) {
        console.warn('[serpapi] SERPAPI_KEY not configured');
        return [];
    }

    try {
        const url = new URL(SERPAPI_BASE_URL);
        url.searchParams.append('api_key', apiKey);
        url.searchParams.append('q', query);
        url.searchParams.append('engine', 'google');
        url.searchParams.append('num', '10'); // Fetch a few more to filter
        url.searchParams.append('hl', 'en');
        url.searchParams.append('gl', 'in'); // bias towards India as user mentioned regional cinema

        console.log(`[serpapi] searching for "${query}"`);

        const response = await fetch(url.toString());

        if (!response.ok) {
            console.error(`[serpapi] request failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const results: SerpApiResult[] = [];

        // 1. Check Knowledge Graph (High confidence)
        if (data.knowledge_graph) {
            const kg = data.knowledge_graph;
            results.push({
                title: kg.title,
                link: kg.website || kg.source?.link || '',
                snippet: kg.description || kg.type || '',
                thumbnail: kg.header_images?.[0]?.image || kg.image,
                type: detectTypeFromKG(kg.type),
                year: extractYear(kg.title + ' ' + (kg.description || '')),
                rating: kg.rating
            });
        }

        // 2. Process Organic Results
        if (data.organic_results && Array.isArray(data.organic_results)) {
            for (const result of data.organic_results) {
                if (results.length >= limit) break;

                // Skip if already found in KG (fuzzy match title)
                if (results.some(r => r.title.toLowerCase() === result.title.toLowerCase())) continue;

                results.push({
                    title: result.title,
                    link: result.link,
                    snippet: result.snippet || '',
                    thumbnail: result.thumbnail,
                    source: result.source,
                    type: detectTypeFromSnippet(result.title + ' ' + (result.snippet || '')),
                    year: extractYear(result.title + ' ' + (result.snippet || '')),
                    rating: result.rating
                });
            }
        }

        return results;

    } catch (error) {
        console.error('[serpapi] search error:', error);
        return [];
    }
}

function detectTypeFromKG(type: string = ''): 'movie' | 'show' | 'person' | 'review' {
    const t = type.toLowerCase();
    if (t.includes('film') || t.includes('movie')) return 'movie';
    if (t.includes('tv') || t.includes('series') || t.includes('show')) return 'show';
    if (t.includes('actor') || t.includes('actress') || t.includes('person') || t.includes('director')) return 'person';
    return 'movie'; // Default
}

function detectTypeFromSnippet(text: string): 'movie' | 'show' | 'person' | 'review' {
    const t = text.toLowerCase();
    if (t.includes('imdb') && t.includes('rating')) return 'review';
    if (t.includes('cast') || t.includes('poster')) return 'movie';
    return 'movie'; // Default
}

function extractYear(text: string): string | undefined {
    const match = text.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : undefined;
}



================================================
FILE: services/suggestInteraction.ts
================================================
export type EnterAction =
  | 'select_highlighted'
  | 'select_top'
  | 'prompt_inline_selection'
  | 'submit_query';

export interface InteractionIntent {
  prefersPersonResult: boolean;
  prefersExactTitle: boolean;
  typedYear?: string;
  confidenceThreshold: number;
}

interface ResolveEnterActionParams {
  highlightedIndex: number;
  suggestionsCount: number;
  topConfidence?: number;
  confidenceThreshold?: number;
}

export function inferInteractionIntent(query: string): InteractionIntent {
  const normalized = String(query || '').toLowerCase();
  const typedYear = normalized.match(/\b(19|20)\d{2}\b/)?.[0];
  const prefersPersonResult = /\b(actor|actress|director|cast|starring|who is|by )\b/.test(normalized);
  const prefersExactTitle = /\b(exact|full title|named|called)\b/.test(normalized) || Boolean(typedYear);

  // When users type intent-rich query (year or person cues), require stronger confidence for auto-select.
  const confidenceThreshold = prefersPersonResult || prefersExactTitle ? 0.88 : 0.82;

  return {
    prefersPersonResult,
    prefersExactTitle,
    typedYear,
    confidenceThreshold
  };
}

export function getNextHighlightIndex(
  currentIndex: number,
  direction: 'next' | 'prev',
  total: number
): number {
  if (total <= 0) return -1;
  if (currentIndex < 0) return direction === 'next' ? 0 : total - 1;

  if (direction === 'next') {
    return (currentIndex + 1) % total;
  }
  return (currentIndex - 1 + total) % total;
}

export function resolveEnterAction({
  highlightedIndex,
  suggestionsCount,
  topConfidence,
  confidenceThreshold = 0.82
}: ResolveEnterActionParams): EnterAction {
  if (suggestionsCount <= 0) {
    return 'submit_query';
  }

  if (highlightedIndex >= 0 && highlightedIndex < suggestionsCount) {
    return 'select_highlighted';
  }

  if ((topConfidence || 0) >= confidenceThreshold) {
    return 'select_top';
  }

  return 'prompt_inline_selection';
}



================================================
FILE: services/suggestRanking.ts
================================================
import { parsePersonIntent, resolveRoleMatch } from './personIntent';
import { inferInteractionIntent } from './suggestInteraction';

export type SuggestEntityType = 'movie' | 'show' | 'person';

export interface SuggestCandidate {
  id: number;
  title: string;
  year?: string;
  type: SuggestEntityType;
  media_type: 'movie' | 'tv' | 'person';
  poster_url?: string;
  popularity?: number;
  known_for_department?: string;
  known_for_titles?: string[];
}

export interface RankedSuggestCandidate extends SuggestCandidate {
  score: number;
  confidence: number;
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYear(input: string): string | undefined {
  const match = input.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost
      );
    }
  }

  return matrix[a.length][b.length];
}

function getFuzzySimilarity(query: string, title: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);
  if (!normalizedQuery || !normalizedTitle) return 0;

  const distance = levenshteinDistance(normalizedQuery, normalizedTitle);
  const maxLen = Math.max(normalizedQuery.length, normalizedTitle.length);
  const editSimilarity = maxLen > 0 ? Math.max(0, 1 - distance / maxLen) : 0;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const titleTokens = normalizedTitle.split(' ').filter(Boolean);
  const titleTokenSet = new Set(titleTokens);
  const tokenHits = queryTokens.filter((token) => titleTokenSet.has(token)).length;
  const tokenSimilarity = queryTokens.length > 0 ? tokenHits / queryTokens.length : 0;

  return Number((editSimilarity * 0.6 + tokenSimilarity * 0.4).toFixed(3));
}

function getTitleMatchScore(query: string, title: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);

  if (!normalizedQuery || !normalizedTitle) return 0;
  if (normalizedTitle === normalizedQuery) return 120;
  if (normalizedTitle.startsWith(normalizedQuery)) return 80;
  if (normalizedTitle.includes(normalizedQuery)) return 45;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const titleTokens = normalizedTitle.split(' ').filter(Boolean);
  const tokenMatches = queryTokens.reduce((count, token) => {
    if (token.length < 2) return count;
    return count + (titleTokens.some((titleToken) => titleToken.startsWith(token) || titleToken.includes(token)) ? 1 : 0);
  }, 0);

  if (tokenMatches === 0) return 0;
  const fuzzySimilarity = getFuzzySimilarity(normalizedQuery, normalizedTitle);
  return 18 + tokenMatches * 10 + fuzzySimilarity * 26;
}

function getPopularityBoost(popularity?: number): number {
  if (!popularity || popularity <= 0) return 0;
  // Log scale keeps popularity helpful without overpowering title relevance.
  return Math.min(12, Math.log10(popularity + 1) * 4);
}

function getRoleMatchBoost(
  requestedRole: 'any' | 'actor' | 'actress' | 'director',
  knownForDepartment: string | undefined
): number {
  if (requestedRole === 'any') return 0;
  const roleMatch = resolveRoleMatch(requestedRole, knownForDepartment);
  if (roleMatch === 'match') {
    return requestedRole === 'director' ? 30 : 26;
  }
  if (roleMatch === 'mismatch') return -10;
  return 0;
}

function getKnownForOverlapBoost(tokens: string[], knownForTitles?: string[]): number {
  if (!tokens.length || !Array.isArray(knownForTitles) || knownForTitles.length === 0) return 0;
  const haystack = normalizeText(knownForTitles.join(' '));
  if (!haystack) return 0;

  const matches = tokens.reduce((count, token) => count + (haystack.includes(token) ? 1 : 0), 0);
  return Math.min(14, matches * 5);
}

function getPersonFocusBoost(isPersonFocused: boolean, type: SuggestEntityType): number {
  if (!isPersonFocused) return 0;
  return type === 'person' ? 22 : -6;
}

function getYearBoost(queryYear: string | undefined, candidateYear: string | undefined): number {
  if (!queryYear || !candidateYear) return 0;
  if (queryYear === candidateYear) return 12;

  const queryYearNum = Number(queryYear);
  const candidateYearNum = Number(candidateYear);
  if (!Number.isFinite(queryYearNum) || !Number.isFinite(candidateYearNum)) return 0;

  const yearDistance = Math.abs(queryYearNum - candidateYearNum);
  if (yearDistance === 1) return 6;
  if (yearDistance === 2) return 3;
  return 0;
}

function getInteractionIntentBoost(query: string, candidate: SuggestCandidate): number {
  const intent = inferInteractionIntent(query);
  let boost = 0;

  if (intent.prefersPersonResult) {
    boost += candidate.type === 'person' ? 14 : -4;
  }

  if (intent.prefersExactTitle) {
    const normalizedTitle = normalizeText(candidate.title);
    const normalizedQuery = normalizeText(query.replace(/\b(19|20)\d{2}\b/g, ' '));
    if (normalizedTitle === normalizedQuery) boost += 10;
  }

  if (intent.typedYear && candidate.year && intent.typedYear === candidate.year) {
    boost += 4;
  }

  return boost;
}

function toConfidence(score: number): number {
  if (score <= 0) return 0;
  const confidence = score / 140;
  return Math.max(0, Math.min(0.99, Number(confidence.toFixed(3))));
}

export function rankSuggestCandidates(query: string, candidates: SuggestCandidate[]): RankedSuggestCandidate[] {
  const queryYear = extractYear(query);
  const intent = parsePersonIntent(query);

  return candidates
    .map((candidate) => {
      // Weighted blend:
      // - Title relevance (exact/starts-with/fuzzy): strongest signal
      // - Popularity: weak prior
      // - Year confidence: medium when year is typed
      // - Person and interaction intent: query-context aware boosts
      const titleScore = getTitleMatchScore(query, candidate.title);
      const popularityBoost = getPopularityBoost(candidate.popularity);
      const yearBoost = getYearBoost(queryYear, candidate.year);
      const personFocusBoost = getPersonFocusBoost(intent.is_person_focused, candidate.type);
      const roleMatchBoost = candidate.type === 'person'
        ? getRoleMatchBoost(intent.requested_role, candidate.known_for_department)
        : 0;
      const knownForBoost = candidate.type === 'person'
        ? getKnownForOverlapBoost(intent.tokens, candidate.known_for_titles)
        : 0;
      const interactionIntentBoost = getInteractionIntentBoost(query, candidate);
      const score = titleScore + popularityBoost + yearBoost + personFocusBoost + roleMatchBoost + knownForBoost + interactionIntentBoost;

      return {
        ...candidate,
        score,
        confidence: toConfidence(score)
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.popularity || 0) - (a.popularity || 0);
    });
}



================================================
FILE: services/tmdbService.ts
================================================
import { MovieData, CastMember, Crew, Rating, WatchOption, DiscoveryItem, DiscoveryGenre } from '../types';
import { ParsedQuery } from './queryParser';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Use proxy for TMDB calls (API key stays server-side). Support Node/Jest.
const TMDB_PROXY = (typeof window !== 'undefined')
  ? (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api/tmdb'
      : `${window.location.origin}/api/tmdb`)
  : process.env.TMDB_PROXY || 'http://localhost:3000/api/tmdb';

// Use proxy for OMDB calls (API key stays server-side). Support Node/Jest.
const OMDB_PROXY = (typeof window !== 'undefined')
  ? (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api/omdb'
      : `${window.location.origin}/api/omdb`)
  : process.env.OMDB_PROXY || 'http://localhost:3000/api/omdb';

function buildImageUrl(path: string | null | undefined, size: 'w500'|'w780'|'original' = 'original'): string {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
}

type TMDBFetchOptions = {
  signal?: AbortSignal;
};

function normalizeDiscoveryItem(raw: any): DiscoveryItem | null {
  const mediaType = raw?.media_type === 'tv' || (!raw?.title && raw?.name) ? 'tv' : 'movie';
  if (raw?.media_type && raw.media_type !== 'movie' && raw.media_type !== 'tv') {
    return null;
  }

  const title = typeof raw?.title === 'string' && raw.title.trim()
    ? raw.title.trim()
    : typeof raw?.name === 'string'
      ? raw.name.trim()
      : '';

  if (!raw?.id || !title) {
    return null;
  }

  const releaseDate = mediaType === 'movie' ? raw?.release_date : raw?.first_air_date;

  return {
    id: raw.id,
    tmdb_id: String(raw.id),
    media_type: mediaType,
    title,
    year: typeof releaseDate === 'string' ? releaseDate.substring(0, 4) : '',
    overview: typeof raw?.overview === 'string' ? raw.overview : '',
    poster_url: buildImageUrl(raw?.poster_path, 'w500'),
    backdrop_url: buildImageUrl(raw?.backdrop_path, 'w780'),
    rating: typeof raw?.vote_average === 'number' ? raw.vote_average : null,
    genre_ids: Array.isArray(raw?.genre_ids)
      ? raw.genre_ids.filter((id: unknown) => typeof id === 'number')
      : Array.isArray(raw?.genres)
        ? raw.genres.map((genre: any) => genre?.id).filter((id: unknown) => typeof id === 'number')
        : []
  };
}

async function fetchDiscoveryList(
  path: string,
  params: Record<string, string | number | undefined> = {},
  options: TMDBFetchOptions = {}
): Promise<DiscoveryItem[]> {
  const data = await tmdbFetch(path, params, options);
  if (!Array.isArray(data?.results)) return [];
  return data.results
    .map((item: any) => normalizeDiscoveryItem(item))
    .filter((item: DiscoveryItem | null): item is DiscoveryItem => item !== null);
}

async function tmdbFetch(
  path: string,
  params: Record<string, string | number | undefined> = {},
  options: TMDBFetchOptions = {}
): Promise<any> {
  // Build query string for proxy
  const queryParams = new URLSearchParams();
  queryParams.set('endpoint', path.replace(/^\//, '')); // Remove leading slash
  
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      queryParams.set(k, String(v));
    }
  });
  
  const url = `${TMDB_PROXY}?${queryParams.toString()}`;
  const res = await fetch(url, { signal: options.signal });
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json();
}

export async function fetchTrending(
  mediaType: 'movie' | 'tv' | 'all',
  timeWindow: 'day' | 'week',
  options: TMDBFetchOptions = {}
): Promise<DiscoveryItem[]> {
  const items = await fetchDiscoveryList(`/trending/${mediaType}/${timeWindow}`, {}, options);
  return mediaType === 'all' ? items.filter((item) => item.media_type === 'movie' || item.media_type === 'tv') : items;
}

export async function fetchPopular(
  mediaType: 'movie' | 'tv',
  options: TMDBFetchOptions = {}
): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList(`/${mediaType}/popular`, {}, options);
}

export async function fetchTopRated(
  mediaType: 'movie' | 'tv',
  options: TMDBFetchOptions = {}
): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList(`/${mediaType}/top_rated`, {}, options);
}

export async function fetchUpcoming(options: TMDBFetchOptions = {}): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList('/movie/upcoming', {}, options);
}

export async function fetchNowPlaying(options: TMDBFetchOptions = {}): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList('/movie/now_playing', {}, options);
}

export async function fetchOnTheAir(options: TMDBFetchOptions = {}): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList('/tv/on_the_air', {}, options);
}

export async function fetchByGenre(
  genreId: number,
  mediaType: 'movie' | 'tv',
  options: TMDBFetchOptions = {}
): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList(`/discover/${mediaType}`, { with_genres: genreId }, options);
}

type DiscoverTvOptions = {
  withGenres?: number[];
  withOriginalLanguage?: string;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'first_air_date.desc';
  includeAdult?: boolean;
};

type DiscoverMovieOptions = {
  withGenres?: number[];
  withOriginalLanguage?: string;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc';
  includeAdult?: boolean;
};

export async function fetchDiscoverMovie(
  discoverOptions: DiscoverMovieOptions = {},
  options: TMDBFetchOptions = {}
): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList(
    '/discover/movie',
    {
      with_genres: discoverOptions.withGenres?.length ? discoverOptions.withGenres.join(',') : undefined,
      with_original_language: discoverOptions.withOriginalLanguage,
      sort_by: discoverOptions.sortBy || 'popularity.desc',
      include_adult: discoverOptions.includeAdult ? 'true' : 'false'
    },
    options
  );
}

export async function fetchDiscoverTv(
  discoverOptions: DiscoverTvOptions = {},
  options: TMDBFetchOptions = {}
): Promise<DiscoveryItem[]> {
  return fetchDiscoveryList(
    '/discover/tv',
    {
      with_genres: discoverOptions.withGenres?.length ? discoverOptions.withGenres.join(',') : undefined,
      with_original_language: discoverOptions.withOriginalLanguage,
      sort_by: discoverOptions.sortBy || 'popularity.desc',
      include_adult: discoverOptions.includeAdult ? 'true' : 'false'
    },
    options
  );
}

export async function fetchGenreList(
  mediaType: 'movie' | 'tv',
  options: TMDBFetchOptions = {}
): Promise<DiscoveryGenre[]> {
  const data = await tmdbFetch(`/genre/${mediaType}/list`, {}, options);
  if (!Array.isArray(data?.genres)) return [];
  return data.genres
    .map((genre: any) => ({
      id: genre?.id,
      name: typeof genre?.name === 'string' ? genre.name : ''
    }))
    .filter((genre: DiscoveryGenre) => typeof genre.id === 'number' && genre.name.length > 0);
}

async function searchTitle(title: string, year?: string, type?: MovieData['type']): Promise<{ id: number; mediaType: 'movie'|'tv' } | null> {
  const trimmed = (title || '').trim();
  if (!trimmed) return null;

  const preferTv = type === 'show';

  try {
    // Try specific type first when we know it
    if (preferTv) {
      const tv = await tmdbFetch('/search/tv', { query: trimmed, first_air_date_year: year });
      if (tv?.results?.length) return { id: tv.results[0].id, mediaType: 'tv' };
    } else {
      const mv = await tmdbFetch('/search/movie', { query: trimmed, year });
      if (mv?.results?.length) return { id: mv.results[0].id, mediaType: 'movie' };
    }

    // Fallback to multi
    const multi = await tmdbFetch('/search/multi', { query: trimmed, year });
    const hit = multi?.results?.find((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
    if (hit) return { id: hit.id, mediaType: hit.media_type };
  } catch (e) {
    console.warn('TMDB search error:', e);
  }
  return null;
}

async function fetchImages(mediaType: 'movie'|'tv', id: number): Promise<{ poster?: string; backdrop?: string; gallery: string[] }> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/images`, { include_image_language: 'en,null' });
    const poster = buildImageUrl(data?.posters?.[0]?.file_path, 'w500');
    const backdrop = buildImageUrl(data?.backdrops?.[0]?.file_path, 'w780');

    const galleryPaths: string[] = [];
    (data?.backdrops || []).slice(0, 6).forEach((b: any) => b?.file_path && galleryPaths.push(b.file_path));
    (data?.posters || []).slice(0, 2).forEach((p: any) => p?.file_path && galleryPaths.push(p.file_path));

    const gallery = galleryPaths.map(p => buildImageUrl(p, 'w780')).filter(Boolean).slice(0, 6);
    return { poster, backdrop, gallery };
  } catch (e) {
    console.warn('TMDB images error:', e);
    return { gallery: [] };
  }
}

function isLikelyImageUrl(u: string | undefined | null): boolean {
  if (!u) return false;
  if (!/^https?:\/\//i.test(u)) return false;
  return /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(u);
}

/**
 * Fetch cast from TMDB (top 15 actors)
 */
async function fetchCast(mediaType: 'movie'|'tv', id: number): Promise<CastMember[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/credits`);
    const cast: CastMember[] = [];
    
    (data?.cast || []).slice(0, 15).forEach((actor: any) => {
      if (actor.name && actor.character) {
        cast.push({
          name: actor.name,
          role: actor.character,
          known_for: actor.known_for_department || 'Acting'
        });
      }
    });
    
    return cast;
  } catch (e) {
    console.warn('TMDB cast fetch error:', e);
    return [];
  }
}

/**
 * Fetch crew (director, writer, composer) from TMDB
 */
async function fetchCrew(mediaType: 'movie'|'tv', id: number): Promise<Crew> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/credits`);
    const crew = data?.crew || [];
    
    const director = crew.find((c: any) => c.job === 'Director' || c.job === 'Series Director')?.name || '';
    const writer = crew.find((c: any) => c.job === 'Writer' || c.job === 'Screenplay' || c.department === 'Writing')?.name || '';
    const music = crew.find((c: any) => c.job === 'Original Music Composer' || c.department === 'Sound')?.name || '';
    
    return { director, writer, music };
  } catch (e) {
    console.warn('TMDB crew fetch error:', e);
    return { director: '', writer: '', music: '' };
  }
}

/**
 * Get IMDB ID from TMDB
 */
async function getIMDBId(mediaType: 'movie'|'tv', id: number): Promise<string | null> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/external_ids`);
    return data?.imdb_id || null;
  } catch (e) {
    console.warn('TMDB external IDs fetch error:', e);
    return null;
  }
}

/**
 * Fetch ratings from OMDB API using IMDB ID (via secure proxy)
 */
async function fetchOMDBRatings(imdbId: string): Promise<Rating[]> {
  try {
    const url = `${OMDB_PROXY}?i=${encodeURIComponent(imdbId)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      // 4xx from OMDB proxy commonly means missing/invalid key in deployment.
      // Keep UX functional by silently falling back to empty ratings.
      if (response.status >= 500) {
        console.warn(`OMDB proxy error: ${response.status}`);
      }
      return [];
    }
    
    const data = await response.json();
    
    if (data.Response === 'False') {
      return [];
    }
    
    const ratings: Rating[] = [];
    
    // IMDB Rating
    if (data.imdbRating && data.imdbRating !== 'N/A') {
      ratings.push({
        source: 'IMDb',
        score: `${data.imdbRating}/10`
      });
    }
    
    // Other ratings from Ratings array
    if (data.Ratings && Array.isArray(data.Ratings)) {
      data.Ratings.forEach((r: any) => {
        if (r.Source && r.Value) {
          ratings.push({
            source: r.Source,
            score: r.Value
          });
        }
      });
    }
    
    return ratings;
  } catch (e) {
    console.warn('OMDB ratings fetch error:', e);
    return [];
  }
}

/**
 * Fetch watch providers from TMDB
 */
async function fetchWatchProviders(mediaType: 'movie'|'tv', id: number): Promise<WatchOption[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/watch/providers`);
    const us = data?.results?.US;
    if (!us) return [];
    
    const providers: WatchOption[] = [];
    
    // Streaming (subscription)
    (us.flatrate || []).forEach((p: any) => {
      providers.push({
        platform: p.provider_name,
        link: us.link || '',
        type: 'subscription'
      });
    });
    
    // Rent
    (us.rent || []).forEach((p: any) => {
      providers.push({
        platform: p.provider_name,
        link: us.link || '',
        type: 'rent'
      });
    });
    
    // Buy
    (us.buy || []).forEach((p: any) => {
      providers.push({
        platform: p.provider_name,
        link: us.link || '',
        type: 'buy'
      });
    });
    
    // Deduplicate by platform name
    const unique = providers.filter((p, i, arr) => 
      arr.findIndex(x => x.platform === p.platform) === i
    );
    
    return unique.slice(0, 8); // Limit to 8 providers
  } catch (e) {
    console.warn('TMDB watch providers error:', e);
    return [];
  }
}

/**
 * Fetch full details from TMDB
 */
async function fetchDetails(mediaType: 'movie'|'tv', id: number): Promise<{
  title: string;
  year: string;
  language?: string;
  type: MovieData['type'];
  genres: string[];
  overview: string;
  trailer?: string;
  poster?: string;
  backdrop?: string;
}> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}`);
    
    const title = mediaType === 'movie' ? data.title : data.name;
    const releaseDate = mediaType === 'movie' ? data.release_date : data.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : '';
    const spokenLanguage = Array.isArray(data?.spoken_languages) && data.spoken_languages.length > 0
      ? data.spoken_languages[0]
      : null;
    const language = typeof spokenLanguage?.english_name === 'string' && spokenLanguage.english_name.trim().length > 0
      ? spokenLanguage.english_name.trim()
      : typeof spokenLanguage?.name === 'string' && spokenLanguage.name.trim().length > 0
        ? spokenLanguage.name.trim()
        : typeof data?.original_language === 'string'
          ? data.original_language
          : undefined;
    const genres = (data.genres || []).map((g: any) => g.name);
    const overview = data.overview || '';
    const poster = buildImageUrl(data.poster_path, 'w500');
    const backdrop = buildImageUrl(data.backdrop_path, 'w780');
    
    // Try to get trailer from videos
    let trailer = '';
    try {
      const videos = await tmdbFetch(`/${mediaType}/${id}/videos`);
      const trailerVideo = videos?.results?.find(
        (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      if (trailerVideo) {
        trailer = `https://www.youtube.com/watch?v=${trailerVideo.key}`;
      }
    } catch (e) {
      console.warn('TMDB trailer fetch error:', e);
    }
    
    return {
      title,
      year,
      language,
      type: mediaType === 'tv' ? 'show' : 'movie',
      genres,
      overview,
      trailer,
      poster,
      backdrop
    };
  } catch (e) {
    console.warn('TMDB details fetch error:', e);
    throw e;
  }
}

type RecommendationCandidate = {
  id: number;
  title: string;
  year?: string;
  media_type: 'movie' | 'tv';
  poster_url?: string;
  popularity?: number;
  source: 'tmdb-similar' | 'tmdb-recommendations';
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
};

type RecommendationSeed = {
  year?: number;
  genre_ids: number[];
};

async function tmdbDirectFetch(path: string): Promise<any> {
  const base = 'https://api.themoviedb.org/3';
  const readToken = process.env.TMDB_READ_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!readToken && !apiKey) {
    throw new Error('TMDB credentials missing');
  }

  if (readToken) {
    const res = await fetch(`${base}${path}`, {
      headers: {
        Authorization: `Bearer ${readToken}`
      }
    });
    if (!res.ok) {
      throw new Error(`TMDB ${path} failed: ${res.status}`);
    }
    return res.json();
  }

  const separator = path.includes('?') ? '&' : '?';
  const res = await fetch(`${base}${path}${separator}api_key=${encodeURIComponent(apiKey as string)}`);
  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status}`);
  }
  return res.json();
}

function mapRecommendationItem(it: any, source: 'tmdb-similar' | 'tmdb-recommendations'): RecommendationCandidate | null {
  const title = it?.title || it?.name;
  if (!it?.id || !title) return null;

  return {
    id: it.id,
    title,
    year: (it.release_date || it.first_air_date || '').substring(0, 4) || undefined,
    media_type: it.title ? 'movie' : 'tv',
    poster_url: it.poster_path ? `https://image.tmdb.org/t/p/w342${it.poster_path}` : undefined,
    popularity: typeof it.popularity === 'number' ? it.popularity : undefined,
    source,
    vote_average: typeof it.vote_average === 'number' ? it.vote_average : undefined,
    vote_count: typeof it.vote_count === 'number' ? it.vote_count : undefined,
    genre_ids: Array.isArray(it.genre_ids)
      ? it.genre_ids.filter((genreId: unknown): genreId is number => typeof genreId === 'number')
      : []
  };
}

function computeRecommendationScore(candidate: RecommendationCandidate, seed: RecommendationSeed): number {
  const sourceBoost = candidate.source === 'tmdb-recommendations' ? 0.24 : 0.16;
  const ratingScore = Math.min(Math.max((candidate.vote_average || 0) / 10, 0), 1) * 0.28;
  const voteConfidence = Math.min(Math.log10((candidate.vote_count || 0) + 1) / 4, 1) * 0.16;
  const popularityScore = Math.min(Math.log10((candidate.popularity || 0) + 1) / 2.2, 1) * 0.18;

  let genreScore = 0;
  if (seed.genre_ids.length > 0 && (candidate.genre_ids || []).length > 0) {
    const seedGenres = new Set(seed.genre_ids);
    const overlap = (candidate.genre_ids || []).filter((genreId) => seedGenres.has(genreId)).length;
    const denominator = Math.max(seed.genre_ids.length, (candidate.genre_ids || []).length, 1);
    genreScore = (overlap / denominator) * 0.18;
  }

  let yearProximityScore = 0;
  if (seed.year && candidate.year && /^\d{4}$/.test(candidate.year)) {
    const distance = Math.abs(seed.year - Number(candidate.year));
    yearProximityScore = Math.max(0, 1 - distance / 25) * 0.08;
  }

  return sourceBoost + ratingScore + voteConfidence + popularityScore + genreScore + yearProximityScore;
}

export async function fetchSimilarTitles(id: number, mediaType: 'movie' | 'tv'): Promise<import('../types').RelatedTitle[]> {
  try {
    const [seedDetails, similarJson, recJson] = await Promise.all([
      tmdbDirectFetch(`/${mediaType}/${id}`),
      tmdbDirectFetch(`/${mediaType}/${id}/similar`),
      tmdbDirectFetch(`/${mediaType}/${id}/recommendations`)
    ]);

    const seed: RecommendationSeed = {
      year: Number((seedDetails?.release_date || seedDetails?.first_air_date || '').substring(0, 4)) || undefined,
      genre_ids: Array.isArray(seedDetails?.genres)
        ? seedDetails.genres
            .map((genre: any) => genre?.id)
            .filter((genreId: unknown): genreId is number => typeof genreId === 'number')
        : []
    };

    const combinedCandidates: RecommendationCandidate[] = [
      ...(Array.isArray(similarJson?.results)
        ? similarJson.results
            .map((item: any) => mapRecommendationItem(item, 'tmdb-similar'))
            .filter((item: RecommendationCandidate | null): item is RecommendationCandidate => Boolean(item))
        : []),
      ...(Array.isArray(recJson?.results)
        ? recJson.results
            .map((item: any) => mapRecommendationItem(item, 'tmdb-recommendations'))
            .filter((item: RecommendationCandidate | null): item is RecommendationCandidate => Boolean(item))
        : [])
    ].filter((candidate) => candidate.id !== id);

    const mergedById = new Map<number, RecommendationCandidate>();
    for (const candidate of combinedCandidates) {
      const existing = mergedById.get(candidate.id);
      if (!existing) {
        mergedById.set(candidate.id, candidate);
        continue;
      }

      mergedById.set(candidate.id, {
        ...existing,
        source: existing.source === 'tmdb-recommendations' || candidate.source === 'tmdb-recommendations'
          ? 'tmdb-recommendations'
          : 'tmdb-similar',
        popularity: Math.max(existing.popularity || 0, candidate.popularity || 0),
        vote_average: Math.max(existing.vote_average || 0, candidate.vote_average || 0),
        vote_count: Math.max(existing.vote_count || 0, candidate.vote_count || 0),
        genre_ids: existing.genre_ids && existing.genre_ids.length > 0 ? existing.genre_ids : candidate.genre_ids,
        poster_url: existing.poster_url || candidate.poster_url,
        year: existing.year || candidate.year
      });
    }

    return Array.from(mergedById.values())
      .map((candidate) => ({
        ...candidate,
        score: computeRecommendationScore(candidate, seed)
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.popularity || 0) - (a.popularity || 0);
      })
      .slice(0, 18)
      .map(({ vote_average, vote_count, genre_ids, score, ...item }) => item);
  } catch {
    return [];
  }
}

  export async function fetchRelatedPeopleForPerson(personId: number): Promise<import('../types').RelatedPerson[]> {
    const token = getTMDBToken();
    const base = 'https://api.themoviedb.org/3';
    const headers = { Authorization: `Bearer ${token}` } as any;
    try {
      const creditsRes = await fetch(`${base}/person/${personId}/combined_credits`, { headers });
      const credits = await creditsRes.json();
      const works = ([] as any[])
        .concat(credits?.cast || [], credits?.crew || [])
        .filter((work: any) => work?.id && (work?.media_type === 'movie' || work?.media_type === 'tv'))
        .sort((a: any, b: any) => {
          const popDiff = (b?.popularity || 0) - (a?.popularity || 0);
          if (popDiff !== 0) return popDiff;
          const aDate = (a?.release_date || a?.first_air_date || '').substring(0, 4);
          const bDate = (b?.release_date || b?.first_air_date || '').substring(0, 4);
          return Number(bDate || 0) - Number(aDate || 0);
        });

      const seenWorks = new Set<string>();
      const topWorks = works.filter((work: any) => {
        const key = `${work.media_type}:${work.id}`;
        if (seenWorks.has(key)) return false;
        seenWorks.add(key);
        return true;
      }).slice(0, 8);

      const relatedMap = new Map<number, {
        id: number;
        name: string;
        profile_path?: string;
        popularity?: number;
        known_for?: string;
        overlap: number;
      }>();

      await Promise.all(topWorks.map(async (work: any) => {
        try {
          const creditsRes = await fetch(`${base}/${work.media_type}/${work.id}/credits`, { headers });
          if (!creditsRes.ok) return;
          const details = await creditsRes.json();

          const castMembers = Array.isArray(details?.cast) ? details.cast.slice(0, 20) : [];
          const crewMembers = Array.isArray(details?.crew)
            ? details.crew.filter((member: any) => ['Director', 'Writer', 'Screenplay', 'Producer'].includes(member?.job)).slice(0, 8)
            : [];

          const participants = [...castMembers, ...crewMembers];
          participants.forEach((member: any) => {
            if (!member?.id || member.id === personId || !member?.name) return;
            const existing = relatedMap.get(member.id);
            if (existing) {
              existing.overlap += 1;
              if ((member?.popularity || 0) > (existing.popularity || 0)) {
                existing.popularity = member.popularity;
              }
              return;
            }

            relatedMap.set(member.id, {
              id: member.id,
              name: member.name,
              profile_path: member.profile_path,
              popularity: member.popularity,
              known_for: member.known_for_department || member.job || member.character,
              overlap: 1
            });
          });
        } catch {
          // Skip failed title credits and continue.
        }
      }));

      const related = Array.from(relatedMap.values())
        .sort((a, b) => {
          if (b.overlap !== a.overlap) return b.overlap - a.overlap;
          return (b.popularity || 0) - (a.popularity || 0);
        })
        .slice(0, 18)
        .map((person) => ({
          id: person.id,
          name: person.name,
          known_for: person.overlap > 1 ? `${person.known_for || 'Film & TV'} · ${person.overlap} shared credits` : person.known_for,
          profile_url: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : undefined,
          popularity: person.popularity,
          source: 'tmdb-co-star' as const
        }));

      return related;
    } catch {
      return [];
    }
  }

  function getTMDBToken(): string {
    const token = process.env.TMDB_READ_TOKEN || process.env.TMDB_API_KEY;
    if (!token) throw new Error('TMDB token missing');
    return token as string;
  }

  function dedupeById<T extends { id: number }>(arr: T[]): T[] {
    const seen = new Set<number>();
    const out: T[] = [];
    for (const item of arr) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  }

/**
 * Get comprehensive movie/show data from TMDB (100% factual)
 */
export async function getFromTMDB(parsed: ParsedQuery): Promise<MovieData | null> {
  try {
    // Search for title
    const search = await searchTitle(
      parsed.title,
      parsed.year?.toString(),
      parsed.type === 'auto' ? undefined : parsed.type
    );
    
    if (!search) {
      console.log(`[tmdb] no results for "${parsed.title}"`);
      return null;
    }
    
    console.log(`[tmdb] found ${search.mediaType} ID ${search.id} for "${parsed.title}"`);
    
    // Fetch all data in parallel
    const [details, cast, crew, images, watchProviders, imdbId] = await Promise.all([
      fetchDetails(search.mediaType, search.id),
      fetchCast(search.mediaType, search.id),
      fetchCrew(search.mediaType, search.id),
      fetchImages(search.mediaType, search.id),
      fetchWatchProviders(search.mediaType, search.id),
      getIMDBId(search.mediaType, search.id)
    ]);
    
    // Fetch IMDB ratings if we have the ID
    let ratings: Rating[] = [];
    if (imdbId) {
      ratings = await fetchOMDBRatings(imdbId);
      console.log(`[omdb] fetched ${ratings.length} ratings for ${imdbId}`);
    }
    
    // Build MovieData from TMDB facts (no AI hallucinations!)
    const movieData: MovieData = {
      title: details.title,
      year: details.year,
      language: details.language,
      type: details.type,
      genres: details.genres,
      poster_url: images.poster || details.poster || images.backdrop || details.backdrop || '',
      backdrop_url: images.backdrop || details.backdrop || images.poster || details.poster || '',
      trailer_url: details.trailer || '',
      ratings,
      cast,
      crew,
      // Summaries will be filled by AI (creative content)
      summary_short: details.overview.substring(0, 200) + (details.overview.length > 200 ? '...' : ''),
      summary_medium: details.overview,
      summary_long_spoilers: '', // AI will provide
      suspense_breaker: '', // AI will provide
      where_to_watch: watchProviders,
      extra_images: images.gallery,
      ai_notes: '' // AI will provide trivia
    };
    
    return movieData;
  } catch (e) {
    console.warn('TMDB full fetch failed:', e);
    return null;
  }
}

/**
 * @deprecated Use getFromTMDB instead for full factual data
 */
export async function enrichWithTMDB(data: MovieData): Promise<MovieData> {
  try {
    const search = await searchTitle(data.title, data.year, data.type);
    if (!search) return data;

    const imgs = await fetchImages(search.mediaType, search.id);

    // Always prefer TMDB images. Only fall back to AI if TMDB has nothing.
    const poster_url = imgs.poster || (isLikelyImageUrl(data.poster_url) ? data.poster_url : '');
    const backdrop_url = imgs.backdrop || (isLikelyImageUrl(data.backdrop_url) ? data.backdrop_url : '');

    const extra_images: string[] = imgs.gallery.length > 0
      ? imgs.gallery
      : (Array.isArray(data.extra_images) ? data.extra_images.filter(isLikelyImageUrl) : []);

    return { ...data, poster_url, backdrop_url, extra_images };
  } catch (e) {
    console.warn('TMDB enrichment failed:', e);
    return data;
  }
}



================================================
FILE: services/tvmazeService.ts
================================================
/**
 * TVMaze API Service
 * FREE API with comprehensive TV show data (no API key needed!)
 * Better than TMDB for TV shows - includes seasons, episodes, episode lists
 * 
 * API Docs: https://www.tvmaze.com/api
 */

export interface TVMazeShow {
    id: number;
    name: string;
    type: string; // "Scripted", "Reality", etc.
    language: string;
    genres: string[];
    status: string; // "Running", "Ended", etc.
    premiered: string; // "2013-09-23"
    ended: string | null;
    officialSite: string | null;
    rating: { average: number | null };
    network: {
        name: string;
        country: { name: string; code: string };
    } | null;
    webChannel: { name: string } | null;
    image: {
        medium: string;
        original: string;
    } | null;
    summary: string; // HTML format
    _embedded?: {
        seasons: TVMazeSeason[];
        episodes: TVMazeEpisode[];
        cast: TVMazeCastMember[];
    };
}

export interface TVMazeSeason {
    id: number;
    number: number;
    name: string;
    episodeOrder: number;
    premiereDate: string | null;
    endDate: string | null;
    network: { name: string } | null;
    webChannel: { name: string } | null;
    image: { medium: string; original: string } | null;
    summary: string | null;
}

export interface TVMazeEpisode {
    id: number;
    name: string;
    season: number;
    number: number;
    airdate: string;
    airtime: string;
    runtime: number | null;
    rating: { average: number | null };
    image: { medium: string; original: string } | null;
    summary: string | null;
}

export interface TVMazeCastMember {
    person: {
        id: number;
        name: string;
        image: { medium: string; original: string } | null;
    };
    character: {
        id: number;
        name: string;
        image: { medium: string; original: string } | null;
    };
    self: boolean;
    voice: boolean;
}

const TVMAZE_BASE = 'https://api.tvmaze.com';

/**
 * Search for TV shows by name
 */
export async function searchTVShows(query: string): Promise<TVMazeShow[]> {
    try {
        const url = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze search failed: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // TVMaze returns array of {score, show} objects
        return data.map((item: any) => item.show);
    } catch (error) {
        console.error('TVMaze search error:', error);
        return [];
    }
}

/**
 * Get single best match for a query
 */
export async function findBestTVShow(query: string, year?: string): Promise<TVMazeShow | null> {
    const results = await searchTVShows(query);

    if (results.length === 0) return null;

    // If year provided, try to match it
    if (year) {
        const yearMatches = results.filter(show =>
            show.premiered && show.premiered.startsWith(year)
        );
        if (yearMatches.length > 0) return yearMatches[0];
    }

    // Return best match (first result has highest score)
    return results[0];
}

/**
 * Get full show details with episodes and cast
 */
export async function getTVShowDetails(showId: number): Promise<TVMazeShow | null> {
    try {
        const url = `${TVMAZE_BASE}/shows/${showId}?embed[]=seasons&embed[]=episodes&embed[]=cast`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze details failed: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('TVMaze details error:', error);
        return null;
    }
}

/**
 * Get episodes for a specific season
 */
export async function getSeasonEpisodes(showId: number, seasonNumber: number): Promise<TVMazeEpisode[]> {
    try {
        const url = `${TVMAZE_BASE}/shows/${showId}/episodes`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze episodes failed: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // Filter episodes for specific season
        return data
            .filter((ep: TVMazeEpisode) => ep.season === seasonNumber)
            .sort((a: TVMazeEpisode, b: TVMazeEpisode) => a.number - b.number);
    } catch (error) {
        console.error('TVMaze season episodes error:', error);
        return [];
    }
}

/**
 * Get single episode details
 */
export async function getEpisode(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
): Promise<TVMazeEpisode | null> {
    try {
        const url = `${TVMAZE_BASE}/shows/${showId}/episodebynumber?season=${seasonNumber}&number=${episodeNumber}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze episode failed: ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('TVMaze episode error:', error);
        return null;
    }
}

/**
 * Strip HTML tags from TVMaze summaries
 */
export function stripHTML(html: string | null): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

/**
 * Convert TVMaze data to MovieMonk MovieData format
 */
export function convertTVMazeToMovieData(show: TVMazeShow): any {
    const premiered = show.premiered || '';
    const year = premiered ? new Date(premiered).getFullYear().toString() : '';

    // Calculate total episodes across all seasons
    const totalEpisodes = show._embedded?.episodes?.length || 0;
    const seasonsCount = show._embedded?.seasons?.length || 0;

    // Get cast (top 15)
    const cast = (show._embedded?.cast || []).slice(0, 15).map(c => ({
        name: c.person.name,
        role: c.character.name,
        known_for: 'Acting'
    }));

    // Build comprehensive summary
    const summary = stripHTML(show.summary);

    return {
        title: show.name,
        year,
        type: 'show' as const,
        genres: show.genres || [],
        poster_url: show.image?.original || '',
        backdrop_url: show.image?.original || '',
        trailer_url: '', // TVMaze doesn't provide trailers
        ratings: show.rating.average ? [{
            source: 'TVMaze',
            score: `${show.rating.average}/10`
        }] : [],
        cast,
        crew: {
            director: '', // Not in TVMaze API
            writer: '', // Not in TVMaze API
            music: '' // Not in TVMaze API
        },
        summary_short: summary.substring(0, 200) + (summary.length > 200 ? '...' : ''),
        summary_medium: summary.substring(0, 500) + (summary.length > 500 ? '...' : ''),
        summary_long_spoilers: '', // Will be filled by AI
        suspense_breaker: '', // Will be filled by AI
        where_to_watch: show.network?.name || show.webChannel?.name ? [{
            platform: show.network?.name || show.webChannel?.name || 'Unknown',
            link: show.officialSite || '',
            type: 'subscription' as const
        }] : [],
        extra_images: [], // TVMaze has limited images
        ai_notes: '', // Will be filled by AI

        // TV-specific extended data
        tvShow: {
            status: show.status,
            premiered: show.premiered,
            ended: show.ended,
            totalSeasons: seasonsCount,
            totalEpisodes,
            network: show.network?.name || show.webChannel?.name || 'Unknown',
            language: show.language,
            officialSite: show.officialSite,
            seasons: (show._embedded?.seasons || []).map(s => ({
                number: s.number,
                name: s.name || `Season ${s.number}`,
                episodeCount: s.episodeOrder || 0,
                premiereDate: s.premiereDate,
                endDate: s.endDate,
                image: s.image?.original || null,
                summary: stripHTML(s.summary)
            })),
            episodes: (show._embedded?.episodes || []).map(e => ({
                id: e.id,
                season: e.season,
                episode: e.number,
                name: e.name,
                airdate: e.airdate,
                runtime: e.runtime,
                rating: e.rating.average,
                image: e.image?.original || null,
                summary: stripHTML(e.summary)
            }))
        }
    };
}



================================================
FILE: styles/dynamic-search-island.css
================================================
/* ===========================
   Dynamic Search Island Styles
   Modern Header-Integrated Search
   =========================== */

/* Header Integration */
.header-search-slot {
  position: relative;
  min-width: 0;
  display: flex;
  justify-content: center;
  width: 100%;
  z-index: 60;
}

.search-island {
  position: relative;
  z-index: 60;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-island-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 65;
}

/* ===== Collapsed State: Minimal Pill ===== */
.search-island.collapsed {
  width: min(400px, 100%);
  height: 38px;
  border-radius: 19px;
  background: linear-gradient(135deg, rgba(20, 20, 28, 0.85) 0%, rgba(30, 30, 40, 0.85) 100%);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(124, 58, 237, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 0.625rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
  transition: all 0.3s ease;
}

.search-island.collapsed:hover {
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(40, 40, 55, 0.95) 100%);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(124, 58, 237, 0.4),
    0 0 20px rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.3);
}

.search-island.collapsed .search-icon {
  width: 20px;
  height: 20px;
  color: #a78bfa;
  flex-shrink: 0;
  opacity: 0.9;
  transition: transform 0.3s ease;
}

.search-island.collapsed:hover .search-icon {
  transform: scale(1.1);
}

.collapsed-text {
  flex: 1;
  color: #9ca3af;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}

.collapsed-kbd {
  display: none;
  gap: 0.375rem;
  align-items: center;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .collapsed-kbd {
    display: flex;
  }

  .collapsed-kbd .kbd-tag {
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.375rem;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
    font-size: 0.7rem;
    color: #9ca3af;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
}

/* Mobile adjustments */
@media (max-width: 639px) {
  .search-island.collapsed {
    width: 100%;
    padding: 0 0.875rem;
  }

  .collapsed-text {
    font-size: 0.875rem;
  }
}

/* ===== Expanded State: Full Search Modal ===== */
.search-island.expanded {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  width: min(540px, calc(100vw - 1.5rem));
  border-radius: 1.125rem;
  background: linear-gradient(135deg, rgba(17, 17, 27, 0.98) 0%, rgba(30, 30, 45, 0.98) 100%);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(139, 92, 246, 0.1);
  overflow: hidden;
  animation: search-expand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  z-index: 70;
}

.search-island.expanded.is-compact {
  max-height: none;
}

.search-island.expanded.has-results {
  max-height: min(90vh, 720px);
}

@media (max-width: 639px) {
  .search-island.expanded {
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    width: 100%;
    transform: none;
    border-radius: 1rem;
    animation: search-expand-mobile 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .search-island.expanded.has-results {
    max-height: min(78vh, 640px);
  }

  .island-content {
    padding: 1rem;
    gap: 0.875rem;
  }
}

.island-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  gap: 1rem;
  overflow-y: hidden;
  overscroll-behavior: contain;
}



/* Search Form */
.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: #6b7280;
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(124, 58, 237, 0.6);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15),
              0 4px 12px rgba(124, 58, 237, 0.3);
}

/* Search icon animation on focus */
.search-input-left-icon {
  transition: transform 0.3s ease, color 0.3s ease;
}

.search-input-wrapper:focus-within .search-input-left-icon {
  transform: translateY(-50%) scale(1.1);
  color: #a78bfa;
}

/* Input with embedded icons */
.search-input.has-icons {
  padding-left: 2.75rem;
  padding-right: 3rem;
}

.search-input-left-icon {
  position: absolute;
  left: 1rem;
  top: calc(50% - 1px);
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #a78bfa;
  opacity: 0.7;
  pointer-events: none;
  z-index: 2;
}

.search-input-action {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: rgba(139, 92, 246, 0.25);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  padding: 0;
}

.search-input-action:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.45);
  color: white;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.search-input-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.suggest-loading {
  position: absolute;
  right: 3.25rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #9ca3af;
  animation: mm-soft-pulse 1.5s ease-in-out infinite;
  z-index: 2;
}

/* Suggestions Dropdown */
.suggest-dropdown {
  position: relative;
  margin-top: 0.625rem;
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(8px);
  max-height: min(58vh, 520px);
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

@media (max-width: 639px) {
  .suggest-dropdown {
    max-height: min(52vh, 500px);
  }
}

.suggest-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.75rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: inherit;
}

.suggest-row:last-child {
  border-bottom: none;
}

.suggest-row:hover,
.suggest-row.active {
  background: rgba(139, 92, 246, 0.15);
}

.suggest-poster-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 56px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggest-poster-wrap.is-person {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.suggest-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suggest-poster.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.poster-icon {
  color: #a78bfa;
  opacity: 0.6;
}

.suggest-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.suggest-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: space-between;
}

.suggest-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: white;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggest-icon-tag {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #a78bfa;
}

.suggest-subtitle {
  font-size: 0.8125rem;
  color: #9ca3af;
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.suggest-role-chip {
  font-size: 0.66rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #ddd6fe;
  background: rgba(124, 58, 237, 0.24);
  border: 1px solid rgba(167, 139, 250, 0.35);
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggest-person-snippet {
  font-size: 0.76rem;
  color: #a5adbb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggest-inline-hint {
  font-size: 0.8125rem;
  color: #fbbf24;
  padding: 0.625rem;
  background: rgba(251, 191, 36, 0.1);
  border-left: 2px solid #fbbf24;
  border-radius: 0.375rem;
}

/* Mode Selector: Single-line pill toggle */
.mode-selector-pill {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 999px;
  border: 1px solid rgba(139, 92, 246, 0.15);
  padding: 0.25rem;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
}

.mode-pill-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45rem;
  flex: 1;
  min-width: 0;
  height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.mode-pill-btn:hover {
  color: #d1d5db;
}

.mode-pill-btn.active {
  background: rgba(139, 92, 246, 0.2);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.mode-icon-inline {
  color: #a78bfa;
  flex-shrink: 0;
}

.mode-label-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.mode-label-inline {
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: inherit;
  line-height: 1.1;
}

.mode-desc-inline {
  font-size: 0.64rem;
  line-height: 1.05;
  color: rgba(156, 163, 175, 0.82);
  letter-spacing: 0.01em;
}

.mode-pill-btn.active .mode-desc-inline {
  color: rgba(221, 214, 254, 0.95);
}

/* Animations */
@keyframes search-expand {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes search-slide-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes search-expand-mobile {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Utility Classes */
.capitalize {
  text-transform: capitalize;
}

@media (prefers-reduced-motion: reduce) {
  .search-island,
  .search-island.collapsed,
  .search-island.expanded,
  .search-island-backdrop {
    animation: none !important;
    transition: none !important;
  }

  .search-island.collapsed:hover {
    transform: none;
  }
}



================================================
FILE: styles/tv-show.css
================================================
/* TV Show Display Styles - Responsive Design */

.tv-show-display {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Header Section */
.tv-show-header {
  position: relative;
  margin-bottom: 2rem;
}

.backdrop-container {
  height: 400px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}

.backdrop-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.9));
}

.tv-show-info {
  display: flex;
  gap: 2rem;
  margin-top: -150px;
  position: relative;
  padding: 0 2rem;
  align-items: flex-end;
}

.tv-show-poster {
  width: 200px;
  height: 300px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.tv-show-meta {
  flex: 1;
  color: white;
  min-width: 0;
}

.tv-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.5);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.tv-show-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
  line-height: 1.2;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.tv-show-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin: 1rem 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.5);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  white-space: nowrap;
}

.info-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  white-space: nowrap;
}

.tv-show-dates,
.tv-show-genres {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.genre-tag {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  white-space: nowrap;
}

/* Section Styles */
.tv-show-section {
  margin: 2rem 0;
  padding: 0 2rem;
}

.tv-show-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid rgba(139, 92, 246, 0.5);
  padding-bottom: 0.5rem;
}

.tv-show-summary {
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

/* Season Selector */
.season-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.season-select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s;
}

.season-select:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(139, 92, 246, 0.5);
}

.season-select:focus {
  outline: 2px solid rgba(139, 92, 246, 0.8);
  outline-offset: 2px;
}

.season-info-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.season-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.season-progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin: 1rem 0;
  overflow: hidden;
}

.season-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(139, 92, 246, 1), rgba(167, 139, 250, 1));
  transition: width 0.6s ease;
}

.season-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Episode List */
.episode-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.episode-card-enhanced {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.episode-card-enhanced:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(255, 255, 255, 0.08));
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
}

.episode-card-enhanced.expanded {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(255, 255, 255, 0.05));
  border-color: rgba(139, 92, 246, 0.8);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
}

.episode-card-inner {
  display: flex;
  gap: 1.5rem;
  padding: 1.25rem;
}

.episode-thumbnail-container {
  position: relative;
  flex-shrink: 0;
  width: 200px;
  height: 112px;
  border-radius: 12px;
  overflow: hidden;
}

.episode-thumbnail-enhanced {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.episode-card-enhanced:hover .episode-thumbnail-enhanced {
  transform: scale(1.1);
}

.episode-play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.episode-card-enhanced:hover .episode-play-overlay {
  opacity: 1;
}

.play-icon {
  width: 48px;
  height: 48px;
  color: white;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.episode-content {
  flex: 1;
  min-width: 0;
}

.episode-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.episode-number-badge {
  display: inline-block;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 52, 206, 0.3));
  border: 1px solid rgba(139, 92, 246, 0.5);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.875rem;
  color: rgba(167, 139, 250, 1);
  letter-spacing: 0.5px;
}

.episode-rating-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.2));
  border: 1px solid rgba(234, 179, 8, 0.4);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  color: rgba(250, 204, 21, 1);
  font-size: 0.875rem;
  font-weight: 600;
}

.episode-title-enhanced {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: white;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.episode-meta-enhanced {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.episode-meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  white-space: nowrap;
}

.episode-summary-enhanced {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: fadeInUp 0.3s ease;
}

.episode-summary-enhanced p {
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9375rem;
}

.episode-expand-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(139, 92, 246, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(139, 92, 246, 1);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  min-height: 44px;
}

.episode-card-enhanced:hover .episode-expand-indicator {
  background: rgba(139, 92, 246, 0.1);
  color: rgba(167, 139, 250, 1);
}

.expand-arrow {
  transition: transform 0.3s ease;
}

.expand-arrow.rotated {
  transform: rotate(180deg);
}

/* No Episodes State */
.no-episodes {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.no-episodes-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: rgba(255, 255, 255, 0.2);
}

/* Cast Grid */
.cast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.cast-member {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.cast-member:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.cast-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.cast-role {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

/* AI Notes */
.ai-notes {
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

/* Official Site Link */
.official-site-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.5);
  border-radius: 8px;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
  min-height: 44px;
  text-align: center;
}

.official-site-link:hover {
  background: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

/* Icon Sizes */
.icon-small {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.icon-tiny {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design - Mobile First Approach */

/* Very Small Devices (320px - 360px) */
@media (max-width: 360px) {
  .tv-show-section {
    padding: 0 1rem;
  }

  .tv-show-info {
    padding: 0 1rem;
  }

  .tv-show-title {
    font-size: 1.75rem;
  }

  .tv-show-poster {
    width: 140px;
    height: 210px;
  }

  .episode-card-inner {
    padding: 1rem;
    gap: 1rem;
  }

  .cast-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
}

/* Small Devices - Mobile (360px - 640px) */
@media (max-width: 640px) {
  .backdrop-container {
    height: 250px;
    border-radius: 8px;
  }

  .tv-show-info {
    flex-direction: column;
    margin-top: -80px;
    gap: 1rem;
    align-items: center;
    text-align: center;
  }

  .tv-show-poster {
    width: 160px;
    height: 240px;
  }

  .tv-show-title {
    font-size: 2rem;
  }

  .tv-show-stats {
    justify-content: center;
    gap: 0.75rem;
  }

  .tv-show-dates,
  .tv-show-genres {
    justify-content: center;
  }

  .season-selector-header {
    flex-direction: column;
    align-items: stretch;
  }

  .season-selector-header h2 {
    text-align: center;
  }

  .season-select {
    width: 100%;
  }

  .episode-card-inner {
    flex-direction: column;
    gap: 1rem;
  }

  .episode-thumbnail-container {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .episode-title-enhanced {
    font-size: 1.125rem;
  }

  .cast-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  /* Disable hover effects on touch devices */
  .episode-card-enhanced:hover {
    transform: none;
  }

  .episode-play-overlay {
    opacity: 0.7;
  }
}

/* Tablet - Portrait (640px - 768px) */
@media (min-width: 640px) and (max-width: 768px) {
  .backdrop-container {
    height: 300px;
  }

  .tv-show-info {
    margin-top: -120px;
  }

  .tv-show-poster {
    width: 180px;
    height: 270px;
  }

  .tv-show-title {
    font-size: 2.25rem;
  }

  .episode-card-inner {
    gap: 1.25rem;
  }

  .episode-thumbnail-container {
    width: 160px;
    height: 90px;
  }

  .cast-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

/* Tablet - Landscape (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .backdrop-container {
    height: 350px;
  }

  .tv-show-info {
    margin-top: -130px;
  }

  .tv-show-poster {
    width: 190px;
    height: 285px;
  }

  .episode-thumbnail-container {
    width: 180px;
    height: 101px;
  }
}

/* Desktop - Small (1024px - 1280px) */
@media (min-width: 1024px) and (max-width: 1280px) {
  .tv-show-display {
    max-width: 1000px;
  }
}

/* Desktop - Large (1280px+) */
@media (min-width: 1280px) {
  .tv-show-display {
    max-width: 1200px;
  }

  .backdrop-container {
    height: 450px;
  }

  .tv-show-info {
    margin-top: -160px;
  }

  .tv-show-poster {
    width: 220px;
    height: 330px;
  }

  .tv-show-title {
    font-size: 3rem;
  }
}

/* Touch Device Optimization */
@media (hover: none) and (pointer: coarse) {
  /* Larger touch targets on touch devices */
  .episode-card-enhanced {
    touch-action: manipulation;
  }

  .season-select {
    min-height: 48px;
    font-size: 1.125rem;
  }

  .episode-expand-indicator {
    min-height: 48px;
    padding: 1rem;
  }

  .official-site-link {
    min-height: 48px;
    padding: 1rem 1.5rem;
  }

  /* Always show play overlay on touch devices */
  .episode-play-overlay {
    opacity: 0.7;
  }

  /* Disable hover animations on touch */
  .episode-card-enhanced:hover {
    transform: none;
    box-shadow: none;
  }

  .cast-member:hover {
    transform: none;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .episode-card-enhanced,
  .episode-thumbnail-enhanced,
  .episode-play-overlay,
  .expand-arrow,
  .season-progress-fill,
  .cast-member,
  .official-site-link {
    transition: none;
    animation: none;
  }

  .episode-summary-enhanced {
    animation: none;
  }
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .tv-badge,
  .status-badge,
  .rating-badge,
  .info-item,
  .genre-tag {
    border-width: 2px;
  }

  .episode-card-enhanced {
    border-width: 2px;
  }

  .episode-card-enhanced:hover,
  .episode-card-enhanced.expanded {
    border-width: 3px;
  }
}



================================================
FILE: types/react-window.d.ts
================================================
declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
  }

  export interface ListProps<ItemType = any> {
    height: number;
    itemCount: number;
    itemSize: number;
    width: number | string;
    overscanCount?: number;
    itemData?: ItemType[];
    children: React.ComponentType<ListChildComponentProps>;
  }

  export class List<ItemType = any> extends React.Component<ListProps<ItemType>> {}
}



================================================
FILE: .github/codeql-config.yml
================================================
name: "CodeQL Config"
disable-default-queries: true



================================================
FILE: .github/dependabot.yml
================================================
version: 2
updates:
  # Enable version updates for npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    open-pull-requests-limit: 10
    allow:
      - dependency-type: "all"
    assignees:
      - "mfscpayload-690"
    commit-message:
      prefix: "build(deps):"
      include: "scope"
    pull-request-branch-name:
      separator: "/"
    labels:
      - "dependencies"
      - "automated"
    # Priority: critical and high severity
    ignore:
      - dependency-name: "moment"
        versions: ["2.x"]

  # Enable version updates for GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00"
    open-pull-requests-limit: 5
    assignees:
      - "mfscpayload-690"
    commit-message:
      prefix: "ci(deps):"
    labels:
      - "ci"
      - "automated"



================================================
FILE: .github/workflows/ci.yml
================================================
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 22

      - name: Install dependencies
        run: npm install

      - name: Lint (TypeScript)
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          # CI only needs non-empty placeholders to satisfy build-time checks.
          GROQ_API_KEY: test-key
          MISTRAL_API_KEY: test-key
          OPENROUTER_API_KEY: test-key
          TMDB_API_KEY: test-key
          TMDB_READ_TOKEN: test-token
          PERPLEXITY_API_KEY: test-key
          OMDB_API_KEY: test-key

      - name: Test
        run: npm test
        env:
          TMDB_API_KEY: test-key
          REDIS_URL: redis://localhost:6379



================================================
FILE: .github/workflows/regenerate-lockfile.yml
================================================
name: Regenerate package-lock.json

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  regenerate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v6
        
      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 22
          
      - name: Generate package-lock.json
        run: npm install
        
      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package-lock.json
          git commit -m "chore: regenerate package-lock.json" || echo "No changes to commit"
          git push https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git HEAD:main


