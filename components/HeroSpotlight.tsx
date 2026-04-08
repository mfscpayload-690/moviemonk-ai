import React, { useEffect, useRef, useState } from 'react';
import { DiscoveryItem } from '../types';
import SkeletonCard from './SkeletonCard';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';
import { TagIcon } from './icons';

interface HeroSpotlightProps {
  items: DiscoveryItem[];
  isLoading?: boolean;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: DiscoveryItem) => void;
  onQuickSaveToWatchlist?: (item: DiscoveryItem) => void;
}

const formatRating = (rating: number | null) => (
  typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : 'N/A'
);

const HeroSpotlight: React.FC<HeroSpotlightProps> = ({ items, isLoading = false, onOpenTitle, isWatched, onToggleWatched, onQuickSaveToWatchlist }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const autoplayMs = 7000;
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
    setIsAutoPaused(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (items.length <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
      setIsAutoPaused(true);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
      setIsAutoPaused(true);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      setIsAutoPaused(true);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(0, items.length - 1));
      setIsAutoPaused(true);
    }
  };

  useEffect(() => {
    setActiveIndex(0);
    setIsAutoPaused(false);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1 || isAutoPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, autoplayMs);

    return () => window.clearInterval(timer);
  }, [isAutoPaused, items]);

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
    <section
      className="discovery-hero-wrapper"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Featured discovery titles"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsAutoPaused(true)}
      onMouseLeave={() => setIsAutoPaused(false)}
      onFocusCapture={() => setIsAutoPaused(true)}
      onBlurCapture={() => setIsAutoPaused(false)}
    >
      <div 
        className="discovery-hero-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          // Render backgrounds for adjacent slides for smooth transition
          const isAdjacent = Math.abs(index - activeIndex) <= 1;

          return (
            <div
              key={`${item.id}-${index}`}
              className="discovery-hero-slide"
              aria-hidden={!isActive}
              role="button"
              tabIndex={isActive ? 0 : -1}
              aria-label={`Open ${item.title}${item.year ? ` (${item.year})` : ''}`}
              onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenTitle({ id: item.id, mediaType: item.media_type });
                }
              }}
            >
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
                  {onToggleWatched && (() => {
                    const watched = isWatched?.(item.id, item.media_type) ?? false;
                    return (
                      <button
                        type="button"
                        tabIndex={isActive ? 0 : -1}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleWatched(item);
                        }}
                        className={`discovery-cta flex items-center gap-2 transition-all duration-200 ${
                          watched
                            ? 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'
                            : 'discovery-cta-secondary'
                        }`}
                        aria-label={watched ? 'Mark as unwatched' : 'Mark as watched'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {watched ? 'Watched' : 'Mark as Watched'}
                      </button>
                    );
                  })()}
                    {onQuickSaveToWatchlist && (() => {
                      return (
                        <button
                          type="button"
                          tabIndex={isActive ? 0 : -1}
                          onClick={(event) => {
                            event.stopPropagation();
                            onQuickSaveToWatchlist(item);
                          }}
                          className="discovery-cta discovery-cta-secondary flex items-center gap-2"
                          aria-label={`Save ${item.title} to watchlist`}
                          title="Save to watchlist"
                        >
                          <TagIcon className="w-4 h-4" />
                          Save to Watchlist
                        </button>
                      );
                    })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="discovery-hero-nav hidden md:flex" aria-label="Hero slider controls">
          <button
            type="button"
            className="discovery-hero-nav-btn"
            aria-label="Previous featured title"
            onClick={() => {
              goPrev();
              setIsAutoPaused(true);
            }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="discovery-hero-nav-btn"
            aria-label="Next featured title"
            onClick={() => {
              goNext();
              setIsAutoPaused(true);
            }}
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {items.length > 1 && (
        <div className="discovery-hero-dots-global" aria-label="Featured titles">
          <div className="discovery-hero-dots">
            {items.map((item, index) => (
              <button
                key={`${item.id}-dot-${index}`}
                type="button"
                className={`discovery-hero-dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveIndex(index);
                  setIsAutoPaused(true);
                }}
                aria-label={`Show ${item.title}`}
                tabIndex={-1}
              >
                {index === activeIndex && (
                  <span
                    className={`discovery-hero-dot-progress ${isAutoPaused ? 'is-paused' : ''}`}
                    style={{ animationDuration: `${autoplayMs}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSpotlight;
