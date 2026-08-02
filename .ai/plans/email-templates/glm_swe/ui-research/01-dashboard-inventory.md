I now have complete, verified coverage of every task. Note the task asked me to write the report to a file path, but my operating rules strictly forbid writing output to files (all findings must be delivered in the response text), and `app/AGENTS.md` also bans summary markdown files. I'll deliver the full exhaustive report below as my response.

# Dashboard UI Inventory — Siraj Email Template Plan

> **Scope note:** I aimed to write this to `.ai/plans/email-templates/glm_swe/ui-research/01-dashboard-inventory.md` as requested, but my operating rules strictly prohibit writing output to files (and `app/AGENTS.md` line 20 also bans summary markdown files). The complete, exhaustive report is delivered inline below. Every claim includes a verified file path + line number.

A key correction up front: the email-template **plan assumes routes live under `app/[locale]/`** (plan §"Frontend" at `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md:832-836` cautiously hedges with "follow existing `(dashboard)` group pattern"), but the **codebase uses `app/(dashboard)/` with locale from a cookie, NOT a `[locale]` URL segment** — confirmed by `app/AGENTS.md:59` ("there is no `[locale]` URL segment under `(dashboard)`") and the route listing (zero `app/[locale]/` dirs exist; all pages sit under `app/(dashboard)/`). The plan's own note at line 832 is correct; any reader assuming `/[locale]/dashboard/email-templates` is wrong.

---

## 1. Navigation & Routing

### What exists today

**Routing group:** `app/(dashboard)/` — the Next.js route group, **not** `app/[locale]/`. ~80 `page.tsx` routes. Full list (segments under the group):

- `/dashboard`, `/billing`, `/billing/invoices`, `/billing/manual`, `/billing/exchange-rates`, `/billing/currency-hedges`, `/billing/currencies`
- `/classes`, `/classes/[id]`, `/classes/[id]/audit`, `/classes/new`
- `/complaints`, `/complaints/manage`
- `/parents`, `/parents/[id]/profile`, `/parents/[id]/profile/edit`, `/parents/[id]/lifecycle`, `/parents/onboarding`, `/parents/me/social`, `/parents/rules`, `/parents/social`
- `/permissions`, `/reports`, `/feedback/manage`
- `/resources`, `/resources/books-and-bags`
- `/schedule/alerts`, `/schedule/tracking`, `/schedule/tracking/reschedule`, `/schedule/tracking/status`, `/schedule/weekly`, `/schedule/future`, `/search-schedule`
- `/students`, `/students/[id]`, `/students/[id]/history`, `/students/[id]/quota`, `/students/[id]/status`, `/students/[id]/profile`, `/students/new`, `/students/onboarding`, `/students/me`, `/students/me/credits`, `/students/me/history`, `/students/me/profile`, `/students/me/sessions`, `/students/history`, `/students/credits`, `/students/sessions`
- `/subjects`, `/subjects/[id]`
- `/suggestions`, `/suggestions/manage`
- `/teachers`, `/teachers/[id]/availability`, `/teachers/[id]/profile`, `/teachers/[id]/reassignment`, `/teachers/[id]/schedule/future`, `/teachers/[id]/schedule/weekly`, `/teachers/dashboard`, `/teachers/onboarding`, `/teachers/me/schedule/weekly`, `/teachers/me/schedule/future`, `/teachers/me/profile`, `/teachers/me/classes`, `/teachers/rules`
- `/tools/dst-migration`, `/users`, `/users/[id]/billing-profile`, `/users/[id]/profile`, `/users/[id]/profile/edit`
- `/profile`, `/settings`
- `/meeting-providers`, `/meeting-providers/create`, `/meeting-providers/edit` ← **closest structural analogue to the planned editor**: a CRUD admin feature with a list page + dedicated create/edit pages.
- `/payment-catalogs`
- `/recurring-schedules/[id]`
- Auth route: `app/(auth)/login/page.tsx` (route group, parallel to `(dashboard)`)

All `page.tsx` paths confirmed via filesystem listing.

**Sidebar / drawer:** `SidebarShell` is the engine at `frontend/common/views/dashboard/components/client/SidebarShell.tsx`. Pattern:
- MUI `Drawer` with `List` / `ListItemButton` / `ListItemIcon` / `ListItemText` (`SidebarShell.tsx:10-22`).
- **Active state**: per-item `isActive` → CSS-var-based `backgroundColor: var(--mui-palette-primaryContainer)`, `color: var(--mui-palette-primary-main)`, `fontWeight: 700` (`SidebarShell.tsx:60-80`).
- **Nesting/collapse**: groups (`NavGroup`) have a header row with a chevron; `Collapse` animates the items under each group (`SidebarShell.tsx:12`).
- **Collapse-rail mode**: `isCollapsed` prop collapses to icon-only (`SidebarShell.tsx:59-65`); stored in `useLayoutStore` (`frontend/common/stores/layoutStore.ts`).
- Links via `Link` from `@shared/i18n` (`SidebarShell.tsx:31`).
- Items pinned to bottom of sidebar via `SIDEBAR_END_NAV_ITEM_KEYS` (`navigationConfig.ts:13`).
- Desktop tier wrapper: `frontend/desktop/views/dashboard/components/sidebar.desktop.tsx:1-55` — injects translated labels via `useNavLabels()` + `useAppTranslation(Translation.Dashboard.CoreNav)`.

**Nav config (the single source of truth):** `frontend/common/views/dashboard/config/navigationConfig.ts`
- `SIDEBAR_NAV_GROUPS: readonly NavGroup[]` (`navigationConfig.ts:44`) — groups: `grp_users`, `grp_schedule`, `grp_content`, `grp_finance`, `grp_reports`, `grp_feedback`, `grp_admin` (+ footer).
- `SIDEBAR_NAV_ITEMS: readonly NavItem[]` (`navigationConfig.ts:130`).
- `BOTTOM_NAV_ITEMS` for mobile (`navigationConfig.ts:511`).
- Permission filter: `getNavItemsForPermissions(...)` (`navigationConfig.ts:789-808`) — **OR semantics** (any one permission in an array grants visibility), matching client `RequirePermission`.
- Types at `frontend/common/views/dashboard/types/dashboard.ts:14-50`:
  - `NavItem { key, labelKey, iconKey, href, section, permission?, audience?, groupId? }` (lines 16-35).
  - `NavGroup { id, labelKey, iconKey?, section, permission?, audience?, defaultCollapsed?, separator? }` (lines 40-50).
