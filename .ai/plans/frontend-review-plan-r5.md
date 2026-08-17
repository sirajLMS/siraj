# Frontend Review Plan — Round 5

**Date**: 2026-08-18
**Scope**: All frontend code (frontend/common/, frontend/desktop/, frontend/mobile/, app/, shared/)
**Focus**: Comprehensive — MUI v9, React 19, Apollo, Zustand, i18n, Theme, Patterns, Logging, Barrels
**Files Reviewed**: 3360+ files across 8 review groups
**Round**: 5 (another full round — no files ignored from prior rounds)

## Summary

Round 5 comprehensive frontend review identified ~1110 findings across 8 review groups. The largest category is MUI v9 direct style prop usage on Stack/Box/Typography (~903 warnings) — many are pervasive patterns. Critical findings include 14 non-existent Typography variants in `sx={{ typography: "..." }}`, 1 missing "use client" on a hook-using component, stale hand-written GraphQL type stubs, hardcoded user-facing strings, raw rgba colors, borderRadius raw px, and missing barrel files. All severities will be fixed per user request.

| Group | CRITICAL | WARNING | SUGGESTION |
|---|---|---|---|
| MUI v9 | 13 | 903 | 0 |
| React 19 | 0 | 75 | 2 |
| Apollo | 1 | 4 | 1 |
| Zustand | 2 | 5 | 4 |
| i18n | 4 | 9 | 4 |
| Theme | 18 | 16 | 5 |
| Barrels | 8 | ~30 | ~3 |
| Logging | 0 | 4 | 4 |
| Patterns | 1 | 6 | 7 |
| **Total** | **47** | **1052** | **30** |

## Findings

### CRITICAL (40)

#### MUI v9 — Non-existent Typography variants in sx (13)
- [ ] [CRITICAL] MUI: frontend/common/components/ui/container/__shared__/adminControlPanelShared.options.tsx:18 — Non-existent typography variant 'titleMd' in sx
- [ ] [CRITICAL] MUI: frontend/common/lib/formatCurrencyForDisplay.stories.tsx:42 — Non-existent typography variant 'titleMd' in sx
- [ ] [CRITICAL] MUI: frontend/common/lib/formatCurrencyForDisplay.stories.tsx:59 — Non-existent typography variant 'bodySm' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/classes/recurring/components/__shared__/daysScheduleSectionShared.tsx:41 — Non-existent typography variant 'labelLg' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/classes/recurring/components/__shared__/daysScheduleSectionShared.tsx:44 — Non-existent typography variant 'labelLg' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/settings/tabs/__shared__/environmentConfigTabShared.tsx:42 — Non-existent typography variant 'titleMd' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx:96 — Non-existent typography variant 'titleMd' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListViewShared.tsx:79 — Non-existent typography variant 'bodySm' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared.tsx:69 — Non-existent typography variant 'bodySm' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared.tsx:74 — Non-existent typography variant 'bodySm' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared.tsx:79 — Non-existent typography variant 'bodySm' in sx
- [ ] [CRITICAL] MUI: frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared.tsx:90 — Non-existent typography variant 'bodySm' in sx
- [ ] [CRITICAL] MUI: frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile.tsx:138 — Non-existent typography variant 'labelLg' in sx

#### Apollo — Stale hand-written type stubs (1)
- [ ] [CRITICAL] Apollo: frontend/common/graphql/types/meeting-class-config.operations.ts:11-79 — Hand-written operation/fragment types duplicate generated types. Codegen has landed; delete stub and import from `@/frontend/common/graphql/generated/gql/operations`

#### Zustand — Persisted enum validation (2)
- [ ] [CRITICAL] Zustand: frontend/common/stores/searchScheduleStore.ts:108 — `isPersistedSearchScheduleState` is a duck-type check that doesn't validate enum values (`sortBy`, `gender`) after JSON.parse
- [ ] [CRITICAL] Zustand: frontend/common/stores/searchScheduleStore.ts:208 — Persisted enum fields not protected against post-serialization string drift

