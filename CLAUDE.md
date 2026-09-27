# Shortiee

Anonymous + authenticated URL shortener. FastAPI (async) + PostgreSQL + Redis backend, React/TypeScript frontend. Docker Compose locally, EC2 deployment target. Built entirely by Claude Code, designed to production-grade standards.

## Architecture

Layered backend: `routers → services → repositories → models` (strict, see LLD). Cookie-based JWT auth (httpOnly, not localStorage) with anonymous shortening still supported. Redis serves two roles: fixed-window rate limiting and cache-aside on redirect lookups.

## See also

- [docs/architecture/HLD.md](docs/architecture/HLD.md) — system design, request flows
- [docs/architecture/LLD.md](docs/architecture/LLD.md) — class-level design, SOLID mapping, CSRF reasoning
- [docs/architecture/ER-diagram.md](docs/architecture/ER-diagram.md) — schema
- [.claude/skills/shortiee-conventions/SKILL.md](.claude/skills/shortiee-conventions/SKILL.md) — coding conventions (loaded on demand, not auto-loaded here)
- [README.md](README.md) — setup, API summary, deployment notes, future enhancements
