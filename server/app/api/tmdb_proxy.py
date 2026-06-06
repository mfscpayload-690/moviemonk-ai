"""TMDB generic proxy — keeps API key server-side.

Ported from api/tmdb.ts.  The frontend sends ``?endpoint=...``
and this handler forwards the request to TMDB with auth.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Query, Request

from app.core.errors import api_error
from app.services import tmdb

logger = logging.getLogger("moviemonk.tmdb_proxy")
router = APIRouter()


@router.get("/tmdb")
async def tmdb_proxy(
    request: Request,
    endpoint: str = Query(..., description="TMDB API endpoint path"),
):
    """Generic TMDB proxy — the frontend uses this for discovery carousels,
    genre lists, and any direct TMDB endpoint."""
    if not endpoint or not endpoint.strip():
        return api_error(400, "missing_endpoint", "Endpoint parameter is required")

    # Collect all other query params (exclude 'endpoint')
    extra_params = {
        k: v
        for k, v in request.query_params.items()
        if k != "endpoint"
    }

    try:
        data = await tmdb.generic_proxy(endpoint, extra_params or None)
        return data
    except ValueError as exc:
        logger.warning("Invalid TMDB endpoint requested: %s", exc)
        return api_error(400, "invalid_endpoint", "Invalid TMDB endpoint")
    except Exception as exc:
        logger.exception("TMDB proxy request failed")
        return api_error(502, "tmdb_error", "Failed to retrieve data from movie database service")
