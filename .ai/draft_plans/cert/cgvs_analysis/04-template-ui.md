# CGVS Template Management UI — Analysis

## Overview

The CGVS project implements a comprehensive Template Management UI with a multi-layer architecture: category tree navigation, template list views (card/grid/list), a 6-tab template management page, recipient/recipient-group assignment, and typed variable management. The system uses custom split-pane and reactive-tree components, Zustand stores with sessionStorage persistence, and Apollo Client with cache-aware mutations.

---

## 1. Template List View

### Architecture

The template list uses a **SplitPane** layout with a **CategoryTreePane** on the left and **TemplateListContent** on the right.

**`TemplateList.tsx`** — Main page component:
- Uses `SplitPaneViewController` with `storageKey="templateListSplitPane"`
- First pane: `<CategoryTreePane />` (category tree navigation)
- Second pane: `<TemplateListContent />` (template listing)
- Toggle buttons (PanelRight/PanelLeft lucide icons) to show/hide each pane

**`TemplateListContent.tsx`** — Template listing with:
- Search bar (`TextField` with `Search` icon)
- View mode toggle (`ToggleButtonGroup` with `ViewModule`/`GridView`/`ViewList` icons)
- Pagination (`TablePagination`)
- Three view modes rendered conditionally

### Three View Modes

1. **Card View** (`CardView.tsx`):
   - MUI `Grid` container with `Grid` items (`xs={12} sm={6} md={4} lg={3}`)
   - Each card: `Card` with `CardMedia` (template image via `getTemplateImageUrl`), `CardContent` (name, description, category chip), `CardActions` (manage button, menu with edit/delete)
   - Image has dark/light mode placeholder support

2. **Grid View** (`GridView.tsx`):
   - MUI `ImageList` with `ImageListItem` for each template
   - `ImageListItemBar` with title, subtitle, and action button
   - Click navigates to manage page

3. **List View** (`ListView.tsx`):
   - MUI `Table` with `TableHead` and `TableBody`
   - Columns: avatar (template image), name, category, description, actions
   - `TablePagination` at the bottom

