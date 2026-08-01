# Quota Branch Review Plan

**Date**: 2025-01-28
**Scope**: `quota` branch (merge base `bad4b18f4f234176aa2f4bdecc30bc210fa84d1a` against master)
**Tracks**: repo-review (frontend, backend, types, config) + review-uncommitted (security, performance, business-logic, deploy-safety, duplication, dead-code) + code-review
**Files Reviewed**: 182 changed files, 35K+ insertions
**Agents**: 11 parallel review agents

## Summary

The `quota` branch introduces a comprehensive billing/quota system. Review uncovered 2 CRITICAL bugs (credit leak and enum relocation), 36 HIGH issues (pool-mode quota leaks, TOCTOU races, architecture violations, migration hazards, N+1 queries, dead code), 68 MEDIUM issues, and 28 LOW issues. Security track was CLEAN — no vulnerabilities found. The most impactful findings are 4 interrelated bugs around the `quotaDeducted` flag not being set for pool-mode instances, causing quota leaks across 3 code paths, and a credit deduction gap in `refreshStudentOndemandInstances`.

## Findings

### CRITICAL (2)

- [ ] [CRITICAL] business-logic: `backend/services/billing/quota.service.ts:405` — On-demand instances flipped to AVAILABLE without deducting credits. `refreshStudentOndemandInstances` uses combined credit+quota balance but only deducts from quota via `deductPendingRefresh`, never calls `StudentRepository.deductClasses`. Credit-only students get free classes. [cr-1, quota-branch-review-1]
  → Fix: After `deductPendingRefresh`, call `StudentRepository.deductClasses(studentId, flippedCount - quotaDeducted)` for the remainder. Track `deducted` return from `deductPendingRefresh`.

- [ ] [CRITICAL] config: `backend/enum/permissions/permission.enum.ts:26` — `SETTINGS_TIMEZONES_VIEW` moved from SETTINGS block to top of enum near `SCHEDULE_*`, breaking logical grouping and orphaning it from its namespace. [rt-1, review-types]
  → Fix: Restore `SETTINGS_TIMEZONES_VIEW` to its original position within the SETTINGS block.

### HIGH (36)

#### Billing / Quota Logic (12)

- [ ] [HIGH] business-logic: `backend/db/repo/billing/quota.repository.ts:809` — `refreshPeriodic` fails with CHECK constraint violation when quota has active earmarks. `reservedClasses` not reset during refresh, so `reservedClasses + remaining > totalClasses`. UPDATE throws and ALL quotas in that transaction roll back. Root cause: `redeemForInstanceBatch` never sets `quotaDeducted=true`. [cr-4, quota-branch-review-1]
  → Fix: In `refreshPeriodic`, subtract `reservedClasses` from `newRemaining`: `newRemaining = rolloverAmount + totalClasses - reservedClasses`.

- [ ] [HIGH] business-logic: `backend/db/repo/scheduling/recurring.ts:368` — `clearWeeklySchedule` permanently leaks pool-mode quota. Pool-mode instances have `quotaDeducted=false` and `earmarkedClasses=0`, so they fall through both release filters. [cr-2, quota-branch-review-1]
  → Fix: Set `quotaDeducted = true` in `redeemForInstanceBatch` (preferred — fixes cr-2, cr-3, cr-4 root cause), OR add separate pool-mode quota release path.

- [ ] [HIGH] business-logic: `backend/services/schedule/recurring-class.service.ts:399` — `cancelSchedule` and `refundOrReleaseForInstances` leak pool-mode quota. Same root cause: `quotaDeducted=false` for pool-mode means release filters never match. [cr-3, quota-branch-review-1]
  → Fix: Same as cr-2 — set `quotaDeducted = true` in `redeemForInstanceBatch`.

- [ ] [HIGH] business-logic: `backend/services/session/class-session.service.ts:562` — Reschedule refunds quota/credit on original instance but successor is inserted with `quotaDeducted:false` and no re-deduction — free class after every reschedule. [bl-1, business-logic]
  → Fix: Re-deduct quota/credit for the successor instance after refunding the original.

