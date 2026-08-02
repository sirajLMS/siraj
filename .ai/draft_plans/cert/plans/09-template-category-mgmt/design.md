# Design — Plan 09: Template Category Management

> **Plan**: 09 — Template Category Management
> **Depends On**: Plan 5 (GraphQL API)
> **Related**: MASTER_ARCHITECTURE.md; cgvs_analysis/01-generation-logic.md §3; cgvs_analysis/04-template-ui.md §3, §9

---

## 1. Architecture Overview

### Layer Position

Plan 09 is a **frontend-only plan** that consumes the GraphQL API from Plan 5. It does not create backend schema, repo, or service files. It creates:

- **App Router page** (server component) — permission guard, metadata
- **Container + ViewModel** — Apollo hooks, Zustand store, state management
- **Desktop presentation** — tree component with dnd-kit drag-and-drop, context menu, inline edit
- **Mobile presentation** — flat expandable list, context menu CRUD, no drag
- **GraphQL documents** — category queries and mutations
- **Zustand store** — tree expansion, selected node, search term, dialog state
- **i18n** — translation namespace, type schema, AR/EN implementations

### Data Flow

```
App Router page (server)
  → getServerUserContext + requirePermissionForPage
  → render <CertificateCategoryContainer />

Container (client)
  → useCertificateCategoryViewModel()
    → useQuery(categoryRootQueryDocument)  — root categories
    → useQuery(categoryTemplatesQueryDocument) — templates for selected category
    → useMutation(create/move/delete/reorder mutations)
    → certificateCategoryStore (Zustand)
    → useAppTranslation(Translation.Dashboard.CertificateCategories)
  → <RequirePermission>
  → <ResponsiveViewSwitch desktop / mobile>

Desktop Tier (presentation)
  → CategoryTree (recursive, dnd-kit drag, expand/collapse, inline edit)
  → TemplatePane (AppDataGrid of templates in selected category)
  → CreateDialog / EditDialog / DeleteConfirmDialog / MoveTemplateDialog

Mobile Tier (presentation)
  → CategoryList (flat expandable list, tap to expand)
  → TemplateList (MobileCardList of templates)
  → EditDialog / DeleteConfirmDialog / MoveTemplateDialog (same dialogs, reused)
```

### Data Model References

| Table | Fields Used | Usage |
|-------|------------|-------|
| `certificate_categories` | `id`, `name`, `description`, `parentCategoryId`, `order`, `specialType`, `createdAt`, `updatedAt`, `deletedAt` | Tree nodes, CRUD targets |
| `certificate_templates` | `id`, `name`, `categoryId`, `status`, `order`, `thumbnailUrl` | Template pane display, assignment |

> **Note**: The `specialType` field (`Main` / `Suspension`) is managed by the service layer (Plan 4). This plan renders it as a label but does not create/modify special-type categories.

---

## 2. Design Decisions

### DD-01: Tree Lazy-Loading Strategy

**Decision**: Use Apollo `useQuery` per-node with `skip` control instead of a single all-depth query.

**Rationale**: Categories can be deeply nested with many nodes. Loading the entire tree upfront is expensive. The CGVS project uses this pattern (ReactiveCategoryTree) and it works well with Apollo cache. Expansion state + fetched-node tracking in Zustand prevent redundant queries.

**Alternative Considered**: Single recursive query fetching all categories at once. Rejected for performance with large trees — the entire hierarchy may be hundreds of nodes but the user typically only explores a few branches.

**Implementation**: Root categories (`parentCategoryId = null`) load on page mount. When a user expands a node, a `categoryChildren(parentId)` query fires. Apollo cache dedupes re-issues for already-fetched parents (no `fetchedCategoryIds` needed in the store — removed per F-09-3). Hover-preload on desktop fires the children query on `onMouseEnter` for smoother UX.

### DD-02: Drag-and-Drop Library Choice

**Decision**: Use `@dnd-kit/core` + `@dnd-kit/sortable` for desktop drag-and-drop tree.

**Rationale**: dnd-kit is the modern React drag-and-drop solution, supports tree structures, is accessible (keyboard), and is lighter than react-beautiful-dnd (which is unmaintained). It supports custom drop indicators and collision detection.

**Alternative Considered**: Custom mouse-event-based drag tree. Rejected — too complex for accessibility, touch fallback, and multi-level drop (before/after/into).

**Implementation**: The tree wraps each node in a `SortableContext` within its parent. Custom collision detection algorithm distinguishes "before sibling", "after sibling", and "into parent" based on mouse Y position relative to the target node's bounding box.

### DD-03: Desktop vs Mobile Architecture

**Decision**: Desktop uses a full recursive tree with drag-and-drop. Mobile uses a simplified flat expandable list with context menu actions and "Move Up/Down" for reordering.

**Rationale**: Drag-and-drop on mobile is unreliable (no hover, viewport size constraints). Mobile users benefit from a simpler mental model. Following Siraj's tier-isolation rules, no `useMediaQuery` in tier views — the `ResponsiveViewSwitch` delegates.

### DD-04: Expansion State in Zustand

**Decision**: Store `expandedCategoryIds` (Set<string>) in Zustand, not in component state. No `fetchedCategoryIds` — derived from Apollo cache (per F-09-3).

**Rationale**: Expansion state must survive tier switching (resize from desktop to mobile). If stored in `useState` inside a tier component, switching unmounts the component and loses state. Zustand stores survive unmount/remount. `fetchedCategoryIds` was removed per F-09-3 — Apollo cache dedupes queries for already-fetched parents, making a separate tracking Set redundant.

**Alternative Considered**: sessionStorage-persist Zustand. Considered but the CGVS project uses sessionStorage for view-level state; we follow that pattern for expansion state only (not for fetched-node tracking, which can re-derive from cache).

### DD-05: Apollo Cache Strategy for Category Mutations

**Decision**: After create/update/delete/reorder mutations, update Apollo cache with targeted `cache.updateQuery` / `cache.evict` calls — not a full refetch.

**Rationale**: The CGVS project uses cache-aware mutations (§572, §582 of analysis). A full refetch after each CRUD operation is wasteful and loses expansion state.

**Pattern**:
- **Create child**: `cache.updateQuery(categoryChildrenQuery, ...)` to append the new node
- **Update (rename)**: write to cache by `id` (Apollo auto-normalization includes `id`)
- **Delete**: `cache.evict({ id: category.id })` + `cache.gc()`
- **Reorder**: `cache.updateQuery(categoryChildrenQuery, ...)` to re-sort children (optimistic — pre-mutation reorder, rollback on error)
- **Move template**: optimistic update — write template's new `categoryId` into cache immediately via `cache.writeFragment`; on error, rollback by restoring old `categoryId` + snackbar; on success, `cache.evict` template from old category's template list query and refetch new category's template list (per F-09-6)

### DD-06: Shared Dialogs Across Tiers

**Decision**: Create/Edit/Delete/MoveTemplate dialogs are shared components (no `.mobile.tsx` / `.desktop.tsx` suffix). Only the tree/list presentation differs between tiers.

**Rationale**: Dialogs are modal overlays — the same MUI `Dialog` renders identically on both tiers. Duplicating them creates maintenance overhead. This follows the pattern where shared components live in `frontend/common/views/dashboard/.../components/` without tier suffix.

### DD-07: Self-Referential Cycle Prevention

**Decision**: Frontend prevents dropping onto descendants via a "descendant IDs Set" check. Backend (service layer from Plan 4) validates as a safety net.

**Rationale**: Frontend prevention gives instant visual feedback (red indicator). Backend prevention is authoritative. The frontend computes descendants by walking the in-memory tree; if unsure (children not loaded), it allows the drop and relies on backend validation (optimistic — rare edge case in deeply nested trees with unloaded branches).

---

## 3. Interface Contracts

### 3.1 GraphQL Documents

All documents live in `frontend/common/graphql/sharedDocuments/certificates/` (per INTER_PLAN_CONTRACTS §17 — barrel must be `certificates/` not `cert/`). File name: `certificateCategory.documents.ts`. Barrel: `frontend/common/graphql/sharedDocuments/certificates/index.ts`.

> **Naming convention** from `sharedDocuments/AGENTS.md`: entity-name file (not domain-prefixed), `TypedDocumentNode<Operations.X, Types.QueryXArgs>` typing, hooks from `@apollo/client/react`, NO `useLazyQuery`, `id` on every object selection.

#### Category Fragment

| Document | Const Name | Returns |
|----------|-----------|---------|
| Category fragment | `categoryFragment` | `id`, `name`, `description`, `parentId`, `order`, `specialType`, `createdAt`, `updatedAt` |

#### Queries

| Document | Const Name | Variables | Result Shape |
|----------|-----------|-----------|-------------|
| Category roots | `categoryRootsQueryDocument` | none | `{ id, name, description, parentId, order, specialType, childCount }[]` |
| Category children | `categoryChildrenQueryDocument` | `{ parentId: ID! }` | `{ id, name, ..., childCount }[]` |
| Category by ID | `categoryQueryDocument` | `{ id: ID! }` | `{ id, name, description, parentId, order, specialType, path: string[] }` |
| Category templates | `categoryTemplatesQueryDocument` | `{ categoryId: ID, paginationArgs, filterArgs, orderBy }` | `{ id, totalCount, rows: { id, name, status, thumbnailUrl }[], pageInfo }` |
| Category search | `categorySearchQueryDocument` | `{ searchTerm: String! }` | `{ id, name, parentId }[]` (flat filtered list) |

#### Mutations

| Document | Const Name | Variables | Result |
|----------|-----------|-----------|--------|
| Create category | `createCategoryMutationDocument` | `{ input: CreateCategoryInput! }` | `{ id, name, description, parentId, order }` |
| Update category | `updateCategoryMutationDocument` | `{ input: UpdateCategoryInput! }` | `{ id, name, description, order }` |
| Delete category | `deleteCategoryMutationDocument` | `{ id: ID! }` | `{ success: Boolean! }` |
| Reorder category | `reorderCategoryMutationDocument` | `{ input: ReorderCategoryInput! }` | `{ id, parentId, order }` (positional: `{ beforeId?, afterId?, newParentId? }` per §12) |
| Move template | `moveTemplateToCategoryMutationDocument` | `{ templateId: ID!, categoryId: ID }` | `{ id, categoryId }` |

#### Input Types (from Plan 5 GraphQL schema)

| Type | Fields |
|------|--------|
| `CreateCategoryInput` | `name: String!`, `description: String`, `parentId: ID` |
| `UpdateCategoryInput` | `id: ID!`, `name: String`, `description: String` |
| `ReorderCategoryInput` | `id: ID!`, `beforeId: ID`, `afterId: ID`, `newParentId: ID` (positional — per INTER_PLAN_CONTRACTS §12; exactly one of `beforeId`/`afterId` is non-null; backend recalculates `order` with gap allocation) |

### 3.2 Zustand Store

**File**: `frontend/common/stores/certificateCategoryStore.ts`

**State Interface**:

| Field | Type | Purpose |
|-------|------|---------|
| `selectedCategoryId` | `string \| null` | Currently selected category in tree |
| `expandedCategoryIds` | `Set<string>` | Expanded tree nodes |
| `searchTerm` | `string` | Category search/filter input |
| `createDialogOpen` | `boolean` | Create category dialog visibility |
| `editingCategoryId` | `string \| null` | Category being edited (inline or dialog) |
| `deleteTargetId` | `string \| null` | Category pending deletion confirmation |
| `moveTemplateData` | `{ templateId: string; templateName: string } \| null` | Template being moved to another category |
| `parentForCreate` | `string \| null` | Parent category ID for create-child flow (null = root) |

> **F-09-3 fix**: `fetchedCategoryIds` has been REMOVED from the store. Whether a node's children have been fetched is derived from Apollo cache (Apollo dedupes via cache — re-issuing a `categoryChildren` query for an already-fetched parent returns cached data without a network round-trip). This simplifies the store and removes a `Set<string>` serialization concern.

**Actions**:

| Action | Signature | Effect |
|--------|-----------|--------|
| `setSelectedCategory` | `(id: string \| null) => void` | Sets selected, resets template list page |
| `toggleExpand` | `(id: string) => void` | Toggle membership in `expandedCategoryIds` |
| `setExpanded` | `(ids: Set<string>) => void` | Replace expansion set (search result expansion) |
| `setSearchTerm` | `(term: string) => void` | Set search, resets page |
| `openCreateDialog` | `(parentId: string \| null) => void` | Open create dialog with optional parent |
| `closeCreateDialog` | `() => void` | Close create dialog |
| `setEditingCategory` | `(id: string \| null) => void` | Open/close edit mode |
| `setDeleteTarget` | `(id: string \| null) => void` | Open/close delete confirmation |
| `openMoveTemplateDialog` | `(data: { templateId: string; templateName: string }) => void` | Open move template dialog |
| `closeMoveTemplateDialog` | `() => void` | Close move template dialog |

> **Persist decision**: NO `persist` middleware. This is a page-scoped store. `expandedCategoryIds` (Set) survives tier switching naturally in-memory (Zustand state persists across SPA remounts). On hard page refresh, expansion state resets — acceptable UX. The `Set<string>` serialization concern is moot without `persist`.

### 3.3 ViewModel Hook

**File**: `frontend/common/views/dashboard/certificates/categories/useCertificateCategoryViewModel.ts`

**Returns** (`CertificateCategoryViewModel`):

| Field | Type | Source |
|-------|------|--------|
| `labels` | `CategoryLabels` (from i18n) | `useAppTranslation(Translation.Dashboard.CertificateCategories)` |
| `rootCategories` | `CategoryNode[] \| undefined` | `useQuery(categoryRootsQueryDocument)` |
| `childrenByParentId` | `(parentId: string) => CategoryNode[] \| undefined` | Closure over `useQuery(categoryChildrenQueryDocument, { skip: !shouldFetch })` — managed per-node |
| `selectedCategoryId` | `string \| null` | Store |
| `expandedCategoryIds` | `Set<string>` | Store |
| `searchTerm` | `string` | Store |
| `searchResults` | `CategorySearchResult[] \| undefined` | `useQuery(categorySearchQueryDocument, { skip: !searchTerm })` |
| `templates` | `TemplateRow[] \| undefined` | `useQuery(categoryTemplatesQueryDocument, { variables: { categoryId: selectedCategoryId } })` |
| `templatesLoading` | `boolean` | Query loading state |
| `onToggleExpand` | `(id: string) => void` | `toggleExpand` from store |
| `onSelectCategory` | `(id: string \| null) => void` | `setSelectedCategory` from store |
| `onSearch` | `(term: string) => void` | `setSearchTerm` from store |
| `onCreateCategory` | `(input: CreateCategoryInput) => Promise<void>` | Mutation wrapper |
| `onUpdateCategory` | `(input: UpdateCategoryInput) => Promise<void>` | Mutation wrapper |
| `onDeleteCategory` | `(id: string) => Promise<void>` | Mutation wrapper |
| `onReorderCategory` | `(input: ReorderCategoryInput) => Promise<void>` | Mutation wrapper |
| `onMoveTemplate` | `(templateId: string, categoryId: string \| null) => Promise<void>` | Mutation wrapper |
| `canManage` | `boolean` | `useHasPermission([AppPermission.CertificateTemplateManage])` — gates CRUD actions |
| `canView` | `boolean` | `useHasPermission([AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage])` — gates page visibility |
| `createDialogOpen` | `boolean` | Store |
| `parentForCreate` | `string \| null` | Store |
| `editingCategoryId` | `string \| null` | Store |
| `deleteTargetId` | `string \| null` | Store |
| `moveTemplateData` | `... \| null` | Store |
| `openCreateDialog` | `(parentId: string \| null) => void` | Store |
| `closeCreateDialog` | `() => void` | Store |
| `setEditingCategory` | `(id: string \| null) => void` | Store |
| `setDeleteTarget` | `(id: string \| null) => void` | Store |
| `openMoveTemplateDialog` | `(...) => void` | Store |
| `closeMoveTemplateDialog` | `() => void` | Store |

### 3.4 Types

**File**: `frontend/common/views/dashboard/certificates/categories/types/`

| Type | Purpose |
|------|---------|
| `CategoryNode` | View-model representation of a category in the tree (id, name, description, parentId, order, specialType, childCount) |
| `CategorySearchResult` | Flat search result (id, name, parentId) |
| `TemplateRow` | Template display row (id, name, status, thumbnailUrl) |
| `CertificateCategoryViewModel` | The full view model interface (above) |
| `CreateCategoryInput` | Form input for create (name, description, parentId) |
| `UpdateCategoryInput` | Form input for update (id, name, description) |
| `ReorderCategoryInput` | Drag-drop result (id, beforeId?, afterId?, newParentId?) — positional per §12 |

---

## 4. Component Hierarchy

### 4.1 Shared Components (Container + ViewModel)

