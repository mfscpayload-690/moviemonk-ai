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

const HERO_PREVIEW_DELAY_MS = 2000;

function toHeroItemKey(item: DiscoveryItem): string {
  return `${item.media_type}:${item.id}`;
}

function scoreTrailerCandidate(video: any): number {
  let score = 0;
  const type = String(video?.type || '').toLowerCase();
  if (type === 'trailer') score += 6;
  if (type === 'teaser') score += 3;
  if (video?.official) score += 2;
  if (typeof video?.size === 'number') {
    score += Math.min(2, video.size / 360);
  }
  return score;
}

function buildYoutubeEmbedPreview(videos: any[]): string | null {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  const best = [...videos]
    .filter((video) => (
      typeof video?.key === 'string'
      && String(video?.site || '').toLowerCase() === 'youtube'
    ))
    .sort((a, b) => scoreTrailerCandidate(b) - scoreTrailerCandidate(a))[0];

  if (!best?.key) return null;

  const key = encodeURIComponent(best.key);
  return `https://www.youtube.com/embed/${key}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${key}&modestbranding=1&rel=0&iv_load_policy=3`;
}

const HeroSpotlight: React.FC<HeroSpotlightProps> = ({ items, isLoading = false, onOpenTitle, isWatched, onToggleWatched, onQuickSaveToWatchlist }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [isTrailerPreviewEnabled, setIsTrailerPreviewEnabled] = useState(true);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [previewUrlByItem, setPreviewUrlByItem] = useState<Record<string, string | null>>({});
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

    const updatePreviewEligibility = () => {
      const prefersReducedMotion = reducedMotionQuery.matches;
      const saveDataEnabled = Boolean(connection?.saveData);
      setIsTrailerPreviewEnabled(!prefersReducedMotion && !saveDataEnabled);
    };

    updatePreviewEligibility();

    const handleChange = () => updatePreviewEligibility();
    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', handleChange);
      return () => reducedMotionQuery.removeEventListener('change', handleChange);
    }

    reducedMotionQuery.addListener(handleChange);
    return () => reducedMotionQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!isTrailerPreviewEnabled || items.length === 0) {
      setIsPreviewReady(false);
      return;
    }

    setIsPreviewReady(false);
    const timer = window.setTimeout(() => {
      setIsPreviewReady(true);
    }, HERO_PREVIEW_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, items, isTrailerPreviewEnabled]);

  useEffect(() => {
    if (!isTrailerPreviewEnabled || !isPreviewReady) return;

    const activeItem = items[activeIndex];
    if (!activeItem) return;

    const itemKey = toHeroItemKey(activeItem);
    if (Object.prototype.hasOwnProperty.call(previewUrlByItem, itemKey)) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      endpoint: `${activeItem.media_type}/${activeItem.id}/videos`,
      language: 'en-US'
    });

    const loadPreview = async () => {
      try {
        const response = await fetch(`/api/tmdb?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Trailer lookup failed (${response.status})`);
        }
        const payload = await response.json();
        const nextUrl = buildYoutubeEmbedPreview(payload?.results || []);
        setPreviewUrlByItem((previous) => ({ ...previous, [itemKey]: nextUrl }));
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        setPreviewUrlByItem((previous) => ({ ...previous, [itemKey]: null }));
      }
    };

    void loadPreview();
    return () => controller.abort();
  }, [activeIndex, isPreviewReady, isTrailerPreviewEnabled, items, previewUrlByItem]);

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

  const activeItem = items[activeIndex];
  const activePreviewUrl = activeItem ? previewUrlByItem[toHeroItemKey(activeItem)] : null;
  const isActivePreviewPlaying = Boolean(
    isTrailerPreviewEnabled
    && isPreviewReady
    && activePreviewUrl
  );

  return (
    <section
      className={`discovery-hero-wrapper ${isActivePreviewPlaying ? 'is-preview-active' : ''}`}
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
          const previewUrl = previewUrlByItem[toHeroItemKey(item)];
          const shouldShowPreview = Boolean(
            isActive
            && isTrailerPreviewEnabled
            && isPreviewReady
            && previewUrl
          );

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
              {shouldShowPreview && (
                <div className="discovery-hero-preview-layer" aria-hidden="true">
                  <iframe
                    key={`preview-${item.media_type}-${item.id}`}
                    src={previewUrl || undefined}
                    title={`${item.title} trailer preview`}
                    className="discovery-hero-preview-frame"
                    loading="eager"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    tabIndex={-1}
                  />
                </div>
              )}
              <div className={`discovery-hero-overlay ${shouldShowPreview ? 'is-preview-playing' : ''}`} />
              <div className={`discovery-hero-copy ${shouldShowPreview ? 'is-preview-playing' : ''}`}>
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
