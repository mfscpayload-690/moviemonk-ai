"""Vibe endpoint — NLP-based vibe query parsing.

Ported from api/vibe.ts.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.services.vibe_parser import local_vibe_fallback, parse_vibe_query

router = APIRouter()

_CACHE_TTL = 3600  # 1 hour


@router.get("/vibe")
async def vibe_parse(q: str = Query(..., min_length=2)):
    """Parse a natural language movie query into structured constraints."""
    query = q.strip()

    cache_key = build_cache_key("vibe", {"q": query.lower()})
    cached = await get_cache(cache_key)
    if cached:
        return {"ok": True, "cached": True, **cached}

    # Try LLM parsing first, fall back to local
    result = await parse_vibe_query(query)
    if not result:
        result = local_vibe_fallback(query)

    await set_cache(cache_key, result, _CACHE_TTL)
    return {"ok": True, "cached": False, **result}
