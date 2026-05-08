"""MovieMonk Backend — FastAPI application entry point.

Configures CORS, security headers, observability middleware,
and lifespan events for Redis and TMDB client management.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router as api_router
from app.config import get_settings
from app.core.cache import close_redis, init_redis
from app.core.observability import (
    ObservabilityMiddleware,
    SecurityHeadersMiddleware,
    configure_logging,
)

logger = logging.getLogger("moviemonk.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle — startup and shutdown events."""
    configure_logging()
    settings = get_settings()

    # Startup
    logger.info("MovieMonk Backend starting up")
    await init_redis(settings.REDIS_URL)
    logger.info("Startup complete — ready to serve requests")

    yield

    # Shutdown
    logger.info("MovieMonk Backend shutting down")
    await close_redis()

    from app.services.tmdb import close_client
    await close_client()

    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """Factory function for creating the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title="MovieMonk API",
        description="Dedicated backend for MovieMonk — movie/TV discovery and AI enrichment",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Request-Id",
            "X-Notification-Secret",
        ],
    )

    # Custom middleware (order matters — outermost runs first)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(ObservabilityMiddleware)

    # Mount API routes
    application.include_router(api_router)

    # Root redirect to docs
    @application.get("/", include_in_schema=False)
    async def root():
        return {
            "name": "MovieMonk API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/api/docs",
        }

    return application


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
