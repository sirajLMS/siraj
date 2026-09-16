# Phase 4 Outcome: GraphQL & Permissions

## Tasks Covered
- Task 8: GraphQL layer (pothos objects, mutations, queries, barrel re-exports)
- Task 9: Permissions (enum values, seed grants)
- Task 10: Navigation & Sidebar Config

---

## Implementation Details

### Task 8: GraphQL Layer

#### 8.1 — `quota.pothos.ts`

Created `backend/graphql/pothos/billing/quota.pothos.ts` with:
- **`QuotaPothosObject`** — exposes all `quotas` table columns: `id`, `studentId`, `name`, `kind`, `totalClasses`, `remaining`, `reservedClasses`, `validFrom` (nullable — `date` columns can be null), `validUntil` (nullable), `status`, `periodType` (nullable), `periodDays` (nullable), `priority`, `version`, `createdAt`, `updatedAt`
- **`QuotaLedgerPothosObject`** — uses `delta` (not `amount`/`balanceAfter`) and `reasonNote` (not `notes`) matching the actual DB schema columns
- **`QuotaExpirationBreakdownPothosObject`** — exposes `quotaId`, `quotaName`, `validUntil`, `remaining` (matches `QuotaExpirationBreakdown` type)
- **`QuotaBalancePothosObject`** — exposes `studentId`, `totalActiveClasses`, `totalRemaining`, `totalReserved`, `breakdownByExpiration` (matches `QuotaBalanceReturnType`)
- **`QuotaPaginatedResultPothosObject`** and **`QuotaLedgerPaginatedResultPothosObject`** — standard paginated wrappers
- **`AvailableSlotPothosObject`** — exposes `startAt`, `endAt`, `isAvailable` from `availability.service.ts`
- **`QuotaSubmitInputPothosRef`** — matches `QuotaSubmitInput` (includes `name`, `periodDays`, `priority`; no `periodInterval`/`maxRolloverClasses`)
- **`QuotaUpdateInputPothosRef`** — matches `QuotaUpdateInput` (includes `name`, `validUntil`, `status`, `priority`, `version`)
- **`QuotaPaginatedFilterPothosRef`** — `studentId`, `kind`, `status`

**PITFALL**: Pothos-generated input types use `T | null | undefined` for optional fields. The `QuotaSubmitInput` type was updated to allow `null` on optional fields (`periodType`, `periodDays`, `validFrom`, `validUntil`, `priority`, `idempotencyKey`, and `rolloverPolicy` children) to avoid TS2345 errors when Pothos passes the inferred input to service functions.

#### 8.2 — `quota.mutation.ts`

- **`createQuota`**: requires `QUOTAS_MANAGE`, calls `QuotaService.createQuota`
- **`updateQuota`**: requires `QUOTAS_MANAGE`, calls `QuotaService.updateQuota`
- **`deleteQuota`**: requires `QUOTAS_MANAGE`, calls `QuotaService.deleteQuota`

#### 8.3 — `quota.query.ts`

- **`quota`**: single quota by ID, requires `QUOTAS_VIEW`
- **`quotas`**: paginated list with optional filter+pagination, requires `QUOTAS_VIEW`
- **`studentQuotas`**: all quotas for a given student
- **`studentOpenQuotas`**: only ACTIVE quotas for a student
- **`quotaBalance`**: aggregated balance + breakdown
- **`quotaLedger`**: paginated ledger for a quota
- **`availableClassSlots`**: time slots from `AvailabilityService`

#### 8.4 — Barrel re-exports

- `backend/graphql/pothos/billing/index.ts` — added quota pothos exports
- `backend/graphql/mutation/billing/index.ts` — added quota mutation import
- `backend/graphql/query/billing/index.ts` — added quota query import

#### 8.5 — `recurring-class.pothos.ts`

Added scheduling mode fields to the `CreateRecurringClassInput` pothos input type:
- `schedulingMode`, `quotaId`, `ondemandNoCreditsOutcome`, `generationHorizonWeeks`, `earmarkedClasses`

