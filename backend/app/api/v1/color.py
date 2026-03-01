from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import get_current_user
from app.db.models import AnalysisLog, User
from app.db.session import get_db
from app.schemas.color import ColorAlternative, ColorAnalyzeResponse, DominantRgb
from app.schemas.common import ApiError
from app.services.color_analyzer import InvalidImageError, LowConfidenceError, analyze_image_bytes

router = APIRouter(prefix="/color", tags=["color"])


@router.post(
    "/analyze",
    response_model=ColorAnalyzeResponse,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ApiError},
        status.HTTP_401_UNAUTHORIZED: {"model": ApiError},
        status.HTTP_413_CONTENT_TOO_LARGE: {"model": ApiError},
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: {"model": ApiError},
        status.HTTP_422_UNPROCESSABLE_CONTENT: {"model": ApiError},
    },
)
async def analyze_color(
    file: UploadFile = File(...),
    facility_id: str | None = Form(default=None),
    worker_id: str | None = Form(default=None),
    session_id: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ColorAnalyzeResponse:
    settings = get_settings()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "UNSUPPORTED_MEDIA_TYPE", "message": "Only image files are accepted."},
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IMAGE", "message": "Image payload is empty."},
        )

    if len(image_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": "Image payload exceeds maximum size limit.",
                "details": {"max_upload_size_bytes": settings.max_upload_size_bytes},
            },
        )

    started_at = time.perf_counter()
    try:
        analyzed = analyze_image_bytes(image_bytes, settings.low_confidence_threshold)
    except LowConfidenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "LOW_CONFIDENCE",
                "message": "Image quality is insufficient for reliable classification.",
                "hint": exc.hint,
                "details": {"confidence": exc.confidence},
            },
        ) from exc
    except InvalidImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IMAGE", "message": str(exc)},
        ) from exc

    processing_ms = int((time.perf_counter() - started_at) * 1000)
    analysis_id = str(uuid.uuid4())
    alternatives = [
        {
            "color_name_ja": candidate.color_name_ja.value,
            "hex": candidate.hex_value,
            "confidence": candidate.confidence,
        }
        for candidate in analyzed.alternatives
    ]

    db.add(
        AnalysisLog(
            id=analysis_id,
            user_id=current_user.id,
            facility_id=facility_id,
            worker_id=worker_id,
            session_id=session_id,
            dominant_hex=analyzed.dominant_hex,
            color_name_ja=analyzed.color_name_ja.value,
            confidence=analyzed.confidence,
            processing_ms=processing_ms,
            alternatives=alternatives,
        )
    )
    await db.commit()

    return ColorAnalyzeResponse(
        analysis_id=analysis_id,
        dominant_hex=analyzed.dominant_hex,
        dominant_rgb=DominantRgb(
            r=analyzed.dominant_rgb[0], g=analyzed.dominant_rgb[1], b=analyzed.dominant_rgb[2]
        ),
        color_name_ja=analyzed.color_name_ja,
        confidence=analyzed.confidence,
        alternatives=[
            ColorAlternative(
                color_name_ja=candidate.color_name_ja,
                hex=candidate.hex_value,
                confidence=candidate.confidence,
            )
            for candidate in analyzed.alternatives
        ],
        speech_text_ja=f"推定色は{analyzed.color_name_ja.value}です。",
        processing_ms=processing_ms,
    )
