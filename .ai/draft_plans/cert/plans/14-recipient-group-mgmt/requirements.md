# Plan 14 — Recipient Group Management — Requirements

## Document Info

| Field | Value |
|-------|-------|
| **Feature** | Recipient Group Management |
| **Plan #** | 14 |
| **Dependencies** | Plan 5 (GraphQL API) |
| **Depended On By** | Plan 17 (Certificate Generation Dialog) |
| **Stakeholders** | Admin, Teachers |
| **Related Docs** | `MASTER_ARCHITECTURE.md`, `cgvs_analysis/06-student-recipient.md`, `siraj_analysis/05-frontend-patterns.md`, `siraj_analysis/06-i18n-system.md` |
| **Permission** | `CertificateRecipientGroupManage` (`certificates.recipient_groups.manage`) |
| **View Permission** | `CertificateRecipientGroupView` (`certificates.recipient_groups.view`) |

## 1. Introduction

### Overview
Recipient Groups organize students into cohorts for a specific certificate template so certificates can be generated in batch. Each group is associated with a template and contains student entries (recipients). For each recipient in a group, per-recipient variable values can override the template's default variable values, enabling personalized certificate data (e.g., different GPA, specialization, or reference number per student).

### Business Value
- **Batch efficiency**: Administrators assign dozens of students to a group once, then batch-generate certificates for the entire group.
- **Personalization**: Per-recipient variable values let each student get unique certificate data without creating separate templates.
- **Reusability**: Groups can be duplicated, renamed, or re-associated with different templates, reducing setup overhead for recurring certificate cycles.

### Scope

| In Scope | Out of Scope |
|----------|-------------|
| Recipient group list page (table with template association, student count, status) | Student CRUD (existing Siraj student directory) |
| Create recipient group dialog (name, description, group type, template selection) | Template variable definition UI (Plan 13) |
| Group detail view: student table with add/remove, search, pagination | Certificate PDF generation (Plan 6) |
| Student search: server-side by name, student ID, grade | Template editor (Plans 10–12) |
| Assign students to group: search → select → add | Certificate list & management (Plan 16) |
| Bulk add students by class/cohort | Certificate PDF generation (Plan 6) |
| Per-recipient variable values: override text, number, date, select variables | Template editor (Plans 10–12) |
| Variable value forms: type-appropriate inputs per variable type | Certificate list & management (Plan 16) |
| Group operations: duplicate, rename, delete (soft), change template | Email delivery of certificates |
| Member management: add/remove students, import from CSV, export members list | Verification page (Plan 19) |
| Zustand store for group management state (search, pagination, dialog flags, editor state) | Cron cleanup (Plan 22) |
| GraphQL documents for recipient group CRUD + student assignment + variable values + import/export | Permissions management UI |
| App Router pages: list + detail | |
| Desktop (AppDataGrid, inline variable editing) + Mobile (card list, dialog editing) | |
| i18n: complete namespace for recipientGroups with EN + AR translations | |
| Role-based access: ADMIN sees all groups, TEACHER sees own groups via `createdById` | |
| Breadcrumbs: Dashboard › Certificates › Recipient Groups › [Group Name] | |
| Group types: static, dynamic (query-based), class-based | |
| Member count display with proper pluralization (EN/AR) | |
| Group deletion confirmation with certificate impact warning | |
| Accessibility (WCAG 2.1 AA): keyboard navigation, ARIA labels, focus management | |
| Loading/empty/error states for all views and dialogs | |

## 2. Requirements (EARS Format)

### Feature Area A: Recipient Group List Page

**REQ-14-A1**: WHEN the user navigates to `/certificates/recipient-groups`, THE SYSTEM SHALL display a paginated table of all recipient groups the user has permission to manage, showing group name, associated template name, student count, and status (active/archived).

**REQ-14-A2**: WHEN the user clicks a column header on the group list table, THE SYSTEM SHALL sort the table by that column server-side, preserving other active sort keys as secondary sort.

**REQ-14-A3**: WHEN the user enters text in the search field, THE SYSTEM SHALL filter groups server-side by name (Full-text search) with a 300ms debounce, resetting to page 1.

**REQ-14-A4**: WHEN no recipient groups exist, THE SYSTEM SHALL display an empty state with an illustration and a "Create Group" call-to-action button.

**REQ-14-A5**: WHEN the user clicks the "Create Group" button, THE SYSTEM SHALL open a create recipient group dialog.

**REQ-14-A6**: WHEN the user clicks a group row, THE SYSTEM SHALL navigate to the group detail page at `/certificates/recipient-groups/[id]`.

**Acceptance Criteria (A)**:
- Group list renders with `DesktopAppDataGrid` (desktop) and `MobileCardList` (mobile)
- Container: `RecipientGroupListContainer` wraps ViewModel in `<RequirePermission permissions={[AppPermission.CertificateRecipientGroupView]}>`
- ViewModel: `useRecipientGroupListViewModel` returns `{ loading, error, groups, totalCount, pageInfo, searchQuery, page, pageSize, sortBy, sortDir, selectedGroupIds, permissions, labels, handlers }`
- Switcher: `RecipientGroupListView` uses `createLazyView` + `ResponsiveViewSwitch` to load `.desktop.tsx` / `.mobile.tsx`
- Desktop layout: `PageContainer` → `PageHeader` (title, subtitle, Create button) → `SectionPanel` → `DesktopAppDataGrid`
- Mobile layout: `MobilePageContainer` → `MobilePageHeader` (title, search icon, sort icon) → `MobileCardList` (with create FAB)
- Grid columns: name (sortable), template, memberCount (sortable, pluralized), status (Chip), createdBy (hidden for TEACHER), createdAt (sortable), actions (3-dot menu)
- Mobile card: group name, template badge, member count pluralized, status Chip, chevron, long-press for operations
- Server-side pagination returns `{ id, totalCount, rows, pageInfo }` per Siraj canonical list shape
- Search resets page to 0 and produces server-filtered results (300ms debounce)
- Empty state shows translated heading + subheading + primary action button (Create Group)
- No-results state (search has no matches) shows different translated heading + message
- Error state shows `ErrorBanner` with Retry button
- Loading state shows skeleton rows (5 rows with pulse animation)
- Row click navigates to detail route `/certificates/recipient-groups/[id]`
- Create button visible only if `permissions.canCreate` is true (role-based)
- Mobile create via FAB (`FloatingActionButton` with `AddOutlined`)
- All user-facing strings from `useAppTranslation(Translation.Certificates.RecipientGroups)` — no hardcoded strings

### Feature Area B: Create Recipient Group Dialog

**REQ-14-B1**: WHEN the create dialog is open, THE SYSTEM SHALL present fields for group name (required, 3–255 chars), description (optional, multiline), and template selection (required, Autocomplete with search).

**REQ-14-B2**: WHEN the user attempts to submit the create dialog with an invalid name (less than 3 chars or empty), THE SYSTEM SHALL display the inline validation error and prevent submission.

