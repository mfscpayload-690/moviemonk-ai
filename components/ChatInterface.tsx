
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, QueryComplexity } from '../types';
import { SendIcon, SparklesIcon, InfoIcon } from './icons';

interface ChatInterfaceProps {
  onSendMessage: (message: string, complexity: QueryComplexity) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  loadingProgress?: string;
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, messages, isLoading, loadingProgress }) => {
  const [input, setInput] = useState('');
  const [complexity, setComplexity] = useState<QueryComplexity>(QueryComplexity.SIMPLE);
  const [showPresets, setShowPresets] = useState(false);
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
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-3 rounded-2xl max-w-xs lg:max-w-md shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-br-none'
                    : 'bg-brand-surface text-brand-text-light rounded-bl-none border border-white/10'
                }`}
              >
                {msg.role === 'system' ? (
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="w-5 h-5 text-brand-accent" />
                    <p className="font-semibold text-sm">{msg.content}</p>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
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
        {/* Preset Suggestions */}
        {messages.length === 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-brand-text-dark font-medium">Popular Searches</span>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs text-brand-primary hover:text-brand-secondary transition-colors"
              >
                {showPresets ? 'Hide' : 'Show all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(showPresets ? PRESET_MOVIES : PRESET_MOVIES.slice(0, 4)).map((preset) => (
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
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
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
            <div className="flex items-center justify-between text-sm text-brand-text-dark px-1 group">
                <label htmlFor="complex-toggle" className="flex items-center space-x-2 cursor-pointer">
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
                        Complex Query (Deep Analysis)
                    </span>
                </label>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <InfoIcon className="w-4 h-4" />
                    <span>For plot analysis, deep dives, etc.</span>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
