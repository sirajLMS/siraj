# Quota UI Production-Readiness Plan — Requirements

**Feature Name**: Quota UI Production-Readiness
**Target Directory**: `.ai/plans/quota/ui`
**Outcome Directory**: `.ai/plans/quota/ui/outcome`
**Version**: 1.0
**Date**: 2025-01-20
**Author**: AI Agent (spec-driven-development skill)
**Stakeholders**: Academy Admins, Supervisors, Teachers, Parents, Students, Staff

---

## Introduction

The quota system was implemented with a backend-first plan (`.ai/plans/quota/`). While the backend, GraphQL API, database schema, and i18n strings are complete, the **frontend UI has significant gaps** that prevent production readiness. This plan addresses exclusively the UI/UX layer: navigation, views, components, interactions, animations, accessibility, i18n completeness, and cross-linking.

### Feature Summary

A comprehensive UI/UX improvement plan that brings the quota admin pages, student quota tab, insights dashboard, and audience views to full production quality — conforming to the project's established patterns (Component Patterns, Mobile/Desktop Isolation, Storybook, E2E testing, accessibility, and i18n).

### Business Value

- Admins get a complete, validated form with student picker, date pickers, and success feedback
- All roles get responsive, accessible quota views with proper navigation and breadcrumbs
- Insights provide accurate aggregated analytics (not client-side paginated estimates)
- Audience views (Student/Parent/Teacher/Supervisor) show live data instead of placeholders
- Delete confirmation prevents accidental data loss
- RTL/Arabic layout fully supported (FAB mirroring, direction-aware spacing)

### Scope

**In Scope:**
- Billing quota list, detail, form (create/edit), and insights pages
- Student quota tab (audience views for Student/Parent/Teacher/Supervisor)
- Navigation, breadcrumbs, cross-linking from billing/teacher/parent dashboards
- Mobile/desktop tier isolation for billing quota (currently no split)
- Form validation wiring (connect dead Zod schemas to forms)
- Student picker / search autocomplete (replace free-text UUID inputs)
- Delete confirmation dialog
- Success/error toast notifications
- Accessibility (aria-labels, role="status", aria-busy, keyboard nav)
- i18n completeness (missing keys: PENDING, deleteFailed, deleteConfirm, etc.)
- Animation and transition specifications
- Storybook stories for all quota components
- E2E and component test specifications
- Recurring class dialog quotaId autocomplete

**Out of Scope:**
- Backend service logic changes
- Database schema changes
- GraphQL resolver logic changes (new queries/mutations are documented as API requirements but implementation is scoped to frontend consumption)
- The existing implemented plan (`.ai/plans/quota/`) — not modified

