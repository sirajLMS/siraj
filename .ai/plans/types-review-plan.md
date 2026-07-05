# Types Review Plan

**Date**: 2026-07-05
**Scope**: backend/types/ only — canonical definitions (with cross-layer duplication investigation)
**Focus**: Duplication — local types in Pothos, duplicated structures across layers
**Files Reviewed**: ~15 files across backend/types/, backend/graphql/pothos/, backend/services/, backend/db/repo/

## Summary

Investigation found widespread type duplication across the backend layers. The most impactful duplications are: (1) pagination args defined 4 times across pothos layers instead of centralized, (2) parent-directory types triple-defined across types/services/pothos, and (3) billing-management and notification-alerts Pothos `...Definition` types that clone service-exported interfaces field-for-field instead of importing canonical types. The `billing-management.pothos.ts` file already demonstrates the correct pattern by importing `SendPaymentReminderResult` — this should be applied to all similar cases.

## Findings

### CRITICAL (13)

- [x] [CRITICAL] Duplication: backend/graphql/pothos/pagination.objects.ts:26 — Local `type PaginationArgs` duplicates the canonical `PaginationArgs` class in backend/types/pagination.types.ts (same fields: first/skip/after/before/last/page); GraphQL input shape should reuse/extend the canonical type instead of redefining it inline.
  → Fix: ✅ Removed local `PaginationArgs` type, now imports `PaginationInput` from `@/backend/types`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/billing-history.pothos.ts:14 — Local `type PaginationArgsInput` re-defines the same pagination field set already in `pagination.objects.ts` and `types/pagination.types.ts`; third redundant copy.
  → Fix: ✅ Removed local `PaginationArgsInput`, uses `PaginationInput` from `@/backend/types`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/parent-directory.pothos.ts:6 — Local `ParentDirectoryMetricsDefinition` clones `ParentDirectoryMetrics` from services/parent/parent-directory.service.ts:7 (which duplicates types/parent.types.ts:13); should import the canonical types/parent.types.ts export.
  → Fix: ✅ Removed local definition, imports canonical `ParentDirectoryMetrics` from `@/backend/types`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/parent-directory.pothos.ts:31 — Local `ParentDirectoryRowDefinition` clones `ParentDirectoryRow` from services/parent/parent-directory.service.ts:17 (itself duplicating types/parent.types.ts:22).
  → Fix: ✅ Removed local definition, imports canonical `ParentDirectoryRow` from `@/backend/types`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/parent-directory.pothos.ts:59 — Local `ParentDirectoryDefinition` clones `ParentDirectoryResult` from services/parent/parent-directory.service.ts:29 (itself duplicating types/parent.types.ts:32).
  → Fix: ✅ Removed local definition, imports canonical `ParentDirectoryResult` from `@/backend/types`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/billing-management.pothos.ts:13 — Local `ManualInvoiceResultDefinition` reimplements fields of service export `ManualInvoiceResult` (services/billing/billing-management.service.ts:26) instead of importing it; sibling `SendPaymentReminderResult` is correctly imported as reference pattern.
  → Fix: ✅ Removed local definition, imports `ManualInvoiceResult` from `@/backend/types`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/billing-management.pothos.ts:49 — Local `MarkInvoicePaidResultDefinition` reimplements fields of service export `MarkInvoicePaidResult` (services/billing/billing-management.service.ts:41); inlines `{id, parentId, status, paidDate, version}` rather than reusing nested `invoice` shape.
  → Fix: ✅ Removed local definition, imports `MarkInvoicePaidResult` from `@/backend/types`; uses derived `MarkInvoicePaidGraphQLType` for flattened GraphQL shape via `Omit`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/billing-management.pothos.ts:73 — Local `DeleteInvoiceResultDefinition` reimplements fields of service export `DeleteInvoiceResult` (services/billing/billing-management.service.ts:52); same pattern.
  → Fix: ✅ Removed local definition, imports `DeleteInvoiceResult` from `@/backend/types`; uses derived `DeleteInvoiceGraphQLType` for flattened GraphQL shape via `Omit`
- [x] [CRITICAL] Duplication: backend/graphql/pothos/notification-alerts.pothos.ts:3 — Local `SystemAlertDefinition` clones `SystemAlert` interface from services/notification/notification-alerts.service.ts:9 (identical fields, widens enum unions to `string`).
  → Fix: ✅ Removed local definition, imports `SystemAlert` from `@/backend/types` (new canonical file `notification-alerts.types.ts`)
- [x] [CRITICAL] Duplication: backend/graphql/pothos/notification-alerts.pothos.ts:25 — Local `NotificationAlertsResultDefinition` clones `NotificationAlertsResult` from services/notification/notification-alerts.service.ts:18.
  → Fix: ✅ Removed local definition, imports `NotificationAlertsResult` from `@/backend/types`
- [x] [CRITICAL] Duplication: backend/services/parent/parent-directory.service.ts:7 — Local `ParentDirectoryMetrics` interface duplicate of canonical `ParentDirectoryMetrics` in backend/types/parent.types.ts:13 (adds unrelated `id` field); violates services AGENTS.md rule "Services should import and use types from backend/types/ rather than creating ad-hoc type definitions."
  → Fix: ✅ Removed local interface, imports/re-exports from `@/backend/types`; canonical type enriched with `id` field
- [x] [CRITICAL] Duplication: backend/services/parent/parent-directory.service.ts:17 — Local `ParentDirectoryRow` interface duplicate of canonical `ParentDirectoryRow` in backend/types/parent.types.ts:22 (diverges by adding `index`/`guardianOf`/`time`/`accountStatus`); violates services AGENTS.md type definition pattern.
  → Fix: ✅ Removed local interface, imports/re-exports from `@/backend/types`; canonical type enriched with UI fields; raw repo shape separated as `ParentDirectoryRawRow`
- [x] [CRITICAL] Duplication: backend/services/parent/parent-directory.service.ts:29 — Local `ParentDirectoryResult` interface duplicate of canonical `ParentDirectoryResult` in backend/types/parent.types.ts:32; violates services AGENTS.md type definition pattern.
  → Fix: ✅ Removed local interface, imports/re-exports from `@/backend/types`

### WARNING (2)

- [x] [WARNING] Duplication: backend/graphql/pothos/schedule.pothos.ts:90 — Inline `paginationArgs` object literal redefines pagination field set instead of using `PaginationArgs` from `pagination.objects.ts` / `backend/types`; fourth inline copy.
  → Fix: ✅ Replaced inline pagination args with canonical `PaginationInput` import from `@/backend/types`
- [x] [WARNING] Duplication: backend/services/parent/parent-profile.service.ts:31 — Local `AssociatedStudentResult` duplicated and re-exported (with renamed alias `AssociatedStudentDefinition` at parent-profile.pothos.ts:59); structure should live once in backend/types/parent.types.ts.
  → Fix: ✅ Removed local interface, imports/re-exports from `@/backend/types`; also moved `ParentProfileResult` and `DeactivateParentResult` to canonical types

### SUGGESTION (3)

- [~] [SUGGESTION] Duplication: backend/graphql/pothos/schedule.pothos.ts:40 — `DailyScheduleListUserItem` ad-hoc local type (`{id, name}`) defined in a Pothos file; minor shape that could be a shared helper type if reused.
  → Fix: ⏭️ Skipped (low priority, no duplication with canonical types)
- [~] [SUGGESTION] Duplication: backend/graphql/pothos/teacher.pothos.ts:3 — `TeacherSimpleDefinition` (`{id, name}`) local ad-hoc type mirrors other "id+name" duo shapes across directory pothos files (staff-directory, student-directory); consider shared `EntityNameRef` type.
  → Fix: ⏭️ Skipped (low priority, no duplication with canonical types)
- [~] [SUGGESTION] Duplication: backend/db/repo/scheduling/scheduling-queries.repository.ts:509 — `FutureClassRow`, `WeeklyScheduleGridRow`, `UpcomingClassRow` etc. are similar "class row" entity shapes defined ad-hoc in the repository; if these overlap with canonical class-instance types in backend/types/group-class.types.ts they should reference/extend those instead of standalone inline literals.
  → Fix: ⏭️ Skipped (low priority, no duplication with canonical types)

## Recommended Actions

1. **Pagination consolidation (CRITICAL, 2 findings)**: Remove local `PaginationArgs`/`PaginationArgsInput` from `pagination.objects.ts` and `billing-history.pothos.ts`; import from `backend/types/pagination.types.ts` and extend as needed for GraphQL input shape. Also address the inline copy at `schedule.pothos.ts:90` (WARNING).

2. **Parent-directory consolidation (CRITICAL + WARNING, 6 findings)**: Remove `ParentDirectoryMetrics`, `ParentDirectoryRow`, `ParentDirectoryResult` from `parent-directory.service.ts`; use canonical types from `backend/types/parent.types.ts`. Update `parent-directory.pothos.ts` to import from `backend/types/parent.types.ts` instead of cloning service exports. Address `parent-profile.service.ts:31` `AssociatedStudentResult` duplication similarly.

3. **Billing-management consolidation (CRITICAL, 3 findings)**: Replace `ManualInvoiceResultDefinition`, `MarkInvoicePaidResultDefinition`, `DeleteInvoiceResultDefinition` local definitions in `billing-management.pothos.ts` with imports from service exports (or ideally canonical types in `backend/types/`), following the existing pattern of `SendPaymentReminderResult`.

4. **Notification-alerts consolidation (CRITICAL, 2 findings)**: Replace `SystemAlertDefinition` and `NotificationAlertsResultDefinition` in `notification-alerts.pothos.ts` with imports from canonical types; move `SystemAlert`/`NotificationAlertsResult` interfaces from service to `backend/types/`.

5. **Minor ad-hoc types (SUGGESTION, 3 findings)**: Consider creating shared helper types (`EntityNameRef` for `{id, name}` duos, and reviewing class-row shapes in scheduling repo) — lower priority.

## Layer Compliance Notes

Per AGENTS.md:
- "Never create local type definitions in Pothos files — always import from `@/backend/types`" — VIOLATED in all 10 Pothos CRITICAL findings
- "Services should import and use types from `@/backend/types/` rather than creating ad-hoc type definitions" — VIOLATED in 3 service-layer findings (escalated from WARNING to CRITICAL per backend/services/AGENTS.md)
- "Single canonical GraphQL object type per entity" — violated by duplicate definitions across pothos/services/types layers
- Exception policy (backend/graphql/AGENTS.md): "Wrapper types for collections or complex responses (e.g., paginated results) are allowed as separate definitions" — Pagination types are allowed as wrapper types, but should be defined ONCE in backend/types/ and imported, not duplicated 4 times

## Fix Status

- Total findings: 18
- Fixed: 15 / 18 (13 CRITICAL + 2 WARNING)
- Skipped: 3 / 18 (3 SUGGESTION — low priority, no canonical type duplication)
- Remaining: 0
