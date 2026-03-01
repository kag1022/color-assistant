## Backend

FastAPI service for color analysis and authentication.

### Run locally

1. Ensure PostgreSQL is running.
2. Wait for DB:
   - `uv run python scripts/wait_for_db.py`
3. Apply migrations:
   - `uv run alembic upgrade head`
4. Seed admin:
   - `uv run python scripts/seed_admin.py`
5. Start API:
   - `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
