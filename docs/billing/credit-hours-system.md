# Credit-Hours System

Canonical reference for the **student credit-hours accounting module** (plan: `.ai/plans/student-credit-hours-system`). It runs as a *parallel ledger* beside the class-quota system: quota ledger rows count **classes**, credit-hour ledger rows count **hours** (`credit_transactions.changeAmountHours`). Exactly one of `changeAmount` / `changeAmountHours` is set per row — enforced by a CHECK constraint, not application code.

## Architecture Overview

- **Parallel hour ledger**: `credit_transactions` rows with `changeAmountHours` (positive purchase/refund, negative deduction/adjustment). A partial CHECK (XOR) guarantees `changeAmount` and `changeAmountHours` are mutually exclusive; `hoursOnly` filters isolate hour rows.
- **Denormalized student balances**: `students.creditHoursTotal` / `creditHoursRemaining` (numeric, non-negative CHECK) updated inside the same transaction as ledger writes via `StudentRepository.adjustClassesQuota` (row-locked).
- **Package plans catalog**: `package_plans` — predefined hour bundles (codename unique among non-deleted via partial unique index; `version` optimistic lock; `validityMonths` optional shelf-life).
- **Accounting payments**: `payments` rows extended with `package_plan_id`, `payment_gateway`, `credit_hours`, `is_paid_status_on`, `payment_note` (+ indexes). `invoices.credit_hours` snapshots the granted hours. `InvoiceType.CREDIT_HOURS_PACKAGE` marks hour-package invoices.
- **Idempotency everywhere**: SHA-256 content-derived keys (payments + invoices + hour ledger). Duplicate submissions *return the existing row* instead of erroring.

## Data Model (delta)

| Table | Addition | Notes |
|---|---|---|
| `package_plans` | new table | codename/display_name/credit_hours/price_amount/currency/validity_months/active/sort_order/version/deleted_at |
| `payments` | +5 columns | package_plan_id FK, payment_gateway enum, credit_hours numeric, is_paid_status_on bool, payment_note text |
| `invoices` | +credit_hours | denormalized snapshot |
| `students` | +credit_hours_total/remaining | non-negative CHECKs |
| `credit_transactions` | XOR CHECK | exactly one of changeAmount / changeAmountHours |
| `class_instances` | +billed_unit | v1 scaffolding (no production writer yet) |
| enums | `payment_gateway`, `billed_unit`, `InvoiceType.CREDIT_HOURS_PACKAGE` | gateway canonical in `shared/constants/billing.enum.ts` |

Migrations 33 (permissions) + 34 (system settings) are additive.

## Service Layer

- `PackagePlanService` — CRUD with case-insensitive codename dedupe; archive (soft-delete) frees the codename; version bump on every update (optimistic lock).
- `AccountingPaymentService` — `recordPayment` (single tx: advisory lock → in-tx plan revalidation EC-2 → invoice reuse-or-create → payment insert with EC-1 23505 catch → hour ledger credit → student balance bump → fire-and-forget notification); `togglePaidStatus` (invoice lock + version check + auto-flip honoring `paid_toggle_auto_flips_invoice` + sibling-uniqueness EC-3); `update` (gateway/note vs creditHours-delta paths); `getBalance` (IDOR-guarded); `getHistory` (derived timeline: recorded / hours credited / hours adjusted / marked paid).
- `CreditService` hour extensions — unit-discriminated idempotency keys; `deductHoursForBooking` guards `hours > 0`.
- `AccountingNotificationService` — `ACCOUNTING_PAYMENT_RECORDED` (INFO) + `ACCOUNTING_LOW_HOURS` (REMINDER, threshold via `accounting_low_hours_threshold` setting, default 5); student + linked parent recipients.

## Permissions

`accounting.payments_view` / `accounting.payments_manage` (migration 33; granted to super_admin, academy_admin, staff_default). GraphQL resolvers gate manually via the loggedIn + requireAuth + PermissionsService pattern; pages gate via `withPageAuth` + `PAGE_PERMISSIONS`.

