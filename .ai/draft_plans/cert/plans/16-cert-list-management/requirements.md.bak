# Plan 16 — Certificate List & Management: Requirements

## Document Info

| Field | Value |
|---|---|
| **Plan #** | 16 |
| **Feature** | Certificate List & Management |
| **Phase** | Phase 4 — Certificate UI (PARALLEL after Plan 5) |
| **Dependencies** | Plan 5 (GraphQL API) |
| **Dependents** | Plan 18 (Certificate Detail & Download — navigation target), Plan 20 (Testing) |
| **Stakeholders** | Admin, Teacher, Student, Parent |
| **Related Docs** | `MASTER_ARCHITECTURE.md` (§22-Plan Structure, §Siraj Three-Location Split), `cgvs_analysis/01-generation-logic.md` (§7 Status Lifecycle, §15 API Surface), `siraj_analysis/05-frontend-patterns.md`, `siraj_analysis/08-app-router-navigation.md`, `siraj_analysis/06-i18n-system.md` |

---

## 1. Introduction

### 1.1 Overview

The Certificate List & Management page is the primary interface for viewing, searching, filtering, and managing certificates in the Siraj certificate system. It provides a paginated table (desktop) and card list (mobile) of all certificates visible to the current user, with role-based scoping, aggregated metrics, bulk actions (revoke, reissue, download, delete), and a revoke workflow with reason input and audit logging. The page follows the established Siraj three-location split pattern: App Router server page → Container + ViewModel → Desktop/Mobile tier views.

### 1.2 Business Value

- **Central certificate management hub**: Admins and teachers need a single place to view all certificates, track their status, and perform lifecycle operations.
- **Role-based access control**: Certificates are scoped by role — admins see all, teachers see their students' certificates, students see their own, parents see their children's.
- **Audit compliance**: Revoke operations are tracked with reasons and timestamps for institutional accountability.
- **Operational efficiency**: Bulk actions allow managing multiple certificates at once (revoke, reissue, download, delete).

### 1.3 Scope

| IN SCOPE | OUT OF SCOPE |
|---|---|
| Certificate list page (table + card list) | Certificate detail page (Plan 18) |
| Search by recipient name, certificate number, verification code (debounced 300ms, server-side FTS) | Single certificate generation flow (Plan 17) |
| Filters: status (5 values), template (dropdown), date range (issue date from/to), recipient name (ILIKE search), category (dropdown) | PDF rendering engine (Plan 6) |
| Page-number offset pagination (1-based page, perPage 10/25/50), matching AppDataGrid server mode | PDF storage & signed URLs (Plan 7) |
| Batch actions: revoke, reissue, re-download (zip), delete — desktop only | Public verification page (Plan 19) |
| Select all on current page (header checkbox), individual row checkboxes | Template management UI (Plans 8-15) |
| Revoke workflow with reason dialog (required field, pluralized for batch) | Certificate categories CRUD (Plan 9) |
| Column configuration (sortable, visible/hidden toggle, session-level persistence) | Cron jobs for expiry (Plan 22) |
| Status badges (StatusBadge category="certificateStatus") and status transition validation | Recipient group management (Plan 14) |
| Zustand store for filter/pagination/sort/selection/column visibility state | Email notifications for revoke |
| GraphQL documents: list query, batch mutations, metrics query, single mutations | Certificate preview / visual editor |
| Role-based data scoping (admin/teacher/student/parent) | Audit trail display (Plan 18) |
| Aggregated metrics (total, issued, revoked, pending, expired, failed) — per-status breakdown | |
| CSV export of filtered certificate list (all pages, ignores pagination) | |
| Generate button (navigates to Plan 17, gated by `certificates.generate`) | |
| Active filter count badge on FilterButton (computed from non-default filters) | |
| Sidebar navigation entry (Certificates group, item, icon workspacePremiumOutlined) | |
| Mobile: horizontal scroll metrics, filter drawer, generate FAB, pull-to-refresh, infinite scroll | |
| i18n: all list labels, status labels, filter labels, dialog labels, batch action labels, pluralization functions | |
| Accessibility: keyboard navigation, ARIA labels, focus management, screen reader announcements | |
| Error states: retry buttons, per-item batch failure dialogs, validation messages | |
| Loading states: skeleton rows, metric card skeletons, batch action loading overlays | |

---

## 2. Requirements (EARS Format)

### 2.1 Certificate List View

**REQ-16.1**: WHEN a user navigates to `/certificates`, THEN the system SHALL display a paginated list of certificates visible to the user based on their role and permissions.

**REQ-16.2**: WHEN the user has `certificates.view` permission, THEN the system SHALL allow access to the certificates page, OTHERWISE the system SHALL redirect to `/dashboard`.

**REQ-16.3**: WHEN the user is a superadmin or admin, THEN the system SHALL display all certificates in the institution.

**REQ-16.4**: WHEN the user is a teacher, THEN the system SHALL display only certificates for students assigned to the teacher (via class/schedule relationships).

**REQ-16.5**: WHEN the user is a student, THEN the system SHALL display only certificates belonging to that student.

**REQ-16.6**: WHEN the user is a parent, THEN the system SHALL display only certificates belonging to the parent's children.

**REQ-16.7**: WHEN the certificate list is displayed on desktop, THEN the system SHALL render a data grid (AppDataGrid) with columns: certificate number (bold), recipient name, template name, issue date (formatted), expiry date (formatted or "—"), status (CertificateStatusBadge small), verification code (with copy button), and row actions context menu (View, Revoke, Reissue, Download, Copy Code, Delete — permission-gated).

