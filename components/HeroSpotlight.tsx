import React, { useEffect, useState } from 'react';
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
      <section className="discovery-hero discovery-hero-empty">
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

  const activeItem = items[Math.min(activeIndex, items.length - 1)];

  return (
    <section className="discovery-hero">
      {activeItem.backdrop_url && (
        <img
          src={activeItem.backdrop_url}
          alt={`${activeItem.title} backdrop`}
          className="discovery-hero-backdrop"
          loading="eager"
        />
      )}
      <div className="discovery-hero-overlay" />
      <div className="discovery-hero-copy">
        <p className="discovery-hero-kicker">Featured This Week</p>
        <h2 className="discovery-hero-title">{activeItem.title}</h2>
        <div className="discovery-hero-meta">
          <span>{activeItem.media_type === 'tv' ? 'TV Show' : 'Movie'}</span>
          <span>{activeItem.year || 'TBA'}</span>
          <span>{formatRating(activeItem.rating)}</span>
        </div>
        <p className="discovery-hero-overview">{activeItem.overview || 'No synopsis available yet.'}</p>
        <div className="discovery-hero-actions">
          <button
            type="button"
            className="discovery-cta discovery-cta-primary"
            onClick={() => onOpenTitle({ id: activeItem.id, mediaType: activeItem.media_type })}
          >
            Learn More
          </button>
          <button
            type="button"
            className="discovery-cta discovery-cta-secondary"
            onClick={() => onOpenTitle({ id: activeItem.id, mediaType: activeItem.media_type })}
          >
            Add to Watchlist
          </button>
        </div>
        {items.length > 1 && (
          <div className="discovery-hero-dots" aria-label="Featured titles">
            {items.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                type="button"
                className={`discovery-hero-dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${item.title}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSpotlight;
