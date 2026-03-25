import React, { useRef } from 'react';
import { DiscoveryItem } from '../types';
import PosterCard from './PosterCard';
import SkeletonCard from './SkeletonCard';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface ContentCarouselProps {
  title: string;
  items: DiscoveryItem[];
  isLoading?: boolean;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({ title, items, isLoading = false, onOpenTitle }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

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
    <section className="discovery-section" aria-label={title}>
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
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="discovery-carousel-arrow"
            onClick={() => scrollByAmount('right')}
            aria-label={`Scroll ${title} right`}
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
          : items.map((item) => (
              <PosterCard key={`${item.media_type}-${item.id}`} item={item} onOpenTitle={onOpenTitle} />
            ))}
      </div>
    </section>
  );
};

export default ContentCarousel;