```
frontend/common/views/dashboard/certificates/categories/
├── CertificateCategoryContainer.tsx          # Container: createLazyView + RequirePermission + ResponsiveViewSwitch
├── CertificateCategoryView.tsx               # Switcher: createLazyView<ViewModelType> + desktop/mobile lazy imports
├── useCertificateCategoryViewModel.ts        # ViewModel hook
├── types/
│   └── index.ts                              # Type exports (CategoryNode, ViewModel, Inputs)
├── components/
│   ├── CreateCategoryDialog.tsx              # Shared create dialog (MUI Dialog)
│   ├── EditCategoryDialog.tsx                # Shared edit dialog (name + description + color + icon)
│   ├── DeleteCategoryConfirmDialog.tsx       # Shared delete confirmation with dependency warnings
│   ├── MoveTemplateToCategoryDialog.tsx      # Shared move-template picker
│   ├── CategoryPicker.tsx                    # Autocomplete tree picker (used in Move + Edit parent)
│   ├── ColorSwatchPicker.tsx                 # Color palette swatch grid (presets from constants)
│   ├── IconPicker.tsx                        # MUI icon grid picker (Material icon subset)
│   └── CategoryAvatar.tsx                    # Avatar with color + icon (used in tree, dialogs)
```

### 4.2 Desktop Tier

```
frontend/desktop/views/dashboard/certificates/categories/
├── certificateCategoryView.desktop.tsx        # Desktop main view: PageContainer + two SectionPanels
├── components/
│   ├── CategoryTree.desktop.tsx               # Recursive tree root: DndContext + SortableContext
│   ├── CategoryTreeNode.desktop.tsx          # Recursive node: useSortable, expand/collapse, inline edit
│   ├── CategoryTreeDropIndicator.desktop.tsx  # Visual drop line (before/after sibling, into parent)
│   ├── InlineEditableLabel.desktop.tsx       # Double-click-to-edit label (EditableTypography pattern)
│   ├── CategoryActionMenu.desktop.tsx        # Context menu (create child, rename, delete, move up/down)
│   ├── CategorySearchBar.desktop.tsx         # Autocomplete search in tree pane header
│   ├── TemplatePane.desktop.tsx              # Template list: AppDataGrid with server-side pagination
│   └── TemplatePaneColumns.desktop.tsx       # Column definitions for AppDataGrid (name, status, createdAt, actions)
```

### 4.3 Mobile Tier

```
frontend/mobile/views/dashboard/certificates/categories/
├── certificateCategoryView.mobile.tsx         # Mobile main view: MobilePageContainer + stacked list
├── components/
│   ├── CategoryList.mobile.tsx               # Flat expandable list (Accordion-based, tap to expand)
│   ├── CategoryMobileNodeCard.mobile.tsx     # Single category row: expand toggle, action menu trigger
│   ├── CategoryMobileActionMenu.mobile.tsx   # Bottom-sheet action menu (edit, delete, add child, move up/down)
│   ├── TemplateCardList.mobile.tsx           # MobileCardList of templates in selected category
│   ├── TemplateCardListItem.mobile.tsx       # Single template card (name, status badge, move action)
│   └── CategorySearchBar.mobile.tsx          # Search input (in MobileContentInset, above list)
```

### 4.4 App Router

```
app/(dashboard)/certificates/categories/
├── page.tsx                                  # Server component: metadata, auth, permission guard, render Container
└── layout.tsx                                # (optional) Certificates section layout — if needed for breadcrumb context
```

### 4.5 Complete File Scaffold (all files created by this plan)

| # | File Path | Type | Purpose |
|---|-----------|------|---------|
| 1 | `shared/locale/types/dashboard/certificates/categories.ts` | i18n type | Type schema for `CertificateCategoryLabels` |
| 2 | `shared/locale/namespaces/dashboard/certificates/categories.namespace.ts` | i18n namespace | Namespace registration with `defineNamespace` |
| 3 | `shared/locale/ar/dashboard/certificates/categories.ts` | i18n AR | Arabic translations |
| 4 | `shared/locale/en/dashboard/certificates/categories.ts` | i18n EN | English translations |
| 5 | `shared/constants/certificate-category-colors.ts` | constants | Color palette (10-15 named color tokens) |
| 6 | `shared/constants/certificate-category-icons.ts` | constants | Icon name list (15-20 Material icon names) |
| 7 | `frontend/common/graphql/sharedDocuments/certificates/certificateCategory.documents.ts` | GraphQL | Fragment + queries + mutations (TypedDocumentNode) |
| 8 | `frontend/common/graphql/sharedDocuments/certificates/index.ts` | GraphQL barrel | Barrel re-export (update existing, add category re-export) |
| 9 | `frontend/common/stores/certificateCategoryStore.ts` | Zustand | UI state (selection, expansion, search, dialog flags) |
| 10 | `frontend/common/views/dashboard/certificates/categories/types/index.ts` | Types | `CategoryNode`, `CertificateCategoryViewModel`, input types |
| 11 | `frontend/common/views/dashboard/certificates/categories/useCertificateCategoryViewModel.ts` | ViewModel | Composite hook: Apollo + store + permissions + handlers |
| 12 | `frontend/common/views/dashboard/certificates/categories/CertificateCategoryContainer.tsx` | Container | `createLazyView` + `RequirePermission` + `ResponsiveViewSwitch` |
| 13 | `frontend/common/views/dashboard/certificates/categories/CertificateCategoryView.tsx` | Switcher | `createLazyView<ViewModelType>` + lazy import paths |
| 14 | `frontend/common/views/dashboard/certificates/categories/components/CreateCategoryDialog.tsx` | Shared dialog | Create form (name, description, parent, color, icon) |
| 15 | `frontend/common/views/dashboard/certificates/categories/components/EditCategoryDialog.tsx` | Shared dialog | Edit form (name, description, parent, color, icon) |
| 16 | `frontend/common/views/dashboard/certificates/categories/components/DeleteCategoryConfirmDialog.tsx` | Shared dialog | Delete confirmation with dependency warnings |
| 17 | `frontend/common/views/dashboard/certificates/categories/components/MoveTemplateToCategoryDialog.tsx` | Shared dialog | Category picker for template reassignment |
| 18 | `frontend/common/views/dashboard/certificates/categories/components/CategoryPicker.tsx` | Shared component | Autocomplete tree picker (filters self + descendants) |
| 19 | `frontend/common/views/dashboard/certificates/categories/components/ColorSwatchPicker.tsx` | Shared component | Color palette swatch grid |
| 20 | `frontend/common/views/dashboard/certificates/categories/components/IconPicker.tsx` | Shared component | MUI icon grid picker |
| 21 | `frontend/common/views/dashboard/certificates/categories/components/CategoryAvatar.tsx` | Shared component | Avatar with color + icon |
| 22 | `frontend/desktop/views/dashboard/certificates/categories/certificateCategoryView.desktop.tsx` | Desktop view | `PageContainer` + `DesktopPageHeader` + two `SectionPanel`s |
| 23 | `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTree.desktop.tsx` | Desktop component | `DndContext` + recursive `SortableContext` |
| 24 | `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTreeNode.desktop.tsx` | Desktop component | Recursive node with `useSortable` + inline edit |
| 25 | `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTreeDropIndicator.desktop.tsx` | Desktop component | Drop line/highlight visual feedback |
| 26 | `frontend/desktop/views/dashboard/certificates/categories/components/InlineEditableLabel.desktop.tsx` | Desktop component | Double-click-to-edit `Typography` |
| 27 | `frontend/desktop/views/dashboard/certificates/categories/components/CategoryActionMenu.desktop.tsx` | Desktop component | Context menu (`Menu`) with CRUD + move actions |
| 28 | `frontend/desktop/views/dashboard/certificates/categories/components/CategorySearchBar.desktop.tsx` | Desktop component | `TextField` with debounce + clear button |
| 29 | `frontend/desktop/views/dashboard/certificates/categories/components/TemplatePane.desktop.tsx` | Desktop component | `SectionPanel` with `AppDataGrid` |
| 30 | `frontend/desktop/views/dashboard/certificates/categories/components/TemplatePaneColumns.desktop.tsx` | Desktop component | Column defs for AppDataGrid |
| 31 | `frontend/mobile/views/dashboard/certificates/categories/certificateCategoryView.mobile.tsx` | Mobile view | `MobilePageContainer` + `MobilePageHeader` + `MobileContentStack` |
| 32 | `frontend/mobile/views/dashboard/certificates/categories/components/CategoryList.mobile.tsx` | Mobile component | Flat expandable `Accordion`-based list |
| 33 | `frontend/mobile/views/dashboard/certificates/categories/components/CategoryMobileNodeCard.mobile.tsx` | Mobile component | Category row card with expand + action trigger |
| 34 | `frontend/mobile/views/dashboard/certificates/categories/components/CategoryMobileActionMenu.mobile.tsx` | Mobile component | `SwipeableDrawer` bottom-sheet with actions |
| 35 | `frontend/mobile/views/dashboard/certificates/categories/components/TemplateCardList.mobile.tsx` | Mobile component | `MobileCardList` for templates |
| 36 | `frontend/mobile/views/dashboard/certificates/categories/components/TemplateCardListItem.mobile.tsx` | Mobile component | Template card with name, status, move action |
| 37 | `frontend/mobile/views/dashboard/certificates/categories/components/CategorySearchBar.mobile.tsx` | Mobile component | `TextField` in `MobileContentInset` |
| 38 | `app/(dashboard)/certificates/categories/page.tsx` | App Router | Server component: metadata + auth + permission guard |

---

## 5. Desktop Drag-and-Drop Design

### 5.1 Drag Interaction Model

```
DndContext (root level — wraps entire tree)
  └─ SortableContext (vertical) per parent level
       └─ CategoryTreeNode (useSortable)
            ├── Drag handle (icon)
            ├── Expand/collapse chevron
            ├── InlineEditableLabel (name) or display label
            ├── Action menu button
            └─ SortContext (for children — nested SortableContext)
                 └─ CategoryTreeNode (recursive)
```

### 5.2 Drop Detection

| Mouse Position | Drop Action | Visual Feedback |
|---------------|-------------|-----------------|
| Top 25% of target node sibling | Insert before | Blue line above node |
| Bottom 25% of target node sibling | Insert after | Blue line below node |
| Middle 50% of target node | Move into (make child) | Blue highlight on node background |
| On own descendant | Reject | Red indicator (cycle prevention) |

### 5.3 Reorder Mutation

On drop, the ViewModel calls `onReorderCategory` with positional input (per INTER_PLAN_CONTRACTS §12):
1. Determine drop type from collision detection: "before sibling" → `{ beforeId: targetId }`, "after sibling" → `{ afterId: targetId }`, "into parent" → `{ newParentId: targetId, afterId: lastChildId | null }`
2. Call `reorderCategoryMutationDocument` with `{ id, beforeId?, afterId?, newParentId? }` — backend computes the actual `order` value using gap allocation
3. On success: Apollo `cache.updateQuery` for the old and new parent's children queries to re-sort
4. On failure: revert visual position, show `errors.reorderFailed` snackbar
5. Optimistic update: immediately reorder the in-memory children array via `cache.updateQuery` before the mutation resolves; rollback on error

### 5.4 Accessibility

- dnd-kit keyboard support: Space to pick up, Arrow keys to move, Enter to drop, Escape to cancel
- `aria-roledescription="draggable item"` on nodes
- Screen reader announcements via dnd-kit's `useSortable` announcements

### 5.5 Detailed Drag-and-Drop Accessibility (ARIA)

| Element | ARIA Attributes | Purpose |
|---------|-----------------|---------|
| **CategoryTreeNode (draggable)** | `role="treeitem"`, `aria-level={level+1}`, `aria-setsize={siblingCount}`, `aria-posinset={index+1}`, `aria-expanded={isExpanded}`, `aria-selected={isSelected}`, `aria-roledescription="draggable item"`, `aria-grabbed="true"` (during drag) | Conveys tree structure, position, selection, and draggable state |
| **CategoryTreeNode (drop target)** | `aria-dropeffect="move"` (when valid drop target), `aria-invalid="true"` (when invalid / cycle) | Indicates valid/invalid drop zones to screen readers |
| **DndContext** | No direct ARIA — dnd-kit manages live region announcements | Announces "Item picked up", "Moved before X", "Moved after Y", "Dropped into Z", "Cancelled" |
| **CategoryTreeDropIndicator** | `role="presentation"` (visual only) | Hidden from screen readers — announcements handled by dnd-kit |
| **Drag Handle** | `tabIndex={0}`, `role="button"`, `aria-label={labels.action.drag}`, `aria-describedby={dragInstructionsId}` | Keyboard-accessible drag handle; separate from node for tab order |
| **Drag Instructions** | `id="drag-instructions"`, `aria-live="polite"`, visually hidden | Provides keyboard instructions: "Press Space to pick up, Arrow keys to move, Enter to drop, Escape to cancel" |

### 5.6 Focus Management During Drag

| Phase | Focus Behavior |
|-------|----------------|
| **Before drag** | Focus on drag handle (via `Tab`) or node (via `ArrowUp/Down` in tree) |
| **Drag start (Space/Enter)** | Focus remains on drag handle; `aria-grabbed="true"` set |
| **During drag (Arrow keys)** | Focus stays on drag handle; visual cursor moves; live region announces position |
| **Drop (Enter)** | Focus returns to dropped node; `aria-grabbed="false"`; tree updates; selection may change |
| **Cancel (Escape)** | Focus returns to original node; `aria-grabbed="false"`; tree reverts |

---

## 6. Recursive Tree Node Component

### Desktop: `CategoryTreeNode.desktop.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `node` | `CategoryNode` | The category data (id, name, description, parentId, order, specialType, childCount, color, icon) |
| `level` | `number` | Nesting depth (0 = root) |
| `hasChildren` | `boolean` | Whether node has/can have children (from `childCount > 0`) |
| `isExpanded` | `boolean` | Whether currently expanded |
| `isSelected` | `boolean` | Whether currently selected |
| `onToggleExpand` | `(id: string) => void` | Expand/collapse handler |
| `onSelect` | `(id: string) => void` | Selection handler |
| `canManage` | `boolean` | Permission gate for actions (CRUD buttons + drag handle) |
| `childrenForParent` | `(parentId: string) => CategoryNode[] \| undefined` | Children resolver (Apollo cache-backed) |
| `onReorder` | `(input: ReorderCategoryInput) => Promise<void>` | Reorder handler (positional API) |
| `onStartInlineEdit` | `(id: string) => void` | Begin inline rename |
| `onCommitInlineEdit` | `(id: string, newName: string) => Promise<void>` | Save inline rename |
| `onCancelInlineEdit` | `() => void` | Cancel inline rename |
| `isEditingInline` | `boolean` | Whether THIS node is in inline-edit mode |
| `labels` | `CertificateCategoryLabels` | i18n strings |
| `descendantIds` | `Set<string>` | Pre-computed descendant IDs (for cycle prevention — loaded-only) |

### `CreateCategoryDialog.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog visibility |
| `parentId` | `string \| null` | Pre-set parent (null = root) |
| `onClose` | `() => void` | Close handler |
| `onSubmit` | `(input: CreateCategoryInput) => Promise<void>` | Create mutation wrapper |
| `loading` | `boolean` | Submit in progress — shows `CircularProgress` on button |
| `labels` | `CertificateCategoryLabels` | i18n strings |
| `canManage` | `boolean` | Permission gate |

**Form fields**: `TextField` for name (required, max 255), `TextField` multiline for description (optional), `CategoryPicker` for parent (disabled if `parentId` is preset from action menu), `ColorSwatchPicker` (optional, default grey), `IconPicker` (optional, default `FolderOutlined`), `CategoryAvatar` preview in dialog header.

### `EditCategoryDialog.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog visibility |
| `category` | `CategoryNode \| null` | Category being edited |
| `onClose` | `() => void` | Close handler |
| `onSubmit` | `(input: UpdateCategoryInput) => Promise<void>` | Update mutation wrapper |
| `loading` | `boolean` | Submit in progress |
| `labels` | `CertificateCategoryLabels` | i18n strings |
| `canManage` | `boolean` | Permission gate |
| `descendantIds` | `Set<string>` | For filtering self/descendants from `CategoryPicker` |

**Form fields**: same as create + pre-filled values from `category`. Parent field via `CategoryPicker` (excludes self and descendants for cycle prevention). Color + icon pickers with current values pre-selected.

### `DeleteCategoryConfirmDialog.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog visibility |
| `category` | `CategoryNode \| null` | Category pending deletion |
| `templateCount` | `number` | Templates affected (0 if none) |
| `childCount` | `number` | Child categories (0 if none) |
| `onClose` | `() => void` | Close handler |
| `onConfirm` | `(id: string) => Promise<void>` | Delete mutation wrapper |
| `loading` | `boolean` | Delete in progress |
| `labels` | `CertificateCategoryLabels` | i18n strings |

**Content**: Warning icon (`WarningAmberOutlined`), confirm text with `dialog.delete.confirm(name)` interpolation, conditional `dialog.delete.hasChildrenWarning` if `childCount > 0`, conditional `dialog.delete.hasTemplatesWarning(count)` pluralized if `templateCount > 0`. Delete button uses `sx` with `theme.palette.error.main`.

### `CategoryPicker.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string \| null` | Selected parent category ID |
| `onChange` | `(id: string \| null) => void` | Selection handler |
| `excludeIds` | `Set<string>` | IDs to exclude (self + descendants for cycle prevention) |
| `labels` | `CertificateCategoryLabels` | i18n strings |
| `disabled` | `boolean` | Read-only mode |

**Behavior**: `Autocomplete` with options populated from `categoryRoots` + `categoryChildren` queries. Renders category name with indentation by level. `excludeIds` filters out self and descendants (used in edit dialog). `onChange(null)` means "root category" (`field.parentNone` label).