- [ ] [HIGH] dead-code: `backend/services/billing/quota-notification.service.ts:14-61` — `sendQuotaExpiringSoon`, `sendQuotaExpired`, `sendQuotaLowBalance` exported but NEVER called — quota lifecycle notifications completely unwired. [bl-2, business-logic + dc-1..dc-3, uc-dead-code]
  → Fix: Either wire these notifications into the quota expiry sweeper and lifecycle events, or remove if not needed for this iteration.

- [ ] [HIGH] dead-code: `backend/services/billing/quota-notification.service.ts:79-109` — `sendOndemandInstanceReminderT3` and `sendOndemandInstanceReminderT1` defined but never invoked — no T-3/T-1 reminder cron exists. [bl-3, business-logic + dc-4..dc-5, uc-dead-code]
  → Fix: Either create reminder crons that call these, or remove if scheduled for future iteration.

- [ ] [HIGH] architecture: `backend/services/billing/quota.service.ts:415-462` — `QuotaService.refreshStudentOndemandInstances` queries `classInstances` table directly, bypassing the scheduling repository layer — cross-layer leak. [rb-1, review-backend]
  → Fix: Route through `SchedulingRepository` or a dedicated scheduling service method.

- [ ] [HIGH] dead-code: `backend/services/billing/quota.service.ts:397` — `QuotaService.refreshPeriodicQuotas` exported and never called — superseded by sweeper calling `QuotaRepository.refreshPeriodic` directly. [dc-6, uc-dead-code]
  → Fix: Remove the dead method.

- [ ] [HIGH] concurrency: `backend/db/repo/billing/quota.repository.ts:376-422` — `redeemForInstance` (single) has TOCTOU window with no row lock — no `SELECT FOR UPDATE` on quota row unlike batch path. [rb-2, review-backend]
  → Fix: Add `SELECT ... FOR UPDATE` before the conditional UPDATE, matching the batch path's pattern.

- [ ] [HIGH] concurrency: `backend/db/repo/billing/quota-ledger.repository.ts:28-57` — Idempotency check SELECT-then-INSERT is not atomic — concurrent transactions both SELECT empty then both INSERT, one violates UNIQUE. [rb-8, review-backend]
  → Fix: Use `onConflictDoNothing` on `idempotency_key` instead of SELECT-then-INSERT.

- [ ] [HIGH] correctness: `backend/services/billing/quota.service.ts:170-224` — `deriveReleaseEarmarkIdempotencyKey` called with `operationId` in the `instanceId` slot — count baked into hash means partial release with different count produces DIFFERENT idempotency key → quota released twice. [rb-9, review-backend]
  → Fix: Fix the argument order so `operationId` isn't in the `instanceId` slot.

- [ ] [HIGH] correctness: `backend/db/repo/billing/quota-ledger.repository.ts:176-186` — `computeBalance.reservedClasses` double-discounts reserved pool: `remaining + reservedClasses` under-reports true usable classes for students with earmarks. [bl-6, business-logic]
  → Fix: Review the formula — reserved classes are already deducted from remaining, so adding them back double-counts.

#### Deploy Safety (6)

- [ ] [HIGH] deploy-safety: `backend/db/migration/8b-quota-constraint-fix.sql:9` — Duplicate constraint `quotas_reserved_plus_remaining_chk` added by both Drizzle migration and this manual file — collision risk. Also NOT registered in `.custom-migrations.json`. [ds-1, deploy-safety]
  → Fix: Remove the manual constraint file and rely on the Drizzle migration's constraint, or register it in `.custom-migrations.json`.

- [ ] [HIGH] deploy-safety: `backend/drizzle/.custom-migrations.json:213-216` — Manifest marks `7c-quota_permissions_enum` and `7d-quota_permissions_data` as already applied — Drizzle will SKIP them. New `app_permission` enum values won't be added. [ds-2, deploy-safety]
  → Fix: Remove the skip entries from `.custom-migrations.json` so the migrations run on deploy.

- [ ] [HIGH] deploy-safety: `backend/db/migration/4c-system_settings_seed.sql:25-30` — UPSERT over 19 system settings overwrites production-customized config (timezone, auth_max_attempts, sms_rate_limit) on every re-run. [ds-3, deploy-safety]
  → Fix: Split new settings into a separate `4d` migration file; don't modify the existing `4c` file.

