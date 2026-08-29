# Plan 3 — Teacher Payroll Calculation Engine: Tasks

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

## Phase 0 — Foundation (enum, permissions, schema, migration, settings)

> Goal: additive data-model changes that unblock every later phase. Zero
> behavior change for existing flows.

### 0.1 Add `CalculationStatus` enum ✅ DONE
- 🆕 `backend/enum/teachers/payroll-calculation.enum.ts` — define `CalculationStatus` enum (`NOT_CALCULATED | CALCULATED | PARTIALLY | REFUND | WAITING_PAID | PAID` — values follow SCREAMING_SNAKE_CASE convention used by every other PG enum).
- ✏️ `backend/enum/teachers/index.ts` — re-export via `export * from "./payroll-calculation.enum";`.
- 🆕 `shared/constants/teachers/payroll-calculation.enum.ts` — mirror enum for client/server.
- ✏️ `shared/constants/teachers/index.ts` — re-export (create if missing).
- ✏️ `backend/graphql/pothos/shared/enum.pothos.ts` — register `CalculationStatusPothosEnum` (Pothos enum) so GraphQL codegen picks it up.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/teachers/payroll-calculation.enum.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/constants/teachers/payroll-calculation.enum.ts --lifecycle codescene`

### 0.2 Add `ACCOUNTING_PAYROLL_VIEW` + `ACCOUNTING_PAYROLL_MANAGE` permissions ✅ DONE
- ✏️ `backend/enum/permissions/permission.enum.ts` — add both new values.
- ✏️ `backend/db/seeds/auth/seed-user-permission-overrides.ts` (or wherever permission-groups are seeded) — grant both to the "Accounting" / "Finance Manager" default group.
- 🧪 `backend/enum/permissions/permission.enum.test.ts` — assert both new values parse via `isAppPermission`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene`

### 0.3 Register `SystemSettingCategory.Payroll` (if absent) ✅ DONE
- ✏️ `shared/constants/settings/system-settings.enum.ts` — add `Payroll = "payroll"` to `SystemSettingCategory` enum (additive, lowercase string value — matches the existing `Security = "security"`, `System = "system"`, `Scheduling = "scheduling"`, `Billing = "billing"` pattern).
- ✅ Verify `backend/db/schema/enums.ts` — `systemSettingCategoryEnum = createPgEnumFromEnum("system_setting_category", SystemSettingCategory)` picks up the new value automatically (no `enums.ts` change required).
- 🔁 `bun run scripts/health/sub-loop.ts shared/constants/settings/system-settings.enum.ts --lifecycle codescene`

### 0.4 Extend `class_instances` schema with payroll columns ✅ DONE
- ✏️ `backend/db/schema/classes/scheduling.ts` — add `calculatedDuration`, `teacherPaidAmount`, `teacherPaidCurrency`, `calculationStatus`, `isPartialPercentage`, `payrollNote`, `payrollCalculatedAt`, `payrollCalculatedBy` + 3 new indexes + 2 CHECK constraints (partial-percentage consistency, refund-zeroes-amount, calculated-requires-duration).
- ✏️ `backend/db/schema/enums.ts` — register `calculationStatusEnum = createPgEnumFromEnum("calculation_status", CalculationStatus)`.
- ✏️ `backend/db/drizzleRelations.ts` — add `classInstances.payrollCalculatedByUser` relation to `users`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/classes/scheduling.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/schema/enums.ts --lifecycle codescene`

### 0.5 Seed `system_settings` rows for grace thresholds ✅ DONE
- ✏️ `backend/db/seeds/shared/system-settings.ts` — add three rows: `payroll.grace_short_minutes` (=3), `payroll.grace_long_minutes` (=6), `payroll.grace_threshold_minutes` (=30).
- 🧪 `backend/db/test/repo/shared/system-settings.repository.test.ts` — assert the three keys exist after seed and parse as integers.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/seeds/shared/system-settings.ts --lifecycle codescene`

### 0.6 Generate + apply migration ✅ DONE
- 🔁 `bun run db:generate` — produce additive migration (new columns nullable/defaulted, new enum type, new system_settings rows).
- ✏️ migration file — split into three: (a) `CREATE TYPE calculation_status` (transactional), (b) `ALTER TABLE class_instances ADD COLUMN ...` (transactional), (c) `INSERT INTO system_settings ... ON CONFLICT DO NOTHING` (idempotent).
- 🔁 `bun run db:migrate` against local dev DB.
- 🧪 `backend/db/test/migrations/payroll-columns.test.ts` — assert migration is idempotent and additive; existing `class_instances_state_machine_chk` constraint still passes.
- 🔁 `bun run scripts/health/sub-loop.ts <migration-file> --lifecycle codescene`

