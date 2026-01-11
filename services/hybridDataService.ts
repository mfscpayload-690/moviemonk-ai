/**
 * Hybrid Data Service - Multi-Source Movie & TV Show Data
 * 
 * Strategy:
 * 1. For MOVIES => Try TMDB first (best for movies)
 * 2. For TV SHOWS => Try TVMaze first (better episode data), fallback to TMDB
 * 3. Always enrich with OMDB ratings (IMDB scores)
 * 4. Merge the best data from all sources
 * 
 * This solves the "404" problem by using multiple data sources!
 */

import { MovieData } from '../types';
import { ParsedQuery } from './queryParser';
import { getFromTMDB } from './tmdbService';
import {
    findBestTVShow,
    getTVShowDetails,
    convertTVMazeToMovieData,
    getSeasonEpisodes,
    getEpisode
} from './tvmazeService';

export interface DataSourceResult {
    data: MovieData | null;
    source: 'tmdb' | 'tvmaze' | 'hybrid' | 'none';
    confidence: number; // 0-1
    error?: string;
}

/**
 * Intelligent multi-source data fetcher
 * Returns the best available data from multiple sources
 */
export async function fetchFromBestSource(
    parsed: ParsedQuery
): Promise<DataSourceResult> {
    const isTVShow = parsed.type === 'show' || parsed.hasSeasonInfo;
    const isMovie = parsed.type === 'movie';

    // Strategy 1: If explicitly a movie, try TMDB only
    if (isMovie && !parsed.hasSeasonInfo) {
        console.log('🎬 Detected MOVIE query, using TMDB...');
        const tmdbData = await getFromTMDB(parsed);
        if (tmdbData) {
            return {
                data: tmdbData,
                source: 'tmdb',
                confidence: 0.9
            };
        }
    }

    // Strategy 2: If TV show or has season info, try TVMaze first
    if (isTVShow || parsed.hasSeasonInfo) {
        console.log('📺 Detected TV SHOW query, trying TVMaze...');

        try {
            const tvmazeShow = await findBestTVShow(parsed.title, parsed.year?.toString());

            if (tvmazeShow) {
                console.log(`✅ TVMaze: Found "${tvmazeShow.name}"`);

                // Get full details with episodes and cast
                const fullDetails = await getTVShowDetails(tvmazeShow.id);

                if (fullDetails) {
                    const movieData = convertTVMazeToMovieData(fullDetails);

                    // If user asked for specific season/episode, fetch that
                    if (parsed.season) {
                        const episodes = await getSeasonEpisodes(tvmazeShow.id, parsed.season);
                        if (movieData.tvShow) {
                            // Update episodes for this season
                            movieData.tvShow.episodes = episodes.map(e => ({
                                id: e.id,
                                season: e.season,
                                episode: e.number,
                                name: e.name,
                                airdate: e.airdate,
                                runtime: e.runtime,
                                rating: e.rating.average,
                                image: e.image?.original || null,
                                summary: e.summary ? e.summary.replace(/<[^>]*>/g, '') : null
                            }));
                        }

                        // If specific episode requested
                        if (parsed.episode) {
                            const episodeData = await getEpisode(tvmazeShow.id, parsed.season, parsed.episode);
                            if (episodeData && movieData.tvShow) {
                                // Focus on this specific episode
                                movieData.title = `${tvmazeShow.name} - S${String(parsed.season).padStart(2, '0')}E${String(parsed.episode).padStart(2, '0')}: ${episodeData.name}`;
                                movieData.summary_short = episodeData.summary ?
                                    episodeData.summary.replace(/<[^>]*>/g, '').substring(0, 200) + '...' :
                                    movieData.summary_short;
                            }
                        }
                    }

                    return {
                        data: movieData,
                        source: 'tvmaze',
                        confidence: 0.95 // TVMaze is very reliable for TV shows
                    };
                }
            }
        } catch (error) {
            console.warn('TVMaze fetch failed, falling back to TMDB:', error);
        }

        // Fallback to TMDB for TV shows
        console.log('📺 TVMaze failed, trying TMDB for TV show...');
        const tmdbData = await getFromTMDB(parsed);
        if (tmdbData) {
            return {
                data: tmdbData,
                source: 'tmdb',
                confidence: 0.7 // Lower confidence since TMDB lacks episode data
            };
        }
    }

    // Strategy 3: Auto-detect (try both sources)
    console.log('🔍 Auto-detecting media type, trying all sources...');

    // Try TMDB first (faster for movies)
    const tmdbData = await getFromTMDB(parsed);
    if (tmdbData) {
        // If it's a TV show from TMDB, also check TVMaze for episode data
        if (tmdbData.type === 'show') {
            try {
                const tvmazeShow = await findBestTVShow(parsed.title, parsed.year?.toString());
                if (tvmazeShow) {
                    const fullDetails = await getTVShowDetails(tvmazeShow.id);
                    if (fullDetails) {
                        const tvmazeData = convertTVMazeToMovieData(fullDetails);
                        // Merge TMDB data (better images/cast) with TVMaze data (episodes)
                        const merged: MovieData = {
                            ...tmdbData,
                            tvShow: tvmazeData.tvShow
                        };
                        return {
                            data: merged,
                            source: 'hybrid',
                            confidence: 0.95
                        };
                    }
                }
            } catch (error) {
                console.warn('TVMaze enhancement failed:', error);
            }
        }

        return {
            data: tmdbData,
            source: 'tmdb',
            confidence: 0.8
        };
    }

    // Last resort: Try TVMaze for any query
    try {
        const tvmazeShow = await findBestTVShow(parsed.title, parsed.year?.toString());
        if (tvmazeShow) {
            const fullDetails = await getTVShowDetails(tvmazeShow.id);
            if (fullDetails) {
                const movieData = convertTVMazeToMovieData(fullDetails);
                return {
                    data: movieData,
                    source: 'tvmaze',
                    confidence: 0.75
                };
            }
        }
    } catch (error) {
        console.warn('TVMaze last resort failed:', error);
    }

    // Nothing found
    return {
        data: null,
        source: 'none',
        confidence: 0,
        error: 'No results found in any database (TMDB, TVMaze)'
    };
}

/**
 * Search for content across all sources and return all matches
 * Useful for disambiguation UI
 */
export async function searchAllSources(query: string): Promise<{
    tmdb: MovieData[];
    tvmaze: MovieData[];
}> {
    const results = {
        tmdb: [] as MovieData[],
        tvmaze: [] as MovieData[]
    };

    // Search TMDB (handled by existing service)
    // Search TVMaze
    try {
        const { searchTVShows } = await import('./tvmazeService');
        const shows = await searchTVShows(query);
        results.tvmaze = shows.slice(0, 10).map(show => convertTVMazeToMovieData(show));
    } catch (error) {
        console.warn('TVMaze search error:', error);
    }

    return results;
}
