# Quota System — Trackable Tasks

## Document Information

- **Feature Name**: Quota Entity + Recurring-Class Integration
- **Version**: 1.0
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

---

## Phase 1: Database Foundation

- [ ] **1. Schema, enums, and GraphQL enum registration**
  - [ ] 1.1 Create `backend/db/schema/billing/quotas.ts` — `quotas` table + relations
  - [ ] 1.2 Create `backend/db/schema/billing/quota-ledger.ts` — append-only ledger table + indexes
  - [ ] 1.3 Edit `backend/db/schema/billing/index.ts` — re-export new schema files
  - [ ] 1.4 Edit `backend/db/schema/enums.ts` — add `quotaKindEnum`, `quotaStatusEnum`, `quotaPeriodTypeEnum`, `quotaLedgerReasonEnum`
  - [ ] 1.5 Create `backend/enum/billing/quota.enum.ts` — TypeScript enums + barrel re-export
  - [ ] 1.6 Edit `backend/graphql/pothos/shared/enum.pothos.ts` — register quota enums
  - [ ] 1.7 Run `bun run db push` and verify schema applied

- [ ] **2. On-demand scheduling schema**
  - [ ] 2.1 Edit `backend/db/schema/classes/scheduling.ts` — add `quotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome` to `recurring_schedules`
  - [ ] 2.2 Edit `backend/db/schema/classes/scheduling.ts` — extend `class_instances.executionState` with 4 on-demand values + add `ondemandStatus` column
  - [ ] 2.3 Edit `backend/db/schema/enums.ts` — add `schedulingModeEnum`, `onDemandNoCreditsOutcomeEnum`, `onDemandStatusEnum`
  - [ ] 2.4 Create `backend/enum/scheduling/scheduling.enum.ts` — `SchedulingMode`, `OnDemandNoCreditsOutcome`, `OnDemandStatus`
  - [ ] 2.5 Register scheduling enums in `backend/graphql/pothos/shared/enum.pothos.ts`
  - [ ] 2.6 Seed system_settings keys: `default_ondemand_horizon_weeks`, `default_ondemand_no_credits_outcome`, `ondemand_teacher_digest_hour`, `ondemand_no_credits_resolution_lead_minutes`, `quota_low_balance_threshold_percent`
  - [ ] 2.7 Run `bun run db push` and verify

---

## Phase 2: Backend Types & Repositories

- [ ] **3. Backend type definitions**
  - [ ] 3.1 Create `backend/types/billing/quota.types.ts` — Quota/QuotaLedger Select/Insert/Return/Input types + `QuotaBalanceReturnType`
  - [ ] 3.2 Edit `backend/types/billing/index.ts` — re-export quota types
  - [ ] 3.3 Edit `backend/types/scheduling/scheduling.types.ts` — add scheduling mode fields to `CreateRecurringClassInput`

- [ ] **4. Repository layer**
  - [ ] 4.1 Create `backend/db/repo/billing/quota.repository.ts` — CRUD, optimistic lock, FIFO selection, expire/refresh
  - [ ] 4.2 Create `backend/db/repo/billing/quota-ledger.repository.ts` — insert, find*, computeBalance
  - [ ] 4.3 Edit `backend/db/repo/billing/index.ts` — re-export both repositories
  - [ ] 4.4 Per-file verification: tsgo + biome + lint on both repo files

---

## Phase 3: Backend Services

- [ ] **5. AvailabilityService**
  - [ ] 5.1 Create `backend/services/scheduling/availability.service.ts` — assertSlotAvailable, assertSchedulePatternAvailable, findAvailableSlots, isSlotAvailable
  - [ ] 5.2 Integrate with existing `TeacherAvailabilityService`
  - [ ] 5.3 Per-file verification on availability service

- [ ] **6. QuotaService & QuotaNotificationService**
  - [ ] 6.1 Create `backend/services/billing/quota.service.ts` — CRUD + reserve/release/redeem + FIFO + periodic refresh + on-demand instance refresh
  - [ ] 6.2 Create `backend/services/billing/quota-notification.service.ts` — 7 notification events with category tags
  - [ ] 6.3 Edit `backend/services/billing/index.ts` — re-export new services
  - [ ] 6.4 Per-file verification on both service files

- [ ] **7. Service integrations**
  - [ ] 7.1 Edit `backend/services/schedule/recurring-class.service.ts` — AvailabilityService + QuotaService in validate/create/cancel flows
  - [ ] 7.2 Edit `backend/services/teacher/teacher-dashboard.service.ts` — AvailabilityService in bookClass
  - [ ] 7.3 Edit `backend/services/billing/credit.service.ts` — refreshStudentOndemandInstances after any credit change
  - [ ] 7.4 Implement recurring-class mode-switch archive + refund logic

---

## Phase 4: GraphQL & Permissions