### 0.7 Phase-0 regression smoke ✅ DONE
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts`
- 🔁 `bun test backend/db/test/logic/scheduling/class_instances_security.test.ts`
- 🔁 `bun test backend/db/test/logic/scheduling/class_rescheduling.test.ts`
- ✅ Confirm existing scheduling / state-machine flows still pass.

---

## Phase 1 — Service layer

> Goal: `PayrollCalculationService.calculateForInstance` +
> `applyOverride` + `getReport` with full idempotency, validation, and
> audit logging.

### 1.1 Types ✅ DONE
- 🆕 `backend/types/teachers/payroll.types.ts` — add `PayrollCalculationInput`, `PayrollCalculationResult`, `PayrollOverrideInput`, `PayrollOverrideResult`, `PayrollReportFilters`, `PayrollReportRow`, `PayrollReportPage`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/types/teachers/payroll.types.ts --lifecycle codescene`

### 1.2 Repository extension ✅ DONE
- ✏️ `backend/db/repo/scheduling/class-instances.ts` — add `getById(id, tx, opts)` with `forUpdate` option, `updatePayrollCalculation(tx, id, patch)`, and `findPayrollReportRows(filters, pagination)` (single joined query).
- ✏️ `backend/db/repo/scheduling/class-status-events.repository.ts` — add `findRecentByInstanceAndHash(instanceId, hash, windowSeconds, tx)` to the existing `ClassStatusEventsRepository` namespace (plural — see existing namespace in `backend/db/repo/scheduling/class-status-events.repository.ts`). The lookup queries `toState->>'idempotencyKey' = $1` and `created_at >= now() - interval '$2 seconds'`. **Do NOT add a `metadata` jsonb column** — the existing `class_status_events` schema has no such column; store the idempotency key inside the existing `toState` jsonb instead. Use the existing `createMany(inputs, tx)` method (not a hypothetical `create` method) for inserts.
- 🧪 `backend/db/test/repo/scheduling/payroll-report.repository.test.ts` — filter by teacher/student/date/status; pagination; SQL-computed `isStudentAbsence`/`isTeacherAbsence` booleans.
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/scheduling/class-instances.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/db/repo/scheduling/class-status-events.repository.ts --lifecycle codescene`

### 1.3 Idempotency helper ✅ DONE
- 🆕 `backend/services/teachers/payroll-override.idempotency.ts` — `deriveOverrideIdempotencyKey(input)` = sha256 of (instanceId, targetStatus, partialPercentage, note, force).
- 🧪 `backend/services/teachers/payroll-override.idempotency.test.ts` — same input → same key; percentage change → different key.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-override.idempotency.ts --lifecycle codescene`

### 1.4 Grace-settings resolver ✅ DONE
- 🆕 `backend/services/teachers/payroll-grace-settings.ts` — `resolveGraceSettings()` reading from `SystemSettingsRepository`; falls back to defaults (3/6/30) and logs a warning on misconfiguration.
- 🧪 `backend/services/teachers/payroll-grace-settings.test.ts` — happy path, missing settings → defaults, negative setting → defaults + warning, threshold < 1 → defaults + warning.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-grace-settings.ts --lifecycle codescene`

### 1.5 Plain-text sanitizer for `payrollNote` ✅ DONE
- ✏️ `backend/lib/sanitize/richTextSanitizer.ts` (extend if exists; else 🆕) — add `sanitizePlainText(text, maxLength)` that strips HTML tags + truncates.
- 🧪 `backend/lib/sanitize/richTextSanitizer.test.ts` — strips `<script>` tags; truncates to 2000 chars with ellipsis.
- 🔁 `bun run scripts/health/sub-loop.ts backend/lib/sanitize/richTextSanitizer.ts --lifecycle codescene`

### 1.6 `calculateForInstance` — grace-period + outcome-rule branches ✅ DONE
- 🆕 `backend/services/teachers/payroll-calculation.service.ts` — implement `calculateForInstance(input, tErrors)` with the four branches: student-absent, teacher-absent, on-time (within grace), late-pro-rated. Reads grace via `resolveGraceSettings`, rate via the existing PURE function `resolveClassRate({...})` from `@/backend/services/pricing/rate-resolver.service.ts` (NOT `RateResolverService.resolveForInstance` — that method does not exist; fetch `recurringSchedule`, `subject`, and `teacher` rows first, then call `resolveClassRate`).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-calculation.service.ts --lifecycle codescene`

### 1.7 `applyOverride` — four-mode matrix ✅ DONE
- ✏️ `backend/services/teachers/payroll-calculation.service.ts` — add `applyOverride(input, tErrors)` with the four modes (Refund / Calculated / Not Calculated / Partially) + `computeOverridePatch` helper + state guards (`PAYROLL_ALREADY_PAID`, `PAYROLL_AWAITING_SETTLEMENT`) + idempotency lookup.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-calculation.service.ts --lifecycle codescene`

### 1.8 `getReport` — read model + aggregates ✅ DONE
- ✏️ `backend/services/teachers/payroll-calculation.service.ts` — add `getReport(actorUserId, filters, pagination, tErrors)` returning `PayrollReportPage` with aggregate totals + `rowCountByStatus`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-calculation.service.ts --lifecycle codescene`

