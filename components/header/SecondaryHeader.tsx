import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../icons';

export interface SecondaryHeaderProps {
  title?: string;
  backLabel?: string;
  backTo?: string;
  onBack?: () => void;
  className?: string;
  rightContent?: React.ReactNode;
}

export const SecondaryHeader: React.FC<SecondaryHeaderProps> = ({
  title,
  backLabel = 'Back to app',
  backTo = '/',
  onBack,
  className = '',
  rightContent
}) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollbarOffset, setScrollbarOffset] = useState(0);

  // Measure scrollbar gutter for symmetry
  useEffect(() => {
    const measureScrollbar = () => {
      const scrollEl = document.querySelector('.main-content') as HTMLElement | null;
      if (scrollEl && scrollEl.offsetWidth > scrollEl.clientWidth) {
        setScrollbarOffset(scrollEl.offsetWidth - scrollEl.clientWidth);
      } else {
        const offset = window.innerWidth - document.documentElement.clientWidth;
        setScrollbarOffset(offset > 0 ? offset : 0);
      }
    };

    measureScrollbar();
    window.addEventListener('resize', measureScrollbar, { passive: true });

    return () => window.removeEventListener('resize', measureScrollbar);
  }, []);

  // Monitor scroll on window and container
  useEffect(() => {
    const handleScroll = () => {
      const scrollEl = document.querySelector('.main-content');
      const scrollTop = scrollEl && scrollEl.scrollTop > 0 ? scrollEl.scrollTop : window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    const scrollEl = document.querySelector('.main-content');
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backTo);
    }
  };

  return (
    <header
      style={{
        right: `${scrollbarOffset}px`,
      }}
      className={`app-header sticky top-0 z-50 transition-all duration-300 ease-out flex items-center justify-between gap-3 mx-2.5 sm:mx-4 md:mx-5 mt-2 sm:mt-2.5 py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-2xl backdrop-blur-xl border border-white/10 border-t-white/20 ${
        isScrolled
          ? 'is-scrolled bg-neutral-950/90 shadow-[0_12px_40px_rgba(0,0,0,0.7)] border-white/15'
          : 'bg-neutral-950/65 shadow-[0_8px_32px_rgba(0,0,0,0.45)]'
      } ${className}`}
    >
      {/* Left: Brand Logo & Wordmark */}
      <div className="flex items-center justify-start flex-shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg flex-shrink-0"
          aria-label="Go to discovery home"
        >
          <Logo className="w-8 h-8 sm:w-9 sm:h-9 text-primary drop-shadow-glow flex-shrink-0" />
          <h1 className="brand-signature title-font text-lg sm:text-2xl font-bold tracking-tight select-none hidden md:inline-flex" aria-label="MovieMonk">
            <span className="brand-signature-movie">Movie</span>
            <span className="brand-signature-monk">Monk</span>
          </h1>
        </Link>
      </div>

      {/* Center: Optional Title */}
      {title && (
        <div className="flex-1 flex justify-center min-w-0 px-2">
          <span className="text-sm sm:text-base font-semibold text-white/90 truncate tracking-tight">
            {title}
          </span>
        </div>
      )}

      {/* Right: Back Action or Custom Content */}
      <div className="flex items-center justify-end gap-2 flex-shrink-0">
        {rightContent ? (
          rightContent
        ) : onBack ? (
          <button
            type="button"
            onClick={handleBackClick}
            className="group flex items-center gap-1.5 sm:gap-2 h-9 px-3 sm:px-3.5 rounded-full text-xs sm:text-sm font-medium text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 shadow-sm cursor-pointer"
            aria-label={backLabel}
          >
            <ArrowLeft className="w-4 h-4 text-white/60 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-200" />
            <span>{backLabel}</span>
          </button>
        ) : (
          <Link
            to={backTo}
            className="group flex items-center gap-1.5 sm:gap-2 h-9 px-3 sm:px-3.5 rounded-full text-xs sm:text-sm font-medium text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 shadow-sm"
            aria-label={backLabel}
          >
            <ArrowLeft className="w-4 h-4 text-white/60 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-200" />
            <span>{backLabel}</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default SecondaryHeader;
