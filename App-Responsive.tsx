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
  const { folders: watchlists, addFolder, saveToFolder, findItem, refresh, renameFolder, setFolderColor, moveItem, deleteItem } = useWatchlists();
  const [showWatchlistsModal, setShowWatchlistsModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('#7c3aed');
  const [draggedItem, setDraggedItem] = useState<{ folderId: string; itemId: string } | null>(null);

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

  useEffect(() => {
    if (showWatchlistsModal) {
      refresh();
    }
  }, [showWatchlistsModal, refresh]);

  const COLOR_PRESETS = ['#7c3aed', '#db2777', '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7'];

  const startEditFolder = (folder: any) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color || '#7c3aed');
  };

  const saveFolderEdits = () => {
    if (!editingFolderId) return;
    renameFolder(editingFolderId, editFolderName);
    setFolderColor(editingFolderId, editFolderColor);
    setEditingFolderId(null);
  };

  const handleDragStart = (e: React.DragEvent, folderId: string, itemId: string) => {
    setDraggedItem({ folderId, itemId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.folderId === targetFolderId) {
      setDraggedItem(null);
      return;
    }
    moveItem(draggedItem.folderId, draggedItem.itemId, targetFolderId);
    setDraggedItem(null);
  };

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

      // STEP 3: If single result, proceed to fetch data using hybrid service
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

      // Check if it's a person query - use dedicated endpoint
      if (selectedResult.type === 'person') {
        setLoadingProgress('🔍 Fetching person details...');
        const personRes = await fetch(`/api/person/${selectedResult.id}`);
        if (personRes.ok) {
          const personData = await personRes.json();
          setPersonData(personData);
          setMovieData(null);
          setSources(personData.sources);
        } else {
          throw new Error('Failed to load person details');
        }
      } else {
        // Use NEW hybrid service for movies/TV shows (supports TVMaze!)
        setLoadingProgress('🔍 Fetching details from best source...');

        const result = await fetchMovieData(
          message, // Original query
          complexity,
          selectedModel
        );

        if (result.movieData) {
          setMovieData(result.movieData);
          setPersonData(null);
          setSources(result.sources || []);
        } else {
          throw new Error(result.error || 'Failed to load data');
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
        // Use NEW hybrid service for movies/TV shows (supports TVMaze!)
        setLoadingProgress('🔍 Fetching details from best source...');

        const result = await fetchMovieData(
          selectedAmbiguous.title, // Use the selected title as query
          QueryComplexity.SIMPLE,
          selectedModel as AIProvider
        );

        if (result.movieData) {
          setMovieData(result.movieData);
          setPersonData(null);
          setSources(result.sources || []);
        } else {
          throw new Error(result.error || 'Failed to load details');
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
        <div className="main-content pb-36">
          {personData ? (
            <div className="page-transition">
              <PersonDisplay
                data={personData}
                isLoading={isLoading}
                onQuickSearch={handleQuickSearch}
                onBriefMe={handleBriefMe}
              />
            </div>
          ) : (
            <div className="page-transition">
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
            </div>
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
          <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-2xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-5 modal-mobile-slide">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Brief: {summaryModal.title}</h3>
                <button onClick={() => setSummaryModal(null)} className="p-2.5 rounded-lg hover:bg-white/10 touch-target" aria-label="Close">✕</button>
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
          className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
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
                ✕
              </button>
            </div>

            {watchlists.length === 0 && (
              <p className="text-brand-text-dark text-sm">No watchlists yet. Save a title with "Save to List" to get started.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1 overscroll-contain">
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
                    <button onClick={() => startEditFolder(folder)} className="ml-2 text-xs text-brand-text-dark hover:text-white p-1 rounded hover:bg-white/10">✎ Edit</button>
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
                        {COLOR_PRESETS.map(color => (
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
                        <button onClick={() => setEditingFolderId(null)} className="px-3 py-1.5 rounded-lg border border-white/15 text-white text-xs hover:bg-white/10">Cancel</button>
                        <button onClick={saveFolderEdits} className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-secondary">Save</button>
                      </div>
                    </div>
                  )}

                  {folder.items.length === 0 ? (
                    <p className="text-xs text-brand-text-dark">Empty folder. Drag items here.</p>
                  ) : (
                    <div className="space-y-2">
                      {folder.items.map(item => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, folder.id, item.id)}
                          className={`w-full flex items-start justify-between gap-2 p-2 rounded-lg border cursor-move transition-all ${draggedItem?.itemId === item.id
                            ? 'opacity-50 border-brand-primary bg-brand-primary/10'
                            : 'border-white/10 hover:border-brand-primary/50 hover:bg-white/5'
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
                            className="ml-2 text-xs text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-500/10"
                            aria-label="Delete item"
                            title="Delete from watchlist"
                          >
                            🗑️
                          </button>
                        </div>
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