**REQ-14-B3**: WHEN the create dialog is submitted successfully, THE SYSTEM SHALL close the dialog, update the Apollo cache by appending the new group to the list, and show a success toast notification.

**REQ-14-B4**: WHEN the create mutation fails (server error), THE SYSTEM SHALL keep the dialog open, display the translated error message in a `FormErrorSnackbar`, and preserve entered field values.

**Acceptance Criteria (B)**:
- Dialog component: `CreateRecipientGroupDialog` (shared desktop/mobile, responsive `Dialog` props)
- Name validation: minimum 1 char, maximum 100 chars, Zod schema in `schemas/recipientGroup.schema.ts`
- Template Autocomplete fetches Published templates via `TemplateListForSelectQueryDocument`
- Only one template selectable; selection stored in Zustand `editingGroupId` (null = create mode, non-null = rename mode)
- Desktop: `Dialog` with `maxWidth="sm"`, centered; Mobile: `Dialog` with `fullScreen={true}`
- On success: dialog closes, Apollo cache updated (new group appended to list cache), success snackbar with interpolated name
- On error: dialog remains open, `FormErrorSnackbar` with translated error, field values preserved
- Submit button disabled while `submitting === true` (mutation in-progress)
- Zod validation runs on blur and on submit; errors shown via `FormHelperText` with `error: true`
- All dialog labels from `labels.create*` keys (translated, no hardcoded strings)

### Feature Area C: Group Detail View

**REQ-14-C1**: WHEN the user navigates to `/certificates/recipient-groups/[id]`, THE SYSTEM SHALL display the group header (name, description, template name, student count, status badge) and a student table listing all recipients in the group.

**REQ-14-C2**: WHEN the user clicks "Add Students" in the detail view, THE SYSTEM SHALL open the student assignment flow with a searchable student table showing students NOT already in the group.

**REQ-14-C3**: WHEN the user selects students in the assignment flow and clicks "Add to Group", THE SYSTEM SHALL call the batch-add mutation, update the Apollo cache (increment student count, evict in-group/not-in-group queries), and refresh the student table.

**REQ-14-C4**: WHEN the user selects recipients in the student table and clicks "Remove", THE SYSTEM SHALL show a confirmation dialog; on confirm, call the batch-remove mutation, decrement student count, and evict related queries.

**REQ-14-C5**: WHEN the student table has more than 25 rows, THE SYSTEM SHALL display server-side pagination controls.

**REQ-14-C6**: WHEN the user searches for students within the group (or in the assignment flow), THE SYSTEM SHALL perform server-side search by name (Full-text + trigram), student ID, or grade with a 300ms debounce.

**REQ-14-C7**: WHEN the group's associated template has variables defined, THE SYSTEM SHALL display a "Variable Values" column showing per-recipient variable fill status (filled / unfilled / partial).

**Acceptance Criteria (C)**:
- Detail Container: `RecipientGroupDetailContainer` wraps ViewModel in `<RequirePermission permissions={[AppPermission.CertificateRecipientGroupView]}>`
- ViewModel: `useRecipientGroupDetailViewModel` returns `{ loading, error, group, students, studentPageInfo, createDialogOpen, assignmentDialogOpen, variableEditorState, operationsMenuAnchor, permissions, labels, mutations, handlers }`
- Switcher: `RecipientGroupDetailView` uses `createLazyView` + `ResponsiveViewSwitch`
- Detail query fetches with `cache-and-network` policy
- Desktop header: `desktopDetailHeader` with back button, inline-renameable group name, template name, student count, Add Students / Import / Export / Operations buttons
- Mobile header: `MobilePageHeader` with back icon, group name (tap for rename), overflow menu
- Desktop student table: `DesktopAppDataGrid` with columns: name, email, grade, status, variableStatus badge, actions (remove + expand)
- Mobile student list: `MobileCardList` with `MobileStudentCard` components — expandable accordion showing variable values + edit/remove actions
- Add/remove operations update Apollo cache via manual `update` function (no full refetch)
- Optimistic update: new students inserted to cache before mutation resolves; rollback on error; server `addedCount`/`removedCount` authoritative
- Confirmation dialog: `RemoveStudentsConfirmDialog` shown before removal, pluralized message, last-member warning if emptying group
- Assignment dialog: `StudentAssignmentDialog` with Autocomplete search, multi-select, Chip list, "Add Selected" button
- Server-side pagination for students with `studentPageInfo` response
- Variable status computed server-side (`variableStatus` field: "filled" | "unfilled" | "partial"); returns in detail query
- Add students returns `addedCount` + `skipped[]` entries; snackbar shows skipped summary if any
- All user-facing strings from `labels.detail.*` keys (translated, no hardcoded strings)
- Desktop: Add Students as `Button` in header; Mobile: Add Students as FAB (`PersonAddOutlined`)

### Feature Area D: Per-Recipient Variable Values

**REQ-14-D1**: WHEN the user opens the variable editing panel for a recipient (desktop: inline expandable row via `desktopVariableRow`; mobile: full-screen dialog via `mobileVariableDialog`), THE SYSTEM SHALL render a form with one input per template variable, using the appropriate input type (text field, number input, date picker, select dropdown).

**REQ-14-D2**: WHEN a variable has type `text`, THE SYSTEM SHALL render a text field with `minLength` / `maxLength` / `pattern` constraints and inline validation.

**REQ-14-D3**: WHEN a variable has type `number`, THE SYSTEM SHALL render a number input with `minValue` / `maxValue` / `decimalPlaces` constraints.

**REQ-14-D4**: WHEN a variable has type `date`, THE SYSTEM SHALL render a date picker with `minDate` / `maxDate` constraints and `format` display.

**REQ-14-D5**: WHEN a variable has type `select`, THE SYSTEM SHALL render a select dropdown populated with the variable's select options; if `multiple` is true, render a multi-select with chips.

**REQ-14-D6**: WHEN a variable is marked `required`, THE SYSTEM SHALL prevent saving the variable values form until all required variables have valid values.

**REQ-14-D7**: WHEN the user saves variable values for a recipient, THE SYSTEM SHALL call the `upsertVariableValues` mutation (per-recipient), which validates values server-side against the template variable config, and on success update the Apollo cache for the recipient row, show a success toast, and update the variable status column.

**REQ-14-D8**: WHEN the `upsertVariableValues` mutation returns `valueErrors` (server-side validation failures), THE SYSTEM SHALL display each error inline under the corresponding variable field via `FormHelperText` with `error: true` and prevent closing the editor.

**REQ-14-D9**: WHEN the user has not set a per-recipient value for a non-required variable, THE SYSTEM SHALL display a hint that the template default value will be used during generation.

