# Frontend Review Plan — Round 4

**Date**: 2025-01-24
**Scope**: All frontend code — views, stores, components, GraphQL documents
**Focus**: Comprehensive frontend review (MUI v9, React 19, Apollo/GraphQL, Zustand, i18n, Theme, Patterns, Logging, Barrels)
**Files Reviewed**: ~700+ files across 8 review subagents

## Summary

Round 4 deep review found **162 findings** across 8 review groups. The largest category is **non-existent typography variants** (98 occurrences of `bodySm`, `titleMd`, `titleSm` across 42 files) — these silently fall back to default typography. Other significant categories include: barrel file structure violations (missing nested barrels, two-slash export paths), inline loading states (12 standalone `<CircularProgress>` instead of shared `LoadingState`), hand-written GraphQL operation types (should use generated), missing `id` fields in GraphQL documents, hardcoded aria-labels, and Zustand manual type redefinitions.

## Findings

### CRITICAL (0)

No critical bugs or breaking-change violations found this round.

### HIGH (27)

- [ ] [HIGH] theme-deep: ~42 files — **98 non-existent typography variant references** (`bodySm` ×78, `titleMd` ×14, `titleSm` ×6). These variants don't exist in `frontend/common/providers/theme/typography.ts` and silently fall back to default. Replace `bodySm` → `bodyMd`, `titleSm` → `labelSm` or `titleLg`, `titleMd` → `titleLg` or `labelMd`.
  - `TestConnectionResultPanel.tsx` (12 `bodySm`), `RecurringMeetingConfigSection.tsx` (5), `ConnectedAccountsTable.mobile.tsx` (4), `recurringSchedulesListView.mobile.tsx` (4), `teacherLessonReportsViewShared.tsx` (4), `generalSettingsColumns.tsx` (4), `LinkedClassInstancesList.tsx` (4), `AutoGenerationSupportCallout.tsx` (4), `sessionConfigTab.mobile.tsx` (3), `assignedStudentsCardList.mobile.tsx` (3), `meetingProviders.mobile.tsx` (3), `MeetingProviderCredentialForm.tsx` (3), `MeetingConfigFormDialogContent.tsx` (3), `AvatarImageField.tsx` (3), `MeetingGenerationStatusIndicator.tsx` (3), `sharedViewContent.tsx:57` (`titleMd`), `mobileScheduleList.mobile.tsx:174` (`bodySm`), `cronView.mobile.tsx:76` (`bodySm`), + ~24 more files with 1-2 each
- [ ] [HIGH] apollo-graphql: `meeting.documents.ts:4` — Import of hand-written operation types (`types/meeting-class-config.operations`) instead of generated types from `generated/gql/operations`
- [ ] [HIGH] apollo-graphql: `meeting.documents.ts:218-220` — `classMeetingConfigsQueryDocument` typed with hand-written `ClassOps` instead of generated `Operations.*`
- [ ] [HIGH] apollo-graphql: `meeting.documents.ts:272-274` — `recurringMeetingConfigsQueryDocument` typed with hand-written `ClassOps` instead of generated `Operations.*`
- [ ] [HIGH] apollo-graphql: `meeting.documents.ts:284-286` — `createClassMeetingConfigMutationDocument` typed with hand-written `ClassOps` instead of generated `Operations.*`
- [ ] [HIGH] apollo-graphql: `meeting.documents.ts:296-298` — `updateClassMeetingConfigMutationDocument` typed with hand-written `ClassOps` instead of generated `Operations.*`
- [ ] [HIGH] apollo-graphql: `meeting.documents.ts:308-310` — `deleteClassMeetingConfigMutationDocument` typed with hand-written `ClassOps` instead of generated `Operations.*`
- [ ] [HIGH] apollo-graphql: `meeting.documents.ts:317-319` — `setDefaultClassMeetingConfigMutationDocument` typed with hand-written `ClassOps` instead of generated `Operations.*`
- [ ] [HIGH] zustand: `currencyStore.ts:14` — Manual `SupportedCurrencyRow` type duplicates generated `SupportedCurrency` type
- [ ] [HIGH] zustand: `searchScheduleStore.ts:24` — Manual `SearchScheduleGapItem` duplicates generated `TeacherAvailabilityGap` type
- [ ] [HIGH] zustand: `searchScheduleStore.ts:36` — Manual `SearchScheduleMonthDrawerTeacher` duplicates generated `AvailabilitySearchTeacher` type
- [ ] [HIGH] i18n: `teacherCardList.mobile.tsx:155` — Raw translation key path as `placeholder` ("placeholders.searchTeachers" renders literally)
- [ ] [HIGH] i18n: `ResponsiveViewSwitch.tsx:44` — Hardcoded error message "Failed to load view. Please refresh the page." in error boundary
- [ ] [HIGH] patterns-logging: `frontend/common/lib/console.ts:3,6,9,12` — Duplicate logger wrapper using `console.*` directly; not ESLint-exempt; dead code
- [ ] [HIGH] barrels: `shared/locale/namespaces/index.ts:5` — Parent barrel re-exports ~110 nested files via two-slash paths
- [ ] [HIGH] barrels: `shared/locale/namespaces/index.ts:1` — Missing nested barrel files for all ~28 subdirectories
- [ ] [HIGH] barrels: `frontend/common/components/ui/display/index.ts:1` — Parent re-exports nested files via two-slash paths
- [ ] [HIGH] barrels: `frontend/common/components/ui/input/index.ts:2` — Parent re-exports nested files via two-slash paths
- [ ] [HIGH] barrels: `frontend/desktop/components/ui/display/index.ts:1` — Parent re-exports nested files via two-slash paths
- [ ] [HIGH] barrels: `frontend/mobile/components/ui/display/index.ts:1` — Parent re-exports nested files via two-slash paths
- [ ] [HIGH] barrels: `frontend/common/views/dashboard/components/navbar/notifications/types/index.ts:5-6` — Barrel uses `@/` path alias instead of relative `./`
- [ ] [HIGH] theme-deep: `parentOnboardingShared.options.tsx:43,91` — Hardcoded `fontWeight: "bold"` string (×2)
- [ ] [HIGH] theme-deep: `OverridesCell.tsx:65,95` — Hardcoded `fontWeight: "bold"` string (×2)
- [ ] [HIGH] theme-deep: `currencySymbolAdornmentShared.tsx:15` — Hardcoded `fontWeight: "bold"` string
- [ ] [HIGH] theme-deep: `buildSupportedCurrencyColumns.tsx:34`, `addPermissionFilterBar.mobile.tsx:37`, `assignedUsersTab.mobile.tsx:160` — `style={{}}` props with hardcoded values (×3)

