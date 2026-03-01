from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class ColorNameJa(StrEnum):
    RED = "赤"
    ORANGE = "オレンジ"
    YELLOW = "黄"
    YELLOW_GREEN = "黄緑"
    GREEN = "緑"
    CYAN = "水色"
    BLUE = "青"
    PURPLE = "紫"
    PINK = "ピンク"
    BROWN = "茶"
    GRAY = "灰"
    BLACK = "黒"


class DominantRgb(BaseModel):
    r: int = Field(ge=0, le=255)
    g: int = Field(ge=0, le=255)
    b: int = Field(ge=0, le=255)


class ColorAlternative(BaseModel):
    color_name_ja: ColorNameJa
    hex: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    confidence: float = Field(ge=0, le=1)


class ColorAnalyzeResponse(BaseModel):
    analysis_id: str
    dominant_hex: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    dominant_rgb: DominantRgb
    color_name_ja: ColorNameJa
    confidence: float = Field(ge=0, le=1)
    alternatives: list[ColorAlternative] = Field(min_length=3, max_length=3)
    speech_text_ja: str
    processing_ms: int = Field(ge=0)
