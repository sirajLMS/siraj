# TB.2 Outcome — Override → Settlement Lifecycle Journey

## Summary

`test/workflows/payroll/override-to-settlement-lifecycle.test.ts` (493 lines, 11 steps) is written, gated, and green. The journey drives one class instance through the full money lifecycle — teacher telemetry → terminal auto-calculation (CALCULATED 120.00 SAR) → operator Partially-50% override (PARTIALLY 60.00 SAR) → idempotent duplicate override → lesson-report approval accruing `teacher_dues` from the OVERRIDDEN amount with the WAITING_PAID flip in the same transaction → operator settlement against a recorded `teacher_payments` row (PAID flip + teacherPaymentId link in the same transaction) → audit-trail and cross-actor visibility checks → denial paths on PAID and WAITING_PAID rows. A second instance walks CALCULATED → approval → WAITING_PAID and proves the unforced-override denial leaves state, due, and audit trail untouched.

## Files

- **Created** `test/workflows/payroll/override-to-settlement-lifecycle.test.ts` — the journey (11 tests).
- **Modified** `test/workflows/payroll/DIAGRAMS.md` — appended the journey's `sequenceDiagram` section.
- **Bookkeeping** this outcome file + TB.2 checkbox in `trackable-tasks.md`.
- No product code, no helper, no schema, no git changes.

## Journey steps (what each proves)

| Step | Proves |
|---|---|
| 1 | Teacher activate + start, operator stop commits COMPLETED + CALCULATED 120.00 in one transaction. |
| 2 | `applyOverride` Partially 50% rewrites the snapshot to 60.00 / 50% / operator note / `payrollCalculatedBy` operator with a `PAYROLL_OVERRIDE` audit event. |
| 3 | Identical re-submission inside the 30 s idempotency window returns the SAME `auditEventId`; exactly one `PAYROLL_OVERRIDE` row persists. |
| 4 | `submitReport` + `approveReport` accrue `teacher_dues` with amount == OVERRIDDEN `teacherPaidAmount` (60.00, hours "1"), flip the instance to WAITING_PAID in the same transaction, clear `isPartialPercentage` on the row (schema CHECK), keep the money, and fan out `LESSON_REPORT_REVIEWED` to the teacher. |
| 5 | Teacher-facing surfaces: `getPendingDues` shows the 60.00 PENDING due with zero override internals (no note, no payroll keys, no PARTIALLY, no audit ids); `getMonthlyReport` (own-teacher path) shows approvedCount 1 / due 60 / paid 0; `getClassInstanceDetail` carries none of the 8 payroll keys (TB.1 strip fix). |
| 6 | Operator inserts a committed `teacher_payments` CASH-payout fixture and runs `markAsPaid`: due → PAID + teacherPaymentId link, instance → PAID, money immutable; teacher's pending queue drains and the monthly report flips to paid 60 / due 0. |
| 7 | Audit trail: `getClassStatusEvents` (operator) returns exactly [settlement, accrual, override, auto-calc] transitions newest-first; raw `class_status_events` rows attribute all four payroll events to the operator's `actorUserId`. |
| 8 | Denials: override on the PAID row → `tErrors.payroll.alreadyPaid` (`DomainError PAYROLL_ALREADY_PAID`), state untouched; teacher override attempt → `tErrors.insufficientPermissions` (MANAGE gate). |
| 9 | Second instance: `activateOverride` + `updateStatusAbsent` → COMPLETED + CALCULATED 120.00. |
| 10 | Approval moves it to WAITING_PAID with a full-pay 120.00 due. |
| 11 | Unforced override on the WAITING_PAID row → `tErrors.payroll.awaitingSettlement` (`DomainError PAYROLL_AWAITING_SETTLEMENT`); instance stays WAITING_PAID, due stays PENDING, zero `PAYROLL_OVERRIDE` events. |

## Verification evidence

