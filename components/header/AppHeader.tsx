import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { Logo } from '../icons';
import { SearchCapsule } from './SearchCapsule';
import { WatchlistHeaderButton } from './WatchlistHeaderButton';
import { UserProfileMenu } from './UserProfileMenu';
import { CommandPaletteModal } from './CommandPaletteModal';
import { QueryComplexity, SuggestionItem } from '../../types';
import { QuickSaveTitle } from '../../lib/quickSave';

export interface AppHeaderProps {
  user: User | null;
  isCloud: boolean;
  isSyncing: boolean;
  canShare: boolean;
  totalWatchlistItems: number;
  initialQuery?: string;
  isLoading?: boolean;
  onGoHome: () => void;
  onSearch: (query: string, complexity: QueryComplexity) => void;
  onSuggestionSelect?: (suggestion: SuggestionItem) => void;
  onOpenWatchlists: () => void;
  onOpenSettings: () => void;
  onShare: () => void;
  onQuickSaveToWatchlist?: (title: QuickSaveTitle) => void;
  headerUtilityMenu?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  isCloud,
  isSyncing,
  canShare,
  totalWatchlistItems,
  initialQuery = '',
  isLoading = false,
  onGoHome,
  onSearch,
  onSuggestionSelect,
  onOpenWatchlists,
  onOpenSettings,
  onShare,
  onQuickSaveToWatchlist
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<QueryComplexity>(QueryComplexity.SIMPLE);
  const [scrollbarOffset, setScrollbarOffset] = useState(0);

  // Measure main content scrollbar gutter to maintain perfect horizontal symmetry
  useEffect(() => {
    const measureScrollbar = () => {
      const mainEl = document.querySelector('.main-content') as HTMLElement | null;
      if (mainEl) {
        const offset = mainEl.offsetWidth - mainEl.clientWidth;
        setScrollbarOffset(offset > 0 ? offset : 0);
      }
    };

    measureScrollbar();
    window.addEventListener('resize', measureScrollbar, { passive: true });

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measureScrollbar)
      : null;
    const mainEl = document.querySelector('.main-content');
    if (mainEl && observer) {
      observer.observe(mainEl);
    }

    return () => {
      window.removeEventListener('resize', measureScrollbar);
      observer?.disconnect();
    };
  }, []);

  // Monitor scroll on .main-content (MovieMonk's actual scroll container) and window
  useEffect(() => {
    const handleScroll = () => {
      const mainEl = document.querySelector('.main-content');
      const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;
      setIsScrolled(scrollTop > 24);
    };

    const mainEl = document.querySelector('.main-content');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Global keyboard shortcut to open palette: ⌘K, Ctrl+K, or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
        return;
      }
      if (
        e.key === '/' &&
        !isPaletteOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };

    const handleCustomOpen = () => setIsPaletteOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isPaletteOpen]);

  return (
    <>
      <header
        style={{
          right: `${scrollbarOffset}px`,
        }}
        className={`app-header sticky top-0 z-50 transition-all duration-300 ease-out flex md:grid md:grid-cols-[1fr_minmax(0,34rem)_1fr] items-center justify-between gap-2.5 sm:gap-4 mx-2.5 sm:mx-4 md:mx-5 mt-2 sm:mt-2.5 py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-2xl backdrop-blur-xl border border-white/10 border-t-white/20 ${
          isScrolled
            ? 'is-scrolled bg-neutral-950/90 shadow-[0_12px_40px_rgba(0,0,0,0.7)] border-white/15'
            : 'bg-neutral-950/65 shadow-[0_8px_32px_rgba(0,0,0,0.45)]'
        }`}
      >
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center justify-start flex-shrink-0">
          <button
            type="button"
            className="flex items-center gap-2 sm:gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg flex-shrink-0"
            onClick={onGoHome}
            aria-label="Go to discovery home"
          >
            <Logo className="w-8 h-8 sm:w-9 sm:h-9 text-primary drop-shadow-glow flex-shrink-0" />
            <h1 className="brand-signature title-font text-lg sm:text-2xl font-bold tracking-tight select-none hidden md:inline-flex" aria-label="MovieMonk">
              <span className="brand-signature-movie">Movie</span>
              <span className="brand-signature-monk">Monk</span>
            </h1>
          </button>
        </div>

        {/* Center: Search Capsule (Centered in Column 2 on desktop, flexible on mobile) */}
        <div className="flex-1 md:flex-initial w-full max-w-xl mx-auto flex justify-center min-w-0">
          <SearchCapsule
            query={initialQuery}
            analysisMode={analysisMode}
            onClick={() => setIsPaletteOpen(true)}
          />
        </div>

        {/* Right: Actions Cluster (Right-aligned in Column 3) */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-shrink-0">
          <WatchlistHeaderButton
            totalCount={totalWatchlistItems}
            onOpenWatchlists={onOpenWatchlists}
          />

          <UserProfileMenu
            user={user}
            isCloud={isCloud}
            isSyncing={isSyncing}
            canShare={canShare}
            onOpenWatchlists={onOpenWatchlists}
            onOpenSettings={onOpenSettings}
            onShare={onShare}
          />
        </div>
      </header>

      {/* Morphing Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        initialQuery={initialQuery}
        onSearch={onSearch}
        onSuggestionSelect={onSuggestionSelect}
        onQuickSaveToWatchlist={onQuickSaveToWatchlist}
        isLoading={isLoading}
      />
    </>
  );
};

export default AppHeader;