**REQ-16.8**: WHEN the certificate list is displayed on mobile, THEN the system SHALL render a card list (MobileCardList) with each card showing: certificate number (bold, primary), recipient name, template name (caption), issue date (caption), status badge (CertificateStatusBadge medium), verification code (caption), and context menu (three dots) with View Details, Revoke, Reissue, Download, Copy Verification Code, Delete.

**REQ-16.9**: WHEN no certificates match the current filters, THEN the system SHALL display an empty state message with the translated label `emptyFilteredMessage` and a "Clear All Filters" button (visible when `activeFilterCount > 0`).

**REQ-16.9a**: WHEN no certificates exist at all in the user's scope, THEN the system SHALL display an empty state with `noCertificatesFound` and a Generate button (if `certificates.generate` permission).

**REQ-16.9b**: WHEN the initial load is in progress, THEN the system SHALL display skeleton rows (AppDataGrid loading overlay on desktop, MobileCardList skeleton cards on mobile) and skeleton metric cards.

**REQ-16.9c**: WHEN a GraphQL error occurs, THEN the system SHALL display an ErrorState component with a retry button that re-fetches the query.

### 2.2 Aggregated Metrics

**REQ-16.10**: WHEN the certificate list page loads, THEN the system SHALL display metric cards (MetricCardGrid) showing: total certificates, issued count, revoked count, pending count, expired count, and failed count — 6 metrics total.

**REQ-16.11**: WHEN filters are applied, THEN the metric counts SHALL reflect the filtered dataset, not the global total.

**REQ-16.11a**: WHEN the metrics query is loading, THEN the system SHALL display skeleton metric cards (MetricCardGrid with skeleton state).

**REQ-16.11b**: WHEN the metrics query fails, THEN the system SHALL display metric cards with "—" placeholders and a retry action.

**REQ-16.11c**: ON desktop, metrics SHALL render in a DesktopMetricCardGrid (responsive Grid layout, max 3 columns on lg, 2 on md, 1 on xs). ON mobile, metrics SHALL render in a MobileMetricCardGrid (horizontal scroll, snap-to-item, overflow-x: auto).

### 2.3 Search

**REQ-16.12**: WHEN the user types a search query, THEN the system SHALL search across certificate number, recipient name, and verification code (server-side full-text search) and filter the list (debounced 300ms). The raw search input updates immediately for responsive UI; the debounced value triggers the Apollo query.

**REQ-16.13**: WHEN the search query is cleared, THEN the system SHALL reset the list to show all certificates (respecting current filters and pagination) — bypassing the debounce for immediate query execution.

**REQ-16.14**: WHEN a search query modifies results, THEN the pagination SHALL reset to page 1.

**REQ-16.14a**: ON desktop, the search field SHALL be part of the inline FilterBar. ON mobile, the search field SHALL be a sticky top bar (MobileSearchBar) with placeholder "Search by number, recipient, or code".

### 2.4 Filters

**REQ-16.15**: WHEN the user opens the filter panel, THEN the system SHALL present filter options for:
- Certificate status (dropdown: All Statuses / Pending / Issued / Revoked / Expired / Failed)
- Template (dropdown populated from published templates via `templates` query, "All Templates" = null)
- Category (dropdown populated from template categories, "All Categories" = null)
- Date range (two date pickers: Issue Date From, Issue Date To — ISO 8601 format)
- Recipient name (text field with server-side ILIKE search, placeholder "Search by recipient name…")

**REQ-16.16**: WHEN the user applies one or more filters, THEN the certificate list SHALL update to show only certificates matching all selected filter criteria (AND logic).

**REQ-16.17**: WHEN the user clears all filters, THEN the system SHALL reset to the default unfiltered list and reset pagination to page 1.

**REQ-16.18**: WHEN filters are applied or cleared, THEN the pagination SHALL reset to page 1.

**REQ-16.18a**: ON desktop, filters SHALL render as an inline FilterBar above the AppDataGrid (all filters visible, no popover). ON mobile, filters SHALL be hidden behind a FilterButton; tapping opens a FilterDrawer (MUI Drawer anchor=bottom) with all filters, Apply and Clear All buttons, closing on apply or backdrop tap.

**REQ-16.18b**: The active filter count SHALL be computed from non-default filter fields: debouncedSearch (non-empty), statusFilter (non-null), templateFilter (non-null), categoryFilter (non-null), recipientName (non-empty), dateFrom/dateTo (non-null). Displayed as a badge on FilterButton; hidden when count is 0.

### 2.5 Pagination

**REQ-16.19**: WHEN the certificate list exceeds the page size, THEN the system SHALL provide page-number offset pagination (1-based page, configurable perPage: 10/25/50), matching AppDataGrid's `mode: "server"` API with `buildServerPaginationOptions`. The response includes `pageInfo: { currentPage, hasMorePages, lastPage, perPage, total }`. Default page size is 10 (matching `DEFAULT_CLIENT_PAGE_SIZE` constant).

**REQ-16.20**: WHEN the user navigates to the next or previous page, THEN the system SHALL load the appropriate page of certificates by updating the `page` parameter in the store (1-based), which triggers a new Apollo query with the updated `page` and `perPage` variables.

**REQ-16.21**: WHEN the user changes the page size, THEN the system SHALL update the number of certificates displayed per page and reset to page 1 (first page).

