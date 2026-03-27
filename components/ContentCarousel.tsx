import React, { useEffect, useRef } from 'react';
import { DiscoveryItem } from '../types';
import PosterCard from './PosterCard';
import SkeletonCard from './SkeletonCard';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface ContentCarouselProps {
  sectionKey: string;
  title: string;
  items: DiscoveryItem[];
  isLoading?: boolean;
  onSectionVisible?: (sectionKey: string, title: string, itemCount: number) => void;
  onSectionSkipped?: (sectionKey: string, title: string, itemCount: number) => void;
  onCardView?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onCardOpen?: (item: DiscoveryItem, sectionKey: string, position: number) => void;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({
  sectionKey,
  title,
  items,
  isLoading = false,
  onSectionVisible,
  onSectionSkipped,
  onCardView,
  onCardOpen,
  onOpenTitle
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current || typeof IntersectionObserver === 'undefined') return;

    let hasBeenVisible = false;
    let hasSkipBeenReported = false;
    let sectionEngaged = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          hasBeenVisible = true;
          onSectionVisible?.(sectionKey, title, items.length);
          return;
        }

        if (hasBeenVisible && !sectionEngaged && !hasSkipBeenReported) {
          hasSkipBeenReported = true;
          onSectionSkipped?.(sectionKey, title, items.length);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(sectionRef.current);

    const setEngaged = () => {
      sectionEngaged = true;
    };

    const scroller = scrollerRef.current;
    scroller?.addEventListener('pointerdown', setEngaged, { passive: true });
    scroller?.addEventListener('keydown', setEngaged);

    return () => {
      observer.disconnect();
      scroller?.removeEventListener('pointerdown', setEngaged);
      scroller?.removeEventListener('keydown', setEngaged);
    };
  }, [items.length, onSectionSkipped, onSectionVisible, sectionKey, title]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const amount = Math.max(scroller.clientWidth * 0.82, 280);
    scroller.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByAmount('left');
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByAmount('right');
    }
  };

  return (
    <section ref={sectionRef} className="discovery-section" aria-label={title}>
      <div className="discovery-section-heading">
        <div>
          <p className="discovery-section-kicker">Browse</p>
          <h2 className="discovery-section-title">{title}</h2>
        </div>
        <div className="discovery-carousel-controls" aria-hidden={isLoading}>
          <button
            type="button"
            className="discovery-carousel-arrow"
            onClick={() => scrollByAmount('left')}
            aria-label={`Scroll ${title} left`}
            disabled={isLoading}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="discovery-carousel-arrow"
            onClick={() => scrollByAmount('right')}
            aria-label={`Scroll ${title} right`}
            disabled={isLoading}
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="discovery-carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : items.map((item, index) => (
              <PosterCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                sectionKey={sectionKey}
                position={index}
                onView={onCardView}
                onOpen={onCardOpen}
                onOpenTitle={onOpenTitle}
              />
            ))}
      </div>
    </section>
  );
};

export default ContentCarousel;