### `CategoryAvatar.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `color` | `string` | Color token name from `certificate-category-colors.ts` |
| `icon` | `string` | Icon name from `certificate-category-icons.ts` |
| `size` | `'small' \| 'medium' \| 'large'` | Avatar size |
| `sx` | `SxProps<Theme>` | Additional styling |

**Behavior**: Renders `Avatar` with `sx` background from `theme.palette[colorName]` (mapped via constant), and MUI icon from the icon name. No hardcoded hex values.

### `CategorySearchBar.desktop.tsx` / `.mobile.tsx`

**Props Interface** (both variants):

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Current search term (from store) |
| `onChange` | `(term: string) => void` | Handler (sets `searchTerm` in store) |
| `labels` | `CertificateCategoryLabels` | i18n strings (placeholder, clear) |
| `loading` | `boolean` | Search query in progress — shows `CircularProgress` adornment |

**Desktop**: `TextField` variant with `InputAdornment` (`SearchOutlined` icon leading, clear `IconButton` trailing). Placed in tree pane header.

**Mobile**: `TextField` in `MobileContentInset` with same adornments.

### `ColorSwatchPicker.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string \| null` | Selected color token name |
| `onChange` | `(color: string \| null) => void` | Selection handler |
| `labels` | `CertificateCategoryLabels` | i18n strings |
| `disabled` | `boolean` | Read-only mode |

**Behavior**: `Box` with `display: grid`, `gridTemplateColumns: repeat(5, 1fr)`, gap `1`. Each cell renders a `ToggleButton` with `sx` background from `theme.palette[colorToken].main`. Selected cell has ring border via `sx` `outline: 2px solid theme.palette.primary.main`. Color names from `CERTIFICATE_CATEGORY_COLORS` constant (10–15 palette entries: blue, red, green, orange, purple, teal, pink, indigo, grey, brown). No hardcoded hex — all via `theme.palette`.

### `IconPicker.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string \| null` | Selected icon name |
| `onChange` | `(icon: string \| null) => void` | Selection handler |
| `labels` | `CertificateCategoryLabels` | i18n strings |
| `disabled` | `boolean` | Read-only mode |

**Behavior**: `Box` with `display: grid`, `gridTemplateColumns: repeat(6, 1fr)`, gap `1`. Each cell renders a `ToggleButton` wrapping an MUI icon (from `CERTIFICATE_CATEGORY_ICONS` constant, 15–20 names: `FolderOutlined`, `DescriptionOutlined`, `SchoolOutlined`, `WorkOutlined`, `AssignmentOutlined`, `StarOutlined`, `VerifiedOutlined`, `EmojiEventsOutlined`, `CardMembershipOutlined`, `MilitaryTechOutlined`, `ScienceOutlined`, `MedicalServicesOutlined`, `BusinessOutlined`, `LanguageOutlined`, `GroupOutlined`, `SecurityOutlined`, `LightbulbOutlined`, `HandshakeOutlined`). Selected cell highlighted with `sx` `bgcolor: theme.palette.action.selected`.

### `MoveTemplateToCategoryDialog.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog visibility |
| `template` | `TemplateListItem \| null` | Template being moved |
| `fromCategoryName` | `string` | Current category name (display only) |
| `onClose` | `() => void` | Close handler |
| `onSubmit` | `(templateId: string, newCategoryId: string) => Promise<void>` | Move mutation handler |
| `loading` | `boolean` | Move in progress |
| `labels` | `CertificateCategoryLabels` | i18n strings |
| `canManage` | `boolean` | Permission gate |

**Content**: Shows current category name (disabled `TextField`), `CategoryPicker` for new category, submit button.

### `CategoryMobileNodeCard.mobile.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `node` | `CategoryNode` | Category data |
| `isExpanded` | `boolean` | Whether expanded |
| `onToggleExpand` | `(id: string) => void` | Expand/collapse handler |
| `onSelect` | `(id: string) => void` | Selection handler |
| `onOpenActionMenu` | `(id: string) => void` | Open bottom-sheet action menu |
| `canManage` | `boolean` | Permission gate for actions |
| `childCount` | `number` | From node data |
| `labels` | `CertificateCategoryLabels` | i18n strings |

**Behavior**: `MobileCardList` item. Header row: `IconButton` (expand/collapse icon — `ExpandMoreOutlined` / `ChevronRightOutlined`), `CategoryAvatar`, category name `Typography`, `IconButton` (`MoreVertOutlined`) for action menu (visible only if `canManage`). Subheader: `node.childCount` via `labels.childCount(count)` pluralized. Child categories shown in `Collapse` with `MobileCardList` when expanded.

### `CategoryMobileActionMenu.mobile.tsx`

**Props Interface**:

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Drawer visibility |
| `categoryId` | `string \| null` | Target category for actions |
| `onClose` | `() => void` | Close drawer |
| `actions` | `ReadonlyArray<{ key: string; label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }>` | Action list |
| `labels` | `CertificateCategoryLabels` | i18n strings |

**Behavior**: `SwipeableDrawer` with `anchor="bottom"`. Each action is a `ListItemButton` with `ListItemIcon` + `ListItemText`. Actions: Add Child, Rename, Move Up (disabled if first), Move Down (disabled if last), Delete (`sx` color error).

### Rendering Logic

1. Check if children are fetched; if not and node is expanded, fetch via ViewModel resolver
2. Render node: drag handle + chevron + editable label + action menu
3. If expanded and children loaded: render nested `SortableContext` with child nodes
4. If expanded and children loading: render `CircularProgress` spinner
5. Indentation: `paddingLeft: level * indentationUnit` (using `sx` with theme tokens — not hardcoded)
6. Selected node: `sx` background from `theme.palette.primaryContainer`
7. Hover: `sx` background from `theme.palette.hoverSurface` or `theme.palette.action.hover`

### Mobile: `CategoryListItem.mobile.tsx`

Simplified props — no drag, no inline edit. Uses tap-to-expand and action menu (bottom sheet) for CRUD.

---

## 7. API Surface (GraphQL Documents)

> This plan does not define the GraphQL schema (that is Plan 5). It defines the **documents** that consume Plan 5's API.

**File**: `frontend/common/graphql/sharedDocuments/certificates/certificateCategory.documents.ts`

### 7.1 Fragment Definitions

**`CertificateCategoryFragment`** — spread into every query/mutation that returns a category:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | Required for Apollo cache normalization |
| `name` | `String!` | Display name |
| `description` | `String` | Optional |
| `parentId` | `ID` | `null` for root categories |
| `order` | `Int!` | Sort position within parent |
| `specialType` | `CategorySpecialType` | Enum (`STANDARD`, `CUSTOM`) |
| `childCount` | `Int!` | Count of direct children |
| `color` | `String` | Color token name (nullable — defaults to grey) |
| `icon` | `String` | Material icon name (nullable — defaults to `FolderOutlined`) |

**`TemplateSummaryFragment`** — for `categoryTemplates` query:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | Cache normalization |
| `name` | `String!` | Template display name |
| `status` | `TemplateStatus!` | Enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`) |
| `categoryId` | `ID` | Current category assignment |
| `createdAt` | `String!` | ISO timestamp |
| `updatedAt` | `String!` | ISO timestamp |

### 7.2 Query Documents

All typed via `TypedDocumentNode<TData, TVariables>` from `@graphql-typed-document-node/core`.

**`CategoryRootsQueryDocument`** — `TypedDocumentNode<{ categoryRoots: CertificateCategoryFragment[] }, Record<string, never>>`:
- Operation: `query CategoryRoots { categoryRoots { ...CertificateCategoryFragment } }`
- Used by: ViewModel `rootCategories` via `useQuery(categoryRootsQueryDocument)`
- Fetch policy: `cache-and-network` (optimistic from cache, revalidate in background)

**`CategoryChildrenQueryDocument`** — `TypedDocumentNode<{ categoryChildren: CertificateCategoryFragment[] }, { parentId: string }>`:
- Operation: `query CategoryChildren($parentId: ID!) { categoryChildren(parentId: $parentId) { ...CertificateCategoryFragment } }`
- Used by: per-node `useQuery` inside `CategoryTreeNode` (with `skip: !isExpanded`)
- Fetch policy: `cache-first` (Apollo cache already holds children after first fetch)

**`CategorySearchQueryDocument`** — `TypedDocumentNode<{ categorySearch: CertificateCategoryFragment[] }, { term: string }>`:
- Operation: `query CategorySearch($term: String!) { categorySearch(term: $term) { ...CertificateCategoryFragment } }`
- Used by: ViewModel `searchResults` via `useQuery(categorySearchQueryDocument, { variables: { term: searchTerm }, skip: searchTerm.length < 1, fetchPolicy: 'network-only' })`

**`CategoryTemplatesQueryDocument`** — `TypedDocumentNode<{ categoryTemplates: { items: TemplateSummaryFragment[]; pageInfo: PageInfo } }, { categoryId: string; page: number; perPage: number }>`:
- Operation includes `pageInfo { currentPage hasMorePages lastPage perPage total }` per §8 pagination contract
- Used by: `TemplatePane` / `TemplateCardList` via `useQuery` with `mode: "server"` AppDataGrid pagination
- Fired when `selectedCategoryId` changes

### 7.3 Mutation Documents

**`CreateCategoryMutationDocument`** — `TypedDocumentNode<{ createCategory: CertificateCategoryFragment }, { input: CreateCategoryInput }>`:
- Operation: `mutation CreateCategory($input: CreateCategoryInput!) { createCategory(input: $input) { ...CertificateCategoryFragment } }`
- Used by: ViewModel `onCreateCategory`

**`UpdateCategoryMutationDocument`** — `TypedDocumentNode<{ updateCategory: CertificateCategoryFragment }, { input: UpdateCategoryInput }>`:
- Operation: `mutation UpdateCategory($input: UpdateCategoryInput!) { updateCategory(input: $input) { ...CertificateCategoryFragment } }`
- Used by: ViewModel `onUpdateCategory`

**`DeleteCategoryMutationDocument`** — `TypedDocumentNode<{ deleteCategory: { success: boolean } }, { id: ID! }>`:
- Operation: `mutation DeleteCategory($id: ID!) { deleteCategory(id: $id) { success } }`
- Used by: ViewModel `onDeleteCategory`

**`ReorderCategoryMutationDocument`** — `TypedDocumentNode<{ reorderCategory: CertificateCategoryFragment }, { input: ReorderCategoryInput }>`:
- Operation: `mutation ReorderCategory($input: ReorderCategoryInput!) { reorderCategory(input: $input) { ...CertificateCategoryFragment } }`
- Input (positional per §12): `{ id: ID!, beforeId: ID, afterId: ID, newParentId: ID }`
- Used by: ViewModel `onReorderCategory`

**`MoveTemplateToCategoryMutationDocument`** — `TypedDocumentNode<{ moveTemplateToCategory: { id: ID!; categoryId: ID } }, { input: MoveTemplateInput }>`:
- Operation: `mutation MoveTemplateToCategory($input: MoveTemplateInput!) { moveTemplateToCategory(input: $input) { id categoryId } }`
- Used by: ViewModel `onMoveTemplate` (optimistic update per F-09-6)

### 7.4 Queries Consumed Summary

| Operation | Plan 5 Provides? | Notes |
|-----------|-----------------|-------|
| `categoryRoots` | Yes (Plan 5) | Root categories with `childCount` |
| `categoryChildren(parentId)` | Yes (Plan 5) | Children of a category with `childCount` |
| `category(id)` | Yes (Plan 5) | Single category with path array |
| `categoryTemplates(categoryId, pagination)` | Yes (Plan 5) | Templates in category (page-number pagination per §8) |
| `categorySearch(term)` | Yes (Plan 5) | Flat filtered results (per F-09-2) |

### 7.5 Mutations Consumed Summary

| Operation | Plan 5 Provides? | Notes |
|-----------|-----------------|-------|
| `createCategory` | Yes (Plan 5) | Creates new category |
| `updateCategory` | Yes (Plan 5) | Updates name, description, color, icon, parentId |
| `deleteCategory` | Yes (Plan 5) | Soft delete |
| `reorderCategory` | Yes (Plan 5) | Positional reorder (beforeId/afterId/newParentId) per §12 |
| `moveTemplateToCategory` | Yes (Plan 5) | Reassigns template's categoryId |

> **Dependency note**: If Plan 5 has not yet implemented `reorderCategory` or `categorySearch`, this plan must coordinate. The GraphQL documents file defines the document strings; if the schema doesn't yet have these operations, codegen will fail. Coordinate with Plan 5 to ensure all listed operations are available.

---

## 8. UX / Navigation Specification

### 8.1 Route

- **Path**: `/certificates/categories`
- **Route group**: `app/(dashboard)/certificates/categories/page.tsx`
- **Permission guard (page-level)**: `requirePermissionForPage(userId, [AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage], locale, context)` — redirect to 403 if user has NEITHER
- **Sidebar**: Appears under "Certificates" nav group (configured in Plan 8 navigation config). Entry label key: `nav.certificates.categories` — shows `FolderOutlined` icon. Visible only if user has `CertificateTemplateView` OR `CertificateTemplateManage`
- **Breadcrumbs**: Dashboard → Certificates → Categories (auto-generated by `usePageBreadcrumbs` based on route segment)
- **Deep links**: `/certificates/categories?selected=<categoryId>` — pre-selects a category on load (ViewModel reads `useSearchParams()`). `/certificates/categories?expanded=<id1>,<id2>` — pre-expands categories for deep linking from template detail page
- **Page metadata**: `generateMetadata()` returns `{ title: labels.pageTitle, description: labels.pageSubtitle }` via `getTranslations(locale)`

### 8.2 Desktop Layout

**File**: `frontend/desktop/views/dashboard/certificates/categories/certificateCategoryView.desktop.tsx`

**Props**: `Readonly<CertificateCategoryViewModel>` — entire ViewModel passed through from Switcher.

**Component Tree**:

```
DesktopPageContainer (from @/frontend/desktop/components/ui/container/page)
├── DesktopPageHeader
│   ├── title: labels.pageTitle
│   ├── subtitle: labels.pageSubtitle
│   └── DesktopPrimaryPageAction (if canManage)
│       └── onClick: openCreateDialog(null)    # Create Root Category
├── CategorySearchBar.desktop.tsx
│   └── props: { value: searchTerm, onChange: onSearch, labels, loading }
└── Box (sx: display flex, gap 2)
    ├── SectionPanel #1 — Category Tree (width: 320px)
    │   ├── header: labels.treeTitle
    │   ├── CategoryTree.desktop.tsx (DndContext + SortableContext)
    │   │   └── CategoryTreeNode.desktop.tsx (recursive)
    │   │       ├── InlineEditableLabel (double-click rename)
    │   │       ├── CategoryActionMenu (IconButton MoreVert)
    │   │       └── nested SortableContext (if expanded)
    │   └── loading: CircularProgress
    └── SectionPanel #2 — Template Pane (flex: 1)
        ├── header: labels.templatePaneTitle(selectedCategoryName)
        └── TemplatePane.desktop.tsx
            └── AppDataGrid (mode: "server", page-number pagination)
                └── columns from TemplatePaneColumns.desktop.tsx
