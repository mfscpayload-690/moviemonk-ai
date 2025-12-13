import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { track } from '@vercel/analytics/react';
import { MovieData, CastMember, WatchOption, GroundingSource, WebSource } from '../types';
import { EyeIcon, EyeSlashIcon, Logo, LinkIcon, PlayIcon, FilmIcon, TvIcon, TicketIcon, TagIcon, DollarIcon, RottenTomatoesIcon, StarIcon, ImageIcon, XMarkIcon, NetflixIcon, PrimeVideoIcon, HuluIcon, MaxIcon, DisneyPlusIcon, AppleTvIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import type { AIProvider } from '../types';

interface MovieDisplayProps {
    movie: MovieData | null;
    isLoading: boolean;
    sources: GroundingSource[] | null;
    selectedProvider: AIProvider;
    onFetchFullPlot: (title: string, year: string, type: string, provider: AIProvider) => Promise<string>;
    onQuickSearch: (title: string) => void;
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

// Helper function to convert simple markdown to HTML
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
            htmlBlocks.push(`<h3>${line.substring(4)}</h3>`);
        } else if (line.startsWith('## ')) {
            closeList();
            htmlBlocks.push(`<h2>${line.substring(3)}</h2>`);
        } else if (line.startsWith('* ')) {
            currentList.push(`<li>${line.substring(2)}</li>`);
        } else if (line.trim() === '') {
            closeList();
        } else {
            closeList();
            htmlBlocks.push(`<p>${line}</p>`);
        }
    });

    closeList(); // Close any remaining list

    let html = htmlBlocks.join('');

    // Inline replacements
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // Bold + Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');       // Bold
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');               // Italic

    return html;
};

const ImageWithFallback: React.FC<{ src: string, alt: string, className: string }> = ({ src, alt, className }) => {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [src]);

    const handleError = () => {
        setError(true);
    };

    if (error || !src) {
        return (
            <div className={`${className} flex flex-col items-center justify-center bg-brand-surface border-2 border-dashed border-white/20 p-2`}>
                <ImageIcon className="w-1/4 h-1/4 text-brand-text-dark" />
                <p className="mt-2 text-xs text-center text-brand-text-dark">Image Unavailable</p>
            </div>
        );
    }

    return <img src={src} alt={alt} className={className} onError={handleError} />;
};


const LoadingSkeleton = () => (
    <div className="h-full w-full p-4 md:p-8">
        <div className="relative w-full h-[50vh] md:h-[60vh] mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-brand-surface/40 to-brand-surface/20">
            <div className="absolute inset-0 animate-pulse bg-brand-surface/30" />
            <div className="absolute bottom-6 left-6 flex items-center gap-6">
                <div className="w-40 md:w-52 lg:w-60 aspect-[2/3] rounded-lg bg-brand-surface/50 animate-pulse" />
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-brand-surface/50 rounded-md animate-pulse" />
                    <div className="h-6 w-40 bg-brand-surface/40 rounded-md animate-pulse" />
                    <div className="flex gap-2 mt-4">
                        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-6 w-16 bg-brand-surface/40 rounded-full animate-pulse" />)}
                    </div>
                    <div className="h-10 w-40 bg-brand-surface/50 rounded-md mt-6 animate-pulse" />
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="h-40 bg-brand-surface/40 rounded-lg animate-pulse" />
                <div className="h-64 bg-brand-surface/40 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-6">
                <div className="h-32 bg-brand-surface/40 rounded-lg animate-pulse" />
                <div className="h-48 bg-brand-surface/40 rounded-lg animate-pulse" />
                <div className="h-32 bg-brand-surface/40 rounded-lg animate-pulse" />
            </div>
        </div>
    </div>
);

const DISCOVER_TITLES = [
    'Interstellar',
    'Oppenheimer',
    'The Dark Knight',
    'Inception',
    'Dune',
    'Breaking Bad',
    'Stranger Things',
    'The Last of Us'
];