#### i18n — Hardcoded user-facing strings (4)
- [ ] [CRITICAL] i18n: frontend/common/components/ui/container/ResponsiveViewSwitch.tsx:40 — Hardcoded "Retry" button text in error-boundary fallback
- [ ] [CRITICAL] i18n: frontend/common/components/ui/container/ResponsiveViewSwitch.tsx:44 — Hardcoded "Failed to load view. Please refresh the page." JSX text
- [ ] [CRITICAL] i18n: frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx:44 — Hardcoded `label="Frozen"` on Chip; component already receives labels prop
- [ ] [CRITICAL] i18n: frontend/mobile/views/dashboard/permissions/components/userOverridesDataGrid.mobile.tsx:67 — Hardcoded `label="Status"` on StatisticBox; siblings correctly use t.* keys

#### Theme — Hardcoded rgba colors (3)
- [ ] [CRITICAL] Theme: frontend/common/components/ui/input/avatarImageField/AvatarImageField.tsx:84 — Hardcoded `backgroundColor: "rgba(0,0,0,0.45)"`
- [ ] [CRITICAL] Theme: frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.tsx:70 — Hardcoded `backgroundColor: "rgba(0,0,0,0.5)"`
- [ ] [CRITICAL] Theme: frontend/common/providers/theme/components.ts:288 — Hardcoded `rgba(13, 148, 136, 0.04)` / `rgba(45, 212, 191, 0.06)` row hover

#### Theme — Hardcoded borderRadius raw px (15)
- [ ] [CRITICAL] Theme: frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertBanners.desktop.tsx:37 — `borderRadius: "0 12px 12px 0"` raw px
- [ ] [CRITICAL] Theme: frontend/desktop/views/dashboard/admin/parents/home/parentsView.desktop.tsx:41 — `borderRadius: 10` raw integer
- [ ] [CRITICAL] Theme: frontend/desktop/components/ui/form/snackbar/DesktopFormErrorSnackbar.tsx:23 — `borderRadius: 10` raw
- [ ] [CRITICAL] Theme: frontend/mobile/components/ui/form/snackbar/MobileFormErrorSnackbar.tsx:23 — `borderRadius: 10` raw
- [ ] [CRITICAL] Theme: frontend/common/views/dashboard/components/client/SidebarShell.tsx:333 — `borderRadius: 10` raw
- [ ] [CRITICAL] Theme: frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingView.desktop.tsx:22 — `borderRadius: 10` raw
- [ ] [CRITICAL] Theme: frontend/mobile/views/dashboard/classes/recurring/createRecurringClassView.mobile.tsx:15,38 — `borderRadius: 10` raw (2 occurrences)
- [ ] [CRITICAL] Theme: frontend/mobile/views/dashboard/reschedule/tracking/components/rescheduleTrackingCardList.mobile.tsx:117 — `borderRadius: 6` raw
- [ ] [CRITICAL] Theme: frontend/mobile/views/dashboard/students/history/components/performanceStreak.mobile.tsx:21 — `borderRadius: 4` raw
- [ ] [CRITICAL] Theme: frontend/common/views/dashboard/profile/shared/ProfileHeader.tsx:60 — `borderRadius: 999` raw
- [ ] [CRITICAL] Theme: frontend/common/views/dashboard/student/dashboard/components/recentLessonReportCompletionBar.shared.tsx:37,40 — `borderRadius: 999` raw (2 occurrences)
- [ ] [CRITICAL] Theme: frontend/common/views/dashboard/parent/dashboard/components/__shared__/academicProgressSummaryShared.tsx:36,39 — `borderRadius: 999` raw (2 occurrences)
- [ ] [CRITICAL] Theme: frontend/desktop/views/dashboard/parent/dashboard/components/parentWelcomeHero.desktop.tsx:48 — `borderRadius: 999` raw
- [ ] [CRITICAL] Theme: frontend/mobile/views/dashboard/parent/dashboard/components/parentWelcomeHero.mobile.tsx:48,69 — `borderRadius: 999` raw (2 occurrences)
- [ ] [CRITICAL] Theme: frontend/common/views/dashboard/permissions/components/__shared__/addPermissionFilterBarShared.tsx:10 — `borderRadius: 8` raw in styled()
- [ ] [CRITICAL] Theme: frontend/mobile/views/dashboard/permissions/components/permissionCatalogToolbar.mobile.tsx:22 — `borderRadius: "9999px"` raw
- [ ] [CRITICAL] Theme: frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.tsx:281 — `borderRadius: "3px 3px 0 0"` raw

