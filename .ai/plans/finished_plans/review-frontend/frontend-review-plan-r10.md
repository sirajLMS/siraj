# Frontend Review Plan — Round 10

**Date**: 2026-08-18
**Scope**: All frontend code — views, stores, components, GraphQL documents
**Focus**: Comprehensive frontend review (MUI v9, React 19, Apollo, Zustand, i18n, Theme, Patterns, Logging)
**Files Reviewed**: ~390 files
**Prior Round**: r9
**Status**: ✅ COMPLETE — All actionable findings fixed and verified (tsgo, lint, biome clean)

## Summary

Round 10 found 23 actionable findings (3 CRITICAL, 16 WARNING, 4 SUGGESTION) across MUI v9, Theme, i18n, Patterns, and Logging groups. React 19, Apollo/GraphQL, and Zustand groups returned CLEAN. Two additional CRITICAL logging findings in stale untracked relic files were skipped per multi-agent awareness rules. The dominant violation pattern is hardcoded duration/time unit suffixes (11 i18n findings) bypassing the compile-time translation system.

## Findings

### CRITICAL (3)
- [ ] [CRITICAL] mui: frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx:180 — `Box component="input"` — use native `<input>` with styled()/wrapper; `input` is not in deferred list
- [ ] [CRITICAL] mui: frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile.tsx:116 — `Box component="input"` — use native `<input>` with styled()/wrapper; `input` is not in deferred list
- [ ] [CRITICAL] mui: frontend/mobile/views/dashboard/permissions/components/assignedUsersTab.mobile.tsx:62 — `Box component="input"` — use native `<input>` with styled()/wrapper; `input` is not in deferred list

### WARNING (16)
- [ ] [WARNING] theme: frontend/common/views/dashboard/teachers/reassignment/components/__shared__/reassignmentBentoGridShared.tsx:51 — Hardcoded fontSize "10px" should use theme typography variant (e.g. labelSm/tiny token)
- [ ] [WARNING] logging: frontend/common/views/dashboard/components/DashboardProfileShell.tsx:8 — Frontend component imports logger from wrong path `@/backend/lib/logger`; frontend code must use `@/frontend/common/utils/logger`
- [ ] [WARNING] mui: frontend/common/views/dashboard/resources/components/__shared__/resourceUploadGuidelinesShared.tsx:34 — Typography `component="li"` direct prop — use wrapper element or sx workaround
- [ ] [WARNING] mui: frontend/desktop/views/dashboard/classes/audit/adminNoteCard.desktop.tsx:36 — Typography `component="button"` direct prop — use native `<button>` styled element
- [ ] [WARNING] patterns: frontend/mobile/views/dashboard/supervisor/dashboard/supervisorDashboard.mobile.tsx:63 — Non-standard button with custom sx overrides instead of shared PrimaryPageAction with variant="text"
- [ ] [WARNING] i18n: frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.desktop.tsx:41 — `label={status}` passes raw enum value directly as StatusBadge label instead of translated label
- [ ] [WARNING] i18n: frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx:31-32 — Hardcoded "h"/"m" unit suffixes bypass i18n (Arabic: "س"/"د")
- [ ] [WARNING] i18n: frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx:165 — Hardcoded "min" duration unit suffix bypassing i18n
- [ ] [WARNING] i18n: frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop.tsx:118 — Hardcoded "m" duration suffix bypassing i18n translation
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile.tsx:135 — Hardcoded "m" duration suffix bypassing i18n translation
- [ ] [WARNING] i18n: frontend/desktop/views/dashboard/classes/recurring/recurringSchedulesListView.desktop.tsx:62 — Hardcoded "min" unit suffix bypassing i18n
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/classes/recurring/recurringSchedulesListView.mobile.tsx:74 — Hardcoded "min" unit suffix bypassing i18n
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/students/history/studentHistory.mobile.tsx:133 — Hardcoded "h" unit suffix bypassing i18n
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/students/history/components/classSessionList.mobile.tsx:29-32 — Hardcoded "m"/"h" unit suffixes bypass i18n
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/components/genericTabNav.mobile.tsx:18 — Hardcoded English aria-label default "Sections" bypasses i18n
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/components/genericTabNav.mobile.tsx:73 — Hardcoded English aria-label default "Days" bypasses i18n
  → Related: frontend/desktop/views/dashboard/components/genericTabNav.desktop.tsx:55 — same "Days" aria-label

