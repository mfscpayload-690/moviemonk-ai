import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Film, User, Star, Lightbulb } from 'lucide-react';
import { buildPersonCardPresentation, sortPersonShortlist } from '../services/personPresentation';

export interface Candidate {
  id: number;
  title: string;
  type: 'movie' | 'person' | 'review';
  score: number;
  confidence?: number;
  url?: string;
  snippet?: string;
  image?: string;
  year?: string;
  language?: string;
  media_type?: string;
  popularity?: number;
  role_match?: 'match' | 'mismatch' | 'neutral';
  known_for_department?: string;
  known_for_titles?: string[];
}

interface AmbiguousModalProps {
  candidates: Candidate[];
  onSelect: (c: Candidate) => void;
  onClose: () => void;
  mode?: 'default' | 'person-shortlist';
}

const AmbiguousModal: React.FC<AmbiguousModalProps> = ({ candidates, onSelect, onClose, mode = 'default' }) => {
  const [focused, setFocused] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'person' | 'review'>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const isPersonShortlist = mode === 'person-shortlist';

  // Keep the background page fixed while this modal is open so wheel/trackpad
  // gestures are applied to the modal list instead of the page beneath.
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Filter candidates based on selected type
  const filtered = isPersonShortlist
    ? sortPersonShortlist(candidates.filter(c => c.type === 'person'))
    : filterType === 'all'
    ? candidates
    : candidates.filter(c => c.type === filterType);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filtered.length === 0) return;
        setFocused((f) => (f + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filtered.length === 0) return;
        setFocused((f) => (f - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered.length === 0) return;
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

  const updateScrollAffordance = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setHasOverflow(false);
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const threshold = 2;
    const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const overflow = maxScrollTop > threshold;
    setHasOverflow(overflow);
    setCanScrollUp(overflow && el.scrollTop > threshold);
    setCanScrollDown(overflow && el.scrollTop < maxScrollTop - threshold);
  }, []);

  useEffect(() => {
    updateScrollAffordance();
  }, [filtered.length, updateScrollAffordance]);

  useEffect(() => {
    const handleResize = () => updateScrollAffordance();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollAffordance]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie': return <Film size={24} />;
      case 'person': return <User size={24} />;
      case 'review': return <Star size={24} />;
      default: return <Film size={24} />;
    }
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
    <div className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden animate-fade-in modal-mobile-slide ambiguous-modal-mobile ambiguous-modal-editorial flex flex-col max-h-[94vh] sm:max-h-[88vh] sm:my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-black/20 flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text-light">
              {isPersonShortlist ? 'Choose the right person' : 'Search Results'}
            </h2>
            <p className="text-sm text-brand-text-dark mt-1">
              {isPersonShortlist
                ? `Found ${filtered.length} matching people`
                : `Found ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            </p>
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
        {!isPersonShortlist && (
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
                <span className="flex items-center gap-1">
                  {getTypeIcon(type as string)}
                  <span>{typeof type === 'string' && type.length > 0 ? type.charAt(0).toUpperCase() + type.slice(1) : ''} ({typeCount[type as keyof typeof typeCount]})</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={listRef}
            className="overflow-y-auto h-full overscroll-contain"
            onScroll={updateScrollAffordance}
          >
            <div className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-brand-text-dark">No results for this filter</p>
              </div>
            ) : (
              filtered.map((c, i) => {
                const personCard = c.type === 'person'
                  ? buildPersonCardPresentation({
                      name: c.title,
                      profile_url: c.image,
                      known_for_department: c.known_for_department,
                      known_for_titles: c.known_for_titles
                    })
                  : null;

                return (
                  <button
                    key={`${c.type}-${c.id}`}
                    data-idx={i}
                    onClick={() => onSelect(c)}
                    className={`w-full text-left px-4 py-4 sm:px-6 sm:py-4 ${isPersonShortlist ? 'sm:px-7 sm:py-5 sm:gap-5' : 'sm:gap-4'} transition-colors duration-150 flex gap-3 items-start hover:bg-white/5 border-l-4 touch-target ${focused === i
                      ? 'border-l-brand-primary bg-brand-primary/10'
                      : 'border-l-transparent hover:border-l-brand-primary/50'
                      }`}
                    aria-selected={focused === i}
                  >
                  {/* Thumbnail - larger on mobile */}
                  <div className={`flex-shrink-0 w-20 h-28 ${isPersonShortlist ? 'sm:w-24 sm:h-32' : 'sm:w-20 sm:h-28'} ambiguous-thumb-mobile rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center overflow-hidden border border-white/10`}>
                    {c.image ? (
                      <img src={c.image} alt={c.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="text-brand-primary/60">
                        {getTypeIcon(c.type)}
                      </div>
                    )}
                  </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className={`flex items-start gap-2 ${isPersonShortlist ? 'mb-3' : 'mb-2'}`}>
                      <h3 className="font-semibold text-lg text-brand-text-light leading-tight">{c.title}</h3>
                      {c.year && (
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-brand-text-dark flex-shrink-0 mt-0.5">
                          {c.year}
                        </span>
                      )}
                    </div>

                    {/* Type & Language Badge */}
                    <div className={`flex gap-2 ${isPersonShortlist ? 'mb-4' : 'mb-3'} flex-wrap`}>
                      {!isPersonShortlist && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColor[c.type]}`}>
                          {c.type.toUpperCase()}
                        </span>
                      )}
                      {isPersonShortlist && personCard && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-200">
                          {personCard.roleChip}
                        </span>
                      )}
                      {isPersonShortlist && c.role_match && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.role_match === 'match'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : c.role_match === 'mismatch'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-white/10 text-brand-text-dark'
                        }`}>
                          {c.role_match === 'match' ? 'Role match' : c.role_match === 'mismatch' ? 'Role mismatch' : 'Role neutral'}
                        </span>
                      )}
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
                    {(c.snippet || personCard?.snippet) && (
                      <p className="text-sm text-brand-text-dark line-clamp-2 mb-2">
                        {c.snippet || personCard?.snippet}
                      </p>
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
                );
              })
            )}
            </div>
          </div>

          {hasOverflow && canScrollUp && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/65 to-transparent z-10"
            />
          )}
          {hasOverflow && canScrollDown && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/75 to-transparent z-10"
              />
              <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-20 flex justify-center">
                <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-black/50 border border-white/10 text-brand-text-dark">
                  Scroll for more
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/5 bg-black/20 text-xs text-brand-text-dark flex-shrink-0 text-center sm:text-left">
          <div className="hidden sm:flex items-start gap-2 justify-center sm:justify-start leading-5">
            <Lightbulb size={14} className="flex-shrink-0 mt-[1px]" />
            {isPersonShortlist ? 'Tip: choose the exact person profile you mean, then continue.' : 'Tip: Use'}
            <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono">↑↓</kbd>
            {!isPersonShortlist && (
              <>
                arrow keys to navigate,
                <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono">⏎</kbd>
                to select,
                <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono">Esc</kbd>
                to close
              </>
            )}
          </div>
          <div className="sm:hidden flex items-start gap-2 justify-center leading-5">
            <Lightbulb size={14} className="flex-shrink-0 mt-[1px]" />
            {isPersonShortlist ? 'Tap the right person to continue' : 'Tap to select a result'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbiguousModal;
