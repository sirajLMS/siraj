# Plan 2 — Credit Adjustment System: Tasks

> Phased task list companion to `specs.md` and `implementation.md`.
> Every code-producing task ends with a quality loop:
>
> ```
> bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
> ```
>
> This runs `tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file`,
> short-circuiting at the first failure. Fix and re-run until exit 0 before
> marking a task complete.

---

## Legend

- 🆕 = new file
- ✏️  = edit existing file
- 🧪 = test file
- 🔁  = run a command / quality loop
- 🔗  = cross-plan dependency

---

## Phase 0 — Foundation (enums, permission, schema, migration)

> Goal: additive data-model changes that unblock every later phase. Zero
> behavior change for existing flows.

### 0.1 Add `CreditAdjustmentType` enum ✅ DONE
- 🆕 `backend/enum/billing/credit-adjustment.enum.ts` — define `CreditAdjustmentType` enum (`ADD | SUBTRACT | SUBTRACT_WITH_CARRYOVER` — values follow SCREAMING_SNAKE_CASE convention used by every other PG enum).
- ✏️ `backend/enum/billing/index.ts` — re-export via `export * from "./credit-adjustment.enum";`.
- 🆕 `shared/constants/billing/credit-adjustment.enum.ts` — mirror enum for client/server.
- ✏️ `shared/constants/billing/index.ts` — re-export (create if missing).
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/billing/credit-adjustment.enum.ts --lifecycle codescene`

### 0.2 Extend `CreditReason` enum ✅ DONE
- ✏️ `backend/enum/billing/credit.enum.ts` — add `CREDIT_ADJUSTMENT_ADD`, `CREDIT_ADJUSTMENT_SUBTRACT`, `CREDIT_ADJUSTMENT_CARRYOVER`.
- ✏️ `shared/constants/billing/credit.enum.ts` — mirror (extend existing).
- ✏️ `shared/constants/credit.enum.ts` — mirror (extend existing — both shared mirrors must stay in sync).
- ✅ Verify `backend/db/schema/enums.ts` — `creditReasonEnum = createPgEnumFromEnum("credit_reason", CreditReason)` already picks up new values automatically (no `enums.ts` change required).
- ✏️ `backend/graphql/pothos/shared/enum.pothos.ts` — register `CreditAdjustmentTypePothosEnum` (Pothos enum) so GraphQL codegen picks it up.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/billing/credit.enum.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/constants/billing/credit.enum.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/constants/credit.enum.ts --lifecycle codescene`

### 0.3 Add `ACCOUNTING_CREDITS_MANAGE` permission ✅ DONE
- ✏️ `backend/enum/permissions/permission.enum.ts` — add `ACCOUNTING_CREDITS_MANAGE = "accounting.credits_manage"`.
- ✏️ `backend/db/seeds/permissions/` (or wherever permission-groups are seeded) — grant to "Accounting" / "Finance Manager" default group.
- 🧪 `backend/enum/permissions/permission.enum.test.ts` — assert new value parses via `isAppPermission`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene`

### 0.4 Extend `credit_transactions` schema ✅ DONE
- ✏️ `backend/db/schema/billing/credit-transactions.ts` — add `adjustmentType`, `carryoverTeacherId`, `carryoverFromDate`, `carryoverToDate`, `carryoverPaymentDate` + 2 new indexes.
- ✏️ `backend/db/schema/enums.ts` — register `creditAdjustmentTypeEnum = createPgEnumFromEnum("credit_adjustment_type", CreditAdjustmentType)`.
- ✏️ `backend/db/drizzleRelations.ts` — add `creditTransactions.carryoverTeacher` relation to `teachers`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/billing/credit-transactions.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/enums.ts --lifecycle codescene`

### 0.5 Generate + apply migration ✅ DONE
- 🔁 `bun run db:generate` — produce additive migration (new columns nullable/defaulted, new enum values).
- ✏️ migration file — split into two: (a) enum-value adds (`--single-transaction=false`), (b) column adds (transactional).
- 🔁 `bun run db:migrate` against local dev DB.
- 🧪 `backend/db/test/migrations/credit-adjustment-columns.test.ts` — assert migration is idempotent and additive.
- 🔁 `bun run scripts/health/sub-loop.ts <migration-file> --lifecycle codescene`