**REQ-16.21a**: ON mobile, pagination SHALL use infinite scroll — detecting scroll near bottom via IntersectionObserver (or scroll event fallback), calling `setPage(page + 1)` to load next page, appending new cards to existing list. A "Load More" button SHALL be provided as fallback. An end-of-list indicator SHALL show when `!pageInfo.hasMorePages`.

### 2.6 Column Configuration

**REQ-16.22**: WHEN the user accesses column configuration, THEN the system SHALL allow toggling the visibility of each column (certificate number, recipient name, template name, issue date, expiry date, status, verification code, category). Column configuration is desktop-only (AppDataGrid feature).

**REQ-16.23**: WHEN the user clicks a sortable column header, THEN the system SHALL sort the certificate list by that column in ascending or descending order, with the sort applied server-side. Sortable columns: certificate number, recipient name, template name, issue date, expiry date, status. Non-sortable: verification code, row actions.

**REQ-16.24**: WHEN the user configures columns, THEN the column configuration SHALL persist in the Zustand store (surviving tier switching on resize) but is NOT persisted to local storage (session-level only).

**REQ-16.24a**: Column default visibility: all columns visible by default. Column widths: certificateNumber (medium), recipientName (medium), templateName (medium), issueDate (narrow), expiryDate (narrow), status (narrow), verificationCode (medium), category (medium), rowActions (narrow).

### 2.7 Bulk Actions

**REQ-16.25**: WHEN the user selects one or more certificates via the data grid checkbox column (desktop), THEN the system SHALL display a BatchOperationsBar with: Revoke, Reissue, Re-download (zip), Delete actions. On mobile, batch operations are NOT displayed — individual actions are accessed via card context menu (three dots).

**REQ-16.26**: WHEN the user has `certificates.manage` permission, THEN the BatchOperationsBar SHALL display Reissue, Re-download, and Delete actions.

**REQ-16.27**: WHEN the user has `certificates.revoke` permission, THEN the bulk action toolbar SHALL display the Revoke action.

**REQ-16.28**: WHEN the user initiates a batch Download action, THEN the system SHALL request a zip archive of selected issued certificates from the backend, download the zip to the client, and display a success toast. If any selected certificate is not in `issued` status, the Download button SHALL be disabled.

**REQ-16.29**: WHEN selected certificates have mixed statuses, THEN the system SHALL disable bulk actions that are not valid for all selected items:
- Revoke disabled if NO selected certificate has status `issued` or `pending` (i.e., all are `revoked`, `expired`, or `failed`), or if `!canRevoke`
- Reissue disabled if NO selected certificate has status `revoked` or `expired` (i.e., all are `pending`, `issued`, or `failed`), or if `!canManage`
- Re-download disabled if NO selected certificate has status `issued`
- Delete disabled if NO selected certificate has status `failed`, or if `!canManage`

**REQ-16.30**: WHEN the user initiates a bulk action, THEN the system SHALL show a confirmation dialog listing the count of affected certificates and the action to be performed, before executing. Pluralized count via `bulkActions.confirmCount(count)`.

**REQ-16.30a**: Select all (header checkbox) SHALL select all IDs on the current page only (server-side select-all across all pages is out of scope). Deselect all SHALL clear the entire selection.

**REQ-16.30b**: Each disabled batch action button SHALL show a tooltip explaining why it's disabled (e.g., "Selected certificates must have status: issued or pending to revoke").

### 2.8 Revoke Workflow

**REQ-16.31**: WHEN the user clicks "Revoke" (single or bulk), THEN the system SHALL open a revoke confirmation dialog (MUI Dialog) with a required reason text field (multiline).

**REQ-16.32**: WHEN the user submits the revoke dialog without a reason, THEN the system SHALL display a validation error: `revokeDialog.reasonRequired`.

**REQ-16.33**: WHEN the user confirms the revoke dialog with a valid reason, THEN the system SHALL:
1. Update each certificate's status from `issued` or `pending` to `revoked`.
2. Log the revocation with reason, user ID, and timestamp in the audit trail.
3. Display a success message: `messages.revokeSuccess`.
4. Refresh the certificate list (refetch Apollo queries).
5. Clear selection (for batch revoke).

**REQ-16.34**: WHEN a revoke operation fails for a certificate (e.g., already revoked, or status transition not allowed), THEN the system SHALL display the translated error message and skip that certificate in the batch, continuing with others. After batch completion, per-item failures SHALL be shown in a results dialog.

**REQ-16.35**: WHEN a certificate is in `failed` status, THEN the system SHALL NOT allow revocation (failed certificates should be reissued or deleted instead).

**REQ-16.35a**: WHEN the revoke dialog opens for batch, THEN the dialog title SHALL be `revokeDialog.bulkTitle` and SHALL show the count of certificates to be revoked. WHEN the revoke dialog opens for a single certificate, THEN the dialog title SHALL be `revokeDialog.title`.

### 2.9 Status Management

**REQ-16.36**: WHEN a certificate is displayed in the list, THEN the system SHALL render a status badge (StatusBadge with `category="certificateStatus"`) with a color based on the certificate status:
- `pending` → warning color (amber/yellow)
- `issued` → success color (green)
- `revoked` → error color (red)
- `expired` → default/disabled color (grey)
- `failed` → error color (distinct shade from revoked — dark red)

**REQ-16.37**: WHEN the grid data loads, THEN the system SHALL validate that certificates transitioning to `revoked` came from `issued` or `pending` state, and `expired` is only set by the cron job (Plan 22), as enforced by the backend service layer. Valid transitions: pending→issued, pending→failed, issued→revoked, issued→expired, failed→pending, revoked→pending.

