# MovieMonk API & Integration Guide

This guide documents the API providers, integration patterns, and security practices of the MovieMonk-AI discovery platform. It serves as the authoritative reference for backend data orchestration and frontend query resolution.

---

## 1. System Integration Flow

MovieMonk-AI uses a decoupled data pipeline to combine factual entertainment database records with qualitative LLM analysis.

```
[User Query] ──> [Client Cache Check] (IndexedDB / localStorage)
                      │
            ┌─────────┴─────────┐
       (Cache Miss)        (Cache Hit)
            │                   │
            ▼                   ▼
    [FastAPI Backend]      [Render UI]
            │
            ├─► [Redis Cache Check]
            │
            ├─► [AI Enrichment Engine] (Groq LPU / Perplexity Fallback)
            │
            ├─► [TMDB Metadata Proxy] (Posters, Backdrops, Cast, Crew)
            │
            └─► [OMDB Scoring Proxy] (IMDb, Rotten Tomatoes, Metacritic)
                      │
                      ▼
        [Normalize & Cache Payload]
                      │
                      ▼
                 [Render UI]
```

### Decoupled Data Pipeline Sequence

1. **Client Request**: The frontend initiates search or detail fetch via [lib/apiClient.ts](file:///home/mfscpayload-690/Desktop/moviemonk-ai/lib/apiClient.ts).
2. **Local Cache Lookup**: The system checks browser storage (IndexedDB via `indexedDBService.ts` and `localStorage` via `cacheService.ts`) for cached results.
3. **Backend Proxy & Orchestration**: On cache miss, requests hit the dedicated FastAPI backend (`/api/search`, `/api/details/*`, `/api/query`, etc.).
4. **AI Inference & Fallback**: The backend queries Groq LPU (`openai/gpt-oss-20b` or configured model) with optional Perplexity search fallback to generate narrative context (summaries, spoilers, notes, vibe tags).
5. **Factual Metadata Enrichment**: Backend aggregates TMDB metadata to append high-resolution image assets, cast/crew hierarchies, and runtime specifications.
6. **Third-Party Scoring**: The backend queries the OMDB API to fetch live IMDb, Rotten Tomatoes, and Metacritic ratings.
7. **Persistence & Presentation**: The normalized payload is written to Redis (if configured) and client storage, then rendered in the UI.

---

## 2. AI Provider Architecture

MovieMonk integrates low-latency LLM inference via Groq, with optional search-augmented fallback.

### 2.1 Provider Hierarchy

| Priority | Provider | Model | Tier / Role | Rate Limits / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **1 (Primary)** | Groq | `openai/gpt-oss-20b` / `llama-3.3-70b-versatile` | Ultra-low latency inference & creative enrichment | 30 requests/minute (supports multiple keys via `groq_keys` round-robin) |
| **2 (Real-time Fallback)** | Perplexity | `sonar-reasoning` / Search model | Real-time web search resolver & recent release fallback | Configured via `PERPLEXITY_API_KEY` |
| **3 (Web Search)** | SerpApi | Search API | Search enrichment fallback | Configured via `SERPAPI_KEY` |

### 2.2 Query Complexity Modes

- **Simple Mode**: Optimizes for quick, low-token responses. Ideal for rapid entity lookup.
- **Complex Mode**: Prompts the LLM for deep analysis, critical trivia, and spoiler-guarded qualitative descriptions.

### 2.3 Provider Execution Logic

AI generation is coordinated through the FastAPI backend (`server/app/services/ai_enrichment.py` and `server/app/api/groq_proxy.py`) and client adapter (`services/ai.ts`):

```typescript
// services/ai.ts (Client AI Adapter)
export type Provider = 'groq';

const call: Promise<any> = fetchFromGroq(
  JSON.stringify({ schema, messages }),
  QueryComplexity.SIMPLE,
  chatHistory
);
```

---

## 3. TMDB API Integration

The Movie Database (TMDB) API provides the factual baseline for MovieMonk.

### 3.1 Authentication & Proxy Architecture

All TMDB credentials reside strictly on the server (`server/.env` or Hugging Face Space Secrets):

- **API Key (v3 Auth)**: `TMDB_API_KEY` used by FastAPI service.
- **Read Access Token (v4 Auth - Recommended)**: `TMDB_READ_TOKEN` passed as Bearer token by backend to TMDB.

The client application never communicates with TMDB directly; requests are proxied via `/api/tmdb` and aggregated through endpoints such as `/api/details/{media_type}/{tmdb_id}`.

### 3.2 Key Backend Endpoints

| Backend Route | Method | Purpose | Upstream Target |
| :--- | :--- | :--- | :--- |
| `/api/search` | GET/POST | Multi-signal keyword & vibe search | TMDB search + vibe parser |
| `/api/suggest` | GET | Typeahead query autocomplete | TMDB search multi + ranking |
| `/api/resolve` | GET | Resolves title/person entity by query | TMDB search |
| `/api/details/{media_type}/{tmdb_id}` | GET | Consolidated details, credits, videos, ratings | TMDB + OMDB + Wikipedia + Groq |
| `/api/person/{person_id}` | GET | Person details, biography & filmography | TMDB person endpoints |
| `/api/episodes/{tmdb_id}/{season}` | GET | Season episode list & air dates | TMDB / TVMaze |
| `/api/vibe` | GET/POST | Semantic vibe/mood search | Groq / TMDB discover |
| `/api/query` | POST | "Brief Me" structured summary | Groq AI enrichment |
| `/api/omdb` | GET | Critic & IMDb ratings proxy | OMDB API |
| `/api/tmdb` | GET | Generic passthrough proxy | TMDB API |
| `/api/watchlists` | POST/GET | Watchlist snapshot sharing | Supabase PostgreSQL |
| `/api/observability` | GET/POST | System metrics & client telemetry | Server in-memory / Sentry |

### 3.3 Search & Disambiguation Strategy

```typescript
async function searchMovieOrShow(title: string, year?: number) {
  // 1. Try movie search with specific year filter
  if (year) {
    const movieResults = await tmdbFetch('/search/movie', 
      new URLSearchParams({ query: title, year: year.toString() })
    );
    if (movieResults.results?.length > 0) {
      return { result: movieResults.results[0], mediaType: 'movie' as const };
    }
  }

  // 2. Fall back to movie search without year
  const movieResults = await tmdbFetch('/search/movie', new URLSearchParams({ query: title }));
  if (movieResults.results?.length > 0) {
    return { result: movieResults.results[0], mediaType: 'movie' as const };
  }

  // 3. Fall back to TV series search
  const tvResults = await tmdbFetch('/search/tv', new URLSearchParams({ query: title }));
  if (tvResults.results?.length > 0) {
    return { result: tvResults.results[0], mediaType: 'tv' as const };
  }

  return null;
}
```

### 3.4 Image Enrichment Flow

To keep posters and backdrop galleries reliable and high-resolution, MovieMonk overrides AI-guessed image paths with verified TMDB URLs:

```typescript
async function enrichWithTMDB(data: MovieData): Promise<MovieData> {
  const searchResult = await searchMovieOrShow(data.title, data.year);
  if (!searchResult) return data;

  const { result, mediaType } = searchResult;
  const imagesData = await tmdbFetch(`/${mediaType}/${result.id}/images`);

  return {
    ...data,
    poster_url: buildImageUrl(result.poster_path) || data.poster_url,
    backdrop_url: buildImageUrl(result.backdrop_path) || data.backdrop_url,
    gallery_images: [
      ...imagesData.backdrops.slice(0, 4).map(img => buildImageUrl(img.file_path, 'w780')),
      ...imagesData.posters.slice(0, 2).map(img => buildImageUrl(img.file_path, 'w780'))
    ].slice(0, 6)
  };
}
```

---

## 4. OMDB Ratings Integration

Since TMDB ratings are community-based, MovieMonk leverages the OMDB API to fetch official IMDB scores and critics' reviews (Rotten Tomatoes, Metacritic).

- **Authentication**: Requires `OMDB_API_KEY` set in the environment.
- **Data flow**: The system uses the TMDB external ID resolver to get the `imdb_id` (e.g. `tt1375666`), and queries OMDB:
  ```
  http://www.omdbapi.com/?apikey=OMDB_API_KEY&i=imdb_id
  ```

---

## 5. Caching & Performance Best Practices

To control operating costs and respect external rate limits, data is cached at multiple levels.

### 5.1 Caching Layers

1. **Client-side IndexedDB**: Stores fully normalized metadata payloads (facts + AI summaries) for long-term offline-first recall.
2. **Client-side localStorage**: Used for short-term search history index lists.
3. **Server-side Redis (Optional)**: If `REDIS_URL` is set in the backend environment, queries are cached in a shared Redis cache layer. The application gracefully skips Redis if the connection times out.

### 5.2 Client Caching Implementation

```typescript
const cacheKey = `tmdb_movie_${title}_${year}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const result = await searchMovieOrShow(title, year);
localStorage.setItem(cacheKey, JSON.stringify(result));
```

---

## 6. Security & Key Protection

### 6.1 Serverless Proxy Isolation
All credentials (`GROQ_API_KEY`, `TMDB_READ_TOKEN`, etc.) are kept strictly in server-side environments (Vercel serverless functions / Hugging Face Space runtime). No client-side component calls external APIs directly; requests are proxied via `/api/*` routes.

### 6.2 Key Verification
- Avoid using the `VITE_` prefix for AI provider secrets to prevent Vite from bundling them into the client build assets.
- Rotate credentials immediately if commits are leaked.
- Enforce secure headers (CORS and CSP policies) on backend proxy endpoints to restrict third-party access.

```bash
# ✅ Good: Server-side environment variables
GROQ_API_KEY=sk-proj-...
MISTRAL_API_KEY=mistral-...

# ❌ Bad: Client-side exposed variables
VITE_GROQ_API_KEY=sk-proj-...
```

---

## 7. Troubleshooting & API Errors

### 7.1 Common Scenarios

- **HTTP 401 Unauthorized**: Invalid credentials. Confirm that `.env.local` is loaded and Vite/Server services are restarted.
- **HTTP 429 Rate Limit**: Too many requests sent. The service logs the error and triggers the fallback chain.
- **Images Fail to Load**: Verify the image path returned from TMDB. The helper `buildImageUrl` filters invalid null paths and defaults to a local asset.

### 7.2 API Resources Directory

- **Groq Console**: [console.groq.com](https://console.groq.com)
- **Mistral Portal**: [console.mistral.ai](https://console.mistral.ai)
- **TMDB Documentation**: [developer.themoviedb.org](https://developer.themoviedb.org/docs)
- **OMDB Endpoint Registration**: [omdbapi.com](http://www.omdbapi.com)
