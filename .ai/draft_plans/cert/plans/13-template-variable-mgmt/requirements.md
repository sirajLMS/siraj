# Plan 13: Template Variable Management — Requirements

> **Plan #:** 13
> **Dependencies:** Plan 1 (Database Schema), Plan 2 (Types & Permissions), Plan 5 (GraphQL API)
> **Scope:** Global variable CRUD, type system (4 data types × 4 source categories), default values, validation rules, dependency-aware deletion, admin CRUD page
> **Purpose:** Manage the global variable definitions that templates reference for dynamic content (e.g., {{student_name}}, {{course_name}}, {{completion_date}})

---

## 1. Overview

Certificate variables are the dynamic data placeholders used across certificate templates. When a certificate is generated, each variable is resolved to actual data (student name, completion date, academy name, etc.). This plan defines the full lifecycle of certificate variables as a **standalone admin page** with full CRUD, type-specific configuration, source category classification, dependency tracking, and validation.

Variables are managed globally — they are not bound to a specific template. Multiple templates can reference the same variable. The `templateCount` column on the table shows how many templates use each variable, enabling dependency-aware deletion warnings.

### System Context

```
app/(dashboard)/certificates/variables/page.tsx (standalone route)
  └── CertVariablesContainer (common)
        └── useVariablesViewModel (common)
              ├── certVariablesStore (Zustand — filters, pagination, dialog state)
              └── Apollo useQuery / useMutations
                    ▼
              GraphQL API (Pothos Resolvers)
                    ▼
              CertificateVariableService (business logic)
                    ▼
              CertificateVariableRepository (Drizzle ORM)
                    ▼
              certificate_variables table (global, not per-template)
```

---

## 2. Stakeholders & Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| SUPER_ADMIN | Full | Create, edit, delete all certificate variables |
| ACADEMY_ADMIN | Full | Manage variables for academy templates |
| TEACHER | Restricted | View-only access to variables (cannot create/edit/delete) |

**Permission required:** `CertificateTemplateManage` (canonical key from INTER_PLAN_CONTRACTS.md §1 — string value `certificates.templates.manage`)

> **Note:** The inter-plan contract defines 11 permissions. There is no dedicated `CERTIFICATES_VARIABLES_MANAGE` key. Variable management shares `CertificateTemplateManage` since variables are a sub-domain of templates. The page must gate on this key using `RequirePermission` wrapper.

---

## 3. Functional Requirements (EARS Format)

### REQ-13-01: Variable Admin Page (Desktop)

**WHEN** user navigates to `/certificates/variables`  
**THEN** system **SHALL** render a standalone admin page with the standard Siraj page layout:
- `DesktopPageContainer` wrapping the entire page
- `DesktopPageHeader` with title, subtitle, and primary "New Variable" action button (visible only if user has `CertificateTemplateManage`)
- Optional `FilterBar` with search field and type filter dropdown
- `DesktopSectionPanel` (with `contentPadding={false}`) containing `DesktopAppDataGrid`
- Pagination at the bottom of the table

**AND** the table columns **SHALL** be:

| Column | Field | Width | Type |
|--------|-------|-------|------|
| Name | `name` | 200px | Text — bold |
| Key | `key` (displayed as `{{variable_name}}` in monospace) | 180px | Text — monospace chip |
| Type | `type` (data type badge) | 120px | Badge — type-specific color |
| Category | `category` (source category badge) | 120px | Badge |
| Default Value | `defaultValue` | 180px | Text — truncated with tooltip |
| Description | `description` | 200px | Text — truncated with tooltip |
| Templates | `templateCount` | 100px | Number — right-aligned |
| Status | `status` | 100px | StatusBadge |
| Actions | — | 100px | Edit + Delete icon buttons |

**AND** the data grid **SHALL** support client-side pagination with configurable page sizes (10, 25, 50)  
**AND** the data grid **SHALL** support client-side sorting by name, type, category, and templateCount  
**AND** the data grid **SHALL** show a loading overlay while data is fetching  
**AND** the data grid **SHALL** show an empty-state message when no variables exist  
**AND** the data grid **SHALL** show a no-results message when filters return no matches

**Acceptance Criteria:**
- AC-13-01a: Page renders at route `/certificates/variables` with `DesktopPageContainer` layout
- AC-13-01b: `DesktopPageHeader` displays title and subtitle from i18n
- AC-13-01c: "New Variable" button (using `DesktopPrimaryPageAction`) is visible only when user has `CertificateTemplateManage` permission
- AC-13-01d: Table renders all 9 columns in correct order with correct widths
- AC-13-01e: Key column displays the value in `{{variable_name}}` format using a monospace `Chip`
- AC-13-01f: Type column displays the data type as a color-coded `Chip` (text=blue, number=green, date=orange, select=purple)
- AC-13-01g: Category column displays the source category as a `Chip` with appropriate icon
- AC-13-01h: Description column truncates long text with `textOverflow: ellipsis` and shows full text on tooltip hover
- AC-13-01i: templateCount column right-aligns the number
- AC-13-01j: Status column uses `StatusBadge` category "certVariable" with `active`/`archived` states
- AC-13-01k: Row actions show edit and delete icon buttons (edit always visible; delete visible unless `isSystem === true`)
- AC-13-01l: Pagination controls render at the bottom with page-size selector (10/25/50)
- AC-13-01m: Loading overlay shows `CircularProgress` while data is loading
- AC-13-01n: Empty state shows i18n message `emptyState.title` + `emptyState.description`
- AC-13-01o: Sorting by name, type, category, and templateCount works by clicking column headers
- AC-13-01p: All strings come from i18n — no hardcoded text

