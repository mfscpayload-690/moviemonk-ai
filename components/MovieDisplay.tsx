import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { track } from '@vercel/analytics/react';
import { MovieData, CastMember, WatchOption, GroundingSource, WebSource, WatchlistFolder, TmdbReview } from '../types';
import { EyeIcon, EyeSlashIcon, Logo, LinkIcon, PlayIcon, FilmIcon, TvIcon, TicketIcon, TagIcon, DollarIcon, RottenTomatoesIcon, StarIcon, ImageIcon, XMarkIcon, NetflixIcon, PrimeVideoIcon, HuluIcon, MaxIcon, DisneyPlusIcon, AppleTvIcon, ArrowLeftIcon, ArrowRightIcon, WatchedIcon } from './icons';
import type { AIProvider } from '../types';
import TVShowDisplay from './TVShowDisplay'; // Import TV Show display component
import { VirtualizedList } from './VirtualizedList';
import { useRenderCounter } from '../lib/perfDebug';
import { formatAiNotesHtml } from '../lib/aiNotesFormatter';
import RatingDisplay from './RatingDisplay';
import { WatchlistIconPicker, WatchlistIconBadge, WATCHLIST_ICON_DEFAULT } from './WatchlistIconPicker';
import { useActionFeedback } from '../hooks/useActionFeedback';

interface MovieDisplayProps {
    movie: MovieData | null;
    isLoading: boolean;
    sources: GroundingSource[] | null;
    selectedProvider: AIProvider;
    onFetchFullPlot: (title: string, year: string, type: string, provider: AIProvider) => Promise<string>;
    onQuickSearch: (title: string) => void;
    onOpenTitle?: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
    watchlists: WatchlistFolder[];
    onCreateWatchlist: (name: string, color: string, icon?: string) => string | null;
    onSaveToWatchlist: (folderId: string, movie: MovieData, savedTitle?: string) => void;
    isWatched?: boolean;
    onToggleWatched?: () => void;
    onToggleRelatedWatched?: (entry: { tmdb_id: string; media_type: 'movie' | 'tv'; title: string; poster_url?: string | null; year?: string | null; }) => void;
    isRelatedWatched?: (tmdbId: string, mediaType: 'movie' | 'tv') => boolean;
    onQuickSaveToWatchlist?: (entry: { id: number; media_type: 'movie' | 'tv'; title: string; year?: string; poster_url?: string | null; }) => void;
}

const LANGUAGE_NAME_BY_CODE: Record<string, string> = {
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    th: 'Thai',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    ml: 'Malayalam',
    bn: 'Bengali',
    mr: 'Marathi',
    pa: 'Punjabi',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    tr: 'Turkish',
    id: 'Indonesian'
};

const toSentenceCase = (value: string): string =>
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const formatDisplayLanguage = (value?: string): string => {
    if (!value || !value.trim()) return '';
    const normalized = value.trim();
    const lower = normalized.toLowerCase();

    if (LANGUAGE_NAME_BY_CODE[lower]) {
        return LANGUAGE_NAME_BY_CODE[lower];
    }

    if (normalized.length <= 3 && /^[a-zA-Z]{2,3}$/.test(normalized)) {
        return toSentenceCase(normalized);
    }

    return normalized;
};

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


