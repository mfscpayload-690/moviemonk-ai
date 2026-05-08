"""Health check endpoint — reports server status and dependency health."""

from __future__ import annotations

import platform
import time

from fastapi import APIRouter

from app.models.common import HealthDependency, HealthResponse

router = APIRouter()

_start_time = time.monotonic()


@router.get("/health")
async def health_check() -> HealthResponse:
    """Return server health including dependency connectivity."""
    deps: list[HealthDependency] = []

    # Check Redis
    try:
        from app.core.cache import _redis_pool, _redis_available
        if _redis_available and _redis_pool:
            t0 = time.monotonic()
            await _redis_pool.ping()
            deps.append(HealthDependency(
                name="redis",
                status="ok",
                latency_ms=round((time.monotonic() - t0) * 1000, 1),
            ))
        else:
            deps.append(HealthDependency(name="redis", status="unavailable"))
    except Exception:
        deps.append(HealthDependency(name="redis", status="error"))

    # Check TMDB connectivity
    try:
        from app.services.tmdb import get_client, _auth_headers, _auth_params
        client = await get_client()
        t0 = time.monotonic()
        resp = await client.get(
            "https://api.themoviedb.org/3/configuration",
            params=_auth_params(),
            headers=_auth_headers(),
            timeout=5.0,
        )
        latency = round((time.monotonic() - t0) * 1000, 1)
        deps.append(HealthDependency(
            name="tmdb",
            status="ok" if resp.status_code == 200 else "error",
            latency_ms=latency,
        ))
    except Exception:
        deps.append(HealthDependency(name="tmdb", status="error"))

    all_ok = all(d.status == "ok" or d.status == "unavailable" for d in deps)

    return HealthResponse(
        ok=all_ok,
        status="healthy" if all_ok else "degraded",
        uptime_seconds=round(time.monotonic() - _start_time, 1),
        python_version=platform.python_version(),
        dependencies=deps,
    )
