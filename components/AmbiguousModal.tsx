import React, { useEffect, useRef, useState } from 'react';

export interface Candidate {
  id: number;
  title: string;
  type: 'movie' | 'person' | 'review';
  score: number;
  url?: string;
  snippet?: string;
  image?: string;
  year?: string;
  language?: string;
  media_type?: string;
}

interface AmbiguousModalProps {
  candidates: Candidate[];
  onSelect: (c: Candidate) => void;
  onClose: () => void;
}

const AmbiguousModal: React.FC<AmbiguousModalProps> = ({ candidates, onSelect, onClose }) => {
  const [focused, setFocused] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'person' | 'review'>('all');
  const listRef = useRef<HTMLDivElement>(null);

  // Filter candidates based on selected type
  const filtered = filterType === 'all'
    ? candidates
    : candidates.filter(c => c.type === filterType);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocused((f) => (f + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocused((f) => (f - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(filtered[focused]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, focused, onSelect, onClose]);

  // Scroll into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${focused}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focused]);

  const typeIcon: Record<string, string> = {
    movie: '🎬',
    person: '👤',
    review: '⭐'
  };

  const typeColor: Record<string, string> = {
    movie: 'bg-pink-500/20 text-pink-300',
    person: 'bg-violet-500/20 text-violet-300',
    review: 'bg-yellow-500/20 text-yellow-300'
  };

  const typeCount = {
    all: candidates.length,
    movie: candidates.filter(c => c.type === 'movie').length,
    person: candidates.filter(c => c.type === 'person').length,
    review: candidates.filter(c => c.type === 'review').length
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden animate-fade-in modal-mobile-slide ambiguous-modal-mobile flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-black/20 flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text-light">Search Results</h2>
            <p className="text-sm text-brand-text-dark mt-1">Found {filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg hover:bg-white/10 transition touch-target"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/5 bg-black/10 flex gap-2 flex-shrink-0 overflow-x-auto">
          {['all', 'movie', 'person', 'review'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type as any);
                setFocused(0);
              }}
              className={`px-4 py-2.5 rounded-full font-semibold text-sm transition whitespace-nowrap filter-tab-mobile touch-target ${filterType === type
                ? 'bg-brand-primary text-white border border-brand-primary'
                : 'bg-white/5 text-brand-text-dark border border-white/10 hover:border-brand-primary/50 hover:bg-white/10'
                }`}
            >
              {typeIcon[type as string] || '\u2728'} {typeof type === 'string' && type.length > 0 ? type.charAt(0).toUpperCase() + type.slice(1) : ''} ({typeCount[type as keyof typeof typeCount]})
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto flex-1 overscroll-contain">
          <div className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-brand-text-dark">No results for this filter</p>
              </div>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={`${c.type}-${c.id}`}
                  data-idx={i}
                  onClick={() => onSelect(c)}
                  className={`w-full text-left px-4 sm:px-6 py-4 transition flex gap-3 sm:gap-4 items-start hover:bg-white/5 border-l-4 touch-target ${focused === i
                    ? 'border-l-brand-primary bg-brand-primary/10'
                    : 'border-l-transparent hover:border-l-brand-primary/50'
                    }`}
                  aria-selected={focused === i}
                >
                  {/* Thumbnail - larger on mobile */}
                  <div className="flex-shrink-0 w-20 h-28 sm:w-20 sm:h-28 ambiguous-thumb-mobile rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {c.image ? (
                      <img src={c.image} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-2xl sm:text-3xl">{typeIcon[c.type]}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-brand-text-light leading-tight">{c.title}</h3>
                      {c.year && (
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-brand-text-dark flex-shrink-0 mt-0.5">
                          {c.year}
                        </span>
                      )}
                    </div>

                    {/* Type & Language Badge */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColor[c.type]}`}>
                        {c.type.toUpperCase()}
                      </span>
                      {c.language && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {c.language}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                        {Math.round(c.score * 100)}% Match
                      </span>
                    </div>

                    {/* Snippet */}
                    {c.snippet && (
                      <p className="text-sm text-brand-text-dark line-clamp-2 mb-2">{c.snippet}</p>
                    )}

                    {/* URL */}
                    {c.url && (
                      <p className="text-xs text-brand-primary/70 truncate">{c.url}</p>
                    )}
                  </div>

                  {/* Select Button */}
                  <div className="flex-shrink-0">
                    <div className="px-3 py-2.5 rounded-lg bg-brand-primary/20 text-brand-primary font-semibold text-xs border border-brand-primary/30 hover:border-brand-primary/50 hover:bg-brand-primary/30 transition touch-target">
                      Select
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/5 bg-black/20 text-xs text-brand-text-dark flex-shrink-0 text-center sm:text-left">
          <span className="hidden sm:inline">💡 Tip: Use ↑ ↓ arrow keys to navigate, Enter to select, Esc to close</span>
          <span className="sm:hidden">💡 Tap to select a result</span>
        </div>
      </div>
    </div>
  );
};

export default AmbiguousModal;