#### Barrels — Missing barrel files (8)
- [ ] [CRITICAL] Barrels: frontend/common/components/ui/form/index.ts — MISSING barrel (date/, field/, snackbar/, time/ subdirs have barrels but parent form/ does not)
- [ ] [CRITICAL] Barrels: frontend/common/components/auth/index.ts — MISSING barrel (5 exportable modules)
- [ ] [CRITICAL] Barrels: frontend/common/components/onboarding/hooks/index.ts — MISSING barrel (useOnboardingAvatar.ts, useOnboardingSubmit.ts)
- [ ] [CRITICAL] Barrels: frontend/common/components/ui/dialog/types/index.ts — MISSING barrel (3 type files)
- [ ] [CRITICAL] Barrels: frontend/common/components/reports/index.ts — MISSING barrel
- [ ] [CRITICAL] Barrels: frontend/common/components/intl/index.ts — MISSING barrel
- [ ] [CRITICAL] Barrels: frontend/common/components/ui/dialog/index.ts — Parent barrel only exports ./BaseDeleteDialog, does NOT re-export ./types
- [ ] [CRITICAL] Barrels: frontend/common/components/onboarding/sections/index.ts — Barrel omits export * from "./types" and export * from "./userPersonalFieldComponents"

#### Barrels — Re-export shim (1)
- [ ] [CRITICAL] Barrels: shared/locale/notifications/index.ts:24 — File is ONLY a re-export shim from `@/shared/locale/types/notifications` (prohibited by rule 8)

### WARNING (30+)

#### MUI v9 — Direct style props on Stack/Box/Typography (903 total)
- [ ] [WARNING] MUI: 377 occurrences of `<Stack spacing={...}>` direct prop → should be in sx
- [ ] [WARNING] MUI: 171 occurrences of `<Stack direction="...">` direct prop → should be sx={{ flexDirection: ... }}
- [ ] [WARNING] MUI: 123 occurrences of `<Box component="...">` direct prop
- [ ] [WARNING] MUI: 52 occurrences of `<Typography component="...">` direct prop
- [ ] [WARNING] MUI: 47 occurrences of `<Box flex="...">` direct prop
- [ ] [WARNING] MUI: 44 occurrences of `<Box display="...">` direct prop
- [ ] [WARNING] MUI: 28 occurrences of `<Typography color="...">` direct prop
- [ ] [WARNING] MUI: 12 occurrences of `<Link style={{}}>` → use sx
- [ ] [WARNING] MUI: 10 occurrences of `<Box py={...}>` direct prop
- [ ] [WARNING] MUI: 6 occurrences each of `<Box px>`, `<Box p>`, `<Box mb>` direct props
- [ ] [WARNING] MUI: 4 occurrences of `<Box textAlign="...">` direct prop
- [ ] [WARNING] MUI: 3 occurrences of `<Typography fontWeight={...}>` direct prop
- [ ] [WARNING] MUI: misc single occurrences of Stack/Box/Typography direct props

#### React 19 — Missing "use client" directives (~70)
- [ ] [WARNING] React: ~57 Zustand stores missing "use client" directive
- [ ] [WARNING] React: ~13 hooks/view-models missing "use client" directive
- [ ] [WARNING] React: ~6 render components missing "use client" directive

#### React 19 — Context/consumer hook co-location (5)
- [ ] [WARNING] React: frontend/common/context/ViewportContext.ts:14 — Co-locates createContext + useViewport()
- [ ] [WARNING] React: frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.ts:5 — Co-locates createContext + useQuotaFormAccess()
- [ ] [WARNING] React: frontend/common/views/dashboard/students/profile/studentProfileContext.ts:4 — Co-locates createContext + useStudentProfileContext()
- [ ] [WARNING] React: frontend/common/views/dashboard/students/quota/quotaFormAccessContext.ts:5 — Co-locates createContext + useQuotaFormAccess()
- [ ] [WARNING] React: frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryStudentFieldContext.ts:9 — Co-locates createContext + useManualClassEntryStudentField()