**Acceptance Criteria (D)**:
- Component: `VariableValueEditor` (shared core for desktop/mobile) with props: `groupItemId`, `variables`, `existingValues`, `editorState`, `onValueChange`, `onSave`, `onCancel`, `labels`
- Desktop: inline expandable row (`desktopVariableRow.tsx`) below student row in AppDataGrid
- Mobile: full-screen `Dialog` (`mobileVariableDialog.tsx`) with Save/Cancel in app bar
- Four input types rendered correctly with constraints from template variable definitions
- Required validation prevents save when missing (client-side Zod + server-side validation)
- `upsertVariableValues` mutation: server validates against template variable config (min/max for numbers, options for select, required). Returns `{ success, valueErrors: [{variableId, errorKey}] }`
- If `valueErrors` is non-empty, no values are persisted (atomic). Errors displayed inline per variable field.
- Variable status column updates from `unfilled` to `filled` after successful save (cache update)
- Editor state managed in Zustand: `variableEditorState[itemId] = { open, values, saving, errors }`
- `closeVariableEditor` deletes entry from state to prevent memory leaks (per SWE review)
- Default value hint shown for unset non-required variables via a helper text under the field
- All labels from `labels.variables.*` keys (translated, no hardcoded strings)
- Server validation error keys (`valueInvalid`, `valueOutOfRange`, `selectKeyMissing`) are translatable

### Feature Area E: Group Operations

**REQ-14-E1a**: WHEN the user selects "Duplicate Group" from the row 3-dot menu (`GroupOperationsMenu`), THE SYSTEM SHALL open a `DuplicateGroupDialog` with target name (default: "{originalName} (Copy)"), target template select (default: same template), Cancel / Duplicate buttons.

**REQ-14-E1b**: WHEN the user confirms duplication, THE SYSTEM SHALL send `DuplicateRecipientGroupMutation` with `sourceGroupId`, `newName`, `templateVersionId`, and `clientRequestId` for idempotency.

**REQ-14-E1c**: WHEN the `DuplicateRecipientGroup` resolver runs, `IdempotencyService.checkAndStore` SHALL prevent any duplicate group from being created if the same `clientRequestId` was already processed.

**REQ-14-E1d**: WHEN the operation succeeds, THE SYSTEM SHALL close the dialog, show a success snackbar with interpolated new name, and the new group appears at top of the list (cache prepend).

**REQ-14-E1e**: WHEN the operation fails, THE SYSTEM SHALL keep the dialog open and show a `FormErrorSnackbar`.

**REQ-14-E2**: WHEN the user clicks "Rename" (inline edit on desktop via double-click, dialog on mobile), THE SYSTEM SHALL allow editing the group name and call the update mutation on save.

**REQ-14-E3**: WHEN the user clicks "Delete" on a group that has students, THE SYSTEM SHALL show a `DeleteGroupConfirmDialog` with a warning message (pluralized member count) and require confirmation before proceeding.

**REQ-14-E3a**: WHEN the group being deleted has certificates already issued from it, THE SYSTEM SHALL show an additional warning in the `DeleteGroupConfirmDialog` stating the number of issued certificates and that they will not be affected (certificates remain valid). The warning SHALL use a `Warning` icon and distinct warning color.

**REQ-14-E3b**: WHEN the group being deleted has pending certificate generation jobs, THE SYSTEM SHALL show an additional warning that pending generation jobs will be cancelled and require an explicit checkbox confirmation ("I understand pending jobs will be cancelled").

**REQ-14-E4**: WHEN the user confirms deletion, THE SYSTEM SHALL soft-delete the group (set `deletedAt`), remove from Apollo cache, show a success toast. If on detail page, navigate back to list.

**REQ-14-E4a**: WHEN the group is soft-deleted, THE SYSTEM SHALL also soft-delete all `certificate_recipient_group_students` join records (set `deletedAt` on join table). Per-recipient variable values SHALL be retained for audit purposes but marked as orphaned.

**REQ-14-E5**: WHEN the user selects "Change Template" from the 3-dot menu, THE SYSTEM SHALL open `ChangeTemplateDialog` with current template name + new template Autocomplete, warning about clearing incompatible variable values, Cancel/Confirm buttons. On confirm, updates `templateVersionId` and clears orphaned variable values.

**REQ-14-E6**: WHEN the user clicks "Edit Description", THE SYSTEM SHALL allow editing the group description (multiline) and call the update mutation.

**Acceptance Criteria (E)**:
- `GroupOperationsMenu` (`Popover` with `MenuList`) items: Duplicate, Change Template, Delete (with divider), each visible per `permissions` flags
- `DuplicateGroupDialog`: fields [name, template], Zod validation, mutation response { newGroupId }
- `DeleteGroupConfirmDialog`: warning message (pluralized member count), Cancel/Confirm buttons, mutation response { success }
- `ChangeTemplateDialog`: current template + new template Autocomplete, warning about clearing incompatible variables, Cancel/Confirm buttons
- Rename: inline edit on desktop (double-click name), dialog on mobile
- All operations via 3-dot `IconButton` on desktop row; long-press context menu on mobile card
- Idempotency via `idempotency.service.ts` prevents duplicate-induced double-create
- All strings from `labels.operations.*` keys (translated, no hardcoded strings)

### Feature Area F: Permissions & Navigation

**REQ-14-F1**: WHEN a user without `CertificateRecipientGroupView` permission accesses the recipient groups page, THE SYSTEM SHALL deny access via the `requirePermissionForPage` server guard.

**REQ-14-F2**: WHEN the recipient group management UI renders, THE SYSTEM SHALL enforce `CertificateRecipientGroupView` permission via `<RequirePermission>` in the Container (list and detail).

**REQ-14-F3**: WHEN the sidebar navigation renders, THE SYSTEM SHALL include a "Recipient Groups" item under the "Certificates" nav group linking to `/certificates/recipient-groups` with `permission: AppPermission.CertificateRecipientGroupView`.

**REQ-14-F4**: WHEN a TEACHER views the group list, THE SYSTEM SHALL filter results server-side by `createdById = ctx.userId` so teachers only see their own groups.

**REQ-14-F5**: WHEN an ACADEMIC_ADMIN or SUPER_ADMIN views the group list, THE SYSTEM SHALL show all groups across the academy (no `createdById` filter).

**REQ-14-F6**: WHEN a TEACHER attempts to edit/delete a group they did not create, THE SYSTEM SHALL return `ForbiddenError` from the service layer.

**REQ-14-F7**: WHEN a PARENT or STUDENT attempts to access the recipient groups page, THE SYSTEM SHALL deny access (no `CertificateRecipientGroupView` permission in their role).

**REQ-14-F8**: WHEN the detail page renders, THE SYSTEM SHALL show breadcrumbs: Dashboard › Certificates › Recipient Groups › [Group Name].

**Acceptance Criteria (F)**:
- App Router page calls `requirePermissionForPage(userId, [AppPermission.CertificateRecipientGroupView], locale, context)`
- Container wraps in `<RequirePermission permissions={[AppPermission.CertificateRecipientGroupView]}>` (both list and detail)
- Sidebar nav config updated with "Recipient Groups" entry under "Certificates" with `permission` field
- Role-based access matrix:
  | Role | View | Create | Edit | Delete | Import/Export | Assign Students |
  |------|------|--------|------|--------|--------------|-----------------|
  | SUPER_ADMIN | All | ✓ | Any | Any | ✓ | ✓ |
  | ACADEMY_ADMIN | All | ✓ | Any | Any | ✓ | ✓ |
  | TEACHER | Own only | ✓ | Own only | Own only | Own only | Own only (via student-field-acl) |
  | PARENT | Denied | ✗ | ✗ | ✗ | ✗ | ✗ |
  | STUDENT | Denied | ✗ | ✗ | ✗ | ✗ | ✗ |
