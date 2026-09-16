# TB.3 Outcome — Journey: admin edits payment creditHours → ADJUSTMENT ledger + family visibility

## Result: COMPLETE — 8 journey steps, all passing

## What was built

**Journey test**: `test/workflows/accounting/edit-payment-hours-adjustment.test.ts`
(admin edits a paid hour-package payment's creditHours; upward edit writes a +5 ADJUSTMENT
hour-ledger row and bumps both balance facets, decrease-within-balance writes a -3 ADJUSTMENT
row, student + linked parent observe every change, unrelated family sees nothing,
note/gateway-only edits write NO ledger row, decrease past balance → ConflictError,
no-MANAGE actors denied pre-tx).

- Step 1 (baseline): `AccountingPaymentService.recordPayment` 10h → 1 PURCHASE row, student facets 10/10.
- Step 2 (increase): `AccountingPaymentService.update` 10→15 (+ gateway + note) → second ledger row
  (`reason` ADJUSTMENT, `changeAmountHours` = +5, `changeAmount` NULL, `sourcePaymentId` = payment,
  `creditedByUserId` = admin, notes mirrored), facets 15/15, invoice denormalized
  `creditHours` synced to 15.
- Step 3 (visibility): student + linked parent see 15/15 and both ledger entries via
  `getStudentBalance` + `CreditService.getStudentTransactions(..., { hoursOnly: true })`.
- Step 4 (decrease within balance): 15→12 → negative ADJUSTMENT row (−3); facets
  `{ total: 15, remaining: 12 }` — clawbacks touch ONLY `creditHoursRemaining`,
  `creditHoursTotal` keeps the historical grant; family observes 12 remaining + 3 ledger rows.
- Step 5 (side effects): two no-op-editing variants (creditHours omitted; creditHours present but
  equal to the stored value) both stay on the single-statement path — NO new ledger row,
  balance untouched, gateway/note updated.
- Step 6 (isolation): unrelated student/parent denied on `getStudentBalance` / `getById` /
  `listPaginated` / `getStudentTransactions` (`tErrors.insufficientPermissions`); their own hour
  ledger stays empty (no bleed).
- Step 7 (denial — decrease past balance): simulated booking consumption via direct repo
  deduction (`StudentRepository.deductCreditHours` inside a committing `db.transaction`, the
  Phase-10 logic-test precedent — v1 has no booking-side producer and a class-instance fixture
  adds nothing), remaining 12→1; edit 12→1 implies a −11 delta →
  `ConflictError` with the exact message
  `tErrors.credit.insufficientHours({ studentId, remaining: 1, required: 11 })`;
  full tx rollback asserted (ledger count, facets, payment row unchanged).
- Step 8 (denial — permission): `staffViewer` (VIEW, no MANAGE) and unrelated parent both denied
  on `update` with `tErrors.insufficientPermissions` before any write.

## Reused (untouched)

- `provisionAccountingJourneyCast` / `cleanupAccountingJourneyCast` — used as-is; **no cast-helper
  changes were needed**, so TB.1/TB.2 are unaffected (verified by full `test:workflows` run).
- `expectJourneyError` from `journey-errors.ts` for all negative paths.
- `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([])` in
  `beforeAll` + `mockRestore()` in `afterAll` — required even though this journey asserts no
  notifications: `recordPayment` fires ACCOUNTING_PAYMENT_RECORDED and decrease edits fire
  `maybeNotifyLowHours`; the spy keeps everything off real channels.

## Pitfalls / notes for TB.4

1. **oxlint `unicorn/consistent-function-scoping`** — file-level helpers that close over NOTHING
   (`hourLedgerRows`, `readStudentBalanceFacets`) must live at module scope, not inside the
   `describe` block. (TB.1's `submitInput` survives inside because it closes over `PREFIX`/`cast`.)
2. **oxlint `no-unsafe-enum-comparison`** — raw `db.select()` rows type `reason` as `string`;
   comparing with `=== CreditReason.X` inside `.find`/`.filter` fails lint. Use a string-typed
   constant, mirroring `accounting-payment.service.ts`:
   `const ADJUSTMENT_REASON: string = CreditReason.ADJUSTMENT;` then `row.reason === ADJUSTMENT_REASON`.
   (`toBe(CreditReason.X)` on expectations is fine — no comparison operator.)
3. `AccountingPaymentService.update` semantics: `creditHours` omitted OR equal to stored value →
   gateway/note-only branch (single statement, NO tx advisory lock, NO ledger); any real delta →
   per-student advisory lock, balance move (add bumps total+remaining; deduct touches remaining
   only), one signed ADJUSTMENT row, invoice credit-hours snapshot sync.
4. "Decrease past balance" needs hours consumed between record and edit — direct
   `StudentRepository.deductCreditHours` in a committing `db.transaction` is the sanctioned
   simulation (matches `backend/db/test/logic/lms/accounting-payment-workflow.test.ts`);
   `CreditService.deductHoursForBooking` requires a real `classInstances` FK row.
5. The ADJUSTMENT row's idempotency key derives from the payment's `updatedAt`, so sequential
   edits in one test never collide.

## Verification

- `bun run test/scripts/run-test.ts test/workflows/accounting/edit-payment-hours-adjustment.test.ts`
  — 8 pass / 0 fail / 77 expects (run twice: before and after lint fixes).
- `bun run test:workflows` — 27 pass / 0 fail across 5 files (TB.1 + TB.4 journeys unaffected).
- `bun run scripts/health/sub-loop.ts test/workflows/accounting/edit-payment-hours-adjustment.test.ts --lifecycle codescene`
  — tsgo, oxlint, biome, lint:type-aware, duplicates, codescene all green.

## Files

- NEW: `test/workflows/accounting/edit-payment-hours-adjustment.test.ts`
- No other files modified (cast helper unchanged; no product bugs found).
