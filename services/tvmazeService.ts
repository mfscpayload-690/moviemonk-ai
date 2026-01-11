/**
 * TVMaze API Service
 * FREE API with comprehensive TV show data (no API key needed!)
 * Better than TMDB for TV shows - includes seasons, episodes, episode lists
 * 
 * API Docs: https://www.tvmaze.com/api
 */

export interface TVMazeShow {
    id: number;
    name: string;
    type: string; // "Scripted", "Reality", etc.
    language: string;
    genres: string[];
    status: string; // "Running", "Ended", etc.
    premiered: string; // "2013-09-23"
    ended: string | null;
    officialSite: string | null;
    rating: { average: number | null };
    network: {
        name: string;
        country: { name: string; code: string };
    } | null;
    webChannel: { name: string } | null;
    image: {
        medium: string;
        original: string;
    } | null;
    summary: string; // HTML format
    _embedded?: {
        seasons: TVMazeSeason[];
        episodes: TVMazeEpisode[];
        cast: TVMazeCastMember[];
    };
}

export interface TVMazeSeason {
    id: number;
    number: number;
    name: string;
    episodeOrder: number;
    premiereDate: string | null;
    endDate: string | null;
    network: { name: string } | null;
    webChannel: { name: string } | null;
    image: { medium: string; original: string } | null;
    summary: string | null;
}

export interface TVMazeEpisode {
    id: number;
    name: string;
    season: number;
    number: number;
    airdate: string;
    airtime: string;
    runtime: number | null;
    rating: { average: number | null };
    image: { medium: string; original: string } | null;
    summary: string | null;
}

export interface TVMazeCastMember {
    person: {
        id: number;
        name: string;
        image: { medium: string; original: string } | null;
    };
    character: {
        id: number;
        name: string;
        image: { medium: string; original: string } | null;
    };
    self: boolean;
    voice: boolean;
}

const TVMAZE_BASE = 'https://api.tvmaze.com';

/**
 * Search for TV shows by name
 */
export async function searchTVShows(query: string): Promise<TVMazeShow[]> {
    try {
        const url = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze search failed: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // TVMaze returns array of {score, show} objects
        return data.map((item: any) => item.show);
    } catch (error) {
        console.error('TVMaze search error:', error);
        return [];
    }
}

/**
 * Get single best match for a query
 */
export async function findBestTVShow(query: string, year?: string): Promise<TVMazeShow | null> {
    const results = await searchTVShows(query);

    if (results.length === 0) return null;

    // If year provided, try to match it
    if (year) {
        const yearMatches = results.filter(show =>
            show.premiered && show.premiered.startsWith(year)
        );
        if (yearMatches.length > 0) return yearMatches[0];
    }

    // Return best match (first result has highest score)
    return results[0];
}

/**
 * Get full show details with episodes and cast
 */
export async function getTVShowDetails(showId: number): Promise<TVMazeShow | null> {
    try {
        const url = `${TVMAZE_BASE}/shows/${showId}?embed[]=seasons&embed[]=episodes&embed[]=cast`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze details failed: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('TVMaze details error:', error);
        return null;
    }
}

/**
 * Get episodes for a specific season
 */
export async function getSeasonEpisodes(showId: number, seasonNumber: number): Promise<TVMazeEpisode[]> {
    try {
        const url = `${TVMAZE_BASE}/shows/${showId}/episodes`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze episodes failed: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // Filter episodes for specific season
        return data
            .filter((ep: TVMazeEpisode) => ep.season === seasonNumber)
            .sort((a: TVMazeEpisode, b: TVMazeEpisode) => a.number - b.number);
    } catch (error) {
        console.error('TVMaze season episodes error:', error);
        return [];
    }
}

/**
 * Get single episode details
 */
export async function getEpisode(
    showId: number,
    seasonNumber: number,
    episodeNumber: number
): Promise<TVMazeEpisode | null> {
    try {
        const url = `${TVMAZE_BASE}/shows/${showId}/episodebynumber?season=${seasonNumber}&number=${episodeNumber}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`TVMaze episode failed: ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('TVMaze episode error:', error);
        return null;
    }
}

/**
 * Strip HTML tags from TVMaze summaries
 */
export function stripHTML(html: string | null): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

/**
 * Convert TVMaze data to MovieMonk MovieData format
 */
export function convertTVMazeToMovieData(show: TVMazeShow): any {
    const premiered = show.premiered || '';
    const year = premiered ? new Date(premiered).getFullYear().toString() : '';

    // Calculate total episodes across all seasons
    const totalEpisodes = show._embedded?.episodes?.length || 0;
    const seasonsCount = show._embedded?.seasons?.length || 0;

    // Get cast (top 15)
    const cast = (show._embedded?.cast || []).slice(0, 15).map(c => ({
        name: c.person.name,
        role: c.character.name,
        known_for: 'Acting'
    }));

    // Build comprehensive summary
    const summary = stripHTML(show.summary);

    return {
        title: show.name,
        year,
        type: 'show' as const,
        genres: show.genres || [],
        poster_url: show.image?.original || '',
        backdrop_url: show.image?.original || '',
        trailer_url: '', // TVMaze doesn't provide trailers
        ratings: show.rating.average ? [{
            source: 'TVMaze',
            score: `${show.rating.average}/10`
        }] : [],
        cast,
        crew: {
            director: '', // Not in TVMaze API
            writer: '', // Not in TVMaze API
            music: '' // Not in TVMaze API
        },
        summary_short: summary.substring(0, 200) + (summary.length > 200 ? '...' : ''),
        summary_medium: summary.substring(0, 500) + (summary.length > 500 ? '...' : ''),
        summary_long_spoilers: '', // Will be filled by AI
        suspense_breaker: '', // Will be filled by AI
        where_to_watch: show.network?.name || show.webChannel?.name ? [{
            platform: show.network?.name || show.webChannel?.name || 'Unknown',
            link: show.officialSite || '',
            type: 'subscription' as const
        }] : [],
        extra_images: [], // TVMaze has limited images
        ai_notes: '', // Will be filled by AI

        // TV-specific extended data
        tvShow: {
            status: show.status,
            premiered: show.premiered,
            ended: show.ended,
            totalSeasons: seasonsCount,
            totalEpisodes,
            network: show.network?.name || show.webChannel?.name || 'Unknown',
            language: show.language,
            officialSite: show.officialSite,
            seasons: (show._embedded?.seasons || []).map(s => ({
                number: s.number,
                name: s.name || `Season ${s.number}`,
                episodeCount: s.episodeOrder || 0,
                premiereDate: s.premiereDate,
                endDate: s.endDate,
                image: s.image?.original || null,
                summary: stripHTML(s.summary)
            })),
            episodes: (show._embedded?.episodes || []).map(e => ({
                id: e.id,
                season: e.season,
                episode: e.number,
                name: e.name,
                airdate: e.airdate,
                runtime: e.runtime,
                rating: e.rating.average,
                image: e.image?.original || null,
                summary: stripHTML(e.summary)
            }))
        }
    };
}
