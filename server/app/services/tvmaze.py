"""TVMaze API client for TV show episode metadata.

Fetches episodes, air dates, runtimes, ratings, and summaries.
Does not require an API key.
"""

from __future__ import annotations

import html
import logging
import re
from typing import Any

import httpx

from app.models.details import TVShowEpisode

logger = logging.getLogger("moviemonk.tvmaze")

TVMAZE_BASE = "https://api.tvmaze.com"
_client: httpx.AsyncClient | None = None


async def get_client() -> httpx.AsyncClient:
    """Return the singleton httpx client (lazy init)."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=3.0),
            follow_redirects=True,
        )
    return _client


async def close_client() -> None:
    """Close the httpx client — called at app shutdown."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def strip_html(html_str: str | None) -> str | None:
    """Strip HTML tags from a string and decode HTML entities."""
    if not html_str:
        return html_str
    # Simple regex to strip HTML tags
    clean = re.sub(r"<[^>]+>", "", html_str)
    return html.unescape(clean).strip()


def parse_episode(data: dict[str, Any]) -> TVShowEpisode:
    """Convert a TVMaze episode dict into a TVShowEpisode model."""
    rating_val = None
    rating_data = data.get("rating")
    if isinstance(rating_data, dict):
        try:
            rating_val = float(rating_data.get("average") or 0.0)
            if rating_val <= 0:
                rating_val = None
        except (ValueError, TypeError):
            rating_val = None

    image_val = None
    image_data = data.get("image")
    if isinstance(image_data, dict):
        image_val = image_data.get("medium") or image_data.get("original")

    summary_val = strip_html(data.get("summary"))

    return TVShowEpisode(
        id=data.get("id") or 0,
        season=data.get("season") or 0,
        episode=data.get("number") or 0,
        name=data.get("name") or "",
        airdate=data.get("airdate") or "",
        runtime=data.get("runtime"),
        rating=rating_val,
        image=image_val,
        summary=summary_val,
    )


async def lookup_by_imdb(imdb_id: str) -> dict[str, Any] | None:
    """Lookup a show on TVMaze by IMDb ID."""
    client = await get_client()
    url = f"{TVMAZE_BASE}/lookup/shows"
    try:
        resp = await client.get(url, params={"imdb": imdb_id})
        if resp.status_code == 200:
            return resp.json()
        logger.warning("TVMaze IMDb lookup failed for %s: %d", imdb_id, resp.status_code)
    except Exception:
        logger.exception("TVMaze IMDb lookup exception for %s", imdb_id)
    return None


async def search_by_title(title: str) -> dict[str, Any] | None:
    """Singlesearch a show on TVMaze by title."""
    client = await get_client()
    url = f"{TVMAZE_BASE}/singlesearch/shows"
    try:
        resp = await client.get(url, params={"q": title})
        if resp.status_code == 200:
            return resp.json()
        logger.warning("TVMaze singlesearch failed for %s: %d", title, resp.status_code)
    except Exception:
        logger.exception("TVMaze singlesearch exception for %s", title)
    return None


async def get_episodes(tvmaze_id: int) -> list[TVShowEpisode]:
    """Fetch all episodes for a show from TVMaze by its TVMaze ID."""
    client = await get_client()
    url = f"{TVMAZE_BASE}/shows/{tvmaze_id}/episodes"
    try:
        resp = await client.get(url, params={"specials": "1"})
        if resp.status_code == 200:
            raw_episodes = resp.json()
            if isinstance(raw_episodes, list):
                return [parse_episode(ep) for ep in raw_episodes]
        logger.warning("TVMaze episodes failed for %d: %d", tvmaze_id, resp.status_code)
    except Exception:
        logger.exception("TVMaze episodes exception for %d", tvmaze_id)
    return []