- TEACHER list query: `WHERE createdById = ctx.userId` (ownership scoping)
- TEACHER cross-group access: service returns `ForbiddenError`
- Student search in assignment dialog: uses existing `student-field-acl.ts` service for authorization
- Breadcrumbs shown on both desktop (`desktopBreadcrumbBar`) and mobile (`MobileBreadcrumbBar`)
- All permission/access strings from `labels.permissions.*` keys (translated, no hardcoded strings)

### Feature Area G: Member Import/Export

**REQ-14-G1**: WHEN the user taps the "Import" button in the detail page header, THE SYSTEM SHALL open an `ImportMembersDialog` with a CSV file upload dropzone, a "Download Template" link, and Cancel/Import buttons.

**REQ-14-G2**: WHEN the user uploads a CSV file, THE SYSTEM SHALL parse client-side, preview the first 5 rows in a `DesktopAppDataGrid` or `MobileCardList`, show total row count, and enable the "Import" button.

**REQ-14-G3**: WHEN the user confirms import, THE SYSTEM SHALL send `ImportGroupMembersMutation` with `{ groupId, csvData }`. The server SHALL match rows against existing students (by email or student ID), return `{ addedCount, skipped: [{studentId, studentName, reason}] }`, and the dialog SHALL show results summary.

**REQ-14-G4**: WHEN the CSV file has an invalid format (missing required columns), THE SYSTEM SHALL show a `FormErrorSnackbar` with a translated error and disable the Import button.

**REQ-14-G5**: WHEN the user taps the "Export" button in the detail page header, THE SYSTEM SHALL trigger a client-side CSV download containing all member rows with columns: name, email, grade, status, variable values (one column per template variable).

**REQ-14-G6**: WHEN the export has more than 500 members, THE SYSTEM SHALL show a warning dialog before generating, and the download shall be generated via `utils/exportGroupMembersCsv.ts` utility.

**Acceptance Criteria (G)**:
- `ImportMembersDialog` component (shared desktop/mobile): dropzone, preview grid, Cancel/Import buttons
- File upload accepts `.csv` only, max 1MB, validates header row has at least `email` column
- CSV template download link generates a blank template with headers matching expected format
- Import preview shows: studentName, email, class/grade, status column with "new"/"existing" indicator
- Import results summary: `addedCount` (success) + `skipped[]` with reasons ("already_member", "student_not_found", "invalid_email")
- Export: `exportGroupMembersCsv(group, students, variables, existingValues)` utility function
- Export columns: name, email, grade, status, then one column per template variable (key as header)
- All import/export strings from `labels.importExport.*` keys (translated, no hardcoded strings)

### Feature Area H: Mobile Variants

**REQ-14-H1**: WHEN a mobile user views the recipient group list, THE SYSTEM SHALL render `MobilePageContainer` → `MobilePageHeader` (title, search icon, sort icon) → `MobileCardList` with `MobileCardListItem` cards.

**REQ-14-H2**: WHEN a mobile user taps a card, THE SYSTEM SHALL navigate to the detail route. WHEN a mobile user long-presses a card, THE SYSTEM SHALL open a bottom sheet with operations (Duplicate, Change Template, Delete).

**REQ-14-H3**: WHEN a mobile user taps the FAB, THE SYSTEM SHALL open the `CreateRecipientGroupDialog` in `fullScreen` mode.

**REQ-14-H4**: WHEN a mobile user views the detail page, THE SYSTEM SHALL render the student list as `MobileCardList` with `MobileStudentCard` components — each card is an expandable accordion showing variable values + edit/remove actions.

**REQ-14-H5**: WHEN a mobile user taps "Add Students", THE SYSTEM SHALL open `mobileAssignmentSheet` (bottom sheet `Dialog`) with student search Autocomplete, multi-select, Chip list, and "Add Selected" button.

**REQ-14-H6**: WHEN a mobile user taps "Edit Variables" on a student card, THE SYSTEM SHALL open `mobileVariableDialog` (full-screen `Dialog`) with `VariableValueEditor` content, app bar with Save/Cancel.

**REQ-14-H7**: WHEN a mobile user scrolls the student list, THE SYSTEM SHALL load more via `infinite-scroll` cursor pagination (loading indicator at bottom).

**Acceptance Criteria (H)**:
- Mobile list: card shows group name, template badge, member count (pluralized), status Chip, chevron icon
- Mobile list: no row actions visible — all operations via long-press context menu (bottom sheet)
- Mobile detail: student cards expandable via `Accordion` (expanded shows variable values + edit/remove buttons)
- Mobile assignment: bottom sheet `Dialog` with `fullScreen={false}`; Autocomplete with search; multi-select with Chip list
- Mobile variable editor: `fullScreen` `Dialog` with app bar (title, Save, Cancel) and scrollable form
- Mobile: infinite scroll via `MobileInfiniteLoader` or cursor-based `MobileCardList` with `onLoadMore` callback
- All mobile labels from same i18n keys as desktop (responsive, no separate mobile namespace)

### Feature Area I: Group Types

**REQ-14-I1**: WHEN the user creates a recipient group, THE SYSTEM SHALL allow selecting a group type from: Static (manual member management), Dynamic (query-based, auto-updated via scheduled job), or Class-based (students from a specific class/grade). Default: Static.

**REQ-14-I2**: WHEN the group type is Static, THE SYSTEM SHALL only allow manual add/remove of students via the UI. No automatic membership changes.

**REQ-14-I3**: WHEN the group type is Class-based, THE SYSTEM SHALL allow selecting a class/grade during group creation, and membership SHALL automatically include all students in that class/grade. Membership SHALL update when students are added/removed from the class.

**REQ-14-I4**: WHEN the group type is Dynamic, THE SYSTEM SHALL allow defining a query filter (grade range, enrollment date range, custom field filters) and membership SHALL be recomputed on a scheduled basis (configurable interval, default daily).

**REQ-14-I4**: WHEN viewing the group list, THE SYSTEM SHALL display the group type as a badge/Chip next to the group name. Group type SHALL be sortable and filterable.

**Acceptance Criteria (I)**:
- Group type enum: `Static` | `ClassBased` | `Dynamic` stored on `certificate_recipient_groups.type` column
- Create dialog: group type selector (RadioGroup or Select) with descriptions
- Static: manual add/remove only
- Class-based: class/grade selector (Autocomplete from class catalog), auto-sync membership
- Dynamic: query builder UI (future enhancement), scheduled recompute via cron (Plan 22)
- List page: type badge/Chip column, filterable, sortable
- All group type strings from `labels.groupTypes.*` keys (translated)

### Feature Area J: Member Count Pluralization (All Contexts)

