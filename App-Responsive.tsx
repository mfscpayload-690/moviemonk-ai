import React, { useCallback, useEffect, useRef, useState, startTransition } from 'react';
import MovieDisplay from './components/MovieDisplay';
import PersonDisplay from './components/PersonDisplay';
import DiscoveryPage from './components/DiscoveryPage';
import ErrorBanner from './components/ErrorBanner';
import AmbiguousModal, { Candidate as AmbiguousCandidate } from './components/AmbiguousModal';
import DynamicSearchIsland from './components/DynamicSearchIsland';
import HeaderUtilityMenu from './components/HeaderUtilityMenu';
import LoadingScreen from './components/LoadingScreen';
import { AuthButton } from './components/AuthButton';
import { MigrationModal } from './components/MigrationModal';
import { MovieData, QueryComplexity, GroundingSource, AIProvider, SuggestionItem } from './types';
import { fetchMovieData, fetchFullPlotDetails } from './services/aiService';
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

const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

type AppView = 'discovery' | 'movie' | 'person';
const GLOBAL_LOADING_MIN_VISIBLE_MS = 300;

type QuickSaveTitle = {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year?: string;
  poster_url?: string | null;
};

const buildQuickMovieData = (item: QuickSaveTitle): MovieData => ({
  tmdb_id: String(item.id),
  title: item.title,
  year: item.year || '',
  type: item.media_type === 'tv' ? 'show' : 'movie',
  media_type: item.media_type,
  genres: [],
  poster_url: item.poster_url || '',
  backdrop_url: '',
  trailer_url: '',
  ratings: [],
  cast: [],
  crew: { director: '', writer: '', music: '' },
  summary_short: '',
  summary_medium: '',
  summary_long_spoilers: '',
  suspense_breaker: '',
  where_to_watch: [],
  extra_images: [],
  ai_notes: ''
});

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
    isCloud,
    isSyncing
  } = useCloudWatchlists();
  const { isWatched, toggle: toggleWatched, watchedCount } = useWatched();

  const resolveQuickSaveFolderId = useCallback(() => {
    if (watchlists.length === 0) return null;
    const preferredFolder = watchlists.find((folder) => /watchlist|saved|favorites?/i.test(folder.name));
    return preferredFolder?.id || watchlists[0]?.id || null;
  }, [watchlists]);

  const handleQuickSaveToWatchlist = useCallback((item: QuickSaveTitle) => {
    let folderId = resolveQuickSaveFolderId();
    if (!folderId) {
      folderId = addFolder('Watchlist', '#7c3aed');
    }
    if (!folderId) return;
    saveToFolder(folderId, buildQuickMovieData(item), item.title);
  }, [addFolder, resolveQuickSaveFolderId, saveToFolder]);

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
            <HeaderUtilityMenu
              user={user}
              isCloud={isCloud}
              isSyncing={isSyncing}
              canShare={Boolean(movieData || personData || currentQuery)}
              onOpenWatchlists={handleOpenWatchlists}
              onOpenSettings={handleOpenSettings}
              onShare={handleShare}
            />
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
        <div className="main-content pb-4 sm:pb-6">
          {currentView === 'discovery' ? (
            <>
              <DiscoveryPage
                onOpenTitle={(item) => handleOpenTitle(item)}
                isWatched={(id, mediaType) => isWatched(String(id), mediaType)}
                onToggleWatched={(item) => toggleWatched({
                  tmdb_id: String(item.id),
                  media_type: item.media_type,
                  title: item.title,
                  poster_url: item.poster_url ?? null,
                  year: item.year ?? null,
                })}
                onQuickSaveToWatchlist={handleQuickSaveToWatchlist}
              />
            </>
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
              watchlists={watchlists}
              onCreateWatchlist={addFolder}
              onSaveToWatchlist={saveToFolder}
              isWatched={movieData ? isWatched(
                String(movieData.tmdb_id || ''),
                movieData.tvShow ? 'tv' : 'movie'
              ) : false}
              onToggleWatched={() => {
                if (!movieData) return;
                toggleWatched({
                  tmdb_id: String(movieData.tmdb_id || ''),
                  media_type: movieData.tvShow ? 'tv' : 'movie',
                  title: movieData.title,
                  poster_url: movieData.poster_url,
                  year: movieData.year,
                });
              }}
              onToggleRelatedWatched={(entry) => {
                toggleWatched({
                  tmdb_id: entry.tmdb_id,
                  media_type: entry.media_type,
                  title: entry.title,
                  poster_url: entry.poster_url ?? null,
                  year: entry.year ?? null,
                });
              }}
              isRelatedWatched={(tmdbId, mediaType) => isWatched(tmdbId, mediaType)}
            />
          )}

          {/* Global Footer */}
          <footer className="w-full py-6 mt-12 text-center border-t border-white/10 text-brand-text-light/60 text-sm flex flex-col items-center gap-2 px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <span>MovieMonk v2.8.0 · MIT License</span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/20"></span>
              <a 
                href="https://github.com/mfscpayload-690/moviemonk-ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors py-1 group"
                aria-label="GitHub Repository"
              >
                <GithubIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
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

      <MigrationModal />

    </>
  );
};

export default App;