### 0.6 Phase-0 regression smoke ✅ DONE
- 🔁 `bun test backend/db/test/repo/billing/credit.repository.test.ts`
- 🔁 `bun test backend/db/test/logic/lms/credit-workflow.test.ts`
- ✅ Confirm existing `recordPurchase` / `deductForBooking` / `refundOnCancel` flows still pass.

---

## Phase 1 — Service layer

> Goal: `CreditService.recordAdjustment` dispatches to `addCredit`,
> `subtractCredit`, `subtractWithCarryover` with full idempotency,
> validation, and audit logging.

### 1.1 Types ✅ DONE
- ✏️ `backend/types/billing/credit.types.ts` — add `CreditAdjustmentInput`, `CreditAdjustmentReturnType`, `CreditAdjustmentInsertInput`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/types/billing/credit.types.ts --lifecycle codescene`

### 1.2 Repository extension ✅ DONE
- ✏️ `backend/db/repo/billing/credit.repository.ts` — add `createAdjustment(tx, input)` + expose carryover columns in `mapToReturnType`.
- 🧪 `backend/db/test/repo/billing/credit-adjustment.repository.test.ts` — insert + read-back of all carryover columns.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/billing/credit.repository.ts --lifecycle codescene`

### 1.3 Idempotency helper ✅ DONE
- ✏️ `backend/services/billing/credit-adjustment.idempotency.ts` 🆕 — `deriveAdjustmentIdempotencyKey(input)`.
- 🧪 `backend/services/billing/credit-adjustment.idempotency.test.ts` — same input → same key; teacher/date changes → different key.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit-adjustment.idempotency.ts --lifecycle codescene`

### 1.4 HTML sanitizer for Reason ✅ DONE
- ✏️ `backend/lib/sanitize/richTextSanitizer.ts` 🆕 — `sanitizeRichText(html: string): string` (DOMPurify + jsdom on server).
- 🧪 `backend/lib/sanitize/richTextSanitizer.test.ts` — strips `<script>`, `onerror=`, `javascript:`; preserves `<b><i><ul><li>`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/lib/sanitize/richTextSanitizer.ts --lifecycle codescene`

### 1.5 `addCredit` ✅ DONE
- ✏️ `backend/services/billing/credit.service.ts` — add `addCredit` (private), wire into `recordAdjustment` switch.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit.service.ts --lifecycle codescene`

### 1.6 `subtractCredit` ✅ DONE
- ✏️ `backend/services/billing/credit.service.ts` — add `subtractCredit` (private) with `INSUFFICIENT_CLASSES` guard inside tx.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit.service.ts --lifecycle codescene`

### 1.7 `subtractWithCarryover` ✅ DONE
- ✏️ `backend/services/billing/credit.service.ts` — add `subtractWithCarryover` (private) + `assertTeacherExists` helper + `maybeInsertCarryoverBalanceEntry` 🔗 (Plan 5 handoff stub: no-op if Plan 5 table absent).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit.service.ts --lifecycle codescene`

### 1.8 `recordAdjustment` dispatcher ✅ DONE
- ✏️ `backend/services/billing/credit.service.ts` — export `recordAdjustment(actorUserId, input, tErrors)` that runs `requirePermission(ACCOUNTING_CREDITS_MANAGE)` + `validateAdjustmentInput` + switch.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit.service.ts --lifecycle codescene`

