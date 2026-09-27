# Testing conventions

**No feature or bug fix ships without tests.** This is enforced (heuristically) by a pre-commit hook (`.claude/hooks/git-guard.js`) and is a hard project rule regardless.

## Backend (pytest + pytest-asyncio)

- `backend/tests/unit/` — test one service/class in isolation, dependencies mocked (e.g. `UrlService` tested against a fake `AbstractRepository`, not a real DB).
- `backend/tests/integration/` — hit real FastAPI endpoints via `httpx.AsyncClient`, against a real (test) Postgres + Redis. One file per router.
- Fixtures live in `backend/tests/conftest.py`: a test DB session, a test Redis client, and an `AsyncClient` wired to the app.
- Async tests are marked `@pytest.mark.asyncio` (or use `asyncio_mode = auto` in config — pick one and be consistent).
- Name test functions `test_<behavior>_<condition>` (e.g. `test_shorten_retries_on_code_collision`).

## Frontend (Vitest + React Testing Library)

- `frontend/tests/` mirrors `src/` structure loosely — one test file per component/API module that has behavior worth asserting.
- Mock `fetch` (or the `api/` module) rather than hitting a real backend; test the component's rendered output and interactions, not implementation details.
- Name test files `<Thing>.test.ts(x)`.

## Before marking any task done

Run the actual suite and read the output — `pytest` (backend) / `npm test` or `npx vitest run` (frontend). Don't infer pass/fail from what the code "should" do.
