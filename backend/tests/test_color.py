from __future__ import annotations

import cv2
import numpy as np
from httpx import AsyncClient

from app.api.v1 import color as color_api
from app.services.color_analyzer import LowConfidenceError


async def _auth_header(client: AsyncClient) -> dict[str, str]:
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "Admin12345!"},
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _png_bytes(rgb: tuple[int, int, int]) -> bytes:
    image = np.zeros((32, 32, 3), dtype=np.uint8)
    image[:] = np.array(rgb, dtype=np.uint8)
    encoded, buffer = cv2.imencode(".png", cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    assert encoded
    return buffer.tobytes()


async def test_analyze_color_success(client: AsyncClient) -> None:
    headers = await _auth_header(client)
    payload = _png_bytes((220, 20, 60))

    response = await client.post(
        "/api/v1/color/analyze",
        headers=headers,
        data={"facility_id": "facility-a", "worker_id": "worker-1", "session_id": "session-1"},
        files={"file": ("fabric.png", payload, "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["color_name_ja"] == "赤"
    assert len(body["alternatives"]) == 3


async def test_analyze_rejects_unsupported_media_type(client: AsyncClient) -> None:
    headers = await _auth_header(client)
    response = await client.post(
        "/api/v1/color/analyze",
        headers=headers,
        files={"file": ("fabric.txt", b"not-image", "text/plain")},
    )
    assert response.status_code == 415
    assert response.json()["code"] == "UNSUPPORTED_MEDIA_TYPE"


async def test_analyze_low_confidence(client: AsyncClient, monkeypatch) -> None:
    headers = await _auth_header(client)

    def raise_low_confidence(_: bytes, __: float) -> None:
        raise LowConfidenceError(0.2, "照明を明るくして再撮影してください。")

    monkeypatch.setattr(color_api, "analyze_image_bytes", raise_low_confidence)

    response = await client.post(
        "/api/v1/color/analyze",
        headers=headers,
        files={"file": ("fabric.png", _png_bytes((128, 128, 128)), "image/png")},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "LOW_CONFIDENCE"
    assert "再撮影" in body["hint"]

