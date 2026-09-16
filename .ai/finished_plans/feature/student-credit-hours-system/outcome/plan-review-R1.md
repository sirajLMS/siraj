# Plan Review — R1 (Plan 1: Student Credit-Hours System)

- **Review Date**: 2026-08-12
- **Reviewer**: spec-driven-development plan-review agent
- **Plan Path**: `/home/z/my-project/siraj-clone/.ai/plans/student-credit-hours-system/`
- **Files Reviewed**: `specs.md` (453 lines), `implementation.md` (856→981 lines), `trackable-tasks.md` (373→389 lines)
- **Outcome**: ✅ All violations fixed in-place. No design/approach changes.

---

## 1. Methodology

Each of the 8 review dimensions was verified against the live codebase at `/home/z/my-project/siraj-clone/`. Key files inspected:

| File | Verification Purpose |
|------|----------------------|
| `frontend/common/views/dashboard/config/navigationConfig.ts` | Sidebar groups (`grp_finance` exists; `grp_accounting` is new) |
| `frontend/common/types/page-permissions.types.ts` | `PAGE_PERMISSIONS` flat-map pattern |
| `backend/enum/permissions/permission.enum.ts` | Dot-notation permission pattern (`billing.create_invoice` etc.) |
| `backend/db/schema/billing/credit-transactions.ts` | `changeAmount` integer NOT NULL — must be relaxed to nullable |
| `backend/db/schema/billing/billing.ts` | `payments` table has NO `package` / `paymentGateway` columns yet |
| `backend/db/schema/students/students.ts` | Has `classesRemaining` + `classesTotal` (integers), NO credit-hours columns |
| `backend/db/schema/classes/scheduling.ts` | `classInstances` has `actualStartAt`, `actualEndAt`, `executionState`, `outcome` |
| `backend/db/schema/teachers/teachers.ts` | `hourlyRate` (numeric 12,2) + `rateCurrency` confirmed |
| `backend/db/schema/enums.ts` | Uses `createPgEnumFromEnum()` utility, NOT raw `pgEnum()` |
| `backend/utils/db.utils.ts` | `createPgEnumFromEnum(name, tsEnum)` helper |
| `backend/enum/billing/credit.enum.ts` | `CreditReason` enum (PURCHASE/DEDUCTION/REFUND/ADJUSTMENT) confirmed |
| `backend/enum/billing/billing.enum.ts` | `InvoiceType` enum (PER_CLASSES/MONTHLY/MANUAL) — extend with CREDIT_HOURS_PACKAGE |
| `backend/services/billing/credit.service.ts` | `CreditService` namespace pattern confirmed; uses `deriveBookingIdempotencyKey` |
| `backend/db/repo/students/student.repository.ts` | Existing `addClasses(studentId, tErrors, amount=1, expectedVersion?, tx?)` signature |
| `backend/services/billing/permission-utils.ts` | `requirePermission` + `assertAssociatedOrManage` helpers |
| `backend/graphql/pothos/shared/enum.pothos.ts` | Uses `gqlSchemaBuilder.enumType(TsEnum, { name })` pattern (NOT pgEnum) |
| `backend/graphql/pothos/billing/index.ts` | Flat-file pattern (`billing-alerts.pothos.ts`, etc.) — NO `types/queries/mutations` subdirs |
| `backend/db/migration/3-system_permissions_and_groups.sql` + `6-lms-permissions-and-groups.sql` | Permission seed migration pattern (`ALTER TYPE app_permission ADD VALUE IF NOT EXISTS`) |
| `frontend/common/graphql/sharedDocuments/index.ts` | Per-domain subdirectory + barrel pattern |
| `frontend/common/graphql/sharedDocuments/billing/credit-lms.documents.ts` | Document naming (`<opName>QueryDocument`), `gql`+`TypedDocumentNode` from `@apollo/client` |
| `frontend/common/graphql/AGENTS.md` §27-29 | `useQuery` (NOT `useLazyQuery`) + import from `@apollo/client/react` |
| `frontend/desktop/AGENTS.md` | `frontend/desktop/views/dashboard/<domain>/*.desktop.tsx` mandatory `dashboard/` segment |
| `frontend/mobile/AGENTS.md` | Same pattern with `.mobile.tsx` suffix |
| `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts` | ViewModel naming (`useXxxViewModel.ts`) + flat under `dashboard/<domain>/` |
| `frontend/common/stores/adminBillingStore.ts`, `quotaStore.ts` | Zustand stores flat in `frontend/common/stores/` (no subdirs) |
| `frontend/common/views/dashboard/students/profile/studentProfileTabs.ts` | `STUDENT_PROFILE_TABS = ["profile","status","classes","quota","history"]` |
| `app/(dashboard)/lib/resolve-students-page-audience.ts` | `resolveStudentsPageAudience` helper exists |
| `shared/locale/types/index.ts` | Root locale barrel — has `export * from "./dashboard/billing";` |
| `shared/locale/types/dashboard/billing/` | Per-feature split files: `main.ts`, `manual.ts`, `payment.ts`, `quota.ts`, etc. |
| `shared/locale/types/dashboard/core/nav.ts` | `DashboardNavigationLabels` interface (`navGroupFinance`, etc.) |
| `shared/locale/types/errors/index.ts` | `CreditErrors` interface exists; NO `PackageErrors` interface |
| `package.json` | `locale:snapshots` (plural), `db` CLI via `scripts/dbActions/index.ts` |
| `backend/db/schema/shared/settings.ts` | `system_settings` table exists with `key`/`value`/`dataType`/`category` |

