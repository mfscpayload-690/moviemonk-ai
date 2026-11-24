import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MovieData, SoundtrackTrack } from '../types';
import { fetchTitleSoundtrack } from '../services/soundtrackService';
import { PlayIcon, PauseIcon, SpotifyIcon, YouTubeIcon, MusicIcon } from './icons';

interface SoundtrackSectionProps {
  movie: MovieData;
}

type ViewMode = 'list' | 'detailed';

export const SoundtrackSection: React.FC<SoundtrackSectionProps> = ({ movie }) => {
  const [tracks, setTracks] = useState<SoundtrackTrack[]>([]);
  const [fallbackLinks, setFallbackLinks] = useState<{ spotifyUrl: string; youtubeUrl: string }>({
    spotifyUrl: '',
    youtubeUrl: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const composer = movie.crew?.music && movie.crew.music !== 'Unknown' ? movie.crew.music : '';

  // Fetch soundtrack data whenever the title/year changes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadSoundtrack() {
      setIsLoading(true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingTrackId(null);
      setIsAudioLoading(false);

      try {
        const result = await fetchTitleSoundtrack({
          title: movie.title,
          originalTitle: movie.original_title,
          releaseYear: movie.year,
          composer,
          signal: controller.signal,
        });

        if (isMounted) {
          setTracks(result.tracks);
          setFallbackLinks(result.fallbackLinks);
        }
      } catch (err) {
        if (isMounted) {
          setTracks([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSoundtrack();

    return () => {
      isMounted = false;
      controller.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [movie.title, movie.original_title, movie.year, composer]);

  // Audio Playback Controller
  const handleTogglePlay = useCallback((track: SoundtrackTrack) => {
    if (!track.previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    // Toggle off if currently playing this exact track
    if (playingTrackId === track.id) {
      audio.pause();
      audio.oncanplay = null;
      audio.onended = null;
      audio.onerror = null;
      setPlayingTrackId(null);
      setIsAudioLoading(false);
      return;
    }

    // Switch or start new track: cancel any pending handlers
    audio.pause();
    audio.oncanplay = null;
    audio.onended = null;
    audio.onerror = null;

    setIsAudioLoading(true);
    setPlayingTrackId(track.id);
    audio.src = track.previewUrl;

    const targetTrackId = track.id;

    const onCanPlay = () => {
      // Ensure the user hasn't cancelled or switched tracks in the meantime
      if (audioRef.current && targetTrackId === track.id) {
        setIsAudioLoading(false);
        audio.play().catch((err) => {
          console.warn('[MovieMonk AI] Playback error:', err);
          setPlayingTrackId(null);
          setIsAudioLoading(false);
        });
      }
    };

    const onEnded = () => {
      setPlayingTrackId(null);
      setIsAudioLoading(false);
    };

    const onError = () => {
      console.warn('[MovieMonk AI] Audio stream error for track:', track.title);
      setPlayingTrackId(null);
      setIsAudioLoading(false);
    };

    audio.oncanplay = onCanPlay;
    audio.onended = onEnded;
    audio.onerror = onError;

    audio.load();
  }, [playingTrackId]);

  // Tier 3: No tracks and no composer credit found -> Render nothing seamlessly
  if (!isLoading && tracks.length === 0 && !composer) {
    return null;
  }

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="glass-panel p-6 rounded-2xl animate-slide-up content-visibility-auto space-y-4">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white border-b border-white/5 pb-3 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
          Soundtrack & Music
        </h2>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/10" />
                <div className="space-y-2">
                  <div className="h-4 w-32 md:w-48 bg-white/10 rounded" />
                  <div className="h-3 w-24 md:w-36 bg-white/5 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5" />
                <div className="w-8 h-8 rounded-lg bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tier 2: No album indexed on iTunes, but composer is known
  if (tracks.length === 0 && composer) {
    return (
      <div className="glass-panel p-6 rounded-2xl animate-slide-up content-visibility-auto space-y-4">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white border-b border-white/5 pb-3 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
          Soundtrack & Music
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Original score composed by <span className="text-brand-primary font-bold">{composer}</span>
            </p>
            <p className="text-xs text-brand-text-dark">
              Listen to the original motion picture score and tracks on your preferred platform.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {fallbackLinks.spotifyUrl && (
              <a
                href={fallbackLinks.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-[#1DB954]/20 hover:border-[#1DB954]/40 hover:text-[#1DB954] text-xs font-semibold text-brand-text-light transition-all duration-200 touch-target"
                title="Search on Spotify"
              >
                <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                <span>Spotify</span>
              </a>
            )}
            {fallbackLinks.youtubeUrl && (
              <a
                href={fallbackLinks.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-[#FF0000]/20 hover:border-[#FF0000]/40 hover:text-[#FF0000] text-xs font-semibold text-brand-text-light transition-all duration-200 touch-target"
                title="Search on YouTube"
              >
                <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />
                <span>YouTube</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tier 1: Verified tracks available
  const visibleTracks = isExpanded ? tracks : tracks.slice(0, 4);

  return (
    <div className="glass-panel p-6 rounded-2xl animate-slide-up content-visibility-auto space-y-4">
      {/* Section Header with Title, Count, Score, and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
          Soundtrack & Music
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary font-medium border border-brand-primary/30 ml-2">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </span>
        </h2>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {composer && (
            <span className="text-xs text-brand-text-dark hidden md:inline-block">
              Score: <span className="text-brand-text-light font-medium">{composer}</span>
            </span>
          )}

          {/* View Mode Toggle Button Group */}
          <div
            className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-0.5"
            role="group"
            aria-label="Soundtrack view style"
          >
            {/* List View */}
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                viewMode === 'list'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-text-dark hover:text-white hover:bg-white/5'
              }`}
              title="List View"
              aria-pressed={viewMode === 'list'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
                <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
                <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
                <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              <span>List</span>
            </button>

            {/* Detailed Cards View */}
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                viewMode === 'detailed'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-text-dark hover:text-white hover:bg-white/5'
              }`}
              title="Detailed Cards View"
              aria-pressed={viewMode === 'detailed'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Detailed</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. LIST VIEW ──────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-2.5">
          {visibleTracks.map((track) => {
            const isPlaying = playingTrackId === track.id;
            const hasPreview = Boolean(track.previewUrl);

            return (
              <div
                key={track.id}
                className={`flex items-center justify-between p-2.5 md:p-3 rounded-xl border transition-all duration-200 ${
                  isPlaying
                    ? 'border-brand-primary/50 bg-brand-primary/10 shadow-lg shadow-brand-primary/5'
                    : 'border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Left: Album cover art + Play overlay */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-brand-surface group">
                    {track.coverArt ? (
                      <img
                        src={track.coverArt}
                        alt={track.album || track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 text-brand-text-dark">
                        <MusicIcon className="w-6 h-6" />
                      </div>
                    )}

                    {hasPreview && (
                      <button
                        onClick={() => handleTogglePlay(track)}
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                          isPlaying
                            ? 'bg-black/60 opacity-100'
                            : 'bg-black/40 md:opacity-0 hover:opacity-100 md:group-hover:opacity-100 opacity-90'
                        }`}
                        aria-label={isPlaying ? `Pause ${track.title}` : `Play 30s preview of ${track.title}`}
                        title={isPlaying ? 'Pause' : 'Play 30s Preview'}
                      >
                        <div
                          className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white transition-transform ${
                            isPlaying
                              ? 'bg-brand-primary ring-2 ring-brand-primary/60 animate-pulse scale-105'
                              : 'bg-white/30 backdrop-blur-sm hover:scale-110 hover:bg-brand-primary'
                          }`}
                        >
                          {isPlaying ? (
                            isAudioLoading ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <PauseIcon className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <PlayIcon className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Center: Track title, artist, and album */}
                  <div className="min-w-0">
                    <h4
                      className={`text-sm md:text-base font-semibold truncate ${
                        isPlaying ? 'text-brand-primary' : 'text-white'
                      }`}
                      title={track.title}
                    >
                      {track.title}
                    </h4>
                    <p className="text-xs text-brand-text-dark truncate mt-0.5" title={`${track.artist} • ${track.album}`}>
                      <span className="text-brand-text-light">{track.artist}</span>
                      {track.album && <span className="opacity-60"> • {track.album}</span>}
                    </p>
                  </div>
                </div>

                {/* Right: Duration + Spotify / YouTube Deep Links */}
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  {track.duration && (
                    <span className="text-xs font-mono text-brand-text-dark hidden sm:inline-block">
                      {track.duration}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 md:px-2.5 md:py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-[#1DB954]/20 hover:border-[#1DB954]/40 hover:text-[#1DB954] text-brand-text-dark transition-all duration-200 touch-target flex items-center gap-1"
                      title="Listen on Spotify"
                      aria-label={`Listen to ${track.title} on Spotify`}
                    >
                      <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                      <span className="text-xs font-semibold text-brand-text-light hidden md:inline">Spotify</span>
                    </a>
                    <a
                      href={track.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 md:px-2.5 md:py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-[#FF0000]/20 hover:border-[#FF0000]/40 hover:text-[#FF0000] text-brand-text-dark transition-all duration-200 touch-target flex items-center gap-1"
                      title="Watch on YouTube"
                      aria-label={`Listen to ${track.title} on YouTube`}
                    >
                      <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />
                      <span className="text-xs font-semibold text-brand-text-light hidden md:inline">YouTube</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 2. DETAILED (CARDS / GRID) VIEW (ENLARGED) ─────────────────────────── */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleTracks.map((track) => {
            const isPlaying = playingTrackId === track.id;
            const hasPreview = Boolean(track.previewUrl);

            return (
              <div
                key={track.id}
                className={`flex flex-col justify-between p-4 md:p-5 rounded-2xl border transition-all duration-200 ${
                  isPlaying
                    ? 'border-brand-primary/50 bg-brand-primary/10 shadow-lg shadow-brand-primary/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Header row inside card */}
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-white/10 bg-brand-surface flex-shrink-0 group shadow-md">
                    {track.coverArt ? (
                      <img
                        src={track.coverArt}
                        alt={track.album || track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 text-brand-text-dark">
                        <MusicIcon className="w-8 h-8" />
                      </div>
                    )}

                    {hasPreview && (
                      <button
                        onClick={() => handleTogglePlay(track)}
                        className={`absolute inset-0 flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-black/60 opacity-100'
                            : 'bg-black/40 hover:opacity-100 opacity-90'
                        }`}
                        title={isPlaying ? 'Pause' : 'Play 30s Preview'}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            isPlaying
                              ? 'bg-brand-primary ring-2 ring-brand-primary/60 animate-pulse scale-105'
                              : 'bg-white/30 backdrop-blur-sm hover:bg-brand-primary hover:scale-105'
                          }`}
                        >
                          {isPlaying ? (
                            isAudioLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <PauseIcon className="w-4 h-4" />
                            )
                          ) : (
                            <PlayIcon className="w-4 h-4 ml-0.5" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <h4
                      className={`text-base md:text-lg font-bold truncate ${
                        isPlaying ? 'text-brand-primary' : 'text-white'
                      }`}
                      title={track.title}
                    >
                      {track.title}
                    </h4>
                    <p className="text-sm font-medium text-brand-text-light truncate mt-1" title={track.artist}>
                      {track.artist}
                    </p>
                    {track.album && (
                      <p className="text-xs text-brand-text-dark truncate mt-0.5 opacity-80" title={track.album}>
                        {track.album}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer row inside card */}
                <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-white/5">
                  <span className="text-xs font-mono text-brand-text-dark font-medium">
                    {track.duration || '30s preview'}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-[#1DB954]/20 hover:border-[#1DB954]/40 hover:text-[#1DB954] text-brand-text-light transition-all flex items-center gap-1.5 text-xs font-semibold touch-target"
                      title="Listen on Spotify"
                    >
                      <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                      <span>Spotify</span>
                    </a>
                    <a
                      href={track.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-[#FF0000]/20 hover:border-[#FF0000]/40 hover:text-[#FF0000] text-brand-text-light transition-all flex items-center gap-1.5 text-xs font-semibold touch-target"
                      title="Watch on YouTube"
                    >
                      <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />
                      <span>YouTube</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expand/Collapse Toggle when more than 4 tracks exist */}
      {tracks.length > 4 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs text-white font-semibold transition-all duration-200 touch-target"
          >
            {isExpanded ? (
              <>
                Show less
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              </>
            ) : (
              <>
                Show all tracks ({tracks.length})
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
export default SoundtrackSection;
