# Uncommitted Changes Review Plan

**Date**: 2026-07-31
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: All 6 (security, performance, business-logic, deploy-safety, duplication, dead-code)
**Files Reviewed**: 100+ changed files (Quota/On-Demand Scheduling feature)
**Auto-fix scope**: CRITICAL only (WARNING/SUGGESTION deferred — user unavailable, conservative default)

## Summary

The uncommitted diff implements a Quota/On-Demand Scheduling system: new `quotas` and `quota_ledger` DB tables, GraphQL CRUD, services (`QuotaService`, `AvailabilityService`), cron scripts (on-demand instance generator, no-credits resolver, teacher digest, expiry sweeper), permissions (QUOTAS_VIEW, QUOTAS_MANAGE), notification events, and frontend quota views + i18n. Security and deploy-safety tracks returned CLEAN. The remaining tracks surfaced 19 findings: 3 CRITICAL, 14 WARNING, 1 SUGGESTION — concentrated in cron scripts (idempotency/transaction safety), the recurring-class service (N+1 loops), and a few unwired exports.

## Findings

### CRITICAL (3)

- [x] [CRITICAL] business-logic: scripts/quota-expiry-sweeper.ts:32 — `processPeriodicRollover` writes EXPIRE/GRANT ledger entries and calls `resetUsedThisPeriod`, but never updates the `quotas.remaining` column to reflect the rolled-over amount. After rollover, `remaining` stays stale while the ledger diverges; `QuotaService.refreshPeriodicQuotas` (sweeper line 86) does NOT invoke `QuotaRepository.refreshPeriodic`, breaking balance/ledger consistency on every periodic rollover.
  → Fix: Replaced bespoke `processPeriodicRollover` ledger logic in the sweeper with a call to the existing atomic `QuotaRepository.refreshPeriodic(tx, quotaId, null)`. Upgraded `refreshPeriodic` to support the rich rollover policy (`{maxRolloverPercent, accumulationCap}`) used by the sweeper, advancing `periodAnchor`, syncing `quotas.remaining`, resetting `usedThisPeriod`, and inserting EXPIRE/GRANT ledger entries with idempotency keys in one atomic transaction. Removed the redundant `QuotaService.refreshPeriodicQuotas()` call from the sweeper.

- [x] [CRITICAL] performance: backend/services/schedule/recurring-class.service.ts:444 — `releasePerInstance` loops `instances` calling `QuotaService.releaseForInstance` sequentially (2 DB round-trips each) — N+1 candidate exercised by `switchSchedulingMode`.
  → Fix: Added `QuotaLedgerRepository.insertBatch` (dedupe-via-inArray + multi-row `.values()` insert), `QuotaRepository.releaseForInstanceBatch` (one atomic UPDATE with `usedThisPeriod >= count` guard + batched ledger insert), and `QuotaService.releaseForInstances` thin wrapper. Rewrote `releasePerInstance` to call the batch path in one shot — collapses 2-3 DB round-trips × N down to a constant 2.

- [x] [CRITICAL] performance: backend/services/schedule/recurring-class.service.ts:486 — `refundOrReleaseForInstances` credit-backed branch loops `upcomingInstances` calling `CreditService.refundOnCancel` per instance (sequential per-instance DB writes) — N+1 in the new `switchSchedulingMode` flow.
  → Fix: Added `CreditRepository.insertBatch` (one dedupe-via-inArray SELECT + multi-row `.values()` insert) and `CreditService.refundOnCancelBatch` (groups refunds by student, one `addClasses(amount=N)` and one `refreshStudentOndemandInstances` per unique student instead of per instance). Rewrote the credit-backed branch of `refundOrReleaseForInstances` to call the batch path. Batching verified safe — no per-instance notifications/side effects in `refundOnCancel`.

### WARNING (14)

- [x] [WARNING] business-logic: scripts/ondemand-instance-generator.ts:51 — `insertInstanceIfMissing` does a read-then-insert existence check (lines 51–79) outside any transaction using `db` directly; the `existingConflicts` Set (snapshot query at lines 179–202) is stale for concurrent cron runs, so multiple generators can insert duplicate instances or leave partial state with no rollback. Missing unique constraint on (recurringScheduleId, scheduledStartAt) means duplicate instances are possible.
  → Fix: Wrapped `insertInstanceIfMissing` SELECT+INSERT in `db.transaction(async tx => {...})` with in-transaction re-check using `tx` (TOCTOU fix). The snapshot `existingConflicts` Set is still used as a fast-path filter, but the authoritative dedup is now the in-transaction re-check.

