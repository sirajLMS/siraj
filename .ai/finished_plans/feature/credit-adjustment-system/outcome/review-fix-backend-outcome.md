# Review Follow-up Outcome — Backend findings (post-implementation review)

- **Status**: ✅ Done
- **Date**: 2026-08-30

Scope: the eight backend findings from the post-implementation review of the
Credit Adjustment System. Frontend findings are owned by a parallel agent; the
SQLite drizzle mirror drift was explicitly out of scope.

## Per-finding summary

### 1. [HIGH] Replay-before-guards (`credit.service.ts`)

Moved the in-transaction idempotency pre-check
(`CreditRepository.findByIdempotencyKeys`) to immediately after the advisory
lock, BEFORE `assertActiveStudentExists` / `assertTeacherExists` /
`assertSufficientClasses`. A replay of a legitimately executed adjustment now
returns the original persisted row even if the balance was drained or the
referenced entities changed since the first submit — instead of throwing
`INSUFFICIENT_CLASSES` / `TEACHER_NOT_FOUND` / `STUDENT_NOT_FOUND`. Lock-first
ordering is intact; the `executeAdjustmentTransaction` JSDoc documents the new
ordering. Regression test: "a replay after the balance was drained returns the
first row instead of failing the balance guard".

### 2. [HIGH] Actor participates in the idempotency key

`deriveAdjustmentIdempotencyKey(actorUserId, input)` — the actor user id is a
new first parameter and the second hashed segment (between the
`credit-adjustment` namespace prefix and `studentId`). Two distinct operators
submitting the same carryover now derive distinct keys and each persist their
own ledger row (spec E14); same-actor double-submit still collapses
(double-click guard). `notes` remain excluded (retry tolerance). The inverted
JSDoc on `CreditAdjustmentIdempotencyInput` was corrected: the exclusion means
a retried submission whose only difference is the reason text STILL collapses
onto the persisted row — the old comment claimed the opposite. The three call
sites in `credit.service.ts` pass `actorUserId`.

### 3. [MEDIUM] `approvedByUserId` in the carryover handoff insert

`carryover-handoff.ts` — added `approved_by_user_id` to the INSERT column list
(values bound from `payload.approvedByUserId`, parameterized as before). The
table-existence probe and the no-op guards are unchanged. The handoff test now
asserts the column name in the rendered SQL and the approver id in the bound
parameter order.

### 4. [LOW] Service-side hours bounds

`validateAdjustmentInput` now requires `Number.isInteger(hours)` plus
`1 <= hours <= 100_000`, mirroring the Pothos Int/1..100000 constraint for
non-GraphQL callers. (`Number.isInteger` also subsumes the old `isFinite`
check.) New table-driven case: `hours = 100_001` rejected.

### 5. [LOW] `requireCarryoverBlock` returns the trimmed teacher id

The guard trimmed for presence but returned the untrimmed original; it now
returns `teacherId: carryoverTeacherId.trim()` (via a pre-narrowed local).

### 6. [LOW] Replay observability symmetry

`executeAdjustmentTransaction` now returns `{ row, createdNewRow }`; the
post-commit `logger.info` + `emitAdjustmentAudit` in `runAdjustment` run only
when a new ledger row was actually persisted. Both replay paths (in-tx
pre-check hit and the 23505 recovery) now stay silent — no duplicate audit
entries for collapsed re-submits. Journey recounts: TB.1 step 7 audits 3 → 2
(Add + Subtract only), TB.2 step 8 audits 6 → 5 (seed Add + 4 carryovers; the
collapsed resubmission audits nothing). The mocked service suite asserts the
same (replay and concurrent-collapse tests each expect exactly 1 audit entry).

### 7. [LOW] Plan tag removed

`backend/db/schema/billing/credit-transactions.ts` — the `(Task 1.2 / EC-9)`
suffix removed from the XOR-constraint comment.

### 8. [LOW] Stale comment corrected

`backend/types/billing/credit.types.ts` — `CreditAdjustmentInput.notes` now
reads "Operator-supplied rich-text reason; sanitized by the service before
persistence." (sanitization happens later, in the service). The
`CreditAdjustmentInsertInput.notes` comment stays as-is — accurate there.