### 1.9 Service tests — calculation ✅ DONE
- 🧪 `backend/services/teachers/payroll-calculation.service.test.ts` — full coverage matrix:
  - Auto-trigger on `COMPLETED` → `CALCULATED` + amount set.
  - Auto-trigger on `ON_DEMAND_NO_CREDITS_ABSENT` → teacher-absent path.
  - Short-session grace (≤30 min, 3-min) — on-time + late-by-2 + late-by-5.
  - Long-session grace (>30 min, 6-min) — on-time + late-by-5 + late-by-7.
  - Late entry pro-rating caps at `scheduledEndAt` (no overtime).
  - Student-absence (ABSENT + actualStartAt set) → full scheduled pay.
  - Teacher-absence (actualStartAt null + outcome != ABSENT) → zero pay.
  - Force-recalc on `PARTIALLY` succeeds; without force, returns existing.
  - Force-recalc blocked on `PAID`.
  - Rate-resolution failure → `NOT_CALCULATED` + `payrollNote` set.
  - Idempotent re-trigger (same `clientRequestId` within 30s) → returns first.
  - Permission denied → throws `InsufficientPermissions`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-calculation.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts`

### 1.10 Service tests — override ✅ DONE
- 🧪 `backend/services/teachers/payroll-override.service.test.ts` — coverage matrix:
  - Refund happy path → amount zeroed, status `REFUND`, event emitted.
  - Calculated happy path → re-run + status flip.
  - Not Calculated happy path → amount null, status flip.
  - Partially pct=50 → amount halved, `isPartialPercentage=50`.
  - Partially pct=0 → equivalent to Refund.
  - Partially pct=100 → equivalent to full pay.
  - Partially without `partialPercentage` → validation error.
  - Refund/Partially without `note` → validation error.
  - Override on `PAID` → `PAYROLL_ALREADY_PAID`.
  - Override on `WAITING_PAID` without `force` → `PAYROLL_AWAITING_SETTLEMENT`.
  - Override on `WAITING_PAID` with `force` → succeeds.
  - Idempotent re-submit (same `clientRequestId` within 30s) → returns first.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-override.service.test.ts --lifecycle codescene`
- 🔁 `bun test backend/services/teachers/payroll-override.service.test.ts`

### 1.11 Wire auto-trigger into `SchedulingService` ✅ DONE
- ✏️ `backend/services/scheduling/scheduling.service.ts` (or whichever service owns the state-machine) — after a successful transition to `COMPLETED` or any `ON_DEMAND_*` terminal state, invoke `PayrollCalculationService.calculateForInstance` inside the same tx (AC-2.1).
- 🧪 `backend/services/scheduling/scheduling-payroll-trigger.test.ts` — verify the calculator runs on transition; verify it does NOT run on non-terminal transitions.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/scheduling/scheduling.service.ts --lifecycle codescene`

### 1.12 Wire `WAITING_PAID` flip into `TeacherDueService` ✅ DONE
- ✏️ `backend/services/teachers/teacher-due.service.ts` (existing) — in the existing `createDueEntry(...)` method (NOT `accrueForApprovedReport` — that method does not exist), read `class_instances.calculationStatus` first; if `CALCULATED`/`PARTIALLY`/`REFUND`, use `teacherPaidAmount`/`teacherPaidCurrency` as the authoritative due amount; otherwise fall back to legacy rate-resolver path with a warning log. Flip `calculationStatus = WAITING_PAID` in the same tx (AC-9.4).
- 🧪 `backend/services/teachers/teacher-due-payroll-integration.test.ts` — happy path consumes `teacherPaidAmount`; legacy fallback when `NOT_CALCULATED`; `WAITING_PAID` flip is atomic.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/teacher-due.service.ts --lifecycle codescene`

### 1.13 Wire `PAID` flip into `markAsPaid` (called by `markTeacherDuesPaid` mutation) ✅ DONE
- ✏️ `backend/services/teachers/teacher-due.service.ts` — in `markAsPaid(actorUserId, dueIds, teacherPaymentId, locale)` (the existing method called by the existing `markTeacherDuesPaid` GraphQL mutation), after marking dues `PAID`, flip the linked `class_instances.calculationStatus = PAID` in the same tx (AC-9.5). Emit `PAYROLL_STATUS_TRANSITION` event.
- 🧪 extend `backend/services/teachers/teacher-due.service.test.ts` (existing) — verify the status flip + event emission.
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/teacher-due.service.ts --lifecycle codescene`

### 1.14 Phase-1 acceptance ✅ DONE
- ✅ All service tests green.
- ✅ Existing `teacher-due.service.test.ts` + `scheduling.repository.test.ts` still green (no regression).
- ✅ `sub-loop` exit 0 on every touched file.

---

## Phase 2 — GraphQL layer

### 2.1 Pothos types ✅ DONE
- 🆕 `backend/graphql/pothos/teachers/payroll.pothos.ts` — `CalculationStatusPothosEnum`, `PayrollReportFilterPothosInput`, `PayrollReportRowPothosObject`, `PayrollReportPagePothosObject`, `PayrollOverrideInputPothos`, `PayrollOverrideResultPothosObject`.
- ✏️ `backend/graphql/pothos/teachers/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/teachers/payroll.pothos.ts --lifecycle codescene`

### 2.2 Extend existing `ClassInstanceDetailPothosObject` ✅ DONE
- ✏️ `backend/graphql/pothos/classes/class-session.pothos.ts` — expose `calculatedDuration`, `teacherPaidAmount`, `teacherPaidCurrency`, `calculationStatus`, `isPartialPercentage`, `payrollNote`, `payrollCalculatedAt` on the existing object.
- ✏️ `backend/types/classes/class-instance.types.ts` (or wherever the ReturnType lives) — add the new fields to `ClassInstanceDetailReturnType`.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/pothos/classes/class-session.pothos.ts --lifecycle codescene`

