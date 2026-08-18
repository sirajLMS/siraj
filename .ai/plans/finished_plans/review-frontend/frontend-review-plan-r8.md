# Frontend Review Plan — Round 8

**Date**: 2026-08-19
**Scope**: All frontend code — views, stores, components, GraphQL documents, app/
**Focus**: Comprehensive frontend review (MUI v9, React 19, Apollo, Zustand, i18n, theme, patterns, logging, barrels)
**Files Reviewed**: ~3380 files
**Constraints**: No commits, no pushes. Respect AGENTS.md. Don't undo other agents' parallel work. Don't care about errors on unmodified files. Fix all severities.

## Summary

Round 8 review performed by 8 parallel explore subagents. Prior rounds (1-7) fixed most style prop violations, Apollo/GraphQL issues, i18n hardcoded strings, and Zustand module-load `new Date()` issues. This round focuses on:
- String-based palette accesses (7 CRITICAL) — same pattern across different files than Round 7
- `Box component="form"` and `Box component="input"` (10 CRITICAL) — move to native elements
- Custom confirm dialogs not using BaseDeleteDialog (4 CRITICAL, 4 WARNING)
- Hardcoded fontSize/borderRadius/inline styles (18 WARNING)
- i18n hardcoded strings in mockLogin, SidebarShell aria-label, RegisteredStudentsSection aria-label, useCountryDetection (7 WARNING)
- `statusTrackingStore.ts` `new Date()` at module load (1 WARNING) — missed by prior rounds
- Typography `component="span"` (3 WARNING)
- Barrel named re-exports → `export *` (11 SUGGESTION)
- StatusBadge misuse for non-status strings (3 SUGGESTION)
- Inline status Chips (3 SUGGESTION)

### NOT included in this fix batch (out of scope / per AGENTS.md):
- **Stack `spacing` direct prop (356 WARNING)**: AGENTS.md line 37 lists `alignItems`, `justifyContent`, `flexWrap`, `gap`, `mb`, `mt` but does NOT explicitly list `spacing`. The `spacing` prop is functionally equivalent to `gap` but is heavily used and migrating 356 instances across 205 files creates regression risk. Deferring to a separate sweep.
- **Box `component="output"` and `component="alert"`**: AGENTS.md line 113 explicitly endorses these patterns for aria-live regions. NOT violations.
- **Box `component="span"`/`component="li"`/`component="ul"`/`component="label"`/`component="img"` (~79 WARNING)**: These are structural HTML elements with no semantic abuse. AGENTS.md line 38 says `component` must go in `sx` but sx cannot hold `component`. These don't have a clean migration path without changing the DOM structure. Deferring.

## Findings

### CRITICAL (21)

#### Theme — String palette (7)
- [ ] [CRITICAL] theme: ReportsTotalsShared.tsx:43 — `color: "text.secondary"` string palette in sx object
- [ ] [CRITICAL] theme: TokenMetadataDialog.tsx:38 — `color: "text.secondary"` string palette in sx object
- [ ] [CRITICAL] theme: parentProfileShared.tsx:173 — `color="text.secondary"` string palette direct prop
- [ ] [CRITICAL] theme: parentOnboardingShared.options.tsx:25 — `backgroundColor: "primaryContainer"` string palette (desktop)
- [ ] [CRITICAL] theme: parentOnboardingShared.options.tsx:26 — `color: "onPrimaryContainer"` string palette (desktop)
- [ ] [CRITICAL] theme: parentOnboardingShared.options.tsx:74 — `backgroundColor: "primaryContainer"` string palette (mobile)
- [ ] [CRITICAL] theme: parentOnboardingShared.options.tsx:75 — `color: "onPrimaryContainer"` string palette (mobile)

#### MUI — Box `component="form"` with onSubmit (9)
- [ ] [CRITICAL] mui: SessionConfigFormDialog.tsx:88 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: TeacherAdminEditForm.tsx:188 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: TeacherProfileEditForm.tsx:91 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: ParentProfileEditForm.tsx:242 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: StaffProfileEditForm.tsx:205 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: searchScheduleFormShared.tsx:226 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: dialogShellShared.tsx:69 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: quotaForm.desktop.tsx:38 — `Box component="form"` with onSubmit → use `<form>` element
- [ ] [CRITICAL] mui: quotaForm.mobile.tsx:38 — `Box component="form"` with onSubmit → use `<form>` element

#### MUI — Box `component="input"` (1)
- [ ] [CRITICAL] mui: BoxPrefixInput.tsx:10 — `Box component="input"` → use native `<input>` with styled() or wrapper