---

### REQ-13-02: Variable Admin Page (Mobile)

**WHEN** user navigates to `/certificates/variables` on a mobile viewport  
**THEN** system **SHALL** render `MobilePageContainer` → `MobilePageHeader` → `MobileCardList`:
- `MobilePageHeader` with title and optional "New Variable" action (infinite if permitted)
- Optional inline search `TextField` below the header
- `MobileCardList` of `MobileCardListItem` entries — one per variable
- Each card shows: variable name (bold), `{{key}}` (monospace chip), type badge, category badge, description (truncated, 2 lines max), template count with icon
- `MobileFab` for creating new variables (visible only if permitted)
- Edge-to-edge layout following `DashboardLayoutMobile` convention (px: 0 on outer; content gutter via `MobilePageContainer`)
- Pagination folded into `paginationOptions` on `MobileCardList`

**AND** tap on a card opens the edit dialog  
**AND** long-press or card context menu (`MoreVertOutlined` icon) shows edit/delete actions  
**AND** delete is hidden for system variables

**Acceptance Criteria:**
- AC-13-02a: Page renders `MobilePageContainer` with edge-to-edge layout
- AC-13-02b: `MobilePageHeader` displays title from i18n
- AC-13-02c: Each `MobileCardListItem` shows name, key chip, type badge, category badge, description (2-line truncation), template count
- AC-13-02d: "New Variable" `MobileFab` renders only when user has `CertificateTemplateManage`
- AC-13-02e: Tap on card opens edit dialog (same dialog as desktop — responsive)
- AC-13-02f: Context menu (MoreVertOutlined) shows edit and delete actions
- AC-13-02g: Delete action in context menu is hidden for system variables
- AC-13-02h: Pagination controls render at bottom via `paginationOptions`
- AC-13-02i: Search field filters cards in real-time (debounced 300ms)
- AC-13-02j: All strings from i18n

---

### REQ-13-03: Filter Bar (Search + Type Filter)

**WHEN** user opens the filter bar on the variable admin page  
**THEN** system **SHALL** display:
- Search `TextField` with placeholder "Search by name or key…"
- Type filter `Select` dropdown with options: All, Text, Number, Date, Select
- Category filter `Select` dropdown with options: All, Static, Dynamic, Computed, User-Input

**AND** entering text in search filters variables by `name` OR `key` (case-insensitive)  
**AND** selecting a type filters by `type` column  
**AND** selecting a category filters by `category` column  
**AND** filters are stored in `certVariablesStore` so they survive tier switch (resize)  
**AND** filter values are cleared on page unmount (unless `persist` is added later)

**Acceptance Criteria:**
- AC-13-03a: Search field filters by name OR key in real-time (debounced 300ms)
- AC-13-03b: Type filter dropdown offers All/Text/Number/Date/Select
- AC-13-03c: Category filter dropdown offers All/Static/Dynamic/Computed/User-Input
- AC-13-03d: Combined filters work simultaneously (AND logic)
- AC-13-03e: Filter state persists across tier switch (resize from desktop to mobile or vice versa)
- AC-13-03f: Clear-filter option resets all filters
- AC-13-03g: No-results message displays when filters return empty list
- AC-13-03h: All filter labels from i18n

---

### REQ-13-04: Variable Creation Dialog

**WHEN** user clicks "New Variable"  
**THEN** system **SHALL** open a `Dialog` (responsive — full-screen on mobile, centered modal on desktop) with the following form:

| # | Field | Component | Required | Validation |
|---|-------|-----------|----------|------------|
| 1 | Name | `TextField` | Yes | 1-100 chars, unique globally, sanitized to `snake_case` (only in auto-key generation) |
| 2 | Key | `TextField` (auto-generated from name, editable) | Yes | `^[a-z][a-z0-9_]*$`, 1-50 chars, unique globally, lowercase_with_underscores |
| 3 | Type | `Select` dropdown | Yes | One of: `text`, `number`, `date`, `select` |
| 4 | Category | `Select` dropdown | Yes | One of: `static`, `dynamic`, `computed`, `user_input` |
| 5 | Default Value | Type-specific input (see REQ-13-06) | Conditional | Required if `category = static`; optional otherwise |
| 6 | Description | `TextField` multiline | No | 0-500 chars |
| 7 | Category-specific config (text/number/date/select) | Type-specific fields | Conditional | (see REQ-13-07) |
| 8 | Enum Values | List editor (if type = `select`) | Conditional | min 2, unique keys, key+label required (see REQ-13-08) |
| 9 | Validation Rules | Key-value pair editor | No | min/max, required, pattern (see REQ-13-09) |
| 10 | Variable Preview | Read-only preview chip | — | Shows `{{variable_key}}` in monospace chip |

