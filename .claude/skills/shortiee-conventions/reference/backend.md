# Backend conventions

## Layering (strict — see docs/architecture/LLD.md for the full rationale)

`routers/` → `services/` → `repositories/` → `models/`. A layer only ever calls the layer directly below it.

- **Routers** (`app/routers/*.py`): FastAPI path operations only. Parse the request (Pydantic schema), call exactly one service method, shape the response. No SQL, no Redis calls, no business rules.
- **Services** (`app/services/*.py`): business logic as classes (e.g. `UrlService`, `AuthService`). Depend on repository *interfaces* (`app/repositories/base.py`), never on `AsyncSession`/SQLAlchemy directly — that's what makes them unit-testable with a mocked repo.
- **Repositories** (`app/repositories/*.py`): the only layer allowed to import SQLAlchemy or write SQL/ORM queries.
- **Models** (`app/models/*.py`): SQLAlchemy ORM classes. Persistence shape only — no methods beyond what SQLAlchemy needs.

## Naming

- Files: `snake_case.py`. Classes: `PascalCase`. Functions/variables: `snake_case`.
- Service classes are named `<Noun>Service` (`UrlService`, `AuthService`). Repositories are `<Noun>Repository`.
- Pydantic request/response schemas live in `app/schemas/`, suffixed `Request`/`Response` or a plain noun for read models (`LinkOut`, `UserOut`).
- Domain exceptions (`app/core/exceptions.py`) are `PascalCase` ending in the failure, not `Error`/`Exception` generically (`CodeGenerationExhausted`, not `GenerationError`).

## Async

- Every route handler and every service/repository method that touches Postgres or Redis is `async def`.
- Never import a sync driver (`psycopg2`) or a sync Redis client. Only `asyncpg` (via SQLAlchemy's async engine) and `redis.asyncio`.
- The one deliberately-sync call in the codebase is bcrypt password verification (`passlib`) — it's CPU-bound and fast, not a network call. Don't add others without the same justification.

## Logging

- Use the module-level logger (`logging.getLogger(__name__)`), configured centrally in `app/core/logging.py`. Don't call `print()`.
- Never log passwords (hashed or plaintext), JWTs, or cookie values.
- Log service-level events at `INFO` (shorten attempts, collision retries, login/logout), `WARNING` for rejections/auth failures, `ERROR` only for uncaught exceptions.

## Dependency injection

- DB session, Redis client, and current-user resolution are all FastAPI `Depends()` providers in `app/dependencies.py`. Routers never construct a service or repository directly — they receive them via `Depends`.