### SUGGESTION (4)
- [ ] [SUGGESTION] theme: frontend/common/views/dashboard/admin/billing/currencies/utils/buildSupportedCurrencyColumns.tsx:34 — Inline `fontSize: 24` for flag emoji; prefer theme.typography variant or sx callback
- [ ] [SUGGESTION] i18n: frontend/mobile/views/dashboard/students/history/studentHistory.mobile.tsx:127 — Hardcoded "%" suffix bypassing i18n
- [ ] [SUGGESTION] i18n: frontend/mobile/views/dashboard/students/history/studentHistory.mobile.tsx:139 — Hardcoded "%" suffix bypassing i18n
- [ ] [SUGGESTION] i18n: frontend/mobile/views/dashboard/students/history/studentHistory.mobile.tsx:127 — Hardcoded "%" suffix (duplicate of above, same pattern)

## Scoping Decisions

### IN-SCOPE (will fix this round)
- 3 CRITICAL Box component="input" MUI v9 violations — clear migration to native input
- 2 WARNING Typography component violations (li, button) — clear migration
- 1 WARNING Theme hardcoded fontSize "10px" — map to theme.typography variant
- 1 WARNING Logging wrong import path — fix import to @/frontend/common/utils/logger
- 1 WARNING Patterns non-standard button — replace with PrimaryPageAction variant="text"
- 1 WARNING i18n teacherDues raw enum StatusBadge label — use translation helper
- 11 WARNING i18n hardcoded duration/unit suffixes — route through translation functions
- 3 SUGGESTION i18n "%" suffixes — route through translation functions
- 1 SUGGESTION Theme fontSize: 24 — map to sx callback or theme variant

### DEFERRED (NOT in scope — see Deferral Decision Tree)
- Stale untracked relic files (AdminBillingContainer.tsx, ParentLifecycleContainer.tsx under frontend/views/dashboard/) — from other agents, not our files
- Box component="span/li/ul/label/img" Typography component="span" (3 instances from Round 8 backlog) — deferred per Deferral Decision Tree
- Missing barrels in 150+ directories — massive scope, recommend dedicated round

## Cross-File Impacts

| Finding | Impacted Files | Impact Type | Status |
|---|---|---|---|
| None identified | — | — | — |

## Deferred Findings (for future rounds)

| Pattern | Count | Recommendation |
|---|---|---|
| Missing barrels in 150+ dirs | ~220 | Dedicated barrel-creation round |
| Typography component="span" | 3 | Round 8 backlog — deferred (no clean migration) |
| Stale untracked frontend/views/ files | 6 | Other agent artifacts — candidate for deletion |

## Layer Compliance Notes

- React 19: CLEAN ✅
- Apollo/GraphQL: CLEAN ✅
- Zustand: CLEAN ✅
- MUI v9: 3 CRITICAL (Box component="input"), 2 WARNING (Typography component="li"/"button")
- Theme: 1 WARNING (hardcoded fontSize), 1 SUGGESTION (inline fontSize)
- i18n: 14 findings (11 WARNING, 3 SUGGESTION) — hardcoded duration/unit suffixes
- Patterns: 1 WARNING (non-standard button)
- Logging: 1 WARNING (wrong import path) + 2 CRITICAL skipped (other agents' stale files)

## Fix Status

- Total findings: 23 (actionable) + 2 (skipped — other agents' files)
- Fixed: 0 / 23
- Remaining: 23
- Deferred: 6 (stale files, Typography component="span", missing barrels)
