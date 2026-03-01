from __future__ import annotations

from app.core.config import Settings


def build_cors_options(settings: Settings) -> dict[str, object]:
    allow_origins = settings.cors_allow_origins
    allow_credentials = "*" not in allow_origins

    if settings.is_development and allow_origins == ["*"]:
        allow_credentials = False

    return {
        "allow_origins": allow_origins,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
        "allow_credentials": allow_credentials,
    }