**REQ-14-J1**: WHEN displaying member count in the group list table, THE SYSTEM SHALL use the pluralized `studentCount` translation function with correct EN/AR pluralization rules.

**REQ-14-J2**: WHEN displaying member count in the group detail header, THE SYSTEM SHALL use the same pluralized function.

**REQ-14-J3**: WHEN displaying member count in mobile cards, THE SYSTEM SHALL use the same pluralized function.

**REQ-14-J4**: WHEN displaying member count in import/export dialogs (preview, results, confirmations), THE SYSTEM SHALL use the same pluralized function.

**REQ-14-J5**: WHEN displaying member count in delete/confirmation dialogs, THE SYSTEM SHALL use the same pluralized function.

**Acceptance Criteria (J)**:
- Single `studentCount(count: number) => string` translation function used consistently everywhere
- Arabic: zero (لا يوجد طلاب), one (طالب واحد), two (طالبان), few 3-10 ({count} طلاب), many 11+ ({count} طالباً)
- English: zero (No students), one (1 student), many ({count} students)
- No hardcoded pluralization logic in components — always call translation function

### Feature Area K: Accessibility Requirements (WCAG 2.1 AA)

**REQ-14-K1**: WHEN any interactive element receives focus, THE SYSTEM SHALL show a visible focus indicator (2px outline, theme primary color) that meets 3:1 contrast ratio.

**REQ-14-K2**: WHEN using keyboard navigation (Tab/Shift+Tab), THE SYSTEM SHALL provide a logical focus order through all interactive elements in dialogs, tables, and cards.

**REQ-14-K3**: WHEN a dialog opens, THE SYSTEM SHALL trap focus within the dialog and restore focus to the trigger element on close.

**REQ-14-K4**: WHEN using screen readers, THE SYSTEM SHALL provide ARIA labels for: table columns, row actions (icon buttons), dialog titles, form field labels, status indicators (Chips), and loading states.

**REQ-14-K5**: WHEN displaying status Chips (Active/Archived), THE SYSTEM SHALL include `aria-label` with the full status text (not relying on color alone).

**REQ-14-K6**: WHEN showing loading skeletons, THE SYSTEM SHALL include `aria-busy="true"` and `aria-live="polite"` on the container.

**REQ-14-K7**: WHEN showing error banners, THE SYSTEM SHALL use `role="alert"` and `aria-live="assertive"`.

**REQ-14-K8**: WHEN using autocomplete/combobox for student search, THE SYSTEM SHALL implement proper ARIA combobox pattern with `aria-controls`, `aria-expanded`, and `aria-activedescendant`.

**Acceptance Criteria (K)**:
- All dialogs: `Dialog` with `disableEnforceFocus={false}` (default), proper `aria-labelledby`
- Tables: `role="grid"`, column headers `role="columnheader"`, row actions `aria-label`
- Form fields: `id` + `htmlFor` association, `aria-invalid`, `aria-describedby` for errors
- Chips: `aria-label` with full status text
- Loading: `aria-busy`, `aria-live="polite"`
- Errors: `role="alert"`, `aria-live="assertive"`
- Focus trap on dialog open/close
- Skip to main content link on pages

### Feature Area L: Loading/Empty/Error States (Comprehensive)

**REQ-14-L1**: WHEN loading the group list, THE SYSTEM SHALL show 5 skeleton rows with pulse animation in `DesktopAppDataGrid` / `MobileCardList`.

**REQ-14-L2**: WHEN the group list is empty (no groups exist), THE SYSTEM SHALL show an empty state with illustration, translated title/subtitle, and primary "Create Group" button.

**REQ-14-L3**: WHEN the group list search returns no results, THE SYSTEM SHALL show a no-results state with different translated title/message and a "Clear search" button.

**REQ-14-L4**: WHEN the group list fails to load, THE SYSTEM SHALL show an `ErrorBanner` with translated message and Retry button.

**REQ-14-L5**: WHEN loading the group detail, THE SYSTEM SHALL show skeleton for header + 5 skeleton student rows.

**REQ-14-L6**: WHEN the group detail student list is empty, THE SYSTEM SHALL show an empty state with "No members yet" message and "Add Students" primary button.

**REQ-14-L7**: WHEN the group detail student list fails to load, THE SYSTEM SHALL show an `ErrorBanner` with Retry button.

**REQ-14-L8**: WHEN loading student search results in assignment dialog, THE SYSTEM SHALL show skeleton items in Autocomplete dropdown.

**REQ-14-L9**: WHEN student search returns no results, THE SYSTEM SHALL show "No students found" in dropdown.

**REQ-14-L10**: WHEN importing/exporting, THE SYSTEM SHALL show progress indicator and disable actions until complete.

**Acceptance Criteria (L)**:
- All states use translated strings from appropriate i18n sub-domains
- Skeleton animations: MUI `Skeleton` with `animation="pulse"` variant
- Empty states: consistent `EmptyState` component pattern (illustration + title + subtitle + action)
- Error states: consistent `ErrorBanner` pattern (message + retry action)
- No hardcoded loading/error/empty strings in components

## 3. i18n Requirements

### Namespace Structure

Translation keys for Plan 14 live in the `certificates` i18n namespace under the `recipientGroups` sub-domain.

**Type file**: `shared/locale/types/certificates/recipient-groups.ts`
**AR impl**: `shared/locale/ar/certificates/recipient-groups.ts`
**EN impl**: `shared/locale/en/certificates/recipient-groups.ts`
**Namespace handle**: `shared/locale/namespaces/certificates/recipient-groups.namespace.ts`

### Translation Keys (by sub-domain)

#### 3.1 list — Recipient Group List Page

| Key | Type | AR | EN |
|-----|------|----|----|
| `pageTitle` | `string` | مجموعات المستلمين | Recipient Groups |
| `pageSubtitle` | `string` | إدارة مجموعات الطلاب لإصدار الشهادات | Manage student groups for certificate issuance |
| `searchPlaceholder` | `string` | ابحث عن مجموعة... | Search groups... |
| `createButton` | `string` | إنشاء مجموعة | Create Group |
| `emptyTitle` | `string` | لا توجد مجموعات مستلمين | No recipient groups |
| `emptySubtitle` | `string` | ابدأ بإنشاء مجموعة جديدة لتنظيم الطلاب | Start by creating a new group to organize students |
| `table.groupName` | `string` | اسم المجموعة | Group Name |
| `table.template` | `string` | القالب | Template |
| `table.studentCount` | `string` | عدد الطلاب | Student Count |
| `table.status` | `string` | الحالة | Status |
| `table.createdAt` | `string` | تاريخ الإنشاء | Created At |
| `table.actions` | `string` | إجراءات | Actions |
| `statusActive` | `string` | نشط | Active |
| `statusArchived` | `string` | مؤرشف | Archived |
| `studentCount` | `(count: number) => string` | pluralized | pluralized |

**Arabic pluralization for `studentCount`**:
```
count === 0 → "لا يوجد طلاب"
count === 1 → "طالب واحد"
count === 2 → "طالبان"
count >= 3 && count <= 10 → "{count} طلاب"
count > 10 → "{count} طالباً"
```