**AND** the `Key` field auto-generates from `Name` as user types (snake_case transformation), but is editable independently once focused  
**AND** the auto-generation stops once the user manually edits the Key field  
**AND** the Variable Preview updates in real-time as the Key field changes  
**AND** the dialog has "Save" and "Cancel" buttons  
**AND** Save is disabled when form has validation errors or required fields are missing  
**AND** pressing Escape or clicking backdrop dismisses the dialog (with confirmation if form is dirty)

**AND** on successful save:
- The variable is created via `CreateVariableMutation` with optimistic Apollo cache update
- The dialog closes
- A success toast displays `form.createSuccess`
- The new variable appears in the table (first page if sorting ascending by name)

**Acceptance Criteria:**
- AC-13-04a: Dialog opens responsive — `fullScreen` on mobile, centered modal on desktop
- AC-13-04b: Name field accepts free text (1-100 chars)
- AC-13-04c: Key field auto-generates from Name in snake_case (e.g., "Student Name" → `student_name`)
- AC-13-04d: Key field becomes manually editable when focused (auto-generation stops)
- AC-13-04e: Key field validates `^[a-z][a-z0-9_]*$` in real-time with inline error message
- AC-13-04f: Key field validates unique-ness (beyond existing cache) in real-time (debounced 300ms) against server
- AC-13-04g: Type dropdown offers select: Text, Number, Date, Select (localized labels)
- AC-13-04h: Category dropdown offers select: Static, Dynamic, Computed, User-Input (localized labels)
- AC-13-04i: Default Value input renders type-specific component based on selected Type
- AC-13-04j: Default Value is required when `category = static` (inline error if missing)
- AC-13-04k: Description textarea accepts 0-500 chars with character counter
- AC-13-04l: Enum Values list editor renders only when `type = select`
- AC-13-04m: Validation Rules editor renders always (optional)
- AC-13-04n: Variable Preview chip shows `{{key}}` in real-time
- AC-13-04o: Save button is disabled when any validation error exists
- AC-13-04p: Cancel button dismisses dialog (with confirmation if dirty)
- AC-13-04q: Successful save closes dialog, shows toast, updates table
- AC-13-04r: All form labels, validation messages, and placeholders from i18n

---

### REQ-13-05: Variable Edit Dialog

**WHEN** user clicks the edit action on a variable row  
**THEN** system **SHALL** open the same Dialog as creation (REQ-13-04) but pre-populated with the variable's current data: name, key, type, category, defaultValue, description, enumValues, validationRules  
**AND** the `Type` field is locked (disabled) with a tooltip explaining that the data type cannot be changed after creation  
**AND** the `Key` field is locked (disabled) with a tooltip explaining that the key is immutable after creation to prevent breaking template bindings  
**AND** all other fields are editable  
**AND** on Save, `UpdateVariableMutation` sends only changed fields (delta patch)  
**AND** on success the dialog closes, a success toast displays `form.updateSuccess`, and the table row updates optimistically

**Acceptance Criteria:**
- AC-13-05a: Edit dialog pre-populates all fields with current variable data
- AC-13-05b: Type field is disabled with tooltip `form.typeLockedTooltip`
- AC-13-05c: Key field is disabled with tooltip `form.keyLockedTooltip`
- AC-13-05d: Name field is editable and re-validation for uniqueness (excluding self) runs
- AC-13-05e: Category field is editable
- AC-13-05f: Default Value is editable and type-specific sub-component renders for current type
- AC-13-05g: Description is editable
- AC-13-05h: Enum Values editor renders and is editable only if type = select
- AC-13-05i: Validation Rules editor is editable
- AC-13-05j: Variable Preview chip shows `{{key}}`
- AC-13-05k: Save button disabled when validation errors exist
- AC-13-05l: Update mutation sends delta patch (only changed fields)
- AC-13-05m: Successful save closes dialog, shows toast `form.updateSuccess`, updates row
- AC-13-05n: Cancel button dismisses dialog (confirmation if dirty)

---

### REQ-13-06: Default Value Input (Type-Specific)

**WHEN** user selects a `Type` in the create/edit dialog  
**THEN** system **SHALL** render the type-specific default value input:

