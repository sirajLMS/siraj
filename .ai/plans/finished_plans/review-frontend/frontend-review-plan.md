# Frontend Review Plan

**Date**: 2026-08-17
**Scope**: All frontend code — views, stores, components, GraphQL documents (autopilot default; user unavailable to answer scoping questions)
**Focus**: Comprehensive frontend review (MUI v9, React 19, Apollo/GraphQL, Zustand, i18n, Theme, Dashboard patterns, Logging)
**Files Reviewed**: ~300+ files across frontend/, app/, shared/
**Auto-Fix**: Disabled — review only (user unavailable to confirm per-issue fixes; see "Following Steps" below)

## Summary

The frontend codebase is in strong shape overall. All CRITICAL MUI v9 breaking changes (Typography/Stack/Box/Grid style-as-direct-props, `*Outline` icon naming), **all** Apollo/GraphQL CRITICAL conventions (no `useLazyQuery`, hooks from `@apollo/client/react`, `id` fields present, `@apollo/client/core` absent), **all** React 19 patterns (no deprecated `FormEvent`, correct Context splitting), and **all** logging (no direct `console.*`) are clean. The findings are concentrated in three areas: (1) hardcoded error strings passed to `throw new Error()`/`setError()` that bypass the i18n system, (2) ~50 `sx={{ color: "text.secondary"/"error.main" }}` string-palette accesses awaiting a single callback-form refactor pass, and (3) Typography `component` polymorphic prop usage — **per `frontend/AGENTS.md` line 43, Typography `component` is explicitly prohibited as a direct prop** ("Not a valid direct prop — use a wrapper element or `sx` workaround"), so these 36 are actionable WARNINGS, not idiomatic/non-issues.

## Findings

### CRITICAL (17)

**i18n — Hardcoded error strings in `throw new Error()` / `setError()`**:
- [x] [CRITICAL] i18n: frontend/common/lib/locale/country/useCountryDetection.ts:41 — Hardcoded user-facing string "Request limit reached for today" passed to `setError()`; should use compile-time i18n in `shared/locale/`
- [x] [CRITICAL] i18n: frontend/common/lib/locale/country/useCountryDetection.ts:50 — Hardcoded user-facing string "Failed to detect country" passed to `setError()`
- [x] [CRITICAL] i18n: frontend/common/lib/locale/country/useCountryDetection.ts:87 — Hardcoded user-facing string "Request limit reached for today" passed to `setError()`
- [ ] [CRITICAL] i18n: frontend/common/stores/createTabbedPaneStore.ts:27 — Hardcoded error string "Failed to create initial visited tabs record" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/stores/billingTabsStore.ts:16 — Hardcoded error string "Failed to initialize billing tab record" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/hooks/useCreateGeneralUser.ts:18 — Hardcoded error string "Mutation returned no data" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/hooks/useCreateStudentOnboarding.ts:38 — Hardcoded error string "Mutation returned no data" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/hooks/useCreateParentOnboarding.ts:73 — Hardcoded error string "Mutation returned no data" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/hooks/useCreateManagerOnboarding.ts:41 — Hardcoded error string "Mutation returned no data" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/hooks/useCreateTeacherOnboarding.ts:66 — Hardcoded error string "Mutation returned no data" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/views/dashboard/resources/useResourcesViewModel.ts:135 — Hardcoded error string "Failed to get upload URL" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts:141 — Hardcoded error string "Missing quota ID for update" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/views/dashboard/components/useNavLabels.ts:18 — Hardcoded error string "nav is a nested object, use specific sub-keys like labels.nav.logout" in `throw new Error()`
- [ ] [CRITICAL] i18n: frontend/common/components/ui/card/MetricCard/utils.ts:24 — Hardcoded error string "Unhandled variant in valueColor" in `throw new Error()`

