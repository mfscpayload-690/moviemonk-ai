"""Security utilities — CORS configuration and Supabase JWT verification.

All user-facing endpoints that mutate data (watchlist sharing) require a
valid Supabase JWT.  Read-only public endpoints (search, suggest, details)
do not require authentication.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, Request

try:
    import jwt
    from jwt.exceptions import PyJWTError as JWTError
except ImportError:
    from jose import JWTError, jwt  # type: ignore[no-redef]

from app.config import get_settings

logger = logging.getLogger("moviemonk.security")

# Supabase JWTs are signed with the project JWT secret (HS256).
# Pinning HS256 prevents algorithm-confusion attacks.
_SUPABASE_JWT_ALGORITHMS = ["HS256"]


def _get_jwt_secret() -> str:
    """Return the HMAC secret for verifying Supabase JWTs.

    Prefers ``SUPABASE_JWT_SECRET`` (the project JWT secret from Supabase Dashboard).
    Falls back to ``SUPABASE_SERVICE_ROLE_KEY`` if not explicitly set.
    """
    settings = get_settings()
    if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET.strip():
        return settings.SUPABASE_JWT_SECRET.strip()
    return settings.SUPABASE_SERVICE_ROLE_KEY


async def verify_supabase_jwt(request: Request) -> dict[str, Any]:
    """Extract and verify the Supabase JWT from the Authorization header.

    Returns the decoded token payload on success.
    Raises ``HTTPException(401)`` on failure.
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"code": "missing_token", "message": "Authorization header required"},
        )

    token = auth_header[7:].strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail={"code": "empty_token", "message": "Token is empty"},
        )

    secret = _get_jwt_secret()
    if not secret:
        logger.error("Neither SUPABASE_JWT_SECRET nor SUPABASE_SERVICE_ROLE_KEY configured")
        raise HTTPException(
            status_code=500,
            detail={"code": "auth_misconfigured", "message": "Authentication is not configured"},
        )

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=_SUPABASE_JWT_ALGORITHMS,
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        logger.warning("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail={"code": "invalid_token", "message": "Token is invalid or expired"},
        )
    except Exception as exc:
        logger.warning("Unexpected error during JWT verification: %s", exc)
        raise HTTPException(
            status_code=401,
            detail={"code": "invalid_token", "message": "Token is invalid or expired"},
        )


def get_user_id_from_token(payload: dict[str, Any]) -> str:
    """Extract the Supabase user ID (``sub`` claim) from a decoded JWT."""
    user_id = payload.get("sub")
    if not user_id or not isinstance(user_id, str):
        raise HTTPException(
            status_code=401,
            detail={"code": "invalid_subject", "message": "Token missing user identity"},
        )
    return user_id
