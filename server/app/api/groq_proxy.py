"""Groq API proxy — keeps API key server-side."""

import logging
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.core.ratelimit import rate_limit

logger = logging.getLogger("moviemonk.groq")
router = APIRouter()

# Global counter for round-robin load balancing
_request_count = 0

class GroqRequest(BaseModel):
    model: str
    messages: list[dict[str, Any]]
    max_tokens: int | None = None
    temperature: float | None = None
    response_format: dict[str, Any] | None = None
    stream: bool = False

@router.post(
    "/groq",
    dependencies=[Depends(rate_limit(times=30, seconds=60, key_prefix="groq"))],
)
async def proxy_groq(req: GroqRequest):
    global _request_count
    settings = get_settings()
    
    # Collect available keys for load balancing
    available_keys = settings.groq_keys
    if not available_keys:
        raise HTTPException(status_code=400, detail="No Groq API keys configured")

    payload = req.model_dump(exclude_none=True)
    num_keys = len(available_keys)
    start_idx = _request_count % num_keys
    _request_count += 1

    last_error_status = 500
    last_error_detail = "AI provider error"

    # Attempt request with failover across available keys if key expires or rate-limits
    async with httpx.AsyncClient() as client:
        for attempt in range(num_keys):
            key_idx = (start_idx + attempt) % num_keys
            api_key = available_keys[key_idx]

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }

            try:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30.0,
                )

                # Check if we should retry with next key (401 Invalid/Expired Key or 429 Rate Limit)
                if resp.status_code in (401, 403, 429) and attempt < num_keys - 1:
                    logger.warning(
                        "Groq API key at index %d returned status %d; attempting failover to next key",
                        key_idx,
                        resp.status_code,
                    )
                    continue

                if resp.status_code != 200:
                    last_error_status = resp.status_code
                    last_error_detail = f"AI provider returned status {resp.status_code}"
                    logger.error(
                        "Groq API error status %d: %s",
                        resp.status_code,
                        resp.text[:300],
                    )
                    raise HTTPException(status_code=resp.status_code, detail=last_error_detail)

                # Check if we actually got content
                if not resp.content:
                    logger.warning("Groq API returned an empty response with 200 OK")
                    return {"choices": [], "error": "Empty response from AI provider"}

                try:
                    return resp.json()
                except Exception as json_err:  # noqa: BLE001
                    logger.error("Failed to parse Groq JSON response: %s", json_err)
                    raise HTTPException(status_code=500, detail="Invalid JSON from AI provider") from json_err

            except HTTPException:
                raise
            except httpx.TimeoutException:
                if attempt < num_keys - 1:
                    logger.warning("Groq request timed out on key index %d; attempting next key", key_idx)
                    continue
                logger.error("Groq API request timed out across all available keys")
                raise HTTPException(status_code=504, detail="AI provider timeout")
            except Exception as exc:
                if attempt < num_keys - 1:
                    logger.warning("Groq API error on key index %d (%s); attempting next key", key_idx, exc)
                    continue
                logger.exception("Groq API proxy error")
                raise HTTPException(status_code=500, detail="Internal server error") from exc

    raise HTTPException(status_code=last_error_status, detail=last_error_detail)