### WARNING (53)

- [ ] [WARNING] mui-deep: `OnboardingPaymentMethodSection.tsx:161` — Typography uses `component="span"` as direct prop (MUI v9 discourages)
- [ ] [WARNING] react19: `upcomingClassesTable.mobile.tsx:1` — Missing `"use client"` directive (works via inheritance but should be explicit)
- [ ] [WARNING] apollo-graphql: `types/meeting-class-config.operations.ts:1-87` — Hand-written operation/fragment types duplicate generated types; should be deleted
- [ ] [WARNING] apollo-graphql: `auth.documents.ts:136-143` — `permissionGroupSimulationStatus` query omits `id` on object type
- [ ] [WARNING] apollo-graphql: `auth.documents.ts:148-152` — `simulatablePermissionGroups` query omits `id` on object type
- [ ] [WARNING] apollo-graphql: `auth.documents.ts:191-196` — `adminResetPassword` mutation omits `id` on result type
- [ ] [WARNING] i18n: `ResponsiveViewSwitch.tsx:40` — Hardcoded "Retry" button text in error fallback
- [ ] [WARNING] i18n: `TimezoneWarningBanner.tsx:61` — Hardcoded `aria-label="close"`
- [ ] [WARNING] i18n: `createRecurringClassDialog.mobile.tsx:32` — Hardcoded `aria-label="close"`
- [ ] [WARNING] i18n: `mobileMenuButton.mobile.tsx:16` — Hardcoded `aria-label="menu"`
- [ ] [WARNING] i18n: `profileTabNav.mobile.tsx:28` — Hardcoded `aria-label="Profile sections"`
- [ ] [WARNING] i18n: `UserMenuButton.tsx:218` — Hardcoded `aria-label="user profile menu"`
- [ ] [WARNING] i18n: `AdminActionsBar.tsx:251` — Hardcoded `aria-label="delete-instance"` (should use labels.deleteInstance)
- [ ] [WARNING] patterns-logging: `ConnectProviderAccount.tsx:89` — Inline status chip bypasses existing shared `OAuthConnectionStatusBadge`
- [ ] [WARNING] patterns-logging: `parentSocialShared.tsx:105` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `supervisorProfileShared.tsx:33` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `lessonReportDetailShared.tsx:31` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `teacherOwnProfileShared.tsx:34` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `teacherStudentsViewShared.tsx:102` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `teacherClassListViewShared.tsx:140` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `teacherLessonReportsViewShared.tsx:163` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `StudentQuotaContainer.tsx:33,43` — Inline `<CircularProgress>` (×2) instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `TeacherReassignmentContainer.tsx:71` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] patterns-logging: `RescheduleContainer.tsx:137` — Inline `<CircularProgress>` instead of shared `LoadingState`
- [ ] [WARNING] barrels: `frontend/common/components/ui/display/` — Missing nested barrels (8 subdirs)
- [ ] [WARNING] barrels: `frontend/common/components/ui/input/` — Missing nested barrels (8 subdirs)
- [ ] [WARNING] barrels: `frontend/desktop/components/ui/display/` — Missing nested barrels (7 subdirs)
- [ ] [WARNING] barrels: `frontend/mobile/components/ui/display/` — Missing nested barrels (10 subdirs)
- [ ] [WARNING] barrels: `frontend/common/components/ui/index.ts:10` — Two-slash path `./story/StoryBookPageContainer`
- [ ] [WARNING] barrels: `frontend/common/components/ui/input/index.ts:6` — Named re-export instead of `export *`