## Files changed

- `backend/services/billing/credit-adjustment.idempotency.ts` — actor param + corrected JSDoc
- `backend/services/billing/credit.service.ts` — findings 1, 2 (call sites), 4, 5, 6
- `backend/services/billing/carryover-handoff.ts` — finding 3
- `backend/db/schema/billing/credit-transactions.ts` — finding 7
- `backend/types/billing/credit.types.ts` — finding 8
- `backend/services/billing/credit-adjustment.idempotency.test.ts` — actor arg threaded through all 45 call sites; new actor-sensitivity describe (distinct operators → distinct keys; same operator → same key)
- `backend/services/billing/credit-adjustment.service.test.ts` — actor-aware helper + key assertions, STUDENT_NOT_FOUND lookup count 0 → 1 (pre-check now precedes the guard), audit-count assertions on replay/concurrent collapse, new drained-balance replay test, new two-operator E14 test, new `hours > 100_000` validation case
- `backend/services/billing/carryover-handoff.test.ts` — approver column + param assertion
- `test/workflows/billing/credit-adjustment-student-visibility.test.ts` — derived-key assertion now includes the actor; audit recount 3 → 2
- `test/workflows/billing/credit-adjustment-carryover.test.ts` — audit recount 6 → 5

`test/workflows/billing/credit-adjustment-security.test.ts` was reviewed and
needs NO changes: its replay probes are same-actor (key still collapses), and
it asserts no audit counts.

## Sub-loop results (`--lifecycle codescene`, all exit 0)

| File | Result |
|---|---|
| `backend/services/billing/credit-adjustment.idempotency.ts` | exit 0 |
| `backend/services/billing/credit-adjustment.idempotency.test.ts` | exit 0 |
| `backend/services/billing/credit.service.ts` | exit 0 |
| `backend/services/billing/credit-adjustment.service.test.ts` | exit 0 |
| `backend/services/billing/carryover-handoff.ts` | exit 0 |
| `backend/services/billing/carryover-handoff.test.ts` | exit 0 |
| `backend/db/schema/billing/credit-transactions.ts` | exit 0 |
| `backend/types/billing/credit.types.ts` | exit 0 |
| `test/workflows/billing/credit-adjustment-student-visibility.test.ts` | exit 0 |
| `test/workflows/billing/credit-adjustment-carryover.test.ts` | exit 0 |

## Test results (`bun run test/scripts/run-test.ts`)

| Suite | Before | After |
|---|---|---|
| `backend/services/billing/credit-adjustment.idempotency.test.ts` | 20 pass | **22 pass / 0 fail** (199 expect) |
| `backend/services/billing/credit-adjustment.service.test.ts` | 39 pass | **42 pass / 0 fail** (272 expect) |
| `backend/services/billing/carryover-handoff.test.ts` | 9 pass | **9 pass / 0 fail** (18 expect) |
| `test/workflows/billing/credit-adjustment-student-visibility.test.ts` | 7 pass | **7 pass / 0 fail** (73 expect) |
| `test/workflows/billing/credit-adjustment-carryover.test.ts` | 8 pass | **8 pass / 0 fail** (72 expect) |
| `test/workflows/billing/credit-adjustment-security.test.ts` | 8 pass | **8 pass / 0 fail** (43 expect) |

`bun run test:workflows` (full suite): **50 pass / 1 fail / 419 expect()** across 8
files. All credit-adjustment journeys green (TB.1 7/7, TB.2 8/8, security 8/8).
The single failure is the known pre-existing, payroll-owned
`test/workflows/scheduling/lesson-report-lifecycle.test.ts` cleanup failure
(`class_status_events` RESTRICT FK in its afterAll) — reproduces independently
of this change; not in scope.

## Notes

- E14 is now exercised at BOTH layers: mocked service suite (two operators,
  same payload → two rows, distinct keys, two audits) and the TB.2 journey
  step 5 (two operators, distinct payloads, concurrent → both commit).
- The known pre-existing failure in
  `test/workflows/scheduling/lesson-report-lifecycle.test.ts` (payroll-owned
  `class_status_events` cleanup) is unrelated to this change.
