import React, { useEffect, useRef } from 'react';
import { DiscoveryItem } from '../types';

interface PosterCardProps {
  item: DiscoveryItem;
  sectionKey?: string;
  position?: number;
  onView?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpen?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
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
  onOpenTitle
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
      <div className="discovery-poster-frame">
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
      </div>
      <span className="discovery-poster-title">{item.title}</span>
      <span className="discovery-poster-meta">{item.year || 'TBA'} • {formatRating(item.rating)}</span>
    </button>
  );
};

export default PosterCard;
