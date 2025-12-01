import React, { useState, useRef, useEffect } from 'react';
import { track } from '@vercel/analytics/react';

export type AIProvider = 'groq' | 'mistral' | 'perplexity' | 'openrouter';

export interface ProviderStatus {
  groq: 'available' | 'unavailable' | 'checking';
  mistral: 'available' | 'unavailable' | 'checking';
  perplexity: 'available' | 'unavailable' | 'checking';
  openrouter: 'available' | 'unavailable' | 'checking';
}

interface ProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  providerStatus: ProviderStatus;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  providerStatus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const providers: { id: AIProvider; name: string; icon: string; description: string }[] = [
    { id: 'groq', name: 'Groq', icon: '⚡', description: 'Fastest (Llama 3.3)' },
    { id: 'mistral', name: 'Mistral', icon: '🌟', description: 'Most Accurate' },
    { id: 'perplexity', name: 'Perplexity', icon: '🔍', description: 'Web Search' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐', description: 'Fallback' }
  ];

  const selectedProviderData = providers.find(p => p.id === selectedProvider);
  const availableProviders = providers.filter(p => providerStatus[p.id] === 'available');

  // Auto-select best available provider if current is unavailable
  useEffect(() => {
    if (providerStatus[selectedProvider] === 'unavailable') {
      // Find first available provider in preference order
      const available = providers.find(p => providerStatus[p.id] === 'available');
      if (available && available.id !== selectedProvider) {
        // Track automatic provider failover
        track('provider_change', {
          from: selectedProvider,
          to: available.id,
          reason: 'auto_failover'
        });
        onProviderChange(available.id);
      }
    }
  }, [providerStatus, selectedProvider, onProviderChange]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(availableProviders.findIndex(p => p.id === selectedProvider));
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev =>
          prev < availableProviders.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : availableProviders.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < availableProviders.length) {
          onProviderChange(availableProviders[focusedIndex].id);
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleSelect = (providerId: AIProvider) => {
    // Track provider changes
    if (providerId !== selectedProvider) {
      track('provider_change', {
        from: selectedProvider,
        to: providerId,
        reason: 'manual_selection'
      });
    }
    onProviderChange(providerId);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'available':
        return { dotColor: 'bg-green-400', label: 'Available' };
      case 'checking':
        return { dotColor: 'bg-yellow-400', label: 'Checking' };
      default:
        return { dotColor: 'bg-gray-500', label: 'Offline' };
    }
  };

  return (
    <div className="relative w-full max-w-[320px]" ref={containerRef}>
      {/* Hidden native select for accessibility fallback */}
      <select
        value={selectedProvider}
        onChange={(e) => onProviderChange(e.target.value as AIProvider)}
        className="sr-only"
        aria-hidden="true"
      >
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>

      {/* Custom dropdown button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-neutral-100 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select AI provider, currently ${selectedProviderData?.name || 'Unknown'}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-pink-500 to-violet-500">
            <span className="text-lg" role="img" aria-label={`${selectedProviderData?.name || 'Provider'} icon`}>
              {selectedProviderData?.icon || '🤖'}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">{selectedProviderData?.name || 'Unknown'}</span>
            <span className="text-xs text-neutral-400">{selectedProviderData?.description || ''}</span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown options */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 mt-2 w-full rounded-xl bg-neutral-900 border border-neutral-800 shadow-lg z-50 overflow-hidden max-h-[50vh] overflow-y-auto -webkit-overflow-scrolling-touch"
          aria-label="AI provider options"
        >
          {providers.map((provider, index) => {
            const status = providerStatus[provider.id];
            const { dotColor, label } = getStatusInfo(status);
            const isSelected = provider.id === selectedProvider;
            const isFocused = focusedIndex === availableProviders.findIndex(p => p.id === provider.id);
            const isAvailable = status === 'available';

            return (
              <li
                key={provider.id}
                role="option"
                aria-selected={isSelected}
                className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors ${
                  isSelected ? 'bg-violet-600/20' : 'hover:bg-neutral-800/60'
                } ${isFocused ? 'bg-neutral-700' : ''} ${!isAvailable ? 'opacity-50' : ''}`}
                onClick={() => isAvailable && handleSelect(provider.id)}
                aria-disabled={!isAvailable}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-pink-500 to-violet-500">
                    <span className="text-lg" role="img" aria-label={`${provider.name} icon`}>
                      {provider.icon}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-100">{provider.name}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                      <span className="text-xs text-neutral-400">{label}</span>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProviderSelector;