### 1.9 Service tests ✅ DONE
- 🧪 `backend/services/billing/credit-adjustment.service.test.ts` — full coverage matrix:
  - Add happy path (balance +1).
  - Subtract happy path (balance -1).
  - Carryover happy path (balance -1, carryover columns set, `maybeInsertCarryoverBalanceEntry` stub called once).
  - Insufficient classes (Subtract) → no row.
  - Insufficient classes (Carryover) → no row, no carryover.
  - Idempotent re-submit (same key) → returns first row, no duplicate.
  - Unique-violation catch → returns first row.
  - `fromDate > toDate` → validation error.
  - `paymentDate > +1 day` → validation error.
  - Missing teacher (Carryover) → validation error.
  - Permission denied → throws `InsufficientPermissions`.
  - Reason sanitization — `<script>` stripped before persist.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit-adjustment.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/billing/credit-adjustment.service.test.ts`

### 1.10 Phase-1 acceptance ✅ DONE
> Verified by orchestrator 2026-08-29: service 30/30, repo regression 28/28, workflow 3/3, `bun tsgo` 0 errors.
- ✅ All service tests green.
- ✅ Existing `credit.service.test.ts` still green (no regression).
- ✅ `sub-loop` exit 0 on every touched file.

---

## Phase 2 — GraphQL layer

### 2.1 Pothos types ✅ DONE
- 🆕 `backend/graphql/pothos/billing/credit-adjustment.pothos.ts` — `CreditAdjustmentTypePothosEnum`, `CreditAdjustmentInputPothos`, `CreditAdjustmentResultPothosObject`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/billing/credit-adjustment.pothos.ts --lifecycle codescene`

### 2.2 Extend existing transaction object ✅ DONE
- ✏️ `backend/graphql/pothos/billing/credit.pothos.ts` — expose `adjustmentType`, `carryoverTeacherId`, `carryoverFromDate`, `carryoverToDate`, `carryoverPaymentDate` on the existing `CreditTransactionPothosObject`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/billing/credit.pothos.ts --lifecycle codescene`

### 2.3 Mutation ✅ DONE
- 🆕 `backend/graphql/mutation/billing/credit-adjustment.mutation.ts` — `recordCreditAdjustment(input)` field.
- ✏️ `backend/graphql/mutation/billing/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/billing/credit-adjustment.mutation.ts --lifecycle codescene`

### 2.4 Mutation tests ✅ DONE
- 🧪 `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` —
  - Returns result shape.
  - Permission denied → GraphQL error.
  - Mutation-argument coverage (per `docs/testing/mutation-argument-coverage.md`).
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts --lifecycle codescene`
- 🔁 `bun test backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts`

### 2.5 Phase-2 acceptance ✅ DONE
- ✅ GraphQL schema builds (`bun run graphql:build`).
- ✅ Codegen (`bun run graphql:codegen`) produces typed `RecordCreditAdjustmentMutation` hooks.

---

## Phase 3 — Navigation & routes (shell)

> Goal: routes exist, nav item renders, permission gating works. No form yet.

### 3.1 Page-permission entries ✅ DONE
- ✏️ `frontend/common/types/page-permissions.types.ts` — add `accountingCreditsManage` + `accountingCreditsAdjust` as **arrays** cast to `PagePermissions` (per existing convention):
  ```ts
  accountingCreditsManage: [AppPermission.ACCOUNTING_CREDITS_MANAGE] as PagePermissions,
  accountingCreditsAdjust: [AppPermission.ACCOUNTING_CREDITS_MANAGE] as PagePermissions,
  ```
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`

### 3.2 Sidebar nav item + nav label additions ✅ DONE
- ✏️ `frontend/common/views/dashboard/config/navigationConfig.ts` — add `accounting-credits` item to `SIDEBAR_NAV_ITEMS` under `grp_finance`; add `AppPermission.ACCOUNTING_CREDITS_MANAGE` to `grp_finance` group `permission` array.
- ✏️ `frontend/common/views/dashboard/config/navIconKeys.ts` — verify `accountBalanceWallet` is already in `NavIconKey` union (it is — no change needed).
- ✏️ `shared/locale/types/dashboard/core/nav.ts` — add `readonly accountingCredits: string;` to `DashboardNavigationLabels` (label lives in the existing `dashboard.core.nav` namespace, NOT in the new `dashboard.billing.creditAdjustment` namespace).
- ✏️ `shared/locale/en/dashboard/core/nav.ts` — add `accountingCredits: "Credits"`.
- ✏️ `shared/locale/ar/dashboard/core/nav.ts` — add `accountingCredits: "الرصيد"`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/core/nav.ts --lifecycle codescene`