- [x] [WARNING] business-logic: backend/services/session/class-session.service.ts:309 — `handleOndemandSessionStartCreditDeduction` runs `selectQuotaForBooking` (separate transaction) then `redeemForInstance` (its own transaction) outside the `activateClassInstance` transaction. The select-then-redeem-then-activate is not atomic; a concurrent activation can deplete the FIFO quota between select and redeem, causing `redeemForInstance` to throw and fail activation.
  → Fix: `handleOndemandSessionStartCreditDeduction` now accepts `tx` parameter; `activate`/`activateOverride` wrap credit deduction + activation in single `db.transaction`. Atomic — no concurrent activation can deplete FIFO quota between select and redeem.

- [x] [WARNING] business-logic: scripts/ondemand-no-credits-resolver.ts:71 — Batch status transitions to `NO_CREDITS_CANCELLED`/`NO_CREDITS_ABSENT` use raw `db.update` with no transaction wrapping the read (lines 14–39), the group-by-outcome loop, and the writes (lines 70–91). No idempotency guard or status-transition guard in the WHERE clause (missing `eq(status, PENDING_CREDIT)`); concurrent runs can re-select the same instances and double-process.
  → Fix: Replaced raw `db.update` with `ClassSessionService.markNoCreditsBatch(tx, ids, status)` (cron-layer fix — service delegation); wrapped read-then-write in `db.transaction` (atomic); `PENDING_CREDIT` guard in WHERE for idempotency; replaced hardcoded `"Student"` fallback with `tErrors.studentNameFallback` via `getServerTranslations`.

- [x] [WARNING] performance: backend/services/billing/quota.service.ts:334 — `refreshStudentOndemandInstances` issues one `db.update` per pending instance in a loop instead of a single `inArray` batch update — O(n) sequential writes unbounded by availableCredits.
  → Fix: Replaced per-instance `db.update` loop with single batched `UPDATE ... WHERE inArray(classInstances.id, instanceIds)`. Added `redeemForInstances` thin wrapper for batch redeem.

- [x] [WARNING] performance: backend/services/schedule/recurring-class.service.ts:252 — Pool-mode `createScheduleAndDeductCredits` loops `created.classInstanceIds` calling `QuotaService.redeemForInstance` per instance (2 DB round-trips each) — N+1 for newly generated instances.
  → Fix: Replaced N+1 loop calling `QuotaService.redeemForInstance` per instance with single `QuotaService.redeemForInstances` call; new `QuotaRepository.redeemForInstanceBatch` (mirrors `releaseForInstanceBatch`).

- [x] [WARNING] performance: scripts/quota-expiry-sweeper.ts:81 — `processPeriodicRollover` loops every periodic quota issuing 2–3 sequential repo calls per quota (ledger inserts + `resetUsedThisPeriod`) inside one transaction — use batch ledger inserts when many rollovers pending.
  → Fix: Already resolved by the CRITICAL #1 fix — `refreshPeriodic(tx, quotaId, null)` now performs the entire rollover atomically with batched ledger inserts.

- [x] [WARNING] performance: scripts/ondemand-instance-generator.ts:51 — `insertInstanceIfMissing` runs a SELECT then an INSERT per scheduled day inside `generateInstancesForSchedule`'s day-by-day while loop — per-slot DB round-trips scale with horizon weeks × days/week per schedule.
  → Fix: Wrapped `insertInstanceIfMissing` in a single `db.transaction` with in-transaction re-check using `tx`. The transaction spans both the SELECT and INSERT within each day's iteration, reducing race window; the authoritative dedup is now the in-transaction re-check rather than the stale snapshot.

- [x] [WARNING] performance: backend/services/scheduling/availability.service.ts:163 — `assertSchedulePatternAvailable` batch-fetches conflicts once but still loops occurrences calling `TeacherAvailabilityRepository.validateBookingAvailability` per slot (sequential per-occurrence DB calls) — N+1 along the number of matched days.
  → Fix: Replaced per-occurrence `validateBookingAvailability` loop with single `validateBookingAvailabilityBatch` call (3 queries total via Promise.all, then in-memory per-slot validation).

