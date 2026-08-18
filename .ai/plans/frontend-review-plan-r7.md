# Frontend Review Plan — Round 7

**Date**: 2026-08-18
**Scope**: All frontend code — views, stores, components, GraphQL documents, app/
**Focus**: Comprehensive frontend review (MUI v9, React 19, Apollo, Zustand, i18n, theme, patterns, logging, barrels)
**Files Reviewed**: ~3380 files

## Summary

Round 7 review performed by 8 parallel explore subagents. Prior rounds (1-6) fixed most style prop violations, Apollo/GraphQL issues, and many hardcoded transitions. This round focuses on remaining violations: string-based palette accesses in the exchange-rates feature, `new Date()` at module-load time in Zustand stores, Typography `component=` prop convention, hardcoded i18n strings in manifest/empty-states/breadcrumbs/alt text, and barrel convention cleanup.

## Findings

### CRITICAL (33)

- [ ] [CRITICAL] theme: app/manifest.ts:10 — background_color: "#1A1A1A" hardcoded hex (manifest metadata, source from palette)
- [ ] [CRITICAL] theme: app/manifest.ts:11 — theme_color: "#2DD4BF" hardcoded hex (manifest metadata, source from palette)
- [ ] [CRITICAL] theme: parentProfileShared.tsx:173 — color="text.secondary" string-based palette access
- [ ] [CRITICAL] theme: exchangeRateHistorySection.desktop.tsx:21,24 — color="textSecondary" string palette access (2x)
- [ ] [CRITICAL] theme: exchangeRates.mobile.tsx:35,38 — color="textSecondary" string palette access (2x)
- [ ] [CRITICAL] theme: exchangeRateHistorySection.mobile.tsx:19,100,103 — color="textSecondary" string palette access (3x)
- [ ] [CRITICAL] theme: exchangeRatesSyncShared.tsx:57,77,83,89,95,101 — color="textSecondary" string palette access (6x)
- [ ] [CRITICAL] theme: ProviderSettingsSection.tsx:108,112 — color="textSecondary" string palette access (2x)
- [ ] [CRITICAL] theme: SubmitPaymentProofDialog.tsx:240 — bgcolor: "surfaceContainerLow" string palette access
- [ ] [CRITICAL] i18n: app/manifest.ts:7 — hardcoded English description in PWA manifest metadata
- [ ] [CRITICAL] i18n: MeetingProviderLogo.tsx:39 — hardcoded alt text "Meeting provider logo" (screen reader visible)
- [ ] [CRITICAL] i18n: quotaInsights.helpers.ts:239 — hardcoded breadcrumb label "Quotas" rendered to users
- [ ] [CRITICAL] i18n: appDataGridShared.tsx:22 — hardcoded default empty state message "No entries found"
- [ ] [CRITICAL] i18n: MobileAppDataGrid.tsx:37 — hardcoded default empty state message "No entries found"
- [ ] [CRITICAL] i18n: MobileCardList.tsx:84 — hardcoded default empty state message "No entries found"
- [ ] [CRITICAL] zustand: studentPortalHistoryStore.ts:26 — new Date() at module load (hydration mismatch risk)
- [ ] [CRITICAL] zustand: supervisorMonthlyReportsStore.ts:22-26 — defaultYearMonth() calls new Date() at module load
- [ ] [CRITICAL] zustand: studentHistoryStore.ts:26 — currentMonth: new Date() at module load
- [ ] [CRITICAL] patterns: CronRunsDialog.tsx:144 — inline Chip as loading placeholder instead of shared LoadingState
- [ ] [CRITICAL] patterns: CronRunsDialog.tsx:151 — inline Chip as empty state instead of shared empty-state pattern
- [ ] [CRITICAL] patterns: meetingProviders.mobile.tsx:69 — inline status Chip (active/inactive) instead of StatusBadge
- [ ] [CRITICAL] patterns: NextClassJoinCard.tsx:43 — inline status Chip (frozen) instead of StatusBadge error category
- [ ] [CRITICAL] patterns: NextClassJoinCard.tsx:55 — inline status Chip (countdown) instead of StatusBadge category
- [ ] [CRITICAL] patterns: meetingProviders.mobile.tsx:104 — inline capability Chip instead of StatusBadge info category

