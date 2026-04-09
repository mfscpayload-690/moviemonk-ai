
export interface WatchedTitle {
  id?: string;
  user_id?: string;
  tmdb_id: string;
  media_type: 'movie' | 'tv';
  title: string;
  poster_url?: string;
  year?: string;
  watched_at?: string;
}

export interface TmdbReview {
  id: string;
  author: string;
  avatar_url: string | null;
  rating: number | null;   // 0–10 from TMDB
  content: string;
  url: string | null;
  created_at: string | null;
}

export interface CastMember {

  name: string;
  role: string;
  known_for: string;
  profile_url?: string;
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
  confidence?: number;
  last_checked_at?: string;
  region?: string;
}

export interface DiscoveryItem {
  id: number;
  tmdb_id: string;
  media_type: 'movie' | 'tv';
  original_language?: string;
  title: string;
  year: string;
  overview: string;
  poster_url: string;
  backdrop_url: string;
  rating: number | null;
  genre_ids: number[];
}

export interface DiscoveryGenre {
  id: number;
  name: string;
}

export type PersonRoleBucket = 'all' | 'acting' | 'directing' | 'other';

export interface PersonIntent {
  raw_query: string;
  normalized_query: string;
  stripped_query: string;
  tokens: string[];
  year?: string;
  requested_role: 'any' | 'actor' | 'actress' | 'director';
  is_person_focused: boolean;
}

export interface PersonCredit {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year?: number;
  role: string;
  role_bucket: PersonRoleBucket;
  character?: string;
  job?: string;
  department?: string;
  popularity?: number;
  poster_url?: string;
}

export interface PersonSearchCandidate {
  id: number;
  name: string;
  type: 'person';
  score: number;
  confidence: number;
  popularity?: number;
  role_match?: 'match' | 'mismatch' | 'neutral';
  known_for_department?: string;
  known_for_titles?: string[];
  profile_url?: string;
}

export interface PersonProfile {
  person: {
    id: number;
    name: string;
    biography?: string;
    birthday?: string;
    place_of_birth?: string;
    profile_url?: string;
    known_for_department?: string;
  };
  top_work: PersonCredit[];
  credits_all: PersonCredit[];
  credits_acting: PersonCredit[];
  credits_directing: PersonCredit[];
  credits_other: PersonCredit[];
  role_distribution: {
    acting: number;
    directing: number;
    other: number;
  };
  career_span: {
    start_year?: number;
    end_year?: number;
    active_years?: number;
  };
  known_for_tags: string[];
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

// TV Show specific types
export interface TVShowSeason {
  number: number;
  name: string;
  episodeCount: number;
  premiereDate: string | null;
  endDate: string | null;
  image: string | null;
  summary: string | null;
}

export interface TVShowEpisode {
  id: number;
  season: number;
  episode: number;
  name: string;
  airdate: string;
  runtime: number | null;
  rating: number | null;
  image: string | null;
  summary: string | null;
}

export interface TVShowData {
  status: string; // "Running", "Ended", "In Development"
  premiered: string | null;
  ended: string | null;
  totalSeasons: number;
  totalEpisodes: number;
  network: string;
  language: string;
  officialSite: string | null;
  seasons: TVShowSeason[];
  episodes: TVShowEpisode[];
}

export interface MovieData {
  tmdb_id?: string;
  title: string;
  year: string;
  language?: string;
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

  // TV Show specific data (optional, only for type === 'show')
  tvShow?: TVShowData;
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
  icon?: string;
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

export interface SuggestionItem {
  id: number;
  title: string;
  year?: string;
  type: 'movie' | 'show' | 'person';
  media_type: 'movie' | 'tv' | 'person';
  poster_url?: string;
  confidence: number;
  known_for_department?: string;
  known_for_titles?: string[];
}

// Advanced Filters for search refinement
export interface SearchFilters {
  genres?: number[]; // TMDB genre IDs
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number; // 0–10
  languages?: string[]; // ISO 639-1 codes
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'title.asc';
  includeAdult?: boolean;
  runtimeMin?: number; // minutes
  runtimeMax?: number;
  withCast?: string; // Person IDs
  withCrew?: string;
  status?: 'returning' | 'planned' | 'in_production' | 'ended' | 'cancelled'; // TV only
}

// Watchlist Sharing
export interface SharedWatchlist {
  id: string; // Unique share ID (uuid)
  folderId: string; // Reference to original local folder  
  folderName: string;
  folderColor?: string;
  folderIcon?: string;
  items: WatchlistItem[];
  created_by: string; // User ID
  created_at: string; // ISO timestamp
  expires_at?: string; // Optional expiration
  is_public: boolean;
  share_token: string; // For URL: /watchlists/share?token=xxx
  view_count: number;
}

export interface SharedWatchlistView {
  folderName: string;
  folderColor?: string;
  folderIcon?: string;
  items: WatchlistItem[];
  shared_by: string;
  created_at: string;
  item_count: number;
}

export type VibeIntentType = 'title_lookup' | 'vibe_discovery' | 'mixed';

export interface VibeParseResult {
  query_raw: string;
  intent_type: VibeIntentType;
  hard_constraints: {
    include_genres: string[];
    exclude_genres: string[];
    languages: string[];
    release_year_min: number | null;
    release_year_max: number | null;
    max_runtime_minutes: number | null;
    min_runtime_minutes: number | null;
    media_type: 'movie' | 'tv' | 'any';
    include_people: string[];
    exclude_people: string[];
  };
  soft_preferences: {
    tone_tags: string[];
    story_cues: string[];
    pace: 'slow' | 'medium' | 'fast' | 'any';
    intensity: 'low' | 'medium' | 'high' | 'any';
    reference_titles: string[];
  };
  ranking_hints: {
    boost_overview_terms: string[];
    boost_keyword_terms: string[];
    penalize_terms: string[];
  };
  fallback_query_terms: string[];
  confidence: number;
  notes_for_retrieval: string[];
}

// Search Results Page types
export interface SearchResult {
  id: number;
  title: string;
  year?: string;
  type: 'movie' | 'show';
  media_type: 'movie' | 'tv';
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  summary_snippet?: string;
  rating?: number;
  genre_ids?: number[];
  genres?: string[];
  confidence: number;
  popularity?: number;
  original_language?: string;
}

export interface SearchPageResponse {
  ok: boolean;
  query: string;
  page: number;
  total_pages: number;
  total_results: number;
  hero: SearchResult | null;
  results: SearchResult[];
  people: PersonSearchCandidate[];
  did_you_mean?: string[];
  applied_filters?: {
    type: 'all' | 'movie' | 'tv';
    sortBy: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'title.asc' | string;
    genres: number[];
    yearMin: number | null;
    yearMax: number | null;
    ratingMin: number | null;
  };
}