- [ ] [HIGH] deploy-safety: `backend/db/migration/7c-quota_permissions_enum.sql:1-3` — Raw `ALTER TYPE ADD VALUE` without DO block safety wrapper. Also marked already-applied (will be skipped). [ds-4, deploy-safety]
  → Fix: Keep the file but add a comment noting the bundler handles wrapping. Fix the skip in `.custom-migrations.json` (ds-2).

- [ ] [HIGH] test-quality: `backend/db/test/logic/scheduling/class_quota_race.test.ts:239-304` — Concurrent race test does NOT use `runInRollback` and leaks real DB rows. [rb-5, review-backend]
  → Fix: Wrap test in `runInRollback`, pass `tx` to all repo calls.

- [ ] [HIGH] deploy-safety: `backend/drizzle/20260731181538_curly_mariko_yashida/migration.sql:145,150` — Destructive `ALTER` to `permissions.key` column is order-dependent — type swap fails if 7c enum migration not applied first. [rb-6, review-backend]
  → Fix: Add a pre-flight check or document the migration order dependency.

#### GraphQL / Types (6)

- [ ] [HIGH] security/IDOR: `backend/graphql/query/billing/quota.query.ts:19-56` — `quotaLedger` query bypasses service authorization scoping — any user with `QUOTAS_VIEW` can read ledger of ANY quota by id. [rb-4, review-backend]
  → Fix: Add student-level authorization scoping — verify the caller is associated with the quota's student.

- [ ] [HIGH] types: `backend/graphql/pothos/billing/quota.pothos.ts:130` — Pothos `QuotaSubmitInput` omits `rolloverPolicy` and `idempotencyKey` present on canonical backend type — three-layer inconsistency. [rt-3, review-types]
  → Fix: Add the missing fields to the Pothos input type to match `QuotaSubmitInput` in `backend/types/billing/quota.types.ts`.

- [ ] [HIGH] types: `frontend/common/views/dashboard/billing/quota/types/quota.types.ts:29` — `QuotaLedgerItem.reason` typed as plain string while backend uses typed `QuotaLedgerReason` enum — frontend discards enum typing. [rt-2, review-types]
  → Fix: Import and use `QuotaLedgerReason` enum type from generated GraphQL types.

- [ ] [HIGH] dead-code: `backend/graphql/query/billing/quota.query.ts:109` — `studentQuotas` query never requested by any frontend operation. [dc-12, uc-dead-code]
  → Fix: Remove unused query and its generated types, or wire it up if needed.

- [ ] [HIGH] dead-code: `backend/graphql/query/billing/quota.query.ts:134` — `studentOpenQuotas` query never requested by frontend. [dc-13, uc-dead-code]
  → Fix: Remove or wire up.

- [ ] [HIGH] dead-code: `backend/graphql/query/billing/quota.query.ts:153` — `quotaBalance` query never requested by frontend. `QuotaService.getStudentQuotaBalance` has no caller besides resolver. [dc-14, uc-dead-code]
  → Fix: Remove or wire up.

- [ ] [HIGH] dead-code: `backend/graphql/query/billing/quota.query.ts:172` — `availableClassSlots` query + `AvailableSlot` type + `AvailabilityService.findAvailableSlots` never requested by frontend. [dc-15, uc-dead-code]
  → Fix: Remove the entire chain or wire it up.

#### Dead Code / Duplication (6)

- [ ] [HIGH] dead-code: `backend/db/repo/billing/quota-ledger.repository.ts:140` — `findByClassInstanceId` exported but never called. [dc-9, uc-dead-code]
  → Fix: Remove unused method.

- [ ] [HIGH] dead-code: `backend/db/repo/billing/quota-ledger.repository.ts:152` — `findByRecurringScheduleId` exported but never called. [dc-10, uc-dead-code]
  → Fix: Remove unused method.

- [ ] [HIGH] dead-code: `backend/db/repo/billing/quota-ledger.repository.ts:164` — `findByIdempotencyKey` exported but never called. [dc-11, uc-dead-code]
  → Fix: Remove unused method.

- [ ] [HIGH] dead-code: `backend/db/repo/billing/quota.repository.ts:711` — `QuotaRepository.resetUsedThisPeriod` exported and never called. [dc-7, uc-dead-code]
  → Fix: Remove unused method.