### 2.3 Query ✅ DONE
- 🆕 `backend/graphql/query/teachers/payroll.query.ts` — `payrollReport(filter, limit, offset)` field.
- ✏️ `backend/graphql/query/teachers/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/teachers/payroll.query.ts --lifecycle codescene`

### 2.4 Mutation ✅ DONE
- 🆕 `backend/graphql/mutation/teachers/payroll.mutation.ts` — `applyPayrollOverride(input)` field.
- ✏️ `backend/graphql/mutation/teachers/index.ts` — re-export.
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/teachers/payroll.mutation.ts --lifecycle codescene`

### 2.5 Query + mutation tests
- 🧪 `backend/graphql/query/teachers/payroll.query.test.ts` — returns page shape; respects `limit`/`offset`; permission denied → GraphQL error.
- 🧪 `backend/graphql/mutation/teachers/payroll.mutation.test.ts` — mutation returns result shape; permission denied → GraphQL error; mutation-argument coverage (per `docs/testing/mutation-argument-coverage.md`).
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/query/teachers/payroll.query.test.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts backend/graphql/mutation/teachers/payroll.mutation.test.ts --lifecycle codescene`
- 🔁 `bun test backend/graphql/query/teachers/payroll.query.test.ts`
- 🔁 `bun test backend/graphql/mutation/teachers/payroll.mutation.test.ts`

### 2.6 CSV export route ✅ DONE
- 🆕 `app/api/payroll/export/route.ts` — Next.js Route Handler; calls `requireAuth` + `requirePermission(ACCOUNTING_PAYROLL_VIEW)`; calls `PayrollCalculationService.getReport` with `limit: 10_000`; serializes CSV; sets `Content-Type` + `Content-Disposition` + `X-Export-Truncated` headers.
- 🧪 `app/api/payroll/export/route.test.ts` — happy path returns CSV; permission denied returns 403; truncation header set when `totalCount > 10_000`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/api/payroll/export/route.ts" --lifecycle codescene`

### 2.7 Phase-2 acceptance
- ✅ GraphQL schema builds (`bun run graphql:build`).
- ✅ Codegen (`bun run graphql:codegen`) produces typed `PayrollReportQuery` + `ApplyPayrollOverrideMutation` hooks.

---

## Phase 3 — Navigation, routes, i18n (shell)

> Goal: routes exist, nav item renders, permission gating works. No reports page yet.

### 3.1 Page-permission entries ✅ DONE
- ✏️ `frontend/common/types/page-permissions.types.ts` — add `accountingPayrollView` + `accountingPayrollManage` as **arrays** cast to `PagePermissions` (per existing convention):
  ```ts
  accountingPayrollView: [AppPermission.ACCOUNTING_PAYROLL_VIEW] as PagePermissions,
  accountingPayrollManage: [AppPermission.ACCOUNTING_PAYROLL_MANAGE] as PagePermissions,
  ```
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/types/page-permissions.types.ts --lifecycle codescene`

### 3.2 Sidebar nav item + nav label additions ✅ DONE
- ✏️ `frontend/common/views/dashboard/config/navigationConfig.ts` — add `accounting-payroll` item to `SIDEBAR_NAV_ITEMS` under `grp_finance`; add `AppPermission.ACCOUNTING_PAYROLL_VIEW` to `grp_finance` group `permission` array.
- ✏️ `frontend/common/views/dashboard/config/navIconKeys.ts` — verify `payments` is already in `NavIconKey` union (it is — no change needed).
- ✏️ `shared/locale/types/dashboard/core/nav.ts` — add `readonly accountingPayroll: string;` to `DashboardNavigationLabels` (label lives in the existing `dashboard.core.nav` namespace, NOT in the new `dashboard.billing.payroll` namespace).
- ✏️ `shared/locale/en/dashboard/core/nav.ts` — add `accountingPayroll: "Payroll"`.
- ✏️ `shared/locale/ar/dashboard/core/nav.ts` — add `accountingPayroll: "الرواتب"`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/core/nav.ts --lifecycle codescene`