const ImageWithFallback: React.FC<{ src: string, alt: string, className: string }> = ({ src, alt, className }) => {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setError(false);
        setLoaded(false);

        // Fallback: force show image after 2 seconds if onLoad doesn't fire
        const timeout = setTimeout(() => {
            setLoaded(true);
        }, 2000);

        return () => clearTimeout(timeout);
    }, [src]);

    const handleError = () => {
        setError(true);
    };

    const handleLoad = () => {
        setLoaded(true);
    };

    if (error || !src) {
        return (
            <div className={`${className} flex flex-col items-center justify-center bg-brand-surface border-2 border-dashed border-white/20 p-2`}>
                <ImageIcon className="w-1/4 h-1/4 text-brand-text-dark" />
                <p className="mt-2 text-xs text-center text-brand-text-dark">Image Unavailable</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Skeleton loader */}
            {!loaded && (
                <div className="absolute inset-0 image-skeleton rounded-lg" />
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-400 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onError={handleError}
                onLoad={handleLoad}
            />
        </div>
    );
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

const COLOR_PRESETS = ['#7c3aed', '#db2777', '#22c55e', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7'];

const MovieDisplay: React.FC<MovieDisplayProps> = ({ movie, isLoading, sources, selectedProvider, onFetchFullPlot, onQuickSearch, onOpenTitle, watchlists, onCreateWatchlist, onSaveToWatchlist, isWatched = false, onToggleWatched, onToggleRelatedWatched, isRelatedWatched, onQuickSaveToWatchlist }) => {
    useRenderCounter('MovieDisplay');
    const { triggerFeedback, isFeedbackActive } = useActionFeedback();
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
    const [newFolderIcon, setNewFolderIcon] = useState(WATCHLIST_ICON_DEFAULT);
    const [customSavedTitle, setCustomSavedTitle] = useState('');
    const [showRelatedModal, setShowRelatedModal] = useState(false);
    const heroPosterSrc = movie?.poster_url || movie?.backdrop_url || movie?.extra_images?.[0] || '';
    const canSave = (selectedFolderId && selectedFolderId.length > 0) || (newFolderName && newFolderName.trim().length > 0);
    const newFolderNameError = newFolderName.length > 0 && newFolderName.trim().length === 0 ? 'Folder name cannot be blank.' : '';

    const isSaved = useMemo(() => {
        if (!movie || !watchlists) return false;
        const currentId = movie.tmdb_id;
        const currentTitle = movie.title?.toLowerCase();

        return watchlists.some(folder =>
            folder.items.some(item =>
                (currentId && item.movie.tmdb_id === currentId) ||
                (currentTitle && item.movie.title?.toLowerCase() === currentTitle)
            )
        );
    }, [movie, watchlists]);

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
        setNewFolderIcon(WATCHLIST_ICON_DEFAULT);
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
                    type: 'subscription' as const,
                    confidence: undefined,
                    last_checked_at: undefined,
                    region: undefined
                };
            }
            // If object but missing fields, add defaults
            return {
                platform: option.platform || 'Unknown',
                link: option.link || '#',
                type: option.type || 'subscription',
                confidence: typeof option.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(option.confidence))) : undefined,
                last_checked_at: typeof option.last_checked_at === 'string' ? option.last_checked_at : undefined,
                region: typeof option.region === 'string' ? option.region.toUpperCase() : undefined
            };
        })
        : [];

    const handleSaveToWatchlist = () => {
        if (!movie) return;
        let folderId = selectedFolderId;
        if (!folderId && newFolderName.trim()) {
            const createdId = onCreateWatchlist(newFolderName, newFolderColor, newFolderIcon);
            if (createdId) {
                folderId = createdId;
                setSelectedFolderId(createdId);
            }
        }
        if (!folderId) return;
        onSaveToWatchlist(folderId, movie, customSavedTitle || movie.title);
        setShowWatchlistModal(false);
    };

    const handleToggleRelatedWatched = (item: any) => {
        onToggleRelatedWatched?.({
            tmdb_id: String(item.id),
            media_type: item.media_type,
            title: item.title,
            poster_url: item.poster_url ?? null,
            year: item.year ?? null,
        });
    };

    const openRelatedTitle = (item: any, context: 'inline' | 'modal') => {
        const canOpenDirectly = typeof item?.id === 'number' && (item?.media_type === 'movie' || item?.media_type === 'tv');
        if (canOpenDirectly && onOpenTitle) {
            onOpenTitle({
                id: item.id,
                mediaType: item.media_type === 'tv' ? 'tv' : 'movie'
            });
        } else {
            onQuickSearch(item.title);
        }
        if (context === 'modal') setShowRelatedModal(false);
    };

    const renderRelatedTile = (item: any, idx: number, context: 'inline' | 'modal') => {
        const watched = Boolean(onToggleRelatedWatched && isRelatedWatched?.(String(item.id), item.media_type));
        return (
            <div
                key={`${item.media_type}-${item.id}-${idx}`}
                role="button"
                tabIndex={0}
                className={`${context === 'inline' ? 'flex-shrink-0 w-24' : ''} text-left group touch-target outline-none`}
                onClick={() => {
                    (window as any)?.track && (window as any).track('related_tile_click', { type: item.media_type, id: item.id, title: item.title, context });
                    openRelatedTitle(item, context);
                }}
                onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    (window as any)?.track && (window as any).track('related_tile_click', { type: item.media_type, id: item.id, title: item.title, context });
                    openRelatedTitle(item, context);
                }}
                aria-label={`Open ${item.title}${item.year ? ` (${item.year})` : ''}`}
            >
                <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-white/5 group-hover:border-brand-primary/50 transition-colors ${context === 'inline' ? 'transform-gpu will-change-transform transition-[transform,box-shadow,border-color] duration-150 ease-out group-hover:-translate-y-px group-hover:shadow-lg' : ''}`}>
                    {item.poster_url ? (
                        <img src={item.poster_url} alt={`${item.title} poster`} className={`w-full h-full object-cover ${context === 'inline' ? 'transform-gpu transition-transform duration-150 ease-out group-hover:scale-[1.02]' : 'transition-transform duration-200 group-hover:scale-[1.04]'}`} loading="lazy" />
                    ) : (
                        <div className={`w-full h-full bg-white/10 ${context === 'modal' ? 'flex items-center justify-center p-2 text-center text-brand-text-dark text-[10px]' : ''}`}>{context === 'modal' ? item.title : null}</div>
                    )}
                    {(onToggleRelatedWatched || onQuickSaveToWatchlist) && (
                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                            {onQuickSaveToWatchlist ? (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        triggerFeedback(`related-save-${item.id}`);
                                        onQuickSaveToWatchlist(item);
                                    }}
                                    className={`h-7 w-7 rounded-full bg-black/60 border border-white/15 text-white/80 hover:bg-violet-500/90 hover:text-white flex items-center justify-center shadow-lg mm-action-feedback ${isFeedbackActive(`related-save-${item.id}`) ? 'is-feedback-active' : ''}`}
                                    aria-label={`Save ${item.title} to watchlist`}
                                    title="Save to watchlist"
                                >
                                    <TagIcon className="h-3.5 w-3.5" />
                                </button>
                            ) : <span />}
                            {onToggleRelatedWatched ? (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        triggerFeedback(`related-watch-${item.id}`);
                                        handleToggleRelatedWatched(item);
                                    }}
                                    className={`h-7 w-7 rounded-full border flex items-center justify-center shadow-lg transition-colors mm-action-feedback ${isFeedbackActive(`related-watch-${item.id}`) ? 'is-feedback-active' : ''} ${watched ? 'bg-green-500 border-green-400 text-white' : 'bg-black/60 border-white/15 text-white/80 hover:bg-green-500/90 hover:text-white'}`}
                                    aria-label={watched ? 'Mark as unwatched' : 'Mark as watched'}
                                    title={watched ? 'Watched ✓' : 'Mark as watched'}
                                >
                                    <WatchedIcon className="h-3.5 w-3.5" filled={watched} />
                                </button>
                            ) : <span />}
                        </div>
                    )}
                </div>
                <p className={`mt-1.5 font-semibold text-white line-clamp-2 ${context === 'inline' ? 'text-[11px] group-hover:text-brand-primary transition-colors duration-150 ease-out' : 'text-xs group-hover:text-brand-primary transition-colors'}`}>{item.title}</p>
                {item.year && <p className={`${context === 'inline' ? 'text-[10px]' : 'text-[10px]'} text-brand-text-dark`}>{item.year}</p>}
            </div>
        );
    };

    const safeExtraImages = movie && Array.isArray(movie.extra_images) ? movie.extra_images : [];

    const displayedCast = showAllCast ? safeCast : safeCast.slice(0, 8);
    const shouldVirtualizeCast = showAllCast && safeCast.length > 20;
    const castListHeight = Math.min(520, Math.max(260, safeCast.length * 120));

    // ── Reviews state & fetch ────────────────────────────────────────────
    const [reviews, setReviews]               = useState<TmdbReview[]>([]);
    const [reviewsVisible, setReviewsVisible]  = useState(2);
    const [reviewsLoading, setRevLoading]      = useState(false);
    const [reviewsLoadingMore, setRevLoadMore] = useState(false);
    const [reviewsPage, setReviewsPage]        = useState(1);
    const [reviewsTotalPages, setRevTotal]     = useState(1);
    const [expandedReview, setExpandedRev]     = useState<string | null>(null);
    const [reviewsSourceLabel, setReviewsSourceLabel] = useState<string>('TMDB');

    const normalizeTmdbReviews = useCallback((data: any): TmdbReview[] => {
        const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';
        const raw: any[] = Array.isArray(data?.results) ? data.results : [];
        return raw
            .filter((entry: any) => entry?.content && entry.content.trim().length > 40)
            .map((entry: any) => ({
                id: entry.id,
                author: entry.author || 'Anonymous',
                avatar_url: entry.author_details?.avatar_path
                    ? entry.author_details.avatar_path.startsWith('/')
                        ? `${TMDB_IMG}${entry.author_details.avatar_path}`
                        : entry.author_details.avatar_path
                    : null,
                rating: entry.author_details?.rating ?? null,
                content: entry.content.trim(),
                url: entry.url || null,
                created_at: entry.created_at || null,
            }));
    }, []);

    const fetchTmdbReviewsPage = useCallback(async (
        mediaType: 'movie' | 'tv',
        tmdbId: string,
        page: number,
        language?: string
    ): Promise<{ reviews: TmdbReview[]; totalPages: number }> => {
        const endpoint = `${mediaType}/${tmdbId}/reviews`;
        const params = new URLSearchParams({
            endpoint,
            page: String(page)
        });
        if (language) params.set('language', language);
        const response = await fetch(`/api/tmdb?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch TMDB reviews');
        const data = await response.json();
        return {
            reviews: normalizeTmdbReviews(data),
            totalPages: data?.total_pages ?? 1
        };
    }, [normalizeTmdbReviews]);

    const dedupeReviews = useCallback((items: TmdbReview[]): TmdbReview[] => {
        const seen = new Set<string>();
        const deduped: TmdbReview[] = [];
        for (const item of items) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            deduped.push(item);
        }
        return deduped;
    }, []);

    const loadReviews = useCallback(async () => {
        if (!movie?.tmdb_id) return;
        const mediaType = movie.tvShow ? 'tv' : 'movie';
        setReviews([]);
        setExpandedRev(null);
        setReviewsVisible(2);
        setReviewsPage(1);
        setRevTotal(1);
        setReviewsSourceLabel('TMDB');
        setRevLoading(true);
        const preferredLanguage = movie.language && movie.language.trim() ? movie.language.trim() : undefined;

        try {
            const primary = await fetchTmdbReviewsPage(mediaType, movie.tmdb_id, 1, 'en-US');
            let merged = primary.reviews;
            let sourceLabel = 'TMDB';

            if (merged.length < 3) {
                const fallbackLanguages = [undefined, preferredLanguage]
                    .filter((language, index, arr) => {
                        if (language === 'en-US') return false;
                        return arr.indexOf(language) === index;
                    });

                for (const language of fallbackLanguages) {
                    try {
                        const next = await fetchTmdbReviewsPage(mediaType, movie.tmdb_id, 1, language);
                        merged = dedupeReviews([...merged, ...next.reviews]);
                    } catch {
                        // Best-effort fallback, ignore per-language failure.
                    }
                }
            }

            if (merged.length < 2) {
                try {
                    const recEndpoint = `${mediaType}/${movie.tmdb_id}/recommendations`;
                    const recResponse = await fetch(`/api/tmdb?endpoint=${encodeURIComponent(recEndpoint)}&language=en-US&page=1`);
                    const recData = await recResponse.json();
                    const recIds: number[] = Array.isArray(recData?.results)
                        ? recData.results.slice(0, 4).map((entry: any) => entry?.id).filter(Boolean)
                        : [];

                    if (recIds.length > 0) sourceLabel = 'TMDB + Similar Titles';

                    for (const recId of recIds) {
                        if (merged.length >= 8) break;
                        try {
                            const related = await fetchTmdbReviewsPage(mediaType, String(recId), 1, 'en-US');
                            merged = dedupeReviews([...merged, ...related.reviews]);
                        } catch {
                            // Ignore per-title review fetch failures.
                        }
                    }
                } catch {
                    // Keep base reviews only when recommendations fail.
                }
            }

            setReviews(merged);
            setRevTotal(primary.totalPages);
            setReviewsSourceLabel(sourceLabel);
        } catch {
            setReviews([]);
        } finally {
            setRevLoading(false);
        }
    }, [dedupeReviews, fetchTmdbReviewsPage, movie?.language, movie?.tmdb_id, movie?.tvShow]);

    useEffect(() => {
        if (!movie?.tmdb_id) return;
        void loadReviews();
    }, [loadReviews, movie?.tmdb_id]);

    const renderCastItem = useCallback((member: CastMember) => (
        <div className="px-1 py-1">
            <CastCard key={member.name} member={member} onClick={() => onQuickSearch(member.name)} />
        </div>
    ), [onQuickSearch]);


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
            <div className="min-h-full flex items-center justify-center p-6 pt-24 animate-fade-in relative">
                <div className="absolute inset-0 bg-gradient-radial from-violet-900/20 to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto w-full relative z-10">
                    <div className="text-center mb-12">
                        <Logo className="mx-auto h-20 w-20 md:h-24 md:w-24 animate-fade-in text-primary drop-shadow-glow" />
                        <h1 className="mt-6 text-4xl md:text-7xl font-extrabold tracking-tighter text-gradient-primary animate-slide-up">MovieMonk</h1>
                        <p className="mt-4 text-lg md:text-2xl text-muted max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.15s' }}>Your AI-powered cinematic companion. Discover, explore, and analyze.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 pb-20">
                        {DISCOVER_TITLES.map((title, idx) => (
                            <button
                                key={title}
                                onClick={() => onQuickSearch(title)}
                                className="glass-panel group relative p-4 md:p-6 flex flex-col items-start justify-between hover:border-violet-500/50 transition-all duration-300 min-h-[130px] md:min-h-[160px] rounded-xl text-left"
                                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                            >
                                <span className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-violet-600 to-pink-600 transition-opacity rounded-xl" />
                                <span className="text-[10px] md:text-xs font-medium text-violet-400 uppercase tracking-widest">Featured</span>
                                <h3 className="mt-1 md:mt-2 text-lg md:text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">{title}</h3>
                                <span className="mt-auto inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-muted group-hover:text-white transition-colors">
                                    <PlayIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> Explore
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // If this is a TV show with episode data, use the dedicated TV Show display
    if (movie && movie.tvShow) {
        return <TVShowDisplay movie={movie} isWatched={isWatched} onToggleWatched={onToggleWatched} />;
    }

    // Otherwise, use the standard movie display
    const heroMetaParts = [
        movie.year,
        typeof movie.type === 'string' && movie.type.length > 0 ? movie.type.charAt(0).toUpperCase() + movie.type.slice(1) : '',
        formatDisplayLanguage(movie.language)
    ].filter((part) => typeof part === 'string' && part.trim().length > 0);

    return (
        <div className="relative min-h-full">
            {/* Hero Section with Poster Card */}
            <div className="relative w-full min-h-[55vh] md:min-h-[70vh] mb-6 md:mb-8 overflow-hidden">
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
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-8 w-full sm:w-auto">
                        {/* Poster Card - Shows Above text on mobile now */}
                        <div className="flex-shrink-0 animate-fade-in will-change-transform" style={{ animationDelay: '0.05s', animationFillMode: 'forwards' }}>
                            <ImageWithFallback
                                src={heroPosterSrc}
                                alt={`${movie.title} poster`}
                                className="w-40 sm:w-40 md:w-56 lg:w-64 rounded-lg md:rounded-xl shadow-2xl border-2 md:border-4 border-white/20 aspect-[2/3] poster-hover-effect"
                            />
                        </div>

                        {/* Title and Info Card */}
                        <div className="flex-1 text-center sm:text-left pb-2 md:pb-4 w-full sm:w-auto">
                            <h1 className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-2xl animate-fade-in leading-tight text-depth" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>{movie.title}</h1>
                            <p className="mt-2 md:mt-3 text-sm sm:text-base md:text-xl text-brand-text-light font-semibold animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
                                {heroMetaParts.join(' \u2022 ')}
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
                                                <RatingDisplay score={rating.score} size="md" compact={true} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {movie && (
                                <div className="mt-4 md:mt-8 animate-slide-up flex flex-wrap justify-center sm:justify-start gap-3" style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}>
                                    {/* Watched button */}
                                    <button
                                        onClick={() => {
                                            triggerFeedback('hero-watch');
                                            onToggleWatched?.();
                                        }}
                                        className={`inline-flex items-center gap-2 px-5 py-3 font-semibold text-sm md:text-base rounded-xl border transition-all duration-300 touch-target btn-mobile-friendly mm-action-feedback ${isFeedbackActive('hero-watch') ? 'is-feedback-active' : ''} ${
                                            isWatched
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                                                : 'bg-white/10 border-white/15 text-white hover:bg-white/20 hover:border-white/30'
                                        }`}
                                        aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                                        title={isWatched ? 'Click to unmark as watched' : 'Mark as watched'}
                                    >
                                        <WatchedIcon className="w-5 h-5" filled={isWatched} />
                                        <span>{isWatched ? 'Watched ✓' : 'Mark Watched'}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            triggerFeedback('hero-save');
                                            setShowWatchlistModal(true);
                                        }}
                                        className={`inline-flex items-center gap-2 px-5 py-3 font-semibold text-sm md:text-base rounded-xl border transition-all duration-200 touch-target btn-mobile-friendly mm-action-feedback ${isFeedbackActive('hero-save') ? 'is-feedback-active' : ''} ${
                                            isSaved
                                                ? 'bg-violet-500/20 border-violet-500/50 text-violet-400 hover:bg-violet-500/30'
                                                : 'bg-white/15 text-white border-white/15 hover:border-brand-primary/50 hover:bg-white/20'
                                        }`}
                                        aria-label={isSaved ? 'Manage Watchlist' : 'Save to Watchlist'}
                                    >
                                        <TagIcon className="w-5 h-5" />
                                        <span>{isSaved ? 'Saved to List ✓' : 'Save to List'}</span>
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
                        {shouldVirtualizeCast ? (
                            <div className="content-visibility-auto">
                                <VirtualizedList
                                    items={safeCast}
                                    itemHeight={128}
                                    height={castListHeight}
                                    renderItem={(item) => renderCastItem(item)}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {displayedCast.map(member => <CastCard key={member.name} member={member} onClick={() => onQuickSearch(member.name)} />)}
                            </div>
                        )}
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
                        {/* Crew Cards */}
                        {(movie.crew?.director || movie.crew?.writer || movie.crew?.music) && (() => {
                            const crewEntries: { names: string[]; role: string }[] = [
                                { names: (movie.crew?.director || '').split(',').map((n: string) => n.trim()).filter(Boolean), role: 'Director' },
                                { names: (movie.crew?.writer || '').split(',').map((n: string) => n.trim()).filter(Boolean), role: 'Writer' },
                                { names: (movie.crew?.music || '').split(',').map((n: string) => n.trim()).filter(Boolean), role: 'Composer' },
                            ].filter(e => e.names.length > 0 && e.names[0] !== 'Unknown');

                            if (crewEntries.length === 0) return null;
                            return (
                                <div className="mt-6">
                                    <p className="text-xs font-semibold text-brand-text-dark uppercase tracking-widest mb-3">Behind the Camera</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {crewEntries.flatMap(({ names, role }) =>
                                            names.map(name => (
                                                <CrewCard
                                                    key={`${role}-${name}`}
                                                    name={name}
                                                    role={role}
                                                    onClick={() => onQuickSearch(name)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </Section>

                    <Section title="AI Notes & Trivia">
                        <div className="ai-notes-rich" dangerouslySetInnerHTML={{ __html: formatAiNotesHtml(movie.ai_notes) }} />
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
                                        {(movie as any).related.slice(0, 12).map((it: any, idx: number) => renderRelatedTile(it, idx, 'inline'))}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button className="text-xs px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transform-gpu transition-[background-color,transform] duration-150 ease-out hover:-translate-y-px touch-target" onClick={() => { (window as any)?.track && (window as any).track('related_see_all_open', { type: 'title', id: movie.tmdb_id }); setShowRelatedModal(true); }}>See all</button>
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

            {/* ── User Reviews — full-width below the grid ────────────────── */}
            <div className="mt-8 pb-8 px-4 md:px-8">

                    {/* Section header */}
                    <div className="flex items-center justify-between mb-6 border-b border-white/6 pb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <svg className="w-5 h-5 text-brand-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
                            </svg>
                            <h2 className="text-lg font-bold text-white">User Reviews</h2>
                            {!reviewsLoading && reviews.length > 0 && (
                                <span className="text-[11px] text-brand-text-dark px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                    {reviews.length}{reviewsTotalPages > 1 ? '+' : ''} review{reviews.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            <span className="text-[11px] text-brand-text-dark px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                Source: {reviewsSourceLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => void loadReviews()}
                                disabled={reviewsLoading}
                                className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-brand-text-light hover:text-white hover:bg-white/10 disabled:opacity-60 transition-colors"
                            >
                                {reviewsLoading ? 'Refreshing…' : 'Refresh reviews'}
                            </button>
                            <p className="text-[11px] text-brand-text-dark hidden sm:block">Real user sentiment</p>
                        </div>
                    </div>

                    {/* Skeleton */}
                    {reviewsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2].map(i => (
                                <div key={i} className="animate-pulse rounded-2xl p-5 bg-white/[0.03] border border-white/6">
                                    <div className="flex gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                                        <div className="flex-1 space-y-2 pt-1">
                                            <div className="h-3 bg-white/10 rounded w-1/3" />
                                            <div className="h-2.5 bg-white/8 rounded w-1/4" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2.5 bg-white/8 rounded w-full" />
                                        <div className="h-2.5 bg-white/8 rounded w-5/6" />
                                        <div className="h-2.5 bg-white/8 rounded w-4/6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {reviews.length === 0 ? (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                                    <p className="text-white font-semibold text-sm">No reviews available yet</p>
                                    <p className="text-xs text-brand-text-dark mt-1">This title has limited public reviews right now.</p>
                                    <button
                                        type="button"
                                        onClick={() => void loadReviews()}
                                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-brand-text-light hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : (
                                <>
                            {/* Review cards grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {reviews.slice(0, reviewsVisible).map(rev => {
                                    const isExp = expandedReview === rev.id;
                                    const LIMIT = 220;
                                    const isLong = rev.content.length > LIMIT;
                                    const text = isExp || !isLong
                                        ? rev.content
                                        : rev.content.slice(0, LIMIT).trimEnd() + '…';
                                    const date = rev.created_at
                                        ? new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                        : null;
                                    return (
                                        <div key={rev.id} className="flex flex-col rounded-2xl p-5 bg-white/[0.03] border border-white/6 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-200">
                                            {/* Author row */}
                                            <div className="flex items-start gap-3 mb-3">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-600/60 to-pink-600/60 flex items-center justify-center border border-white/10 mt-0.5">
                                                    {rev.avatar_url ? (
                                                        <img src={rev.avatar_url} alt={rev.author} className="w-full h-full object-cover" loading="lazy"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold text-white/80">{rev.author[0]?.toUpperCase() || '?'}</span>
                                                    )}
                                                </div>
                                                {/* Name + meta */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-white leading-tight truncate">{rev.author}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        {rev.rating !== null && (
                                                            <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                                                ★ {rev.rating % 1 === 0 ? rev.rating : rev.rating.toFixed(1)}<span className="text-amber-400/50">/10</span>
                                                            </span>
                                                        )}
                                                        {date && <span className="text-[10px] text-brand-text-dark">{date}</span>}
                                                    </div>
                                                </div>
                                                {/* TMDB link */}
                                                {rev.url && (
                                                    <a href={rev.url} target="_blank" rel="noopener noreferrer"
                                                        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-brand-text-dark hover:text-brand-primary hover:bg-white/10 transition-all"
                                                        title="Full review on TMDB" aria-label="Read full review on TMDB"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                            {/* Divider */}
                                            <div className="border-t border-white/5 mb-3" />
                                            {/* Review text */}
                                            <p className="text-[13px] text-brand-text-light leading-relaxed flex-1">{text}</p>
                                            {isLong && (
                                                <button
                                                    onClick={() => setExpandedRev(isExp ? null : rev.id)}
                                                    className="mt-3 text-[11px] text-brand-primary hover:text-brand-secondary font-semibold transition-colors self-start flex items-center gap-1"
                                                >
                                                    {isExp ? (
                                                        <><span>Show less</span><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg></>
                                                    ) : (
                                                        <><span>Read more</span><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg></>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Load more */}
                            {(reviewsVisible < reviews.length || reviewsPage < reviewsTotalPages) && (
                                <div className="flex justify-center mt-6">
                                    <button
                                        onClick={async () => {
                                            if (reviewsVisible < reviews.length) {
                                                setReviewsVisible(v => Math.min(v + 2, reviews.length));
                                                return;
                                            }
                                            if (reviewsPage >= reviewsTotalPages || !movie?.tmdb_id) return;

                                            const nextPage = reviewsPage + 1;
                                            const mediaType = movie?.tvShow ? 'tv' : 'movie';
                                            setRevLoadMore(true);
                                            try {
                                                const next = await fetchTmdbReviewsPage(mediaType, movie.tmdb_id, nextPage, 'en-US');
                                                setReviews(prev => dedupeReviews([...prev, ...next.reviews]));
                                                setReviewsVisible(prev => prev + 2);
                                                setReviewsPage(nextPage);
                                            } catch {
                                                // Keep existing reviews on transient errors.
                                            } finally {
                                                setRevLoadMore(false);
                                            }
                                        }}
                                        disabled={reviewsLoadingMore}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-sm text-white font-medium transition-all duration-200 disabled:opacity-50"
                                    >
                                        {reviewsLoadingMore ? (
                                            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Loading…</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg> Load more reviews</>
                                        )}
                                    </button>
                                </div>
                            )}
                                </>
                            )}
                            <p className="text-[11px] text-brand-text-dark text-center mt-4">Reviews sourced from The Movie Database (TMDB)</p>
                        </>
                    )}
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
                            <WatchlistIconPicker selectedIcon={newFolderIcon} onSelect={setNewFolderIcon} compactLabel="Pick a folder icon" />
                            <p className="text-xs text-brand-text-dark">Pick an icon so the folder stands out on your watchlists page.</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2">
                            {/* Selected target indicator */}
                            <div className="text-xs text-brand-text-dark">
                                {selectedFolderId ? (
                                    (() => {
                                        const folder = watchlists.find(f => f.id === selectedFolderId);
                                        return folder ? (
                                            <span className="inline-flex items-center gap-2">
                                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-white">
                                                    <WatchlistIconBadge iconKey={folder.icon || WATCHLIST_ICON_DEFAULT} className="h-3 w-3" />
                                                </span>
                                                <span>Saving to: <span className="text-white font-semibold">{folder.name}</span></span>
                                            </span>
                                        ) : null;
                                    })()
                                ) : newFolderName.trim().length > 0 ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-white">
                                            <WatchlistIconBadge iconKey={newFolderIcon} className="h-3 w-3" />
                                        </span>
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
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" onClick={() => setShowRelatedModal(false)}>
                    <div className="w-full sm:max-w-5xl bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: 'min(92dvh, 820px)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/8 flex-shrink-0">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-white">Similar Titles</h3>
                                {Array.isArray((movie as any).related) && (
                                    <p className="text-xs text-brand-text-dark mt-0.5">{(movie as any).related.length} titles</p>
                                )}
                            </div>
                            <button onClick={() => setShowRelatedModal(false)} className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary" aria-label="Close similar titles modal">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto overscroll-contain flex-1 p-4 sm:p-6">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                            {Array.isArray((movie as any).related) && (movie as any).related.length > 0 ? (
                                (movie as any).related.map((it: any, idx: number) => renderRelatedTile(it, idx, 'modal'))
                            ) : (
                                <p className="text-brand-text-dark col-span-full">No similar titles found.</p>
                            )}
                            </div>
                        </div>
                    </div>
                </div>,
                modalRoot
            )}
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="glass-panel p-6 rounded-2xl animate-slide-up content-visibility-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white border-b border-white/5 pb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
            {title}
        </h2>
        {children}
    </div>
);

const CastCard: React.FC<{ member: CastMember; onClick?: () => void }> = ({ member, onClick }) => (
    <button
        className="bg-white/5 p-3 md:p-4 rounded-xl text-center transform-gpu will-change-transform hover:-translate-y-1 transition-all duration-200 ease-out border border-transparent hover:border-brand-primary/40 hover:bg-white/8 group w-full relative"
        onClick={onClick}
        type="button"
        aria-label={`View profile of ${member.name}`}
    >
        <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-brand-primary/50 transition-colors mb-3 bg-gradient-to-br from-violet-600/30 to-pink-600/30 flex items-center justify-center flex-shrink-0">
            {member.profile_url ? (
                <img
                    src={member.profile_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : (
                <span className="text-xl md:text-2xl font-bold text-white/60">{member.name?.[0]?.toUpperCase() || '?'}</span>
            )}
        </div>
        <p className="font-bold text-xs md:text-sm text-white truncate" title={member.name}>{member.name}</p>
        <p className="text-[11px] md:text-xs text-brand-primary truncate mt-0.5" title={member.role}>{member.role}</p>
        {/* Hover overlay hint */}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="absolute inset-0 bg-black/40 rounded-xl" />
            <span className="relative z-10 text-[11px] font-semibold text-white/90 flex items-center gap-1">
                View Profile
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </span>
        </span>
    </button>
);

// Module-level cache so we never double-fetch the same name
const crewImageCache = new Map<string, string | null>();

const CrewCard: React.FC<{ name: string; role: string; onClick: () => void }> = ({ name, role, onClick }) => {
    const [photoUrl, setPhotoUrl] = React.useState<string | null | undefined>(undefined);

    React.useEffect(() => {
        if (!name) return;
        const key = name.toLowerCase().trim();
        if (crewImageCache.has(key)) {
            setPhotoUrl(crewImageCache.get(key)!);
            return;
        }
        let cancelled = false;
        fetch(`/api/resolveEntity?q=${encodeURIComponent(name)}`)
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                // Pick the top person candidate's profile_url
                const person = (data?.shortlisted || []).find((c: any) => c.type === 'person' || !c.type);
                const url = person?.profile_url || null;
                crewImageCache.set(key, url);
                setPhotoUrl(url);
            })
            .catch(() => {
                if (!cancelled) {
                    crewImageCache.set(key, null);
                    setPhotoUrl(null);
                }
            });
        return () => { cancelled = true; };
    }, [name]);

    return (
        <button
            className="bg-white/5 p-3 rounded-xl text-center transform-gpu will-change-transform hover:-translate-y-1 transition-all duration-200 ease-out border border-transparent hover:border-brand-primary/40 hover:bg-white/8 group w-full relative"
            onClick={onClick}
            type="button"
            aria-label={`View profile of ${name}`}
        >
            <div className="mx-auto w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-brand-primary/50 transition-colors mb-2 bg-gradient-to-br from-fuchsia-700/40 to-indigo-700/40 flex items-center justify-center flex-shrink-0">
                {photoUrl === undefined ? (
                    /* Loading shimmer */
                    <div className="w-full h-full animate-pulse bg-white/10" />
                ) : photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <span className="text-lg font-bold text-white/70">{name?.[0]?.toUpperCase() || '?'}</span>
                )}
            </div>
            <p className="font-bold text-xs text-white truncate" title={name}>{name}</p>
            <p className="text-[10px] text-brand-text-dark uppercase tracking-wider mt-0.5">{role}</p>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="absolute inset-0 bg-black/40 rounded-xl" />
                <span className="relative z-10 text-[10px] font-semibold text-white/90 flex items-center gap-1">
                    View Profile
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </span>
            </span>
        </button>
    );
}

const formatRelativeCheckedAt = (checkedAt?: string): string => {
    if (!checkedAt) return 'Checked recently';
    const timestamp = Date.parse(checkedAt);
    if (!Number.isFinite(timestamp)) return 'Checked recently';

    const diffMs = Date.now() - timestamp;
    if (diffMs < 60_000) return 'Checked just now';
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) return `Checked ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Checked ${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Checked ${days}d ago`;
    return `Checked ${new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

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
    const confidence = typeof option.confidence === 'number'
        ? Math.max(0, Math.min(100, Math.round(option.confidence)))
        : null;
    const confidenceToneClass = confidence !== null && confidence >= 85
        ? 'text-emerald-300'
        : confidence !== null && confidence >= 75
            ? 'text-amber-300'
            : 'text-rose-300';
    const checkedLabel = formatRelativeCheckedAt(option.last_checked_at);

    return (
        <a
            href={option.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group rounded-xl border border-white/10 bg-brand-surface/60 p-3 md:p-4 flex flex-col gap-2 md:gap-3 hover:shadow-lg transition-shadow relative overflow-hidden platform-card touch-target ${platformClass}`}
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
                    <div className="mt-1 flex items-center gap-2 text-[10px] md:text-[11px]">
                        <span className={`font-semibold ${confidenceToneClass}`}>
                            {confidence !== null ? `${confidence}% confidence` : 'Confidence pending'}
                        </span>
                        <span className="text-brand-text-dark">•</span>
                        <span className="text-brand-text-dark">{checkedLabel}</span>
                        {option.region && (
                            <>
                                <span className="text-brand-text-dark">•</span>
                                <span className="text-brand-text-dark">Region {option.region}</span>
                            </>
                        )}
                    </div>
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
