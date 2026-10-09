# Caching Strategy

How MovieMonk keeps responses fast and reduces AI/API calls.

---

## Layers at a glance
- **localStorage (client)** — short-lived cache for recent searches.
- **IndexedDB (client)** — longer-lived cache for structured results per user.
- **Redis (server, optional)** — shared cache when `REDIS_URL` is set; safely skipped if unavailable.

All caches store complete movie/person payloads and AI-enriched responses. Errors and partial responses are not cached.

## Default behavior
1. Check IndexedDB, then localStorage for a given query/provider.
2. If not cached, fetch TMDB data + AI summaries.
3. Save the full response back to IndexedDB/localStorage (and Redis if configured).
4. Periodically clear stale client cache entries to keep storage small.

## Enabling server cache
1. Provision a Redis instance (e.g., Upstash, Redis Cloud, or local Docker Redis).
2. Add `REDIS_URL` to `server/.env` (and your hosting provider’s server environment variables).
3. Start the backend. If Redis is unreachable, the app logs a warning and falls back to local in-memory sliding-window caches.

## Cache keys and TTLs
- **Client Cache**:
  - `cacheService.ts` (localStorage query/entity index): 6 hours.
  - `indexedDBService.ts` (IndexedDB persistent cache): 7 days.
- **Server Cache**:
  - Redis cache keys are built with `build_cache_key` based on endpoint and normalized parameters.
  - Query summaries and title details have configurable server TTLs (e.g., 24 hours for details).

## Troubleshooting
- **Seeing no cache hits**: confirm the same query/provider is reused and that cookies/storage are not blocked.
- **Redis warnings**: check `REDIS_URL` and connectivity; functionality continues without Redis.
- **Stale data**: clear browser storage and restart the dev server to refresh caches.
