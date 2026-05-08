"""Security utilities — CORS configuration and Supabase JWT verification.

All user-facing endpoints that mutate data (watchlist sharing) require a
valid Supabase JWT.  Read-only public endpoints (search, suggest, details)
do not require authentication.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, Request
from jose import JWTError, jwt

from app.config import get_settings

logger = logging.getLogger("moviemonk.security")

# Supabase JWTs are signed with the project JWT secret.  We verify
# using the service-role key's embedded secret.  The anon key is
# only used client-side and is NOT trusted here.
_SUPABASE_JWT_ALGORITHMS = ["HS256"]


def _get_jwt_secret() -> str:
    """Derive the JWT secret from the Supabase service-role key.

    Supabase uses the same JWT secret for signing both anon and
    service-role tokens.  The secret is the ``SUPABASE_SERVICE_ROLE_KEY``
    itself decoded — but in practice Supabase tokens can be verified
    with the service-role key as the HMAC secret.
    """
    settings = get_settings()
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
        logger.error("SUPABASE_SERVICE_ROLE_KEY not configured — auth disabled")
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


def get_user_id_from_token(payload: dict[str, Any]) -> str:
    """Extract the Supabase user ID (``sub`` claim) from a decoded JWT."""
    user_id = payload.get("sub")
    if not user_id or not isinstance(user_id, str):
        raise HTTPException(
            status_code=401,
            detail={"code": "invalid_subject", "message": "Token missing user identity"},
        )
    return user_id
