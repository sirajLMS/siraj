# Plan: Neon HTTP Single-Fetch Client Rollout

**Status:** Planning — Approved (2026-07-31)
**Parent Plan:** [`.ai/plans/neon/`](../neon/) (Task 1.2 — Neon HTTP Single-Fetch Helper)
**Supersedes:** [`.ai/plans/neon/neon_http/tasks_deepseek4pro.md`](../neon/neon_http/tasks_deepseek4pro.md)
**Methodology:** Spec-Driven Development (`.agents/skills/spec-driven-development/SKILL.md`)

---

## Why This Plan Exists

Task 1.2 of the Neon plan implemented `backend/db/http-client.ts` exposing `getNeonHttpClient()` and
`getNeonHttpDb()` for zero-pool HTTP single-fetch queries via `@neondatabase/serverless` (`neon(url)`) +
`drizzle-orm/neon-http`. The helpers are re-exported from `backend/db/drizzleDb.ts:71` and
integration-tested (`backend/db/test/neon-integration.test.ts:135-152`), but **zero production
consumers exist** outside `backend/db/`.

This plan rolls out the HTTP single-fetch client to the **repository layer** via a provider-agnostic `queryDb(tx)` factory handle (re-exported from `backend/db/drizzleDb.ts`). This seam conforms to `backend/AGENTS.md` (services delegate to repositories; services never touch the DB directly).

It introduces a provider-agnostic runtime guard (`getActiveHttpProvider()`), caches the resolved HTTP database singleton instance (`getStatelessHttpDb()`), and exposes `queryDb(tx)` so repository methods execute reads over zero-pool HTTP when eligible while seamlessly falling back to `tx` or `db` without vendor lock-in.

## Why It Supersedes the `neon_http` Draft

The prior draft (`.ai/plans/neon/neon_http/tasks_deepseek4pro.md`) targeted 8 **service** files, but:

1. **No `spec.md`/`design.md`** — incomplete per the spec-driven-development skill (all 3 phases required).
2. **No env-gating helper** — its blanket `db → httpDb` swap would break local dev (`neon(url)` HTTPS-POSTs
   to `https://<host>/sql`, a Neon-only endpoint that does not exist on plain Postgres → 404/TLS failure).
3. **Wrong seam & hardcoded vendor logic** — services delegate to repositories per `backend/AGENTS.md`; the migration point is the repository's `tx ?? db` fallback, and hardcoding vendor-specific calls in 52 files creates lock-in.
4. **Outcome dir empty** — no captured learnings.

This plan corrects all four: it is repository-layer-only, introduces the provider-agnostic `queryDb(tx)` factory handle with singleton caching, follows all three spec-driven-development phases, and captures outcomes per task.

## Plan Documents

| Phase | Document | Purpose |
|-------|----------|---------|
| 1 — Requirements | [`spec.md`](spec.md) | EARS-format acceptance criteria |
| 2 — Design | [`design.md`](design.md) | Architecture, gating helper, migration pattern, risks |
| 3 — Tasks | [`tasks.md`](tasks.md) | Actionable implementation breakdown |
| Outcomes | [`outcome/`](outcome/) | Per-task knowledge capture |

## Scope at a Glance

- **Phase 1 Foundation & Early Integration Test:** Build `queryDb(tx)` factory + `getActiveHttpProvider()` gating, and immediately create live provider integration smoke `test/integration/db/query-db.integration.test.ts` (per `test/integration/AGENTS.md`) to verify live HTTP execution before any repo migrations.
- **Pilot:** `backend/db/repo/users/user.repository.ts` (6 non-tx read methods — drives `me` query, FX-display, page titles).
- **Batch:** ~52 repository files with clean non-tx single-read paths (full clean-repo batch — see `tasks.md` Phase 3 table).
- **Out of scope (deferred):** session/auth path; multi-query pipelines; always-tx-wrapped reads; write methods; GraphQL resolver changes; service-layer changes.

## Execution Protocol (All Tasks)

1. Pre-Execution: read ALL files in `outcome/` first.
2. Per-File: `bun tsgo` + `bun biome:check` + lint-queue on the modified file.
3. Global: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings) before marking complete.
4. Post-Execution: write `.ai/plans/neon-http-rollout/outcome/<task-id>-outcome.md`.
5. Progress: update `[ ]` → `[x]` in `tasks.md`.

See `tasks.md` for the full Layer-to-Instructions mapping table (absolute AGENTS.md / `.agents/instructions` paths).
