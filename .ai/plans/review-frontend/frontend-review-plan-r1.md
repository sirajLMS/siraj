# Frontend Review Plan — Round 1

**Date**: 2026-08-27
**Scope**: Entire frontend repo (views, stores, components, GraphQL documents)
**Focus**: Comprehensive (MUI v9, React 19, Apollo/GraphQL, Zustand, i18n, theme, patterns, logging)
**Files Reviewed**: ~3000 files
**Prior Round**: none

## Summary

Comprehensive frontend convention review across the entire repo. React 19 and
logging/code-style are clean. The bulk of findings are mechanical convention
violations: hardcoded `fontSize`/palette access (theme), non-deferred
`component="form"` direct props (MUI), hardcoded UI strings (i18n), and a
handful of Zustand/Apollo/patterns issues.

## Findings

### WARNING (theme — string palette access, 5)
- [ ] [WARNING] theme: frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx:218 — string palette "success.main"/"error.main" → theme callback
- [ ] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.tsx:102 — "text.secondary" → theme callback
- [ ] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.tsx:128 — "text.secondary" → theme callback
- [ ] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.tsx:144 — "text.secondary" → theme callback
- [ ] [WARNING] theme: frontend/mobile/views/dashboard/accounting/PaymentsListView.mobile.tsx:89 — "error.main" → theme callback

### WARNING (theme — hardcoded fontSize, 36)
- [ ] [WARNING] theme: frontend/common/components/ui/input/tagInput/TagInputShared.tsx:73,80 — fontSize 16/14 → theme variant
- [ ] [WARNING] theme: frontend/common/components/onboarding/sections/OnboardingPaymentMethodSection.tsx:161 — fontSize 12 → theme variant
- [ ] [WARNING] theme: frontend/common/views/dashboard/classes/details/admin/ClassInfoCard.tsx:51 — fontSize 12 → theme variant
- [ ] [WARNING] theme: frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.tsx:178 — fontSize 14 → theme variant
- [ ] [WARNING] theme: frontend/common/views/dashboard/complaints/components/complaintQueueCardShared.tsx:121 — fontSize 18 → titleLg
- [ ] [WARNING] theme: frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardShared.tsx:88 — fontSize 18 → titleLg
- [ ] [WARNING] theme: frontend/common/views/dashboard/components/customize/WcagBadge.tsx:65 — fontSize 10 → theme variant
- [ ] [WARNING] theme: frontend/common/views/dashboard/settings/tabs/appearance/AppearanceSettingsTab.tsx:308,328 — fontSize 10 → theme variant
- [ ] [WARNING] theme: frontend/common/views/dashboard/teachers/futureSchedule/components/futureClassCardShared.tsx:51,142,161,183 — fontSize 10/11 → theme variant
- [ ] [WARNING] theme: frontend/common/views/dashboard/teachers/futureSchedule/components/jumpToDateHeaderShared.tsx:102,127 — fontSize 10 → theme variant
- [ ] [WARNING] theme: frontend/common/views/dashboard/teachers/futureSchedule/components/miniCalendarShared.tsx:67 — fontSize 9 → theme variant
- [ ] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop.tsx:66 — fontSize 11 → theme variant (caption/body2)
- [ ] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop.tsx:98 — fontSize 12 → theme variant (caption)
- [ ] [WARNING] theme: (remaining fontSize findings — see /tmp/theme-findings.txt)

### WARNING (MUI — component="form" direct props, ~41)
- [ ] [WARNING] mui: 39 files with non-deferred `component="form"` direct props on Box/Stack (see grep list)

### WARNING (Zustand, 3)
- [ ] [WARNING] zustand: frontend/common/stores/currencyStore.ts:11 — NonNullable indexed-access workaround → codegen type
- [ ] [WARNING] zustand: frontend/common/stores/searchScheduleStore.ts:28 — Pick<...> & manual mapping → codegen type
- [ ] [WARNING] zustand: frontend/common/stores/searchScheduleStore.ts:36 — Omit<Pick<...>> + manual nullability → codegen type