- [ ] [HIGH] dead-code: `backend/db/seeds/billing/seed-quotas.ts:5` — `seedOrGetQuotas` never imported by master seed controller. [dc-8, uc-dead-code]
  → Fix: Either wire it into the seed controller, or remove.

- [ ] [HIGH] duplication: `backend/db/repo/billing/quota.repository.ts:281-422` — `reserveClasses`/`releaseForRecurringSchedule`/`redeemForInstance`/`releaseForInstance` all share same UPDATE-version-bump+WHERE-guard+ledger-insert structure ~10 times. [dup-1, duplication]
  → Fix: Extract a `applyQuotaMutation` helper to consolidate the pattern.

- [ ] [HIGH] duplication: `backend/services/billing/quota.service.ts:26-48` — `requireManagePermission` and `requireViewPermission` duplicate each other AND duplicate existing `requirePermission` helper. [dup-2, duplication]
  → Fix: Consolidate to single `requirePermission` helper.

- [ ] [HIGH] duplication: `backend/services/notification/quota-notification.builders.ts:7-153` — Seven exported builders are line-for-line copies with only label/key/eventtype varying. [dup-3, duplication]
  → Fix: Use the existing `fanOutToUsers` and `buildLifecyclePayloads` skeleton from `notification-payloads.builders.ts`.

#### Performance (3)

- [ ] [HIGH] performance: `backend/services/schedule/recurring-class.service.ts:466` — `createRecurringScheduleWithInstances` runs nested week×day loop calling `createSingleRecurringInstance` per iteration — O(weeks×days×~6) sequential queries. [perf-1, performance]
  → Fix: Batch instance creation into a single bulk insert.

- [ ] [HIGH] performance: `scripts/ondemand-instance-generator.ts:102` — Loops schedules and generates instances one-by-one via `insertInstanceIfMissing` each opening own DB transaction. [perf-2, performance]
  → Fix: Batch inserts into a single transaction.

- [ ] [HIGH] performance: `scripts/quota-expiry-sweeper.ts:13` — Loops and sequentially awaits `refreshPeriodic` for each quota inside one transaction — no batching/chunking. [perf-3, performance]
  → Fix: Process quotas in batches with separate transactions.

#### Business Logic (2)

- [ ] [HIGH] business-logic: `scripts/ondemand-teacher-digest-cron.ts:69-113` — TOCTOU race in per-teacher idempotency: reads marker, dispatches notification, then writes marker — all outside transaction. [bl-4, business-logic]
  → Fix: Use atomic upsert or row lock for the idempotency marker check.

- [ ] [HIGH] business-logic: `backend/services/billing/quota.service.ts:405-465` — `refreshStudentOndemandInstances` double-charges quota: `flippedCount` can exceed `totalQuotaRemaining` because credits are also counted. [rb-3, review-backend — DUPLICATE of cr-1]

#### Frontend (2)

- [ ] [HIGH] frontend: `frontend/common/views/dashboard/billing/quota/useQuotaViewModel.ts:17` — Zustand whole-store subscription via object destructuring — re-renders on ANY store field change. [rf-1, review-frontend]
  → Fix: Use granular selectors: `useQuotaStore(s => s.filterStatus)` etc.

- [ ] [HIGH] frontend: `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts:15` — Zustand whole-store subscription — form re-renders on unrelated state changes. [rf-2, review-frontend]
  → Fix: Use individual selector functions.

### MEDIUM (68) — See SQL table for full list

Key MEDIUM findings by area:
- **Concurrency (4)**: deductPendingRefresh no row lock, refreshPeriodic no FOR UPDATE, recordPurchase TOCTOU, idempotency key non-deterministic
- **Correctness (4)**: computeBalance double-discount, expireOverdue orphans earmarks, deleteClass swallows quota errors, inconsistent failure semantics
- **Deploy (3)**: permissions data grants too broad, permissions.key type cast fragile, seed references non-existent UUID
- **Types (5)**: notification enum casing inconsistency, type duplication drift risks, QuotaReturnType vs QuotaItem hand-written shapes
- **Performance (5)**: N+1 in recurring class notifications, sequential ledger inserts, unbounded queries, upsertMany N+1, serial loops in deletion
- **Frontend (10)**: hardcoded English strings, MUI v9 violations, import source inconsistency, loading state issues, chart locale issues
- **Dead code (20)**: unused schemas, translation keys, types, store fields, formatters
- **Duplication (4)**: JS-getDay map, credit computation, audience views scaffolding, pagination filter pattern
- **Config (3)**: Incorrect AGENTS.md file paths, non-existent file references