---

## 2. Violations Found & Fixed

### 2.1 Paths Existence — 7 fixes

| # | Original (wrong) | Fixed (correct) | Files |
|---|------------------|-----------------|-------|
| P1 | `frontend/desktop/views/accounting/PaymentsListView.tsx` etc. | `frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.tsx` (mandatory `dashboard/` segment + `.desktop.tsx` suffix per `frontend/desktop/AGENTS.md`) | `implementation.md` Phase 8, `trackable-tasks.md` 8.4-8.6 |
| P2 | `frontend/mobile/views/accounting/...` | `frontend/mobile/views/dashboard/accounting/*.mobile.tsx` | `implementation.md` Phase 8, `trackable-tasks.md` 8.7 |
| P3 | `frontend/common/views/accounting/viewmodels/PaymentsListViewModel.ts` (and 2 others) | `frontend/common/views/dashboard/accounting/usePaymentsListViewModel.ts` (etc.) — existing ViewModels are hooks named `useXxxViewModel.ts` flat under `dashboard/<domain>/` | `implementation.md` Phase 8, `trackable-tasks.md` 8.1-8.2, 9.1 |
| P4 | `frontend/common/stores/accounting/useAccountingPaymentsStore.ts` | `frontend/common/stores/accountingPaymentsStore.ts` (flat structure, no subdirs) | `implementation.md` Phase 8, `trackable-tasks.md` 8.3 |
| P5 | `frontend/common/graphql/sharedDocuments/accounting.documents.ts` | `frontend/common/graphql/sharedDocuments/accounting/accounting.documents.ts` + new `index.ts` barrel — per `frontend/common/graphql/AGENTS.md` each domain has its own subdirectory | `implementation.md` Phase 6, `trackable-tasks.md` 6.1-6.3 |
| P6 | `frontend/common/views/students/profile/tabs/StudentCreditHoursTab.tsx` | `frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx` — no `tabs/` subdir exists; `dashboard/` prefix required | `implementation.md` Phase 8, `trackable-tasks.md` 7.6 |
| P7 | `backend/db/seeds/permissions/` (referenced for seed grants) | `backend/db/migration/<N>-accounting_permissions_and_groups.sql` — directory does NOT exist; permission seeds live as SQL migrations | `implementation.md` §1.8, `trackable-tasks.md` 1.10 |