```

**`TemplatePaneColumns.desktop.tsx`** — array of column definitions:

| Column | Field | Width | Render |
|--------|-------|-------|--------|
| Name | `name` | flex: 1 | `Typography` with link to template detail |
| Status | `status` | 120px | `StatusBadge` with `status` prop (`DRAFT` → warning, `PUBLISHED` → success, `ARCHIVED` → default) |
| Created | `createdAt` | 160px | `Typography` formatted via `Intl.DateTimeFormat` |
| Actions | — | 80px | `IconButton` (`DriveFileMoveOutlined`) → opens `MoveTemplateToCategoryDialog` (if `canManage`) |

**Interaction States**:

| State | Behavior |
|-------|----------|
| **Loading (tree)** | `CategoryTree` renders `CircularProgress` centered in tree panel |
| **Loading (templates)** | `AppDataGrid` shows skeleton rows (built-in loading prop) |
| **Error (tree)** | Tree panel shows error `Alert` with retry `Button` (`labels.errors.loadFailed`) |
| **Error (templates)** | Template pane shows error `Alert` with retry |
| **Empty (tree)** | Tree panel shows `Typography` `labels.emptyTree` with create `Button` (if `canManage`) |
| **Empty (templates)** | Template pane shows `Typography` `labels.emptyTemplates` |
| **No selection** | Template pane shows `Typography` `labels.selectCategoryPrompt` |
| **Searching** | Tree replaced by flat search results list; each result is `CategoryTreeNode` (non-draggable) |
| **Drag in progress** | Other nodes dimmed via `sx` opacity 0.5; `CategoryTreeDropIndicator` shows drop line |
| **Inline editing** | Node label replaced by `TextField` with `autoFocus`, Enter to commit, Escape to cancel |
| **Dialog open** | Dialog overlays above content; backdrop click calls `closeCreateDialog` / `setEditingCategory(null)` |

### 8.2.1 Detailed Desktop Interaction States

| Component | Hover | Focus | Disabled | Error | Loading |
|-----------|-------|-------|----------|-------|---------|
| **CategoryTreeNode** | `sx: { bgcolor: theme.palette.action.hover }` | `sx: { outline: '2px solid', outlineColor: theme.palette.primary.main, outlineOffset: 2 }` | Drag handle hidden, action menu hidden, inline edit disabled | Red border on node (`theme.palette.error.main`) if node-specific error | `CircularProgress` inline (small) replacing expand chevron while children fetch |
| **InlineEditableLabel (display)** | Text color `theme.palette.primary.main` | Outline as above | Static text, no interaction | Red border + `HelperText` with `labels.errors.nameRequired` | N/A |
| **InlineEditableLabel (editing)** | N/A (editing) | `TextField` auto-focused, outline `theme.palette.primary.main` | N/A | Red border + helper text | N/A |
| **Drag Handle** | `sx: { color: theme.palette.primary.main, cursor: 'grab' }` | Same as hover + outline | `sx: { opacity: 0.38, cursor: 'not-allowed' }` | N/A | N/A |
| **CategoryActionMenu** | `IconButton` ripple | `IconButton` focus ring | Hidden (`!canManage`) | N/A | N/A |
| **CategorySearchBar** | `TextField` border color `theme.palette.primary.main` | `TextField` focused border | `disabled` prop | `TextField` error border + helper text | `InputAdornment` trailing `CircularProgress` (size small) |
| **DesktopPrimaryPageAction (Create)** | `sx: { bgcolor: theme.palette.primary.dark }` | Focus ring | Hidden (`!canManage`) | N/A | `Button` `startIcon={CircularProgress}` |
| **TemplatePane AppDataGrid row** | `sx: { bgcolor: theme.palette.action.hover }` | Row focus ring | N/A | N/A | Skeleton rows |
| **StatusBadge** | N/A | N/A | N/A | N/A | N/A |
| **Move Template IconButton** | Ripple + `sx: { color: theme.palette.primary.main }` | Focus ring | Hidden (`!canManage`) | N/A | `CircularProgress` on dialog open |

### 8.2.2 Keyboard Shortcuts (Desktop)

| Shortcut | Action | Context |
|----------|--------|---------|
| `Space` | Pick up / drop (dnd-kit) | On draggable node |
| `ArrowUp/Down` | Move up/down in tree | During drag |
| `ArrowLeft/Right` | Move out of / into parent | During drag |
| `Enter` | Commit inline edit / drop | Inline edit / drag |
| `Escape` | Cancel inline edit / cancel drag / close dialog | Any modal state |
| `F2` | Start inline edit | Selected node (canManage) |
| `/` | Focus search bar | Anywhere in view |

---

### 8.3 Mobile Layout

**File**: `frontend/mobile/views/dashboard/certificates/categories/certificateCategoryView.mobile.tsx`

**Props**: `Readonly<CertificateCategoryViewModel>` — same as desktop.

**Component Tree**:

```
MobilePageContainer (from @/frontend/mobile/components/ui)
├── MobilePageHeader
│   ├── title: labels.pageTitle
│   └── MobileFab (if canManage, position: fixed, bottom-right)
│       └── icon: AddOutlined, onClick: openCreateDialog(null)
├── MobileContentStack
│   ├── MobileContentInset
│   │   └── CategorySearchBar.mobile.tsx
│   ├── MobileContentInset
│   │   └── CategoryList.mobile.tsx
│   │       └── CategoryMobileNodeCard.mobile.tsx (recursive)
│   │           ├── Expand/Collapse IconButton (ChevronRight/ExpandMore)
│   │           ├── CategoryAvatar (color + icon)
│   │           ├── Typography (name)
│   │           ├── Typography (childCount, pluralized)
│   │           ├── IconButton (MoreVert) → CategoryMobileActionMenu
│   │           └── Collapse (children: nested MobileCardList)
│   └── MobileContentInset (if selectedCategoryId)
│       └── TemplateCardList.mobile.tsx
│           └── MobileCardList
│               └── TemplateCardListItem.mobile.tsx (per template)
│                   ├── Typography (template name)
│                   ├── StatusBadge (status)
│                   └── IconButton (DriveFileMove, if canManage)
│                       └── onClick: openMoveTemplateDialog(template)
```

**Interaction States**:

| State | Behavior |
|-------|----------|
| **Loading (tree)** | `MobileCardList` shows `Skeleton` placeholders (3 items) |
| **Loading (templates)** | `MobileCardList` shows `Skeleton` placeholders (3 items) |
| **Error (any)** | `Alert` severity error with retry `Button` |
| **Empty (tree)** | `Typography` `labels.emptyTree` centered with `AddOutlined` `Button` (if `canManage`) |
| **Empty (templates)** | `Typography` `labels.emptyTemplates` |
| **No selection** | Template section hidden (no `MobileContentInset` rendered) |
| **Searching** | Category list replaced by flat search results; each result is `CategoryMobileNodeCard` (non-expandable, tap to select) |
| **Action menu open** | `SwipeableDrawer` slides from bottom; backdrop tap dismisses |
| **Dialog open** | MUI `Dialog` with `fullScreen` prop on mobile; close button in app bar |
| **Drag** | N/A — no drag-and-drop on mobile; reorder via action menu "Move Up"/"Move Down" only |

### 8.3.1 Detailed Mobile Interaction States

| Component | Touch / Tap | Long Press | Focus (Accessibility) | Disabled | Error | Loading |
|-----------|-------------|------------|----------------------|----------|-------|---------|
| **CategoryMobileNodeCard** | Tap expands/collapses (full row touch target ≥48dp) | Opens `CategoryMobileActionMenu` (bottom sheet) | Focus ring on action menu trigger `IconButton` | Action menu trigger hidden (`!canManage`), expand still works | Red border on card + inline `Alert` | Skeleton placeholder (3 items) while root loads; inline `CircularProgress` for child load |
| **CategoryAvatar** | N/A | N/A | N/A | N/A | N/A | N/A |
| **MobileFab (Create)** | Tap opens `CreateCategoryDialog` | N/A | Focus ring | Hidden (`!canManage`) | N/A | `startIcon={CircularProgress}` while creating |
| **CategoryMobileActionMenu** | `ListItemButton` tap executes action | N/A | Focus ring on each `ListItemButton` | "Move Up" disabled if first, "Move Down" disabled if last, "Delete" always enabled | N/A | N/A |
| **CategorySearchBar (mobile)** | Tap focuses `TextField` | N/A | `TextField` focused border | N/A | Red border + helper text | Trailing `CircularProgress` (small) |
| **TemplateCardListItem** | Tap navigates to template detail (Plan 8) | N/A | Focus ring on card | N/A | N/A | Skeleton (3 items) |
| **Move Template IconButton** | Tap opens `MoveTemplateToCategoryDialog` | N/A | Focus ring | Hidden (`!canManage`) | N/A | `CircularProgress` on dialog open |

### 8.3.2 Touch Target Sizing (Mobile)

| Element | Minimum Size | Implementation |
|---------|--------------|----------------|
| **Category row (expand area)** | 48×48dp | Full `MobileCardList` item row (padding 16dp) |
| **Expand/collapse IconButton** | 48×48dp | `IconButton size="medium"` (40px) + `sx: { p: 1 }` (8px) = 48px |
| **Action menu trigger** | 48×48dp | `IconButton size="medium"` + padding |
| **MobileFab** | 56×56dp | MUI default `size="medium"` |
| **Action menu items** | 48dp height | `ListItemButton` with `minHeight: 48` |
| **Dialog buttons** | 48dp height | MUI `Button` default |
| **Search input** | 48dp height | `TextField` `InputProps={{ inputProps: { style: { minHeight: 48 } } }}` |

### 8.3.3 Mobile Accessibility (WCAG 2.1 AA)

- All interactive elements have `aria-label` from i18n keys
- `CategoryMobileNodeCard` has `role="button"` with `aria-expanded` (accordion pattern)
- `CategoryMobileActionMenu` uses `role="dialog"` with `aria-labelledby` / `aria-describedby`
- `SwipeableDrawer` traps focus when open
- Search input has `aria-label` matching placeholder
- Screen reader announces expansion state change via `aria-expanded` on accordion trigger

---

### 8.4 Roles & Permissions

| Permission (AppPermission key) | Can View Page | Can CRUD Categories | Can Move Templates |
|-------------------------------|--------------|---------------------|--------------------|
| `CertificateTemplateManage` (`certificates.templates.manage`) | Yes | Yes | Yes |
| `CertificateTemplateView` (`certificates.templates.view`) | Yes (read-only) | No (buttons hidden) | No (button hidden) |
| No cert permissions | Forbidden (redirect) | Forbidden | Forbidden |

> **F-09-4 fix**: Split view vs manage. `CertificateTemplateView` grants browse-only access (tree + template pane visible, CRUD buttons hidden via `canManage` flag). `CertificateTemplateManage` grants full CRUD + reorder. Page guard checks for EITHER permission via `requirePermissionForPage(userId, [AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage], locale, context)`.

### 8.5 Permission Integration in Components

**Container (`CertificateCategoryContainer.tsx`)**:
- Wraps entire view in `<RequirePermission permissions={[AppPermission.CertificateTemplateView]} fallback={<ForbiddenView />} />` — this is a secondary guard; the primary guard is in `page.tsx` via `requirePermissionForPage`
- Does NOT wrap in `RequirePermission` for `CertificateTemplateManage` — that would hide the entire page for view-only users

**ViewModel**:
- `canManage = useHasPermission([AppPermission.CertificateTemplateManage])` — single check, passed to all views
- `canView = useHasPermission([AppPermission.CertificateTemplateView, AppPermission.CertificateTemplateManage])` — guards page visibility (used by Container to redirect if false)

**Desktop View** — `canManage` controls visibility of:
- `DesktopPrimaryPageAction` (Create Root Category button) — hidden if `!canManage`
- Drag handles on `CategoryTreeNode` — hidden if `!canManage`
- `CategoryActionMenu` trigger (`MoreVertOutlined` `IconButton`) — hidden if `!canManage`
- `InlineEditableLabel` double-click behavior — disabled, label renders as static `Typography` if `!canManage`
- Template "Move" `IconButton` in `AppDataGrid` actions column — hidden if `!canManage`

**Mobile View** — `canManage` controls visibility of:
- `MobileFab` (Create button) — hidden if `!canManage`
- `CategoryMobileNodeCard` action menu trigger (`MoreVertOutlined`) — hidden if `!canManage`
- Template "Move" `IconButton` in `TemplateCardListItem` — hidden if `!canManage`
- No drag functionality exists on mobile regardless of permission

**Dialogs**:
- All dialogs (`Create`, `Edit`, `Delete`, `MoveTemplate`) check `canManage` before allowing submit. If `canManage` is false (shouldn't happen since triggers are hidden), the submit button is disabled with `labels.errors.permissionDenied` tooltip.

### 8.6 Cycle Prevention Detail

**Frontend (ViewModel)**:
- `descendantIds(categoryId)` helper: traverses loaded tree nodes to collect all descendant IDs. Returns `Set<string>`.
- Used by `EditCategoryDialog` → `CategoryPicker` → `excludeIds` prop — prevents selecting self or descendant as parent.
- Note: this is a **best-effort frontend check** — only covers loaded nodes. If children aren't expanded, descendants may be unknown. Backend must reject via `CYCLE_DETECTED` error.

**Backend (Plan 5)**:
- Mutation `updateCategory` with new `parentId` where the target is an ancestor → returns structured error `CYCLE_DETECTED` with `cyclePath` array.
- ViewModel catches `ApolloError` with `CYCLE_DETECTED` extension code → shows `labels.errors.cycleDetected` snackbar + reverts optimistic cache update.

**Reorder**:
- `ReorderCategoryInput.newParentId` — if moving to a new parent, descendants of dragged node cannot be the new parent. Same descendant-check applies.

---

## 9. Error Handling Strategy

| Error Type | Handling |
|-----------|----------|
| Network error (query) | Apollo error link handler shows global error state; tree shows retry button |
| Network error (mutation) | Snackbar with `labels.errors.*` message; revert optimistic updates |
| Validation error (empty name) | Form validation in dialog; `errors.nameRequired` message |
| Cycle detected (drag) | Frontend prevents drop; if backend rejects, `errors.cycleDetected` snackbar |
| Has children (delete) | Confirmation dialog warns; cascade delete handled by service |
| Permission denied (mutation) | `errors.permissionDenied` snackbar |
| Not found (update/delete) | `errors.notFound` snackbar; node evicted from tree |

---

## 10. i18n Design

### 10.1 Namespace Structure

```
types/dashboard/certificates/categories.ts
  → interface CertificateCategoryLabels { ... }

namespaces/dashboard/certificates/categories.namespace.ts
  → DashboardCertificatesCategories = defineNamespace("dashboard.certificates.categories", { load: { ar, en } })

ar/dashboard/certificates/categories.ts → dashboardCertificatesCategoriesAr: CertificateCategoryLabels
en/dashboard/certificates/categories.ts → dashboardCertificatesCategoriesEn: CertificateCategoryLabels

namespaces/translation.ts → Translation.Dashboard.CertificateCategories = DashboardCertificatesCategories
types/dashboard/certificates/index.ts → CertificateDashboardTranslations.categories: CertificateCategoryLabels
ar/messages.ts → import + extend dashboardTranslations.certificateCategories
en/messages.ts → import + extend dashboardTranslations.certificateCategories
```

### 10.2 Type Schema (`CertificateCategoryLabels`)

| Key | Signature | Usage |
|-----|-----------|-------|
| `pageTitle` | `string` | Page `<title>` + header title |
| `pageSubtitle` | `string` | Header subtitle |
| `treeTitle` | `string` | Tree panel section title |
| `templatePaneTitle` | `(categoryName: string) => string` | Template panel header interpolation |
| `field.name` | `string` | Form field label — name |
| `field.namePlaceholder` | `string` | Form field placeholder — name |
| `field.description` | `string` | Form field label — description |
| `field.descriptionPlaceholder` | `string` | Form field placeholder — description |
| `field.parent` | `string` | Form field label — parent category |
| `field.parentNone` | `string` | "Root category" indicator |
| `field.color` | `string` | Form field label — color |
| `field.icon` | `string` | Form field label — icon |
| `action.create` | `string` | Create button |
| `action.createChild` | `string` | Create child button |
| `action.edit` | `string` | Edit/rename button |
| `action.delete` | `string` | Delete button |
| `action.moveUp` | `string` | Move up button |
| `action.moveDown` | `string` | Move down button |
| `action.moveTemplate` | `string` | Move template to category |
| `action.search` | `string` | Search placeholder |
| `action.clearSearch` | `string` | Clear search button tooltip |
| `action.cancel` | `string` | Dialog cancel button |
| `action.submit` | `string` | Dialog submit/create button |
| `action.save` | `string` | Dialog save button (edit) |
| `childCount` | `(count: number) => string` | Pluralized child count badge |
| `templateCount` | `(count: number) => string` | Pluralized template count |
| `dialog.create.title` | `string` | Create dialog title |
| `dialog.create.subtitle` | `string` | Create dialog subtitle |
| `dialog.edit.title` | `string` | Edit dialog title |
| `dialog.delete.title` | `string` | Delete dialog title |
| `dialog.delete.confirm` | `(name: string) => string` | Delete confirm text with name interpolation |
| `dialog.delete.hasChildrenWarning` | `string` | Warning when category has children |
| `dialog.delete.hasTemplatesWarning` | `(count: number) => string` | Pluralized warning for templates |
| `dialog.moveTemplate.title` | `string` | Move template dialog title |
| `dialog.moveTemplate.from` | `string` | "Current category" label |
| `dialog.moveTemplate.to` | `string` | "New category" label |
| `emptyTree` | `string` | Empty tree state message |
| `emptyTemplates` | `string` | Empty template pane message |
| `selectCategoryPrompt` | `string` | Prompt shown when no category selected |
| `searchResults` | `(count: number) => string` | Pluralized search result count |
| `searchNoResults` | `string` | No search results message |
| `loadingTree` | `string` | Tree loading a11y label |
| `loadingTemplates` | `string` | Templates loading a11y label |
| `inlineEdit.placeholder` | `string` | Inline rename input placeholder |
| `errors.loadFailed` | `string` | Query error message |
| `errors.nameRequired` | `string` | Validation: name required |
| `errors.nameTooLong` | `string` | Validation: name exceeds 255 chars |
| `errors.cycleDetected` | `string` | Cycle detected on parent change |
| `errors.hasChildren` | `string` | Delete blocked by children |
| `errors.permissionDenied` | `string` | Mutation permission denied |
| `errors.notFound` | `string` | Category not found |
| `errors.createFailed` | `string` | Create mutation failed |
| `errors.updateFailed` | `string` | Update mutation failed |
| `errors.deleteFailed` | `string` | Delete mutation failed |
| `errors.reorderFailed` | `string` | Reorder mutation failed |
| `errors.moveTemplateFailed` | `string` | Move template mutation failed |

### 10.3 Error Translations Integration

Category-specific error keys are added to the existing `ErrorsLabels` interface under a new `certificates.categories` sub-object:

```
types/errors/index.ts
  → ErrorsLabels.certificates = CertificateErrors
  → CertificateErrors = { categories: CategoryErrors, ... }
  → CategoryErrors = { notFound, nameRequired, cycleDetected, hasChildren, permissionDenied,
                        createFailed, updateFailed, deleteFailed, reorderFailed, moveTemplateFailed }