**REQ-16.37a**: WHEN a status badge is rendered, THEN the system SHALL use the `StatusBadge` component with `category="certificateStatus"` (new category to be registered in `shared/constants/certificateStatus.config.ts`). Badge size: small on desktop grid, medium on mobile cards.

**REQ-16.37b**: THE system SHALL NOT display a "draft" status — the certificate status enum is: `pending`, `issued`, `revoked`, `expired`, `failed` (per INTER_PLAN_CONTRACTS.md). No draft state exists.

### 2.10 Navigation

**REQ-16.38**: WHEN the user clicks a certificate row (desktop grid) or card (mobile), THEN the system SHALL navigate to `/certificates/[id]` (Plan 18 — Certificate Detail). Row click SHALL NOT conflict with checkbox selection (`disableRowSelectionOnClick` in AppDataGrid).

**REQ-16.39**: WHEN the sidebar navigation is rendered, THEN the system SHALL display a "Certificates" item in the content group, gated by `certificates.view` permission, with icon `workspacePremiumOutlined` (MUI v9 naming: Outlined suffix).

**REQ-16.40**: WHEN the bottom navigation (mobile) is rendered, THEN the system SHALL display "Certificates" as a bottom nav item for roles that have `certificates.view` permission (admin and teacher; student and parent bottom nav may omit if items exceed limits). Bottom nav is hidden if total items exceed 5 (prioritized for admin/teacher dashboards).

**REQ-16.40a**: BREADCRUMBS SHALL display: Home → Certificates.

### 2.11 Permission & Role Matrix

**REQ-16.41**: WHEN the user has `certificates.view` permission, THEN the system SHALL allow read-only access to the certificate list (view, search, filter, sort, paginate, download issued certificates, export CSV).

**REQ-16.42**: WHEN the user has `certificates.manage` permission, THEN the system SHALL additionally allow: reissue (single + batch), delete (failed certificates only, single + batch), and batch re-download (zip download of selected issued certificates).

**REQ-16.43**: WHEN the user has `certificates.revoke` permission, THEN the system SHALL additionally allow: revoke single and bulk revoke operations.

**REQ-16.44**: WHEN the user is a teacher, THEN the system SHALL display "Reissue" action only for certificates of students in the teacher's classes (not all certificates). "Delete" action only for failed certificates of their students.

**REQ-16.44a**: THE permission names (canonical from INTER_PLAN_CONTRACTS.md): `certificates.view` (AppPermission.CertView), `certificates.manage` (AppPermission.CertManage), `certificates.generate` (AppPermission.CertGenerate), `certificates.revoke` (AppPermission.CertRevoke). The "CERTIFICATES_REVOKE" old naming is deprecated — use `certificates.revoke`.

**REQ-16.44b**: THE "Generate" button SHALL be gated by `certificates.generate` permission (Plan 17 — Certificate Generation). On desktop: PrimaryPageAction in PageHeader. On mobile: GenerateFAB (floating action button, bottom-right). Both navigate to Plan 17 generation dialog.

### 2.12 Error Handling

**REQ-16.45**: WHEN the GraphQL query fails to load the certificate list, THEN the system SHALL display an error state with a retry button (ErrorState component) that re-fetches the query when clicked.

**REQ-16.46**: WHEN a bulk action mutation fails, THEN the system SHALL display which certificates failed and which succeeded, with the error message per failed item (BatchResultDialog with per-item error details).

**REQ-16.47**: WHEN a certificate status transition is invalid (e.g., revoking a failed certificate), THEN the system SHALL display the translated error: `errors.invalidStatusTransition`.

**REQ-16.47a**: WHEN a single mutation fails (revoke, reissue, delete), THEN the system SHALL display an error snackbar with the translated error message and rollback any optimistic update.

**REQ-16.47b**: WHEN the export CSV request fails, THEN the system SHALL display an error toast: `errors.exportFailed`.

**REQ-16.47c**: WHEN the re-download (zip) request fails, THEN the system SHALL display an error toast: `errors.redownloadFailed`.
**REQ-16.47e**: WHEN a bulk download includes certificates whose PDF is missing (issued but fileUrl is null or stale), THEN the batch result SHALL include per-item errors with code `PDF_NOT_FOUND` and message `errors.pdfMissing`.
**REQ-16.47d**: WHEN the copy verification code action fails, THEN the system SHALL display an error toast: `errors.copyFailed` (if defined, else generic error).

### 2.13 Loading States

**REQ-16.48**: WHEN the certificate list is loading initially, THEN the system SHALL display a loading overlay in the data grid (AppDataGrid loading overlay) and skeleton metrics cards (MetricCardGrid skeleton).

**REQ-16.49**: WHEN a bulk action is in progress, THEN the system SHALL disable the action button and display a loading indicator (spinner on the active button, BatchOperationsBar overlay).

**REQ-16.49a**: WHEN paginating (page change), THEN the system SHALL show the AppDataGrid loading overlay (not full-page skeleton) to maintain context.

**REQ-16.49b**: WHEN pull-to-refresh is triggered (mobile), THEN the system SHALL show a refresh indicator at the top of the list.

**REQ-16.49c**: WHEN infinite scroll loads the next page (mobile), THEN the system SHALL show a "Loading more..." indicator at the bottom of the list.

### 2.13a Accessibility Requirements

**REQ-16.49d**: ALL interactive elements SHALL be keyboard accessible (Tab navigation, Enter/Space activation). Focus order SHALL follow visual order.

