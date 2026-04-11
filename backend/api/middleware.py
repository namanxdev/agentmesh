import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def add_middleware(app: FastAPI) -> None:
    """Attach CORS and global error-handling middleware to the FastAPI app."""
    # CORS: restrict to the frontend origin.
    # In production set ALLOWED_ORIGINS=https://yourdomain.com
    # Auth uses BFF identity headers (x-user-id etc.) injected server-side by
    # the Next.js proxy — never sent by the browser — so allow_credentials is
    # not needed and should not be set to True with a wildcard origin.
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    allow_origins = [o.strip() for o in raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )

    @app.exception_handler(KeyError)
    async def key_error_handler(request: Request, exc: KeyError):
        logger.warning("KeyError at %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=404,
            content={"error": {"code": "NOT_FOUND", "message": "Resource not found"}},
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        logger.warning("ValueError at %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "VALIDATION_ERROR", "message": "Invalid input"}},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception at %s", request.url.path, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
        )
