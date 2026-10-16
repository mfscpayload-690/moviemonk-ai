"""TMDB generic proxy — keeps API key server-side.

Ported from api/tmdb.ts.  The frontend sends ``?endpoint=...``
and this handler forwards the request to TMDB with auth.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Query, Request, Response

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.core.ratelimit import rate_limit
from app.services import tmdb

logger = logging.getLogger("moviemonk.tmdb_proxy")
router = APIRouter()


def _get_tmdb_cache_ttl(endpoint: str) -> tuple[int, int]:
    """Return (redis_ttl_seconds, client_max_age_seconds) based on endpoint volatility.

    - Static/taxonomic data (genres) changes rarely -> 24h Redis, 4h client.
    - Curated/canonical lists (top rated, upcoming) -> 6h Redis, 30m client.
    - Highly dynamic content (trending, popular) -> 2h Redis, 15m client.
    - Discovery searches / on the air -> 1h Redis, 15m client.
    """
    clean = endpoint.strip().strip("/")
    if clean.startswith("genre/"):
        return 86400, 14400  # 24h Redis, 4h client
    if clean in ("movie/top_rated", "tv/top_rated", "movie/upcoming"):
        return 21600, 1800   # 6h Redis, 30m client
    if clean.startswith("trending/") or clean in ("movie/popular", "tv/popular"):
        return 7200, 900     # 2h Redis, 15m client
    if clean.startswith("discover/") or clean in ("movie/now_playing", "tv/on_the_air"):
        return 3600, 900     # 1h Redis, 15m client
    return 3600, 900         # 1h default


@router.get(
    "/tmdb",
    dependencies=[Depends(rate_limit(times=240, seconds=60, key_prefix="tmdb"))],
)
async def tmdb_proxy(
    request: Request,
    response: Response,
    endpoint: str = Query(..., description="TMDB API endpoint path"),
) -> Any:
    """Generic TMDB proxy with Redis caching and HTTP cache headers.
    
    The frontend uses this for discovery carousels, genre lists, and direct TMDB endpoints.
    """
    if not endpoint or not endpoint.strip():
        return api_error(400, "missing_endpoint", "Endpoint parameter is required")

    clean_endpoint = endpoint.strip().strip("/")

    # Collect all other query params (exclude 'endpoint')
    extra_params = {
        k: v
        for k, v in request.query_params.items()
        if k != "endpoint"
    }

    redis_ttl, client_max_age = _get_tmdb_cache_ttl(clean_endpoint)
    cache_key = build_cache_key("tmdb_proxy_v1", {"ep": clean_endpoint, **extra_params})

    cached = await get_cache(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        response.headers["Cache-Control"] = f"public, max-age={client_max_age}, stale-while-revalidate=3600"
        return cached

    try:
        data = await tmdb.generic_proxy(endpoint, extra_params or None)
        if isinstance(data, (dict, list)):
            await set_cache(cache_key, data, redis_ttl)

        response.headers["X-Cache"] = "MISS"
        response.headers["Cache-Control"] = f"public, max-age={client_max_age}, stale-while-revalidate=3600"
        return data
    except ValueError as exc:
        logger.warning("Invalid TMDB endpoint requested: %s", exc)
        return api_error(400, "invalid_endpoint", "Invalid TMDB endpoint")
    except Exception:
        logger.exception("TMDB proxy request failed")
        return api_error(502, "tmdb_error", "Failed to retrieve data from movie database service")
