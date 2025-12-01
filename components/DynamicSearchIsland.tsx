/**
 * DynamicSearchIsland Component
 * 
 * A floating search interface that replaces the traditional sidebar.
 * Features:
 * - Collapsed: Animated pill with subtle bob and shimmer
 * - Expanded: Full search panel with provider selection and analysis mode
 * - Keyboard shortcuts: / or K to focus, Enter to search, Esc to collapse
 * - Accessibility: Full ARIA labels, focus management, reduced-motion support
 * - Persistence: Provider and analysis mode saved to localStorage
 */

import React, { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics/react';
import { QueryComplexity } from '../types';
import { Logo, SearchIcon, SendIcon } from './icons';
import '../styles/dynamic-search-island.css';

interface DynamicSearchIslandProps {
  onSearch: (query: string, complexity: QueryComplexity, provider: 'groq' | 'mistral') => void;
  isLoading?: boolean;
}

const STORAGE_KEY_PROVIDER = 'moviemonk_provider';
const STORAGE_KEY_ANALYSIS = 'moviemonk_analysis_mode';

const DynamicSearchIsland: React.FC<DynamicSearchIslandProps> = ({ onSearch, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<'groq' | 'mistral'>('groq');
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'complex'>('quick');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const islandRef = useRef<HTMLDivElement>(null);

  // Load persisted preferences on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER) as 'groq' | 'mistral' | null;
    const savedAnalysis = localStorage.getItem(STORAGE_KEY_ANALYSIS) as 'quick' | 'complex' | null;
    
    if (savedProvider && (savedProvider === 'groq' || savedProvider === 'mistral')) {
      setProvider(savedProvider);
    }
    if (savedAnalysis && (savedAnalysis === 'quick' || savedAnalysis === 'complex')) {
      setAnalysisMode(savedAnalysis);
    }
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isExpanded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // "/" or "k" to focus search (when not already focused on input)
      if ((e.key === '/' || e.key === 'k') && 
          !isExpanded && 
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsExpanded(true);
        track('search_island_opened', { trigger: 'keyboard_shortcut', key: e.key });
      }
      
      // Escape to collapse
      if (e.key === 'Escape' && isExpanded) {
        e.preventDefault();
        handleCollapse();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isExpanded]);

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        handleCollapse();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
    track('search_island_opened', { trigger: 'click' });
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery('');
    // Restore focus to trigger button
    if (triggerButtonRef.current) {
      triggerButtonRef.current.focus();
    }
    track('search_island_closed', {});
  };

  const handleProviderChange = (newProvider: 'groq' | 'mistral') => {
    setProvider(newProvider);
    localStorage.setItem(STORAGE_KEY_PROVIDER, newProvider);
    track('provider_changed', { from: provider, to: newProvider, source: 'search_island' });
  };

  const handleAnalysisModeToggle = () => {
    const newMode = analysisMode === 'quick' ? 'complex' : 'quick';
    setAnalysisMode(newMode);
    localStorage.setItem(STORAGE_KEY_ANALYSIS, newMode);
    track('analysis_mode_toggled', { from: analysisMode, to: newMode, source: 'search_island' });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;

    const complexity = analysisMode === 'complex' ? QueryComplexity.COMPLEX : QueryComplexity.SIMPLE;
    
    track('search_submitted_island', {
      query_length: query.trim().length,
      provider,
      analysis_mode: analysisMode
    });

    onSearch(query, complexity, provider);
    handleCollapse();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isExpanded) {
    // Collapsed pill state
    return (
      <div
        ref={islandRef}
        className="search-island collapsed"
        role="button"
        tabIndex={0}
        aria-label="Open search (press / or k)"
        aria-expanded="false"
        aria-controls="search-island-content"
        onClick={handleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleExpand();
          }
        }}
      >
        <button
          ref={triggerButtonRef}
          className="island-icon"
          aria-label="Search movies and shows"
          style={{ all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <SearchIcon className="w-8 h-8" />
        </button>
        <div className="kbd-hint">
          Press <span className="kbd-tag">/</span> or <span className="kbd-tag">K</span>
        </div>
      </div>
    );
  }

  // Expanded panel state
  return (
    <div
      ref={islandRef}
      className="search-island expanded"
      role="dialog"
      aria-label="Search movies and shows"
      aria-modal="false"
      id="search-island-content"
    >
      <div className="island-content">
        {/* Header */}
        <div className="island-header">
          <h3>
            <Logo className="w-5 h-5" />
            Search MovieMonk
          </h3>
          <button
            className="close-btn"
            onClick={handleCollapse}
            aria-label="Close search (Esc)"
            title="Close (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search movies, actors, directors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Search query"
            />
          </div>

          {/* Controls: Provider + Analysis Mode */}
          <div className="controls-row" style={{ marginTop: '1rem' }}>
            {/* Provider Selector */}
            <div className="provider-select">
              <div className="select-wrapper">
                <select
                  className="custom-select"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value as 'groq' | 'mistral')}
                  disabled={isLoading}
                  aria-label="AI Provider"
                >
                  <option value="groq">⚡ Groq (Fast)</option>
                  <option value="mistral">🌟 Mistral (Accurate)</option>
                </select>
                <span className="select-icon" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Analysis Mode Toggle */}
            <div className="analysis-toggle">
              <div
                className="toggle-wrapper"
                onClick={handleAnalysisModeToggle}
                role="switch"
                aria-checked={analysisMode === 'complex'}
                aria-label="Analysis mode"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAnalysisModeToggle();
                  }
                }}
              >
                <span className="toggle-label">
                  {analysisMode === 'complex' ? 'Deep' : 'Quick'}
                </span>
                <div className={`toggle-switch ${analysisMode === 'complex' ? 'active' : ''}`}>
                  <div className="toggle-switch-thumb" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="search-action-btn"
            disabled={!query.trim() || isLoading}
            aria-label="Search"
            style={{ marginTop: '1rem' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <SendIcon className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </form>

        {/* Keyboard hint */}
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
          <kbd style={{ padding: '0.125rem 0.375rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
            Enter
          </kbd> to search · <kbd style={{ padding: '0.125rem 0.375rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
            Esc
          </kbd> to close
        </div>
      </div>
    </div>
  );
};

export default DynamicSearchIsland;
