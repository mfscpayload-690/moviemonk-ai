import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  type: 'movie' | 'tv' | 'person';
  visible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ type, visible }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    setProgress(6);
    const startedAt = Date.now();
    const configByType = {
      movie: { target: 90, tauMs: 1700 },
      tv: { target: 88, tauMs: 1850 },
      person: { target: 94, tauMs: 1400 }
    } as const;
    const config = configByType[type];

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      // Ease toward a type-specific cap so progress feels realistic by content type.
      const eased = 6 + (config.target - 6) * (1 - Math.exp(-elapsed / config.tauMs));
      setProgress((current) => Math.max(current, Math.min(config.target, eased)));
    }, 120);

    return () => window.clearInterval(intervalId);
  }, [visible, type]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[3500] bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-label={`Loading ${type} details`}
    >
      {type === 'movie' && <MovieLoadingScreen progress={progress} />}
      {type === 'tv' && <TVLoadingScreen progress={progress} />}
      {type === 'person' && <PersonLoadingScreen progress={progress} />}
    </div>
  );
};

const LoadingProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full mt-1.5">
    <div className="w-56 max-w-[72vw] h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
    <p className="text-[11px] text-brand-text-muted mt-1.5 text-center tabular-nums">
      {Math.max(1, Math.round(progress))}% loaded
    </p>
  </div>
);

/**
 * Movie Loading Screen - Film Reel Spinner
 * Features a cinematic film reel with spinning animation
 */
const MovieLoadingScreen: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="glass-panel px-8 py-8 rounded-2xl shadow-2xl border border-white/15 flex flex-col items-center gap-4">
    {/* Film Reel Container */}
    <div className="relative w-20 h-20 flex items-center justify-center">
      {/* Outer reel - main spin */}
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary border-r-brand-primary animate-spin"
        style={{ animation: 'spin 3s linear infinite' }} />
      
      {/* Middle accent glow */}
      <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-brand-accent/60"
        style={{ animation: 'spin 2s linear infinite reverse' }} />
      
      {/* Center dot */}
      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent shadow-lg"
        style={{ boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)' }} />

      {/* Film strip indicators */}
      <div className="absolute inset-8 rounded-full border border-brand-primary/20" 
        style={{ animation: 'pulse 2s ease-in-out infinite' }} />
    </div>

    {/* Loading text with icon */}
    <div className="flex flex-col items-center gap-2">
      <p className="text-base font-semibold text-brand-text-main">Finding the perfect film</p>
      <p className="text-sm text-brand-text-muted animate-pulse">Loading movie details...</p>
    </div>

    <LoadingProgressBar progress={progress} />
  </div>
);

/**
 * TV Show Loading Screen - Scanning CRT Effect
 * Features a TV screen with animated scanning lines
 */
const TVLoadingScreen: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="glass-panel px-8 py-8 rounded-2xl shadow-2xl border border-white/15 flex flex-col items-center gap-4">
    {/* TV Screen Container */}
    <div className="relative w-24 h-20 bg-black rounded-lg border-4 border-brand-accent/40 overflow-hidden"
      style={{
        boxShadow: 'inset 0 0 20px rgba(219, 39, 119, 0.2), 0 0 30px rgba(219, 39, 119, 0.3)'
      }}>
      {/* Scanning lines - animated top to bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-accent/10 to-transparent"
        style={{
          animation: 'scanlines 8s linear infinite',
          backgroundSize: '100% 4px'
        }} />
      
      {/* Screen glow effect */}
      <div className="absolute inset-0 animate-pulse rounded-sm"
        style={{
          backgroundColor: 'rgba(219, 39, 119, 0.1)',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      
      {/* Horizontal frequency lines */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent"
        style={{ animation: 'flicker 0.15s infinite' }} />
    </div>

    {/* Loading text */}
    <div className="flex flex-col items-center gap-2">
      <p className="text-base font-semibold text-brand-text-main">Tuning to the series</p>
      <p className="text-sm text-brand-text-muted animate-pulse">Loading TV show details...</p>
    </div>

    {/* Signal strength indicator */}
    <div className="flex gap-1.5 mt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 rounded-full bg-brand-accent/60"
          style={{
            height: `${8 + i * 4}px`,
            animation: `signalBounce 0.6s ease-in-out ${i * 0.1}s infinite`
          }}
        />
      ))}
    </div>

    <LoadingProgressBar progress={progress} />
  </div>
);

/**
 * Person Loading Screen - Portrait Shimmer
 * Features a portrait frame with elegant shimmer effect
 */
const PersonLoadingScreen: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="glass-panel px-8 py-8 rounded-2xl shadow-2xl border border-white/15 flex flex-col items-center gap-4">
    {/* Portrait Frame */}
    <div className="relative w-24 h-32 rounded-lg border-2 border-brand-primary/40 overflow-hidden bg-gradient-to-b from-brand-primary/5 to-brand-accent/5"
      style={{
        boxShadow: '0 0 30px rgba(124, 58, 237, 0.3), inset 0 0 20px rgba(124, 58, 237, 0.1)'
      }}>
      {/* Shimmer effect - moves across the portrait */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{
          animation: 'mm-loading-shimmer 2s infinite',
          transform: 'skewX(-20deg)'
        }}
      />
      
      {/* Inner frame highlight */}
      <div className="absolute inset-1 border border-brand-accent/30 rounded-md"
        style={{ animation: 'pulse 2s ease-in-out infinite' }} />
      
      {/* Subtle pulse glow */}
      <div className="absolute inset-0 rounded-lg"
        style={{
          animation: 'innerPulse 3s ease-in-out infinite',
          boxShadow: 'inset 0 0 20px rgba(219, 39, 119, 0.15)'
        }} />
    </div>

    {/* Loading text */}
    <div className="flex flex-col items-center gap-2">
      <p className="text-base font-semibold text-brand-text-main">Discovering talent</p>
      <p className="text-sm text-brand-text-muted animate-pulse">Loading person details...</p>
    </div>

    {/* Profile indicator dots */}
    <div className="flex gap-2 mt-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
          style={{
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
    </div>

    <LoadingProgressBar progress={progress} />
  </div>
);

export default LoadingScreen;

/**
 * Styles for animations - add to your CSS file
 * @keyframes scanlines
 * @keyframes flicker
 * @keyframes signalBounce
 * @keyframes shimmer
 * @keyframes innerPulse
 * @keyframes dotPulse
 */
