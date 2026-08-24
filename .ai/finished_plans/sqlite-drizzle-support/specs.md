# SQLite Drizzle Support — Requirements (Phase 1)

**Spec Type:** Full Spec (multi-phase, carries forward completed Phase 1 work)
**Estimated Effort:** Phase 2 = 0.5 day (9 tsgo errors, 3 clusters)
**Priority:** High (unblocks husky quality-gate green; enables SQLite deploys)
**Created:** 2026-08-23
**Status:** Phase 1 COMPLETE; Phase 2 IN PROGRESS

## Overview

**What:** Add SQLite (libsql) dialect support to the Drizzle ORM layer so `siraj` can run against either PostgreSQL or SQLite by setting `DB_PROVIDER`. Phase 1 (schema porting) is complete; Phase 2 (consumer-code type reconciliation) is the remaining work.
**Why:** Enable local-first / single-file deploys (SQLite) without forking the codebase or maintaining separate schemas. PostgreSQL remains the production dialect.
**Success Metric:** `DB_PROVIDER=sqlite bunx drizzle-kit generate --config=drizzle.config.sqlite.ts` succeeds (DONE: 94 tables); `bun run quality-gate` (husky pre-commit: tsgo -> biome -> lint -> duplicates -> codescene) passes green with zero NEW errors vs baseline.

## Requirements

### User Story
**As a** siraj developer
**I want** to run the app against SQLite (`DB_PROVIDER=sqlite`) for local dev/testing, and PostgreSQL for production
**So that** I have zero-friction local setup and a production-grade DB.

### Acceptance Criteria (EARS)

1. **[DONE — Phase 1]** WHEN `DB_PROVIDER=sqlite` THEN the system SHALL load all 15 schema domains via dialect-aware builders and `drizzle-kit generate --config=drizzle.config.sqlite.ts` SHALL produce a valid 94-table migration.
2. **[DONE — Phase 1]** WHEN `DB_PROVIDER=postgres` (default) THEN the system SHALL continue to use `pgTable`/`pgEnum` with zero behavior change; `drizzle-kit generate --config=drizzle.config.ts` SHALL still succeed.
3. WHEN `bun run quality-gate` runs THEN the system SHALL pass the `BASIC_CHECKS` (tsgo) stage with zero NEW errors vs the Phase 0 baseline (9 errors -> 0 new).
4. WHEN a commit is made THEN the husky pre-commit hook (`bun run quality-gate`) SHALL pass without `--no-verify`.
5. WHEN any schema file is modified THEN `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` SHALL exit 0 (per-file quality loop).
6. **[ONGOING]** Feature 6 — Outcome Knowledge Base: every task creates `.ai/plans/sqlite-drizzle-support/outcome/<task-id>-outcome.md` and updates its `tasks.md` checkbox `[ ]` -> `[x]`.

### Constraints
- **Technical:** drizzle-orm@1.0.0-rc.4 + drizzle-kit@1.0.0-rc.4; `@libsql/client` ^0.17.4; Next.js 16 App Router; tsgo native compiler for the quality gate.
- **Type-erasure invariant:** the service + repo layers see PG types everywhere (SQLite objects cast `as never`). NO type changes in consumer code beyond narrowing fixes.
- **No behavior change for PG:** all fixes must be type-level or null-guard additions; no runtime semantic changes when `DB_PROVIDER=postgres`.
- **Repo policy:** `db reset` / `db cleanGenerate` permanently disabled. Use `db push` for schema, `db migrate` for migration journal.
- **PG-only features degraded** (documented, not reverted): `numeric/decimal/date/time -> text`, `smallint -> integer`, `jsonb_typeof` CHECK -> null (app-layer), `is_valid_timezone()` UDF -> null (app-layer), RLS -> repo-layer soft-delete filtering, standalone `foreignKey` -> inline `.references`.

### Edge Cases
- SQLite has no RLS -> soft-delete filtering MUST happen at the repo layer (already does).
- SQLite `blob({mode:"bigint"})` returns `bigint` but PG `bigint` returns `string` -> `bigintColumn` infers a union; consumers expecting `bigint` need a type-narrow.
- `createPool()` returns `null` for SQLite (libsql manages connections internally) -> pool consumers MUST null-guard.
- Self-referential FKs (`suggestions.duplicateOfId`, `classInstances.originalClassId`) need `(): AnyPgColumn` return-type annotation to break circular inference.
