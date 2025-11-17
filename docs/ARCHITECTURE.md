# Architecture Overview

## System Design

MovieMonk is a client-side React application that integrates Google Gemini AI and TMDB APIs to provide intelligent movie/show information retrieval.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 React Application                     │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────┐  │   │
│  │  │ChatInterface│  │MovieDisplay │  │ErrorBanner   │  │   │
│  │  └──────┬──────┘  └──────▲──────┘  └──────────────┘  │   │
│  │         │                 │                           │   │
│  │         │    ┌───────────┴───────────┐               │   │
│  │         └────►      App.tsx          │               │   │
│  │              └────────┬───────────────┘               │   │
│  └────────────────────────┼─────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
    ┌───────▼────────┐                 ┌───────▼────────┐
    │geminiService.ts│                 │tmdbService.ts  │
    └───────┬────────┘                 └───────┬────────┘
            │                                   │
    ┌───────▼─────────────┐          ┌─────────▼────────┐
    │  Google Gemini API  │          │    TMDB API      │
    │  - Gemini 2.5 Flash │          │  - Search        │
    │  - Gemini 2.5 Pro   │          │  - Images        │
    │  - Google Search    │          │  - Metadata      │
    └─────────────────────┘          └──────────────────┘
```

## Data Flow

### 1. User Query Flow

```
User Input → ChatInterface → App.tsx → fetchMovieData()
                                             ↓
                            Gemini API Request (with Google Search grounding)
                                             ↓
                            JSON Response (MovieData structure)
                                             ↓
                            parseJsonResponse() → MovieData object
                                             ↓
                            enrichWithTMDB() → Fill missing images
                                             ↓
                            MovieDisplay renders results
```

### 2. Image Enrichment Flow

```
Gemini Response → MovieData (may have missing/invalid images)
                        ↓
              enrichWithTMDB(data)
                        ↓
         TMDB searchTitle() → Get movie/TV ID
                        ↓
         TMDB fetchImages() → Get poster/backdrop/gallery
                        ↓
         Merge: TMDB images (priority) + AI images (fallback)
                        ↓
         Return enriched MovieData
```

## Key Components

### Frontend Layer

**App.tsx**
- Main orchestrator
- Manages global state (movieData, messages, loading, error)
- Handles user search requests
- Coordinates between ChatInterface and MovieDisplay

**ChatInterface.tsx**
- User input collection
- Query complexity toggle (Simple/Complex)
- Conversation history display
- Loading states

**MovieDisplay.tsx**
- Renders movie/show details
- Spoiler gating (click to reveal)
- Trailer modal
- Gallery with fallback handling
- Source citations from Gemini grounding

### Service Layer

**geminiService.ts**
- Gemini API integration
- Model selection based on complexity:
  - `gemini-2.5-flash` for Simple queries
  - `gemini-2.5-pro` for Complex queries (with thinking budget)
- Prompt engineering with embedded JSON schema
- Response parsing (strips markdown fences)
- Error handling for safety filters, token limits, API failures
- Calls `enrichWithTMDB()` for missing images

**tmdbService.ts**
- TMDB API integration (supports v3 API key or v4 Read Token)
- Title search with fallback (movie → tv → multi)
- Image fetching with size optimization:
  - `w500` for posters
  - `w780` for backdrops/gallery
  - `original` available for full-res
- Image URL validation heuristic
- Always prefers TMDB images over AI-provided URLs

### Data Models (types.ts)

**Core Types:**
- `MovieData`: Complete movie/show information
- `ChatMessage`: Conversation history
- `QueryComplexity`: Enum for model selection
- `FetchResult`: Wrapped response with movieData + sources + error
- `GroundingSource`: Citations from Gemini Google Search grounding

## Integration Points

### Google Gemini

**Configuration:**
- System instruction: `INITIAL_PROMPT` (constants.ts)
- Tools: `[{ googleSearch: {} }]` for grounding
- Response format: JSON (enforced via prompt, not responseSchema due to tool incompatibility)

**Prompt Engineering:**
- Embedded JSON schema in prompt text
- Explicit instructions for image URLs, ratings, summaries
- Empty string/array conventions for missing data

**Error Handling:**
- `SAFETY`: Content blocked → user-friendly message
- `MAX_TOKENS`: Response too long → suggest simpler query
- API key invalid → configuration error message
- Quota exceeded → rate limit message

### TMDB API

**Endpoints Used:**
- `/search/movie?query=...&year=...`
- `/search/tv?query=...&first_air_date_year=...`
- `/search/multi?query=...`
- `/{movie|tv}/{id}/images?include_image_language=en,null`

**Image Strategy:**
- Primary: TMDB images (guaranteed valid)
- Fallback: AI-provided URLs (validated with regex)
- Gallery: 6 images max (backdrops + posters)

### Environment Variables (Vite)

**Build-time injection:**
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.TMDB_API_KEY': JSON.stringify(env.TMDB_API_KEY || ''),
  'process.env.TMDB_READ_TOKEN': JSON.stringify(env.TMDB_READ_TOKEN || '')
}
```

**Deployment:**
- GitHub Actions: Secrets injected during build
- Railway/Vercel: Dashboard environment variables

## Configuration & Constants

**constants.ts**
- `MOVIE_DATA_SCHEMA`: Type.OBJECT schema for Gemini response
- `INITIAL_PROMPT`: System instruction with embedded schema

**vite.config.ts**
- Base path: `/moviemonk-ai/` (GitHub Pages) vs `/` (local)
- Dev server: port 3000, host 0.0.0.0
- Path alias: `@/` → root directory

## Performance Considerations

**Optimizations:**
- Lazy loading: No initial data fetch (removed Interstellar preload)
- Image sizes: Optimized TMDB sizes (w500, w780 vs original)
- Vite build: Code splitting, minification, tree shaking
- React 19: Concurrent features for smoother UI

**Potential Bottlenecks:**
- Gemini API latency (2-5s for complex queries)
- TMDB enrichment adds ~500ms per query
- Large gallery images (can be lazy-loaded)

## Security

**API Key Protection:**
- `.env.local` in `.gitignore`
- GitHub Secrets for deployment
- Client-side keys (acceptable for Gemini/TMDB public APIs with quota limits)

**Note:** For production with sensitive data, consider a backend proxy to hide API keys.

## Error Handling Strategy

**Graceful Degradation:**
1. Gemini fails → Show error banner, keep UI functional
2. TMDB fails → Use AI images (if any), log warning
3. Image load fails → Show "Image Unavailable" placeholder
4. Parsing fails → Log raw response, show user-friendly error

**User-Facing Errors:**
- Clear messages (no stack traces)
- Actionable suggestions (e.g., "try a different query")
- Option to retry or dismiss

## Future Enhancements

**Potential Additions:**
- Backend proxy for API key security
- Caching layer (Redis/localStorage) for repeated queries
- User accounts & favorites
- Advanced filters (genre, year, rating)
- Multi-language support
- Voice search integration
- Recommendation engine based on viewing history
