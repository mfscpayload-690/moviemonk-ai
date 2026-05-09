"""Entity resolver — person vs movie/show disambiguation.

Ported from api/resolveEntity.ts.  Uses TMDB search + Levenshtein
similarity + person-intent detection to disambiguate queries.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services import tmdb
from app.utils.text import levenshtein, normalise_title, similarity_ratio

logger = logging.getLogger("moviemonk.resolver")


def _score_person(person: dict, query_norm: str) -> float:
    """Score a TMDB person result against the normalised query."""
    name_norm = normalise_title(person.get("name", ""))
    sim = similarity_ratio(query_norm, name_norm)
    pop = min(person.get("popularity", 0) / 100, 1.0)
    return sim * 0.7 + pop * 0.3


def _score_title(item: dict, query_norm: str) -> float:
    """Score a TMDB movie/tv result against the normalised query."""
    title = item.get("title") or item.get("name") or ""
    title_norm = normalise_title(title)
    sim = similarity_ratio(query_norm, title_norm)
    pop = min(item.get("popularity", 0) / 200, 1.0)
    vote = min(item.get("vote_average", 0) / 10, 1.0)
    return sim * 0.5 + pop * 0.3 + vote * 0.2


async def resolve(
    query: str,
    requested_type: str | None = None,
) -> dict[str, Any]:
    """Resolve a query to the best matching entity.

    Returns::

        {
            "type": "movie" | "tv" | "person",
            "id": int,
            "title": str,
            "confidence": float,
            "candidates": [...],
        }
    """
    query_norm = normalise_title(query)

    # Parallel search across movie, tv, person
    import asyncio
    movie_task = tmdb.search_movie(query)
    tv_task = tmdb.search_tv(query)
    person_task = tmdb.search_person(query)

    movie_res, tv_res, person_res = await asyncio.gather(
        movie_task, tv_task, person_task, return_exceptions=True,
    )

    candidates: list[dict[str, Any]] = []

    # Process movie results
    if isinstance(movie_res, dict):
        for item in (movie_res.get("results") or [])[:5]:
            score = _score_title(item, query_norm)
            candidates.append({
                "type": "movie",
                "id": item["id"],
                "title": item.get("title", ""),
                "year": (item.get("release_date") or "")[:4],
                "poster_url": tmdb.build_image_url(item.get("poster_path"), "w342"),
                "score": score,
                "popularity": item.get("popularity", 0),
            })

    # Process TV results
    if isinstance(tv_res, dict):
        for item in (tv_res.get("results") or [])[:5]:
            score = _score_title(item, query_norm)
            candidates.append({
                "type": "tv",
                "id": item["id"],
                "title": item.get("name", ""),
                "year": (item.get("first_air_date") or "")[:4],
                "poster_url": tmdb.build_image_url(item.get("poster_path"), "w342"),
                "score": score,
                "popularity": item.get("popularity", 0),
            })

    # Process person results
    if isinstance(person_res, dict):
        for item in (person_res.get("results") or [])[:5]:
            score = _score_person(item, query_norm)
            known_for = [
                kf.get("title") or kf.get("name", "")
                for kf in (item.get("known_for") or [])[:3]
            ]
            candidates.append({
                "type": "person",
                "id": item["id"],
                "title": item.get("name", ""),
                "known_for_department": item.get("known_for_department"),
                "known_for_titles": known_for,
                "profile_url": tmdb.build_image_url(item.get("profile_path"), "w185"),
                "score": score,
                "popularity": item.get("popularity", 0),
            })

    # Filter by requested type if specified
    if requested_type:
        type_map = {"movie": "movie", "show": "tv", "tv": "tv", "person": "person"}
        target = type_map.get(requested_type, requested_type)
        typed = [c for c in candidates if c["type"] == target]
        if typed:
            candidates = typed

    # Sort by score descending
    candidates.sort(key=lambda c: c["score"], reverse=True)

    if not candidates:
        return {
            "type": None,
            "id": None,
            "title": query,
            "confidence": 0.0,
            "candidates": [],
        }

    best = candidates[0]
    return {
        "type": best["type"],
        "id": best["id"],
        "title": best["title"],
        "confidence": round(best["score"], 3),
        "candidates": candidates[:10],
    }
