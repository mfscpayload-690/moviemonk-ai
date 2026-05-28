"""Search endpoint — vibe-aware TMDB search with filters.

Ported from api/search.ts (969 lines) — the most complex endpoint.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, Query

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.models.search import (
    AppliedFilters, PersonSearchCandidate, SearchPageResponse, SearchRequest, SearchResult, VibeInfo,
)
from app.services import tmdb
from app.services.person_intent import detect_person_intent
from app.services.vibe_parser import parse_vibe_query

logger = logging.getLogger("moviemonk.search")
router = APIRouter()

_CACHE_TTL = 6 * 3600  # 6 hours

# TMDB genre ID to name mapping (loaded lazily)
_genre_map: dict[int, str] = {}


async def _ensure_genre_map() -> None:
    global _genre_map
    if _genre_map:
        return
    try:
        movie_genres = await tmdb.get_genre_list("movie")
        tv_genres = await tmdb.get_genre_list("tv")
        for g in movie_genres.get("genres", []) + tv_genres.get("genres", []):
            _genre_map[g["id"]] = g["name"]
    except Exception:
        logger.warning("Failed to load genre map")


def _normalise_result(item: dict, media_type: str | None = None) -> SearchResult | None:
    mt = media_type or item.get("media_type", "movie")
    if mt not in ("movie", "tv"):
        return None

    title = item.get("title") or item.get("name") or ""
    if not title or not item.get("id"):
        return None

    date_field = "release_date" if mt == "movie" else "first_air_date"
    year = (item.get(date_field) or "")[:4] or None

    genre_ids = item.get("genre_ids", [])
    genres = [_genre_map.get(gid, "") for gid in genre_ids if gid in _genre_map]

    return SearchResult(
        id=item["id"],
        title=title,
        year=year,
        type="movie" if mt == "movie" else "show",
        media_type=mt,
        poster_url=tmdb.build_image_url(item.get("poster_path"), "w342"),
        backdrop_url=tmdb.build_image_url(item.get("backdrop_path"), "w780"),
        overview=item.get("overview", ""),
        rating=item.get("vote_average"),
        genre_ids=genre_ids,
        genres=genres,
        confidence=0.0,
        popularity=item.get("popularity"),
        original_language=item.get("original_language"),
    )


@router.api_route("/search", methods=["GET", "POST"])
async def search(
    q: str | None = Query(None, min_length=1),
    page: int = Query(1, ge=1, le=500),
    type: str = Query("all", description="all | movie | tv"),
    genres: str | None = Query(None, description="Comma-separated genre IDs"),
    yearMin: int | None = Query(None, alias="yearMin"),
    yearMax: int | None = Query(None, alias="yearMax"),
    ratingMin: float | None = Query(None, alias="ratingMin"),
    sortBy: str = Query("popularity.desc", alias="sortBy"),
    body: SearchRequest | None = None,
) -> Any:
    # Use body if provided (POST), otherwise use query params
    if body:
        q = body.q
        page = body.page
        type = body.type
        genres = body.genres
        yearMin = body.yearMin
        yearMax = body.yearMax
        ratingMin = body.ratingMin
        sortBy = body.sortBy

    if not q or len(q.strip()) < 1:
        return api_error(400, "query_too_short", "Query too short")

    query = q.strip()

    await _ensure_genre_map()

    cache_key = build_cache_key("search_v2", {
        "q": query.lower(), "page": page, "type": type,
        "genres": genres or "", "yearMin": yearMin or "",
        "yearMax": yearMax or "", "ratingMin": ratingMin or "",
        "sortBy": sortBy,
    })
    cached = await get_cache(cache_key)
    if cached:
        return SearchPageResponse(**cached)

    try:
        # Detect person intent
        person_intent = detect_person_intent(query)
        search_query = person_intent["stripped_query"]

        # Try vibe parsing for discovery-style queries
        vibe_result = None
        vibe_info = None
        if len(query.split()) >= 3:
            vibe_result = await parse_vibe_query(query)
            if vibe_result and vibe_result.get("confidence", 0) > 0.5:
                vibe_info = VibeInfo(
                    intent_type=vibe_result.get("intent_type", "vibe_discovery"),
                    summary=", ".join(vibe_result.get("notes_for_retrieval", [])),
                    signals=vibe_result.get("soft_preferences", {}).get("tone_tags", []),
                )

        # Build TMDB search/discover in parallel
        tasks: list[Any] = []
        movie_idx, tv_idx, person_idx = -1, -1, -1

        if person_intent["is_person_focused"] or type == "all":
            person_idx = len(tasks)
            tasks.append(tmdb.search_person(search_query))

        if type == "movie" or type == "all":
            movie_idx = len(tasks)
            tasks.append(tmdb.search_movie(search_query, page=page))

        if type == "tv" or type == "all":
            tv_idx = len(tasks)
            tasks.append(tmdb.search_tv(search_query, page=page))

        res_list = await asyncio.gather(*tasks, return_exceptions=True)

        people: list[PersonSearchCandidate] = []
        results: list[SearchResult] = []
        total_results = 0
        total_pages = 1

        if person_idx != -1:
            person_res = res_list[person_idx]
            if isinstance(person_res, dict):
                for p in (person_res.get("results") or [])[:5]:
                    known_for = [
                        kf.get("title") or kf.get("name", "")
                        for kf in (p.get("known_for") or [])[:3]
                    ]
                    people.append(PersonSearchCandidate(
                        id=p["id"],
                        name=p.get("name", ""),
                        score=p.get("popularity", 0),
                        confidence=min(p.get("popularity", 0) / 50, 1.0),
                        popularity=p.get("popularity"),
                        known_for_department=p.get("known_for_department"),
                        known_for_titles=known_for,
                        profile_url=tmdb.build_image_url(p.get("profile_path"), "w185"),
                    ))

        if movie_idx != -1:
            movie_res = res_list[movie_idx]
            if isinstance(movie_res, dict):
                total_results += movie_res.get("total_results", 0)
                total_pages = max(total_pages, movie_res.get("total_pages", 1))
                for item in movie_res.get("results", []):
                    r = _normalise_result(item, "movie")
                    if r:
                        results.append(r)

        if tv_idx != -1:
            tv_res = res_list[tv_idx]
            if isinstance(tv_res, dict):
                total_results += tv_res.get("total_results", 0)
                total_pages = max(total_pages, tv_res.get("total_pages", 1))
                for item in tv_res.get("results", []):
                    r = _normalise_result(item, "tv")
                    if r:
                        results.append(r)

        # Apply filters
        if genres:
            genre_ids = [int(g) for g in genres.split(",") if g.strip().isdigit()]
            if genre_ids:
                genre_set = set(genre_ids)
                results = [r for r in results if genre_set.intersection(r.genre_ids)]

        if yearMin:
            results = [r for r in results if r.year and int(r.year) >= yearMin]
        if yearMax:
            results = [r for r in results if r.year and int(r.year) <= yearMax]
        if ratingMin:
            results = [r for r in results if r.rating and r.rating >= ratingMin]

        # Sort
        if sortBy == "vote_average.desc":
            results.sort(key=lambda r: r.rating or 0, reverse=True)
        elif sortBy == "release_date.desc":
            results.sort(key=lambda r: r.year or "", reverse=True)
        else:
            results.sort(key=lambda r: r.popularity or 0, reverse=True)

        hero = results[0] if results else None
        search_mode = "vibe" if vibe_info else "keyword"

        response = SearchPageResponse(
            ok=True,
            query=query,
            page=page,
            total_pages=min(total_pages, 500),
            total_results=total_results,
            search_mode=search_mode,
            hero=hero,
            results=results[:20],
            people=people,
            vibe=vibe_info,
            applied_filters=AppliedFilters(
                type=type,
                sort_by=sortBy,
                genres=[int(g) for g in (genres or "").split(",") if g.strip().isdigit()],
                year_min=yearMin,
                year_max=yearMax,
                rating_min=ratingMin,
            ),
        )

        await set_cache(cache_key, response.model_dump(), _CACHE_TTL)
        return response

    except Exception as exc:
        logger.exception("Search failed for q=%s", query)
        return api_error(500, "search_failed", f"Search failed: {exc}")
