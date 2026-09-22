"""Rate limiting middleware and dependencies for MovieMonk API.

Provides distributed Redis-backed rate limiting with graceful in-memory
sliding-window fallback when Redis is unavailable.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from collections.abc import Callable
from typing import Any

from fastapi import HTTPException, Request

from app.core import cache

logger = logging.getLogger("moviemonk.ratelimit")

# In-memory sliding window fallback: {prefix:client_ip: [timestamp, ...]}
_in_memory_buckets: dict[str, list[float]] = defaultdict(list)
_LAST_CLEANUP = time.monotonic()


def get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting proxy headers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # First IP in X-Forwarded-For is client
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def _cleanup_in_memory() -> None:
    """Prune expired in-memory rate limit timestamps periodically."""
    global _LAST_CLEANUP
    now = time.monotonic()
    if now - _LAST_CLEANUP < 60:
        return
    _LAST_CLEANUP = now
    cutoff = now - 3600
    expired_keys = [
        k for k, timestamps in _in_memory_buckets.items()
        if not timestamps or timestamps[-1] < cutoff
    ]
    for k in expired_keys:
        _in_memory_buckets.pop(k, None)


def rate_limit(
    times: int,
    seconds: int = 60,
    key_prefix: str = "rl",
) -> Callable[[Request], Any]:
    """Factory creating a FastAPI dependency for rate limiting.

    Usage:
        @router.post("/endpoint", dependencies=[Depends(rate_limit(10, 60))])
    """
    async def dependency(request: Request) -> None:
        client_ip = get_client_ip(request)
        bucket_key = f"{key_prefix}:{client_ip}"

        # 1. Try Redis rate limiting if available
        if cache._redis_available and cache._redis_pool is not None:
            try:
                redis = cache._redis_pool
                redis_key = f"rl:{bucket_key}"
                current = await redis.incr(redis_key)
                if current == 1:
                    await redis.expire(redis_key, seconds)

                if current > times:
                    ttl = await redis.ttl(redis_key)
                    retry_after = max(int(ttl), 1)
                    logger.warning(
                        "Rate limit exceeded (redis) for ip=%s prefix=%s count=%d limit=%d",
                        client_ip,
                        key_prefix,
                        current,
                        times,
                    )
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "code": "rate_limit_exceeded",
                            "message": f"Too many requests. Rate limit is {times} requests per {seconds}s.",
                            "retry_after": retry_after,
                        },
                        headers={"Retry-After": str(retry_after)},
                    )
                return
            except HTTPException:
                raise
            except Exception:
                logger.exception("Redis rate limiter failed, falling back to in-memory")

        # 2. In-memory sliding window fallback
        _cleanup_in_memory()
        now = time.monotonic()
        window_start = now - seconds
        timestamps = _in_memory_buckets[bucket_key]

        # Keep timestamps within the window
        _in_memory_buckets[bucket_key] = [t for t in timestamps if t > window_start]
        valid_timestamps = _in_memory_buckets[bucket_key]

        if len(valid_timestamps) >= times:
            oldest = valid_timestamps[0]
            retry_after = max(int(seconds - (now - oldest)), 1)
            logger.warning(
                "Rate limit exceeded (memory) for ip=%s prefix=%s count=%d limit=%d",
                client_ip,
                key_prefix,
                len(valid_timestamps) + 1,
                times,
            )
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "rate_limit_exceeded",
                    "message": f"Too many requests. Rate limit is {times} requests per {seconds}s.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        _in_memory_buckets[bucket_key].append(now)

    return dependency
