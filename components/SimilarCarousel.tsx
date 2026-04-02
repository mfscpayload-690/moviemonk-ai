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
            </div>
            <p className="mt-2 text-xs font-semibold text-white line-clamp-2">{it.title}</p>
            {it.year && <p className="text-[11px] text-brand-text-dark">{it.year}</p>}
            {(onQuickSaveToWatchlist || onToggleWatched) && (
              <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                {onQuickSaveToWatchlist ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onQuickSaveToWatchlist(it);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/20 hover:text-white"
                    aria-label={`Save ${it.title} to watchlist`}
                    title="Save to watchlist"
                  >
                    <TagIcon className="h-3 w-3" />
                    Save
                  </button>
                ) : null}
                {onToggleWatched ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleWatched(it);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${isWatched?.(it.id, it.media_type) ? 'border-green-500/40 bg-green-500/15 text-green-300 hover:bg-green-500/25' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
                    aria-label={isWatched?.(it.id, it.media_type) ? 'Mark as unwatched' : 'Mark as watched'}
                    title={isWatched?.(it.id, it.media_type) ? 'Watched ✓' : 'Mark as watched'}
                  >
                    <WatchedIcon className="h-3 w-3" filled={Boolean(isWatched?.(it.id, it.media_type))} />
                    {isWatched?.(it.id, it.media_type) ? 'Watched' : 'Watched'}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarCarousel;