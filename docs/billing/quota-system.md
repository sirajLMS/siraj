# Quota System

This document describes the complete Quota System — an append-only ledger-based class credit tracking system with FIFO allocation, periodic rollover, and on-demand scheduling integration.

## Architecture Overview

The Quota System replaces per-instance credit deductions with a centralized quota allocation that tracks student credits through an **append-only ledger**. Key design principles:

- **Append-Only Ledger (`quota_ledger`)**: All quota mutations (grants, reservations, redemptions, releases, expirations) are recorded as ledger rows. The ledger is the single source of truth.
- **Denormalized Cached Columns (`quotas`)**: The `quotas` table maintains snapshot columns (`remaining`, `reservedClasses`, `usedThisPeriod`) updated in the same transaction as ledger writes. These are performance-optimized cached values — never read without verifying against ledger.
- **FIFO Selection**: When multiple quotas exist for a student, the system selects the highest-priority active quota with remaining credits (priority DESC, then by `validUntil` ASC).
- **Idempotency Keys**: Every ledger entry includes an `idempotencyKey` (SHA-256 hash of deterministic inputs) to prevent double-deductions. The ledger has a unique index on this key.
- **Optimistic Concurrency**: The `quotas` table has a `version` counter incremented on every write to prevent concurrent modification conflicts.
- **No CASCADE Deletes**: `quota_ledger.quotaId` uses FK `ON DELETE RESTRICT` to preserve the immutable audit trail.

## Data Model

### `quotas` Table

| Column | Type | Description |
|---|---|---|
| `id` | UUID PK | Unique quota identifier |
| `studentId` | UUID FK → `students.id` | Student who owns this quota |
| `kind` | `quotaKindEnum` | `PACKAGE` (one-time) or `PERIODIC` (recurring) |
| `name` | varchar(255) | Human-readable name |
| `totalClasses` | integer | Total classes granted |
| `remaining` | integer | Classes remaining (cached) |
| `reservedClasses` | integer | Classes reserved for recurring schedules (cached) |
| `usedThisPeriod` | integer | Classes consumed in current period (for periodic quotas) |
| `periodType` | `quotaPeriodTypeEnum` | `WEEKLY`, `MONTHLY`, `CUSTOM` (PERIODIC only) |
| `periodDays` | integer | Number of days per period (for CUSTOM type) |
| `periodAnchor` | timestamp | Reference datetime for period calculation |
| `validFrom` / `validUntil` | date | Valid date range |
| `status` | `quotaStatusEnum` | `ACTIVE`, `EXPIRED`, `ARCHIVED` |
| `priority` | integer | FIFO selection priority (higher = selected first) |
| `rolloverPolicy` | jsonb | `{ maxRolloverPercent, accumulationCap }` for PERIODIC quotas |
| `version` | integer | Optimistic concurrency counter |
| `idempotencyKey` | varchar(255) UNIQUE | Creation idempotency |
| `createdAt` / `updatedAt` / `deletedAt` | timestamp | Soft-delete support |

**CHECK constraints:**
1. `quotas_kind_consistency`: PACKAGE quotas must have NULL period fields; PERIODIC must have periodType + periodDays NOT NULL
2. `remaining >= 0`
3. `reservedClasses <= remaining`
4. `usedThisPeriod >= 0`
5. `rolloverPolicy` must be either NULL or valid JSON (`maxRolloverPercent`, `accumulationCap`)

### `quota_ledger` Table (Append-Only)

| Column | Type | Description |
|---|---|---|
| `id` | UUID PK | Unique ledger entry ID |
| `quotaId` | UUID FK → `quotas.id` RESTRICT | Quota this entry belongs to |
| `studentId` | UUID FK → `students.id` | Student |
| `recurringScheduleId` | UUID FK SET NULL | Related recurring schedule |
| `classInstanceId` | UUID FK SET NULL | Related class instance |
| `delta` | integer | Positive = grant, negative = consume/expire |
| `reason` | `quotaLedgerReasonEnum` | `GRANT`, `RESERVE`, `REDEEM`, `RELEASE`, `EXPIRE`, `ADJUST` |
| `reasonNote` | text | Human-readable context |
| `idempotencyKey` | text UNIQUE | SHA-256 hash for idempotent operations |
| `actorUserId` | UUID FK → SET NULL | Who performed the operation |
| `createdAt` / `updatedAt` | timestamp | Audit timestamps |