- **Journey run** (mandatory runner `bun run test/scripts/run-test.ts test/workflows/payroll/override-to-settlement-lifecycle.test.ts`): **11 pass / 0 fail / 83 expect() calls**, exit 0 — reproduced twice (second run confirms deterministic green + full self-cleanup).
- **Full suite** `bun run test:workflows`: **69 pass / 0 fail / 566 expect() calls across 10 files** (was 58/0 before TB.2; the suite remains fully green).
- **Static gates** `bun run scripts/health/sub-loop.ts <test file> --lifecycle codescene`: exit 0 (tsgo, oxlint, biome:check, lint:type-aware, check:duplicates, codescene all pass) on the final file version.
- **Diagrams** `bun run validate:mermaid test/workflows/payroll/DIAGRAMS.md`: both blocks OK.
- **No e2e runs** (per session constraint) and no `runInRollback` (workflow-layer canon).
- **DB hygiene**: post-suite scan (against the `.env.test` database) confirms zero leftover `jrn_settle_%` users/categories/subjects, zero orphan audit rows.

## Key service facts verified (for TB.3+)

- Denial codes: PAID → `PAYROLL_ALREADY_PAID` (message `tErrors.payroll.alreadyPaid`); WAITING_PAID without `force` → `PAYROLL_AWAITING_SETTLEMENT` (message `tErrors.payroll.awaitingSettlement`); both thrown in `applyOverrideWithinTransaction` BEFORE the idempotency check, so a rejected attempt writes nothing.
- `academy_admin` (bootstrap migration group `7ad65f85…`) holds `lesson_reports.approve`, `teacher_dues.mark_paid`, and `accounting.payroll.{view,manage}` — the single operator drives override + approval + settlement.
- Teacher visibility surface used: `TeacherDueService.getPendingDues(actorUserId, teacherId, locale)` and `getMonthlyReport(actorUserId, teacherId, year, month, locale)` — both allow the teacher's own-teacher path via `assertCanViewDues` (no `TEACHER_DUES_VIEW` needed); neither returns override internals. Monthly aggregates key on the due's `approvedAt` (UTC window), so the test derives the month from the committed due row.
- `teacher_payments` fixture requires a `PaymentMethodTransactionSnapshot` (typed literal: CASH + `PaymentDirection.PAYOUT` + `details: { note: string }` — `CashDetails`); FK to `teachers` is ON DELETE RESTRICT, so the fixture must be deleted before cast cleanup.

## Finding: successful overrides mirror into append-only `audit_logs`

`applyOverride` best-effort mirrors every fresh override into `audit_logs` (`AuditService.createManyAuditLogs`, actor = operator). `audit_logs` carries a DB trigger `prevent_audit_log_mod_trigger` (BEFORE UPDATE OR DELETE … RAISE) that makes the rows immutable, and `audit_logs.actor_user_id` is FK ON DELETE SET NULL toward `users` — so deleting the cast users trips the trigger and aborts `cleanupPayrollJourneyCast`. The journey's `afterAll` follows the established precedent (`test/workflows/billing/credit-adjustment-security.test.ts`): `ALTER TABLE audit_logs DISABLE TRIGGER prevent_audit_log_mod_trigger` → delete this run's audit rows → cast cleanup → re-enable in `finally`. Not a product bug — working-as-designed compliance immutability; the first (pre-fix) run's aborted cleanup leaked one cast graph into the test DB, which was surgically removed with a scratch script (verified clean).

## Carry-forwards for TB.3

- Reuse `provisionPayrollJourneyCast` / `cleanupPayrollJourneyCast` unchanged; the cast already gives the operator payroll view+manage, the teacher nothing payroll-related.
- TB.3's denials (teacher/parent/student on query + mutation + CSV) never perform a SUCCESSFUL override, so no `audit_logs` rows appear and the trigger-disable dance is NOT needed there — only journeys that land real overrides (or other audit-writing actions) must repeat the afterAll pattern above.
- The denial codes + translated messages to assert: `insufficientPermissions` (permission gate), `PAYROLL_ALREADY_PAID` → `tErrors.payroll.alreadyPaid`, `PAYROLL_AWAITING_SETTLEMENT` → `tErrors.payroll.awaitingSettlement`.
- `getClassStatusEvents` returns `{ id, eventType, description, createdAt }` only (newest-first, DESC on createdAt) — actor attribution requires a raw `class_status_events` read; D22 (event-surface exposure decision) still open for TB.5.
- Teacher monthly-report assertions must derive year/month from the committed `approvedAt` (UTC), never wall clock.

## Cross-file dependencies

- None blocking. Informational: any future cast helper change that lets journeys apply successful overrides should consider absorbing the audit-trigger sweep into `cleanupPayrollJourneyCast` (left out now to honor the prefer-none helper boundary).
