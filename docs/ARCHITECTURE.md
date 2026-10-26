# MovieMonk Architecture

MovieMonk employs a decoupled, secure architecture designed for low-latency entertainment discovery, rich entity exploration, and server-side secret isolation.

---

## 1. System Overview

```
                                  ┌───────────────────────┐
                                  │      Web Browser      │
                                  └───────────┬───────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │     Frontend Router     │                     │   Supabase Client SDK   │
         │ [AppRoutes / Responsive]│                     │  (Auth & Cloud Lists)   │
         └────────────┬────────────┘                     └────────────┬────────────┘
                      │                                               │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │     [lib/apiClient]     │                     │    Supabase Database    │
         │ (HTTP & Correlation ID) │                     │ (Profiles, Lists, RLS)  │
         └────────────┬────────────┘                     └─────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │  FastAPI Backend Proxy  │
         │      [server/app/]      │
         └────────────┬────────────┘
                      │
     ┌────────────────┼────────────────┬────────────────┐
     ▼                ▼                ▼                ▼
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│  TMDB   │      │ Groq AI │      │  OMDB   │      │Wikipedia│
│Metadata │      │Summaries│      │ Ratings │      │ Trivia  │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
```

---

## 2. Core Layers & Responsibilities

### 2.1 User Interface & Routing (Frontend)
- **[index.tsx](../index.tsx)**: Mounts React 19 root with `HelmetProvider`, preconnects API & database origins, and registers Vercel Analytics and Speed Insights.
- **[AppRoutes.tsx](../AppRoutes.tsx)**: Code-splits routes via `React.lazy` (`/`, `/search`, `/movie/:id`, `/tv/:id`, `/person/:id`, `/watchlists`, `/settings`).
- **[App-Responsive.tsx](../App-Responsive.tsx)**: Main shell coordinating discovery, search, title details, person profiles, action toasts, and modal traps.
- **[components/DynamicSearchIsland.tsx](../components/DynamicSearchIsland.tsx)**: Accessible, debounced search island with real-time suggestions and filter toggles.
- **[components/MovieDisplay.tsx](../components/MovieDisplay.tsx)** & **[components/PersonDisplay.tsx](../components/PersonDisplay.tsx)**: Rich detail views featuring multi-source metadata, watch providers, spoiler-safe summaries, and filmographies.

### 2.2 Client Data & Persistence
- **[lib/apiClient.ts](../lib/apiClient.ts)**: Central HTTP interface with request ID tracking (`X-Client-Request-Id`), error normalization, and abort signal forwarding.
- **[contexts/AuthContext.tsx](../contexts/AuthContext.tsx)**: Supabase OAuth (GitHub & Google) session management and lifecycle hooks.
- **[hooks/useCloudWatchlists.ts](../hooks/useCloudWatchlists.ts)** & **[services/watchlistSync.ts](../services/watchlistSync.ts)**: Bi-directional sync between local storage (Guest Mode) and Supabase Postgres tables with Row Level Security.
- **[services/tmdbService.ts](../services/tmdbService.ts)**: Typed client wrapper calling the backend TMDB proxy (`/api/tmdb`).

### 2.3 Backend API & AI Orchestration (`server/app/`)
Built with FastAPI (Python 3.11+) and deployed to Hugging Face Spaces:
- **`app/api/search.py`**: Multi-signal keyword & vibe search coordinating TMDB person, movie, and TV searches in parallel with server-side vibe intent extraction.
- **`app/api/details.py`**: Consolidated media details combining TMDB facts, OMDB critic ratings, Wikipedia extended background, and Groq LLM spoiler-conscious summaries.
- **`app/api/suggest.py`**: High-speed, type-ahead suggestion rankings scored by query similarity, popularity, and intent.
- **`app/api/watchlists.py`**: Authenticated snapshot sharing with strict JWT verification and item payload validation.
- **`app/api/tmdb_proxy.py` & `app/api/groq_proxy.py`**: Authenticated server proxies keeping all secret provider credentials off client devices.
- **`app/core/ratelimit.py` & `app/core/cache.py`**: Redis-backed caching and sliding-window rate limiting with seamless in-memory fallback.

---

## 3. Runtime Data Flows

### Search & Discovery Flow
1. User enters natural-language query in `DynamicSearchIsland`.
2. Client queries `/api/search` via `apiClient.ts`.
3. Backend inspects Redis cache; on miss, queries TMDB in parallel (`search_movie`, `search_tv`, `search_person`).
4. If the query expresses conceptual mood or tone, `vibe_parser.py` extracts structured hard and soft constraints.
5. Response is cached and returned to render `SearchResultsPage` with hero spotlight and paginated results.

### Title Details Flow
1. User selects title (`/movie/:id` or `/tv/:id`).
2. Client checks session cache; on miss, calls `/api/details/{media_type}/{tmdb_id}`.
3. Backend gathers TMDB metadata, credits, images, videos, and watch providers concurrently.
4. Second phase enriches with IMDb/Rotten Tomatoes scores from OMDB and cultural context from Wikipedia.
5. Groq LLM generates spoiler-free hooks, spoiler-revealing plot analysis (with warnings), and mood tags.
6. Payload is merged into a single `DetailsResponse` and cached for 24 hours.

---

## 4. Key Design Principles

- **Zero Client Credential Exposure**: No upstream API keys (TMDB, Groq, OMDB) are ever bundled or exposed in client JavaScript.
- **Resilient Fallbacks**: If AI services or Redis are unavailable, the application gracefully degrades to factual TMDB data and in-memory caches.
- **Guest Mode First**: Full watchlist and history functionality works in localStorage without requiring user sign-in.
- **Performance Optimized**: Lazy-loaded routes, virtualized list rendering, multi-tier caching, and preconnect hints ensure snappy interaction.
