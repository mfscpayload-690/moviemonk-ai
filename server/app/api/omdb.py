"""Proxy for OMDB API calls."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from app.services import omdb
from app.models.details import Rating

router = APIRouter()

@router.get("/omdb", response_model=list[Rating], tags=["OMDB Proxy"])
async def proxy_omdb(
    i: str = Query(..., description="IMDb ID"),
):
    """Proxy ratings requests to OMDB."""
    ratings = await omdb.fetch_ratings(i)
    if not ratings:
        # Return empty list instead of 404 to avoid breaking UI components
        return []
    return ratings
