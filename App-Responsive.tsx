import React, { useState, useEffect } from 'react';
import MovieDisplay from './components/MovieDisplay';
import PersonDisplay from './components/PersonDisplay';
import ErrorBanner from './components/ErrorBanner';
import DynamicSearchIsland from './components/DynamicSearchIsland';
import AmbiguousModal from './components/AmbiguousModal';
import { ChatMessage, MovieData, QueryComplexity, GroundingSource, AIProvider } from './types';
import { fetchMovieData, fetchFullPlotDetails } from './services/aiService';
import { Logo } from './components/icons';
import { track } from '@vercel/analytics/react';
import { useWatchlists } from './hooks/useWatchlists';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'system-1', role: 'system', content: 'Ready to explore! Ask about any movie or show.' }
  ]);
  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [personData, setPersonData] = useState<any | null>(null);
  const [ambiguous, setAmbiguous] = useState<{ id: number; name: string; type: 'movie' | 'person'; score: number }[] | null>(null);
  const [sources, setSources] = useState<GroundingSource[] | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [summaryModal, setSummaryModal] = useState<{ title: string; short?: string; long?: string } | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const { folders: watchlists, addFolder, saveToFolder, findItem } = useWatchlists();
  const [showWatchlistsModal, setShowWatchlistsModal] = useState(false);

  const handleLoadSavedItem = (folderId: string, itemId: string) => {
    const found = findItem(folderId, itemId);
    if (!found) return;
    const { item } = found;
    setMovieData(item.movie);
    setPersonData(null);
    setSources(item.movie.tmdb_id ? [{ web: { uri: `https://www.themoviedb.org/${item.movie.media_type || 'movie'}/${item.movie.tmdb_id}`, title: 'The Movie Database (TMDB)' } }] : null);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `📁 Loaded ${item.saved_title} from Watch Later.` }]);
    setShowWatchlistsModal(false);
    const main = document.querySelector('.main-content');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const loadPersonFromShare = async (personId: number) => {
    try {
      setIsLoading(true);
      const data = await fetch(`/api/person/${personId}`).then(r => r.json());
      setPersonData(data);
      setMovieData(null);
      setSources(data?.sources || null);
    } catch (e) {
      setError('Failed to load shared person data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    let shareUrl = window.location.origin;

    if (movieData) {
      shareUrl += `?q=${encodeURIComponent(movieData.title)}&type=movie&year=${movieData.year}`;
    } else if (personData) {
      shareUrl += `?q=${encodeURIComponent(personData.name)}&type=person&id=${personData.id}`;
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
        title: movieData?.title || personData?.name || currentQuery
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
  };

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

  const handleSendMessage = async (message: string, complexity: QueryComplexity, provider: AIProvider = 'groq') => {
    setIsLoading(true);
    setLoadingProgress('🔍 Searching...');
    setError(null);
    setCurrentQuery(message);

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      // STEP 1: Search using TMDB (primary) and Perplexity (fallback)
      console.log('📡 Fetching search results from TMDB/Perplexity...');
      const searchRes = await fetch(`/api/ai?action=search&q=${encodeURIComponent(message)}`);
      const searchData = await searchRes.json();

      if (!searchData.ok || searchData.total === 0) {
        throw new Error('No search results found');
      }

      setLoadingProgress(`Found ${searchData.total} results...`);

      // STEP 2: If multiple results, show disambiguation modal
      if (searchData.results.length > 1) {
        console.log('📋 Multiple results found, showing disambiguation modal');
        setAmbiguous(
          searchData.results.map((r: any) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            score: r.confidence,
            url: r.url,
            snippet: r.snippet,
            image: r.image,
            year: r.year,
            media_type: r.media_type
          }))
        );
        setIsLoading(false);
        return;
      }

      // STEP 3: If single result, proceed to model selection and parsing
      const selectedResult = searchData.results[0];
      console.log('✅ Single clear match found:', selectedResult.title);

      // Select best model for this query type
      setLoadingProgress('🤖 Selecting best AI model...');
      const modelRes = await fetch(
        `/api/ai?action=selectModel&type=${selectedResult.type}&title=${encodeURIComponent(selectedResult.title)}`
      );
      const modelData = await modelRes.json();
      const selectedModel: AIProvider = (modelData.selectedModel as AIProvider) || provider;
      setSelectedProvider(selectedModel);

      console.log(`🧠 Selected model: ${selectedModel} (${modelData.reason})`);

      // Use the new Details endpoint for movies/results too, to ensure consistent high-quality data
      setLoadingProgress('🔍 Fetching full details...');

      const detailsRes = await fetch(`/api/ai?action=details&id=${selectedResult.id}&media_type=${selectedResult.media_type || 'movie'}&provider=${selectedModel}`);
      const detailsData = await detailsRes.json();

      // Set data sources for attribution
      setSources([
        { 
          web: {
            uri: `https://www.themoviedb.org/${selectedResult.media_type || 'movie'}/${selectedResult.id}`,
            title: 'The Movie Database (TMDB)'
          }
        },
        {
          web: {
            uri: 'https://www.omdb.org/',
            title: 'Open Movie Database (OMDb)'
          }
        }
      ]);

      // Check type and handle accordingly

      // For person, we might need to handle slightly effectively if details API returns person struct
      // But actually, api/ai.ts details endpoint handles movies well. 
      // If type is person, we should ideally call api/person or ensure details handles person?
      // Review api/ai.ts: It handles 'movie' or 'tv'. 
      // If type is person, we need to be careful.
      // Currently details logic in api/ai.ts (generic) handles 'movie' or 'tv'.
      // Wait, for person, we might still rely on the old logic or need a person-specific detail fetch.
      // Let's check api/ai.ts 'details' action capability. 
      // ... It calls https://api.themoviedb.org/3/${mediaType}/${id}
      // If mediaType is 'person', TMDB supports /person/{id}.
      // So it SHOULD work if we pass media_type='person'.
      // Let's verify if api/ai.ts handles person response structure (biography etc).
      // Checking api/ai.ts... structure maps to 'movieData' (title, year, cast, etc). 
      // Person structure is different (birthday, biography).
      // So for PERSON, we should stick to the existing/working Person logic or separate it.

      // Current app logic for Person (Step 237/213) uses: /api/person/${c.id} OR custom logic.
      // Let's look at what handleSelectResult does? 
      // It calls /api/ai?action=details... 
      // Wait. handleSelectResult calls details... Does it handle Person?
      // In Step 311, handleSelectResult calls setMovieData(detailsData).
      // If it's a PERSON, setMovieData might be wrong?
      // Let's look at handleSelectResult again.
      // It sets setMovieData(detailsData). It sets setPersonData(null).
      // So handleSelectResult assumes it's a MOVIE/SHOW.
      // What if user selects a PERSON from ambiguous modal?
      // Ambiguous modal has types.
      // The user reported "Search for Chris Hemsworth resulted in Ambiguous Search Results".
      // Selecting it loaded "Young Sheldon" data? No.
      // Selecting Chris Hemsworth -> 'handleSelectResult'.
      // It calls 'details'. 
      // If media_type is person, TMDB returns Person object.
      // 'movieData' mapping in api/ai.ts tries to map 'overview' to summary etc.
      // Person object has 'biography'. 'overview' is undefined.
      // So 'details' endpoint returns a partial/broken object for Person.
      // And frontend sets it to 'MovieData'.
      // This effectively breaks Person display if we use 'details' endpoint blindly.

      // CORRECT LOGIC:
      // If type is 'person', use the Person Fetch logic (which exists elsewhere? or needs to be here).


      if (selectedResult.type === 'person') {
        // Use specific person endpoint or logic
        const personRes = await fetch(`/api/person/${selectedResult.id}`);
        if (personRes.ok) {
          const personData = await personRes.json();
          setPersonData(personData);
          setMovieData(null);
          setSources(personData.sources);
        } else {
          // Fallback or error
          throw new Error('Failed to load person details');
        }
      } else {
        // It's a movie or show
        if (detailsRes.ok && detailsData.title) {
          setMovieData(detailsData);
          setPersonData(null);
          setSources([{ title: 'TMDB', url: `https://www.themoviedb.org/${selectedResult.media_type || 'movie'}/${selectedResult.id}` }]);
        } else {
          throw new Error(detailsData.error || 'Failed to load details');
        }
      }



      const modelResponse: ChatMessage = {
        id: Date.now().toString() + '-model',
        role: 'model',
        content: `✅ Loaded ${selectedResult.title}.`
      };
      setMessages(prev => [...prev, modelResponse]);
    } catch (err: any) {
      setLoadingProgress('');
      const errorMsg = err.message || 'Search and parse failed';
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: `❌ Error: ${errorMsg}. Try rephrasing your query.`
      };
      setError(errorMsg);
      setMessages(prev => [...prev, errorMessage]);
      setSources(null);
    }

    setIsLoading(false);
  };

  const handleQuickSearch = (title: string) => {
    // Default to groq and simple for quick searches
    handleSendMessage(title, QueryComplexity.SIMPLE, 'groq');
  };

  const handleBriefMe = async (name: string) => {
    try {
      setIsLoading(true);
      setLoadingProgress('Summarizing…');
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: name, mode: 'detailed' })
      });
      const json = await res.json();
      if (json?.ok) {
        setSummaryModal({ title: name, short: json?.summary?.summary_short, long: json?.summary?.summary_long });
      } else {
        setError(json?.error || 'Failed to summarize');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to summarize');
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // Handle selection from disambiguation modal
  const handleSelectResult = async (selectedAmbiguous: any) => {
    setAmbiguous(null);
    setIsLoading(true);
    setLoadingProgress('🤖 Selecting best AI model...');
    setError(null);

    try {
      // Select best model for this query type
      const modelRes = await fetch(
        `/api/ai?action=selectModel&type=${selectedAmbiguous.type}&title=${encodeURIComponent(selectedAmbiguous.title)}`
      );
      const modelData = await modelRes.json();
      const selectedModel = modelData.selectedModel || 'groq';

      console.log(`🧠 Selected model: ${selectedModel} (${modelData.reason})`);
      setSelectedProvider(selectedModel as AIProvider);

      setLoadingProgress('🔍 Fetching full details...');

      if (selectedAmbiguous.type === 'person') {
        const personRes = await fetch(`/api/person/${selectedAmbiguous.id}`);
        if (personRes.ok) {
          const personData = await personRes.json();
          setPersonData(personData);
          setMovieData(null);
          setSources(personData.sources);
        } else {
          throw new Error('Failed to load person details');
        }
      } else {
        // Use the new Details endpoint which gets Credits, Videos, etc.
        const detailsRes = await fetch(`/api/ai?action=details&id=${selectedAmbiguous.id}&media_type=${selectedAmbiguous.media_type || 'movie'}&provider=${selectedModel}`);
        const detailsData = await detailsRes.json();

        if (detailsRes.ok && detailsData.title) {
          setMovieData(detailsData);
          setPersonData(null);
          setSources([
            { 
              web: {
                uri: `https://www.themoviedb.org/${selectedAmbiguous.media_type || 'movie'}/${selectedAmbiguous.id}`,
                title: 'The Movie Database (TMDB)'
              }
            },
            {
              web: {
                uri: 'https://www.omdb.org/',
                title: 'Open Movie Database (OMDb)'
              }
            }
          ]);
        } else {
          console.error('Details fetch failed:', detailsData);
          throw new Error(detailsData.error || 'Failed to load details');
        }
      }

      const modelResponse: ChatMessage = {
        id: Date.now().toString() + '-model',
        role: 'model',
        content: `✅ Loaded ${selectedAmbiguous.title}.`
      };
      setMessages(prev => [...prev, modelResponse]);
    } catch (err: any) {
      setLoadingProgress('');
      const errorMsg = err.message || 'Processing failed';
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: `❌ Error: ${errorMsg}. Try another result.`
      };
      setError(errorMsg);
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className="app-container">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 glass-panel border-b-0 z-50">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 text-primary drop-shadow-glow" />
            <h1 className="text-2xl font-bold text-gradient tracking-tight">MovieMonk</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWatchlistsModal(true)}
              className="btn-glass flex items-center gap-2"
              aria-label="Open watch later"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm0 2c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0 6c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z" />
              </svg>
              <span className="hidden sm:inline">Watchlists</span>
            </button>
            {(movieData || personData) && (
              <button
                onClick={handleShare}
                className="btn-glass flex items-center gap-2"
                aria-label="Share this result"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
        <div className="main-content">
          {personData ? (
            <PersonDisplay
              data={personData}
              isLoading={isLoading}
              onQuickSearch={handleQuickSearch}
              onBriefMe={handleBriefMe}
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

        {/* Dynamic Search Island - Floating */}
        <DynamicSearchIsland
          onSearch={handleSendMessage}
          isLoading={isLoading}
        />
      </div >


      {/* Ambiguous Selector Modal */}
      {
        ambiguous && (
          <AmbiguousModal
            candidates={ambiguous}
            onSelect={handleSelectResult}
            onClose={() => setAmbiguous(null)}
          />
        )
      }

      {/* Summary Modal */}
      {
        summaryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-brand-surface border border-white/10 rounded-xl shadow-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Brief: {summaryModal.title}</h3>
                <button onClick={() => setSummaryModal(null)} className="p-2 rounded hover:bg-white/10">✕</button>
              </div>
              {summaryModal.short && (
                <div className="mb-3 text-sm text-brand-text-light">{summaryModal.short}</div>
              )}
              {summaryModal.long && (
                <div className="text-sm whitespace-pre-wrap text-brand-text-light">{summaryModal.long}</div>
              )}
            </div>
          </div>
        )
      }

      {/* Watchlists Modal */}
      {showWatchlistsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-brand-surface border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Your Watchlists</h3>
              <button onClick={() => setShowWatchlistsModal(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close watchlists">
                ✕
              </button>
            </div>

            {watchlists.length === 0 && (
              <p className="text-brand-text-dark text-sm">No watchlists yet. Save a title with "Save to List" to get started.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {watchlists.map(folder => (
                <div key={folder.id} className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }}></span>
                    <p className="text-white font-semibold text-sm">{folder.name}</p>
                    <span className="text-xs text-brand-text-dark ml-auto">{folder.items.length} saved</span>
                  </div>
                  {folder.items.length === 0 ? (
                    <p className="text-xs text-brand-text-dark">Empty folder.</p>
                  ) : (
                    <div className="space-y-2">
                      {folder.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleLoadSavedItem(folder.id, item.id)}
                          className="w-full flex items-start gap-3 p-2 rounded-lg border border-white/10 hover:border-brand-primary/50 hover:bg-white/5 text-left"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{item.saved_title}</span>
                            <span className="text-xs text-brand-text-dark">{item.movie.year} • {item.movie.genres?.slice(0,3).join(', ')}</span>
                          </div>
                          <span className="text-[10px] text-brand-text-dark ml-auto">Added {new Date(item.added_at).toLocaleDateString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
