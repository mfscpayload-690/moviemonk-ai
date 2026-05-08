"""Common response models used across multiple endpoints."""

from __future__ import annotations

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: str | dict | None = None


class ErrorResponse(BaseModel):
    ok: bool = False
    error: ErrorDetail


class HealthDependency(BaseModel):
    name: str
    status: str  # "ok" | "unavailable" | "error"
    latency_ms: float | None = None


class HealthResponse(BaseModel):
    ok: bool = True
    status: str = "healthy"
    version: str = "1.0.0"
    uptime_seconds: float
    python_version: str
    dependencies: list[HealthDependency] = []