### WARNING (589)

- [ ] [WARNING] apollo: currency-catalog.documents.ts:5 — SupportedCurrencyFields fragment missing `id` field (cache normalization)
- [ ] [WARNING] zustand: weeklyScheduleStore.ts:13 — new Date().toISOString() at module load
- [ ] [WARNING] zustand: futureScheduleDateStore.ts:11 — new Date().toISOString() at module load
- [ ] [WARNING] zustand: dashboardStore.ts:35 — getTodayScheduleFilterDate() at store creation
- [ ] [WARNING] zustand: teacherDashboardStore.ts:135 — getTodayScheduleFilterDate() at store creation
- [ ] [WARNING] zustand: searchScheduleStore.ts:295 — createDefaultDraftFilters() at store creation
- [ ] [WARNING] zustand: searchScheduleStore.ts:378-388 — persist() partialize includes transient UI state (formFilterDrawerOpen, monthDrawerOpen)
- [ ] [WARNING] zustand: layoutStore.ts:26-66 — persist() stores mobileDrawerOpen transient state
- [ ] [WARNING] i18n: reportFiltersSchema.ts:17 — hardcoded Zod validation message "Invalid date range"
- [ ] [WARNING] i18n: staffProfileFormTypes.ts:14 — hardcoded Zod message "Invalid timezone"
- [ ] [WARNING] i18n: parentProfileFormTypes.ts:22 — hardcoded Zod message "Invalid timezone"
- [ ] [WARNING] i18n: teacherProfileFormTypes.ts:33 — hardcoded Zod message "Invalid timezone"
- [ ] [WARNING] i18n: availabilitySearchSchema.ts:13 — hardcoded Zod message "Invalid gender value"
- [ ] [WARNING] i18n: apollo/utils.ts:75 — hardcoded "Server not available" in synthetic GraphQL error
- [ ] [WARNING] logging: mobile/components/ui/index.ts:7 — deep path export * from "./container/page" (2 slashes)
- [ ] [WARNING] logging: common/components/ui/index.ts:10 — deep path export * from "./story/StoryBookPageContainer" (2 slashes)
- [ ] [WARNING] mui: ~19 Typography component="span"/"label"/"output"/"div" direct prop violations across app/
- [ ] [WARNING] mui: ~9 Button component={Link} direct prop violations for routing across app/
- [ ] [WARNING] theme: ~250 fontWeight: 700/600/500/400 literals across frontend/ (should use typography variants)
- [ ] [WARNING] theme: ~290 borderRadius: <number> literals across frontend/ (should use theme.shape.borderRadius)
- [ ] [WARNING] theme: ~18 fontSize px/rem values that should use theme typography variants
- [ ] [WARNING] patterns: cronView.desktop.tsx:77 — DesktopAppDataGrid without SectionPanel wrapper
- [ ] [WARNING] patterns: CronRunsDialog.tsx:156 — DataGrid without SectionPanel wrapper inside Dialog
- [ ] [WARNING] patterns: ManagerRowActions.tsx:103 — inline confirm dialog duplicating BaseDeleteDialog
- [ ] [WARNING] patterns: DeleteConfirmationDialog.tsx:20 — generic delete dialog reimplemented instead of BaseDeleteDialog
- [ ] [WARNING] patterns: teacherWeeklyScheduleViewShared.tsx:61 — inline clear-schedule confirm dialog

### SUGGESTION (67)

- [ ] [SUGGESTION] react: ~26 key={index} in static arrays (mostly Storybook fixtures, mostly safe)
- [ ] [SUGGESTION] logging: ~15 barrel named re-export consistency items
- [ ] [SUGGESTION] zustand: 4 readonly fields + manual type duplication suggestions
- [ ] [SUGGESTION] mui: 8 inline Chip with semantic colors (borderline, contextual badges)
- [ ] [SUGGESTION] patterns: 4 inline loading/filter chips and metric chip rows
- [ ] [SUGGESTION] theme: 6 inline style={{ color: "inherit" }} / px padding preferring sx prop
- [ ] [SUGGESTION] i18n: 4 dead code hardcoded maps + mockLogin latent i18n gaps

