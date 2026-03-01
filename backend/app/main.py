from __future__ import annotations

import time
import uuid
from typing import Any, cast

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from app.api.v1 import auth, color, health
from app.core.config import get_settings
from app.core.cors import build_cors_options
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(CORSMiddleware, **cast(dict[str, Any], build_cors_options(settings)))


@app.middleware("http")
async def request_middleware(request: Request, call_next: Any) -> JSONResponse | Any:
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    started_at = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:  # noqa: BLE001
        logger.exception(
            "request.failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Internal server error.",
                "request_id": request_id,
            },
        )

    latency_ms = int((time.perf_counter() - started_at) * 1000)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request.completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
        },
    )
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    request_id = getattr(request.state, "request_id", None)
    if isinstance(detail, dict):
        payload = {
            "code": detail.get("code", "HTTP_ERROR"),
            "message": detail.get("message", "Request failed."),
            "hint": detail.get("hint"),
            "details": detail.get("details"),
            "request_id": request_id,
        }
    else:
        payload = {
            "code": "HTTP_ERROR",
            "message": str(detail),
            "request_id": request_id,
        }
    return JSONResponse(status_code=exc.status_code, content=payload)


app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(color.router, prefix=settings.api_v1_prefix)


def run() -> None:
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