**REQ-16.49e**: ALL form fields (search, filters, revoke reason) SHALL have associated labels (visible or aria-label). Search input SHALL have `aria-label="Search certificates"`.

**REQ-16.49f**: Status badges SHALL have accessible names via `aria-label` or `role="status"` with text content.

**REQ-16.49g**: BatchOperationsBar SHALL have `role="toolbar"` with `aria-label="Batch actions"`. Disabled buttons SHALL have `aria-disabled="true"` and tooltip explaining why disabled.

**REQ-16.49h**: Pagination controls SHALL have `aria-label` for "Go to page X", "Next page", "Previous page".

**REQ-16.49i**: FilterButton badge SHALL have `aria-label` like "2 active filters". Clear All button SHALL have `aria-label="Clear all filters"`.

**REQ-16.49j**: Mobile filter drawer SHALL trap focus when open, restore focus to FilterButton on close.

**REQ-16.49k**: Revoke dialog SHALL be modal with `aria-modal="true"`, focus trapped, initial focus on reason text field, Escape key closes dialog.

**REQ-16.49l**: Color contrast SHALL meet WCAG AA (4.5:1 for text, 3:1 for UI elements). Status badge colors SHALL not be the sole indicator — text label always present.

**REQ-16.49m**: Screen reader announcements: on filter change, announce "Results updated, X certificates found". On batch action, announce "X certificates revoked successfully" or failure details.

### 2.14 Outcome Knowledge Base & Progress Tracking

**REQ-16.50**: WHEN this plan is implemented, THEN the implementer SHALL record key decisions, unexpected challenges, and verified patterns in the outcome knowledge base so future plans (17-19) can reference them.

### 2.15 Export & Re-download

**REQ-16.51**: WHEN the user has `certificates.view` permission and clicks the ExportButton, THEN the system SHALL export the currently filtered certificate list as a CSV file with columns: certificateNumber, recipientName, templateName, issueDate, expiryDate, status, verificationCode. The export respects all active filters but ignores pagination (exports all matching rows).

**REQ-16.52**: WHEN the user clicks "Re-download" (single or batch) on issued certificates, THEN the system SHALL request a zip archive containing the PDF files for those certificates from the backend, and trigger a browser download of the zip.

**REQ-16.53**: WHEN the export or re-download request fails, THEN the system SHALL display an error toast with the translated error message.

### 2.16 Generate Button Integration

**REQ-16.54**: WHEN the user has `certificates.generate` permission, THEN the PageHeader SHALL display a "Generate" PrimaryPageAction button that, when clicked, navigates to the certificate generation flow (Plan 17 — Certificate Generation Dialog).

### 2.17 Active Filter Count & Clear All

**REQ-16.55**: WHEN one or more filters are active (search, status, template, date range, recipient), THEN the FilterButton SHALL display a badge with the count of active filters.

**REQ-16.56**: WHEN the user clicks "Clear All Filters", THEN the system SHALL reset all filters to their default values, reset the search query, and reset pagination to page 1.

### 2.18 Mobile-Specific Requirements

**REQ-16.57**: WHEN the certificate list is displayed on mobile, THEN the system SHALL display metrics as a horizontally scrollable row of MetricCards (MobileMetricCardGrid) above the certificate list.

**REQ-16.58**: WHEN the certificate list is displayed on mobile, THEN the system SHALL display a sticky search bar at the top of the view, with a FilterButton that opens a filter drawer (SwipeableDrawer anchor bottom).

**REQ-16.59**: WHEN the user has `certificates.generate` permission and is viewing the mobile certificate list, THEN the system SHALL display a floating action button (FAB) for "Generate" in the bottom-right corner.

**REQ-16.60**: WHEN the user pulls down on the mobile certificate list at the top scroll position, THEN the system SHALL trigger a pull-to-refresh that refetches the certificate list and metrics from the Apollo cache.

**REQ-16.61**: WHEN the user scrolls to the bottom of the mobile certificate list and more pages exist (`pageInfo.hasMorePages === true`), THEN the system SHALL automatically load the next page of certificates (infinite scroll), appending results to the existing list.

---

## 3. i18n Requirements

### 3.1 Namespace

All certificate list translation keys live under the `certificates` namespace. The list page uses a `list` sub-domain.

- **Client namespace handle**: `Translation.Dashboard.CertificateList` (namespace id: `"dashboard.certificates.list"`)
- **Server bundle key**: `dashboardTranslations.certificateList`
- **Type file**: `shared/locale/types/dashboard/certificates/list.ts`
- **AR implementation**: `shared/locale/ar/dashboard/certificates/list.ts`
- **EN implementation**: `shared/locale/en/dashboard/certificates/list.ts`
- **Namespace handle**: `shared/locale/namespaces/dashboard/certificates/list.namespace.ts`

### 3.2 Translation Keys — List Page Labels

| Key | Type | EN (sample) | AR (sample) |
|---|---|---|---|
| `pageTitle` | string | "Certificates" | "الشهادات" |
| `pageSubtitle` | string | "Manage and track all certificates" | "إدارة وتتبع جميع الشهادات" |
| `searchPlaceholder` | string | "Search by recipient, ID, or verification code" | "ابحث بالاسم أو الرقم أو رمز التحقق" |
| `noCertificatesFound` | string | "No certificates found" | "لا توجد شهادات" |
| `emptyFilteredMessage` | string | "No certificates match the current filters" | "لا توجد شهادات مطابقة للمرشحات الحالية" |
| `showingOf` | (shown: number, total: number) => string | "Showing {shown} of {total}" | "عرض {shown} من {total}" |
| `selectedCount` | (count: number) => string | "{count} selected" | "{count} محدد" (pluralized) |

