import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import MovieDisplay from './components/MovieDisplay';
import ErrorBanner from './components/ErrorBanner';
import { ChatMessage, MovieData, QueryComplexity, GroundingSource } from './types';
import { fetchMovieData } from './services/geminiService';
import { Logo } from './components/icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'system-1', role: 'system', content: 'Ready to explore! Ask about any movie or show.' }
  ]);
  const [movieData, setMovieData] = useState<MovieData | null>(null);
  const [sources, setSources] = useState<GroundingSource[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (message: string, complexity: QueryComplexity) => {
    setIsLoading(true);
    setError(null);
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    const chatHistoryForAPI = messages.filter(m => m.role !== 'system');
    
    const result = await fetchMovieData(message, complexity, chatHistoryForAPI);

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

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await fetchMovieData("Interstellar (2014)", QueryComplexity.SIMPLE);
    
    if (result && result.movieData) {
        setMovieData(result.movieData);
        setSources(result.sources);
        setMessages(prev => [
            ...prev,
            { id: 'initial-model', role: 'model', content: `Here's a look at "${result.movieData.title}" to get you started.`}
        ]);
    } else {
        const content = result?.error || "I couldn't load the initial example data. Feel free to start with your own search!";
        setError(content);
        setMessages(prev => [
            ...prev,
            { id: 'initial-error', role: 'system', content: content}
        ]);
        setSources(null);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <div className="lg:col-span-1 h-full min-h-0">
                <ChatInterface onSendMessage={handleSendMessage} messages={messages} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-2 h-full min-h-0 bg-brand-surface rounded-lg shadow-lg">
                <MovieDisplay movie={movieData} isLoading={isLoading} sources={sources} />
            </div>
        </div>
    </div>
  );
};

export default App;