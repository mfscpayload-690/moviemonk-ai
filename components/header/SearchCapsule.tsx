import React from 'react';
import { Search, Zap, FlaskConical } from 'lucide-react';
import { QueryComplexity } from '../../types';

export interface SearchCapsuleProps {
  query?: string;
  analysisMode?: QueryComplexity | 'quick' | 'complex';
  onClick: () => void;
  className?: string;
}

export const SearchCapsule: React.FC<SearchCapsuleProps> = ({
  query,
  analysisMode = 'quick',
  onClick,
  className = ''
}) => {
  const isDeep = String(analysisMode).toLowerCase() === 'complex';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full max-w-xl mx-auto flex items-center justify-between gap-2 h-9 sm:h-10 px-3 sm:px-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.1] border border-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-200 cursor-pointer text-left select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${className}`}
      aria-label="Search movies, TV shows, and AI vibes. Press Command K"
    >
      {/* Left: Search Icon + Text placeholder or active query */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50 group-hover:text-brand-primary transition-colors flex-shrink-0" />
        <span className="text-xs sm:text-sm text-white/70 group-hover:text-white/90 truncate font-normal tracking-wide">
          {query && query.trim().length > 0 ? (
            <span className="text-white font-medium">{query}</span>
          ) : (
            <>
              <span className="hidden sm:inline">Search movies, shows, vibes…</span>
              <span className="sm:hidden">Search movies…</span>
            </>
          )}
        </span>
      </div>

      {/* Right: Mode indicator + Command key badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Mode Tag (hidden on mobile to keep search pill airy and uncluttered) */}
        <div
          className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
            isDeep
              ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
              : 'bg-amber-400/10 border-amber-400/20 text-amber-300'
          }`}
          title={isDeep ? 'Deep Dive Analysis mode' : 'Quick Summary mode'}
        >
          {isDeep ? (
            <FlaskConical className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
          ) : (
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
          )}
          <span className="hidden md:inline">{isDeep ? 'Deep' : 'Quick'}</span>
        </div>

        {/* ⌘K Shortcut Badge (Desktop only) */}
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-white/50 bg-white/[0.06] border border-white/10 rounded shadow-xs">
          <span className="text-[11px] leading-none">⌘</span>K
        </kbd>
      </div>
    </button>
  );
};

export default SearchCapsule;
