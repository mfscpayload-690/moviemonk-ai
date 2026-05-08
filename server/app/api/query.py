"""Query endpoint — resolves a query and generates a summary (Brief Me)."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.cache import build_cache_key, get_cache, set_cache
from app.services import tmdb, ai_enrichment
from app.services.entity_resolver import resolve

logger = logging.getLogger("moviemonk.query")
router = APIRouter()

class QueryRequest(BaseModel):
    q: str
    mode: str = "detailed"

@router.post("/query")
async def handle_query(req: QueryRequest):
    query = req.q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Missing query")

    cache_key = build_cache_key("query_endpoint", {"q": query.lower(), "mode": req.mode})
    cached = await get_cache(cache_key)
    if cached:
        return {"ok": True, "cached": True, **cached}

    try:
        resolved = await resolve(query)
        if not resolved or not resolved.id:
            raise HTTPException(status_code=404, detail="Entity not found")

        summary = {"summary_short": "", "summary_long": ""}
        data: Any = {}

        if resolved.type == "person":
            person_data = await tmdb.get_person(resolved.id)
            if not person_data:
                raise HTTPException(status_code=404, detail="Person not found")
            
            data = person_data
            bio = person_data.get("biography", "")
            if req.mode == "short":
                summary["summary_short"] = bio[:277] + "…" if len(bio) > 280 else bio
                summary["summary_long"] = bio
            else:
                enriched = await ai_enrichment.generate_creative_fields(
                    title=person_data.get("name", ""),
                    overview=bio[:1200]
                )
                summary["summary_short"] = enriched.get("summary_short", "")
                summary["summary_long"] = bio
        else:
            # Movie or TV
            media_type = resolved.media_type or "movie"
            movie_data = await tmdb.get_details(media_type, resolved.id)
            if not movie_data:
                raise HTTPException(status_code=404, detail="Title not found")
                
            data = movie_data
            if req.mode == "short":
                summary["summary_short"] = movie_data.get("overview", "")
                summary["summary_long"] = movie_data.get("overview", "")
            elif req.mode == "full_plot":
                genres = [g.get("name") for g in movie_data.get("genres", [])]
                year = movie_data.get("release_date") or movie_data.get("first_air_date") or ""
                year = year[:4]
                enriched = await ai_enrichment.generate_creative_fields(
                    title=movie_data.get("title") or movie_data.get("name") or "",
                    year=year,
                    genres=genres,
                    overview=movie_data.get("overview", "")
                )
                summary["summary_short"] = enriched.get("summary_short", "")
                summary["summary_long"] = enriched.get("summary_long_spoilers", "")
            else:
                genres = [g.get("name") for g in movie_data.get("genres", [])]
                year = movie_data.get("release_date") or movie_data.get("first_air_date") or ""
                year = year[:4]
                enriched = await ai_enrichment.generate_creative_fields(
                    title=movie_data.get("title") or movie_data.get("name") or "",
                    year=year,
                    genres=genres,
                    overview=movie_data.get("overview", "")
                )
                summary["summary_short"] = enriched.get("summary_short", "")
                summary["summary_long"] = enriched.get("summary_medium", "")

        result = {
            "type": resolved.type,
            "data": data,
            "summary": summary,
        }
        await set_cache(cache_key, result, 3600)
        return {"ok": True, "cached": False, **result}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Query endpoint error")
        raise HTTPException(status_code=500, detail=str(e))