### Store (`useTemplateListStore.ts`)
- Zustand with `persist` middleware, `sessionStorage` storage
- State: `selectedCategoryId`, `viewMode` (card/grid/list), `page`, `rowsPerPage`, `searchTerm`, `expandedCategoryIds` (Set), `fetchedCategoryIds` (Set)
- Custom `merge` function reconstructs Sets from arrays (Sets aren't serializable)
- Actions: `setSelectedCategory`, `setViewMode`, `setPage`, `setRowsPerPage`, `setSearchTerm`, `toggleExpand`, `markAsFetched`

### Navigation
- Template card/row click → `router.push("/admin/templates/${templateId}/manage")`
- "Add template" button in category tree pane → opens `TemplateEditDialog`

---

## 2. Template Editor/Designer

### Template Management Page

**`TemplateManagementPage.tsx`** — The template "editor" is a tab-based management interface (not a visual drag-and-drop designer). It uses:
- `TabContext` with 6 tabs (see §7 below)
- URL search param `tab` synced with active tab
- Loading states via `TemplateContentSkeleton` (skeleton placeholders)
- Error states via `TemplateNotFoundError`
- `TemplateManagementHeader` with back button, template name, and status

### Basic Info Tab (BasicInfoTab.tsx)
- Form-based editing (not visual designer)
- Fields: name (`TextField`), description (`TextField` multiline)
- Image picker via `FilePickerDialog` component
- Save button triggers `updateTemplate` mutation

### Editor Tab
- Uses `EditorPaneViewController` with 3 panes (first/middle/third)
- First pane: variable list/toolbar
- Middle pane: main editor area
- Third pane: preview/properties

### No Drag-and-Drop
The CGVS template editor does **not** use drag-and-drop for template design. Editing is form-based through the BasicInfo tab and variable management. The "editor" tab uses a 3-pane layout but the actual content editing appears to be for preview/variable configuration, not visual template design.

---

## 3. Category System

### Category Tree Pane (CategoryTreePane.tsx)
- Uses `ReactiveCategoryTree` — a custom recursive tree component that lazy-loads children via Apollo queries
- Root categories loaded via `CATEGORY_ROOT_QUERY`
- Child categories loaded via `CATEGORY_CHILDREN_QUERY` on expand/hover
- Expansion state tracked in `useTemplateListStore` (expandedCategoryIds, fetchedCategoryIds Sets)
- Selected category drives template list filtering
- `ToggleSideBarButton` to collapse/expand the tree pane

### ReactiveCategoryTree Component
- Generic component (`ReactiveCategoryTree<TNode, TResult, TVariables>`)
- Takes a `resolver` function that returns `{ query, variables, skip, fetchPolicy }` for each node
- `getItems` extracts items from query result
- `hasChildren` predicate to determine if a node can expand
- `itemRenderer` for custom node rendering
- **Lazy loading strategy**: Children are NOT loaded until the node is hovered or clicked to expand. The `isFetched` / `onMarkAsFetched` pattern prevents redundant queries.
- **Hover-to-fetch**: On `onMouseEnter`, if node hasn't been fetched and might have children, it triggers a fetch (preloading before expand click)
- **Expansion state**: Can be external (via `expandedItemIds` Set + `onToggleExpand`) or internal (`useState`)
- **Fetch tracking**: Can be external (`isFetched` + `onMarkAsFetched`) or internal (`useState`)
- Visual: ChevronRight icon rotates 90deg when expanded, RTL mirrors 180deg

### Category Management (CategoryManagement.tsx)
- Two-pane view: category tree (left) + template list (right)
- `TabContext` with "all" and "deleted" tabs
- "all" tab: `CategoryPane` (tree) + `TemplatePane` (templates in selected category)
- "deleted" tab: `SuspenstionTemplatesCategory` (DataGrid of suspended templates with restore)
- Category tree uses `TreeView` component (different from `ReactiveCategoryTree`)
- Inline category creation, editing, and deletion
- `CategoryEditDialog` for create/edit category name and description
- `CategorySwitchWarningDialog` — warns when switching categories with unsaved template changes

### CategoryPane.tsx
- Renders a `TreeView` with search/autocomplete
- Categories have inline `EditableTypography` for name editing (doubleClickToEdit)
- Add child category button on each category
- Delete category with confirmation
- Selected category highlights and drives template pane

### TemplatePane.tsx
- Shows templates in selected category
- Inline create via `TemplateEditDialog`
- Each template row has edit/delete actions
- Pagination

### Category Stores
**`useTemplateCategoryStore.ts`**:
- Zustand + persist (sessionStorage)
- State: `selectedCategoryId`, `expandedCategoryIds` (Set), `searchTerm`
- Custom Set reconstruction in `merge`

**`useTemplateCategoryOperations.tsx`**:
- Wraps Apollo mutations with business logic
- `createCategory`, `updateCategory`, `deleteCategory`, `createTemplate`, `updateTemplate`, `deleteTemplate`
- Notifications via `useNotifications` from `@toolpad/core`

**`useTemplateCategoryApolloMutations.ts`**:
- Apollo `useMutation` hooks for category CRUD
- Cache updates: evict `categories` query, update `categoryChildren` query

---

## 4. Recipient Assignment UI

### RecipientsManagementTab (note: filename has a space before .tsx)
- Sub-tabs: "manage" (StudentsInGroupTable) and "add" (StudentsNotInGroupTable)
- **RecipientGroupSelector**: MUI `Autocomplete` to select which group to manage
- If no group selected → `SelectGroupPrompt` (empty state with instruction)
- When group selected → shows two data tables (manage/add sub-tabs)

### StudentsInGroupTable (Manage tab)
- Custom `Table` component from `@/client/components/Table/Table/Table`
- Shows students currently in the selected group
- Columns: name, student ID, email, actions (remove button)
- Remove action with confirmation
- `RecipientTableFooter` with selection count and clear button + remove action

### StudentsNotInGroupTable (Add tab)
- Same custom `Table` component
- Shows students NOT in the group
- Columns: name, student ID, email, actions (add button)
- Add action with confirmation
- `RecipientTableFooter` with selection count and add action

### Recipient Store (`useRecipientStore.ts`)
- Zustand store with **manual localStorage** (not persist middleware)
- State: `selectedGroupId`, `subTab` ("manage" | "add"), `manageTabQueryParams`, `addTabQueryParams`
- Separate row selection tracking for each tab
- `useEffect` saves `selectedGroupId` and `subTab` to localStorage
- On init, reads from localStorage

### GraphQL & Mutations
**`recipient.documents.ts`**: Queries and mutations for student-group relationships
**`useRecipientApolloMutations.ts`**:
- `addStudentToGroup`, `removeStudentFromGroup`, `addStudentsToGroup` (bulk)
- Cache updates: `cache.updateQuery` to modify group's student list and studentCount

**`useRecipientOperations.tsx`**:
- Wraps mutations with notifications, confirmation dialogs, loading states
- Dispatches to Apollo mutations

### RecipientSubTabList
- Mobile/desktop variant split
- Sub-tab navigation between "manage" and "add"

---

## 5. Recipient Group UI

### RecipientGroupTab.tsx
- Main recipient group management page
- Shows `RecipientGroupList` or `EmptyGroupsState`
- FAB button to create new group (`CreateGroupDialog`)

### RecipientGroupList.tsx
- Renders list of `RecipientGroupItem` components
- FAB create button (bottom right)
- Empty state: `EmptyGroupsState` (illustration + message + create button)

### RecipientGroupItem.tsx
- `Paper` with `GroupIcon`, `EditableTypography` for inline name editing, `Chip` for studentCount
- Action IconButtons: info, settings, delete
- Click navigates to group's recipient management

### Dialogs (4 types)
1. **CreateGroupDialog** (`CreateGroupDialog.tsx`): name, description, DatePicker fields
2. **GroupInfoDialog** (`GroupInfoDialog.tsx`): read-only display of group info
3. **GroupSettingsDialog** (`GroupSettingsDialog.tsx`): edit name, description, DatePicker
4. **DeleteConfirmationDialog** (`DeleteConfirmationDialog.tsx`): confirmation with guard against deleting groups with students

### Recipient Group Stores
**`useRecipientGroupDialogStore.ts`**:
- Zustand store (NO persist)
- State: `createDialogOpen`, `deleteDialogOpen`, `settingsDialogOpen`, `infoDialogOpen`, `selectedGroup`
- Actions to open/close each dialog

**`useRecipientGroupApolloMutations.ts`**:
- `createRecipientGroup`, `updateRecipientGroup`, `deleteRecipientGroup`
- Cache updates: `cache.updateQuery` to append/update/remove groups in list

**`useRecipientGroupOperations.tsx`**:
- Wraps mutations with notifications, dialog closing, confirmation
- Checks if group has students before allowing deletion

### GraphQL Documents (`recipientGroup.documents.ts`)
- `RecipientGroupsByTemplateIdQueryDocument`, `RecipientGroupByIdQueryDocument`
- `CreateRecipientGroupMutationDocument`, `UpdateRecipientGroupMutationDocument`, `DeleteRecipientGroupMutationDocument`

---

## 6. Variable Management UI

### TemplateVariableManagement.tsx
- List view showing all template variables
- Create button opens a **Menu** with 4 type options: TEXT, NUMBER, DATE, SELECT (using lucide icons: Plus, Type, Hash, Calendar, List)
- Each variable row shows: type icon, name, description, required indicator, actions (edit, delete)
- Edit action opens `TemplateVariableModal` with the variable type's form
- Delete with confirmation dialog
- Selection state managed by `useTemplateVariableSelection` and `useTemplateVariableUIStore`

### TemplateVariableModal.tsx
- `Dialog` wrapper that renders the appropriate form based on variable type
- Handles both create and edit modes (`editingVariableID` prop)
- Title changes based on mode (create vs edit)

### Variable Forms (4 types)

#### TemplateTextVariableForm
- Fields: name (TextField, required), description (multiline), minLength (number), maxLength (number), pattern (regex helper text), previewValue, required (Checkbox)
- Save button disabled if name empty or no changes from original
- Uses `mapToTemplateTextVariableCreateInput` for edit population
- `isTextVariableDifferent` to detect changes

#### TemplateNumberVariableForm
- Fields: name (required), description, minValue (number), maxValue (number), decimalPlaces (number), previewValue, required
- Separate `handleNumericChange` handler converts empty string to null
- `isNumberVariableDifferent` for change detection
- Validation: name required, changes must exist

#### TemplateDateVariableForm
- Fields: name (required), description, format (TextField with helper text "YYYY-MM-DD"), minDate (DatePicker), maxDate (DatePicker), previewValue (DatePicker with min/max constraints), required
- Date validation: `isDateValid` helper, preview must be within min/max range
- Uses MUI `DatePicker` from `@mui/x-date-pickers`
- `isDateVariableDifferent` for change detection

#### TemplateSelectVariableForm
- Fields: name (required), description, options (TagInput custom component — add option on Enter), previewValue (Select dropdown from options), multiple (Checkbox), required (Checkbox)
- `TagInput` component: custom tag input that manages string array
- Preview Select only shows when options exist
- `isSelectVariableDifferent` for change detection (includes array comparison via JSON.stringify)

### Variable Stores & Hooks

**`useTemplateVariableUIStore.ts`**:
- Zustand (NO persist)
- State: `selectedVariableIds` (Set), `focusedVariableId`, `deleteConfirmOpen`, `editingVariable` (type + id)
- Actions: `toggleSelect`, `selectAll`, `selectRange`, `clearSelection`, `setFocused`, `setEditingVariable`, `openDeleteConfirm`, `closeDeleteConfirm`

**`useTemplateVariableSelection.ts`**:
- Wraps UI store with selection logic (toggle, selectAll, selectRange with shift)
- Range selection: selects all variables between focused and clicked

### GraphQL Documents (`templateVariable.documents.ts`)
- Separate query per type: `TemplateTextVariablesByTemplateIdQueryDocument`, `TemplateNumberVariablesByTemplateIdQueryDocument`, `TemplateDateVariablesByTemplateIdQueryDocument`, `TemplateSelectVariablesByTemplateIdQueryDocument`
- Separate create mutation per type: `CreateTemplateTextVariable`, `CreateTemplateNumberVariable`, `CreateTemplateDateVariable`, `CreateTemplateSelectVariable`
- Separate update mutation per type: `UpdateTemplateTextVariable`, `UpdateTemplateNumberVariable`, `UpdateTemplateDateVariable`, `UpdateTemplateSelectVariable`
- Single delete mutation: `DeleteTemplateVariable` (works on any type via ID)

### Apollo Mutations (`useTemplateVariableApolloMutations.ts`)
- 9 mutation hooks: 4 create (one per type), 4 update (one per type), 1 delete
- Create/Update: `cache.updateQuery` to append/update the relevant type's query
- Delete: `cache.updateQuery` to filter out the deleted item from all type queries

### Operations Hook (`useTemplateVariableOperations.ts`)
- Dispatches to the correct type-specific mutation based on `variable.type`
- `createVariable(templateId, type, data)` → routes to correct create mutation
- `updateVariable(templateId, type, data, id)` → routes to correct update mutation
- `deleteVariable(templateId, type, id)` → routes to delete mutation
- Notifications via `useNotifications`

---

## 7. Tab System

### Template Management Page (6 tabs)
**`TemplateManagementPage.tsx`** uses `TabContext` with these tabs:

| Tab ID | Label | Component |
|--------|-------|-----------|
| `basic` | Basic Info | `BasicInfoTab` |
| `variables` | Variables | `TemplateVariableManagement` |
| `recipients` | Recipient Groups | `RecipientGroupTab` |
| `recipientsManagement` | Recipients | `RecipientsManagementTab` |
| `editor` | Editor | `EditorPaneViewController` (3-pane) |
| `preview` | Preview | Preview component |

- Tab state synced with URL `?tab=<tabId>` search params
- `useTemplateManagementStore` tracks: `activeTab`, `loadedTabs` (Set of tabs that have been mounted to avoid unnecessary remounts), `tabErrors`, `hasUnsavedChanges`
- When switching tabs, URL updates; on page load, tab from URL is used

### Category Management (2 tabs)
- `all` — active categories and templates
- `deleted` — suspended (soft-deleted) templates with restore option

### Recipients Management (2 sub-tabs)
- `manage` — current group members (StudentsInGroupTable)
- `add` — available students (StudentsNotInGroupTable)

### ManagementTabList.tsx
- Renders the tab bar with `Tab` components
- Icons for each tab (Info, Variable/Code, Groups, People, Edit, Preview)
- RTL-aware

---

## 8. SplitPane / EditorPane

### SplitPane (2-pane)
**`SplitPane.tsx`** — Resizable 2-pane layout:
- Props: `firstPane`, `secondPane`, `resizerProps`, `orientation` (vertical/horizontal), `storageKey`, `direction` (rtl/ltr), `primary` ("first" | "second")
- Pane props: `visible`, `minRatio`, `maxRatio`, `preferredRatio`, `className`, `style`
- **Ratio-based sizing**: Uses ratios (0.0–1.0) to calculate pane widths relative to container
- **Visibility toggle**: When one pane hidden, other gets full width
- **Resize handling**: Mouse + touch events, RTL-aware delta calculation
- **localStorage persistence**: `storageKey` saves ratios and visibility state (debounced)
- `ResizeObserver` to handle container size changes
- Min/max ratio constraints prevent panes from becoming too small/large

**`Resizer.tsx`** — Drag handle between panes:
- `col-resize` cursor, 4px wide when dragging, 2px normal
- Changes color to `theme.palette.primary.main` when active
- Supports mouse and touch events
- `role="separator"` with `aria-orientation`

**`SplitPaneViewController.tsx`** — Wrapper with header and visibility toggle buttons:
- Title in header row
- PanelRight/PanelLeft (lucide-react) IconButtons to toggle each pane
- Disable toggle if the other pane is already hidden (prevent both hidden)
- Passes `storageKey` to `SplitPane` for persistence

### EditorPane (3-pane)
**`EditorPane.tsx`** — Resizable 3-pane layout:
- Props: `firstPane`, `middlePane`, `thirdPane`, `storageKey`
- **Pixel-based sizing** (unlike SplitPane's ratio approach): Stores actual pixel sizes in state
- Three panes with two resizers (between 1-2 and 2-3)
- Middle pane is always visible
- Visibility toggling: saves previous size, restores on re-show (with MIN_PANE_SIZE = 50px constraint)
- **localStorage persistence**: Saves `PaneState` (sizes, visibility, previousSizes)
- Complex resize logic: when panes hidden/shown, redistributes space
- `ResizeObserver` for container dimension changes
- Debounced save (300ms)

**`EditorPaneResizer.tsx`** — Same as SplitPane's Resizer but for 3-pane layout

**`EditorPaneViewController.tsx`** — Wrapper with:
- Title header
- PanelLeft/PanelRight toggle buttons for first and third panes
- `minHeight: calc(100vh - 203px)` for editor area

### Key Differences
| Feature | SplitPane | EditorPane |
|---------|-----------|------------|
| Panes | 2 | 3 |
| Sizing | Ratio-based | Pixel-based |
| Always visible | Neither | Middle pane |
| Storage | Ratios + visibility | Sizes + visibility + previous sizes |

---

## 9. Tree / Category Pane

### ReactiveCategoryTree (Apollo-driven)
**`ReactiveCategoryTree.tsx`** — Generic recursive tree with Apollo lazy loading:
- Generic: `<TNode extends ReactiveTreeNode, TResult, TVariables>`
- Root query: `resolver(undefined)` at top level
- Child queries: `resolver(node)` at each node level
- `useQuery` with `skip` until fetch initiated
- Auto-select: finds `selectedItemId` in loaded items, calls `onUpdateItem` or `onSelectItem`
- Linear progress bar at top while loading
- Error display with `error.message`
- Empty state message

**`ReactiveCategoryTreeNode.tsx`** — Recursive node component:
- Each node calls `useQuery` for its children at the top level (hooks-safe)
- `skip: !hasFetched || !mightHaveChildren` — children only fetched when needed
- **Hover preload**: `onMouseEnter` triggers fetch if not already fetched
- **Expand/collapse**: ChevronRight icon rotates 90° when expanded
- `CircularProgress` spinner while loading children
- Indentation: `paddingLeft: level * 20px`
- Selected: `backgroundColor: rgba(25, 118, 210, 0.08)` (hardcoded primary color)
- Hover: slightly darker background
- RTL support: ChevronRight rotates 180° in RTL when collapsed
- **Recursive rendering**: Children rendered as `ReactiveCategoryTreeNode` with `level + 1`
- Spacer box for nodes that might have children but haven't loaded yet (maintains alignment)

**`types.ts`**:
- `ReactiveTreeNode`: `{ id: string | number }`
- `ReactiveTreeProps`: resolver, getItems, hasChildren, getNodeLabel, itemRenderer, selectedItemId, onSelectItem, onUpdateItem, expandedItemIds, onToggleExpand, isFetched, onMarkAsFetched, itemHeight, header, noItemsMessage
- `ItemResolver`: `(parent: TNode | undefined) => QueryResolverOptions<TVariables>`
- `QueryResolverOptions`: `{ query, variables?, skip?, fetchPolicy? }`

### TreeView (Searchable, with children resolver)
**`TreeView.tsx`** — Alternative tree component with built-in search:
- **Autocomplete search**: Flattens tree, filters by label, auto-expands parents of matching items
- **Lazy loading**: `childrenResolver` async function, `lazyLoadStrategy` ("on-expand" | "preload-level")
- `expandedItems`: External or internal Set for tracking expansion
- `loadingItems`: Set for tracking which items are currently loading
- `BaseTreeItem`: `{ id: string | number, [key: string]: any }`
- Custom `TreeViewItemRenderer` for custom rendering
- Search with lucide `Search` icon in Autocomplete input

**`TreeViewItem.tsx`** — Simple item renderer:
- Uses `itemRenderer` if provided
- Falls back to `Typography` with label from `labelKey`
- `noWrap`, `textWrap: balance` for clean rendering

---

## 10. Template Placeholder Images

### `templateImagePlaceHolder.ts`
```typescript
export const TEMPLATE_IMAGE_PLACEHOLDER_URL =
  "/storage/img/A5dJHJxOJIAKwk9vVe2NXSTgpmB03iCIK15pVDGR.jpg";
```
A single static placeholder URL for templates without custom images.

### `template.utils.ts` — `getTemplateImageUrl()`
```typescript
export function getTemplateImageUrl(template: { imageUrl?: string | null }, isDark: boolean): string
```
- If `template.imageUrl` exists, uses it
- Otherwise returns theme-appropriate placeholder:
  - Dark mode: `/templateCover/placeholder_dark.png`
  - Light mode: `/templateCover/placeholder_light.png`
- Used by `CardView` and `GridView` to display template cover images

### Usage Pattern
- `BasicInfoTab` uses `FilePickerDialog` for uploading/selecting template images
- `CardView` and `ListView` show template images via `getTemplateImageUrl`
- `GridView` shows images via `ImageListItem` with `getTemplateImageUrl`

---

## 11. Component Architecture

### MUI Components Used

| Component | Usage |
|-----------|-------|
| `Box` | Universal layout container |
| `Paper` | Card-like surfaces (RecipientGroupItem) |
| `Card`, `CardContent`, `CardMedia`, `CardActions` | Template card view |
| `Grid` (v2) | Responsive grid layouts |
| `ImageList`, `ImageListItem`, `ImageListItemBar` | Grid view |
| `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TablePagination` | List view, suspended templates |
| `Tab`, `Tabs`, `TabContext`, `TabPanel` | All tab systems |
| `TextField`, `Textarea` | Form inputs |
| `Select`, `MenuItem` | Dropdowns (variable type, preview value) |
| `Checkbox`, `FormControlLabel` | Boolean toggles (required, multiple) |
| `DatePicker` (from `@mui/x-date-pickers`) | Date variable forms |
| `Autocomplete` | Group selector, tree search |
| `Button`, `IconButton` | Actions |
| `Tooltip` | Pane toggle buttons |
| `Chip` | Student count, category badges |
| `LinearProgress` | Tree loading |
| `CircularProgress` | Node loading, button loading |
| `Typography` | Text display |
| `ToggleButtonGroup`, `ToggleButton` | View mode switcher |
| `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` | All dialogs |
| `Menu`, `MenuItem` | Variable type creation menu |
| `Skeleton` | Loading placeholders |
| `Fab` | Floating action button (create group) |
| `Divider` | Visual separation |
| `Avatar` | Template image in list view |
| `Snackbar` / useNotifications | Toast notifications (via @toolpad/core) |

### Custom Components

| Component | Purpose |
|-----------|---------|
| `SplitPane` | 2-pane resizable layout |
| `SplitPaneViewController` | SplitPane with header + toggle buttons |
| `Resizer` | Drag handle for SplitPane |
| `EditorPane` | 3-pane resizable layout |
| `EditorPaneViewController` | EditorPane with header + toggle buttons |
| `EditorPaneResizer` | Drag handle for EditorPane |
| `ReactiveCategoryTree` | Apollo-driven recursive tree with lazy loading |
| `ReactiveCategoryTreeNode` | Individual tree node |
| `TreeView` | Searchable tree with optional lazy loading |
| `TreeViewItem` | Simple tree item renderer |
| `EditableTypography` | Inline-editable text (double-click to edit) |
| `TagInput` | Tag/chip input for select variable options |
| `Table` (custom) | Advanced table from `@/client/components/Table/Table/Table` with TableProvider, filtering, sorting, pagination |
| `FilePickerDialog` | Image picker dialog |
| `ToggleSideBarButton` | Collapse/expand button for tree pane |

### Third-Party Libraries
- **lucide-react**: PanelLeft, PanelRight, Plus, Trash2, X, Search, Type, Hash, Calendar, List icons
- **@toolpad/core**: `useNotifications` for toast notifications
- **@mui/x-date-pickers**: DatePicker for date variable forms
- **Apollo Client**: `useQuery`, `useMutation` from `@apollo/client/react`

---

## 12. Navigation Flow

```
Dashboard (/admin/dashboard)
  └─→ Templates List (/admin/templates)
        │  [SplitPane: CategoryTree | TemplateListContent]
        │  Card/Grid/List views
        │
        ├─→ Template Manage (/admin/templates/:id/manage?tab=basic)
        │     │  [6 tabs: basic, variables, recipients, recipientsManagement, editor, preview]
        │     │
        │     ├─ Basic Info Tab → form (name, description, image)
        │     ├─ Variables Tab → variable list → create menu → modal → type-specific form
        │     ├─ Recipient Groups Tab → group list → create/info/settings/delete dialogs
        │     ├─ Recipients Management Tab → group selector → [manage | add] sub-tabs
        │     ├─ Editor Tab → 3-pane EditorPane (variable list | editor | preview)
        │     └─ Preview Tab → template preview
        │
        └─→ Categories Management (/admin/categories)
              [SplitPane: CategoryTree | TemplatePane]
              [Tabs: all | deleted]
```

### Navigation Details
- **Dashboard** → Templates page via sidebar navigation
- **Templates List** → Template Manage via card/row click: `router.push("/admin/templates/${id}/manage")`
- **Template Manage** → Back to templates list via header back button: `router.push("/admin/templates")`
- **Tab navigation** within manage page: URL `?tab=<tabId>` synced
- **Recipient Group** click → navigates to recipients management tab for that group
- **Category selection** in tree → updates template list (no navigation, state-driven)

### App Router Pages
- `app/(root)/(auth)/admin/templates/page.tsx` → renders `<TemplateList />`
- `app/(root)/(auth)/admin/templates/[id]/manage/page.tsx` → renders `<TemplateManagementPage />`
- `app/(root)/(auth)/admin/categories/page.tsx` → renders `<TemplateCategoryManagement />`
- `app/(root)/(auth)/admin/dashboard/page.tsx` → renders `<Dashboard />`
- All pages are thin wrappers importing client view components
- Route groups: `(root)` for auth layout, `(auth)` for authenticated routes

---

## Summary of Key Patterns for Siraj Adaptation

1. **SplitPane + Tree Pane layout**: Use for list views with category navigation. SplitPane provides resizable 2-pane with localStorage persistence. CategoryTreePane provides hierarchical navigation.

2. **Three view modes**: ToggleButtonGroup to switch between Card/Grid/List. Card uses MUI Grid+Card, Grid uses ImageList, List uses Table. Persisted in Zustand store.

3. **Tab-based management**: TabContext with URL-param-synced active tab. 6 tabs cover all template management aspects. `loadedTabs` Set prevents unnecessary remounts.

4. **Reactive tree**: Generic, Apollo-driven recursive tree with hover preload and lazy loading. External state management for expansion and fetch tracking via Zustand stores.

5. **Variable type system**: 4 typed variables (TEXT, NUMBER, DATE, SELECT), each with unique GraphQL mutations, form components, and validation. Type-specific mappers and diff checkers.

6. **Cache-aware mutations**: Apollo `cache.updateQuery` for appending/updating/removing items in list queries. `cache.evict` for template category changes.

7. **Dialog-driven CRUD**: Recipient groups use 4 dialog types (create, info, settings, delete) with a Zustand dialog store (no persist).

8. **Inline editing**: `EditableTypography` component for double-click-to-edit names on categories and recipient groups.

9. **Zustand + persist**: sessionStorage for UI state (view mode, selected category, expansion). Custom merge for Set/Map reconstruction. Some stores use manual localStorage instead of persist.

10. **RTL support**: Theme direction propagated to custom components. Icon mirroring via conditional transforms.

11. **Notifications**: `@toolpad/core/useNotifications` for success/error toast messages after mutations.

12. **Custom Table**: `TableProvider` + `Table` component with built-in filtering, sorting, pagination, row selection, column widths. Used for recipient management tables.
