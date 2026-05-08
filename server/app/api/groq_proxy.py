"""Groq API proxy — keeps API key server-side."""

import logging
from typing import Any, Dict

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger("moviemonk.groq")
router = APIRouter()

class GroqRequest(BaseModel):
    model: str
    messages: list[Dict[str, Any]]
    max_tokens: int | None = None
    temperature: float | None = None
    response_format: Dict[str, Any] | None = None
    stream: bool = False

@router.post("/groq")
async def proxy_groq(req: GroqRequest):
    settings = get_settings()
    api_key = settings.GROQ_API_KEY
    if not api_key:
        api_key = getattr(settings, "VIBE_SEARCH_API_KEY", None)

    if not api_key:
        raise HTTPException(status_code=400, detail="Groq API key not configured")

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
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Groq API HTTP error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Groq API error: {e.response.text}")
    except Exception as e:
        logger.exception("Groq API proxy error")
        raise HTTPException(status_code=500, detail=str(e))
