from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ApiError(BaseModel):
    code: str
    message: str
    hint: str | None = None
    details: dict[str, Any] | None = None
    request_id: str | None = None


class HealthResponse(BaseModel):
    status: str