## GraphQL API

Queries: `packagePlans`, `packagePlan`, `accountingPayments` (filters: student/parent/date-range/unpaidOnly), `accountingPayment`, `studentCreditHourBalance`.
Mutations: `createPackagePlan`, `updatePackagePlan`, `archivePackagePlan`, `recordAccountingPayment`, `updateAccountingPayment`, `toggleAccountingPaymentPaidStatus`.
Frontend documents: `frontend/common/graphql/sharedDocuments/accounting/` (TypedDocumentNode style — repo codegen emits types+documents only, no hook wrappers; views use `useQuery(document)` from `@apollo/client/react`).

## Frontend Structure

- Routes: `app/(dashboard)/accounting/{payments,packages}/{,new,[id],[id]/edit}` — each gates permission server-side and switches desktop/mobile via `ResponsiveViewSwitch`.
- ViewModels: flat in `frontend/common/views/dashboard/accounting/` (`useXxxViewModel.ts`), Zustand filter store in `frontend/common/stores/`.
- Views: `frontend/desktop/views/dashboard/accounting/*.desktop.tsx`, `frontend/mobile/.../*.mobile.tsx`; shared scaffolds in `components/` (`PackagePlanSelectShared`, `DesktopListStateGate`).
- i18n: `dashboard.accounting.{payments,package-plans,student-credit-hours}` namespaces (+ EN/AR JSON snapshots); nav labels `accountingPayments[New]` / `accountingPackages[New]`.
- Student surface: profile tab `credit-hours` (`StudentCreditHoursTab`) — balance cards, consumed vs remaining, low-balance alert, recent hour activity.

## Testing Approach

- Repo tests: `backend/db/test/repo/billing/{package-plan,accounting-payment}.repository.test.ts` (rollback-tx pattern).
- Workflow tests: `backend/db/test/logic/lms/{credit-hours-workflow,accounting-payment-workflow}.test.ts` (committed fixtures + hard-delete cleanup, AGENTS rule 9).
- UI component tests: `test/ui/components/accounting/` (Happy-DOM; assertions only on i18n strings; Apollo documents mocked with exact variables).
- Runners: `bun run test:db`, `bun run test:services`, `bun run test:graphql`, `bun run test:ui:components`.

## Migration Path (for environments)

Migrations 33–34 cover enums/permissions/settings, but **column additions land via drizzle-kit push**, not SQL migrations. New environments need BOTH:

```bash
bun --no-env-file run scripts/dbActions/index.ts --env-file=.env.test migrate
bun --no-env-file run scripts/dbActions/index.ts --env-file=.env.test push --force
```

(Dev DB already had both; a migrate-only test DB misses `validity_months`/`version` and workflow tests fail with `column "validity_months" of relation "package_plans" does not exist`.)

## Relationship to the Quota System

See `docs/billing/quota-system.md`. The two ledgers co-exist per student: class-based quotas (FIFO, rollover) and hour-based packages (duration-driven deduction at booking). `class_instances.billed_unit` is the v1 discriminator scaffold for routing a booking to the correct ledger — hour writers arrive with Plan 6 (`student.billingMode`).

## Deferred Items

The authoritative list lives in [`.ai/plans/student-credit-hours-system/deferred-items.md`](../../.ai/plans/student-credit-hours-system/deferred-items.md). Headlines:

1. **D-1** — `student.billingMode` discriminator wiring `deductHoursForBooking` into production (v1 hour service methods are intentional dormant code — do NOT remove as unused).
2. **D-2** — Package plan → quota bridge (post-commit hook placeholder).
3. **D-3** — True refund-of-payment flow (v1 allows update-with-decrease only, under the balance floor).
4. **D-4** — Multi-currency hour ledger (v1 single numeric balance; UI soft-warning shipped).
5. **D-5** — Gateway webhook auto-recording (enum values exist, no integration yet).
