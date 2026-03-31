import React, { useEffect, useRef } from 'react';
import { DiscoveryItem } from '../types';
import RatingDisplay from './RatingDisplay';

interface PosterCardProps {
  item: DiscoveryItem;
  sectionKey?: string;
  position?: number;
  onView?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpen?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  isWatched?: boolean;
  onToggleWatched?: (item: DiscoveryItem) => void;
}

const formatRating = (rating: number | null) => (
  typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : 'N/A'
);

const PosterCard: React.FC<PosterCardProps> = ({
  item,
  sectionKey = 'unknown',
  position = -1,
  onView,
  onOpen,
  onOpenTitle,
  isWatched = false,
  onToggleWatched
}) => {
  const cardRef = useRef<HTMLButtonElement | null>(null);

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
    <button
      ref={cardRef}
      type="button"
      className="discovery-poster-card"
      onClick={() => {
        onOpen?.(item, sectionKey, position);
        onOpenTitle({ id: item.id, mediaType: item.media_type });
      }}
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
        <span className="discovery-poster-plus" aria-hidden="true">+</span>
        {/* Watched badge */}
        {onToggleWatched && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleWatched(item); }}
            aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
            title={isWatched ? 'Watched ✓' : 'Mark as watched'}
            className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isWatched
                ? 'bg-green-500 text-white scale-100'
                : 'bg-black/50 text-white/60 hover:bg-green-500/90 hover:text-white hover:scale-110 border border-white/20'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
      <span className="discovery-poster-title">{item.title}</span>
      <div className="discovery-poster-meta flex items-center justify-between">
        <span>{item.year || 'TBA'}</span>
        <RatingDisplay score={item.rating} size="sm" compact={true} />
      </div>
    </button>
  );
};

export default PosterCard;
