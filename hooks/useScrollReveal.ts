import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type RevealVariant = 'rise-up' | 'fade' | 'slide-in' | 'scale-up' | 'tilt-in';

interface UseScrollRevealOptions {
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
  initialVisible?: boolean;
}

export type RevealStyle = CSSProperties & {
  '--mm-reveal-delay'?: string;
  '--mm-reveal-duration'?: string;
};

export function buildRevealStyle(delayMs = 0, durationMs = 420): RevealStyle {
  return {
    '--mm-reveal-delay': `${delayMs}ms`,
    '--mm-reveal-duration': `${durationMs}ms`
  };
}

export function getRevealClassName(
  isRevealed: boolean,
  variant: RevealVariant = 'rise-up',
  className = ''
): string {
  return `mm-reveal ${isRevealed ? 'is-revealed' : ''} ${className}`.trim();
}

export function useScrollReveal<T extends Element>({
  once = true,
  threshold = 0.16,
  rootMargin = '0px 0px -8% 0px',
  initialVisible = false
}: UseScrollRevealOptions = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [isRevealed, setIsRevealed] = useState(initialVisible);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((nextNode: T | null) => {
    setNode(nextNode);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const appReducedMotion = document.documentElement.dataset.motion === 'reduced';
    if (reducedMotionQuery.matches || appReducedMotion) {
      setIsRevealed(true);
      return;
    }

    if (!node || typeof IntersectionObserver === 'undefined') {
      if (node) setIsRevealed(true);
      return;
    }

    if (once && isRevealed) {
      return;
    }

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (once) {
            observerRef.current?.disconnect();
          }
          return;
        }

        if (!once) {
          setIsRevealed(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [isRevealed, node, once, rootMargin, threshold]);

  return { ref, isRevealed };
}