| Type | Component | Input |
|------|-----------|-------|
| `text` | `TextDefaultValueInput` | `TextField` with potential minLength/maxLength enforcement (from validation rules) |
| `number` | `NumberDefaultValueInput` | `TextField` type="number" with min/max enforcement, decimal places formatting from validation rules |
| `date` | `DateVariableInput` | `AppDatePicker` (from `@/frontend/common/components/ui/form`) with optional format selector and relative date hint |
| `select` | `SelectDefaultValueInput` | `Select` dropdown populated from `enumValues` keys; shows label of selected option |

**AND** the default value input is disabled if `category = computed` (computed variables resolve at generation time — no manual default)  
**AND** if `category = dynamic`, a hint text displays explaining "Dynamic variables resolve their value at generation time from external data sources. A default value serves as a fallback."

**Acceptance Criteria:**
- AC-13-06a: Text type renders `TextField` with maxLength enforcement
- AC-13-06b: Number type renders `TextField` type="number" with min/max validation
- AC-13-06c: Date type renders `AppDatePicker` with locale-aware formatting
- AC-13-06d: Select type renders `Select` dropdown from enumValues
- AC-13-06e: Computed category disables default value input with hint text
- AC-13-06f: Dynamic category shows fallback hint text
- AC-13-06g: All hint texts from i18n

---

### REQ-13-07: Type-Specific Configuration Fields

**WHEN** user selects a data type in the dialog  
**THEN** system **SHALL** render type-specific configuration fields in a SectionPanel-like group below the primary fields:

**Text config:**
- `minLength` — `TextField` type="number" (optional, 0-200)
- `maxLength` — `TextField` type="number" (optional, 1-200, must be ≥ minLength)
- `pattern` — `TextField` regex pattern string (optional)

**Number config:**
- `minValue` — `TextField` type="number" (optional)
- `maxValue` — `TextField` type="number" (optional, must be ≥ minValue)
- `decimalPlaces` — `Select` offering 0, 1, 2, 3, 4

**Date config:**
- `dateFormat` — `RadioGroup` with options: short, medium, long (default: medium)
- `relativeDate` — `TextField` optional, placeholder with example ("e.g., today + 30 days")

**Select config:**
- See REQ-13-08 (Enum Values list editor)

**Acceptance Criteria:**
- AC-13-07a: Text config shows minLength, maxLength, pattern fields
- AC-13-07b: Text config validates minLength ≤ maxLength, both within 0-200
- AC-13-07c: Number config shows minValue, maxValue, decimalPlaces fields
- AC-13-07d: Number config validates minValue ≤ maxValue; decimalPlaces ∈ {0,1,2,3,4}
- AC-13-07e: Date config shows dateFormat RadioGroup (short/medium/long, default medium)
- AC-13-07f: Date config shows relativeDate TextField (optional)
- AC-13-07g: Changing type (only in create mode) switches the config panel
- AC-13-07h: All field labels from i18n

---

### REQ-13-08: Enum Values List Editor

**WHEN** user selects `Type = select` in the dialog  
**THEN** system **SHALL** render an enum values list editor:

- Each row has: Key `TextField` (placeholder "option_key", required), Label `TextField` (placeholder "Option Label", required), Remove `IconButton` (disabled if only 2 rows)
- "Add Option" `Button` at the bottom of the list
- Initial state: 2 empty rows
- Real-time validation:
  - Minimum 2 options (show error if fewer)
  - Unique keys (show error on duplicate key)
  - Key + Label required per row (inline errors)
  - Key format: `^[a-z][a-z0-9_]*$`

**AND** the `SelectDefaultValueInput` (REQ-13-06) dropdown is populated from filled options  
**AND** the dropdown shows the label of the selected key  
**AND** changing the options list updates the dropdown in real-time

**Acceptance Criteria:**
- AC-13-08a: Initial state renders 2 empty option rows
- AC-13-08b: Each row has Key, Label, and Remove button
- AC-13-08c: Add Option button adds a new row
- AC-13-08d: Remove button disabled when only 2 rows remain
- AC-13-08e: Key field validates format `^[a-z][a-z0-9_]*$`
- AC-13-08f: Duplicate key shows inline error
- AC-13-08g: Empty Key or Label shows inline error on blur
- AC-13-08h: Fewer than 2 options shows a section-level error
- AC-13-08i: SelectDefaultValueInput dropdown populates from filled options in real-time
- AC-13-08j: All labels from i18n

---

### REQ-13-09: Validation Rules Editor

**WHEN** user opens the create/edit dialog  
**THEN** system **SHALL** render an optional validation rules editor (collapsible `Accordion`):

- `required` — `Checkbox` (whether a value is mandatory at generation)
- `minLength` / `maxLength` — `TextField` type="number" (for text type, 0-200)
- `minValue` / `maxValue` — `TextField` type="number" (for number type)
- `pattern` — `TextField` regex pattern (for text type)
- `customValidationMessage` — `TextField` (override default validation error)

**AND** validation rules editor is collapsed by default  
**AND** expanding it shows the fields relevant to the current data type  
**AND** `required` is always available regardless of type

**Acceptance Criteria:**
- AC-13-09a: Validation rules editor is an `Accordion` collapsed by default
- AC-13-09b: `required` checkbox is always available
- AC-13-09c: Length fields show only for text type
- AC-13-09d: Value fields show only for number type
- AC-13-09e: Pattern field shows only for text type
- AC-13-09f: customValidationMessage is always available
- AC-13-09g: All labels from i18n

---

### REQ-13-10: Variable Deletion with Dependency Check

**WHEN** user clicks delete on a variable  
**THEN** system **SHALL** check if any templates reference this variable  
**AND** if `templateCount > 0`, display a warning `Dialog`:
- Title: `delete.dependencyWarningTitle`
- Message: `delete.dependencyWarningMessage` with `{count}` interpolation (Arabic pluralized)
- List: template names that reference the variable (first 10 + "and N more…" if >10)
- Buttons: "Delete Anyway" / "Cancel"

**AND** "Delete Anyway" confirms deletion by calling `DeleteVariableMutation` with optimistic cache update  
**AND** if `templateCount === 0`, display a simple confirmation `Dialog`:
- Title: `delete.confirmTitle`
- Message: `delete.confirmMessage` with `{name}` interpolation
- Buttons: "Delete" / "Cancel"

**AND** on successful deletion:
- The variable row is removed optimistically from the table
- A success toast displays `delete.success`
- Apollo cache evicts the variable and refetches any queries with `templateCount` data

**AND** system variables (`isSystem = true`) **SHALL NOT** show a delete button — the delete action is hidden entirely

**Acceptance Criteria:**
- AC-13-10a: Delete button visible only when `isSystem === false` and user has `CertificateTemplateManage`
- AC-13-10b: If `templateCount > 0`, dependency warning dialog shows list of dependent template names
- AC-13-10c: Dependency warning message uses Arabic pluralization for template count
- AC-13-10d: Confirming deletion with dependencies calls DeleteVariableMutation
- AC-13-10e: If `templateCount === 0`, simple confirmation dialog shows
- AC-13-10f: Confirming deletion calls DeleteVariableMutation
- AC-13-10g: After deletion, row removed from table and success toast shows
- AC-13-10h: System variables have no delete action button in row or context menu
- AC-13-10i: All dialog strings from i18n

---

### REQ-13-11: Variable Source Categories

**WHEN** user creates or edits a variable  
**THEN** system **SHALL** classify the variable into one of four source categories:

| Category | Key | Description | Default Value Allowed |
|----------|-----|-------------|----------------------|
| Static | `static` | Value is fixed and manually set by the user | Yes (required) |
| Dynamic | `dynamic` | Value is resolved at generation time from external data (student record, course record) | Yes (optional, as fallback) |
| Computed | `computed` | Value is calculated from other data at generation time (e.g., age = current date − birth date) | No (disabled) |
| User-Input | `user_input` | Value is supplied by the operator when generating a certificate | Yes (optional) |

**AND** the category affects the default value input behavior (see REQ-13-06)  
**AND** the category is displayed as a badge in the table (Category column)  
**AND** the category is filterable in the Filter Bar  
**AND** the category is stored in the `category` column on `certificate_variables` table (per Plan 1)  
**AND** the `CertificateVariableCategoryEnum` is defined in Plan 2 as a pgEnum and TS enum

**Acceptance Criteria:**
- AC-13-11a: Category dropdown offers Static, Dynamic, Computed, User-Input (localized)
- AC-13-11b: Computed category disables the default value input
- AC-13-11c: Dynamic category shows fallback hint text
- AC-13-11d: Static category requires a default value
- AC-13-11e: Category badge displays in the table Category column with icon + color per category
- AC-13-11f: Category filter works in the Filter Bar
- AC-13-11g: All category labels from i18n

---

### REQ-13-12: Interaction States

**WHEN** interacting with the variable admin page  
**THEN** system **SHALL** provide the following states:

| State | Trigger | Visual |
|-------|---------|--------|
| Loading | Data is fetching | AppDataGrid loading overlay (`CircularProgress`); MobileCardList shows loading `LinearProgress` |
| Error | Query or mutation fails | Error banner at top of page with retry button (`form.loadError` message) |
| Empty | No variables exist in system | Empty state with icon, title (`emptyState.title`), description (`emptyState.description`), and optional "New Variable" button |
| No Results | Filters return empty | `NoResultsRow` overlay message (`filters.noResults`) |
| Creating | Create mutation in flight | Save button shows `CircularProgress` (size small); dialog stays open |
| Editing | Update mutation in flight | Save button shows `CircularProgress` (size small); dialog stays open |
| Deleting | Delete mutation in flight | Delete button in dialog shows `CircularProgress`; tooltip says "Deleting…" |
| Dirty | Form has unsaved changes | Save button enabled; Cancel triggers confirmation dialog ("Discard changes?") |