### 3.3 i18n namespace (four-artifact compile-time i18n) ✅ DONE
- 🆕 `shared/locale/types/dashboard/billing/creditAdjustment.ts` — define `CreditAdjustmentLabels` interface per implementation.md §7.1 (use TypeScript function-typed fields for `success.added(hours)`, `success.subtracted(hours)`, `success.carryover(hours, teacher)` — not ICU strings).
- ✏️ `shared/locale/types/dashboard/billing/index.ts` — add `export * from "./creditAdjustment";`.
- ✏️ `shared/locale/types/message.ts` — register `dashboard.billing.creditAdjustment` in `MessageSchema`.
- 🆕 `shared/locale/namespaces/dashboard/billing/creditAdjustment.namespace.ts` — define namespace via `defineNamespace<CreditAdjustmentLabels>("dashboard.billing.creditAdjustment", { load: { en, ar } })`.
- ✏️ `shared/locale/namespaces/dashboard/billing/index.ts` — add `export * from "./creditAdjustment.namespace";` (create if missing).
- 🆕 `shared/locale/en/dashboard/billing/creditAdjustment.ts` — EN translations (`dashboardBillingCreditAdjustmentEn`).
- 🆕 `shared/locale/ar/dashboard/billing/creditAdjustment.ts` — AR translations (`dashboardBillingCreditAdjustmentAr`).
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/billing/creditAdjustment.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/namespaces/dashboard/billing/creditAdjustment.namespace.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/billing/creditAdjustment.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/billing/creditAdjustment.ts --lifecycle codescene`

### 3.4 Locale snapshot ✅ DONE
- 🔁 `bun run locale:snapshots` (or project equivalent) — generate `public/static/locale-snapshots/{en,ar}/dashboard.billing.creditAdjustment.json`.
- ✅ Verify snapshots committed.

### 3.5 Route shells ✅ DONE
- 🆕 `app/(dashboard)/accounting/credits/page.tsx` — server component that renders `<StudentCreditsList />`.
- 🆕 `app/(dashboard)/accounting/credits/adjust/page.tsx` — server component that reads `searchParams.studentId` and renders `<CreditAdjustForm studentId={...} />`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/(dashboard)/accounting/credits/page.tsx" --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts "app/(dashboard)/accounting/credits/adjust/page.tsx" --lifecycle codescene`

### 3.6 Phase-3 acceptance
- ✅ `/accounting/credits` renders (with permission) / 403 (without).
- ✅ Sidebar "Credits" item visible only with `ACCOUNTING_CREDITS_MANAGE`.
- ✅ AR/EN snapshots exist.

---

## Phase 4 — Student Credits list page

### 4.1 Apollo documents ✅ DONE
- 🆕 `frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents.ts` — `recordCreditAdjustmentMutationDocument` (TypedDocumentNode, camelCase + `Document` suffix per `sharedDocuments/AGENTS.md`); include `id` field on the selection set so Apollo cache can auto-update.
- ✏️ `frontend/common/graphql/sharedDocuments/billing/index.ts` — add `export * from "./credit-adjustment.documents";`.
- ✅ Reuse the existing `studentDirectoryQueryDocument` from `students/student-directory.documents.ts` for the Student Credits list (already returns `classesRemaining` + `classesTotal`); extend its `StudentDirectoryRow` fragment if a `lastTransactionAt` column is needed (do NOT fork a separate query).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents.ts --lifecycle codescene`
- 🔁 After Phase 2 lands: `bun run generate:gqlSchema && bun codegen` so `Operations.RecordCreditAdjustmentMutation` + `Types.MutationRecordCreditAdjustmentArgs` exist.

### 4.2 List component
- 🆕 `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx` — MUI DataGrid, search, "Adjust Credits" row action.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx --lifecycle codescene`

### 4.3 List tests
- 🧪 `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.test.tsx` — renders rows, empty state, "Adjust" navigates with `?studentId=`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/StudentCreditsList.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/credits/StudentCreditsList.test.tsx`

---

## Phase 5 — Adjustment form (the heart of the feature)

### 5.1 Zustand store slice
- 🆕 `frontend/common/stores/creditAdjustFormStore.ts` — `studentId`, `adjustmentType`, `hours`, `notes`, `carryoverTeacherId`, `fromDate`, `toDate`, `paymentDate`, `clientRequestId`; `reset()`; `clearCarryover()`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/stores/creditAdjustFormStore.ts --lifecycle codescene`

