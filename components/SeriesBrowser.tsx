import React, { useState, useEffect } from 'react';
import { TvIcon, StarIcon, CalendarIcon, FilterIcon, SearchIcon, XMarkIcon } from './icons';
import '../styles/series-browser.css';

interface Series {
    id: number;
    title: string;
    year: string;
    poster_url: string;
    rating: number;
    status: string;
    genres: string[];
    network: string;
    seasons: number;
    episodes: number;
}

interface SeriesBrowserProps {
    onClose: () => void;
    onSelectSeries: (title: string) => void;
}

const SeriesBrowser: React.FC<SeriesBrowserProps> = ({ onClose, onSelectSeries }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
    const [showFilters, setShowFilters] = useState(false);

    // Mock popular series data - In production, this would come from an API
    const popularSeries: Series[] = [
        {
            id: 1,
            title: 'Breaking Bad',
            year: '2008',
            poster_url: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
            rating: 9.5,
            status: 'Ended',
            genres: ['Drama', 'Crime', 'Thriller'],
            network: 'AMC',
            seasons: 5,
            episodes: 62
        },
        {
            id: 2,
            title: 'Game of Thrones',
            year: '2011',
            poster_url: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
            rating: 9.3,
            status: 'Ended',
            genres: ['Drama', 'Fantasy', 'Adventure'],
            network: 'HBO',
            seasons: 8,
            episodes: 73
        },
        {
            id: 3,
            title: 'The Last of Us',
            year: '2023',
            poster_url: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
            rating: 8.8,
            status: 'Running',
            genres: ['Drama', 'Sci-Fi', 'Horror'],
            network: 'HBO',
            seasons: 2,
            episodes: 9
        },
    ];

    const genres = ['all', 'Drama', 'Comedy', 'Action', 'Sci-Fi', 'Fantasy', 'Crime', 'Horror', 'Thriller'];
    const statuses = ['all', 'Running', 'Ended', 'Upcoming'];

    const handleSeriesClick = (series: Series) => {
        onSelectSeries(series.title);
        onClose();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running':
            case 'returning':
                return 'status-running';
            case 'ended':
                return 'status-ended';
            case 'upcoming':
                return 'status-upcoming';
            default:
                return 'status-unknown';
        }
    };

    return (
        <div className="series-browser-overlay" onClick={onClose}>
            <div className="series-browser-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="series-browser-header">
                    <div className="series-browser-title">
                        <TvIcon className="icon-lg" />
                        <h2>Browse TV Series</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="series-browser-close touch-target-sm"
                        aria-label="Close series browser"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="series-search-container">
                    <div className="series-search-input-wrapper">
                        <SearchIcon className="icon-sm search-icon" />
                        <input
                            type="text"
                            placeholder="Search for TV series..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="series-search-input"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`filter-toggle-btn touch-target-sm ${showFilters ? 'active' : ''}`}
                        aria-label="Toggle filters"
                    >
                        <FilterIcon className="icon-sm" />
                        <span className="hidden-xs">Filters</span>
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="series-filters-panel">
                        <div className="filter-group">
                            <label className="filter-label">Genre</label>
                            <div className="filter-chips">
                                {genres.map((genre) => (
                                    <button
                                        key={genre}
                                        onClick={() => setSelectedGenre(genre)}
                                        className={`filter-chip ${selectedGenre === genre ? 'active' : ''}`}
                                    >
                                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Status</label>
                            <div className="filter-chips">
                                {statuses.map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`filter-chip ${selectedStatus === status ? 'active' : ''}`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Sort By</label>
                            <div className="filter-chips">
                                <button
                                    onClick={() => setSortBy('popular')}
                                    className={`filter-chip ${sortBy === 'popular' ? 'active' : ''}`}
                                >
                                    Popular
                                </button>
                                <button
                                    onClick={() => setSortBy('recent')}
                                    className={`filter-chip ${sortBy === 'recent' ? 'active' : ''}`}
                                >
                                    Recent
                                </button>
                                <button
                                    onClick={() => setSortBy('rating')}
                                    className={`filter-chip ${sortBy === 'rating' ? 'active' : ''}`}
                                >
                                    Top Rated
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Series Grid */}
                <div className="series-grid scrollable-content">
                    {popularSeries.map((series) => (
                        <div
                            key={series.id}
                            className="series-card"
                            onClick={() => handleSeriesClick(series)}
                        >
                            <div className="series-card-poster-container">
                                <img
                                    src={series.poster_url}
                                    alt={series.title}
                                    className="series-card-poster"
                                    loading="lazy"
                                />
                                <div className="series-card-overlay">
                                    <div className="series-card-play">
                                        <TvIcon className="icon-lg" />
                                        <span>View Details</span>
                                    </div>
                                </div>
                                <div className={`series-card-status ${getStatusColor(series.status)}`}>
                                    {series.status}
                                </div>
                                {series.rating && (
                                    <div className="series-card-rating">
                                        <StarIcon className="icon-xs" />
                                        <span>{series.rating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="series-card-info">
                                <h3 className="series-card-title">{series.title}</h3>
                                <div className="series-card-meta">
                                    <span className="series-card-year">
                                        <CalendarIcon className="icon-xs" />
                                        {series.year}
                                    </span>
                                    <span className="series-card-episodes">
                                        {series.seasons} Season{series.seasons !== 1 ? 's' : ''} • {series.episodes} Eps
                                    </span>
                                </div>
                                <div className="series-card-genres">
                                    {series.genres.slice(0, 3).map((genre, idx) => (
                                        <span key={idx} className="series-card-genre-tag">
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                                {series.network && (
                                    <div className="series-card-network">{series.network}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {popularSeries.length === 0 && (
                    <div className="series-empty-state">
                        <TvIcon className="empty-state-icon" />
                        <p>No series found matching your filters</p>
                        <button
                            onClick={() => {
                                setSelectedGenre('all');
                                setSelectedStatus('all');
                                setSearchQuery('');
                            }}
                            className="btn-glass"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Footer Info */}
                <div className="series-browser-footer">
                    <p className="series-browser-hint">
                        💡 Tip: Click on any series to see full details, episodes, and cast information
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SeriesBrowser;
