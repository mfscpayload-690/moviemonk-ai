import React, { useState } from 'react';
import { MovieData, TVShowEpisode, TVShowSeason } from '../types';
import { PlayIcon, CalendarIcon, ClockIcon, StarIcon, TvIcon } from './icons';

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

            <style jsx>{`
        .tv-show-display {
          max-width: 1200px;
          margin: 0 auto;
        }

        .tv-show-header {
          position: relative;
          margin-bottom: 2rem;
        }

        .backdrop-container {
          height: 400px;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }

        .backdrop-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.9));
        }

        .tv-show-info {
          display: flex;
          gap: 2rem;
          margin-top: -150px;
          position: relative;
          padding: 0 2rem;
        }

        .tv-show-poster {
          width: 200px;
          height: 300px;
          border-radius: 8px;
          object-fit: cover;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        .tv-show-meta {
          flex: 1;
          color: white;
        }

        .tv-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.5);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .tv-show-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }

        .tv-show-stats {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
          margin: 1rem 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }

        .rating-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(234, 179, 8, 0.2);
          border: 1px solid rgba(234, 179, 8, 0.5);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }

        .info-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
        }

        .tv-show-dates,
        .tv-show-genres {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-top: 0.5rem;
        }

        .genre-tag {
          background: rgba(255, 255, 255, 0.15);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
        }

        .tv-show-section {
          margin: 2rem 0;
          padding: 0 2rem;
        }

        .tv-show-section h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid rgba(139, 92, 246, 0.5);
          padding-bottom: 0.5rem;
        }

        .tv-show-summary {
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
        }

        .season-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .season-select {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 1rem;
          cursor: pointer;
        }

        .season-info {
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .season-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .episode-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .episode-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .episode-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-2px);
        }

        .episode-card.expanded {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
        }

        .episode-header {
          display: flex;
          gap: 1rem;
        }

        .episode-thumbnail {
          width: 150px;
          height: 85px;
          border-radius: 8px;
          object-fit: cover;
        }

        .episode-info {
          flex: 1;
        }

        .episode-number {
          color: rgba(139, 92, 246, 1);
          font-weight: 600;
          font-size: 0.875rem;
        }

        .episode-title {
          font-size: 1.125rem;
          margin: 0.25rem 0;
        }

        .episode-meta {
          display: flex;
          gap: 1rem;
          margin: 0.5rem 0;
          flex-wrap: wrap;
        }

        .episode-meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .episode-summary {
          margin-top: 1rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.8);
          animation: fadeIn 0.3s ease;
        }

        .episode-expand-btn {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(139, 92, 246, 0.5);
          color: rgba(139, 92, 246, 1);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .episode-expand-btn:hover {
          background: rgba(139, 92, 246, 0.1);
        }

        /* Enhanced Episode Card Styles */
        .episode-card-enhanced {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .episode-card-enhanced:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(255, 255, 255, 0.08));
          border-color: rgba(139, 92, 246, 0.6);
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
        }

        .episode-card-enhanced.expanded {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(255, 255, 255, 0.05));
          border-color: rgba(139, 92, 246, 0.8);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        }

        .episode-card-inner {
          display: flex;
          gap: 1.5rem;
          padding: 1.25rem;
        }

        .episode-thumbnail-container {
          position: relative;
          flex-shrink: 0;
          width: 200px;
          height: 112px;
          border-radius: 12px;
          overflow: hidden;
          group;
        }

        .episode-thumbnail-enhanced {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .episode-card-enhanced:hover .episode-thumbnail-enhanced {
          transform: scale(1.1);
        }

        .episode-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .episode-card-enhanced:hover .episode-play-overlay {
          opacity: 1;
        }

        .play-icon {
          width: 48px;
          height: 48px;
          color: white;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        .episode-content {
          flex: 1;
          min-width: 0;
        }

        .episode-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .episode-number-badge {
          display: inline-block;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 52, 206, 0.3));
          border: 1px solid rgba(139, 92, 246, 0.5);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.875rem;
          color: rgba(167, 139, 250, 1);
          letter-spacing: 0.5px;
        }

        .episode-rating-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.2));
          border: 1px solid rgba(234, 179, 8, 0.4);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          color: rgba(250, 204, 21, 1);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .episode-title-enhanced {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.75rem 0;
          color: white;
          line-height: 1.3;
        }

        .episode-meta-enhanced {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .episode-summary-enhanced {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          animation: fadeInUp 0.3s ease;
        }

        .episode-summary-enhanced p {
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.9375rem;
        }

        .episode-expand-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(139, 92, 246, 0.05);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(139, 92, 246, 1);
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .episode-card-enhanced:hover .episode-expand-indicator {
          background: rgba(139, 92, 246, 0.1);
          color: rgba(167, 139, 250, 1);
        }

        .expand-arrow {
          transition: transform 0.3s ease;
        }

        .expand-arrow.rotated {
          transform: rotate(180deg);
        }

        .season-info-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(255, 255, 255, 0 .02));
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .season-progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          margin: 1rem 0;
          overflow: hidden;
        }

        .season-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(139, 92, 246, 1), rgba(167, 139, 250, 1));
          transition: width 0.6s ease;
        }

        .season-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .no-episodes-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          color: rgba(255, 255, 255, 0.2);
        }

        .no-episodes {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .cast-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .cast-member {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 8px;
        }

        .cast-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .cast-role {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .ai-notes {
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
        }

        .official-site-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.5);
          border-radius: 8px;
          color: white;
          text-decoration: none;
          transition: all 0.3s;
        }

        .official-site-link:hover {
          background: rgba(139, 92, 246, 0.3);
          transform: translateY(-2px);
        }

        .icon-small {
          width: 16px;
          height: 16px;
        }

        .icon-tiny {
          width: 14px;
          height: 14px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .tv-show-info {
            flex-direction: column;
            margin-top: -100px;
          }

          .episode-card-inner {
            flex-direction: column;
          }

          .episode-thumbnail-container {
            width: 100%;
            height: auto;
            aspect-ratio: 16 / 9;
          }

          .cast-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }
      `}</style>
        </div>
    );
};

export default TVShowDisplay;
