import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, QueryComplexity } from '../types';
import { SendIcon, SparklesIcon, InfoIcon, UserCircleIcon, Logo, FilmReelIcon, TrendingIcon } from './icons';
import ProviderSelector, { AIProvider, ProviderStatus } from './ProviderSelector';

interface ChatInterfaceProps {
  onSendMessage: (message: string, complexity: QueryComplexity) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  loadingProgress?: string;
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  providerStatus: ProviderStatus;
}

const PRESET_MOVIES = [
  { title: 'Interstellar', emoji: '🚀' },
  { title: 'The Dark Knight', emoji: '🦇' },
  { title: 'Inception', emoji: '💭' },
  { title: 'Parasite', emoji: '🏠' },
  { title: 'Oppenheimer', emoji: '💥' },
  { title: 'Breaking Bad', emoji: '🧪' },
  { title: 'Stranger Things', emoji: '👾' },
  { title: 'The Last of Us', emoji: '🍄' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, 
  messages, 
  isLoading, 
  loadingProgress,
  selectedProvider,
  onProviderChange,
  providerStatus 
}) => {
  const [input, setInput] = useState('');
  const [complexity, setComplexity] = useState<QueryComplexity>(QueryComplexity.SIMPLE);
  const [showPresets, setShowPresets] = useState(false);
  const [showComplexityInfo, setShowComplexityInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, complexity);
      setInput('');
      setShowPresets(false);
    }
  };

  const handlePresetClick = (title: string) => {
    setInput(title);
    inputRef.current?.focus();
    setShowPresets(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  // Improved search controls alignment row
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 px-2 sm:px-4">
      {/* Search Controls Row - Improved Alignment */}
      <div className="flex flex-row items-center gap-3 mb-2 w-full">
        {/* Trending Searches Button */}
        <button
          className="flex items-center gap-1 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium transition whitespace-nowrap"
          onClick={() => setShowPresets(!showPresets)}
          style={{ minWidth: '140px' }}
        >
          <TrendingIcon className="w-4 h-4 text-primary" />
          <span>Trending Searches</span>
        </button>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          placeholder="Search for a movie or show..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search movies"
        />

        {/* Provider Selector Dropdown */}
        <div className="min-w-[140px]">
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={onProviderChange}
            providerStatus={providerStatus}
          />
        </div>
      </div>

      {/* Trending Presets Row */}
      {showPresets && (
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_MOVIES.map((preset) => (
            <button
              key={preset.title}
              onClick={() => handlePresetClick(preset.title)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-brand-primary/20 border border-white/10 hover:border-brand-primary/50 rounded-full text-xs font-medium text-brand-text-light transition-all duration-200 hover:scale-105"
              disabled={isLoading}
            >
              <span>{preset.emoji}</span>
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex flex-col gap-3">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2`}>
              {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Logo className="w-5 h-5 text-brand-primary" />
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-xs lg:max-w-md ${isUser ? 'bg-brand-primary text-white rounded-br-none' : 'bg-brand-surface text-brand-text-light rounded-bl-none'} border border-white/10`}>
                {isSystem ? (
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="w-5 h-5 text-brand-accent" />
                    <p className="font-semibold text-sm">{msg.content}</p>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <UserCircleIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start justify-start">
            <div className="px-4 py-3 rounded-2xl max-w-xs lg:max-w-md bg-brand-surface text-brand-text-light rounded-bl-none border border-white/10">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                {loadingProgress && (
                  <p className="text-xs text-brand-text-dark">{loadingProgress}</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Query Complexity Toggle */}
      <div className="flex items-center justify-between text-sm text-brand-text-dark px-1 mt-2">
        <label htmlFor="complex-toggle" className="flex items-center space-x-2 cursor-pointer relative">
          <div className="relative">
            <input
              id="complex-toggle"
              type="checkbox"
              className="sr-only"
              checked={complexity === QueryComplexity.COMPLEX}
              onChange={(e) => setComplexity(e.target.checked ? QueryComplexity.COMPLEX : QueryComplexity.SIMPLE)}
            />
            <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${complexity === QueryComplexity.COMPLEX ? 'translate-x-full bg-brand-secondary' : ''}`}></div>
          </div>
          <span className={`font-medium transition-colors ${complexity === QueryComplexity.COMPLEX ? 'text-brand-secondary' : 'text-brand-text-dark'}`}>
            {complexity === QueryComplexity.COMPLEX ? 'Complex Query' : 'Simple Query'}
          </span>
          <button
            type="button"
            onClick={() => setShowComplexityInfo(v => !v)}
            aria-label="Explain query complexity"
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <InfoIcon className="w-4 h-4" />
          </button>
          {showComplexityInfo && (
            <div className="absolute top-full left-0 mt-2 w-72 p-3 rounded-lg bg-brand-surface border border-white/10 shadow-xl text-xs text-brand-text-light z-20">
              <p className="font-semibold mb-1">Query Modes</p>
              <p><span className="text-brand-secondary font-semibold">Simple:</span> Fast overview: core metadata + concise summary.</p>
              <p className="mt-1"><span className="text-brand-secondary font-semibold">Complex:</span> Deep dive: plot layers, themes, techniques, cross-source validation. Slower, richer.</p>
              <p className="mt-1 italic text-brand-text-dark">Toggle to switch before sending your message.</p>
            </div>
          )}
        </label>
        <div className="text-xs text-brand-text-dark">
          {complexity === QueryComplexity.COMPLEX ? 'Deep analysis enabled' : 'Quick mode'}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