**Acceptance Criteria:**
- AC-13-12a: Loading state shows `CircularProgress` overlay
- AC-13-12b: Error state shows error banner with retry button; does not crash the page
- AC-13-12c: Empty state shows icon + title + description; "New Variable" CTA if user has permission
- AC-13-12d: No-results state shows localized message when filters return empty
- AC-13-12e: Creating/editing state shows spinner on Save button, preserves dialog
- AC-13-12f: Deleting state shows spinner on Delete button
- AC-13-12g: Dirty form shows confirmation on Cancel/Escape
- AC-13-12h: All state messages from i18n

---

### REQ-13-13: Internationalization (i18n)

**WHEN** the user's locale is `en` or `ar`  
**THEN** system **SHALL** display all UI strings in the user's locale  
**AND** the following i18n namespaces **SHALL** exist under `certTranslations.variables`:
- `shell` — page title, subtitle, breadcrumbs, sidebar label
- `columns` — column labels, type labels, category labels
- `filters` — search placeholder, type filter options, category filter options, clear, no results
- `actions` — new variable, edit, delete, save, cancel, add option, remove option
- `dialogs` — create/edit dialog titles, field labels, validation errors, hints, locked tooltips
- `notifications` — create success, update success, delete success, delete confirmation, dependency warning, error messages
- `empty` — empty state title and description
- `types` — text, number, date, select labels and icons
- `categories` — static, dynamic, computed, user_input labels and descriptions

**AND** Arabic translations **SHALL** include:
- RTL-aware layout (text alignment right, icon positioning mirrored)
- Pluralization for template count (zero/one/two/few/many) in dependency warning
- Interpolated messages for variable names (`{name}`, `{count}`)

**Acceptance Criteria:**
- AC-13-13a: All UI strings render in user's locale (en or ar)
- AC-13-13b: Arabic layout is RTL-aware (text right, icons mirrored)
- AC-13-13c: Template count message uses Arabic pluralization
- AC-13-13d: Interpolated messages correctly substitute `{name}` and `{count}`
- AC-13-13e: No hardcoded strings anywhere in components
- AC-13-13f: All namespaces registered via `defineNamespace<Labels>(id, { load })` pattern

---

### REQ-13-14: Permission Integration

**WHEN** user accesses `/certificates/variables`  
**THEN** system **SHALL** check `CertificateTemplateManage` permission  
**AND** if user lacks the permission, page renders "Access Denied" state (via `RequirePermission` wrapper)  
**AND** if user has view-only access (e.g., Teacher), the page renders in read-only mode:
- "New Variable" button is hidden (desktop and FAB on mobile)
- Row edit and delete actions are hidden
- Table and filters are still visible

**AND** the permission check occurs at three levels:
1. **Server-side (page.tsx)**: `requirePermissionForPage(userId, [AppPermission.CertificateTemplateManage], locale, context)` — returns `allowed: boolean`; if denied, renders a permission-denied component instead of the container
2. **Client-side (RequirePermission wrapper)**: Container is wrapped in `<RequirePermission permissions={[GraphQLAppPermission.CertificateTemplateManage]}>`
3. **Client-side (conditional rendering)**: Within ViewModel, `canManage = hasPermission(AppPermission.CertificateTemplateManage)` — drives visibility of create/edit/delete UI

**Acceptance Criteria:**
- AC-13-14a: Server-side permission check gates the entire page
- AC-13-14b: `RequirePermission` wrapper gates the Container
- AC-13-14c: "New Variable" button hidden when user lacks `CertificateTemplateManage`
- AC-13-14d: Row edit/delete actions hidden when user lacks `CertificateTemplateManage`
- AC-13-14e: Table, filters, and pagination remain visible to read-only users
- AC-13-14f: A TEACHER role can view variables but cannot modify them

---

### REQ-13-15: Navigation and Route

**WHEN** user navigates the sidebar  
**THEN** system **SHALL** show a "Variables" link under a "Certificates" section in the sidebar navigation  
**AND** the route is `/certificates/variables`  
**AND** the page title (in the browser tab) is generated via `generateMetadata()`: `certificates.variables.shell.pageTitle`  
**AND** breadcrumbs show: Home → Certificates → Variables

**Acceptance Criteria:**
- AC-13-15a: Route `/certificates/variables` renders the page
- AC-13-15b: Sidebar shows "Variables" link under "Certificates" section
- AC-13-15c: Page metadata (title) is locale-aware
- AC-13-15d: Breadcrumbs render correctly on desktop and mobile

---

### REQ-13-16: Variable Preview Component

**WHEN** user is creating or editing a variable in the dialog  
**THEN** system **SHALL** show a `VariablePreviewChip` that displays the variable key in template syntax format: `{{variable_key}}`  
**AND** the chip uses a monospace font family  
**AND** the chip has a subtle background (`theme.palette.action.hover`) and border (`theme.palette.divider`)  
**AND** the chip updates in real-time as the Key field changes  
**AND** the chip also appears in the table's "Key" column to show how the variable appears in templates