**Key constraint:** FK `ON DELETE RESTRICT` on `quotaId` — quotas cannot be deleted while ledger entries exist. Must archive ledger entries first or use soft deletes.

### Enums

| Enum | Values |
|---|---|
| `QuotaKind` | `PACKAGE`, `PERIODIC` |
| `QuotaStatus` | `ACTIVE`, `EXPIRED`, `ARCHIVED` |
| `QuotaPeriodType` | `WEEKLY`, `MONTHLY`, `CUSTOM` |
| `QuotaLedgerReason` | `GRANT`, `RESERVE`, `REDEEM`, `RELEASE`, `EXPIRE`, `ADJUST` |

### Scheduling Mode Extensions

On `recurring_schedules`:
- `quotaId` — links to quota
- `earmarkedClasses` — classes reserved upfront
- `schedulingMode` — `SCHEDULED`, `ON_DEMAND`
- `generationHorizonWeeks` — how far ahead to generate instances
- `ondemandNoCreditsOutcome` — what to do when credits run dry

On `class_instances`:
- `quotaDeducted` — already exists, extended with ON_DEMAND CHECK constraints
- `ondemandStatus` — `PENDING_CREDIT`, `CREDIT_RESERVED`, `CONFLICT_HELD`, `NO_CREDITS_CANCELLED`, `NO_CREDITS_ABSENT`
- `state_machine_chk` — updated to include ON_DEMAND_PENDING_CREDITS, ON_DEMAND_CONFLICT_HELD, ON_DEMAND_NO_CREDITS_CANCELLED, ON_DEMAND_NO_CREDITS_ABSENT
- `ondemand_status_scheduling_mode_chk` — ensures on demand status consistency

## Business Logic

### Idempotency Key Generation

All quota writes derive their idempotency key via SHA-256:

| Operation | Key Pattern |
|---|---|
| Grant | `quota-grant:{quotaId}` |
| Redeem for instance | `quota-redeem:{classInstanceId}:{quotaId}` |
| Reserve for schedule | `quota-reserve:{recurringScheduleId}:{quotaId}` |
| Release from pool | `quota-release:{classInstanceId}:{quotaId}` |
| Release from earmark | `quota-release:{scheduleId}:{instanceId}:{quotaId}` |
| Expire for period | `quota-expire:{quotaId}:{periodStr}` |

### FIFO Selection

`QuotaRepository.selectQuotaForBookingFIFO(studentId, tx?)` selects the best active quota:
1. Filter to ACTIVE status
2. Sort by priority DESC, then validUntil ASC
3. Return the first quota with `remaining > 0`

### Periodic Rollover

The expiry sweeper handles PERIODIC quotas:
1. Calculate `rolloverAmount = Math.floor(remaining * maxRolloverPercent / 100)`, capped at `accumulationCap`
2. Write EXPIRE ledger entry for consumed portion
3. Write GRANT ledger entry for rollover amount
4. `refreshPeriodic` zeros out `usedThisPeriod` and replenishes `remaining` inline (no separate `resetUsedThisPeriod` call)

### On-Demand Flow

1. Cron job (`scripts/ondemand-instance-generator.ts`) runs daily, fetches active ON_DEMAND recurring schedules
2. For each eligible student with `classesRemaining > 0`, validates slot availability via `AvailabilityService`
3. Generates `classInstances` with `ondemandStatus = PENDING_CREDIT`
4. At session-start time, `ClassSessionService.activateClassInstance` calls `QuotaService.redeemForInstance` to consume a credit (see `ResitationPolicy` credit deduction is WITHOUT CREDIT)

### Reservation Flow (Scheduling) Flow

