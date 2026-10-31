"""Client observability endpoint — ingests front-end telemetry and error beacons.

Accepts structured error reports, web vitals, and lifecycle events emitted by
services/clientObservability.ts via navigator.sendBeacon or fetch.

Security controls:
- Sliding-window rate limiting per client IP (prevents log flooding / DoS).
- Strict payload size limits (rejects bodies > 64 KB).
- Bounded event schema with character whitelist (prevents log injection / CRLF CWE-117).
- Deep dictionary sanitization with sensitive credential masking (prevents token/secret leaking in logs).
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Literal

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError, field_validator

from app.core.errors import api_error
from app.core.ratelimit import get_client_ip, rate_limit

logger = logging.getLogger("moviemonk.client")
router = APIRouter()

MAX_PAYLOAD_BYTES = 65536  # 64 KB maximum request size
MAX_DATA_KEYS = 50
MAX_NESTING_DEPTH = 5
MAX_SERIALIZED_DATA_BYTES = 32768  # 32 KB

# Sensitive keys and patterns to redact from client payloads
_SENSITIVE_KEY_PATTERN = re.compile(
    r"(?:token|secret|password|passwd|api[_-]?key|auth|bearer|cookie|credential|private[_-]?key|session)",
    re.IGNORECASE,
)
_BEARER_PATTERN = re.compile(r"Bearer\s+[A-Za-z0-9_\-\.=]+", re.IGNORECASE)
_BASIC_PATTERN = re.compile(r"Basic\s+[A-Za-z0-9+/=]+", re.IGNORECASE)
_JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]+")
_KV_SECRET_PATTERN = re.compile(
    r"(?i)((?:token|secret|password|passwd|api[_-]?key|auth\w*|session\w*)[\"']?\s*[=:]\s*[\"']?)[^\s&\"',;]+"
)
_SAFE_EVENT_CHARS = re.compile(r"^[a-zA-Z0-9_\-\.:/]+$")


def _sanitize_value(val: Any, depth: int = 1) -> Any:
    """Recursively scrub potential credentials, truncate massive strings, and bound depth."""
    if depth > MAX_NESTING_DEPTH:
        return "[TRUNCATED_NESTING]"

    if isinstance(val, str):
        val = _BEARER_PATTERN.sub("Bearer [REDACTED]", val)
        val = _BASIC_PATTERN.sub("Basic [REDACTED]", val)
        val = _JWT_PATTERN.sub("[REDACTED_JWT]", val)
        val = _KV_SECRET_PATTERN.sub(r"\1[REDACTED]", val)
        if len(val) > 2048:
            val = val[:2048] + "...[TRUNCATED]"
        return val

    if isinstance(val, dict):
        sanitized_dict: dict[str, Any] = {}
        for k, v in list(val.items())[:MAX_DATA_KEYS]:
            str_key = str(k)
            if _SENSITIVE_KEY_PATTERN.search(str_key):
                sanitized_dict[str_key] = "[REDACTED]"
            else:
                sanitized_dict[str_key] = _sanitize_value(v, depth + 1)
        return sanitized_dict

    if isinstance(val, list):
        return [_sanitize_value(item, depth + 1) for item in val[:MAX_DATA_KEYS]]

    if isinstance(val, (int, float, bool)) or val is None:
        return val

    return str(val)[:256]


class ClientObservabilityEvent(BaseModel):
    """Pydantic model representing an individual client telemetry event."""

    event: str = Field(..., min_length=1, max_length=100)
    level: Literal["info", "warn", "warning", "error", "debug"] = "info"
    ts: str | None = Field(default=None, max_length=50)
    source: str = Field(default="client", max_length=50)
    data: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event")
    @classmethod
    def validate_event_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Event name cannot be empty")
        if not _SAFE_EVENT_CHARS.match(v):
            raise ValueError("Event name contains invalid or unsafe characters")
        return v

    @field_validator("data")
    @classmethod
    def validate_data_payload(cls, v: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(v, dict):
            raise ValueError("data must be a dictionary")

        if len(v) > MAX_DATA_KEYS:
            raise ValueError(f"data object exceeds maximum allowed keys ({MAX_DATA_KEYS})")

        try:
            dumped = json.dumps(v)
        except (TypeError, ValueError) as err:
            raise ValueError("data must be JSON serializable") from err

        if len(dumped) > MAX_SERIALIZED_DATA_BYTES:
            raise ValueError(f"data payload exceeds maximum allowed size ({MAX_SERIALIZED_DATA_BYTES // 1024} KB)")

        return v


@router.get("/observability")
async def observability_status() -> dict[str, Any]:
    """Lightweight health check endpoint for observability route."""
    return {"ok": True, "service": "observability"}


@router.post(
    "/observability",
    dependencies=[Depends(rate_limit(times=120, seconds=60, key_prefix="observability"))],
)
async def ingest_client_observability(request: Request) -> JSONResponse:
    """Ingest client logs, exceptions, and web-vitals beacons.

    Compatible with standard JSON bodies (fetch) and text/plain Blobs (navigator.sendBeacon).
    """
    # 1. Enforce payload size limit via Content-Length header check
    content_length_hdr = request.headers.get("content-length")
    if content_length_hdr:
        try:
            if int(content_length_hdr) > MAX_PAYLOAD_BYTES:
                return api_error(
                    status.HTTP_413_CONTENT_TOO_LARGE,
                    "payload_too_large",
                    f"Observability payload exceeds maximum allowed size ({MAX_PAYLOAD_BYTES // 1024} KB)",
                )
        except ValueError:
            pass

    # 2. Incrementally stream body chunks to enforce hard byte limit before full allocation
    chunks: list[bytes] = []
    total_bytes = 0
    async for chunk in request.stream():
        total_bytes += len(chunk)
        if total_bytes > MAX_PAYLOAD_BYTES:
            return api_error(
                status.HTTP_413_CONTENT_TOO_LARGE,
                "payload_too_large",
                f"Observability payload exceeds maximum allowed size ({MAX_PAYLOAD_BYTES // 1024} KB)",
            )
        chunks.append(chunk)

    raw_body = b"".join(chunks)
    if not raw_body.strip():
        return api_error(
            status.HTTP_400_BAD_REQUEST,
            "empty_payload",
            "Observability payload cannot be empty",
        )

    # 3. Safe JSON parsing
    try:
        parsed_json = json.loads(raw_body.decode("utf-8", errors="replace"))
    except Exception as err:
        return api_error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_json",
            "Could not parse payload as valid JSON",
            details=str(err),
        )

    # 4. Support both a single event object and an array of events (up to 20 items)
    events_to_process: list[dict[str, Any]]
    if isinstance(parsed_json, list):
        if len(parsed_json) > 20:
            return api_error(
                status.HTTP_400_BAD_REQUEST,
                "batch_too_large",
                "Observability batch cannot exceed 20 events",
            )
        events_to_process = [item for item in parsed_json if isinstance(item, dict)]
    elif isinstance(parsed_json, dict):
        events_to_process = [parsed_json]
    else:
        return api_error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_payload_format",
            "Payload must be a JSON object or array of objects",
        )

    client_ip = get_client_ip(request)
    ingested_count = 0

    for raw_event in events_to_process:
        try:
            validated = ClientObservabilityEvent.model_validate(raw_event)
        except ValidationError as err:
            error_summary = [
                {"loc": ".".join(str(p) for p in e["loc"]), "type": e["type"]}
                for e in err.errors(include_input=False, include_url=False, include_context=False)
            ]
            logger.warning(
                "Invalid client observability event skipped: %s",
                error_summary,
                extra={"client_ip": client_ip},
            )
            continue
        except Exception as err:
            logger.warning(
                "Unexpected error validating observability event: %s",
                type(err).__name__,
                extra={"client_ip": client_ip},
            )
            continue

        sanitized_data = _sanitize_value(validated.data)
        log_payload = {
            "client_ip": client_ip,
            "event": validated.event,
            "source": validated.source,
            "ts": validated.ts,
            "data": sanitized_data,
        }

        # Log at appropriate level
        if validated.level == "error":
            logger.error("client_observability_event: %s", validated.event, extra=log_payload)
        elif validated.level in ("warn", "warning"):
            logger.warning("client_observability_event: %s", validated.event, extra=log_payload)
        else:
            logger.info("client_observability_event: %s", validated.event, extra=log_payload)

        ingested_count += 1

    return JSONResponse(status_code=status.HTTP_200_OK, content={"ok": True, "ingested": ingested_count})
