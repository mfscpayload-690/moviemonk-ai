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

            def parse_score(val: str) -> float | None:
                try:
                    if "/" in val:
                        parts = val.split("/")
                        return float(parts[0].strip())
                    if "%" in val:
                        return float(val.replace("%", "").strip()) / 10.0
                    return float(val.strip())
                except (ValueError, IndexError):
                    return None

            # IMDb rating
            imdb_val = data.get("imdbRating")
            if imdb_val and imdb_val != "N/A":
                ratings.append(Rating(
                    source="IMDb",
                    value=f"{imdb_val}/10",
                    score=parse_score(imdb_val)
                ))

            # Other ratings (Rotten Tomatoes, Metacritic, etc.)
            for entry in data.get("Ratings", []):
                src = entry.get("Source", "")
                val = entry.get("Value", "")
                if src and val:
                    # Skip duplicate IMDb if already added
                    if src == "Internet Movie Database" and any(r.source == "IMDb" for r in ratings):
                        continue
                    ratings.append(Rating(
                        source=src,
                        value=val,
                        score=parse_score(val)
                    ))

            return ratings

    except Exception:
        logger.exception("OMDB fetch failed for %s", imdb_id)
        return []
