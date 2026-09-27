# Shortiee

A URL shortener built as a portfolio project — designed and documented to production-grade standards (layered architecture, async I/O, tests, CI, structured logging) even though it targets low real-world traffic.

> **Status:** under active development. See [Phased Task Breakdown](#status) below for what's built vs. planned.

## Overview

Shortiee lets anyone shorten a URL anonymously; logged-in users additionally get link ownership and a "my links" view. Redirects are served from a Redis cache in front of PostgreSQL; the shorten and login endpoints are rate-limited per IP.

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI (async), SQLAlchemy 2.x (async, `asyncpg`), Alembic |
| Frontend | React + TypeScript, Vite |
| Database | PostgreSQL |
| Cache / rate limiting | Redis |
| Auth | JWT in an httpOnly cookie (not `localStorage`) |
| Logging | stdlib `logging`, structured JSON to stdout |
| Containerization | Docker + Docker Compose |
| CI | GitHub Actions (lint + tests on every push/PR) |
| Deployment target | AWS EC2 (Docker Compose on a single instance) |

## Architecture Summary

Layered backend: `routers → services → repositories → models`. Routers are thin FastAPI path operations; services hold business logic (short-code generation with collision-retry, auth, cache-aside, rate limiting) and depend on repository *interfaces*, not SQLAlchemy directly; repositories are the only layer that knows SQL. Full design rationale, request-flow diagrams, and the SOLID mapping live in [docs/architecture/HLD.md](docs/architecture/HLD.md) and [docs/architecture/LLD.md](docs/architecture/LLD.md); schema in [docs/architecture/ER-diagram.md](docs/architecture/ER-diagram.md).

## Local Setup (Docker Compose)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker-compose up --build
```

- Frontend: http://localhost:5173 (or the port set in `docker-compose.yml`)
- Backend API: http://localhost:8000 (docs at `/docs`)

*(Full instructions land in Task 7/11 of the implementation plan — Postgres/Redis healthchecks, migration-on-boot, etc.)*

## API Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Log in, sets httpOnly session cookie |
| POST | `/api/auth/logout` | — | Clears session cookie |
| GET | `/api/auth/me` | optional | Current session's user, if any |
| POST | `/api/shorten` | optional | Shorten a URL (owned if logged in, anonymous otherwise) |
| GET | `/api/links` | required | List the current user's shortened links |
| GET | `/{code}` | — | Redirect to the original URL |

Full request/response schemas are served by FastAPI's auto-generated OpenAPI docs at `/docs` once the backend is running.

## Deployment (AWS EC2)

*(Filled in during Task 12 — provisioning notes, security group ports, `docker-compose up -d` on the instance, secret handling, and the `Secure` cookie flag's HTTPS requirement in production.)*

## Future Enhancements

Deliberately out of v1 scope. Each note says how the current design already extends to support it:

| Feature | How the current design extends |
|---|---|
| Custom aliases | Add an optional `alias` field to the shorten request; `UrlService` skips random generation and does a single existence check instead. |
| Click analytics | Add a `clicks` table (or a counter column) written from the redirect path; no change to the layering. |
| Link expiration / soft-delete UI | Schema already has `status`/`removed_at` on `short_urls` (see ER diagram) — add an endpoint that sets them; read paths already filter `status='active'`. |
| Refresh tokens / session revocation | `AuthService` already isolates token issuance; add a `refresh_tokens` table and a `/api/auth/refresh` route without touching the rest of auth. |
| Account suspension | `users.status` column already exists; add an admin endpoint and a check in `get_current_user_*`. |
| Tiered / smarter rate limiting | Swap the hand-rolled `RateLimiter` for `slowapi` behind the same interface if policies grow beyond simple per-IP fixed windows. |

## Status

Implementation is tracked against a 12-task phased plan (repo scaffolding → backend foundation → auth → core shorten/redirect → "my links" → Redis → Docker Compose → frontend → frontend auth → CI → docs → EC2 verification). This README is updated as tasks land.