**Acceptance Criteria:**
- AC-13-16a: Preview chip renders `{{key}}` format in monospace
- AC-13-16b: Chip background uses `theme.palette.action.hover`
- AC-13-16c: Chip border uses `theme.palette.divider`
- AC-13-16d: Chip updates in real-time as Key changes
- AC-13-16e: Table Key column uses the same chip component
- AC-13-16f: No hardcoded colors

### REQ-13-17: CSV Import for Bulk Variable Creation

**WHEN** user clicks "Import from CSV" button on the variable admin page  
**THEN** system **SHALL** open a `Dialog` with a file upload area:
- Drag-and-drop zone or file `Input` accepting `.csv` files
- Preview table showing first 10 rows of parsed CSV
- Column mapping step: user maps CSV columns to variable fields (Name, Key, Type, Category, Default Value, Description)
- Validation of each row before import

**AND** CSV structure **SHALL** support these columns:
| CSV Column | Variable Field | Required | Notes |
|------------|----------------|----------|-------|
| name | `name` | Yes | Display name |
| key | `key` | Yes | Must be unique, auto-validated |
| type | `type` | Yes | text, number, date, select |
| category | `category` | Yes | static, dynamic, computed, user_input |
| default_value | `defaultValue` | Conditional | Required for static |
| description | `description` | No | Optional |
| enum_keys | `config.options[*].key` | If type=select | Comma-separated |
| enum_labels | `config.options[*].label` | If type=select | Comma-separated |
| min_length | `config.minLength` | If type=text | Optional |
| max_length | `config.maxLength` | If type=text | Optional |
| min_value | `config.minValue` | If type=number | Optional |
| max_value | `config.maxValue` | If type=number | Optional |
| decimal_places | `config.decimalPlaces` | If type=number | Optional |
| date_format | `config.dateFormat` | If type=date | Optional |
| relative_date | `config.relativeDate` | If type=date | Optional |

**AND** the import process **SHALL**:
1. Parse and validate all rows
2. Show validation errors per row with specific field messages
3. Allow user to fix errors in-line or skip invalid rows
4. On confirm, call `CreateVariableMutation` for each valid row (batch via Apollo `batchLink` or sequential)
5. Show progress indicator during batch creation
6. On completion, show summary toast: `{created} created, {skipped} skipped, {errors} errors`

**Acceptance Criteria:**
- AC-13-17a: Import button visible only when user has `CertificateTemplateManage`
- AC-13-17b: File upload accepts `.csv` only (rejects other extensions)
- AC-13-17c: Preview shows first 10 rows with column headers
- AC-13-17d: Column mapping step allows drag-to-match or dropdown selection
- AC-13-17e: Row validation shows inline errors (duplicate key, invalid type, missing required)
- AC-13-17f: User can edit cell values in preview before import
- AC-13-17g: Batch creation uses optimistic updates per row
- AC-13-17h: Progress bar shows current row / total during import
- AC-13-17i: Summary toast with counts uses i18n pluralization
- AC-13-17j: All dialog strings from i18n

---

### REQ-13-18: Variable Usage Display (Element Bindings)

**WHEN** user clicks the "Usage" icon/button on a variable row (desktop) or taps the "Usage" menu item (mobile)  
**THEN** system **SHALL** open a side panel (desktop) / bottom sheet (mobile) displaying:
- List of all template elements that reference this variable by `key`
- Each entry shows: template name (link to template editor), element type, element content preview, position
- Filter by element type (text, date, image, QR, shape)
- Search by template name or element content

**AND** the side panel **SHALL** be responsive:
- Desktop: `DesktopSectionPanel` sliding from right (width 480px) over the table
- Mobile: Full-screen `MobileCardList` in a `SwipeableDrawer` anchored bottom

**AND** the data **SHALL** be fetched via `VariableElementBindingsQuery`:
- Args: `variableId: ID!`
- Returns: `{ bindings: [{ elementId, templateId, templateName, elementType, content, x, y, width, height }] }`

**AND** clicking a template name **SHALL** navigate to the template editor with the element selected

**Acceptance Criteria:**
- AC-13-18a: Usage button visible in row actions (desktop) and card menu (mobile)
- AC-13-18b: Side panel / bottom sheet opens with element bindings list
- AC-13-18c: Each binding shows template name, element type, content preview
- AC-13-18d: Template name is a link that navigates to editor with element selected
- AC-13-18e: Filter by element type works
- AC-13-18f: Search by template name / content works
- AC-13-18g: Empty state shows "No elements use this variable"
- AC-13-18h: Loading state shows skeleton cards
- AC-13-18i: All strings from i18n

---

### REQ-13-19: Variable Categories Management (if applicable)

**WHEN** the system initializes (via Plan 1 migration)  
**THEN** system **SHALL** have a fixed set of 4 source categories as a pgEnum: `static`, `dynamic`, `computed`, `user_input`

**AND** these categories **SHALL NOT** be user-editable (no CRUD UI for categories)