### 3.3 i18n namespace (four-artifact compile-time i18n) ✅ DONE
- 🆕 `shared/locale/types/dashboard/billing/payroll.ts` — define `PayrollLabels` interface per implementation.md §7.1 (use TypeScript function-typed fields where interpolation is needed — not ICU strings).
- ✏️ `shared/locale/types/dashboard/billing/index.ts` — add `export * from "./payroll";`.
- ✏️ `shared/locale/types/message.ts` — register `dashboard.billing.payroll` in `MessageSchema`.
- 🆕 `shared/locale/namespaces/dashboard/billing/payroll.namespace.ts` — define namespace via `defineNamespace<PayrollLabels>("dashboard.billing.payroll", { load: { en, ar } })`.
- ✏️ `shared/locale/namespaces/dashboard/billing/index.ts` — add `export * from "./payroll.namespace";` (create if missing).
- 🆕 `shared/locale/en/dashboard/billing/payroll.ts` — EN translations (`dashboardBillingPayrollEn`).
- 🆕 `shared/locale/ar/dashboard/billing/payroll.ts` — AR translations (`dashboardBillingPayrollAr`).
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/billing/payroll.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/namespaces/dashboard/billing/payroll.namespace.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/billing/payroll.ts --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/billing/payroll.ts --lifecycle codescene`

### 3.4 Errors namespace extension (separate locale) ✅ DONE
- ✏️ `shared/locale/types/errors/index.ts` — add new `PayrollErrors` interface with `notTerminal`, `alreadyPaid`, `awaitingSettlement`, `invalidTargetStatus`, `partialRequiresPercentage` (and add `readonly payroll: PayrollErrors;` to `ErrorsLabels`).
- ✏️ `shared/locale/en/errors/index.ts` — EN strings for `payroll.*`.
- ✏️ `shared/locale/ar/errors/index.ts` — AR strings for `payroll.*`.
- 🔁 `bun run scripts/health/sub-loop.ts shared/locale/types/errors/index.ts --lifecycle codescene`

### 3.5 Locale snapshot ✅ DONE
- 🔁 `bun run locale:snapshots` (or project equivalent) — generate `public/static/locale-snapshots/{en,ar}/dashboard.billing.payroll.json`.
- ✅ Verify snapshots committed.

### 3.6 Route shell
- 🆕 `app/(dashboard)/accounting/payroll/page.tsx` — server component that renders `<PayrollReportsContainer />`.
- 🔁 `bun run scripts/health/sub-loop.ts "app/(dashboard)/accounting/payroll/page.tsx" --lifecycle codescene`

### 3.7 Phase-3 acceptance
- ✅ `/accounting/payroll` renders (with permission) / 403 (without).
- ✅ Sidebar "Payroll" item visible only with `ACCOUNTING_PAYROLL_VIEW` or `ACCOUNTING_PAYROLL_MANAGE`.
- ✅ AR/EN snapshots exist.

---

## Phase 4 — Payroll Reports page

### 4.1 Apollo documents
- 🆕 `frontend/common/graphql/sharedDocuments/teachers/payroll.documents.ts` — `payrollReportQueryDocument` + `applyPayrollOverrideMutationDocument` (both `TypedDocumentNode<Operations.X, Types.Y>`, camelCase + `Document` suffix per `sharedDocuments/AGENTS.md`; include `id`-equivalent fields `instanceId` + `auditEventId` so Apollo cache can auto-update).
- ✏️ `frontend/common/graphql/sharedDocuments/teachers/index.ts` — add `export * from "./payroll.documents";`.
- 🔁 After Phase 2 lands: `bun run generate:gqlSchema && bun codegen` so `Operations.PayrollReportQuery`, `Operations.ApplyPayrollOverrideMutation`, + their `Types.Args` exist.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/teachers/payroll.documents.ts --lifecycle codescene`

### 4.2 View-model hook
- 🆕 `frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel.ts` — manages Apollo query state, filter state (Zustand slice), pagination, debounced search, "Export CSV" handler.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel.ts --lifecycle codescene`

### 4.3 Zustand filter store
- 🆕 `frontend/common/stores/payrollReportsFilterStore.ts` — `teacherId`, `studentId`, `dateFrom`, `dateTo`, `calculationStatuses`, `search`, `page`, `pageSize`; `reset()`, `clearFilters()`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/stores/payrollReportsFilterStore.ts --lifecycle codescene`

### 4.4 Filter bar component
- 🆕 `frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar.tsx` — teacher autocomplete, student autocomplete, date-range picker, status multi-select, search input (debounced 300 ms).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar.tsx --lifecycle codescene`

### 4.5 Status chip component
- 🆕 `frontend/common/views/dashboard/accounting/payroll/CalculationStatusChip.tsx` — MUI `Chip` with colored variant per `CalculationStatus` (red=Refund, blue=Calculated, grey=Not Calculated, amber=Partially, indigo=Waiting Paid, green=Paid).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/CalculationStatusChip.tsx --lifecycle codescene`

