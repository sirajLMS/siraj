# Quota System — Implementation Guide

## Document Information

- **Feature Name**: Quota Entity + Recurring-Class Integration
- **Version**: 1.0
- **Date**: 2026-07-30
- **Related Documents**:
  - [Design Specifications](./specs.md)
  - [Trackable Tasks](./trackable-tasks.md)

## Pre-Implementation Checklist

Before starting any task in [trackable-tasks.md](./trackable-tasks.md):

- [ ] Read root `AGENTS.md` and layer-specific AGENTS.md for each file you touch
- [ ] Read [specs.md](./specs.md) for the design decisions that govern your task
- [ ] Mark the task `[-]` in trackable-tasks.md when starting
- [ ] Mark the task `[x]` when complete and verified
- [ ] Run per-file verification loop before importing new code elsewhere

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

### Scheduling schema edits (`backend/db/schema/classes/scheduling.ts`)

Add to `recurring_schedules`:
- `quotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome`

Add to `class_instances`:
- Extend `executionState` enum with 4 on-demand values
- New `ondemandStatus` column

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

Integrates with existing `TeacherAvailabilityService`. Throws translated `slot.conflict` error.

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

### Integration edits

**`backend/services/schedule/recurring-class.service.ts`:**
- `validateCreateRecurringClass`: call `AvailabilityService.assertSchedulePatternAvailable` + `QuotaService.findOpen`
- `createScheduleAndDeductCredits`: call `QuotaService.redeemForInstance` in per-instance loop
- Cancellation handler: `QuotaService.releaseForRecurringSchedule`
- ON_DEMAND mode: skip up-front `generateInstancesForWeeks`
- Mode switch: archive un-taken instances + refund credits/quota

**`backend/services/teacher/teacher-dashboard.service.ts`:**
- `bookClass`: add `AvailabilityService.assertSlotAvailable` before insert

**`backend/services/billing/credit.service.ts`:**
- After ANY credit change: `QuotaService.refreshStudentOndemandInstances(studentId, tx)` in same transaction

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

## Phase 6: Permissions & Notifications

### Permissions

`backend/enum/permissions/permission.enum.ts`:
```typescript
QUOTAS_VIEW = "quotas.view"
QUOTAS_MANAGE = "quotas.manage"
```

Seed grants in `backend/db/seeds/permissions/`.

### Notifications

`backend/enum/notifications/notificationDeliveries.enum.ts` — add 7 events.

`shared/constants/notification-event-allowlists.ts` — allowlist all 7.

`backend/services/notification/quota-notification.builders.ts` (new) — 7 payload builders.

Register in `backend/services/notification/notification-payloads.builders.ts`.

Category metadata on each event: `info` / `reminder` / `urgent` / `digest`.

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
- Re-evaluates existing PENDING_CREDIT instances
- Idempotent via unique `(recurringScheduleId, scheduledStartAt)`
- `package.json`: `"ondemand:generate": "bun run scripts/ondemand-instance-generator.ts"`

### `scripts/ondemand-no-credits-resolver.ts`

- Hourly; applies `OnDemandNoCreditsOutcome` to imminent instances
- Lead time from `ondemand_no_credits_resolution_lead_minutes` (default 240)
- `package.json`: `"ondemand:resolve": "bun run scripts/ondemand-no-credits-resolver.ts"`

### `scripts/ondemand-teacher-digest-cron.ts`

- Hourly; emits digest per teacher at their local `ondemand_teacher_digest_hour`
- `package.json`: `"ondemand:teacher-digest": "bun run scripts/ondemand-teacher-digest-cron.ts"`

## Phase 8: Backend Tests

Use `bun run scripts/run-test/run-test.ts <path>` — never raw `bun test` for DB tests.

| Test file | Coverage |
|-----------|----------|
| `backend/db/test/repo/billing/quota.repository.test.ts` | CRUD, optimistic lock, FIFO, expire, refresh |
| `backend/db/test/repo/billing/quota-ledger.repository.test.ts` | insert, idempotency, computeBalance |
| `backend/db/test/logic/billing/quota.service.test.ts` | reserve/release, invariant, race test |
| `backend/db/test/logic/billing/quota-expiry-sweeper.test.ts` | idempotent sweeper, EXPIRE/GRANT rows |
| `backend/db/test/logic/scheduling/availability.service.test.ts` | conflict detection |
| On-demand generator test | generation, status flip, conflict held |

Race test mirrors `backend/db/test/logic/scheduling/class_quota_race.test.ts`.

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

| Route | Purpose | Permission |
|-------|---------|------------|
| `/quotas` | Admin list | `QUOTAS_VIEW` |
| `/quotas/new` | Create form | `QUOTAS_MANAGE` |
| `/quotas/[id]` | Detail view | `QUOTAS_VIEW` |
| `/quotas/[id]/edit` | Edit form | `QUOTAS_MANAGE` |
| `/quotas/insights` | Admin charts | `QUOTAS_VIEW` |
| `/students/[id]/quotas` | Redirect → `?tab=quotas` | `QUOTAS_VIEW` |

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

**Insights page charts:**
- Quota purchases over time
- Redemption rate by quota type
- On-demand class delivery rate
- PENDING_CREDIT backlog gauge
- Expired slippage

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

`frontend/common/views/dashboard/students/profile/studentProfileTabs.ts`:
- Wire `quotas` tab (replaces/extends existing quota tab)
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

## Phase 14: Quality Gate

```bash
bun quality-gate:fresh
```

Fix any failures per AGENTS.md workflow:
- tsgo → biome → lint → codescene → sonar (sequential)
- Use `bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>` for per-file fixes

## Idempotency Key Conventions

| Operation | Key pattern |
|-----------|-------------|
| Quota grant on create | `quota-grant:<quotaId>` |
| Per-instance redeem (pool) | `quota-redeem:<classInstanceId>:<quotaId>` |
| Earmark reserve | `quota-reserve:<recurringScheduleId>:<quotaId>` |
| Release on cancel (pool) | `quota-release:<classInstanceId>:<quotaId>` |
| Release on cancel (earmark) | `quota-release:<recurringScheduleId>:<classInstanceId>:<quotaId>` |
| Expire (sweeper) | `quota-expire:<quotaId>:<period>` |
| Periodic grant (sweeper) | `quota-period-grant:<quotaId>:<period>` |

## Common Pitfalls

1. **Mixing `tx` and `db` in repo calls inside transactions** — always pass `tx` to all repo methods in a transaction (causes deadlocks)
2. **`expect().rejects.toThrow()` inside `runInRollback`** — use try/catch helper instead
3. **Mutating `quotas.remaining` without ledger row** — always insert ledger row in same transaction
4. **Using `useLazyQuery`** — use stateful `useQuery` exclusively
5. **Hardcoded error strings** — always use typed translation functions
6. **MUI v9 style props on Typography/Stack** — use `sx` prop instead
7. **Forgetting codegen after schema changes** — run `generate:gqlSchema && codegen`
8. **Querying seed data in tests** — create test data via `entity-setup.ts` helpers