- Permissions live in `AppPermission` (`@/backend/enum`) and `PAGE_PERMISSIONS` (`frontend/common/types/page-permissions.types`).

**Top bar (AppBar):** Two-shell pattern.
- Server-rendered chrome: `NavbarStaticShell` (`frontend/common/views/dashboard/components/navbar/NavbarStaticShell.tsx`) — Server Component, AppBar + brand box (logo + app title + role label). Uses CSS-var tokens directly (`var(--mui-palette-headerContainer)`).
- Hydrated client chrome: `NavbarChrome` (`frontend/common/views/dashboard/components/navbar/NavbarChrome.tsx:14-77`) — same visual, `"use client"`, accepts a `rightSlot: ReactNode` and `leftSlot?` for composition (line 11-13).
- **Right slot contents** (matched): `ThemeSwitcher` (`frontend/common/views/dashboard/components/navbar/ThemeSwitcher.tsx`) — dark-mode toggle wired via `useThemeMode()` hook → `toggleTheme()`; `NotificationButton` (`frontend/common/views/dashboard/components/navbar/NotificationButton.tsx`) — opens a notifications drawer via `useNotificationsDrawerStore`. Composed into the mobile layout at `frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx:113`.
- **No global search field in the top bar today** — no match for `GlobalSearch`/`SearchField`/`searchInput` in the top bar. There is a `/search-schedule` route (feature-scoped Schedule search entry), not a global AppBar search.

**Breadcrumbs:** Two layers —
- Component: `Breadcrumbs` rendered inside `DesktopPageHeader` (`frontend/desktop/components/ui/container/page/DesktopPageHeader.tsx:65-103`).
- Auto-generation hook: `usePageBreadcrumbs` (`frontend/common/views/dashboard/lib/usePageBreadcrumbs.ts:52-93`) walks `SIDEBAR_NAV_ITEMS` prefix matches via `buildBreadcrumbsForPath`, filters by permissions, accepts `UsePageBreadcrumbsOptions { currentTitle?, overrides? }` so a ViewModel can inject an entity-detail crumb (`usePageBreadcrumbs.ts:16-37`).
- Breadcrumb type: `PageHeaderBreadcrumb { label, href?, current? }` (`frontend/common/components/ui/container/page/types/pageHeader.types.ts:5-9`).

**Tabs:** Two patterns —
1. **Inline MUI `<Tabs>`** with conditional panels (simple): `paymentCatalogAdmin.desktop.tsx:36-68` — `<Tabs value={activeTab} onChange=...>` + per-tab render. Used for small fixed tab sets.
2. **Lazy-kept tab panels** (permission-gated, lazy, kept-mounted): `PaymentCatalogsTabPanels` (`frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsTabPanels.tsx`) — `TAB_PANELS` array of `{ id, permissions, Component }`, each wrapped in `<RequirePermission>` + `<Suspense>`, kept mounted via a `visitedTabs` Zustand store (`paymentCatalogsTabsStore`) and visibility-toggled per-tab `Box` (`PaymentCatalogsTabPanels.tsx:53-101`). This is the pattern for heavy permission-gated tabbed admin pages.

**Routing convention for nested tabs:** Tabs are **in-page state, NOT separate routes**. The plan's `/dashboard/emails/templates` vs `/dashboard/email-templates` framing does not match the codebase — existing nested resources use a **single route with in-page `<Tabs>` state** (no nested URL segment per tab). `/schedule/tracking/{status,reschedule}` exist as separate routes, but the catalog pages (`/payment-catalogs`, `/meeting-providers`) keep tabs purely in state. The plan's own choice of `/email-templates` (list) + `/email-templates/[id]` (editor) (`plan.md:833-834`) matches the existing convention.

### What is missing for the email template plan
- A nav entry in `SIDEBAR_NAV_ITEMS` for email templates (group `grp_admin` or a new `grp_communications`). Plan does **not** name the nav registration task explicitly — must add it (NEW_PAGE_WORKFLOW.md `Phase 2: Navigation & Permissions` mandates registration in `navigationConfig.ts`).
- A new `AppPermission` key + `PAGE_PERMISSIONS` entry (plan stubs this as `AppPermission.<TBD>` at `plan.md:836`).
- The plan's editor page `/email-templates/[id]` is a **new shape** — the only existing create/edit-page sibling is `/meeting-providers/[create|edit]` (separate routes) and `/classes/new`; there is no single-page "list + editor-by-id" CRUD today. The editor (TipTap) is also a brand-new component class with no precedent (`plan.md:813` flags this).

### Recommended reuse
- **Sidebar entry** → add a `NavItem` to `SIDEBAR_NAV_ITEMS` (`navigationConfig.ts:130`) + matching `NavGroup`; filter via `getNavItemsForPermissions` (no code change needed).
- **List page** → mirror `app/(dashboard)/payment-catalogs/page.tsx` (server guard + Container) and the in-page `<Tabs>` + `PaymentCatalogsTabPanels` lazy-keep-alive pattern if you split Templates vs Logs vs Settings into tabs.
- **In-page tabs** (Templates / Versions / Logs) → reuse `PaymentCatalogsTabPanels.tsx` + `paymentCatalogsTabsStore` shape verbatim (lazy-suspend + permission-gated + kept-mounted).
- **Breadcrumbs** → reuse `usePageBreadcrumbs({ currentTitle, overrides })`; no new breadcrumb component.
- **Top bar** → no change needed; editor mode can stay in the dashboard chrome.

---

## 2. Page Layout Primitives

### What exists today
- **`PageContainer`** is tier-split (no shared component, only shared type): `PageContainerProps { sx?, children }` at `frontend/common/components/ui/container/page/types/pageContainer.types.ts:5-8`.
  - Desktop: `DesktopPageContainer` (`frontend/desktop/components/ui/container/page/DesktopPageContainer.tsx`), exported via `frontend/desktop/components/ui/container/page/index.ts:1-2`.
  - Mobile: `MobilePageContainer` (`frontend/mobile/components/ui/container/page/MobilePageContainer.tsx`), exported via `frontend/mobile/components/ui/container/page/index.ts`.
  - Rule (COMPONENT_PATTERNS.md:46-58): unlocks `theme.layout.sectionGap`; **no outer `p:2/3`** (double-padding with `pageMargin`).