### 4.6 DataGrid component
- 🆕 `frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid.tsx` — MUI `DataGrid` v9 with columns per §4.1; per-row "Override" action (gated on `ACCOUNTING_PAYROLL_MANAGE`); aggregate footer card; CSV export button.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid.tsx --lifecycle codescene`

### 4.7 Container + view
- 🆕 `frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer.tsx` — composes filter bar + data grid + override dialog; uses `usePayrollReportsViewModel`.
- 🆕 `frontend/desktop/views/dashboard/accounting/payroll/payroll.desktop.tsx` + `frontend/mobile/views/dashboard/accounting/payroll/payroll.mobile.tsx` — responsive view variants (per existing `ReportsContainer` pattern).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer.tsx --lifecycle codescene`

### 4.8 Page tests
- 🧪 `frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer.test.tsx` — renders rows; filters debounce; empty state; CSV button navigates to `/api/payroll/export?...`; "Override" action hidden without `_MANAGE`.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer.test.tsx`

---

## Phase 5 — Override dialog

### 5.1 Override dialog component
- 🆕 `frontend/common/views/dashboard/accounting/payroll/OverrideDialog.tsx` — RadioGroup (4 modes), conditional percentage field, note field, optional `force` checkbox, summary card of current values, Submit/Cancel.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/OverrideDialog.tsx --lifecycle codescene`

### 5.2 Override form state
- 🆕 `frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel.ts` — local form state + `useMutation(applyPayrollOverrideMutationDocument)` (Apollo hook imported from `@apollo/client/react`) + cache evict + error mapping.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel.ts --lifecycle codescene`

### 5.3 Override dialog tests
- 🧪 `frontend/common/views/dashboard/accounting/payroll/OverrideDialog.test.tsx`:
  - RadioGroup toggles percentage field visibility.
  - Validation blocks invalid submits (Partially without pct; Refund/Partially without note).
  - Double-click submit → only one mutation call (`clientRequestId` absorbs).
  - `PAYROLL_ALREADY_PAID` → inline banner, non-dismissable.
  - `PAYROLL_AWAITING_SETTLEMENT` → `force` checkbox highlighted.
  - Success closes dialog + cache evict + success toast.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/OverrideDialog.test.tsx --lifecycle codescene`
- 🔁 `bun test frontend/common/views/dashboard/accounting/payroll/OverrideDialog.test.tsx`

### 5.4 Audit drawer extension
- ✏️ `frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.tsx` — add a "Payroll Calculation" card: status chip, calculated duration, paid amount + currency, note, chronological list of `PAYROLL_OVERRIDE` events; "Override" button (gated on `ACCOUNTING_PAYROLL_MANAGE`).
- 🧪 `frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.test.tsx` — card renders when payroll fields are present; "Override" button opens the dialog.
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.tsx --lifecycle codescene`

### 5.5 Phase-5 acceptance
- ✅ Full Refund / Calculated / Not Calculated / Partially flows work end-to-end in dev.
- ✅ Double-submit produces exactly one `class_status_events` row.
- ✅ Audit drawer card renders and opens the override dialog.

---

## Phase 6 — Backfill script + audit observability

### 6.1 Backfill script (out-of-band)
- 🆕 `scripts/payroll-backfill.ts` — `bun run` script that iterates over `class_instances WHERE execution_state IN (...) AND calculation_status = 'Not Calculated'` and calls `PayrollCalculationService.calculateForInstance({ forceRecalc: true, ... })`. Supports `--dryRun` flag that prints the proposed patches without writing.
- 🧪 `scripts/payroll-backfill.test.ts` — idempotency (running twice produces zero new updates the second time); `--dryRun` produces no writes.
- 🔁 `bun run scripts/health/sub-loop.ts scripts/payroll-backfill.ts --lifecycle codescene`

### 6.2 Structured logging
- ✏️ `backend/services/teachers/payroll-calculation.service.ts` — confirm structured `logger.info` on every successful calculation + override with `actorUserId`, `instanceId`, `previousStatus`, `newStatus`, `amount` (NFR-11).
- 🔁 `bun run scripts/health/sub-loop.ts backend/services/teachers/payroll-calculation.service.ts --lifecycle codescene`

### 6.3 Audit-log integration
- ✏️ `backend/services/teachers/payroll-calculation.service.ts` — emit an `audit.log` event for every override (reuse existing `AuditService.log` pattern, if present in the project).
- 🔁 `bun run scripts/health/sub-loop.ts <audit-call-site> --lifecycle codescene`

---

## Phase 7 — i18n polish, accessibility, observability

### 7.1 Full key coverage
- ✏️ `shared/locale/namespaces/dashboard/accounting/payroll.namespace.ts` — confirm every user-visible string has EN + AR (per implementation.md §7.1 table).
- 🔁 `bun run locale:validate` (or project equivalent) — fail if any key missing in either locale.

### 7.2 Accessibility pass
- ✏️ `PayrollReportsDataGrid.tsx` — aria-labels on filter inputs, sortable columns announced, status chip has `aria-label` with full status text.
- ✏️ `OverrideDialog.tsx` — aria-labels on RadioGroup, percentage input, note field; focus trap; keyboard nav; Escape closes.
- 🧪 `OverrideDialog.test.tsx` + `PayrollReportsDataGrid.test.tsx` — add axe-core assertions (existing project pattern).
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/OverrideDialog.tsx --lifecycle codescene`
- 🔁 `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid.tsx --lifecycle codescene`

