"""Redis-backed async cache with graceful degradation.

Ported from lib/cache.ts — if REDIS_URL is not configured, all cache
operations silently no-op so the application continues to function.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import redis.asyncio as aioredis

logger = logging.getLogger("moviemonk.cache")

_redis_pool: aioredis.Redis | None = None
_redis_available: bool = True


async def init_redis(redis_url: str | None) -> None:
    """Initialise the Redis connection pool.  Called once at app startup."""
    global _redis_pool, _redis_available

    if not redis_url:
        logger.warning("REDIS_URL not configured — caching disabled")
        _redis_available = False
        return

    try:
        _redis_pool = aioredis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            retry_on_timeout=True,
        )
        # Verify connectivity
        await _redis_pool.ping()
        logger.info("Redis connected successfully")
    except Exception:
        logger.exception("Redis connection failed — caching disabled")
        _redis_available = False
        _redis_pool = None


async def close_redis() -> None:
    """Gracefully close the Redis connection pool."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.aclose()
        _redis_pool = None


async def get_cache(key: str) -> Any | None:
    """Retrieve a value from cache.  Returns ``None`` on miss or error."""
    if not _redis_available or _redis_pool is None:
        return None
    try:
        raw = await _redis_pool.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return raw
    except Exception:
        logger.exception("Cache GET error for key=%s", key)
        return None


async def set_cache(key: str, value: Any, ttl_seconds: int) -> None:
    """Store a value in cache with a TTL.  Fails silently on error."""
    if not _redis_available or _redis_pool is None:
        return
    try:
        payload = value if isinstance(value, str) else json.dumps(value)
        await _redis_pool.set(key, payload, ex=ttl_seconds)
    except Exception:
        logger.exception("Cache SET error for key=%s", key)


def build_cache_key(prefix: str, parts: dict[str, Any]) -> str:
    """Build a deterministic cache key from a prefix and dict of parts.

    Mirrors the ``withCacheKey`` helper from the TypeScript codebase.
    """
    stable = "|".join(
        f"{k}:{v}" for k, v in sorted(parts.items())
    )
    return f"{prefix}:{stable}"