### 5.2 Rich-text editor
- 🆕 `frontend/common/components/ui/input/richText/RichTextEditor.tsx` — TipTap-based; outputs HTML. (Path follows the existing `input/<widget>/` convention used by `input/tagInput/`, `input/currencySelect/`, etc.)
- ✏️ `frontend/common/components/ui/input/index.ts` — barrel-export `RichTextEditor`.
- 🧪 `frontend/common/components/ui/input/richText/RichTextEditor.test.tsx` — emits HTML, empty when cleared, toolbar buttons toggle marks.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/components/ui/input/richText/RichTextEditor.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/components/ui/input/richText/RichTextEditor.test.tsx --lifecycle codescene`

### 5.3 Teacher autocomplete (reuse existing)
- ✅ Reuse the existing `TeacherAutocomplete` at `frontend/common/components/ui/input/userSelect/TeacherAutocomplete.tsx` — do NOT create a new component. Import it directly: `import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete";`.
- ✏️ (Optional) If extra props are needed (e.g. `required`, custom `label`), extend `TeacherAutocompleteProps` in `frontend/common/components/ui/input/userSelect/types.ts`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/components/ui/input/userSelect/TeacherAutocomplete.tsx --lifecycle codescene`

### 5.4 Carryover banner
- 🆕 `frontend/common/views/dashboard/accounting/credits/CarryoverBanner.tsx` — green `Alert` + TeacherAutocomplete + 3 DatePickers with `minDate`/`maxDate` constraints.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/CarryoverBanner.tsx --lifecycle codescene`

### 5.5 Adjustment type RadioGroup
- 🆕 `frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.tsx` — 3 options with colored accents; on change → `clearCarryover()` if switching away from "Subtract With Carryover".
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.tsx --lifecycle codescene`

### 5.6 Form component
- 🆕 `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx` — composes Student picker (reuse existing `StudentAutocomplete`), RadioGroup, Hours, `RichTextEditor`, conditional `<CarryoverBanner />`, Submit/Cancel.
  - Uses `useMutation(recordCreditAdjustmentMutationDocument)` (Apollo hook imported from `@apollo/client/react`).
  - `clientRequestId` generated once per mount (UUIDv4).
  - On success: cache evict + `router.push("/accounting/credits")` + success toast.
  - On `INSUFFICIENT_CLASSES`: inline error on Hours.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx --lifecycle codescene`

### 5.7 Form tests
- 🧪 `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.test.tsx`:
  - RadioGroup switches → carryover banner shows/hides.
  - Switching back to "Add" clears carryover fields (edge case E3).
  - Submit Add → mutation called with `changeAmount` implied by type + positive hours + no carryover fields.
  - Submit Carryover → mutation called with all carryover fields.
  - fromDate > toDate → validation blocks submit (edge case E3 / AC-4.3).
  - Double-click submit → only one mutation call (clientRequestId absorbs).
  - Insufficient classes → inline error, no navigation.
  - Pre-selected student from `?studentId=` (AC-1.5).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.test.tsx`

### 5.8 Phase-5 acceptance
- ✅ Full Add / Subtract / Carryover flows work end-to-end in dev.
- ✅ Double-submit produces exactly one ledger row.
- ✅ Reason HTML is sanitized on persist (server test confirms).

---

## Phase 6 — Plan 5 carryover handoff + integration

### 6.1 Carryover stub contract ✅ DONE
- 🆕 `backend/services/billing/carryover-handoff.ts` — `maybeInsertCarryoverBalanceEntry(tx, payload)`:
  - If `teacher_carryover_balances` table exists → insert row.
  - Else → no-op (Plan 2 self-contained).
- 🔗 Plan 5 will replace the stub with the real repository call.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/carryover-handoff.ts --lifecycle codescene`

### 6.2 Backfill migration (deferred to Plan 5 activation)
- 📝 Document in `implementation.md` §2.5 (already done) — Plan 5 owns the actual backfill migration.