const MovieDisplay: React.FC<MovieDisplayProps> = ({ movie, isLoading, sources, selectedProvider, onFetchFullPlot, onQuickSearch }) => {
    const [showFullPlot, setShowFullPlot] = useState(false);

    const [isTrailerOpen, setIsTrailerOpen] = useState(false);
    const [showAllCast, setShowAllCast] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoadingFullPlot, setIsLoadingFullPlot] = useState(false);
    const [fullPlotContent, setFullPlotContent] = useState<string>('');
    const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

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
            <div className="h-full flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-violet-900/20 to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto w-full relative z-10">
                    <div className="text-center mb-12">
                        <Logo className="mx-auto h-24 w-24 animate-fade-in text-primary drop-shadow-glow" />
                        <h1 className="mt-6 text-5xl md:text-7xl font-extrabold tracking-tighter text-gradient-primary animate-slide-up">MovieMonk</h1>
                        <p className="mt-4 text-xl md:text-2xl text-muted max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.15s' }}>Your AI-powered cinematic companion. Discover, explore, and analyze.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {DISCOVER_TITLES.map((title, idx) => (
                            <button
                                key={title}
                                onClick={() => onQuickSearch(title)}
                                className="glass-panel group relative p-6 flex flex-col items-start justify-between hover:border-violet-500/50 transition-all duration-300 min-h-[160px] rounded-xl text-left"
                                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                            >
                                <span className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-violet-600 to-pink-600 transition-opacity rounded-xl" />
                                <span className="text-xs font-medium text-violet-400 uppercase tracking-widest">Featured</span>
                                <h3 className="mt-2 text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">{title}</h3>
                                <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-muted group-hover:text-white transition-colors">
                                    <PlayIcon className="w-4 h-4" /> Explore
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto relative pt-3 md:pt-0">
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
            <div className="relative w-full h-[60vh] md:h-[70vh] mb-8 overflow-hidden">
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
                <div className="relative h-full flex items-end p-6 md:p-12 max-w-screen-xl mx-auto z-20">
                    <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
                        {/* Poster Card */}
                        <div className="flex-shrink-0 animate-fade-in" style={{ animationDelay: '0.05s', animationFillMode: 'forwards' }}>
                            <ImageWithFallback
                                src={movie.poster_url}
                                alt={`${movie.title} poster`}
                                className="w-48 md:w-56 lg:w-64 rounded-xl shadow-2xl border-4 border-white/20 aspect-[2/3] object-cover transform hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        {/* Title and Info Card */}
                        <div className="flex-1 text-left pb-4">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-2xl animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>{movie.title}</h1>
                            <p className="mt-3 text-lg md:text-xl text-brand-text-light font-semibold animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
                                {movie.year} &bull; {typeof movie.type === 'string' && movie.type.length > 0 ? movie.type.charAt(0).toUpperCase() + movie.type.slice(1) : ''}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
                                {safeGenres.map(genre => (
                                    <span key={genre} className="px-3 py-1.5 bg-white/20 text-white text-sm font-bold rounded-md backdrop-blur-md hover:bg-white/30 transition-colors shadow-lg">{genre}</span>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 items-center animate-slide-up" style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}>
                                {safeRatings.map(rating => (
                                    <div key={rating.source} className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20">
                                        {rating.source.toLowerCase().includes('rotten') && (
                                            <RottenTomatoesIcon className="w-6 h-6 text-red-500" />
                                        )}
                                        {rating.source.toLowerCase().includes('imdb') && (
                                            <StarIcon className="w-6 h-6 text-yellow-400" />
                                        )}
                                        <div>
                                            <p className="font-bold text-white text-base leading-tight">{rating.score}</p>
                                            <p className="text-xs text-gray-300">{rating.source}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {embedUrl && (
                                <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}>
                                    <button
                                        onClick={() => {
                                            track('trailer_opened', {
                                                title: movie.title,
                                                year: movie.year,
                                                type: movie.type
                                            });
                                            setIsTrailerOpen(true);
                                        }}
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-brand-primary text-white font-bold text-lg rounded-xl shadow-2xl hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-primary/50"
                                    >
                                        <PlayIcon className="w-6 h-6" />
                                        <span>Play Trailer</span>
                                    </button>
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
                        <p className="text-brand-text-dark leading-relaxed">{movie.summary_medium}</p>



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
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm bg-brand-primary/15 hover:bg-brand-primary/25 text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
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
                            <div className="gallery-container">
                                <div className="gallery-filmstrip">
                                    {safeExtraImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(img)}
                                            className="gallery-thumb"
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
                                <div className="gallery-info text-xs text-brand-text-dark mt-3">
                                    {safeExtraImages.length} images available • Click to view
                                </div>
                            </div>
                        ) : (
                            <p className="text-brand-text-dark text-sm italic">No gallery images available.</p>
                        )}
                    </Section>

                    <Section title="Cast & Crew">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {displayedCast.map(member => <CastCard key={member.name} member={member} />)}
                        </div>
                        {safeCast.length > 8 && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => setShowAllCast(!showAllCast)}
                                    className="px-4 py-2 text-sm font-semibold text-brand-primary bg-brand-primary/10 rounded-full hover:bg-brand-primary/20 transition-colors"
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
                    <Section title="Where to Watch">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {safeWhereToWatch.length > 0 ? safeWhereToWatch.map(option => <WatchCard key={option.platform + option.type} option={option} />) : <p className="text-brand-text-dark">Streaming information not available.</p>}
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
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="glass-panel p-6 rounded-2xl animate-slide-up">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white border-b border-white/5 pb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
            {title}
        </h2>
        {children}
    </div>
);

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

const WatchCard: React.FC<{ option: WatchOption }> = ({ option }) => {
    const TypeIcon = watchTypeIcons[option.type] || TvIcon;
    const key = option.platform.toLowerCase().trim();
    const Logo = platformLogos[key];
    return (
        <a
            href={option.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-white/10 bg-brand-surface/60 p-3 md:p-4 flex flex-col gap-2 md:gap-3 hover:shadow-lg hover:border-brand-primary/50 transition relative overflow-hidden"
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
                    <p className="text-xs text-brand-text-dark capitalize">{option.type}</p>
                </div>
            </div>
            <div className="flex justify-end">
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 text-xs font-bold rounded-lg bg-brand-primary/90 text-white transform transition-transform group-hover:scale-105 shadow-md">
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