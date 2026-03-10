import React, { useState } from 'react';
import { MovieData, TVShowEpisode, TVShowSeason } from '../types';
import { PlayIcon, CalendarIcon, ClockIcon, StarIcon, TvIcon } from './icons';
import '../styles/tv-show.css';

interface TVShowDisplayProps {
    movie: MovieData; // Actually a TV show with tvShow data
}

const TVShowDisplay: React.FC<TVShowDisplayProps> = ({ movie }) => {
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

    if (!movie.tvShow) {
        return <div className="error">No TV show data available</div>;
    }

    const tvShow = movie.tvShow;
    const seasonsData = tvShow.seasons || [];
    const selectedSeasonData = seasonsData.find(s => s.number === selectedSeason);
    const episodesForSeason = (tvShow.episodes || []).filter(e => e.season === selectedSeason);

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

                        <div className="tv-show-stats">
                            <span className={`status-badge ${getStatusColor(tvShow.status)}`}>
                                {tvShow.status}
                            </span>

                            {movie.ratings.length > 0 && (
                                <div className="rating-badge">
                                    <StarIcon className="icon-small" />
                                    <span>{movie.ratings[0].score}</span>
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

                        {tvShow.premiered && (
                            <div className="tv-show-dates">
                                <CalendarIcon className="icon-small" />
                                <span>
                                    {new Date(tvShow.premiered).getFullYear()}
                                    {tvShow.ended && ` - ${new Date(tvShow.ended).getFullYear()}`}
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
                        className="ai-notes"
                        dangerouslySetInnerHTML={{
                            __html: movie.ai_notes.replace(/\n/g, '<br />')
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
                        className="official-site-link"
                    >
                        🔗 Visit Official Website
                    </a>
                </div>
            )}

        </div>
    );
};

export default TVShowDisplay;
