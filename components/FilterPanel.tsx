import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { SearchFilters, DiscoveryGenre } from '../types';
import '../styles/filter-panel.css';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
  genres: DiscoveryGenre[];
  isOpen: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' }
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest' },
  { value: 'title.asc', label: 'Title A-Z' }
];

export function FilterPanel({
  filters,
  onFiltersChange,
  onClose,
  genres,
  isOpen
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    genres: true,
    year: true,
    rating: true,
    language: false,
    sort: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGenreToggle = (genreId: number) => {
    const current = filters.genres || [];
    const updated = current.includes(genreId)
      ? current.filter(id => id !== genreId)
      : [...current, genreId];
    onFiltersChange({ ...filters, genres: updated.length > 0 ? updated : undefined });
  };

  const handleYearChange = (type: 'min' | 'max', value: number) => {
    const newFilters = { ...filters };
    if (type === 'min') {
      newFilters.yearMin = value || undefined;
    } else {
      newFilters.yearMax = value || undefined;
    }
    onFiltersChange(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      ratingMin: filters.ratingMin === rating ? undefined : rating
    });
  };

  const handleLanguageToggle = (code: string) => {
    const current = filters.languages || [];
    const updated = current.includes(code)
      ? current.filter(lang => lang !== code)
      : [...current, code];
    onFiltersChange({ ...filters, languages: updated.length > 0 ? updated : undefined });
  };

  const handleSortChange = (sortValue: string) => {
    onFiltersChange({
      ...filters,
      sortBy: sortValue as SearchFilters['sortBy']
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  if (!isOpen) return null;

  return (
    <div className="filter-panel-overlay" onClick={onClose}>
      <div className="filter-panel-container" onClick={e => e.stopPropagation()}>
        <div className="filter-panel-header">
          <h3 className="filter-panel-title">Refine Search</h3>
          <button 
            onClick={onClose}
            className="filter-panel-close"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        <div className="filter-panel-content">
          {/* Genres */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection('genres')}
              className="filter-section-header"
            >
              <span>Genres</span>
              <ChevronDown 
                size={16} 
                className={expandedSections.genres ? 'rotate-180' : ''}
              />
            </button>
            {expandedSections.genres && (
              <div className="filter-section-content">
                <div className="genre-grid">
                  {genres.map(genre => (
                    <label key={genre.id} className="genre-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.genres || []).includes(genre.id)}
                        onChange={() => handleGenreToggle(genre.id)}
                      />
                      <span>{genre.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Year Range */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection('year')}
              className="filter-section-header"
            >
              <span>Year</span>
              <ChevronDown 
                size={16} 
                className={expandedSections.year ? 'rotate-180' : ''}
              />
            </button>
            {expandedSections.year && (
              <div className="filter-section-content">
                <div className="year-inputs">
                  <input
                    type="number"
                    placeholder="From"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={filters.yearMin || ''}
                    onChange={e => handleYearChange('min', parseInt(e.target.value) || 0)}
                    className="year-input"
                  />
                  <span className="year-separator">to</span>
                  <input
                    type="number"
                    placeholder="To"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={filters.yearMax || ''}
                    onChange={e => handleYearChange('max', parseInt(e.target.value) || 0)}
                    className="year-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection('rating')}
              className="filter-section-header"
            >
              <span>Rating</span>
              <ChevronDown 
                size={16} 
                className={expandedSections.rating ? 'rotate-180' : ''}
              />
            </button>
            {expandedSections.rating && (
              <div className="filter-section-content">
                <div className="rating-buttons">
                  {[5, 6, 7, 8, 9].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      className={`rating-btn ${filters.ratingMin === rating ? 'active' : ''}`}
                    >
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection('language')}
              className="filter-section-header"
            >
              <span>Language</span>
              <ChevronDown 
                size={16} 
                className={expandedSections.language ? 'rotate-180' : ''}
              />
            </button>
            {expandedSections.language && (
              <div className="filter-section-content">
                <div className="language-grid">
                  {LANGUAGES.map(lang => (
                    <label key={lang.code} className="language-checkbox">
                      <input
                        type="checkbox"
                        checked={(filters.languages || []).includes(lang.code)}
                        onChange={() => handleLanguageToggle(lang.code)}
                      />
                      <span>{lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection('sort')}
              className="filter-section-header"
            >
              <span>Sort By</span>
              <ChevronDown 
                size={16} 
                className={expandedSections.sort ? 'rotate-180' : ''}
              />
            </button>
            {expandedSections.sort && (
              <div className="filter-section-content">
                <div className="sort-options">
                  {SORT_OPTIONS.map(option => (
                    <label key={option.value} className="sort-radio">
                      <input
                        type="radio"
                        name="sort"
                        value={option.value}
                        checked={filters.sortBy === option.value}
                        onChange={() => handleSortChange(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="filter-panel-footer">
          <button 
            onClick={clearFilters}
            className="filter-btn-secondary"
          >
            Clear All
          </button>
          <button 
            onClick={onClose}
            className="filter-btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
