# Quota System — Trackable Tasks

## Document Information

- **Feature Name**: Quota Entity + Recurring-Class Integration
- **Version**: 1.2 (updated with navigation/permissions, quality loop, instruction verification)
- **Date**: 2026-07-30
- **Related Documents**:
  - [Design Specifications](./specs.md)
  - [Implementation Guide](./implementation.md)

## Task Status Legend

| Marker | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[-]` | In progress |
| `[x]` | Completed |

**Rules:**
- Mark a parent task `[-]` when any of its sub-tasks are in progress
- Mark a parent task `[x]` only when ALL sub-tasks are `[x]`
- Update this file as you work — it is the single source of truth for execution progress

**MANDATORY SUBTASKS FOR EVERY IMPLEMENTATION TASK:**
Every parent task (X) and sub-task (X.Y) MUST include these mandatory subtasks:
1. **Quality Loop (X.Y.QL)**: Run per-file verification (`bun tsgo` + `bun biome:check` + lint queue)
2. **Instruction Verification (X.Y.IV)**: Validate against ALL applicable AGENTS.md and .agents/instructions files (absolute paths from implementation.md Task-to-Instructions Mapping)

## Phase 1: Database Foundation

- [ ] **1. Schema, enums, and GraphQL enum registration**
  - [ ] 1.1 Create `backend/db/schema/billing/quotas.ts` — `quotas` table + relations + partial indexes for FIFO/sweeper
  - [ ] 1.2 Create `backend/db/schema/billing/quota-ledger.ts` — append-only ledger table + indexes + sha256 idempotency key pattern
  - [ ] 1.3 Edit `backend/db/schema/billing/index.ts` — re-export new schema files
  - [ ] 1.4 Edit `backend/db/schema/enums.ts` — add `quotaKindEnum`, `quotaStatusEnum`, `quotaPeriodTypeEnum`, `quotaLedgerReasonEnum`
  - [ ] 1.5 Create `backend/enum/billing/quota.enum.ts` — TypeScript enums + barrel re-export
  - [ ] 1.6 Edit `backend/graphql/pothos/shared/enum.pothos.ts` — register quota enums
  - [ ] 1.7 Run `bun run db push` and verify schema applied
  - [ ] 1.8 **Quality Loop**: Per-file verification on all new/edited files
    ```bash
    bun tsgo
    bun biome:check
    curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"verify","files":["<file-path>"]}'
    ```
  - [ ] 1.9 **Instruction Verification**: Verify all new/edited files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **2. On-demand scheduling schema extensions**
  - [ ] 2.1 Edit `backend/db/schema/classes/scheduling.ts` — add `quotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome` to `recurring_schedules`
  - [ ] 2.2 Edit `backend/db/schema/classes/scheduling.ts` — extend `class_instances.executionState` with 4 on-demand values + add `ondemandStatus` column (note: `quotaDeducted` already exists with CHECK constraint)
  - [ ] 2.3 Edit `backend/db/schema/enums.ts` — add `schedulingModeEnum`, `onDemandNoCreditsOutcomeEnum`, `onDemandStatusEnum`
  - [ ] 2.4 Create `backend/enum/scheduling/scheduling.enum.ts` — `SchedulingMode`, `OnDemandNoCreditsOutcome`, `OnDemandStatus`
  - [ ] 2.5 Register scheduling enums in `backend/graphql/pothos/shared/enum.pothos.ts`
  - [ ] 2.6 Add 5 new keys to existing migration `backend/db/migration/4c-system_settings_seed.sql` with ON CONFLICT upsert: `default_ondemand_horizon_weeks`, `default_ondemand_no_credits_outcome`, `ondemand_teacher_digest_hour`, `ondemand_no_credits_resolution_lead_minutes`, `quota_low_balance_threshold_percent`
  - [ ] 2.7 Run `bun db migrate && bun db push` and verify (migrate for custom SQL seed, push for schema)
  - [ ] 2.8 **Quality Loop**: Per-file verification on all new/edited files
  - [ ] 2.9 **Instruction Verification**: Verify all new/edited files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

---

## Phase 2: Backend Types & Repositories

- [ ] **3. Backend type definitions**
  - [ ] 3.1 Create `backend/types/billing/quota.types.ts` — Quota/QuotaLedger Select/Insert/Return/Input types + `QuotaBalanceReturnType` with `breakdownByExpiration`
  - [ ] 3.2 Edit `backend/types/billing/index.ts` — re-export quota types
  - [ ] 3.3 Edit `backend/types/scheduling/scheduling.types.ts` — add scheduling mode fields to `CreateRecurringClassInput`
  - [ ] 3.4 **Quality Loop**: Per-file verification on all new/edited files
  - [ ] 3.5 **Instruction Verification**: Verify all new/edited files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **4. Repository layer**
  - [ ] 4.1 Create `backend/db/repo/billing/quota-ledger.repository.ts` — insert, find*, computeBalance (pure append-only, no cache updates)
  - [ ] 4.2 Create `backend/db/repo/billing/quota.repository.ts` — CRUD, optimistic lock via `version`, FIFO selection, expire/refresh, **every write inserts ledger row + updates cached columns in same transaction**
  - [ ] 4.3 Edit `backend/db/repo/billing/index.ts` — re-export both repositories
  - [ ] 4.4 **Quality Loop**: Per-file verification on both repo files
  - [ ] 4.5 **Instruction Verification**: Verify all new/edited files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

---

## Phase 3: Backend Services

- [ ] **5. AvailabilityService**
  - [ ] 5.1 Create `backend/services/scheduling/availability.service.ts` — `assertSlotAvailable`, `assertSchedulePatternAvailable`, `findAvailableSlots`, `isSlotAvailable` using point lookups on `class_instances` indexes + `TeacherAvailabilityRepository` queries (NOT `AvailabilitySearchService`)
  - [ ] 5.2 **Quality Loop**: Per-file verification on availability service
  - [ ] 5.3 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **6. QuotaService & QuotaNotificationService**
  - [ ] 6.1 Create `backend/services/billing/quota.service.ts` — CRUD + reserve/release/redeem + FIFO + periodic refresh + on-demand instance refresh
  - [ ] 6.2 Create `backend/services/billing/quota-notification.service.ts` — 7 notification events with category tags
  - [ ] 6.3 Edit `backend/services/billing/index.ts` — re-export new services
  - [ ] 6.4 **Quality Loop**: Per-file verification on both service files
  - [ ] 6.5 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **7. Service integrations — CRITICAL: Replace repo direct SQL**
  - [ ] 7.1 Edit `backend/services/schedule/recurring-class.service.ts` — `AvailabilityService` + `QuotaService` in validate/create/cancel flows; **REMOVE per-instance `CreditService.deductForBooking` loop when quotaId set**; pool mode calls `QuotaService.redeemForInstance` per instance; earmark mode calls `QuotaService.reserveForRecurringSchedule` up front; ON_DEMAND skips up-front generation
  - [ ] 7.2 Edit `backend/db/repo/scheduling/state-changes.ts` — **REMOVE `handleQuotaDeduction` (lines 698-720) and quota branches of `adjustQuotaOnUpdate` (lines 333-366, 368-391)** — quota ledger is now single writer
  - [ ] 7.3 Edit `backend/services/teacher/teacher-dashboard.service.ts` — `createManualEntry`: if quota-backed, call `QuotaService.redeemForInstance`; else `CreditService.deductForBooking` (fixes double deduction)
  - [ ] 7.4 Edit `backend/services/billing/credit.service.ts` — after ANY credit change, call `QuotaService.refreshStudentOndemandInstances(studentId, tx)` in same transaction
  - [ ] 7.5 Edit `backend/services/session/class-session.service.ts` — on-demand credit deduction at session-start (`activateClassInstance` / `startSession`): if `ondemandStatus='PENDING_CREDIT'` and `quotaId` set, call `QuotaService.redeemForInstance`; if no quota, call `CreditService.deductForBooking`
  - [ ] 7.6 Implement recurring-class mode-switch: archive un-taken instances + refund credits/quota via `QuotaService.releaseForRecurringSchedule`
  - [ ] 7.7 **Quality Loop**: Per-file verification on all edited files
  - [ ] 7.8 **Instruction Verification**: Verify all edited files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

---

## Phase 4: GraphQL & Permissions

- [ ] **8. GraphQL layer**
  - [ ] 8.1 Create `backend/graphql/pothos/billing/quota.pothos.ts` — Quota, QuotaLedger, QuotaBalance objects + input refs
  - [ ] 8.2 Create `backend/graphql/mutation/billing/quota.mutation.ts` — create/update/delete mutations
  - [ ] 8.3 Create `backend/graphql/query/billing/quota.query.ts` — quota/quotas/studentQuotas/studentOpenQuotas/quotaBalance/quotaLedger/availableClassSlots
  - [ ] 8.4 Re-export from billing GraphQL index barrels
  - [ ] 8.5 Edit `backend/graphql/pothos/classes/recurring-class.pothos.ts` — add new scheduling mode fields to input
  - [ ] 8.6 Run `bun run generate:gqlSchema && bun codegen`
  - [ ] 8.7 **Quality Loop**: Per-file verification on all new/edited files
  - [ ] 8.8 **Instruction Verification**: Verify all new/edited files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/pothos/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/mutation/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/query/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **9. Permissions**
  - [ ] 9.1 Edit `backend/enum/permissions/permission.enum.ts` — add `QUOTAS_VIEW = "quotas.view"`, `QUOTAS_MANAGE = "quotas.manage"`
  - [ ] 9.2 Edit `backend/db/seeds/permissions/` — seed grants for new permissions
  - [ ] 9.3 **Quality Loop**: Per-file verification on all edited files
  - [ ] 9.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/seeds/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **10. Navigation & Sidebar Config for Quota Pages**
  - [ ] 10.1 Edit `frontend/common/views/dashboard/config/navigationConfig.ts` — add quota nav items under Billing group (grp_finance):
    - `quotas.list` → `/quotas` (permission: `QUOTAS_VIEW`, audience: all)
    - `quotas.create` → `/quotas/new` (permission: `QUOTAS_MANAGE`, audience: all)
    - `quotas.view` → `/quotas/[id]` (permission: `QUOTAS_VIEW`, audience: all)
    - `quotas.edit` → `/quotas/[id]/edit` (permission: `QUOTAS_MANAGE`, audience: all)
    - `quotas.insights` → `/quotas/insights` (permission: `QUOTAS_VIEW`, audience: all)
  - [ ] 10.2 Ensure `SUPERVISOR` and `STAFF` roles get `QUOTAS_VIEW` in seeded permission groups
  - [ ] 10.3 Add quota items to `BOTTOM_NAV_ITEMS` for mobile (filter by `QUOTAS_VIEW`)
  - [ ] 10.4 **Quality Loop**: Per-file verification on navigationConfig.ts
  - [ ] 10.5 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

---

## Phase 5: Notifications

- [ ] **11. Notification events & builders**
  - [ ] 11.1 Edit `backend/enum/notifications/notificationDeliveries.enum.ts` — add 7 new events
  - [ ] 11.2 Edit `shared/constants/notification-event-allowlists.ts` — allowlist all 7 events
  - [ ] 11.3 Create `backend/services/notification/quota-notification.builders.ts` — 7 payload builders
  - [ ] 11.4 Edit `backend/services/notification/notification-payloads.builders.ts` — register new builders
  - [ ] 11.5 **Greenfield:** Add category metadata (`info`/`reminder`/`urgent`/`digest`) to each event — extend enum builder + allowlist + frontend UI
  - [ ] 11.6 **Quality Loop**: Per-file verification on all new/edited files
  - [ ] 11.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **12. Notification prefs UI**
  - [ ] 12.1 Extend notification-prefs UI with category-level mute toggle
  - [ ] 12.2 Surface 7 new events with their categories in prefs UI
  - [ ] 12.3 **Quality Loop**: Per-file verification on all edited files
  - [ ] 12.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

---

## Phase 6: Cron Scripts

- [ ] **13. Quota expiry sweeper**
  - [ ] 13.1 Create `scripts/quota-expiry-sweeper.ts` — daily expiry + periodic refresh, idempotent per (quotaId, period)
  - [ ] 13.2 Add `"quota:expire"` script to `package.json`
  - [ ] 13.3 **Quality Loop**: Per-file verification on sweeper script
  - [ ] 13.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

- [ ] **14. On-demand instance generator**
  - [ ] 14.1 Create `scripts/ondemand-instance-generator.ts` — daily generation with `AvailabilityService` checks; **optimized re-eval: only students with `classesRemaining > 0`**
  - [ ] 14.2 Add `"ondemand:generate"` script to `package.json`
  - [ ] 14.3 **Quality Loop**: Per-file verification on generator script
  - [ ] 14.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

- [ ] **15. On-demand no-credits resolver**
  - [ ] 15.1 Create `scripts/ondemand-no-credits-resolver.ts` — hourly resolver for imminent PENDING_CREDIT instances
  - [ ] 15.2 Add `"ondemand:resolve"` script to `package.json`
  - [ ] 15.3 **Quality Loop**: Per-file verification on resolver script
  - [ ] 15.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

- [ ] **16. Teacher digest cron**
  - [ ] 16.1 Create `scripts/ondemand-teacher-digest-cron.ts` — hourly per-teacher-timezone digest; **derive teacher TZ from `recurring_schedules.timezone` or `teacher_availability_windows.timezone` (no `timezoneOverride` on teachers table)**
  - [ ] 16.2 Add `"ondemand:teacher-digest"` script to `package.json`
  - [ ] 16.3 **Quality Loop**: Per-file verification on digest script
  - [ ] 16.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

- [ ] **17. System settings seed** (already covered in Phase 1 task 2.6)

---

## Phase 7: Backend Tests

- [ ] **18. Repository tests**
  - [ ] 18.1 Create `backend/db/test/repo/billing/quota.repository.test.ts` — CRUD, optimistic lock, FIFO, expire, refresh
  - [ ] 18.2 Create `backend/db/test/repo/billing/quota-ledger.repository.test.ts` — insert, idempotency, computeBalance
  - [ ] 18.3 **Quality Loop**: Per-file verification on test files
  - [ ] 18.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/logic/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

- [ ] **19. Service & integration tests** (use `bun run scripts/run-test/run-test.ts <path>`)
  - [ ] 19.1 Create `backend/db/test/logic/billing/quota.service.test.ts` — reserve/release, invariant, race test (mirror `class_quota_race.test.ts`)
  - [ ] 19.2 Create `backend/db/test/logic/billing/quota-expiry-sweeper.test.ts` — idempotent sweeper
  - [ ] 19.3 Create availability-service conflict-detection test
  - [ ] 19.4 Create on-demand generator test — generation, status flip, conflict held
  - [ ] 19.5 Create status-refresh-on-purchase test
  - [ ] 19.6 **Quality Loop**: Per-file verification on all test files
  - [ ] 19.7 **Instruction Verification**: Verify all test files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/logic/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

---

## Phase 8: Frontend — GraphQL & i18n

- [ ] **20. Frontend GraphQL documents**
  - [ ] 20.1 Create `frontend/common/graphql/sharedDocuments/billing/quota.documents.ts` — all quota queries/mutations
  - [ ] 20.2 Create `frontend/common/graphql/sharedDocuments/scheduling/available-slots.documents.ts` — availableClassSlots query
  - [ ] 20.3 Edit `frontend/common/graphql/sharedDocuments/billing/index.ts` — re-export quota documents
  - [ ] 20.4 Edit `frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents.ts` — add new fields
  - [ ] 20.5 Run `bun run generate:gqlSchema && bun codegen`
  - [ ] 20.6 **Quality Loop**: Per-file verification on all new/edited files
  - [ ] 20.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/sharedDocuments/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

- [ ] **21. i18n**
  - [ ] 21.1 Create `shared/locale/types/dashboard/billing/quota.ts` — typed label keys
  - [ ] 21.2 Create `shared/locale/en/dashboard/billing/quota.ts` — English translations
  - [ ] 21.3 Create `shared/locale/ar/dashboard/billing/quota.ts` — Arabic translations
  - [ ] 21.4 Create `shared/locale/namespaces/dashboard/billing/quota.namespace.ts` + register in namespaces index
  - [ ] 21.5 Add error keys to `shared/locale/types/errors/index.ts`, `en/errors/index.ts`, `ar/errors/index.ts`
  - [ ] 21.6 **Quality Loop**: Per-file verification on all new/edited files
  - [ ] 21.7 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/shared/AGENTS.md`
    - Instructions: (none specific)