### 2.2 i18n Compliance — 4 fixes

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| I1 | Plan edits `shared/locale/types/dashboard/index.ts` — file does NOT exist | Edit `shared/locale/types/index.ts` (the actual root barrel) — add `export * from "./dashboard/accounting";` | `implementation.md` Phase 7, `trackable-tasks.md` 5.5 |
| I2 | Navigation labels (`navGroupAccounting`, `accountingPayments`, `accountingPackages`) not assigned a home — plan only creates `dashboard/accounting/` namespace | Explicitly add them to `shared/locale/types/dashboard/core/nav.ts` `DashboardNavigationLabels` interface (alongside existing `navGroupFinance`, `billingAdmin`) | `implementation.md` Phase 7, `trackable-tasks.md` 5.6, `specs.md` Sidebar Navigation Placement |
| I3 | Plan says "Add error labels to errors/index.ts" but didn't make explicit that a NEW `PackageErrors` interface + `package: PackageErrors` property on `ErrorsLabels` is required (no existing `package.*` namespace) | Added explicit `PackageErrors` interface definition + instruction to add `readonly package: PackageErrors;` to `ErrorsLabels`. Also: extend existing `CreditErrors` with `insufficientHours` | `implementation.md` Phase 7, `trackable-tasks.md` 5.9 |
| I4 | Plan said payment-gateway labels go in `shared/locale/types/ui/index.ts` "or a new `accounting/shared.ts`" (ambiguous) | Make it concrete: gateway labels live in `shared/locale/types/dashboard/accounting/payments.ts` as a `gateways` record (co-located with accounting labels) | `implementation.md` Phase 7, `trackable-tasks.md` 5.1 |

### 2.3 GraphQL Accuracy — 2 fixes

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| G1 | Plan creates `backend/graphql/pothos/types/billing/`, `queries/billing/`, `mutations/billing/` subdirectories — these don't exist anywhere in the codebase | Single flat file `backend/graphql/pothos/billing/accounting.pothos.ts` (matching existing `billing-alerts.pothos.ts`, `billing-management.pothos.ts`, `credit.pothos.ts` flat-file pattern); barrel edit on `backend/graphql/pothos/billing/index.ts` | `implementation.md` Phase 5, `trackable-tasks.md` 4.1-4.2 |
| G2 | Plan section 6 implied codegen hooks are hand-authored under `frontend/common/graphql/hooks/accounting/` (no such directory exists) | Clarify hooks are AUTO-GENERATED by `graphql-codegen` into `frontend/common/graphql/generated/gql/`; import from `@/frontend/common/graphql/generated/gql` | `implementation.md` Phase 6, `trackable-tasks.md` 6.4 |

### 2.4 Component Props — 0 fixes

The plan does not contain any concrete JSX with MUI v9-style props (`align=`, `mt=`, `color=` directly on Typography/Stack/Box). Phase 8 task descriptions now explicitly call out the `sx={{...}}` requirement to prevent future violations.

### 2.5 Permissions/Enums — 3 fixes

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| E1 | Plan §1.6 used raw `pgEnum("payment_gateway", [...])` and `pgEnum("billed_unit", [...])` — every existing enum in `backend/db/schema/enums.ts` uses `createPgEnumFromEnum(name, tsEnum)` utility instead | Use `createPgEnumFromEnum("payment_gateway", PaymentGateway)` and `createPgEnumFromEnum("billed_unit", BilledUnit)` | `implementation.md` §1.6, `trackable-tasks.md` 1.6 |
| E2 | Plan §1.6 redefined `invoiceTypeEnum` as a raw `pgEnum("invoice_type", [...])` — would have clobbered the existing `createPgEnumFromEnum("invoice_type", InvoiceType)` registration | The existing `createPgEnumFromEnum("invoice_type", InvoiceType)` line in `enums.ts` automatically picks up the new `CREDIT_HOURS_PACKAGE` value when added to the TS `InvoiceType` enum; NO edit needed in `enums.ts` for `invoiceType`. SQL migration must `ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'CREDIT_HOURS_PACKAGE'` | `implementation.md` §1.6, §1.8, `trackable-tasks.md` 1.6, 1.8 |
| E3 | Plan §1.7 said "Register new enums in `backend/graphql/pothos/shared/enum.pothos.ts`" but didn't show how — and the existing file registers TypeScript enums (not Drizzle pgEnum objects) via `gqlSchemaBuilder.enumType(TsEnum, { name })` | Added explicit code sample registering `PaymentGateway` + `BilledUnit` TS enums via `gqlSchemaBuilder.enumType` | `implementation.md` §1.7, `trackable-tasks.md` 1.11 |

