import React, { useEffect, useRef, useState } from 'react';
import { DiscoveryItem } from '../types';
import SkeletonCard from './SkeletonCard';

interface HeroSpotlightProps {
  items: DiscoveryItem[];
  isLoading?: boolean;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const formatRating = (rating: number | null) => (
  typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : 'N/A'
);

const HeroSpotlight: React.FC<HeroSpotlightProps> = ({ items, isLoading = false, onOpenTitle }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const goPrev = () => setActiveIndex((current) => (current - 1 + items.length) % items.length);
  const goNext = () => setActiveIndex((current) => (current + 1) % items.length);
  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (!touchStartRef.current || items.length <= 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 42 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [items]);

  if (isLoading) {
    return <SkeletonCard variant="hero" />;
  }

  if (!items.length) {
    return (
      <section className="discovery-hero-wrapper discovery-hero-empty">
        <div className="discovery-hero-copy">
          <p className="discovery-hero-kicker">Discover</p>
          <h2 className="discovery-hero-title">Browse what is trending right now.</h2>
          <p className="discovery-hero-overview">
            Search still works exactly as before, but discovery now gives users a better starting point.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="discovery-hero-wrapper" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div 
        className="discovery-hero-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          // Render backgrounds for adjacent slides for smooth transition
          const isAdjacent = Math.abs(index - activeIndex) <= 1;

          return (
            <div key={`${item.id}-${index}`} className="discovery-hero-slide" aria-hidden={!isActive}>
              {(isActive || isAdjacent) && item.backdrop_url && (
                <img
                  src={item.backdrop_url}
                  alt={`${item.title} backdrop`}
                  className="discovery-hero-backdrop"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
              <div className="discovery-hero-overlay" />
              <div className="discovery-hero-copy">
                <p className="discovery-hero-kicker">Featured This Week</p>
                <h2 className="discovery-hero-title">{item.title}</h2>
                <div className="discovery-hero-meta">
                  <span>{item.media_type === 'tv' ? 'TV Show' : 'Movie'}</span>
                  <span>{item.year || 'TBA'}</span>
                  <span>{formatRating(item.rating)}</span>
                </div>
                <p className="discovery-hero-overview">{item.overview || 'No synopsis available yet.'}</p>
                <div className="discovery-hero-actions">
                  <button
                    type="button"
                    className="discovery-cta discovery-cta-primary"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
                  >
                    Learn More
                  </button>
                  <button
                    type="button"
                    className="discovery-cta discovery-cta-secondary"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
                  >
                    Add to Watchlist
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="discovery-hero-dots-global" aria-label="Featured titles">
          <div className="discovery-hero-dots">
            {items.map((item, index) => (
              <button
                key={`${item.id}-dot-${index}`}
                type="button"
                className={`discovery-hero-dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${item.title}`}
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSpotlight;