- [ ] **8. GraphQL layer**
  - [ ] 8.1 Create `backend/graphql/pothos/billing/quota.pothos.ts` — Quota, QuotaLedger, QuotaBalance objects + input refs
  - [ ] 8.2 Create `backend/graphql/mutation/billing/quota.mutation.ts` — create/update/delete mutations
  - [ ] 8.3 Create `backend/graphql/query/billing/quota.query.ts` — quota/quotas/studentQuotas/studentOpenQuotas/quotaBalance/quotaLedger/availableClassSlots
  - [ ] 8.4 Re-export from billing GraphQL index barrels
  - [ ] 8.5 Edit `backend/graphql/pothos/classes/recurring-class.pothos.ts` — add new scheduling mode fields to input
  - [ ] 8.6 Run `bun run generate:gqlSchema && bun codegen`

- [ ] **9. Permissions**
  - [ ] 9.1 Edit `backend/enum/permissions/permission.enum.ts` — add `QUOTAS_VIEW`, `QUOTAS_MANAGE`
  - [ ] 9.2 Edit `backend/db/seeds/permissions/` — seed grants for new permissions

---

## Phase 5: Notifications

- [ ] **10. Notification events & builders**
  - [ ] 10.1 Edit `backend/enum/notifications/notificationDeliveries.enum.ts` — add 7 new events
  - [ ] 10.2 Edit `shared/constants/notification-event-allowlists.ts` — allowlist all 7 events
  - [ ] 10.3 Create `backend/services/notification/quota-notification.builders.ts` — 7 payload builders
  - [ ] 10.4 Edit `backend/services/notification/notification-payloads.builders.ts` — register new builders
  - [ ] 10.5 Add category metadata (`info`/`reminder`/`urgent`/`digest`) to each event

- [ ] **11. Notification prefs UI**
  - [ ] 11.1 Extend notification-prefs UI with category-level mute toggle
  - [ ] 11.2 Surface 7 new events with their categories in prefs UI

---

## Phase 6: Cron Scripts

- [ ] **12. Quota expiry sweeper**
  - [ ] 12.1 Create `scripts/quota-expiry-sweeper.ts` — daily expiry + periodic refresh, idempotent per (quotaId, period)
  - [ ] 12.2 Add `"quota:expire"` script to `package.json`

- [ ] **13. On-demand instance generator**
  - [ ] 13.1 Create `scripts/ondemand-instance-generator.ts` — daily generation with AvailabilityService checks
  - [ ] 13.2 Add `"ondemand:generate"` script to `package.json`

- [ ] **14. On-demand no-credits resolver**
  - [ ] 14.1 Create `scripts/ondemand-no-credits-resolver.ts` — hourly resolver for imminent PENDING_CREDIT instances
  - [ ] 14.2 Add `"ondemand:resolve"` script to `package.json`

- [ ] **15. Teacher digest cron**
  - [ ] 15.1 Create `scripts/ondemand-teacher-digest-cron.ts` — hourly per-teacher-timezone digest
  - [ ] 15.2 Add `"ondemand:teacher-digest"` script to `package.json`

---

## Phase 7: Backend Tests

- [ ] **16. Repository tests**
  - [ ] 16.1 Create `backend/db/test/repo/billing/quota.repository.test.ts` — CRUD, optimistic lock, FIFO, expire, refresh
  - [ ] 16.2 Create `backend/db/test/repo/billing/quota-ledger.repository.test.ts` — insert, idempotency, computeBalance

- [ ] **17. Service & integration tests**
  - [ ] 17.1 Create `backend/db/test/logic/billing/quota.service.test.ts` — reserve/release, invariant, race test (mirror class_quota_race)
  - [ ] 17.2 Create `backend/db/test/logic/billing/quota-expiry-sweeper.test.ts` — idempotent sweeper
  - [ ] 17.3 Create availability-service conflict-detection test
  - [ ] 17.4 Create on-demand generator test — generation, status flip, conflict held
  - [ ] 17.5 Create status-refresh-on-purchase test

---

## Phase 8: Frontend — GraphQL & i18n

- [ ] **18. Frontend GraphQL documents**
  - [ ] 18.1 Create `frontend/common/graphql/sharedDocuments/billing/quota.documents.ts` — all quota queries/mutations
  - [ ] 18.2 Create `frontend/common/graphql/sharedDocuments/scheduling/available-slots.documents.ts` — availableClassSlots query
  - [ ] 18.3 Edit `frontend/common/graphql/sharedDocuments/billing/index.ts` — re-export quota documents
  - [ ] 18.4 Edit `frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents.ts` — add new fields
  - [ ] 18.5 Run `bun run generate:gqlSchema && bun codegen`

- [ ] **19. i18n**
  - [ ] 19.1 Create `shared/locale/types/dashboard/billing/quota.ts` — typed label keys
  - [ ] 19.2 Create `shared/locale/en/dashboard/billing/quota.ts` — English translations
  - [ ] 19.3 Create `shared/locale/ar/dashboard/billing/quota.ts` — Arabic translations
  - [ ] 19.4 Create `shared/locale/namespaces/dashboard/billing/quota.namespace.ts` + register in namespaces index
  - [ ] 19.5 Add error keys to `shared/locale/types/errors/index.ts`, `en/errors/index.ts`, `ar/errors/index.ts`

