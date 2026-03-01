# ruff: noqa: E402

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.security import hash_password
from app.db.models import User
from app.db.session import SessionLocal


async def seed_admin() -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    password = os.getenv("ADMIN_PASSWORD", "Admin12345!")

    async with SessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Admin user already exists: {email}")
            return

        session.add(User(email=email, hashed_password=hash_password(password), is_active=True))
        await session.commit()
        print(f"Admin user created: {email}")


def main() -> None:
    asyncio.run(seed_admin())


if __name__ == "__main__":
    main()
