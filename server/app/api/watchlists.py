"""Watchlist sharing endpoint — Supabase-backed persistent storage.

Spotify-style public/private visibility.  Only watchlists explicitly
marked as "public" can be shared.  Creating a share requires a valid
Supabase JWT; viewing is public.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Query, Request

from app.config import get_settings
from app.core.errors import api_error
from app.core.security import get_user_id_from_token, verify_supabase_jwt
from app.models.watchlist import SharedWatchlistView, WatchlistShareRequest, WatchlistShareResponse

logger = logging.getLogger("moviemonk.watchlists")
router = APIRouter()


def _get_supabase_client():
    """Lazy-init Supabase client."""
    from supabase import create_client
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def _generate_share_token() -> str:
    """Generate a short, URL-safe share token."""
    return secrets.token_urlsafe(8)


@router.post("/watchlists/share")
async def create_shared_watchlist(
    request: Request,
    body: WatchlistShareRequest,
):
    """Create a shared watchlist link.  Requires authentication and
    the watchlist must be marked as 'public'."""
    # Verify JWT
    token_payload = await verify_supabase_jwt(request)
    user_id = get_user_id_from_token(token_payload)

    # Enforce public visibility
    if body.visibility != "public":
        return api_error(
            403,
            "private_watchlist",
            "Only public watchlists can be shared. "
            "Please mark this watchlist as public first.",
        )

    if not body.folder_name or not body.items:
        return api_error(400, "invalid_payload", "Missing folder name or items")

    supabase = _get_supabase_client()
    if not supabase:
        return api_error(500, "db_unavailable", "Database is not configured")

    share_token = _generate_share_token()

    # Get user display name from Supabase auth
    try:
        user_resp = supabase.auth.admin.get_user_by_id(user_id)
        display_name = (
            user_resp.user.user_metadata.get("full_name")
            or user_resp.user.user_metadata.get("name")
            or user_resp.user.email
            or "Anonymous"
        )
    except Exception:
        display_name = "Anonymous"

    try:
        now = datetime.now(timezone.utc).isoformat()
        row = {
            "share_token": share_token,
            "user_id": user_id,
            "shared_by": display_name,
            "folder_name": body.folder_name,
            "folder_icon": body.folder_icon,
            "items": [item.model_dump() for item in body.items],
            "visibility": "public",
            "created_at": now,
            "updated_at": now,
            "view_count": 0,
        }

        supabase.table("shared_watchlists").insert(row).execute()

        settings = get_settings()
        app_url = settings.ALLOWED_ORIGINS.split(",")[0].strip()

        return WatchlistShareResponse(
            ok=True,
            share_token=share_token,
            share_url=f"{app_url}/watchlists/share?token={share_token}",
            visibility="public",
            item_count=len(body.items),
            created_at=now,
        )
    except Exception:
        logger.exception("Failed to create shared watchlist")
        return api_error(500, "share_failed", "Failed to create shared watchlist")


@router.get("/watchlists/share")
async def get_shared_watchlist(
    token: str = Query(..., description="Share token"),
):
    """Retrieve a shared watchlist by token.  No authentication required."""
    if not token or not token.strip():
        return api_error(400, "missing_token", "Share token is required")

    supabase = _get_supabase_client()
    if not supabase:
        return api_error(500, "db_unavailable", "Database is not configured")

    try:
        result = (
            supabase.table("shared_watchlists")
            .select("*")
            .eq("share_token", token.strip())
            .eq("visibility", "public")
            .single()
            .execute()
        )

        if not result.data:
            return api_error(404, "not_found", "Shared watchlist not found")

        row = result.data

        # Increment view count (fire-and-forget)
        try:
            supabase.table("shared_watchlists").update(
                {"view_count": (row.get("view_count") or 0) + 1}
            ).eq("share_token", token.strip()).execute()
        except Exception:
            pass

        return SharedWatchlistView(
            folder_name=row.get("folder_name", ""),
            folder_icon=row.get("folder_icon"),
            items=row.get("items", []),
            shared_by=row.get("shared_by", ""),
            created_at=row.get("created_at", ""),
            item_count=len(row.get("items", [])),
            visibility="public",
        )
    except Exception:
        logger.exception("Failed to fetch shared watchlist")
        return api_error(500, "fetch_failed", "Failed to retrieve shared watchlist")
