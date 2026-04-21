import React, { Suspense, lazy, useCallback, useEffect, useRef, useState, startTransition } from 'react';
import ErrorBanner from './components/ErrorBanner';
import AmbiguousModal, { Candidate as AmbiguousCandidate } from './components/AmbiguousModal';
import DynamicSearchIsland from './components/DynamicSearchIsland';
import HeaderUtilityMenu from './components/HeaderUtilityMenu';
import LoadingScreen from './components/LoadingScreen';
import ActionToast from './components/ActionToast';
import { AuthButton } from './components/AuthButton';
import { MigrationModal } from './components/MigrationModal';
import { NoticeDialog } from './components/BrandedDialogs';
import { MovieData, QueryComplexity, GroundingSource, AIProvider, SuggestionItem, WatchedTitle, WatchlistSaveReceipt } from './types';
import { fetchFullPlotDetails } from './services/aiService';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { ClipboardIcon, EditIcon, Logo, TrashIcon, XMarkIcon, GithubIcon } from './components/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { track } from '@vercel/analytics/react';
import { useCloudWatchlists } from './hooks/useCloudWatchlists';
import { useAuth } from './contexts/AuthContext';
import { VirtualizedList } from './components/VirtualizedList';
import { initPerfDebug, useRenderCounter } from './lib/perfDebug';
import { parseAppRoute } from './lib/routeState';
import { useWatched } from './hooks/useWatched';
import { cacheGet, cacheSet, movieCacheKey, personCacheKey } from './lib/sessionCache';
import { WatchlistIconPicker, WatchlistIconBadge, WATCHLIST_ICON_DEFAULT } from './components/WatchlistIconPicker';
import SeoHead from './components/SeoHead';
import { SITE_NAME } from './lib/seo';
import { APP_VERSION } from './lib/appMeta';
import {
  QuickSaveTitle,
  QUICK_SAVE_DEFAULT_COLOR,
  buildQuickMovieData,
  canSubmitQuickSave,
  getClosedQuickSaveState,
  getOpenedQuickSaveState
} from './lib/quickSave';

const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

type AppView = 'discovery' | 'search' | 'movie' | 'person';
const GLOBAL_LOADING_MIN_VISIBLE_MS = 300;
const ACTION_TOAST_MS = 4000;
const DiscoveryPage = lazy(() => import('./components/DiscoveryPage'));
const SearchResultsPage = lazy(() => import('./components/SearchResultsPage'));
const PersonDisplay = lazy(() => import('./components/PersonDisplay'));
const MovieDisplay = lazy(() => import('./components/MovieDisplay'));