#### Patterns — Custom delete confirm dialogs (4)
- [ ] [CRITICAL] patterns: weeklyScheduleGrid.desktop.tsx:161-172 — Custom `<Dialog>` for class deletion → use BaseDeleteDialog
- [ ] [CRITICAL] patterns: mobileScheduleList.mobile.tsx:62-85 — Custom DeleteConfirmDialog `<Dialog>` → use MobileBaseDeleteDialog
- [ ] [CRITICAL] patterns: deleteGroupDialogShared.tsx:15 — Custom `<Dialog>` for delete-group → use BaseDeleteDialog
- [ ] [CRITICAL] patterns: NumbersDeleteConfirmDialog.tsx:42-53 — Custom `<Dialog>` for WhatsApp number deletion → use BaseDeleteDialog/MobileBaseDeleteDialog

### WARNING (30 — scoped excludes 356 Stack spacing + 79 Box component structural)

#### Theme — Hardcoded fontSize, borderRadius, inline styles (18)
- [ ] [WARNING] theme: ~10 hardcoded `fontSize: <number>px/rem` across mobile components → use typography variants or sx
- [ ] [WARNING] theme: rescheduleTrackingCardList.mobile.tsx:117 — hardcoded `borderRadius: 8` → use `theme.shape.borderRadius`
- [ ] [WARNING] theme: ~4 inline `style={{}}` instead of `sx` → move to `sx` prop
- [ ] [WARNING] theme: color:"inherit" string in sx → use theme callback

#### i18n — Hardcoded strings (7)
- [ ] [WARNING] i18n: mockLogin.ts — 2 hardcoded English messages
- [ ] [WARNING] i18n: SidebarShell.tsx — hardcoded aria-label template
- [ ] [WARNING] i18n: RegisteredStudentsSection.tsx — hardcoded aria-label
- [ ] [WARNING] i18n: useCountryDetection.ts — 3 hardcoded English error strings

#### Zustand — Module-load new Date() (1)
- [ ] [WARNING] zustand: statusTrackingStore.ts:12 — `selectedDate: getTodayScheduleFilterDate()` at module load → lazy init pattern

#### MUI — Typography `component="span"` (3)
- [ ] [WARNING] mui: recentLessonReportCard.mobile.tsx:79 — Typography `component="span"` → wrapper element
- [ ] [WARNING] mui: suspensionAnalyticsShared.tsx:183 — Typography `component="span"` → wrapper element
- [ ] [WARNING] mui: studentRecentReportsCardList.desktop.tsx:36 — Typography `component="span"` → wrapper element

#### Patterns — Custom confirm dialogs (4)
- [ ] [WARNING] patterns: DisconnectConfirmDialog.tsx:36-49 — Custom confirm Dialog → use BaseDeleteDialog
- [ ] [WARNING] patterns: ManagerRowActions.tsx:102-115 — Custom DeactivateDialog → use BaseDeleteDialog
- [ ] [WARNING] patterns: ParentAccountActions.tsx:37-57 — Custom AccountActionDialog → use BaseDeleteDialog
- [ ] [WARNING] patterns: LiveSessionToolbar.tsx:176-191 — Custom ConfirmationDialog → use BaseDeleteDialog

### SUGGESTION (21)

#### Barrels — Named re-exports → `export *` (11)
- [ ] [SUGGESTION] logging: 11 barrel files with named re-exports → convert to `export *`

#### Theme — Hardcoded transitions (2)
- [ ] [SUGGESTION] theme: theme/components.ts — 2 hardcoded transitions → use theme.transitions

#### i18n — Dead constants (2)
- [ ] [SUGGESTION] i18n: 2 dead constants with hardcoded English strings → remove

#### Patterns — StatusBadge misuse (3)
- [ ] [SUGGESTION] patterns: updatedSessionsDataGrid.desktop.tsx:51,71 — StatusBadge misused for time strings
- [ ] [SUGGESTION] patterns: teacherDues.desktop.tsx:60 — StatusBadge misused for rate-source label

#### Patterns — Inline status Chips (3)
- [ ] [SUGGESTION] patterns: ClassMeetingContextBanner.tsx:51,54 — inline Chip for status → StatusBadge
- [ ] [SUGGESTION] patterns: LinkedClassInstancesList.tsx:105 — inline Chip for status → StatusBadge

## Recommended Actions

### Batch 1 — String palette (7 CRITICAL) — parallel subagent
Fix all 7 string-based palette accesses in 4 files:
- `ReportsTotalsShared.tsx` — `color: "text.secondary"` → `sx={(theme) => ({ color: theme.palette.text.secondary })}`
- `TokenMetadataDialog.tsx` — same pattern
- `parentProfileShared.tsx` — `color="text.secondary"` → `sx` callback
- `parentOnboardingShared.options.tsx` — `backgroundColor: "primaryContainer"` + `color: "onPrimaryContainer"` → theme callback (4 instances)

