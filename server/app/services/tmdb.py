"""TMDB API client — single async client with connection pooling.

Consolidates all TMDB interaction from the TypeScript codebase
(api/tmdb.ts, api/search.ts, api/resolveEntity.ts, api/person/[id].ts,
services/tmdbService.ts) into one service.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger("moviemonk.tmdb")

TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p"

# Reusable async client — created once, shared across requests
_client: httpx.AsyncClient | None = None


async def get_client() -> httpx.AsyncClient:
    """Return the singleton httpx client (lazy init)."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0))
    return _client


async def close_client() -> None:
    """Close the httpx client — called at app shutdown."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def _auth_headers() -> dict[str, str]:
    settings = get_settings()
    if settings.TMDB_READ_TOKEN:
        return {"Authorization": f"Bearer {settings.TMDB_READ_TOKEN}"}
    return {}


def _auth_params() -> dict[str, str]:
    settings = get_settings()
    if not settings.TMDB_READ_TOKEN and settings.TMDB_API_KEY:
        return {"api_key": settings.TMDB_API_KEY}
    return {}


async def tmdb_fetch(
    path: str,
    params: dict[str, Any] | None = None,
) -> Any:
    """Make an authenticated GET request to the TMDB API."""
    client = await get_client()
    url = f"{TMDB_BASE}/{path.lstrip('/')}"
    merged_params = {**_auth_params(), **(params or {})}
    # Remove None values
    merged_params = {k: v for k, v in merged_params.items() if v is not None}

    resp = await client.get(url, params=merged_params, headers=_auth_headers())
    if resp.status_code != 200:
        logger.warning("TMDB %s failed: %d %s", path, resp.status_code, resp.text[:200])
        resp.raise_for_status()
    return resp.json()


def build_image_url(
    path: str | None,
    size: str = "original",
) -> str:
    """Build a full TMDB image URL from a relative path."""
    if not path:
        return ""
    return f"{IMG_BASE}/{size}{path}"


# ─── High-level helpers ────────────────────────────────────────────


async def search_multi(query: str, page: int = 1) -> dict:
    """TMDB /search/multi — returns movies, TV, and people."""
    return await tmdb_fetch("search/multi", {"query": query, "page": page})


async def search_movie(query: str, year: str | None = None, page: int = 1) -> dict:
    params: dict[str, Any] = {"query": query, "page": page}
    if year:
        params["year"] = year
    return await tmdb_fetch("search/movie", params)


async def search_tv(query: str, year: str | None = None, page: int = 1) -> dict:
    params: dict[str, Any] = {"query": query, "page": page}
    if year:
        params["first_air_date_year"] = year
    return await tmdb_fetch("search/tv", params)


async def search_person(query: str, page: int = 1) -> dict:
    return await tmdb_fetch("search/person", {"query": query, "page": page})


async def get_details(media_type: str, tmdb_id: int) -> dict:
    """Fetch full details for a movie or TV show."""
    return await tmdb_fetch(f"{media_type}/{tmdb_id}", {"language": "en-US"})


async def get_season_details(tv_id: int, season_number: int) -> dict:
    """Fetch details for a specific season of a TV show (contains episodes)."""
    return await tmdb_fetch(f"tv/{tv_id}/season/{season_number}", {"language": "en-US"})


async def get_credits(media_type: str, tmdb_id: int) -> dict:
    return await tmdb_fetch(f"{media_type}/{tmdb_id}/credits", {"language": "en-US"})


async def get_images(media_type: str, tmdb_id: int) -> dict:
    return await tmdb_fetch(
        f"{media_type}/{tmdb_id}/images",
        {"include_image_language": "en,null"},
    )


async def get_videos(media_type: str, tmdb_id: int) -> dict:
    return await tmdb_fetch(f"{media_type}/{tmdb_id}/videos", {"language": "en-US"})


async def get_watch_providers(media_type: str, tmdb_id: int) -> dict:
    return await tmdb_fetch(f"{media_type}/{tmdb_id}/watch/providers")


async def get_external_ids(media_type: str, tmdb_id: int) -> dict:
    return await tmdb_fetch(f"{media_type}/{tmdb_id}/external_ids")


async def get_similar(media_type: str, tmdb_id: int) -> dict:
    return await tmdb_fetch(f"{media_type}/{tmdb_id}/similar")


async def get_recommendations(media_type: str, tmdb_id: int) -> dict:
    return await tmdb_fetch(f"{media_type}/{tmdb_id}/recommendations")


async def get_person(person_id: int) -> dict:
    return await tmdb_fetch(f"person/{person_id}", {"language": "en-US"})


async def get_person_combined_credits(person_id: int) -> dict:
    return await tmdb_fetch(
        f"person/{person_id}/combined_credits",
        {"language": "en-US"},
    )


async def discover(
    media_type: str,
    params: dict[str, Any] | None = None,
) -> dict:
    """TMDB /discover/{movie|tv} with arbitrary filter params."""
    return await tmdb_fetch(f"discover/{media_type}", params)


async def get_trending(
    media_type: str = "all",
    time_window: str = "week",
) -> dict:
    return await tmdb_fetch(f"trending/{media_type}/{time_window}")


async def get_genre_list(media_type: str) -> dict:
    return await tmdb_fetch(f"genre/{media_type}/list")


async def generic_proxy(endpoint: str, params: dict[str, Any] | None = None) -> Any:
    """Generic TMDB proxy — passes through any endpoint.

    Used by the frontend for discovery carousels, genre lists, etc.
    The endpoint is validated to prevent path traversal.
    """
    # Sanitise: strip leading slashes, reject absolute URLs
    clean = endpoint.lstrip("/")
    if clean.startswith("http") or ".." in clean:
        raise ValueError("Invalid TMDB endpoint")
    return await tmdb_fetch(clean, params)
