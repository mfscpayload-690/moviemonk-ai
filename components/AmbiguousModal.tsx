import React, { useEffect, useRef, useState } from 'react';

export interface Candidate {
  id: number;
  name: string;
  type: 'movie' | 'person';
  score: number;
}

interface AmbiguousModalProps {
  candidates: Candidate[];
  onSelect: (c: Candidate) => void;
  onClose: () => void;
}

const typeIcon = (type: 'movie' | 'person') => (type === 'person' ? '👤' : '🎬');

const AmbiguousModal: React.FC<AmbiguousModalProps> = ({ candidates, onSelect, onClose }) => {
  const [focused, setFocused] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocused((f) => (f + 1) % candidates.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocused((f) => (f - 1 + candidates.length) % candidates.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(candidates[focused]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [candidates, focused, onSelect, onClose]);

  // Scroll into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${focused}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focused]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="amb-title">
      <div className="w-full max-w-lg bg-brand-surface border border-white/10 rounded-xl shadow-2xl p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 id="amb-title" className="text-lg font-semibold">Which one did you mean?</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10 transition" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-xs text-brand-text-dark mb-2">Use ↑ ↓ to navigate, Enter to select, Esc to close.</p>
        <div ref={listRef} className="space-y-2 max-h-[60vh] overflow-y-auto">
          {candidates.map((c, i) => (
            <button
              key={`${c.type}-${c.id}`}
              data-idx={i}
              onClick={() => onSelect(c)}
              className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-center gap-3 ${focused === i ? 'border-brand-primary bg-brand-primary/10' : 'border-white/10 hover:border-brand-primary/50 hover:bg-white/5'}`}
              aria-selected={focused === i}
            >
              <span className="text-xl" role="img" aria-label={c.type}>{typeIcon(c.type)}</span>
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="flex items-center gap-2 text-xs text-brand-text-dark">
                  <span className={`px-1.5 py-0.5 rounded ${c.type === 'person' ? 'bg-violet-500/20 text-violet-300' : 'bg-pink-500/20 text-pink-300'}`}>{c.type.toUpperCase()}</span>
                  <span>score {Math.round(c.score * 100)}%</span>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-white/10">Select</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AmbiguousModal;
