# Quota System — Implementation Guide

## Document Information

- **Feature Name**: Quota Entity + Recurring-Class Integration
- **Version**: 1.1 (updated after ground-truth verification)
- **Date**: 2026-07-30
- **Related Documents**:
  - [Design Specifications](./specs.md)
  - [Trackable Tasks](./trackable-tasks.md)

## Pre-Implementation Checklist

Before starting any task in [trackable-tasks.md](./trackable-tasks.md):

- [ ] Read root `AGENTS.md` at `/home/ahmed/Projects/siraj/AGENTS.md`
- [ ] Read layer-specific AGENTS.md for each file you touch (see Task-to-Instructions Mapping below)
- [ ] Read applicable `.agents/instructions/*.instructions.md` files (see Task-to-Instructions Mapping below)
- [ ] Read [specs.md](./specs.md) for the design decisions that govern your task
- [ ] Mark the task `[-]` in trackable-tasks.md when starting
- [ ] Mark the task `[x]` when complete and verified
- [ ] Run per-file verification loop before importing new code elsewhere
- [ ] **After quality loop: Run instruction verification subtask to revalidate files against instruction files**

## User Experience & Navigation (from specs.md)

### New Routes & Permissions

| Route | Permission | Roles |
|-------|------------|-------|
| `/quotas` | `QUOTAS_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/quotas/new` | `QUOTAS_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/quotas/[id]` | `QUOTAS_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/quotas/[id]/edit` | `QUOTAS_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/quotas/insights` | `QUOTAS_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/students/[id]/profile?tab=quota` | `StudentsOverrideQuota` | ALL (student, parent, teacher, supervisor) |

### Sidebar Navigation

Quota pages are **sub-items under Billing** in the **Finance (grp_finance)** group:
- Billing → Quotas (list, new, view, edit, insights)
- Mobile: add to `BOTTOM_NAV_ITEMS` for STAFF+ roles

### Student Quota Tab

Enhanced for **all audiences** (student, parent, teacher, supervisor) with per-audience rendering. No dedicated teacher quota page.

### Mobile vs Desktop

Separate view trees under `frontend/desktop/` and `frontend/mobile/` with shared ViewModels and navigation config.

## Task-to-Instructions Mapping

Each task in trackable-tasks.md falls under one or more instruction files. Read ALL matching files before starting:

