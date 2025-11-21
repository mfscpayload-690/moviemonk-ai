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
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    const chatHistoryForAPI = messages.filter(m => m.role !== 'system');
    
    // Update progress indicators
    setTimeout(() => setLoadingProgress('Contacting AI...'), 500);
    setTimeout(() => setLoadingProgress('Generating response...'), 2000);
    setTimeout(() => setLoadingProgress('Enriching data...'), 5000);
    
    const result = await fetchMovieData(message, complexity, selectedProvider, chatHistoryForAPI);
    
    setLoadingProgress('');
    // Update provider status based on result
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
      const content = classified;
      const errorMessage: ChatMessage = {
          id: Date.now().toString() + '-error',
          role: 'system',
          content: content
      };
      setError(content);
      setMessages(prev => [...prev, errorMessage]);
      setSources(null);
    }

    setIsLoading(false);
  };

  // Update provider status based on actual request results
  const updateProviderStatus = (provider: AIProvider, success: boolean) => {
    setProviderStatus(prev => ({
      ...prev,
      [provider]: success ? 'available' : 'unavailable'
    }));
  };

  const handleQuickSearch = (title: string) => {
    // Always treat quick search as SIMPLE initial query
    handleSendMessage(title, QueryComplexity.SIMPLE);
  };

  // No initial preload – show dashboard until user searches

  return (
    <div className="h-screen w-screen bg-brand-bg flex flex-col p-4">
        <header className="flex items-center space-x-3 pb-4 px-2">
            <Logo className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-brand-text-light">MovieMonk</h1>
        </header>
        
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
            {error && (
              <div className="absolute top-0 left-0 right-0 z-20 p-2 lg:col-span-3">
                <ErrorBanner message={error} onClose={() => setError(null)} />
              </div>
            )}
            <div className="lg:col-span-1 h-full min-h-0 flex flex-col gap-3">
                <ProviderSelector 
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                  providerStatus={providerStatus}
                />
                <ChatInterface onSendMessage={handleSendMessage} messages={messages} isLoading={isLoading} loadingProgress={loadingProgress} />
            </div>
            <div className="lg:col-span-2 h-full min-h-0 bg-brand-surface rounded-lg shadow-lg">
                <MovieDisplay 
                  movie={movieData} 
                  isLoading={isLoading} 
                  sources={sources}
                  selectedProvider={selectedProvider}
                  onFetchFullPlot={fetchFullPlotDetails}
                  onQuickSearch={handleQuickSearch}
                />
            </div>
        </div>
    </div>
  );
};

export default App;