### WARNING (Apollo/GraphQL, 6)
- [ ] [WARNING] apollo: frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.tsx:36 — inline gql + custom type → sharedDocuments
- [ ] [WARNING] apollo: frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.desktop.tsx:40 — inline gql + custom types → sharedDocuments
- [ ] [WARNING] apollo: frontend/common/graphql/sharedDocuments/billing/currency-catalog.documents.ts:1 — not exported from billing/index.ts barrel
- [ ] [WARNING] apollo: frontend/common/graphql/sharedDocuments/resources/books-and-bags.documents.ts:8 — `as TypedDocumentNode` cast → type annotation
- [ ] [WARNING] apollo: frontend/common/graphql/sharedDocuments/scheduling/available-slots.documents.ts:17 — `as TypedDocumentNode` cast → type annotation
- [ ] [SUGGESTION] apollo: frontend/common/graphql/sharedDocuments/settings/meeting-integrations.documents.ts:12 — fragment typed as whole-query type

### WARNING (patterns, 9)
- [ ] [WARNING] patterns: frontend/common/views/dashboard/staff/home/ManagersMetrics.tsx:3 — manual MetricCard/Grid → MetricCardGrid
- [ ] [WARNING] patterns: frontend/common/views/dashboard/admin/parents/home/ParentsMetricGrid.tsx:4 — manual MetricCard/Grid → MetricCardGrid
- [ ] [SUGGESTION] patterns: frontend/common/views/dashboard/classes/details/admin/LivePerformanceGrid.tsx:10 — reports/ MetricCardGrid → tier-specific grid
- [ ] [WARNING] patterns: frontend/common/views/dashboard/cron/components/CronRunsDialog.tsx:4 — raw DataGrid → AppDataGrid
- [ ] [WARNING] patterns: frontend/common/views/dashboard/students/profile/StudentCreditHoursTab.tsx:16 — raw Table → AppDataGrid/MobileCardList
- [ ] [WARNING] patterns: frontend/common/views/dashboard/scheduling/leave-requests/components/LeaveRequestStatusBadge.tsx:32 — Chip → StatusBadge
- [ ] [WARNING] patterns: frontend/common/views/dashboard/widgets/OpenRequestsWidget.tsx:70 — Chip → StatusBadge
- [ ] [WARNING] patterns: frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard.tsx:55 — Chip → StatusBadge
- [ ] [WARNING] patterns: frontend/common/views/dashboard/settings/tabs/appearance/AppearanceSettingsTab.tsx:152 — Chip → StatusBadge

### WARNING (i18n, 19)
- [ ] [WARNING] i18n: 19 client components with hardcoded UI strings (see /tmp/i18n-findings.txt)

## Scoping Decisions

### IN-SCOPE (fix this round)
- Theme string palette access (5) — mechanical, low-risk
- Theme hardcoded fontSize (36) — mechanical, map to theme variants
- Apollo `as TypedDocumentNode` casts (2) — mechanical
- Apollo missing barrel export (1) — mechanical
- Zustand type mapping (3) — mechanical, use codegen types

### DEFERRED (NOT in scope — see Deferral Decision Tree)
- MUI `component="form"` — requires per-file semantic review; `form` is a
  legitimate semantic element. Defer to a dedicated MUI migration round.
- i18n hardcoded strings (19) — requires creating new translation namespaces
  across `shared/locale/`; large cross-file scope. Defer to dedicated i18n round.
- patterns (9) — StatusBadge/MetricCardGrid/AppDataGrid migrations require
  understanding each component's data shape; defer to dedicated patterns round.
- Apollo inline gql documents (2) — require moving documents to sharedDocuments
  + regenerating types; defer.

## Cross-File Impacts

| Finding | Impacted Files | Impact Type | Status |
|---|---|---|---|
| currency-catalog.documents.ts barrel export | billing/index.ts | barrel export | pending |

## Deferred Findings (for future rounds)

| Pattern | Count | Recommendation |
|---|---|---|
| MUI component="form" | ~41 | dedicated MUI migration round |
| i18n hardcoded strings | 19 | dedicated i18n round |
| Dashboard UI patterns | 9 | dedicated patterns round |
| Apollo inline gql | 2 | dedicated GraphQL round |

## Layer Compliance Notes

None beyond the findings above.

## Fix Status

- Total findings: ~117
- Fixed: 0 / ~117
- Remaining: ~117
- Deferred: ~71 (MUI 41 + i18n 19 + patterns 9 + apollo inline 2)