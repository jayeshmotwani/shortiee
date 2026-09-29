# Frontend conventions

## Component / service separation

- `src/api/*.ts` are the **only** modules allowed to call `fetch`. Every call passes `credentials: 'include'` so the httpOnly auth cookie is sent. Components and pages never call `fetch` directly — they call a typed function from `src/api/`.
- `src/context/AuthContext.tsx` owns session state (current user or null), resolved via `GET /api/auth/me` on load. No token is ever read, stored, or handled in frontend JS — the cookie is the only source of truth.
- `src/components/`: presentational/interactive pieces, no page-level data fetching.
- `src/pages/`: compose components, own page-level state, call `src/api/` functions (often via `AuthContext`/hooks).

## Naming

- Components/pages: `PascalCase.tsx`. Hooks: `useCamelCase.ts`. API modules: `camelCaseApi.ts`.
- A protected page (e.g. `MyLinksPage`) checks `useAuth()` and redirects to `LoginPage` if there's no session — do this at the page level, not buried in a component.

## Types

- Define request/response types next to the `api/` function that uses them (or in a shared `types.ts` if reused by 2+ modules). Keep them in sync with the backend's Pydantic schemas by name where practical (`ShortenResponse` ↔ backend `ShortenResponse`).
