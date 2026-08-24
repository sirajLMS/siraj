# SQLite Drizzle Support — Trackable Tasks

## Phase 0: Baseline (DONE)
- [x] 0.1 Record tsgo baseline + categorize 9 consumer errors into 3 clusters -> outcome/0.1-baseline.md

## Phase 1: Schema Porting (DONE — committed)
- [x] 1.1 Phase 1a: builder + users + enums + custom-types (prior session)
- [x] 1.2 Phase 1b: shared/ domain + serialColumn (commit 703f3a1c)
- [x] 1.3 Phase 1c: all 15 domains via parallel subagents (commit 0a332576c)
- [x] 1.4 Builder type fixes: constraint any + extras any (commit e168022cf)
- [x] 1.5 SQLite migration generate SUCCEEDS (94 tables)

## Phase 2: Consumer-Code Type Reconciliation (IN PROGRESS)

- [x] 2.1 Cluster A — nullable FK consumers (4 files)
  - [x] 2.1.QL Quality Loop (per file, after fix): bun run scripts/health/sub-loop.ts <file> --lifecycle codescene (exit 0)
  - [x] 2.1.F1 Fix backend/services/payment-method/payment-method.service.ts:270 — null-guard / non-null assert on FK arg
  - [x] 2.1.F2 Fix backend/services/seed/leave-request-seed.service.ts:37 — filter undefined from array / non-null assert
  - [x] 2.1.F3 Fix backend/services/seed/student-seed.service.ts:92 — non-null assert on studentId/classInstanceId
  - [x] 2.1.F4 Fix backend/services/seed/teacher-payment-seed.service.ts:45,47 — non-null assert (2 sites)
  - _Requirements: AC 3, 5_

- [x] 2.2 Cluster B — bigintColumn union type (1 file)
  - [x] 2.2.QL Quality Loop: bun run scripts/health/sub-loop.ts backend/services/storage/storage.service.ts --lifecycle codescene (exit 0)
  - [x] 2.2.F1 Fix backend/services/storage/storage.service.ts:138 — fileSize = BigInt(row.fileSize) (idempotent for bigint, accepts string-or-number)
  - _Requirements: AC 3, 5_

- [x] 2.3 Cluster C — nullable pool (1 file)
  - [x] 2.3.QL Quality Loop: bun run scripts/health/sub-loop.ts backend/services/cron/queue-adapters/custom-sql.adapter.ts --lifecycle codescene (exit 0)
  - [x] 2.3.F1 Fix backend/services/cron/queue-adapters/custom-sql.adapter.ts:95-97 — null-guard getDrizzleDbPool() (early-return or throw explicit error for SQLite)
  - _Requirements: AC 3, 5_

## Phase 3: Verification and Gate (PENDING)

- [x] 3.1 Full quality-gate green: bun run quality-gate passes (husky pre-commit) without --no-verify
- [x] 3.2 SQLite regression: DB_PROVIDER=sqlite bunx drizzle-kit generate --config=drizzle.config.sqlite.ts still produces 94 tables
- [x] 3.3 PG regression: DB_PROVIDER=postgres bunx drizzle-kit generate --config=drizzle.config.ts still succeeds (modulo one-time FK-rename hints for suggestions.duplicateOfId)
- [x] 3.4 tsgo total = 0 (down from baseline 9; no NEW errors introduced)
- [x] 3.5 Commit Phase 2 fixes (single commit, husky hook passes)
- [x] 3.6 Write outcome/3.x-verification.md + update progress doc docs/SQLITE_MIGRATION_PROGRESS.md

## Phase 4 (STRETCH — not in scope unless requested)

- [x] 4.1 Drizzle Studio SQLite config (bun db studio --sqlite)
- [x] 4.2 SQLite seed runner (DB_PROVIDER=sqlite bun db seed)
- [x] 4.3 SQLite test runner (DB_PROVIDER=sqlite bun test:db)
- [x] 4.4 README docs for SQLite local-dev setup

## Phase 5: Cross-Dialect Test Parity + SQLite Path Relocation (DONE)

- [x] 5.1 Relocate SQLite default path to ./db/siraj.sqlite (driver, config, env, docs, environment.d.ts)
- [x] 5.2 PG migrate + SQLite migrate (both dialects current)
- [x] 5.3 PG seed + SQLite seed (both 72 tables verified)
- [x] 5.4 Cross-dialect ilike -> caseInsensitiveLike (22 call sites, 9 repo files)
- [x] 5.5 cron.repository.ts reconcileStuckRuns dialect-aware stuckCondition (epoch-ms for SQLite)
- [x] 5.6 Timezone CHECK test guards (parent + teacher tests, isSqlite() dialect-aware)
- [x] 5.7 System-permission SQLite triggers (5 triggers mirroring PG protect_system_permissions())
- [x] 5.8 permission-management.service.test.ts SQLite cleanup via executeTxSql (DROP/CREATE trigger)
- [x] 5.9 PG db tests: 91/91 passed (897 tests, 4294 assertions, 0 failures)
- [x] 5.10 SQLite db tests: 91/91 passed (860 tests, 2741 assertions, 0 failures)
- [x] 5.11 Services tests: 65/65 passed (646 tests, 1625 assertions, 0 failures)
- [x] 5.12 generate:gqlSchema: succeeded
- [x] 5.13 Full quality-gate: ALL PASSED (5600 files, 0 errors)
