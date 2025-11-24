import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import MovieDisplay from './components/MovieDisplay';
import ErrorBanner from './components/ErrorBanner';
import ProviderSelector, { AIProvider, ProviderStatus } from './components/ProviderSelector';
import { ChatMessage, MovieData, QueryComplexity, GroundingSource } from './types';
import { fetchMovieData, checkProviderAvailability, testProviderAvailability, fetchFullPlotDetails } from './services/aiService';
import { Logo } from './components/icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'system-1', role: 'system', content: 'Ready to explore! Ask about any movie or show.' }
  ]);
  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [sources, setSources] = useState<GroundingSource[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({
    groq: 'available',
    mistral: 'available',
    openrouter: 'available'
  });
  const [isMobileChatExpanded, setIsMobileChatExpanded] = useState<boolean>(false);

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
    
    const result = await fetchMovieData(message, complexity, selectedProvider, chatHistoryForAPI);
    
    setLoadingProgress('');
    updateProviderStatus(selectedProvider, !!result.movieData);

    if (result && result.movieData) {
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

  return (
    <div className="h-screen w-screen bg-brand-bg flex flex-col overflow-hidden">
      {/* Desktop & Mobile Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-3">
          <Logo className="w-8 h-8 md:w-10 md:h-10" />
          <h1 className="text-xl md:text-2xl font-bold text-brand-text-light">MovieMonk</h1>
        </div>
        {/* Desktop AI Provider Selector (hidden on mobile) */}
        <div className="hidden md:block">
          <ProviderSelector 
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            providerStatus={providerStatus}
          />
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
          />
        </div>

        {/* Movie Display (full width on mobile, right side on desktop) */}
        <div className="flex-1 min-h-0 md:w-2/3 lg:w-3/4 pb-20 md:pb-0">
          <MovieDisplay 
            movie={movieData} 
            isLoading={isLoading} 
            sources={sources}
            selectedProvider={selectedProvider}
            onFetchFullPlot={fetchFullPlotDetails}
            onQuickSearch={handleQuickSearch}
          />
        </div>

        {/* MOBILE: Bottom Chat Panel (ChatGPT-style) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300">
          {/* Drag Handle / Toggle */}
          <button
            onClick={() => setIsMobileChatExpanded(!isMobileChatExpanded)}
            className="w-full bg-brand-surface/90 backdrop-blur-sm border-t border-white/10 px-4 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="text-sm font-semibold text-brand-text-light">
                {isMobileChatExpanded ? 'Close Chat' : 'Open Chat'}
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-brand-text-dark transition-transform ${isMobileChatExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible Chat Content */}
          <div 
            className={`bg-brand-surface/95 backdrop-blur-md border-t border-white/10 transition-all duration-300 overflow-hidden ${
              isMobileChatExpanded ? 'max-h-[70vh]' : 'max-h-0'
            }`}
          >
            <div className="h-[70vh] flex flex-col">
              {/* Mobile Provider Selector (compact) */}
              <div className="flex-shrink-0 p-3 border-b border-white/10">
                <ProviderSelector 
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                  providerStatus={providerStatus}
                />
              </div>
              
              {/* Chat Interface */}
              <div className="flex-1 min-h-0">
                <ChatInterface 
                  onSendMessage={handleSendMessage} 
                  messages={messages} 
                  isLoading={isLoading} 
                  loadingProgress={loadingProgress}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
