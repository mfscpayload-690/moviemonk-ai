import React from 'react';

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
  const providers: { id: AIProvider; name: string; icon: string; description: string }[] = [
    { id: 'groq', name: 'Groq', icon: '⚡', description: 'Fastest (Llama 3.3)' },
    { id: 'mistral', name: 'Mistral', icon: '🌟', description: 'Most Accurate' },
    { id: 'perplexity', name: 'Perplexity', icon: '🔍', description: 'Web Search' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🌐', description: 'Fallback' }
  ];

  // Auto-select best available provider if current is unavailable
  React.useEffect(() => {
    if (providerStatus[selectedProvider] === 'unavailable') {
      // Find first available provider in preference order
      const available = providers.find(p => providerStatus[p.id] === 'available');
      if (available && available.id !== selectedProvider) {
        onProviderChange(available.id);
      }
    }
  }, [providerStatus, selectedProvider, onProviderChange]);

  return (
    <select
      value={selectedProvider}
      onChange={(e) => onProviderChange(e.target.value as AIProvider)}
      className="px-3 py-1.5 bg-brand-surface/80 border border-white/10 rounded-lg text-sm text-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
    >
      {providers.map((provider) => {
        const status = providerStatus[provider.id];
        const isAvailable = status === 'available';
        const statusIcon = status === 'checking' ? '⏳' : isAvailable ? '✓' : '✗';
        
        return (
          <option 
            key={provider.id} 
            value={provider.id}
            disabled={!isAvailable}
          >
            {provider.icon} {provider.name} {statusIcon}
          </option>
        );
      })}
    </select>
  );
};

export default ProviderSelector;
