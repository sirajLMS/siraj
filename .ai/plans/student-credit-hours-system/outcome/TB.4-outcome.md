# TB.4 Outcome — Journey: hour deduction below threshold → low-hours notification (student + parent)

## Result: COMPLETE — 4 journey steps, all passing

## What was built

**Journey test**: `test/workflows/accounting/low-hours-notification.test.ts`.
No new or modified shared helpers — the TB.1 cast/notification/error helpers were reused as-is.

- Step 1 (funding): `AccountingPaymentService.recordPayment` (admin) funds the family with the
  cast's 10h package — same input shape as TB.1. Balance asserts confirm the starting point is
  strictly above the threshold.
- Step 2 (above-threshold deduction): `CreditService.deductHoursForBooking` invoked at the
  service level inside a caller-owned committed `db.transaction` (the sanctioned v1 path — no
  booking-side producer exists until Plan 6). Asserts the DEDUCTION hour-ledger row
  (`changeAmountHours = -N`, `changeAmount` null, `classInstanceId` set) and the denormalized
  balance. Then `AccountingNotificationService.maybeNotifyLowHours(studentId)` (the wiring entry
  point) is called — NO `ACCOUNTING_LOW_HOURS` payload is dispatched.
- Step 3 (below-threshold): second deduction on a second class instance lands the balance at
  `threshold - 1`. Student + linked parent read the reduced balance via the association-scoped
  `getStudentBalance`; `maybeNotifyLowHours` then dispatches to exactly student + parent —
  asserted with `waitForEventDispatchToUser` polling plus payload-aware target extraction.
- Step 4 (denial): over-deduction → `ConflictError` whose message contains the translated
  `tErrors.credit.insufficientHours({ studentId, remaining, required })` string; ledger row
  count and balance unchanged; alert target set unchanged.

## Reality checks (deviations from the task text — asserted as implemented)

- **Admin fan-out is NOT implemented** (deferred in Phase 12):
  `AccountingNotificationService.maybeNotifyLowHours` resolves recipients via
  `AccountingPaymentSupport.resolveHourLedgerRecipients` → student user + parent user only.
  The journey asserts admins/staff/unrelated are NOT targets, per the task's "assert reality"
  instruction. The plan's task text ("student + parent + admin") overshoots the v1
  implementation; the difference is documented here and in the test's header comment.
- **Threshold is seeded, not defaulted**: migration 34 persists
  `accounting_low_hours_threshold = 2.00`, so the notifier uses 2 (the `DEFAULT_LOW_HOURS_THRESHOLD = 5`
  fallback only applies when the row is absent, e.g. a fresh DB). The journey reads the live
  value via `resolveLowHoursThreshold()` (`@/backend/services/billing/accounting-settings.utils`)
  and derives deduction amounts from it instead of hardcoding.
- **`deductHoursForBooking` itself dispatches nothing.** The only production wiring of
  `maybeNotifyLowHours` is `AccountingPaymentService.update()` (negative-delta edit branch,
  `accounting-payment.service.ts:326`). The booking producer lands with Plan 6; the journey
  calls the notification entry point directly after committing the deduction, mirroring the
  intended post-commit wiring.

## Fixture notes for future journeys

- **Booking ledger idempotency is derived-key based**: `runIdempotentBookingLedgerOp` keys on
  `sha256(studentId|classInstanceId|operation|hour-unit)`, so two deductions on the SAME
  class instance are silent no-ops. Each successful deduction in a journey needs its OWN class
  instance row (`createMockClassInstance(tx, studentId, teacherId)`), which requires a teacher
  fixture (`createTestUser` + `createTestTeacher`). The test provisions teacher + 2 instances in
  a second committed transaction and hard-deletes them in `afterAll` BEFORE the cast cleanup
  (class instances reference the cast's student).
- **Enum comparison lint**: oxlint's `no-unsafe-enum-comparison` rejects
  `row.reason === CreditReason.DEDUCTION` on Drizzle string columns, while
  `no-unnecessary-type-conversion` rejects the `String(...) === String(...)` recipe when the
  column type is already `string`. `CreditReason.DEDUCTION.valueOf()` satisfies both.
- Since `maybeNotifyLowHours` is awaited directly in the journey, its internal
  `dispatchWithPreferences` call completes synchronously — the TB.1 polling helper is still used
  (returns immediately) and costs nothing; absence assertions need no settle wait.

## Verification

- `bun run test/scripts/run-test.ts test/workflows/accounting/low-hours-notification.test.ts`
  — 4 pass / 0 fail / 27 expects (twice: initial run and after the enum-comparison lint fix).
- `bun run test:workflows` — 27 pass / 0 fail across 5 files (TB.1, TB.2, TB.3 unaffected;
  shared helpers untouched).
- `bun run scripts/health/sub-loop.ts test/workflows/accounting/low-hours-notification.test.ts --lifecycle codescene`
  — all stages green (tsgo → oxlint → biome → lint → duplicates → codescene).

No product bugs found; no product code touched.