- **`PageHeader`** is tier-split. Shared props `BasePageHeaderProps { title, subtitle?, titleVariant?, breadcrumbs?, actions? }` at `frontend/common/components/ui/container/page/types/pageHeader.types.ts:11-17`.
  - Desktop: `DesktopPageHeader` (`frontend/desktop/components/ui/container/page/DesktopPageHeader.tsx`) — title `variant="headlineLg"` (line 41), title color `theme.palette.primary.main` (line 105), subtitle `bodyLg`/`text.secondary` (lines 108-112). Breadcrumbs auto-generated via `usePageBreadcrumbs(breadcrumbOptions)` when `breadcrumbs` omitted (lines 46-47). `actions` slot renders right-aligned flex (line 114).
  - Mobile: `MobilePageHeader` (`frontend/mobile/components/ui/container/page/MobilePageHeader.tsx`).
- **`SectionPanel`** (shared, viewport-agnostic): `frontend/common/components/ui/container/SectionPanel.tsx`. Props: `id?, title (ReactNode), subTitle?, actions?, children?, edgeToEdge?, sx?` (lines 9-17). Bordered `Paper` with title bar + actions row; body inset unless `edgeToEdge` (lines 38-77).
- **Header-with-breadcrumb + actions usage**: concrete site — `paymentCatalogAdmin.desktop.tsx:25-34`:
  ```tsx
  <DesktopPageContainer>
    <DesktopPageHeader
      title={labels.pageTitle}
      subtitle={labels.pageSubtitle}
      actions={<DesktopPrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>{labels.addEntry}</DesktopPrimaryPageAction>}
    />
  ```
- **Empty state**: `AppDataGridNoRowsOverlay` (`frontend/common/components/ui/dataGrid/AppDataGridNoRowsOverlay.tsx`) wired via `AppDataGrid` `emptyMessage` prop (`AppDataGrid.tsx:23,56-57,73`). Mobile equivalents `MobileAppDataGridNoRowsOverlay`. There is **no standalone page-level EmptyState component** discovered.
- **Error state**: `ErrorState` shared at `frontend/common/components/ui/state/ErrorState.tsx:11-35`. Props `{ message?, onRetry?, retryLabel?, embedded? }`. Uses `useAppTranslation(Translation.Common)` for default `loadFailed` message.
- **Loading state (page)**: `LoadingState` shared at `frontend/common/components/ui/state/LoadingState.tsx` — centered `CircularProgress`. Loading overlay for tables: `AppDataGridLoadingOverlay` / `MobileAppDataGridLoadingOverlay` (wired via `AppDataGrid` `loading` prop, `AppDataGrid.tsx:74`).
- Tab-panel fallback: `TabPanelFallback` (`PaymentCatalogsTabPanels.tsx:45-51`).
- **`BaseCard`**: low-level card wrapper (`frontend/common/components/ui/card/BaseCard.tsx`) — themed radius/padding/border/shadow.

### What is missing for the email template plan
- A **rich editor layout primitive** (two-column: editor pane + property/inspector pane). No existing master-detail / list-detail split-view or inspector pane layout exists in the inventory — the closest is the existing `/classes/[id]` detail page, but it's a vertical stack of cards, not a left/right split editor. The plan's desktop editor layout (`plan.md:800`) — left pane properties + central editor + preview iframe + "Send Test Email" action — needs **a new layout component** or a `SectionPanel`-composed grid.
- No standalone page-level EmptyState (only the DataGrid overlay) — if the template editor needs an empty preview state, you either reuse `AppDataGridNoRowsOverlay` pattern or craft one inside a `SectionPanel`.

### Recommended reuse
- List page → `DesktopPageContainer` + `DesktopPageHeader(title, subtitle, actions)` + `SectionPanel` for the list (COMPONENT_PATTERNS.md architecture).
- Editor page header → `DesktopPageHeader` with `actions` slot for Save / Preview / Send Test (and mobile `MobilePageHeader`).
- Error/loading → shared `ErrorState` + `LoadingState`.
- Empty list → `AppDataGridNoRowsOverlay` via `emptyMessage` prop; empty preview state → `AppDataGridNoRowsOverlay`-style overlay wrapped in a `SectionPanel`.
- Editor body sections (subject, attachment rules, locale/version) → `SectionPanel { title, actions?, children }`.
- List/detail split → **no reusable primitive**; build a new tier-specific two-pane layout (or use the route-based approach: separate `/email-templates` and `/email-templates/[id]` routes per the plan — which the plan already specifies).

---

## 3. Data Display

### What exists today

**`AppDataGrid`** — file: `frontend/common/components/ui/dataGrid/AppDataGrid.tsx`. Full surface:
- Wraps MUI `@mui/x-data-grid` `DataGrid` (`AppDataGrid.tsx:4,61`) — **MUI X DataGrid v9** (`@mui/x-data-grid ^9.10.1`, `package.json:79`).
- `AppDataGridProps<R extends GridValidRowModel>` extends `Omit<DataGridProps, "paginationMode"|"paginationModel"|"onPaginationModelChange"|"rowCount"|"hideFooter"|"pageSizeOptions"|"slots">` plus:
  - `readonly emptyMessage?: string` (line 23)
  - `readonly ariaLabel?: string` (line 24)
  - `readonly paginationOptions: ListPaginationOptions` (**required**) (line 25)
  - `readonly slots?: Omit<...DataGridSlots..., "pagination">` (line 26) — i.e., you **cannot** override the pagination slot.
- **Pagination**: `paginationOptions: ListPaginationOptions` (`frontend/common/components/ui/filter/listPaginationOptions.ts:5-20`) — `false | { mode:"client"; pageSize?; pageSizeOptions? } | { mode:"server"; page; pageSize; totalCount; onPageChange; onPageSizeChange?; pageSizeOptions? }`. Builder `buildServerPaginationOptions(...)` (lines 25-42). Mapped internally via `mapPaginationOptionsToDataGridProps`. Pagination UI owns via `slots.pagination = GridPagination` (`AppDataGrid.tsx:76`).
- **Columns**: standard MUI `GridColDef<R>[]`, passed through `columns`. Filtering & sorting exposed via the underlying MUI DataGrid (`filterable`, `sortable` per column) — no extra abstraction.
- **Row actions**: pattern is a separate column with `renderCell` rendering an `IconButton` (MoreVertOutlined) that opens a `Menu` of `MenuItem`s. Reference impl: `PermissionGroupsDataGridDesktop` (`permissionGroupsDataGrid.desktop.tsx:46-178`) using a `useRowMenuAnchor` hook for the anchor state. Rows identified by `getRowId` (line 182).
- **Empty/loading**: `emptyMessage` → `AppDataGridNoRowsOverlay`; `loading` prop → `AppDataGridLoadingOverlay` (`AppDataGrid.tsx:56-57,73-74`).
- `disableRowSelectionOnClick` hardcoded true (line 62).
- Tier wrappers: `DesktopAppDataGrid`, `MobileAppDataGrid` (exported from tier barrels).

