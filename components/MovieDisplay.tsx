import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { track } from '@vercel/analytics/react';
import { MovieData, CastMember, WatchOption, GroundingSource, WebSource, WatchlistFolder } from '../types';
import { EyeIcon, EyeSlashIcon, Logo, LinkIcon, PlayIcon, FilmIcon, TvIcon, TicketIcon, TagIcon, DollarIcon, RottenTomatoesIcon, StarIcon, ImageIcon, XMarkIcon, NetflixIcon, PrimeVideoIcon, HuluIcon, MaxIcon, DisneyPlusIcon, AppleTvIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import type { AIProvider } from '../types';
import TVShowDisplay from './TVShowDisplay';
import Section from './Section';

interface MovieDisplayProps {
    movie: MovieData | null;
    isLoading: boolean;
    sources: GroundingSource[] | null;
    selectedProvider: AIProvider;
    onFetchFullPlot: (title: string, year: string, type: string, provider: AIProvider) => Promise<string>;
    onQuickSearch: (title: string) => void;
    watchlists: WatchlistFolder[];
    onCreateWatchlist: (name: string, color: string) => string | null;
    onSaveToWatchlist: (folderId: string, movie: MovieData, savedTitle?: string) => void;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    let videoId: string | null = null;

    // Regular expression to find a YouTube video ID from various URL formats
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);

    if (match && match[1]) {
        videoId = match[1];
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    return null;
};

// Basic HTML escape function
const escapeHtml = (unsafe: string) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Helper function to convert simple markdown to HTML (XSS Safe)
const markdownToHtml = (text: string): string => {
    if (!text) return '';

    const lines = text.split('\n');
    const htmlBlocks: string[] = [];
    let currentList: string[] = [];

    const closeList = () => {
        if (currentList.length > 0) {
            htmlBlocks.push(`<ul>${currentList.join('')}</ul>`);
            currentList = [];
        }
    };

    lines.forEach(line => {
        if (line.startsWith('### ')) {
            closeList();
            htmlBlocks.push(`<h3>${escapeHtml(line.substring(4))}</h3>`);
        } else if (line.startsWith('## ')) {
            closeList();
            htmlBlocks.push(`<h2>${escapeHtml(line.substring(3))}</h2>`);
        } else if (line.startsWith('* ')) {
            currentList.push(`<li>${escapeHtml(line.substring(2))}</li>`);
        } else if (line.trim() === '') {
            closeList();
        } else {
            closeList();
            htmlBlocks.push(`<p>${escapeHtml(line)}</p>`);
        }
    });

    closeList(); // Close any remaining list

    let html = htmlBlocks.join('');

    // Inline replacements (Applied AFTER escaping to preserve tags)
    // Note: This logic prevents bolding if the user inputs literal **foo**.
    // To support markdown styles properly, we should unescape the specific specific tags we want to allow,
    // or use a proper parser. For this simple case, we'll re-apply the formatting tags to the escaped string.

    html = html.replace(/&lt;strong&gt;&lt;em&gt;(.*?)&lt;\/em&gt;&lt;\/strong&gt;/g, '<strong><em>$1</em></strong>'); // simplified for this regex approach
    // Actually, simple regex replacement on escaped text:
    // We want **text** to become <strong>text</strong>.
    // The escape happened first, so **text** became **text** (unchanged special chars).
    // So we can just run the replacements now.

    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // Bold + Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');       // Bold
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');               // Italic

    return html;
};

const ImageWithFallback: React.FC<{ src: string, alt: string, className: string }> = ({ src, alt, className }) => {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setError(false);
        setLoaded(false);
        const timeout = setTimeout(() => setLoaded(true), 2000);
        return () => clearTimeout(timeout);
    }, [src]);

    if (error || !src) {
        return (
            <div className={`${className} image-fallback-gradient flex flex-col items-center justify-center p-4 overflow-hidden`}>
                <div className="image-fallback-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                    </svg>
                </div>
                <p className="mt-3 text-sm font-semibold text-white/70 text-center leading-tight max-w-[90%]">{alt || 'Image'}</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {!loaded && <div className="absolute inset-0 image-skeleton rounded-lg" />}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-400 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onError={() => setError(true)}
                onLoad={() => setLoaded(true)}
                crossOrigin="anonymous"
            />
        </div>
    );
};