Permission values `accounting.payments_view` + `accounting.payments_manage` correctly follow the existing dot-notation pattern (e.g., `billing.create_invoice`). Enum names `ACCOUNTING_PAYMENTS_VIEW` / `ACCOUNTING_PAYMENTS_MANAGE` follow the existing SCREAMING_SNAKE_CASE pattern. No conflicts with existing permissions.

### 2.6 Existing Components — 1 fix

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| C1 | Plan referenced `resolveStudentsPageAudience` helper but didn't give its import path | Confirmed helper exists at `app/(dashboard)/lib/resolve-students-page-audience.ts`; import via `@/app/(dashboard)/lib/resolve-students-page-audience`. Also confirmed student profile tab registry is `frontend/common/views/dashboard/students/profile/studentProfileTabs.ts` (NOT a `tabs/` directory) | `implementation.md` Phase 8, `trackable-tasks.md` 7.6, 8.9 |

### 2.7 Architecture Compliance — 1 fix

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| A1 | Plan created `types/billing/`, `queries/billing/`, `mutations/billing/` subdirectories under `backend/graphql/pothos/` — violates existing flat-file pattern | Single file `backend/graphql/pothos/billing/accounting.pothos.ts` | `implementation.md` Phase 5, `trackable-tasks.md` 4.1 (same fix as G1) |

Service-layer types correctly placed in `backend/types/billing/` (e.g., `package-plan.types.ts`, `accounting-payment.types.ts`, `credit.types.ts` edit). No service-layer `.types.ts` files. Barrel `export *` pattern correctly used. Layer order (schema → repo → service → pothos → types → frontend) preserved.

### 2.8 Cross-Reference Consistency — 1 fix

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| X1 | specs.md AC US-4.1 (Epic 4: Hour-Based Class Booking) requires wiring `class_instances.billedUnit = HOUR_CREDIT` into recurring-schedule generation + class-instance activation — but no task in trackable-tasks.md implements this integration (only the CreditService method addition in 3.2). The trigger condition depends on Epic 6's `student.billingMode` discriminator which is deferred. | Added SCOPE NOTE in specs.md clarifying that v1 implements only the CreditService primitives (`deductHoursForBooking` / `refundHoursOnCancel`) via Task 3.2 + schema (1.5) + TS enum (1.7). The full scheduling-side wiring is deferred to a follow-up plan that depends on Epic 6. | `specs.md` Epic 4 US-4.1 |

All other ACs (US-1.1, US-1.2, US-2.1, US-2.2, US-3.1, US-3.2, US-5.1) have explicit corresponding tasks:
- US-1.1 / US-1.2 → Task 9 (Package Plans CRUD) + Task 3.1 (PackagePlanService)
- US-2.1 → Task 3.3 (AccountingPaymentService.recordPayment) + Task 8.6 (form view)
- US-2.2 → Task 3.3 (togglePaidStatus) + Task 8.5 (detail view)
- US-3.1 → Task 8.4 (PaymentsListView)
- US-3.2 → Task 3.3 (update) + Task 8.5/8.6
- US-5.1 → Task 8.9 (StudentCreditHoursTab) + Task 11.4 (test)

---

## 3. Other Minor Fixes

- **`bun db push` → `bun run db push`** and **`bun db migrate` → `bun run db migrate`** in `implementation.md` Phase 1.9 + trackable-tasks.md 1.13 (the `db` script in `package.json` launches `scripts/dbActions/index.ts` CLI; `run` is the canonical form).
- **`locale:snapshot` → `locale:snapshots`** in `implementation.md` Phase 7 + trackable-tasks.md 5.10 (the actual script name in `package.json` is plural).
- **`bun codegen` → `bun run codegen`** in trackable-tasks.md 4.3 + 6.5 (canonical form).
- **`StudentRepository.addCreditHours` / `deductCreditHours` signature** updated to match existing `addClasses`/`deductClasses` signature pattern: `(studentId, tErrors, hours, expectedVersion?, tx?)` (the existing pattern includes `expectedVersion` for optimistic lock, which the plan originally omitted).
- **`.agents/skills/frontend-patterns/SKILL.md`** referenced in 3 places — file does NOT exist. Closest match is `.agents/skills/review-frontend/SKILL.md`. Fixed references in `specs.md`, `implementation.md` Phase 12 + `trackable-tasks.md` 14.5.