**English pluralization**:
```
count === 0 → "No students"
count === 1 → "1 student"
count > 1 → "{count} students"
```

#### 3.2 create — Create Group Dialog

| Key | Type | AR | EN |
|-----|------|----|----|
| `dialogTitle` | `string` | إنشاء مجموعة مستلمين | Create Recipient Group |
| `nameLabel` | `string` | اسم المجموعة | Group Name |
| `namePlaceholder` | `string` | أدخل اسم المجموعة | Enter group name |
| `descriptionLabel` | `string` | الوصف | Description |
| `descriptionPlaceholder` | `string` | وصف اختياري للمجموعة | Optional group description |
| `templateLabel` | `string` | القالب | Template |
| `templatePlaceholder` | `string` | اختر قالباً | Select a template |
| `cancelButton` | `string` | إلغاء | Cancel |
| `submitButton` | `string` | إنشاء | Create |
| `nameMinError` | `string` | يجب أن يكون الاسم 3 أحرف على الأقل | Name must be at least 3 characters |
| `nameMaxError` | `string` | يجب ألا يتجاوز الاسم 255 حرفاً | Name must not exceed 255 characters |
| `templateRequiredError` | `string` | يجب اختيار قالب | Template is required |
| `successMessage` | `string` | تم إنشاء المجموعة بنجاح | Group created successfully |

#### 3.3 detail — Group Detail View

| Key | Type | AR | EN |
|-----|------|----|----|
| `headerTitle` | `string` | تفاصيل المجموعة | Group Details |
| `descriptionLabel` | `string` | الوصف | Description |
| `templateLabel` | `string` | القالب المرتبط | Associated Template |
| `studentCountLabel` | `string` | عدد الطلاب | Student Count |
| `addStudentsButton` | `string` | إضافة طلاب | Add Students |
| `removeStudentsButton` | `string` | إزالة المحدد | Remove Selected |
| `studentSearchPlaceholder` | `string` | ابحث بالاسم أو الرقم أو الصف | Search by name, ID, or grade |
| `table.name` | `string` | الاسم | Name |
| `table.studentId` | `string` | الرقم | ID |
| `table.grade` | `string` | الصف | Grade |
| `table.variableStatus` | `string` | حالة المتغيرات | Variable Status |
| `table.actions` | `string` | إجراءات | Actions |
| `table.addedAt` | `string` | تاريخ الإضافة | Added At |
| `variableStatus.filled` | `string` | مكتملة | Filled |
| `variableStatus.unfilled` | `string` | غير مكتملة | Unfilled |
| `variableStatus.partial` | `string` | جزئية | Partial |
| `removeConfirmTitle` | `string` | تأكيد الإزالة | Confirm Removal |
| `removeConfirmMessage` | `(count: number) => string` | pluralized | pluralized |
| `removeConfirmButton` | `string` | إزالة | Remove |
| `cancelButton` | `string` | إلغاء | Cancel |
| `addSuccessMessage` | `(count: number) => string` | pluralized | pluralized |
| `removeSuccessMessage` | `(count: number) => string` | pluralized | pluralized |

**Arabic pluralization for `removeConfirmMessage`**:
```
count === 1 → "هل أنت متأكد من إزالة طالب واحد من المجموعة؟"
count === 2 → "هل أنت متأكد من إزالة طالبين من المجموعة؟"
count >= 3 && count <= 10 → "هل أنت متأكد من إزالة {count} طلاب من المجموعة؟"
count > 10 → "هل أنت متأكد من إزالة {count} طالباً من المجموعة؟"
```

#### 3.4 variables — Per-Recipient Variable Values

| Key | Type | AR | EN |
|-----|------|----|----|
| `panelTitle` | `string` | قيم المتغيرات | Variable Values |
| `panelSubtitle` | `string` | تخصيص قيم المتغيرات لهذا الطالب | Customize variable values for this student |
| `requiredIndicator` | `string` | مطلوب | Required |
| `optionalIndicator` | `string` | اختياري | Optional |
| `defaultValueHint` | `string` | سيتم استخدام القيمة الافتراضية | Default value will be used |
| `saveButton` | `string` | حفظ القيم | Save Values |
| `cancelButton` | `string` | إلغاء | Cancel |
| `requiredError` | `(field: string) => string` | "{field} مطلوب" | "{field} is required" |
| `minLengthError` | `(min: number) => string` | "الحد الأدنى {min} أحرف" | "Minimum {min} characters" |
| `maxLengthError` | `(max: number) => string` | "الحد الأقصى {max} حرفاً" | "Maximum {max} characters" |
| `patternError` | `string` | الصيغة غير صحيحة | Invalid format |
| `minValueError` | `(min: number) => string` | "الحد الأدنى {min}" | "Minimum {min}" |
| `maxValueError` | `(max: number) => string` | "الحد الأقصى {max}" | "Maximum {max}" |
| `minDateError` | `(date: string) => string` | "أقدم تاريخ {date}" | "Earliest date {date}" |
| `maxDateError` | `(date: string) => string` | "آخر تاريخ {date}" | "Latest date {date}" |
| `selectPlaceholder` | `string` | اختر... | Select... |
| `multiSelectPlaceholder` | `string` | اختر خياراً أو أكثر | Select one or more |
| `successMessage` | `string` | تم حفظ قيم المتغيرات | Variable values saved |
| `noVariablesTitle` | `string` | لا توجد متغيرات | No Variables |
| `noVariablesSubtitle` | `string` | هذا القالب لا يحتوي على متغيرات | This template has no variables |

#### 3.5 operations — Group Operations

| Key | Type | AR | EN |
|-----|------|----|----|
| `duplicateButton` | `string` | تكرار المجموعة | Duplicate Group |
| `duplicateConfirmTitle` | `string` | تأكيد التكرار | Confirm Duplication |
| `duplicateConfirmMessage` | `string` | سيتم إنشاء نسخة من المجموعة مع جميع الطلاب وقيم المتغيرات | A copy will be created with all students and variable values |
| `duplicateSuccessMessage` | `string` | تم تكرار المجموعة بنجاح | Group duplicated successfully |
| `renameButton` | `string` | إعادة تسمية | Rename |
| `deleteButton` | `string` | حذف المجموعة | Delete Group |
| `deleteDisabledTooltip` | `string` | لا يمكن حذف مجموعة تحتوي على طلاب | Cannot delete a group with students |
| `deleteConfirmTitle` | `string` | تأكيد الحذف | Confirm Deletion |
| `deleteConfirmMessage` | `string` | سيتم أرشفة المجموعة. لا يمكن التراجع عن هذا الإجراء. | The group will be archived. This action cannot be undone. |
| `deleteCertificateWarning` | `(count: number) => string` | pluralized | pluralized |
| `deletePendingJobsWarning` | `string` | سيتم إلغاء مهام التوليد المعلقة | Pending generation jobs will be cancelled |
| `deletePendingJobsConfirm` | `string` | أفهم أن المهام المعلقة سيتم إلغاؤها | I understand pending jobs will be cancelled |
| `deleteConfirmButton` | `string` | حذف | Delete |
| `deleteSuccessMessage` | `string` | تم حذف المجموعة بنجاح | Group deleted successfully |
| `changeTemplateButton` | `string` | تغيير القالب | Change Template |
| `changeTemplateConfirmTitle` | `string` | تأكيد تغيير القالب | Confirm Template Change |
| `changeTemplateWarning` | `string` | سيتم فقدان قيم المتغيرات المرتبطة بالقالب القديم | Variable values tied to the old template will be lost |
| `changeTemplateSuccessMessage` | `string` | تم تغيير القالب بنجاح | Template changed successfully |
| `editDescriptionButton` | `string` | تعديل الوصف | Edit Description |
| `duplicatedNameSuffix` | `string` | (نسخة) | (copy) |