**AND** the category display **SHALL** use consistent icons and colors:
| Category | Icon | Color (Theme Token) | Description |
|----------|------|---------------------|-------------|
| static | `SettingsOutlined` | `theme.palette.info.main` | Fixed value set by user |
| dynamic | `SyncOutlined` | `theme.palette.primary.main` | Resolved from external data at generation |
| computed | `CalculateOutlined` | `theme.palette.secondary.main` | Calculated from other variables |
| user_input | `PersonOutlined` | `theme.palette.success.main` | Supplied by operator at generation |

**Acceptance Criteria:**
- AC-13-19a: Categories are fixed enum (no user CRUD)
- AC-13-19b: Each category displays with correct icon and color
- AC-13-19c: Category badge in table uses icon + label
- AC-13-19d: Category filter dropdown uses icons
- AC-13-19e: All category strings from i18n

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-13-01 | Page initial load < 1s (with cache) / < 2s (first load) |
| NFR-13-02 | Search filter debounce 300ms |
| NFR-13-03 | Key uniqueness check debounce 300ms |
| NFR-13-04 | Optimistic mutations with rollback on error |
| NFR-13-05 | All state in Zustand store survives tier switch (resize desktop↔mobile) |
| NFR-13-06 | No data persisted to localStorage (ephemeral session state) |
| NFR-13-07 | Mobile and desktop views use same ViewModel interface — zero diverging business logic |
| NFR-13-08 | All colors from theme palette — no hex/rgb/named colors |
| NFR-13-09 | All icons use `*Outlined` suffix (MUI v9) |
| NFR-13-10 | No `console.*` — use `logger` from `@/frontend/utils/logger` |
| NFR-13-11 | No `useLazyQuery` — use `useQuery` with `skip` option |
| NFR-13-12 | CSV import handles up to 500 rows without UI blocking (use Web Worker or chunked processing) |
| NFR-13-13 | Variable usage panel loads within 500ms for up to 100 bindings |
| NFR-13-14 | All new components follow MUI v9 `sx` prop pattern (no style props on Typography/Stack/Box/Grid) |
| NFR-13-15 | React 19 compliance: use `React.SyntheticEvent<HTMLFormElement>` not `FormEvent` |
| NFR-13-16 | Accessibility: all interactive elements keyboard-focusable (Tab order logical) |
| NFR-13-17 | Accessibility: all dialogs trap focus (ESC closes, focus returns to trigger) |
| NFR-13-18 | Accessibility: all form fields have associated `<label>` or `aria-label` |
| NFR-13-19 | Accessibility: all icons have `aria-hidden="true"` with adjacent text or `aria-label` |
| NFR-13-20 | Accessibility: table has proper `<caption>` and column `<th scope="col">` |
| NFR-13-21 | Accessibility: status badges use semantic color + text (not color alone) |
| NFR-13-22 | Accessibility: skip links for main content areas |

---

## 5. Constraint Assumptions

1. **Variables are global** — not per-template. This is a semantic shift from the original design. The `certificate_variables` table (Plan 1) holds all variable definitions. Templates reference variables by `key` (via `template_variable_bindings` table or similar — per Plan 1/10).
2. **Variable types (data types)**: text, number, date, select — per INTER_PLAN_CONTRACTS.md §4 (enum `CertificateVariableType`).
3. **Variable categories (source)**: static, dynamic, computed, user_input — per the design decision to classify variable origin. This is a new enum `CertificateVariableCategory` added to Plan 2's enum catalog.
4. **Permission**: Uses existing `CertificateTemplateManage` — no separate variable permission in INTER_PLAN_CONTRACTS.md. Future plans may introduce a separate permission.
5. **Key immutability**: Once a variable is created, its `key` cannot be changed (to prevent breaking template bindings). Only the `name` (display name) can be changed.
6. **Type immutability**: Data type cannot be changed after creation (prevents incompatible default values and invalidating enum configs).

---

## 6. Dependency Risks

| Risk | Mitigation |
|------|-----------|
| Plan 1 does not define `certificate_variables` as a global (non-template-bound) table | This plan assumes the table exists from Plan 1. If Plan 1 creates a per-template table, a schema migration plan is required. |
| Plan 2 may not define `CertificateVariableCategory` enum | This plan depends on Plan 2 adding this enum. Block Plan 13 until Plan 2 confirms. |
| `templateCount` requires a query joining `certificate_variables` with `certificate_template_variable_bindings` | The GraphQL API (Plan 5) must provide `templateCount` as a computed field. |
| Plan 10 (Template Editor) binds variables to elements by `key` — if key changes, bindings break | This is why key is immutable post-creation (REQ-13-05). |
| CSV import complexity | Timeline slip | Implement after core CRUD; use PapaParse in Web Worker |
| Variable usage panel performance | Slow UX | Cache bindings query; paginate if >50 bindings |
| Accessibility audit gaps | Compliance risk | Include a11y checklist in T11 knowledge propagation |
