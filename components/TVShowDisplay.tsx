import React, { useState } from 'react';
import { MovieData, TVShowEpisode, TVShowSeason } from '../types';
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

const TVShowDisplay: React.FC<TVShowDisplayProps> = ({ movie, isWatched = false, onToggleWatched }) => {
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

    if (!movie.tvShow) {
        return <div className="error">No TV show data available</div>;
    }

    const tvShow = movie.tvShow;
    const seasonsData = tvShow.seasons || [];
    const selectedSeasonData = seasonsData.find(s => s.number === selectedSeason);
    const episodesForSeason = (tvShow.episodes || []).filter(e => e.season === selectedSeason);
    const languageLabel = formatDisplayLanguage(movie.language || tvShow.language);
    const premieredYear = tvShow.premiered ? new Date(tvShow.premiered).getFullYear().toString() : movie.year;
    const headerMetaParts = [
        premieredYear,
        'TV Series',
        languageLabel
    ].filter((part) => typeof part === 'string' && part.trim().length > 0);

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