**Arabic pluralization for `deleteCertificateWarning`**:
```
count === 0 → "لا توجد شهادات مرتبطة. لن يؤثر الحذف على أي شهادات."
count === 1 → "توجد شهادة واحدة مرتبطة بهذه المجموعة. لن تتأثر الشهادة."
count === 2 → "توجد شهادتان مرتبطتان بهذه المجموعة. لن تتأثر الشهادتان."
count >= 3 && count <= 10 → "توجد {count} شهادات مرتبطة بهذه المجموعة. لن تتأثر الشهادات."
count > 10 → "توجد {count} شهادة مرتبطة بهذه المجموعة. لن تتأثر الشهادات."
```

**English pluralization for `deleteCertificateWarning`**:
```
count === 0 → "No certificates are associated. This will have no impact."
count === 1 → "1 certificate is associated with this group. It will not be affected."
count > 1 → "{count} certificates are associated with this group. They will not be affected."
```

#### 3.6 errors — Error Messages

| Key | Type | AR | EN |
|-----|------|----|----|
| `groupNotFound` | `(id: string) => string` | "المجموعة غير موجودة: {id}" | "Group not found: {id}" |
| `loadFailed` | `string` | فشل تحميل المجموعات | Failed to load groups |
| `loadDetailFailed` | `string` | فشل تحميل تفاصيل المجموعة | Failed to load group details |
| `createFailed` | `string` | فشل إنشاء المجموعة | Failed to create group |
| `updateFailed` | `string` | فشل تحديث المجموعة | Failed to update group |
| `deleteFailed` | `string` | فشل حذف المجموعة | Failed to delete group |
| `addStudentsFailed` | `string` | فشل إضافة الطلاب | Failed to add students |
| `removeStudentsFailed` | `string` | فشل إزالة الطلاب | Failed to remove students |
| `duplicateFailed` | `string` | فشل تكرار المجموعة | Failed to duplicate group |
| `saveVariablesFailed` | `string` | فشل حفظ قيم المتغيرات | Failed to save variable values |
| `studentSearchFailed` | `string` | فشل البحث عن الطلاب | Student search failed |
| `templateLoadFailed` | `string` | فشل تحميل القوالب | Failed to load templates |

#### 3.7 importExport — Member Import/Export

| Key | Type | AR | EN |
|-----|------|----|----|
| `importButton` | `string` | استيراد الأعضاء | Import Members |
| `exportButton` | `string` | تصدير الأعضاء | Export Members |
| `importDialogTitle` | `string` | استيراد أعضاء من CSV | Import Members from CSV |
| `importDropzoneText` | `string` | اسحب ملف CSV هنا أو انقر للاختيار | Drag CSV file here or click to select |
| `importDownloadTemplate` | `string` | تنزيل القالب | Download Template |
| `importPreviewTitle` | `(count: number) => string` | pluralized | pluralized |
| `importConfirmButton` | `string` | استيراد | Import |
| `importCancelButton` | `string` | إلغاء | Cancel |
| `importSuccessMessage` | `(added: number, skipped: number) => string` | "تمت إضافة {added}، تم تخطي {skipped}" | "Added {added}, skipped {skipped}" |
| `importInvalidFormat` | `string` | صيغة الملف غير صحيحة | Invalid file format |
| `importMissingEmailColumn` | `string` | عمود البريد الإلكتروني مطلوب | Email column is required |
| `importFileTooLarge` | `string` | حجم الملف يتجاوز 1 ميجابايت | File exceeds 1MB limit |
| `exportConfirmTitle` | `(count: number) => string` | pluralized | pluralized |
| `skippedReasonAlreadyMember` | `string` | عضو بالفعل | Already a member |
| `skippedReasonNotFound` | `string` | الطالب غير موجود | Student not found |
| `skippedReasonInvalidEmail` | `string` | بريد إلكتروني غير صالح | Invalid email |

#### 3.8 permissions — Permission Labels

| Key | Type | AR | EN |
|-----|------|----|----|
| `viewDenied` | `string` | ليس لديك صلاحية لعرض مجموعات المستلمين | You do not have permission to view recipient groups |
| `manageDenied` | `string` | ليس لديك صلاحية لإدارة مجموعات المستلمين | You do not have permission to manage recipient groups |
| `editDenied` | `string` | يمكنك فقط تعديل المجموعات التي أنشأتها | You can only edit groups you created |
| `deleteDenied` | `string` | يمكنك فقط حذف المجموعات التي أنشأتها | You can only delete groups you created |

#### 3.9 breadcrumbs — Breadcrumb Labels

| Key | Type | AR | EN |
|-----|------|----|----|
| `dashboard` | `string` | لوحة التحكم | Dashboard |
| `certificates` | `string` | الشهادات | Certificates |
| `recipientGroups` | `string` | مجموعات المستلمين | Recipient Groups |

#### 3.10 serverValidation — Server-side Validation Errors

| Key | Type | AR | EN |
|-----|------|----|----|
| `valueInvalid` | `string` | القيمة غير صالحة | Invalid value |
| `valueOutOfRange` | `(min: string, max: string) => string` | "القيمة يجب أن تكون بين {min} و {max}" | "Value must be between {min} and {max}" |
| `selectKeyMissing` | `(key: string) => string` | "الخيار '{key}' غير موجود" | "Option '{key}' not found" |

#### 3.11 groupTypes — Group Types

| Key | Type | AR | EN |
|-----|------|----|----|
| `static` | `string` | ثابتة | Static |
| `classBased` | `string` | قائمة على الصف | Class-based |
| `dynamic` | `string` | ديناميكية | Dynamic |
| `staticDescription` | `string` | يدوية — أضف وأزل الطلاب يدوياً | Manual — add and remove students manually |
| `classBasedDescription` | `string` | طلاب من صف محدد — التحديث التلقائي | Students from a specific class — auto-synced |
| `dynamicDescription` | `string` | قائمة على استعلام — التحديث المجدول | Query-based — scheduled updates |
| `typeLabel` | `string` | نوع المجموعة | Group Type |
| `classSelectorLabel` | `string` | اختر الصف/الدرجة | Select Class/Grade |
| `queryBuilderLabel` | `string` | بناء استعلام التصفية | Build Filter Query |

