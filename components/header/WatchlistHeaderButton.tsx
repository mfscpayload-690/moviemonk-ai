import React from 'react';
import { Bookmark } from 'lucide-react';

export interface WatchlistHeaderButtonProps {
  totalCount: number;
  onOpenWatchlists: () => void;
  className?: string;
}

export const WatchlistHeaderButton: React.FC<WatchlistHeaderButtonProps> = ({
  totalCount,
  onOpenWatchlists,
  className = ''
}) => {
  const displayCount = totalCount > 99 ? '99+' : totalCount;

  return (
    <button
      type="button"
      onClick={onOpenWatchlists}
      className={`group relative flex items-center justify-center w-9 h-9 sm:w-auto sm:h-9 px-0 sm:px-3 rounded-full text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 touch-target flex-shrink-0 ${className}`}
      aria-label={`View watchlists, ${totalCount} saved ${totalCount === 1 ? 'item' : 'items'}`}
      title="View your saved watchlists"
    >
      <Bookmark className="w-4 h-4 transition-transform group-hover:scale-110 text-white/80 group-hover:text-brand-primary flex-shrink-0" />
      <span className="hidden md:inline text-xs font-medium tracking-tight">Watchlist</span>
      {totalCount > 0 && (
        <span
          className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto sm:ml-1.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)] border-2 border-neutral-950 sm:border-0 leading-none"
          aria-hidden="true"
        >
          {displayCount}
        </span>
      )}
    </button>
  );
};

export default WatchlistHeaderButton;

