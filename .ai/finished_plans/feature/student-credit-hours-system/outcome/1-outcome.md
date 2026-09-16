# Task 1 Outcome — Schema, enums, permissions, GraphQL enum registration

## Summary
All Phase 1 subtasks (1.1–1.16) implemented and verified against the dev PostgreSQL database.

## Files created
- backend/db/schema/billing/package-plans.ts — package_plans table; partial unique codename index (WHERE deleted_at IS NULL); active/sort index; deleted_at index; 3 CHECK constraints
- backend/enum/billing/package-plan.enum.ts — PaymentGateway + BilledUnit TS enums
- backend/db/migration/33-accounting-permissions-and-enums.sql — ALTER TYPE ADD VALUEs (idempotent), DO-guarded CREATE TYPE payment_gateway/billed_unit, permission rows (trigger-guarded), group grants
- backend/db/migration/34-credit-hours-system-settings-seed.sql — 3 accounting system settings upsert

## Files modified
- backend/db/schema/billing/index.ts (+package-plans export)
- backend/db/schema/billing/credit-transactions.ts — changeAmount relaxed to nullable; changeAmountHours numeric(12,2); XOR CHECK; (studentId,changeAmountHours) index
- backend/db/schema/billing/billing.ts — payments: packagePlanId FK(set null)/paymentGateway(NOT NULL default NONE)/creditHours/isPaidStatusOn/paymentNote + 3 indexes; invoices: creditHours numeric
- backend/db/schema/students/students.ts — creditHoursRemaining/Total numeric(12,2) NOT NULL DEFAULT "0.00" + 2 CHECKs; also added the two columns to the directory listing select to satisfy StudentDirectory Omit-type derivation
- backend/db/schema/classes/scheduling.ts — classInstances.billedUnit nullable enum column (v1 scaffolding, see carry-forward)
- backend/db/schema/enums.ts — paymentGatewayEnum + billedUnitEnum via createPgEnumFromEnum
- shared/constants/billing.enum.ts — InvoiceType.CREDIT_HOURS_PACKAGE added HERE (NOT backend/enum/billing/billing.enum.ts as the task text suggested — InvoiceType actually re-exports from @/shared/constants/billing.enum; deviation documented)
- backend/enum/permissions/permission.enum.ts — ACCOUNTING_PAYMENTS_VIEW/MANAGE
- backend/graphql/pothos/shared/enum.pothos.ts — PaymentGatewayPothosObject/BilledUnitPothosObject registered
- backend/services/monthly-appraisal/test/monthly-appraisal.service.test.ts — buildMockStudentSelect got creditHoursRemaining/Total (required by schema-derived type)

## Verification
- tsgo: back to baseline (2 pre-existing storybook errors, none new)
- db push --force: Changes applied ✓
- migrate: applied custom_33 + custom_34 ✓ (Ensure Enum Values Committed pre-executor handled enum adds)
- DB checks: package_plans exists; all new columns present w/ correct nullability; all 4 enums contain new values; 6 CHECK constraints present; partial unique index def confirmed; permission rows + 5 grants correct; 3 system_settings rows seeded; behavioral test: inserting credit_transaction with BOTH amounts NULL correctly rejected by XOR chk

## Carry-forward knowledge
1. **apply_patch quirk**: remote ai_backend apply_patch does NOT strip leading "+" on Add File blocks — use write_file for new files, apply_patch only for Update hunks.
2. **db CLI is interactive**: run push directly `bun --no-env-file --env-file=.env x drizzle-kit push --force --config drizzle.config.ts` and migrate via `bun --no-env-file --env-file=.env run backend/db/scripts/migrate.ts`.
3. **permissions.key is enum-typed (app_permission)** — SQL LIKE requires key::text cast.
4. **Migration numbering**: free numbers were 33/34 (last was 32). 9a/9b-style enum/data split unnecessary here — Ensure Enum Values Committed pre-executor handles same-batch ADD VALUE safely.
5. SystemSettingDataType literals are lowercase ('string','integer','boolean','json'); categories lowercase too.
6. students table RLS + protect-triggers exist — inserts via repos unaffected.
7. StudentReturnType-based types auto-gained the 2 new student columns → any hand-built full-row mock/select needs them (monthly-appraisal test fixed as example).
8. BillingRepository.acquireInvoiceLock pattern — reference for Phase 3 advisory locks.

## Cross-file dependencies discovered
- backend/types/students/student.types.ts unchanged (derives automatically).
- Upcoming Phase 2 must import packagePlans/accounting enums from schema/barrels exactly as declared here.