```

Both `ar/errors/` and `en/errors/` updated with implementations.

### 10.4 Access Patterns

| Context | Access |
|---------|--------|
| Server component (`page.tsx`) | `getTranslations(locale)` → `dashboardTranslations.certificateCategories` |
| Client ViewModel | `useAppTranslation(Translation.Dashboard.CertificateCategories)` |
| GraphQL resolver (Plan 5) | `ctx.t()` → `errorsTranslations.certificates.categories` |
| API route / test | `getServerTranslations(locale)` → `errorsTranslations.certificates.categories` |

### 10.5 EN Implementation Summary

- `pageTitle`: "Template Categories"
- `pageSubtitle`: "Manage certificate template categories"
- `treeTitle`: "Category Tree"
- `templatePaneTitle(name)`: `` `Templates in ${name}` ``
- `childCount(count)`: `count === 1 ? "1 subcategory" : \`${count} subcategories\``
- `templateCount(count)`: `count === 1 ? "1 template" : \`${count} templates\``
- `dialog.delete.confirm(name)`: `` `Are you sure you want to delete "${name}"?` ``
- `dialog.delete.hasTemplatesWarning(count)`: `count === 1 ? "1 template is using this category." : \`${count} templates are using this category.\``
- `searchResults(count)`: `count === 1 ? "1 result" : \`${count} results\``
- Error keys mapped to human-readable English strings

### 10.6 AR Implementation Summary

- `pageTitle`: "تصنيفات القوالب"
- `pageSubtitle`: "إدارة تصنيفات قوالب الشهادات"
- `treeTitle`: "شجرة التصنيفات"
- `templatePaneTitle(name)`: `` `القوالب في ${name}` ``
- `childCount(count)`: `count === 1 ? "تصنيف فرعي واحد" : \`${count} تصنيفات فرعية\`` (with proper Arabic plural rules)
- `templateCount(count)`: `count === 1 ? "قالب واحد" : \`${count} قوالب\``
- `dialog.delete.confirm(name)`: `` `هل أنت متأكد من حذف "${name}"؟` ``
- `searchResults(count)`: `count === 1 ? "نتيجة واحدة" : \`${count} نتائج\``
- Error keys mapped to human-readable Arabic strings
- RTL handled by the existing MUI RTL provider (no special handling in components)

---

## 11. Outcome & Knowledge Transfer Protocol

### Knowledge Artifacts

| Artifact | Location | Content |
|----------|---------|---------|
| Category tree component pattern | `frontend/COMPONENT_PATTERNS.md` → new §"Recursive Category Tree" | Lazy-loading tree, Zustand expansion state, hover-preload |
| Drag-and-drop tree pattern | `frontend/COMPONENT_PATTERNS.md` → new §"DnD Tree with dnd-kit" | DndContext + nested SortableContext, drop detection, accessibility |
| Cycle prevention pattern | `docs/` → new `hierarchical-cycle-prevention.md` | Frontend + backend dual validation for self-referential entities |

### AGENTS.md Updates

| File | Update |
|------|--------|
| `frontend/common/stores/AGENTS.md` | Add note about `Set<id>` reconstruction in persist-enabled stores (categories expansion pattern) |
| `frontend/common/graphql/sharedDocuments/AGENTS.md` | Add example of category fragment + nested children query pattern |
| `frontend/views/AGENTS.md` | Add note about recursive tree components in desktop tier views |

### Instruction File Updates

| File | Update |
|------|--------|
| `.github/instructions/frontend.instructions.md` | Add rule: "Recursive tree components must use hooks-safe per-node useQuery with skip" |

---

## Reality Check Notes

> Audit performed against the live codebase at `/home/ahmed/Projects/siraj-cert/` (2026-08-02). Path corrections in this plan were minor; findings are summarised here.

### Verified Against Actual Codebase

| Check | Reference (actual codebase) | Plan Alignment |
|-------|------------------------------|----------------|
| Store location & name | `frontend/common/stores/certificateCategoryStore.ts` (camelCase, consistent with `adminBillingStore.ts`, `entityStore.ts`, `studentListStore.ts`). `frontend/stores/` does NOT exist. | ✅ Already correct — no path fix needed. |
| Import alias | `@/frontend/common/stores/certificateCategoryStore` (matches `@/frontend/common/...` alias). | ✅ Already correct. |
| Three-location view split | `frontend/desktop/views/dashboard/certificates/categories/...` and `frontend/mobile/views/dashboard/certificates/categories/...` — verified that `frontend/{desktop,mobile}/views/` each contains only a `dashboard/` directory; per-domain subdivisions live inside it. Existing siblings: `dashboard/admin/`, `dashboard/billing/`, `dashboard/classes/`, `dashboard/parents/`, `dashboard/students/`, `dashboard/subjects/`, etc. | ✅ Already correct — no path fix needed. |
| Component file pattern | `frontend/{desktop,mobile}/views/dashboard/<domain>/components/<Entity>.<tier>.tsx`. Verified example in tasks: `frontend/desktop/views/dashboard/certificates/categories/components/CategoryTree.desktop.tsx`. | ✅ Already correct. |
| App Router structure | `app/(dashboard)/<domain>/page.tsx` + `app/(dashboard)/<domain>/[id]/page.tsx`. Existing examples: `app/(dashboard)/billing/invoices/page.tsx`, `app/(dashboard)/parents/page.tsx`. | ✅ Plan's `app/(dashboard)/certificates/categories/page.tsx` and `app/(dashboard)/certificates/categories/[id]/page.tsx` match. |
| sharedDocuments pattern | `frontend/common/graphql/sharedDocuments/<subdir>/<entity>.documents.ts` + `<subdir>/index.ts` barrel re-exported by top-level `index.ts`. Conventions from `frontend/common/graphql/sharedDocuments/AGENTS.md`: mandatory `id` in every selection; Apollo hooks from `@apollo/client/react`; `useLazyQuery` banned. | ✅ Plan's `frontend/common/graphql/sharedDocuments/cert/category-documents.ts` + `frontend/common/graphql/sharedDocuments/cert/index.ts` match. |
| i18n locale structure | `shared/locale/{types,namespaces,en,ar}/dashboard/<domain>/<feature>.namespace.ts` & `<feature>.ts`. Naming is per-feature with a handle like `dashboard<Domain><Feature>En`/`Ar`. Verified example: `shared/locale/namespaces/dashboard/subjects/main.namespace.ts` (namespace `DashboardSubjects`, `dashboardSubjectsEn`/`dashboardSubjectsAr`). | ✅ Plan's `dashboard/certificates/categories.namespace.ts` + `dashboard/certificates/categories.ts` (handle `DashboardCertificatesCategories`, `dashboardCertificatesCategoriesEn`/`Ar`) match the per-feature convention. |
| Zustand conventions | `frontend/common/stores/AGENTS.md` (create-store helper, `StorageType` persist-vs-memory, selector hooks, types from generated GraphQL package NOT `operations.ts`). | ✅ Plan's store shape matches. |

### Corrections Made During Reality Check

1. **Stray `frontend/stores/AGENTS.md` references** — The plan mostly used the correct `frontend/common/stores/...` paths throughout, but a small number of stale references to `frontend/stores/AGENTS.md` remained (design.md:560, tasks.md:277, :317, :877, :900). All were corrected to `frontend/common/stores/AGENTS.md`. Verified with `grep -rn 'frontend/stores/' .ai/draft_plans/cert/plans/09-template-category-mgmt/` → zero matches remaining.

### Notes (no correction needed)

- The store file name (`certificateCategoryStore.ts`, camelCase) and the import path (`@/frontend/common/stores/certificateCategoryStore`) were already correct and were left unchanged.
- The tier-view path `frontend/{desktop,mobile}/views/dashboard/certificates/categories/...` matches the actual `views/dashboard/<domain>/...` layout.
- Repository and backend conventions referenced by the plan (snake_case plural tables, `UpdatedAt`/`CreatedAt` columns, transaction-aware repos with `tx ?? db`) match `backend/db/repo/AGENTS.md` and `backend/db/schema/AGENTS.md` patterns.

---

## SWE Expert Review Notes

> Expert SWE architectural review (2026-08-02) over and above the existing "Reality Check Notes". This section records *architectural judgment* findings (design gaps, risks, recommended fixes), not path corrections — paths were already validated in the Reality Check Notes above.

### A. Architectural Soundness — Category Tree Data Structure