### 6.3 Integration test (when Plan 5 lands)
- 🧪 `backend/services/billing/credit-adjustment-carryover.integration.test.ts` — carryover row created in Plan 5 table with correct FK to `credit_transactions.id`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit-adjustment-carryover.integration.test.ts --lifecycle codescene`

---

## Phase 7 — i18n polish, accessibility, observability

### 7.1 Full key coverage
- ✏️ `shared/locale/namespaces/dashboard/accounting/credits.namespace.ts` — confirm every user-visible string has EN + AR.
- 🔁 `bun run locale:validate` (or project equivalent) — fail if any key missing in either locale.

### 7.2 Accessibility pass
- ✏️ `CreditAdjustForm.tsx` — aria-labels on RadioGroup, autocomplete, date pickers, rich-text editor; focus trap; keyboard nav.
- 🧪 `CreditAdjustForm.test.tsx` — add axe-core assertions (existing project pattern).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx --lifecycle codescene`

### 7.3 Observability
- ✏️ `backend/services/billing/credit.service.ts` — structured `logger.info` on every successful adjustment with `actorUserId`, `studentId`, `adjustmentType`, `changeAmount`, `carryoverTeacherId?`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/billing/credit.service.ts --lifecycle codescene`

### 7.4 Audit-log integration
- ✏️ (if the project has an audit-log service) emit an `audit.log` event for every adjustment — reuse existing `AuditService.log` pattern.
- 🔁 `bun run scripts/health/sub-loop.ts <audit-call-site> --lifecycle codescene`

---

## Phase 8 — End-to-end & regression

### 8.1 E2E test
- 🧪 `e2e/accounting/credit-adjustment.spec.ts` (Playwright, if project uses it):
  - Log in as accounting operator.
  - Open `/accounting/credits`, click "Adjust Credits" on a student.
  - Add 2 hours → verify balance +2 in list.
  - Subtract 1 hour → verify balance -1.
  - Subtract 1 with carryover → verify balance -1 and carryover row visible in transaction history.
- 🔁 `bun run scripts/health/sub-loop.ts e2e/accounting/credit-adjustment.spec.ts --lifecycle codescene`

### 8.2 Regression suite
- 🔁 `bun test backend/db/test/repo/billing/credit.repository.test.ts`
- 🔁 `bun test backend/db/test/logic/lms/credit-workflow.test.ts`
- 🔁 `bun test backend/services/billing/credit.service.test.ts`
- 🔁 `bun test backend/services/billing/credit-adjustment.service.test.ts`
- 🔁 `bun test backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts`

### 8.3 Full quality gate
- 🔁 Run project-wide `lint`, `typecheck`, `test`, `build`.
- 🔁 `bun run scripts/health/sub-loop.ts <each-new-file> --lifecycle codescene` for every file created/edited in Phases 0–7.

### 8.4 Migration rehearsal on staging
- 🔁 Apply migration to a staging snapshot of prod data.
- ✅ Confirm row count of `credit_transactions` unchanged, new columns nullable/defaulted, no locks held > 100 ms.

---

## Definition of Done

- [ ] All Phase 0–8 tasks complete.
- [ ] Every touched file passes `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0).
- [ ] `specs.md` acceptance criteria AC-1.1 … AC-7.3 each have a passing test.
- [ ] Edge cases E1–E18 each covered by a test or explicit "won't happen" note.
- [ ] Migration is additive, zero-downtime, idempotent.
- [ ] EN + AR locale snapshots committed.
- [ ] Existing `recordPurchase` / `deductForBooking` / `refundOnCancel` flows regression-green.
- [ ] 🔗 Plan 5 handoff stub in place; backfill SQL documented in `implementation.md` §2.5.

---

## Quick-reference: quality loop commands

```bash
# Single file, full lifecycle (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene)
bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene

# Lighter stages (short-circuit earlier)
bun run scripts/health/sub-loop.ts <file-path> --lifecycle tsgo
bun run scripts/health/sub-loop.ts <file-path> --lifecycle biome
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
bun run scripts/health/sub-loop.ts <file-path> --lifecycle duplicates
```

> See `scripts/health/sub-loop.ts` header for the canonical lifecycle ordering.
> Never run `bun sonar-scan` from a sub-loop — only the orchestrator owns sonar.

---

## Test Coverage Backfill: Cross-Actor Journeys & 4-Tier Enforcement

