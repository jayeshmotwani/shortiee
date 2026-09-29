# Entity-Relationship Diagram

> Stub — filled in during Task 11 alongside the Task 2 migration. Will contain a Mermaid `erDiagram` for `users` ↔ `short_urls` (one-to-many, nullable FK for anonymous links) plus schema notes: why `status`/`removed_at` exist pre-built on `short_urls`, why `created_ip`/`last_login_ip` use Postgres `INET`, and the indexes backing the redirect hot path and the "my links" query.
