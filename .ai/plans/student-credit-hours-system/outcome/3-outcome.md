# Task 3 Outcome — Services layer

## Summary
All Phase 3 subtasks implemented; tsgo back to baseline (2 storybook errors, unrelated).

## Files created
- backend/services/billing/package-plan.service.ts — create/update/archive/getById/listActive/listPaginated; MANAGE-permission writes; case-insensitive codename ConflictError; ValidationError package.invalidInput guards
- backend/services/billing/accounting-payment.service.ts — recordPayment (single tx: advisory lock student_*, EC-2 plan re-validation INSIDE tx, idempotent return-existing per US-2.1#4 + unique-violation EC-1 catch, invoice CREDIT_HOURS_PACKAGE w/ PAID/UNPAID+paidDate semantics, payment row, hour ledger purchase, addCreditHours bump), togglePaidStatus (advisory lock invoice_* BEFORE read, optimistic expectedInvoiceVersion→ConflictError(invoiceVersionMismatch), system setting accounting_paid_toggle_auto_flips_invoice honored inside tx, EC-3 paid-sibling check), update (gateway/note-only = single UPDATE; creditHours delta = ADJUSTMENT ledger row via createHourAdjustment + addCreditHours/deductCreditHours with insufficient-hours floor), getById/listPaginated/getStudentBalance with assertAssociatedOrManage IDOR scoping (VIEW)
- backend/db/repo/billing/accounting-payment-helpers.ts — AccountingPaymentSupport: findByIdempotencyKeys, findStudentById(id,parent), findInvoiceById, findPackagePlanById, createInvoice (typed), updateInvoicePaidFields(version-guarded + version bump), updateInvoiceCreditHours

## Files modified
- backend/db/repo/billing/index.ts (+accounting-payment-helpers export)
- backend/db/repo/billing/credit.repository.ts (+createHourAdjustment ADJUSTMENT rows)
- backend/services/billing/index.ts (+accounting-payment.service, +package-plan.service)
- backend/services/billing/credit.service.ts — deriveBookingIdempotencyKey unit-discriminator ("hour-unit" suffix prevents class/hour key collision); IdempotentBookingLedgerOp.unit plumbing; NEW recordHourPurchase (caller-tx, return-existing), deductHoursForBooking (pre-check inside tx → ConflictError insufficientHours), refundHoursOnCancel, getStudentHourBalance (Plan 6 scaffolding — documented intentional dead code)
- backend/types/billing/package-plan.types.ts (+PackagePlanReturnType alias)
- services/billing/accounting-payment.service.ts — parentId narrowed hoist into local (closure-safe typing)

## Verification
tsgo full-repo: 2 errors = pre-existing baseline only ✓

## DEVIATIONS / notes
1. Payment-not-found uses tErrors.billing.invoiceNotFound id until a dedicated payments error label exists (candidate for Phase 5 follow-up).
2. recordPayment requires parent-linked students (invoices.parent_id NOT NULL constraint) — non-parented students rejected with package.invalidInput v1.
3. Silence-risk learned: ai_backend batch/edit can report ok:true while an ambiguous hunk no-ops — ALWAYS re-grep target after each patch.
4. Idempotency keys: payments `acctpay-…`, invoices `acctinv-…`, ledger purchase suffix `:ledger-hour-purchase`, edits prefixed `acct-edit-`.
5. Adjustments leave credit_hours_total untouched (mirrors classes semantics where total=purchases-only).