1. When creating a new recurring schedule with `schedulingMode = SCHEDULED` and a `quotaId`:
   - Pool mode: `QuotaService.redeemForInstance` per generated instance
   - Earmark mode: `QuotaService.reserveForRecurringSchedule` reserves the count upfront
2. When canceling a schedule: `cancelSchedule` releases reserved quota slots
3. When switching scheduling modes: `dispatchMaintenanceReleases` adjusts reservations

## Integration Points

### AvailabilityService

`backend/services/scheduling/availability.service.ts` provides point-in-time slot availability checks. Methods:
- `isSlotAvailable(studentId, teacherId, startAt, endAt)` — point-lookup on `class_instances` + `TeacherAvailabilityRepository.validateBookingAvailability`

### RecurringClassService

`backend/services/schedule/recurring-class.service.ts`:
- `cancelSchedule(userId, recurringScheduleId)` — releases quota reservations, refunds credits, archives untaken instances
- `switchSchedulingMode(userId, recurringScheduleId, newMode)` — adjusts reservations based on mode transition (e.g., SCHEDULED → ON_DEMAND frees up quota; ON_DEMAND → SCHEDULED reverts to instance-based deductions)

### CreditService

`backend/services/billing/credit.service.ts`:
- After ANY credit change, calls `QuotaService.refreshStudentOndemandInstances(studentId, tx)` in the same transaction. This ensures on-demand instance state reflects current credit balances.

### ClassSessionService

`backend/services/session/class-session.service.ts`:
- At session-start (`activateClassInstance` / `startSession`): if `ondemandStatus='PENDING_CREDIT'` and `quotaId` is set, calls `QuotaService.redeemForInstance`. If no quota, falls back to `CreditService.deductForBooking`.

### TeacherDashboardService

`backend/services/teacher/teacher-dashboard.service.ts`:
- `createManualEntry`: if quota-backed, calls `QuotaService.redeemForInstance`; else `CreditService.deductForBooking` (prevents double deduction that existed with repo-direct SQL).

## State Machine — On-Demand States

All state machine changes removed from `backend/db/repo/scheduling/state-changes.ts`:
- `handleQuotaDeduction` (lines 698–720) — REMOVED; quota deduction is now Service-only
- `adjustQuotaOnUpdate` quota branches (lines 333–366, 368–391) — REMOVED

## Permission Model

| Permission | Value | Scope |
|---|---|---|
| `QUOTAS_VIEW` | `"quotas.view"` | Read-only access to quotas, balances, ledger |
| `QUOTAS_MANAGE` | `"quotas.manage"` | Create, update, delete quotas + manage reservations |

Both are applied on every `QuotaService` method. The `SuperLeader` and `STAFF` roles get `QUOTAS_VIEW` seeded by default; `QUOTAS_MANAGE` is for admins.

## Frontend

### Quota Insights View

Located at `frontend/common/views/dashboard/billing/quota/`:
- `QuotaInsightsContainer.tsx` — tier-neutral container
- `useQuotaInsightsViewModel.ts` — ViewModel with data fetching
- Rendered at `/quotas/insights`

### Student Quota Tab

Located at `frontend/common/views/dashboard/students/quota/`:
- `StudentQuotaContainer.tsx` — Container
- `processStudentQuotaViewModel.ts` — ViewModel
- `QuotaFormAccessProvider.tsx` — Permissions gate
- `studentQuotaSchema.ts` — Zod schema

Tier renderers:
- Desktop: `frontend/desktop/views/dashboard/students/quota/studentQuota.desktop.tsx` + 4 components (contextualHelperCards, courseDetailsSection, sectionHeader, studentInformationSection)
- Mobile: `frontend/mobile/views/dashboard/students/quota/studentQuota.mobile.tsx` + same 4 sub-components
- Tab registered in `studentsProfileTabs.ts` under `QUOTA_TAB_GROUPS`
- Per-audience rendering: student/parent see PENDING_CREDIT prominently; teacher sees CONFLICT_HELD at top

### Quota Model (Zustand)

Located at `frontend/stores/quotaStore.ts` — form state survives viewport tier switch.