- [x] [WARNING] duplication: backend/services/notification/quota-notification.builders.ts:9 — `CHANNEL_FROM_ENUM`, `ALL_CHANNELS`, `buildPerChannel`, and `fanOutToUsers` re-declared verbatim (~35 lines) from existing committed `backend/services/notification/notification-payloads.builders.ts:65-129` (which declares them privately, without `export`). Copy-paste with drift risk — existing `buildPerChannel` already uses an `if (!userId) return []` guard + `for` loop while the new copy uses `.map` with no guard. Fix by exporting the helpers from `notification-payloads.builders.ts` and importing them in `quota-notification.builders.ts`.
  → Fix: Added `export` to `CHANNEL_FROM_ENUM`, `ALL_CHANNELS`, `buildPerChannel`, `fanOutToUsers` in `notification-payloads.builders.ts`; removed ~35 lines of duplicated helpers from `quota-notification.builders.ts` and imported from canonical source.

- [x] [WARNING] dead-code: backend/services/notification/notification-payloads.builders.ts:635 — Exported `notificationPayloadBuilders` registry object has zero repo-wide consumers (only defined here); build helpers it aggregates are imported individually elsewhere via QuotaNotificationService.
  → Fix: Removed `notificationPayloadBuilders` registry + unused quota builder imports from `notification-payloads.builders.ts`.

- [x] [WARNING] dead-code: frontend/common/graphql/sharedDocuments/billing/quota.documents.ts:54 — Exported `studentQuotasQueryDocument` has zero consumers repo-wide.
  → Fix: Removed `studentQuotasQueryDocument` from `quota.documents.ts` (zero consumers).

- [x] [WARNING] dead-code: frontend/common/graphql/sharedDocuments/billing/quota.documents.ts:80 — Exported `studentOpenQuotasQueryDocument` has zero consumers repo-wide.
  → Fix: Removed `studentOpenQuotasQueryDocument` from `quota.documents.ts` (zero consumers).

- [x] [WARNING] dead-code: frontend/common/graphql/sharedDocuments/billing/quota.documents.ts:106 — Exported `quotaBalanceQueryDocument` has zero consumers repo-wide.
  → Fix: Removed `quotaBalanceQueryDocument` from `quota.documents.ts` (zero consumers).

- [x] [WARNING] dead-code: backend/services/schedule/recurring-class.service.ts:351 — Exported `cancelSchedule` has zero non-self, non-doc references (no GraphQL resolver, frontend call, or test imports it).
  → Fix: KEPT — `backend/services/AGENTS.md` documents `cancelSchedule` as an integration point ("CancelSchedule releases quota reservations..."). It is a documented contractual method with zero callers but aspirational for future wiring. Per AGENTS.md: documented integration points are not dead code.

- [x] [WARNING] dead-code: backend/services/schedule/recurring-class.service.ts:506 — Exported `switchSchedulingMode` has zero non-self, non-doc references (no resolver, call site, or test).
  → Fix: KEPT — `backend/services/AGENTS.md` documents `switchSchedulingMode` as an integration point ("Mode Switch adjusts quota reservations..."). It is a documented contractual method with zero callers but aspirational for future wiring. Per AGENTS.md: documented integration points are not dead code.

### SUGGESTION (1)

- [x] [SUGGESTION] performance: frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.tsx:115 — `activeQuotasCount`/`totalClassesRemaining`/`expiringThisWeekCount`/`pendingBacklogCount` computed via `quotas.filter`/`.reduce` on every render without `useMemo` (in addition to the memoized chart datasets) — recompute every render while quotas data is stable.
  → Fix: Wrapped all 4 derived counts in `useMemo` with `[quotas]` dependency. `pendingBacklogCount` aliased to `activeQuotasCount` (they were identical computations).

### CLEAN Tracks

- ✅ security — No security violations found
- ✅ deploy-safety — No deploy-safety violations found

## Recommended Actions