**`MetricCard`** — file: `frontend/common/components/ui/card/MetricCard/MetricCard.tsx`. Props (`MetricCardProps`, lines 17-27):
- `icon: SvgIconComponent`, `label: string`, `value: number | string`, `variant?: MetricCardVariant` (`default|error|highlight|danger|compact`, utils.ts), `subLabel?: string`, `animated?: boolean`, `animationIndex?: number`, `onClick?: () => void`, `sx?`.
- Wrapper variants: `MotionStyledCard` (framer-motion animate-in) if `animated`. Styled subcomponents in `styled.tsx`.
- **Views must NEVER import `MetricCard` directly** (AGENTS.md: CONDITION_PATTERNS + AGENTS.md:195 "Views must never import or render `MetricCard`..."). Use tier grids:
  - Desktop: `DesktopMetricCardGrid` (`frontend/desktop/components/ui/card/MetricCardGrid/DesktopMetricCardGrid.tsx`).
  - Mobile: `MobileMetricCardGrid`.
- Metrics shown today: dashboard home (`MetricCardGrid` at `frontend/common/components/reports/MetricCardGrid.tsx`), schedule overview, class live performance (`LivePerformanceGrid`), per-status counts, billing totals — all via the MetricCardGrid wrappers.

**List / detail split-view:** **None found** as a reusable master-detail primitive. Existing detail pages stack cards vertically (e.g., `/classes/[id]`). The plan's editor page will need its own two-pane layout.

**StatusBadge / tag / chip:**
- `StatusBadge` shared at `frontend/common/components/ui/badge/StatusBadge.tsx`. API: `<StatusBadge category="studentAccount" status={row.accountStatus} label={label} icon={<Icon/>?} />`. Categories table at COMPONENT_PATTERNS.md:157-166 (`studentAccount`, `classSession`, `classStatus`, `sessionTracking`, `trackingStatus`, `session`, `enrollment`). Used intragrid in `permissionGroupsDataGrid.desktop.tsx:140-145` (`<DesktopStatusBadge category="session" status=... label=... />`). Tiered: `DesktopStatusBadge`, `MobileStatusBadge`.
- **No inline `Chip`** for status (AGENTS.md:196 forbids it; COMPONENT_PATTERNS.md:170 "Do not use inline `Chip` with hardcoded colors").
- **Generic tag input** (free-form chip input): `TagInput` at `frontend/common/components/ui/input/tagInput/`; used as a controller render-prop in `CatalogEditDialog.tsx:300-308`. This is the chip/tag primitive — reusable for the email template's "allowed editor groups" chip selector if the items are free-form strings (but for enum-chip selection, an Autocomplete multiple or `ToggleButton` row is more idiomatic — see Gap section).

### What is missing for the email template plan
- A **`StatusBadge category="emailTemplate"`** with statuses (Draft / Published / Archived) — no such category exists. Must be added to `StatusBadge`'s category table (COMPONENT_PATTERNS.md:157-166) and palette mapping (likely reuse `palette.status.active/draft-collapsed/pending`).
- A **multi-select chip / chip-group** for the "allowed editor groups" selector (plan.md:800 — "chip selector from `EmailEditorPermission` enum"). `TagInput` is free-form strings, not enum-chips. Options: MUI `Autocomplete multiple` (per-item + enums), MUI `ToggleButton` row, or a new `EnumChipSelect` primitive. The codebase uses `Autocomplete multiple` for similar but no shared "enum chip group" component exists.
- A **preview pane** (rendered-HTML iframe) wrapper — none exists.