## Recommended Actions

### Phase 1: CRITICAL Fixes (33 items)

1. **String palette access (17 items)** — Convert `color="textSecondary"` / `color="text.secondary"` / `bgcolor="surfaceContainerLow"` to `sx={(theme) => ({ ... })}` across exchange-rates feature + SubmitPaymentProofDialog
2. **Manifest hardcoded colors (2 items)** — Source from palette constants in theme definition files
3. **Manifest hardcoded description (1 item)** — Source from common translations or shared metadata config
4. **Empty state messages (3 items)** — Add `noEntriesFound` translation key to CommonLabels; update appDataGridShared, MobileAppDataGrid, MobileCardList to accept translated string or default to translation callback
5. **Breadcrumb label (1 item)** — Use existing quota translation key instead of hardcoded "Quotas"
6. **MeetingProviderLogo alt text (1 item)** — Add `providerLogo` alt text key to labels, pass through to component
7. **Zustand new Date() at module load (3 items)** — Refactor to lazy initialization pattern (resetToToday action or getInitialState)
8. **Inline Chip → StatusBadge (5 items)** — Migrate inline Chips in CronRunsDialog, meetingProviders.mobile, NextClassJoinCard

### Phase 2: WARNING Fixes (589 items)

1. **Apollo missing id field (1 item)** — Add `id` to SupportedCurrencyFields fragment
2. **Zustand new Date() (5 stores)** — Apply same lazy init pattern to the WARNING-level stores
3. **Zustand persist() transient state (2 stores)** — Add partialize exclusions for transient UI flags
4. **i18n Zod validation messages (5 items)** — Add translation keys and pass translated messages to Zod schemas
5. **Apollo utils error message (1 item)** — Replace hardcoded "Server not available" with translated message
6. **Barrel deep paths (2 items)** — Fix deep-path exports in barrel files
7. **Typography component= (19 items)** — Wrap elements or use Box component= workaround
8. **Button component={Link} (9 items)** — Replace routing-wrapped Buttons with proper routing components
9. **String palette access (17 items from theme)** — Already counted in CRITICAL (Exchange-rates) + SubmitPaymentProofDialog
10. **fontWeight literals (~250 items)** — Systemic; may require dedicated convention pass
11. **borderRadius literals (~290 items)** — Systemic; many are valid MUI spacing multipliers
12. **fontSize px/rem (18 items)** — Move to theme typography variants where applicable
13. **Confirm dialogs (3 items)** — Consolidate to BaseDeleteDialog scaffold

### Phase 3: SUGGESTION Fixes (67 items — low priority)

1. **key={index} in static arrays (26 items)** — Mostly Storybook fixtures, safe as-is
2. **Barrel named re_exports (15 items)** — Prefer export * from
3. **readonly state fields (4 items)** — Add readonly to Zustand state fields
4. **Inline Chip borderline cases (8 items)** — Contextual badges, not strictly required
5. **Inline loading/filter chips (4 items)** — Consider shared loading/chip components
6. **Inline style (6 items)** — Move inline styles to sx
7. **Dead code maps (4 items)** — Remove dead code or localize

## Layer Compliance Notes

- **app/ (manifest.ts)**: Hardcoded hex colors and English description in manifest metadata — not covered by specific AGENTS.md but follows theme/i18n conventions
- **frontend/common/stores/**: `new Date()` at module load causes hydration mismatch risk; persist() not excluding transient UI state — violates best practices documented in frontend/stores/AGENTS.md
- **frontend/common/graphql/sharedDocuments/**: Missing `id` field on fragment — violates Apollo cache normalization convention in graphql/AGENTS.md
- **All layer AGENTS.md files**: i18n hardcoded strings violate shared/locale compile-time translation rule
- **MUI v9 conventions**: Typography `component=` prop per frontend/AGENTS.md L43 "use wrapper or sx"; Button `component={Link}` should use preset actions per L58

## Fix Status

- Total findings: 689
- Fixed: 0 / 689
- Remaining: 689
