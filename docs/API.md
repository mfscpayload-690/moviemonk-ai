# MovieMonk API & Integration Guide

This guide documents the API providers, integration patterns, and security practices of the MovieMonk-AI discovery platform. It serves as the authoritative reference for backend data orchestration and frontend query resolution.

---

## 1. System Integration Flow

MovieMonk-AI uses a decoupled data pipeline to combine factual entertainment database records with qualitative LLM analysis.

```
[User Query] ──> [Cache Check] (IndexedDB/localStorage)
                      │
            ┌─────────┴─────────┐
       (Cache Miss)        (Cache Hit)
            │                   │
  [AI Provider Chain]           ▼
  1. Groq (Llama 3.3)      [Render UI]
  2. Mistral (Large)
  3. OpenRouter (Fallback)
            │
            ▼
  [TMDB API Enrichment] (Posters, Backdrops, Cast, Crew)
            │
            ▼
  [OMDB API Integration] (IMDB Ratings)
            │
            ▼
  [Cache Update] ──> [Render UI]
```

### Decoupled Data Pipeline Sequence

1. **Client Request**: The frontend initiates search or detail fetch via the custom query parser.
2. **Local Cache Lookup**: The system checks browser storage (IndexedDB and `localStorage`) for cached results.
3. **AI Inference & Fallback**: If uncached, the backend queries the prioritized AI provider chain to generate narrative context (summaries, reviews, watch options).
4. **Factual Metadata Enrichment**: The returned AI payload is matched against TMDB endpoints to append high-resolution image assets, cast/crew hierarchies, and runtime specifications.
5. **Third-Party Scoring**: The pipeline queries the OMDB API to fetch live IMDB ratings.
6. **Persistence & Presentation**: The normalized payload is written to the cache and rendered.

---

## 2. AI Provider Architecture

MovieMonk integrates multiple LLM endpoints with automatic, client-side fallback triggers to ensure high availability.

### 2.1 Provider Hierarchy

| Priority | Provider | Model | Tier / Role | Rate Limits |
| :--- | :--- | :--- | :--- | :--- |
| **1 (Primary)** | Groq | `llama-3.3-70b-versatile` | Ultra-low latency inference | 30 requests/minute |
| **2 (Backup)** | Mistral | `mistral-large-latest` | Context-rich qualitative backup | 2M tokens/month (free) |
| **3 (Fallback)** | OpenRouter | Dynamic Selection | General backup endpoint | Varies by target model |
| **4 (Real-time)**| Perplexity | `sonar-reasoning` | Optional web search resolver | Varies by query complexity |

### 2.2 Query Complexity Modes

- **Simple Mode**: Optimizes for quick, low-token responses. Ideal for rapid entity lookup.
- **Complex Mode**: Prompts the LLM for deep analysis, critical trivia, and spoiler-guarded qualitative descriptions.

### 2.3 Provider Fallback Logic

The core service coordinates the provider cascade. If the primary provider times out or throws an error (e.g. HTTP 429 / rate limit), the pipeline catches the exception and routes to the next tier:

```typescript
// services/aiService.ts (Cascading Resolver)
try {
  return await groqService.fetchMovieData(query, complexity);
} catch (error) {
  console.warn("Groq failed, attempting Mistral fallback...", error);
  try {
    return await mistralService.fetchMovieData(query, complexity);
  } catch (err) {
    console.warn("Mistral failed, routing to OpenRouter...", err);
    return await openrouterService.fetchMovieData(query, complexity);
  }
}
```

---

## 3. TMDB API Integration

The Movie Database (TMDB) API provides the factual baseline for MovieMonk.

### 3.1 Authentication

The application supports two methods of authentication, configured in your `.env.local` file:

- **API Key (v3 Auth)**: Appended as query parameters.
- **Read Access Token (v4 Auth - Recommended)**: Passed as a bearer token in the headers for increased security.

```typescript
// API client header configuration
const headers = {
  Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
  'Content-Type': 'application/json'
};
```

### 3.2 Key Endpoints

| Endpoint | Method | Purpose | Parameters |
| :--- | :--- | :--- | :--- |
| `https://api.themoviedb.org/3/search/movie` | GET | Locates movie matches | `query`, `year` |
| `https://api.themoviedb.org/3/search/tv` | GET | Locates TV matches | `query`, `first_air_date_year` |
| `https://api.themoviedb.org/3/search/multi` | GET | Unified multi-entity fallback | `query` |
| `https://api.themoviedb.org/3/movie/{id}` | GET | Fetch movie details | `id` |
| `https://api.themoviedb.org/3/tv/{id}` | GET | Fetch TV details | `id` |
| `https://api.themoviedb.org/3/movie/{id}/images` | GET | Fetch high-res artwork | `id` |
| `https://api.themoviedb.org/3/movie/{id}/external_ids`| GET | Resolves IMDB ID for ratings | `id` |

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
