# Plan 09 — Template Category Management: Tasks

> **Feature**: Certificate Module — Template Category Management (Frontend)
> **Plan #**: 09
> **Dependencies**: Plan 5 (GraphQL API), Plan 8 (Navigation Config)
> **Execution Model**: Sequential per task (each task produces files the next task imports)
> **Quality Model**: Per-file tsgo + biome + lint via `scripts/health/sub-loop.ts`
> **Time Budget**: 2-4 hours per task

---

## Task Dependency Graph

```
T01 (i18n type schema) ─────┐
                            ├─→ T02 (i18n AR impl)
                            ├─→ T03 (i18n EN impl)
                            ├─→ T04 (i18n namespace + registration)
                            │
T05 (GraphQL documents) ────┤ (after T04 for codegen)
                            │
T06 (Zustand store) ────────┤
                            ├─→ T07 (types)
                            │         │
                            │         ├─→ T08 (ViewModel hook)
                            │         │         │
                            │         │         ├─→ T09 (Container)
                            │         │         │         │
T10 (shared dialogs) ───────┤         │         │         │
                            │         │         │         ├─→ T14 (desktop view)
T11 (CategoryPicker) ───────┤         │         │         │
                            │         │         │         ├─→ T15 (mobile view)
T12 (desktop tree) ─────────┤         │         │         │
T13 (desktop components) ───┘         │         │         │
                                      │         │         ├─→ T16 (App Router page)
                                      │         │         │         │
                                      │         │         │         └─→ T17 (integration verification)
                                      │         │         │
T10, T11 ─────────────────────────────┘         │
T12, T13 ────────────────────────────────────────┘
                                                            │
                                                            └─→ T18 (knowledge propagation)
```

**Execution order**: T01 → (T02, T03 in parallel) → T04 → T05 → T06 → T07 → T08 → (T10, T11 in parallel) → (T12, T13 in parallel) → T09 → (T14, T15 in parallel) → T16 → T17 → T18

---

## T01 — Create i18n Type Schema for Category Management

**Estimated time**: 2 hours
**Depends on**: Plan 2 (Types), Plan 5 (GraphQL schema)
**Requirements**: REQ-09-01 through REQ-09-10, §4.1–§4.6

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — i18n system rules (compile-time TypeScript, function-per-key, pluralization)
   - `AGENTS.md` root — path alias conventions, logging rules

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create type schema** `shared/locale/types/dashboard/certificates/categories.ts`:
   - One function type per key listed in requirements.md §4.2 (40+ keys)
   - Keys with no params: `string`
   - Keys with params: `(parentName: string) => string`, `(name: string) => string`, `(count: number) => string`, etc.
   - Pluralized key `dialog.delete.hasTemplatesWarning`: `(count: number) => string` — locale impl dispatches on count
   - Export the aggregate type as `CertificateCategoryLabels`

4. **Create error type extension** in `shared/locale/types/errors/index.ts` (or appropriate location):
   - Add `certificates.categories` sub-group to `ErrorsLabels`
   - Keys: `notFound`, `nameRequired`, `cycleDetected`, `hasChildren`, `permissionDenied`
   - Each with correct function signature per requirements.md §4.5

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/certificates/categories.ts --lifecycle lint
```

### Verification
- `bun tsgo` passes with zero new type errors
- All 40+ keys from §4.2 have corresponding type entries
- Pluralization key typed as `(count: number) => string`
- Interpolation keys have correct parameter types per §4.4
- Error keys match §4.5 exactly

---

## T02 — Create Arabic i18n Implementation

**Estimated time**: 1.5 hours
**Depends on**: T01 (type schema exists)
**Requirements**: §4.2, §4.3, §4.5

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — Arabic pluralization rules (6-form CLDR)
   - `AGENTS.md` root

2. **Create** `shared/locale/ar/dashboard/certificates/categories.ts`:
   - Export `dashboardCertificatesCategoriesAr` typed as `CertificateCategoryLabels`
   - One const function/constant per key matching the type schema exactly
   - Arabic translations from requirements.md §4.2 (illustrative column)
   - Pluralization for `dialog.delete.hasTemplatesWarning`: six forms
     - zero: لا توجد قوالب
     - one: سيتم نقل قالب واحد
     - two: سيتم نقل قالبان
     - few: سيتم نقل ${count} قوالب
     - many: سيتم نقل ${count} قالباً
     - other: سيتم نقل ${count} قالب
   - Interpolation functions use template literals with correct parameter names

3. **Create Arabic error translations** for the `certificates.categories` error sub-group in `shared/locale/ar/errors/` (or the appropriate error locale file):
   - Implement all five error keys from §4.5 in Arabic

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/certificates/categories.ts --lifecycle lint
```

### Verification
- All six Arabic plural forms present for `dialog.delete.hasTemplatesWarning`
- No hardcoded English strings
- Template literals use the correct parameter names from §4.4
- Type-checks pass against `CertificateCategoryLabels`

---

## T03 — Create English i18n Implementation

**Estimated time**: 1 hour
**Depends on**: T01 (type schema exists)
**Requirements**: §4.2, §4.3, §4.5

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — English pluralization rules (one/other)
   - `AGENTS.md` root

2. **Create** `shared/locale/en/dashboard/certificates/categories.ts`:
   - Export `dashboardCertificatesCategoriesEn` typed as `CertificateCategoryLabels`
   - One const function/constant per key matching the type schema exactly
   - English translations from requirements.md §4.2 (illustrative column)
   - Pluralization for `dialog.delete.hasTemplatesWarning`: two forms
     - one: 1 template will be moved
     - other: ${count} templates will be moved
   - Interpolation functions use template literals with correct parameter names

3. **Create English error translations** for the `certificates.categories` error sub-group in `shared/locale/en/errors/` (or the appropriate error locale file):
   - Implement all five error keys from §4.5 in English

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/certificates/categories.ts --lifecycle lint
```

### Verification
- Both English plural forms present for `dialog.delete.hasTemplatesWarning`
- No hardcoded Arabic strings
- Template literals use correct parameter names from §4.4
- Type-checks pass against `CertificateCategoryLabels`

---

## T04 — Create i18n Namespace Registration and Wire Exports

**Estimated time**: 1 hour
**Depends on**: T01 (type schema), T02 (AR impl), T03 (EN impl)
**Requirements**: §4.1, §4.6

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — namespace registration pattern
   - `AGENTS.md` root

2. **Create namespace file** `shared/locale/namespaces/dashboard/certificates/categories.namespace.ts`:
   - Use `defineNamespace("dashboard.certificates.categories", ...)` with lazy loaders for AR and EN
   - AR loader: `() => import("@/shared/locale/ar/dashboard/certificates/categories").then(m => m.dashboardCertificatesCategoriesAr)`
   - EN loader: `() => import("@/shared/locale/en/dashboard/certificates/categories").then(m => m.dashboardCertificatesCategoriesEn)`

3. **Modify** `shared/locale/namespaces/translation.ts`:
   - Add `Categories: DashboardCertificatesCategories` to `Translation.Dashboard.Certificate`

4. **Modify** `shared/locale/types/message.ts` (or equivalent):
   - Add `categories: CertificateCategoryLabels` to `DashboardTranslations.certificates`

5. **Modify** `shared/locale/ar/messages.ts`:
   - Import `dashboardCertificateCategoriesAr` and include it in the `dashboardTranslations.certificateCategories` assignment

6. **Modify** `shared/locale/en/messages.ts`:
   - Import `dashboardCertificateCategoriesEn` and include it in the `dashboardTranslations.certificateCategories` assignment

### Quality Loop

For each modified file:
```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle lint
```

### Verification
- `bun tsgo` passes — namespace registered correctly in Translation tree
- Both AR and EN message files include the category translations
- Access pattern `useAppTranslation(Translation.Dashboard.CertificateCategories)` resolves correctly

---

## T05 — Create GraphQL Documents for Category Operations

**Estimated time**: 2 hours
**Depends on**: Plan 5 (GraphQL API complete), T04 (i18n wired for codegen)
**Requirements**: REQ-09-01 through REQ-09-07, design.md §3.1

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/common/graphql/sharedDocuments/AGENTS.md` — document naming conventions, TypedDocumentNode pattern
   - `frontend/common/graphql/AGENTS.md` — Apollo Client v4 patterns
   - `AGENTS.md` root — path aliases, no `useLazyQuery` rule

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/common/graphql/sharedDocuments/certificates/certificateCategory.documents.ts`:
   - Fragments:
     - `categoryFragment` — `id`, `name`, `description`, `parentId`, `order`, `specialType`, `childCount`, `color`, `icon`
     - `templateSummaryFragment` — `id`, `name`, `status`, `categoryId`, `createdAt`, `updatedAt`
   - Queries:
     - `categoryRootsQueryDocument` — `TypedDocumentNode<{ categoryRoots: CertificateCategoryFragment[] }, Record<string, never>>` — root categories with childCount
     - `categoryChildrenQueryDocument` — `TypedDocumentNode<..., { parentId: string }>` — children of a parentId
     - `categoryQueryDocument` — `TypedDocumentNode<..., { id: string }>` — single category by ID
     - `categoryTemplatesQueryDocument` — `TypedDocumentNode<..., { categoryId: string; page: number; perPage: number }>` — templates in category (page-number pagination per §8)
     - `categorySearchQueryDocument` — `TypedDocumentNode<..., { term: string }>` — flat search (per F-09-2)
   - Mutations:
     - `createCategoryMutationDocument` — `TypedDocumentNode<..., { input: CreateCategoryInput }>`
     - `updateCategoryMutationDocument` — `TypedDocumentNode<..., { input: UpdateCategoryInput }>`
     - `deleteCategoryMutationDocument` — `TypedDocumentNode<..., { id: string }>`
     - `reorderCategoryMutationDocument` — `TypedDocumentNode<..., { input: ReorderCategoryInput }>` — positional API (id, beforeId, afterId, newParentId) per §12
     - `moveTemplateToCategoryMutationDocument` — `TypedDocumentNode<..., { input: MoveTemplateInput }>` — optimistic update per F-09-6
   - All documents use `TypedDocumentNode<Operations.X, Types.QueryXArgs>` typing pattern
   - `id` field on all object types for Apollo cache normalization
   - Fragment includes `color` and `icon` fields for category customization
   - Import hooks from `"@apollo/client/react"`, not `"@apollo/client"`

4. **Modify** `frontend/common/graphql/sharedDocuments/certificates/index.ts`:
   - Export all category documents from the barrel (per §17 barrel convention)

5. **Run codegen**:
   - `bun run generate:gqlSchema && bun codegen`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/cert/category-documents.ts --lifecycle lint
```

### Verification
- All documents use `TypedDocumentNode` typing
- `id` field present on every object type selection
- Codegen passes without errors (Plan 5 schema must include all operations)
- No `useLazyQuery` in any document usage

---

## T06 — Create Zustand Store for Category Tree State

**Estimated time**: 2 hours
**Depends on**: T04 (i18n wired), T05 (GraphQL documents for types)
**Requirements**: REQ-09-01, REQ-09-07, design.md §3.2

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/common/stores/AGENTS.md` — Zustand store creation rules, serialization rules
   - `AGENTS.md` root — logging, path aliases

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/common/stores/certificateCategoryStore.ts`:
   - Store name: `useCertificateCategoryStore`
   - State fields (per design.md §3.2):
     - `selectedCategoryId: string | null`
     - `expandedCategoryIds: Set<string>`
     - `searchTerm: string`
     - `createDialogOpen: boolean`
     - `editingCategoryId: string | null`
     - `deleteTargetId: string | null`
     - `moveTemplateData: { templateId: string; templateName: string } | null`
     - `parentForCreate: string | null`
   - Actions (per design.md §3.2):
     - `setSelectedCategory(id: string | null)` — sets selected, resets template list page
     - `toggleExpand(id: string)` — toggle membership in expandedCategoryIds
     - `setExpanded(ids: Set<string>)` — replace expansion set
     - `setSearchTerm(term: string)` — set search, resets page
     - `openCreateDialog(parentId: string | null)` — open create dialog
     - `closeCreateDialog()` — close create dialog
     - `setEditingCategory(id: string | null)` — open/close edit mode
     - `setDeleteTarget(id: string | null)` — open/close delete confirmation
     - `openMoveTemplateDialog(data)` — open move template dialog
     - `closeMoveTemplateDialog()` — close move template dialog
   - **NO `fetchedCategoryIds`** (removed per F-09-3) — Apollo cache handles deduplication naturally via `cache-and-network` / `cache-first` fetch policies
   - **NO `markAsFetched` action** — not needed without `fetchedCategoryIds`
   - Store is in-memory only (no `persist` middleware — page-scoped, expansion state re-derivable from Apollo cache on remount per design.md DD-04)
   - `Set<string>` fields are not serialized — if `persist` is added later, custom merge function reconstructs Sets

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/stores/certificateCategoryStore.ts --lifecycle lint
```

### Verification
- Store follows Siraj Zustand pattern (check `frontend/common/stores/AGENTS.md`)
- All state fields and actions match design.md §3.2 exactly
- No `persist` middleware (per DD-04 alternative: in-memory)
- `Set<string>` used for `expandedCategoryIds` only (no `fetchedCategoryIds` per F-09-3)
- No `console.*` calls — use `logger` from `@/frontend/utils/logger` if logging needed

---

## T07 — Create Category View-Model Types

**Estimated time**: 1 hour
**Depends on**: T05 (GraphQL documents for codegen types), T06 (store for state types)
**Requirements**: design.md §3.4

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — view-model type patterns
   - `AGENTS.md` root — type definition pattern (canonical types in `backend/types/`)

2. **Create** `frontend/common/views/dashboard/certificates/categories/types/index.ts`:
   - `CategoryNode` — view-model representation (id, name, description, parentId, order, specialType, childCount)
   - `CategorySearchResult` — flat search result (id, name, parentId)
   - `TemplateRow` — template display row (id, name, status, thumbnailUrl)
   - `CertificateCategoryViewModel` — the full view model interface (all fields from design.md §3.3)
   - `CreateCategoryInput` — form input for create (name, description, parentId)
   - `UpdateCategoryInput` — form input for update (id, name, description)
   - `ReorderCategoryInput` — positional per §12: `id`, `beforeId?`, `afterId?`, `newParentId?` (exactly one of beforeId/afterId non-null)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/categories/types/index.ts --lifecycle lint
```

### Verification
- All types exported and match design.md §3.4
- `CertificateCategoryViewModel` includes all fields from design.md §3.3 ViewModel return table
- No local type definitions that duplicate `backend/types/` canonical types

---

## T08 — Create ViewModel Hook

**Estimated time**: 3 hours
**Depends on**: T04 (i18n), T05 (GraphQL documents), T06 (store), T07 (types)
**Requirements**: REQ-09-01 through REQ-09-10, design.md §3.3

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — ViewModel hook patterns, Apollo data fetching, mutation handling
   - `frontend/common/graphql/AGENTS.md` — `useQuery` with `skip` control, no `useLazyQuery`
   - `AGENTS.md` root — logging, path aliases, Apollo cache update patterns

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/categories/useCertificateCategoryViewModel.ts`:
   - Uses `useQuery(categoryRootsQueryDocument)` for root categories
   - Uses `useQuery(categoryChildrenQueryDocument, { variables: { parentId }, skip: !parentId })` per-node — Apollo cache deduplication prevents redundant queries (no `fetchedCategoryIds` needed per F-09-3)
   - Uses `useQuery(categorySearchQueryDocument, { skip: searchTerm.length < 1, variables: { term: searchTerm }, fetchPolicy: 'network-only' })` for search (per F-09-2)
   - Uses `useQuery(categoryTemplatesQueryDocument, { variables: { categoryId: selectedCategoryId, page, perPage }, skip: !selectedCategoryId })` for template pane (page-number pagination per §8)
   - Uses `useMutation` for all five mutations (create, update, delete, reorder, moveTemplate)
   - Apollo cache updates per design.md DD-05:
     - Create child: `cache.updateQuery` to append new node
     - Update: write to cache by `id` (auto-normalization)
     - Delete: `cache.evict({ id })` + `cache.gc()`
     - Reorder: `cache.updateQuery` to re-sort children (optimistic, rollback on error)
     - Move template: optimistic update — write template's new `categoryId` into cache immediately via `cache.writeFragment`; on error rollback; on success evict from old category's template list + refetch new (per F-09-6)
   - Returns `CertificateCategoryViewModel` (all fields from design.md §3.3)
   - Permission check: `canManage = useHasPermission([AppPermission.CertificateTemplateManage])` — gates CRUD actions
   - Permission check: `canView = useHasPermission([AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage])` — gates page visibility
   - Labels from `useAppTranslation(Translation.Dashboard.CertificateCategories)`
   - All mutation handlers return `Promise<void>` and show success/error snackbar with localized messages
   - `descendantIds(categoryId)` helper: traverses loaded tree nodes to collect all descendant IDs — returns `Set<string>` for cycle prevention
   - Move template supports `categoryId: null` (move to uncategorized)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/categories/useCertificateCategoryViewModel.ts --lifecycle lint
```

### Verification
- No `useLazyQuery` — uses `useQuery` with `skip` exclusively
- All five mutations have cache update logic per DD-05
- Cycle prevention: `descendantIds` Set computation for the dragged node's subtree
- `canManage` gates all CRUD mutation exposure
- All error messages use localized `labels.errors.*` keys
- No `console.*` calls

---

## T09 — Create Container Component

**Estimated time**: 1 hour
**Depends on**: T08 (ViewModel hook)
**Requirements**: REQ-09-08, design.md §4.1

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — Container pattern, `RequirePermission`, `ResponsiveViewSwitch`
   - `app/AGENTS.md` — App Router page conventions
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/categories/CertificateCategoryContainer.tsx`:
   - Calls `useCertificateCategoryViewModel()`
   - Wraps content in `<RequirePermission permissions={[AppPermission.CertificateTemplateView]} fallback={<ForbiddenView />} />` — secondary guard; primary is `page.tsx`
   - Does NOT wrap entire view in `CertificateTemplateManage` — that would hide page for view-only users
   - Renders `<ResponsiveViewSwitch desktop={Desktop} mobile={Mobile} />` passing the ViewModel
   - Uses `createLazyView<ViewModelType>` pattern (per Siraj Container convention): module-level `const Desktop = createLazyView(() => import("@/frontend/desktop/views/dashboard/certificates/categories/certificateCategoryView.desktop"))` and corresponding Mobile lazy import
   - Desktop view component renders the split-pane layout: tree pane (left) + template pane (right)
   - Mobile view component renders the stacked layout: category list + template card list
   - Shared dialogs (Create, Edit, Delete, MoveTemplate) are rendered at container level so they are available on both tiers

4. **Create** `frontend/common/views/dashboard/certificates/categories/CertificateCategoryView.tsx` (switcher):
   - Simple re-export or wrapper component if needed by the App Router page pattern
   - May be omitted if `ResponsiveViewSwitch` is directly used in the Container (confirm against Siraj pattern)
   - If created: renders `<CertificateCategoryContainer />` for use by `page.tsx`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/categories/CertificateCategoryContainer.tsx --lifecycle lint
```

### Verification
- Container uses `RequirePermission` wrapper
- Container passes full ViewModel to both desktop and mobile views
- All shared dialogs rendered at container level
- No `useMediaQuery` in container (delegated to `ResponsiveViewSwitch`)

---

## T10 — Create Shared Dialog Components

**Estimated time**: 3 hours
**Depends on**: T08 (ViewModel), T09 (Container for rendering context)
**Requirements**: REQ-09-02, REQ-09-03, REQ-09-04, REQ-09-06, design.md §4.1

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — dialog component patterns
   - `frontend/AGENTS.md` — MUI v9 dialog patterns, no style props
   - `AGENTS.md` root — theme palette, i18n

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/categories/components/CreateCategoryDialog.tsx`:
   - Props: ViewModel fields (`createDialogOpen`, `parentForCreate`, `openCreateDialog`, `closeCreateDialog`, `onCreateCategory`, `labels`, `loading`, `canManage`)
   - MUI `Dialog` with `TextField` for name (required, max 255), `TextField` multiline for description (optional)
   - `CategoryPicker` for parent (from T11, disabled if `parentForCreate` preset)
   - `ColorSwatchPicker` (optional, default grey) + `IconPicker` (optional, default `FolderOutlined`) — from T10 subtasks 8-9
   - `CategoryAvatar` preview in dialog header showing selected color + icon
   - Validation: name required (non-empty), max 255 chars — error messages from `labels.errors.nameRequired`, `labels.errors.nameTooLong`
   - Submit calls `onCreateCategory({ name, description, parentId: parentForCreate, color, icon })`
   - On failure: snackbar with `labels.errors.createFailed`

4. **Create** `frontend/common/views/dashboard/certificates/categories/components/EditCategoryDialog.tsx`:
   - Props: ViewModel fields (`editingCategoryId`, `setEditingCategory`, `onUpdateCategory`, `labels`, `loading`, `canManage`, `descendantIds`)
   - MUI `Dialog` with pre-filled name, description, color, icon fields
   - `CategoryPicker` for parent (from T11, with `excludeIds` = self + descendants for cycle prevention)
   - `ColorSwatchPicker` + `IconPicker` with current values pre-selected
   - Submit calls `onUpdateCategory({ id, name, description, parentId, color, icon })`
   - On failure: snackbar with `labels.errors.updateFailed`
   - Cycle detection: if backend returns `CYCLE_DETECTED` error, show `labels.errors.cycleDetected` snackbar

5. **Create** `frontend/common/views/dashboard/certificates/categories/components/DeleteCategoryConfirmDialog.tsx`:
   - Props: ViewModel fields (`deleteTargetId`, `setDeleteTarget`, `onDeleteCategory`, `labels`, `loading`, `canManage`)
   - MUI `Dialog` showing category name, template count (pluralized `labels.dialog.delete.hasTemplatesWarning(count)`), children warning (`labels.dialog.delete.hasChildrenWarning`)
   - If `depCount > 0`: disable confirm button, show `Alert` with `labels.dialog.delete.rejectReason` — deletion blocked until templates are reassigned
   - If `depCount === 0`: enable confirm button, show `Alert` warning with `labels.dialog.delete.confirmPrompt`
   - Confirm button calls `onDeleteCategory(id)`

6. **Create** `frontend/common/views/dashboard/certificates/categories/components/MoveTemplateToCategoryDialog.tsx`:
   - Props: ViewModel fields (`moveTemplateData`, `closeMoveTemplateDialog`, `onMoveTemplate`, `labels`, `canManage`)
   - MUI `Dialog` with `CategoryPicker` (from T11) for target category selection
   - Shows current category name (disabled `TextField`), `CategoryPicker` for new category
   - Confirm calls `onMoveTemplate(templateId, categoryId)`
   - On success: snackbar with `labels.templatePaneTitle(categoryName)` or success message

7. **Create** `frontend/common/views/dashboard/certificates/categories/components/CategoryAvatar.tsx`:
   - Props: `{ color: string, icon: string, size: 'small' | 'medium' | 'large', sx?: SxProps<Theme> }`
   - Renders `Avatar` with `sx` background from `theme.palette[colorToken]` and MUI icon from icon name
   - No hardcoded hex values — all via `theme.palette`

8. **Create** `frontend/common/views/dashboard/certificates/categories/components/ColorSwatchPicker.tsx`:
   - Props: `{ value: string | null, onChange: (color: string | null) => void, labels, disabled?: boolean }`
   - Grid of `ToggleButton` cells (5 columns), each with `sx` background from `theme.palette[colorToken].main`
   - Color names from `CERTIFICATE_CATEGORY_COLORS` constant (10-15 palette entries)
   - Selected cell has ring border via `sx` `outline: 2px solid theme.palette.primary.main`

9. **Create** `frontend/common/views/dashboard/certificates/categories/components/IconPicker.tsx`:
   - Props: `{ value: string | null, onChange: (icon: string | null) => void, labels, disabled?: boolean }`
   - Grid of `ToggleButton` cells (6 columns), each wrapping an MUI `Icon` component
   - Icon names from `CERTIFICATE_CATEGORY_ICONS` constant (15-20 Material icon names)
   - Selected cell highlighted with `sx` `bgcolor: theme.palette.action.selected`

10. **Create** `shared/constants/certificate-category-colors.ts`:
   - Export `CERTIFICATE_CATEGORY_COLORS` as `readonly string[]` — 10-15 palette token names (blue, red, green, orange, purple, teal, pink, indigo, grey, brown)
   - Token names must match `theme.palette` keys

11. **Create** `shared/constants/certificate-category-icons.ts`:
   - Export `CERTIFICATE_CATEGORY_ICONS` as `readonly string[]` — 15-20 Material icon names (FolderOutlined, DescriptionOutlined, SchoolOutlined, etc.)

### Quality Loop

For each file created:
```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle lint
```

### Verification
- All dialogs use MUI `Dialog` component (shared across tiers per DD-06)
- All labels from `useAppTranslation(Translation.Dashboard.CertificateCategories)`
- No hardcoded user-facing strings
- No style props on Typography/Stack/Box — use `sx` prop
- Validation errors display below fields using MUI `TextField` `error` and `helperText`

---

## T11 — Create CategoryPicker Component

**Estimated time**: 1.5 hours
**Depends on**: T05 (GraphQL documents), T08 (ViewModel)
**Requirements**: REQ-09-06, design.md §4.1

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — component patterns
   - `AGENTS.md` root — theme, i18n

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/common/views/dashboard/certificates/categories/components/CategoryPicker.tsx`:
   - MUI `Autocomplete` using `categoryListQueryDocument` to populate a flat list of categories (with parent path breadcrumb for nested display)
   - Shows category name with parent path breadcrumb (e.g., "Root › Child") for nested categories
   - Optional "None (root category)" option for uncategorized (`labels.field.parentNone` label)
   - Selected value is the category ID (string) or null
   - Props: `{ value: string | null, onChange: (id: string | null) => void, labels, excludeIds?: ReadonlySet<string>, disabled?: boolean }`
   - `excludeIds` — Set of category IDs to exclude from the picker (used for cycle prevention in `EditCategoryDialog`: excludes self + all descendants via `descendantIds` from ViewModel)
   - `disabled` — disables the picker when `parentForCreate` is preset in `CreateCategoryDialog`

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/categories/components/CategoryPicker.tsx --lifecycle lint
```

### Verification
- Uses `useQuery` (not `useLazyQuery`) with appropriate skip control
- No hardcoded strings — all from i18n labels
- Category path breadcrumb shown for nested categories

---

## T12 — Create Desktop Category Tree Components

**Estimated time**: 4 hours
**Depends on**: T05 (GraphQL documents), T06 (store), T08 (ViewModel)
**Requirements**: REQ-09-01, REQ-09-05, REQ-09-07, REQ-09-10, design.md §4.2, §5

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — desktop view patterns, three-location split
   - `frontend/AGENTS.md` — MUI v9 rules, no style props
   - `AGENTS.md` root — path aliases, i18n

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTree.desktop.tsx`:
   - Root component wrapping `DndContext` + `SortableContext` (vertical)
   - Renders child `CategoryTreeNode` components for each root category
   - Reads `rootCategories` from ViewModel
   - Drop detection logic per design.md §5.2 (top 25% before, bottom 25% after, middle 50% into)
   - On drop: calls `onReorderCategory` with appropriate `ReorderCategoryInput`
   - Custom collision detection algorithm (before/after sibling, into parent)

4. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTreeNode.desktop.tsx`:
   - Recursive tree node component per design.md §6
   - Props per design.md §6 props table
   - Uses `useSortable` from dnd-kit for drag-and-drop
   - Drag handle icon, expand/collapse chevron, inline-editable label, action menu button
   - If expanded and children loaded: render nested `SortableContext` with child nodes
   - If expanded and children loading: render `CircularProgress` spinner
   - Indentation: `sx={{ pl: level * indentationUnit }}` (not hardcoded — use theme spacing)
   - Selected node: `sx` background from `theme.palette.primaryContainer`
   - Hover preload: `onMouseEnter` triggers children fetch via ViewModel resolver
   - Cycle prevention: check `descendantIds` Set; show red indicator if dropping onto own descendant

5. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTreeDropIndicator.desktop.tsx`:
   - Visual drop indicator: blue line (between siblings) or highlight (into parent)
   - Determined by drag position relative to target node's bounding box

6. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/InlineEditableLabel.desktop.tsx`:
   - Double-click to edit (`EditableTypography` pattern)
   - Enter saves, Escape cancels
   - Calls `onUpdateCategory({ id, name })` on save
   - Validation: name non-empty, max 255 chars

7. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/CategoryActionMenu.desktop.tsx`:
   - Context menu (MUI `Menu`) with items: Create Child, Rename, Delete, Move Up, Move Down
   - Items labels from `labels.action.*`
   - Permission gated: `canManage` hides/disables CRUD actions

8. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/CategorySearchBar.desktop.tsx`:
   - `TextField` with `InputAdornment` (`SearchOutlined` icon leading, clear `IconButton` trailing)
   - Debounced input (300ms) → `onSearch(term)` (sets `searchTerm` in store)
   - Shows `labels.action.search` as placeholder, `labels.action.clearSearch` for clear button tooltip
   - `loading` prop shows `CircularProgress` adornment when search query is in progress

9. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/TemplatePaneColumns.desktop.tsx`:
   - Column definitions array for `AppDataGrid`:
     - Name column: `flex: 1`, `Typography` with template name
     - Status column: `120px`, `StatusBadge` with `status` prop
     - Created column: `160px`, formatted `createdAt` via `Intl.DateTimeFormat`
     - Actions column: `80px`, `IconButton` (`DriveFileMoveOutlined`) → opens `MoveTemplateToCategoryDialog` (if `canManage`)

### Quality Loop

For each file created:
```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle lint
```

### Verification
- dnd-kit `DndContext` + nested `SortableContext` per parent level
- Custom collision detection algorithm (before/after/into) per design.md §5.2
- Accessibility: `aria-roledescription="draggable item"`, keyboard support (Space/Arrows/Enter/Escape)
- Hover preload on desktop fires children query on `onMouseEnter`
- All style values via `sx` prop (no style props on Typography/Stack/Box)
- All labels from i18n
- No `console.*` calls

---

## T13 — Create Desktop Template Pane Component

**Estimated time**: 2 hours
**Depends on**: T05 (GraphQL documents), T08 (ViewModel)
**Requirements**: REQ-09-06, design.md §4.2

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — desktop component patterns, `AppDataGrid` usage
   - `frontend/AGENTS.md` — MUI v9
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/desktop/views/dashboard/certificates/categories/components/TemplatePane.desktop.tsx`:
   - Shows templates for the selected category via `templates` from ViewModel
   - Uses `AppDataGrid` with `mode: "server"` and page-number pagination per §8
   - Column definitions from `TemplatePaneColumns.desktop.tsx` (separate file)
   - "Move to Category" action in the actions column opens `MoveTemplateToCategoryDialog` (triggers `openMoveTemplateDialog`)
   - Section title: `labels.templatePaneTitle(categoryName)` (interpolated)
   - Empty state: `labels.emptyTemplates` when no templates in category
   - Loading state: `AppDataGrid` loading prop shows skeleton rows
   - Error state: `Alert` with retry `Button` (`labels.errors.loadFailed`)
   - No selection state: `labels.selectCategoryPrompt` when no category selected

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/categories/components/TemplatePane.desktop.tsx --lifecycle lint
```

### Verification
- `AppDataGrid` or `DesktopAppDataGrid` used for template listing
- All labels from i18n
- Status badge uses `status.*` i18n keys
- No hardcoded strings

---

## T14 — Create Desktop Category Management View

**Estimated time**: 2 hours
**Depends on**: T09 (Container), T12 (tree), T13 (template pane)
**Requirements**: REQ-09-01, REQ-09-05, design.md §4.2, §8.2

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — desktop view assembly pattern, `DesktopPageHeader`
   - `frontend/AGENTS.md` — MUI v9
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/desktop/views/dashboard/certificates/categories/certificateCategoryView.desktop.tsx`:
   - Props: `Readonly<CertificateCategoryViewModel>` — entire ViewModel passed through
   - `DesktopPageContainer` (from `@/frontend/desktop/components/ui/container/page`) wraps everything
   - `DesktopPageHeader` with title (`labels.pageTitle`), subtitle (`labels.pageSubtitle`), `DesktopPrimaryPageAction` for "Create Root Category" (hidden if `!canManage`)
   - `CategorySearchBar.desktop.tsx` below the header
   - Two `SectionPanel`s in a `Box` with flex: fixed-width tree pane (320px) and flexible template pane
   - Tree pane: `CategoryTree.desktop.tsx` (with `CategoryTreeNode` recursive children)
   - Template pane: `TemplatePane.desktop.tsx` with `AppDataGrid`
   - Import shared primitives from `@/frontend/common/components/ui`
   - Import desktop-specific components from `@/frontend/desktop/components/ui`
   - **NEVER import from `@/frontend/mobile/`**
   - Empty state: `labels.emptyTree` when no categories exist
   - Loading state: `CircularProgress` in tree pane
   - Error state: `Alert` with retry button
   - All labels from ViewModel
   - Dialogs (Create, Edit, Delete, MoveTemplate) rendered at Container level, not in desktop view

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/categories/certificateCategoryView.desktop.tsx --lifecycle lint
```

### Verification
- No `useMediaQuery` in the view (tier-switch handled by Container's `ResponsiveViewSwitch`)
- Split-pane uses `sx` flex (no hardcoded widths outside theme tokens)
- Create button gated by `canManage`
- Empty state uses i18n label

---

## T15 — Create Mobile Category Management View

**Estimated time**: 3 hours
**Depends on**: T09 (Container), T10 (shared dialogs)
**Requirements**: REQ-09-09, design.md §4.3, §8.3

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — mobile view patterns, `MobilePageContainer`, `MobilePageHeader`, `MobileCardList`
   - `frontend/AGENTS.md` — MUI v9 mobile patterns
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/mobile/views/dashboard/certificates/categories/components/CategoryList.mobile.tsx`:
   - Flat expandable list using `Collapse` / `Accordion`-style (not a drag tree)
   - Tap to expand/collapse children via `MobileCardList` of `CategoryMobileNodeCard`
   - Reads from ViewModel `childrenForParent(parentId)` resolver
   - No drag-and-drop (per DD-03)

4. **Create** `frontend/mobile/views/dashboard/certificates/categories/components/CategoryMobileNodeCard.mobile.tsx`:
   - Single category row card: expand toggle `IconButton` (ChevronRight/ExpandMore), `CategoryAvatar`, name `Typography`, child count `Typography` (pluralized), `IconButton` (MoreVert) for action menu
   - Actions only visible if `canManage`
   - Children shown in `Collapse` with nested `MobileCardList` when expanded

5. **Create** `frontend/mobile/views/dashboard/certificates/categories/components/CategoryMobileActionMenu.mobile.tsx`:
   - `SwipeableDrawer` with `anchor="bottom"` (bottom-sheet action menu)
   - Actions as `ListItemButton` with `ListItemIcon` + `ListItemText`: Add Child, Rename, Move Up (disabled if first), Move Down (disabled if last), Delete (error color)
   - Permission gated: `canManage` hides/disables CRUD actions

6. **Create** `frontend/mobile/views/dashboard/certificates/categories/components/TemplateCardList.mobile.tsx`:
   - `MobileCardList` of templates in the selected category
   - Each item rendered by `TemplateCardListItem.mobile.tsx`

7. **Create** `frontend/mobile/views/dashboard/certificates/categories/components/TemplateCardListItem.mobile.tsx`:
   - Template card: name `Typography`, `StatusBadge` (status), `IconButton` (`DriveFileMoveOutlined`) for move action (if `canManage`)
   - Move action triggers `openMoveTemplateDialog`

8. **Create** `frontend/mobile/views/dashboard/certificates/categories/components/CategorySearchBar.mobile.tsx`:
   - `TextField` in `MobileContentInset` with `InputAdornment` adornments
   - Debounced input (300ms) → `onSearch(term)`

9. **Create** `frontend/mobile/views/dashboard/certificates/categories/certificateCategoryView.mobile.tsx`:
   - Props: `Readonly<CertificateCategoryViewModel>` — entire ViewModel passed through
   - `MobilePageContainer` (from `@/frontend/mobile/components/ui`) wraps everything
   - `MobilePageHeader` with title (`labels.pageTitle`), `MobileFab` for "Create Category" (hidden if `!canManage`, position: fixed, bottom-right)
   - `MobileContentStack` wraps: `MobileContentInset` (search) → `MobileContentInset` (category list) → `MobileContentInset` (template card list, if category selected)
   - Import mobile primitives from `@/frontend/mobile/components/ui`
   - Import shared primitives from `@/frontend/common/components/ui`
   - **NEVER import `Mobile*` from `@/frontend/common/components/ui`** (per mobile AGENTS.md)
   - **NEVER import from `@/frontend/desktop/`**
   - Empty state: `labels.emptyTree` with `AddOutlined` `Button` (if `canManage`)
   - Loading state: `Skeleton` placeholders in `MobileCardList` (3 items)
   - Error state: `Alert` with retry `Button`
   - No selection: template section hidden entirely
   - Dialogs (Create, Edit, Delete, MoveTemplate) rendered at Container level, not in mobile view
   - Mobile dialogs use `fullScreen` prop on MUI `Dialog`

### Quality Loop

For each file created:
```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle lint
```

### Verification
- No drag-and-drop on mobile (per DD-03)
- "Move Up"/"Move Down" context menu for reordering
- `MobilePageContainer`, `MobilePageHeader`, `MobileCardList` used correctly
- All labels from i18n
- No `useMediaQuery` in mobile views
- Long-press triggers bottom-sheet action menu

---

## T16 — Create App Router Page

**Estimated time**: 1 hour
**Depends on**: T09 (Container), T14 (desktop view), T15 (mobile view)
**Requirements**: REQ-09-08, design.md §8.1, §8.4

### Subtasks

1. **Read applicable AGENTS.md**:
   - `app/AGENTS.md` — App Router page conventions, `generateMetadata`, server guards
   - `shared/AGENTS.md` — `getTranslations` pattern
   - `AGENTS.md` root

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `app/(dashboard)/certificates/categories/page.tsx`:
   - Async server component
   - `getLocale()` to get current locale
   - `generateMetadata()` returns title from `getTranslations(locale).dashboardTranslations.certificateCategories.pageTitle`
   - `getServerUserContext()` — redirect to login if no userId
   - `requirePermissionForPage(userId, [AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage], locale, context)` — gates access; user needs EITHER view or manage permission to access the page
   - Renders `<CertificateCategoryContainer />`
   - Without permission: user redirected to forbidden page (handled by `requirePermissionForPage`)

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts app/\(dashboard\)/certificates/categories/page.tsx --lifecycle lint
```

### Verification
- Page is a server component (no `"use client"`)
- `generateMetadata` uses `getTranslations` for translated title
- `requirePermissionForPage` called with correct permission
- Container rendered without additional wrapper components

---

## T17 — Integration Verification

**Estimated time**: 1 hour
**Depends on**: T01-T16 all complete
**Requirements**: All acceptance criteria (AC-01 through AC-21)

### Subtasks

1. **Run full type check**:
   ```bash
   bun tsgo
   ```

2. **Run biome across all cert category files**:
   ```bash
   bun biome:check -- frontend/common/views/dashboard/certificates/categories/ frontend/desktop/views/dashboard/certificates/categories/ frontend/mobile/views/dashboard/certificates/categories/ frontend/common/stores/certificateCategoryStore.ts frontend/common/graphql/sharedDocuments/certificates/certificateCategory.documents.ts shared/locale/types/dashboard/certificates/categories.ts shared/locale/ar/dashboard/certificates/categories.ts shared/locale/en/dashboard/certificates/categories.ts shared/constants/certificate-category-colors.ts shared/constants/certificate-category-icons.ts
   ```

3. **Run lint via queue client** on all cert category files:
   ```bash
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"t17","files":["frontend/common/views/dashboard/certificates/categories/","frontend/desktop/views/dashboard/certificates/categories/","frontend/mobile/views/dashboard/certificates/categories/","frontend/common/stores/certificateCategoryStore.ts","frontend/common/graphql/sharedDocuments/certificates/certificateCategory.documents.ts","shared/locale/types/dashboard/certificates/categories.ts","shared/locale/ar/dashboard/certificates/categories.ts","shared/locale/en/dashboard/certificates/categories.ts","shared/constants/certificate-category-colors.ts","shared/constants/certificate-category-icons.ts"]}'
   ```

4. **Review acceptance criteria** from requirements.md §5:
   - AC-01: Root categories load on page mount via `categoryList` query with `parentId: null`
   - AC-02: Children lazy-load on expand via `categoryList` query with `parentId: <id>`
   - AC-03: Create category via dialog with name, description, parent, color, icon
   - AC-04: Rename category via edit dialog (not inline edit)
   - AC-05: Delete with confirmation dialog showing dependency count
   - AC-06: Reorder via positional API (`beforeId`/`afterId`) on desktop
   - AC-07: Move category to new parent via positional reorder API (`newParentId`)
   - AC-08: Cycle prevention — `descendantIds` excludes self+descendants from `CategoryPicker`
   - AC-09: Template assignment via `MoveTemplateToCategoryDialog` with optimistic update
   - AC-10: Server-side search filters tree via `categorySearch` query
   - AC-11: Permission denied — view-only users see tree + templates; manage users see CRUD actions
   - AC-12: Mobile simplified view with expandable card list, no drag-and-drop
   - AC-13: i18n all keys present (50+ keys in type schema, EN + AR implementations)
   - AC-14: Zustand state survives tier switch (store persists selected category, dialog states, search term)
   - AC-15: Color picker shows 10-15 palette tokens, no hardcoded hex values
   - AC-16: Icon picker shows 15-20 Material icon names
   - AC-17: CategoryAvatar renders in tree nodes, dialog headers, mobile cards
   - AC-18: AppDataGrid uses page-number pagination (`mode: "server"`)
   - AC-19: StatusBadge renders template status in template pane and mobile template cards
   - AC-20: Soft-delete lifecycle — deleted categories excluded from `categoryList`/`categorySearch`
   - AC-21: CYCLE_DETECTED error shown as translated snackbar message

### Quality Loop

No per-file loop — this is integration verification. Run tsgo + biome + lint on all files together.

### Verification
- All AC items pass
- `bun tsgo` clean
- `bun biome:check` clean on all cert category files
- Lint queue returns exitCode 0
- No hardcoded user-facing strings in any file
- No `useLazyQuery` in any file
- No `console.*` calls

---

## T18 — Knowledge Propagation

**Estimated time**: 1 hour
**Depends on**: T17 complete
**Requirements**: §3 (Knowledge Base Updates), design.md §11

### Subtasks

1. **Document patterns for future plans**:
   - Category tree component pattern: lazy-loading tree, Zustand expansion state — note for `frontend/COMPONENT_PATTERNS.md`
   - Drag-and-drop tree pattern: `@dnd-kit` + nested `SortableContext`, positional reorder API (`beforeId`/`afterId`) — note for future drag tree features
   - Self-referential hierarchy handling: cycle prevention via `descendantIds`, `CategoryPicker` `excludeIds` prop — note for future hierarchical entities
   - Color/icon picker pattern: `ColorSwatchPicker` + `IconPicker` using shared constants from `shared/constants/` — note for future customizable entities
   - Do NOT create markdown summary files — these are notes for inline documentation and session handoff

2. **Update session todos**: Ensure every task in this plan is marked `done` in the session SQLite `todos` table. Any blocked tasks should have a description of the blocker.

3. **Prepare handoff notes for Plan 10 (Template Editor)**:
   - The `CategoryPicker` component (T11) is reusable in Plan 10's Basic Info form
   - The `CategoryAvatar` component (T10 subtask 7) is reusable for category display
   - The color/icon constants (`shared/constants/certificate-category-colors.ts`, `shared/constants/certificate-category-icons.ts`) are reusable
   - The category GraphQL documents (T05) at `frontend/common/graphql/sharedDocuments/certificates/certificateCategory.documents.ts` are consumable by Plan 10
   - List all exported documents and their variable shapes

4. **Prepare handoff notes for Plan 8 (Navigation)**:
   - Route `/(dashboard)/certificates/categories` is registered
   - Sidebar nav entry under "Certificates" group
   - Breadcrumb: Dashboard → Certificates → Categories

5. **Prepare AGENTS.md update notes** (for Plan 21 to incorporate):
   - `frontend/common/stores/AGENTS.md`: note about `Set<id>` reconstruction in persist-enabled stores (categories expansion pattern)
   - `frontend/common/graphql/sharedDocuments/AGENTS.md`: example of category fragment + nested children query pattern, `TypedDocumentNode` typing
   - `frontend/views/AGENTS.md`: note about recursive tree components in desktop tier views, `createLazyView` pattern for switchers
   - `frontend/AGENTS.md`: note about `ColorSwatchPicker`/`IconPicker` using `shared/constants/` palette tokens

6. **Do NOT create summary markdown files** — per `AGENTS.md` "AI Agent Communication Rules". Knowledge transfer happens through inline comments, the session todos table, and the design.md/tasks.md files already created.

### Verification
- All session todos for Plan 09 are `done`
- No `.md` summary files created in the repo
- `design.md` interface contracts match the implemented component props and ViewModel returns
- Plan 10 has sufficient information to consume the `CategoryPicker`, `CategoryAvatar`, color/icon constants, and GraphQL documents without re-reading the implementation files

---

## Testing Tasks

### T19 — Create Component Tests (Happy DOM)

**Estimated time**: 4 hours
**Depends on**: T10, T11, T12, T13, T14, T15 (all view components created)
**Requirements**: AC-01 through AC-21 (component-level)

#### Subtasks

1. **Create test files** under `test/ui/components/certificates/categories/`:
   - `CertificateCategoryContainer.test.tsx` — Container + Switcher + ViewModel integration
   - `CreateCategoryDialog.test.tsx` — Form validation, submission, i18n
   - `EditCategoryDialog.test.tsx` — Pre-fill, parent picker exclusion, color/icon pickers
   - `DeleteCategoryConfirmDialog.test.tsx` — Warning display, confirm flow
   - `MoveTemplateToCategoryDialog.test.tsx` — Category picker, move submission
   - `CategoryPicker.test.tsx` — ExcludeIds filtering, autocomplete behavior
   - `ColorSwatchPicker.test.tsx` — Selection, grid layout, theme palette colors
   - `IconPicker.test.tsx` — Selection, grid layout, Material icons
   - `CategoryAvatar.test.tsx` — Render with color/icon/size variants
   - `CategoryTree.desktop.test.tsx` — Expand/collapse, selection, children lazy-load
   - `CategoryTreeNode.desktop.test.tsx` — Inline edit, drag handle, action menu
   - `InlineEditableLabel.desktop.test.tsx` — Double-click, Enter/Escape, validation
   - `CategoryActionMenu.desktop.test.tsx` — Actions visibility, disabled states
   - `CategorySearchBar.desktop.test.tsx` — Debounce, clear, loading state
   - `TemplatePane.desktop.test.tsx` — AppDataGrid columns, pagination, move action
   - `CategoryList.mobile.test.tsx` — Expand/collapse, tap targets
   - `CategoryMobileNodeCard.mobile.test.tsx` — Avatar, child count, action trigger
   - `CategoryMobileActionMenu.mobile.test.tsx` — Actions, disabled states, bottom sheet
   - `TemplateCardList.mobile.test.tsx` — Card rendering, status badge
   - `TemplateCardListItem.mobile.test.tsx` — Name, status, move button
   - `CategorySearchBar.mobile.test.tsx` — Debounce, clear, adornments

2. **Test patterns per `test/ui/AGENTS.md` and `frontend.instructions.md`**:
   - Use `render` from `@testing-library/react` with Happy DOM
   - Mock Apollo Client with `MockedProvider` and `waitFor` for async queries
   - Mock Zustand store with `act()` for state updates
   - Mock i18n with `useAppTranslation` returning test labels object
   - Mock permissions with `useHasPermission` returning test flags
   - Test RTL by wrapping with MUI `ThemeProvider` + `CssBaseline` with `direction="rtl"`
   - Test accessibility with `axe-core` / `jest-axe` (no violations)

3. **Coverage targets**:
   - All public component props exercised
   - All interaction states (hover, focus, disabled, error, loading) covered
   - All i18n keys used in component rendered
   - Permission gating tested for `canManage` true/false
   - Keyboard interactions tested for desktop components
   - Touch interactions tested for mobile components

#### Quality Loop

```bash
bun run scripts/health/sub-loop.ts test/ui/components/certificates/categories/ --lifecycle lint
```

#### Verification
- `bun run test:ui:components` passes for all category component tests
- No console errors in test output
- Coverage report shows ≥80% line coverage on created test files

---

### T20 — Create E2E Tests (Playwright)

**Estimated time**: 3 hours
**Depends on**: T16 (App Router page created), T17 (integration verification passes)
**Requirements**: AC-01 through AC-21 (E2E user flows)

#### Subtasks

1. **Create test files** under `test/ui/e2e/certificates/categories/`:
   - `category-tree-navigation.spec.ts` — Load page, expand/collapse, select categories
   - `category-crud.spec.ts` — Create (root/child), rename (inline + dialog), soft-delete with confirm
   - `category-reorder.spec.ts` — Drag-and-drop reorder (before/after/into), positional API
   - `category-move-template.spec.ts` — Move template between categories, optimistic update
   - `category-search.spec.ts` — Search term, results display, ancestor auto-expand
   - `category-permissions.spec.ts` — View-only user (no CRUD buttons), manage user (full CRUD)
   - `category-mobile.spec.ts` — Mobile viewport: accordion list, FAB, bottom-sheet actions, move up/down
   - `category-accessibility.spec.ts` — Keyboard navigation, screen reader announcements, focus management, touch targets

2. **Test patterns per `test/ui/AGENTS.md`**:
   - Use `test.describe.configure({ retries: 2 })` for flake reduction
   - Authenticate via `test.use({ storageState: 'auth/admin.json' })` fixture
   - Wait for network idle after mutations: `await page.waitForResponse('**/graphql')`
   - Assert visual state via `expect(locator).toHaveScreenshot()` for key states
   - Test RTL by setting `await page.evaluate(() => document.dir = 'rtl')` and re-running core flows

3. **Test data setup**:
   - Use `page.evaluate(() => window.__TEST_SEED__ = ...)` for GraphQL test fixtures
   - Or call test seed script via `page.request.post('/api/test/seed')` if available
   - Clean up between tests with `page.request.delete('/api/test/cleanup')`

#### Quality Loop

```bash
bun run scripts/health/sub-loop.ts test/ui/e2e/certificates/categories/ --lifecycle lint
```

#### Verification
- `bun run build:test` completes (required before `test:ui:e2e`)
- `bun run test:ui:e2e --project=chromium --grep=@cert-categories` passes
- No flaky tests (retries ≤1)
- Screenshots captured for visual regression baseline

---

## Formal Acceptance Criteria Mapping

| AC ID | Requirements Reference | Verified By (Task) | Test Type |
|-------|------------------------|-------------------|-----------|
| AC-01 | REQ-09-01 | T14, T15, T19, T20 | Component + E2E |
| AC-02 | REQ-09-01 | T12, T15, T19, T20 | Component + E2E |
| AC-03 | REQ-09-02 | T10, T19, T20 | Component + E2E |
| AC-04 | REQ-09-03 | T10, T12, T15, T19, T20 | Component + E2E |
| AC-05 | REQ-09-04 | T10, T19, T20 | Component + E2E |
| AC-06 | REQ-09-05 | T12, T19, T20 | Component + E2E |
| AC-07 | REQ-09-05 | T12, T19, T20 | Component + E2E |
| AC-08 | REQ-09-06 | T11, T19, T20 | Component + E2E |
| AC-09 | REQ-09-07 | T10, T19, T20 | Component + E2E |
| AC-10 | REQ-09-08 | T08, T12, T15, T19, T20 | Component + E2E |
| AC-11 | REQ-09-09 | T14, T15, T19, T20 | Component + E2E |
| AC-12 | REQ-09-09 | T15, T19, T20 | Component + E2E |
| AC-13 | REQ-09-10 | T01-T04, T19 | Component (i18n) |
| AC-14 | REQ-09-01 | T06, T09, T19 | Component |
| AC-15 | REQ-09-02 | T10, T19 | Component |
| AC-16 | REQ-09-02 | T10, T19 | Component |
| AC-17 | REQ-09-01 | T10, T12, T15, T19 | Component |
| AC-18 | REQ-09-07 | T13, T19, T20 | Component + E2E |
| AC-19 | REQ-09-07 | T13, T15, T19, T20 | Component + E2E |
| AC-20 | REQ-09-04 | T05, T08, T19 | Component |
| AC-21 | REQ-09-05 | T12, T20 | E2E |

---

## Instruction File & AGENTS.md Discovery Summary

| Task | Files Created/Modified | AGENTS.md to Read | Instructions to Read |
|---|---|---|---|
| T01 | `shared/locale/types/dashboard/certificates/categories.ts`, error types | `shared/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T02 | `shared/locale/ar/dashboard/certificates/categories.ts`, AR errors | `shared/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T03 | `shared/locale/en/dashboard/certificates/categories.ts`, EN errors | `shared/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T04 | `shared/locale/namespaces/.../categories.namespace.ts`, `translation.ts`, `message.ts`, `ar/messages.ts`, `en/messages.ts` (modify) | `shared/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T05 | `frontend/common/graphql/sharedDocuments/certificates/certificateCategory.documents.ts`, `frontend/common/graphql/sharedDocuments/certificates/index.ts` (modify) | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T06 | `frontend/common/stores/certificateCategoryStore.ts` | `frontend/common/stores/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T07 | `frontend/common/views/dashboard/certificates/categories/types/index.ts` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T08 | `frontend/common/views/dashboard/certificates/categories/useCertificateCategoryViewModel.ts` | `frontend/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T09 | `frontend/common/views/dashboard/certificates/categories/CertificateCategoryContainer.tsx`, `CertificateCategoryView.tsx` (switcher) | `frontend/views/AGENTS.md`, `app/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T10 | `frontend/common/views/dashboard/certificates/categories/components/CreateCategoryDialog.tsx`, `EditCategoryDialog.tsx`, `DeleteCategoryConfirmDialog.tsx`, `MoveTemplateToCategoryDialog.tsx`, `CategoryAvatar.tsx`, `ColorSwatchPicker.tsx`, `IconPicker.tsx`, `shared/constants/certificate-category-colors.ts`, `shared/constants/certificate-category-icons.ts` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `shared/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T11 | `frontend/common/views/dashboard/certificates/categories/components/CategoryPicker.tsx` | `frontend/views/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T12 | `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTree.desktop.tsx`, `CategoryTreeNode.desktop.tsx`, `CategoryTreeDropIndicator.desktop.tsx`, `InlineEditableLabel.desktop.tsx`, `CategoryActionMenu.desktop.tsx`, `CategorySearchBar.desktop.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T13 | `frontend/desktop/views/dashboard/certificates/categories/components/TemplatePane.desktop.tsx`, `TemplatePaneColumns.desktop.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T14 | `frontend/desktop/views/dashboard/certificates/categories/certificateCategoryView.desktop.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T15 | `frontend/mobile/views/dashboard/certificates/categories/components/CategoryList.mobile.tsx`, `CategoryMobileNodeCard.mobile.tsx`, `CategoryMobileActionMenu.mobile.tsx`, `TemplateCardList.mobile.tsx`, `TemplateCardListItem.mobile.tsx`, `CategorySearchBar.mobile.tsx`, `certificateCategoryView.mobile.tsx` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T16 | `app/(dashboard)/certificates/categories/page.tsx` | `app/AGENTS.md`, `shared/AGENTS.md`, `AGENTS.md` | `.github/instructions/frontend.instructions.md` |
| T17 | (verification only — no file changes) | — | — |
| T18 | (knowledge propagation — no file changes except inline comments) | `AGENTS.md` | — |

---

## Execution Order

```
Phase A (sequential):  T01 (i18n type schema)
Phase B (parallel):    T02 (AR impl), T03 (EN impl)
Phase C (sequential):  T04 (namespace + registration)
Phase D (sequential):  T05 (GraphQL documents + codegen)
Phase E (sequential):  T06 (Zustand store)
Phase F (sequential):  T07 (types)
Phase G (sequential):  T08 (ViewModel hook)
Phase H (parallel):    T10 (shared dialogs + sub-components + constants), T11 (CategoryPicker)
Phase I (parallel):    T12 (desktop tree components), T13 (desktop template pane)
Phase J (sequential):  T09 (Container + switcher)
Phase K (parallel):    T14 (desktop view), T15 (mobile view)
Phase L (sequential):  T16 (App Router page)
Phase M (sequential):  T17 (integration verification)
Phase N (sequential):  T18 (knowledge propagation)
```

**Total estimated time**: 34 hours (parallelizable to ~20 wall-clock hours with parallelism in Phase B, H, I, and K)

---

## Quality Gate Reference

Per-file verification loop for every file created/modified:

```bash
# Progressive: tsgo → biome → lint (short-circuits at first failure)
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
```

Full plan verification (after T17):

```bash
bun tsgo                          # Type check (safe to run concurrently)
bun biome:check                   # Biome (safe to run concurrently)
bun run lint                      # Full-repo lint via queue client (serialized behind queue server)
```

> The lint queue server must be running before any lint call. Start it with:
> `~/.bun/bin/bun run scripts/lint-queue-server.ts` (background process).
> See `AGENTS.md` §"Lint Queue Server" for details.

---

## T21 — CategoryManagementPage Component

**Estimated time**: 3 hours
**Depends on**: T06 (Zustand store), T09 (Container), T11 (CategoryPicker)
**Requirements**: REQ-09-01, design.md §12.1
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx`

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md` — tier-isolation pattern, `createLazyView` switcher
   - `frontend/AGENTS.md` — MUI v9 sx-prop rules, no hardcoded colors
   - `AGENTS.md` root — logging, path aliases, i18n

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx`:
   - Container component wiring PageHeader + two-column body (left 30% `CategoryTree`, right 70% `CategoryDetailPanel`).
   - PageHeader using translated "Template Categories" title + "Create Category" button gated by `useHasPermission(AppPermission.CertificateCategoryManage)`.
   - Reads `useCategoryStore()` for `selectedCategoryId`, `loading`, `error`.
   - Passes `locale` (from `getLocale()` server-side prop) and `canManage` to children.
   - Empty state when no category selected: translated placeholder card.
   - Imports `CategoryTree` (T22), `CategoryDetailPanel` (T23), and renders the Manage View Switcher per §4 tier isolation.
   - All strings via `useAppTranslation(Translation.Dashboard.CertificateCategories)`. No `console.*`.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx --lifecycle lint
```

### Verification
- Component renders PageHeader with translated title and permission-gated Create button
- Two-column desktop layout (30/70) collapses to stacked on mobile
- Reads Zustand store for selection/loading/error
- No hardcoded strings, no `console.*`

---

## T22 — CategoryTree with Drag-and-Drop

**Estimated time**: 6 hours
**Depends on**: T10 (shared sub-components), T05 (GraphQL documents), T06 (store)
**Requirements**: REQ-09-02, REQ-09-06, REQ-09-07, design.md §12.2, §5
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (shared wrapper + ViewModel), `frontend/desktop/views/dashboard/cert/templates/categories/CategoryTree.desktop.tsx` (tier view with drag)

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md`, `frontend/desktop/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create shared wrapper** `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx`:
   - ViewModel-style hook extracting tree data from Apollo (`categoryList` query for roots + lazy `categoryChildren` on expand) per §7.
   - Wires `useCategoryStore` for `expandedCategoryIds`, `selectedCategoryId`, expansion toggles.
   - Acts as the desktop/mobile switcher host (imports tier view lazily per `frontend/views/AGENTS.md`).

4. **Create desktop tier view** `frontend/desktop/views/dashboard/cert/templates/categories/CategoryTree.desktop.tsx`:
   - MUI `TreeView` + `TreeItem` rendering each node: `CategoryAvatar` (icon), name, template count badge, active/inactive dot.
   - Right-click context menu (Edit, Add Subcategory, Move, Archive, Delete) — items gated by `canManage`; Delete/Archive disabled for `isSystem` categories (Academic, Achievement, Completion, Participation).
   - Drag-and-drop via `@dnd-kit` nested `SortableContext` (per §5): reorder siblings, move subcategories between parents. Drop handlers compute `beforeId`/`afterId`/`newParentId` for the positional `reorderCategory` mutation (F-09-1).
   - Selected node applies theme `primary.main` tinted background and calls `useCategoryStore.selectCategory(id)`.
   - Keyboard navigation (arrows + `Shift+F10` for context menu) for accessibility.
   - All strings via `useAppTranslation(Translation.Dashboard.CertificateCategories)`. Colors exclusively from theme + `shared/constants/certificate-category-colors.ts`. No `console.*`.

5. **Mobile equivalent** stays per §4/T15 (`CategoryList.mobile.tsx`) — no drag-and-drop on mobile per REQ-09-12.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/cert/templates/categories/CategoryTree.desktop.tsx --lifecycle lint
```

### Verification
- Tree expands/collapses with expansion state surviving tier switch (Zustand)
- Context menu items gated by `canManage`; system categories lock Delete/Archive
- Drag-and-drop reorders siblings and reparents subcategories via positional API
- Selection highlights node and loads detail in panel
- Keyboard navigable; no hardcoded strings/colors; no `console.*`

---

## T23 — CategoryDetailPanel

**Estimated time**: 5 hours
**Depends on**: T10 (shared sub-components), T05 (GraphQL documents)
**Requirements**: REQ-09-03, design.md §12.3
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx`

### Subtasks

1. **Read applicable AGENTS.md**:
   - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `AGENTS.md`

2. **Read applicable instruction files**:
   - `.github/instructions/frontend.instructions.md`

3. **Create** `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx`:
   - **Category Info Card**: `IconPicker` (grid, read-only when `!canManage`), `InlineEditableLabel` name (double-click to edit), multiline description `TextField`, parent `Select` (nullable, excludes self+descendants per AC-08), active `Switch` (disabled for `isSystem`).
   - **Template Count Card**: 4 metric rows (Total/`DescriptionOutlined`, Published/`CheckCircle`, Drafts/`Edit`, Archived/`Archive`). Counts via `Category.templateCount` aggregate or `categoryTemplates` query per-status.
   - **Templates in Category**: MUI `List` with template thumbnail (Plan 08 component), name, `StatusBadge` (AC-19), `Intl.DateTimeFormat(locale)` last-modified. Click → `useRouter().push(\`/dashboard/cert/templates/\${id}\`)` (Plan 10). "View All" → `useRouter().push(\`/dashboard/cert/templates?category=\${id}\`)` (Plan 08, §12.6).
   - Empty state card when `category === null` (translated placeholder).
   - All strings via `useAppTranslation`. All colors via theme. No `console.*`.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx --lifecycle lint
```

### Verification
- Three-card layout renders; inline edit bound to store; parent Select excludes cycles
- Template list navigates to editor and Plan 08 list (cross-link)
- Empty state card shown when no selection
- No hardcoded strings/colors; no `console.*`

---

## T24 — CategoryEditorDialog with Icon/Color Picker

**Estimated time**: 5 hours
**Depends on**: T10 (shared dialog + pickers), T05 (GraphQL documents)
**Requirements**: REQ-09-03, REQ-09-04, design.md §12.4
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx`

### Subtasks

1. **Read applicable AGENTS.md + instruction files** per §12.4 list.

2. **Create** `frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx`:
   - Unified create/edit dialog (`category === null` → create; non-null → edit/pre-fill).
   - Fields per §12.4: Name (required, ≤50 chars, char counter), Description (multiline, ≤200 chars, counter), Parent Category (`Autocomplete` nullable, excludes self+descendants), `IconPicker` (15-20 icons from `shared/constants/certificate-category-icons.ts`), `ColorSwatchPicker` (8-10 presets from `shared/constants/certificate-category-colors.ts` + custom color), Display Order (number, non-negative), Active Switch (default on).
   - Validation: name required + unique within parent level (debounced `categorySearch`/client-side check against loaded tree), display order ≥ 0, no cycle on parent pick.
   - `onSave` dispatch on `createCategory`/`updateCategory` mutation; on success closes dialog and refreshes tree (Apollo cache update / refetch); on `CYCLE_DETECTED`/`DUPLICATE_NAME` displays translated field error (§10 i18n catalog).
   - All strings via `useAppTranslation(Translation.Dashboard.CertificateCategories)`. No hardcoded colors. No `console.*`.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx --lifecycle lint
```

### Verification
- Create mode (null category) and edit mode (pre-fill) both work
- Validation enforces required/unique name, display order ≥ 0, parent no-cycle
- Icon/color pickers source from shared constants (no hardcoded values)
- Server errors map to translated field messages

---

## T25 — useCategoryStore Zustand Store

**Estimated time**: 3 hours
**Depends on**: T05 (GraphQL documents + codegen)
**Requirements**: REQ-09-06, design.md §12.5, §3.2 (F-09-3 alignment)
**Files**: `frontend/common/stores/certificateCategoryStore.ts`

### Subtasks

1. **Read applicable AGENTS.md + instruction files** per §12.5 + `frontend/common/stores/AGENTS.md`.

2. **Create** `frontend/common/stores/certificateCategoryStore.ts`:
   - Full `CategoryState` interface per §12.5 (categories, selectedCategoryId, editorOpen, editingCategory, loading, error, expandedCategoryIds Set, searchTerm, all actions).
   - **No `fetchedCategoryIds`** in store (F-09-3) — derive "fetched" from Apollo cache.
   - `categories` sourced from Apollo `categoryList`/`categoryChildren` queries — Zustand holds UI state only.
   - Actions wrap Apollo mutations (`createCategory`, `updateCategory`, `deleteCategory`, `reorderCategory`) with optimistic updates (F-09-6) and rollback on failure.
   - Expansion `Set<string>` survives tier switch in-memory; if `persist` added later, custom `merge` reconstructs Set per `frontend/common/stores/AGENTS.md`.
   - `selectCategory(id)` updates `selectedCategoryId` and triggers §12.6 URL sync via the navigation integration task (T26).
   - No `console.*` — use `logger` from `@/frontend/utils/logger` if logging needed in dev-only paths.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/common/stores/certificateCategoryStore.ts --lifecycle lint
```

### Verification
- Store exposes all §12.5 actions with correct signatures
- No `fetchedCategoryIds`; no Set persistence drift
- Optimistic update + rollback works on mutation success/failure
- Expansion Set survives tier switch (in-memory)

---

## T26 — Category-Based Filtering Integration with Plan 08

**Estimated time**: 4 hours
**Depends on**: T25 (store), T22 (tree), Plan 08 FilterBar available
**Requirements**: REQ-09-10 (browse/filter integration), design.md §12.6
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx` (URL sync), Plan 08 FilterBar wiring (read-only cross-link — no Plan 08 file edits required; see Verification)

### Subtasks

1. **Read applicable AGENTS.md + instruction files** per §12.6.

2. **Add URL sync** to `CategoryManagementPage`:
   - On `selectCategory(id)`, `useRouter().replace("/dashboard/cert/templates?category=" + id, { scroll: false })` (T21 file).
   - On mount, read `useSearchParams().get("category")` and call `selectCategory` if present (deep-link support).

3. **Wire Plan 08 FilterBar category chips** (cross-link only — document the contract, do NOT modify Plan 08 source in this task):
   - Plan 08 FilterBar reads `useCategoryStore.categories` for chip options and `selectedCategoryId` for the active chip.
   - Clicking a chip calls `selectCategory(id)` (updates both stores + URL).
   - Clearing the chip clears `selectedCategoryId` and reverts URL to bare path.
   - Document this contract in handoff notes (T30) so Plan 08 can wire its FilterBar to read from `certificateCategoryStore`.

4. **CategoryDetailPanel "View All"** cross-link (T23) navigates to `/dashboard/cert/templates?category=<id>` — Plan 08 list auto-filters via the same URL param.

5. **Connection reuse**: `categoryTemplates` query (§7) reuses Plan 08's `CertTemplateConnection` relay shape (cursor-based, R-09-2) so Plan 08 card/pagination components render within `CategoryDetailPanel` without duplication.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx --lifecycle lint
```

### Verification
- URL reflects selected category (`?category=<id>`) and survives refresh (deep-link)
- Plan 08 FilterBar contract documented for cross-plan wiring (no Plan 08 edits in this task)
- CategoryDetailPanel "View All" navigates to Plan 08 list filtered by category
- No build-time coupling — both plans read the same `certificateCategoryStore`

---

## T27 — Component Tests (4 Files)

**Estimated time**: 6 hours
**Depends on**: T21, T22, T23, T24 (all view components)
**Requirements**: AC-01 through AC-21 (component-level)
**Files**: `test/ui/components/cert/templates/categories/CategoryManagementPage.test.tsx`, `CategoryTree.test.tsx`, `CategoryDetailPanel.test.tsx`, `CategoryEditorDialog.test.tsx`

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `test/ui/AGENTS.md` — component test conventions
   - `.github/instructions/tests.instructions.md`, `.github/instructions/frontend.instructions.md`

2. **Create 4 test files** under `test/ui/components/cert/templates/categories/`:
   - **`CategoryManagementPage.test.tsx`**: PageHeader renders translated title + permission-gated Create button; two-column layout on desktop, stacked on mobile; empty-state card when no selection; reads store for loading/error.
   - **`CategoryTree.test.tsx`**: Tree expand/collapse with Zustand expansion; node renders icon + name + count badge + active dot; context menu actions gated by `canManage` + locked for `isSystem`; drag-and-drop produces correct `beforeId`/`afterId`/`newParentId` payloads; selection highlights + loads detail; keyboard nav.
   - **`CategoryDetailPanel.test.tsx`**: Three-card layout renders; inline edit on name/description; parent Select excludes self+descendants; active Switch disabled for `isSystem`; template count metrics render; template list item click navigates to editor; "View All" navigates to Plan 08 with `?category=`; empty-state card.
   - **`CategoryEditorDialog.test.tsx`**: Create mode (null) vs edit mode (pre-fill); name required + unique validation; ≤50/≤200 char counters; parent excludes cycle; icon picker selects from shared constants; color picker presets + custom; display order ≥ 0; save dispatches mutation; server `DUPLICATE_NAME`/`CYCLE_DETECTED` maps to translated field error.

3. **Test patterns per `test/ui/AGENTS.md`**:
   - `render` from `@testing-library/react` with Happy DOM.
   - Mock Apollo with `MockedProvider` + `waitFor` for async queries.
   - Mock `useCategoryStore` via `act()` for state updates.
   - Mock `useAppTranslation` returning test labels; mock `useHasPermission`.
   - MUI `ThemeProvider` + `CssBaseline`; test RTL with `direction="rtl"`.
   - `axe-core`/`jest-axe` accessibility assertions (no violations).

4. **Coverage**: ≥80% line coverage on each of the 4 test files; all public props exercised; loading/error/disabled states covered.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryManagementPage.test.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryTree.test.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryDetailPanel.test.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryEditorDialog.test.tsx --lifecycle lint
```

### Verification
- `bun run test:ui:components` passes for all 4 new category test files
- No console errors; ≥80% coverage on created tests
- Accessibility: no axe violations on any dialog/tree render

---

## T28 — E2E Tests (4 Tests: Create, Edit, Delete, Drag-Drop Reorder)

**Estimated time**: 5 hours
**Depends on**: T16 (App Router page), T17 (integration verification), T21-T24 (components)
**Requirements**: AC-03, AC-04, AC-05, AC-06 (E2E user flows)
**Files**: `test/ui/e2e/cert/templates/categories/create-category.spec.ts`, `edit-category.spec.ts`, `delete-category.spec.ts`, `drag-drop-reorder.spec.ts`

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `test/ui/AGENTS.md` — E2E test conventions
   - `.github/instructions/tests.instructions.md`

2. **Create 4 E2E spec files** under `test/ui/e2e/cert/templates/categories/`:
   - **`create-category.spec.ts`** — Open category page → click "Create Category" → fill name/description/parent/icon/color → save → tree refreshes showing new node → confirm URL unchanged (create stays on categories page).
   - **`edit-category.spec.ts`** — Select existing custom category → open editor (double-click name or context menu → Edit) → change name/description/icon → save → tree + detail panel reflect changes → confirm no `CYCLE_DETECTED`/`DUPLICATE_NAME` regression.
   - **`delete-category.spec.ts`** — Select existing custom (non-system) category → context menu → Delete → confirmation dialog shows dependency/template count → confirm → node removed from tree; **verify system category delete** is disabled (Academic/Achievement/Completion/Participation not deletable).
   - **`drag-drop-reorder.spec.ts`** — In desktop viewport, drag a sibling node above/below another → assert `reorderCategory` mutation fired with correct `beforeId`/`afterId`; drag a node onto a different parent → assert `newParentId` set; verify tree reflects new order after server confirmation.

3. **Test patterns per `test/ui/AGENTS.md`**:
   - `test.describe.configure({ retries: 2 })` for flake reduction.
   - `test.use({ storageState: 'auth/admin.json' })` for authentication.
   - `await page.waitForResponse('**/graphql')` after mutations.
   - RTL via `await page.evaluate(() => document.dir = 'rtl')` and re-run core flows.
   - Test data via `page.evaluate(() => window.__TEST_SEED__ = ...)` or `/api/test/seed`.

4. **Test data setup**:
   - Seed a custom category + child subcategory + linked templates.
   - Clean up between tests via `/api/test/cleanup`.

### Quality Loop

```bash
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/create-category.spec.ts --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/edit-category.spec.ts --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/delete-category.spec.ts --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/drag-drop-reorder.spec.ts --lifecycle lint
```

### Verification
- `bun run build:test` completes (required before `test:ui:e2e`)
- `bun run test:ui:e2e --project=chromium --grep=@cert-categories` passes all 4 specs
- No flaky tests (retries ≤1); screenshots captured for visual regression baseline
- System category delete prevented; reorder mutates correct positional payload

---

## T29 — Quality Loop Per File

**Estimated time**: 2 hours
**Depends on**: T21, T22, T23, T24, T25, T26, T27, T28 (all new files)
**Requirements**: All AC (quality-gate conformance)

### Subtasks

1. **Per-file verification** for every file created in T21-T28 via progressive sub-loop (tsgo → biome → lint, short-circuits at first failure):

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/cert/templates/categories/CategoryTree.desktop.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/common/stores/certificateCategoryStore.ts --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryManagementPage.test.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryTree.test.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryDetailPanel.test.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/components/cert/templates/categories/CategoryEditorDialog.test.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/create-category.spec.ts --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/edit-category.spec.ts --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/delete-category.spec.ts --lifecycle lint
bun run scripts/health/sub-loop.ts test/ui/e2e/cert/templates/categories/drag-drop-reorder.spec.ts --lifecycle lint
```

2. **Full-repo verification** (after per-file loops pass):

```bash
bun tsgo                          # Type check (safe to run concurrently)
bun biome:check                   # Biome (safe to run concurrently)
bun run lint                      # Full-repo lint via queue client (serialized behind queue server)
```

> The lint queue server must be running before any lint call: `~/.bun/bin/bun run scripts/lint-queue-server.ts` (background).

3. **Failure handling**: If any per-file loop fails, fix the offending file and re-run only that file's loop (progressive enforcement — no skipping ahead: if tsgo fails, only fix tsgo before biome/lint). Cross-file dependencies are reported via the `CROSS-FILE DEPENDENCY` format per `AGENTS.md` — do NOT modify files outside the assigned task.

### Verification
- All per-file sub-loops exit 0
- `bun tsgo`, `bun biome:check`, `bun run lint` all clean
- No `console.*` calls; no hardcoded user-facing strings; no `useLazyQuery`
- All colors from theme + `shared/constants/`; all icons from `shared/constants/`

---

## T30 — Knowledge Propagation (Enhanced Components)

**Estimated time**: 1 hour
**Depends on**: T29 complete
**Requirements**: §3 (Knowledge Base Updates), design.md §11 + §12.6

### Subtasks

1. **Document the enhanced category management patterns** for future plans (inline notes; do NOT create markdown summary files per `AGENTS.md`):
   - `CategoryManagementPage` two-column Desktop + stacked Mobile pattern — note for `frontend/COMPONENT_PATTERNS.md`.
   - Category tree with lazy-expand + Zustand expansion `Set` (survives tier switch) — note for `frontend/views/AGENTS.md`.
   - Unified create/edit dialog (`CategoryEditorDialog` dispatching on null vs category) — pattern for future canonical editors.
   - Icon/color picker sourcing from `shared/constants/` (no hardcoded values) — note for `frontend/AGENTS.md`.
   - Cross-plan Zustand integration (Plan 09 + Plan 08 sharing `certificateCategoryStore`) + URL sync for category filter — note for future cross-plan state-sharing plans.

2. **Update session todos**: All tasks T21-T30 marked `done`. Any blocked task has blocker description.

3. **Prepare handoff notes for Plan 10 (Template Editor)**:
   - `CategoryEditorDialog` provides the canonical picker pattern Plan 10 should reuse for category assignment in the Basic Info form.
   - `certificateCategoryStore` (T25) is the single source of truth for category selection — Plan 10 reads `selectedCategoryId` for default category on new templates.
   - Color/icon constants in `shared/constants/` are reusable for any category-branded UI.
   - The Plan 08 FilterBar contract (§12.6/T26) is documented so Plan 10 can rely on the same `?category=` URL param convention.

4. **Prepare AGENTS.md update notes** (for Plan 21 to incorporate) — additive to T18:
   - `frontend/views/AGENTS.md`: two-column page layout pattern; lazy-import tier views for tree + panel.
   - `frontend/AGENTS.md`: `CategoryEditorDialog` null-vs-entity dispatch pattern for unified create/edit.
   - `frontend/common/stores/AGENTS.md`: cross-plan shared-store integration (Plan 09 ↔ Plan 08) + URL-sync convention.

5. **No `.md` summary files** — knowledge transfer via inline comments, session todos, and the design.md/tasks.md already created.

### Verification
- All session todos T21-T30 marked `done`
- No `.md` summary files created in repo
- design.md §12 interface contracts match implemented props
- Plan 10 + Plan 08 have sufficient information to consume `certificateCategoryStore`, `?category=` URL convention, and shared constants without re-reading implementation files

---

## Round 4 Enhancement Tasks

> These tasks implement the Round 4 Production Hardening design (design.md §13). Each task references the specific §13 subsection it implements. All tasks are ADDITIVE to T21–T30 — they do not modify existing task scope. Dependencies flow: store/schema tasks first → component tasks → test tasks → quality loop → knowledge propagation.

---

## R31 — Zustand Store Expansion (Drag-Drop, Multi-Select, Filters, Error States)

**Estimated time**: 4 hours
**Depends on**: T25 (certificateCategoryStore exists)
**Requirements**: §13.1, §13.2, §13.7, §13.5, §13.9, §13.13
**File**: `frontend/common/stores/certificateCategoryStore.ts`

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/common/stores/AGENTS.md` — store conventions, Set serialization
   - `.github/instructions/frontend.instructions.md`
   - `frontend/AGENTS.md`

2. **Expand `CategoryState` interface** (additive to §12.5):
   - Drag-drop state: `isDragging: boolean`, `activeDragId: string | null`, `invalidDropTargetId: string | null`, `loadingChildrenForId: string | null`
   - Multi-select state: `selectedCategoryIds: Set<string>`
   - Filter state: `templateCountFilter: 'all' | 'has' | 'none' | '10plus'`, `dateFilter: 'all' | 'today' | 'week' | 'month'`, `colorFilter: string | null`
   - Error state: `saveError: string | null`, `isOnline: boolean`
   - Responsive state: `panelWidths: { tree: number; detail: number; templates: number }`
   - Filtered categories computed selector: `filteredCategories` (derived from `categories` + all active filters via `useMemo` or a Zustand selector)

3. **Add actions** (additive to §12.5 actions):
   - `setDragging(isDragging: boolean, dragId?: string)`, `setInvalidDropTarget(id: string | null)`, `setLoadingChildrenFor(id: string | null)`
   - `toggleCategorySelected(id)`, `toggleRangeSelect(fromId, toId)`, `clearSelection()`, `selectAll()`
   - `bulkMoveToParent(newParentId: string | null)`, `bulkDelete(orphanTemplates: boolean)`, `bulkAssignTemplates(assignments)`
   - `setTemplateCountFilter(v)`, `setDateFilter(v)`, `setColorFilter(v)`, `clearFilters()`
   - `setSaveError(msg: string | null)`, `clearError()`
   - `setPanelWidth(panel, width)`
   - `setOnline(isOnline: boolean)` — called by `useOnlineStatus`

4. **Implementation rules**:
   - `selectedCategoryIds` is a `Set<string>` — if `persist` is ever added, custom `merge` reconstructs Sets (per `frontend/common/stores/AGENTS.md`)
   - `panelWidths` persists to `sessionStorage` via `persist` middleware with a custom `merge` that preserves `Set` fields as arrays
   - Bulk actions wrap Apollo mutations (`BulkReorderCategoriesDocument`, `BulkDeleteCategoriesDocument`, `BulkAssignTemplatesToCategoriesDocument`) with optimistic updates; on failure, roll back via `client.cache.evict` + `refetchQueries: ['CategoryList']`
   - `toggleRangeSelect` computes the sibling range from the parent's children in `categories`, not from `selectedCategoryIds` order
   - `filteredCategories` selector applies: `searchTerm` (name includes), `templateCountFilter`, `dateFilter` (against `category.updatedAt`), `colorFilter` (exact match)

5. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/common/stores/certificateCategoryStore.ts --lifecycle lint
```

### Verification
- `bun tsgo` passes with the expanded interface
- `bun biome:check` clean on the store file
- `bun run lint` clean via queue client
- No `console.*` calls; no hardcoded user-facing strings
- `Set<string>` fields documented with serialization warning comment
- `filteredCategories` correctly returns empty when all filters exclude all nodes

---

## R32 — Drag-Drop Edge Cases & DragPreviewGhost

**Estimated time**: 5 hours
**Depends on**: R31 (store expansion), T22 (CategoryTree exists)
**Requirements**: §13.1 (all 7 edge cases)
**Files**: `frontend/views/dashboard/cert/templates/categories/DragPreviewGhost.tsx`, `frontend/desktop/views/dashboard/cert/templates/categories/CategoryTree.desktop.tsx` (modify)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`
   - `.github/instructions/frontend.instructions.md`

2. **Create `DragPreviewGhost.tsx`** (§13.1.4):
   - Props: `{ categoryName: string; icon: string; childCount: number }`
   - Renders: category icon (`CategoryAvatar`), name `Typography`, and `(N children)` `Chip` when `childCount > 0`
   - Styles: `sx={{ opacity: 0.8, bgcolor: 'background.paper', border: 1, borderColor: 'primary.main', borderRadius: 1, px: 1.5, py: 0.5, boxShadow: 3, display: 'flex', alignItems: 'center', gap: 1 }}`
   - No `console.*`; no hardcoded strings — name passed via props

3. **Modify `CategoryTree.desktop.tsx`** to add edge-case handling:
   - **Drop on root** (§13.1.1): Add a `Dropzone` `Box` at the bottom of the `TreeView` with `onDragOver` + `onDrop` handlers that call `onReorder({ id, newParentId: null })`. Styles: `sx={{ border: '2px dashed', borderColor: 'primary.main', borderRadius: 1, p: 2, opacity: isOver ? 1 : 0, transition: 'opacity 0.2s' }}`
   - **Circular reference prevention** (§13.1.2): In `onDragEnd`, compute `descendantIds` via DFS from `active.id` through `categories`. If `over.id` is in `descendantIds`, call `store.setInvalidDropTarget(over.id)` + show translated `Alert` (`errors.cycleDetected`) and return without mutation
   - **Multi-level drag** (§13.1.3): When `active.data.current?.hasChildren`, render `DragPreviewGhost` with `childCount`. Optimistic update invalidates all child cache entries
   - **Invalid drop zone feedback** (§13.1.5): In `onDragOver`, if `canDrop` is false (cycle, system target, `!canManage`), target `TreeItem` gets `sx={{ border: '2px dashed', borderColor: 'error.main', position: 'relative' }}` + `<BlockOutlinedIcon sx={{ position: 'absolute', top: 4, right: 4, color: 'error.main', fontSize: 16 }} />`
   - **Touch support** (§13.1.6): `useSensors(PointerSensor)` with `activationConstraint: { distance: 8 }` on desktop; long-press `{ delay: 200, tolerance: 5 }` on tablet. Mobile tier disables `DndContext` entirely
   - **Drag cancel** (§13.1.7): `useEffect` listening `keydown` Escape → `DndContext.cancel()`, `store.setDragging(false)`, clears `activeDragId` + `invalidDropTargetId`

4. **Wire `DragOverlay`** to render `<DragPreviewGhost>` inside `DndContext` when `activeDragId` is set (uses `store.activeDragId`)

5. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/DragPreviewGhost.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/cert/templates/categories/CategoryTree.desktop.tsx --lifecycle lint
```

### Verification
- Dropping on root area sets `newParentId: null` in mutation payload
- Cycle attempt shows inline error, no mutation dispatched
- Subtree drag shows child count badge in ghost
- Invalid drop target shows red dashed border + block icon
- Escape cancels active drag, clears all visual overlays
- Touch long-press activates drag on tablet; disabled on mobile

---

## R33 — Multi-Select Category Operations & BulkOperationsDialog

**Estimated time**: 5 hours
**Depends on**: R31 (store), R32 (tree), T25 (store)
**Requirements**: §13.2 (all 7 items)
**Files**: `frontend/views/dashboard/cert/templates/categories/BulkOperationsDialog.tsx`, `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (modify for checkboxes), `frontend/common/graphql/sharedDocuments/cert/category-documents.ts` (add mutations)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
   - `frontend/common/graphql/sharedDocuments/AGENTS.md`
   - `.github/instructions/frontend.instructions.md`

2. **Add bulk GraphQL mutation documents** to `category-documents.ts` (§13.2.6/§13.16):
   - `BulkReorderCategoriesDocument` — `{ ids: [ID!]!, newParentId: ID, beforeId: ID, afterId: ID }`
   - `BulkDeleteCategoriesDocument` — `{ ids: [ID!]!, orphanTemplates: Boolean! }`
   - `BulkAssignTemplatesToCategoriesDocument` — `{ assignments: [{ templateId: ID!, categoryId: ID! }]! }`
   - `RestoreCategoryDocument` — `{ id: ID! }`
   - `CategoryAuditLogQueryDocument` — `{ categoryId: ID! }`
   - Naming convention: `{entityName}MutationDocument` / `{entityName}QueryDocument` per `sharedDocuments/AGENTS.md`
   - Each mutation includes `id` field on returned objects for Apollo cache normalization

3. **Create `BulkOperationsDialog.tsx`** (§13.2):
   - Unified dialog for bulk move, bulk delete, bulk assign — dispatches on `mode: 'move' | 'delete' | 'assign'`
   - **Move mode**: `Autocomplete` of categories (excludes selected IDs + descendants) + confirm `Button` with `bulk.move.confirm` interpolation `Move {count} categories`
   - **Delete mode**: warning `List` with `WarningAmberOutlined` icons showing `bulk.delete.warning.subcategories(count)` + `bulk.delete.warning.templates(count)`, confirm `Button` color `error` with `bulk.delete.confirm` `Delete {count} Categories`
   - **Assign mode**: searchable `Autocomplete` of templates (multi-select, from `templateList` query — Plan 08) + assign button
   - All labels via `useAppTranslation(Translation.Dashboard.CertificateCategories)`
   - Styles: `sx={{ minWidth: 400 }}` on `Dialog`, `List` items with `sx={{ display: 'flex', alignItems: 'center', gap: 1 }}`

4. **Modify `CategoryTree.tsx`** to add per-node checkboxes (§13.2.1):
   - `TreeItem` `icon` slot renders `<Checkbox checked={selectedCategoryIds.has(id)} onChange={() => toggleCategorySelected(id)} size="small" sx={{ p: 0.5 }} />` when `canManage`
   - **Shift+click range select** (§13.2.5): `onClick` handler checks `event.shiftKey` + `lastSelectedId` → calls `toggleRangeSelect(lastSelectedId, id)`
   - Checkboxes are `aria-label={t("a11y.selectCategory")}` (new i18n key)

5. **Modify `CategoryManagementPage.tsx`** header:
   - When `selectedCategoryIds.size > 0`: render bulk action buttons "Move Selected…", "Delete Selected", "Assign Templates…" in a `Stack direction="row" spacing={1}`
   - "Delete Selected" Button: `color="error"`, `variant="contained"`
   - Selection count `Chip` showing N selected with "Clear" `IconButton`

6. **Wire store actions** to `BulkOperationsDialog` callbacks → dispatch mutations → optimistic update → clear selection on success → set `saveError` on failure

7. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/BulkOperationsDialog.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/cert/category-documents.ts --lifecycle lint
```

### Verification
- Checkbox toggles membership in `selectedCategoryIds`
- Shift+click selects all siblings between two checkboxes
- Bulk move updates `parentId` for all selected via single mutation
- Bulk delete shows cascade warning with correct subcategory + template counts
- Bulk assign dispatches `BulkAssignTemplatesToCategoriesDocument` with correct assignments
- Selection cleared after successful bulk operation
- "Move Selected" Autocomplete excludes selected IDs and their descendants (cycle prevention)

---

## R34 — Loading & Skeleton States

**Estimated time**: 3 hours
**Depends on**: R31 (store loading fields), T22 (tree), T23 (detail panel)
**Requirements**: §13.3 (all 4 items)
**Files**: `frontend/views/dashboard/cert/templates/categories/SkeletonTreeItem.tsx`, `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (modify), `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx` (modify)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
   - `.github/instructions/frontend.instructions.md`

2. **Create `SkeletonTreeItem.tsx`** (§13.3.1):
   - Props: `{ depth: number }` — renders `Skeleton` at indentation `sx={{ ml: depth * 2 }}`
   - `Skeleton variant="rounded" width="60%" height={36}` with `sx={{ animationDuration: '1.2s' }}`
   - Reusable in tree initial load and progressive level load (§13.3.4)

3. **Modify `CategoryTree.tsx`** for skeleton states (§13.3.1, §13.3.4):
   - When `store.loading === true`: render 5–8 `SkeletonTreeItem` components at varying depth (1–3)
   - When a node is expanded and `store.loadingChildrenForId === nodeId`: render 3 `SkeletonTreeItem` children at `depth = nodeDepth + 1` under the expanded node, replaced with real children on query resolution

4. **Modify `CategoryDetailPanel.tsx`** for skeleton state (§13.3.2):
   - When `category` is selected but data is in-flight: render skeleton cards — `Skeleton variant="circular" width={56} height={56}` for icon, `Skeleton variant="text" width="60%"` for name, 3 × `Skeleton variant="text"` for description, and `Stack direction="row" spacing={2}` of 3 `Skeleton variant="rounded" width={120} height={64}` for template count metrics
   - Uses `sx={{ animationDuration: '1.5s' }}` for metrics to differentiate from tree skeleton

5. **Progressive loading check**: `onNodeToggle` handler sets `store.setLoadingChildrenFor(id)` before dispatching `categoryList(parentId)` query, clears in `onCompleted`/`onError` callback

6. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/SkeletonTreeItem.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx --lifecycle lint
```

### Verification
- Tree shows skeleton branches during initial load (no flash of empty tree)
- Expanding a node shows skeleton children until query resolves
- Detail panel shows skeleton cards before category detail data arrives
- Skeleton animation durations differ (tree 1.2s, metrics 1.5s) for visual depth
- No layout shift when skeletons are replaced by real content (same dimensions)

---

## R35 — Empty States

**Estimated time**: 3 hours
**Depends on**: R31 (store), R34 (skeleton — distinguish loading vs empty), T22 (tree), T23 (detail panel)
**Requirements**: §13.4 (all 4 items)
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (modify), `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx` (modify), `shared/locale/dashboard/certificates/categories.namespace.ts` (add keys)

### Subtasks

1. **No categories** (§13.4.1): When `categories.length === 0 && !loading`:
   - Replace tree area with `Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}`
   - `<SvgIcon component={CategoryOutlined} sx={{ fontSize: 64, color: 'text.disabled' }} />`
   - `Typography variant="h6"` → `empty.noCategories.title`
   - `Typography variant="body2" color="text.secondary"` → `empty.noCategories.subtitle`
   - `ContainedButton` → `empty.noCategories.cta`, gated by `canManage`, `onClick={() => openEditor(null)}`

2. **No subcategories** (§13.4.2): When a node is expanded and children query returns `[]`:
   - Inline `Typography variant="body2" color="text.secondary"` → `empty.noSubcategories`
   - `TextButton startIcon={<AddOutlined />}` → `+ Add Subcategory` (if `canManage`), `onClick={() => openEditor({ parentId: nodeId })}`

3. **No templates in category** (§13.4.3): When `CategoryDetailPanel` template list is empty:
   - `Box` centered with `<SvgIcon component={FolderOpenOutlined} sx={{ fontSize: 48, color: 'text.disabled' }} />`
   - `Typography` → `empty.noTemplates.title`
   - `TextButton` → `empty.noTemplates.browse`, navigates to `/dashboard/cert/templates`

4. **Filtered empty** (§13.4.4): When `filteredCategories.length === 0` and any filter is active:
   - `Typography` → `empty.filtered.title`
   - `TextButton` → `empty.filtered.reset`, `onClick={() => store.clearFilters()}`

5. **Add i18n keys** to `categories.namespace.ts` (§13.15 table — empty.* keys): all keys typed correctly, AR with proper interpolation/pluralization

6. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts shared/locale/dashboard/certificates/categories.namespace.ts --lifecycle lint
```

### Verification
- "No categories" state shows illustration + CTA button (gated by permission)
- "No subcategories" appears inline under expanded empty node
- "No templates" appears in detail panel with browse link
- "Filtered empty" appears when all filters exclude everything; "Reset Filters" clears them
- All empty-state strings come from i18n namespace (no hardcoded text)
- Empty states pass axe accessibility (proper heading levels, button labels)

---

## R36 — Error Boundaries & Network Reconnect

**Estimated time**: 3 hours
**Depends on**: R31 (store error fields), T22 (tree), T23 (detail panel), T24 (editor dialog)
**Requirements**: §13.5 (all 4 items)
**Files**: `frontend/common/hooks/useOnlineStatus.ts`, `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (modify), `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx` (modify), `frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx` (modify), `frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx` (modify), `shared/locale/dashboard/certificates/categories.namespace.ts` (add error keys)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/AGENTS.md`, `frontend/views/AGENTS.md`
   - `frontend/common/hooks/AGENTS.md` (if exists)
   - `.github/instructions/frontend.instructions.md`

2. **Create `useOnlineStatus.ts`** (§13.5.4):
   - Returns `{ isOnline: boolean }` — uses `navigator.onLine` + `window.addEventListener('online'/'offline')`
   - On `online` event after `offline`: calls `store.setOnline(true)` + `store.loadCategories()` (refetch) + clears `error`
   - On `offline` event: calls `store.setOnline(false)` — does NOT clear error (may be network-related)
   - `useEffect` cleanup removes event listeners

3. **Tree load error** (§13.5.1): When `error` is set and tree data failed:
   - `Box` centered with `<SvgIcon component={CloudOffOutlined} sx={{ fontSize: 48, color: 'error.main' }} />`
   - `Typography color="error"` → `errors.loadFailed`
   - `Button variant="outlined" startIcon={<RefreshOutlined />}` → "Retry", `onClick={() => store.loadCategories()}`
   - Error message from i18n `errors.loadFailed`, not `error` raw string (which may contain server details)

4. **Node save error** (§13.5.2): In `CategoryEditorDialog` and inline edit in `CategoryDetailPanel`:
   - `<Alert severity="error" onClose={() => store.clearError()} sx={{ mb: 2 }}>` displaying `store.saveError` (translated)
   - `saveError` is set by `saveCategory`/`deleteCategory` catch blocks with the translated message from the i18n error catalog
   - Dismissible; auto-clears on next successful action

5. **Optimistic update rollback** (§13.5.3):
   - In `saveCategory`, `deleteCategory`, `moveCategory`, `bulkMoveToParent`, `bulkDelete` catch blocks: `client.cache.evict({ id: 'Category:' + id })`, `client.cache.gc()`, then `client.refetchQueries({ include: ['CategoryList'] })`
   - Show transient `Snackbar` (autoHideDuration: 3000) with `errors.reverted` message
   - Uses MUI `Snackbar` + `Alert severity="warning"` styled per theme

6. **Network reconnect** (§13.5.4): `useOnlineStatus` wired in `CategoryManagementPage`:
   - When reconnecting: `Chip` in page header with `sx={{ color: 'warning.main' }}` showing `errors.networkReconnecting` with a `CircularProgress size={16}` spinner
   - On reconnected: chip disappears, tree refetches

7. **Add i18n error keys** (§13.15): `errors.loadFailed`, `errors.saveFailed`, `errors.networkReconnecting`, `errors.reverted`

8. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/common/hooks/useOnlineStatus.ts --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx --lifecycle lint
```

### Verification
- Network failure → tree shows error card with retry button; retry refetches successfully
- Save failure → inline Alert in dialog/panel with translated message; dismissible
- Optimistic rollback → reverted state + "Changes reverted" snackbar (3s)
- Offline → reconnect → "Reconnecting…" chip in header → tree refetches → chip disappears
- `useOnlineStatus` cleanup removes listeners on unmount
- All error strings from i18n namespace

---

## R37 — Tree Virtualization (react-window)

**Estimated time**: 4 hours
**Depends on**: R31 (store), T22 (tree), R34 (skeleton)
**Requirements**: §13.6 (all 4 items)
**Files**: `frontend/desktop/views/dashboard/cert/templates/categories/VirtualizedTree.desktop.tsx`

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`
   - `.github/instructions/frontend.instructions.md`

2. **Install `react-window`** (if not already present):
   - `bun add react-window @types/react-window`
   - Verify with package manager

3. **Create `VirtualizedTree.desktop.tsx`** (§13.6.1):
   - `FixedSizeList` from `react-window` with `itemSize={36}`, `width="100%"`, `height={measuredHeight}`
   - Container height measured via `useRef` + `ResizeObserver`
   - Each row renders a `TreeNode` wrapper: `Box sx={{ display: 'flex', alignItems: 'center', pl: depth * 2, height: 36 }}`
   - Row content: expand chevron (`IconButton` with `ArrowDropDownOutlined`/`ArrowRightOutlined`), `Checkbox` (if `canManage`), `CategoryAvatar`, `Typography` name, template count `Chip`, active dot
   - `aria` attributes (§13.8.1): `role="tree"` on container, `role="treeitem"` on row, `aria-level={depth}`, `aria-expanded`, `aria-selected`

4. **Flatten visible tree** (§13.6.2):
   - `useMemo` walks `categories` + `expandedCategoryIds` to produce `visibleNodes: Array<{ id, depth, name, ... }>`
   - Recomputes only when `expandedCategoryIds` or `categories` changes (dependency array)
   - Helper `flattenTree(categories, expandedIds)` in the same file or a shared util

5. **Threshold switch** (§13.6.1): In `CategoryTree.desktop.tsx`, `if (visibleNodeCount > 500) return <VirtualizedTree /> else return <TreeView />`

6. **Expand/collapse + scroll** (§13.6.2):
   - Chevvron `onClick` → `store.toggleExpansion(id)` → memo recomputes visible nodes → `FixedSizeList` `itemCount` updates
   - Use `listRef.current.scrollToItem(index, 'center')` to keep expanded node in view

7. **Lazy children + skeleton** (§13.6.3): When `loadingChildrenForId === id`, render 3 `SkeletonTreeItem` (R34) as virtualized rows (itemSize 36 each) under the expanded node

8. **Tree indent preservation** (§13.6.4): Row `sx={{ pl: depth * 2 }}` — pure padding, no portal. Chevron positioned at left edge of padding-aligned content

9. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/cert/templates/categories/VirtualizedTree.desktop.tsx --lifecycle lint
```

### Verification
- Tree switches to `VirtualizedTree` when visible node count > 500
- Scroll performance is 60fps for 1000 nodes (Chrome DevTools)
- Expand/collapse keeps expanded node centered in viewport
- Indentation preserved correctly per depth level
- Selection works (`aria-selected`) on virtualized rows
- `react-window` row heights consistent (36px) — no visual gaps/overlaps

---

## R38 — Search & Filter

**Estimated time**: 4 hours
**Depends on**: R31 (store filter fields), T22 (tree), R34 (empty state for filtered)
**Requirements**: §13.7 (all 6 items)
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryFilterBar.tsx`, `frontend/views/dashboard/cert/templates/categories/highlightMatch.ts`, `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (modify), `frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx` (modify), `shared/locale/dashboard/certificates/categories.namespace.ts` (add search/filter keys)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
   - `.github/instructions/frontend.instructions.md`

2. **Create `highlightMatch.ts`** (§13.7.5):
   - Export `highlightMatch(text: string, term: string): ReactNode[]`
   - Splits `text` at each case-insensitive occurrence of `term`, wraps matches in `<mark sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 0.5, px: 0.25 }}>`
   - Returns array of plain string segments + `<mark>` elements; no `React.Fragment` wrapper needed (caller spreads)
   - Term empty/null → returns `[text]` (unmodified)

3. **Create `CategoryFilterBar.tsx`** (§13.7.1–§13.7.6):
   - `TextField` with `placeholder={t('search.placeholder')}` + 300ms debounce via a `useDebouncedValue` hook (inline or from `frontend/common/hooks/`)
   - `InputAdornment` with `IconButton` (`CloseOutlined`) clear button — visible when `searchTerm` is non-empty → calls `store.setSearchTerm(null)`
   - Filter `Select` for template count: options `filter.templateCount.all`, `.has`, `.none`, `.10plus` → `store.setTemplateCountFilter(v)`
   - Filter `Select` for date: options `filter.date.all`, `.today`, `.week`, `.month` → `store.setDateFilter(v)`
   - Color filter `Stack direction="row" spacing={0.5}` of small `Box` swatch buttons (8 preset colors from `shared/constants/certificate-category-colors.ts`) — clicking sets `store.setColorFilter(hex | null)`
   - Layout: `Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}`
   - Each `Select` sized `sx={{ minWidth: 160 }}`

4. **Modify `CategoryTree.tsx`** to render filtered tree (§13.7):
   - When `searchTerm` is set (≥ 2 chars), dispatch `categorySearch` GraphQL query (§3.1) and render results as a flat list instead of hierarchical tree
   - When filters are active, use `store.filteredCategories` (R31 selector) to drive the tree
   - Node names rendered with `highlightMatch(node.name, searchTerm)` when `searchTerm` is active

5. **Wire `CategoryFilterBar`** into `CategoryManagementPage.tsx` above the tree column

6. **Add i18n keys** (§13.15): `search.placeholder`, `search.clear`, `filter.templateCount.*`, `filter.date.*`, `filter.color`

7. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryFilterBar.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/highlightMatch.ts --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
```

### Verification
- Typing search term (≥ 2 chars) after 300ms debounce triggers `categorySearch` query
- Search results highlight matched substring in `<mark>` styled per theme
- Clear search button resets tree to full visibility
- Template count filter "Has templates" hides nodes with 0 templates
- Date filter "This week" hides nodes modified earlier
- Color filter swatch highlights only matching color categories
- Filtered empty state (R35 §13.4.4) shows "Reset Filters" button when all filtered out
- No layout shift on filter application; no hardcoded strings or colors

---

## R39 — Accessibility

**Estimated time**: 4 hours
**Depends on**: R37 (virtualized tree), R32 (drag-cancel keyboard), T22 (tree)
**Requirements**: §13.8 (all 5 items)
**Files**: `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (modify), `frontend/desktop/views/dashboard/cert/templates/categories/VirtualizedTree.desktop.tsx` (modify if virtualized), `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx` (modify), `shared/locale/dashboard/certificates/categories.namespace.ts` (add a11y keys)

### Subtasks

1. **Tree roles** (§13.8.1):
   - MUI `TreeView` already provides `role="tree"` + `TreeItem` `role="treeitem"` with `aria-expanded`, `aria-level`, `aria-selected` — verify these are set correctly
   - Virtualized tree (V37): manually set `role="tree"` on container `div`, `role="treeitem"` on each row, `aria-level={depth}`, `aria-expanded={hasChildren && expandedCategoryIds.has(id)}`, `aria-selected={selectedCategoryId === id}`
   - Add `aria-label={t('a11y.treeLabel')}` to the tree container

2. **Keyboard navigation** (§13.8.2):
   - MUI `TreeView` provides arrow key navigation natively — verify it works
   - Virtualized tree: implement `onKeyDown` handler for Tree rows: `ArrowUp/ArrowDown` (move focus), `ArrowRight` (expand if collapsed, move to first child), `ArrowLeft` (collapse if expanded, move to parent), `Enter` (select → load detail), `Space` (toggle expand)
   - `Shift+F10` opens context menu (already in §12.2)

3. **JAWS/NVDA** (§13.8.3):
   - All interactive elements have `aria-label` or visible label
   - `aria-label` on TreeView = `t('a11y.treeLabel')` = "Category Tree" / "شجرة الفئات"
   - `aria-live="polite"` on `CategoryDetailPanel` container so screen readers announce content changes

4. **Focus management** (§13.8.4):
   - On expand: focus stays on node; Arrow Down after expand moves to first child
   - On collapse: focus stays on node
   - On node delete: focus moves to next sibling (call `nodeRef.current.focus()` or use `useRef` + DOM query)

5. **Tree position announcement** (§13.8.5):
   - Each `TreeItem` (`aria-describedby`) points to a visually hidden span with `getTreeItemDescription(node, depth, index, siblings)` → `t('a11y.treePosition', { level, pos, total, expandedState, childCount })`
   - Hidden span: `sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}` (visually hidden pattern, not `display: none`)

6. **Add i18n a11y keys** (§13.15): `a11y.treeLabel`, `a11y.treePosition(level, pos, total, expandedState, childCount)`, `a11y.selectCategory`

7. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/cert/templates/categories/VirtualizedTree.desktop.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx --lifecycle lint
```

### Verification
- `role="tree"` + `role="treeitem"` + `aria-expanded`/`aria-level`/`aria-selected` on all tree nodes (virtualized and non-virtualized)
- Keyboard: Tab → tree; arrows navigate; Enter → select; Space → toggle; Shift+F10 → context menu
- `aria-live="polite"` on detail panel announces selection changes
- Hidden description span accessible to screen readers (not display:none)
- axe-core: no violations on tree + detail panel + filter bar
- WAI-ARIA Tree Pattern compliance verified via manual NVDA test during R40

---

## R40 — Responsive (Mobile Accordion, Tablet Side-by-side, Desktop 3-panel)

**Estimated time**: 4 hours
**Depends on**: R31 (panel widths in store), T15 (mobile view), T21 (page container), T22 (tree)
**Requirements**: §13.9 (all 3 breakpoints)
**Files**: `frontend/mobile/views/dashboard/cert/templates/categories/CategoryList.mobile.tsx` (modify or create), `frontend/mobile/views/dashboard/cert/templates/categories/CategoryDetailBottomSheet.mobile.tsx`, `frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx` (modify)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
   - `.github/instructions/frontend.instructions.md`

2. **Mobile (< 768px)** — tree as accordion (§13.9.1):
   - `CategoryList.mobile.tsx`: MUI `Accordion` per root category — `AccordionSummary` with expand icon + name; `AccordionDetails` with child list (one level deep visible; tap child navigates deeper)
   - `CategoryDetailBottomSheet.mobile.tsx`: `SwipeableDrawer anchor="bottom"` with `sx={{ borderRadius: '16px 16px 0 0', maxHeight: '70vh' }}` showing `CategoryDetailPanel` content
   - No drag-and-drop (`DndContext` disabled on mobile per §13.1.6)

3. **Tablet (768px–1023px)** — side-by-side (§13.9.2):
   - `Stack direction="row" sx={{ gap: 2 }}` with tree (40%) + detail panel (60%)
   - Drag-and-drop enabled via `PointerSensor` with long-press `{ delay: 200, tolerance: 5 }`
   - No third panel (templates list stays in detail panel)

4. **Desktop (≥ 1024px)** — 3-panel resizable (§13.9.3):
   - Tree (25%), detail (40%), templates (35%) in `Stack direction="row"`
   - Resizable via MUI `Divider` with `sx={{ cursor: 'col-resize', width: 4, bgcolor: 'divider' }}` + pointer drag handlers
   - Panel widths persisted in `store.panelWidths` → `sessionStorage` via `persist` with custom `merge` for `Set` fields
   - Drag-and-drop with `PointerSensor` distance constraint

5. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/cert/templates/categories/CategoryList.mobile.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/cert/templates/categories/CategoryDetailBottomSheet.mobile.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx --lifecycle lint
```

### Verification
- Mobile: tree is accordion, detail is bottom sheet; no DnD
- Tablet: side-by-side tree+detail; long-press drag enabled
- Desktop: 3-panel with resizable dividers; panel widths persist across refresh
- No `useMediaQuery` in tier views (only in container/page) — tier isolation enforced
- RTL: accordion expand direction correct; bottom sheet works in RTL

---

## R41 — Color Tag System

**Estimated time**: 3 hours
**Depends on**: R38 (color filter uses this), R35 (empty states)
**Requirements**: §13.10 (all 5 items)
**Files**: `shared/constants/certificate-category-colors.ts` (create/update), `frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx` (modify), `frontend/views/dashboard/cert/templates/categories/CategoryFilterBar.tsx` (modify for color legend + filter), `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (modify for high-contrast)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `shared/AGENTS.md` — shared layer rules (no frontend/backend imports)
   - `frontend/views/AGENTS.md`, `frontend/AGENTS.md`

2. **Create `shared/constants/certificate-category-colors.ts`** (§13.10.4):
   - Export named constants: `COLOR_BLUE`, `COLOR_ORANGE`, `COLOR_GREEN`, `COLOR_YELLOW`, `COLOR_RED`, `COLOR_PURPLE`, `COLOR_SKY_BLUE`, `COLOR_GREY`
   - Wong color-blind safe palette as hex strings
   - Export `CATEGORY_COLOR_PRESETS: Array<{ name: string; key: string; hex: string }>` (semantic names for a11y labels)
   - Export `getCategoryColorLabel(hex: string): string` helper for high-contrast mode text labels
   - **No frontend/backend imports** — pure constants (per `shared/AGENTS.md`)

3. **Color picker** (§13.10.1):
   - `CategoryEditorDialog`: `ColorSwatchPicker` component (§4/T10) renders 8 presets; "Custom" button opens `Popover` with native `<input type="color">`
   - Selected color drives `category.color` + preview swatch next to name field
   - Color values come from constants, not hardcoded

4. **Color legend** (§13.10.2):
   - Collapsible `Box` in `CategoryFilterBar` showing 8 preset colors + labels
   - Renders `Stack direction="row" spacing={1}` of `Box sx={{ width: 16, height: 16, bgcolor: hex, borderRadius: '50%' }}` + `Typography variant="caption"`

5. **Filter by color** (§13.10.3):
   - Already in R38 `CategoryFilterBar` — 8 swatch buttons set `store.setColorFilter`

6. **High contrast mode** (§13.10.5):
   - In `CategoryTree.tsx` or `VirtualizedTree.desktop.tsx`:
   - Use CSS media query `@media (prefers-contrast: more)` via `sx` on color swatches: `border: 2, borderColor: 'text.primary'`
   - Append color name `Typography variant="caption"` next to each swatch in high-contrast
   - Never use color alone as an indicator (WCAG 1.4.1 compliance)

7. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts shared/constants/certificate-category-colors.ts --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryFilterBar.tsx --lifecycle lint
```

### Verification
- 8 preset colors from `shared/constants/certificate-category-colors.ts` (Wong color-blind safe)
- Custom color picker opens native `<input type="color">` in popover
- Color legend renders below tree (collapsible)
- Color filter swatch buttons correctly filter tree by exact color match
- High contrast mode: swatches have black borders + color name labels
- No hardcoded hex values anywhere except the shared constants file

---

## R42 — Audit & History

**Estimated time**: 5 hours
**Depends on**: R33 (bulk mutations for audit entries), T25 (store), T23 (detail panel)
**Requirements**: §13.11 (all 4 items)
**Files**: `frontend/common/graphql/sharedDocuments/cert/category-documents.ts` (add audit queries), `frontend/views/dashboard/cert/templates/categories/CategoryHistoryTimeline.tsx`, `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx` (add history tab), `frontend/common/stores/certificateCategoryStore.ts` (add undo state)

### Subtasks

1. **Read applicable AGENTS.md + instruction files**:
   - `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`
   - `frontend/common/graphql/sharedDocuments/AGENTS.md`
   - `.github/instructions/frontend.instructions.md`

2. **Add GraphQL query** to `category-documents.ts` (§13.16):
   - `CategoryAuditLogQueryDocument` — `{ categoryId: ID! } → { id, categoryId, action, userId, timestamp, beforeData, afterData, user { id displayName avatarUrl } }`
   - `RestoreCategoryDocument` — mutation `{ id: ID! } → { id }`
   - All returned objects include `id` for Apollo cache normalization

3. **Create `CategoryHistoryTimeline.tsx`** (§13.11.2):
   - Props: `{ categoryId: string }`
   - MUI `Timeline` + `TimelineItem` per audit entry
   - Each item: user avatar (`Avatar`), action icon (`TimelineSeparator` with `TimelineDot` — `AddOutlined` for CREATE, `EditOutlined` for UPDATE, `DeleteOutlined` for DELETE, `SwapVertOutlined` for REORDER/MOVE), timestamp ("time ago" via `Intl.RelativeTimeFormat(locale)`), and diff summary as `Typography variant="body2"`
   - Fetched via `useQuery(CategoryAuditLogQueryDocument, { variables: { categoryId } })`
   - Loading skeleton: 3 `TimelineItem` with `Skeleton` for avatar + text
   - Empty state: "No history available" `Typography`

4. **Add "History" tab** to `CategoryDetailPanel.tsx` (§13.11.2):
   - MUI `Tabs` with two tabs: "Details" (existing content) + "History" (`CategoryHistoryTimeline`)
   - `Tab` labels via `useAppTranslation`: `dashboard.certificates.categories.tab.details` (+ `tab.history`)
   - Selected tab stored in component `useState` (not Zustand — ephemeral)

5. **Undo within 30s** (§13.11.3):
   - After `deleteCategory` or `moveCategory` success, store sets `undoWindow: { actionId, actionType, expiresAt } | null`
   - `CategoryManagementPage` renders `Snackbar` with "Undo" `Button` when `undoWindow` is active
   - Clicking "Undo" calls `restoreCategory(id)` or `undoMoveCategory(id)` mutation (audit log stores `beforeData`)
   - `setTimeout` in store clears `undoWindow` after 30s; cleared on unmount
   - Snackbar `autoHideDuration: 30000`

6. **Merge history** (§13.11.4):
   - Forward-compatible only — audit log schema supports `action: 'MERGE'`; no implementation this round
   - Document in a code comment in `CategoryHistoryTimeline.tsx` that merge entries will render when available

7. **Add store fields** for undo (R31 extension):
   ```typescript
   undoWindow: { actionId: string; actionType: 'DELETE' | 'MOVE'; expiresAt: number } | null;
   setUndoWindow: (w: CategoryState['undoWindow']) => void;
   clearUndoWindow: () => void;
   ```

8. **Add i18n keys** (§13.15): `history.title`, `history.created`, `history.updated`, `history.deleted`, `history.reordered`, `history.moved`, `undo.delete.message`, `undo.move.message`, `undo.action`, `tab.details`, `tab.history`

9. **Quality Loop**:

```bash
bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/cert/category-documents.ts --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryHistoryTimeline.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx --lifecycle lint
bun run scripts/health/sub-loop.ts frontend/common/stores/certificateCategoryStore.ts --lifecycle lint
```

### Verification
- History tab renders `Timeline` with audit entries (action icon, user avatar, timestamp, diff)
- Delete → "Undo" Snackbar appears for 30s; clicking calls `restoreCategory`; auto-hides after 30s
- Move → "Undo" Snackbar appears for 30s; clicking calls `undoMoveCategory`
- Loading skeleton renders while audit log query is in-flight
- Empty "No history" renders for categories with no audit entries
- All timestamps formatted via `Intl` with `locale` (no hardcoded date strings)
- Merge action type documented in code comment (forward-compatible)

---

## R43 — Performance Budgets

**Estimated time**: 3 hours
**Depends on**: R32-R42 (all enhancement components), R37 (virtualization)
**Requirements**: §13.12 (all metrics)
**Files**: test assertions in R44 component tests + R45 E2E specs + build verification

### Subtasks

1. **Render time assertions** (§13.12 — tree render < 16ms/node):
   - In R44 component tests for `CategoryTree`: wrap rendering in `performance.now()` before/after and `.toBeLessThan(BUDGET)` assertion
   - Budget: per-node render < 16ms (measured for 50-node tree → total < 800ms assertion)

2. **Expand/collapse timing** (§13.12 — < 100ms for 500 children):
   - In R44 tests: `performance.now()` around `toggleExpansion` dispatch for a node with 500 children; assert < 100ms

3. **API response budget** (§13.12 — < 200ms):
   - In R45 E2E tests: `await page.waitForResponse('**/graphql')` timing for `categoryList` query; assert < 200ms (with retry/tolerance for CI)

4. **Bundle size** (§13.12 — < 40KB gzipped):
   - After `bun run build`, inspect `.next/server/app/dashboard/cert/templates/categories/page.js` (or equivalent client chunk)
   - Assert gzip size < 40KB via `gzip -c | wc -c` in a verification script
   - If over budget: investigate imports (avoid full library imports; use tree-shakeable paths)

5. **Drag performance** (§13.12 — drag start → ghost < 50ms):
   - In R45 E2E drag-drop spec: `performance.now()` around `{ trigger pointer down }` → assert ghost visible < 50ms (via `page.waitForSelector('[data-drag-overlay]')`)

6. **Virtualized scroll FPS** (§13.12 — 60fps for 1000 nodes):
   - Manual verification: Chrome DevTools Performance tab on a 1000-node virtualized tree scroll; assert no frames > 16.67ms
   - Document in R45 spec as a manual test step (not automated)

7. **Enforcement approach**:
   - Budgets are documented as test assertions where possible
   - CI fails if any budget is exceeded (R44/R45 tests)
   - Build verification (T29/R46) checks bundle size

### Verification
- All per-node render time assertions pass (< 16ms/node)
- Expand/collapse of 500-child node < 100ms
- `categoryList` API round-trip < 200ms in E2E
- Category page chunk < 40KB gzipped
- No console warnings about performance violations

## Round 4 Enhancement Tasks

### R4-T1: Drag-Drop Edge Cases Handling
- [ ] Update `frontend/views/dashboard/certificates/category-mgmt/components/CategoryTree.tsx`
  - Prevent circular references: check if drag target is a descendant of drag source
  - Drop on root: allow any node to be moved to root level
  - Multi-level drag: show ghost preview with indent level
  - Drag preview: semi-transparent ghost following cursor (opacity 0.5)
  - Invalid drop zone: red border + "not-allowed" cursor
  - Touch support: MUI v9 `DragHandle` with touch event handlers
  - Drag cancel: Esc key cancels current drag operation
  - _Store: `categoryStore` adds `dragState: { source: string | null, isDragging: boolean, isValidDrop: boolean }`_
  - **Quality loop**: tsgo + biome + lint queue client

### R4-T2: Multi-Select Category Operations
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/components/MultiSelectOps.tsx`
  - Checkbox in TreeItem for multi-select (selectable prop)
  - Bulk move to parent: dialog with parent selector
  - Bulk delete: cascade warning showing child count + template count
  - Bulk assign templates: multi-select templates to assign to category
  - Shift+Click range select: select all items between two clicks
  - _Store: `categoryStore` adds `selectedIds: string[], selectRange(startId, endId), bulkMove(parentId), bulkDelete()`_
  - **Quality loop**: tsgo + biome + lint

### R4-T3: Loading & Skeleton States
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/components/TreeSkeleton.tsx`
  - Skeleton tree branches with correct indent levels (8 nested levels)
  - Detail panel skeleton with field placeholders
  - Editor dialog skeleton with form field placeholders
  - Progressive loading: lazy load children on expand with inline spinner
  - _State: `categoryStore` adds `isLoadingChildren: Set<string>` for per-node loading_
  - **Quality loop**: tsgo + biome + lint

### R4-T4: Empty States
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/components/EmptyStates.tsx`
  - No categories: illustration + "Create Your First Category" button
  - No subcategories: folder icon + "Add Subcategory" button (grayed out parent)
  - No templates in category: document icon + "Assign Templates" button
  - Filtered empty: "No categories match your filter" + reset button
  - **Quality loop**: tsgo + biome + lint

### R4-T5: Error Boundaries & Recovery
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/ErrorBoundary.tsx`
  - Tree load error: "Failed to load categories" + retry button
  - Node save error: inline error message in editor dialog
  - Optimistic update rollback: revert UI on mutation failure
  - Network reconnect: auto-sync with `window.addEventListener('online')`
  - **Quality loop**: tsgo + biome + lint

### R4-T6: Tree Virtualization
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/components/VirtualizedTree.tsx`
  - `react-window` FixedSizeList for > 500 nodes with tree indent preservation
  - Expand/collapse with smooth animation (CSS transition on height)
  - Lazy load children on expand: fetch children via Apollo `useQuery` with skip
  - Virtual scroll preserves tree depth (indent via padding)
  - Test with 1000+ categories for performance
  - **Quality loop**: tsgo + biome + lint

### R4-T7: Advanced Search & Filter
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/components/CategoryFilters.tsx`
  - Category name search: MUI v9 TextField with debounce (300ms)
  - Filter by template count: min/max number inputs
  - Filter by date modified: MUI v9 DatePicker range
  - Filter by color tag: color swatch selector (8 colors)
  - Search result highlighting: bold matched text via `<mark>` element
  - Clear search button (X icon in search field)
  - _Store: `categoryStore` adds `searchQuery, filters, clearFilters()`_
  - **Quality loop**: tsgo + biome + lint

### R4-T8: Accessibility Implementation
- [ ] Update `frontend/views/dashboard/certificates/category-mgmt/components/CategoryTree.tsx`
  - Tree `role="tree"`, nodes `role="treeitem"` with `aria-expanded`, `aria-level`, `aria-selected`
  - Keyboard: Tab to enter tree, Arrow keys to navigate, Enter to toggle expand, Space to select
  - JAWS/NVDA compatibility: test with `aria-label` per node including depth info
  - Focus management: keep focus on parent when collapsed, move to first child when expanded
  - Screen reader announcement: "Expanded" / "Collapsed" on toggle
  - **Quality loop**: tsgo + biome + lint

### R4-T9: Responsive Layout
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/MobileCategoryView.tsx`
  - Mobile (< 768px): tree as accordion (MUI v9 Accordion), detail as bottom sheet
  - Tablet (768-1024px): side-by-side tree + detail
  - Desktop (> 1024px): 3-panel: tree | detail | (editor on demand)
  - Resizable panel widths with drag divider (desktop only)
  - **Quality loop**: tsgo + biome + lint

### R4-T10: Color Tag System
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/components/ColorTagPicker.tsx`
  - 8 preset colors: blue, green, orange, purple, red, teal, pink, gray
  - MUI v9 `ColorButton` with color preview circle (24px diameter)
  - Custom color: MUI v9 `color` input with hex value display
  - Color legend in sidebar: list of used colors with count
  - Filter by color: click legend item to filter tree
  - Color-blind safe: patterns or shapes in addition to colors
  - High contrast mode: `sx={{ borderColor: 'text.primary' }}`
  - **Quality loop**: tsgo + biome + lint

### R4-T11: Audit & History
- [ ] Create `frontend/views/dashboard/certificates/category-mgmt/AuditLog.tsx`
  - Category creation/edit/delete audit entries
  - Display: who, what, when (MUI v9 Timeline component)
  - Undo within 30s: toast with undo button
  - Category merge history: show merged categories with date
  - _Store: `categoryStore` adds `auditLog: AuditEntry[], undoAction(auditId)`_
  - **Quality loop**: tsgo + biome + lint

### R4-T12: Performance & Virtualization Tests
- [ ] Create `test/ui/components/category-mgmt/Performance.test.tsx`
  - Test tree with 1000 nodes renders in < 16ms per node
  - Test expand/collapse in < 100ms
  - Test API response mock in < 200ms
  - **Quality loop**: tsgo + biome + lint

### R4-T13: Component Tests
- [ ] Create `test/ui/components/category-mgmt/DragDrop.test.tsx`
  - Test circular reference prevention
  - Test drop on root
  - Test invalid drop zone visual feedback
  - Test touch drag support
- [ ] Create `test/ui/components/category-mgmt/MultiSelect.test.tsx`
  - Test shift+click range select
  - Test bulk move/delete
  - Test select-all with indeterminate
- [ ] Create `test/ui/components/category-mgmt/EmptyStates.test.tsx`
  - Test each empty state renders correctly
  - Test CTA button actions

### R4-T14: Knowledge Propagation
- [ ] Create `docs/frontend/category-tree-patterns.md`
  - Update `frontend/AGENTS.md` with reference
  - Run quality checks