### SUGGESTION (5)

- [ ] [SUGGESTION] patterns-logging: `parentRulesShared.tsx:47` — Non-standard button (plain `Button` instead of `ExportButton`)
- [ ] [SUGGESTION] patterns-logging: `teacherClassListViewShared.tsx:117` — Non-standard button (plain `Button` instead of `PrimaryPageAction`)
- [ ] [SUGGESTION] patterns-logging: `LivePerformanceGrid.tsx:61-80` — Ad-hoc flex title block instead of `SectionPanel`
- [ ] [SUGGESTION] patterns-logging: `TestConnectionResultPanel.tsx:41-57` — Non-standard buttons instead of `PrimaryPageAction`/`FilterButton`
- [ ] [SUGGESTION] patterns-logging: `ConnectProviderAction.tsx:60` — Non-standard button instead of `PrimaryPageAction`

## Recommended Actions

### Priority 1 — HIGH severity (fix all)
1. **Non-existent typography variants** (98 occurrences / 42 files): Replace `bodySm` → `bodyMd`, `titleSm` → `labelSm`, `titleMd` → `titleLg` or `labelMd` (verify each context — `titleLg` for section titles, `labelMd` for smaller emphasis). Largest batch fix.
2. **Hand-written GraphQL operation types** (meeting.documents.ts): Migrate 6 TypedDocumentNode types from `ClassOps.*` to `Operations.*`; delete stale `types/meeting-class-config.operations.ts`.
3. **Missing `id` fields in auth documents** (3 queries): Add `id` to `permissionGroupSimulationStatus`, `simulatablePermissionGroups`, `adminResetPassword`.
4. **Zustand manual type redefinitions** (2 stores): Replace manual interfaces with `Pick`/`Subset` of generated types.
5. **i18n hardcoded strings** (2 HIGH): Fix raw key placeholder and hardcoded error message in error boundary.
6. **Duplicate console wrapper** (`frontend/common/lib/console.ts`): Delete dead code file.
7. **Barrel file structure** (6 HIGH): Fix `@/` alias in barrel, create missing nested barrels, restructure parent barrels to use subdir exports.
8. **Hardcoded `fontWeight: "bold"`** (5 occurrences): Replace with `700` (numeric) or theme weight token.
9. **`style={{}}` props** (3 occurrences): Move to `sx` with theme tokens.

### Priority 2 — WARNING severity (fix all)
10. **Typography `component="span"`** (1): Replace with `<Box component="span">` or `<span>`.
11. **Missing `"use client"`** (1): Add directive.
12. **Hardcoded aria-labels** (7): Add translation keys and use `labels.*` or `lang.*`.
13. **Inline loading states** (12): Replace standalone `<CircularProgress>` with shared `LoadingState`.
14. **Inline status chip** (1): Use shared `OAuthConnectionStatusBadge`.
15. **Missing nested barrels** (33 subdirs across 4 parent dirs): Create `index.ts` in each.
16. **Barrel named re-exports** (2): Convert to `export *` where no collision exists.

### Priority 3 — SUGGESTION severity (fix all)
17. **Non-standard buttons** (4): Replace with `PrimaryPageAction`/`FilterButton`/`ExportButton`.
18. **Ad-hoc flex title block** (1): Replace with `SectionPanel`.

## Layer Compliance Notes

- **Barrel conventions** (AGENTS.md): Multiple violations across `shared/locale/namespaces/`, `frontend/common/components/ui/display/`, `frontend/common/components/ui/input/`, `frontend/desktop/components/ui/display/`, `frontend/mobile/components/ui/display/` — parent barrels re-exporting nested files directly instead of using subdir barrels, missing nested barrel files, and one barrel using `@/` path alias.
- **GraphQL conventions** (AGENTS.md): `meeting.documents.ts` uses hand-written operation types instead of generated types; 3 auth documents missing `id` field for Apollo cache normalization.
- **i18n conventions** (AGENTS.md): 9 hardcoded user-facing strings (error messages, aria-labels, placeholder).
- **Theme conventions** (AGENTS.md): 98 non-existent typography variants, 5 hardcoded `fontWeight: "bold"`, 3 `style={{}}` props.
- **Logging conventions** (AGENTS.md): 1 duplicate console wrapper not in ESLint exempt list.
- **Zustand conventions** (AGENTS.md): 3 manual type redefinitions duplicating generated GraphQL types.

## Fix Status

- Total findings: ~85 discrete findings (some cover multiple files)
- Fixed: 0 / ~85
- Remaining: ~85
