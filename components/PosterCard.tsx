import type { FC, KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { DiscoveryItem } from '../types';
import RatingDisplay from './RatingDisplay';
import { TagIcon, WatchedIcon } from './icons';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { buildRevealStyle, getRevealClassName, useScrollReveal } from '../hooks/useScrollReveal';

interface PosterCardProps {
  item: DiscoveryItem;
  sectionKey?: string;
  position?: number;
  onView?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpen?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  isWatched?: boolean;
  onToggleWatched?: (item: DiscoveryItem) => void;
  onQuickSaveToWatchlist?: (item: DiscoveryItem) => void;
}

const formatRating = (rating: number | null) => (
  typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : 'N/A'
);

const PosterCard: FC<PosterCardProps> = ({
  item,
  sectionKey = 'unknown',
  position = -1,
  onView,
  onOpen,
  onOpenTitle,
  isWatched = false,
  onToggleWatched,
  onQuickSaveToWatchlist
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { ref: revealRef, isRevealed } = useScrollReveal<HTMLDivElement>();
  const { triggerFeedback, isFeedbackActive } = useActionFeedback();

  const setCardRefs = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    revealRef(node);
  }, [revealRef]);

  const handleOpen = () => {
    onOpen?.(item, sectionKey, position);
    onOpenTitle({ id: item.id, mediaType: item.media_type });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleOpen();
  };

  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === 'undefined' || !onView) return;

    let hasReportedView = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasReportedView) return;
        hasReportedView = true;
        onView(item, sectionKey, position);
        observer.disconnect();
      },
      { threshold: 0.55 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [item, onView, position, sectionKey]);

  return (
    <div
      ref={setCardRefs}
      role="button"
      tabIndex={0}
      className={getRevealClassName(isRevealed, 'rise-up', 'discovery-poster-card group')}
      data-reveal-variant="rise-up"
      style={buildRevealStyle(Math.max(0, Math.min(position, 8)) * 60, 420)}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${item.title}${item.year ? ` (${item.year})` : ''}`}
    >
      <div className="discovery-poster-frame relative">
        {item.poster_url ? (
          <img
            src={item.poster_url}
            alt={`${item.title} poster`}
            className="discovery-poster-image"
            loading="lazy"
          />
        ) : (
          <div className="discovery-poster-empty">
            <span>{item.media_type === 'tv' ? 'Show' : 'Movie'}</span>
          </div>
        )}
        {!(onQuickSaveToWatchlist || onToggleWatched) && (
          <span className="discovery-poster-plus" aria-hidden="true">+</span>
        )}
        {onQuickSaveToWatchlist && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); triggerFeedback('save'); onQuickSaveToWatchlist(item); }}
            aria-label={`Save ${item.title} to watchlist`}
            title="Save to watchlist"
            className={`absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-black/50 text-white/70 hover:bg-violet-500/90 hover:text-white hover:scale-110 border border-white/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${isFeedbackActive('save') ? 'is-feedback-active' : ''}`}
          >
            <TagIcon className="w-3.5 h-3.5" />
          </button>
        )}
        {onToggleWatched && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); triggerFeedback('watch'); onToggleWatched(item); }}
            aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
            title={isWatched ? 'Watched' : 'Mark as watched'}
            className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 mm-action-feedback ${isFeedbackActive('watch') ? 'is-feedback-active' : ''} ${isWatched
                ? 'bg-green-500 text-white scale-100'
                : 'bg-black/50 text-white/60 hover:bg-green-500/90 hover:text-white hover:scale-110 border border-white/20'
              }`}
          >
            <WatchedIcon className="w-3.5 h-3.5" filled={isWatched} />
          </button>
        )}
      </div>
      <span className="discovery-poster-title">{item.title}</span>
      <div className="discovery-poster-meta flex items-center justify-between">
        <span>{item.year || 'TBA'}</span>
        <RatingDisplay score={item.rating} size="sm" compact={true} />
      </div>
    </div>
  );
};

export default PosterCard;
