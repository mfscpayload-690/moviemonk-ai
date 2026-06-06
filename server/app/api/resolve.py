"""Resolve endpoint — entity disambiguation.

Ported from api/resolveEntity.ts.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Query

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.services.entity_resolver import resolve

logger = logging.getLogger("moviemonk.resolve")
router = APIRouter()

_CACHE_TTL = 3600  # 1 hour


@router.get("/resolve")
async def resolve_entity(
    q: str = Query(..., min_length=1),
    type: str | None = Query(None, description="Preferred type: movie | show | person"),
):
    """Resolve a query to the best matching movie, TV show, or person."""
    query = q.strip()

    cache_key = build_cache_key("resolve", {"q": query.lower(), "type": type or "any"})
    cached = await get_cache(cache_key)
    if cached:
        return {**cached, "cached": True}

    try:
        result = await resolve(query, requested_type=type)
        await set_cache(cache_key, result, _CACHE_TTL)
        return {**result, "ok": True, "cached": False}

    except Exception as exc:
        logger.exception("Entity resolution failed")
        return api_error(500, "resolve_failed", "Failed to resolve entity")