---

## Phase 9: Frontend — Quota Pages & Views

- [ ] **22. Quota routes**
  - [ ] 22.1 Create `app/(dashboard)/quotas/page.tsx` — list page with `QUOTAS_VIEW` gating
  - [ ] 22.2 Create `app/(dashboard)/quotas/new/page.tsx` — create form with `QUOTAS_MANAGE` gating
  - [ ] 22.3 Create `app/(dashboard)/quotas/[id]/page.tsx` — detail view
  - [ ] 22.4 Create `app/(dashboard)/quotas/[id]/edit/page.tsx` — edit form
  - [ ] 22.5 Create `app/(dashboard)/quotas/insights/page.tsx` — admin insights with charts
  - [ ] 22.6 Create `app/(dashboard)/students/[id]/quotas/page.tsx` — redirect to `?tab=quota` (existing redirect page already exists)
  - [ ] 22.7 **Quality Loop**: Per-file verification on all route files
  - [ ] 22.8 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/app/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

- [ ] **23. Quota views (common layer)**
  - [ ] 23.1 Create `QuotaContainer.tsx`, `QuotaView.tsx` (switcher pattern)
  - [ ] 23.2 Create `useQuotaViewModel.ts`, `useQuotaDetailViewModel.ts`
  - [ ] 23.3 Create `schemas/quotaSchema.ts`, `types/quota.types.ts`
  - [ ] 23.4 Create `utils/quotaFormatters.ts`, `utils/buildQuotaColumns.tsx`
  - [ ] 23.5 **Quality Loop**: Per-file verification on all new files
  - [ ] 23.6 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