#### Apollo — Stale stub consumers (4)
- [ ] [WARNING] Apollo: frontend/common/types/meeting-class-config.graphql.types.ts:1-33 — Hand-written input/enum types bypass generated Types.*
- [ ] [WARNING] Apollo: frontend/common/components/ui/input/meetingConfigSelect/MeetingConfigSelectShared.tsx:6 — Imports from stale stub
- [ ] [WARNING] Apollo: frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection.tsx:12 — Imports from stale stub
- [ ] [WARNING] Apollo: frontend/common/components/ui/display/meetingConfig/types/meetingConfigDisplay.types.ts — Imports from stale stub

#### Zustand — Convention violations (5)
- [ ] [WARNING] Zustand: frontend/common/stores/billingTabsStore.ts:10-32 — Duplicates createTabbedPaneStore logic inline
- [ ] [WARNING] Zustand: 5 stores — `snackbarSeverity` redefined inline instead of shared type
- [ ] [WARNING] Zustand: frontend/common/stores/studentHistoryStore.ts:4 — Stores `Date` object (non-serializable if persist added)
- [ ] [WARNING] Zustand: 3 files — Non-standard `*Types.ts` naming (should be `*Store.ts` or inlined)
- [ ] [WARNING] Zustand: frontend/common/stores/ — Missing `index.ts` barrel file

#### i18n — Hardcoded aria-labels (9)
- [ ] [WARNING] i18n: frontend/desktop/views/dashboard/resources/books-and-bags/components/bookItemCard.desktop.tsx:56 — Hardcoded `aria-label="Delete book"`
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/resources/books-and-bags/components/bookItemCard.mobile.tsx:43 — Hardcoded `aria-label="Delete book"`
- [ ] [WARNING] i18n: frontend/desktop/views/dashboard/resources/components/resourceLibraryCard.desktop.tsx:53 — Hardcoded `aria-label="Delete resource"`
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/resources/components/resourceLibraryCard.mobile.tsx:56 — Hardcoded `aria-label="Delete resource"`
- [ ] [WARNING] i18n: frontend/common/views/dashboard/shared/SubmissionSuccessBanner.tsx:32 — Hardcoded `aria-label="Dismiss"`
- [ ] [WARNING] i18n: frontend/common/views/dashboard/classes/details/teacher/TimezoneWarningBanner.tsx:61 — Hardcoded `aria-label="close"`
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile.tsx:32 — Hardcoded `aria-label="close"`
- [ ] [WARNING] i18n: frontend/mobile/views/dashboard/components/mobileMenuButton.mobile.tsx:16 — Hardcoded `aria-label="menu"`
- [ ] [WARNING] i18n: frontend/common/views/dashboard/components/navbar/UserMenuButton.tsx:218 — Hardcoded `aria-label="user profile menu"`

#### Theme — String-based palette access (12)
- [ ] [WARNING] Theme: frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardListShared.tsx:73 — String-based palette access `color: "primary.main"`
- [ ] [WARNING] Theme: frontend/common/components/onboarding/sections/OnboardingPaymentMethodSection.tsx:161 — `color: "error.main"` string access
- [ ] [WARNING] Theme: frontend/common/views/dashboard/classes/recurring/RecurringRateSection.tsx:101,102 — `color: "error.main"` / `"success.main"`
- [ ] [WARNING] Theme: frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.tsx:72 — `color: "error.main"`
- [ ] [WARNING] Theme: frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection.tsx:118,119 — `color: "error.main"` (2 occurrences)
- [ ] [WARNING] Theme: frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFieldsShared.tsx:120 — `color: "error.main"`
- [ ] [WARNING] Theme: frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx:186,201,231,459 — `color: "error.main"` (4 occurrences)
- [ ] [WARNING] Theme: frontend/mobile/components/ui/card/MobileCardListItem.stories.tsx:244 — `color: "secondary.contrastText"` → use onSecondary

