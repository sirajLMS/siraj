# Types Review Plan

**Date**: 2026-07-05
**Scope**: backend/types/ (canonical definitions) + cross-layer duplication in backend/graphql/ and frontend/
**Focus**: Duplication — local types in Pothos, duplicated structures across layers
**Files Reviewed**: backend/types/ (~20 files), backend/graphql/pothos/ (~14 files), frontend/ (~10 files)
**Plan file**: .ai/plans/types-review-plan-1.md

## Summary

The review surfaced 56 findings: 36 CRITICAL, 14 WARNING, 6 SUGGESTION. The dominant violation class is locally-defined `*Definition`/`*PothosDefinition` types in Pothos files that either duplicate a canonical type already in backend/types/ or define an entity-shape type with no canonical home. A secondary class is frontend files importing backend entity types directly (`@/backend/types/...`) instead of the generated GraphQL types. backend/types/ internally has a smaller but important cluster of canonical-name drift (`*PothosDefinition`, `*EntitySelect` re-aliases, hand-rolled object literals).

## Findings

### CRITICAL (36)

**Group: Pothos local definitions duplicating canonical backend/types (12)**
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/billing-alerts.pothos.ts:3 — Local `UnpaidInvoiceItemDefinition` duplicates `UnpaidInvoiceSummaryItem` (backend/types/billing.types.ts:18)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/billing-alerts.pothos.ts:29 — Local `UnpaidInvoicesSummaryDefinition` duplicates `UnpaidInvoicesSummaryResult` (backend/types/billing.types.ts:29)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/billing-history.pothos.ts:47 — Local `InvoiceHistoryResultType` duplicates `InvoiceHistoryPaginatedResult` (backend/types/billing.types.ts:36)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/billing-management.pothos.ts:15 — Trivial alias `ManualInvoiceResultGraphQLType = ManualInvoiceResult`; use canonical directly
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/billing-management.pothos.ts:39 — Local `MarkInvoicePaidGraphQLType` re-shapes canonical `MarkInvoicePaidResult` (backend/types/billing.types.ts:97)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/billing-management.pothos.ts:59 — Local `DeleteInvoiceGraphQLType` re-shapes canonical `DeleteInvoiceResult` (backend/types/billing.types.ts:108)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/schedule.pothos.ts:124 — Local `RescheduleTrackingRowDefinition` duplicates `RescheduleTrackingRow` (backend/types/scheduling.types.ts:26)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/schedule.pothos.ts:181 — Local `RescheduleTrackingInputDefinition` duplicates `RescheduleTrackingInput` (backend/types/scheduling.types.ts:41)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/schedule.pothos.ts:195 — Local `RescheduleTrackingResultDefinition` duplicates `RescheduleTrackingPaginatedResult` (backend/types/scheduling.types.ts:46)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/parent-dashboard.pothos.ts:35 — Local `ParentDashboardScheduleResultDefinition` duplicates `ParentDashboardSchedulePaginatedResult` (backend/types/parent.types.ts:94)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/parent-dashboard.pothos.ts:91 — Local `ParentDashboardMetricsResultDefinition` duplicates `ParentDashboardMetricsReturnType` (backend/types/parent.types.ts:124)
- [x] [CRITICAL] Pothos-dup: backend/graphql/pothos/staff-directory.pothos.ts:64 — Local `ManagerDirectoryRowDefinition` duplicates `ManagerDirectoryRow` (backend/types/staff-profile.types.ts:28)

**Group: Pothos local definitions with no canonical equivalent (entity-shape types that should be centralized in backend/types) (16)**
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/schedule.pothos.ts:40 — Local `DailyScheduleListUserItem` ad-hoc entity shape; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/schedule.pothos.ts:53 — Local `DailyScheduleListDefinition`; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/schedule.pothos.ts:83 — Local `AdminDashboardScheduleInputDefinition`; centralize input in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/schedule.pothos.ts:103 — Local `AdminDashboardScheduleResultDefinition`; centralize as `{Entity}ReturnType`
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/schedule.pothos.ts:158 — Local `RescheduleTrackingMetricsDefinition`; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/schedule.pothos.ts:222 — Local `StatusTrackingScheduleRowDefinition`; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/recurring-class.pothos.ts:3 — Local `RecurringClassDayInputDefinition`; centralize input in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/recurring-class.pothos.ts:19 — Local `CreateRecurringClassInputDefinition`; centralize input in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/recurring-class.pothos.ts:55 — Local `CreateRecurringClassResultDefinition`; centralize as `{Entity}ReturnType`
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/teacher-dashboard.pothos.ts:71 — Local `CreateManualClassEntryInputDefinition`; centralize input in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/teacher-dashboard.pothos.ts:93 — Local `LogSupportRequestInputDefinition`; centralize input in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/teacher-dashboard.pothos.ts:105 — Local `TeacherHandbookUrlDefinition`; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/teacher.pothos.ts:3 — Local `TeacherSimpleDefinition` `{id, name}` (prohibited example per backend/graphql/AGENTS.md:23); centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/student-directory.pothos.ts:37 — Local `StudentDirectoryPayloadDefinition`; canonical `StudentDirectoryResult` exists but differs — add canonical paginated-result type in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/student-history.pothos.ts:22 — Local `StudentHistorySessionDefinition`; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/student-history.pothos.ts:54 — Local `StudentClassHistoryDefinition`; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/student-history.pothos.ts:74 — Local `StudentSessionDetailDefinition`; centralize in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/staff-directory.pothos.ts:42 — Local `TeacherDirectoryDefinition` aggregate wrapper; define canonical paginated-result type in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/staff-directory.pothos.ts:94 — Local `ManagerDirectoryMetricsDefinition`; centralize in backend/types (canonical `ManagerDirectoryMetrics` exists at staff-profile.types.ts:20)
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/staff-directory.pothos.ts:115 — Local `ManagerDirectoryResultDefinition` duplicates `ManagerDirectoryResult` (staff-profile.types.ts:13)
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/staff-directory.pothos.ts:213 — Local `UpdateManagerProfileInputDefinition` interface; centralize input in backend/types
- [x] [CRITICAL] Pothos-adhoc: backend/graphql/pothos/parent-document.pothos.ts:4 — Local `ParentDocumentDefinition` ad-hoc entity shape; centralize in backend/types

