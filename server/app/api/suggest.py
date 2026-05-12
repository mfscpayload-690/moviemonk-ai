"""Suggest endpoint — type-ahead search suggestions.

Ported from api/suggest.ts.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.models.suggest import SuggestResponse, SuggestionItem
from app.services import tmdb
from app.services.person_intent import detect_person_intent
from app.services.suggest_ranking import score_suggestion

router = APIRouter()

_CACHE_TTL = 45  # seconds


@router.get("/suggest")
async def suggest(q: str = Query(..., min_length=1)) -> Any:
    """Return type-ahead suggestions for a query."""
    query = q.strip()
    if len(query) < 1:
        return api_error(400, "query_too_short", "Query too short")

    cache_key = build_cache_key("suggest", {"q": query.lower()})
    cached = await get_cache(cache_key)
    if cached:
        return SuggestResponse(ok=True, query=query, results=cached, cached=True)

    intent = detect_person_intent(query)
    search_query = intent["stripped_query"] if intent["is_person_focused"] else query

    try:
        multi = await tmdb.search_multi(search_query)
        raw_results = multi.get("results", [])[:15]

        suggestions: list[SuggestionItem] = []
        for item in raw_results:
            mt = item.get("media_type", "")
            if mt not in ("movie", "tv", "person"):
                continue

            title = item.get("title") or item.get("name") or ""
            if not title:
                continue

            score = score_suggestion(item, query)

            if mt == "person":
                known_for = [
                    kf.get("title") or kf.get("name", "")
                    for kf in (item.get("known_for") or [])[:3]
                ]
                suggestions.append(SuggestionItem(
                    id=item["id"],
                    title=title,
                    type="person",
                    media_type="person",
                    poster_url=tmdb.build_image_url(item.get("profile_path"), "w185"),
                    confidence=round(score, 3),
                    known_for_department=item.get("known_for_department"),
                    known_for_titles=known_for,
                ))
            else:
                date_field = "release_date" if mt == "movie" else "first_air_date"
                year = (item.get(date_field) or "")[:4] or None
                suggestions.append(SuggestionItem(
                    id=item["id"],
                    title=title,
                    year=year,
                    type="movie" if mt == "movie" else "show",
                    media_type=mt,
                    poster_url=tmdb.build_image_url(item.get("poster_path"), "w185"),
                    confidence=round(score, 3),
                ))

        # Sort by confidence descending
        suggestions.sort(key=lambda s: s.confidence, reverse=True)
        suggestions = suggestions[:10]

        await set_cache(cache_key, [s.model_dump() for s in suggestions], _CACHE_TTL)

        return SuggestResponse(ok=True, query=query, results=suggestions)

    except Exception as exc:
        return api_error(500, "suggest_failed", f"Suggestion search failed: {exc}")
