from __future__ import annotations

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Color Assistant API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://color_user:color_pass@localhost:5432/color_assistant"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    backend_cors_allow_origins: str = "*"

    low_confidence_threshold: float = 0.55
    max_upload_size_bytes: int = 5 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_allow_origins(self) -> list[str]:
        if self.backend_cors_allow_origins.strip() == "*":
            return ["*"]
        return [item.strip() for item in self.backend_cors_allow_origins.split(",") if item.strip()]

    @field_validator("low_confidence_threshold")
    @classmethod
    def validate_threshold(cls, value: float) -> float:
        if not 0.0 <= value <= 1.0:
            raise ValueError("low_confidence_threshold must be between 0 and 1.")
        return value

    @field_validator("max_upload_size_bytes")
    @classmethod
    def validate_upload_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("max_upload_size_bytes must be positive.")
        return value

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
