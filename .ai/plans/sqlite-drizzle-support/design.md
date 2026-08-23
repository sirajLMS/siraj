# SQLite Drizzle Support — Design (Phase 2)

## Overview

Phase 1 ported all 15 schema domains to dialect-aware builders (type-erasure via as-never). The schema files are now clean under tsgo (0 errors) after the builder type fixes (constraint Record-string-any + extras any). Phase 2 reconciles 9 remaining consumer-code tsgo errors caused by the type-erasure not fully propagating column nullability/bigint-ness to inferSelect under tsgo (the native Go TS compiler, stricter than bunx tsc).

## Design Goals

1. Zero NEW tsgo errors vs baseline (9 -> 0 new; ideally 9 -> 0 total).
2. No runtime behavior change for DB_PROVIDER=postgres.
3. No schema-file changes (Phase 1 is frozen) — fixes are in backend/services/ and backend/db/drivers/ + backend/db/factory.ts only.
4. Every modified file passes bun run scripts/health/sub-loop.ts <file> --lifecycle codescene (exit 0).

## Key Design Decisions

### Decision A — Fix nullable-FK consumers with null-guards (NOT schema changes)
**Context:** Cluster A errors (4 files) pass string-or-null FK columns to helpers typed (id: string) => ...
**Options:**
1. Change uuidDefaultColumn to infer non-nullable — rejected: FKs ARE nullable (ON DELETE SET NULL), hiding that is unsafe.
2. Add notNull() to the FK columns in schema — rejected: changes schema semantics; PG migrations would alter nullability.
3. Add null-guards / non-null assertions at consumer call sites — chosen: surfaces the real nullability, minimal change, no schema/migration impact.
**Rationale:** The latent type-unsafety pre-existed (PG uuid FKs are also nullable); tsgo just surfaces it now. Fixing at the consumer is the correct, safe, minimal fix.

### Decision B — Narrow bigintColumn return type at consumer
**Context:** Cluster B (storage.service.ts:138) — fileSize infers string-or-number-or-bigint because PG bigint returns string, SQLite blob-bigint returns bigint.
**Options:**
1. Change bigintColumn helper to cast to a single type — rejected: would require choosing PG-or-SQLite semantics; loses the other dialect correctness.
2. Narrow at consumer: fileSize = BigInt(row.fileSize) — chosen: runtime-safe (BigInt() accepts string/number/bigint, idempotent for bigint), type-correct, no schema change.
**Rationale:** BigInt() is idempotent for bigint, accepts string/number — the runtime value is already correct per dialect; we only narrow the TS type at the boundary.

### Decision C — Null-guard getDrizzleDbPool() in custom-sql.adapter.ts
**Context:** Cluster C (3 errors) — getDrizzleDbPool() returns PgPool-or-Pool-or-null (null for SQLite). custom-sql.adapter.ts consumes it without null-checking.
**Options:**
1. Make getDrizzleDbPool() throw for SQLite — rejected: changes runtime contract; the adapter may legitimately skip pool-based work for SQLite.
2. Null-guard in the adapter: early-return or throw new Error(pool-based cron queue requires postgres) when null — chosen: explicit, type-safe, surfaces the limitation.
**Rationale:** The cron custom-sql queue adapter is PG-specific (uses pg-boss-style SQL). For SQLite, cron uses a different adapter (or in-process). Null-guarding makes the contract explicit.

## Files Modified (Phase 2)

| File | Cluster | Fix |
|------|---------|-----|
| backend/services/payment-method/payment-method.service.ts | A | null-guard / non-null assert at :270 |
| backend/services/seed/leave-request-seed.service.ts | A | filter undefined / non-null assert at :37 |
| backend/services/seed/student-seed.service.ts | A | non-null assert at :92 |
| backend/services/seed/teacher-payment-seed.service.ts | A | non-null assert at :45, :47 |
| backend/services/storage/storage.service.ts | B | BigInt(row.fileSize) narrow at :138 |
| backend/services/cron/queue-adapters/custom-sql.adapter.ts | C | null-guard getDrizzleDbPool() at :95-97 |

No schema files modified. No builder files modified (frozen after Phase 1c).

## UX/Navigation Specification

N/A — backend-only changes. No routes, sidebar, or UI changes.

## Outcome and Knowledge Transfer Protocol

- BEFORE each task: read .ai/plans/sqlite-drizzle-support/outcome/.
- AFTER each task: write .ai/plans/sqlite-drizzle-support/outcome/task-id-outcome.md.
- Update tasks.md checkbox [ ] -> [x].