---

## Phase 9: Frontend — Quota Pages & Views

- [ ] **20. Quota routes**
  - [ ] 20.1 Create `app/(dashboard)/quotas/page.tsx` — list page with `QUOTAS_VIEW` gating
  - [ ] 20.2 Create `app/(dashboard)/quotas/new/page.tsx` — create form with `QUOTAS_MANAGE` gating
  - [ ] 20.3 Create `app/(dashboard)/quotas/[id]/page.tsx` — detail view
  - [ ] 20.4 Create `app/(dashboard)/quotas/[id]/edit/page.tsx` — edit form
  - [ ] 20.5 Create `app/(dashboard)/quotas/insights/page.tsx` — admin insights with charts
  - [ ] 20.6 Create `app/(dashboard)/students/[id]/quotas/page.tsx` — redirect to `?tab=quotas`

- [ ] **21. Quota views (common layer)**
  - [ ] 21.1 Create `QuotaContainer.tsx`, `QuotaView.tsx` (switcher pattern)
  - [ ] 21.2 Create `useQuotaViewModel.ts`, `useQuotaDetailViewModel.ts`
  - [ ] 21.3 Create `schemas/quotaSchema.ts`, `types/quota.types.ts`
  - [ ] 21.4 Create `utils/quotaFormatters.ts`, `utils/buildQuotaColumns.tsx`

- [ ] **22. Quota tier views**
  - [ ] 22.1 Desktop: `quotaView.desktop.tsx`, `quotaGrid.desktop.tsx`, `quotaForm.desktop.tsx`, `quotaDetail.desktop.tsx`, `quotaInsights.desktop.tsx`
  - [ ] 22.2 Mobile: `quotaView.mobile.tsx`, `quotaList.mobile.tsx`, `quotaForm.mobile.tsx`, `quotaDetail.mobile.tsx`

- [ ] **23. Quota store**
  - [ ] 23.1 Create `frontend/common/stores/quotaStore.ts` — form state survives tier switch

- [ ] **24. Student profile quotas tab**
  - [ ] 24.1 Edit `frontend/common/views/dashboard/students/profile/studentProfileTabs.ts` — wire quotas tab
  - [ ] 24.2 Per-audience rendering: student/parent PENDING_CREDIT prominence, teacher CONFLICT_HELD focus, admin click-to-filter

---

## Phase 10: Frontend — Recurring Class Form

- [ ] **25. Recurring class form backend wiring**
  - [ ] 25.1 Edit `recurringClassSchema.ts` — add scheduling mode + quota + on-demand fields
  - [ ] 25.2 Edit `mapRecurringClassFormData.ts` — map new fields to input/service input
  - [ ] 25.3 Edit `createRecurringClassStore.ts` — add state + setters for new fields

- [ ] **26. Recurring class form UI**
  - [ ] 26.1 Desktop: add SchedulingMode radio, QuotaSection, OnDemandSection to `recurringClassFormFields.desktop.tsx`
  - [ ] 26.2 Mobile: mirror desktop with inline-stacked sections in `recurringClassFormFields.mobile.tsx`
  - [ ] 26.3 Wire `availableClassSlots` useQuery to grey out taken time slots in picker
  - [ ] 26.4 Server-side slot-conflict error handling with translated message on submit

---

## Phase 11: Seeds & Quality Gate

- [ ] **27. Seed data (optional)**
  - [ ] 27.1 Create `backend/db/seeds/billing/seed-quotas.ts` — sample PACKAGE, MONTHLY, CUSTOM-90-day quotas + on-demand schedules
  - [ ] 27.2 Edit `backend/db/seeds/billing/index.ts` — re-export seed

- [ ] **28. Quality gate**
  - [ ] 28.1 Run `bun quality-gate:fresh` across all new/modified files
  - [ ] 28.2 Fix any tsgo/biome/lint/codescene/sonar failures
  - [ ] 28.3 Re-run quality gate until all stages pass

---

## Progress Summary

| Phase | Parent Tasks | Completed | Status |
|-------|-------------|-----------|--------|
| 1. Database Foundation | 2 | 0 | `[ ]` |
| 2. Types & Repositories | 2 | 0 | `[ ]` |
| 3. Backend Services | 3 | 0 | `[ ]` |
| 4. GraphQL & Permissions | 2 | 0 | `[ ]` |
| 5. Notifications | 2 | 0 | `[ ]` |
| 6. Cron Scripts | 4 | 0 | `[ ]` |
| 7. Backend Tests | 2 | 0 | `[ ]` |
| 8. Frontend GraphQL & i18n | 2 | 0 | `[ ]` |
| 9. Frontend Quota Pages | 5 | 0 | `[ ]` |
| 10. Recurring Class Form | 2 | 0 | `[ ]` |
| 11. Seeds & Quality Gate | 2 | 0 | `[ ]` |
| **Total** | **28** | **0** | **0%** |

_Update the Progress Summary table as tasks are completed._