Also updated `frontend/common/graphql/test/helpers.ts` `mutateCreateRecurringClass` to include all new optional fields as `null` defaults.

#### 8.6 — Codegen

Ran `bun run generate:gqlSchema && bun codegen` successfully.

---

### Task 9: Permissions

- Added `QUOTAS_VIEW = "quotas.view"` and `QUOTAS_MANAGE = "quotas.manage"` to `backend/enum/permissions/permission.enum.ts`
- Seeded grants in `backend/db/seeds/permissions/`
- **Fixed pre-existing bug**: `SETTINGS_TIMEZONES_VIEW` did not exist; corrected to `SCHEDULE_VIEW_TIMEZONES` in:
  - `app/(dashboard)/settings/page.tsx`
  - `backend/graphql/pothos/system/timezones-settings.pothos.ts`

---

### Task 10: Navigation & Sidebar Config

- Added quota nav items under `grp_finance` in `navigationConfig.ts`
- Added `QUOTAS_VIEW` and `QUOTAS_MANAGE` to `PAGE_PERMISSIONS` in `frontend/common/types/page-permissions.types.ts`
- Added i18n label keys to `shared/locale/types/dashboard/core/nav.ts`, `en/dashboard/core/nav.ts`, `ar/dashboard/core/nav.ts`

---

## Type Fixes Applied

### `backend/types/billing/quota.types.ts`
- `QuotaReturnType`: Omit `kind | status | periodType` from select + remap to enum types
- Added `mapQuotaToReturnType` and `mapQuotaLedgerToReturnType` mapper functions
- `QuotaPaginatedResult.pageInfo` and `QuotaLedgerPaginatedResult.pageInfo` made **optional** (`pageInfo?`) since resolvers don't always populate it
- `QuotaSubmitInput`: allow `null` on `idempotencyKey`, `rolloverPolicy` children to match Pothos inference

### `backend/services/billing/quota.service.ts`
- `updateQuota` and `deleteQuota` now use `mapQuotaToReturnType(...)` instead of unsafe `as QuotaReturnType` casts

### `frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel.ts`
- Added 4 `ON_DEMAND_*` keys to `statusLabels` type to match `Record<ClassExecutionState | ClassOutcome, string>`

---

## Pitfalls & Lessons

1. **DB schema vs. type vs. Pothos alignment is critical**: Column names like `delta` (not `amount`/`balanceAfter`), `reasonNote` (not `notes`), `periodDays` (not `periodInterval`), `priority` (not exposed via column alias) must be verified against `$inferSelect` before writing Pothos expose calls.

2. **Pothos input inference nullability**: Pothos converts `t.int({ required: false })` to `number | null | undefined` in the inferred input object type. All fields in the canonical TypeScript input type that map to optional Pothos fields must accept `null` (not just `undefined`) to avoid TS2345.

3. **`pageInfo` must be optional in paginated results**: Resolvers that return `{ rows, totalCount }` directly (without cursor-based pagination) will fail tsgo if `pageInfo` is required. Make it `pageInfo?: PageInfo | null`.

4. **`validFrom` on quota is nullable**: The `date` column in Drizzle is `string | null` (no `.notNull()`), so the Pothos expose call must include `nullable: true`.

5. **Pre-existing permission enum bugs**: `SETTINGS_TIMEZONES_VIEW` was used in 2 places but never defined. The correct name is `SCHEDULE_VIEW_TIMEZONES`.

---

## Carry-Over Points for Phase 5+ (Frontend GraphQL & i18n)

- Quota queries/mutations are now in the schema. Next: write GraphQL documents in `frontend/common/graphql/sharedDocuments/billing/quota.documents.ts`
- Re-run `bun run generate:gqlSchema && bun codegen` after adding documents
- The `statusLabels` extension pattern (4 ON_DEMAND keys) was needed for teacher class views — verify mobile teacher view also gets these from translations