| Task Path Prefix | Applicable AGENTS.md Files | Applicable .agents/instructions Files |
|-----------------|----------------------------|----------------------------------------|
| `backend/db/schema/**` | `/home/ahmed/Projects/siraj/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| `backend/db/repo/**` | `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| `backend/db/test/**` | `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| `backend/services/**` | `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| `backend/graphql/**` | `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| `backend/types/**` | `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| `backend/enum/**` | `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| `scripts/**` | `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` (if DB ops) |
| `shared/locale/**` | `/home/ahmed/Projects/siraj/shared/AGENTS.md` | (none specific) |
| `app/**` | `/home/ahmed/Projects/siraj/app/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| `frontend/common/**` | `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| `frontend/desktop/**` | `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| `frontend/mobile/**` | `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| `test/ui/**` | `/home/ahmed/Projects/siraj/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |

**Note**: A file may match multiple prefixes — read ALL matching instruction files.

## Implementation Strategy

Build bottom-up in dependency order:

1. **Schema & enums** → types → repositories → services → GraphQL
2. **AvailabilityService** before recurring-class integration
3. **QuotaService** before recurring-class quota hooks
4. **Cron scripts** after services they depend on
5. **Frontend GraphQL docs + codegen** before any frontend views
6. **Frontend views** after i18n namespace exists
7. **Quality gate** as final verification

### Development Conventions (from AGENTS.md)

- Runtime: **Bun** (not Node.js)
- Logging: `logger` from `@/backend/lib/logger` (backend) or `@/frontend/utils/logger` (frontend) — never `console.*`
- Path aliases: `@/*` maps to project root — no relative imports across layers
- i18n: compile-time system in `shared/locale/` — never hardcode user-facing strings
- GraphQL documents: `frontend/common/graphql/sharedDocuments/<domain>.documents.ts`
- GraphQL hooks: import from `@apollo/client/react` — **NO `useLazyQuery`**
- Database tests: always use `runInRollback` wrapper; never `expect().rejects.toThrow()` inside it
- After schema changes: `bun run generate:gqlSchema && bun codegen`
- After DB schema: `bun run db push` (no migrate for new tables during dev)

### Per-File Verification Loop

After creating or extracting a file, before importing it elsewhere:

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<the-file>"]}'
```

## Phase 1: Database Schema & Enums

### New schema files

**`backend/db/schema/billing/quotas.ts`**
- `quotas` table with all columns from specs.md
- Relations to `students` and `recurringSchedules`
- Indexes: `(studentId, status, remaining) WHERE deletedAt IS NULL AND status='ACTIVE' AND remaining>0`, `(validUntil) WHERE status='ACTIVE'`
- Export via `backend/db/schema/billing/index.ts`

**`backend/db/schema/billing/quota-ledger.ts`**
- `quota_ledger` append-only table
- All indexes from specs.md
- Export via billing index barrel

### Enum additions to `backend/db/schema/enums.ts`

| Enum | Values |
|------|--------|
| `quotaKindEnum` | `PACKAGE`, `PERIODIC` |
| `quotaStatusEnum` | `ACTIVE`, `EXPIRED`, `ARCHIVED` |
| `quotaPeriodTypeEnum` | `WEEKLY`, `MONTHLY`, `CUSTOM` |
| `quotaLedgerReasonEnum` | `GRANT`, `RESERVE`, `REDEEM`, `RELEASE`, `EXPIRE`, `ADJUST` |
| `schedulingModeEnum` | `NUMBER_OF_CLASSES`, `ON_DEMAND`, `QUOTA` |
| `onDemandNoCreditsOutcomeEnum` | `AUTO_CANCEL`, `AUTO_ABSENT_NO_CREDITS`, `REMIND_ONLY` |
| `onDemandStatusEnum` | `PENDING_CREDIT`, `AVAILABLE`, `CONVERTED`, `NO_CREDITS_CANCELLED`, `NO_CREDITS_ABSENT`, `CANCELLED` |

**Also extend existing `executionState` enum** (in same file, line 60) with 4 new values:
- `ON_DEMAND_PENDING_CREDITS`, `ON_DEMAND_CONFLICT_HELD`, `ON_DEMAND_NO_CREDITS_CANCELLED`, `ON_DEMAND_NO_CREDITS_ABSENT`

### Scheduling schema edits (`backend/db/schema/classes/scheduling.ts`)

Add to `recurring_schedules`:
- `quotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome`

Add to `class_instances`:
- Extend `executionState` enum with 4 on-demand values (via enum in enums.ts)
- New `ondemandStatus` column (enum, nullable)

**Note:** `quotaDeducted` boolean column **already exists** (line 170) with CHECK constraint — do NOT add it.

### TypeScript enums

**`backend/enum/billing/quota.enum.ts`** (new):
- `QuotaKind`, `QuotaStatus`, `QuotaPeriodType`, `QuotaLedgerReason`

**`backend/enum/scheduling/scheduling.enum.ts`** (new):
- `SchedulingMode`, `OnDemandNoCreditsOutcome`, `OnDemandStatus`

Register all enums in `backend/graphql/pothos/shared/enum.pothos.ts`.

### Apply schema

```bash
bun run db push
```

## Phase 2: Backend Types

**`backend/types/billing/quota.types.ts`** (new):

```typescript
// Canonical types — never define these in Pothos files
QuotaSelectType, QuotaInsertType, QuotaReturnType
QuotaSubmitInput, QuotaUpdateInput
QuotaLedgerSelectType, QuotaLedgerInsertType, QuotaLedgerReturnType
QuotaBalanceReturnType  // includes breakdownByExpiration[]
```

Re-export from `backend/types/billing/index.ts`.

**`backend/types/scheduling/scheduling.types.ts`** (edit):
- Add `quotaId?`, `earmarkedClasses?`, `schedulingMode?`, `generationHorizonWeeks?`, `ondemandNoCreditsOutcome?` to `CreateRecurringClassInput`

## Phase 3: Repository Layer

### `backend/db/repo/billing/quota.repository.ts`

Key methods:
- `create`, `findById`, `listByStudent`, `listActiveByStudent`, `listAllPaginated`
- `update` (optimistic lock via `version`)
- `softDelete`
- `reserveClasses`, `releaseClasses`, `redeemForInstance`, `releaseForInstance`
- `selectQuotaForBookingFIFO` — `ORDER BY priority ASC, validUntil ASC NULLS LAST, createdAt ASC`
- `expireOverdue`, `refreshPeriodic`

**Critical pattern:** Every write inserts a `quota_ledger` row AND updates cached columns in the **same transaction**.

### `backend/db/repo/billing/quota-ledger.repository.ts`

Key methods:
- `insert`, `findByQuotaId`, `findByClassInstanceId`, `findByRecurringScheduleId`
- `findByIdempotencyKey`, `computeBalance` (SUM for reconciliation)

Re-export both from `backend/db/repo/billing/index.ts`.

## Phase 4: Service Layer

### `backend/services/scheduling/availability.service.ts` (new)

```typescript
AvailabilityService.assertSlotAvailable(studentId, teacherId, startAt, endAt, ignoreInstanceIds?)
AvailabilityService.assertSchedulePatternAvailable(studentId, teacherId, days[], startDate, endDate, ignoreInstanceIds?)
AvailabilityService.findAvailableSlots(studentId, teacherId, dateRange, durationMinutes)
AvailabilityService.isSlotAvailable(...)
```

**Implementation:** Point lookups on `class_instances` (indexes on `studentId, scheduledStartAt` and `teacherId, scheduledStartAt` exist) + `TeacherAvailabilityRepository` queries for teacher windows/unavailability/vacations. **NOT** `AvailabilitySearchService` (that is cross-staff search). Throws translated `slot.conflict` error.

### `backend/services/billing/quota.service.ts` (new)

```typescript
QuotaService.createQuota, getQuota, listQuotas, listStudentOpenQuotas
QuotaService.updateQuota, deleteQuota
QuotaService.reserveForRecurringSchedule, releaseForRecurringSchedule
QuotaService.redeemForInstance, releaseForInstance
QuotaService.selectQuotaForBooking  // FIFO helper
QuotaService.refreshPeriodicQuotas, expireOverdueQuotas
QuotaService.refreshStudentOndemandInstances(studentId, tx)
```

Permission-gated: `QUOTAS_MANAGE` for writes, `QUOTAS_VIEW` for reads.
All errors via `getServerTranslations(locale, "errors")`.

### `backend/services/billing/quota-notification.service.ts` (new)

Emits 7 notification events with category tags. Called from QuotaService and cron scripts.

### Integration edits — **CRITICAL: Replace repo direct SQL**

**`backend/services/schedule/recurring-class.service.ts`:**
- `validateCreateRecurringClass`: call `AvailabilityService.assertSchedulePatternAvailable` + `QuotaService.findOpen`
- `createScheduleAndDeductCredits`: **REMOVE** the per-instance loop calling `CreditService.deductForBooking` when `quotaId` is set. Instead:
  - Pool mode: call `QuotaService.redeemForInstance` per instance
  - Earmark mode: call `QuotaService.reserveForRecurringSchedule` up front
  - No quota: keep existing `CreditService.deductForBooking` loop (FIXED to single deduction)
- Cancellation handler: `QuotaService.releaseForRecurringSchedule`
- ON_DEMAND mode: skip up-front `generateInstancesForWeeks`
- Mode switch: archive un-taken instances + refund credits/quota

**`backend/db/repo/scheduling/state-changes.ts`:**
- **REMOVE** `handleQuotaDeduction` (lines 698-720) — direct SQL `-1` on `classesRemaining` with no ledger
- **REMOVE** `adjustQuotaOnUpdate` quota-deduction branches (lines 333-366, 368-391) — direct SQL `+/-1` with no ledger
- Keep non-quota logic (student swap without quota, etc.)
- Quota-backed operations now go through `QuotaService` + ledger

**`backend/services/teacher/teacher-dashboard.service.ts`:**
- `createManualEntry` (lines 104-112): currently sets `quotaDeducted: true` AND calls `CreditService.deductForBooking` → double deduction. Change to: if quota-backed, call `QuotaService.redeemForInstance`; else `CreditService.deductForBooking`.

**`backend/services/billing/credit.service.ts`:**
- After ANY credit change: `QuotaService.refreshStudentOndemandInstances(studentId, tx)` in same transaction

**`backend/services/session/class-session.service.ts`:**
- On-demand credit deduction at session-start: in `activateClassInstance` / `startSession` flow, if instance has `ondemandStatus='PENDING_CREDIT'` and `quotaId` set, call `QuotaService.redeemForInstance`; if no quota, call `CreditService.deductForBooking`.

## Phase 5: GraphQL Layer

### New files

- `backend/graphql/pothos/billing/quota.pothos.ts` — objects + input refs
- `backend/graphql/mutation/billing/quota.mutation.ts` — create/update/delete
- `backend/graphql/query/billing/quota.query.ts` — all queries + `availableClassSlots`

Re-export from billing index barrels.

### Recurring class Pothos edit

`backend/graphql/pothos/classes/recurring-class.pothos.ts`:
- Add new fields to `CreateRecurringClassInputPothosObject`

After all Pothos changes:

```bash
bun run generate:gqlSchema && bun codegen
```

## Phase 6: Permissions, Notifications & Navigation

### Permissions

`backend/enum/permissions/permission.enum.ts`:
```typescript
QUOTAS_VIEW = "quotas.view"
QUOTAS_MANAGE = "quotas.manage"
```

Seed grants in `backend/db/seeds/permissions/`.

**Navigation & Sidebar Config for Quota Pages**

`frontend/common/views/dashboard/config/navigationConfig.ts`:
- Add quota nav items under Billing group (grp_finance) as children of Billing:
  - `quotas.list` → `/quotas` (permission: `QUOTAS_VIEW`)
  - `quotas.create` → `/quotas/new` (permission: `QUOTAS_MANAGE`)
  - `quotas.view` → `/quotas/[id]` (permission: `QUOTAS_VIEW`)
  - `quotas.edit` → `/quotas/[id]/edit` (permission: `QUOTAS_MANAGE`)
  - `quotas.insights` → `/quotas/insights` (permission: `QUOTAS_VIEW`)
- Ensure `SUPERVISOR` and `STAFF` roles get `QUOTAS_VIEW` in seeded permission groups (add to `staff_default` and `supervisor_default` groups in SQL migration)
- Add quota items to `BOTTOM_NAV_ITEMS` for mobile (filter by `QUOTAS_VIEW`)

### Notifications

`backend/enum/notifications/notificationDeliveries.enum.ts` — add 7 events.

`shared/constants/notification-event-allowlists.ts` — allowlist all 7.

`backend/services/notification/quota-notification.builders.ts` (new) — 7 payload builders.

Register in `backend/services/notification/notification-payloads.builders.ts`.

**Category metadata on each event:** `info` / `reminder` / `urgent` / `digest` — **greenfield** (no existing category concept). Must extend:
- `NotificationEventType` enum builder to carry category
- `notification-payloads.builders.ts` registration to include category
- Frontend notification-prefs UI with category-level mute toggle

## Phase 7: Cron Scripts

### `scripts/quota-expiry-sweeper.ts`

- Daily; idempotent per `(quotaId, period)`
- Writes EXPIRE rows for overdue quotas
- Periodic refresh: new GRANT + EXPIRE per rollover policy
- `package.json`: `"quota:expire": "bun run scripts/quota-expiry-sweeper.ts"`

### `scripts/ondemand-instance-generator.ts`

- Daily; walks `schedulingMode=ON_DEMAND` schedules
- Generates instances for `generationHorizonWeeks` horizon
- Checks `AvailabilityService` before each slot
- Sets executionState based on credit balance
- **Optimization:** Re-evaluates PENDING_CREDIT only for students with `classesRemaining > 0` (indexed query)
- Idempotent via existing unique `idempotencyKey` pattern (`recurring-${id}-${day}-${iso}`)
- `package.json`: `"ondemand:generate": "bun run scripts/ondemand-instance-generator.ts"`

### `scripts/ondemand-no-credits-resolver.ts`

- Hourly; applies `OnDemandNoCreditsOutcome` to imminent instances
- Lead time from `ondemand_no_credits_resolution_lead_minutes` (default 240)
- `package.json`: `"ondemand:resolve": "bun run scripts/ondemand-no-credits-resolver.ts"`

### `scripts/ondemand-teacher-digest-cron.ts`

- Hourly; emits digest per teacher at their local `ondemand_teacher_digest_hour`
- **Teacher TZ derivation:** from `recurring_schedules.timezone` (for on-demand schedules) or `teacher_availability_windows.timezone` — no `timezoneOverride` on `teachers` table
- `package.json`: `"ondemand:teacher-digest": "bun run scripts/ondemand-teacher-digest-cron.ts"`

### System Settings Seed

Update existing migration file `backend/db/migration/4c-system_settings_seed.sql` (already has ON CONFLICT upsert) with 5 new keys:

```sql
('default_ondemand_horizon_weeks', '2', 'integer', 'Default rolling horizon in weeks for on-demand instance generation', 'scheduling', NOW()),
('default_ondemand_no_credits_outcome', 'AUTO_CANCEL', 'string', 'Default action when on-demand instance has no credits at session time: AUTO_CANCEL, AUTO_ABSENT_NO_CREDITS, REMIND_ONLY', 'scheduling', NOW()),
('ondemand_teacher_digest_hour', '9', 'integer', 'Local hour (0-23) for daily teacher digest of on-demand classes with no credits', 'scheduling', NOW()),
('ondemand_no_credits_resolution_lead_minutes', '240', 'integer', 'Minutes before session start to resolve on-demand instances with no credits', 'scheduling', NOW()),
('quota_low_balance_threshold_percent', '20', 'integer', 'Percentage of totalClasses at which quota low-balance notification fires', 'billing', NOW())
```

Then run:
```bash
bun db migrate && bun db push
```

No separate seed script needed — migration handles upsert automatically.

## Phase 8: Backend Tests

Use `bun run scripts/run-test/run-test.ts <path>` — never raw `bun test` for DB tests.

| Test file | Coverage |
|-----------|----------|
| `backend/db/test/repo/billing/quota.repository.test.ts` | CRUD, optimistic lock, FIFO, expire, refresh |
| `backend/db/test/repo/billing/quota-ledger.repository.test.ts` | insert, idempotency, computeBalance |
| `backend/db/test/logic/billing/quota.service.test.ts` | reserve/release, invariant, race test (mirror class_quota_race) |
| `backend/db/test/logic/billing/quota-expiry-sweeper.test.ts` | idempotent sweeper, EXPIRE/GRANT rows |
| `backend/db/test/logic/scheduling/availability.service.test.ts` | conflict detection (point lookup + teacher availability) |
| `backend/db/test/logic/scheduling/ondemand-generator.test.ts` | generation, status flip, conflict held |
| `backend/db/test/logic/billing/status-refresh-on-purchase.test.ts` | credit change triggers on-demand flip |

Race test mirrors `backend/db/test/logic/scheduling/class_quota_race.test.ts` (exists).

## Phase 9: Frontend — GraphQL & i18n

### GraphQL documents

**`frontend/common/graphql/sharedDocuments/billing/quota.documents.ts`** (new):
- `quotaQueryDocument`, `quotasQueryDocument`, `studentQuotasQueryDocument`
- `studentOpenQuotasQueryDocument`, `quotaLedgerQueryDocument`
- `createQuotaMutationDocument`, `updateQuotaMutationDocument`, `deleteQuotaMutationDocument`

**`frontend/common/graphql/sharedDocuments/scheduling/available-slots.documents.ts`** (new):
- `availableClassSlotsQueryDocument`

Update `recurring-class.documents.ts` with new fields.

Re-export from billing index barrel. Run codegen.

### i18n

**New namespace `dashboard/billing/quota`:**
- `shared/locale/types/dashboard/billing/quota.ts`
- `shared/locale/en/dashboard/billing/quota.ts`
- `shared/locale/ar/dashboard/billing/quota.ts`
- `shared/locale/namespaces/dashboard/billing/quota.namespace.ts`
- Register in `shared/locale/namespaces/index.ts`

**New error keys** in `shared/locale/types/errors/index.ts` (+ en/ar):
- `quota.insufficientRemaining`, `quota.exceedsCreditBalance`, `quota.periodicRefreshFailed`
- `quota.invalidPeriod`, `quota.alreadyExpired`, `quota.earmarkExceedsRemaining`
- `slotConflict`, `onDemandNoCredits`

## Phase 10: Frontend — Quota Pages & Views

### Routes (`app/(dashboard)/`)

| Route | Purpose | Permission | Roles |
|-------|---------|------------|-------|
| `/quotas` | Admin list | `QUOTAS_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/quotas/new` | Create form | `QUOTAS_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/quotas/[id]` | Detail view | `QUOTAS_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/quotas/[id]/edit` | Edit form | `QUOTAS_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/quotas/insights` | Admin charts | `QUOTAS_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/students/[id]/profile?tab=quota` | Student quota tab | `StudentsOverrideQuota` | ALL (student, parent, teacher, supervisor) |

### View structure (mirror existing dashboard patterns)

**Common layer** (`frontend/common/views/dashboard/quotas/`):
- `QuotaContainer.tsx`, `QuotaView.tsx`
- `useQuotaViewModel.ts`, `useQuotaDetailViewModel.ts`
- `schemas/quotaSchema.ts`, `types/quota.types.ts`
- `utils/quotaFormatters.ts`, `utils/buildQuotaColumns.tsx`

**Desktop tier** (`frontend/desktop/views/dashboard/quotas/`):
- `quotaView.desktop.tsx`, `components/quotaGrid.desktop.tsx`
- `components/quotaForm.desktop.tsx`, `components/quotaDetail.desktop.tsx`
- `components/quotaInsights.desktop.tsx`

**Mobile tier** (`frontend/mobile/views/dashboard/quotas/`):
- `quotaView.mobile.tsx`, `components/quotaList.mobile.tsx`
- `components/quotaForm.mobile.tsx`, `components/quotaDetail.mobile.tsx`

**Store:** `frontend/common/stores/quotaStore.ts` — form state survives tier switch.

### Navigation & Sidebar Config

`frontend/common/views/dashboard/config/navigationConfig.ts`:
- Add quota nav items under Billing group (grp_finance) as children of Billing page
- Items: list, new, view, edit, insights (all filtered by QUOTAS_VIEW/MANAGE)
- Add to `BOTTOM_NAV_ITEMS` for mobile with permission filtering

**Insights page charts:**
- Quota purchases over time
- Redemption rate by quota type
- On-demand class delivery rate
- PENDING_CREDIT backlog gauge
- Expired slippage

### Student Profile Quota Tab (Enhanced)

**Existing tab** at `app/(dashboard)/students/[id]/profile?tab=quota` — enhanced for **all audiences**:

| Audience | Prominent Content |
|----------|-------------------|
| **Student** | Own active quotas, PENDING_CREDIT on-demand classes, upcoming expirations |
| **Parent** | Children's quotas (read-only), low-balance alerts, on-demand reminders |
| **Teacher** | Assigned students' quotas, CONFLICT_HELD on-demand classes at top, redemption status |
| **Supervisor** | All students' quotas, analytics summary, expired quota alerts |

No dedicated teacher quota page — teachers access via student profile when viewing assigned students.

## Phase 11: Frontend — Recurring Class Form

### Schema & mapper edits

`frontend/common/views/dashboard/classes/recurring/schemas/recurringClassSchema.ts`:
- Add `quotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome`

`frontend/common/views/dashboard/classes/recurring/utils/mapRecurringClassFormData.ts`:
- Add fields to `mapFormDataToInput` and `mapFormDataToServiceInput`

### Store edit

`frontend/common/stores/createRecurringClassStore.ts`:
- Add `selectedQuotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome` + setters

### Form components

**Desktop** (`recurringClassFormFields.desktop.tsx`):
- `SchedulingMode` radio at top (NUMBER_OF_CLASSES / ON_DEMAND / QUOTA)
- `QuotaSection` — Autocomplete of `studentOpenQuotas` + earmark count field (QUOTA mode)
- `OnDemandSection` — horizon weeks + no-credits outcome picker (ON_DEMAND mode)
- `availableClassSlots` useQuery greys out taken slots

**Mobile** (`recurringClassFormFields.mobile.tsx`):
- Mirror desktop; inline-stacked sections, no drawer/wizard
- Section order: mode → student/teacher/subject → time/days → quota → on-demand → submit

### Student profile tab

**Existing tab at `app/(dashboard)/students/[id]/quota/page.tsx`** — only redirects to `?tab=quota`. Tab already registered in `studentProfileTabs.ts` with `QUOTA_TAB_GROUPS`.

`frontend/common/views/dashboard/students/profile/studentProfileTabs.ts` — already has `quota` tab.

**Enhance existing quota tab view** (currently at `frontend/common/views/dashboard/students/quota/` or similar):
- Per-audience rendering: student/parent see PENDING_CREDIT prominently; teacher sees CONFLICT_HELD at top

## Phase 12: Notification Prefs UI

Extend existing notification-prefs UI:
- Category-level mute toggle (`info`/`reminder`/`urgent`/`digest`)
- Surface 7 new events with their categories

## Phase 13: Seeds (Optional)

**`backend/db/seeds/billing/seed-quotas.ts`:**
- 1 PACKAGE, 1 MONTHLY, 1 CUSTOM-90-day quota per sample student
- GRANT ledger rows for each
- 2-3 on-demand recurring schedules

Re-export from `backend/db/seeds/billing/index.ts`.

## Phase 14: Quality Loop

```bash
# Per-file quality loop (run after each file creation/edit)
bun tsgo
bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<the-file>"]}'

# Fix failures, re-run until clean
# Then run instruction verification: validate against ALL applicable AGENTS.md and .agents/instructions files
# See Task-to-Instructions Mapping in implementation.md for the complete list per layer
```

Run the per-file loop for every new/modified file before importing it elsewhere. After all files pass per-file verification, the full quality gate can be run as final confirmation if needed (`bun quality-gate`), but the primary verification is the per-file loop with instruction validation.

## Idempotency Key Conventions

| Operation | Key pattern |
|-----------|-------------|
| Quota grant on create | `sha256("quota-grant:<quotaId>")` |
| Per-instance redeem (pool) | `sha256("quota-redeem:<classInstanceId>:<quotaId>")` |
| Earmark reserve | `sha256("quota-reserve:<recurringScheduleId>:<quotaId>")` |
| Release on cancel (pool) | `sha256("quota-release:<classInstanceId>:<quotaId>")` |
| Release on cancel (earmark) | `sha256("quota-release:<recurringScheduleId>:<classInstanceId>:<quotaId>")` |
| Expire (sweeper) | `sha256("quota-expire:<quotaId>:<period>")` |
| Periodic grant (sweeper) | `sha256("quota-period-grant:<quotaId>:<period>")` |

**Pattern matches `CreditService.deriveBookingIdempotencyKey`** (sha256 of `studentId:classInstanceId:operation`).

## Common Pitfalls

1. **Mixing `tx` and `db` in repo calls inside transactions** — always pass `tx` to all repo methods in a transaction (causes deadlocks)
2. **`expect().rejects.toThrow()` inside `runInRollback`** — use try/catch helper instead
3. **Mutating `quotas.remaining` without ledger row** — always insert ledger row in same transaction
4. **Using `useLazyQuery`** — use stateful `useQuery` exclusively
5. **Hardcoded error strings** — always use typed translation functions
6. **MUI v9 style props on Typography/Stack** — use `sx` prop instead
7. **Forgetting codegen after schema changes** — run `generate:gqlSchema && codegen`
8. **Querying seed data in tests** — create test data via `entity-setup.ts` helpers
9. **Leaving `handleQuotaDeduction` / `adjustQuotaOnUpdate` quota branches** — must remove them; quota ledger is the single writer
10. **Assuming `teacher.timezoneOverride` exists** — derive TZ from schedule/availability windows
11. **Using `AvailabilitySearchService` for conflict check** — use point lookups + `TeacherAvailabilityRepository`
12. **Missing category metadata on notification events** — greenfield; must extend enum builder + allowlist + UI