---

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/plans/quota/ui/outcome/` to absorb prior research, search results, and pitfalls.
2. WHEN an executing agent completes a task THEN system SHALL create a new outcome document at `.ai/plans/quota/ui/outcome/<task-id>-outcome.md` with research findings, implementation details, and carry-over points.
3. WHEN a subtask is completed THEN executing agent SHALL update the task checkbox `[ ]` → `[x]` in `tasks.md`.

---

### Requirement 1: Billing Quota List — Production Pattern Compliance

**User Story:** As an academy admin, I want a fully compliant quota list page with proper page container, header, metric cards, filter controls, and responsive mobile card list, so that I can browse and manage quotas efficiently on any device.

#### Acceptance Criteria

1. WHEN the billing quota list page renders on desktop THEN system SHALL display `DesktopPageContainer` → `DesktopPageHeader` (with breadcrumbs: Dashboard > Finance > Quotas) → `DesktopMetricCardGrid` (total quotas, active quotas, expired quotas) → `SectionPanel` (with `FilterButton` + `ExportButton` + `PrimaryPageAction` "New Quota") → `DesktopAppDataGrid` wrapping `AppDataGrid` with server pagination.
2. WHEN the billing quota list page renders on mobile THEN system SHALL display `MobilePageContainer` (edge-to-edge, `px: 0`) → `MobilePageHeader` (with breadcrumbs) → `MobileMetricCardGrid` → `MobileSectionPanel` → `MobileCardList` + `MobileCardListItem` with pagination controls.
3. WHEN a quota status is displayed THEN system SHALL render `StatusBadge` with an appropriate category mapping (ACTIVE/EXPIRED/ARCHIVED/PENDING) — never inline `Chip`.
4. WHEN filters (status, kind, search) are applied THEN system SHALL render them via `FilterButton`-driven popovers in the `SectionPanel` actions slot — never inline `InputLabel` + `Select` rows.
5. WHEN the billing quota list has zero rows THEN system SHALL display an i18n-localized `emptyMessage` in the `AppDataGrid` `noRowsOverlay`.
6. WHEN data is loading THEN system SHALL display `AppDataGridLoadingOverlay` (desktop) or skeleton card list (mobile) with `aria-busy="true"` on the loading region.
7. WHEN a data fetch error occurs THEN system SHALL display `ErrorState` component with retry button.
8. WHEN the billing quota list is paginated THEN system SHALL use `buildServerPaginationOptions(...)` for `paginationOptions` — never `mode: "client"` on server-sliced data.
9. WHEN user clicks "New Quota" THEN system SHALL navigate to `/quotas/new` via `PrimaryPageAction` component.

#### Edge Cases

- **No quotas at all**: Friendly empty state with localized "No quotas yet" message and CTA button to create first quota.
- **Network error**: `ErrorState` with retry button, not a blank page.
- **Permission denied**: Redirect to unauthorized page (already handled by `requirePermissionForPage`).
- **RTL layout**: All paddings/margins must be direction-aware; FAB must mirror to left side.

---

### Requirement 2: Billing Quota Form — Validation, Pickers, and Feedback

**User Story:** As an academy admin, I want a validated quota creation/edit form with student search autocomplete, date pickers, period configuration, and clear success/error feedback, so that I can create quotas without errors.

#### Acceptance Criteria

1. WHEN the quota form renders THEN system SHALL use `react-hook-form` with `zodResolver` and the Zod schema from `schemas/quotaSchema.ts` — connecting the currently dead schema to the form.
2. WHEN the user selects a student THEN system SHALL provide an `Autocomplete`-based person picker (using permission-based `userSelect` from `@/frontend/desktop/components/ui/input/userSelect` or `@/frontend/mobile/components/ui/input/userSelect`) — never a free-text UUID `TextField`.
3. WHEN the user selects dates (validFrom, validUntil) THEN system SHALL render `AppDatePicker` component — never `<input type="date">` or `TextField type="date"`.
4. WHEN the user selects a custom period type THEN system SHALL render a `periodDays` number input field that is contextually shown only when `periodType === "CUSTOM"`.
5. WHEN the form submits successfully THEN system SHALL display a `FormSuccessSnackbar` notification and redirect to the detail page.
6. WHEN the form submission fails THEN system SHALL display a `FormErrorSnackbar` with the i18n-localized error message.
7. WHEN the form is submitting THEN system SHALL disable the submit button and show a spinner icon (using `SyncOutlined` with CSS `spin` animation or `CircularProgress` size="small").
8. WHEN the form has validation errors THEN system SHALL display inline `helperText` + `error` props on each invalid field.
9. WHEN the user edits an existing quota THEN system SHALL populate all fields from the existing quota data via `methods.reset()` in a `useEffect` **inside `useQuotaFormViewModel.ts`** (NOT in tier view files — form business logic must stay in the VM, not in desktop/mobile presentation components).
10. WHEN the form renders on desktop THEN system SHALL wrap in `DesktopPageContainer` + `DesktopPageHeader` (breadcrumbs: Dashboard > Finance > Quotas > [Edit|New]).
11. WHEN the form renders on mobile THEN system SHALL wrap in `MobilePageContainer` + `MobilePageHeader` and use mobile-specific form section components.
12. WHEN the form fields have permission restrictions THEN system SHALL use a `QuotaFormAccessProvider`-style context to gate field editability — consistent with the student quota form pattern.

#### Edge Cases

- **Student not found**: Autocomplete shows "No students found" message.
- **Date range invalid** (validUntil before validFrom): Zod schema validation catches this and displays inline error.
- **Network error on submit**: `FormErrorSnackbar` with retry option, form retains entered data.
- **User navigates away with unsaved changes**: Window `beforeunload` or React Router `useBlocker` prompt (optional, if pattern exists).
- **Permission to view but not edit**: All fields render as read-only/disabled.
- **periodType is CUSTOM but periodDays is empty**: Validation error on periodDays field.

---

### Requirement 3: Billing Quota Detail — Complete Information Display

**User Story:** As an academy admin, I want a quota detail page that shows all quota metadata, a balance chart, the full ledger, and proper navigation to edit/delete actions, so that I can review a quota's full lifecycle.

#### Acceptance Criteria

1. WHEN the quota detail page renders THEN system SHALL display `DesktopPageContainer` + `DesktopPageHeader` with breadcrumbs: Dashboard > Finance > Quotas > [quota ID].
2. WHEN the quota detail page renders THEN system SHALL display all quota metadata: student name, kind, period type, period days, valid from, valid until, created at, updated at, current status — in a themed `SectionPanel` summary grid.
3. WHEN the quota detail page renders THEN system SHALL display the quota status as a `StatusBadge` — never inline `Chip`.
4. WHEN the quota has ledger entries THEN system SHALL display them in an `AppDataGrid` (desktop) or `MobileCardList` (mobile) with server pagination.
5. WHEN the admin clicks "Edit" THEN system SHALL navigate to `/quotas/[id]/edit`.
6. WHEN the admin clicks "Delete" THEN system SHALL open a `BaseDeleteDialog` confirmation dialog — never delete immediately.
7. WHEN the admin confirms delete THEN system SHALL call the delete mutation, show a success notification, and redirect to the quota list.
8. WHEN the delete mutation fails THEN system SHALL show a `FormErrorSnackbar` with i18n key `deleteFailed` and keep the detail page intact (no redirect).
9. WHEN the quota is not found THEN system SHALL display a localized "Quota not found" empty state with a back-navigation button.
10. WHEN the quota detail is loading THEN system SHALL display `Skeleton` variants with `aria-busy="true"`.
11. WHEN viewed on mobile THEN system SHALL render a mobile-specific layout: summary as stacked cards, ledger as `MobileCardList`.

#### Edge Cases

- **Quota not found (404)**: Distinct "Quota not found" page with navigation back to list.
- **Quota expired**: Display an `EXPIRED` status badge variant; disable edit/delete if policy requires.
- **Ledger is empty**: Show localized "No ledger entries yet" empty state.
- **Permission to view but not delete**: Hide or disable the delete button.

---

### Requirement 4: Quota Insights — Accurate Aggregation and Filtering

**User Story:** As an academy admin, I want an insights dashboard that shows accurate aggregated quota data across all quotas (not just the current paginated page), with filtering controls and export capability, so that I can make data-driven decisions.

#### Acceptance Criteria

1. WHEN the insights page renders THEN system SHALL fetch aggregated data from the `quotaBalance` GraphQL query (which returns `totalActiveClasses`, `totalRemaining`, `totalReserved`, `breakdownByExpiration`) — not compute charts client-side from the paginated list.
2. WHEN the insights page renders THEN system SHALL display KPI cards using `DesktopMetricCardGrid` / `MobileMetricCardGrid` — never hand-rolled `Card` + `Box`.
3. WHEN the admin interacts with charts THEN system SHALL render recharts components (AreaChart, BarChart, PieChart, LineChart) using theme palette colors via `sx` callback — never hardcoded hex values.
4. WHEN the admin wants to filter insights THEN system SHALL provide filter controls: date range (`AppDateRangePicker`), quota kind, status, and optional student filter.
5. WHEN the admin wants to export insights THEN system SHALL provide an `ExportButton` that exports the current filtered dataset as CSV.
6. WHEN the `pendingBacklogCount` is displayed THEN system SHALL reflect actual on-demand backlog count from the server — not alias it to `activeQuotasCount`.
7. WHEN the insights page renders on mobile THEN system SHALL display a mobile-optimized layout: stacked KPI cards and scrollable charts.
8. WHEN the insights data is loading THEN system SHALL display skeleton placeholders with `aria-busy="true"`.
9. WHEN the insights data fails to load THEN system SHALL display `ErrorState` with retry.
10. WHEN the insight notes about `PACKAGE` kind as proxy for `ON_DEMAND` are no longer relevant THEN system SHALL display proper `ON_DEMAND` kind once the backend schema supports it.

#### Edge Cases

- **No quotas exist**: "No insights available yet — create quotas to see analytics."
- **All quotas expired**: Show appropriate message in charts (not empty axes).
- **Date range returns no data**: "No data for the selected date range."

---

### Requirement 5: Navigation, Breadcrumbs, and Cross-Linking

**User Story:** As any user, I want consistent breadcrumbs on all quota pages and cross-links from related dashboards (billing, teacher, parent) to the quota admin pages, so that I can navigate contextually without losing my place.

#### Acceptance Criteria

1. WHEN the user is on `/quotas` THEN system SHALL display breadcrumbs: `Dashboard > Finance > Quotas`.
2. WHEN the user is on `/quotas/new` THEN system SHALL display breadcrumbs: `Dashboard > Finance > Quotas > New`.
3. WHEN the user is on `/quotas/[id]` THEN system SHALL display breadcrumbs: `Dashboard > Finance > Quotas > [student name or quota ID]`.
4. WHEN the user is on `/quotas/[id]/edit` THEN system SHALL display breadcrumbs: `Dashboard > Finance > Quotas > [student name or quota ID] > Edit`.
5. WHEN the user is on `/quotas/insights` THEN system SHALL display breadcrumbs: `Dashboard > Finance > Quotas > Insights`.
6. WHEN the user is on `/students/[id]/quotas` THEN system SHALL display breadcrumbs: `Dashboard > Students > [student name] > Quotas`.
7. WHEN the navigation config has orphaned `quotas-view` / `quotas-edit` entries with placeholder hrefs THEN system SHALL either wire them to valid routes or remove them.
8. WHEN the mobile bottom navigation renders THEN system SHALL include entry points to quota "Insights" and "Create" actions (currently missing).
9. WHEN a teacher views a student profile THEN system SHALL include a link to `/quotas/[id]` (the quota detail/audit ledger) from the teacher dashboard.
10. WHEN a parent views their child's profile THEN system SHALL include a link to the student's quota from the parent portal.
11. WHEN a billing admin views an invoice THEN system SHALL include a link to the associated student's quota.
12. WHEN a notification about a quota override is clicked THEN system SHALL route to `/quotas/[id]` (the audit ledger) — not the student profile tab.
13. WHEN the user navigates to a non-existent quota route THEN system SHALL display a localized "Page not found" state.
14. WHEN `students/[id]/quotas/page.tsx` renders THEN system SHALL include `generateMetadata` for SEO/title.

#### Edge Cases

- **Deep link to expired quota**: Breadcrumb still shows; detail page shows expired status.
- **User doesn't have QUOTAS_MANAGE permission**: "New Quota" and "Edit" action buttons hidden.
- **Navigation from parent portal**: Link opens in same tab with breadcrumb back to parent portal.

---

### Requirement 6: Student Quota Audience Views — Live Data Wiring

**User Story:** As a student, parent, teacher, or supervisor, I want the quota audience views to show live quota data (remaining classes, balance, status, recent activity) instead of placeholder "noData" cards, so that I can monitor quota usage in real time.

#### Acceptance Criteria

1. WHEN a student views their own quota THEN system SHALL render `StudentQuotaView` with: current balance (remaining/total classes), quota status badge, valid period, and recent ledger entries (last 5) — fetched from `studentQuotas` or `quotaBalance` GraphQL query.
2. WHEN a parent views their child's quota THEN system SHALL render `ParentQuotaView` with: same data as student view plus the child's name header and any upcoming expiry warnings.
3. WHEN a teacher views a student's quota THEN system SHALL render `TeacherQuotaView` with: remaining balance, quota kind, and whether the student has sufficient quota for the next class.
4. WHEN a supervisor views a student's quota THEN system SHALL render `SupervisorQuotaView` with: full audit summary, all quotas for the student, and override history.
5. WHEN the audience view has no data (no quota exists) THEN system SHALL display a localized empty state with contextual guidance (e.g., "No quota assigned — contact academy admin").
6. WHEN the audience view is loading THEN system SHALL display skeleton placeholders with `aria-busy="true"`.
7. WHEN the audience view encounters an error THEN system SHALL display `ErrorState` with retry.
8. WHEN the `studentQuotas` or `quotaBalance` query is currently unused by the UI THEN system SHALL wire it to the appropriate audience view component.

#### Edge Cases

- **Student has multiple quotas**: Show the active one prominently; list others in a collapsible section.
- **Quota expiring soon (within 7 days)**: Display an amber warning banner.
- **Quota exhausted**: Display a red "Quota exhausted" banner with contact-admin CTA.
- **Parent has multiple children**: Tabbed or segmented view to switch between children.

---

### Requirement 7: Recurring Class Dialog — Quota Autocomplete

**User Story:** As an academy admin, I want the recurring class dialog to use an autocomplete dropdown for selecting a quota (instead of a free-text UUID field), so that I can select the correct quota without typos.

#### Acceptance Criteria

1. WHEN the recurring class dialog renders THEN system SHALL display the `quotaId` field as an `Autocomplete` populated from the `studentOpenQuotas` query results, showing student name + quota kind + remaining balance as the option label.
2. WHEN the user types in the quota autocomplete THEN system SHALL filter results by student name or quota ID.
3. WHEN no open quotas exist for the student THEN system SHALL display a localized "No open quotas — create a quota first" message with a link to `/quotas/new`.
4. WHEN the user selects a quota THEN system SHALL populate the `quotaId` with the selected quota's ID.
5. WHEN the `schedulingMode` is displayed THEN system SHALL render it as Tabs or Radio buttons (not a plain `Select`) for better visual clarity of mode options.
6. WHEN on-demand-only fields are irrelevant for the selected scheduling mode THEN system SHALL hide them (not always render them regardless of selection).

#### Edge Cases

- **Student has no open quotas**: Autocomplete shows empty state with CTA.
- **Multiple quotas with same kind**: Disambiguate by showing validUntil date in the option label.
- **User changes scheduling mode after selecting a quota**: Retain selection if compatible, clear if not.

---

### Requirement 8: Accessibility — ARIA, Keyboard, and Screen Reader Support

**User Story:** As a user with assistive technology needs, I want all quota UI components to have proper ARIA attributes, keyboard navigation, and screen reader announcements, so that I can interact with quota features independently.

#### Acceptance Criteria

1. WHEN an icon-only button renders (back, edit, delete, add FAB, avatar edit) THEN system SHALL include an `aria-label` attribute with a localized description.
2. WHEN a loading region (Skeleton, CircularProgress) renders THEN system SHALL include `aria-busy="true"` on the container.
3. WHEN a status badge renders THEN system SHALL include `role="status"` on the badge element.
4. WHEN an `AppDataGrid` renders THEN system SHALL include the `ariaLabel` prop and a localized `emptyMessage`.
5. WHEN a form field renders THEN system SHALL include `helperText`, `required`, and `error` props for screen readerannouncement of validation state.
6. WHEN a dialog renders THEN system SHALL trap focus within the dialog and restore focus to the trigger element on close.
7. WHEN keyboard navigation is used THEN system SHALL support Tab, Enter, and Escape for all interactive elements (buttons, forms, dialogs, DataGrid rows).
8. WHEN a toast/snackbar renders THEN system SHALL use `role="alert"` for error messages and `role="status"` for success messages.
9. WHEN a table row action (edit/delete) renders THEN system SHALL provide keyboard-accessible buttons with visible focus indicators.
10. WHEN the quota color contrast is evaluated THEN system SHALL meet WCAG 2.1 AA contrast ratios for all text/background combinations.

#### Edge Cases

- **Screen reader user on insights page**: Charts need `aria-label` summarizing the data or `aria-hidden` with a text alternative table.
- **High contrast mode**: StatusBadge colors must remain distinguishable.

---

### Requirement 9: i18n Completeness — Missing Keys, Pluralization, RTL

**User Story:** As an Arabic-speaking user, I want all quota UI strings to be localized in Arabic with proper RTL layout, pluralization, and no missing translation keys, so that I can use the quota features in my native language.

#### Acceptance Criteria

1. WHEN a quota has PENDING status THEN system SHALL display a localized "Pending" label and include the `PENDING` status in the `QuotaStatus` i18n type and formatter in all locales (`shared/locale/types/dashboard/billing/quota.ts`, `en.ts`, `ar.ts`).
2. WHEN a delete fails THEN system SHALL display a localized `deleteFailed` error message — currently this key does not exist and failures are silently swallowed.
3. WHEN a delete confirmation dialog renders THEN system SHALL display localized `deleteConfirmTitle`, `deleteConfirmBody`, `deleteConfirmCancel`, `deleteConfirmConfirm` messages.
4. WHEN an audience count renders (e.g., "1 quota" vs "2 quotas") THEN system SHALL use pluralized i18n functions (`(count: number) => string`) — currently these are not pluralized. Note: Arabic quota locale uses binary singular/other convention (`count === 1 ? singular : plural`), NOT the CLDR singular/dual/plural — this matches the existing `shared/locale/ar/dashboard/billing/quota.ts` pattern.
5. WHEN the AppDataGrid renders its default empty message THEN system SHALL use a localized `emptyMessage` prop instead of the hardcoded "No entries found" English string.
6. WHEN the UI renders in RTL (Arabic) THEN system SHALL mirror the mobile FAB from `right: 24px` to `left: 24px` and apply `dir="rtl"` to all directional layout containers.
7. WHEN any quota UI string is displayed THEN system SHALL ensure it exists in the i18n type schema, English locale, and Arabic locale — no hardcoded English strings.
8. WHEN a date or number renders THEN system SHALL use locale-aware formatting (Gregorian/Arabic-Indic digits per locale setting).

#### Edge Cases

- **New i18n keys added**: Must be added to type schema FIRST, then en.ts, then ar.ts — compile-time type checking ensures completeness.
- **Arabic pluralization (zero/one/two/few/many/other)**: Use proper CLDR plural rules in the `(count: number) => string` function.
- **Mixed RTL/LTR content** (e.g., quota ID with Latin characters): Use Unicode bidirectional isolation where needed.

---

### Requirement 10: Design System Compliance — Theme, Colors, StatusBadge

**User Story:** As a developer, I want all quota UI components to comply with the project's design system (theme palette, StatusBadge, no hardcoded colors, MUI v9 sx props), so that the UI is consistent, maintainable, and passes quality gates.

#### Acceptance Criteria

1. WHEN any color is applied THEN system SHALL use theme palette via `sx` callback (e.g., `sx={(theme) => ({ color: theme.palette.primary.main })}`) — never string-quoted palette access (`color="primary.main"`), never hardcoded hex values.
2. WHEN a status indicator renders THEN system SHALL use `StatusBadge` with an appropriate category — never inline `Chip` with `color={color}`.
3. WHEN a MUI component renders THEN system SHALL use `sx` prop for all style properties (fontWeight, textAlign, mb, mt, p, display, gap, alignItems, justifyContent, flexWrap) — never direct style props on Typography, Stack, Box, Grid.
4. WHEN an icon renders THEN system SHALL use `*Outlined` naming (e.g., `ErrorOutlined`, not `ErrorOutline`).
5. WHEN metric cards render THEN system SHALL use `DesktopMetricCardGrid` / `MobileMetricCardGrid` — views must NEVER import `MetricCard` directly.
6. WHEN typography renders THEN system SHALL use theme variants (`headlineLg`, `headlineMd`, `titleLg`, `labelUppercase`, `bodyMd`, `bodyLg`) — never hardcoded font `sx`.
7. WHEN a form input renders THEN system SHALL use `AppDatePicker` / `AppTimePicker` (not `<input type="date">`), and use `outlinedInputSx` / `labelSx` styling helpers.
8. WHEN outlined palette access (`"text.secondary"`, `"warning.main"`, `"error.main"`) is found in existing quota files THEN system SHALL refactor to theme callback syntax.
9. WHEN `Theme` is accessed in `sx` callback THEN system SHALL use Material 3 `on<Color>` siblings for contrast (e.g., `theme.palette.onPrimary`), not `contrastText`.

#### Edge Cases

- **Dark mode**: All theme palette values must resolve correctly in both light and dark themes.
- **Custom opacity**: Use `opacity` prop or `theme.palette.overlay` — never `rgba()` in colors.

---

### Requirement 11: Mobile/Desktop Tier Isolation — Billing Quota Split

**User Story:** As a developer, I want the billing quota components to follow the mobile/desktop tier isolation pattern (like the student quota does), so that the codebase passes ESLint isolation rules and CodeScene health checks.

#### Acceptance Criteria

1. WHEN the billing quota list container renders THEN system SHALL use `createLazyView` + `ResponsiveViewSwitch` with lazy imports from `frontend/mobile/views/dashboard/billing/quota/` and `frontend/desktop/views/dashboard/billing/quota/` — not co-located components in the common domain.
2. WHEN the billing quota form renders THEN system SHALL use `createLazyView` + `ResponsiveViewSwitch` with mobile/desktop tier form components.
3. WHEN the billing quota detail renders THEN system SHALL use `createLazyView` + `ResponsiveViewSwitch` with mobile/desktop tier detail components.
4. WHEN the billing quota insights renders THEN system SHALL use `createLazyView` + `ResponsiveViewSwitch` with mobile/desktop tier insights components.
5. WHEN tier-specific components render THEN system SHALL NEVER use `useMediaQuery`, `useViewport`, or `ViewportContext` inside `.mobile.tsx` or `.desktop.tsx` files.
6. WHEN shared view models are defined THEN system SHALL place them in `frontend/common/views/dashboard/billing/quota/` with typed readonly interfaces.
7. WHEN the Zustand store stores pagination state THEN system SHALL move `page` / `pageSize` from local `useState` to the store (currently they won't survive tier switching).
8. WHEN the billing quota form uses plain controlled state THEN system SHALL migrate to `react-hook-form` + `zodResolver` pattern (consistent with student quota form).

#### Edge Cases

- **Tier switch during data fetch**: ViewModel state in Zustand survives the switch; lazy-loaded tier component picks up where the other left off.
- **Non-serializable values in store**: Use `partialize` or `useRef` — never store `File`, `Blob`, `Promise` in persist-enabled stores.

---

### Requirement 12: Animations and Transitions

**User Story:** As a user, I want smooth animations and transitions on quota UI elements (list item enter/exit, page transitions, dialog transitions, save spinner), so that the interface feels polished and responsive.

#### Acceptance Criteria

1. WHEN a list item enters (quota list, ledger entries) THEN system SHALL apply a fade-in or slide-up transition using MUI `Fade` or `Grow` component or CSS `@keyframes` with `animation-fill-mode: both`.
2. WHEN a list item exits (after delete) THEN system SHALL apply a fade-out or slide-down exit transition before removing from DOM.
3. WHEN a dialog opens THEN system SHALL use MUI `Dialog` default transition (or custom `Slide` transition) — not instant appearance.
4. WHEN a page transition occurs THEN system SHALL apply a subtle `Fade` transition on the page container mount.
5. WHEN the save button is in submitting state THEN system SHALL display a spinning `SyncOutlined` icon with CSS `animation: spin 1s linear infinite` — not a raw `CircularProgress` inline.
6. WHEN a MetricCard renders THEN system SHALL animate the value count-up (if `animated` prop is true, which is the default in `MetricCard`).
7. WHEN a status badge changes (e.g., ACTIVE → EXPIRED) THEN system SHALL apply a color transition `transition: background-color 200ms ease`.
8. WHEN the insights charts render THEN system SHALL use recharts built-in animation props (`isAnimationActive`, `animationDuration`, `animationBegin`).
9. WHEN a toast/snackbar appears THEN system SHALL use MUI Snackbar default slide transition.

#### Edge Cases

- **Reduced motion preference**: If `prefers-reduced-motion` is set, disable all non-essential animations (respect accessibility).
- **Rapid list updates**: Debounce animation triggers to avoid jank.

---

### Requirement 13: Storybook Stories — Full Coverage

**User Story:** As a developer, I want Storybook stories for all quota components, so that I can visually verify each component in isolation and across locales/viewport sizes.

#### Acceptance Criteria

1. WHEN a Storybook story is created for `QuotaContainer` THEN system SHALL include stories: `Default` (with data), `Loading` (skeleton), `Empty` (no rows), `Error` (error state) — title `"Views/dashboard/billing/quota/QuotaContainer"`.
2. WHEN a Storybook story is created for `QuotaDetailContainer` THEN system SHALL include stories: `Default`, `Loading`, `NotFound`, `Error` — title `"Views/dashboard/billing/quota/QuotaDetailContainer"`.
3. WHEN a Storybook story is created for `QuotaFormContainer` THEN system SHALL include stories: `Default` (create mode), `Edit` (edit mode with data), `ValidationErrors` (form with errors) — title `"Views/dashboard/billing/quota/QuotaFormContainer"`.
4. WHEN a Storybook story is created for `QuotaInsightsContainer` THEN system SHALL include stories: `Default` (with data), `Loading`, `Empty`, `Error` — title `"Views/dashboard/billing/quota/QuotaInsightsContainer"`.
5. WHEN a Storybook story is created for audience views THEN system SHALL include stories for `StudentQuotaView`, `ParentQuotaView`, `TeacherQuotaView`, `SupervisorQuotaView` — each with `Default`, `Loading`, `Empty`, `Error` states.
6. WHEN each story renders THEN system SHALL use `StoryWrapper` global decorators, allow locale switching (`ar`/`en`), theme switching (`light`/`dark`), and viewport switching (`mobile`/`desktop`).
7. WHEN a story uses permissions THEN system SHALL seed `useUserStore.setState()` with appropriate permissions via `seedPermissions` / `withPermissions` helpers.

#### Edge Cases

- **Story with mocked Apollo**: Use MSW handlers for GraphQL mocks (already configured globally in `.storybook/preview.tsx`).
- **Story with RTL**: Test Arabic locale rendering in the story.

---

### Requirement 14: Component and E2E Tests — Test Pyramid

**User Story:** As a developer, I want component tests and E2E tests for the quota UI, so that I can verify correctness and prevent regressions.

#### Acceptance Criteria

1. WHEN a component test is created for `QuotaContainer` THEN system SHALL create `test/ui/components/quota/QuotaContainer.desktop.test.tsx` and `QuotaContainer.mobile.test.tsx` — testing rendering, DataGrid presence (desktop), card list presence (mobile), empty state, loading state.
2. WHEN a component test is created for `QuotaFormContainer` THEN system SHALL test form validation, student autocomplete interaction, date picker interaction, submit success, submit error.
3. WHEN a component test is created for `QuotaDetailContainer` THEN system SHALL test rendering, delete confirmation dialog flow, not-found state.
4. WHEN a component test is created for `QuotaInsightsContainer` THEN system SHALL test KPI card rendering, chart rendering, filter interaction, empty state.
5. WHEN a component test is created for audience views THEN system SHALL test each audience view (Student/Parent/Teacher/Supervisor) with mocked data.
6. WHEN an E2E test is created THEN system SHALL create `test/ui/e2e/quota.test.ts` using `setupBrowserLifecycle()`, `loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug)`, bilingual regex assertions.
7. WHEN the E2E test runs on mobile viewport THEN system SHALL assert `.MuiDataGrid-root` count = 0 (DataGrid should not render on mobile) and card list markers visible.
8. WHEN the E2E test runs on desktop viewport THEN system SHALL assert DataGrid is visible, pagination works, filters work, and navigation breadcrumbs render.
9. WHEN a component test renders THEN system SHALL use `TestWrapper` for Apollo mocks (never real server), Happy DOM, preloads `test-env.ts` / `happydom-preload.ts` / `next-dynamic-mock.ts`.

#### Edge Cases

- **Flaky E2E**: No `waitForTimeout` / `networkidle` — use Playwright auto-waiting only.
- **Build requirement**: `bun run build:test` before running E2E (produces `.next-test-prod`).

---

### Requirement 15: GraphQL Cache and Mutation Optimization

**User Story:** As a developer, I want quota GraphQL mutations to properly update Apollo cache, so that the UI reflects changes immediately without extra refetches.

#### Acceptance Criteria

1. WHEN a quota is created THEN system SHALL update the Apollo cache via `update` function or `refetchQueries` to add the new quota to the list — not rely solely on `cache-and-network` fetch policy.
2. WHEN a quota is updated THEN system SHALL update the affected cache entries (list item + detail cache).
3. WHEN a quota is deleted THEN system SHALL remove it from the list cache via `update` function — not call `refetch()`.
4. WHEN the `QuotaUpdateInput` includes a `version` field for optimistic concurrency THEN system SHALL pass the current version in the update mutation and handle version-conflict errors gracefully.
5. WHEN the `studentOpenQuotas` query is used in the recurring class dialog THEN system SHALL cache results and invalidate when a new quota is created.
6. WHEN the `quotaBalance` query is used in insights THEN system SHALL fetch with proper variables (date range, kind filter) and display loading state per chart section.

#### Edge Cases

- **Cache identity mismatch**: Ensure `id` field is present on all GraphQL object types for Apollo cache normalization.
- **Optimistic update rollback**: If mutation fails, roll back optimistic update and show error.

---

### Requirement 16: Role-Based Access Matrix

**User Story:** As a system admin, I want clear role-based access control for all quota pages and actions, so that each role sees only what they're authorized to access.

#### Acceptance Criteria

1. WHEN the role is SUPER_ADMIN or ACADEMY_ADMIN THEN system SHALL grant access to all `/quotas/**` routes with full CRUD (view, create, edit, delete).
2. WHEN the role is SUPERVISOR THEN system SHALL grant view-only access to `/quotas` list, `/quotas/[id]` detail, and `/quotas/insights` — no create/edit/delete.
3. WHEN the role is TEACHER THEN system SHALL grant view-only access to `/quotas/[id]` (for students they teach) and their student's quota tab — no admin list access.
4. WHEN the role is PARENT THEN system SHALL grant view-only access to their child's quota tab (`/students/[childId]/quotas`) — no admin `/quotas` routes.
5. WHEN the role is STUDENT THEN system SHALL grant view-only access to their own quota tab (`/students/[selfId]/quotas`) — no admin `/quotas` routes.
6. WHEN the role is STAFF THEN system SHALL grant view access to `/quotas` list and detail — no create/edit/delete.
7. WHEN the role is USER or GUEST THEN system SHALL deny access to all `/quotas/**` routes.
8. WHEN the user lacks QUOTAS_MANAGE permission THEN system SHALL hide "New Quota", "Edit", and "Delete" action buttons.

#### Edge Cases

- **Teacher viewing student they don't teach**: 403 forbidden or redirect to their own students list.
- **Parent viewing child not their own**: 403 forbidden.
- **Staff attempting to access create route**: Redirect to list with unauthorized notice.

---

## Requirements Checklist

- [x] All user roles identified and addressed (SUPER_ADMIN, ACADEMY_ADMIN, SUPERVISOR, TEACHER, PARENT, STUDENT, STAFF, USER, GUEST)
- [x] Normal, edge, and error cases covered
- [x] Requirements are testable and measurable
- [x] No conflicting requirements
- [x] EARS format used consistently
- [x] UX/Navigation requirements included (breadcrumbs, cross-linking, mobile nav)
- [x] Accessibility requirements included
- [x] i18n requirements included
- [x] Design system compliance requirements included
- [x] Animation/transition requirements included
- [x] Testing requirements included
- [x] GraphQL cache optimization requirements included
- [x] Role-based access matrix included