**Group: Frontend importing @/backend/types directly instead of generated GraphQL types (10)**
- [x] [CRITICAL] Frontend-backend-import: frontend/utils/student-status-transitions.ts:3 — Imports `ALLOWED_STATUS_TRANSITIONS` from `@/backend/types/student-lifecycle.types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/components/DashboardLayoutContainer.tsx:3 — Imports `CurrentUserProfile` from `@/backend/types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/components/DashboardClientBridge.tsx:3 — Imports `CurrentUserProfile` from `@/backend/types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/components/client/UserStoreInitializer.tsx:4 — Imports `CurrentUserProfile` from `@/backend/types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/classes/details/ClassDetailsContainer.tsx:20 — Imports `ClassInstanceDetailReturnType` from `@/backend/types/class-instance-detail.types` (duplicates generated `ClassInstanceDetail`)
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/classes/details/ClassDetailsHeader.tsx:4 — Imports `ClassInstanceDetailReturnType` from `@/backend/types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/classes/details/ClassDetailsContainer.stories.tsx:4 — Imports `ClassInstanceDetailReturnType` from `@/backend/types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/classes/details/components/ClassDetailsToolbarArea.tsx:6 — Imports `ClassInstanceDetailReturnType` from `@/backend/types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/classes/details/admin/ClassDetailsAdminView.tsx:4 — Imports `ClassInstanceDetailReturnType` from `@/backend/types`
- [x] [CRITICAL] Frontend-backend-import: frontend/views/dashboard/classes/details/teacher/ClassDetailsTeacherView.tsx:4 — Imports `ClassInstanceDetailReturnType` from `@/backend/types`

### WARNING (14)

**Group: backend/types internal canonical-name drift (9)**
- [ ] [WARNING] Types-internal: backend/types/auth.types.ts:30 — `UserPothosDefinition` uses prohibited `PothosDefinition` suffix; merge into canonical `UserReturnType`
- [ ] [WARNING] Types-internal: backend/types/auth.types.ts:64 — `PermissionGroupPothosDefinition` + 4 siblings (PermissionPothosDefinition:69, GroupPermissionPothosDefinition:76, UserPermissionGroupPothosDefinition:84, SessionPothosDefinition:92) all use prohibited `PothosDefinition` suffix
- [ ] [WARNING] Types-internal: backend/types/permission-management.types.ts:5 — `PermissionGroupEntitySelect`/`PermissionGroupEntityInsert` are re-aliases of `PermissionGroupEntity`/`PermissionGroupEntityInput` from auth.types.ts; consolidate naming
- [ ] [WARNING] Types-internal: backend/types/suggestions.types.ts:76 — `SuggestionSubmitInputType` duplicates `SuggestionSubmitInput` (same file:16); remove or `Pick` from canonical
- [x] [WARNING] Types-internal: backend/types/student.types.ts:124 — `StudentHistoryMetricsDefinition` uses prohibited `*Definition` suffix; rename to `StudentHistoryMetricsType`
- [x] [WARNING] Types-internal: backend/types/class-instance-performance.types.ts:4 — Uses `InferSelectModel`/`InferInsertModel` helpers instead of canonical `typeof table.$inferSelect`/`$inferInsert` pattern
- [x] [WARNING] Backend-query: backend/graphql/query/schedule.query.ts:18 — Local `PaginationArgsInput` duplicates canonical `PaginationInput` (backend/types/pagination.types.ts:78)
- [ ] [WARNING] Frontend-local-dup: frontend/views/dashboard/types/dashboard.ts:26 — Local `StudentInfo` duplicates generated `ClassInstanceStudentInfo` (graphql-types.ts:411)
- [ ] [WARNING] Frontend-local-dup: frontend/views/dashboard/types/dashboard.ts:34 — Local `TeacherInfo` duplicates generated `ClassInstanceTeacherInfo` (graphql-types.ts:420)

### SUGGESTION (6)

- [ ] [SUGGESTION] Types-internal: backend/types/book.types.ts:4 — `BookSelectType` not exported; export it and add `BookInsertType`
- [ ] [SUGGESTION] Types-internal: backend/types/complaintResponses.types.ts:3 — `ComplaintResponseSelect`/`ComplaintResponseInsert` missing canonical `Type` suffix; rename to `*SelectType`/`*InsertType`
- [ ] [SUGGESTION] Types-internal: backend/types/report.types.ts:1 — Re-exports from `@/backend/db/repo/report.repository`; types layer should not depend on repo layer
- [ ] [SUGGESTION] Types-internal: backend/types/audit.types.ts:3 — `AuditLogEntity`/`AuditLogEntityInput` use `Entity`/`EntityInput` suffix instead of `SelectType`/`InsertType`
- [ ] [SUGGESTION] Frontend-adhoc: backend/services/communication/complaintResponses.service.ts:7 — Local `ComplaintById` derived alias; consider re-exporting as `{Entity}ReturnType` from backend/types
- [ ] [SUGGESTION] Frontend-store: frontend/stores/userStore.ts:4 — `UserState` re-declares subset of generated `User` fields; consider deriving from generated `User`

## Recommended Actions

1. **Pothos-dup group (12)**: Replace each local `*Definition`/`*GraphQLType` with an import of the canonical type from `@/backend/types`. For trivial aliases (billing-management:15), delete the alias and use the canonical name directly. For re-shaped variants (MarkInvoicePaid/DeleteInvoice), define the GraphQL-return variant canonically in `backend/types/billing.types.ts` and import it.
2. **Pothos-adhoc group (16)**: Move each entity-shape `*Definition` type into the appropriate `backend/types/<entity>.types.ts` file using canonical naming (`{Entity}ReturnType`, `{Entity}SubmitInput`, etc.), then import it back into the Pothos file. Group related siblings (e.g. all `RescheduleTracking*` → scheduling.types.ts; all `ManagerDirectory*` → staff-profile.types.ts).
3. **Frontend-backend-import group (10)**: Replace `@/backend/types/...` imports with the equivalent generated GraphQL type from `@/frontend/graphql/generated/gql/`. For `CurrentUserProfile`, verify a generated `User`-derived type exists; if not, add one to the GraphQL schema. For `ClassInstanceDetailReturnType`, switch to the already-generated `ClassInstanceDetail`.
4. **Types-internal group (9)**: Rename `*PothosDefinition` → `*ReturnType`; consolidate `PermissionGroupEntitySelect` re-aliases; remove `SuggestionSubmitInputType`; rename `StudentHistoryMetricsDefinition`; switch `class-instance-performance.types.ts` to `$inferSelect` pattern.
5. **Backend-query (1)**: Replace `PaginationArgsInput` with import of `PaginationInput` from `@/backend/types`.
6. **Frontend-local-dup group (4+1)**: Remove local `StudentInfo`/`TeacherInfo`/`ClassInstance` interfaces in dashboard.ts and use generated types; remove dead-code `TeacherDirectoryRow`/`TeacherMetrics` in teachers/home/types.ts; replace local `Manager` in managers/home/types.ts with generated `ManagerDirectoryRow`.
7. **Suggestion group (6)**: Apply canonical naming (`*SelectType`/`*InsertType`), export missing `BookSelectType`/`BookInsertType`, move `report.types.ts` definitions out of repo, decide on `AuditLogEntity` rename scope.

## Layer Compliance Notes

- `backend/types/AGENTS.md` Negative Pattern violations: local `{Entity}Definition` types in Pothos files (Pothos-adhoc group) and ad-hoc `{Entity}Definition` in backend/types (`UserPothosDefinition`, `StudentHistoryMetricsDefinition`).
- `backend/types/AGENTS.md` foundation-type violation: `class-instance-performance.types.ts` uses `InferSelectModel` instead of `$inferSelect`.
- `backend/types/AGENTS.md` canonical-naming violations: `*EntitySelect`/`*EntityInput`/`*PothosDefinition` suffixes instead of `*SelectType`/`*InsertType`/`*ReturnType`.
- Frontend layering violation: frontend files import `@/backend/types/...` directly (10 CRITICAL findings) — frontend must consume only generated GraphQL types from `@/frontend/graphql/generated/gql/`.
- `backend/types/report.types.ts` reverses dependency direction (types layer depends on repo layer).

## Fix Status

- Total findings: 56
- Fixed: 41 / 56
- Remaining: 15 / 56
