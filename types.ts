
export interface CastMember {
  name: string;
  role: string;
  known_for: string;
}

export interface Crew {
  director: string;
  writer: string;
  music: string;
}

export interface WatchOption {
  platform: string;
  link: string;
  type: 'subscription' | 'rent' | 'free' | 'buy';
}

// Related content types for Similar/People Also Search
export type RelatedTitle = {
  id: number;
  title: string;
  year?: string;
  media_type: 'movie' | 'tv';
  poster_url?: string;
  popularity?: number;
  source: 'tmdb-similar' | 'tmdb-recommendations' | 'serpapi';
};

export type RelatedPerson = {
  id: number;
  name: string;
  known_for?: string;
  profile_url?: string;
  popularity?: number;
  source: 'tmdb-co-star' | 'tmdb-similar' | 'serpapi';
};

export interface Rating {
  source: 'Rotten Tomatoes' | 'IMDb' | string;
  score: string;
}

export interface MovieData {
  tmdb_id?: string;
  title: string;
  year: string;
  type: 'movie' | 'show' | 'song' | 'franchise';
  media_type?: string;
  genres: string[];
  poster_url: string;
  backdrop_url: string;
  trailer_url: string; // Added trailer URL
  ratings: Rating[]; // Added ratings
  cast: CastMember[];
  crew: Crew;
  summary_short: string;
  summary_medium: string;
  summary_long_spoilers: string;
  suspense_breaker: string;
  where_to_watch: WatchOption[];
  extra_images: string[];
  ai_notes: string;
}

export interface WatchlistItem {
  id: string;
  saved_title: string;
  movie: MovieData;
  added_at: string;
}

export interface WatchlistFolder {
  id: string;
  name: string;
  color: string;
  items: WatchlistItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
}

export enum QueryComplexity {
  SIMPLE = 'SIMPLE',
  COMPLEX = 'COMPLEX',
  FOLLOW_UP = 'FOLLOW_UP'
}

// Added types for grounding sources
export interface WebSource {
  uri: string;
  title: string;
}

export interface GroundingSource {
  web: WebSource;
}

export type AIProvider = 'groq' | 'mistral' | 'perplexity' | 'openrouter';

export interface FetchResult {
  movieData: MovieData | null;
  sources: GroundingSource[] | null;
  error?: string;
  provider?: AIProvider;
}