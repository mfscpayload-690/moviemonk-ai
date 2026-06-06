"""Groq API proxy — keeps API key server-side."""

import logging
from typing import Any, Dict

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger("moviemonk.groq")
router = APIRouter()

# Global counter for round-robin load balancing
_request_count = 0

class GroqRequest(BaseModel):
    model: str
    messages: list[Dict[str, Any]]
    max_tokens: int | None = None
    temperature: float | None = None
    response_format: Dict[str, Any] | None = None
    stream: bool = False

@router.post("/groq")
async def proxy_groq(req: GroqRequest):
    global _request_count
    settings = get_settings()
    
    # Collect available keys for load balancing
    available_keys = settings.groq_keys
    if not available_keys:
        raise HTTPException(status_code=400, detail="No Groq API keys configured")

    # Round-robin selection
    api_key = available_keys[_request_count % len(available_keys)]
    _request_count += 1

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    payload = req.model_dump(exclude_none=True)

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            # If we get an error code, log the body so we can see the reason
            if resp.status_code != 200:
                logger.error(f"Groq API error {resp.status_code}: {resp.text}")
                resp.raise_for_status()

            # Check if we actually got content
            if not resp.content:
                logger.warning("Groq API returned an empty response with 200 OK")
                return {"choices": [], "error": "Empty response from AI provider"}

            try:
                return resp.json()
            except Exception as json_err:
                logger.error(f"Failed to parse Groq JSON: {resp.text} | Error: {json_err}")
                raise HTTPException(status_code=500, detail="Invalid JSON from AI provider")

    except httpx.HTTPStatusError as e:
        # Detail might contain sensitive info, so we log it but return a generic error to frontend if needed
        logger.error(f"Groq HTTP status error: {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail="AI provider error")
    except Exception:
        logger.exception("Groq API proxy error")
        raise HTTPException(status_code=500, detail="Internal server error")
