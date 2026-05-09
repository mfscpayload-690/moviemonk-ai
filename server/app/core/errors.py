"""Standardised HTTP error responses.

Provides a consistent error envelope matching the TypeScript codebase's
``sendApiError`` pattern so the frontend can parse errors uniformly.
"""

from __future__ import annotations

from fastapi.responses import JSONResponse


def api_error(
    status_code: int,
    code: str,
    message: str,
    details: dict | str | None = None,
) -> JSONResponse:
    """Return a JSON error response with a consistent envelope.

    Shape::

        {
            "ok": false,
            "error": {
                "code": "missing_query",
                "message": "Query parameter is required",
                "details": ...   // optional
            }
        }
    """
    body: dict = {
        "ok": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if details is not None:
        body["error"]["details"] = details

    return JSONResponse(status_code=status_code, content=body)
