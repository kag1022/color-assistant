# color-assistant

Monorepo for a fabric color classification support app targeting vocational support facilities.

## Stack

- Frontend: Expo Router + TypeScript
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Contracts: OpenAPI + generated TypeScript client

## Quick start

1. Copy `.env.example` to `.env` and adjust values.
2. Start DB:
   - `pnpm db:up`
3. Run migrations:
   - `pnpm migrate`
4. Start backend:
   - `pnpm dev:backend`
5. Start frontend:
   - `pnpm dev:frontend`

## Network notes

- Android Emulator: `http://10.0.2.2:8000`
- iOS Simulator: `http://127.0.0.1:8000`
- Physical device: `http://<your-lan-ip>:8000`

## Commands

- `pnpm generate:client` export backend OpenAPI and regenerate TS client
- `pnpm lint` run frontend/backend linters
- `pnpm typecheck` run type checks
- `pnpm test` run tests