type UndoToastState = {
  id: number;
  kind: 'watchlist' | 'watched';
  message: string;
  onUndo: () => Promise<void>;
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [actionToast, setActionToast] = useState<UndoToastState | null>(null);
  const [undoingToastId, setUndoingToastId] = useState<number | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentView, setCurrentView] = useState<AppView>('discovery');
  const [globalLoadingVisible, setGlobalLoadingVisible] = useState(false);
  const [shortlistCandidates, setShortlistCandidates] = useState<AmbiguousCandidate[] | null>(null);
  const [quickSaveTarget, setQuickSaveTarget] = useState<QuickSaveTitle | null>(null);
  const [quickSaveFolderId, setQuickSaveFolderId] = useState('');
  const [quickSaveNewFolderName, setQuickSaveNewFolderName] = useState('');
  const [quickSaveNewFolderColor, setQuickSaveNewFolderColor] = useState(QUICK_SAVE_DEFAULT_COLOR);
  const [quickSaveNewFolderIcon, setQuickSaveNewFolderIcon] = useState(WATCHLIST_ICON_DEFAULT);
  const [shareFallbackLink, setShareFallbackLink] = useState<string | null>(null);
  const quickSaveDialogRef = useRef<HTMLDivElement | null>(null);
  const quickSavePreviousFocusRef = useRef<HTMLElement | null>(null);
  const loadingStartedAtRef = useRef<number | null>(null);
  const loadingHideTimeoutRef = useRef<number | null>(null);
  const lastHandledRouteRef = useRef<string>('');
  const actionToastTimeoutRef = useRef<number | null>(null);
  const lastSearchQueryRef = useRef<string | null>(null);
  const {
    folders: watchlists,
    addFolder,
    saveToFolder,
    rollbackSave,
    isCloud,
    isSyncing
  } = useCloudWatchlists();

  const closeQuickSaveModal = useCallback(() => {
    const next = getClosedQuickSaveState(WATCHLIST_ICON_DEFAULT);
    setQuickSaveTarget(next.target);
    setQuickSaveFolderId(next.folderId);
    setQuickSaveNewFolderName(next.newFolderName);
    setQuickSaveNewFolderColor(next.newFolderColor);
    setQuickSaveNewFolderIcon(next.newFolderIcon);
  }, []);

  // Lock body scroll when quick-save modal is open
  useEffect(() => {
    if (quickSaveTarget) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [quickSaveTarget]);

  useEffect(() => {
    if (!quickSaveTarget) return;

    quickSavePreviousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const modal = quickSaveDialogRef.current;
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const getFocusableElements = () => {
      if (!modal) return [] as HTMLElement[];
      return Array.from(modal.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.tabIndex >= 0 && !element.hasAttribute('aria-hidden')
      );
    };

    const initialFocusableElements = getFocusableElements();
    if (initialFocusableElements.length > 0) {
      initialFocusableElements[0].focus();
    } else {
      modal?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!quickSaveDialogRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeQuickSaveModal();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        quickSaveDialogRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !quickSaveDialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !quickSaveDialogRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      quickSavePreviousFocusRef.current?.focus();
    };
  }, [closeQuickSaveModal, quickSaveTarget]);
  const { isWatched, toggle: toggleWatched, watchedCount } = useWatched();

  const dismissActionToast = useCallback(() => {
    if (actionToastTimeoutRef.current !== null) {
      window.clearTimeout(actionToastTimeoutRef.current);
      actionToastTimeoutRef.current = null;
    }
    setActionToast(null);
    setUndoingToastId(null);
  }, []);

  const showActionToast = useCallback((nextToast: Omit<UndoToastState, 'id'>) => {
    if (actionToastTimeoutRef.current !== null) {
      window.clearTimeout(actionToastTimeoutRef.current);
    }

    const toastWithId: UndoToastState = {
      ...nextToast,
      id: Date.now() + Math.floor(Math.random() * 1000)
    };

    setUndoingToastId(null);
    setActionToast(toastWithId);
    actionToastTimeoutRef.current = window.setTimeout(() => {
      setActionToast((current) => current?.id === toastWithId.id ? null : current);
      setUndoingToastId((current) => current === toastWithId.id ? null : current);
      actionToastTimeoutRef.current = null;
    }, ACTION_TOAST_MS);
  }, []);

  useEffect(() => () => {
    if (actionToastTimeoutRef.current !== null) {
      window.clearTimeout(actionToastTimeoutRef.current);
    }
  }, []);

  const buildWatchedEntry = useCallback((entry: Omit<WatchedTitle, 'id' | 'user_id' | 'watched_at'>) => ({
    tmdb_id: entry.tmdb_id,
    media_type: entry.media_type,
    title: entry.title,
    poster_url: entry.poster_url,
    year: entry.year,
  }), []);

  const runWatchedToggle = useCallback(async (
    entry: Omit<WatchedTitle, 'id' | 'user_id' | 'watched_at'>,
    options: { showUndo?: boolean } = {}
  ) => {
    const { showUndo = true } = options;

    try {
      const result = await toggleWatched(entry);
      if (!showUndo) return result;

      showActionToast({
        kind: 'watched',
        message: result.action === 'marked' ? 'Marked as watched' : 'Removed from watched',
        onUndo: async () => {
          await runWatchedToggle(buildWatchedEntry(result.entry), { showUndo: false });
        }
      });
      return result;
    } catch (error) {
      setError('Failed to update watched titles');
      throw error;
    }
  }, [buildWatchedEntry, showActionToast, toggleWatched]);

  const handleQuickSaveToWatchlist = useCallback((item: QuickSaveTitle) => {
    const next = getOpenedQuickSaveState(item, watchlists, WATCHLIST_ICON_DEFAULT);
    setQuickSaveTarget(next.target);
    setQuickSaveFolderId(next.folderId);
    setQuickSaveNewFolderName(next.newFolderName);
    setQuickSaveNewFolderColor(next.newFolderColor);
    setQuickSaveNewFolderIcon(next.newFolderIcon);
  }, [watchlists]);

  const handleConfirmQuickSave = useCallback(async () => {
    if (!quickSaveTarget) return;

    let folderId = quickSaveFolderId;
    if (!folderId && quickSaveNewFolderName.trim()) {
      folderId = addFolder(quickSaveNewFolderName, quickSaveNewFolderIcon) || '';
    }

    if (!folderId) return;

    // ── Duplicate check: see if the title is already in this folder ──
    const targetFolder = watchlists.find((f) => f.id === folderId);
    if (targetFolder) {
      const movieData = buildQuickMovieData(quickSaveTarget);
      const targetKey = movieData.tmdb_id ? `tmdb:${movieData.tmdb_id}` : `${movieData.title}-${movieData.year}-${movieData.type}`.toLowerCase();
      const alreadyExists = targetFolder.items.some((existing) => {
        const existingKey = existing.movie?.tmdb_id ? `tmdb:${existing.movie.tmdb_id}` : `${existing.movie?.title}-${existing.movie?.year}-${existing.movie?.type}`.toLowerCase();
        return existingKey === targetKey;
      });
      if (alreadyExists) {
        showActionToast({
          kind: 'watchlist',
          message: `Already saved in "${targetFolder.name}"`,
          onUndo: async () => { /* no-op – nothing to undo */ }
        });
        closeQuickSaveModal();
        return;
      }
    }

    try {
      const receipt = await saveToFolder(folderId, buildQuickMovieData(quickSaveTarget), quickSaveTarget.title);
      showActionToast({
        kind: 'watchlist',
        message: 'Saved to Watchlist',
        onUndo: async () => {
          await rollbackSave(receipt);
        }
      });
      closeQuickSaveModal();
    } catch (error) {
      setError('Failed to save title to watchlist');
    }
  }, [
    addFolder,
    closeQuickSaveModal,
    quickSaveFolderId,
    quickSaveNewFolderColor,
    quickSaveNewFolderIcon,
    quickSaveNewFolderName,
    quickSaveTarget,
    rollbackSave,
    saveToFolder,
    showActionToast,
    watchlists
  ]);

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



  const openPersonById = useCallback(async (
    personId: number,
    titleHint?: string,
    options: { manageLoading?: boolean; skipNavigate?: boolean } = {}
  ) => {
    const manageLoading = options.manageLoading !== false;
    const shouldNavigate = options.skipNavigate !== true;
    if (shouldNavigate) {
      navigate(`/person/${personId}`);
    }

    // ── Cache check ────────────────────────────────────────────────────────
    const cached = cacheGet<any>('person', personCacheKey(personId));
    if (cached) {
      debugLog('[cache] person hit', personId);
      startTransition(() => {
        setPersonData(cached);
        setMovieData(null);
        setSources(cached?.sources || null);
        setCurrentView('person');
        if (titleHint || cached?.person?.name) {
          setCurrentQuery(titleHint || cached?.person?.name || '');
        }
      });
      scrollMainContentToTop();
      return;
    }
    // ── Fetch ───────────────────────────────────────────────────────────────
    if (manageLoading) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const data = await fetch(`/api/person/${personId}`).then(r => r.json());
      cacheSet('person', personCacheKey(personId), data);
      startTransition(() => {
        setPersonData(data);
        setMovieData(null);
        setSources(data?.sources || null);
        setCurrentView('person');
        if (titleHint || data?.person?.name) {
          setCurrentQuery(titleHint || data?.person?.name || '');
        }
      });
      scrollMainContentToTop();
    } catch (e) {
      setError('Failed to load person details');
    } finally {
      if (manageLoading) {
        setIsLoading(false);
      }
    }
  }, [navigate, scrollMainContentToTop]);

  const loadPersonFromShare = async (personId: number) => {
    await openPersonById(personId, undefined, { manageLoading: true });
  };

  const handleShare = useCallback(async () => {
    let shareUrl = window.location.origin;

    if (movieData) {
      // Determine if this is a TV show using all available signals
      const isTvShow = Boolean(movieData.tvShow) || movieData.type === 'show' || movieData.media_type === 'tv';
      const routePrefix = isTvShow ? 'tv' : 'movie';

      // Build a proper deep link to this specific movie/show
      shareUrl = movieData.tmdb_id
        ? `${window.location.origin}/${routePrefix}/${movieData.tmdb_id}`
        : `${window.location.origin}?q=${encodeURIComponent(movieData.title)}&type=${isTvShow ? 'show' : 'movie'}&year=${movieData.year}`;
    } else if (personData) {
      const personName = personData?.person?.name || personData?.name || '';
      const personId = personData?.person?.id || personData?.id;
      shareUrl += `?q=${encodeURIComponent(personName)}&type=person&id=${personId}`;
    } else {
      return; // Only share when a specific title or person is open
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);

      track('share_link_copied', {
        type: movieData ? 'movie' : 'person',
        title: movieData?.title || personData?.person?.name || personData?.name || ''
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
        setShareFallbackLink(shareUrl);
      }
      document.body.removeChild(textarea);
    }
  }, [movieData, personData]);

  const handleGoHome = useCallback(() => {
    navigate('/');
    startTransition(() => {
      setCurrentView('discovery');
      setMovieData(null);
      setPersonData(null);
      setSources(null);
      setCurrentQuery('');
    });
    scrollMainContentToTop();
  }, [navigate, scrollMainContentToTop]);

  const handleOpenWatchlists = useCallback(() => {
    navigate('/watchlists');
  }, [navigate]);


  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleOpenTitle = useCallback(async (
    item: { id: number; mediaType: 'movie' | 'tv' },
    provider?: AIProvider,
    options: { skipNavigate?: boolean } = {}
  ) => {
    if (!options.skipNavigate) {
      navigate(`/${item.mediaType}/${item.id}`);
    }
    scrollMainContentToTop();

    const activeProvider = provider || selectedProvider || 'groq';
    setSelectedProvider(activeProvider);

    // ── Cache check ────────────────────────────────────────────────────────
    const cKey = movieCacheKey(item.id, item.mediaType === 'tv');
    const cached = cacheGet<any>('movie', cKey);
    if (cached) {
      debugLog('[cache] movie hit', item.id, item.mediaType);
      startTransition(() => {
        setMovieData(cached);
        setPersonData(null);
        setSources([{ web: { uri: `https://www.themoviedb.org/${item.mediaType}/${item.id}`, title: 'The Movie Database (TMDB)' } }]);
        setCurrentView('movie');
        setCurrentQuery(cached?.title || '');
      });
      return;
    }
    // ── Fetch ───────────────────────────────────────────────────────────────
    setIsLoading(true);
    setError(null);
    try {
      const detailsRes = await fetch(
        `/api/ai?action=details&id=${item.id}&media_type=${item.mediaType}&provider=${activeProvider}`
      );
      if (!detailsRes.ok) {
        throw new Error('Failed to load title details');
      }
      const detailsData = await detailsRes.json();
      cacheSet('movie', cKey, detailsData);
      startTransition(() => {
        setMovieData(detailsData);
        setPersonData(null);
        setSources([{ web: { uri: `https://www.themoviedb.org/${item.mediaType}/${item.id}`, title: 'The Movie Database (TMDB)' } }]);
        setCurrentView('movie');
        setCurrentQuery(detailsData?.title || '');
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to open title');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, scrollMainContentToTop, selectedProvider]);

  const handleSendMessage = useCallback(async (
    message: string,
    _complexity: QueryComplexity,
    _provider: AIProvider = 'groq',
    options: { skipNavigate?: boolean } = {}
  ) => {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) return;

    setError(null);
    setCurrentQuery(normalizedMessage);
    startTransition(() => {
      setCurrentView('search');
      setMovieData(null);
      setPersonData(null);
      setSources(null);
      setShortlistCandidates(null);
    });
    if (!options.skipNavigate) {
      navigate(`/search?q=${encodeURIComponent(normalizedMessage)}`);
    }
    scrollMainContentToTop('auto');

    if (user?.id && isSupabaseConfigured && supabase && lastSearchQueryRef.current !== normalizedMessage) {
      lastSearchQueryRef.current = normalizedMessage;
      try {
        console.log('Inserting search history entry into Supabase:', normalizedMessage);
        const { error } = await supabase.from('search_history').insert({
          user_id: user.id,
          query: normalizedMessage
        });
        if (error) {
           console.error('Supabase search_history insert error:', error);
        }
      } catch (err) {
        console.error('Exception during search history insert:', err);
      }
    }
  }, [navigate, scrollMainContentToTop, user?.id]);

  const handleQuickSearch = useCallback((title: string) => {
    handleSendMessage(title, QueryComplexity.SIMPLE, 'groq');
  }, [handleSendMessage]);

  const handleSaveMovieToWatchlist = useCallback(async (
    folderId: string,
    movie: MovieData,
    savedTitle?: string
  ) => {
    // ── Duplicate check ──
    const targetFolder = watchlists.find((f) => f.id === folderId);
    if (targetFolder) {
      const targetKey = movie.tmdb_id ? `tmdb:${movie.tmdb_id}` : `${movie.title}-${movie.year}-${movie.type}`.toLowerCase();
      const alreadyExists = targetFolder.items.some((existing) => {
        const existingKey = existing.movie?.tmdb_id ? `tmdb:${existing.movie.tmdb_id}` : `${existing.movie?.title}-${existing.movie?.year}-${existing.movie?.type}`.toLowerCase();
        return existingKey === targetKey;
      });
      if (alreadyExists) {
        showActionToast({
          kind: 'watchlist',
          message: `Already saved in "${targetFolder.name}"`,
          onUndo: async () => { /* no-op */ }
        });
        return;
      }
    }

    try {
      const receipt = await saveToFolder(folderId, movie, savedTitle);
      showActionToast({
        kind: 'watchlist',
        message: 'Saved to Watchlist',
        onUndo: async () => {
          await rollbackSave(receipt);
        }
      });
    } catch (error) {
      setError('Failed to save title to watchlist');
      throw error;
    }
  }, [rollbackSave, saveToFolder, showActionToast, watchlists]);

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



  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}`;
    if (lastHandledRouteRef.current === routeKey) {
      return;
    }
    lastHandledRouteRef.current = routeKey;

    const route = parseAppRoute(location.pathname, location.search);

    if (route.kind === 'home') {
      setCurrentView('discovery');
      return;
    }

    if (route.kind === 'search') {
      setCurrentQuery(route.query || '');
      setCurrentView('search');
      setMovieData(null);
      setPersonData(null);
      setSources(null);
      if (route.query) {
        track('shared_link_opened', { query: route.query, type: 'search-route' });
      }
      return;
    }

    if ((route.kind === 'movie' || route.kind === 'tv') && route.id) {
      const mediaType = route.kind === 'tv' ? 'tv' : 'movie';
      void handleOpenTitle({ id: route.id, mediaType }, selectedProvider, { skipNavigate: true });
      return;
    }

    if (route.kind === 'person' && route.id) {
      void openPersonById(route.id, undefined, { manageLoading: true, skipNavigate: true });
      return;
    }

    if (route.kind === 'unknown') {
      navigate('/', { replace: true });
    }
  }, [
    location.pathname,
    location.search,
    navigate,
    openPersonById,
    handleOpenTitle,
    selectedProvider
  ]);

  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: 'https://moviemonk-ai.vercel.app/',
    description: 'Discover trending movies and TV shows, then dive deeper with MovieMonk\'s AI-assisted details.'
  };

  return (
    <>
      {currentView === 'discovery' && (
        <SeoHead
          title="Discover Movies & TV"
          description="Browse trending movies and TV shows, then open detailed AI-assisted summaries, cast, ratings, and watch options."
          path="/"
          structuredData={[homeStructuredData]}
        />
      )}
      <div className="app-container">
        {/* Header */}
        <header className="app-header flex-shrink-0 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-2.5 glass-panel border-b-0 z-50">
          <button type="button" className="flex items-center gap-2.5 sm:gap-3 text-left" onClick={handleGoHome} aria-label="Go to discovery home">
            <Logo className="w-[2.125rem] h-[2.125rem] sm:w-9 sm:h-9 text-primary drop-shadow-glow" />
            {/*
            Previous cinematic wordmark:
            <h1 className="brand-wordmark title-font text-xl sm:text-2xl font-bold tracking-tight">
              <span className="brand-wordmark-prefix">Movie</span>
              <span className="brand-wordmark-main">Monk</span>
            </h1>
            */}
            {/*
            Rejected studio wordmark:
            <h1 className="brand-studio title-font text-xl sm:text-2xl font-bold tracking-tight" aria-label="MovieMonk">
              <span className="brand-studio-prefix">Movie</span>
              <span className="brand-studio-title">Monk</span>
            </h1>
            */}
            {/*
            Rejected premiere wordmark:
            <h1 className="brand-premiere text-xl sm:text-2xl font-bold tracking-tight" aria-label="MovieMonk">
              <span className="brand-premiere-prefix">Movie</span>
              <span className="brand-premiere-title">Monk</span>
            </h1>
            */}
            <h1 className="brand-signature title-font text-xl sm:text-2xl font-bold tracking-tight" aria-label="MovieMonk">
              <span className="brand-signature-movie">Movie</span>
              <span className="brand-signature-monk">Monk</span>
            </h1>
          </button>
          <div className="header-search-slot col-span-2 sm:col-span-1 order-3 sm:order-none px-0 sm:px-2">
            <DynamicSearchIsland
              initialQuery={currentQuery || new URLSearchParams(location.search).get('q') || ''}
              onSearch={handleSendMessage}
              onSuggestionSelect={handleSuggestionSelect}
              isLoading={isLoading}
            />
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-2.5">
            <AuthButton />
            <HeaderUtilityMenu
              user={user}
              isCloud={isCloud}
              isSyncing={isSyncing}
              canShare={Boolean(movieData || personData)}
              onOpenWatchlists={handleOpenWatchlists}
              onOpenSettings={handleOpenSettings}
              onShare={handleShare}
            />
          </div>
        </header>

        {quickSaveTarget && (
          <div className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="quick-save-title" onClick={closeQuickSaveModal}>
            <div
              ref={quickSaveDialogRef}
              tabIndex={-1}
              className="w-full max-w-xl bg-brand-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden h-[92dvh] max-h-[92dvh] sm:h-[88dvh] sm:max-h-[88dvh] flex flex-col min-h-0 animate-scale-up"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 id="quick-save-title" className="text-lg font-bold text-white">Save to watchlist</h3>
                  <p className="text-sm text-brand-text-dark mt-1 line-clamp-1">{quickSaveTarget.title}</p>
                </div>
                <button type="button" onClick={closeQuickSaveModal} className="p-2 rounded-lg hover:bg-white/10 text-white" aria-label="Close save dialog">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1 min-h-0 min-w-0">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-dark mb-3">Choose a folder</p>
                  <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
                    {watchlists.length > 0 ? watchlists.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => setQuickSaveFolderId(folder.id)}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${quickSaveFolderId === folder.id ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 border border-white/10 text-white">
                            <WatchlistIconBadge iconKey={folder.icon} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{folder.name}</div>
                            <div className="text-xs text-brand-text-dark">{folder.items.length} titles</div>
                          </div>
                        </div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-text-light">
                        No watchlists yet. Create one below to save this title.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-widest text-brand-text-dark">Or create a new folder</div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={quickSaveNewFolderName}
                      onChange={(event) => setQuickSaveNewFolderName(event.target.value)}
                      placeholder="New folder name"
                      className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <WatchlistIconPicker selectedIcon={quickSaveNewFolderIcon} onSelect={setQuickSaveNewFolderIcon} compactLabel="Pick a folder icon" />
                  <p className="text-xs text-brand-text-dark">If you type a new folder name, it will be created when you save.</p>
                </div>

              </div>

              <div className="flex-shrink-0 flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-white/10 bg-brand-surface/50 backdrop-blur-sm">
                <button type="button" onClick={closeQuickSaveModal} className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuickSave}
                  className="px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-secondary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={!canSubmitQuickSave({
                    target: quickSaveTarget,
                    folderId: quickSaveFolderId,
                    newFolderName: quickSaveNewFolderName,
                    newFolderColor: quickSaveNewFolderColor,
                    newFolderIcon: quickSaveNewFolderIcon
                  })}
                >
                  Save Title
                </button>
              </div>
            </div>
          </div>
        )}

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

        {actionToast && (
          <div className="mm-action-toast-shell z-[10000]">
            <ActionToast
              kind={actionToast.kind}
              message={actionToast.message}
              isUndoing={undoingToastId === actionToast.id}
              onDismiss={dismissActionToast}
              onUndo={() => {
                if (undoingToastId === actionToast.id) return;
                setUndoingToastId(actionToast.id);
                void actionToast.onUndo()
                  .then(() => dismissActionToast())
                  .catch(() => {
                    setError('Failed to undo that action');
                    dismissActionToast();
                  });
              }}
            />
          </div>
        )}

        {/* Error Banner */}
        {
          error && (
            <div className="flex-shrink-0 px-3 md:px-6 py-2">
              <ErrorBanner message={error} onClose={() => setError(null)} />
            </div>
          )
        }

        {/* Main Content Area - Full width Featured UI */}
        <div className="main-content pb-4 sm:pb-6">
          <Suspense
            fallback={
              <div className="w-full flex items-center justify-center py-10 text-sm text-brand-text-light/80">
                Loading content…
              </div>
            }
          >
            {currentView === 'discovery' ? (
              <DiscoveryPage
                onOpenTitle={(item) => handleOpenTitle(item)}
                onRunQuery={(nextQuery) => handleSendMessage(nextQuery, QueryComplexity.SIMPLE, 'groq')}
                isWatched={(id, mediaType) => isWatched(String(id), mediaType)}
                onToggleWatched={(item) => { void runWatchedToggle({
                  tmdb_id: String(item.id),
                  media_type: item.media_type,
                  title: item.title,
                  poster_url: item.poster_url ?? undefined,
                  year: item.year ?? undefined,
                }); }}
                onQuickSaveToWatchlist={handleQuickSaveToWatchlist}
                watchlists={watchlists}
              />
            ) : currentView === 'search' ? (
              <SearchResultsPage
                query={new URLSearchParams(location.search).get('q') || currentQuery}
                onSearchQuery={(nextQuery) => handleSendMessage(nextQuery, QueryComplexity.SIMPLE)}
                onOpenTitle={(item) => handleOpenTitle(item)}
                onOpenPerson={(personId, name) => {
                  void openPersonById(personId, name, { manageLoading: true });
                }}
                isWatched={(id, mediaType) => isWatched(String(id), mediaType)}
                onToggleWatched={(item) => { void runWatchedToggle({
                  tmdb_id: String(item.id),
                  media_type: item.media_type,
                  title: item.title,
                  poster_url: item.poster_url ?? undefined,
                  year: item.year ?? undefined,
                }); }}
                onQuickSaveToWatchlist={handleQuickSaveToWatchlist}
              />
            ) : currentView === 'person' && personData ? (
              <PersonDisplay
                key={personData?.person?.id}
                data={personData}
                isLoading={isLoading}
                onQuickSearch={handleQuickSearch}
                onBriefMe={handleBriefMe}
                onOpenTitle={(item) => handleOpenTitle(item, selectedProvider)}
              />
            ) : (
              <MovieDisplay
                key={movieData?.tmdb_id ?? 'movie-display'}
                movie={movieData}
                isLoading={isLoading}
                sources={sources}
                selectedProvider={selectedProvider}
                onFetchFullPlot={fetchFullPlotDetails}
                onQuickSearch={handleQuickSearch}
                onOpenTitle={(item) => handleOpenTitle(item, selectedProvider)}
                watchlists={watchlists}
                onCreateWatchlist={addFolder}
                onSaveToWatchlist={handleSaveMovieToWatchlist}
                isWatched={movieData ? isWatched(
                  String(movieData.tmdb_id || ''),
                  movieData.tvShow ? 'tv' : 'movie'
                ) : false}
                onToggleWatched={() => {
                  if (!movieData) return;
                  void runWatchedToggle({
                    tmdb_id: String(movieData.tmdb_id || ''),
                    media_type: movieData.tvShow ? 'tv' : 'movie',
                    title: movieData.title,
                    poster_url: movieData.poster_url,
                    year: movieData.year,
                  });
                }}
                onToggleRelatedWatched={(entry) => {
                  void runWatchedToggle({
                    tmdb_id: entry.tmdb_id,
                    media_type: entry.media_type,
                    title: entry.title,
                    poster_url: entry.poster_url ?? undefined,
                    year: entry.year ?? undefined,
                  });
                }}
                isRelatedWatched={(tmdbId, mediaType) => isWatched(tmdbId, mediaType)}
                onQuickSaveToWatchlist={handleQuickSaveToWatchlist}
              />
            )}
          </Suspense>

          {/* Global Footer */}
          <footer className="w-full py-2.5 mt-6 text-center border-t border-white/10 text-brand-text-light/50 text-xs px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
              <span className="whitespace-nowrap">MovieMonk v{APP_VERSION} · MIT License</span>
              <span className="hidden sm:inline-block w-0.5 h-0.5 rounded-full bg-white/20"></span>
              <a 
                href="https://github.com/mfscpayload-690/moviemonk-ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-white transition-colors group"
                aria-label="GitHub Repository"
              >
                <GithubIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Contribute</span>
              </a>
            </div>
          </footer>
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


      {shortlistCandidates && shortlistCandidates.length > 0 && (
        <AmbiguousModal
          mode="person-shortlist"
          candidates={shortlistCandidates}
          onSelect={handleShortlistSelect}
          onClose={() => setShortlistCandidates(null)}
        />
      )}

      <NoticeDialog
        open={Boolean(shareFallbackLink)}
        title="Copy this link to share"
        description={shareFallbackLink || undefined}
        onClose={() => setShareFallbackLink(null)}
      />

      <MigrationModal />

    </>
  );
};

export default App;
