import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  RotateCw, 
  X, 
  Settings,
  ChevronDown
} from 'lucide-react';

interface CustomVideoPlayerProps {
  url: string;
  onClose: () => void;
  title?: string;
  autoplay?: boolean;
}

const loadYoutubeAPI = (): Promise<any> => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve(window.YT);
      }
    }, 100);

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  });
};

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match && match[1] ? match[1] : null;
};

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  url,
  onClose,
  title = 'Trailer',
  autoplay = true
}) => {
  const videoId = extractYouTubeId(url);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  
  // React state
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bufferedFraction, setBufferedFraction] = useState(0);

  // Hover progress tracker state
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showHoverTooltip, setShowHoverTooltip] = useState(false);

  // Visual indicator for play/pause flashes
  const [actionIndicator, setActionIndicator] = useState<'play' | 'pause' | null>(null);

  // Keep references to state to prevent duplicate player initialization
  const isPlayingRef = useRef(false);
  const isReadyRef = useRef(false);
  const isDraggingRef = useRef(false);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const actionIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state refs
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  // Keep controls active on mouse movement
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Only auto-hide if playing
    if (isPlayingRef.current) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  }, []);

  // Formatter: seconds -> MM:SS
  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return '0:00';
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Trigger visual flash indicator
  const triggerVisualIndicator = useCallback((type: 'play' | 'pause') => {
    if (actionIndicatorTimeoutRef.current) {
      clearTimeout(actionIndicatorTimeoutRef.current);
    }
    setActionIndicator(type);
    actionIndicatorTimeoutRef.current = setTimeout(() => {
      setActionIndicator(null);
    }, 650);
  }, []);

  // Play / Pause toggler
  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      if (isPlayingRef.current) {
        playerRef.current.pauseVideo();
        triggerVisualIndicator('pause');
      } else {
        playerRef.current.playVideo();
        triggerVisualIndicator('play');
      }
    } catch (e) {
      console.error('Error toggling play/pause:', e);
    }
  }, [triggerVisualIndicator]);

  // Skip time helper
  const handleSkip = useCallback((seconds: number) => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      const destTime = Math.max(0, Math.min(duration, currentTime + seconds));
      playerRef.current.seekTo(destTime, true);
      setCurrentTime(destTime);
    } catch (e) {
      console.error('Error seeking video:', e);
    }
  }, [currentTime, duration]);

  // Mute / Unmute toggler
  const handleMuteToggle = useCallback(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error('Error muting/unmuting video:', e);
    }
  }, [isMuted]);

  // Volume slider handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef.current && isReadyRef.current) {
      try {
        playerRef.current.setVolume(val);
        if (val === 0) {
          playerRef.current.mute();
          setIsMuted(true);
        } else if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch (err) {
        console.error('Error changing volume:', err);
      }
    }
  };

  // Playback speed handler
  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (playerRef.current && isReadyRef.current) {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch (err) {
        console.error('Error setting playback rate:', err);
      }
    }
  };

  // Fullscreen toggler
  const handleFullscreenToggle = useCallback(() => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen?.()
          .catch(err => console.error('Error attempting to enable fullscreen:', err));
      } else {
        document.exitFullscreen?.();
      }
    } catch (err) {
      console.error('Fullscreen toggle failure:', err);
    }
  }, []);

  // Handle single click vs double click on video container overlay
  const handleVideoClick = useCallback(() => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      handleFullscreenToggle();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        handlePlayPause();
        clickTimeoutRef.current = null;
      }, 260);
    }
  }, [handlePlayPause, handleFullscreenToggle]);

  // Handle progress bar clicks and drags
  const calculateSeekTime = useCallback((clientX: number) => {
    if (!progressContainerRef.current || duration === 0) return 0;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const percent = Math.max(0, Math.min(1, pos));
    return percent * duration;
  }, [duration]);

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    if (!playerRef.current || !isReadyRef.current) return;
    isDraggingRef.current = true;
    const seekTime = calculateSeekTime(e.clientX);
    setCurrentTime(seekTime);
    playerRef.current.seekTo(seekTime, false);
  };

  const handleProgressMouseMove = (e: React.MouseEvent) => {
    if (!progressContainerRef.current || duration === 0) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const percent = Math.max(0, Math.min(1, pos));
    setHoverTime(percent * duration);
    setHoverPosition(percent * 100);
    setShowHoverTooltip(true);
  };

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Mouse drag moving logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !playerRef.current) return;
      const seekTime = calculateSeekTime(e.clientX);
      setCurrentTime(seekTime);
      playerRef.current.seekTo(seekTime, false);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (playerRef.current) {
        const seekTime = calculateSeekTime(e.clientX);
        playerRef.current.seekTo(seekTime, true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [calculateSeekTime]);

  // Load YouTube Player API and attach to static React iframe
  useEffect(() => {
    if (!videoId || !iframeRef.current) return;

    let isMounted = true;
    let player: any = null;

    loadYoutubeAPI().then((YT) => {
      if (!isMounted || !iframeRef.current) return;

      player = new YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            setIsReady(true);
            setDuration(event.target.getDuration());
            setVolume(event.target.getVolume());
            setIsMuted(event.target.isMuted());
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            const state = event.data;
            
            if (state === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              setDuration(event.target.getDuration());
            } else if (state === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (state === YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (state === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setIsBuffering(false);
              setCurrentTime(0);
            }
          }
        }
      });
      playerRef.current = player;
    });

    return () => {
      isMounted = false;
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, [videoId]);

  // Progress polling (runs ONLY when video is actively playing)
  useEffect(() => {
    if (!isReady || !isPlaying || !playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current && !isDraggingRef.current) {
        try {
          if (typeof playerRef.current.getCurrentTime === 'function') {
            setCurrentTime(playerRef.current.getCurrentTime());
          }
          if (typeof playerRef.current.getVideoLoadedFraction === 'function') {
            setBufferedFraction(playerRef.current.getVideoLoadedFraction() || 0);
          }
        } catch (e) {
          // ignore
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, isReady]);

  // Handle Controls Timeout
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimeout]);

  // Key Down shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          resetControlsTimeout();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          handleMuteToggle();
          resetControlsTimeout();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleFullscreenToggle();
          resetControlsTimeout();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-10);
          resetControlsTimeout();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(10);
          resetControlsTimeout();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, handleMuteToggle, handleFullscreenToggle, handleSkip, onClose, resetControlsTimeout]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-2xl overflow-hidden group select-none flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.85)]"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
        }
      }}
    >
      {/* Target iframe for embed - Scaled and cropped to hide YouTube UI (title bar & logos) */}
      {videoId && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-2xl">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=0&rel=0&modestbranding=1&enablejsapi=1&showinfo=0&iv_load_policy=3&disablekb=1&origin=${encodeURIComponent(window.location.origin)}`}
            title={title}
            className="w-full h-[130%] absolute top-[-15%] border-0 pointer-events-none scale-105"
            allow="autoplay; encrypted-media"
          />
        </div>
      )}

      {/* Invisible overlay capturing all pointer actions to prevent default YouTube play/pause behavior */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleVideoClick}
      />

      {/* Vignette shadows around boundary lines for contrast */}
      <div className="absolute inset-0 z-5 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Play/Pause Central Flash Action Feedback */}
      {actionIndicator && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 animate-ping-once text-violet-400">
            {actionIndicator === 'play' ? (
              <Play className="w-8 h-8 fill-violet-400 text-violet-400 ml-1" />
            ) : (
              <Pause className="w-8 h-8 fill-violet-400 text-violet-400" />
            )}
          </div>
        </div>
      )}

      {/* Title bar at the top */}
      <div 
        className={`absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <h3 className="text-white font-semibold text-sm md:text-base tracking-wide drop-shadow truncate pr-4">
          {title}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close player"
          className="p-2 rounded-full bg-black/50 text-white/80 hover:bg-violet-600 hover:text-white border border-white/10 hover:scale-110 active:scale-95 transition-all focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 z-15 bg-black/40 flex flex-col gap-3 items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-white/85 text-xs font-semibold uppercase tracking-wider drop-shadow-md">Buffering...</span>
        </div>
      )}

      {/* Loader screen prior to ready status */}
      {!isReady && (
        <div className="absolute inset-0 z-15 bg-black flex flex-col gap-3 items-center justify-center">
          <div className="w-14 h-14 border-4 border-violet-600/25 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-white/80 text-sm tracking-widest uppercase font-medium">Loading Trailer...</span>
        </div>
      )}

      {/* Custom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 z-25 p-4 md:p-6 flex flex-col gap-3 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Progress Bar & Seeker Tooltip */}
        <div className="relative w-full group/seek">
          {/* Hover timestamp tooltip bubble */}
          {showHoverTooltip && (
            <div 
              className="absolute bottom-full mb-2 bg-black/90 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-2 py-1 rounded shadow-lg transition-transform pointer-events-none -translate-x-[50%]"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Slider Seeker Track */}
          <div 
            ref={progressContainerRef}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={() => setShowHoverTooltip(false)}
            className="relative h-1.5 bg-white/15 hover:h-2.5 rounded-full cursor-pointer transition-all duration-150 flex items-center group/track"
          >
            {/* Loaded/Buffer status */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-full transition-all duration-200" 
              style={{ width: `${bufferedFraction * 100}%` }}
            />

            {/* Active play progress */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full flex items-center" 
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              {/* Seeker Thumb */}
              <div className="absolute right-0 translate-x-[50%] w-3.5 h-3.5 bg-white border-2 border-violet-600 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)] opacity-0 group-hover/track:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Buttons Controls Grid */}
        <div className="flex items-center justify-between gap-4 mt-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-[0_12px_40px_rgba(139,92,246,0.12)]">
          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Play/Pause control */}
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all transform hover:scale-105 active:scale-95 focus:outline-none"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Skip Back 10s */}
            <button
              onClick={() => handleSkip(-10)}
              aria-label="Rewind 10s (Left Arrow)"
              title="Rewind 10s"
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all transform hover:scale-105 active:scale-95 focus:outline-none"
            >
              <RotateCcw className="w-4 h-4 md:w-5 h-5" />
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => handleSkip(10)}
              aria-label="Forward 10s (Right Arrow)"
              title="Forward 10s"
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all transform hover:scale-105 active:scale-95 focus:outline-none"
            >
              <RotateCw className="w-4 h-4 md:w-5 h-5" />
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-1 group/volume">
              <button
                onClick={handleMuteToggle}
                aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all focus:outline-none"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden opacity-0 group-hover/volume:w-16 md:group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-200 h-1 bg-white/20 accent-violet-600 rounded-lg appearance-none cursor-pointer"
                aria-label="Volume slider"
              />
            </div>

            {/* Time progress label */}
            <span className="text-white/85 font-semibold text-xs md:text-sm select-none tracking-wide">
              {formatTime(currentTime)} <span className="text-white/30 font-light mx-0.5">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Playback rate settings selection */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                aria-label="Playback speed settings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs md:text-sm font-semibold transition-all focus:outline-none"
              >
                <Settings className="w-4 h-4" />
                <span>{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSpeedMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Speed popover options list */}
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-3 w-28 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-up flex flex-col z-35">
                  {([0.5, 1, 1.5, 2] as const).map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`px-4 py-2.5 text-left text-xs font-bold hover:bg-violet-600 hover:text-white transition-colors ${
                        playbackRate === rate ? 'text-violet-400 bg-white/5' : 'text-white/70'
                      }`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen control */}
            <button
              onClick={handleFullscreenToggle}
              aria-label={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all transform hover:scale-105 active:scale-95 focus:outline-none"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
