import React, { useState, useRef } from 'react';
import { track } from '@vercel/analytics/react';
import { QueryComplexity } from '../types';
import { SendIcon, SparklesIcon, InfoIcon, Logo, FilmReelIcon, TrendingIcon } from './icons';
import ProviderSelector, { AIProvider, ProviderStatus } from './ProviderSelector';

interface ChatInterfaceProps {
  onSendMessage: (message: string, complexity: QueryComplexity) => void;
  isLoading: boolean;
  loadingProgress?: string;
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  providerStatus: ProviderStatus;
}

const POPULAR_SEARCHES = [
  'Interstellar',
  'The Dark Knight',
  'Inception',
  'Parasite',
  'Oppenheimer',
  'Breaking Bad',
  'Stranger Things',
  'The Last of Us'
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  isLoading,
  loadingProgress,
  selectedProvider,
  onProviderChange,
  providerStatus
}) => {
  const [input, setInput] = useState('');
  const [complexity, setComplexity] = useState<QueryComplexity>(QueryComplexity.SIMPLE);
  const [showPresets, setShowPresets] = useState(true);
  const [showComplexityInfo, setShowComplexityInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // Track search with complexity and query length
      track('search_submitted', {
        complexity: complexity.toLowerCase(),
        query_length: input.trim().length,
        provider: selectedProvider
      });
      onSendMessage(input, complexity);
      setInput('');
      setShowPresets(false);
    }
  };

  const handlePresetClick = (title: string) => {
    // Track preset usage
    track('preset_clicked', { preset: title });
    setInput(title);
    setShowPresets(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-brand-bg via-brand-surface/50 to-brand-bg backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      {/* Header - Clean & Aligned */}
      <div className="flex items-center justify-center px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Logo className="w-10 h-10 text-brand-primary drop-shadow-lg" />
            <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl -z-10"></div>
          </div>
          <h1 className="text-xl font-semibold text-brand-text-light tracking-tight">MovieMonk AI</h1>
        </div>
      </div>

      {/* Main Content - Scrollable Container */}
      <div className="flex-1 overflow-y-auto chat-scroll px-6 py-8 relative">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent pointer-events-none"></div>

        {/* Search Section - Natural Flow */}
        <div className="w-full max-w-4xl mx-auto relative z-10 space-y-8">
          {/* Hero Text - Better Typography */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-text-light mb-2">
              Discover Movies & Entertainment
            </h2>
            <p className="text-base text-brand-text-dark leading-relaxed max-w-2xl mx-auto">
              Search for movies, actors, directors, and get AI-powered insights with cinematic precision
            </p>
          </div>

          {/* Main Search Input - Enhanced */}
          <form onSubmit={handleSubmit}>
            <div className="relative max-w-2xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search movies, actors, directors..."
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl py-5 px-6 text-brand-text-light text-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all duration-300 placeholder:text-brand-text-dark/60 shadow-lg shadow-black/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <SendIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>

          {/* Provider Selector - Below Search Bar */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-sm text-brand-text-dark font-medium">Provider:</span>
            <ProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={onProviderChange}
              providerStatus={providerStatus}
            />
          </div>

          {/* Trending Searches - Clean Vertical Layout */}
          {showPresets && (
            <div>
              <div className="flex items-center justify-center gap-3 mb-6">
                <TrendingIcon className="w-5 h-5 text-brand-text-dark" />
                <span className="text-base font-semibold text-brand-text-light">Popular Searches</span>
              </div>
              <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                {POPULAR_SEARCHES.map((search) => (
                  <button
                    key={search}
                    onClick={() => handlePresetClick(search)}
                    className="w-full h-16 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-brand-primary/40 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/40 flex items-center justify-center p-4 group"
                    disabled={isLoading}
                  >
                    <span className="text-sm font-medium text-brand-text-light group-hover:text-brand-primary transition-colors duration-300 text-center leading-tight">
                      {search}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State - Enhanced */}
          {isLoading && (
            <div className="flex flex-col items-center gap-4 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg shadow-black/20 max-w-md mx-auto mt-8">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-brand-accent rounded-full animate-pulse shadow-lg"></div>
                <div className="w-3 h-3 bg-brand-accent rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-brand-accent rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.4s' }}></div>
              </div>
              {loadingProgress && (
                <p className="text-sm text-brand-text-dark font-medium text-center">{loadingProgress}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls - Clean Layout */}
      <div className="border-t border-white/5 px-6 py-5 bg-black/10 backdrop-blur-sm">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          <label htmlFor="complex-toggle" className="flex items-center gap-4 cursor-pointer group">
            <span className="text-sm text-brand-text-dark font-medium">Analysis Mode:</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold transition-colors duration-300 ${
                complexity === QueryComplexity.COMPLEX ? 'text-brand-secondary' : 'text-brand-text-light'
              }`}>
                {complexity === QueryComplexity.COMPLEX ? 'Deep Analysis' : 'Quick Search'}
              </span>
              <div
                className="relative cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  const newComplexity = complexity === QueryComplexity.SIMPLE ? QueryComplexity.COMPLEX : QueryComplexity.SIMPLE;
                  // Track complexity toggle
                  track('complexity_toggle', {
                    from: complexity.toLowerCase(),
                    to: newComplexity.toLowerCase()
                  });
                  setComplexity(newComplexity);
                }}
              >
                <input
                  id="complex-toggle"
                  type="checkbox"
                  className="sr-only"
                  checked={complexity === QueryComplexity.COMPLEX}
                  onChange={(e) => {
                    const newComplexity = e.target.checked ? QueryComplexity.COMPLEX : QueryComplexity.SIMPLE;
                    track('complexity_toggle', {
                      from: complexity.toLowerCase(),
                      to: newComplexity.toLowerCase()
                    });
                    setComplexity(newComplexity);
                  }}
                />
                <div className={`block w-12 h-7 rounded-full transition-all duration-300 shadow-lg ${
                  complexity === QueryComplexity.COMPLEX ? 'bg-brand-secondary shadow-brand-secondary/30' : 'bg-gray-600 shadow-black/30'
                }`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all duration-300 shadow-md ${
                  complexity === QueryComplexity.COMPLEX ? 'translate-x-5 shadow-brand-secondary/50' : ''
                }`}></div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComplexityInfo((v) => !v);
                }}
                aria-label="Explain query complexity"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-primary/40 transition-all duration-200 hover:scale-105"
              >
                <InfoIcon className="w-4 h-4 text-brand-text-dark" />
              </button>
            </div>
            {showComplexityInfo && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-80 p-4 rounded-xl bg-brand-surface/95 backdrop-blur-md border border-white/10 shadow-2xl text-sm text-brand-text-light z-20">
                <p className="font-semibold mb-3 text-brand-text-light">Analysis Modes</p>
                <div className="space-y-2">
                  <p><span className="text-brand-secondary font-semibold">Quick Search:</span> Fast overview with core metadata and concise summary.</p>
                  <p><span className="text-brand-secondary font-semibold">Deep Analysis:</span> Comprehensive dive into plot layers, themes, techniques, and cross-source validation.</p>
                </div>
              </div>
            )}
          </label>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