1. **Adjacency list (`parentCategoryId`) — CORRECT choice for this use case.** The plan (REQ-09-01, DD-01) uses `certificate_categories.parentCategoryId` self-referential FK with an `order` integer for sibling ordering. This is the right structure for:
   - Deep, unbounded nesting (REQ scope: "without depth limits")
   - Frequent leaf-level mutation (add/rename/move a single node touches one row)
   - Lazy-loaded subtree expansion (DD-01)
   **Alternatives correctly rejected:**
   - *Nested set (left/right bounds):* great for read-heavy "fetch whole subtree," but **every write renumbers half the tree** — catastrophic for drag-and-drop reorder (REQ-09-05). ✅ Correctly not chosen.
   - *Materialized path (`path` like `/root/math/algebra`):* good for `LIKE '/root/%'` subtree queries and reorder- locality, but **path-string rewrite on parent move** and path-length limits make depth limits implicit. Not chosen — acceptable, but consider a hybrid (see #4).
2. **`order` integer column — naive; needs a reorder strategy.** A plain integer `order` column with "compute new order between neighbors" (design §5.3) hits the classic **fractions-of-fractions** problem: after many inserts between two neighbors, the integer gap is exhausted and a full-sibling renumber is needed. Real-world dnd trees (VS Code file tree, Notion) use one of:
   - **Gap-allocated integers** (e.g. start at 65536, step 65536); renumber the whole sibling list only when the gap closes.
   - **Lexicographic string keys** (fractional indexing, like Notion/Figma) — never need renumbering.
   **Fix (DD-08 — add as a new design decision):** specify the `order` strategy. Recommend gap-allocated integers with a documented renumber threshold (e.g. when `|order_a - order_b| < 1` after clamping, renumber all siblings in that parent with stride 65536). The `reorderCategory` mutation must support both "single-node move" and "renumber-siblings" operations. This is a **backend contract** owned by Plan 4/5 — flag it there, not just here.
3. **Cycle prevention (DD-07) — correct dual-layer design.** Frontend descendant-Set check for instant feedback + backend authoritative validation is the right pattern. ✅ **One gap:** the frontend "descendant IDs Set" (§6 `descendantIds` prop) can only include **already-loaded** descendants. DD-07 explicitly acknowledges this ("if unsure, allows the drop and relies on backend"). For deeply-nested collapsed trees this produces a brief "green → red snackbar" fl. **Fix:** the backend `reorderCategory` must return a structured error (`CYCLE_DETECTED` with the offending descendant chain) so the frontend can show a precise message, not a generic snackbar.
4. **Subtree queries — O(N) per expansion with adjacency list.** DD-01 accepts per-node `categoryChildren(parentId)` queries. For a tree of hundreds of nodes this is fine (lazy load). **Risk if the tree is huge (>10k nodes):** no single query fetches "a whole subtree." If Plan 8's category *filter* (REQ-08-03: "selecting a parent includes all descendants") needs all descendants of a node, that's a recursive N+1. **Fix:** add a `categoryDescendants(parentId, depth?)` query to Plan 5's API surface for the filter-dropdown use case, OR store a `materializedPath` column alongside `parentCategoryId` (hybrid adjacency + path) so descendants are `WHERE path LIKE '/root/%'`. Raise this dependency with Plan 5 — it affects Plan 08's category filter too.

### B. Completeness

5. **Drag-and-drop reorder — PROPERLY specified for desktop (REQ-09-05, §5).** dnd-kit + nested `SortableContext` + custom collision detection (top 25% before / bottom 25% after / middle 50% into-parent) is the correct model. ✅ Accessibility (Space/Arrow/Enter/Escape) is specified. **Gap:** the design does not specify **multi-select drag** (drag several nodes at once). Not required by REQ-09-05 — acceptable to defer, but note it as a deliberate non-goal.
6. **Drag-and-drop on mobile — correctly disabled (REQ-09-05, DD-03).** "Move Up/Down" via context menu is a sensible fallback. ✅
7. **What happens to `order` on delete?** REQ-09-04 deletes a category (soft delete `deletedAt`). It does NOT specify whether sibling `order` values are **renumbered** after a deletion. Leaving gaps is fine (see #2), but the deleted node's `order` slot must not be implicitly reused — confirm the soft-delete keeps the row (so `order` is preserved) and queries filter `deletedAt IS NULL`. **Fix:** add to REQ-09-04 acceptance: "deleted categories are excluded from tree queries via `deletedAt IS NULL`; sibling `order` values are not renumbered on delete (gaps are tolerated)."
8. **Template re-count on move (REQ-09-06) — no optimistic update.** When a template is moved between categories, REQ-09-06 says "update the list (Apollo cache evict + refetch)." Evict+refetch is correct but not optimistic — the moved card disappears from the source and (after refetch) appears in the target. **Fix:** add an optimistic move (write the template's new `categoryId` into the cache immediately; on error, rollback + snackbar). This is the same optimistic-update recommendation as Plan 08 #15.
9. **Hard delete / restore of soft-deleted categories — UNDEFINED.** REQ-09-04 covers soft delete. There is no requirement for **restoring** a soft-deleted category or **hard-deleting** it after a grace period. If categories can be soft-deleted, an admin UI for "restore" and a cron for "hard-delete after N days" are needed (or explicitly out of scope). **Fix:** add a scope-table line marking restore + hard-delete as out-of-scope (delegated to a future "trash" plan) OR add REQ-09-11 (restore) requirements. Currently silent.

### C. UI/UX Quality

10. **Tree + template pane split — GOOD desktop layout (§8.2).** Fixed 280px tree + flexible template pane matches IDE-like category browsers. ✅
11. **Inline edit (desktop) vs dialog (mobile) — CORRECT tier differentiation (DD-06).** Double-click inline edit on desktop, bottom-sheet dialog on mobile, shared create/delete/move dialogs. ✅ Matches Siraj tier-isolation rules.
12. **Empty state — DEFINED (REQ-09-07 "no-results", §4.2 `tree.emptyState`).** ✅ Both "no categories yet, create first" and "no matching search results" are covered.
13. **Search UX — autocomplete-flatten-and-filter (REQ-09-07).** Flattening the tree + filtering + auto-expanding parents of matches is the standard pattern (matches file-tree search in VS Code). ✅ **Gap:** if the tree is large and the user searches, the design flattens the *in-memory* tree — but only **fetched** nodes are in memory (DD-01 lazy loading). A search will miss matches in unloaded subtrees. **Fix:** REQ-09-07 should use the `categorySearch(searchTerm)` GraphQL query (design §3.1 lists it!) which searches the **full backend tree**, not the in-memory subset. The design's §3.1 already provides this query — REQ-09-07's prose ("flatten tree, filter by label") contradicts the GraphQL approach. **Align REQ-09-07 wording with §3.1:** search is server-side via `categorySearch`, results are rendered as a flat list with "path" breadcrumbs, and selecting a result expands its ancestor chain.

### D. GraphQL

14. **Queries — WELL DESIGNED (§3.1).** `categoryRoots`, `categoryChildren(parentId)`, `category(id)` with `path: string[]`, `categoryTemplates`, `categorySearch`. ✅ The `category(id)` returning a `path` array is a nice touch for breadcrumbs.
15. **`childCount` on every node — GOOD for chevron affordance.** Avoids fetching children just to decide if the expand chevron should show. ✅
16. **`reorderCategory` input — INCOMPLETE for the gap-allocation strategy (#2).** Current `ReorderCategoryInput { id, parentId, newOrder: Int! }` only supports "place at exact integer." For gap-allocated reordering, the mutation needs to handle "insert between A and B" semantics where the backend computes the new gap value, plus a `renumberSiblings(parentId)` companion mutation. **Fix:** redefine the input as `ReorderCategoryInput { id, beforeId?: ID, afterId?: ID, newParentId?: ID }` (positional, like Figma/Linear) and let the backend compute `order` — this is far more robust than sending a raw integer and survives concurrent reorders. Raise this contract change with Plan 5.
17. **Cursor vs offset pagination for `categoryTemplates` — unspecified.** §3.1 shows `categoryTemplatesQueryDocument` takes `paginationArgs` but does not say cursor-based or offset. Since this is a secondary list (templates in one category — likely <100), offset is acceptable, but **be consistent with Plan 08** which uses cursor-based. **Fix:** use the same `CertTemplateConnection` relay connection as Plan 08 so the same card/pagination components are reusable.

### E. Mobile vs Desktop — already covered in #11. ✅ Tier isolation is correctly enforced (no `useMediaQuery` in tier views; `ResponsiveViewSwitch` at container).

### F. State Management

18. **Zustand store scoping — CORRECT (§3.2).** Page-scoped `certificateCategoryStore`, holds tree UI state (expansion, selection, search, dialog flags), not Apollo data. ✅
19. **`Set<string>` in store + `persist` — KNOWN HAZARD, partially addressed.** §3.2 has a note: "If `persist` is used (sessionStorage), custom `merge` function reconstructs Sets." This is exactly the `frontend/common/stores/AGENTS.md` Serialization rule. **Strengthening (cross-ref Plan 08 #14):**
    - `expandedCategoryIds` (Set) should **survive tier switch** (in-memory, no `persist` needed — Zustand state is already in-memory across remounts within a SPA session, but **not** across a hard page refresh). The design's DD-04 says expansion state must survive tier switch — in-memory Zustand does this naturally. ✅
    - `fetchedCategoryIds` (Set) — this is **derived from Apollo cache** (a node's children query has been run if Apollo has cached results). Storing it in Zustand is **redundant** and risks drift from the cache. **Fix:** remove `fetchedCategoryIds` from the store; derive "has this node's children been fetched?" from `client.cache` (e.g. `client.cache.extract()[childrenQueryKey]` exists) or simply re-issue the query (Apollo dedupes via cache). This simplifies the store and removes a serialization concern.
20. **Optimistic updates — see #8.** Add to the store/update strategy.

### G. Security

21. **Permission gating — CORRECT (REQ-09-08).** App Router `requirePermissionForPage` + Container `<RequirePermission>` + hidden action buttons. ✅ Server-side `CERTIFICATES_CATEGORIES_MANAGE` check is the authority. Matches the verified `ResourcesContainer.tsx` pattern.
22. **Can a user *see* categories they can't *manage*?** REQ-09-08 implies view + manage are the SAME permission (`CERTIFICATES_CATEGORIES_MANAGE`). If a teacher should **browse** the category tree (for the Plan 8 filter) but not **edit** it, the view permission must be `CERTIFICATES_TEMPLATES_VIEW` (read) and only CRUD needs `CERTIFICATES_CATEGORIES_MANAGE`. **Fix:** split REQ-09-08 — page *view* requires `CERTIFICATES_TEMPLATES_VIEW` (so the filter dropdown and browse work), CRUD actions require `CERTIFICATES_CATEGORIES_MANAGE`. Currently a teacher cannot even *open* `/certificates/categories` to browse — likely too restrictive. Confirm the intended audience with the product owner.

### H. i18n

23. **i18n catalog — EXHAUSTIVE and correct (§4 in requirements.md).** 40+ keys with types, the `dialog.delete.hasTemplatesWarning(count)` pluralized in both 6-form AR and 2-form EN, interpolation params listed. ✅ Among the strongest parts of this plan.
24. **Permission-constant naming inconsistency — same as Plan 08 #18.** Plan 09 uses `CERTIFICATES_CATEGORIES_MANAGE`; Plan 08 uses `CERT_TEMPLATE_*`; Plan 07 uses `CERTIFICATES_TEMPLATES_MANAGE`. Standardize across all three against the actual `AppPermission` enum in the codebase.

### Key Fixes (applied to this design.md as recommendations; requirements.md/tasks.md should be updated to match)

- **F-09-1:** **(CRITICAL)** Fix the `order`-column reorder strategy (new DD): gap-allocated integers with renumber-on-close-gap, OR switch `ReorderCategoryInput` to positional `{ beforeId?, afterId?, newParentId? }`. Coordinate with Plan 5.
- **F-09-2:** Align REQ-09-07 prose with §3.1 — search is **server-side** via `categorySearch`, not in-memory tree flattening (which misses unloaded subtrees).
- **F-09-3:** Remove `fetchedCategoryIds` from the Zustand store; derive "fetched" from Apollo cache (simplifies store, removes a Set-serialization concern).
- **F-09-4:** Split REQ-09-08 view vs manage permissions — view = `CERTIFICATES_TEMPLATES_VIEW` (browse + filter), manage = `CERTIFICATES_CATEGORIES_MANAGE` (CRUD/reorder).
- **F-09-5:** Resolve soft-delete lifecycle: state explicitly in REQ-09-04 that `order` gaps are tolerated (no renumber on delete) and that deleted categories are filtered via `deletedAt IS NULL`; add restore/hard-delete to the scope table as out-of-scope (or a new REQ).
- **F-09-6:** Add optimistic-update design for move-template (in §3.2/§5.3 cache strategy).
- **F-09-7:** Standardize permission-constant naming across Plans 07/08/09 against the actual `AppPermission` enum.
- **F-09-8:** Coordinate with Plan 5: `reorderCategory` must return a structured `CYCLE_DETECTED` error with the offending descendant chain; `categoryTemplates` must reuse Plan 08's `CertTemplateConnection` (cursor-based) for component reuse; add a `categoryDescendants` query (or `materializedPath` column) to support Plan 08's "selecting a parent includes all descendants" filter.

### Reality-Check Corrections to the Plan's Own Claims

- The plan's existing Reality Check Notes (lines 589-591) corrected stray `frontend/stores/` references → `frontend/common/stores/`. ✅ Verified — no stale paths remain.
- Store file name `certificateCategoryStore.ts` (camelCase) matches verified siblings (`adminBillingStore.ts`, `dashboardStore.ts`). ✅
- sharedDocuments `sharedDocuments/cert/category-documents.ts` + barrel matches `sharedDocuments/AGENTS.md`. ✅ (Minor naming nit: §3.1 says the file is under `sharedDocuments/cert/` but doesn't name the file — Plan 08 names its file `template-list.documents.ts`; align Plan 09 to name `category.documents.ts` explicitly in the tasks.)
- i18n `dashboard/certificates/categories.namespace.ts` with handle `DashboardCertificatesCategories` matches the verified per-feature convention (`dashboard/subjects/main.namespace.ts`). ✅

### Remaining Risks

- **R-09-1:** The `order` integer strategy (#2) is the single biggest correctness risk — if implemented naively ("integer = midpoint of neighbors"), gap exhaustion breaks reorder after ~20 consecutive inserts between the same two siblings. Must be resolved **before** Plan 5 implements the mutation.
- **R-09-2:** Concurrent drag-and-drop reorder by two admins can interleave `order` writes; without optimistic concurrency (a `version`/`updatedAt` CAS on the category row) the second write silently wins. Add a `version` column to `certificate_categories` or use Postgres `xmin` for CAS in `reorderCategory` — flag to Plan 1/5.
- **R-09-3:** dnd-kit with nested `SortableContext` for arbitrary-depth trees has known limitations (deeply nested contexts can degrade drag performance). Cap the tested depth (e.g. 5 levels) in acceptance tests even though the data model allows unlimited depth.
- **R-09-4:** If `categorySearch` (§3.1) is not implemented by Plan 5, REQ-09-07 search falls back to in-memory filtering which silently misses unloaded subtrees — a correctness gap masquerading as "works fine in small trees."

---

## 12. Category Management Page (Enhanced Component Surface)

> This section catalogs the dedicated page-level components introduced for the Category Management experience. These are ADDITIVE to §4 (Component Hierarchy) — they do not replace any existing component. The file paths below use the verified tier-isolation pattern (`frontend/views/` for shared logic + `frontend/desktop/` / `frontend/mobile/` for tier views; see §4 and `frontend/views/AGENTS.md`).

### 12.1 CategoryManagementPage

- **Component**: `CategoryManagementPage` (container component; renders the Manage View Switcher per the §4 Mobile/Desktop tier isolation)
- **File**: `frontend/views/dashboard/cert/templates/categories/CategoryManagementPage.tsx`
- **Responsibility**: Top-level layout container for the Category Management page. Wires the page header and the two-column body; delegates tier-specific rendering to the desktop/mobile switcher described in §4.
- **Layout**:
  - **PageHeader**: Translated title "Template Categories" (`dashboard.certificates.categories.pageTitle`) and a "Create Category" primary button (gated by `CERTIFICATES_CATEGORIES_MANAGE` permission per REQ-09-08/F-09-4).
  - **Two-column layout** (desktop):
    - Left column (**30% width**): `CategoryTree` (MUI `TreeView`) — see §12.2.
    - Right column (**70% width**): `CategoryDetailPanel` — see §12.3.
  - On mobile: collapses to a single stacked column (tree → detail) per the §4 mobile tier; tree becomes an expandable card list and detail panel appears below the selected node.
- **Props**: `{ locale: string; canManage: boolean }` (locale from `getLocale()` server-side; `canManage` from `useHasPermission(AppPermission.CertificateCategoryManage)`).
- **State**: Reads `useCategoryStore()` (§12.5) for `selectedCategoryId`, `editorOpen`, `loading`, `error`. Passes selected category id to `CategoryDetailPanel`.
- **i18n**: Uses `useAppTranslation("dashboard.certificates.categories")` for all header, button, and empty-state strings. No hardcoded strings.

### 12.2 CategoryTree

- **Component**: `CategoryTree` (desktop tier view; mobile equivalent is `CategoryList.mobile.tsx` per §4/T15)
- **File**: `frontend/views/dashboard/cert/templates/categories/CategoryTree.tsx` (shared/ViewModel wrapper) with desktop tier view at `frontend/desktop/views/dashboard/cert/templates/categories/CategoryTree.desktop.tsx`
- **Features**:
  - **Expandable/collapsible nodes** via MUI `TreeView` + `TreeItem`. Expansion state (`expandedCategoryIds: Set<string>`) held in Zustand store (§12.5) so it survives tier switch (DD-04/F-09-3).
  - **Each node renders**: category icon (`CategoryAvatar` from §4/T10), name, template count badge (from `category.templateCount` via `childCount`-style field on the GraphQL fragment), and an active/inactive indicator (green dot for `isActive`, grey for archived).
  - **Right-click context menu** (desktop only): Edit, Add Subcategory, Move, Archive, Delete. Menu items gated by `canManage`; system categories disable Delete (per §12.5 `isSystem` flag).
  - **Drag-and-drop**: reorder categories and move subcategories between parents via `@dnd-kit` nested `SortableContext` (per §5/Desktop Drag-and-Drop Design). Drop targets compute `beforeId`/`afterId`/`newParentId` for the positional `reorderCategory` mutation (F-09-1). Mobile tier disables drag-and-drop (REQ-09-12).
  - **Selected node** applies MUI selected styling (theme `primary.main` background tint) and calls `useCategoryStore.selectCategory(id)` which loads the detail in the right panel.
  - **System categories** (Academic, Achievement, Completion, Participation): locked — Delete and Archive actions are disabled; the `isSystem` flag from the GraphQL category type drives the UI lock. Custom categories: full CRUD enabled when `canManage`.
- **Props**: `{ categories: Category[]; selectedId: string | null; canManage: boolean; onNodeSelect: (id: string) => void; onNodeEdit: (category: Category) => void; onNodeAddSub: (parentId: string) => void; onNodeMove: (id: string) => void; onNodeArchive: (id: string) => void; onNodeDelete: (id: string) => void; onReorder: (id: string, beforeId?: string, afterId?: string, newParentId?: string) => void }`.
- **Accessibility**: Keyboard navigable via `TreeView` arrow keys; context menu reachable via `Shift+F10` per WCAG 2.1.

### 12.3 CategoryDetailPanel

- **Component**: `CategoryDetailPanel`
- **File**: `frontend/views/dashboard/cert/templates/categories/CategoryDetailPanel.tsx`
- **Sections**:
  1. **Category Info Card**:
     - **Icon picker** — small grid of MUI icons to choose/change the category icon; reuses the `IconPicker` component from §4/T10 (shared constants in `shared/constants/certificate-category-icons.ts`). Read-only when `!canManage`.
     - **Name** — editable `TextField` (inline edit via `InlineEditableLabel` from §4/T10; double-click to edit, Enter to save, Escape to cancel). Read-only when `!canManage`.
     - **Description** — editable `TextField`, `multiline`, rows 3. Read-only when `!canManage`.
     - **Parent Category** — `Select` of existing categories, nullable (null = root). Excludes self + descendants (cycle prevention via `descendantIds` per AC-08). Read-only when `!canManage`.
     - **Active toggle** — `Switch` bound to `category.isActive`. Disabled when `!canManage` or when `category.isSystem` (system categories cannot be deactivated).
  2. **Template Count Card**:
     - **Total templates**: number with `DescriptionOutlined` icon (from `@mui/icons-material`).
     - **Published**: number with `CheckCircle` icon.
     - **Drafts**: number with `Edit` icon.
     - **Archived**: number with `Archive` icon.
     - Counts sourced from the `Category.templateCount` aggregate (could be a sub-field broken down by status, depending on Plan 5 GraphQL enrichment; if not available, fetch via `categoryTemplates` query with per-status filters).
  3. **Templates in Category**:
     - **MUI `List`** with each item rendering: template thumbnail (small — 32x32 preview via the existing template thumbnail component/list from Plan 08), name, status badge (`StatusBadge` per AC-19), and last-modified timestamp (formatted with `Intl.DateTimeFormat(locale)`).
     - **Click** on a template item navigates to the Template Editor (Plan 10) via `next/navigation` `useRouter().push(\`/dashboard/cert/templates/\${templateId}\`)`.
     - **"View All"** link routes to the Plan 08 template list filtered by this category: `useRouter().push(\`/dashboard/cert/templates?category=\${category.id}\`)` (cross-link to §12.6 category-based filtering).
- **Empty State**: When `selectedId === null`, display a translated empty-state illustration card inviting the user to select a category from the tree.
- **Props**: `{ category: Category | null; canManage: boolean; onFieldChange: (field: keyof Category, value: string | boolean) => void }`.
- **i18n**: All labels, hints, and empty-state copy via `useAppTranslation("dashboard.certificates.categories")`.

### 12.4 CategoryEditorDialog

- **Component**: `CategoryEditorDialog`
- **File**: `frontend/views/dashboard/cert/templates/categories/CategoryEditorDialog.tsx`
- **Purpose**: Unified create/edit dialog (replaces the separate `CreateCategoryDialog` + `EditCategoryDialog` from §4 with a single canonical component that dispatches on whether `category` is null). NOTE: this is ADDITIVE — if §4 still references separate dialogs, those remain valid for backwards compatibility; the canonical new component is the unified dialog.
- **Props**: `{ open: boolean; category: Category | null; onClose: () => void; onSave: (input: CategoryInput) => Promise<void> }` — when `category` is `null`, the dialog operates in **create mode**; when `category` is non-null, it operates in **edit mode** (pre-fills fields).
- **Form fields**:
  - **Name** (`TextField`, required, `maxLength={50}`, helper text showing `{used}/50` counter; must be unique among siblings of the chosen parent — uniqueness enforced via a debounced lookup or on-submit validation referencing the `categorySearch` query).
  - **Description** (`TextField`, `multiline`, `rows={3}`, `maxLength={200}`, helper text with `{used}/200` counter; required for edit mode, optional in create mode).
  - **Parent Category** (`Select`/`Autocomplete` of existing categories, nullable; null = root). Excludes self + descendants in edit mode (cycle prevention per AC-08). Repeat-pick not allowed (the parent cannot be the same as the category being edited).
  - **Icon picker** (grid of 15-20 MUI icons from `shared/constants/certificate-category-icons.ts`; selected icon highlighted with a theme `primary` border; reuses `IconPicker` from §4/T10).
  - **Color picker** (`ColorSwatchPicker` from §4/T10; 8-10 preset colors from `shared/constants/certificate-category-colors.ts` + a custom color option via MUI `ColorPicker`/native `<input type="color">`; no hardcoded hex values — presets come from the shared constant).
  - **Display Order** (`TextField` type `number`, for manual sorting within the chosen parent; defaults to appending at the end i.e. `(maxSiblingOrder ?? 0) + 10`).
  - **Active** (`Switch`, default `true`).
- **Validation rules**:
  - Name is required (non-empty after trim).
  - Name must be unique within the same parent level (case-insensitive). If Plan 5 exposes a `categoryNameAvailable(name, parentId, excludeId?)` query, use it; otherwise validate client-side against the loaded tree and surface server `DUPLICATE_NAME` errors as a translated field error.
  - Display order must be a non-negative integer.
  - Parent cannot form a cycle (enforced by excluding self + descendants per AC-08).
- **Save action**: Calls `onSave` with the assembled `CategoryInput`. On success, the dialog closes and the `CategoryTree` refreshes (tree re-fetches affected siblings via Apollo cache update / `categoryList` refetch). On failure, server errors (`CYCLE_DETECTED`, `DUPLICATE_NAME`) map to translated field errors via the i18n error catalog (§10).
- **i18n**: All field labels, helper texts, validation messages, dialog actions (Cancel/Save) via `useAppTranslation("dashboard.certificates.categories")`. Plural/interpolation helpers per §10.

### 12.5 Zustand Category Store

- **Store hook**: `useCategoryStore`
- **File**: `frontend/common/stores/certificateCategoryStore.ts` (camelCase per §F/reality-check notes — matches verified sibling `adminBillingStore.ts`). ADDITIVE to §3.2 store design; if §3.2 already defines store fields, this is the canonical full interface surface.
- **State shape** (`CategoryState`):

```typescript
interface CategoryState {
  categories: Category[];
  selectedCategoryId: string | null;
  editorOpen: boolean;
  editingCategory: Category | null;
  loading: boolean;
  error: string | null;
  // UI state
  expandedCategoryIds: Set<string>;
  searchTerm: string | null;
  // Actions
  loadCategories: () => Promise<void>;
  selectCategory: (id: string | null) => void;
  openEditor: (category: Category | null) => void;  // null = create mode
  closeEditor: () => void;
  saveCategory: (input: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  moveCategory: (id: string, newParentId: string | null, beforeId?: string, afterId?: string) => Promise<void>;
  archiveCategory: (id: string, archive: boolean) => Promise<void>;
  toggleExpansion: (id: string) => void;
  setExpanded: (ids: string[]) => void;
  setSearchTerm: (term: string | null) => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  icon: string;           // MUI icon name from shared/constants/certificate-category-icons.ts
  color: string;          // hex color from shared/constants/certificate-category-colors.ts (no hardcoded values)
  displayOrder: number;
  isActive: boolean;
  isSystem: boolean;      // system categories (Academic, Achievement, Completion, Participation) cannot be deleted or archived
  templateCount: number;  // aggregate; may be enriched with per-status breakdown
}

interface CategoryInput {
  name: string;
  description: string;
  parentId: string | null;
  icon: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
}
```

- **Persistence**: No `persist` middleware needed for expansion/selection (in-memory Zustand survives tier switch within a SPA session per DD-04). If `persist` is later added, a custom `merge` must reconstruct `Set<string>` from arrays (per `frontend/common/stores/AGENTS.md` serialization rule, F-09-3).
- **Apollo integration**: `categories` are NOT cached in Zustand as the source of truth — they come from Apollo (via `categoryList` query, see §7 API Surface). Zustand holds only UI state (selection, expansion, dialog flags, search term) + transient loading/error for the currently-selected category's optimistic updates. `fetchedCategoryIds` is NOT stored in Zustand (per F-09-3) — derive "has children been fetched?" from Apollo cache.
- **Actions**: Wrap Apollo mutations (`createCategory`, `updateCategory`, `deleteCategory`, `reorderCategory`) with optimistic updates per F-09-6; on failure, roll back via Apollo `client.cache.evict`/`restore`.

### 12.6 Category-Based Filtering Integration (Plan 08)

- **Integration point**: This plan integrates with Plan 08 (Template List) via **shared Zustand state** and **URL sync**, NOT by duplicating Plan 08's filter component.
- **Behavior**:
  - When a user selects a category in the `CategoryTree` (§12.2), the `useCategoryStore.selectCategory(id)` sets `selectedCategoryId`.
  - The Plan 08 template list reads `selectedCategoryId` (via `useCategoryStore`) and filters templates by that category — both when the user is on the categories page AND when they cross-link from "View All" (§12.3).
  - **URL sync**: Selecting a category updates the URL to `/dashboard/cert/templates?category=<id>` (using `useRouter().replace` with `scroll: false`). On mount, the categories page reads `searchParams.get("category")` and calls `selectCategory` if present, so deep-linking works.
  - **Plan 08 FilterBar**: The existing Plan 08 FilterBar renders a "Category" filter chip group (category chips) whose options come from `useCategoryStore.categories`. Active chip = `selectedCategoryId`. Clicking a chip updates both stores + URL. Clearing the chip filter clears `selectedCategoryId` and updates URL to the bare path.
  - **Cross-link from CategoryDetailPanel "View All"** (§12.3) navigates to `/dashboard/cert/templates?category=<id>`, which is the Plan 08 list with the category pre-filtered.
- **Data contract with Plan 08**: Plan 08's `CertTemplateConnection` relay connection (AC-17/cursor-based, R-09-2 alignment) and the `categoryTemplates` query (§7) reuse the same connection shape so the Plan 08 card/pagination components render template lists within `CategoryDetailPanel` (§12.3) without duplication.
- **No build-time coupling**: Both plans read from the same `certificateCategoryStore`; no direct import of Plan 08 components is required for Plan 09 to function (only the cross-page link).

---

## 13. Round 4 Enhancement — Production Hardening

> This section catalogs production-hardening, edge-case, and completeness enhancements identified after the Round 1–3 review (§1–§12). Each subsection below is ADDITIVE — it extends the existing component surface (§12) and store (§12.5) with additional fields, behaviors, and error/edge-case handling. No existing design is replaced; all cross-refs point back to the original section numbers.

### 13.1 Drag-Drop Edge Cases

The §12.2/§5 drag-and-drop design covers the happy path (reorder siblings, move child to new parent). Production requires handling the following edge cases:

1. **Drop on root**: When a node is dropped outside any `TreeItem` (i.e. on the `TreeView` background), it becomes a root-level node (`newParentId = null`). The `Dropzone` overlay renders at the bottom of the tree, styled with `sx={{ border: '2px dashed', borderColor: 'primary.main', borderRadius: 1, p: 2, opacity: 0 → 1 transition }}`. The `onReorder` callback receives `{ id, beforeId: undefined, afterId: undefined, newParentId: null }`.

2. **Circular reference prevention (client-side)**: Before dispatching the `reorderCategory` mutation, the client checks whether the `newParentId` is a descendant of the dragged node (`id`). The descendant set is computed from the in-memory tree via a depth-first traversal of the `categories` array filtered by `parentId === current`. If `newParentId ∈ descendantIds`, the drop is **rejected locally** with a translated inline error (`dashboard.certificates.categories.errors.cycleDetected`). No mutation is sent. The server-side `CYCLE_DETECTED` error (F-09-8) remains the authoritative check, but this prevents a wasted round-trip and gives immediate visual feedback.

3. **Multi-level drag (parent → child)**: Dragging a node that has children moves the entire subtree. The `@dnd-kit` `DndContext` `onDragEnd` handler checks `active.data.current?.type === 'category'` and includes all child IDs in the optimistic update — the store's `moveCategory` action updates `parentId` for the dragged node AND all descendants (their `parentId` chains remain unchanged relative to the dragged node, but the entire subtree's Apollo cache entries are invalidated to force refetch on next expand). A visual "subtree drag preview" (§13.1.4) renders a count badge showing N children being moved.

4. **Drag preview ghost**: The default `@dnd-kit` `DragOverlay` renders a semi-transparent clone of the dragged node. Enhanced overlay: custom `DragPreviewGhost` component at `frontend/views/dashboard/cert/templates/categories/DragPreviewGhost.tsx` renders the node icon + name + `(N children)` badge when the node has descendants. Styles: `sx={{ opacity: 0.8, bgcolor: 'background.paper', border: 1, borderColor: 'primary.main', borderRadius: 1, px: 1.5, py: 0.5, boxShadow: 3 }}`.

5. **Invalid drop zone visual feedback**: When a drop target is detected as invalid (cycle, system category as target, or `!canManage`), the target `TreeItem` renders with a red dashed border + a small `BlockOutlined` icon overlay. The feedback is driven by `onDragOver` computing `canDrop` and storing it in the store as `invalidDropTargetId: string | null`. Styles: `sx={{ border: '2px dashed', borderColor: 'error.main', position: 'relative' }}` with `<BlockOutlinedIcon sx={{ position: 'absolute', top: 4, right: 4, color: 'error.main', fontSize: 16 }} />`.

6. **Touch device support**: `@dnd-kit` touch sensors (`PointerSensor` with `activationConstraint: { distance: 8 }`) are enabled. On mobile tier (§4), drag-and-drop is explicitly **disabled** per REQ-09-12 — the mobile `CategoryList.mobile.tsx` renders without `DndContext`. On tablets (width ≥ 768 and < 1024), drag is enabled via `PointerSensor` but with a long-press activation constraint (`activationConstraint: { delay: 200, tolerance: 5 }`) to avoid accidental drags during scroll.

7. **Drag cancel (Esc)**: A `useEffect` listener on `keydown` event (key `Escape`) calls `DndContext.cancel()` which aborts the current drag, clears `activeDragId`, and removes all visual drop-target overlays. The store tracks `isDragging: boolean` and the cancel handler resets it to `false`.

### 13.2 Multi-Select Category Operations

1. **Checkbox selection in tree**: Each `TreeItem` renders an `MuiCheckbox` (only when `canManage` is `true`) positioned before the tree item label via `TreeItem`'s `icon` slot. Checkbox state controlled by `selectedCategoryIds: Set<string>` in the store. Clicking a checkbox toggles membership in the set without changing `selectedCategoryId` (the detail-panel selection). Styles: `sx={{ p: 0.5, '&:hover': { bgcolor: 'action.hover' } }}`.

2. **Bulk move to parent**: A "Move Selected…" button in the `CategoryManagementPage` header (visible when `selectedCategoryIds.size > 0`) opens a `Dialog` with an `Autocomplete` of valid parent categories (excludes any selected IDs and their descendants). On confirm, dispatches `bulkReorderCategories` Apollo mutation (new mutation — see §13.2.6) with `{ ids: [...selectedCategoryIds], newParentId }`. The store optimistically updates all selected nodes' `parentId` and clears the selection on success.

3. **Bulk delete with cascade warning**: When `selectedCategoryIds.size > 0`, a "Delete Selected" button (color `error`) opens a confirmation `Dialog` showing: total count of selected categories, total cascaded subcategories ("This will also delete N subcategories"), and total templates ("M templates will be orphaned — they will be moved to the root 'Uncategorized'"). The warning uses `List` items with `WarningAmberOutlined` icon per entity type. On confirm, dispatches `bulkDeleteCategories` mutation.

4. **Bulk assign templates**: When categories are selected, a "Assign Templates…" button opens a `Dialog` with a searchable `Autocomplete` of templates (from `templateList` query — Plan 08) to bulk-assign to the selected categories. Uses `bulkAssignTemplatesToCategories` mutation.

5. **Shift+click range select**: Clicking a checkbox, then shift+clicking another checkbox at the same tree level selects all siblings between them (inclusive). The store's `toggleRangeSelect(fromId, toId)` action walks the flattened sibling list and adds all IDs between. The range is computed from the parent's children as ordered in the in-memory tree.

6. **New Apollo mutations**:
   - `BulkReorderCategoriesDocument` — `{ ids: [ID!]!, newParentId: ID, beforeId: ID, afterId: ID }`
   - `BulkDeleteCategoriesDocument` — `{ ids: [ID!]!, orphanTemplates: Boolean! }`
   - `BulkAssignTemplatesToCategoriesDocument` — `{ assignments: [{ templateId: ID!, categoryId: ID! }]! }`
   - These live in `frontend/common/graphql/sharedDocuments/cert/category-documents.ts` (additive to §3.1).

7. **Store additions** (`certificateCategoryStore.ts` — extends §12.5 `CategoryState`):
   ```typescript
   // Multi-select additions
   selectedCategoryIds: Set<string>;
   toggleCategorySelected: (id: string) => void;
   toggleRangeSelect: (fromId: string, toId: string) => void;
   clearSelection: () => void;
   selectAll: () => void;
   // Bulk actions
   bulkMoveToParent: (newParentId: string | null) => Promise<void>;
   bulkDelete: (orphanTemplates: boolean) => Promise<void>;
   bulkAssignTemplates: (assignments: Array<{ templateId: string; categoryId: string }>) => Promise<void>;
   ```

### 13.3 Loading & Skeleton States

1. **Tree skeleton with placeholder branches**: When `loading` is `true` (initial `categoryList` query in-flight), the tree renders `SkeletonTreeItem` components — 5–8 placeholder branches with varying widths (simulating realistic tree structure). Each skeleton item: `<Skeleton variant="rounded" width={random(40, 80)}% height={36} sx={{ animationDuration: '1.2s' }} />` with indentation levels (1–3 depth). The skeleton uses MUI `Skeleton` with `sx={{ ml: 2 * depth }}` to simulate tree indent.

2. **Detail panel skeleton**: When a category is selected but the `categoryDetail` query is in-flight (or after optimistic selection before server data arrives), `CategoryDetailPanel` renders skeleton cards: a `Skeleton` for the icon (circle, 56px), name (text, 60% width), description (text, 3 lines), and template count metrics (3 skeleton boxes in a `Stack` direction `row`). Uses `Skeleton variant="text"` and `variant="circular"`.

3. **Editor dialog skeleton**: Not needed — the dialog creates/edits immediately; there is no loading state between open and form render. (Removed from scope — a skeleton is meaningless when the form is client-side assembled.)

4. **Progressive loading per tree level**: The §12.2 lazy-expand design loads children on expand via `categoryList(parentId)`. The skeleton renders per-level: when a node is expanded and its children query is in-flight, the node shows 3 `SkeletonTreeItem` children beneath it (indented one level deeper) until the query resolves. The `onNodeToggle` handler sets `loadingChildrenForId` in the store, and `CategoryTree` checks this to render skeletons vs real children.

### 13.4 Empty States

All empty states use MUI `IllustrationCard` (or `Box` + `Typography` + `Button`) — no external illustration assets; use MUI `SvgIcon` placeholders.

1. **No categories**: When `categories.length === 0` and `loading === false`, the tree area renders an empty-state card: `<SvgIcon component={CategoryOutlined} sx={{ fontSize: 64, color: 'text.disabled' }} />`, a translated heading (`dashboard.certificates.categories.empty.noCategories.title`), a sub-text (`dashboard.certificates.categories.empty.noCategories.subtitle`), and a CTA button "Create Your First Category" (`ContainedButton` with `canManage` gating). Styles: `sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}`.

2. **No subcategories**: When a node is expanded and its children query returns an empty array, render an inline `Typography` "No subcategories" (`dashboard.certificates.categories.empty.noSubcategories`) with a "+ Add Subcategory" text button (if `canManage`).

3. **No templates in category**: In `CategoryDetailPanel` §2 (Templates in Category), when the template list is empty, render `<SvgIcon component={FolderOpenOutlined} sx={{ fontSize: 48, color: 'text.disabled' }} />` + "No templates in this category yet" + a "Browse Templates" link button that navigates to Plan 08 template list.

4. **Filtered empty with reset button**: When `searchTerm` is non-empty or a filter is active and the resulting tree is empty, render "No categories match your filters" + a "Reset Filters" `TextButton` that calls `clearFilters()` (clears `searchTerm`, `colorFilter`, `templateCountFilter`, `dateFilter`).

### 13.5 Error Boundaries

1. **Tree load error with retry**: When the `categoryList` query returns an error (network or server), the tree area renders an error card: `<SvgIcon component={CloudOffOutlined} sx={{ fontSize: 48, color: 'error.main' }} />` + translated "Failed to load categories" + a "Retry" `Button` that calls `loadCategories()` (re-fetches via Apollo `refetch`). The error message comes from the i18n error catalog (`dashboard.certificates.categories.errors.loadFailed`).

2. **Node save error with inline message**: When `saveCategory` or `deleteCategory` fails, the `CategoryEditorDialog` or `CategoryDetailPanel` renders an inline `Alert` (`severity="error"`) at the top of the dialog/panel with the translated error message. Dismissible via `onClose`. The error is held in `store.saveError: string | null` and cleared on next action.

3. **Optimistic update rollback**: Per F-09-6, optimistic updates write to Apollo cache immediately. On mutation failure, the rollback uses `client.cache.evict({ id: category.cacheId })` + `client.cache.gc()` to remove the optimistic entry, then refetches `categoryList` to restore server truth. The store sets `error` and the tree reverts to the pre-mutation state. A transient `Alert` snackbar (3s auto-hide) shows "Changes reverted — server error."

4. **Network reconnect auto-sync**: A `useOnlineStatus` hook (from `frontend/common/hooks/useOnlineStatus.ts`) monitors `navigator.onLine` + `online`/`offline` window events. On reconnect (`online` event after `offline`), the store calls `loadCategories()` (refetch) and clears any `error` state. An inline status chip ("Reconnecting…" → "Connected") renders in the page header during the re-fetch.

### 13.6 Tree Virtualization

1. **react-window integration for > 500 nodes**: When the flattened (visible) tree node count exceeds 500, the `CategoryTree` desktop tier switches from MUI `TreeView` rendering to a `react-window` `FixedSizeList`. A custom `TreeNode` wrapper renders each visible row with correct indentation. The threshold check: `if (visibleNodeCount > 500) <VirtualizedTree /> else <CategoryTreeTreeView />`. The `FixedSizeList` uses `itemSize={36}` (single tree item height) and `width="100%"` with `height` from the container's `useRef` measured height.

2. **Expand/collapse performance**: Expanding/collapsing a large node (> 200 children) triggers the virtualized list's `scrollToIndex` to keep the expanded node in view. The flattened tree is recomputed via a `useMemo` that walks the visible (expanded) nodes — the memo recomputes only when `expandedCategoryIds` or `categories` changes.

3. **Lazy load children on expand**: Already in §12.2 — children are fetched via `categoryList(parentId)` on first expand. The virtualized list renders skeleton rows (§13.3.4) while the query is in-flight, then replaces with real nodes on resolution. The `FixedSizeList` count updates dynamically.

4. **Virtual scroll with tree indent preservation**: Each virtualized row stores its `depth` (derived from parent chain). The row renders `sx={{ pl: depth * 2 }}` (matching the non-virtualized `TreeView` indent). The expand/collapse chevron is rendered at the correct depth position. A custom `ListItemText` with `secondaryAction` pattern handles the depth-based indentation without breaking virtualization (no portal / offset parent required — pure padding).

### 13.7 Search & Filter

1. **Category name search with debounce**: A `TextField` in the page header (or a `SearchBar` component) with `placeholder` = "Search categories…". Input is debounced by 300ms via a `useDebouncedValue` hook. The debounced value is stored in `store.searchTerm` and triggers a re-filter of the visible tree. For server-side search (per F-09-2), `searchTerm` triggers the `categorySearch` query (§3.1) when the term is ≥ 2 characters. Results replace the tree content; highlighted matches use `<mark>` with `sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 0.5 }}`.

2. **Filter by template count**: A `Select` with options: "All", "Has templates", "No templates", "More than 10 templates". Stored in `store.templateCountFilter: 'all' | 'has' | 'none' | '10plus'`. Applied client-side against each node's `templateCount`.

3. **Filter by date modified**: A `Select` with "All", "Modified today", "Modified this week", "Modified this month". Stored in `store.dateFilter: 'all' | 'today' | 'week' | 'month'`. Applied client-side against `category.updatedAt` (requires the GraphQL type to expose `updatedAt: DateTime`).

4. **Filter by color tag**: A row of color swatch filter buttons (reusing `ColorSwatchPicker` from §4/T10 read-only mode). Clicking a color sets `store.colorFilter: string | null`. Applied client-side against `category.color`.

5. **Search result highlighting**: When `searchTerm` is active, any node whose name contains the term renders the name with the matching substring wrapped in `<mark>` (see §13.7.1). The `highlightMatch` helper (`frontend/views/dashboard/cert/templates/categories/highlightMatch.ts`) takes `(text: string, term: string)` and returns `ReactNode[]` with plain text segments and `<mark>`-wrapped segments.

6. **Clear search button**: The search `TextField` adorned with an `InputAdornment` `IconButton` (`CloseOutlined`) that clears `searchTerm` and resets the tree to full visibility. Visible only when `searchTerm` is non-empty.

### 13.8 Accessibility

1. **Tree role/aria-expanded/aria-level/aria-selected**: MUI `TreeView` + `TreeItem` natively provide `role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-level`, `aria-selected`. The virtualized variant (§13.6) must manually set these attributes on each `TreeNode` row: `role="treeitem"`, `aria-level={depth}`, `aria-expanded={hasChildren && isExpanded}`, `aria-selected={selectedCategoryId === id}`. The container gets `role="tree"`.

2. **Keyboard navigation**: Tab focuses the tree; Arrow Up/Down moves between siblings; Arrow Right/Left expands/collapses; Enter selects (loads detail panel); Space toggles expansion. System categories with locked actions announce "disabled" via `aria-disabled`. The context menu opens via `Shift+F10` (per §12.2).

3. **JAWS/NVDA compatibility**: Test with JAWS 2024+ and NVDA 2024+ during the T27/T28 test phases. All interactive elements must have `aria-label` or visible label text. The tree's `aria-label` = translated "Category Tree". The detail panel `aria-live="polite"` so screen readers announce content changes when a new category is selected.

4. **Focus management on expand/collapse**: When a node is expanded, focus stays on the node (not moved to first child). When collapsed, focus stays on the node. Arrow Down after expand moves to first child. This matches the WAI-ARIA Tree Pattern.

5. **Announcement of tree position**: Each `TreeItem` can include `aria-describedby` pointing to a visually-hidden `Typography` with text like "Level 2, position 3 of 5, expanded, has 3 children." This is generated from `depth`, `indexInSiblings`, `siblingCount`, `hasChildren`, and `isExpanded` via a helper `getTreeItemDescription(node, depth, index, siblings)`.

### 13.9 Responsive

Already partially covered in §4/§11.6 and §12.1. This subsection documents the explicit breakpoint behavior:

1. **Mobile (< 768px)**: Tree renders as an `Accordion` (MUI `Accordion` + `AccordionSummary` + `AccordionDetails`) — each root category is an accordion panel; subcategories are nested accordion panels (one level deep visible, deeper via tap to navigate). The detail panel renders as a MUI `BottomSheet` (via `@mui/material` `SwipeableDrawer` with `anchor="bottom"` and `sx={{ borderRadius: '16px 16px 0 0' }}`.

2. **Tablet (768px–1023px)**: Side-by-side layout — tree (40%) + detail panel (60%) in a `Stack` direction `row`. Drag-and-drop enabled via `PointerSensor` with long-press activation (§13.1.6).

3. **Desktop (≥ 1024px)**: 3-panel layout — tree (25%, resizable), detail panel (40%, resizable), template list (35%, resizable). Panel widths stored in `store.panelWidths: { tree: number; detail: number; templates: number }` and persisted to `sessionStorage` (with `merge` that preserves `Set` fields). Resizable via MUI `Divider` with `sx={{ cursor: 'col-resize', width: 4 }}` + pointer drag handlers.

### 13.10 Color Tag System

1. **Color picker for categories**: `ColorSwatchPicker` component (§4/T10) renders 8 preset colors from `shared/constants/certificate-category-colors.ts` (no hardcoded hex values — the shared constant is the single source). A "Custom" button opens a native `<input type="color">` as a popover, allowing any hex value. Selected color drives `category.color` and the tree node's icon background.

2. **Color legend**: A collapsible `Box` below the tree (or in the filter area) showing all 8 preset colors with labels. Helps users identify color meaning at a glance. Renders as `Stack` direction `row" spacing={1}` of small `Box` + `Typography` pairs.

3. **Filter by color**: Per §13.7.4 — color swatch filter buttons in the filter bar.

4. **Color accessibility (color-blind safe palette)**: The 8 preset colors are chosen from the Wong color-blind safe palette (blue #0072B2, orange #E69F00, green #009E73, yellow #F0E442, red #D55E00, purple #CC79A7, sky-blue #56B4E9, grey #999999) — but stored as named constants in `shared/constants/certificate-category-colors.ts` with semantic names (`COLOR_BLUE`, `COLOR_ORANGE`, etc.), not raw hex. The palette ensures distinguishability for deuteranopia, protanopia, and tritanopia.

5. **High contrast mode**: When the user's system or the app theme is in high-contrast mode (`prefers-contrast: more`), the color swatches render with a black border (`sx={{ border: 2, borderColor: 'text.primary' }}`) and the tree node color is accompanied by a text label of the color name (never color alone as an indicator — WCAG 1.4.1).

### 13.11 Audit & History

1. **Category creation/edit/delete audit log**: Every `createCategory`, `updateCategory`, `deleteCategory`, and `reorderCategory` mutation writes an audit entry to a new `category_audit_log` table. The entry includes `{ id, categoryId, action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER' | 'MOVE', userId, timestamp, beforeData: JSONB, afterData: JSONB }`. This requires coordination with Plan 1 (schema) and Plan 5 (mutations).

2. **Who changed what, when**: A "History" tab in `CategoryDetailPanel` renders a `Timeline` (MUI `Timeline` + `TimelineItem`) of audit entries for the selected category. Each entry shows the user avatar/name, action icon, timestamp (formatted via `Intl.DateTimeFormat(locale)`), and a diff summary ("Name: 'Academic' → 'Academic Excellence'"). Data fetched via a new `categoryAuditLog(categoryId)` query.

3. **Undo within 30s**: After a delete or move, a transient `Snackbar` with "Undo" button appears for 30 seconds. Clicking "Undo" calls a `restoreCategory(id)` or `undoMoveCategory(id)` mutation (soft-undo — the audit log stores `beforeData` and the undo applies it). After 30s, the Snackbar auto-hides and the action becomes permanent. The timer is managed by `setTimeout` in the store, cleared on unmount.

4. **Category merge history**: When categories are merged (a potential future operation — not in current scope but the audit log schema should support it with `action: 'MERGE'` and `afterData` containing the surviving category ID), the history timeline shows "Merged from X into Y." This is a forward-compatible design note — merge is NOT implemented in this round.

### 13.12 Performance Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Tree render per node | < 16ms | React Profiler (`useRenderTime` hook in test) |
| Expand/collapse (500 children) | < 100ms | `performance.now()` around `onNodeToggle` |
| API response (`categoryList`) | < 200ms | Apollo `link` request/response timing |
| Bundle (category page chunk) | < 40KB gzipped | Next.js build report (`firstLoadJot`) |
| Drag start → ghost render | < 50ms | `@dnd-kit` `onDragStart` → `DragOverlay` mount |
| Search debounce → results | < 300ms (debounce) + < 200ms (query) | Combined end-to-end |
| Virtualized tree scroll (1000 nodes) | 60fps | Chrome DevTools Performance tab |

These budgets are enforced via:
- **Component tests** (T27): each test includes a render-time assertion (less than budget for the given node count).
- **E2E tests** (T28): the drag-drop spec includes a timing assertion on `reorderCategory` mutation round-trip.
- **Build verification** (T29): `bun run build` output chunk size is checked for the `_app/dashboard/cert/templates/categories` route — must be under 40KB gzipped.

### 13.13 Store Expansion Summary (Round 4)

The full `CategoryState` after Round 4 additions (extends §12.5):

```typescript
interface CategoryState {
  // --- Existing (§12.5) ---
  categories: Category[];
  selectedCategoryId: string | null;
  editorOpen: boolean;
  editingCategory: Category | null;
  loading: boolean;
  error: string | null;
  expandedCategoryIds: Set<string>;
  searchTerm: string | null;
  // Existing actions...
  loadCategories: () => Promise<void>;
  selectCategory: (id: string | null) => void;
  openEditor: (category: Category | null) => void;
  closeEditor: () => void;
  saveCategory: (input: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  moveCategory: (id: string, newParentId: string | null, beforeId?: string, afterId?: string) => Promise<void>;
  archiveCategory: (id: string, archive: boolean) => Promise<void>;
  toggleExpansion: (id: string) => void;
  setExpanded: (ids: string[]) => void;
  setSearchTerm: (term: string | null) => void;

  // --- Round 4 additions ---
  // Drag-drop
  isDragging: boolean;
  activeDragId: string | null;
  invalidDropTargetId: string | null;
  loadingChildrenForId: string | null;
  // Multi-select
  selectedCategoryIds: Set<string>;
  toggleCategorySelected: (id: string) => void;
  toggleRangeSelect: (fromId: string, toId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  bulkMoveToParent: (newParentId: string | null) => Promise<void>;
  bulkDelete: (orphanTemplates: boolean) => Promise<void>;
  bulkAssignTemplates: (assignments: Array<{ templateId: string; categoryId: string }>) => Promise<void>;
  // Filters
  templateCountFilter: 'all' | 'has' | 'none' | '10plus';
  dateFilter: 'all' | 'today' | 'week' | 'month';
  colorFilter: string | null;
  setTemplateCountFilter: (v: CategoryState['templateCountFilter']) => void;
  setDateFilter: (v: CategoryState['dateFilter']) => void;
  setColorFilter: (v: string | null) => void;
  clearFilters: () => void;
  // Error states
  saveError: string | null;
  clearError: () => void;
  isOnline: boolean;
  // Responsive
  panelWidths: { tree: number; detail: number; templates: number };
  setPanelWidth: (panel: keyof CategoryState['panelWidths'], width: number) => void;
}
```

### 13.14 New Components Summary (Round 4)

| Component | File | Tier | Purpose |
|-----------|------|------|---------|
| `DragPreviewGhost` | `frontend/views/dashboard/cert/templates/categories/DragPreviewGhost.tsx` | Desktop | Custom drag overlay with child count badge |
| `SkeletonTreeItem` | `frontend/views/dashboard/cert/templates/categories/SkeletonTreeItem.tsx` | Shared | Loading skeleton for tree rows |
| `VirtualizedTree` | `frontend/desktop/views/dashboard/cert/templates/categories/VirtualizedTree.desktop.tsx` | Desktop | react-window virtualized tree for >500 nodes |
| `CategoryHistoryTimeline` | `frontend/views/dashboard/cert/templates/categories/CategoryHistoryTimeline.tsx` | Shared | Audit log timeline in detail panel |
| `CategoryFilterBar` | `frontend/views/dashboard/cert/templates/categories/CategoryFilterBar.tsx` | Shared | Search + filter controls |
| `highlightMatch` | `frontend/views/dashboard/cert/templates/categories/highlightMatch.ts` | Shared | Text highlight helper for search |
| `useOnlineStatus` | `frontend/common/hooks/useOnlineStatus.ts` | Shared | Network online/offline detection |
| `BulkOperationsDialog` | `frontend/views/dashboard/cert/templates/categories/BulkOperationsDialog.tsx` | Shared | Unified dialog for bulk move/delete/assign |

### 13.15 New i18n Keys (Round 4)

Add the following namespaces to `shared/locale/dashboard/certificates/categories.namespace.ts`:

| Key | Type | EN Example | AR Example |
|-----|------|------------|------------|
| `errors.cycleDetected` | `string` | "This category cannot be moved into one of its own descendants." | "لا يمكن نقل هذه الفئة إلى أحد فروعها." |
| `errors.loadFailed` | `string` | "Failed to load categories." | "فشل تحميل الفئات." |
| `errors.saveFailed` | `string` | "Failed to save changes." | "فشل حفظ التغييرات." |
| `errors.networkReconnecting` | `string` | "Reconnecting…" | "إعادة الاتصال…" |
| `errors.reverted` | `string` | "Changes reverted — server error." | "تم التراجع عن التغييرات — خطأ في الخادم." |
| `empty.noCategories.title` | `string` | "No categories yet" | "لا توجد فئات بعد" |
| `empty.noCategories.subtitle` | `string` | "Create your first category to organize certificate templates." | "أنشئ فئتك الأولى لتنظيم قوالب الشهادات." |
| `empty.noCategories.cta` | `string` | "Create Your First Category" | "أنشئ فئتك الأولى" |
| `empty.noSubcategories` | `string` | "No subcategories" | "لا توجد فئات فرعية" |
| `empty.noTemplates.title` | `string` | "No templates in this category" | "لا توجد قوالب في هذه الفئة" |
| `empty.noTemplates.browse` | `string` | "Browse Templates" | "تصفح القوالب" |
| `empty.filtered.title` | `string` | "No categories match your filters" | "لا توجد فئات مطابقة للفلاتر" |
| `empty.filtered.reset` | `string` | "Reset Filters" | "إعادة تعيين الفلاتر" |
| `bulk.move.title` | `string` | "Move Selected Categories" | "نقل الفئات المحددة" |
| `bulk.move.confirm` | `string` | "Move {count} categories" | "نقل {count} فئة" |
| `bulk.delete.title` | `string` | "Delete Selected Categories" | "حذف الفئات المحددة" |
| `bulk.delete.warning.subcategories` | `(count: number) => string` | "This will also delete {count} subcategories" | "سيتم حذف {count} فئة فرعية أيضًا" |
| `bulk.delete.warning.templates` | `(count: number) => string` | "{count} templates will be orphaned" | "سيتم تيتم {count} قالب" |
| `bulk.delete.confirm` | `string` | "Delete {count} Categories" | "حذف {count} فئة" |
| `bulk.assign.title` | `string` | "Assign Templates to Categories" | "تعيين القوالب للفئات" |
| `undo.delete.message` | `string` | "Category deleted" | "تم حذف الفئة" |
| `undo.move.message` | `string` | "Category moved" | "تم نقل الفئة" |
| `undo.action` | `string` | "Undo" | "تراجع" |
| `history.title` | `string` | "History" | "السجل" |
| `history.created` | `string` | "Created by {user} on {date}" | "أنشأها {user} في {date}" |
| `history.updated` | `string` | "Updated by {user} on {date}" | "عدلها {user} في {date}" |
| `history.deleted` | `string` | "Deleted by {user} on {date}" | "حذفها {user} في {date}" |
| `history.reordered` | `string` | "Reordered by {user} on {date}" | "أعاد ترتيبها {user} في {date}" |
| `history.moved` | `string` | "Moved by {user} on {date}" | "نقلها {user} في {date}" |
| `search.placeholder` | `string` | "Search categories…" | "ابحث عن الفئات…" |
| `search.clear` | `string` | "Clear search" | "مسح البحث" |
| `filter.templateCount.all` | `string` | "All" | "الكل" |
| `filter.templateCount.has` | `string` | "Has templates" | "لديها قوالب" |
| `filter.templateCount.none` | `string` | "No templates" | "بدون قوالب" |
| `filter.templateCount.10plus` | `string` | "10+ templates" | "10+ قوالب" |
| `filter.date.all` | `string` | "All dates" | "كل التواريخ" |
| `filter.date.today` | `string` | "Today" | "اليوم" |
| `filter.date.week` | `string` | "This week" | "هذا الأسبوع" |
| `filter.date.month` | `string` | "This month" | "هذا الشهر" |
| `filter.color` | `string` | "Color" | "اللون" |
| `a11y.treeLabel` | `string` | "Category Tree" | "شجرة الفئات" |
| `a11y.treePosition` | `(level: number, pos: number, total: number, expanded: boolean, childCount: number) => string` | "Level {level}, position {pos} of {total}, {expandedState}, {childCount} children" | "المستوى {level}، الموضع {pos} من {total}، {expandedState}، {childCount} أبناء" |

### 13.16 New GraphQL Operations (Round 4)

Add to `frontend/common/graphql/sharedDocuments/cert/category-documents.ts`:

```graphql
mutation BulkReorderCategories($input: BulkReorderCategoriesInput!) {
  bulkReorderCategories(input: $input) {
    categories { id parentId displayOrder }
    errors { message code }
  }
}

mutation BulkDeleteCategories($input: BulkDeleteCategoriesInput!) {
  bulkDeleteCategories(input: $input) {
    deletedIds
    orphanedTemplateIds
    errors { message code }
  }
}

mutation BulkAssignTemplatesToCategories($input: BulkAssignTemplatesInput!) {
  bulkAssignTemplatesToCategories(input: $input) {
    assignments { templateId categoryId }
    errors { message code }
  }
}

query CategoryAuditLog($categoryId: ID!) {
  categoryAuditLog(categoryId: $categoryId) {
    id categoryId action userId timestamp beforeData afterData
    user { id displayName avatarUrl }
  }
}

mutation RestoreCategory($input: RestoreCategoryInput!) {
  restoreCategory(input: $input) { id }
  errors { message code }
}
```

> These mutations require server-side implementation in Plan 5 — this design defines the frontend contract. Coordinate via cross-plan handoff notes (T30/R30).
