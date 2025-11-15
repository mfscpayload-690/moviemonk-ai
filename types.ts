
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

export interface Rating {
  source: 'Rotten Tomatoes' | 'IMDb' | string;
  score: string;
}

export interface MovieData {
  title: string;
  year: string;
  type: 'movie' | 'show' | 'song' | 'franchise';
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
}

export enum QueryComplexity {
    SIMPLE = 'simple',
    COMPLEX = 'complex',
    FOLLOW_UP = 'follow-up'
}

// Added types for grounding sources
export interface WebSource {
  uri: string;
  title: string;
}

export interface GroundingSource {
  web: WebSource;
}

export interface FetchResult {
  movieData: MovieData | null;
  sources: GroundingSource[] | null;
  error?: string;
}