import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, CheckIcon } from './icons';

export interface SeasonItem {
  number: number;
  label?: string;
  episodeCount?: number;
}

interface SeasonSelectorProps {
  seasons: SeasonItem[] | number;
  selectedSeason: number;
  onSelectSeason: (seasonNumber: number) => void;
  className?: string;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  seasons,
  selectedSeason,
  onSelectSeason,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const seasonList: SeasonItem[] = React.useMemo(() => {
    if (typeof seasons === 'number') {
      return Array.from({ length: Math.max(1, seasons) }, (_, i) => ({
        number: i + 1,
        label: `Season ${i + 1}`
      }));
    }
    return seasons;
  }, [seasons]);

  const currentSeason = seasonList.find((s) => s.number === selectedSeason) || seasonList[0];

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = (seasonNum: number) => {
    onSelectSeason(seasonNum);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const formatSeasonLabel = (item: SeasonItem) => {
    if (item.label) return item.label;
    if (typeof item.episodeCount === 'number') {
      return `Season ${item.number} • ${item.episodeCount} eps`;
    }
    return `Season ${item.number}`;
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full sm:w-auto appearance-none bg-brand-surface/70 hover:bg-brand-surface/90 border border-brand-primary/40 hover:border-brand-primary text-white font-semibold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-transparent cursor-pointer transition-all flex items-center justify-between gap-3 text-sm shadow-md"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Season"
      >
        <span className="truncate">
          {currentSeason ? formatSeasonLabel(currentSeason) : `Season ${selectedSeason}`}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-brand-text-dark transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-brand-primary' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Season list"
          className="absolute left-0 top-full mt-2 w-full sm:w-auto min-w-[180px] max-h-64 overflow-y-auto bg-neutral-950/95 backdrop-blur-2xl border border-white/12 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] p-1.5 z-50 animate-scale-up origin-top-left"
        >
          {seasonList.map((item) => {
            const isSelected = item.number === selectedSeason;
            return (
              <button
                key={item.number}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item.number)}
                className={`w-full text-left px-3.5 py-2 text-sm rounded-lg flex items-center justify-between gap-3 transition-colors ${
                  isSelected
                    ? 'bg-brand-primary/20 text-brand-primary font-semibold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="truncate">{formatSeasonLabel(item)}</span>
                {isSelected && (
                  <CheckIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeasonSelector;