const LoadingSkeleton = () => (
    <div className="h-full w-full p-6 md:p-12 max-w-screen-xl mx-auto animate-fade-in">
        {/* Hero skeleton */}
        <div className="relative w-full min-h-[45vh] md:min-h-[55vh] mb-10 overflow-hidden rounded-2xl loading-hero-gradient">
            <div className="absolute inset-0 skeleton-shimmer" />
            <div className="absolute bottom-8 left-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                <div className="w-32 sm:w-40 md:w-48 aspect-[2/3] rounded-xl skeleton-shimmer-card" />
                <div className="space-y-4 pb-2">
                    <div className="h-8 md:h-12 w-48 md:w-72 skeleton-shimmer-card rounded-lg" />
                    <div className="h-5 w-32 md:w-48 skeleton-shimmer-card rounded-md" />
                    <div className="flex gap-3 mt-4">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-7 w-20 skeleton-shimmer-card rounded-full" />)}
                    </div>
                    <div className="flex gap-3 mt-4">
                        <div className="h-10 w-32 skeleton-shimmer-card rounded-lg" />
                        <div className="h-10 w-28 skeleton-shimmer-card rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-8">
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="h-6 w-32 skeleton-shimmer-card rounded-md" />
                    <div className="h-4 w-full skeleton-shimmer-card rounded" />
                    <div className="h-4 w-5/6 skeleton-shimmer-card rounded" />
                    <div className="h-4 w-4/6 skeleton-shimmer-card rounded" />
                </div>
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="h-6 w-24 skeleton-shimmer-card rounded-md" />
                    <div className="flex gap-3 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-32 h-20 skeleton-shimmer-card rounded-lg flex-shrink-0" />)}
                    </div>
                </div>
            </div>
            <div className="space-y-8">
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="h-6 w-36 skeleton-shimmer-card rounded-md" />
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 skeleton-shimmer-card rounded-lg" />)}
                </div>
            </div>
        </div>
    </div>
);