### 7.3 RTL pass
- ✏️ Confirm AR locale renders RTL; status chips + percentage input align right; filter bar mirrors LTR layout.
- 🧪 `OverrideDialog.test.tsx` — RTL snapshot matches expected.

---

## Phase 8 — End-to-end & regression

### 8.1 E2E test
- 🧪 `e2e/accounting/payroll.spec.ts` (Playwright, if project uses it):
  - Log in as accounting operator.
  - Open `/accounting/payroll`, filter by teacher.
  - Verify rows render with status chips.
  - Open Override dialog on a `CALCULATED` row, switch to `Refund`, confirm.
  - Verify row updates to `REFUND` + amount 0.
  - Re-open dialog, switch to `Partially` with pct=50, confirm.
  - Verify row updates to `PARTIALLY` + `isPartialPercentage=50`.
  - Click "Export CSV"; verify the downloaded file has the expected rows.
- 🔁 `bun run scripts/health/sub-loop.ts e2e/accounting/payroll.spec.ts --lifecycle codescene`

### 8.2 Regression suite
- 🔁 `bun test backend/db/test/repo/scheduling/scheduling.repository.test.ts`
- 🔁 `bun test backend/db/test/logic/scheduling/class_instances_security.test.ts`
- 🔁 `bun test backend/db/test/logic/scheduling/class_rescheduling.test.ts`
- 🔁 `bun test backend/services/scheduling/scheduling-payroll-trigger.test.ts`
- 🔁 `bun test backend/services/teachers/payroll-calculation.service.test.ts`
- 🔁 `bun test backend/services/teachers/payroll-override.service.test.ts`
- 🔁 `bun test backend/services/teachers/teacher-due-payroll-integration.test.ts`
- 🔁 `bun test backend/graphql/query/teachers/payroll.query.test.ts`
- 🔁 `bun test backend/graphql/mutation/teachers/payroll.mutation.test.ts`

### 8.3 Full quality gate
- 🔁 Run project-wide `lint`, `typecheck`, `test`, `build`.
- 🔁 `bun run scripts/health/sub-loop.ts <each-new-file> --lifecycle codescene` for every file created/edited in Phases 0–7.

### 8.4 Migration rehearsal on staging
- 🔁 Apply migration to a staging snapshot of prod data.
- ✅ Confirm row count of `class_instances` unchanged, new columns nullable/defaulted, no locks held > 100 ms.
- 🔁 Run `bun run scripts/payroll-backfill.ts --dryRun` against staging; review proposed patch counts with accounting.
- 🔁 Run `bun run scripts/payroll-backfill.ts` against staging; verify exit code 0 + idempotent on second run.

---

## Definition of Done