> Closes the gap between this plan and the enforced test kinds added later to the spec process
> (.agents/skills/spec-implementation/SKILL.md → "Plan Intake" items 5-7 + "Test-Layer Coverage
> Gate"; docs/testing/workflow-journey-tests.md). Existing tasks are unchanged; these tasks are
> additive and execute before this plan is treated as test-complete.

- [ ] TB.1 Journey: accounting operator submits Add/Subtract adjustment → student/parent observes updated balance and ledger row (Adjust → Observe)
  - Create `test/workflows/billing/credit-adjustment-student-visibility.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (`students.classesRemaining` / `classesTotal` move in lockstep with the `credit_transactions` row), cross-actor visibility (student/parent sees the adjustment row via `getStudentTransactions` and the `/students/credits` balance; other students and their parents must NOT see it), side effects (ledger row + balance change + quota-instance refresh), denial paths (actor without `ACCOUNTING_CREDITS_MANAGE` is rejected via real permission rows; no ledger write occurs; idempotent re-submit returns the first row without a second balance change)
  - Verify: `bun run test/scripts/run-test.ts test/workflows/billing/credit-adjustment-student-visibility.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-2 (AC-2.1–AC-2.6), US-3 (AC-3.1–AC-3.6), US-6 (AC-6.1–AC-6.3), US-7 (AC-7.1–AC-7.3); edge cases E1, E9, E11, E18_
- [ ] TB.2 Journey: accounting operator Subtract With Carryover → teacher gains payout obligation while student loses hours
  - Create `test/workflows/billing/credit-adjustment-carryover.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: single-transaction consistency (ledger row + balance decrement + carryover columns/commit via `maybeInsertCarryoverBalanceEntry` — all-or-nothing), cross-actor visibility (teacher's pending carryover obligation reflects the deducted hours and date range; carryover row renders teacher name/dates in the student's transaction history per AC-7.2; unrelated teachers must NOT gain an obligation), side effects (audit event emitted with actor/student/teacher/hours), denial paths (operator lacking `ACCOUNTING_CREDITS_MANAGE`; nonexistent or soft-deleted teacher → `NOT_FOUND`; insufficient classes → `INSUFFICIENT_CLASSES` with zero writes; duplicate submit → single carryover entry)
  - Verify: `bun run test/scripts/run-test.ts test/workflows/billing/credit-adjustment-carryover.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-4 (AC-4.1–AC-4.10), US-6 (AC-6.1–AC-6.3), US-7 (AC-7.2), NFR-3, NFR-8; edge cases E4–E8, E14, E15_
- [ ] TB.3 4-Tier verification for credit-adjustment service/repository/sanitizer/mutation files
  - Confirm Tier 1 branch coverage + Tier 4 abuse/permission cases exist and green for: `backend/services/billing/credit.service.ts`, `backend/services/billing/credit-adjustment.idempotency.ts`, `backend/services/billing/carryover-handoff.ts`, `backend/db/repo/billing/credit.repository.ts`, `backend/lib/sanitize/richTextSanitizer.ts`, `backend/graphql/mutation/billing/credit-adjustment.mutation.ts`
  - Fill gaps via `.agents/skills/write-tests/SKILL.md` + `.agents/skills/test-expert/SKILL.md`; repo tests inside `runInRollback` with `tx` propagation; service tests mock all external channels
  - Verify with `bun run test/scripts/run-test.ts <each test file>`
  - _Requirements: cross-cutting (US-2, US-3, US-4, US-5, US-6; NFR-3, NFR-4, NFR-8)_
- [ ] TB.4 Penetration verification
  - BOLA/IDOR across the roles in this plan: `recordCreditAdjustment` with a `studentId`/`carryoverTeacherId` outside the actor's scope or soft-deleted; permission denial on the mutation for teacher/student/parent actors; XSS via stored rich-text `notes` (payload surviving sanitization rendered in transaction history); wildcard/LIKE injection on the Student Credits list search
  - Via `.agents/skills/pentester/SKILL.md`
  - _Requirements: US-5 (AC-5.2, AC-5.4), US-6 (AC-6.1–AC-6.3), NFR-4; edge cases E12, E18_