const DISCOVER_TITLES = [
    { title: 'Interstellar', poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', genre: 'Sci-Fi', year: '2014', rating: '8.7' },
    { title: 'Oppenheimer', poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', genre: 'Drama', year: '2023', rating: '8.3', badge: 'TRENDING' },
    { title: 'The Dark Knight', poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BTUgMe1l6C6.jpg', genre: 'Action', year: '2008', rating: '9.0' },
    { title: 'Inception', poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', genre: 'Sci-Fi Thriller', year: '2010', rating: '8.8' },
    { title: 'Dune', poster: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', genre: 'Sci-Fi', year: '2021', rating: '8.0' },
    { title: 'Breaking Bad', poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', genre: 'Crime Drama', year: '2008', rating: '9.5', badge: 'GOAT' },
    { title: 'Stranger Things', poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', genre: 'Sci-Fi Horror', year: '2016', rating: '8.7' },
    { title: 'The Last of Us', poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', genre: 'Post-Apocalyptic', year: '2023', rating: '8.8' },
];

const COLOR_PRESETS = ['#7c3aed', '#db2777', '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7'];

const MovieDisplay: React.FC<MovieDisplayProps> = ({ movie, isLoading, sources, selectedProvider, onFetchFullPlot, onQuickSearch, watchlists, onCreateWatchlist, onSaveToWatchlist }) => {
    const [showFullPlot, setShowFullPlot] = useState(false);
    const [synopsisExpanded, setSynopsisExpanded] = useState(false);

    const [isTrailerOpen, setIsTrailerOpen] = useState(false);
    const [showAllCast, setShowAllCast] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoadingFullPlot, setIsLoadingFullPlot] = useState(false);
    const [fullPlotContent, setFullPlotContent] = useState<string>('');
    const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
    const [showWatchlistModal, setShowWatchlistModal] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState('#7c3aed');
    const [customSavedTitle, setCustomSavedTitle] = useState('');
    const [showRelatedModal, setShowRelatedModal] = useState(false);
    const canSave = (selectedFolderId && selectedFolderId.length > 0) || (newFolderName && newFolderName.trim().length > 0);
    const newFolderNameError = newFolderName.length > 0 && newFolderName.trim().length === 0 ? 'Folder name cannot be blank.' : '';

    // Check if synopsis is long enough to need truncation
    const synopsisNeedsTruncation = movie?.summary_medium && movie.summary_medium.length > 300;

    useEffect(() => {
        // This effect runs on the client, where document is available.
        setModalRoot(document.getElementById('modal-root'));
    }, []);

    // Reset spoiler state when movie changes & prefill if already present
    useEffect(() => {
        setShowFullPlot(false);
        setIsLoadingFullPlot(false);
        setFullPlotContent(movie?.summary_long_spoilers || '');
    }, [movie]);

    useEffect(() => {
        setCustomSavedTitle(movie?.title || '');
        // Preserve selection only if it still exists; otherwise clear selection
        const exists = selectedFolderId && watchlists.some(f => f.id === selectedFolderId);
        if (!exists) {
            setSelectedFolderId('');
        }
        setNewFolderName('');
        setNewFolderColor('#7c3aed');
    }, [movie, watchlists]);

    // When opening the modal, clear selection to force explicit choice
    useEffect(() => {
        if (showWatchlistModal) {
            setSelectedFolderId('');
        }
    }, [showWatchlistModal]);

    const embedUrl = movie ? getYouTubeEmbedUrl(movie.trailer_url) : null;

    // Ensure ratings is always an array (handle legacy cached data)
    const safeRatings = movie && Array.isArray(movie.ratings) ? movie.ratings : [];
    const safeCast = movie && Array.isArray(movie.cast) ? movie.cast : [];
    const safeGenres = movie && Array.isArray(movie.genres) ? movie.genres : [];

    // Normalize where_to_watch: handle both proper objects and malformed string arrays
    const safeWhereToWatch = movie && Array.isArray(movie.where_to_watch)
        ? movie.where_to_watch.map((option: any) => {
            // If it's a string, convert to proper WatchOption
            if (typeof option === 'string') {
                return {
                    platform: option,
                    link: '#',
                    type: 'subscription' as const
                };
            }
            // If object but missing fields, add defaults
            return {
                platform: option.platform || 'Unknown',
                link: option.link || '#',
                type: option.type || 'subscription'
            };
        })
        : [];

    const handleSaveToWatchlist = () => {
        if (!movie) return;
        let folderId = selectedFolderId;
        if (!folderId && newFolderName.trim()) {
            const createdId = onCreateWatchlist(newFolderName, newFolderColor);
            if (createdId) {
                folderId = createdId;
                setSelectedFolderId(createdId);
            }
        }
        if (!folderId) return;
        onSaveToWatchlist(folderId, movie, customSavedTitle || movie.title);
        setShowWatchlistModal(false);
    };

    const safeExtraImages = movie && Array.isArray(movie.extra_images) ? movie.extra_images : [];

    const displayedCast = showAllCast ? safeCast : safeCast.slice(0, 8);


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsTrailerOpen(false);
                setSelectedImage(null);
            }
            if (selectedImage) {
                if (event.key === 'ArrowRight') {
                    const imgs = safeExtraImages; const idx = imgs.indexOf(selectedImage); const next = (idx + 1) % imgs.length; setSelectedImage(imgs[next]);
                } else if (event.key === 'ArrowLeft') {
                    const imgs = safeExtraImages; const idx = imgs.indexOf(selectedImage); const prev = (idx - 1 + imgs.length) % imgs.length; setSelectedImage(imgs[prev]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedImage, safeExtraImages]);


    if (isLoading && !movie) {
        return <LoadingSkeleton />;
    }

    if (!movie) {
        return (
            <div className="min-h-full flex items-center justify-center p-6 pt-16 animate-fade-in relative">
                {/* Animated background mesh */}
                <div className="hero-bg-mesh" />
                <div className="hero-bg-glow" />
                <div className="max-w-6xl mx-auto w-full relative z-10">
                    <div className="text-center mb-10 md:mb-14">
                        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter text-gradient-primary animate-slide-up hero-title-font">MovieMonk</h1>
                        <p className="mt-4 text-lg md:text-2xl text-white/50 max-w-2xl mx-auto animate-fade-in hero-tagline" style={{ animationDelay: '0.15s' }}>
                            Your AI-powered cinematic companion.<br />
                            <span className="hero-tagline-rotate">Discover. Explore. Analyze.</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 pb-20 featured-grid">
                        {DISCOVER_TITLES.map((item, idx) => (
                            <button
                                key={item.title}
                                onClick={() => onQuickSearch(item.title)}
                                className={`featured-card animate-stagger-in text-left ${idx === 0 ? 'featured-card-hero' : ''}`}
                                style={{ animationDelay: `${idx * 60}ms` }}
                            >
                                <div className="featured-card-bg" style={{ backgroundImage: `url(${item.poster})` }} />
                                <div className="featured-card-overlay" />
                                <div className="featured-card-content">
                                    {'badge' in item && item.badge && (
                                        <span className="featured-badge">{item.badge}</span>
                                    )}
                                    <span className="featured-card-genre">{item.genre}</span>
                                    <h3 className="featured-card-title">{item.title}</h3>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="featured-card-year">{item.year}</span>
                                        <span className="featured-card-rating">★ {item.rating}</span>
                                    </div>
                                </div>
                                <div className="featured-card-shine" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // If this is a TV show with episode data, use the dedicated TV Show display
    if (movie && movie.tvShow) {
        return <TVShowDisplay movie={movie} />;
    }

    // Otherwise, use the standard movie display
    return (
        <div className="h-full overflow-y-auto relative">
            {isLoading && (
                <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fade-in">
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-brand-primary/30" />
                        <FilmIcon className="w-20 h-20 text-brand-primary animate-spin" />
                    </div>
                    <p className="mt-6 text-lg font-semibold text-brand-text-light flex items-center gap-2">
                        <span className="inline-flex w-2 h-2 bg-brand-secondary rounded-full animate-pulse" /> Loading cinematic data...
                    </p>
                </div>
            )}
            {/* Hero Section with Poster Card */}
            <div className="relative w-full min-h-[45vh] md:min-h-[70vh] mb-6 md:mb-8 overflow-hidden hero-section-mobile">
                {/* Backdrop Image Layer */}
                {movie.backdrop_url && (
                    <img
                        src={movie.backdrop_url}
                        alt={`${movie.title} backdrop`}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        loading="eager"
                    />
                )}
                {/* Gradient Overlays - Cinematic */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/60 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)]/90 via-[var(--color-bg)]/40 to-transparent z-10"></div>

                {/* Content Layer - Above gradients */}
                <div className="relative h-full flex items-end p-4 md:p-12 max-w-screen-xl mx-auto z-20">
                    {/* Mobile: column, Desktop: row */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-8 w-full sm:w-auto hero-content-mobile">
                        {/* Poster Card - Shows Above text on mobile now */}
                        <div className="flex-shrink-0 animate-fade-in will-change-transform hero-poster-mobile" style={{ animationDelay: '0.05s', animationFillMode: 'forwards' }}>
                            <ImageWithFallback
                                src={movie.poster_url}
                                alt={`${movie.title} poster`}
                                className="w-40 sm:w-40 md:w-56 lg:w-64 rounded-lg md:rounded-xl shadow-2xl border-2 md:border-4 border-white/20 aspect-[2/3] poster-hover-effect"
                            />
                        </div>

                        {/* Title and Info Card */}
                        <div className="flex-1 text-center sm:text-left pb-2 md:pb-4 w-full sm:w-auto">
                            <h1 className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-2xl animate-fade-in leading-tight text-depth" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>{movie.title}</h1>
                            <p className="mt-2 md:mt-3 text-sm sm:text-base md:text-xl text-brand-text-light font-semibold animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
                                {movie.year} &bull; {typeof movie.type === 'string' && movie.type.length > 0 ? movie.type.charAt(0).toUpperCase() + movie.type.slice(1) : ''}
                            </p>

                            <div className="mt-2 md:mt-4 flex flex-wrap justify-center sm:justify-start gap-1.5 md:gap-2 animate-slide-up" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
                                {safeGenres.map(genre => (
                                    <span key={genre} className="px-2 py-1 md:px-3 md:py-1.5 bg-white/20 text-white text-xs md:text-sm font-bold rounded-md backdrop-blur-md hover:bg-white/30 transition-colors shadow-lg">{genre}</span>
                                ))}
                            </div>

                            <div className="mt-3 md:mt-6 flex flex-wrap justify-center sm:justify-start gap-2 md:gap-4 items-center animate-slide-up" style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}>
                                {/* Ratings Grid - With hover effects and improved touch targets */}
                                {safeRatings.length > 0 && (
                                    safeRatings.map(rating => (
                                        <div key={rating.source} className="flex items-center gap-2 md:gap-3 bg-black/50 backdrop-blur-md px-3 py-2.5 md:px-4 md:py-3 rounded-lg border border-white/15 rating-card-hover touch-target">
                                            <div className="flex items-center gap-1.5 md:gap-2 min-w-fit">
                                                {rating.source.toLowerCase().includes('rotten') && (
                                                    <RottenTomatoesIcon className="w-5 h-5 md:w-6 md:h-6 text-red-500 flex-shrink-0" />
                                                )}
                                                {rating.source.toLowerCase().includes('imdb') && (
                                                    <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 flex-shrink-0" />
                                                )}
                                                {rating.source.toLowerCase().includes('tmdb') && (
                                                    <FilmIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-400 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="font-bold text-white text-xs md:text-sm leading-tight uppercase tracking-wide">{rating.source}</p>
                                                <p className="text-sm md:text-lg font-extrabold rating-score-accessible">{rating.score}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {movie && (
                                <div className="mt-4 md:mt-8 animate-slide-up flex flex-wrap justify-center sm:justify-start gap-3" style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}>
                                    <button
                                        onClick={() => setShowWatchlistModal(true)}
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-white/15 text-white font-semibold text-sm md:text-base rounded-xl border border-white/15 hover:border-brand-primary/50 hover:bg-white/20 transition-all duration-200 touch-target btn-mobile-friendly"
                                    >
                                        <TagIcon className="w-5 h-5" />
                                        <span>Save to List</span>
                                    </button>
                                    {embedUrl && (
                                        <button
                                            onClick={() => {
                                                track('trailer_opened', {
                                                    title: movie.title,
                                                    year: movie.year,
                                                    type: movie.type
                                                });
                                                setIsTrailerOpen(true);
                                            }}
                                            className="inline-flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-brand-primary text-white font-bold text-base md:text-lg rounded-xl shadow-2xl hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-primary/50 play-trailer-pulse touch-target"
                                        >
                                            <PlayIcon className="w-5 h-5 md:w-6 md:h-6" />
                                            <span>Play Trailer</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <div className="lg:col-span-2 space-y-8">
                    <Section title="Synopsis">
                        {/* Synopsis with Read More for long text */}
                        <div className="relative">
                            <p className={`text-brand-text-dark text-accessible-muted leading-relaxed ${synopsisNeedsTruncation && !synopsisExpanded ? 'synopsis-truncated' : ''}`}>
                                {movie.summary_medium}
                            </p>
                            {synopsisNeedsTruncation && (
                                <button
                                    onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                                    className="mt-2 text-sm font-semibold text-brand-primary hover:text-brand-accent transition-colors touch-target"
                                >
                                    {synopsisExpanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>

                        <div className="mt-6">
                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        if (!fullPlotContent && movie) {
                                            setIsLoadingFullPlot(true);
                                            try {
                                                const plot = await onFetchFullPlot(movie.title, movie.year, movie.type, selectedProvider);
                                                setFullPlotContent(plot);
                                                setShowFullPlot(true);
                                            } catch (error) {
                                                setFullPlotContent("Failed to load full plot details. Please try again.");
                                                setShowFullPlot(true);
                                            }
                                            setIsLoadingFullPlot(false);
                                            return;
                                        }
                                        setShowFullPlot(p => !p);
                                    }}
                                    disabled={isLoadingFullPlot}
                                    aria-controls="spoiler-content"
                                    aria-expanded={showFullPlot}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm bg-brand-primary/15 hover:bg-brand-primary/25 text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors touch-target"
                                >
                                    {isLoadingFullPlot ? (
                                        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                    ) : showFullPlot ? (
                                        <EyeSlashIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                    {fullPlotContent ? (showFullPlot ? 'Hide Spoiler Plot' : 'Show Spoiler Plot') : 'Load Full Plot (Spoilers)'}
                                </button>
                                {showFullPlot && fullPlotContent && (
                                    <div id="spoiler-content" className="pt-3 border-t border-brand-primary/20 animate-fade-in">
                                        <p className="text-sm font-bold text-red-400 mb-2">{fullPlotContent.startsWith('SPOILER WARNING') ? fullPlotContent.split('—')[0] : 'SPOILER WARNING'}</p>
                                        <p className="text-brand-text-dark leading-relaxed whitespace-pre-wrap">{fullPlotContent.replace(/^SPOILER WARNING — Full plot explained below\.\n*/, '')}</p>
                                    </div>
                                )}
                                {showFullPlot && !fullPlotContent && !isLoadingFullPlot && (
                                    <p className="text-sm text-brand-text-dark italic">No spoiler plot available yet.</p>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section title="Gallery">
                        {safeExtraImages.length > 0 ? (
                            <div className="gallery-container horizontal-scroll-fade-right">
                                <div className="gallery-filmstrip">
                                    {safeExtraImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(img)}
                                            className="gallery-thumb touch-target"
                                            aria-label={`Gallery image ${i + 1} of ${safeExtraImages.length}`}
                                            title={`Scene ${i + 1}`}
                                        >
                                            <ImageWithFallback
                                                src={img}
                                                alt={`Gallery image ${i + 1}`}
                                                className="gallery-thumb-img"
                                            />
                                            <div className="gallery-thumb-overlay">
                                                <span className="gallery-thumb-number">{i + 1}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="gallery-info text-xs text-accessible-muted mt-3 flex items-center gap-2">
                                    <span>{safeExtraImages.length} images</span>
                                    <span className="hidden sm:inline">• Click to view</span>
                                    <span className="sm:hidden">• Swipe to browse</span>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                                <p className="empty-state-title">No gallery images available</p>
                                <p className="empty-state-subtitle">Images may be added later</p>
                            </div>
                        )}
                    </Section>

                    <Section title="Cast & Crew">
                        <div className="cast-grid-mobile-scroll">
                            {displayedCast.map(member => <CastCard key={member.name} member={member} />)}
                        </div>
                        {safeCast.length > 8 && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => setShowAllCast(!showAllCast)}
                                    className="px-5 py-2.5 text-sm font-semibold text-brand-primary bg-brand-primary/10 rounded-full hover:bg-brand-primary/20 transition-colors touch-target"
                                >
                                    {showAllCast ? 'Show Less' : `Show ${safeCast.length - 8} More`}
                                </button>
                            </div>
                        )}
                        <div className="mt-6 text-sm text-brand-text-dark grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                            <p><span className="font-semibold text-brand-text-light">Director:</span> {movie.crew?.director || 'Unknown'}</p>
                            <p><span className="font-semibold text-brand-text-light">Writer:</span> {movie.crew?.writer || 'Unknown'}</p>
                            <p><span className="font-semibold text-brand-text-light">Music:</span> {movie.crew?.music || 'Unknown'}</p>
                        </div>
                    </Section>

                    <Section title="AI Notes & Trivia">
                        <div className="prose prose-invert prose-sm text-brand-text-dark max-w-none prose-p:my-2 prose-ul:my-2 prose-headings:text-brand-accent" dangerouslySetInnerHTML={{ __html: markdownToHtml(movie.ai_notes) }} />
                    </Section>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {/* Similar Titles above Where to Watch */}
                    {Array.isArray((movie as any).related) && (movie as any).related.length > 0 && (
                        <Section title="Similar Titles">
                            <div className="space-y-3">
                                {/* Horizontal scroll with fade indicator */}
                                <div className="horizontal-scroll-fade-right relative">
                                    <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth">
                                        {(movie as any).related.slice(0, 12).map((it: any, idx: number) => (
                                            <button
                                                key={`${it.media_type}-${it.id}-${idx}`}
                                                className="flex-shrink-0 w-24 text-left group touch-target"
                                                onClick={() => { (window as any)?.track && (window as any).track('related_tile_click', { type: it.media_type, id: it.id, title: it.title }); onQuickSearch(it.title); }}
                                                aria-label={`Open ${it.title}${it.year ? ` (${it.year})` : ''}`}
                                            >
                                                <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 group-hover:border-brand-primary/50 transition-colors">
                                                    {it.poster_url ? (
                                                        <img src={it.poster_url} alt={`${it.title} poster`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/10" />
                                                    )}
                                                </div>
                                                <p className="mt-2 text-[11px] font-semibold text-white line-clamp-2 group-hover:text-brand-primary transition-colors">{it.title}</p>
                                                {it.year && <p className="text-[10px] text-brand-text-dark">{it.year}</p>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button className="text-xs px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors touch-target" onClick={() => { (window as any)?.track && (window as any).track('related_see_all_open', { type: 'title', id: movie.tmdb_id }); setShowRelatedModal(true); }}>See all</button>
                                </div>
                            </div>
                        </Section>
                    )}
                    <Section title="Where to Watch">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {safeWhereToWatch.length > 0 ? (
                                safeWhereToWatch.map(option => <WatchCard key={option.platform + option.type} option={option} />)
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <TvIcon className="w-8 h-8" />
                                    </div>
                                    <p className="empty-state-title">Streaming info not available</p>
                                    <p className="empty-state-subtitle">Check JustWatch for availability</p>
                                </div>
                            )}
                        </div>
                    </Section>

                    {sources && sources.length > 0 && (
                        <Section title="Data Sources">
                            <div className="space-y-3">
                                {sources.map((source, index) => (
                                    source.web && <SourceCard key={index} source={source.web} />
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            </div>

            {showWatchlistModal && modalRoot && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md bg-brand-surface border border-white/10 rounded-2xl shadow-2xl p-4 md:p-5 space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Save to Watch Later</h3>
                            <button onClick={() => setShowWatchlistModal(false)} className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary" aria-label="Close watchlist modal">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-brand-text-light">Save as</label>
                            <input
                                value={customSavedTitle}
                                onChange={(e) => setCustomSavedTitle(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="Custom title"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-white">Choose folder</p>
                                <span className="text-xs text-brand-text-dark">{watchlists.length || 0} folders</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {watchlists.length === 0 && (
                                    <p className="text-sm text-brand-text-dark">No folders yet. Create one below.</p>
                                )}
                                {watchlists.map(folder => (
                                    <label key={folder.id} className="flex items-center gap-3 p-2 rounded-lg border border-white/10 hover:border-brand-primary/50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="watchlist-folder"
                                            value={folder.id}
                                            checked={selectedFolderId === folder.id}
                                            onChange={() => setSelectedFolderId(folder.id)}
                                            className="accent-brand-primary"
                                        />
                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: folder.color }}></span>
                                        <span className="text-sm text-white">{folder.name}</span>
                                        <span className="text-xs text-brand-text-dark ml-auto">{folder.items.length} saved</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-3 space-y-2">
                            <p className="text-sm font-semibold text-white">Create new folder</p>
                            <input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 ${newFolderNameError ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-brand-primary'}`}
                                placeholder="e.g., Sci-Fi Gems"
                            />
                            {newFolderNameError && (
                                <p className="text-xs text-red-400">{newFolderNameError}</p>
                            )}
                            <div className="flex items-center gap-2">
                                {COLOR_PRESETS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewFolderColor(color)}
                                        className={`w-7 h-7 rounded-full border ${newFolderColor === color ? 'border-white ring-2 ring-white/80' : 'border-white/20'}`}
                                        style={{ backgroundColor: color }}
                                        aria-label={`Choose ${color}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2">
                            {/* Selected target indicator */}
                            <div className="text-xs text-brand-text-dark">
                                {selectedFolderId ? (
                                    (() => {
                                        const folder = watchlists.find(f => f.id === selectedFolderId);
                                        return folder ? (
                                            <span className="inline-flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }}></span>
                                                <span>Saving to: <span className="text-white font-semibold">{folder.name}</span></span>
                                            </span>
                                        ) : null;
                                    })()
                                ) : newFolderName.trim().length > 0 ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: newFolderColor }}></span>
                                        <span>Saving to new: <span className="text-white font-semibold">{newFolderName.trim()}</span></span>
                                    </span>
                                ) : (
                                    <span>Choose a folder or create one</span>
                                )}
                            </div>
                            <button
                                onClick={() => setShowWatchlistModal(false)}
                                className="px-4 py-2 rounded-lg border border-white/15 text-white text-sm hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveToWatchlist}
                                disabled={!canSave}
                                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary ${canSave ? 'bg-brand-primary hover:bg-brand-secondary' : 'bg-white/10 cursor-not-allowed'}`}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>,
                modalRoot
            )}

            {isTrailerOpen && embedUrl && modalRoot && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
                    onClick={() => setIsTrailerOpen(false)}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={embedUrl}
                            title={`${movie.title} Trailer`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                        <button
                            onClick={() => setIsTrailerOpen(false)}
                            aria-label="Close trailer"
                            className="absolute -top-3 -right-3 md:-top-4 md:-right-4 p-2 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white transition-colors shadow-lg"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>,
                modalRoot
            )}

            {selectedImage && modalRoot && ReactDOM.createPortal(
                <div
                    className="gallery-lightbox"
                    onClick={() => setSelectedImage(null)}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft') {
                            const idx = safeExtraImages.indexOf(selectedImage);
                            const prev = (idx - 1 + safeExtraImages.length) % safeExtraImages.length;
                            setSelectedImage(safeExtraImages[prev]);
                        } else if (e.key === 'ArrowRight') {
                            const idx = safeExtraImages.indexOf(selectedImage);
                            const next = (idx + 1) % safeExtraImages.length;
                            setSelectedImage(safeExtraImages[next]);
                        } else if (e.key === 'Escape') {
                            setSelectedImage(null);
                        }
                    }}
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                    aria-label="Image gallery viewer"
                >
                    <div
                        className="gallery-lightbox-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt={`Gallery image ${safeExtraImages.indexOf(selectedImage) + 1}`}
                            className="gallery-lightbox-image"
                        />
                        {safeExtraImages.length > 1 && (
                            <>
                                <button
                                    onClick={() => {
                                        const idx = safeExtraImages.indexOf(selectedImage);
                                        const prev = (idx - 1 + safeExtraImages.length) % safeExtraImages.length;
                                        setSelectedImage(safeExtraImages[prev]);
                                    }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    aria-label="Previous image"
                                    className="gallery-lightbox-nav gallery-lightbox-prev"
                                    title="Previous (← Arrow key)"
                                >
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => {
                                        const idx = safeExtraImages.indexOf(selectedImage);
                                        const next = (idx + 1) % safeExtraImages.length;
                                        setSelectedImage(safeExtraImages[next]);
                                    }}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    aria-label="Next image"
                                    className="gallery-lightbox-nav gallery-lightbox-next"
                                    title="Next (→ Arrow key)"
                                >
                                    <ArrowRightIcon className="w-6 h-6" />
                                </button>
                                <div className="gallery-lightbox-counter">
                                    <span>{safeExtraImages.indexOf(selectedImage) + 1}</span>
                                    <span className="text-white/60">/</span>
                                    <span>{safeExtraImages.length}</span>
                                </div>
                            </>
                        )}
                        <button
                            onClick={() => setSelectedImage(null)}
                            onKeyDown={(e) => e.stopPropagation()}
                            aria-label="Close gallery (Esc key)"
                            className="gallery-lightbox-close"
                            title="Close (Esc key)"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>,
                modalRoot
            )}

            {showRelatedModal && modalRoot && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setShowRelatedModal(false)}>
                    <div className="w-full max-w-5xl bg-brand-surface border border-white/10 rounded-2xl shadow-2xl p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg md:text-xl font-bold text-white">Similar Titles</h3>
                            <button onClick={() => setShowRelatedModal(false)} className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary" aria-label="Close similar titles modal">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.isArray((movie as any).related) && (movie as any).related.length > 0 ? (
                                (movie as any).related.map((it: any, idx: number) => (
                                    <button
                                        key={`${it.media_type}-${it.id}-${idx}`}
                                        className="text-left group"
                                        onClick={() => { (window as any)?.track && (window as any).track('related_tile_click', { type: it.media_type, id: it.id, title: it.title, context: 'modal' }); onQuickSearch(it.title); setShowRelatedModal(false); }}
                                        aria-label={`Open ${it.title}${it.year ? ` (${it.year})` : ''}`}
                                    >
                                        <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                            {it.poster_url ? (
                                                <img src={it.poster_url} alt={`${it.title} poster`} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full bg-white/10" />
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs font-semibold text-white line-clamp-2">{it.title}</p>
                                        {it.year && <p className="text-[11px] text-brand-text-dark">{it.year}</p>}
                                    </button>
                                ))
                            ) : (
                                <p className="text-brand-text-dark">No similar titles found.</p>
                            )}
                        </div>
                    </div>
                </div>,
                modalRoot
            )}
        </div>
    );
};



const CastCard: React.FC<{ member: CastMember }> = ({ member }) => (
    <div className="bg-white/5 p-2 md:p-3 rounded-lg text-center transform hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-brand-primary">
        <p className="font-bold text-xs md:text-sm text-brand-text-light truncate">{member.name}</p>
        <p className="text-xs text-brand-primary truncate">{member.role}</p>
    </div>
);

const watchTypeIcons: Record<WatchOption['type'], React.FC<{ className?: string }>> = {
    subscription: TvIcon,
    rent: TicketIcon,
    buy: DollarIcon,
    free: TagIcon,
};

const platformLogos: Record<string, React.FC<{ className?: string }>> = {
    netflix: NetflixIcon,
    'prime video': PrimeVideoIcon,
    amazon: PrimeVideoIcon,
    hulu: HuluIcon,
    max: MaxIcon,
    'hbo max': MaxIcon,
    'disney+': DisneyPlusIcon,
    disney: DisneyPlusIcon,
    'apple tv': AppleTvIcon,
    'apple tv+': AppleTvIcon,
};

// Platform brand colors map
const platformColorClasses: Record<string, string> = {
    netflix: 'platform-netflix',
    'prime video': 'platform-prime',
    amazon: 'platform-prime',
    hulu: 'platform-hulu',
    max: 'platform-max',
    'hbo max': 'platform-max',
    'disney+': 'platform-disney',
    disney: 'platform-disney',
    'apple tv': 'platform-apple',
    'apple tv+': 'platform-apple',
};

const WatchCard: React.FC<{ option: WatchOption }> = ({ option }) => {
    const TypeIcon = watchTypeIcons[option.type] || TvIcon;
    const key = option.platform.toLowerCase().trim();
    const Logo = platformLogos[key];
    const platformClass = platformColorClasses[key] || '';

    return (
        <a
            href={option.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group rounded-xl border border-white/10 bg-brand-surface/60 p-3 md:p-4 flex flex-col gap-2 md:gap-3 hover:shadow-lg transition-all relative overflow-hidden platform-card touch-target ${platformClass}`}
            aria-label={`Open ${option.platform} (${option.type})`}
        >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)]" />
            <div className="flex items-start gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="p-1.5 md:p-2 rounded-lg bg-brand-surface/80 ring-1 ring-white/10 group-hover:ring-brand-primary/50 transition">
                        <TypeIcon className="w-4 h-4 md:w-5 md:h-5 text-brand-text-light" />
                    </div>
                    {Logo && (
                        <div className="p-1.5 md:p-2 rounded-lg bg-brand-surface/80 ring-1 ring-white/10 group-hover:ring-brand-secondary/50 transition">
                            <Logo className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-brand-text-light truncate" title={option.platform}>{option.platform}</p>
                    <p className="text-xs text-accessible-muted capitalize">{option.type}</p>
                </div>
            </div>
            <div className="flex justify-end">
                <span className="inline-flex items-center gap-1 px-3 py-2 md:px-4 md:py-2.5 text-xs font-bold rounded-lg bg-brand-primary/90 text-white transform transition-transform group-hover:scale-105 shadow-md">
                    <PlayIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> Go
                </span>
            </div>
        </a>
    );
};


const SourceCard: React.FC<{ source: WebSource }> = ({ source }) => (
    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-2 md:space-x-3 bg-white/5 p-2 md:p-3 rounded-lg hover:bg-brand-primary/20 transition-colors group">
        <div className="flex-shrink-0 bg-brand-primary/20 p-1.5 md:p-2 rounded-md mt-1">
            <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-primary group-hover:text-white transition-colors" />
        </div>
        <div>
            <p className="font-semibold text-xs md:text-sm text-brand-text-light line-clamp-2 leading-tight">{source.title}</p>
            <p className="text-xs text-brand-text-dark truncate">{source.uri}</p>
        </div>
    </a>
);


export default MovieDisplay;