### Navigation

- Sidebar: quota items under Billing group (`grp_finance`) — `/quotas`, `/quotas/new`, `/quotas/[id]`, `/quotas/[id]/edit`, `/quotas/insights`
- Bottom nav (mobile): `BOTTOM_NAV_ITEMS` includes quota when user has `QUOTAS_VIEW`

## Cron Jobs

| Script | Frequency | Description |
|---|---|---|
| `quota-expiry-sweeper.ts` | Daily | Expires overdue non-periodic quotas + periodic rollover with GRANT/EXPIRE ledger entries |
| `ondemand-instance-generator.ts` | Daily | Generate class instances for active ON_DEMAND recurring schedules (only students with `classesRemaining > 0`) |
| `ondemand-no-credits-resolver.ts` | Hourly | Resolves PENDING_CREDIT instances within `leadMinutes` of start time |
| `ondemand-teacher-digest-cron.ts` | Daily at `default` hour | Per-teacher daily digest of pending ON_DEMAND instances |

npm scripts registered in `package.json`:
- `"quota:expire"`
- `"ondemand:generate"`
- `"ondemand:resolve"`
- `"ondemand:teacher-digest"`

## System Settings (from `backend/db/migration/4c-system_settings_seed.sql`)

| Key | Default | Description |
|---|---|---|
| `default_ondemand_horizon_weeks` | 4 | How far ahead to generate ON_DEMAND instances |
| `default_ondemand_no_credits_outcome` | `NO_CREDITS_CANCELLED` | Default outcome when no credits available |
| `ondemand_teacher_digest_hour` | 9 UTC | Hour to send teacher digests |
| `ondemand_no_credits_resolution_lead_minutes` | 240 | Minutes before start to handle credit issues |
| `quota_low_balance_threshold_percent` | 20 | Percent remaining to trigger low-balance notification |

## Notification Events & Categories

| Event Type | Category |
|---|---|
| `QUOTA_EXPIRING_SOON` | `reminder` |
| `QUOTA_EXPIRED` | `info` |
| `QUOTA_LOW_BALANCE` | `reminder` |
| `ON_DEMAND_INSTANCE_PENDING_CREDIT` | `urgent` |
| `ON_DEMAND_INSTANCE_REMINDER_T3` | `reminder` |
| `ON_DEMAND_INSTANCE_REMINDER_T1` | `urgent` |
| `ON_DEMAND_TEACHER_DAILY_DIGEST` | `digest` |

All 7 events:
1. Registered in `NotificationEventType` enum
2. Added to allowlists in `shared/constants/notification-event-allowlists.ts`
3. Have category mappings in `NotificationEventCategory` enum + `NOTIFICATION_EVENT_CATEGORY` mapping
4. Have payload builders in `backend/services/notification/quota-notification.builders.ts`
5. Registered in `notification-payloads.builders.ts`
6. Rendered (with category toggle controls) in notification preferences UI

## GraphQL API

### Mutations

| Mutation | Permission | Resolver |
|---|---|---|
| `createQuota(input)` | `QUOTAS_MANAGE` | `QuotaService.createQuota` |
| `updateQuota(id, input)` | `QUOTAS_MANAGE` | `QuotaService.updateQuota` |
| `deleteQuota(id)` | `QUOTAS_MANAGE` | `QuotaService.deleteQuota` |

### Queries

| Query | Permission | Resolver |
|---|---|---|
| `quota(id)` | `QUOTAS_VIEW` | `QuotaService.getQuota` |
| `quotas(filter?, pagination?)` | `QUOTAS_VIEW` | `QuotaService.listQuotas` |
| `studentQuotas(studentId)` | `QUOTAS_VIEW` | `QuotaService.listStudentOpenQuota` |
| `studentQuotaBalance(studentId)` | `QUOTAS_VIEW` | `QuotaService.getStudentQuotaBalance` |
| `quotaLedger(quotaId, pagination?)` | `QUOTAS_VIEW` | `QuotaLedgerRepository` |

### Object Types

