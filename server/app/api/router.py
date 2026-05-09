"""Central API router — aggregates all endpoint modules."""

from __future__ import annotations

from fastapi import APIRouter

from app.api import details, health, person, resolve, search, suggest, tmdb_proxy, vibe, watchlists, groq_proxy, query, omdb

router = APIRouter(prefix="/api")

router.include_router(health.router, tags=["Health"])
router.include_router(search.router, tags=["Search"])
router.include_router(suggest.router, tags=["Suggest"])
router.include_router(resolve.router, tags=["Resolve"])
router.include_router(details.router, tags=["Details"])
router.include_router(person.router, tags=["Person"])
router.include_router(vibe.router, tags=["Vibe"])
router.include_router(tmdb_proxy.router, tags=["TMDB Proxy"])
router.include_router(watchlists.router, tags=["Watchlists"])
router.include_router(groq_proxy.router, tags=["Groq Proxy"])
router.include_router(query.router, tags=["Query"])
router.include_router(omdb.router, tags=["OMDB Proxy"])
