import React, { useState } from 'react';
import { RelatedTitle } from '../types';
import { TagIcon, WatchedIcon } from './icons';

interface SimilarCarouselProps {
  label: string;
  items: RelatedTitle[];
  onOpenAll: () => void;
  onSelectTitle: (title: string) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: RelatedTitle) => void;
  onQuickSaveToWatchlist?: (item: RelatedTitle) => void;
}

const SimilarCarousel: React.FC<SimilarCarouselProps> = ({ label, items, onOpenAll, onSelectTitle, isWatched, onToggleWatched, onQuickSaveToWatchlist }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!items || items.length === 0) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, title: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelectTitle(title);
  };

  return (
    <div className="glass-panel p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">{label}</h3>
        <button className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15" onClick={onOpenAll}>
          See all
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((it, idx) => (
          <div
            key={`${it.media_type}-${it.id}-${idx}`}
            role="button"
            tabIndex={0}
            className="flex-shrink-0 w-28 sm:w-32 text-left group cursor-pointer outline-none"
            onMouseEnter={() => setHoverIndex(idx)}
            onMouseLeave={() => setHoverIndex(null)}
            onFocus={() => setHoverIndex(idx)}
            onBlur={() => setHoverIndex((current) => (current === idx ? null : current))}
            onClick={() => onSelectTitle(it.title)}
            onKeyDown={(event) => handleKeyDown(event, it.title)}
            aria-label={`Open ${it.title}${it.year ? ` (${it.year})` : ''}`}
          >
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 transition-colors group-hover:border-brand-primary/50 group-focus-visible:border-brand-primary/50">
              {it.poster_url ? (
                <img src={it.poster_url} alt={`${it.title} poster`} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
              <div className={`absolute inset-0 transition ${hoverIndex === idx ? 'bg-black/20' : 'bg-transparent'}`} />
              {(onQuickSaveToWatchlist || onToggleWatched) && (
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                  {onQuickSaveToWatchlist ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onQuickSaveToWatchlist(it);
                      }}
                      className="h-7 w-7 rounded-full bg-black/60 border border-white/15 text-white/80 hover:bg-violet-500/90 hover:text-white flex items-center justify-center shadow-lg"
                      aria-label={`Save ${it.title} to watchlist`}
                      title="Save to watchlist"
                    >
                      <TagIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : <span />}
                  {onToggleWatched ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleWatched(it);
                      }}
                      className={`h-7 w-7 rounded-full border flex items-center justify-center shadow-lg transition-colors ${isWatched?.(it.id, it.media_type) ? 'bg-green-500 border-green-400 text-white' : 'bg-black/60 border-white/15 text-white/80 hover:bg-green-500/90 hover:text-white'}`}
                      aria-label={isWatched?.(it.id, it.media_type) ? 'Mark as unwatched' : 'Mark as watched'}
                      title={isWatched?.(it.id, it.media_type) ? 'Watched ✓' : 'Mark as watched'}
                    >
                      <WatchedIcon className="h-3.5 w-3.5" filled={Boolean(isWatched?.(it.id, it.media_type))} />
                    </button>
                  ) : <span />}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-semibold text-white line-clamp-2">{it.title}</p>
            {it.year && <p className="text-[11px] text-brand-text-dark">{it.year}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarCarousel;