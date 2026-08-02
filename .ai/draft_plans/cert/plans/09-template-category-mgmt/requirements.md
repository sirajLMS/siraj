# Requirements — Plan 09: Template Category Management

> **Plan**: 09 — Template Category Management
> **Depends On**: Plan 5 (GraphQL API)
> **Stakeholders**: Certificate admin, system admin
> **Related Docs**: MASTER_ARCHITECTURE.md; cgvs_analysis/01-generation-logic.md §3; cgvs_analysis/04-template-ui.md §3, §9; siraj_analysis/05-frontend-patterns.md; siraj_analysis/06-i18n-system.md

---

## 1. Introduction

### Overview

The Template Category Management feature provides a hierarchical category tree for organizing certificate templates. Admins can create nested categories, rename them, reorder with drag-and-drop, assign templates to categories, and filter templates by category selection. The tree supports expansion/collapse, lazy-loading of children, and inline editing.

### Business Value

- Organize templates into a navigable hierarchy for efficient discovery
- Enable drag-and-drop reordering within and across category levels
- Allow template assignment to categories from the category management view
- Support deep nesting (parent → child → grandchild) without depth limits

### Scope

| In Scope | Out of Scope |
|----------|-------------|
| Category tree component (expand/collapse, lazy-load children) | Template CRUD (Plan 8) |
| Category CRUD: create, rename, soft-delete | Template editor UI (Plans 10-12) |
| Category reorder via drag-and-drop (desktop) | Template variable management (Plan 13) |
| Category-template assignment (move templates between categories) | Certificate generation (Plan 17) |
| Self-referential parent-child nesting (unlimited depth) | Recipient group management (Plan 14) |
| Inline editing (desktop) and dialog editing (mobile) | Archiving / suspension category logic (handled by Plan 4 service) |
| Search/filter categories by name | Full-text search on templates (Plan 8) |
| Zustand store for tree state (expanded nodes, selected node, search) | |
| GraphQL documents for category queries/mutations | |
| App Router page at `/certificates/categories` | |
| Desktop tree view + Mobile simplified list view | |
| i18n keys for all category labels, confirm dialogs, errors | |
| **Accessibility compliance (WCAG 2.1 AA)** | **Category restore/hard-delete UI (future trash plan)** |
| **Mobile touch targets (48×48dp minimum)** | **Multi-select drag-and-drop** |
| **Concurrent edit conflict handling (optimistic locking)** | **Category import/export** |

---

## 1.5 Role Access Matrix

| Role | CertificateTemplateView | CertificateTemplateManage | Category Tree Browse | Category CRUD | Category Reorder | Template Move |
|------|-------------------------|---------------------------|---------------------|---------------|------------------|---------------|
| Superadmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Supervisor | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ |
| Teacher | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ |
| Parent | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ |
| Student | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Staff | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ |

> **Note**: Per INTER_PLAN_CONTRACTS §1, the canonical permission keys are `CertificateTemplateView` (`certificates.templates.view`) and `CertificateTemplateManage` (`certificates.templates.manage`). The legacy key `CERTIFICATES_CATEGORIES_MANAGE` is **not** used.

---

## 1.6 Accessibility Requirements (WCAG 2.1 AA)

### 1.6.1 Keyboard Navigation
- All interactive elements reachable and operable via keyboard
- Tab order follows visual hierarchy (tree nodes left-to-right, top-to-bottom)
- Focus indicators visible (2px outline, `theme.palette.primary.main` color)
- No keyboard traps — Escape closes dialogs, menus, and cancels drag operations

### 1.6.2 Screen Reader Support
- Tree structure conveyed via `role="tree"` / `role="treeitem"` with `aria-level`, `aria-setsize`, `aria-posinset`
- Expanded/collapsed state via `aria-expanded`
- Selected node via `aria-selected="true"`
- Drag-and-drop announced via `aria-roledescription="draggable item"` and live region announcements (dnd-kit built-in)
- Dialogs use `role="dialog"` with `aria-labelledby` and `aria-describedby`
- Status messages (snackbars) via `role="status"` / `aria-live="polite"`

### 1.6.3 Color & Contrast
- All text meets 4.5:1 contrast ratio (normal) / 3:1 (large text 18px+ or 14px+ bold)
- Color not used as sole indicator — icons + text for status, validation, drag states
- Category color tokens chosen from palette with sufficient contrast against white/black backgrounds
- Focus ring uses `theme.palette.primary.main` (meets 3:1 against background)

### 1.6.4 Touch Targets (Mobile)
- Minimum 48×48dp for all interactive elements (per Material 3 / WCAG 2.5.5)
- `IconButton` size `"medium"` (40px) + 8px padding = 48px touch target
- `MobileFab` 56×56dp (exceeds minimum)
- Accordion expand triggers full row as touch target

### 1.6.5 Motion & Animation
- Respects `prefers-reduced-motion` — drag animations disabled, transitions instantaneous
- No auto-playing animations
- Drag preview opacity transition respects reduced motion

### 1.6.6 Language & RTL
- All user-facing strings via i18n (no hardcoded text)
- RTL layout via MUI RTL provider (no manual CSS direction overrides)
- Arabic translations for all keys (requirements.md §4.2)

---

## 1.7 Mobile-Specific Requirements

| Requirement | Desktop | Mobile |
|-------------|---------|--------|
| Category tree | Recursive drag-and-drop tree | Flat expandable accordion list |
| Reorder | Drag-and-drop (dnd-kit) | "Move Up/Down" in action menu |
| Inline rename | Double-click `InlineEditableLabel` | Dialog via action menu |
| Create category | Button in header + context menu | FAB (bottom-right) |
| Template pane | Side-by-side `AppDataGrid` | Stacked `MobileCardList` below category |
| Search | `TextField` in tree header | `TextField` in `MobileContentInset` |
| Touch targets | N/A (mouse) | ≥48×48dp all interactive elements |
| Drag gestures | Mouse + keyboard | N/A (disabled) |

---

## 1.8 Edge Cases & Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| **Concurrent edit** (two users rename same category) | Backend uses optimistic locking (`version` column or `updatedAt` CAS). Second mutation returns `OPTIMISTIC_LOCK_FAILED` → ViewModel shows `errors.concurrentModification` snackbar, refetches fresh data |
| **Network failure during drag** | Optimistic update rolls back on mutation error → visual position reverts, `errors.reorderFailed` snackbar |
| **Network failure during search** | `Alert` with retry button (`errors.loadFailed`); previous tree state preserved |
| **Category deleted while expanded** | Tree evicts node; if selected, selection clears; template pane shows "Select a category" prompt |
| **Search returns 0 results** | `labels.searchNoResults` shown; expansion state preserved; clearing search restores full tree |
| **Deep nesting (>5 levels)** | Visual indentation via `level * theme.spacing(2)`; horizontal scroll on mobile if needed |
| **Drag onto own descendant** | Frontend: red indicator (`theme.palette.errorContainer`), drop rejected. Backend: `CYCLE_DETECTED` structured error with path |
| **Move template to deleted category** | `CategoryPicker` excludes deleted categories (filtered by `deletedAt IS NULL`); backend returns `NotFoundError` |
| **Page refresh with expanded nodes** | Expansion state resets (no `persist` middleware); root categories reload on mount |
| **Large tree (>500 categories)** | Lazy-loading + hover-preload keeps network calls minimal; search uses server-side `categorySearch` |

---

## 1.9 Pagination, Search & Filtering Requirements

- **Tree pagination**: N/A (lazy-loaded tree, no pagination)
- **Template list pagination**: Server-side page-number offset (per INTER_PLAN_CONTRACTS §8), `AppDataGrid` `mode="server"`, page size 20 default
- **Category search**: Server-side `categorySearch(term)` query (per F-09-2), debounced 300ms, results include matched categories + full ancestor chain, auto-expands ancestors
- **Template filtering**: By status (`DRAFT`/`PUBLISHED`/`ARCHIVED`) via `filterArgs` on `categoryTemplates` query

---

## 2. Requirements

### REQ-09-01: Category Tree Display

**WHEN** the user navigates to `/certificates/categories`, **THE SYSTEM SHALL** load root-level categories (categories with `parentCategoryId = null`) and display them as a tree.

**Acceptance Criteria**:
- Root categories load on page mount via Apollo `useQuery`
- Each tree node displays: category name, expand/collapse chevron (if it may have children), action menu
- Children load lazily — expanding a node fetches its children via a separate query
- Expansion state (Set of expanded node IDs) persists in Zustand store
- Selected category drives a template list in the adjacent pane (desktop) or below (mobile)
- Lazy-loading: children are NOT fetched until the node is expanded or hovered (hover-preload on desktop)
- Fetched-node tracking prevents redundant Apollo queries (Set of fetched node IDs in store)

### REQ-09-02: Category Create

**WHEN** the user with `CertificateTemplateManage` permission triggers "Create Category", **THE SYSTEM SHALL** open a shared create dialog (name, description, optional parent selection) — identical on desktop and mobile per Shared Dialogs design decision.

**Acceptance Criteria**:
- Create button visible only to users with `CertificateTemplateManage` permission (gated via `canManage` from ViewModel)
- Desktop: "Create Root Category" button in `DesktopPageHeader` actions; "Add Subcategory" in `CategoryActionMenu` context menu
- Mobile: FAB (Floating Action Button) via `MobileFab` for root create; "Add Subcategory" in `CategoryMobileActionMenu` bottom-sheet
- Create dialog (MUI `Dialog`, shared component `CreateCategoryDialog.tsx`): `TextField` for name (required), `TextField` multiline for description (optional), `CategoryPicker` autocomplete for parent (prefilled from `parentForCreate`)
- Creating a root category: `parentCategoryId = null`
- Creating a child category: triggered from a parent node's action menu, auto-sets `parentId` in the dialog
- Category name is required (non-empty, max 255 chars) — validation shows `field.name` error inline
- Description is optional (TEXT field)
- Loading state: submit button shows `CircularProgress` during mutation, button disabled
- On success: new node appears in tree (Apollo `cache.updateQuery` for parent's children), expansion presets to show the new child, snackbar with `success.created(name)`
- On failure: localized error message displayed (snackbar with `errors.createFailed`), dialog stays open
- Dialog closeable via Escape key and backdrop click (unsaved changes warn)

### REQ-09-03: Category Rename (Inline + Dialog)

**WHEN** the user with `CertificateTemplateManage` permission triggers edit on a category node, **THE SYSTEM SHALL** allow renaming the category and editing the description.

**Acceptance Criteria**:
- **Desktop**: double-click on category name activates inline editing via `InlineEditableLabel.desktop.tsx` (EditableTypography pattern); Enter saves, Escape cancels; blur also saves
- **Desktop inline edit**: only name is editable inline; description edited via `EditCategoryDialog` from context menu
- **Mobile**: edit triggered via `CategoryMobileActionMenu` bottom-sheet → opens shared `EditCategoryDialog.tsx` (full-screen dialog on mobile) with name + description fields
- Name field is required, pre-filled with current value, validated non-empty max 255 chars
- Loading state: inline edit shows nothing special (optimistic), dialog shows `CircularProgress` on submit button
- On success: tree updates node label in place (Apollo auto-normalization by `id`), snackbar with `success.updated(name)`
- On failure: localized error message; inline edit reverts to original, dialog stays open with error

### REQ-09-04: Category Delete (Soft Delete)

**WHEN** the user with `CertificateTemplateManage` permission triggers delete on a category, **THE SYSTEM SHALL** confirm the action and soft-delete the category.

**Acceptance Criteria**:
- Delete triggered from action menu (both desktop `CategoryActionMenu` and mobile `CategoryMobileActionMenu`)
- Confirmation dialog (shared `DeleteCategoryConfirmDialog.tsx`): shows category name (`dialog.delete.confirm(name)` interpolated), template count affected (`dialog.delete.hasTemplatesWarning(count)` pluralized), warning about child categories (`dialog.delete.hasChildrenWarning` if children exist)
- If category has child categories: warns that all children will be cascade-deleted (backend handles via service layer)
- If category has templates: warns that templates will be moved to parent or root before deletion
- Delete button uses `sx` with `theme.palette.error.main` color (no hardcoded color)
- On confirm: mutation executes soft delete (`deletedAt` timestamp set); node removed from tree (Apollo `cache.evict({ id })` + `cache.gc()`), selected category resets to null, snackbar with `success.deleted(name)`
- On cancel: no change — dialog closes
- Deleted categories are excluded from tree queries via `deletedAt IS NULL`; sibling `order` values are not renumbered (gaps are tolerated)
- Restore / hard-delete lifecycle is OUT OF SCOPE (deferred to a future "trash" plan)

### REQ-09-05: Category Reorder (Drag-and-Drop, Desktop)

**WHEN** the user with `CertificateTemplateManage` permission drags a category node to a new position, **THE SYSTEM SHALL** reorder the category and persist the new order using the positional reorder API.

**Acceptance Criteria**:
- Drag-and-drop via `@dnd-kit/core` + `@dnd-kit/sortable` on desktop view only (per INTER_PLAN_CONTRACTS §20 — these libraries are already installed)
- `DndContext` wraps the entire tree; nested `SortableContext` per parent level
- Valid drop targets: before/after a sibling (reorder via `ReorderCategoryInput { beforeId?, afterId? }`), onto a category node (make child via `newParentId`)
- Invalid drop: onto own descendant — cycle prevention via frontend `descendantIds` Set check (visual: red indicator, `sx` background from `theme.palette.errorContainer`)
- Custom collision detection: top 25% → insert before, bottom 25% → insert after, middle 50% → drop into (make child)
- `CategoryTreeDropIndicator.desktop.tsx` shows visual feedback: blue line (between siblings) or highlight (into parent)
- Drag preview: ghost of the node label with reduced opacity
- Keyboard accessibility: Space to pick up, Arrow keys to move, Enter to drop, Escape to cancel; `aria-roledescription="draggable item"`
- On drop: mutation calls positional `reorderCategory` (per INTER_PLAN_CONTRACTS §12) with `{ beforeId? | afterId?, newParentId? }`; backend recalculates `order` with gap allocation; Apollo `cache.updateQuery` updates tree
- Reorder is disabled on mobile; categories displayed as flat list; reordering via `CategoryMobileActionMenu` "Move Up"/"Move Down" context menu items calling the same mutation
- On success: snackbar with `success.reordered`
- On failure: visual position reverts, snackbar with `errors.reorderFailed`

### REQ-09-06: Category Color/Icon

**WHEN** the user with `CertificateTemplateManage` permission edits a category, **THE SYSTEM SHALL** allow selecting a color and icon for visual differentiation.

**Acceptance Criteria**:
- **Color**: 10-15 preset palette colors available (defined in `shared/constants/certificate-category-colors.ts`); selected via `ColorSwatchPicker` in the edit dialog
- **Icon**: MUI icon set subset (15-20 relevant Material icons: `FolderOutlined`, `SchoolOutlined`, `BusinessOutlined`, `ScienceOutlined`, `LanguageOutlined`, etc.); selected via `IconPicker` in the edit dialog
- Color and icon are optional fields with sensible defaults (default color: `theme.palette.grey[400]`, default icon: `FolderOutlined`)
- Preview: avatar in the tree node and in the edit dialog header shows `CategoryAvatar` with selected color and icon
- All colors come from a fixed palette constant (no hardcoded hex values in components); palette defined as named tokens
- **Desktop**: color and icon pickers render inline in the dialog as grid swatches
- **Mobile**: color and icon pickers render as horizontal scroll rows in the full-screen dialog

### REQ-09-07: Category-Template Assignment

**WHEN** the user selects a category in the tree, **THE SYSTEM SHALL** display templates assigned to that category in the adjacent pane (desktop) or below (mobile).

**Acceptance Criteria**:
- Selecting a category node loads templates via `categoryTemplates` query (from Plan 5, page-number offset pagination per INTER_PLAN_CONTRACTS §8)
- **Desktop**: template pane is a `SectionPanel` to the right of the tree showing `AppDataGrid` with columns: name, status (`StatusBadge`), createdAt, actions
- **Mobile**: template pane is a `MobileCardList` below the selected category showing template cards
- Template pane shows: template name, preview thumbnail, status badge, actions (move to another category, view)
- "Move to Category" action opens `CategoryPickerDialog` (shared component); on confirm, mutation updates template's `categoryId` with optimistic update (per F-09-6)
- Templates moved to a different category update the list (Apollo `cache.evict` + `cache.gc()`)
- "All Templates" virtual node shows templates with `categoryId = null` (uncategorized)
- Selecting root ("All") shows all templates across all categories
- Loading state: `AppDataGrid` skeleton rows (desktop) / `MobileCardList` skeleton items (mobile)
- Empty state: localized "No templates in this category" with "Add Template" CTA (links to Plan 5 template editor)

### REQ-09-08: Category Search/Filter

**WHEN** the user types a search query in the category search field, **THE SYSTEM SHALL** filter the tree to show only matching categories and their parent chain via server-side search.

**Acceptance Criteria**:
- Search field above the tree (desktop: `TextField` in tree pane header via `CategorySearchBar.desktop.tsx`; mobile: `TextField` in `MobileContentInset` above list via `CategorySearchBar.mobile.tsx`)
- Server-side search: query sends `search` parameter to `certificateCategories` query (per F-09-2, aligning with design.md §3.1 — `categorySearch` is NOT in-memory filtering)
- Debounced input (300ms) stored in Zustand `searchTerm`; ViewModel's debounced value drives the Apollo query `variables.search`
- Results include matching categories and their full parent chain (backend returns ancestors)
- Auto-expand all parents of matched results in expansion state
- Clearing search restores full tree with previous expansion state
- No-results state: `MobileEmptyState` on mobile / `Alert` with `severity="info"` on desktop showing localized "No categories found" message
- Loading state: search field shows `InputAdornment` with `CircularProgress` (size small) during query

### REQ-09-09: Permission Enforcement (Split View/Manage)

**WHEN** a user accesses `/certificates/categories`, **THE SYSTEM SHALL** enforce split permission levels per F-09-4.

**Acceptance Criteria**:
- **View permission** (`AppPermission.CertificateTemplateView` = `certificates.templates.view`): granted to users who can browse categories and templates; CRUD action buttons hidden; tree and template pane are read-only
- **Manage permission** (`AppPermission.CertificateTemplateManage` = `certificates.templates.manage`): granted to users who can create, edit, delete, reorder categories; all CRUD action buttons visible
- App Router page checks `requirePermissionForPage(userId, [AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage], locale, context)` — either permission grants access
- Container wraps content in `<RequirePermission permissions={[AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage]}>`
- Without either permission: user is redirected to the forbidden page (handled by `requirePermissionForPage`)
- ViewModel exposes `canManage: boolean` (derived from `useHasPermission([AppPermission.CertificateTemplateManage])`) and `canView: boolean` (derived from `useHasPermission([AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage])`)
- CRUD actions (create/rename/delete/reorder) are conditional on `canManage` — buttons hidden when false
- "Move to Category" in template pane is conditional on `canManage`

### REQ-09-10: Mobile View

**WHEN** a user on a mobile device accesses the category management page, **THE SYSTEM SHALL** display a simplified category list with full CRUD capability.

**Acceptance Criteria**:
- **Page container**: `MobilePageContainer` with `MobilePageHeader` showing title and subtitle
- **Category list**: `MobileCardList` rendering `CategoryMobileNodeCard.mobile.tsx` for each top-level category; expandable via `Accordion` to show children
- **Expansion**: tap on category row toggles expand/collapse (state in Zustand `expandedIds`)
- **Actions**: tap on trailing `IconButton` (`MoreVertOutlined`) opens `CategoryMobileActionMenu` — a MUI `BottomSheet`/`SwipeableDrawer` with: "Edit", "Add Subcategory", "Move Up", "Move Down", "Delete"
- **Create root**: `MobileFab` (Floating Action Button) with `AddOutlined` icon, fixed bottom-right, opens `CreateCategoryDialog` full-screen
- **Search**: `CategorySearchBar.mobile.tsx` in `MobileContentInset` above the list
- **Template pane**: selecting a category navigates to template list view (separate route) or shows inline `MobileCardList` of templates below the category
- **Loading**: `MobileCardList` with skeleton card items (`Skeleton` placeholder rows)
- **Empty**: `MobileEmptyState` with localized title + description + "Create Category" action
- All MUI v9 mobile patterns: `sx` prop (no direct style props), `MobileContentStack` for layout, `MobileContentInset` for gutter alignment

### REQ-09-11: Desktop View

**WHEN** a user on a desktop device accesses the category management page, **THE SYSTEM SHALL** display a two-pane layout with a hierarchical tree and template pane.

**Acceptance Criteria**:
- **Page container**: `PageContainer` with `DesktopPageHeader` showing title, subtitle, and primary action button ("Create Root Category" if `canManage`)
- **Layout**: two-pane split — left pane (40% width) is `SectionPanel` containing the category tree; right pane (60% width) is `SectionPanel` containing the template list
- **Category tree**: `CategoryTree.desktop.tsx` with recursive `CategoryNode.desktop.tsx` rendering; supports drag-and-drop via dnd-kit; inline rename via `InlineEditableLabel.desktop.tsx`; right-click context menu via `CategoryActionMenu`
- **Search**: `CategorySearchBar.desktop.tsx` in the tree pane header
- **Template pane**: `AppDataGrid` with server-side pagination (page-number offset per INTER_PLAN_CONTRACTS §8), columns: name, status badge, createdAt, actions
- **Loading**: tree shows `Skeleton` placeholder nodes; template pane shows `AppDataGrid` skeleton rows
- **Empty tree**: `Alert` `severity="info"` with localized "No categories yet" + "Create Root Category" button
- **Empty template pane**: `Alert` `severity="info"` "Select a category to view templates" or "No templates in this category"

### REQ-09-12: Cycle Prevention

**WHEN** a user attempts to set a category's parent to itself or one of its descendants, **THE SYSTEM SHALL** reject the operation with a structured error.

**Acceptance Criteria**:
- Backend (service layer from Plan 4) validates parent is not self or descendant; throws structured `CYCLE_DETECTED` error per F-09-8
- Frontend drag-and-drop prevents dropping onto descendants (visual feedback: `sx` background from `theme.palette.errorContainer`); `CategoryTreeDropIndicator.desktop.tsx` shows red indicator
- Frontend `CategoryPicker` in edit dialog filters out self and descendants from selectable parents
- Error message: localized `errors.cycleDetected` — "Cannot move a category into its own descendant"
- On structured error from backend, Apollo `onError` maps `CYCLE_DETECTED` code to localized snackbar message

---

## 3. Feature 6: Outcome Knowledge Base & Progress Tracking

### Knowledge Base Updates
- The category tree component pattern (recursive, Apollo lazy-loading, Zustand expansion state) should be documented as a reusable pattern in `frontend/COMPONENT_PATTERNS.md`
- Drag-and-drop tree interaction (dnd-kit + custom drop indicators) should be documented as a reference for future drag tree features
- Self-referential hierarchy handling (cycle prevention, parent Tree path) documented for future hierarchical entities

### Progress Tracking
- Track in session SQL: creation of GraphQL documents, Zustand store, ViewModel, desktop view, mobile view, i18n keys
- Each task marks `done` in `todos` table when file passes tsgo + biome + lint + codegen

---

## 4. i18n Requirements

All translation keys are in the `certificates` i18n namespace, sub-domain `categories`.

### 4.1 Namespace Handle

- Namespace ID: `"dashboard.certificates.categories"`
- Handle: `DashboardCertificatesCategories`
- Type file: `shared/locale/types/dashboard/certificates/categories.ts`
- Namespace file: `shared/locale/namespaces/dashboard/certificates/categories.namespace.ts`
- AR file: `shared/locale/ar/dashboard/certificates/categories.ts` → export `dashboardCertificatesCategoriesAr`
- EN file: `shared/locale/en/dashboard/certificates/categories.ts` → export `dashboardCertificatesCategoriesEn`
- Registration in `Translation` tree: `Dashboard.Certificates.Categories`

### 4.2 Translation Key Catalog

| Key Path | Type | AR (illustrative) | EN (illustrative) |
|----------|------|--------------------|--------------------|
| `pageTitle` | `string` | إدارة تصنيفات القوالب | Template Category Management |
| `pageSubtitle` | `string` | تنظيم القوالب في شجرة تصنيفات | Organize templates into a category tree |
| `tree.allCategories` | `string` | جميع التصنيفات | All Categories |
| `tree.uncategorized` | `string` | غير مصنف | Uncategorized |
| `tree.searchPlaceholder` | `string` | ابحث عن تصنيف... | Search categories... |
| `tree.noResults` | `string` | لا توجد تصنيفات مطابقة | No matching categories |
| `tree.emptyState` | `string` | لا توجد تصنيفات بعد. أنشئ أول تصنيف. | No categories yet. Create your first. |
| `tree.expand` | `string` | توسيع | Expand |
| `tree.collapse` | `string` | طي | Collapse |
| `tree.loadingChildren` | `string` | جارٍ تحميل الفئات الفرعية... | Loading subcategories... |
| `actions.create` | `string` | إنشاء تصنيف | Create Category |
| `actions.createRoot` | `string` | إنشاء تصنيف رئيسي | Create Root Category |
| `actions.createChild` | `(parentName: string) => string` | `إنشاء تصنيف فرعي تحت "${parentName}"` | `Create subcategory under "${parentName}"` |
| `actions.rename` | `string` | إعادة تسمية | Rename |
| `actions.delete` | `string` | حذف | Delete |
| `actions.moveUp` | `string` | تحريك لأعلى | Move Up |
| `actions.moveDown` | `string` | تحريك لأسفل | Move Down |
| `actions.addChild` | `string` | إضافة تصنيف فرعي | Add Subcategory |
| `actions.moveTemplate` | `string` | نقل القالب | Move Template |
| `dialog.create.title` | `string` | إنشاء تصنيف جديد | Create New Category |
| `dialog.edit.title` | `string` | تعديل التصنيف | Edit Category |
| `dialog.delete.title` | `string` | حذف التصنيف | Delete Category |
| `dialog.delete.confirm` | `(name: string) => string` | `هل أنت متأكد من حذف التصنيف "${name}"؟` | `Are you sure you want to delete "${name}"?` |
| `dialog.delete.hasChildrenWarning` | `string` | سيتم حذف جميع التصنيفات الفرعية أيضاً | All subcategories will also be deleted |
| `dialog.delete.hasTemplatesWarning` | `(count: number) => string` | pluralized | pluralized (see below) |
| `dialog.delete.cancel` | `string` | إلغاء | Cancel |
| `dialog.delete.confirmButton` | `string` | حذف | Delete |
| `dialog.create.submitButton` | `string` | إنشاء | Create |
| `dialog.create.cancelButton` | `string` | إلغاء | Cancel |
| `dialog.edit.submitButton` | `string` | حفظ | Save |
| `dialog.edit.cancelButton` | `string` | إلغاء | Cancel |
| `dialog.moveTemplate.title` | `string` | نقل القالب إلى تصنيف | Move Template to Category |
| `dialog.moveTemplate.selectCategory` | `string` | اختر التصنيف الوجهة | Select target category |
| `field.name` | `string` | الاسم | Name |
| `field.namePlaceholder` | `string` | أدخل اسم التصنيف | Enter category name |
| `field.description` | `string` | الوصف | Description |
| `field.descriptionPlaceholder` | `string` | وصف اختياري للتصنيف | Optional category description |
| `field.parent` | `string` | التصنيف الأب | Parent Category |
| `field.parentNone` | `string` | بدون (تصنيف رئيسي) | None (root category) |
| `field.color` | `string` | اللون | Color |
| `field.icon` | `string` | الأيقونة | Icon |
| `field.colorPreview` | `string` | معاينة اللون | Color Preview |
| `field.iconPreview` | `string` | معاينة الأيقونة | Icon Preview |
| `templates.sectionTitle` | `(categoryName: string) => string` | `القوالب في "${categoryName}"` | `Templates in "${categoryName}"` |
| `templates.empty` | `string` | لا توجد قوالب في هذا التصنيف | No templates in this category |
| `templates.moveSuccess` | `(templateName: string, categoryName: string) => string` | `تم نقل "${templateName}" إلى "${categoryName}"` | `Moved "${templateName}" to "${categoryName}"` |
| `errors.createFailed` | `string` | فشل إنشاء التصنيف | Failed to create category |
| `errors.updateFailed` | `string` | فشل تحديث التصنيف | Failed to update category |
| `errors.deleteFailed` | `string` | فشل حذف التصنيف | Failed to delete category |
| `errors.reorderFailed` | `string` | فشل إعادة ترتيب التصنيف | Failed to reorder category |
| `errors.cycleDetected` | `string` | لا يمكن نقل تصنيف إلى أحد أحفاده | Cannot move a category into its own descendant |
| `errors.nameRequired` | `string` | الاسم مطلوب | Name is required |
| `errors.nameTooLong` | `(max: number) => string` | `يجب ألا يتجاوز الاسم ${max} حرفاً` | `Name must not exceed ${max} characters` |
| `errors.loadFailed` | `string` | فشل تحميل التصنيفات | Failed to load categories |
| `success.created` | `(name: string) => string` | `تم إنشاء التصنيف "${name}"` | `Category "${name}" created` |
| `success.updated` | `(name: string) => string` | `تم تحديث التصنيف "${name}"` | `Category "${name}" updated` |
| `success.deleted` | `(name: string) => string` | `تم حذف التصنيف "${name}"` | `Category "${name}" deleted` |
| `success.reordered` | `string` | تم تحديث ترتيب التصنيفات | Category order updated |

### 4.3 Pluralization

**`dialog.delete.hasTemplatesWarning` (count: number) => string**

| Locale | Rule | Illustrative |
|--------|------|--------------|
| `ar` | zero/one/two/few/many/other | zero: لا توجد قوالب / one: سيتم نقل قالب واحد / two: سيتم نقل قالبان / few: سيتم نقل ${count} قوالب / many: سيتم نقل ${count} قالباً / other: سيتم نقل ${count} قالب |
| `en` | one/other | one: 1 template will be moved / other: ${count} templates will be moved |

All other count-based keys use the same pattern. Arabic pluralization follows the standard 6-form rule.

### 4.4 Interpolation Parameters

| Key | Params | Type |
|-----|--------|------|
| `actions.createChild` | `parentName` | `string` |
| `dialog.delete.confirm` | `name` | `string` |
| `dialog.delete.hasTemplatesWarning` | `count` | `number` |
| `templates.sectionTitle` | `categoryName` | `string` |
| `templates.moveSuccess` | `templateName`, `categoryName` | `string`, `string` |
| `success.created` | `name` | `string` |
| `success.updated` | `name` | `string` |
| `success.deleted` | `name` | `string` |
| `errors.nameTooLong` | `max` | `number` |

### 4.5 Error Messages (GraphQL-resolver-side)

GraphQL resolvers (Plan 5) consume error translations from `ctx.t().errorsTranslations`. This plan's category-specific errors are registered in the `errors` type under a `certificates.categories` sub-group:

| Key | Type | AR | EN |
|-----|------|----|----|
| `errors.certificates.categories.notFound` | `(id: string) => string` | `التصنيف غير موجود: ${id}` | `Category not found: ${id}` |
| `errors.certificates.categories.nameRequired` | `string` | الاسم مطلوب | Name is required |
| `errors.certificates.categories.cycleDetected` | `string` | لا يمكن إنشاء دورة في شجرة التصنيفات | Cannot create a cycle in the category tree |
| `errors.certificates.categories.hasChildren` | `string` | لا يمكن حذف تصنيف يحتوي على تصنيفات فرعية | Cannot delete a category with subcategories |
| `errors.certificates.categories.permissionDenied` | `string` | لا تملك صلاحية إدارة التصنيفات | You do not have permission to manage categories |

### 4.6 Server-Side vs Client-Side Access

| Surface | Access Pattern |
|---------|---------------|
| App Router page (`page.tsx`) | `getTranslations(locale).dashboardTranslations.certificateCategories` |
| Client components (ViewModel) | `useAppTranslation(Translation.Dashboard.CertificateCategories)` |
| GraphQL resolvers (Plan 5) | `ctx.t().errorsTranslations.certificates.categories` |

---

## 5. Acceptance Criteria Summary

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-01 | Root categories load on page mount | Navigate to `/certificates/categories`, verify tree renders with root nodes |
| AC-02 | Children lazy-load on expand | Expand a node, verify Apollo query fires and children render |
| AC-03 | Create category via dialog | Click "Create Root Category", fill form, submit → node appears in tree, snackbar shown |
| AC-04 | Rename via inline edit (desktop) | Double-click name, type new name, Enter → label updates, snackbar shown |
| AC-05 | Edit via dialog (mobile + desktop) | Open edit dialog, change name/description/color/icon, save → updates, snackbar shown |
| AC-06 | Delete with confirmation | Click delete → confirmation dialog with dependency warning → confirm → node removed, snackbar shown |
| AC-07 | Drag reorder (desktop) | Drag node to new sibling position → order persists on refresh, snackbar shown |
| AC-08 | Drag into parent (desktop) | Drag node onto another node → becomes child, tree re-renders |
| AC-09 | Cycle prevention | Drag node onto its own descendant → rejected with red indicator + error snackbar |
| AC-10 | Template assignment | Select category → templates panel updates → move template → appears in new category |
| AC-11 | Search filters tree (server-side) | Type in search → only matching nodes + ancestors visible, debounced 300ms |
| AC-12 | Permission denied (view) | User without any cert permission → redirected to forbidden page |
| AC-13 | Permission split (view vs manage) | User with view-only → can browse but CRUD buttons hidden; user with manage → all actions available |
| AC-14 | Mobile simplified view | On mobile viewport → `MobileCardList` with accordion expand, `MobileFab` for create, `BottomSheet` for actions |
| AC-15 | Desktop two-pane view | On desktop viewport → `PageContainer` with `SectionPanel` tree + `SectionPanel` templates |
| AC-16 | Color/icon selection | Edit dialog → pick color + icon → `CategoryAvatar` updates in tree and dialog preview |
| AC-17 | i18n all keys present (EN+AR) | All listed translation keys exist in AR + EN files; TypeScript type schema compiles |
| AC-18 | Zustand state survives tier switch | Resize from desktop to mobile → selected + expanded state persists |
| AC-19 | Loading states | Tree loading → skeleton nodes; template pane loading → skeleton rows; dialog submit → `CircularProgress` |
| AC-20 | Empty states | No categories → localized empty message + create CTA; no templates → localized empty message |
| AC-21 | Error states | Mutation failure → localized error snackbar; query failure → `Alert` with error message |
