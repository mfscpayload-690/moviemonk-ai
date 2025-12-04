import React, { useState, useEffect } from 'react';
import MovieDisplay from './components/MovieDisplay';
import PersonDisplay from './components/PersonDisplay';
import ErrorBanner from './components/ErrorBanner';
import DynamicSearchIsland from './components/DynamicSearchIsland';
import AmbiguousModal from './components/AmbiguousModal';
import { ChatMessage, MovieData, QueryComplexity, GroundingSource } from './types';
import { fetchMovieData, fetchFullPlotDetails } from './services/aiService';
import { Logo } from './components/icons';
import { track } from '@vercel/analytics/react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'system-1', role: 'system', content: 'Ready to explore! Ask about any movie or show.' }
  ]);
  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [personData, setPersonData] = useState<any | null>(null);
  const [ambiguous, setAmbiguous] = useState<{ id: number; name: string; type: 'movie' | 'person'; score: number }[] | null>(null);
  const [sources, setSources] = useState<GroundingSource[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [summaryModal, setSummaryModal] = useState<{ title: string; short?: string; long?: string } | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');

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

  const handleSendMessage = async (message: string, complexity: QueryComplexity, provider: 'groq' | 'mistral') => {
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
          searchData.results.map((r: any, i: number) => ({
            id: i,
            name: r.title,
            type: r.type,
            score: r.confidence,
            url: r.url,
            snippet: r.snippet,
            image: r.image
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
      const selectedModel = modelData.selectedModel || provider;

      console.log(`🧠 Selected model: ${selectedModel} (${modelData.reason})`);

      // Parse result with AI
      setLoadingProgress('⚙️ Processing with AI...');
      const parseRes = await fetch('/api/ai?action=parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: selectedResult.url,
          title: selectedResult.title,
          snippet: selectedResult.snippet,
          type: selectedResult.type,
          selectedModel
        })
      });

      const parseData = await parseRes.json();
      setLoadingProgress('');

      if (!parseData.ok) {
        throw new Error(parseData.error || 'Parsing failed');
      }

      // Display result based on type
      if (selectedResult.type === 'person') {
        setPersonData({
          name: parseData.title,
          biography: parseData.summary.long,
          sources: [{ title: selectedResult.title, url: selectedResult.url }]
        });
        setMovieData(null);
      } else {
        setMovieData({
          title: parseData.title,
          summary_short: parseData.summary.short,
          summary_long: parseData.summary.long,
          sources: [{ title: selectedResult.title, url: selectedResult.url }]
        } as any);
        setPersonData(null);
      }

      setSources([{ title: selectedResult.title, url: selectedResult.url }]);

      const modelResponse: ChatMessage = { 
        id: Date.now().toString() + '-model', 
        role: 'model', 
        content: `✅ Found "${parseData.title}" (${selectedResult.type}). ${parseData.summary.short}` 
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
        `/api/ai?action=selectModel&type=${selectedAmbiguous.type}&title=${encodeURIComponent(selectedAmbiguous.name)}`
      );
      const modelData = await modelRes.json();
      const selectedModel = modelData.selectedModel || 'groq';

      console.log(`🧠 Selected model: ${selectedModel} (${modelData.reason})`);

      // Parse result with AI
      setLoadingProgress('⚙️ Processing with AI...');
      const parseRes = await fetch('/api/ai?action=parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: selectedAmbiguous.url,
          title: selectedAmbiguous.name,
          snippet: selectedAmbiguous.snippet,
          type: selectedAmbiguous.type,
          selectedModel
        })
      });

      const parseData = await parseRes.json();
      setLoadingProgress('');

      if (!parseData.ok) {
        throw new Error(parseData.error || 'Parsing failed');
      }

      // Display result based on type
      if (selectedAmbiguous.type === 'person') {
        setPersonData({
          name: parseData.title,
          biography: parseData.summary.long,
          sources: [{ title: selectedAmbiguous.name, url: selectedAmbiguous.url }]
        });
        setMovieData(null);
      } else {
        setMovieData({
          title: parseData.title,
          summary_short: parseData.summary.short,
          summary_long: parseData.summary.long,
          sources: [{ title: selectedAmbiguous.name, url: selectedAmbiguous.url }]
        } as any);
        setPersonData(null);
      }

      setSources([{ title: selectedAmbiguous.name, url: selectedAmbiguous.url }]);

      const modelResponse: ChatMessage = { 
        id: Date.now().toString() + '-model', 
        role: 'model', 
        content: `✅ Selected "${parseData.title}" (${selectedAmbiguous.type}). ${parseData.summary.short}` 
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
    <div className="h-screen w-screen bg-brand-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 md:px-6 py-2.5 md:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-3">
          <Logo className="w-8 h-8 md:w-10 md:h-10" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-brand-text-light">MovieMonk</h1>
        </div>
        {(movieData || personData) && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-semibold text-sm transition-colors border border-brand-primary/30 hover:border-brand-primary/50"
            aria-label="Share this result"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </header>

      {/* Copy Toast Notification */}
      {showCopyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] animate-fade-in">
          <div className="bg-brand-primary text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-brand-primary/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Link copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-3 md:px-6 py-2">
          <ErrorBanner message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Main Content Area - Full width Featured UI */}
      <div className="flex-1 min-h-0 overflow-hidden">
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
            selectedProvider="groq"
            onFetchFullPlot={fetchFullPlotDetails}
            onQuickSearch={handleQuickSearch}
          />
        )}
      </div>

      {/* Dynamic Search Island - Floating */}
      <DynamicSearchIsland 
        onSearch={handleSendMessage}
        isLoading={isLoading}
      />
    </div>

    {/* Ambiguous Selector Modal */}
    {ambiguous && (
      <AmbiguousModal
        candidates={ambiguous}
        onSelect={async (c) => {
          setAmbiguous(null);
          if (c.type === 'person') {
            setIsLoading(true);
            const data = await fetch(`/api/person/${c.id}`).then(r => r.json());
            setPersonData(data);
            setMovieData(null);
            setSources(data?.sources || null);
            setIsLoading(false);
          } else {
            handleSendMessage(c.name, QueryComplexity.SIMPLE, 'groq');
          }
        }}
        onClose={() => setAmbiguous(null)}
      />
    )}

    {/* Summary Modal */}
    {summaryModal && (
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
    )}
    </>
  );
};

export default App;