#### Barrels — @/ aliases in barrels + imports in barrels (~35)
- [ ] [WARNING] Barrels: ~28 shared/locale/{en,ar}/**/index.ts files use `@/` alias (rule 2 violation)
- [ ] [WARNING] Barrels: shared/locale/en/ui/paymentMethod/index.ts, ui/meetingConfig/index.ts, ui/index.ts, dashboard/index.ts, auth/index.ts, types/ui/index.ts — `import` statements in barrel files (rule 6)
- [ ] [WARNING] Barrels: frontend/common/lib/logger/index.ts — Full implementation in index.ts, not a barrel
- [ ] [WARNING] Barrels: shared/locale/namespaces/index.ts:1-111 — ~110 `export * from` paths with more than one `/` (re-exporting nested files)

#### Barrels — Named re-exports instead of export * (many)
- [ ] [WARNING] Barrels: shared/locale/en/dashboard/lms/index.ts — Named re-exports with aliasing
- [ ] [WARNING] Barrels: Multiple avatar/badge/paymentMethodSelect/meetingConfig barrels — `export { X } from` instead of `export * from`

#### Barrels — Deep imports bypassing barrels (6)
- [ ] [WARNING] Barrels: frontend/common/components/onboarding/sections/userPersonalFieldComponents.tsx:17,18 — Deep imports bypassing countrySelect/genderSelector barrels
- [ ] [WARNING] Barrels: frontend/common/views/dashboard/cron/__shared__/cronDialogsShared.tsx:4 — Deep import bypassing dialog barrel
- [ ] [WARNING] Barrels: ParentExtensionSection.tsx:5,9 — Deep imports bypassing onboarding/sections barrel
- [ ] [WARNING] Barrels: reportFiltersFormShared.utils.ts:3 — Deep import bypassing userSelect barrel

#### Logging — Dead deprecated exports (4)
- [ ] [WARNING] Logging: frontend/desktop/views/dashboard/settings/whatsapp/whatsappConfig.desktop.tsx:30 — Deprecated export with zero importers
- [ ] [WARNING] Logging: frontend/mobile/views/dashboard/settings/whatsapp/whatsappConfig.mobile.tsx:30 — Deprecated export with zero importers
- [ ] [WARNING] Logging: frontend/common/views/dashboard/permissions/components/useAssignGroupForm.ts:17-18 — Deprecated unused type alias
- [ ] [WARNING] Logging: frontend/common/lib/country/useCountryDetection.ts:1-5 — Dead re-export with no consumers

### CRITICAL (Patterns) (1)
- [ ] [CRITICAL] Patterns: frontend/common/views/dashboard/classes/details/admin/ClassDetailsAdminView.tsx:22 — Component uses useState() but has no "use client" directive

### WARNING (Patterns) (6)
- [ ] [WARNING] Patterns: frontend/common/views/dashboard/cron/components/CronRunsDialog.tsx:69 — Inline <Chip> for run status; use shared <StatusBadge category="cronRunStatus">
- [ ] [WARNING] Patterns: frontend/common/views/dashboard/cron/useCronViewModel.tsx:160 — Inline <Chip> for schedule status; use <StatusBadge category="cronScheduleStatus">
- [ ] [WARNING] Patterns: frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsCardList.mobile.tsx:39 — Inline <Chip variant="outlined"> for status; use <StatusBadge>
- [ ] [WARNING] Patterns: frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.tsx:169,173 — Inline navigator.clipboard.writeText; reuse adjacent useCopyFeedback hook
- [ ] [WARNING] Patterns: frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.tsx:133 — Inline navigator.clipboard.writeText(meetingUrl); use <CopyMeetingUrlButton> or useCopyFeedback
- [ ] [WARNING] Patterns: frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent.tsx:35 — Inline navigator.clipboard.writeText(previewUrl); reuse shared copy component