- [ ] **24. Quota tier views**
  - [ ] 24.1 Desktop: `quotaView.desktop.tsx`, `components/quotaGrid.desktop.tsx`, `components/quotaForm.desktop.tsx`, `components/quotaDetail.desktop.tsx`, `components/quotaInsights.desktop.tsx`
  - [ ] 24.2 Mobile: `quotaView.mobile.tsx`, `components/quotaList.mobile.tsx`, `components/quotaForm.mobile.tsx`, `components/quotaDetail.mobile.tsx`
  - [ ] 24.3 **Quality Loop**: Per-file verification on all tier view files
  - [ ] 24.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`

- [ ] **25. Quota store**
  - [ ] 25.1 Create `frontend/common/stores/quotaStore.ts` — form state survives tier switch
  - [ ] 25.2 **Quality Loop**: Per-file verification on store file
  - [ ] 25.3 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

- [ ] **26. Student profile quota tab (enhance existing)**
  - [ ] 26.1 Tab already registered in `studentProfileTabs.ts` with `QUOTA_TAB_GROUPS`; existing redirect page at `app/(dashboard)/students/[id]/quota/page.tsx` — enhance quota tab view with per-audience rendering: student/parent see PENDING_CREDIT prominently; teacher sees CONFLICT_HELD at top
  - [ ] 26.2 **Quality Loop**: Per-file verification on enhanced tab view
  - [ ] 26.3 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

---

## Phase 10: Frontend — Recurring Class Form

- [ ] **27. Recurring class form backend wiring**
  - [ ] 27.1 Edit `recurringClassSchema.ts` — add scheduling mode + quota + on-demand fields
  - [ ] 27.2 Edit `mapRecurringClassFormData.ts` — map new fields to input/service input
  - [ ] 27.3 Edit `createRecurringClassStore.ts` — add state + setters for new fields
  - [ ] 27.4 **Quality Loop**: Per-file verification on all edited files
  - [ ] 27.5 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`