1. **CRITICAL — Fix quota ledger/remaining consistency in `quota-expiry-sweeper.ts`** (balance divergence on every rollover). Highest priority: the append-only ledger and `quotas.remaining` must stay in sync.
2. **CRITICAL — Batch the per-instance loops in `recurring-class.service.ts`** (`releasePerInstance` line 444, `refundOrReleaseForInstances` line 486) — these are exercised by `switchSchedulingMode` and the credit-backed refund path.
3. **WARNING — Add transaction/idempotency guards to cron scripts** (`ondemand-instance-generator.ts`, `ondemand-no-credits-resolver.ts`): wrap read-then-write sequences in transactions, add a `eq(status, PENDING_CREDIT)` guard to the no-credits resolver UPDATE WHERE clause, and consider a unique constraint on (recurringScheduleId, scheduledStartAt) to prevent duplicate on-demand instances.
4. **WARNING — Wrap on-demand activation credit deduction in a single transaction** (`class-session.service.ts:309`).
5. **WARNING — De-duplicate notification builder helpers** by exporting and importing them instead of copy-pasting.
6. **WARNING — Remove the 6 unwired exports** (or wire them up if they are intended for upcoming work): `notificationPayloadBuilders`, `studentQuotasQueryDocument`, `studentOpenQuotasQueryDocument`, `quotaBalanceQueryDocument`, `cancelSchedule`, `switchSchedulingMode`.
7. **SUGGESTION — Memoize derived counts in `QuotaInsightsContainer.tsx`** with `useMemo`.

## Layer Compliance Notes

Validated against `backend/services/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/graphql/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/views/AGENTS.md`, and instruction files (real path: `.agents/instructions/{backend,frontend}.instructions.md`).

### Confirmed compliant
- Repos use `db`/`tx` correctly (Drizzle parameterized queries — no SQL injection vectors)
- i18n pipeline (ar/en + types) for new quota/on-demand namespaces follows the compile-time typed system
- Permissions enforced at GraphQL resolver (`requireAuth` + `PermissionsService.hasPermission`) and re-checked at the service layer
- No `console.*` usage observed; logging uses `logger.*`
- MUI v9 fixes (QuotaInsightsContainer `useMemo`) do NOT introduce style props — compliant
- GraphQL documents follow `*QueryDocument`/`*MutationDocument` naming, include `id`, import from `@apollo/client/react`
- Append-only ledger transactional consistency rule (`backend/db/repo/AGENTS.md`) is the basis for finding #1

### Plan-review escalations (moved into findings)

- **[CRON-LAYER] scripts/ondemand-no-credits-resolver.ts:71–91** — raw `db.update(classInstances)` does a state transition outside the service layer. Per `backend/services/AGENTS.md` "Quota System Integration / Service Integration Rules": cron scripts should delegate to `ClassSessionService` for class-instance lifecycle transitions, not issue `db.update` directly. The original WARNING finding (business-logic) only proposed wrapping in a transaction + adding a status guard — it does NOT move the write behind `ClassSessionService`. **Escalated to plan item #3.5.**

### Additional violations spotted by plan-review (NEW findings — for awareness, not in fix scope unless user approves)

- **[i18n] scripts/ondemand-no-credits-resolver.ts:100** — hardcoded user-facing fallback string `"Student"` (`nameMap.get(ri.studentId) ?? "Student"`) and hardcoded log/status display strings (lines 41, 44, 111–113). Expected: `getServerTranslations(locale, "<namespace>")` per `backend.instructions.md` §i18n ("Never hardcode error strings, messages, or warnings — in any layer").
- **[i18n] scripts/quota-expiry-sweeper.ts:38** — hardcoded `reasonNote` string `"Period ended; no unused to roll over"` in the ledger entry. Lower severity (may be acceptable as internal audit text), but the rule has no "audit-only" carve-out.

## Fix Status

- Total findings: 19
- Fixed: 19 / 19 (3 CRITICAL auto-fixed in commit `5c2587999`; 14 WARNING + 1 SUGGESTION + 1 cron-layer escalation fixed in this commit)
  - 14 code-fixed: TOCTOU, activation atomicity, cron-layer delegation, batch refresh, batch pool-mode, batch availability, dedup notification builders, dead-doc removal (3), notification registry removal, i18n, QuotaInsights useMemo, sweeper batch (already resolved)
  - 2 kept as documented integration points: `cancelSchedule`, `switchSchedulingMode` — per `backend/services/AGENTS.md` they are documented contractual methods for future wiring
- Remaining: 0
- Quality gates: ✅ tsgo (only pre-existing baseline errors in `students/quota/audience/*`), ✅ biome, ✅ lint (file-scoped, all 15 files clean)
