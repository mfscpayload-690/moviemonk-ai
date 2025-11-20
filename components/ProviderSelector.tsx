import React from 'react';

export type AIProvider = 'groq' | 'mistral' | 'openrouter';

export interface ProviderStatus {
  groq: 'available' | 'unavailable' | 'checking';
  mistral: 'available' | 'unavailable' | 'checking';
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
  const providers: { id: AIProvider; name: string; icon: string; description: string }[] = [
    { id: 'groq', name: 'Groq', icon: '⚡', description: 'Fastest (Llama 3.3)' },
    { id: 'mistral', name: 'Mistral', icon: '🌟', description: 'Most Accurate' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐', description: 'Fallback' }
  ];

  const getStatusColor = (status: 'available' | 'unavailable' | 'checking') => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'unavailable':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500 animate-pulse';
    }
  };

  const getStatusText = (status: 'available' | 'unavailable' | 'checking') => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      case 'checking':
        return 'Checking...';
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-brand-surface/50 rounded-lg border border-brand-primary/20">
      <label className="text-xs font-semibold text-brand-text-dark uppercase tracking-wide">
        AI Provider
      </label>
      <div className="flex gap-2">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const status = providerStatus[provider.id];
          const isUnavailable = status === 'unavailable';

          return (
            <button
              key={provider.id}
              onClick={() => onProviderChange(provider.id)}
              disabled={isUnavailable}
              className={`
                flex-1 relative px-4 py-3 rounded-lg font-medium text-sm
                transition-all duration-200 
                ${
                  isSelected
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg scale-105'
                    : isUnavailable
                    ? 'bg-brand-surface/30 text-brand-text-dark/50 cursor-not-allowed'
                    : 'bg-brand-surface text-brand-text-light hover:bg-brand-surface/80 hover:scale-102'
                }
                ${isSelected && !isUnavailable ? 'ring-2 ring-brand-accent/50' : ''}
              `}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{provider.icon}</span>
                  <span>{provider.name}</span>
                </div>
                <span className="text-xs opacity-70">{provider.description}</span>
              </div>
              
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-brand-bg rounded-full text-xs">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                <span className={status === 'unavailable' ? 'text-red-400' : 'text-brand-text-dark'}>
                  {getStatusText(status)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProviderSelector;
