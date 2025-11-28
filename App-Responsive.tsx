import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import MovieDisplay from './components/MovieDisplay';
import PersonDisplay from './components/PersonDisplay';
import ErrorBanner from './components/ErrorBanner';
import ProviderSelector, { AIProvider, ProviderStatus } from './components/ProviderSelector';
import AmbiguousModal from './components/AmbiguousModal';
import { ChatMessage, MovieData, QueryComplexity, GroundingSource } from './types';
import { fetchMovieData, checkProviderAvailability, testProviderAvailability, fetchFullPlotDetails } from './services/aiService';
import { Logo } from './components/icons';

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
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({
    groq: 'available',
    mistral: 'available',
    perplexity: 'available',
    openrouter: 'available'
  });
  const [isMobileChatExpanded, setIsMobileChatExpanded] = useState<boolean>(false);
  const [summaryModal, setSummaryModal] = useState<{ title: string; short?: string; long?: string } | null>(null);

  const classifyError = (raw: string | undefined, provider: AIProvider): string => {
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

  const handleSendMessage = async (message: string, complexity: QueryComplexity) => {
    setIsLoading(true);
    setLoadingProgress('Checking cache...');
    setError(null);
    setIsMobileChatExpanded(false); // Collapse mobile chat after sending
    
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    const chatHistoryForAPI = messages.filter(m => m.role !== 'system');
    
    setTimeout(() => setLoadingProgress('Contacting AI...'), 500);
    setTimeout(() => setLoadingProgress('Generating response...'), 2000);
    setTimeout(() => setLoadingProgress('Enriching data...'), 5000);
    
    // First: resolve entity (movie/person/ambiguous)
    try {
      const resolved = await fetch(`/api/resolveEntity?q=${encodeURIComponent(message)}`).then(r => r.json());
      if (resolved?.type === 'person' && resolved?.chosen?.id) {
        setLoadingProgress('Fetching person details...');
        const data = await fetch(`/api/person/${resolved.chosen.id}`).then(r => r.json());
        setPersonData(data);
        setMovieData(null);
        setSources(data?.sources || null);
        setIsLoading(false);
        return;
      }
      if (resolved?.type === 'ambiguous') {
        setAmbiguous(resolved.candidates || []);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('resolveEntity failed, continuing with movie flow');
    }

    const result = await fetchMovieData(message, complexity, selectedProvider, chatHistoryForAPI);
    
    setLoadingProgress('');
    updateProviderStatus(selectedProvider, !!result.movieData);

    if (result && result.movieData) {
      setPersonData(null);
      setMovieData(result.movieData);
      setSources(result.sources);
      const modelResponse: ChatMessage = { 
          id: Date.now().toString() + '-model', 
          role: 'model', 
          content: `Here is the information for "${result.movieData.title}". ${result.movieData.summary_short}` 
      };
      setMessages(prev => [...prev, modelResponse]);
    } else {
      const classified = classifyError(result?.error, selectedProvider);
      const errorMessage: ChatMessage = {
          id: Date.now().toString() + '-error',
          role: 'system',
          content: classified
      };
      setError(classified);
      setMessages(prev => [...prev, errorMessage]);
      setSources(null);
    }

    setIsLoading(false);
  };

  const updateProviderStatus = (provider: AIProvider, success: boolean) => {
    setProviderStatus(prev => ({
      ...prev,
      [provider]: success ? 'available' : 'unavailable'
    }));
  };

  const handleQuickSearch = (title: string) => {
    handleSendMessage(title, QueryComplexity.SIMPLE);
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

  return (
    <>
    <div className="h-screen w-screen bg-brand-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 md:px-6 py-2.5 md:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-3">
          <Logo className="w-8 h-8 md:w-10 md:h-10" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-brand-text-light">MovieMonk</h1>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-3 md:px-6 py-2">
          <ErrorBanner message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* DESKTOP: Left Sidebar (Chat + Provider) */}
        <div className="hidden md:flex md:w-1/3 lg:w-1/4 flex-col gap-3 p-4 border-r border-white/10 min-h-0">
          <ChatInterface 
            onSendMessage={handleSendMessage} 
            messages={messages} 
            isLoading={isLoading} 
            loadingProgress={loadingProgress}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            providerStatus={providerStatus}
          />
        </div>

        {/* Movie Display (full width on mobile, right side on desktop) */}
        <div className="flex-1 min-h-0 md:w-2/3 lg:w-3/4 pb-20 md:pb-0">
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
            />
          )}
        </div>

        {/* MOBILE: Floating AI Button */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
           {!isMobileChatExpanded && (
             <button
               onClick={() => setIsMobileChatExpanded(true)}
               className="w-14 h-14 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/40 flex items-center justify-center animate-bounce hover:scale-110 transition-transform border border-white/20"
               aria-label="Open AI Chat"
             >
               <Logo className="w-8 h-8 text-white" />
             </button>
           )}
        </div>

        {/* MOBILE: Expanded Chat Overlay */}
        {isMobileChatExpanded && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-end justify-center sm:items-center">
             {/* Click backdrop to close */}
             <div className="absolute inset-0" onClick={() => setIsMobileChatExpanded(false)} />
             
             <div className="relative w-full h-[85vh] bg-brand-surface border-t border-white/10 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                {/* Header with Close Button */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-brand-surface/50 backdrop-blur-md">
                   <div className="flex items-center gap-2">
                      <Logo className="w-6 h-6" />
                      <span className="font-semibold text-brand-text-light">MovieMonk AI</span>
                   </div>
                   <button 
                     onClick={() => setIsMobileChatExpanded(false)}
                     className="p-2 rounded-full hover:bg-white/10 text-brand-text-dark hover:text-white transition"
                   >
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                </div>
                
                {/* Chat Interface Container */}
                <div className="flex-1 overflow-hidden p-2 bg-brand-bg/50">
                   <ChatInterface
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                      loadingProgress={loadingProgress}
                      selectedProvider={selectedProvider}
                      onProviderChange={setSelectedProvider}
                      providerStatus={providerStatus}
                   />
                </div>
             </div>
          </div>
        )}
      </div>
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
            handleSendMessage(c.name, QueryComplexity.SIMPLE);
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
