/**
 * Search History & Autocomplete Service
 * Manages search history, trending searches, and smart autocomplete suggestions
 */

const STORAGE_KEY_HISTORY = 'moviemonk_search_history_v1';
const STORAGE_KEY_AUTOCOMPLETE_CACHE = 'moviemonk_autocomplete_cache_v1';
const MAX_HISTORY_ITEMS = 20;
const AUTOCOMPLETE_DEBOUNCE_MS = 200;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number; // How many times searched
}

export interface AutocompleteResult {
  id: string;
  text: string;
  type: 'history' | 'popular' | 'suggestion';
  icon: 'history' | 'trending' | 'search';
}

interface CacheEntry {
  data: AutocompleteResult[];
  timestamp: number;
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save search query to history
 */
export function addSearchToHistory(query: string): void {
  if (!query || query.length < 2) return;

  try {
    const history = getSearchHistory();
    const normalized = query.toLowerCase().trim();
    
    // Find existing entry
    const existing = history.findIndex(
      item => item.query.toLowerCase() === normalized
    );

    if (existing >= 0) {
      // Move to top and increment count
      const [item] = history.splice(existing, 1);
      item.timestamp = Date.now();
      item.count += 1;
      history.unshift(item);
    } else {
      // Add new entry at top
      history.unshift({
        query,
        timestamp: Date.now(),
        count: 1
      });
    }

    // Limit to MAX_HISTORY_ITEMS
    localStorage.setItem(
      STORAGE_KEY_HISTORY,
      JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS))
    );
  } catch {
    // Silently fail if storage is unavailable
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem(STORAGE_KEY_AUTOCOMPLETE_CACHE);
  } catch {
    // Silently fail
  }
}

/**
 * Get autocomplete suggestions based on input
 */
export async function getAutocompleteSuggestions(
  query: string
): Promise<AutocompleteResult[]> {
  if (!query || query.length < 1) {
    // Return recent searches
    return getRecentSearchesAsAutocomplete();
  }

  const normalized = query.toLowerCase().trim();

  try {
    // Check cache first
    const cached = getCachedSuggestions(normalized);
    if (cached) return cached;

    // Get suggestions from API
    const suggestions = await fetchAutocompleteSuggestions(normalized);

    // Cache results
    setCachedSuggestions(normalized, suggestions);

    return suggestions;
  } catch (err) {
    console.error('Autocomplete fetch failed:', err);
    // Fallback to history on error
    return getHistoryMatchesForQuery(normalized);
  }
}

/**
 * Get recent searches formatted as autocomplete results
 */
function getRecentSearchesAsAutocomplete(): AutocompleteResult[] {
  const history = getSearchHistory().slice(0, 6);
  return history.map((item, index) => ({
    id: `history-${index}`,
    text: item.query,
    type: 'history',
    icon: 'history'
  }));
}

/**
 * Get history items matching the query
 */
function getHistoryMatchesForQuery(query: string): AutocompleteResult[] {
  const history = getSearchHistory();
  const matches = history
    .filter(item => item.query.toLowerCase().includes(query))
    .slice(0, 5);

  return matches.map((item, index) => ({
    id: `history-match-${index}`,
    text: item.query,
    type: 'history',
    icon: 'history'
  }));
}

/**
 * Fetch autocomplete suggestions from API
 */
async function fetchAutocompleteSuggestions(
  query: string
): Promise<AutocompleteResult[]> {
  const params = new URLSearchParams({
    q: query,
    mode: 'autocomplete'
  });

  try {
    const response = await fetch(`/api/suggest?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.ok || !Array.isArray(data.suggestions)) return [];

    // Transform API results to AutocompleteResult
    return data.suggestions.slice(0, 8).map((item: any, index: number) => ({
      id: `suggestion-${index}`,
      text: item.title,
      type: 'suggestion',
      icon: 'search'
    }));
  } catch {
    return [];
  }
}

/**
 * Get cached suggestions if they exist and are fresh
 */
function getCachedSuggestions(query: string): AutocompleteResult[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTOCOMPLETE_CACHE);
    if (!raw) return null;

    const cache: Record<string, CacheEntry> = JSON.parse(raw);
    const entry = cache[query];

    if (!entry) return null;

    // Check if cache is fresh
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      delete cache[query];
      localStorage.setItem(STORAGE_KEY_AUTOCOMPLETE_CACHE, JSON.stringify(cache));
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Cache suggestions for a query
 */
function setCachedSuggestions(query: string, suggestions: AutocompleteResult[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTOCOMPLETE_CACHE) || '{}';
    const cache: Record<string, CacheEntry> = JSON.parse(raw);

    cache[query] = {
      data: suggestions,
      timestamp: Date.now()
    };

    // Limit cache size to 50 queries
    const keys = Object.keys(cache);
    if (keys.length > 50) {
      keys.slice(0, keys.length - 50).forEach(k => delete cache[k]);
    }

    localStorage.setItem(STORAGE_KEY_AUTOCOMPLETE_CACHE, JSON.stringify(cache));
  } catch {
    // Silently fail if storage is full
  }
}
