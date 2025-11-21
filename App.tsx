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
      const content = result?.error || "Sorry, I couldn't fetch the data. The AI might be busy or the format was unexpected. Please try a different query.";
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
                />
            </div>
        </div>
    </div>
  );
};

export default App;