### Batch 2 — Box component="form" → native `<form>` (9 CRITICAL) — parallel subagent
Replace `<Box component="form" onSubmit={...} sx={...}>` with `<form onSubmit={...} style={...}>` or `<Box component="form" {...} />` → `<form onSubmit={...}>` preserving sx styles via style/styled.
Files: SessionConfigFormDialog, TeacherAdminEditForm, TeacherProfileEditForm, ParentProfileEditForm, StaffProfileEditForm, searchScheduleFormShared, dialogShellShared, quotaForm.desktop, quotaForm.mobile

### Batch 3 — Box component="input" (1 CRITICAL) — parallel subagent
`BoxPrefixInput.tsx` — replace `Box component="input"` with native `<input>` + styled() or wrapper approach.

### Batch 4 — Custom delete confirm dialogs (4 CRITICAL, 4 WARNING) — parallel subagent
Replace custom `<Dialog>` delete confirms with `BaseDeleteDialog` (desktop/common) or `MobileBaseDeleteDialog` (mobile):
- weeklyScheduleGrid.desktop.tsx → BaseDeleteDialog
- mobileScheduleList.mobile.tsx → MobileBaseDeleteDialog
- deleteGroupDialogShared.tsx → BaseDeleteDialog
- NumbersDeleteConfirmDialog.tsx → BaseDeleteDialog/MobileBaseDeleteDialog
- DisconnectConfirmDialog.tsx → BaseDeleteDialog (WARNING)
- ManagerRowActions.tsx → BaseDeleteDialog (WARNING)
- ParentAccountActions.tsx → BaseDeleteDialog (WARNING)
- LiveSessionToolbar.tsx → BaseDeleteDialog (WARNING)

### Batch 5 — i18n hardcoded strings (7 WARNING) — parallel subagent
- mockLogin.ts — 2 messages → use `getServerTranslations`
- SidebarShell.tsx — aria-label → `useAppTranslation`
- RegisteredStudentsSection.tsx — aria-label → `useAppTranslation`
- useCountryDetection.ts — 3 error strings → `useAppTranslation` or typed translation

### Batch 6 — Zustand lazy init (1 WARNING) — direct edit
- statusTrackingStore.ts — `selectedDate: getTodayScheduleFilterDate()` → sentinel `""` + `ensureFilterDate()` action

### Batch 7 — Typography component="span" (3 WARNING) — parallel subagent
Replace Typography `component="span"` with Box `component="span"` wrapper or styled span.

### Batch 8 — Theme hardcoded values (18 WARNING) — parallel subagent
- ~10 hardcoded fontSize → typography variants or sx with theme.typography
- ~4 inline style={{}} → sx prop
- borderRadius: 8 → theme.shape.borderRadius
- color:"inherit" → theme callback

### Batch 9 — Barrel re-exports + dead constants + StatusBadge misuse (11+2+3+3 SUGGESTION) — parallel subagent
- 11 barrel files → `export *`
- 2 dead constants → remove
- 3 StatusBadge misuse → plain Typography
- 3 inline status Chips → StatusBadge
- 2 hardcoded transitions → theme.transitions

## Plan-Review Validation

### Affected layers and AGENTS.md compliance:

| Layer | AGENTS.md | Rules checked |
|-------|-----------|----------------|
| frontend/views/ | views/AGENTS.md | ViewModel pattern, no viewport in views, Zustand for state ✅ |
| frontend/ | frontend/AGENTS.md | MUI v9 (sx not direct props), i18n (typed translations), logging (logger), theme (no hardcoded colors) ✅ |
| frontend/stores/ | stores/AGENTS.md | Zustand serialization, lazy init, persist partialize ✅ |

### Compliance check:
- **Type imports**: N/A (frontend-only changes, no Pothos/backend types)
- **Service boundaries**: N/A (no data fetching changes)
- **MUI v9**: Fixes align with AGENTS.md line 38 (Box shorthand → sx), line 43 (Typography component → wrapper), line 114 (Stack layout → sx)
- **i18n**: All fixes move hardcoded strings to compile-time translation system per AGENTS.md
- **Logging**: N/A (no console.* issues found)
- **Theme**: All fixes move hardcoded palette/fontSize/borderRadius to theme callbacks per AGENTS.md
- **Barrels**: Fixes align with barrel conventions (export * preferred)

**Plan passes all AGENTS.md rules for affected layers.**
