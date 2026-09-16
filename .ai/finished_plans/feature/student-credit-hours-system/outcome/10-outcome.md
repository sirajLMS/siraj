# Phase 10 Outcome — Backend Tests

## Result: COMPLETE — 21 tests, all passing
Runner: `bun run test/scripts/run-test.ts <file>` (project process-lock/log capture).

| File | Tests |
|---|---|
| backend/db/test/repo/billing/package-plan.repository.test.ts | 6 |
| backend/db/test/repo/billing/accounting-payment.repository.test.ts | 4 |
| backend/db/test/logic/lms/credit-hours-workflow.test.ts | 5 |
| backend/db/test/logic/lms/accounting-payment-workflow.test.ts | 6 |

Coverage highlights
- create/case-insensitive codename/listActive excludes archived/version-mismatch conflict message/archive frees codename/deterministic idempotency keys.
- AND-combined filters incl. inclusive date bounds + parent scoping; paid-siblings probe excludes self/unpaid; EC-18 "" substitution for null planId.
- Hour ledger atomic bump (SQL expression), typed insufficient-hours payload equality, keyed-idempotent refund replay rejection, XOR co-existence of class+hour ledgers & hoursOnly isolation, zero-hour booking rejected, fractional -0.50 honored.
- Service workflows on committed fixtures: invoice+payment+ledger single-tx, replay returns existing row, archived-plan rejection mid-flight, sibling-aware toggle auto-flip honoring setting, stale expectedInvoiceVersion ConflictError, note-only vs hour-edit adjustment behaviour, insufficient-hours on decrease, IDOR guards for balance/list.

## PRODUCTION BUGS FOUND & FIXED while writing these tests
1. `AccountingPaymentSupport.findByIdempotencyKeys` built an invalid drizzle `IN ${array}` template — always missed → duplicate submissions crashed instead of returning existing row. Fixed to `inArray(...)`.
2. `recordPayment` blindly inserted invoices sharing a content-derived idempotency key (gateway splits) → 23505. Now reuses-or-creates invoice inside tx via new `findInvoiceByIdempotencyKey`.
3. `resolveAssociatedViewer` treated NULL primaryTeacherId as association for unrelated callers (null === null) → IDOR hole. Absence no longer matches.
4. `PackagePlanRepository.update` never bumped version — optimistic lock was inert; now self-increments.
5. `deductHoursForBooking(hours<=0)` silently wrote zero rows → DomainError guard added.

Regression sweep after fixes: `bun run test:db` = 96 files / 947 tests PASS.

## Deviations (documented)
- Plan's generic-string expectation for plan version conflicts kept as localized "version mismatch" error at repo layer (no tErrors threading in repo signatures); service-level typed errors already cover invoice paths.
- Workflow tests use committed fixtures + explicit hard-delete cleanup (AGENTS rule 9) because services open their own top-level transactions and resolve permissions against committed data.