#### 3.12 accessibility — Accessibility Labels

| Key | Type | AR | EN |
|-----|------|----|----|
| `groupList` | `string` | قائمة مجموعات المستلمين | Recipient Group List |
| `groupCard` | `string` | بطاقة مجموعة المستلمين | Recipient Group Card |
| `groupName` | `string` | اسم المجموعة | Group Name |
| `groupTemplate` | `string` | القالب المرتبط | Associated Template |
| `memberCount` | `(count: number) => string` | pluralized | pluralized |
| `groupStatus` | `string` | حالة المجموعة | Group Status |
| `groupActions` | `string` | إجراءات المجموعة | Group Actions |
| `createGroupDialog` | `string` | حوار إنشاء مجموعة | Create Group Dialog |
| `groupNameField` | `string` | حقل اسم المجموعة | Group Name Field |
| `descriptionField` | `string` | حقل الوصف | Description Field |
| `templateSelectField` | `string` | حقل اختيار القالب | Template Select Field |
| `typeSelectField` | `string` | حقل اختيار النوع | Type Select Field |
| `dialogClose` | `string` | إغلاق الحوار | Close Dialog |
| `addStudentsDialog` | `string` | حوار إضافة الطلاب | Add Students Dialog |
| `studentSearchField` | `string` | حقل البحث عن الطلاب | Student Search Field |
| `studentOption` | `(name: string) => string` | "{name} — طالب" | "{name} — Student" |
| `addSelectedButton` | `string` | إضافة المحدد | Add Selected |
| `variableEditorDialog` | `string` | محرر قيم المتغيرات | Variable Values Editor |
| `variableField` | `(name: string) => string` | "حقل المتغير {name}" | "Variable field {name}" |
| `saveVariablesButton` | `string` | حفظ المتغيرات | Save Variables |
| `deleteConfirmDialog` | `string` | حوار تأكيد الحذف | Delete Confirmation Dialog |
| `loadingGroups` | `string` | جاري تحميل المجموعات | Loading groups |
| `loadingMembers` | `string` | جاري تحميل الأعضاء | Loading members |
| `emptyGroups` | `string` | لا توجد مجموعات | No groups |
| `emptyMembers` | `string` | لا يوجد أعضاء | No members |
| `noSearchResults` | `string` | لا توجد نتائج للبحث | No search results |

#### 3.13 loadingEmptyError — Loading/Empty/Error States

| Key | Type | AR | EN |
|-----|------|----|----|
| `loadingList` | `string` | جاري تحميل القائمة | Loading list |
| `loadingDetail` | `string` | جاري تحميل التفاصيل | Loading details |
| `loadingStudents` | `string` | جاري تحميل الطلاب | Loading students |
| `emptyListTitle` | `string` | لا توجد مجموعات مستلمين | No recipient groups |
| `emptyListSubtitle` | `string` | ابدأ بإنشاء مجموعة جديدة لتنظيم الطلاب | Start by creating a new group to organize students |
| `emptyDetailTitle` | `string` | لا يوجد أعضاء في هذه المجموعة | No members in this group |
| `emptyDetailSubtitle` | `string` | أضف طلاباً لبدء إصدار الشهادات | Add students to start issuing certificates |
| `noResultsTitle` | `string` | لا توجد مجموعات مطابقة | No matching groups |
| `noResultsSubtitle` | `string` | جرب تغيير معايير البحث | Try changing your search criteria |
| `errorLoadList` | `string` | فشل تحميل المجموعات | Failed to load groups |
| `errorLoadDetail` | `string` | فشل تحميل تفاصيل المجموعة | Failed to load group details |
| `errorAddStudents` | `string` | فشل إضافة الطلاب | Failed to add students |
| `errorRemoveStudents` | `string` | فشل إزالة الطلاب | Failed to remove students |
| `errorSaveVariables` | `string` | فشل حفظ قيم المتغيرات | Failed to save variable values |
| `errorImport` | `string` | فشل استيراد الأعضاء | Failed to import members |
| `errorExport` | `string` | فشل تصدير الأعضاء | Failed to export members |
| `retryButton` | `string` | إعادة المحاولة | Retry |
| `clearSearchButton` | `string` | مسح البحث | Clear Search |
| `createFirstButton` | `string` | إنشاء مجموعة | Create Group |
| `addStudentsButton` | `string` | إضافة طلاب | Add Students |

### i18n Design Notes

- All keys are defined in the `CertificatesLabels` type interface under `recipientGroups` sub-domain
- The `recipientGroups` sub-domain is nested: `{ list, create, detail, variables, operations, errors, importExport, permissions, breadcrumbs, serverValidation, groupTypes, accessibility, loadingEmptyError }` (13 sub-domains)
- Pluralization functions use the `(count: number) => string` pattern with Arabic branching (zero/one/two/few/many)
- Interpolation functions use named-arg objects for 2+ params: `(params: { added: number; skipped: number }) => string`
- Server consumption: `getTranslations(locale).certTranslations.recipientGroups.list.pageTitle`
- Client consumption: `useAppTranslation(Translation.Certificates.RecipientGroups)` → `t.list.pageTitle`
- GraphQL resolver consumption: `ctx.t().certTranslations.recipientGroups.errors.groupNotFound(id)`
- Server validation error keys consumed by `upsertVariableValues` resolver when returning `valueErrors[].errorKey`

## 4. AGENTS.md & Instruction Files

Files created/modified in this plan must follow:

| Layer | AGENTS.md |
|-------|-----------|
| Root | `AGENTS.md` |
| App Router | `app/AGENTS.md` |
| Shared | `shared/AGENTS.md` |
| Frontend | `frontend/AGENTS.md` |
| Frontend Views | `frontend/views/AGENTS.md` |
| Frontend Stores | `frontend/common/stores/AGENTS.md` (if path matches) |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` |
| Backend GraphQL | `backend/graphql/AGENTS.md` |

| File Pattern | Instruction File |
|---|---|
| `frontend/**/*.ts(x)`, `app/**/*.ts(x)` | `frontend.instructions.md` |
| `backend/**/*.ts` | `backend.instructions.md` |

## 5. Outcome & Knowledge Tracking

- **Outcome**: A fully functional recipient group management feature enabling admin/teachers to organize students into template-associated groups, assign students, set per-recipient variable values, perform group lifecycle operations (duplicate, rename, delete, change template), import/export members via CSV — with full desktop (AppDataGrid + inline editing) and mobile (card list + dialog editing) variants, role-based access control (ADMIN sees all, TEACHER sees own groups via `createdById`), and complete i18n (EN + AR) across 10 sub-domains.
- **Knowledge Transfer**: Lessons learned during implementation (Apollo cache update patterns for group/student joins, variable value form validation, mobile/desktop variable editing, CSV import/export patterns, idempotency for duplicate operations, student-field-acl reuse for assignment authorization) will be documented in Plan 21 knowledge propagation tasks.
- **Progress Tracking**: Implementation tasks tracked in `tasks.md` with dependencies and quality loops.
