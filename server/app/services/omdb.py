"""OMDB API client for IMDb/Rotten Tomatoes/Metacritic ratings.

Ported from api/omdb.ts — fetches supplementary ratings by IMDB ID.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import get_settings
from app.models.details import Rating

logger = logging.getLogger("moviemonk.omdb")

OMDB_BASE = "https://www.omdbapi.com"


async def fetch_ratings(imdb_id: str) -> list[Rating]:
    """Fetch ratings from OMDB for a given IMDB ID.

    Returns an empty list if the API key is not configured or the
    request fails — never raises.
    """
    settings = get_settings()
    if not settings.OMDB_API_KEY:
        return []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                OMDB_BASE,
                params={"i": imdb_id, "apikey": settings.OMDB_API_KEY},
            )

            if resp.status_code != 200:
                if resp.status_code >= 500:
                    logger.warning("OMDB error: %d", resp.status_code)
                return []

            data: dict[str, Any] = resp.json()
            if data.get("Response") == "False":
                return []

            ratings: list[Rating] = []

            # IMDb rating
            imdb_rating = data.get("imdbRating")
            if imdb_rating and imdb_rating != "N/A":
                ratings.append(Rating(source="IMDb", score=f"{imdb_rating}/10"))

            # Other ratings (Rotten Tomatoes, Metacritic, etc.)
            for entry in data.get("Ratings", []):
                source = entry.get("Source", "")
                value = entry.get("Value", "")
                if source and value:
                    ratings.append(Rating(source=source, score=value))

            return ratings

    except Exception:
        logger.exception("OMDB fetch failed for %s", imdb_id)
        return []