### 3.3 Translation Keys — Metrics

| Key | Type | EN | AR |
|---|---|---|---|
| `metrics.total` | string | "Total Certificates" | "إجمالي الشهادات" |
| `metrics.issued` | string | "Issued" | "صادرة" |
| `metrics.revoked` | string | "Revoked" | "ملغاة" |
| `metrics.pending` | string | "Pending" | "قيد الانتظار" |
| `metrics.expired` | string | "Expired" | "منتهية الصلاحية" |
| `metrics.failed` | string | "Failed" | "فاشلة" |

### 3.4 Translation Keys — Status Labels

| Key | Type | EN | AR |
|---|---|---|---|
| `status.pending` | string | "Pending" | "قيد الانتظار" |
| `status.issued` | string | "Issued" | "صادرة" |
| `status.revoked` | string | "Revoked" | "ملغاة" |
| `status.expired` | string | "Expired" | "منتهية الصلاحية" |
| `status.failed` | string | "Failed" | "فاشلة" |

### 3.5 Translation Keys — Table Columns

| Key | Type | EN | AR |
|---|---|---|---|
| `table.certificateNumber` | string | "Certificate Number" | "رقم الشهادة" |
| `table.recipientName` | string | "Recipient" | "المستلم" |
| `table.templateName` | string | "Template" | "القالب" |
| `table.issueDate` | string | "Issue Date" | "تاريخ الإصدار" |
| `table.expiryDate` | string | "Expiry Date" | "تاريخ الانتهاء" |
| `table.status` | string | "Status" | "الحالة" |
| `table.verificationCode` | string | "Verification Code" | "رمز التحقق" |
| `table.actions` | string | "Actions" | "إجراءات" |
| `table.category` | string | "Category" | "التصنيف" |
| `table.download` | string | "Download" | "تحميل" |
| `table.view` | string | "View" | "عرض" |
| `tablesortBy.certificateNumber` | string | "Certificate Number" | "رقم الشهادة" |
| `tableSortBy.issueDate` | string | "Issue Date" | "تاريخ الإصدار" |
| `tableSortBy.expiryDate` | string | "Expiry Date" | "تاريخ الانتهاء" |
| `tableSortBy.recipientName` | string | "Recipient Name" | "اسم المستلم" |
| `tableSortBy.status` | string | "Status" | "الحالة" |

### 3.6 Translation Keys — Filter Labels

| Key | Type | EN | AR |
|---|---|---|---|
| `filters.title` | string | "Filters" | "المرشحات" |
| `filters.status` | string | "Status" | "الحالة" |
| `filters.template` | string | "Template" | "القالب" |
| `filters.category` | string | "Category" | "التصنيف" |
| `filters.recipient` | string | "Recipient" | "المستلم" |
| `filters.recipientPlaceholder` | string | "Search by recipient name…" | "البحث باسم المستلم…" |
| `filters.dateRange` | string | "Date Range" | "النطاق الزمني" |
| `filters.fromDate` | string | "From" | "من" |
| `filters.toDate` | string | "To" | "إلى" |
| `filters.clearAll` | string | "Clear All" | "مسح الكل" |
| `filters.apply` | string | "Apply Filters" | "تطبيق المرشحات" |
| `filters.allStatuses` | string | "All Statuses" | "جميع الحالات" |
| `filters.allTemplates` | string | "All Templates" | "جميع القوالب" |
| `filters.allCategories` | string | "All Categories" | "جميع التصنيفات" |
| `filters.activeCount` | (count: number) => string | pluralized "1 active filter" / "{count} active filters" | pluralized |

### 3.7 Translation Keys — Bulk Action Labels

| Key | Type | EN | AR |
|---|---|---|---|
| `bulkActions.revoke` | string | "Revoke" | "إلغاء" |
| `bulkActions.reissue` | string | "Reissue" | "إعادة الإصدار" |
| `bulkActions.redownload` | string | "Re-download (ZIP)" | "إعادة التنزيل (ZIP)" |
| `bulkActions.delete` | string | "Delete" | "حذف" |
| `bulkActions.confirmTitle` | string | "Confirm Batch Action" | "تأكيد الإجراء" |
| `bulkActions.confirmCount` | (count: number) => string | "{count} certificate(s) will be affected" | pluralized |
| `bulkActions.confirmRevoke` | string | "Revoke selected certificates?" | "إلغاء الشهادات المحددة؟" |
| `bulkActions.confirmReissue` | string | "Reissue selected certificates?" | "إعادة إصدار الشهادات المحددة؟" |
| `bulkActions.confirmDelete` | string | "Delete selected failed certificates?" | "حذف الشهادات الفاشلة المحددة؟" |
| `bulkActions.confirmRedownload` | string | "Download selected certificates as ZIP?" | "تنزيل الشهادات المحددة كملف ZIP؟" |
| `bulkActions.deselectAll` | string | "Deselect All" | "إلغاء تحديد الكل" |
| `bulkActions.selectedCount` | (count: number) => string | pluralized "1 selected" / "{count} selected" | pluralized |
| `bulkActions.cancel` | string | "Cancel" | "إلغاء" |
| `bulkActions.confirm` | string | "Confirm" | "تأكيد" |

### 3.8 Translation Keys — Revoke Dialog

