# How MovieMonk Works

Short map of the current structure.

---

## Main Parts

### 1. User Interface
- `App-Responsive.tsx` — main shell that renders layout and header.
- `AppRoutes.tsx` — route wiring for discovery, detail, and person pages.
- `components/` — search island, carousels, displays, and shared UI.

### 2. Data & Services
- `services/aiService.ts` — orchestrates AI summarization (Groq) plus web-search enrichment.
- `services/groqService.ts` — primary AI provider adapter.
- `services/tmdbService.ts` — TMDB data fetcher for movies/TV/people.
- `services/perplexityService.ts` and `services/serpApiService.ts` — optional web search enrichers.
- `services/cacheService.ts`, `services/indexedDBService.ts`, `services/searchHistoryService.ts` — caching and history.
- `services/watchlistSync.ts`, `services/watchedService.ts`, `services/userSettingsService.ts` — persistence for user lists and preferences.
- `services/observability.ts` — lightweight logging utilities shared by serverless routes.

### 3. Data Flow

```
User searches → cached result? → if not:
  • TMDB fetch (tmdbService)
  • AI enrichment (aiService fallback chain)
  • Optional web search (Perplexity/SerpAPI) for recency
  • Merge + cache
Render UI with normalized movie/person payloads
```

---

## Why This Design?

- **TMDB-first**: factual cast/crew/ratings as the source of truth.
- **AI enrichment**: summaries and explanations layered on top.
- **Fallback providers**: automatic switch if one AI vendor fails.
- **Caching**: local and server-side paths keep repeat queries fast.
- **Optional web search**: fills gaps for very recent or obscure titles.
