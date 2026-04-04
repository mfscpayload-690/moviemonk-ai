import React, { useState, useEffect, useCallback } from 'react';
import { MovieData, TVShowEpisode, TVShowSeason, TmdbReview, WatchOption } from '../types';
import { PlayIcon, CalendarIcon, ClockIcon, StarIcon, TvIcon, LinkIcon, WatchedIcon } from './icons';
import { formatAiNotesHtml } from '../lib/aiNotesFormatter';
import RatingDisplay from './RatingDisplay';
import '../styles/tv-show.css';

interface TVShowDisplayProps {
    movie: MovieData; // Actually a TV show with tvShow data
    isWatched?: boolean;
    onToggleWatched?: () => void;
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

const TVShowDisplay: React.FC<TVShowDisplayProps> = ({ movie, isWatched = false, onToggleWatched }) => {
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
    const [reviews, setReviews] = useState<TmdbReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [expandedReview, setExpandedReview] = useState<string | null>(null);
    const [reviewsSourceLabel, setReviewsSourceLabel] = useState<string>('TMDB');

    if (!movie.tvShow) {
        return <div className="error">No TV show data available</div>;
    }

    const tvShow = movie.tvShow;
    const seasonsData = tvShow.seasons || [];
    const selectedSeasonData = seasonsData.find(s => s.number === selectedSeason);
    const episodesForSeason = (tvShow.episodes || []).filter(e => e.season === selectedSeason);
    const safeWhereToWatch: WatchOption[] = Array.isArray(movie.where_to_watch)
        ? movie.where_to_watch.map((option: any) => ({
            platform: option?.platform || 'Unknown',
            link: option?.link || '#',
            type: option?.type || 'subscription',
            confidence: typeof option?.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(option.confidence))) : undefined,
            last_checked_at: typeof option?.last_checked_at === 'string' ? option.last_checked_at : undefined,
            region: typeof option?.region === 'string' ? option.region.toUpperCase() : undefined
        }))
        : [];
    const languageLabel = formatDisplayLanguage(movie.language || tvShow.language);
    const premieredYear = tvShow.premiered ? new Date(tvShow.premiered).getFullYear().toString() : movie.year;
    const headerMetaParts = [
        premieredYear,
        'TV Series',
        languageLabel
    ].filter((part) => typeof part === 'string' && part.trim().length > 0);

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

    const fetchTvReviewsPage = useCallback(async (tmdbId: string, language?: string): Promise<TmdbReview[]> => {
        const params = new URLSearchParams({
            endpoint: `tv/${tmdbId}/reviews`,
            page: '1'
        });
        if (language) params.set('language', language);
        const response = await fetch(`/api/tmdb?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch TV reviews');
        const data = await response.json();
        return normalizeTmdbReviews(data);
    }, [normalizeTmdbReviews]);

    const loadReviews = useCallback(async () => {
        if (!movie.tmdb_id) return;
        setReviews([]);
        setExpandedReview(null);
        setReviewsLoading(true);
        setReviewsSourceLabel('TMDB');

        try {
            let merged = await fetchTvReviewsPage(movie.tmdb_id, 'en-US');
            let sourceLabel = 'TMDB';

            if (merged.length < 3) {
                const fallbacks = [undefined, movie.language].filter((lang, idx, arr) => arr.indexOf(lang) === idx);
                for (const language of fallbacks) {
                    try {
                        const more = await fetchTvReviewsPage(movie.tmdb_id, language || undefined);
                        merged = dedupeReviews([...merged, ...more]);
                    } catch {
                        // Best-effort fallback.
                    }
                }
            }

            if (merged.length < 2) {
                try {
                    const recParams = new URLSearchParams({
                        endpoint: `tv/${movie.tmdb_id}/recommendations`,
                        language: 'en-US',
                        page: '1'
                    });
                    const recResponse = await fetch(`/api/tmdb?${recParams.toString()}`);
                    const recData = await recResponse.json();
                    const recIds: number[] = Array.isArray(recData?.results)
                        ? recData.results.slice(0, 4).map((entry: any) => entry?.id).filter(Boolean)
                        : [];

                    if (recIds.length > 0) sourceLabel = 'TMDB + Similar Titles';

                    for (const recId of recIds) {
                        if (merged.length >= 8) break;
                        try {
                            const related = await fetchTvReviewsPage(String(recId), 'en-US');
                            merged = dedupeReviews([...merged, ...related]);
                        } catch {
                            // Ignore individual related title failures.
                        }
                    }
                } catch {
                    // Ignore recommendation fallback failures.
                }
            }

            setReviews(merged);
            setReviewsSourceLabel(sourceLabel);
        } catch {
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    }, [dedupeReviews, fetchTvReviewsPage, movie.language, movie.tmdb_id]);

    useEffect(() => {
        if (!movie.tmdb_id) return;
        void loadReviews();
    }, [loadReviews, movie.tmdb_id]);

    // Status badge color
    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('running') || s.includes('returning')) return 'bg-green-500';
        if (s.includes('ended')) return 'bg-gray-500';
        if (s.includes('development')) return 'bg-blue-500';
        return 'bg-gray-400';
    };

    return (
        <div className="tv-show-display">
            {/* TV Show Header */}
            <div className="tv-show-header">
                <div className="backdrop-container" style={{
                    backgroundImage: movie.backdrop_url ? `url(${movie.backdrop_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <div className="backdrop-overlay"></div>
                </div>

                <div className="tv-show-info">
                    {movie.poster_url && (
                        <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="tv-show-poster"
                        />
                    )}

                    <div className="tv-show-meta">
                        <div className="tv-badge">
                            <TvIcon className="icon-small" />
                            <span>TV Series</span>
                        </div>

                        <h1 className="tv-show-title">{movie.title}</h1>

                        {headerMetaParts.length > 0 && (
                            <div className="tv-show-dates">
                                <span>{headerMetaParts.join(' \u2022 ')}</span>
                            </div>
                        )}

                        <div className="tv-show-stats">
                            <span className={`status-badge ${getStatusColor(tvShow.status)}`}>
                                {tvShow.status}
                            </span>

                            {movie.ratings.length > 0 && (
                                <div className="rating-badge">
                                    <RatingDisplay score={movie.ratings[0].score} size="sm" compact={true} />
                                </div>
                            )}

                            <div className="info-item">
                                <span>{tvShow.totalSeasons} Season{tvShow.totalSeasons !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="info-item">
                                <span>{tvShow.totalEpisodes} Episodes</span>
                            </div>

                            {tvShow.network && (
                                <div className="info-item">
                                    <span>{tvShow.network}</span>
                                </div>
                            )}
                        </div>

                        {tvShow.premiered && tvShow.ended && (
                            <div className="tv-show-dates">
                                <CalendarIcon className="icon-small" />
                                <span>
                                    {new Date(tvShow.premiered).getFullYear()} - {new Date(tvShow.ended).getFullYear()}
                                </span>
                            </div>
                        )}

                        {movie.genres.length > 0 && (
                            <div className="tv-show-genres">
                                {movie.genres.map(genre => (
                                    <span key={genre} className="genre-tag">{genre}</span>
                                ))}
                            </div>
                        )}

                        {/* Watched button */}
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                onClick={onToggleWatched}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '0.75rem',
                                    border: isWatched ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.15)',
                                    background: isWatched ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.1)',
                                    color: isWatched ? '#34d399' : '#fff',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                }}
                                aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                            >
                                <WatchedIcon className="icon-small" filled={isWatched} />
                                <span>{isWatched ? 'Watched ✓' : 'Mark Watched'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            {movie.summary_medium && (
                <div className="tv-show-section">
                    <h2>Overview</h2>
                    <p className="tv-show-summary">{movie.summary_medium}</p>
                </div>
            )}

            <div className="tv-show-section">
                <h2>Where to Watch</h2>
                {safeWhereToWatch.length > 0 ? (
                    <div className="tv-watch-grid">
                        {safeWhereToWatch.map((option) => (
                            <a
                                key={`${option.platform}-${option.type}`}
                                href={option.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tv-watch-card"
                            >
                                <div className="tv-watch-top">
                                    <span className="tv-watch-platform">{option.platform}</span>
                                    <span className="tv-watch-type">{option.type}</span>
                                </div>
                                <div className="tv-watch-meta">
                                    <span className={typeof option.confidence === 'number' && option.confidence >= 85 ? 'tv-watch-confidence high' : 'tv-watch-confidence'}>
                                        {typeof option.confidence === 'number' ? `${option.confidence}% confidence` : 'Confidence pending'}
                                    </span>
                                    <span className="tv-watch-dot">•</span>
                                    <span>{formatRelativeCheckedAt(option.last_checked_at)}</span>
                                    {option.region && (
                                        <>
                                            <span className="tv-watch-dot">•</span>
                                            <span>Region {option.region}</span>
                                        </>
                                    )}
                                </div>
                                <div className="tv-watch-cta">
                                    <PlayIcon className="icon-tiny" />
                                    <span>Open</span>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="tv-watch-empty">
                        Streaming info is not available for this title right now.
                    </div>
                )}
            </div>

            {/* Season Selector */}
            <div className="tv-show-section">
                <div className="season-selector-header">
                    <h2>Episodes</h2>
                    <div className="season-controls">
                        <select
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(Number(e.target.value))}
                            className="season-select"
                        >
                            {seasonsData.map(season => (
                                <option key={season.number} value={season.number}>
                                    Season {season.number} • {season.episodeCount} eps
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Season Info */}
                {selectedSeasonData && (
                    <div className="season-info-card">
                        {selectedSeasonData.premiereDate && (
                            <div className="season-meta">
                                <CalendarIcon className="icon-small" />
                                <span>
                                    Premiered: {new Date(selectedSeasonData.premiereDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                        <div className="season-progress-bar">
                            <div className="season-progress-fill" style={{ width: '0%' }}></div>
                        </div>
                        <div className="season-stats">
                            <span>{episodesForSeason.length} Episodes</span>
                        </div>
                    </div>
                )}

                {/* Episode List */}
                <div className="episode-list">
                    {episodesForSeason.length > 0 ? (
                        episodesForSeason.map((episode) => (
                            <div
                                key={episode.id}
                                className={`episode-card-enhanced ${expandedEpisode === episode.id ? 'expanded' : ''}`}
                                onClick={() => setExpandedEpisode(expandedEpisode === episode.id ? null : episode.id)}
                            >
                                <div className="episode-card-inner">
                                    {episode.image && (
                                        <div className="episode-thumbnail-container">
                                            <img
                                                src={episode.image}
                                                alt={episode.name}
                                                className="episode-thumbnail-enhanced"
                                            />
                                            <div className="episode-play-overlay">
                                                <PlayIcon className="play-icon" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="episode-content">
                                        <div className="episode-top">
                                            <div className="episode-number-badge">
                                                E{String(episode.episode).padStart(2, '0')}
                                            </div>
                                            {episode.rating && (
                                                <div className="episode-rating-badge">
                                                    <StarIcon className="icon-tiny" />
                                                    <span>{episode.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="episode-title-enhanced">{episode.name}</h3>

                                        <div className="episode-meta-enhanced">
                                            <div className="episode-meta-item">
                                                <CalendarIcon className="icon-tiny" />
                                                <span>{new Date(episode.airdate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}</span>
                                            </div>

                                            {episode.runtime && (
                                                <div className="episode-meta-item">
                                                    <ClockIcon className="icon-tiny" />
                                                    <span>{episode.runtime}m</span>
                                                </div>
                                            )}
                                        </div>

                                        {expandedEpisode === episode.id && episode.summary && (
                                            <div className="episode-summary-enhanced">
                                                <p>{episode.summary.replace(/<[^>]*>/g, '')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="episode-expand-indicator">
                                    <span className="expand-text">
                                        {expandedEpisode === episode.id ? 'Show less' : 'Show more'}
                                    </span>
                                    <svg
                                        className={`expand-arrow ${expandedEpisode === episode.id ? 'rotated' : ''}`}
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M4 6L8 10L12 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-episodes">
                            <TvIcon className="no-episodes-icon" />
                            <p>No episode data available for this season.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cast */}
            {movie.cast.length > 0 && (
                <div className="tv-show-section">
                    <h2>Cast</h2>
                    <div className="cast-grid">
                        {movie.cast.slice(0, 12).map((member, idx) => (
                            <div key={idx} className="cast-member">
                                <div className="cast-avatar">
                                    {member.profile_url ? (
                                        <img src={member.profile_url} alt={member.name} loading="lazy" />
                                    ) : (
                                        <span className="cast-avatar-initial">{member.name?.[0]?.toUpperCase() || '?'}</span>
                                    )}
                                </div>
                                <div className="cast-name">{member.name}</div>
                                <div className="cast-role">{member.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trivia/AI Notes */}
            {movie.ai_notes && (
                <div className="tv-show-section">
                    <h2>Trivia & Facts</h2>
                    <div
                        className="ai-notes ai-notes-rich"
                        dangerouslySetInnerHTML={{
                            __html: formatAiNotesHtml(movie.ai_notes)
                        }}
                    />
                </div>
            )}

            <div className="tv-show-section">
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                        <h2>User Reviews</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-brand-text-dark px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                Source: {reviewsSourceLabel}
                            </span>
                            <button
                                type="button"
                                onClick={() => void loadReviews()}
                                disabled={reviewsLoading}
                                className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-brand-text-light hover:text-white hover:bg-white/10 disabled:opacity-60 transition-colors"
                            >
                                {reviewsLoading ? 'Refreshing…' : 'Refresh reviews'}
                            </button>
                        </div>
                    </div>

                    {reviewsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map((entry) => (
                                <div key={entry} className="animate-pulse rounded-2xl p-4 bg-white/[0.03] border border-white/8">
                                    <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
                                    <div className="space-y-2">
                                        <div className="h-2.5 bg-white/8 rounded w-full" />
                                        <div className="h-2.5 bg-white/8 rounded w-4/5" />
                                        <div className="h-2.5 bg-white/8 rounded w-3/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                            <p className="text-white font-semibold text-sm">No reviews available yet</p>
                            <p className="text-xs text-brand-text-dark mt-1">This series has limited public reviews right now.</p>
                            <button
                                type="button"
                                onClick={() => void loadReviews()}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-brand-text-light hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reviews.slice(0, 4).map((review) => {
                                const isExpanded = expandedReview === review.id;
                                const LIMIT = 220;
                                const isLong = review.content.length > LIMIT;
                                const text = isExpanded || !isLong
                                    ? review.content
                                    : review.content.slice(0, LIMIT).trimEnd() + '…';
                                const date = review.created_at
                                    ? new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : null;
                                return (
                                    <div key={review.id} className="rounded-2xl p-4 bg-white/[0.03] border border-white/8 hover:border-brand-primary/30 transition-colors">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{review.author}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {review.rating !== null && (
                                                        <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                                            ★ {review.rating % 1 === 0 ? review.rating : review.rating.toFixed(1)}<span className="text-amber-400/50">/10</span>
                                                        </span>
                                                    )}
                                                    {date && <span className="text-[10px] text-brand-text-dark">{date}</span>}
                                                </div>
                                            </div>
                                            {review.url && (
                                                <a
                                                    href={review.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-brand-primary hover:text-brand-secondary"
                                                    aria-label="Open full review"
                                                >
                                                    Full
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-sm text-brand-text-light leading-relaxed">{text}</p>
                                        {isLong && (
                                            <button
                                                onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                                                className="mt-2 text-xs text-brand-primary hover:text-brand-secondary font-semibold"
                                            >
                                                {isExpanded ? 'Show less' : 'Read more'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            {/* Official Site Link */}
            {tvShow.officialSite && (
                <div className="tv-show-section">
                    <a
                        href={tvShow.officialSite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="official-site-link inline-flex items-center gap-2"
                    >
                        <LinkIcon className="w-4 h-4" aria-hidden />
                        <span>Visit Official Website</span>
                    </a>
                </div>
            )}

        </div>
    );
};

export default TVShowDisplay;
