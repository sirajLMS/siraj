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

- [ ] 4.1 Drizzle Studio SQLite config (bun db studio --sqlite)
- [ ] 4.2 SQLite seed runner (DB_PROVIDER=sqlite bun db seed)
- [ ] 4.3 SQLite test runner (DB_PROVIDER=sqlite bun test:db)
- [ ] 4.4 README docs for SQLite local-dev setup