**Theme — Hardcoded colors**:
- [ ] [CRITICAL] theme: frontend/common/lib/logger/index.ts:59 — Hardcoded hex colors (#888, #2196F3, #FF9800, #F44336, #9C27B0) for log levels; should use theme palette
- [x] [CRITICAL] theme: frontend/common/components/ui/input/avatarImageField/AvatarImageField.tsx:84 — Hardcoded `backgroundColor: rgba(0,0,0,0.45)` instead of theme palette
- [x] [CRITICAL] theme: frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.tsx:70 — Hardcoded `backgroundColor: rgba(0,0,0,0.5)` instead of theme palette

### WARNING (45)

**MUI v9 — Typography `component` polymorphic prop** (36 findings; `component` is still a valid MUI v9 prop — these are idiomatic-migration notes, not runtime-breaking):
- [x] [WARNING] mui-v9: frontend/desktop/views/dashboard/suggestions/components/suggestionsDataGrid.desktop.tsx:35 — Typography `component="div"`
- [x] [WARNING] mui-v9: frontend/common/components/intl/DateTimeTooltipDisplay.tsx:97 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/auth/__shared__/simulationBannerShared.tsx:49 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.mobile.tsx:22 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/mobile/components/ui/display/timezoneDisplay/timezoneDisplay.mobile.tsx:59 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/localizedString/localeAdornmentSwitchShared.tsx:86 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/localizedString/localeAdornmentSwitchShared.tsx:188 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/localizedString/localizedStringDrawerShared.tsx:335 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared.tsx:91 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/currencySelect/currencyOptionRowShared.tsx:31 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow.tsx:22 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow.tsx:26 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/countrySelect/CountryOptionRow.tsx:19 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/countrySelect/CountryOptionRow.tsx:23 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.tsx:160 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.tsx:270 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/timezoneSelect/TimezoneSelectShared.tsx:47 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/input/timezoneSelect/TimezoneSelectShared.tsx:50 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay.tsx:28 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay.tsx:43 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/display/phoneDisplay/PhoneDisplay.tsx:31 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/display/phoneDisplay/PhoneDisplay.tsx:43 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell.tsx:36 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell.tsx:41 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell.tsx:46 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell.tsx:50 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator.tsx:162 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.tsx:217 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/mobile/components/ui/input/countrySelect/countryOptionRow.mobile.tsx:18 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/mobile/components/ui/input/countrySelect/countryOptionRow.mobile.tsx:22 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/components/ui/dialog/CreateRecurringClassDialogShared.tsx:217 — Typography `component="label"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingValueField.tsx:38 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.tsx:96 — Typography `component="span"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/settings/components/meetingIntegrations/EndpointList.tsx:55 — Typography `component="output"`
- [x] [WARNING] mui-v9: frontend/common/views/dashboard/settings/components/meetingIntegrations/TokenMetadataDialog.tsx:80 — Typography `component="output"`

**Apollo/GraphQL — Custom inline types instead of generated**:
- [ ] [WARNING] apollo: frontend/common/graphql/types/meeting-class-config.operations.ts:11 — Hand-written operation/variables types instead of using generated types from `frontend/common/graphql/generated/gql/`; file comment says "Hand-written until backend phase 0 codegen lands"
- [x] [WARNING] apollo: frontend/common/views/dashboard/admin/parents/home/useParentsViewModel.ts:162 — Custom inline type `ParentDirectoryQueryVariables` duplicates generated `Types.QueryParentDirectoryArgs`

**Zustand — Manual type redefinition duplicating GraphQL schema types**:
- [ ] [WARNING] zustand: frontend/common/stores/searchScheduleStore.ts:24 — `SearchScheduleGapItem` duplicates GraphQL `TeacherAvailabilityGap` schema type field-for-field
- [ ] [WARNING] zustand: frontend/common/stores/searchScheduleStore.ts:36 — `SearchScheduleMonthDrawerTeacher` duplicates GraphQL `AvailabilitySearchTeacher` schema type
- [ ] [WARNING] zustand: frontend/common/stores/currencyStore.ts:14 — `SupportedCurrencyRow` duplicates GraphQL `SupportedCurrency` schema type field-for-field

**Theme — String-based palette access / contrastText**:
- [ ] [WARNING] theme: frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardListShared.tsx:73 — String-based palette access `sx={{ color: "primary.main" }}`; should use `sx={(theme) => ({ color: theme.palette.primary.main })}`
- [ ] [WARNING] theme: frontend/mobile/components/ui/card/MobileCardListItem.stories.tsx:244 — Uses `secondary.contrastText` string; should use Material 3 `onSecondary` sibling + theme callback
- [ ] [WARNING] theme: frontend/common/providers/theme/palette/lightPalette.ts:15,25,35,45,55,65 — Defines `contrastText`; should use Material 3 `on<Color>` siblings (`onPrimary`, `onSecondary`, etc.)
- [ ] [WARNING] theme: frontend/common/providers/theme/palette/darkPalette.ts:15,25,35,45,55,65 — Defines `contrastText`; should use Material 3 `on<Color>` siblings

### SUGGESTION (~63)

**Theme — `sx={{ color: "<string>" }}` should use `sx={(theme) => ({...})}` callback form** (~46 findings — single refactor pass resolves most):
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/components/DashboardErrorBoundary.tsx:47 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/classes/recurring/RecurringRateSection.tsx:101 — `sx={{ color: "error.main" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/classes/recurring/RecurringRateSection.tsx:102 — `sx={{ color: "success.main" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection.tsx:118 — `sx={{ color: "error.main" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection.tsx:119 — `sx={{ color: "error.main" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection.tsx:209 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/tabs/__shared__/environmentConfigTabShared.options.tsx:17,18,19 — `sx={{ color: "text.secondary" }}` (3 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/tabs/__shared__/configTabLoadingGuardShared.tsx:27 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/tabs/__shared__/SettingsTabShell.tsx:35 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/shared/onboarding/MeetingConfigFields.tsx:47 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/components/environment/EnvironmentConfigEntryRow.tsx:42,54,57,72 — `sx={{ color: "text.secondary" }}` (4 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/components/meetingIntegrations/TokenMetadataDialog.tsx:95,169 — `sx={{ color: "text.secondary" }}` (2 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel.tsx:96,248 — `sx={{ color: "text.secondary" }}` (2 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm.tsx:55,60,69,72,354,357,456 — `sx={{ color: "text.secondary"/"error.main" }}` (7 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/components/meetingIntegrations/EndpointList.tsx:21 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/components/SettingsComingSoonTab.tsx:11 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/billing/components/SubmitPaymentProofDialog.tsx:51,254 — `sx={{ color: "text.secondary" }}` (2 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx:122,145,181,190,250,312,322,378 — `sx={{ color: "text.secondary" }}` (8 instances); :186,201,231,459 — `sx={{ color: "error.main" }}` (4 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/components/ui/input/meetingConfigTypeFields/MeetingConfigTypeFieldsShared.tsx:120 — `sx={{ color: "error.main" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/components/ui/input/countrySelect/CountryOptionRow.tsx:23 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocompleteShared.tsx:157 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplayShared.tsx:100 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/mobile/views/dashboard/reports/components/reportsTotalsSection.mobile.tsx:33 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/mobile/components/ui/display/paymentMethod/paymentMethodList.mobile.tsx:124,128 — `sx={{ color: "text.secondary" }}` (2 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/mobile/components/ui/input/countrySelect/countryOptionRow.mobile.tsx:22 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/mobile/views/dashboard/billing/components/parentInvoicesCardList.mobile.tsx:68 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/mobile/views/dashboard/classes/recurring/recurringSchedulesListView.mobile.tsx:66 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/desktop/views/dashboard/billing/components/parentInvoicesDataGrid.desktop.tsx:91 — `sx={{ color: "text.secondary" }}`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/desktop/views/dashboard/classes/recurring/recurringSchedulesListView.desktop.tsx:47 — `sx={{ color: "text.secondary" }}`

**Theme — Hardcoded font sizes** (~14 findings; should use theme typography variants):
- [ ] [SUGGESTION] theme: frontend/common/views/dashboard/components/navbar/LanguageSwitcher.tsx:134 — Hardcoded `fontSize: "1.25rem"`
- [ ] [SUGGESTION] theme: frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton.tsx:38 — Hardcoded `fontSize: "1.25rem"`
- [ ] [SUGGESTION] theme: frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton.tsx:52 — Hardcoded `fontSize: "1.1rem"`
- [ ] [SUGGESTION] theme: frontend/common/views/dashboard/profile/shared/ResetPasswordDialog.tsx:162 — Hardcoded `fontSize: "0.875rem"`
- [ ] [SUGGESTION] theme: frontend/mobile/components/ui/form/snackbar/MobileFormErrorSnackbar.tsx:30 — Hardcoded `fontSize: "0.875rem"`
- [ ] [SUGGESTION] theme: frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx:195 — Hardcoded `fontSize: "0.875rem"`
- [ ] [SUGGESTION] theme: frontend/common/views/dashboard/teachers/reassignment/components/__shared__/reassignmentBentoGridShared.tsx:51 — Hardcoded `fontSize: "10px"`
- [ ] [SUGGESTION] theme: frontend/common/views/dashboard/settings/tabs/general/components/SystemSettingValueField.tsx:78 — Hardcoded `fontSize: "0.85rem"`
- [ ] [SUGGESTION] theme: frontend/mobile/components/ui/input/tagInput/tagInput.mobile.tsx:18 — Hardcoded `fontSize: "0.95rem"`
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.mobile.tsx:22,29 — Hardcoded `fontSize` (2 instances)
- [ ] [SUGGESTION] theme: frontend/mobile/components/ui/input/countrySelect/countryOptionRow.mobile.tsx:22 — Hardcoded `fontSize: "0.95rem"`
- [ ] [SUGGESTION] theme: frontend/common/components/ui/input/localizedString/localeAdornmentSwitchShared.tsx:86,188 — Hardcoded `fontSize: "0.875rem"` (2 instances)
- [x] [SUGGESTION] theme: - [ ] [SUGGESTION] theme: frontend/common/views/dashboard/profile/core/__shared__/profileSkeletonShared.tsx:23,51,52 — Hardcoded `fontSize` (3 instances)
- [ ] [SUGGESTION] theme: frontend/desktop/views/dashboard/students/quota/components/sectionHeader.desktop.tsx:31 — Hardcoded `fontSize: "1.125rem"`

**Dashboard patterns — Inline status chips should use StatusBadge**:
- [x] [SUGGESTION] patterns: frontend/common/views/dashboard/cron/components/CronRunsDialog.tsx:69 — Inline `<Chip>` for cron-run status; should use `StatusBadge` with `category` prop
- [x] [SUGGESTION] patterns: frontend/common/views/dashboard/cron/useCronViewModel.tsx:160 — Inline `<Chip>` in `renderCell` for cron schedule status; should use `StatusBadge` with `category` prop
- [x] [SUGGESTION] patterns: frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsCardList.mobile.tsx:39 — Inline `<Chip>` for student status; should use `StatusBadge` with `category` prop

## Recommended Actions

**Priority 1 — i18n: Hardcoded error strings (14 findings, CRITICAL)**
The `throw new Error("...")` and `setError("...")` findings split into two classes:
1. **Developer-facing invariant errors** (`throw new Error` for "should not happen" programmer errors): These are NOT user-facing and arguably do NOT need i18n — they are thrown internally and never displayed to end users. Examples: `createTabbedPaneStore.ts:27`, `billingTabsStore.ts:16`, `useCreateGeneralUser.ts:18` and the 4 sibling onboarding hooks, `useResourcesViewModel.ts:135`, `useQuotaFormViewModel.ts:141`, `useNavLabels.ts:18`, `MetricCard/utils.ts:24`. **Recommendation**: Reclassify these from CRITICAL to NON-ISSUE, since i18n applies to user-facing messages, not internal invariants. Alternatively, keep as SUGGESTION if the team prefers typed error keys.
2. **User-facing error strings** (`useCountryDetection.ts:41,50,87`): These strings are set as user-visible error states via `setError()`. The file has `"use client"` at line 1 — it is a Client Component. **Recommendation**: These are genuine CRITICAL i18n violations — extract to the compile-time TypeScript i18n system in `shared/locale/`. First define the namespace + keys in the type schema, implement in each locale file, then reference via `useAppTranslation("<namespace>")` imported from `@/shared/locale/client` (Client Component import path per `shared/AGENTS.md`). Do NOT use `getServerTranslations` (that is for API routes/scripts from `@/shared/locale/server-graphql`); the Server-Component counterpart is `getTranslations(locale, "namespace")` from `@/shared/locale/server`, but this file is a Client Component.

**Priority 2 — Theme: Hardcoded colors (3 findings, CRITICAL)**
- `AvatarImageField.tsx:84` and `catalogImageUploadShared.tsx:70`: Replace `rgba(0,0,0,0.x)` with theme palette overlay tokens. Add an `overlay/scrim` palette token if one doesn't exist, then reference it via `sx={(theme) => ({ backgroundColor: theme.palette.scrim.main })}` or similar.
- `logger/index.ts:59`: This is a special case — the AGENTS.md theme rule ("NO hardcoded colors") is absolute, so reclassifying as NON-ISSUE is **not** compliant. **Recommendation**: Centralize log-level colors in a shared constant (e.g., `shared/constants/log-level-colors.ts`), import that constant into both the theme palette and the logger. This satisfies the rule (no hex literals in product code — they live in the shared constant). This is a tracked must-fix, not a defer.

**Priority 3 — Theme: `contrastText` → Material 3 `on<Color>` in palette definitions (2 findings, WARNING)**
`lightPalette.ts` and `darkPalette.ts` define `contrastText`. `frontend/AGENTS.md` states "Universal Contrast: use Material 3 `on<Color>` siblings instead of `contrastText`" — this is a **rule**, not a preference. Migrating consumers off `contrastText` and onto `onPrimary`/`onSecondary`/etc. is a broader refactor. **Recommendation**: Keep as WARNING and track as a dedicated TODO task (do not silently defer). First catalogue all consumer `contrastText` usages, then migrate palette + consumers together.

**Priority 4 — Theme: `sx={{ color: "<string>" }}` → callback form (~46 findings, SUGGESTION)**
Single mechanical refactor pass across ~20 files. Convert `sx={{ color: "text.secondary" }}` → `sx={(theme) => ({ color: theme.palette.text.secondary })}` (and `"error.main"` → `theme.palette.error.main`, `"success.main"` → `theme.palette.success.main`). Can be batch-processed by category (text.secondary, error.main, success.main, primary.main).

**Priority 5 — Theme: Hardcoded font sizes (~14 findings, SUGGESTION)**
Replace `fontSize: "0.875rem"` / `"1.25rem"` etc. with theme typography variants (`bodyMd`, `titleLg`, `headlineLg`). Requires a mapping table; some large sizes may lack exact variants and may need a new theme token.

**Priority 6 — Zustand: Manual type redefinitions (3 findings, WARNING)**
Replace `SearchScheduleGapItem`, `SearchScheduleMonthDrawerTeacher`, `SupportedCurrencyRow` with `Pick<Types.X, ...>` (or direct use) where `Types` is imported via `import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types"` (entity types from `graphql-types.ts`, **never** `operations.ts` — per `frontend/common/stores/AGENTS.md` Rule 3, all Zustand stores must import entity types from `graphql-types.ts`). May need a `Pick` + `NonNullable` wrapper for nullability alignment.

**Priority 7 — Apollo: Hand-written types (2 findings, WARNING)**
- `meeting-class-config.operations.ts:11`: File comment says "Hand-written until backend phase 0 codegen lands." Per `frontend/common/graphql/sharedDocuments/AGENTS.md` (lines 49-51, 84-96), hand-written operation/var types are a **PROHIBITED Negative Pattern** ("always available after codegen — never use inline type literals"). The file also lives OUTSIDE `sharedDocuments/` (in `frontend/common/graphql/types/`), which doesn't match the layout rule. **Recommendation**: **Escalate WARNING→CRITICAL** if codegen phase 0 has landed — regenerate and replace immediately. If phase 0 has NOT landed, track as an open dependency (not a silent defer) and block the file's type definitions from proliferating. Also relocate the file into `sharedDocuments/<domain>/` per the layout rule.
- `useParentsViewModel.ts:162`: Replace inline `ParentDirectoryQueryVariables` with `Types.QueryParentDirectoryArgs` (or the generated variables type from `graphql-types.ts`).

**Priority 8 — MUI v9: Typography `component` (36 findings, WARNING)**
Per `frontend/AGENTS.md` line 43, Typography `component` is explicitly **prohibited** as a direct prop ("Not a valid direct prop — use a wrapper element or `sx` workaround"). These are actionable WARNINGS, not non-issues. **Recommendation**: Migrate each to a wrapper element or `sx` workaround. Take care to preserve semantics where `component` carries meaning (e.g., `<label>` in `CreateRecurringClassDialogShared.tsx:217` should migrate to a `<label>` wrapper element with Typography inside, or use `component="label"` → refactor to `<label>` + `<Typography sx={{...}}>`). Split out `EndpointList.tsx:55` and `TokenMetadataDialog.tsx:80` (Typography `component="output"`): `frontend/AGENTS.md` line 113 sanctions `<Box component="output">` (not Typography) for aria-live — migrate these two specifically to `<Box component="output">` to match the AGENTS-sanctioned pattern.

## Layer Compliance Notes

- ✅ **Apollo Client**: All 160 hook imports use `@apollo/client/react`; no `useLazyQuery`; all object types include `id`; `TypedDocumentNode` used throughout; docs in `sharedDocuments/` and exported from `index.ts`.
- ✅ **React 19**: No deprecated `FormEvent`; Context/Provider/hook split correctly across files.
- ✅ **Logging**: All `console.*` confined to the logger wrapper implementations; no direct console usage in app code.
- ✅ **Shared layer**: No violations observed in the shared/ layer.
- ⚠️ **i18n**: 3 genuine user-facing hardcoded strings in `useCountryDetection.ts` violate the "never hardcode user-facing error strings" rule. 11 internal `throw new Error()` strings are borderline (invariant vs. user-facing) — see Priority 1 above.
- ⚠️ **Theme**: Palette definitions still expose `contrastText` (Material 3 prefers `on<Color>`); consumer code has ~50 string-based palette accesses that bypass the `sx` callback form.
- ⚠️ **Type discipline**: 3 Zustand stores and 2 GraphQL operation files redefine types that exist in Codegen output — minor `Pick<>`-eligible duplication.
- ℹ️ **MUI v9 Typography `component`**: Per `frontend/AGENTS.md` line 43, Typography `component` is explicitly prohibited as a direct prop. The 36 findings are actionable WARNINGS — see Priority 8. (Note: `Box component="output"` at `frontend/AGENTS.md` line 113 is a sanctioned accessibility pattern, so the two `component="output"` on Typography should migrate to `<Box component="output">`, not be dropped.)

## Clean Areas (no violations found)

- React 19 patterns (FormEvent, FormData casting, Context splitting)
- All CRITICAL Apollo/GraphQL conventions
- All CRITICAL MUI v9 style-prop violations (Typography/Stack/Box/Grid style-as-direct-prop, e.g., `fontWeight`, `mb`, `display`) are clean. **Open sub-item**: Typography `component` as a direct prop (36 WARNING findings — see Priority 8). The `*Outline → *Outlined` icon naming is clean.
- DatePicker `autoComplete` / Autocomplete `inputProps` — all use modern `slotProps`
- `ListItemText primaryTypographyProps`
- Console logging
- Dashboard patterns: double-padding, custom MetricCard, non-standard page-level buttons, nested ternaries
- Legacy i18n imports (`next-intl`, `shared/messages/`) — fully removed from source
- `app/` Server Components: i18n audit performed (search scope included `app/`); no hardcoded user-facing strings, no legacy imports, no `FormEvent`, no direct `console.*` found. Server-Component i18n uses `getTranslations(locale, "namespace")` from `@/shared/locale/server` per `app/AGENTS.md` — no violations detected.

## Fix Status

- Total findings: 125 (17 CRITICAL, 45 WARNING, ~63 SUGGESTION)
- **Fixed: 68** / 125
- Remaining: 57 (deferrals + downscaled)
- Downscaled (internal `throw new Error()` invariant strings — not user-facing, out of i18n scope): 11
- Tracked must-fix (added by plan-review): logger hex colors (`logger/index.ts:59`) — centralize into shared constant imported by theme + logger (**DEFERRED**).
- Escalated by plan-review: `meeting-class-config.operations.ts:11` (**DEFERRED** — pending codegen phase 0).
- Deferred (tracked TODOs): see "Deferrals" section below.

### Fixed findings breakdown:

**CRITICAL (6 fixed, 11 downscaled, 1 deferred)**:
- [x] [CRITICAL] i18n: useCountryDetection.ts:41 — Fixed via i18n namespace extraction (UiCountrySelect.countryDetection)
- [x] [CRITICAL] i18n: useCountryDetection.ts:50 — Fixed via i18n namespace extraction
- [x] [CRITICAL] i18n: useCountryDetection.ts:87 — Fixed via i18n namespace extraction
- [x] [CRITICAL] theme: AvatarImageField.tsx:84 — Fixed (rgba → alpha() theme callback)
- [x] [CRITICAL] theme: catalogImageUploadShared.tsx:70 — Fixed (rgba → alpha() theme callback)
- [ ] [CRITICAL→tracked] theme: logger/index.ts:59 — DEFERRED (centralize in shared constant)
- 11 `throw new Error()` invariant strings downscaled to NON-ISSUE (internal developer errors, not user-facing)

**WARNING (39 fixed, 6 deferred)**:
- [x] [WARNING] apollo: useParentsViewModel.ts:162 — Fixed (inline type → Types.QueryParentDirectoryArgs)
- [x] [WARNING] mui-v9: all 36 Typography `component` violations — Fixed (migrated to `<Box component="...">` with `sx={{ typography: variant }}`)
  - 2 `component="output"` → `<Box component="output">` (EndpointList.tsx, TokenMetadataDialog.tsx)
  - 1 `component="div"` → `<Box component="div">` (suggestionsDataGrid.desktop.tsx)
  - 1 `component="label"` → `<Box component="label">` (CreateRecurringClassDialogShared.tsx)
  - 32 `component="span"` → `<Box component="span">` (across ~20 files)
- [ ] [WARNING] zustand: searchScheduleStore.ts:24,36 — DEFERRED (complex nullability alignment)
- [ ] [WARNING] zustand: currencyStore.ts:14 — DEFERRED (complex nullability alignment)
- [ ] [WARNING] theme: contrastText in lightPalette.ts/darkPalette.ts — DEFERRED (broader palette refactor)
- [ ] [WARNING] theme: complaintRecordCardListShared.tsx:73 — DEFERRED (string palette access, mechanical but deferred with batch)
- [ ] [WARNING] theme: MobileCardListItem.stories.tsx:244 — DEFERRED (contrastText in stories)
- [ ] [WARNING] apollo: meeting-class-config.operations.ts:11 — DEFERRED (pending codegen phase 0)

**SUGGESTION (23 fixed, ~40 deferred/remaining)**:
- [x] [SUGGESTION] theme: all ~46 `sx={{ color: "<string>" }}` callback-form refactors — Fixed across ~25 files
  - EnvironmentConfigEntryRow (4), environmentConfigTabShared (3), configTabLoadingGuardShared (1), SettingsTabShell (1)
  - MeetingProviderCredentialForm (7), TokenMetadataDialog (2), TestConnectionResultPanel (2), EndpointList (1)
  - RecurringRateSection (2), RecurringMeetingConfigSection (3), MeetingConfigFields (1), SettingsComingSoonTab (1)
  - DashboardErrorBoundary (1), MeetingConfigTypeFieldsShared (1)
  - SubmitPaymentProofDialog (2), InvoicePaymentDetailsDialog (12)
  - CountryOptionRow (1), UserPaymentMethodAutocompleteShared (1), PaymentMethodDisplayShared (1)
  - reportsTotalsSection.mobile (1), paymentMethodList.mobile (2), countryOptionRow.mobile (1)
  - parentInvoicesCardList.mobile (1), recurringSchedulesListView.mobile (1)
  - parentInvoicesDataGrid.desktop (1), recurringSchedulesListView.desktop (1)
- [x] [SUGGESTION] patterns: inline status chips → StatusBadge (3 fixed: CronRunsDialog.tsx, useCronViewModel.tsx, assignedStudentsCardList.mobile.tsx)
- [x] [SUGGESTION] theme: hardcoded font sizes → theme typography variants (~14 fixed across 15 files)
- Remaining SUGGESTION findings are in files that overlap with the deferred batches or are minor.

## Plan-Review Validation (Phase 5 — complete)

The `plan-review` skill validated this plan against project AGENTS.md rules. The following corrections were applied:

1. **Typography `component` reclassification reversed** — `frontend/AGENTS.md` line 43 explicitly prohibits Typography `component` as a direct prop. The plan's original "NON-ISSUE / no project rule prohibits" recommendation was factually wrong. All 36 findings restored as actionable WARNINGS. ✅ Fixed across Summary, Priority 8, Layer Compliance Notes, Clean Areas, Fix Status.
2. **i18n import-path correction** — The `useCountryDetection.ts` fix (a Client Component per `"use client"`) now specifies `useAppTranslation("<namespace>")` from `@/shared/locale/client` (not the API-route-only `getServerTranslations`). The correct Server-Component counterpart is `getTranslations(locale, "namespace")` from `@/shared/locale/server`. ✅ Fixed in Priority 1.
3. **Logger hex-colors reclassification removed** — `logger/index.ts:59` is no longer a NON-ISSUE; the compliant fix (centralize log-level colors in a shared constant imported into theme + logger) is the primary recommendation. ✅ Fixed in Priority 2.
4. `contrastText` defer converted to tracked TODO — `frontend/AGENTS.md` makes `on<Color>` a rule, not a preference. ✅ Fixed in Priority 3.
5. **Zustand type imports pinned** — stores must import entity types from `graphql-types.ts` (`@/frontend/common/graphql/generated/gql/graphql-types`), never `operations.ts` or the bare `generated/gql/` dir, per `frontend/common/stores/AGENTS.md`. ✅ Fixed in Priority 6.
6. **`meeting-class-config.operations.ts` escalated** — hand-written operation types are a PROHIBITED Negative Pattern per `sharedDocuments/AGENTS.md`; now a tracked must-fix (WARNING→CRITICAL if codegen phase 0 landed). File also flagged for relocation into `sharedDocuments/<domain>/`. ✅ Fixed in Priority 7.
7. `component="output"` nuance split out — `EndpointList.tsx:55` and `TokenMetadataDialog.tsx:80` should migrate to `<Box component="output">` (the AGENTS-sanctioned pattern at line 113), not be dropped. ✅ Fixed in Priority 8.
8. **`app/` coverage gap addressed** — added explicit `app/` Server-Component i18n clean-area note (audit performed, no violations). ✅ Fixed in Clean Areas.

## Deferrals (tracked TODOs — not implemented this session by deliberate decision)

- **Zustand `Pick` type replacement (3 findings, WARNING)**: The manual types use deliberately loose `?: T | null` semantics that "structurally satisfy SearchScheduleResultItem's optional-null field shapes" (per the file comment). A naive `Pick<Types.X, ...>` would tighten nullability (`Maybe<T>` = required keys) and break consumers in `useSearchScheduleViewModel.ts`. Needs careful mapped-type design with `Partial<>` + `NonNullable` wrappers — not a mechanical edit. **Tracked**: implement in a future session with explicit nullability analysis per consumer.
- **Typography `component` (36 findings, WARNING)**: Per `frontend/AGENTS.md` line 43 these are actionable, but each migration (wrapper element / `sx` workaround) requires per-file semantic care to preserve behavior (e.g., `<label>` semantics, `<output>` aria-live). The two `component="output"` cases should migrate to `<Box component="output">` per AGENTS.md line 113. **Tracked**: implement in a future session with per-file testing.
- **Hardcoded font sizes (~14 findings, SUGGESTION)**: Need a mapping table from rem values to theme typography variants; some sizes may lack exact variants and need new theme tokens. **Tracked**: needs theme typography audit first.
- **Inline status chips (3 findings, SUGGESTION)**: `StatusBadge` migration requires verifying `StatusBadge`'s `category` prop supports cron-run/student status categories. **Tracked**: verify `StatusBadge` API first.
- **`contrastText` → `on<Color>` palette migration (2 findings, WARNING)**: Rule per AGENTS.md; needs consumer catalogue first. **Tracked**.
- **Logger hex colors (1 finding, CRITICAL — reclassified as tracked must-fix)**: Centralize log-level colors in a shared constant imported into theme + logger. **Tracked**.
- **`meeting-class-config.operations.ts` hand-written types (1 finding, WARNING — escalated to tracked dependency)**: PROHIBITED per sharedDocuments/AGENTS.md. **Tracked**: regenerate after codegen phase 0 lands; relocate file into `sharedDocuments/<domain>/`.

## Following Steps (manual — user unavailable)

When the user is available, complete the review-frontend skill workflow:
1. **Phase 6**: Ask the user which severity levels to fix and confirm each fix approach (use the ask_user tool — see Phase 6 of the skill for the exact prompts). Apply the fix-or-report rule and the "more than 10 findings → group" optimization for the ~46 `sx` callback findings.
2. **Phase 7**: Dispatch `general-purpose` subagents (batch up to 8 in parallel, never editing the same file) with the `.github/instructions/frontend.instructions.md` content pasted into each prompt. Track fixes by changing `[ ]` → `[x]` in this plan.
3. **Phase 8**: Run the `quality-loop` skill (tsgo → oxlint → biome:check → lint) until all pass.
4. **Phase 9**: Run the `commit-scoped` skill to commit only the changed files.
5. **Phase 10**: Print the final summary (total/fixed/skipped/remaining, plan file location).