- [ ] **28. Recurring class form UI**
  - [ ] 28.1 Desktop: add SchedulingMode radio, QuotaSection, OnDemandSection to `recurringClassFormFields.desktop.tsx`
  - [ ] 28.2 Mobile: mirror desktop with inline-stacked sections in `recurringClassFormFields.mobile.tsx`
  - [ ] 28.3 Wire `availableClassSlots` useQuery to grey out taken time slots in picker
  - [ ] 28.4 Server-side slot-conflict error handling with translated message on submit
  - [ ] 28.5 **Quality Loop**: Per-file verification on all edited files
  - [ ] 28.6 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`

---

## Phase 11: Seeds & Quality Loop

- [ ] **29. Seed data (optional)**
  - [ ] 29.1 Create `backend/db/seeds/billing/seed-quotas.ts` — sample PACKAGE, MONTHLY, CUSTOM-90-day quotas + on-demand schedules
  - [ ] 29.2 Edit `backend/db/seeds/billing/index.ts` — re-export seed
  - [ ] 29.3 **Quality Loop**: Per-file verification on seed files
  - [ ] 29.4 **Instruction Verification**: Verify against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/seeds/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

- [ ] **30. Quality loop (per-file verification) — COMPREHENSIVE PASS**
  - [ ] 30.1 For each new/modified file across ALL phases, run per-file quality loop:
    ```bash
    bun tsgo
    bun biome:check
    curl -s -X POST http://localhost:4777/lint \
      -H "Content-Type: application/json" \
      -d '{"id":"verify","files":["<file-path>"]}'
    ```
  - [ ] 30.2 Fix any tsgo/biome/lint failures per file
  - [ ] 30.3 Re-run per-file loop until each file passes
  - [ ] 30.4 **Instruction Verification**: For each new/modified file, validate against all applicable AGENTS.md and .agents/instructions files from the Task-to-Instructions Mapping in implementation.md

---

## Progress Summary

| Phase | Parent Tasks | Completed | Status |
|-------|-------------|-----------|--------|
| 1. Database Foundation | 2 | 0 | `[ ]` |
| 2. Types & Repositories | 2 | 0 | `[ ]` |
| 3. Backend Services | 3 | 0 | `[ ]` |
| 4. GraphQL & Permissions | 3 | 0 | `[ ]` |
| 5. Notifications | 2 | 0 | `[ ]` |
| 6. Cron Scripts | 4 | 0 | `[ ]` |
| 7. Backend Tests | 2 | 0 | `[ ]` |
| 8. Frontend GraphQL & i18n | 2 | 0 | `[ ]` |
| 9. Frontend Quota Pages | 5 | 0 | `[ ]` |
| 10. Recurring Class Form | 2 | 0 | `[ ]` |
| 11. Seeds & Quality Loop | 2 | 0 | `[ ]` |
| **Total** | **29** | **0** | **0%** |

_Update the Progress Summary table as tasks are completed._