- [ ] All Phase 0–8 tasks complete.
- [ ] Every touched file passes `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit 0).
- [ ] `specs.md` acceptance criteria AC-1.1 … AC-9.5 each have a passing test.
- [ ] Edge cases E1–E20 each covered by a test or explicit "won't happen" note.
- [ ] Migration is additive, zero-downtime, idempotent.
- [ ] EN + AR locale snapshots committed.
- [ ] Existing scheduling / state-machine / teacher-dues / teacher-payments flows regression-green.
- [ ] 🔗 Plan 4 (`session-event-audit`) can read the new payroll fields via the existing `ClassInstanceDetailPothosObject` extension.

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

## Cross-plan handoff checklist (for Plan 4 owner)

- [ ] `class_instances` extended with the 8 new payroll columns.
- [ ] `CalculationStatus` enum registered in GraphQL via `CalculationStatusPothosEnum`.
- [ ] `ClassInstanceDetailPothosObject` exposes `calculationStatus`, `teacherPaidAmount`, `teacherPaidCurrency`, `calculatedDuration`, `isPartialPercentage`, `payrollNote`, `payrollCalculatedAt`.
- [ ] `payrollReport` query live with `PayrollReportFilter` input.
- [ ] `applyPayrollOverride` mutation live.
- [ ] `/api/payroll/export` route returns CSV.
- [ ] EN + AR locale snapshots for `dashboard.accounting.payroll`.

---

## Test Coverage Backfill: Cross-Actor Journeys & 4-Tier Enforcement

> Closes the gap between this plan and the enforced test kinds added later to the spec process
> (.agents/skills/spec-implementation/SKILL.md → "Plan Intake" items 5-7 + "Test-Layer Coverage
> Gate"; docs/testing/workflow-journey-tests.md). Existing tasks are unchanged; these tasks are
> additive and execute before this plan is treated as test-complete.

- [ ] TB.1 Journey: session reaches terminal state (teacher attendance telemetry) → auto-calculation runs → accounting operator sees the calculated row (+ teacher absence / student absence money outcome) 
  - Create `test/workflows/payroll/auto-calculation-to-payroll-visibility.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (terminal `executionState` → `calculationStatus = CALCULATED` with `teacherPaidAmount`/`teacherPaidCurrency` persisted in the same tx), cross-actor visibility (accounting operator with `ACCOUNTING_PAYROLL_VIEW` reads the row via `payrollReport`; the teacher and student-facing surfaces must not expose the payroll amounts), side effects (grace/on-time/student-absent/teacher-absent amount outcomes; `PAYROLL_STATUS_TRANSITION`/override event history remains empty on auto-calc), denial paths for unauthorized actors
  - Verify: `bun run test/scripts/run-test.ts test/workflows/payroll/auto-calculation-to-payroll-visibility.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-2, US-3, US-4, US-5, AC-2.1–AC-2.6, AC-9.1_
- [ ] TB.2 Journey: accounting operator applies override → lesson-report approval accrues `teacher_dues` from `teacherPaidAmount` (status flips to `WAITING_PAID`) → operator marks dues paid (status flips to `PAID`, further overrides rejected)
  - Create `test/workflows/payroll/override-to-settlement-lifecycle.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (`CALCULATED` → overridden state → `WAITING_PAID` → `PAID` across `class_instances` + `teacher_dues` in the same transactions), cross-actor visibility (audit drawer surfaces `PAYROLL_OVERRIDE` + `PAYROLL_STATUS_TRANSITION` events with the operator's `actorUserId`; the teacher sees only their settled dues, never the override internals), side effects (`teacher_dues` amount equals `teacherPaidAmount`; `class_status_events` rows appended; duplicate override submission within the idempotency window produces no second event), denial paths for unauthorized actors (override on `PAID` rejected with `PAYROLL_ALREADY_PAID`; `WAITING_PAID` requires `force`)
  - Verify: `bun run test/scripts/run-test.ts test/workflows/payroll/override-to-settlement-lifecycle.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-6, US-9, AC-6.1–AC-6.10, AC-9.4, AC-9.5_
- [ ] TB.3 Journey: unauthorized actors (teacher / parent / student / non-accounting staff) attempt payroll query, override mutation, and CSV export → all denied without touching state
  - Create `test/workflows/payroll/payroll-permission-denials.test.ts` (test-first; real services + real DB; NO `runInRollback`; committed fixtures in `beforeAll` + tracked hard delete in `afterAll`; cast helper in `test/workflows/helpers/`; spy notification dispatch via `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")`)
  - Assert: shared-state transitions (none — rows unchanged under denial), cross-actor visibility (`payrollReport` query, `applyPayrollOverride` mutation, and `/api/payroll/export` each reject with `INSUFFICIENT_PERMISSIONS` for actors lacking `ACCOUNTING_PAYROLL_VIEW`/`ACCOUNTING_PAYROLL_MANAGE`; `VIEW`-only actor cannot override), side effects (no `class_status_events` / `audit_logs` rows from denied calls), denial paths for unauthorized actors
  - Verify: `bun run test/scripts/run-test.ts test/workflows/payroll/payroll-permission-denials.test.ts` green, then `bun run test:workflows`
  - Reference: `docs/testing/workflow-journey-tests.md`, `test/workflows/AGENTS.md`
  - _Requirements: US-7, AC-7.1–AC-7.5, E19_
- [ ] TB.4 4-Tier verification for payroll service + repository files
  - Confirm Tier 1 branch coverage + Tier 4 abuse/permission cases exist and green for: `backend/services/teachers/payroll-calculation.service.ts`, `backend/services/teachers/payroll-grace-settings.ts`, `backend/services/teachers/payroll-override.idempotency.ts`, `backend/services/teachers/teacher-due.service.ts` (payroll-amount consumption + status flips), `backend/services/scheduling/scheduling.service.ts` (auto-trigger wiring), `backend/db/repo/scheduling/class-instances.ts` (`getById` forUpdate / `updatePayrollCalculation` / `findPayrollReportRows`), `backend/db/repo/scheduling/class-status-events.repository.ts` (`findRecentByInstanceAndHash`), `backend/lib/sanitize/richTextSanitizer.ts` (`sanitizePlainText`)
  - Fill gaps via `.agents/skills/write-tests/SKILL.md` + `.agents/skills/test-expert/SKILL.md`; repo tests inside `runInRollback` with `tx` propagation; service tests mock all external channels
  - Verify with `bun run test/scripts/run-test.ts <each test file>`
  - _Requirements: cross-cutting (US-2–US-7, AC-6.7–AC-6.8, E15–E16)_
- [ ] TB.5 Penetration verification (skip only if plan has no new endpoints/mutations)
  - BOLA/IDOR across the roles in this plan (teacher / accounting operator / admin against other teachers' payroll rows via `payrollReport` filters and `applyPayrollOverride` on arbitrary `instanceId`s); permission denial on `applyPayrollOverride` and `payrollReport`; wildcard injection on the report search/text filters and CSV export query string; `payrollNote` XSS/sanitizer bypass attempts against `sanitizePlainText`; `force` flag escalation without `ACCOUNTING_PAYROLL_MANAGE`
  - Via `.agents/skills/pentester/SKILL.md`
  - _Requirements: US-7, AC-7.1–AC-7.5, E15, E16_
