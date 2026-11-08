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
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sentry_sdk.types import Event, Hint

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


def sentry_before_send(event: Event, hint: Hint) -> Event | None:
    """Scrub sensitive credentials, auth headers, and tokens from Sentry events."""
    # 1. Scrub request headers
    request_info: Any = event.get("request")
    if isinstance(request_info, dict):
        headers = request_info.get("headers")
        if isinstance(headers, dict):
            for header_name in list(headers.keys()):
                h_lower = str(header_name).lower()
                if h_lower in ("authorization", "x-notification-secret", "cookie", "set-cookie", "x-api-key"):
                    headers[header_name] = "[REDACTED]"

        # Sanitize query string if present
        query_string = request_info.get("query_string")
        if isinstance(query_string, str) and query_string:
            request_info["query_string"] = _sanitize_query(query_string)

    # 2. Scrub user info (IP, email) unless explicitly anonymized id
    if "user" in event and isinstance(event["user"], dict):
        user = event["user"]
        user.pop("ip_address", None)
        user.pop("email", None)
        user.pop("username", None)

    # 3. Attach current request ID tag if missing
    req_id = get_request_id()
    if req_id:
        tags = event.setdefault("tags", {})
        if isinstance(tags, dict):
            tags["request_id"] = req_id

    # 4. Filter transient non-fatal Redis cache connection drops
    if "exception" in event and isinstance(event["exception"], dict):
        exc_values = event["exception"].get("values", [])
        for exc in exc_values:
            if exc.get("type") in ("ConnectionResetError", "ConnectionError"):
                val_str = str(exc.get("value", "")).lower()
                if "connection lost" in val_str or "reset by peer" in val_str:
                    frames = exc.get("stacktrace", {}).get("frames", [])
                    if any("redis" in str(f.get("filename", "")).lower() for f in frames):
                        return None

    return event


def sentry_traces_sampler(sampling_context: dict) -> float:
    """Dynamically determine trace sampling rate based on operation and endpoint."""
    asgi_scope = sampling_context.get("asgi_scope", {})
    path = asgi_scope.get("path", "")

    # Never sample healthchecks to avoid quota noise
    if path in ("/api/health", "/health", "/"):
        return 0.0

    # Critical AI and search paths get higher attention
    if path.startswith(("/api/vibe", "/api/query")):
        return 0.5

    # Default baseline sampling rate
    return 0.15


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns a request ID and logs request lifecycle."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Accept client-provided request ID or generate one
        incoming_id = request.headers.get("x-request-id", "").strip()
        request_id = incoming_id if incoming_id else _generate_request_id()
        _request_id_ctx.set(request_id)

        try:
            import sentry_sdk
            sentry_sdk.set_tag("request_id", request_id)
        except ImportError:
            pass

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
        if "Cache-Control" not in response.headers:
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