| Key | Type | EN | AR |
|---|---|---|---|
| `revokeDialog.title` | string | "Revoke Certificate" | "إلغاء الشهادة" |
| `revokeDialog.bulkTitle` | string | "Revoke Certificates" | "إلغاء الشهادات" |
| `revokeDialog.reasonLabel` | string | "Reason for revocation" | "سبب الإلغاء" |
| `revokeDialog.reasonPlaceholder` | string | "Enter the reason for revocation" | "أدخل سبب الإلغاء" |
| `revokeDialog.reasonRequired` | string | "A reason is required to revoke a certificate" | "السبب مطلوب لإلغاء الشهادة" |
| `revokeDialog.warning` | string | "Revoking a certificate will mark it as invalid. This action can be audited." | "إلغاء الشهادة سيؤدي إلى وضع علامة أنها غير صالحة. يمكن تدقيق هذا الإجراء." |
| `revokeDialog.cancel` | string | "Cancel" | "إلغاء" |
| `revokeDialog.confirm` | string | "Revoke" | "إلغاء" |

### 3.9 Translation Keys — Column Configuration

| Key | Type | EN | AR |
|---|---|---|---|
| `columnConfig.title` | string | "Configure Columns" | "تكوين الأعمدة" |
| `columnConfig.showHide` | string | "Show / Hide Columns" | "إظهار / إخفاء الأعمدة" |
| `columnConfig.reset` | string | "Reset to Default" | "إعادة للافتراضي" |
| `columnConfig.done` | string | "Done" | "تم" |

### 3.10 Translation Keys — Row Actions & Errors

| Key | Type | EN | AR |
|---|---|---|---|
| `actions.viewDetail` | string | "View Details" | "عرض التفاصيل" |
| `actions.revoke` | string | "Revoke" | "إلغاء" |
| `actions.reissue` | string | "Reissue" | "إعادة إصدار" |
| `actions.download` | string | "Download" | "تنزيل" |
| `actions.redownload` | string | "Re-download" | "إعادة التنزيل" |
| `actions.delete` | string | "Delete" | "حذف" |
| `actions.export` | string | "Export CSV" | "تصدير CSV" |
| `actions.copyVerificationCode` | string | "Copy Verification Code" | "نسخ رمز التحقق" |
| `errors.loadFailed` | string | "Failed to load certificates" | "فشل تحميل الشهادات" |
| `errors.revokeFailed` | string | "Failed to revoke certificate" | "فشل إلغاء الشهادة" |
| `errors.invalidStatusTransition` | string | "Invalid status transition" | "انتقال حالة غير صالح" |
| `errors.reissueFailed` | string | "Failed to reissue certificate" | "فشل إعادة إصدار الشهادة" |
| `errors.deleteFailed` | string | "Failed to delete certificate" | "فشل حذف الشهادة" |
| `errors.redownloadFailed` | string | "Failed to re-download certificates" | "فشل إعادة تنزيل الشهادات" |
| `errors.exportFailed` | string | "Failed to export certificates" | "فشل تصدير الشهادات" |
| `errors.pdfMissing` | string | "Certificate PDF not found or not generated" | "ملف PDF للشهادة غير موجود أو لم يتم إنشاؤه" |
| `errors.noPermission` | string | "You do not have permission to perform this action" | "ليس لديك صلاحية لتنفيذ هذا الإجراء" |
| `messages.revokeSuccess` | string | "Certificate(s) revoked successfully" | "تم إلغاء الشهادة/الشهادات بنجاح" |
| `messages.reissueSuccess` | string | "Certificate(s) reissued successfully" | "تمت إعادة إصدار الشهادة/الشهادات بنجاح" |
| `messages.deleteSuccess` | string | "Certificate(s) deleted successfully" | "تم حذف الشهادة/الشهادات بنجاح" |
| `messages.redownloadSuccess` | string | "Certificate(s) download started" | "بدأ تنزيل الشهادة/الشهادات" |
| `messages.exportSuccess` | string | "Export started" | "بدأ التصدير" |

### 3.11 Arabic Pluralization Rules

For `selectedCount` and `bulkActions.confirmCount`:

| Count Range | Arabic Form | EN Form |
|---|---|---|
| 0 | `zero` | `other` ("0 certificates") |
| 1 | `one` | `one` ("1 certificate") |
| 2 | `two` | `other` ("2 certificates") |
| 3-10 | `few` | `other` (e.g., "3 certificates") |
| 11-99 | `many` | `other` |
| 100+ | `other` | `other` |

Implementation: `(count: number) => string` function with `count` param, returning the appropriate pluralized string in each locale file.

### 3.12 Interpolation Parameters

| Key | Params | Type |
|---|---|---|
| `showingOf` | `(shown: number, total: number)` | positional |
| `selectedCount` | `(count: number)` | positional + pluralized |
| `bulkActions.confirmCount` | `(count: number)` | positional + pluralized |
| `filters.activeCount` | `(count: number)` | positional + pluralized |
| `bulkActions.selectedCount` | `(count: number)` | positional + pluralized |

---

## 4. Acceptance Criteria

### AC-16.1: Certificate List Display
- Given a user with `certificates.view` permission, when they navigate to `/certificates`, then a paginated list of certificates is displayed in the appropriate tier (AppDataGrid on desktop, MobileCardList on mobile) with all configured columns.

### AC-16.2: Role-Based Scoping
- Given a teacher user, when they view the certificate list, then only certificates belonging to their students are visible.
- Given a student user, when they view the certificate list, then only their own certificates are visible.
- Given a parent user, when they view the certificate list, then only certificates for their children are visible.

