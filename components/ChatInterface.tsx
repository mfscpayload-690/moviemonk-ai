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
    setShowPresets(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface/70 backdrop-blur-md border border-white/10 rounded-xl shadow-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isModel = msg.role === 'model';
            const isSystem = msg.role === 'system';
            const AvatarIcon = isUser ? UserCircleIcon : isModel ? Logo : FilmReelIcon;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <AvatarIcon className="w-5 h-5 text-brand-primary" />
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl max-w-xs lg:max-w-md shadow-md ${
                    isUser
                      ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-br-none'
                      : 'bg-brand-surface text-brand-text-light rounded-bl-none border border-white/10'
                  }`}
                >
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
                    <AvatarIcon className="w-5 h-5 text-white" />
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
      </div>
      <div className="border-t border-white/10 p-4">
        {/* Trending Searches Toggle */}
        <div className="mb-3">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-brand-primary/30 border border-white/10 hover:border-brand-primary/50 text-brand-text-light transition"
            type="button"
          >
            <TrendingIcon className="w-4 h-4" />
            <span>{showPresets ? 'Hide' : 'Trending Searches'}</span>
          </button>
          {showPresets && (
            <div className="flex flex-wrap gap-2 mt-2">
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
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
           {/* AI Provider Selector - Compact Inline */}
           <div className="flex items-center justify-between">
             <span className="text-xs text-brand-text-dark font-medium">AI Model</span>
             <ProviderSelector
               selectedProvider={selectedProvider}
               onProviderChange={onProviderChange}
               providerStatus={providerStatus}
             />
           </div>
           
           <div className="relative">
             <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => messages.length === 0 && setShowPresets(true)}
              placeholder="Ask about a movie, actor, director..."
              className="w-full bg-gray-800/50 border border-white/20 rounded-xl py-3 pl-4 pr-14 text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-300 placeholder:text-brand-text-dark"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-primary hover:bg-brand-secondary disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110"
            >
              <SendIcon className="w-5 h-5 text-white" />
            </button>
           </div>
            <div className="flex items-center justify-between text-sm text-brand-text-dark px-1">
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
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