### SUGGESTION (Patterns) (7)
- [ ] [SUGGESTION] Patterns: admin/billing/currencies/utils/buildSupportedCurrencyColumns.tsx:34 — Inline style={{ fontSize: 24 }} on plain HTML span; use sx
- [ ] [SUGGESTION] Patterns: shared/AdminQueueEfficiencyBanner.tsx:18-41 — Replicates MetricCard layout; reuse MetricCard
- [ ] [SUGGESTION] Patterns: mobile/reports/components/engagementRateCard.mobile.tsx:16-57 — Bespoke stat card; reuse MetricCard
- [ ] [SUGGESTION] Patterns: settings/SettingsTabPanels.tsx:78 — Inline <CircularProgress> in local fallback; use <LoadingState>
- [ ] [SUGGESTION] Patterns: lib/TabPanelFallback.tsx:8 — Inline <CircularProgress>; use <LoadingState>
- [ ] [SUGGESTION] Patterns: container/ResponsiveViewSwitch.tsx:64 — Inline <CircularProgress> as fallback; could use <LoadingState>
- [ ] [SUGGESTION] Patterns: billing/quota/QuotaDetailContainer.tsx:42 — Plain outlined Button for "back"; consider primary action wrapper

### SUGGESTION (16+)
- [ ] [SUGGESTION] React: AdminResetPasswordSection.tsx:27,55 — forwardRef modernization + useImperativeHandle deps array
- [ ] [SUGGESTION] Apollo: meeting-class-config.operations.ts:81-86 — MeetingConfigSelectOption in wrong file
- [ ] [SUGGESTION] Zustand: teacherDashboardStore.ts — Consider Pick over generated types
- [ ] [SUGGESTION] Zustand: parentBillingStore.ts, userBillingProfileStore.ts — Extract shared BillingUiState base type
- [ ] [SUGGESTION] Zustand: meetingIntegrationsSettingsStore.ts — Remove legacy dual-representation fields
- [ ] [SUGGESTION] Zustand: dashboardStore.ts — Remove dead mock surface
- [ ] [SUGGESTION] i18n: MeetingConfigsBreadcrumb.tsx:12 — aria-label="breadcrumb" conventional default
- [ ] [SUGGESTION] i18n: AdminActionsBar.tsx:251 — aria-label="delete-instance" technical identifier
- [ ] [SUGGESTION] i18n: teacherCardList.mobile.tsx:155 — Verify placeholder key resolution
- [ ] [SUGGESTION] Theme: SidebarShell.tsx:719 — border color via CSS var vs theme callback
- [ ] [SUGGESTION] Theme: InvoicePaymentDetailsDialog.tsx:137 — borderColor string shorthand
- [ ] [SUGGESTION] Theme: CreateRecurringClassDialogShared.tsx:332 — border without explicit borderColor
- [ ] [SUGGESTION] Theme: MetricCard/styled.tsx:92 — border without explicit borderColor
- [ ] [SUGGESTION] Logging: whatsappSettingsTypes.ts:256-267 — Deprecated-but-mandated handler aliases
- [ ] [SUGGESTION] Logging: useParentBillingViewModel.ts:161-162,210; useManualInvoiceViewModel.ts:173 — Add comment to empty .catch blocks
- [ ] [SUGGESTION] Logging: TeacherScheduleActionsIsland.tsx:40-104 — Extract createSessionActionHandler helper
- [ ] [SUGGESTION] Logging: useClassActionHandlers.ts:16-67 — Extract wrapWithFeedback helper

## Recommended Actions

### Priority 1 — CRITICAL fixes (40 items)
1. **Typography variants** (13): Replace non-existent variants `titleMd`→`titleLg`, `bodySm`→`bodyMd`, `labelLg`→`labelMd` in sx={{ typography: "..." }} patterns
2. **Barrel files** (9): Create 6 missing barrels, fix 2 parent barrels, delete 1 re-export shim
3. **Theme hardcoded colors** (3): Replace rgba with theme palette values
4. **Theme borderRadius** (15): Replace raw px numerics with theme tokens
5. **i18n hardcoded strings** (4): Replace with translation keys
6. **Apollo stale stubs** (1): Delete hand-written type stub, use generated types
7. **Zustand enum validation** (2): Add enum validation in persist rehydration