- `Quota` — full quota entity with all fields
- `QuotaLedger` — individual audit entry
- `QuotaBalance` — aggregated balance with `breakdownByExpiration`
- `QuotaExpirationBreakdown` — per-quota expiration detail
- `QuotaPaginatedResult`, `QuotaLedgerPaginatedResult` — paginated results

## Quok: Key Cashes & Constraints

### Led Guide

1. **FK RESTRICT on `quota_ledger.quotaId`**: Deleting a quota requires first deleting/archiving all its ledger entries. CASCADE was replaced with RESTRICT to preserve the immutable audit trail.
2. **CHECK constraints**: 5 constraints on `quotas` enforce data integrity at the database level (kind/period consistency, non-negative counters, reserved not exceeding remaining).
3. **Ledger insert idempotency**: The `quota_ledger` table uses `idempotencyKey UNIQUE` index. `insert` in `quotaRepository` checks first for existing entry and returns early — do NOT use `ON CONFLICT DO NOTHING` for bulk invocations across concurrent PG connections (race).
4. **All cache references to be read as "mail":** `remaining` and `reservedClasses` on `quotas` are cached columns. The single source of truth is always `quota_ledger`. These cache columns are updated atomically in the same Drizzle transaction as the ledger write.
5. **Optimistic locking via `version`**: Every write increments `version`. Concurrent writes will get EDIT error — handle with retries.
6. **No direct SQL on quota columns**: All quota state changes outside `quota.repository.ts` are PROHIBITED. This includes `CreditService` directly touching `class_instances.quotaDeducted` — the now-removed code in `state-changes.ts` previously did this.
7. **Transaction safety**: Ledger writes, cache updates, and idempotency checks always share the same `tx`. The ledger is the single writer — no other code touches quota columns.
,  per instance
(Injection handled by `ChecksUserBusinessLeaderClassTypes, this is a contingent ISA rule per Phase 3)

## Test Coverage

| Test Category | Files | Coverage |
|---|---|---|
| Repository unit tests | `quota.repository.test.ts`, `quota-ledger.repository.test.ts` | CRUD, optimistic lock, FIFO, idempotency, balance computation |
| Service logic tests | `quota.service.test.ts`, `quota-expiry-sweeper.test.ts` | reserve/release invariants, sweeper with GRANT/EXPIRE rows |
| **NOT DONE**: Race condition test | `quota.service.test.ts` | Concurrent quota modification scenarios NOT implemented |

All tests use `runInRollback` wrapper. All pass: 825/825.

## Frontend

### i18w Translated Keys

Quota error keys in `shared/locale/types/errors/index.ts`:
- `quotaMustBeNonNegative`
- `quotaExceedsTotal`
- `outOfQuota`
- `leaveQuotaExceeded`
- `quotaExpired`
- `quotaNotFound`
- `invalidQuotaState`

Quota label keys in `shared/locale/types/dashboard/billing/quota.ts` + en and ar translations.

### Event Category

`NotificationEventCategory` enum maps 33 events to categories (`info`/`reminder`/`urgent`/`digest`). The notification preferences UI (desktop + mobile) renders category toggles alongside individual event toggles.

## Integration Rollout Summary

The core infrastructure (quotas + ledger + service + permissions) plus notification events, cron scripts, and the full frontend pages (quota list/create/detail/edit/insights + student quota tab + recurring class form extensions) are all COMPLETED. Outstanding:

1. **Race condition tests** for quota reservation/redemption are not yet added
2. **Optional seed data** (sample quotas in seed)
3. **Global health check** — needs final `bun tsgo && bun biome:check && bun run lint` run

## Related Files

- Design specifications: [`.ai/plans/quota/specs.md`](../../.ai/plans/quota/specs.md)
- Implementation guide: [`.ai/plans/quota/implementation.md`](../../.ai/plans/quota/implementation.md)
- Task tracking: [`.ai/plans/quota/trackable-tasks.md`](../../.ai/plans/quota/trackable-tasks.md)
- All outcomes: [`.ai/plans/quota/outcome/`](../../.ai/plans/quota/outcome/)