### LOW (28) — See SQL table for full list

Key LOW findings: lossy enum casts, mass-expire sweep, atomic UPDATE 500s, non-deterministic idempotency keys, notification error swallowing, unused enum value, dead GraphQL document, partial chart bugs, etc.

## Recommended Actions (Priority Order)

### P0 — Fix before merge (correctness bugs)
1. **cr-1**: Credit leak in `refreshStudentOndemandInstances` — students get free classes
2. **cr-4**: `refreshPeriodic` CHECK constraint violation — quota refresh fails for any student with earmarks
3. **cr-2 + cr-3**: Pool-mode quota leak (root cause: `redeemForInstanceBatch` not setting `quotaDeducted`)
4. **bl-1**: Reschedule credit leak — free class after every reschedule
5. **rb-4**: IDOR in `quotaLedger` query — unauthorized data access
6. **ds-2**: Migration skip — new permissions won't be added on deploy

### P1 — Fix before merge (architecture + migration safety)
7. **ds-1**: Duplicate constraint collision
8. **ds-3**: System settings UPSERT overwrites production config
9. **rb-2**: TOCTOU in `redeemForInstance` — no row lock
10. **rb-8**: Non-atomic idempotency check in ledger repository
11. **rb-9**: Wrong idempotency key argument order — double quota release
12. **rb-5**: Test not using `runInRollback`

### P2 — Fix in follow-up (performance + dead code + duplication)
13. **perf-1/2/3**: N+1 queries and sequential loops
14. **dup-1/2/3**: Code duplication — consolidation
15. **dc-1..dc-15**: Dead code removal (GraphQL fields, orphaned exports, seeds)
16. **rf-1/2**: Zustand whole-store subscriptions
17. **rt-1**: SETTINGS_TIMEZONES_VIEW enum relocation

### P3 — Polish (MEDIUM/LOW issues)
18. Frontend i18n hardcoded strings
19. MUI v9 compliance
20. Config AGENTS.md path corrections
21. Unused translation keys cleanup
22. Type consistency improvements

## Layer Compliance Notes (Validated via plan-review skill)

### AGENTS.md Violations Found (13)

1. **[BACKEND SERVICES]** `quota.service.ts` — QuotaService queries `classInstances` table directly, bypassing scheduling repository (rb-1). Rule: services must not cross domain boundaries to query other repos.
2. **[BACKEND GRAPHQL]** `quota.query.ts` — `quotaLedger` resolver calls repository directly without service-layer authorization (rb-4). Rule: resolvers must delegate to services.
3. **[BACKEND GRAPHQL/POTHOS]** `quota.pothos.ts` — `AvailableSlotPothosObject` defined in quota Pothos file (rb-18/rt-8). Rule: types must live in their domain module. **ESCALATED: LOW → MEDIUM.**
4. **[BACKEND TYPES]** `quota.types.ts` — `QuotaLedgerItem.reason` typed as plain string in frontend, backend uses typed enum (rt-2). Rule: single canonical type pattern.
5. **[BACKEND TYPES]** `quota.types.ts` — `QuotaInsertType`, `QuotaLedgerInsertType` dead exports (dc-24/dc-25). Rule: canonical types should be consumed, not orphaned.
6. **[FRONTEND VIEWS]** `AGENTS.md` — References `frontend/stores/quotaStore.ts` but actual path is `frontend/common/stores/quotaStore.ts` (rc-1). Rule: `frontend/views/` is DEPRECATED.
7. **[FRONTEND VIEWS]** `AGENTS.md` — References non-existent `processStudentQuotaViewModel.ts`, actual file is `useStudentQuotaViewModel.ts` (rc-3). Rule: files moved to `frontend/common/views/`.
8. **[FRONTEND]** `QuotaInsightsContainer.tsx` — M2-style bgcolor/color pattern instead of M3 Container/onContainer (rf-4). Rule: MUI v9 requires `sx` prop + `on<Color>` siblings.
9. **[FRONTEND]** Multiple components — Hardcoded English strings: "All", "Committed", "Cancelled", month names, "Student UUID" (rf-5, rf-8, rf-9, rf-10). Rule: all user-facing text must use `useAppTranslation`.
10. **[FRONTEND]** `useQuotaViewModel.ts` / `useQuotaFormViewModel.ts` — Zustand whole-store object destructuring (rf-1, rf-2). Rule: use granular selectors to prevent unnecessary re-renders.
11. **[BACKEND SERVICES]** `quota-notification.service.ts` — Notification errors swallowed silently (rb-19). Rule: services must use localized error logging.
12. **[BACKEND DB/TEST]** `class_quota_race.test.ts` — Not using `runInRollback`, leaks real DB rows (rb-5). Rule: all DB tests must use `runInRollback` and pass `tx`.
13. **[BACKEND SEEDS]** `seed-quotas.ts` — `seedOrGetQuotas` never wired into master seed controller (dc-8). Rule: every seeder must be imported in `backend/db/seeds/index.ts`.