### Priority 2 — WARNING fixes (30+ groups)
1. **MUI direct style props** (903): Move Stack/Box/Typography direct props into sx (large batch)
2. **"use client" directives** (~70): Add to stores, hooks, and components
3. **Context co-location** (5): Split consumer hooks into separate files
4. **Apollo stub consumers** (4): Update imports to use generated types
5. **i18n aria-labels** (9): Replace with translation keys
6. **Theme string palette access** (12): Use theme callback pattern
7. **Barrel @/ aliases + imports** (~35): Use relative ./ in barrels, remove imports from barrels
8. **Zustand conventions** (5): Fix billingTabsStore, shared SnackbarSeverity, Date storage, naming, barrel
9. **Dead deprecated exports** (4): Remove dead code

### Priority 3 — SUGGESTION fixes (16+)
1. React forwardRef modernization
2. Various code quality improvements
3. DRY helpers for repeated patterns

## Layer Compliance Notes

### Plan-Review Validation Results

After reading all affected layer AGENTS.md files (frontend/AGENTS.md, frontend/views/AGENTS.md, frontend/common/graphql/AGENTS.md, frontend/common/stores/AGENTS.md, shared/AGENTS.md), the plan was validated against layer-specific rules:

**✅ PASS — MUI v9 Typography variants**: Plan replaces non-existent variants (`titleMd`→`titleLg`, `bodySm`→`bodyMd`, `labelLg`→`labelMd`) with valid theme variants. Verified against `frontend/common/providers/theme/typography.ts`.

**✅ PASS — i18n**: Plan uses compile-time translation system from `@/shared/locale/client` for client components and `@/shared/locale/server` for server components — no hardcoded strings.

**✅ PASS — Theme styling**: Plan replaces hardcoded rgba colors and borderRadius raw px with theme palette values via `sx={(theme) => ({ ... })}` callback pattern. Follows "NO hardcoded colors" and "NO Quotes for Colors" rules.

**✅ PASS — Apollo/GraphQL**: Plan deletes stale hand-written type stubs and migrates consumers to import from `@/frontend/common/graphql/generated/gql/operations` and `@/frontend/common/graphql/generated/gql/graphql-types`. Follows "Use generated types" and "No custom inline type definitions" rules.

**✅ PASS — Zustand stores**: Plan fixes enum validation in persisted stores (serialization safety), adds missing "use client" directives, and removes non-serializable Date storage. Follows stores AGENTS.md serialization rules.

**✅ PASS — React 19 Context**: Plan splits Context + consumer hook co-location into separate files, following frontend/AGENTS.md "Context/Hooks: Keep Context, Provider, and useHook in separate files" rule.

**✅ PASS — Barrel files**: Plan creates missing `index.ts` barrels using `export * from "./module"` with relative `./` paths only, no `@/` aliases, no `../`, max one `/` per path. Follows root AGENTS.md barrel conventions.

**✅ PASS — Shared layer**: Plan fixes `shared/locale/` barrel violations while respecting that `shared/` must never import from frontend/backend/app layers.

**✅ PASS — Dashboard UI patterns**: Plan replaces inline `<Chip>` status displays with shared `<StatusBadge category="..." />`, and replaces inline `<CircularProgress>` with `<LoadingState>`. Follows frontend/views/AGENTS.md and frontend/AGENTS.md dashboard pattern rules.

**✅ PASS — "use client" directive**: Plan adds missing `"use client"` to Zustand stores, hooks, and components that use React hooks — required by Next.js App Router for client-side execution.

**⚠️ NOTE — MUI v9 Stack/Box/Typography direct props (903 warnings)**: The AGENTS.md explicitly bans these as direct props and requires `sx`. However, at 903 occurrences across the entire frontend, fixing all of them is a massive batch operation. This plan will focus on CRITICAL items first and then batch the WARNING fixes in groups of ~100 files per subagent.

No plan violations found. Plan passes all AGENTS.md rules for affected layers.

## Fix Status

- Total findings: ~1100+
- Fixed: 0 / ~1100
- Remaining: ~1100
