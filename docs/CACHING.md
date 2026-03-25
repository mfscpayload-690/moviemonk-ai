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
1. Provision a Redis instance (any managed Redis works).
2. Add `REDIS_URL` to `.env.local` (and your hosting provider’s env vars).
3. Deploy normally. If Redis is unreachable, the app logs a warning and falls back to client-only caching.

## Cache keys and TTLs
- Keys include query and provider to avoid mixing responses.
- Client cache entries are short lived (hours to days); Redis TTL is set by the API helper when writing.

## Troubleshooting
- **Seeing no cache hits**: confirm the same query/provider is reused and that cookies/storage are not blocked.
- **Redis warnings**: check `REDIS_URL` and connectivity; functionality continues without Redis.
- **Stale data**: clear browser storage and restart the dev server to refresh caches.