---

## 4. Verification

After fixes, ran grep to confirm no remaining violations:

```bash
# Verify no raw pgEnum usage remains
grep -n 'pgEnum("payment_gateway"\|pgEnum("billed_unit"\|pgEnum("invoice_type"' \
  specs.md implementation.md trackable-tasks.md
# Result: 0 matches ✅

# Verify no wrong frontend paths remain
grep -n 'frontend/common/views/students/profile/tabs\|pothos/types/billing/\|pothos/queries/billing/\|pothos/mutations/billing/\|sharedDocuments/accounting\.documents\.ts\b\|frontend/desktop/views/accounting/\|frontend/mobile/views/accounting/\|frontend/common/stores/accounting/\|frontend/common/views/accounting/' \
  specs.md implementation.md trackable-tasks.md
# Result: 0 matches ✅ (only corrective "does not exist" notes remain)
```

---

## 5. Design & Approach — NOT Changed

Per the review instructions, the following design decisions were NOT modified:
- Two parallel ledgers sharing `credit_transactions` table (XOR CHECK)
- `package_plans` as a catalog (mutable) vs `credit_transactions` as a ledger (append-only)
- Snapshot-on-purchase pattern (package fields copied to payment row)
- Single orchestrator service (`AccountingPaymentService`)
- Idempotency via deterministic SHA-256
- New `grp_accounting` sidebar group (sibling of `grp_finance`)
- Two new permissions `ACCOUNTING_PAYMENTS_VIEW` / `ACCOUNTING_PAYMENTS_MANAGE`
- All EARS acceptance criteria verbatim
- All data model columns/types/CHECK constraints verbatim

---

## 6. Next Actions for Implementation Agents

1. **Start with Phase 1** (schema + enums + permissions) — every other phase depends on it.
2. **Critical early checkpoint**: After Task 1.6 (`enums.ts` edit), verify with `bun run db push` that `payment_gateway` and `billed_unit` Postgres types are created successfully and that `invoice_type` accepts `CREDIT_HOURS_PACKAGE` after migration.
3. **Cross-phase checkpoint**: After Phase 4 (GraphQL) + Phase 5 (i18n), run `bun run codegen` + `bun run locale:snapshots` to generate the artifacts Phase 6+ depends on.
4. **Navigation labels reminder**: When implementing Task 5.6, also remember to add the `navGroupAccounting` / `accountingPayments` / `accountingPackages` keys to BOTH `shared/locale/en/dashboard/core/nav.json` AND `shared/locale/ar/dashboard/core/nav.json` — these are easy to miss because they live OUTSIDE the new `accounting/` directory.
5. **Watch out for** the `useQuery` (not `useLazyQuery`) rule per `frontend/common/graphql/AGENTS.md` §27-29 when implementing the package-auto-fill form (Task 8.2).
6. **MUI v9 prop check**: When implementing desktop views (8.4-8.6, 9.2-9.3), confirm Typography/Stack/Box use `sx={{...}}` exclusively — no `align=`, `mt=`, `color=` style props.

---

## 7. Review Summary

| Dimension | Violations Found | Violations Fixed |
|-----------|------------------|------------------|
| 1. Paths Existence | 7 | 7 ✅ |
| 2. i18n Compliance | 4 | 4 ✅ |
| 3. GraphQL Accuracy | 2 | 2 ✅ |
| 4. Component Props | 0 | 0 (preventive note added) ✅ |
| 5. Permissions/Enums | 3 | 3 ✅ |
| 6. Existing Components | 1 | 1 ✅ |
| 7. Architecture Compliance | 1 (subsumed by G1) | 1 ✅ |
| 8. Cross-Reference Consistency | 1 | 1 ✅ |
| **Total** | **19** | **19 ✅** |

Plan is now **READY FOR IMPLEMENTATION**. All factual errors, naming convention violations, missing references, and AGENTS.md compliance issues have been resolved without altering the underlying design or approach.
