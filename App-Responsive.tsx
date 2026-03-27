import React, { useCallback, useEffect, useRef, useState, startTransition } from 'react';
import MovieDisplay from './components/MovieDisplay';
import PersonDisplay from './components/PersonDisplay';
import DiscoveryPage from './components/DiscoveryPage';
import ErrorBanner from './components/ErrorBanner';
import AmbiguousModal, { Candidate as AmbiguousCandidate } from './components/AmbiguousModal';
import DynamicSearchIsland from './components/DynamicSearchIsland';
import LoadingScreen from './components/LoadingScreen';
import PersonalizedFeedPanel from './components/PersonalizedFeedPanel';
import { AuthButton } from './components/AuthButton';
import { MigrationModal } from './components/MigrationModal';
import { MovieData, QueryComplexity, GroundingSource, AIProvider, SuggestionItem } from './types';
import { fetchMovieData, fetchFullPlotDetails } from './services/aiService';
import { ClipboardIcon, EditIcon, FolderIcon, Logo, ShareIcon, TrashIcon, XMarkIcon } from './components/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { track } from '@vercel/analytics/react';
import { useCloudWatchlists } from './hooks/useCloudWatchlists';
import { VirtualizedList } from './components/VirtualizedList';
import { initPerfDebug, useRenderCounter } from './lib/perfDebug';
import { parseAppRoute } from './lib/routeState';

const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const WATCHLIST_COLORS = ['#7c3aed', '#db2777', '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7'];
type AppView = 'discovery' | 'movie' | 'person';
const GLOBAL_LOADING_MIN_VISIBLE_MS = 300;

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const lastHandledRouteRef = useRef<string>('');
  const {
    folders: watchlists,
    addFolder,
    saveToFolder,
    findItem,
    refresh,
    renameFolder,
    setFolderColor,
    moveItem,
    deleteItem,
    isCloud,
    isSyncing
  } = useCloudWatchlists();
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
    if (item.movie.tmdb_id) {
      const mediaType = item.movie.media_type === 'tv' || item.movie.type === 'show' ? 'tv' : 'movie';
      navigate(`/${mediaType}/${item.movie.tmdb_id}`);
    }
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
  }, [findItem, navigate, scrollMainContentToTop]);

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
    options: { manageLoading?: boolean; skipNavigate?: boolean } = {}
  ) => {
    const manageLoading = options.manageLoading !== false;
    const shouldNavigate = options.skipNavigate !== true;
    if (shouldNavigate) {
      navigate(`/person/${personId}`);
    }
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
  }, [navigate, scrollMainContentToTop]);

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
    navigate('/');
    startTransition(() => {
      setCurrentView('discovery');
      setMovieData(null);
      setPersonData(null);
      setSources(null);
      setCurrentQuery('');
      setShowWatchlistsModal(false);
    });
    scrollMainContentToTop();
  }, [navigate, scrollMainContentToTop]);

  const handleOpenTitle = useCallback(async (
    item: { id: number; mediaType: 'movie' | 'tv' },
    provider?: AIProvider,
    options: { skipNavigate?: boolean } = {}
  ) => {
    if (!options.skipNavigate) {
      navigate(`/${item.mediaType}/${item.id}`);
    }

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
  }, [navigate, scrollMainContentToTop, selectedProvider]);

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

  const handleSendMessage = useCallback(async (
    message: string,
    complexity: QueryComplexity,
    provider: AIProvider = 'groq',
    options: { skipNavigate?: boolean } = {}
  ) => {
    if (!options.skipNavigate) {
      navigate(`/search?q=${encodeURIComponent(message)}`);
    }

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
          if (!options.skipNavigate && result.movieData.tmdb_id) {
            const mediaType = result.movieData.tvShow ? 'tv' : 'movie';
            navigate(`/${mediaType}/${result.movieData.tmdb_id}`);
          }
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
  }, [navigate, openPersonById, scrollMainContentToTop]);

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

  const closeWatchlistsModal = useCallback(() => {
    setShowWatchlistsModal(false);
    if (location.pathname === '/watchlists') {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}`;
    if (lastHandledRouteRef.current === routeKey) {
      return;
    }
    lastHandledRouteRef.current = routeKey;

    const route = parseAppRoute(location.pathname, location.search);

    if (route.kind === 'home') {
      setShowWatchlistsModal(false);
      setCurrentView('discovery');
      return;
    }

    if (route.kind === 'watchlists') {
      setCurrentView('discovery');
      setShowWatchlistsModal(true);
      return;
    }

    if (route.kind === 'search' && route.query) {
      track('shared_link_opened', { query: route.query, type: 'search-route' });
      void handleSendMessage(route.query, QueryComplexity.SIMPLE, 'groq', { skipNavigate: true });
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
    handleSendMessage,
    selectedProvider
  ]);

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
            <AuthButton />
            <button
              onClick={() => navigate('/watchlists')}
              className="btn-glass flex items-center gap-2"
              aria-label="Open watch later"
            >
              <FolderIcon className="w-5 h-5" />
              <span className="hidden sm:inline">
                {isCloud ? (isSyncing ? 'Syncing...' : 'Cloud Lists') : 'Watchlists'}
              </span>
            </button>
            <Link to="/settings" className="btn-glass flex items-center gap-2" aria-label="Open settings">
              <EditIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
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
            <>
              <PersonalizedFeedPanel
                onRunQuery={(query) => {
                  void handleSendMessage(query, QueryComplexity.SIMPLE, selectedProvider);
                }}
              />
              <DiscoveryPage onOpenTitle={(item) => handleOpenTitle(item)} />
            </>
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
          onClick={closeWatchlistsModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 modal-mobile-slide max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-white">Your Watchlists</h3>
              <button onClick={closeWatchlistsModal} className="p-2.5 rounded-lg hover:bg-white/10 touch-target" aria-label="Close watchlists">
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

      <MigrationModal />

    </>
  );
};

export default App;
