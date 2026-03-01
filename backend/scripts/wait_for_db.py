# ruff: noqa: E402

from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

import asyncpg

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import get_settings

TIMEOUT_SECONDS = 45
INTERVAL_SECONDS = 1


def _to_asyncpg_dsn(database_url: str) -> str:
    if database_url.startswith("postgresql+asyncpg://"):
        return database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return database_url


async def wait_for_db(
    timeout_seconds: int = TIMEOUT_SECONDS,
    interval_seconds: int = INTERVAL_SECONDS,
) -> int:
    settings = get_settings()
    dsn = _to_asyncpg_dsn(settings.database_url)
    deadline = time.monotonic() + timeout_seconds

    while time.monotonic() < deadline:
        try:
            conn = await asyncpg.connect(dsn)
            await conn.execute("SELECT 1")
            await conn.close()
            print("Database is available.")
            return 0
        except Exception as exc:  # noqa: BLE001
            remaining = max(0, int(deadline - time.monotonic()))
            print(f"Waiting for database ({remaining}s left): {exc}")
            await asyncio.sleep(interval_seconds)

    print(f"Database did not become available within {timeout_seconds} seconds.")
    return 1


def main() -> None:
    exit_code = asyncio.run(wait_for_db())
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
