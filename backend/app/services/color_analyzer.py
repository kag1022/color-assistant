from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from app.schemas.color import ColorNameJa

MAX_RGB_DISTANCE = float(np.linalg.norm(np.array([255.0, 255.0, 255.0])))

COLOR_PALETTE: dict[ColorNameJa, tuple[int, int, int]] = {
    ColorNameJa.RED: (220, 20, 60),
    ColorNameJa.ORANGE: (245, 140, 50),
    ColorNameJa.YELLOW: (245, 216, 66),
    ColorNameJa.YELLOW_GREEN: (155, 200, 70),
    ColorNameJa.GREEN: (45, 150, 90),
    ColorNameJa.CYAN: (84, 192, 220),
    ColorNameJa.BLUE: (45, 90, 200),
    ColorNameJa.PURPLE: (130, 80, 180),
    ColorNameJa.PINK: (220, 120, 175),
    ColorNameJa.BROWN: (135, 90, 55),
    ColorNameJa.GRAY: (128, 128, 128),
    ColorNameJa.BLACK: (20, 20, 20),
}


class InvalidImageError(Exception):
    pass


class LowConfidenceError(Exception):
    def __init__(self, confidence: float, hint: str) -> None:
        super().__init__(hint)
        self.confidence = confidence
        self.hint = hint


@dataclass(slots=True)
class CandidateColor:
    color_name_ja: ColorNameJa
    rgb: tuple[int, int, int]
    hex_value: str
    confidence: float


@dataclass(slots=True)
class ColorAnalysisResult:
    dominant_rgb: tuple[int, int, int]
    dominant_hex: str
    color_name_ja: ColorNameJa
    confidence: float
    alternatives: list[CandidateColor]


def _to_hex(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def _compute_adjusted_confidence(base_confidence: float, rgb: tuple[int, int, int]) -> float:
    sample = np.zeros((1, 1, 3), dtype=np.uint8)
    sample[0, 0] = np.array(rgb, dtype=np.uint8)
    hsv = cv2.cvtColor(sample, cv2.COLOR_RGB2HSV)[0, 0]
    saturation = float(hsv[1]) / 255.0
    value = float(hsv[2]) / 255.0

    confidence = base_confidence * (0.6 + 0.4 * saturation)
    if value < 0.15 or value > 0.95:
        confidence *= 0.85
    return float(np.clip(confidence, 0.0, 1.0))


def analyze_image_bytes(image_bytes: bytes, low_confidence_threshold: float) -> ColorAnalysisResult:
    if not image_bytes:
        raise InvalidImageError("Image payload is empty.")

    np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image_bgr = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise InvalidImageError("Image could not be decoded.")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(image_rgb, (64, 64), interpolation=cv2.INTER_AREA)
    pixels = resized.reshape(-1, 3).astype(np.float32)

    dominant = np.median(pixels, axis=0)
    dominant_rgb = (int(dominant[0]), int(dominant[1]), int(dominant[2]))

    candidates: list[CandidateColor] = []
    dominant_vec = np.array(dominant_rgb, dtype=np.float32)

    for name, palette_rgb in COLOR_PALETTE.items():
        palette_vec = np.array(palette_rgb, dtype=np.float32)
        distance = float(np.linalg.norm(dominant_vec - palette_vec))
        base_confidence = max(0.0, 1.0 - (distance / MAX_RGB_DISTANCE))
        confidence = _compute_adjusted_confidence(base_confidence, dominant_rgb)
        candidates.append(
            CandidateColor(
                color_name_ja=name,
                rgb=palette_rgb,
                hex_value=_to_hex(palette_rgb),
                confidence=round(confidence, 3),
            )
        )

    candidates.sort(key=lambda item: item.confidence, reverse=True)
    top = candidates[:3]
    best = top[0]

    if best.confidence < low_confidence_threshold:
        raise LowConfidenceError(
            confidence=best.confidence,
            hint="照明を明るくし、布地を画面中央で再撮影してください。",
        )

    return ColorAnalysisResult(
        dominant_rgb=dominant_rgb,
        dominant_hex=_to_hex(dominant_rgb),
        color_name_ja=best.color_name_ja,
        confidence=best.confidence,
        alternatives=top,
    )