### Recommended reuse
- Template list → `DesktopAppDataGrid<T>` / `MobileAppDataGrid<T>` with `paginationOptions` (server mode via `buildServerPaginationOptions`), `emptyMessage`, `loading`. Columns: name, scope, locale, version, status (via new `StatusBadge` category), lastEditedAt, actions column (copy `PermissionGroupsDataGridDesktop`'s `RowActionsDesktop` + `useRowMenuAnchor` pattern).
- Row actions menu → copy `PermissionGroupsDataGridDesktop.RowActionsDesktop` (`permissionGroupsDataGrid.desktop.tsx:27-78`).
- Metrics (if any on the email template list) → tier `*MetricCardGrid` only (never `MetricCard` directly).
- Status badge → extend shared `StatusBadge` with a new `emailTemplate` category mapping to existing `palette.status.*` tokens.

---

## 4. Forms & Dialogs

### What exists today

**Stack confirmed in `package.json`:**
- `react-hook-form ^7.83.0` (`package.json:154`) ✓
- `@hookform/resolvers ^5.5.7` (`package.json:76`) ✓
- `zod ^4.4.3` (`package.json:167`) ✓
- `@apollo/client ^4.2.9` (`package.json:62`) — `useMutation` from `@apollo/client/react` (no `useLazyQuery` per AGENTS.md).

**Create/edit dialog pattern** — best reference: `frontend/common/views/dashboard/admin/payment-catalogs/components/CatalogEditDialog.tsx` (377 lines). Key conventions:
- Direct `Dialog` + `DialogTitle` + `DialogContent` + `DialogActions` from `@mui/material`, `fullWidth maxWidth="sm"` (line 217). NO shared `FormDialog` wrapper — each feature composes its own `Dialog`.
- `useForm<FormValues>({ defaultValues })` (line 112-114).
- `Controller` + `useWatch` (never `methods.watch()` — NEW_PAGE_WORKFLOW.md:72 React Compiler rule, line 213-214).
- Fields via shared input primitives: `LocalizedStringFormField`, `CountryAutocomplete`, `CurrencySelect`, `TagInput`, `CatalogImageUpload`.
- MUI Material floating labels (`label` prop on `TextField` / `InputLabel` on `Select` per COMPONENT_PATTERNS.md:230-256).
- Form ID convention: `const FORM_ID = "..."; <Stack id={FORM_ID} component="form" onSubmit={e => { e.preventDefault(); void onSubmit(); }}>` (lines 46, 221-228), so the actions `DialogActions` `form={FORM_ID}` can submit.
- Actions shared: `EntityFormDialogActions` (`frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx`) — `formId, cancelLabel, saveLabel, onClose, isLoading` (used at `CatalogEditDialog.tsx:368-374`). This is **the** reusable form-dialog actions bar.
- Mutation dispatch: features use multiple `useMutation` calls and dispatch one, depending on `kind` (lines 99-117, 156-195).
- Form input style exports: `outlinedInputSx`, `timeInputOutlinedSx`, `standardInputSx`, `timeInputStandardSx`, `durationBoxSx`, `labelSx`, `AppDatePicker`, `AppTimePicker` from `@/frontend/common/components/ui/form` (COMPONENT_PATTERNS.md:259-272).

**Confirmation / delete dialog pattern:**
- Shared `BaseDeleteDialog` (`frontend/common/components/ui/dialog/BaseDeleteDialog.tsx:22-81`) — props: `open, onClose, onConfirm, isLoading, title, body, cancelLabel, confirmLabel, confirmSx?`. Error-palette confirm button out of the box.
- Lower-level scaffold `BaseDeleteDialogScaffold` (`frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx`) — accepts `CancelActionButton`/`ConfirmActionButton` slot props for tier-paired buttons.
- Real usage: `CatalogDeleteDialog` (`frontend/common/views/dashboard/admin/payment-catalogs/components/CatalogDeleteDialog.tsx`), `DeleteInvoiceDialog`, `SupportedCurrencyActivateDialog`, `SessionConfigDeleteDialog`, `SiteContentEntryDeleteDialog` (matched at lines listing dialogs).
- **No shared `ConfirmDialog`** — `BaseDeleteDialog` is the only shared confirm primitive (it's delete-themed by default; can be repurposed via `confirmSx` override).

**Validation error display — field-level:** `Controller` `fieldState.error` + `TextField error` + `helperText={fieldState.error?.message}` (`CatalogEditDialog.tsx:234-243`). `LocalizedStringFormField` takes `errorMessage={errors.name?.message}` (line 252). **No notistack.**

**Other dialog presets:** `DialogPresets` (`frontend/common/components/ui/dialog/dialogPresets.ts`) — `.confirm`, `.error`, `.info` (maxWidth sm), `.large` (maxWidth md) as spreadable `DialogProps`.

### What is missing for the email template plan
- A **rich editor (TipTap/React Email)** inside a form — no precedent. The plan's `EmailEditorWrapper.tsx` (`plan.md:803-807`) is the right shape (new file in the common layer centralizing `next/dynamic({ ssr:false })` — itself a **first-in-repo pattern**, flagged by the plan at `plan.md:813`).
- Form validation strategy: react-hook-form + zod is installed but `CatalogEditDialog` uses RHF `rules` not `zodResolver`. The codebase standard is RHF `rules` + notification-based async validation; the plan should match the existing pattern (zod schema optional for `getEmail()` JSON validity check).
- The `@hookform/resolvers` + `zod` pair is installed but adoption is **not universal** — the reference dialog uses native `rules`, so the team's de-facto pattern is "rules + manual async checks". Follow that to avoid divergence.

### Recommended reuse
- Editor form → direct MUI `Dialog` is wrong for the editor page; instead build a page-level form (`<Stack component="form" id={FORM_ID}>`) and compose the editor inside, reusing `EntityFormDialogActions` for the actions row.
- Editor dialog (if Save/Edit uses a dialog) → mirror `CatalogEditDialog.tsx` structurally (RHF + Controller + `LocalizedStringFormField`).
- Delete / unpublish / archive confirm → reuse `BaseDeleteDialog` (+ tiered variant `BaseDeleteDialogScaffold`).
- Field validation → field-level `helperText` (per existing pattern).
- Shared actions → `EntityFormDialogActions`.

---

## 5. Toast / Snackbar / Notifications

### What exists today
- **No Notistack.** The notification system is **`@toolpad/core/useNotifications`** (`@toolpad/core ^0.16.0`, `package.json:97`) — `const notifications = useNotifications(); notifications.show(message, { severity: "error"|"success"|"warning"|"info" })`. Reference: `CatalogEditDialog.tsx:17,96,200-209`.
- **Two custom Snackbars** exist for explicit success/error submit feedback:
  - `FormSuccessSnackbar` (`frontend/common/components/ui/form/snackbar/FormSuccessSnackbar.tsx`) — props `{ open, message, onClose }`; MUI `Snackbar` bottom-center, primary-palette pill.
  - `FormErrorSnackbar` (`frontend/common/components/ui/form/snackbar/FormErrorSnackbar.tsx`).
- Mutation dispatch pattern (from `CatalogEditDialog.onSubmit`, lines 197-211): `try { await executeMutation(formValues); await onSaved(); } catch (error) { logger.error(...); notifications.show(t.saveError, { severity:"error" }); }`. Success path uses `notifications.show(... { severity:"..." })` or the parent's success callback.

### What is missing for the email template plan
- A "preview sent successfully / failed send" toast — directly satisfied by `notifications.show();` no new component.

### Recommended reuse
- Use `useNotifications()` + `notifications.show(message, { severity })` uniformly for the editor's Save / Publish / Send-Test-Email feedback (matches existing pattern).
- For cases needing a persistent explicit toast, `FormSuccessSnackbar` / `FormErrorSnackbar` are available but `notifications.show` is the dominant pattern.

---

## 6. Toolbar / Filter / Search patterns

### What exists today
- **DateNavigator** (`frontend/common/components/ui/filter/DateNavigator.tsx`) — shared date-prev/next/today picker. Props `{ dateValue, todayLabel, previousDayLabel, nextDayLabel, dateLabel?, onDateChange }` (COMPONENT_PATTERNS.md:200-224).
- **Filter presets:** `FilterButton` (`frontend/common/components/ui/button/ActionButtons.tsx:23-41`) — outlined preset used as a filter trigger.
- **Pagination controls:** `PaginationControls` + `GridPagination` (the AppDataGrid slot), and tier siblings `DesktopPaginationControls` / `MobilePaginationControls` (used standalone only for ad-hoc desktop card lists per AGENTS.md).
- **Filter chips (Applied filter chips row):** none found as a generalized "FilterChipRow" typical Audit Toolbar pattern (Audit, reports) use toolbar rows inside SectionsPanel headers rather than chips. (per grep — existing audit filters use inline buttons inside `SectionPanel`).
- **Search field in a toolbar:** **no shared SearchToolbar / filter-chip row component found** — Search input exists scoped: `/search-schedule` route (`app/(dashboard)/search-schedule/page.tsx`) — a feature-scoped search, not a reusable search-bar primitive.
- Date/power utilities: `shiftScheduleFilterDate`, `getTodayScheduleFilterDate`, etc. at `frontend/frontend/utils/scheduleFilterDate`.

### What is missing for the email template plan
- A **list filter toolbar** (search-by-name + filter-by-scope + filter-by-locale). No generalized `FilterToolbar` / "applied filter chips" primitive exists.
- **Date-range picker** for "last modified between X and Y": none. (`AppDatePicker` is a single-date picker.)

### Recommended reuse
- For the email-templates list filter UI:
  - Scope filter → `FilterButton` opening a `Menu` / `Popover` with checkbox list (mirror the audit-page pattern).
  - Text-search → MUI `TextField` with `InputAdornment` (`SearchOutlined`) inside a `SectionPanel.actions` row (compose inline, since no shared SearchToolbar).
  - Locale filter → reuse `LanguageSelector` / `LocalizedStringDisplay` patterns from `frontend/common/components/ui/display/language`. A multi-language flag/select approach (e.g., `LanguageSelector` at `frontend/common/components/ui/input/languageSelector`) is a candidate — verify against its exact API during implementation.
  - Filter chips row → you'll need to compose a small `<Stack direction="row"><FilterButton/>...<Chip/></Stack>` since no chip-row primitive exists.
- Note: filter state belongs in the **Zustand store** (mobile/desktop isolation rule — filters survive viewport switching). The plan already names the store `emailTemplateEditorStore` for editor state (`plan.md:838`); add a separate `emailTemplatesListStore` for list filters (mirror `paymentCatalogsTabsStore`).

---

## 7. Theme & Styling

### What exists today
- **MUI v9 confirmed**: `@mui/material ^9.2.0` (`package.json:78`), `@mui/x-data-grid ^9.10.1`, `@mui/x-date-pickers ^9.10.1`.
- Material 3 palette + theme tokens (THEME_PALETTE.md). Access pattern rules (THEME_PALETTE.md:39-49): **never** `color="primary.main"` strings; **use** `sx={theme => ({ color: theme.palette.primary.main })}`. On\*siblings not `contrastText` (e.g., `palette.onPrimary`, `palette.onSurfaceVariant`). Token registry: `ThemePalette/types.ts` (`frontend/THEME_PALETTE.md` references `frontend/providers/theme/types.ts`).
- **Dark mode toggle**: Yes. Wired via MUI v9 `useColorScheme()` in `AppThemeProvider` → `ColorSchemeStateBridge` (`frontend/common/providers/theme/ThemeProvider.tsx:28-90`). Persistence via `theme-mode` cookie (`setThemePreference`, line 83) + `localStorage` "theme" (line 82) — so SSR first paint matches the cookie. **NOT** Zustand-owned; uses MUI's `useColorScheme`. A `useThemeMode()` hook (`frontend/common/hooks/useThemeMode`) wraps `useColorScheme` for legacy consumers (used by `ThemeSwitcher.tsx:14`).
- Theme tokens for layout: `theme.layout.radius.{card=3, button=2, badge=3}`, `theme.layout.sectionGap=1.5rem`, `theme.layout.cardPadding=1.5rem`, `theme.palette.table.header.{background,text}`, `theme.palette.shadow.card`, `theme.palette.border.{light,main}` (THEME_PALETTE.md "Layout Properties" + COMPONENT_PATTERNS.md:294-307).
- AGENTS.md theme rules (lines 119-127): **NO hardcoded colors, NO hex/rgb/named colors; never delete existing theme values — map them** to `theme.palette.shadow.card` etc. ESLint-enforced.
- MUI v9 prop caveats (`AGENTS.md:174-186`): typography/stack/box/grid shorthand props (`mb`, `alignItems`, `flex`, `component`, etc.) must go in `sx`, not as direct props; `*Outline` → `*Outlined` icons; `Typography` `component` prop invalid.

### What is missing for the email template plan
- Email template HTML theme tokens (the emailed HTML output palette cyan/teal): the plan threads these through the `EmailTheming` plugin (`plan.md:813-822`) — that's **render-time injection, not theme-palette changes**. So no MUI palette additions are needed for the email HTML; do NOT add email colors to `lightPalette.ts`/`darkPalette.ts` (they'd leak into the dashboard chrome). The in-editor chrome uses `--re-*` CSS custom properties (`plan.md:819`) — these are editor-scoped, not MUI palette tokens, but you MUST map them to existing theme values where the plan can (e.g., `--re-bg` → `theme.palette.surface`, `--re-text` → `theme.palette.onSurface`).

### Recommended reuse
- All UI texts/borders/backgrounds → theme callback `sx` + token access per THEME_PALETTE.md.
- Wrap the editor in `ScopedCssBaseline` (MUI v9) — the global `CssBaseline` reset breaks TipTap's prose styling (`plan.md:817`), and the codebase uses the global `CssBaseline` in `AppThemeProvider` (line 3). Importing editor CSS after MUI's CSS is mandatory (`plan.md:817`).
- Dark mode "just works" via the existing provider — no extra wiring for the email template editor.

---

## 8. Permissions / RBAC in UI

### What exists today
- **Client gate component:** `RequirePermission` at `frontend/common/components/auth/RequirePermission.tsx:31-44`. Props: `children, permissions (AppPermission | readonly AppPermission[]), fallback=? (default null)`. Reads `useUserStore().hasPermission(...)`. **OR semantics** for arrays (line 34-35).
- **Server gate helper:** `requirePermissionForPage(userId, permissions[], locale, context)` from `@/backend/lib/auth/require-permission` (used at `payment-catalogs/page.tsx:23-28`). OR semantics. Must be called in every permission-gated `page.tsx` before rendering the Container (`app/AGENTS.md:26-55`).
- Defense-in-depth: server `requirePermissionForPage` in `page.tsx` + client `RequirePermission` in the Container (`PaymentCatalogsPageContainer.tsx:11` wraps the entire view).
- Inside tabbed admin: `RequirePermission` per tab in `PaymentCatalogsTabPanels.tsx:94-98` (line-each tab gated by its own permission slice). `PAGE_PERMISSIONS` (`frontend/common/types/page-permissions.types`) centralizes the permission arrays per page/tab.
- Audience (teacher/parent/student/staff) is keyed via `NavItem.audience` + `RequirePermission`'s sibling gates; Siraj is permission-based, not RBAC-role-based (COMPONENT_PATTERNS.md:326-343 — "audience, not RBAC roles").
- Mutations on the email domain per the plan are additionally gated via GraphQL `authScopes: { superAdmin: true, notImpersonating: true }` (`plan.md:836`) — server-side directive.

### What is missing for the email template plan
- An `AppPermission.<TBD>` enum value (plan stubs it at `plan.md:836`) — must be added to `@/backend/enum` plus a `PAGE_PERMISSIONS` entry.
- Editor-specific permissions — the plan introduces `EmailEditorPermission` enum for "allowed editor groups" (`plan.md:800`). That's a **data model enum** (stored on the template), not a UI gate enum — but it will need a UI equivalent if certain editor actions (Publish, Send-Test, Delete) are themselves gated. The existing `RequirePermission` only knows `AppPermission`. If you need per-editor-action gating, you'll either add `AppPermission.EmailTemplatePublish` etc., or do an inline check against the template's `allowedEditorGroups` list (no shared primitive for that today).

### Recommended reuse
- `page.tsx` → `requirePermissionForPage(userId, [AppPermission.EmailTemplatesManage], locale, context)`. Mirror `payment-catalogs/page.tsx`.
- Container → wrap view in `<RequirePermission permissions={PAGE_PERMISSIONS.emailTemplates} fallback={null}>`. Mirror `PaymentCatalogsPageContainer.tsx`.
- Tab-level gates (if Templates/Logs/Settings are separate tabs) → `RequirePermission` per tab, mirror `PaymentCatalogsTabPanels.tsx:94`.
- "Allowed editor groups" chip selector → new inline check (no shared primitive).

---

## 9. Internationalization in Components

### What exists today
- **`useAppTranslation<TLabels>(handle: NamespaceHandle<TLabels>): TLabels`** — single-arg, synchronous, CLIENT hook. Source: `shared/locale/client/use-app-translation.ts:7-9`. Reads the current locale via `useAppLocale()` then `readTranslation(handle, locale)`.
- Handles are compile-time registered namespace handles (the `Translation` enum at `shared/locale/namespaces/translation.ts`); line lists ~50 handles (iami `DashboardAdmin`, `DashboardCoreNav`, `DashboardPermissions` etc.).
- Exports from `@/shared/locale`: `useAppTranslation`, `Translation` (enum of handles), `useAppLocale`, `getTranslations` (server), `getServerTranslations` (server) (`shared/locale/index.ts:11,18,20,21`).
- **Server translations** (for `page.tsx` metadata + Server Components): `getTranslations(locale).<namespace>Translations` (returns synchronously, not a Promise). `getServerTranslations(locale)` exists too (`shared/locale/server-graphql.ts:3`, single-arg and synchronous per `plan.md:843,867`). The plan uses `getServerTranslations(locale).emailsTranslations.errors.*` for service error messages (`plan.md:867`).
- Already-translated strings are passed as props to client components; client components fetch their own slices via `useAppTranslation(handle)` for chrome strings.

**Concrete usage examples** (client + server):
- Client chrome: `NavbarChrome.tsx:15` — `const t = useAppTranslation(Translation.Dashboard.CoreLayout); ... {t.appTitle}` (line 59).
- Client error state: `ErrorState.tsx:12` — `const tDefault = useAppTranslation(Translation.Common); const displayMessage = message ?? tDefault.loadFailed ?? "";`.
- Client feature nav: `sidebar.desktop.tsx:32` — `const navLabels = useAppTranslation(Translation.Dashboard.CoreNav); ... {navLabels.nav.logout}`.
- Client catalog edit dialog uses `labels` prop (server-supplied strings) at `CatalogEditDialog.tsx:94-95` — `t = labels; t.fields.slug`, `t.errors.slugRequired`. Pattern: feature forms receive already-translated label objects (typed label slices) via the ViewModel/Container rather than fetching themselves. **This matches the plan's `types/label slices` approach** (`plan.md:792` — "label slices (`Pick` from `@/shared/locale/types/...` per Rule 7)").
- Server (in `page.tsx`): `payment-catalogs/page.tsx:12` — `const t = getTranslations(locale).dashboardTranslations.paymentCatalogsParent; return { title: t.pageTitle };`.
- Server (in backend service): `backend/services/communication/templates/email-templates.ts:32` — `getServerTranslations(locale)` (the canonical reference the plan cites at `plan.md:843,878`).

Two-path i18n wiring (plan.md:862-866, verified):
1. Client path: `useAppTranslation(Translation.Emails)` → `defineNamespace` registry at `shared/locale/namespaces/emails/emails.namespace.ts` (handle listed at `shared/locale/namespaces/translation.ts:86,118` per the plan's claim).
2. Server path: `getServerTranslations(locale).emailsTranslations` → `getTranslations(locale)` → `messagesByLocale[locale]` statically imports the same `emailsEn`/`emailsAr` leaf modules.

### What is missing for the email template plan
- The plan already correctly identifies all i18n additions (`plan.md:842-870`): extend `shared/locale/types/emails/index.ts` with a new `errors` sub-namespace and per-scope `SubjectArgs`; update `emailsEn` + `emailsAr` atomically (`plan.md:860` Lockstep rule). The `shared/locale/namespaces/emails/emails.namespace.ts` handle must already exist since the namespace registry reference is at `translation.ts:86`.

### Recommended reuse
- Editor/Container → fetch label slices as a typed object (pass to views via `labels` prop — `Pick<EmailsLabels, ...>`), matching `CatalogEditDialog`/`PaymentCatalogAdminViewModel`.
- View chrome strings → `useAppTranslation(Translation.<handle>)` (e.g., a new `Translation.Emails` handle, or extend `Dashboard*`).
- Server (page metadata) → `getTranslations(locale).dashboardTranslations.<pageKey>.pageTitle`.
- Backend service strings → `getServerTranslations(locale).emailsTranslations.errors.<...>` (single-arg, sync).

---

## Summary — Top 10 findings (with file paths)

1. **Routes live under `app/(dashboard)/`, NOT `app/[locale]/`** — locale comes from a cookie (`getLocale()`); the `[locale]` URL segment does not exist for dashboard. `app/AGENTS.md:59`, `app/(dashboard)/payment-catalogs/page.tsx`. The plan correctly uses `/email-templates` + `/email-templates/[id]` (`plan.md:833-834`).

2. **`AppDataGrid`** (`frontend/common/components/ui/dataGrid/AppDataGrid.tsx`) wraps MUI X DataGrid v9. Required `paginationOptions` (`ListPaginationOptions`, `frontend/common/components/ui/filter/listPaginationOptions.ts`); `emptyMessage`+`loading` props own overlays; `slots.pagination` is non-overridable. Best reference usage: `frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop.tsx:80-189` (columns, `getRowId`, row-actions menu via `useRowMenuAnchor`).

3. **Create/edit dialog pattern** — `frontend/common/views/dashboard/admin/payment-catalogs/components/CatalogEditDialog.tsx`. RHF `useForm`+`Controller`+`useWatch` (never `methods.watch()` per NEW_PAGE_WORKFLOW), MUI `Dialog` directly (no shared `FormDialog`), shared `EntityFormDialogActions` (`frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions.tsx`). Stack installed: `react-hook-form ^7.83`, `@hookform/resolvers ^5.5.7`, `zod ^4.4.3` (`package.json:76,154,167`) but the de-facto validation style is RHF `rules` + manual async checks, not `zodResolver`.

4. **Toast system is `@toolpad/core/useNotifications`** (NOT notistack; `package.json:97`). Pattern: `const notifications = useNotifications(); notifications.show(msg, { severity })` — `CatalogEditDialog.tsx:17,96,200-209`. Also `FormSuccessSnackbar`/`FormErrorSnackbar` for explicit toast UIs (`frontend/common/components/ui/form/snackbar/`).

5. **Topbar + dark mode**: `NavbarStaticShell` (server) + `NavbarChrome` (client, `frontend/common/views/dashboard/components/navbar/NavbarChrome.tsx`) with a `rightSlot`/`leftSlot`. `ThemeSwitcher` (`.../navbar/ThemeSwitcher.tsx`) drives MUI v9 `useColorScheme()` via `AppThemeProvider.ColorSchemeStateBridge` (`frontend/common/providers/theme/ThemeProvider.tsx:28-90`); persisted via `theme-mode` cookie + localStorage. **No global search field in the AppBar** — search is feature-scoped (`/search-schedule`).

6. **Layout primitives:** tier-split `DesktopPageContainer`/`MobilePageContainer` + `DesktopPageHeader`/`MobilePageHeader` (shared `BasePageHeaderProps` at `frontend/common/components/ui/container/page/types/pageHeader.types.ts:11-17`); `SectionPanel` shared (`frontend/common/components/ui/container/SectionPanel.tsx`); auto-breadcrumbs via `usePageBreadcrumbs` (`frontend/common/views/dashboard/lib/usePageBreadcrumbs.ts`); `ErrorState`/`LoadingState` shared (`frontend/common/components/ui/state/`). Concrete header+breadcrumb+actions usage: `frontend/desktop/views/dashboard/admin/payment-catalogs/paymentCatalogAdmin.desktop.tsx:25-34`.

7. **Tabs** — two patterns. Simple inline `<Tabs value=... onChange>` + per-tab conditional render (`paymentCatalogAdmin.desktop.tsx:36-68`). Lazy, permission-gated, kept-mounted tabs via `PaymentCatalogsTabPanels.tsx` + `paymentCatalogsTabsStore` Zustand store + per-tab `<RequirePermission>` + `<Suspense>` + visibility-toggled panels (`PaymentCatalogsTabPanels.tsx:36-101`). Tabs are **in-page state, not nested URL segments**.

8. **StatusBadge** shared `frontend/common/components/ui/badge/StatusBadge.tsx` (`category` prop, fixed category list — `studentAccount|classSession|classStatus|sessionTracking|trackingStatus|session|enrollment`). Email templates need a **new `emailTemplate` category added** (Draft/Published/Archived) — flagged as a gap. Inline `Chip` for status is **forbidden** (COMPONENT_PATTERNS.md:170).

9. **`RequirePermission`** is the only client RBAC gate (`frontend/common/components/auth/RequirePermission.tsx:31-44`, OR-semantics on `AppPermission[]`). Server gate `requirePermissionForPage` in every `page.tsx` (`payment-catalogs/page.tsx:23-28`). Plan stubs `AppPermission.<TBD>` (`plan.md:836`) — must add a real key + `PAGE_PERMISSIONS` entry + nav registration in `SIDEBAR_NAV_ITEMS`.

10. **i18n** — `useAppTranslation<TLabels>(handle): TLabels` (single-arg, sync) at `shared/locale/client/use-app-translation.ts:7-9`; existing email namespace handle already registered at `shared/locale/namespaces/translation.ts:86`. Server: `getTranslations(locale).<ns>Translations` (sync) / `getServerTranslations(locale).<ns>Translations.<key>` (single-arg, sync). The plan's i18n strategy (`plan.md:842-870`) is correct against the codebase — extend `EmailsLabels` with `errors` sub-namespace + per-scope `SubjectArgs`, update `emailsEn`/`emailsAr` atomically (lockstep, `plan.md:860`).

**Other notable gaps for the plan**: (a) no reusable master-detail / list-detail split layout exists (editor two-pane must be new); (b) no shared `FilterToolbar` / applied-filter-chip-row / search-bar primitive (compose inline in `SectionPanel.actions`); (c) no date-range picker — `AppDatePicker` is single-date only; (d) multi-select enum chip selector (for the plan's "allowed editor groups", `plan.md:800`) has no shared primitive — use MUI `Autocomplete multiple` or build a small `ToggleButton`-row; (e) the `next/dynamic({ ssr:false })` in `EmailEditorWrapper.tsx` is a first-in-repo pattern the plan correctly flags (`plan.md:813`) — tier views must import only from that wrapper.

All findings above were verified against actual source in `/home/ahmed/Projects/siraj-mail/`.