### AC-16.3: Search Functionality
- Given certificates exist, when the user types a search query matching a recipient name, certificate number, or verification code, then only matching certificates are displayed, and pagination resets to page 1.

### AC-16.4: Filter Application
- Given certificates with various statuses, when the user filters by "issued" status, then only issued certificates are displayed.
- Given certificates with various issue dates, when the user filters by a date range, then only certificates within that range are displayed.
- Given the user enters a recipient name filter, then only certificates matching that recipient name are displayed.

### AC-16.5: Pagination
- Given more certificates than the page size, when the user navigates to page 2, then the correct page of certificates is loaded using page-number offset pagination (1-based page, perPage, server-side `mode: "server"`).

### AC-16.6: Batch Actions — Revoke
- Given the user selects 3 issued certificates and has `certificates.revoke` permission, when they click "Revoke" and provide a reason, then all 3 certificates are marked as revoked with the reason logged.

### AC-16.7: Batch Actions — Delete (Failed)
- Given the user selects 2 failed certificates and has `certificates.manage` permission, when they click "Delete" and confirm, then both certificates are soft-deleted.

### AC-16.8: Invalid Batch Action Guard
- Given the user selects certificates with mixed statuses (1 issued, 1 failed), when they attempt to batch revoke, then the revoke action is disabled because failed certificates cannot be revoked.

### AC-16.9: Revocation Validation
- Given a revoke dialog is open, when the user submits without entering a reason, then a validation error is displayed and the revocation does not proceed.

### AC-16.10: Column Configuration
- Given the certificate grid is displayed, when the user hides the "Verification Code" column, then that column is hidden and the choice persists during the session (survives tier switching on resize).

### AC-16.11: Mobile Card List
- Given a mobile viewport, when the certificate list is displayed, then each certificate appears as a card with recipient name, template name, status badge, issue date, and verification code.

### AC-16.12: Navigation to Detail
- Given a certificate is displayed in the list, when the user clicks the row or card, then they are navigated to `/certificates/[id]`.

### AC-16.13: Error State
- Given the GraphQL query fails, when the certificate list fails to load, then an error state with a retry button is displayed.

### AC-16.14: Loading State
- Given the certificate list is loading, when the initial load is in progress, then the grid shows a loading overlay and metric cards show skeleton state.

### AC-16.15: i18n — All Labels Translated
- Given a non-English locale (Arabic), when the certificate list page is displayed, then all labels (page title, column headers, status badges, filter labels, dialog labels, action buttons, batch action bar, metric cards) are displayed in Arabic with correct pluralization.

### AC-16.16: Permission Gating
- Given a user without `certificates.view` permission, when they attempt to access `/certificates`, then they are redirected to `/dashboard`.
- Given a user with only `certificates.view` (no manage/revoke), when they view the list, then batch action buttons for revoke/reissue/delete are not shown.

### AC-16.17: Sidebar Navigation
- Given a user with `certificates.view` permission, when the sidebar renders, then a "Certificates" nav item is visible in the content group.

### AC-16.18: Metrics Display
- Given certificates exist across statuses, when the list page loads, then metric cards (DesktopMetricCardGrid on desktop, MobileMetricCardGrid with horizontal scroll on mobile) show counts for total, issued, revoked, pending, expired, and failed certificates, filtered to the user's scope and any active filters.

### AC-16.19: CSV Export
- Given a filtered certificate list, when the user with `certificates.view` permission clicks the Export button, then a CSV file is generated containing all certificates matching the current filters (not just the current page) with columns: certificateNumber, recipientName, templateName, issueDate, expiryDate, status, verificationCode.

### AC-16.20: Batch Re-download (ZIP)
- Given the user selects 3 issued certificates and has `certificates.view` permission, when they click "Re-download (ZIP)" and confirm, then a ZIP archive containing the PDF files of all selected certificates is generated and downloaded.

### AC-16.21: Generate Button
- Given a user with `certificates.generate` permission, when they view the certificate list page, then a "Generate" primary action button is visible in the PageHeader (desktop) or as a FAB (mobile), and clicking it navigates to the certificate generation flow (Plan 17).

### AC-16.22: Active Filter Count Badge
- Given the user has applied 2 filters, when the FilterButton renders, then a badge with "2" is displayed indicating 2 active filters, and clicking "Clear All" removes all filters and resets the badge to 0.

### AC-16.23: Mobile Filter Drawer
- Given a mobile viewport, when the user taps the filter button, then a filter drawer opens with status, template, date range, and recipient filters, and applying filters closes the drawer and updates the list.

### AC-16.24: Mobile Generate FAB
- Given a mobile viewport and a user with `certificates.generate` permission, when the certificate list is displayed, then a floating action button (FAB) is visible, and tapping it navigates to the certificate generation flow (Plan 17).

### AC-16.25: Pull-to-Refresh (Mobile)
- Given a mobile viewport, when the user pulls down on the certificate card list, then the list refreshes with the latest data from the server.

### AC-16.26: Infinite Scroll (Mobile)
- Given a mobile viewport with more certificates than the first page, when the user scrolls to the bottom of the card list, then the next page of certificates is loaded automatically and appended to the list.

### AC-16.27: Mobile Horizontal Scroll Metrics
- Given a mobile viewport, when the metrics row is displayed, then metric cards are arranged in a horizontally scrollable row, and the user can swipe to see all metric cards.