### Severity Escalation (1)

- **rb-18/rt-8** (AvailableSlot type in wrong Pothos file): **LOW → MEDIUM** — violates single canonical type pattern by coupling unrelated type to quota module.

### Clean Compliance Areas

- ✅ Security: No hardcoded secrets, SQL injection, or auth bypass
- ✅ Pothos enum registration: No hardcoded enum literals
- ✅ `id` field on GraphQL objects: Correctly included
- ✅ `@/` path aliases: Consistently used throughout

## Fix Scoping (Autopilot Defaults)

**Decision**: Fix all 2 CRITICAL + 36 HIGH findings (38 total). Skip MEDIUM/LOW for now — can be addressed in follow-up.

### Fix Batches (grouped by file independence for parallel dispatch)

| Batch | Description | Findings | Primary Files |
|-------|-------------|----------|---------------|
| A | Quota repository root cause | cr-2, cr-4, rb-2, dup-1, dc-7 | `quota.repository.ts` |
| B | Quota service | cr-1, rb-1, dc-6, dup-2 | `quota.service.ts` |
| C | Quota ledger repo | rb-8, dc-9, dc-10, dc-11 | `quota-ledger.repository.ts` |
| D | Notification service + wiring | bl-2, bl-3, dc-1..dc-5 | `quota-notification.service.ts` |
| E | Class session service | bl-1 | `class-session.service.ts` |
| F | Recurring class service | cr-3, perf-1 | `recurring-class.service.ts` |
| G | Recurring repo | cr-2 (shared with A) | `recurring.ts` |
| H | GraphQL queries | rb-4, dc-12..dc-15 | `quota.query.ts` |
| I | Pothos definitions | rt-3 | `quota.pothos.ts` |
| J | Quota types (backend) | dc-24/dc-25 | `backend/types/billing/quota.types.ts` |
| K | Permission enum | rt-1 | `permission.enum.ts` |
| L | Frontend ViewModels | rf-1, rf-2 | `useQuotaViewModel.ts`, `useQuotaFormViewModel.ts` |
| M | Migrations | ds-1, ds-2, ds-3, ds-4, rb-6 | migration files + `.custom-migrations.json` |
| N | Tests | rb-5 | `class_quota_race.test.ts` |
| O | Builders | dup-3 | `quota-notification.builders.ts` |
| P | Scripts | bl-4, perf-2, perf-3 | cron scripts |
| Q | Seeds | dc-8 | `seed-quotas.ts`, `seeds/index.ts` |
| R | Frontend types | rt-2 | `frontend/.../quota.types.ts` |

**Parallel Groups** (no file conflicts):
- Group 1: Batches E, G, I, K, L, N, O, Q, R (9 agents — all independent files)
- Group 2: Batch A (depends on nothing, but touches shared files with G)
- Group 3: Batch B (depends on A for root cause understanding)
- Group 4: Batch C (independent)
- Group 5: Batch D (independent)
- Group 6: Batch F (depends on A for root cause understanding)
- Group 7: Batch H (independent)
- Group 8: Batch J (independent)
- Group 9: Batch M (independent)
- Group 10: Batch P (independent)

## Fix Status

- Total unique findings: 134
- CRITICAL/HIGH in scope: 38
- Fixed: 0 / 38
- Remaining: 38
- Duplicates removed: 7
- Clean tracks: Security (0 findings)
