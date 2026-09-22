"""Structured observability — request tracing and JSON logging.

Every request receives a unique ``X-Request-Id`` header.  All log
output is JSON-structured for easy parsing in HuggingFace Spaces logs.
"""

from __future__ import annotations

import logging
import time
import urllib.parse
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

# Context variable to propagate request_id across async boundaries
_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

logger = logging.getLogger("moviemonk.http")

SENSITIVE_PARAM_NAMES = frozenset({
    "token", "key", "secret", "code", "api_key", "apikey",
    "password", "access_token", "refresh_token", "auth",
})


def _sanitize_query(query: str) -> str:
    """Mask potentially sensitive query parameter values in logs."""
    if not query:
        return ""
    try:
        parsed = urllib.parse.parse_qsl(query, keep_blank_values=True)
        sanitized: list[tuple[str, str]] = []
        for k, v in parsed:
            k_lower = k.lower()
            if k_lower in SENSITIVE_PARAM_NAMES or any(s in k_lower for s in ("secret", "token", "password", "key")):
                sanitized.append((k, "[REDACTED]"))
            else:
                sanitized.append((k, v))
        return urllib.parse.urlencode(sanitized)
    except Exception:
        return "[REDACTED_QUERY]"


def get_request_id() -> str:
    """Retrieve the current request ID from context."""
    return _request_id_ctx.get("")


def _generate_request_id() -> str:
    return f"req_{uuid.uuid4().hex[:12]}"


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns a request ID and logs request lifecycle."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Accept client-provided request ID or generate one
        incoming_id = request.headers.get("x-request-id", "").strip()
        request_id = incoming_id if incoming_id else _generate_request_id()
        _request_id_ctx.set(request_id)

        start = time.monotonic()

        logger.info(
            "request_start",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query": _sanitize_query(request.url.query),
                "has_origin": bool(request.headers.get("origin")),
            },
        )

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.monotonic() - start) * 1000, 1)
            logger.exception(
                "request_error",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            raise

        duration_ms = round((time.monotonic() - start) * 1000, 1)

        # Attach request ID to response
        response.headers["X-Request-Id"] = request_id

        log_level = (
            logging.ERROR if response.status_code >= 500
            else logging.WARNING if response.status_code >= 400
            else logging.INFO
        )

        logger.log(
            log_level,
            "request_end",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach industry-standard security headers to every response."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Allow Hugging Face to embed the API status page
        response.headers["Content-Security-Policy"] = "frame-ancestors 'self' https://*.huggingface.co https://huggingface.co;"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
        return response


def configure_logging() -> None:
    """Set up structured JSON logging for the application."""
    from pythonjsonlogger.json import JsonFormatter

    formatter = JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        rename_fields={"asctime": "timestamp", "levelname": "level"},
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove default handlers and add JSON handler
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    root_logger.addHandler(stream_handler)

    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
