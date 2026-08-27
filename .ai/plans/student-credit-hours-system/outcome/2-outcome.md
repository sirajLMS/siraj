# Task 2 Outcome — Backend types + repositories

## Summary
All Phase 2 subtasks (2.1–2.11) implemented. tsgo back to baseline (2 pre-existing storybook errors) after fixes. Per-file sub-loop codescene verification running at outcome-write time (master log /tmp/subloop-p2-master.log).

## Files created
- backend/types/billing/package-plan.types.ts — Select/Insert/SubmitInput/UpdateInput (UpdateInput carries optional optimistic-lock version)
- backend/types/billing/accounting-payment.types.ts — AccountingPaymentSelectType ($inferSelect), Filter, Submit/Update/TogglePaid inputs, joined AccountingPaymentReturnType, BalanceReturnType
- backend/db/repo/billing/package-plan.repository.ts — create/findById/findByCodename(case-insensitive via lower())/listActive/listAllPaginated/update(optimistic-lock, mirrors adjustClassesQuota Error-style mismatch)/archive/generateIdempotencyKey(sha256)
- backend/db/repo/billing/accounting-payment.repository.ts — create(with full backward-compatible defaults incl. PaymentMethodType.CASH + PAYIN transaction snapshot), findById+listPaginated joined selection w/ users alias for parentName, AND-combined filters (studentId/parentId/fromDate/toDate inclusive/unpaidOnly), countForFilter, findPaidSiblingsByInvoice(exclude), findByIds, update, generateIdempotencyKey(studentId|planId|amount|currency|ISO date|gateway; empty-string for null plan per EC-18)

## Files modified
- backend/types/billing/index.ts (+2 exports), credit.types.ts (+CreditHourTransactionSubmitInput, CreditHourBalanceReturnType)
- backend/db/repo/billing/index.ts (+2 exports)
- backend/db/repo/billing/credit.repository.ts — insertCreditTransaction refactored to XOR-aware single helper (asserts exactly-one of changeAmount/changeAmountHours; DomainError CREDIT_XOR_VIOLATION); added createHourPurchase / deductHoursForBooking(negative hours) / refundHoursOnCancel(positive) / getHourBalance (students table read). Existing class methods unchanged.
- backend/db/repo/students/student.repository.ts — addCreditHours/deductCreditHours/getCreditHourBalance via existing adjustClassesQuota (auto acquires acquireStudentLock inside tx → pre-check INSIDE tx per EC-13/15); insufficient → ConflictError(tErrors.credit.insufficientHours(...))
- shared/locale/types/errors/index.ts — CreditErrors.insufficientHours({studentId,remaining,required}); NEW PackageErrors {codenameAlreadyExists, invalidInput, planArchived}; ErrorsLabels.package property
- shared/locale/en/errors/index.ts + ar/errors/index.ts — implementations (insufficientHours + package namespace)
- backend/db/schema/billing/package-plans.ts — ADDED missing version column integer NOT NULL default 0 (required by optimistic lock; spec table omission fixed; db re-pushed)

## Verification
- tsgo full: 2 errors = baseline only ✓
- drizzle-kit push #2 applied (package_plans.version) ✓

## DEVIATIONS (documented)
1. PackagePlanRepository.update throws plain Error(version mismatch message) mirroring repo-precedent adjustClassesQuota; plan test text expected ConflictError — service layer will normalize to ConflictError at API boundary.
2. Accounting payment snapshot uses legitimate CASH/PAYIN PaymentMethodTransactionSnapshot (gateway recorded in `label` field) instead of fabricating a new union member — keeps jsonb column type contract intact.
3. Numeric write-path: changeAmountHours stored via String(hours) (numeric inferInsert=string). Reads convert with Number() at service layer.
4. Read params typed tx?: DBTransaction (repo convention) — not the unknown-narrowing Parameters<> alias tried initially.

## Carry-forward knowledge
1. queryDb() param must be DBTransaction|undefined — never an alias resolving to unknown.
2. payments.paymentMethodSnapshot is strict union — build full object (CashDetails={{note?}} path used here).
3. users aliases must be unique per query builder instance (drizzle alias naming); prefix acct_parent_users_*.
4. ErrorsLabels now include credit.insufficientHours + package.* — service layer (Task 3) consumes them directly.
5. Filter dates are ISO YYYY-MM-DD strings; toDate extended to 23:59:59.999Z inclusive.
6. XOR helper returns DomainError before touching DB — keep both insert paths (helper & insertBatch) consistent if touched later.
