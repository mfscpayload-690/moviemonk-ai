import React from 'react';
import { Link } from 'react-router-dom';
import { Logo, GithubIcon } from '../icons';
import { APP_VERSION } from '../../lib/appMeta';

export interface AppFooterProps {
  className?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({ className = '' }) => {
  return (
    <footer className={`w-full mt-8 sm:mt-10 border-t border-white/10 bg-neutral-950/40 ${className}`}>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        
        {/* Left: Brand Identity & Quiet Tagline */}
        <div className="flex flex-col sm:items-start items-center gap-1.5 text-center sm:text-left">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg group"
            aria-label="MovieMonk Discovery Home"
          >
            <Logo className="w-6 h-6 text-primary drop-shadow-glow flex-shrink-0 transition-transform group-hover:scale-105" />
            <span className="brand-signature title-font text-base font-bold tracking-tight select-none">
              <span className="brand-signature-movie">Movie</span>
              <span className="brand-signature-monk">Monk</span>
            </span>
          </Link>
          <p className="text-xs text-white/40">
            AI-powered cinematic discovery & curated archives
          </p>
        </div>

        {/* Right: Clean Text Navigation & Attributions */}
        <div className="flex flex-col sm:items-end items-center gap-2 text-center sm:text-right">
          <nav className="flex items-center gap-4 sm:gap-6 text-xs text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/watchlists" className="hover:text-white transition-colors">
              Watchlists
            </Link>
            <Link to="/settings" className="hover:text-white transition-colors">
              Settings
            </Link>
            <a
              href="https://github.com/mfscpayload-690/moviemonk-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              aria-label="GitHub Repository"
            >
              <GithubIcon className="w-3.5 h-3.5 text-white/60 hover:text-white" />
              <span>Contribute</span>
            </a>
          </nav>

          <div className="flex items-center gap-2 text-[11px] text-white/35 font-mono">
            <span>v{APP_VERSION}</span>
            <span>·</span>
            <span>MIT License</span>
            <span>·</span>
            <span className="font-semibold text-emerald-400/80">TMDB</span>
          </div>

          <p className="text-[10px] text-white/30 whitespace-nowrap leading-normal">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default AppFooter;
