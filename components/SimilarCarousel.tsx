import React, { useState } from 'react';
import { RelatedTitle } from '../types';

interface SimilarCarouselProps {
  label: string;
  items: RelatedTitle[];
  onOpenAll: () => void;
  onSelectTitle: (title: string) => void;
}

const SimilarCarousel: React.FC<SimilarCarouselProps> = ({ label, items, onOpenAll, onSelectTitle }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!items || items.length === 0) return null;

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
          <button
            key={`${it.media_type}-${it.id}-${idx}`}
            className="flex-shrink-0 w-28 sm:w-32 text-left group"
            onMouseEnter={() => setHoverIndex(idx)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => onSelectTitle(it.title)}
            aria-label={`Open ${it.title}${it.year ? ` (${it.year})` : ''}`}
          >
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5">
              {it.poster_url ? (
                <img src={it.poster_url} alt={`${it.title} poster`} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
              <div className={`absolute inset-0 transition ${hoverIndex === idx ? 'bg-black/20' : 'bg-transparent'}`} />
            </div>
            <p className="mt-2 text-xs font-semibold text-white line-clamp-2">{it.title}</p>
            {it.year && <p className="text-[11px] text-brand-text-dark">{it.year}</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimilarCarousel;