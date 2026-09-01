# TB.5 Outcome — 4-Tier verification audit: accounting / credit-hours surface

## Result: COMPLETE — 21 gaps found, all filled; 62 test results added; full regression green

Runner: `bun run test/scripts/run-test.ts <file>` per file; final `bun run test:db`
= 102 files / 1011 tests / 0 fail. GraphQL additions verified via
`bun run test/scripts/run-server-tests.ts frontend/common/graphql/test/billing/accounting.test.ts`
(8/8). Every touched file passes `scripts/health/sub-loop.ts --lifecycle lint`.

## Coverage matrix (per production file)

Legend: ✅ covered (pre-existing Phase 10 / TB.1–TB.4), 🆕 covered by TB.5 additions, — documented exclusion.

### backend/db/repo/billing/package-plan.repository.ts — Tier 1 ✅ (+7 tests)
- `create` defaults (description/validityMonths/metadata/active/sortOrder `??` branches) ✅; explicit-optional-fields branch 🆕
- `findById` found ✅ / missing→null 🆕
- `findByCodename` case-insensitive ✅ / missing→null 🆕 / Tier 4 wildcard-LIKE injection literals return null 🆕
- `listActive` excludes archived ✅ / excludes non-archived inactive 🆕
- `listAllPaginated` null + paginated args 🆕
- `update` happy + version mismatch + unguarded + missing→null ✅/🆕
- `archive` happy ✅ / missing→null 🆕
- `generateIdempotencyKey` deterministic + case-normalized ✅
- Excluded: "insert returned no rows" throw (unreachable without fault injection).

### backend/db/repo/billing/accounting-payment.repository.ts — Tier 1 ✅ (+6 tests)
- `create` (note null/present variants) ✅
- `findById` found ✅ / missing→null 🆕
- `listPaginated` filter branches: studentId ✅, parentId ✅, fromDate+toDate combined ✅, fromDate-only + toDate-only (bounds isolated) 🆕, unpaidOnly ✅, empty filter (no-conditions branch) 🆕
- `countForFilter` filtered count + 0-for-no-match + `{}` via service ✅(empty)/🆕
- `findPaidSiblingsByInvoice` exclude-self + unpaid exclusion ✅
- `findByIds` empty→[] / multi-id / unknown→[] 🆕
- `findLastPaymentCurrency` null ✅ / newest-by-date ✅ / same-date createdAt tiebreak 🆕
- `update` happy patch + missing→null 🆕
- `generateIdempotencyKey` (EC-18 "" / null equivalence) ✅

### backend/db/repo/billing/credit.repository.ts (hour methods) — Tier 1/2 ✅ (+6 tests)
- `getHourBalance` facets ✅ / zero-string facets for missing student 🆕 / `resolveStudentScope` invalid-args throw 🆕
- `getTransactions` / `countTransactions` `hoursOnly` isolation (XOR) ✅
- `listBySourcePaymentId` createdAt ordering + cross-payment isolation + unknown→[] 🆕
- `createHourPurchase` happy (+ null notes) ✅
- `deductHoursForBooking` zero ✅ / negative 🆕 / NaN 🆕 rejected; fractional positive ✅
- `refundHoursOnCancel` keyed replay (unique constraint) ✅ / negative input stored positive (`Math.abs`) 🆕
- `createHourAdjustment` positive + negative signed deltas, `changeAmount` NULL ✅(via service)/🆕(direct)
- Excluded: `insertCreditTransaction` XOR-violation throw (unreachable from public methods — all callers set exactly one facet); global-executor string-tx overloads (unsafe to exercise under rollback).

### backend/db/repo/students/student.repository.ts (hour methods) — Tier 1/2 ✅ (+7 tests)
- `addCreditHours` bump total+remaining ✅ / returned-row facets + version self-increment 🆕 / not-found 🆕 / `expectedVersion` mismatch 🆕
- `deductCreditHours` happy/fractional ✅ / insufficient typed payload ✅ / exact-zero boundary (remaining === amount) 🆕 / not-found 🆕 / version mismatch 🆕
- `getCreditHourBalance` facets ✅ / `"0"`/`"0"` defaults for unknown id ✅(balance-surface)/🆕(direct)
- Excluded: bare-`db` (no tx) branch — commits outside rollback; twin class methods share the code path.

### backend/services/billing/package-plan.service.ts — Tier 1 + Tier 4 (+9 tests 🆕, all new)
- `create` happy (trim + upper-case normalization) / all 5 `validateSubmitInput` branches (blank codename, blank displayName, hours ≤ 0, hours NaN, price ≤ 0) / case-insensitive duplicate → `codenameAlreadyExists`
- `update` happy with version / unknown id / archived → `planArchived`
- `archive` happy / missing / double-archive
- Tier 4: `create`/`update`/`archive` denied without `ACCOUNTING_PAYMENTS_MANAGE` (`insufficientPermissions`)
- `getById` hit/miss; `ensureManyByCodename` create + existing + in-batch duplicate; `listActive` vs `listPaginated` visibility split

### backend/services/billing/credit.service.ts (hour methods) — Tier 1 + Tier 4 (+6 tests 🆕, plus TB.4 journey)
- `recordHourPurchase` happy (row + facets) / same-key replay returns existing (no double-credit) / 0 / negative / NaN → `ValidationError`
- `deductHoursForBooking` ≤ 0 → `ValidationError` 🆕 / happy + above-threshold ✅(TB.4) / derived-key replay no-op 🆕 / insufficient → `ConflictError` ✅(TB.4)
- `refundHoursOnCancel` happy restore + derived-key replay no-op 🆕
- `getStudentHourBalance` super-admin + student-self + linked-parent reads 🆕 / unrelated caller denied (IDOR) 🆕 / unknown student not-found 🆕

### backend/services/billing/accounting-payment.service.ts — Tier 1 + Tier 4 (+4 tests 🆕)
- `recordPayment` happy/replay/gateway-split/archived-plan ✅; invalid amount (0, −1) / hours (0, NaN) 🆕; unknown student 🆕; parent-less student → `invalidInput` 🆕; unpaid input → invoice UNPAID + paidDate null 🆕
- `togglePaidStatus` sibling rule / optimistic lock / auto-flip setting ✅(TB.2); unknown id → not-found 🆕
- `update` note-only / +delta / −delta / past-balance conflict ✅(Phase 10 + TB.3); unknown id → not-found 🆕
- `getHistory` PAYMENT_RECORDED + MARKED_PAID + HOURS_CREDITED + ±HOURS_ADJUSTED, ascending order, unrelated-caller denial 🆕
- `getById` / `listPaginated` / `getStudentBalance` association + IDOR ✅(Phase 10 / TB.1)
- Excluded: 23505 concurrent-race catch fallback (requires fault injection; behaviorally covered by replay tests).
- Post-merge note: TB.6 added `MAX_PAYMENT_AMOUNT` / `MAX_PAYMENT_CREDIT_HOURS` caps to `recordPayment` — re-verified green after merge.

### backend/services/notification/accounting-notification.builders.ts — Tier 1 ✅ (+5 tests 🆕)
- Both builders: empty `affectedUserIds` → `[]`; per-user × 4-channel fan-out (WhatsApp excluded — no approved template); eventType + category (`INFO` / `REMINDER`); title/body interpolation of all params; metadata passthrough; locale honored (`ar`).
- (`AccountingNotificationService.maybeNotifyLowHours` `/` `notifyPaymentRecorded` — covered by TB.4/TB.1 journeys with spied dispatch.)

### backend/graphql/query/billing/accounting.query.ts + mutation/billing/accounting.mutation.ts — Tier 1 + Tier 4 (+8 tests 🆕, GraphQL integration)
- `packagePlans` activeOnly=true (listActive) + null (listPaginated); `packagePlan` found; `accountingPayments` filtered; `accountingPayment` detail incl. history; `studentCreditHourBalance` facets + lastPaymentCurrency
- All 6 mutations happy path with FULL argument coverage (optionals exercised both non-null and null): create/update/archive package plan (incl. stale-version conflict), record/update/toggle payment (note-only edit, paid flip → UNPAID cascade)
- Tier 4: teacher token (no accounting perms) denied on all 6 mutations; cross-family parent denied on `accountingPayment` / `studentCreditHourBalance` / `accountingPayments` (scoped and unscoped); injection-shaped `filter.studentId` (`' OR '1'='1' --`) returns an error, never rows; zero/negative hours and negative amount rejected.
- Post-merge note (TB.6): resolver gates now `requirePermission(…)` → `FORBIDDEN`; service-level duplication in `backend/services`; both surfaces verified green post-merge. The deeper pen-test matrix lives in `frontend/common/graphql/test/accounting/accounting-security.test.ts` (owned by TB.6 — not duplicated here).

## Files touched

Modified (existing Phase 10 files extended):
- `backend/db/test/repo/billing/package-plan.repository.test.ts` (6 → 13 tests)
- `backend/db/test/repo/billing/accounting-payment.repository.test.ts` (4 → 10)
- `backend/db/test/repo/billing/credit.repository.test.ts` (22 → 28)
- `backend/db/test/repo/students/student.repository.test.ts` (13 → 20)
- `backend/db/test/logic/lms/accounting-payment-workflow.test.ts` (6 → 10)

New:
- `backend/db/test/logic/lms/package-plan-service.test.ts` (9 tests; committed fixtures + hard-delete cleanup)
- `backend/db/test/logic/lms/credit-service-hours.test.ts` (6 tests; rollback for tx-owned methods, committed fixtures for `getStudentHourBalance` auth)
- `backend/services/notification/accounting-notification.builders.test.ts` (5 tests; pure builders, no I/O)
- `frontend/common/graphql/test/billing/accounting.test.ts` (8 tests; dev-server integration, two provisioned families)

## Environment hazard worth recording

Mid-run, the concurrent payroll branch added `class_instances.calculatedDuration` to the Drizzle schema before generating the migration, so `setupTestEntities`/`createMockClassInstance` inserts failed on `siraj_test` (`42703`, schema-wide `.returning()`). `credit-service-hours.test.ts` therefore inserts its class-instance rows with an explicit-column raw-SQL statement (`insertBareClassInstance` in the file) — durable both before and after that migration lands. No production code was changed; no product bugs were found by this audit.

## Verification

- Each new/modified file: `bun run test/scripts/run-test.ts <path>` green (after lint-driven edits re-run, all still green).
- `bun run scripts/health/sub-loop.ts <path> --lifecycle lint` green for all 9 files (two oxlint fixes: `toSorted` over `sort`, hoisted comparator; two sonarjs fixes: `localeCompare` comparator, dropped redundant `undefined` arg).
- `bun run test:db` — 102 files / 1011 tests / 0 failures (after TB.6 merges).
- GraphQL suite re-run after TB.6 resolver/service merge — 8/8 green.
