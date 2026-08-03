# Plan 13: Template Variable Management — Design

> **Plan #:** 13
> **Dependencies:** Plan 1 (Database Schema), Plan 2 (Types & Permissions), Plan 5 (GraphQL API)
> **Last Updated:** 2026-08-02

---

## 1. Architecture Overview

Certificate variable management is a **standalone admin page** following the standard Siraj Container/ViewModel/Switcher pattern. Variables are global definitions that templates reference by `key`. The page provides full CRUD with a responsive table (desktop) / card list (mobile), filter bar, create/edit dialog, and dependency-aware deletion.

```
app/(dashboard)/certificates/variables/page.tsx
  └── CertVariablesContainer (common)
        ├── RequirePermission([CertificateTemplateManage])
        └── ResponsiveViewSwitch
              ├── VariablesDesktopView (desktop tier)
              │     └── DesktopPageContainer → DesktopPageHeader → FilterBar → SectionPanel → DesktopAppDataGrid
              └── VariablesMobileView (mobile tier)
                    └── MobilePageContainer → MobilePageHeader → SearchField → MobileCardList → MobileFab
```

### Data Flow

```
DesktopView/MobileView (pure presentation)
  ← Readonly<VariablesViewModel> (from ViewModel)
    ← certVariablesStore (Zustand — filters, pagination, dialog state)
    ← Apollo useQuery(CertVariablesQueryDocument)
    ← Apollo useMutation(Create/Update/DeleteVariableMutationDocument)
```

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| Standalone admin page | Full CRUD page at `/certificates/variables` — not an inline panel |
| Siraj pattern compliance | Container/ViewModel/Switcher, PageContainer, AppDataGrid, MobileCardList, Zustand store |
| Global variable scope | Variables are global, referenced by key across templates |
| Source classification | Four categories (static, dynamic, computed, user_input) describe value origin |
| Data type system | Four data types (text, number, date, select) describe value format |
| Dependency-aware delete | Deletion warns when templates reference the variable |
| Key & type immutability | Key and data type are immutable after creation |
| Responsive design | Desktop table + Mobile card list from same ViewModel |
| i18n complete | All strings in compile-time TypeScript i18n system (en + ar) |

---

## 3. Key Design Decisions

### Decision 1: Standalone Page (Not Inline Panel)

| Aspect | Standalone Page (Chosen) | Inline Panel |
|--------|--------------------------|--------------|
| Navigation | Standard sidebar entry | Hidden inside template editor |
| Scope | Global variables (cross-template) | Per-template variables |
| Pattern compliance | Standard Container/ViewModel/Switcher | Custom panel embedding |
| Re-usability | Variables shared across templates | Variables duplicated per template |

**Decision:** Standalone page at `/certificates/variables`. Variables are global — one definition shared across all templates that reference it by key.

### Decision 2: Global Variables (Not Per-Template)

| Aspect | Global (Chosen) | Per-Template |
|--------|-----------------|--------------|
| Duplication | No — define once | Yes — redefine per template |
| Consistency | Same key always means same value | Same key may differ |
| Management | Central admin page | Per-template editing |

**Decision:** Variables are global. The `certificate_variables` table holds one row per variable definition. Templates reference variables by `key` via a binding mechanism (Plan 1/10).

### Decision 3: Dual Classification (Type + Category)

| Concept | Values | Purpose |
|---------|--------|---------|
| Data Type (`type`) | text, number, date, select | How the value is formatted |
| Source Category (`category`) | static, dynamic, computed, user_input | Where the value comes from |

**Decision:** Each variable has both a data type (format) and a source category (origin). The type drives the default value UI component. The category drives default value behavior (computed disables, dynamic shows hint).

### Decision 4: Key and Type Immutability

| Aspect | Immutable Key + Type | Mutable All |
|--------|---------------------|-------------|
| Safety | Template bindings never break | Key change breaks all bindings |
| Convenience | User edits name, default, category only | Full flexibility (risky) |

**Decision:** `key` and `type` are immutable after creation. Name, category, defaultValue, description, enumValues, and validationRules are editable.

---

## 4. Complete File Scaffold

### Page & Routes

| File | Purpose |
|------|---------|
| `app/(dashboard)/certificates/variables/page.tsx` | Next.js async server component — route entry |
| `app/(dashboard)/certificates/variables/loading.tsx` | Route loading skeleton |

### Container / ViewModel / Switcher (Common)

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/cert-variables/variablesContainer.tsx` | Client Container with `createLazyView` + `ResponsiveViewSwitch` |
| `frontend/common/views/dashboard/cert-variables/useVariablesViewModel.ts` | ViewModel hook — all business logic, labels, Apollo hooks |
| `frontend/common/views/dashboard/cert-variables/variablesView.tsx` | (Optional) shared switcher if not using inline `ResponsiveViewSwitch` in Container |
| `frontend/common/views/dashboard/cert-variables/types.ts` | ViewModel interface, label types, prop types |

### Desktop View

| File | Purpose |
|------|---------|
| `frontend/desktop/views/dashboard/cert-variables/variables.desktop.tsx` | Desktop view — `DesktopPageContainer` → `DesktopPageHeader` → `FilterBar` → `DesktopSectionPanel` → `DesktopAppDataGrid` |
| `frontend/desktop/views/dashboard/cert-variables/components/VariableTypeBadge.tsx` | Color-coded `Chip` for data type (text=blue, number=green, date=orange, select=purple) |
| `frontend/desktop/views/dashboard/cert-variables/components/VariableCategoryBadge.tsx` | `Chip` for source category with icon |
| `frontend/desktop/views/dashboard/cert-variables/components/VariableKeyChip.tsx` | Monospace `Chip` showing `{{variable_key}}` |
| `frontend/desktop/views/dashboard/cert-variables/components/VariableFilterBar.tsx` | Search + type filter + category filter |
| `frontend/desktop/views/dashboard/cert-variables/components/VariableDialog.tsx` | Create/Edit dialog (responsive `Dialog`) |
| `frontend/desktop/views/dashboard/cert-variables/components/VariableDeleteDialog.tsx` | Delete confirmation / dependency warning dialog |
| `frontend/desktop/views/dashboard/cert-variables/components/VariablePreviewChip.tsx` | `{{key}}` preview chip for dialog |
| `frontend/desktop/views/dashboard/cert-variables/components/EnumValuesEditor.tsx` | List editor for select type options |
| `frontend/desktop/views/dashboard/cert-variables/components/EnumOptionRow.tsx` | Single option row (Key + Label + Remove) |
| `frontend/desktop/views/dashboard/cert-variables/components/ValidationRulesEditor.tsx` | Collapsible Accordion with validation rule fields |
| `frontend/desktop/views/dashboard/cert-variables/components/TypeConfigFields.tsx` | Dispatcher rendering type-specific config fields |
| `frontend/desktop/views/dashboard/cert-variables/components/TextConfigFields.tsx` | Text config (minLength, maxLength, pattern) |
| `frontend/desktop/views/dashboard/cert-variables/components/NumberConfigFields.tsx` | Number config (minValue, maxValue, decimalPlaces) |
| `frontend/desktop/views/dashboard/cert-variables/components/DateConfigFields.tsx` | Date config (dateFormat, relativeDate) |
| `frontend/desktop/views/dashboard/cert-variables/components/DefaultValueInput.tsx` | Dispatcher for type-specific default value input |
| `frontend/desktop/views/dashboard/cert-variables/components/TextDefaultValueInput.tsx` | TextField for text defaults |
| `frontend/desktop/views/dashboard/cert-variables/components/NumberDefaultValueInput.tsx` | Number TextField for number defaults |
| `frontend/desktop/views/dashboard/cert-variables/components/DateDefaultValueInput.tsx` | AppDatePicker for date defaults |
| `frontend/desktop/views/dashboard/cert-variables/components/SelectDefaultValueInput.tsx` | Select dropdown for select defaults |

### Mobile View

| File | Purpose |
|------|---------|
| `frontend/mobile/views/dashboard/cert-variables/variables.mobile.tsx` | Mobile view — `MobilePageContainer` → `MobilePageHeader` → `MobileCardList` → `MobileFab` |
| `frontend/mobile/views/dashboard/cert-variables/components/VariableCardItem.tsx` | `MobileCardListItem` for a single variable |
| `frontend/mobile/views/dashboard/cert-variables/components/VariableCardMenu.tsx` | Context menu (MoreVertOutlined) with edit/delete actions |

### Zustand Store

| File | Purpose |
|------|---------|
| `frontend/common/stores/certVariablesStore.ts` | Zustand store — filters, pagination, dialog state, form draft |

### GraphQL Documents

| File | Purpose |
|------|---------|
| `frontend/common/graphql/sharedDocuments/certificates/variables.documents.ts` | Fragments, queries, mutations for cert variables |
| `frontend/common/graphql/sharedDocuments/certificates/index.ts` | Barrel export (add to existing certificates barrel) |

### i18n Namespaces

| File | Purpose |
|------|---------|
| `shared/locale/namespaces/certificates/variablesShell.namespace.ts` | `defineNamespace` for shell labels |
| `shared/locale/namespaces/certificates/variablesColumns.namespace.ts` | Column labels, type labels |
| `shared/locale/namespaces/certificates/variablesFilters.namespace.ts` | Filter labels |
| `shared/locale/namespaces/certificates/variablesDialogs.namespace.ts` | Dialog field labels, validation messages, hints |
| `shared/locale/namespaces/certificates/variablesNotifications.namespace.ts` | Toast/error messages |
| `shared/locale/namespaces/certificates/variablesCategories.namespace.ts` | Category labels + descriptions |
| `shared/locale/types/certificates/variables.ts` | Compile-time type schema for all variable labels |
| `shared/locale/en/certificates/variables/shell.ts` | English shell strings |
| `shared/locale/en/certificates/variables/columns.ts` | English column + type labels |
| `shared/locale/en/certificates/variables/filters.ts` | English filter strings |
| `shared/locale/en/certificates/variables/dialogs.ts` | English dialog strings |
| `shared/locale/en/certificates/variables/notifications.ts` | English notification strings |
| `shared/locale/en/certificates/variables/categories.ts` | English category strings |
| `shared/locale/ar/certificates/variables/` (mirrors above) | Arabic translations |

### Types

| File | Purpose |
|------|---------|
| `backend/types/certificates/variable.types.ts` | `CertificateVariableSelectType`, `CertificateVariableInsertType`, `CertificateVariableReturnType`, `CreateVariableInput`, `UpdateVariableInput`, `DeleteVariableInput` (per Plan 2/backend/types/AGENTS.md) |

### Zod Schemas (description only — no code)

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/cert-variables/variableSchemas.ts` | Zod schemas for form validation (create + edit) |

---

## 5. Backend Type References (from Plan 2)

### `backend/types/certificates/variable.types.ts`

**Select type** (`$inferSelect` from `certificateVariables` table):
- `id: string`
- `key: string`
- `name: string`
- `type: CertificateVariableType` (enum: `text`, `number`, `date`, `select`)
- `category: CertificateVariableCategory` (enum: `static`, `dynamic`, `computed`, `user_input`)
- `defaultValue: string | null` (JSON-encoded)
- `description: string | null`
- `config: Record<string, unknown> | null` (type-specific config)
- `validationRules: Record<string, unknown> | null`
- `isSystem: boolean`
- `status: 'active' | 'archived'`
- `templateCount: number` (computed — count of templates referencing this variable)
- `createdAt: Date`
- `updatedAt: Date`

**Create input**: `key`, `name`, `type`, `category`, `defaultValue?`, `description?`, `config?`, `validationRules?`

**Update input**: `id`, `name?`, `category?`, `defaultValue?`, `description?`, `config?`, `validationRules?` (no `key` or `type` — immutable)

**Delete input**: `id`

### Enum: `CertificateVariableType`

pgEnum defined in Plan 1 — values: `text`, `number`, `date`, `select`.

### Enum: `CertificateVariableCategory`

New pgEnum — values: `static`, `dynamic`, `computed`, `user_input`. Must be added to Plan 2's enum catalog (11+1 = 12 enums).

---

## 6. GraphQL Documents

### File: `frontend/common/graphql/sharedDocuments/certificates/variables.documents.ts`

All documents use `TypedDocumentNode<Operations.X, Types.QueryXArgs>` pattern. Import from `@apollo/client` (not `@apollo/client/core`). Every fragment includes `id` field for Apollo cache normalization.

#### Fragment: `CertVariableFields`

Fields: `id`, `key`, `name`, `type`, `category`, `defaultValue`, `description`, `config`, `validationRules`, `isSystem`, `status`, `templateCount`, `createdAt`, `updatedAt`

#### Query: `CertVariablesQueryDocument`

- Args: `search: String`, `type: CertificateVariableType`, `category: CertificateVariableCategory`, `status: String` (all optional)
- Returns: `[CertificateVariableType!]!`
- Uses fragment `CertVariableFields`
- `TypedDocumentNode<Operations.CertVariablesQuery, Types.QueryCertVariablesArgs>`

#### Query: `CheckVariableKeyUniquenessQueryDocument`

- Args: `key: String!`, `excludeId: ID` (optional — for edit mode)
- Returns: `{ isAvailable: Boolean! }`
- Used with `useQuery` + `skip` to debounce during form editing
- `TypedDocumentNode<Operations.CheckVariableKeyUniquenessQuery, Types.QueryCheckVariableKeyUniquenessArgs>`

#### Query: `VariableDependenciesQueryDocument`

- Args: `variableId: ID!`
- Returns: `{ templateCount: Int!, templates: [{ id, name }] }` (first 10 templates by name)
- `TypedDocumentNode<Operations.VariableDependenciesQuery, Types.QueryVariableDependenciesArgs>`

#### Mutation: `CreateVariableMutationDocument`

- Args: `input: CreateVariableInput!`
- Returns: `CertificateVariableType` (with `CertVariableFields` fragment)
- `TypedDocumentNode<Operations.CreateVariableMutation, Types.MutationCreateVariableArgs>`

#### Mutation: `UpdateVariableMutationDocument`

- Args: `input: UpdateVariableInput!`
- Returns: `CertificateVariableType` (with `CertVariableFields` fragment)
- `TypedDocumentNode<Operations.UpdateVariableMutation, Types.MutationUpdateVariableArgs>`

#### Mutation: `DeleteVariableMutationDocument`

- Args: `input: DeleteVariableInput!`
- Returns: `{ success: Boolean!, id: ID! }`
- `TypedDocumentNode<Operations.DeleteVariableMutation, Types.MutationDeleteVariableArgs>`

### Apollo Cache Update Strategy

| Mutation | Cache Update |
|----------|-------------|
| Create | Append new variable to `CertVariablesQuery` cached list; optimistic: add temp object with negative ID |
| Update | Modify existing entry in cache by `id` (via `writeFragment` or `modify`) |
| Delete | Remove by `id` via `cache.evict`; garbage collect `ROOT_QUERY.certVariables` |

---

## 7. Zustand Store

### File: `frontend/common/stores/certVariablesStore.ts`

**Pattern:** `create()` from `zustand` (no `persist` — ephemeral state).

#### Store Interface

Data fields:
- `searchQuery: string`
- `typeFilter: CertificateVariableType | null`
- `categoryFilter: CertificateVariableCategory | null`
- `page: number`
- `pageSize: number`
- `createDialogOpen: boolean`
- `editDialogOpen: boolean`
- `editingVariableId: string | null`
- `deleteDialogOpen: boolean`
- `deletingVariableId: string | null`
- `isSubmitting: boolean`

Dialog form draft:
- `draft: VariableDraft | null`

Draft fields:
- `key: string`
- `name: string`
- `type: CertificateVariableType`
- `category: CertificateVariableCategory`
- `defaultValue: string`
- `description: string`
- `config: VariableConfig` (discriminated union by type)
- `validationRules: ValidationRules`
- `enumValues: EnumOption[]` (key/label array — for select type)
- `keyManuallyEdited: boolean` (flag to stop auto-generation)

Actions:
- `setSearchQuery: (q: string) => void`
- `setTypeFilter: (t: CertificateVariableType | null) => void`
- `setCategoryFilter: (c: CertificateVariableCategory | null) => void`
- `setPage: (p: number) => void`
- `setPageSize: (s: number) => void`
- `openCreateDialog: () => void`
- `openEditDialog: (variable: CertVariableFields) => void`
- `closeDialog: () => void`
- `openDeleteDialog: (variableId: string) => void`
- `closeDeleteDialog: () => void`
- `setIsSubmitting: (v: boolean) => void`
- `updateDraft: <K extends keyof VariableDraft>(field: K, value: VariableDraft[K]) => void`
- `setKeyManuallyEdited: (v: boolean) => void`
- `resetDraft: () => void`

---

## 8. Component Hierarchy & Prop Interfaces

### 8.1 Page Server Component

**File:** `app/(dashboard)/certificates/variables/page.tsx`

```
async function CertVariablesPage()
  → getLocale()
  → getServerUserContext()
  → redirectToLogin() if no userId
  → requirePermissionForPage(userId, [AppPermission.CertificateTemplateManage], locale, ctx)
  → <RequirePermission permissions={[GraphQLAppPermission.CertificateTemplateManage]}>
      <CertVariablesContainer />
    </RequirePermission>
```

**`generateMetadata(locale)`**: Returns `{ title: t.certTranslations.variablesShell.pageTitle }`.

### 8.2 Container

**File:** `frontend/common/views/dashboard/cert-variables/variablesContainer.tsx`

```typescript
'use client';
// createLazyView<VariablesViewModel>(mobileLoader, desktopLoader)
// ResponsiveViewSwitch with props={viewModel}
```

Props: None (Container calls ViewModel internally).

### 8.3 ViewModel

**File:** `frontend/common/views/dashboard/cert-variables/useVariablesViewModel.ts`

**Return interface:**

```typescript
interface VariablesViewModel {
  // Data
  readonly rows: CertVariableRow[];
  readonly loading: boolean;
  readonly error: ApolloError | undefined;

  // Labels (grouped)
  readonly labels: VariablesLabels;
  readonly labelsBySection: {
    shell: ShellLabels;
    columns: ColumnLabels;
    filters: FilterLabels;
    actions: ActionLabels;
    dialogs: DialogLabels;
    notifications: NotificationLabels;
    types: TypeLabels;
    categories: CategoryLabels;
    empty: EmptyStateLabels;
  };

  // Filters & pagination
  readonly searchQuery: string;
  readonly typeFilter: CertificateVariableType | null;
  readonly categoryFilter: CertificateVariableCategory | null;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (p: number) => void;
  readonly onPageSizeChange: (s: number) => void;
  readonly onSearchChange: (q: string) => void;
  readonly onTypeFilterChange: (t: CertificateVariableType | null) => void;
  readonly onCategoryFilterChange: (c: CertificateVariableCategory | null) => void;
  readonly onClearFilters: () => void;

  // Dialog state
  readonly createDialogOpen: boolean;
  readonly editDialogOpen: boolean;
  readonly editingVariable: CertVariableFields | null;
  readonly deleteDialogOpen: boolean;
  readonly deletingVariable: CertVariableFields | null;
  readonly isSubmitting: boolean;
  readonly isKeyAvailable: boolean | null;
  readonly keyChecking: boolean;

  // Dialog actions
  readonly onOpenCreate: () => void;
  readonly onOpenEdit: (variable: CertVariableFields) => void;
  readonly onCloseDialog: () => void;
  readonly onOpenDelete: (variable: CertVariableFields) => void;
  readonly onCloseDelete: () => void;

  // Form draft
  readonly draft: VariableDraft | null;
  readonly onUpdateDraft: <K extends keyof VariableDraft>(field: K, value: VariableDraft[K]) => void;
  readonly onSetKeyManuallyEdited: () => void;
  readonly onSaveCreate: () => Promise<void>;
  readonly onSaveEdit: () => Promise<void>;
  readonly onDelete: () => Promise<void>;
  readonly isDirty: boolean;

  // Dependencies
  readonly dependencies: { templateCount: number; templates: { name: string }[] } | null;
  readonly dependenciesLoading: boolean;

  // Permission
  readonly canManage: boolean;

  // Row actions
  readonly onEditRow: (variable: CertVariableFields) => void;
  readonly onDeleteRow: (variable: CertVariableFields) => void;

  // Column definitions
  readonly columns: GridColDef[];
}
```

**Apollo hooks:**
- `useQuery(CertVariablesQueryDocument, { variables: { search, type, category, status: null }, fetchPolicy: 'cache-and-network' })`
- `useQuery(CheckVariableKeyUniquenessQueryDocument, { variables: { key, excludeId }, skip: !key || key.length < 1 })`
- `useQuery(VariableDependenciesQueryDocument, { variables: { variableId: deletingVariableId }, skip: !deletingVariableId })`
- `useMutation(CreateVariableMutationDocument, { update: ... })`
- `useMutation(UpdateVariableMutationDocument, { update: ... })`
- `useMutation(DeleteVariableMutationDocument, { update: ... })`

### 8.4 Desktop View

**File:** `frontend/desktop/views/dashboard/cert-variables/variables.desktop.tsx`

```
<DesktopPageContainer>
  <DesktopPageHeader
    title={labels.shell.pageTitle}
    subtitle={labels.shell.pageSubtitle}
    actions={canManage ? <DesktopPrimaryPageAction onClick={onOpenCreate}>...</DesktopPrimaryPageAction> : null}
  />
  <VariableFilterBar ... />
  <DesktopSectionPanel contentPadding={false}>
    <DesktopAppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      paginationOptions={...}
      emptyMessage={labels.empty.title}
    />
  </DesktopSectionPanel>
  <VariableDialog open={createDialogOpen || editDialogOpen} ... />
  <VariableDeleteDialog open={deleteDialogOpen} ... />
</DesktopPageContainer>
```

Props: `Readonly<VariablesViewModel>` destructured.

### 8.5 Mobile View

**File:** `frontend/mobile/views/dashboard/cert-variables/variables.mobile.tsx`

```
<MobilePageContainer>
  <MobilePageHeader title={labels.shell.pageTitle} />
  <Box sx={{ px: 2, pb: 1 }}>
    <TextField fullWidth placeholder={labels.filters.searchPlaceholder} ... />
  </Box>
  <MobileCardList
    items={rows.map(v => ({ id: v.id, content: ... }))}
    paginationOptions={...}
    emptyMessage={labels.empty.title}
    loading={loading}
  >
    {rows.map(v => <VariableCardItem ... />)}
  </MobileCardList>
  {canManage && <MobileFab onClick={onOpenCreate} label={labels.actions.newVariable} />}
  <VariableDialog ... />
  <VariableDeleteDialog ... />
</MobilePageContainer>
```

Props: `Readonly<VariablesViewModel>` destructured.

---

## 9. Desktop View Specification

### Column Definitions

| Column | `field` | `headerName` | `width` | Render |
|--------|---------|-------------|---------|--------|
| Name | `name` | `columns.name` | 200 | Bold `Typography` variant `bodyMd` |
| Key | `key` | `columns.key` | 180 | `<VariableKeyChip value={row.key} />` |
| Type | `type` | `columns.type` | 120 | `<VariableTypeBadge type={row.type} label={...} />` |
| Category | `category` | `columns.category` | 120 | `<VariableCategoryBadge category={row.category} label={...} />` |
| Default Value | `defaultValue` | `columns.defaultValue` | 180 | Truncated text with `Tooltip` on hover |
| Description | `description` | `columns.description` | 200 | Truncated text with `Tooltip` on hover |
| Templates | `templateCount` | `columns.templates` | 100 | Right-aligned `Typography` variant `bodyMd` |
| Status | `status` | `columns.status` | 100 | `<StatusBadge category="certVariable" status={row.status} label={...} />` |
| Actions | — | — | 100 | Edit (`EditOutlined` `IconButton`) + Delete (`DeleteOutlined` `IconButton`, hidden if `isSystem`) |

### Row Actions

- **Edit**: `IconButton` with `EditOutlined` icon → calls `onEditRow(row)` → opens edit dialog
- **Delete**: `IconButton` with `DeleteOutlined` icon → calls `onDeleteRow(row)` → opens delete dialog
- Delete hidden when `row.isSystem === true` OR `!canManage`
- Edit hidden when `!canManage`

### Filter Bar

```
<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
  <TextField placeholder={filters.searchPlaceholder} ... fullWidth />
  <FormControl sx={{ minWidth: 120 }}>
    <InputLabel>{filters.typeFilterLabel}</InputLabel>
    <Select ...>
      <MenuItem value="">{filters.all}</MenuItem>
      <MenuItem value="text">{types.text}</MenuItem>
      ...
    </Select>
  </FormControl>
  <FormControl sx={{ minWidth: 120 }}>
    <InputLabel>{filters.categoryFilterLabel}</InputLabel>
    <Select ...>...</Select>
  </FormControl>
  <FilterButton onClick={onClearFilters}>{filters.clear}</FilterButton>
</Box>
```

### Pagination

Client-side pagination via `paginationOptions`:
- `mode: 'client'`
- `pageSize: pageSize` (default: 25)
- `pageSizeOptions: [10, 25, 50]`
- `page: page`
- `onPageChange: onPageChange`

---

## 10. Mobile View Specification

### Card Item (`VariableCardItem`)

Each `MobileCardListItem` shows:
- **Top row**: `VariableKeyChip` (monospace `{{key}}`) + `VariableTypeBadge` + `VariableCategoryBadge`
- **Middle**: Variable name in `Typography` variant `labelLg` bold
- **Description**: Truncated to 2 lines (`-webkit-line-clamp: 2`)
- **Bottom row**: `TemplateCount` icon + count, right-aligned `MoreVertOutlined` `IconButton` opening context menu

### Mobile Card Menu

- `Menu` component anchored to `MoreVertOutlined` icon
- Menu items: "Edit" (`EditOutlined`), "Delete" (`DeleteOutlined` — hidden if `isSystem` or `!canManage`)
- Tap outside menu dismisses it

### Mobile FAB

- `MobileFab` with `AddOutlined` icon
- `label={labels.actions.newVariable}`
- Hidden when `!canManage`

### Mobile Search

- `TextField` `fullWidth` with `SearchOutlined` `InputAdornment`
- Placeholder from i18n
- Debounced 300ms — stores in `certVariablesStore.searchQuery`

### Mobile Pagination

`paginationOptions` on `MobileCardList`:
- `mode: 'client'`
- Same page/pageSize as desktop

---

## 11. Create/Edit Dialog Specification

### Dialog Component: `VariableDialog`

- `Dialog` with `fullScreen` on mobile (via `useMediaQuery`), centered modal on desktop
- `maxWidth: 'md'` (960px) on desktop
- `DialogTitle` with title (`form.createTitle` or `form.editTitle`) + close `IconButton`
- `DialogContent` with scrollable `Box` containing form grid
- `DialogActions` with Save + Cancel buttons

### Form Layout (Desktop — 2-column grid)

```
DialogContent
├── Grid container spacing={2}
│   ├── Grid item xs={6}: Name TextField
│   ├── Grid item xs={6}: Key TextField (auto-gen, editable in create; disabled in edit)
│   ├── Grid item xs={6}: Type Select (disabled in edit)
│   ├── Grid item xs={6}: Category Select
│   ├── Grid item xs={12}: Variable Preview (VariablePreviewChip)
│   ├── Grid item xs={12}: Default Value (type-specific)
│   ├── Grid item xs={12}: Description TextField multiline
│   ├── Grid item xs={12}: Type Config Fields (type-specific)
│   ├── Grid item xs={12}: Enum Values Editor (if type=select)
│   └── Grid item xs={12}: Validation Rules Accordion
└── DialogActions: Save button + Cancel button
```

### Zod Validation Schema (described, not coded)

**Create schema:**
- `name`: `z.string().min(1).max(100)`
- `key`: `z.string().regex(/^[a-z][a-z0-9_]*$/).min(1).max(50)` — uniqueness checked via Apollo query
- `type`: `z.enum(['text', 'number', 'date', 'select'])`
- `category`: `z.enum(['static', 'dynamic', 'computed', 'user_input'])`
- `defaultValue`: conditional `z.string()` — required if `category === 'static'`, null if `category === 'computed'`
- `description`: `z.string().max(500).optional()`
- `config`: discriminated union by `type` (text/number/date/select) — each branch validates type-specific fields
- `enumValues`: `z.array(z.object({ key: z.string().regex(/^[a-z][a-z0-9_]*$/), label: z.string().min(1) })).min(2)` — required if `type === 'select'`
- `validationRules`: optional object with type-conditional fields

**Edit schema**: same as create but `key` and `type` are omitted (immutable).

### Save flow:
1. Validate via `variableSchemas.create.safeParse(draft)` (or `.edit`)
2. If valid → `onSaveCreate()` → `CreateVariableMutation`
3. Optimistic update: insert temp row with negative ID
4. On error: rollback, show error toast
5. On success: close dialog, show success toast

---

## 12. Interaction States

| State | Desktop Visual | Mobile Visual |
|-------|---------------|--------------|
| Loading | `AppDataGrid` loading overlay (`CircularProgress`) | `MobileCardList` loading prop (`LinearProgress`) |
| Error | Error `Alert` banner with retry `Button` | Error `Alert` banner |
| Empty | `AppDataGrid` `emptyMessage` prop | `MobileCardList` `emptyMessage` prop |
| Creating | Save button `CircularProgress` size="small" | Same |
| Editing | Save button `CircularProgress` size="small" | Same |
| Deleting | Delete button `CircularProgress` size="small" | Same |
| Dirty | dialog backdrop dismiss triggers confirm | Same |
| KeyChecking | Key field shows `CircularProgress` adornment | Same |

---

## 13. i18n Specification

### Namespace Registration

All namespaces registered via `defineNamespace<Labels>(id, { load })` in `shared/locale/namespaces/certificates/`. Wired to types in `shared/locale/types/certificates/variables.ts`. EN impls in `shared/locale/en/certificates/variables/`. AR impls in `shared/locale/ar/certificates/variables/`. Registered in `namespaces/translation.ts` under `Translation.Certificates.VariablesXxx`.

### Type Schema (shared/locale/types/certificates/variables.ts)

```typescript
interface ShellLabels {
  pageTitle: string;
  pageSubtitle: string;
  breadcrumbRoot: string;
  breadcrumbSection: string;
  breadcrumbCurrent: string;
  sidebarLabel: string;
}

interface ColumnLabels {
  name: string;
  key: string;
  type: string;
  category: string;
  defaultValue: string;
  description: string;
  templates: string;
  status: string;
  statusActive: string;
  statusArchived: string;
}

interface FilterLabels {
  searchPlaceholder: string;
  typeFilterLabel: string;
  categoryFilterLabel: string;
  all: string;
  clear: string;
  noResults: string;
}

interface ActionLabels {
  newVariable: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  addOption: string;
  removeOption: string;
  discard: string;
  keepEditing: string;
}

interface DialogLabels {
  createTitle: string;
  editTitle: string;
  fieldName: string;
  fieldKey: string;
  fieldType: string;
  fieldCategory: string;
  fieldDefaultValue: string;
  fieldDescription: string;
  fieldValidationRules: string;
  fieldMinLength: string;
  fieldMaxLength: string;
  fieldPattern: string;
  fieldMinValue: string;
  fieldMaxValue: string;
  fieldDecimalPlaces: string;
  fieldDateFormat: string;
  fieldRelativeDate: string;
  fieldRequired: string;
  fieldCustomValidationMessage: string;
  fieldEnumValues: string;
  fieldOptionKey: string;
  fieldOptionLabel: string;
  previewLabel: string;
  hintKeyFormat: string;
  hintDynamicDefault: string;
  hintComputedDefault: string;
  typeLockedTooltip: string;
  keyLockedTooltip: string;
  errorNameRequired: string;
  errorKeyRequired: string;
  errorKeyFormat: string;
  errorKeyNotUnique: string;
  errorTypeRequired: string;
  errorCategoryRequired: string;
  errorDefaultValueRequired: string;
  errorMinLength: string;
  errorMaxLength: string;
  errorMinMax: string;
  errorDecimalPlaces: string;
  errorDateFormatRequired: string;
  errorEnumMinOptions: string;
  errorEnumUniqueKeys: string;
  errorEnumKeyRequired: string;
  errorEnumLabelRequired: string;
  errorEnumKeyFormat: string;
  errorPattern: string;
}

interface NotificationLabels {
  createSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
  deleteError: string;
  createError: string;
  updateError: string;
  loadError: string;
}

interface TypeLabels {
  text: string;
  number: string;
  date: string;
  select: string;
}

interface CategoryLabels {
  static: string;
  dynamic: string;
  computed: string;
  user_input: string;
  staticDescription: string;
  dynamicDescription: string;
  computedDescription: string;
  userInputDescription: string;
}

interface EmptyStateLabels {
  title: string;
  description: string;
}

interface DeleteDialogLabels {
  confirmTitle: string;
  confirmMessage: (name: string) => string;
  dependencyWarningTitle: string;
  dependencyWarningMessage: (count: number) => string;
  deleteAnyway: string;
  delete: string;
  cancel: string;
}
```

### EN Translations (key values)

All values defined in `shared/locale/en/certificates/variables/`. Example structure:
- `shell.pageTitle` = "Variables", `shell.pageSubtitle` = "Manage certificate variable definitions"
- `columns.name` = "Name", `columns.key` = "Key", `columns.type` = "Type", `columns.category` = "Category", `columns.defaultValue` = "Default Value", `columns.description` = "Description", `columns.templates` = "Templates", `columns.status` = "Status"
- `types.text` = "Text", `types.number` = "Number", `types.date` = "Date", `types.select` = "Select"
- `categories.static` = "Static", `categories.dynamic` = "Dynamic", `categories.computed` = "Computed", `categories.user_input` = "User Input"
- `deleteDialog.dependencyWarningMessage` = `(count: number) => count === 1 ? "This variable is used by 1 template." : \`This variable is used by ${count} templates.\``

### AR Translations

All values defined in `shared/locale/ar/certificates/variables/`. Arabic pluralization for `dependencyWarningMessage`:
- `count === 0` → "لا تستخدم أي قالب هذا المتغير."
- `count === 1` → "يستخدم قالب واحد هذا المتغير."
- `count === 2` → "يستخدم قالبان هذا المتغير."
- `count >= 3 && count <= 10` → `يستخدم ${count} قوالب هذا المتغير.`
- `count > 10` → `يستخدم ${count} قالبًا هذا المتغير.`

---

## 14. Permission Integration

### Server-Side (page.tsx)

```
requirePermissionForPage(userId, [AppPermission.CertificateTemplateManage], locale, ctx)
```

Returns `{ allowed: boolean, reason?: string }`. If `!allowed`, renders permission-denied component.

### Client-Side (Container)

```
<RequirePermission permissions={[GraphQLAppPermission.CertificateTemplateManage]}>
  <CertVariablesContainer />
</RequirePermission>
```

### ViewModel Permission

```
const canManage = hasPermission(AppPermission.CertificateTemplateManage);
```

Drives: create button visibility, edit/delete row action visibility, FAB visibility on mobile.

---

## 15. Navigation / Route Specification

### Route

- Path: `/certificates/variables`
- App Router group: `(dashboard)`
- File: `app/(dashboard)/certificates/variables/page.tsx`

### Sidebar

- Section: "Certificates" (new sidebar section, or existing if Plan 12 adds it)
- Entry: "Variables" with `CategoryOutlined` or `VariableRemoveOutlined` icon
- Requires `CertificateView` permission (visible in sidebar) and `CertificateTemplateManage` for full CRUD

### Breadcrumbs

- Desktop: Home → Certificates → Variables (via `Breadcrumbs` component)
- Mobile: Home → Variables (simplified)

### Page Metadata

```
generateMetadata(): { title: t.certTranslations.variablesShell.pageTitle }
```

---

## 16. Design Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Plan 1 does not define global `certificate_variables` table | Document dependency on Plan 1; block if table is per-template |
| Plan 2 does not define `CertificateVariableCategory` enum | Add as 12th enum in Plan 2; block Plan 13 until confirmed |
| templateCount requires cross-table join | GraphQL resolver computes `templateCount` via join with binding table (Plan 5 scope) |
| Key uniqueness check round-trip latency | Debounce 300ms; use `useQuery` with `skip` option |
| Optimistic update conflict (concurrent edits) | Apollo `errorPolicy: 'none'` auto-rolls back on mutation error |
| Large enumValues list performance (100+ options) | Cap at 100 options; show warning beyond 50 |
| Mobile dialog full-screen usability | Use `Dialog` `fullScreen` on mobile with sticky header + sticky actions |

---

## 17. Design Decisions Summary Table

| # | Decision | Rationale |
|---|---------|----------|
| 1 | Standalone admin page (not inline) | Global scope, standard pattern, sidebar discovery |
| 2 | Global variables (not per-template) | Deduplication, consistency, cross-template reuse |
| 3 | Dual classification (type + category) | Separates format from origin; richer metadata |
| 4 | Key and type immutable post-creation | Prevents binding breakage, data integrity |
| 5 | Zustand for filters/pagination/dialog, Apollo for list | Clean separation; survives tier switch |
| 6 | Optimistic mutations with rollback | Instant UI feedback; auto rollback on error |
| 7 | Responsive dialog (fullScreen mobile) | Native mobile UX |
| 8 | Standard permission (`CertificateTemplateManage`) | No new permission key needed |
| 9 | Client-side pagination (pageSize 10/25/50) | Expected <500 variables globally |
| 10 | Dependency-aware deletion | Prevents breaking templates that reference variable |

---

## 18. SWE Expert Review Notes

> Added 2026-08-02. This section supersedes the inline-panel review from the prior version.

### Key architectural shifts from prior review:

1. **Global vs per-template**: Variables are now global definitions. The `certificate_variables` table (Plan 1) must be global — not bound to `template_id`. Template bindings reference variables by `key`. This is a Plan 1 schema dependency.

2. **New enum**: `CertificateVariableCategory` (static/dynamic/computed/user_input) must be added to Plan 2's enum catalog. Currently 11 enums (INTER_PLAN_CONTRACTS.md §4) — this becomes the 12th.

3. **No system variable seeding**: The prior design seeded 7 system variables per template. The new design either: (a) has NO system variables (all user-created), or (b) has pre-seeded system variables created during deployment. Recommendation: seed system variables on deployment (migration), with `isSystem = true`, immutable in key/type/name. The keys (`student_name`, `student_id`, `grade_level`, `completion_date`, `certificate_id`, `issue_date`, `verification_code`) are defined in `SYSTEM_VARIABLE_KEYS` constant (Plan 2/4 boundary).

4. **Resolved value shape contract**: The contract from the prior review still applies. Each data type emits a specific resolved value format at generation time:
   - `text` → string
   - `number` → number formatted to `decimalPlaces`
   - `date` → ISO date string (formatted at render)
   - `select` → selected key (map to label at render)
   This contract is owned by Plan 4 and referenced by Plan 6/17.

5. **Ownership scoping**: Not applicable in the new architecture — all variables are global, not per-template. SUPER_ADMIN and ACADEMY_ADMIN manage global variables; TEACHER is view-only.

6. **`templateCount` computed field**: The GraphQL resolver must join `certificate_variables` with the binding table to compute `templateCount`. This is a Plan 5 implementation detail.

---

## Round 2 Enhancement: Complete Specifications

### Variable Form Component Props (Full TypeScript Interfaces)

```typescript
// Core form props for create/edit dialog
interface VariableFormProps {
  initialData?: TemplateVariableReturnType;
  onSubmit: (data: VariableSubmitInput) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  t: (key: string) => string;
  isEditing: boolean;
  systemKeys: Set<string>; // For key validation against system variables
}

// Complete submit input type matching GraphQL mutation
interface VariableSubmitInput {
  name: string;
  key: string;
  type: VariableDataType;
  category: VariableCategory;
  defaultValue: string;
  description: string;
  enumValues: string[];        // For select type
  validationRules: ValidationRules;
  isRequired: boolean;
  // Immutable after creation (not in edit mode):
  // key: string;
  // type: VariableDataType;
}

type VariableDataType = 'text' | 'number' | 'date' | 'select' | 'image';
type VariableCategory = 'static' | 'dynamic' | 'computed' | 'user_input';

interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  decimalPlaces?: number;
  dateFormat?: string;
  customRegex?: string;
  customMessage?: string;
}

// Type-specific form section props
interface TypeSpecificSectionProps {
  type: VariableDataType;
  value: string;
  onChange: (value: string) => void;
  validationRules: ValidationRules;
  disabled?: boolean;
  t: (key: string) => string;
  error?: string;
}

interface TextTypeSectionProps extends TypeSpecificSectionProps {
  type: 'text';
  multiline?: boolean;
}

interface NumberTypeSectionProps extends TypeSpecificSectionProps {
  type: 'number';
  step?: number;
  precision?: number;
}

interface DateTypeSectionProps extends TypeSpecificSectionProps {
  type: 'date';
  showTime?: boolean;
  minDate?: string;
  maxDate?: string;
}

interface SelectTypeSectionProps extends TypeSpecificSectionProps {
  type: 'select';
  options: SelectOption[];
  onOptionsChange: (options: SelectOption[]) => void;
  allowCustomValue?: boolean;
}

interface ImageTypeSectionProps extends TypeSpecificSectionProps {
  type: 'image';
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  previewUrl?: string;
  onPreviewChange: (url: string) => void;
}

interface SelectOption {
  id: string;
  value: string;
  label: string;
  order: number;
}
```

### CSV Import Dialog Component (Complete Design)

```typescript
interface CSVImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (variables: VariableCSVImport[]) => void;
  t: (key: string) => string;
}

interface VariableCSVImport {
  name: string;
  key: string;
  type: VariableDataType;
  category: VariableCategory;
  defaultValue: string;
  description: string;
  enumValues?: string; // Semicolon-separated for CSV
  validationRules?: string; // JSON stringified
  isRequired?: boolean;
}

// CSV Import Dialog State
interface CSVImportDialogState {
  file: File | null;
  previewData: VariableCSVImport[];
  validationErrors: CSVValidationError[];
  stage: 'upload' | 'preview' | 'importing' | 'complete';
  importedCount: number;
  failedCount: number;
}

interface CSVValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// CSV Template Structure (downloadable)
const CSV_TEMPLATE_HEADERS = [
  'name', 'key', 'type', 'category', 'defaultValue', 
  'description', 'enumValues', 'validationRules', 'isRequired'
];

// CSV Import Flow:
// 1. User clicks "Import from CSV" button → opens dialog (stage: 'upload')
// 2. Drag-and-drop zone or file picker → FileReader reads CSV
// 3. Parse CSV → validate each row → build previewData + validationErrors
// 4. Stage changes to 'preview' → show table with errors highlighted
// 5. User can: fix file and re-upload, or proceed with valid rows only
// 6. Click "Import Valid Rows" → stage: 'importing' → batch mutate via GraphQL
// 7. Stage: 'complete' → show summary (imported/failed) → auto-close after 3s
```

### Variable Usage Display Component (Complete Design)

```typescript
interface VariableUsageListProps {
  variableId: string;
  usages: VariableUsage[];
  loading: boolean;
  t: (key: string) => string;
  onNavigateToTemplate: (templateId: string) => void;
}

interface VariableUsage {
  elementId: string;
  elementLabel: string;
  elementType: string; // 'text', 'image', 'signature', 'qr', etc.
  templateId: string;
  templateName: string;
  templateStatus: 'draft' | 'published' | 'archived';
  bindingPath: string; // JSON path where variable is used
  lastUsed: string; // ISO date
}

// Usage Display Features:
// - Table/List showing all template elements bound to this variable
// - Columns: Template Name, Element Label, Element Type, Status, Last Used
// - Row click → navigate to Template Editor at that element (Plan 10)
// - Status badge: Draft (gray), Published (green), Archived (orange)
// - Empty state: "This variable is not used by any template element"
// - Loading skeleton while fetching
// - Error state with retry button
```

### Zustand Store (variablePanelStore) Complete Shape

```typescript
// File: frontend/common/stores/variablePanelStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface VariablePanelState {
  // Form state
  formOpen: boolean;
  formMode: 'create' | 'edit' | 'view';
  editingVariableId: string | null;
  formData: Partial<VariableSubmitInput>;
  formErrors: Record<string, string>;
  formTouched: Record<string, boolean>;
  formDirty: boolean;
  
  // Confirmation dialogs
  deleteConfirmOpen: boolean;
  deleteConfirmVariableId: string | null;
  deleteConfirmUsages: VariableUsage[]; // For impact warning
  typeChangeConfirmOpen: boolean;
  typeChangeConfirmData: { from: VariableDataType; to: VariableDataType } | null;
  keyChangeConfirmOpen: boolean;
  keyChangeConfirmData: { oldKey: string; newKey: string; bindingCount: number } | null;
  
  // CSV Import
  csvImportOpen: boolean;
  csvImportState: CSVImportDialogState;
  
  // List/Filters (if panel has embedded list)
  searchQuery: string;
  typeFilter: VariableDataType | null;
  categoryFilter: VariableCategory | null;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // System variables
  systemVariableKeys: Set<string>;
  
  // Actions
  // Form
  openCreateForm: () => void;
  openEditForm: (variable: TemplateVariableReturnType) => void;
  openViewForm: (variable: TemplateVariableReturnType) => void;
  closeForm: () => void;
  setFormData: (data: Partial<VariableSubmitInput>) => void;
  setFormField: (field: string, value: unknown) => void;
  setFormError: (field: string, error: string) => void;
  clearFormError: (field: string) => void;
  setFormTouched: (field: string, touched: boolean) => void;
  setFormDirty: (dirty: boolean) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  
  // Confirmations
  openDeleteConfirm: (variableId: string, usages: VariableUsage[]) => void;
  closeDeleteConfirm: () => void;
  openTypeChangeConfirm: (from: VariableDataType, to: VariableDataType) => void;
  closeTypeChangeConfirm: () => void;
  openKeyChangeConfirm: (oldKey: string, newKey: string, bindingCount: number) => void;
  closeKeyChangeConfirm: () => void;
  
  // CSV Import
  openCSVImport: () => void;
  closeCSVImport: () => void;
  setCSVImportFile: (file: File | null) => void;
  setCSVImportPreview: (data: VariableCSVImport[], errors: CSVValidationError[]) => void;
  setCSVImportStage: (stage: CSVImportDialogState['stage']) => void;
  setCSVImportResult: (imported: number, failed: number) => void;
  resetCSVImport: () => void;
  
  // Filters
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: VariableDataType | null) => void;
  setCategoryFilter: (category: VariableCategory | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (by: string, order: 'asc' | 'desc') => void;
  resetFilters: () => void;
  
  // System
  setSystemVariableKeys: (keys: Set<string>) => void;
  isSystemVariable: (key: string) => boolean;
}

export const useVariablePanelStore = create<VariablePanelState>()(
  devtools(
    (set, get) => ({
      // Initial state
      formOpen: false,
      formMode: 'create',
      editingVariableId: null,
      formData: {},
      formErrors: {},
      formTouched: {},
      formDirty: false,
      deleteConfirmOpen: false,
      deleteConfirmVariableId: null,
      deleteConfirmUsages: [],
      typeChangeConfirmOpen: false,
      typeChangeConfirmData: null,
      keyChangeConfirmOpen: false,
      keyChangeConfirmData: null,
      csvImportOpen: false,
      csvImportState: {
        file: null,
        previewData: [],
        validationErrors: [],
        stage: 'upload',
        importedCount: 0,
        failedCount: 0,
      },
      searchQuery: '',
      typeFilter: null,
      categoryFilter: null,
      page: 1,
      pageSize: 25,
      sortBy: 'name',
      sortOrder: 'asc',
      systemVariableKeys: new Set([
        'student_name', 'student_id', 'grade_level', 
        'completion_date', 'certificate_id', 'issue_date', 'verification_code'
      ]),
      
      // Action implementations...
      // (Full implementation in actual file)
    }),
    { name: 'variable-panel-store' }
  )
);
```

### Complete i18n Key Tables (English + Arabic)

#### certificates.variables.list

| Key | English | Arabic |
|-----|---------|--------|
| title | Template Variables | متغيرات القالب |
| subtitle | Manage global certificate variables | إدارة متغيرات الشهادات العامة |
| createButton | Create Variable | إنشاء متغير |
| importButton | Import from CSV | استيراد من CSV |
| searchPlaceholder | Search variables by name or key... | ابحث عن متغيرات بالاسم أو المفتاح... |
| filterType | Filter by Type | تصفية حسب النوع |
| filterCategory | Filter by Category | تصفية حسب الفئة |
| filterAll | All Types | جميع الأنواع |
| filterAllCategories | All Categories | جميع الفئات |
| typeText | Text | نص |
| typeNumber | Number | رقم |
| typeDate | Date | تاريخ |
| typeSelect | Select | اختيار |
| typeImage | Image | صورة |
| categoryStatic | Static | ثابت |
| categoryDynamic | Dynamic | ديناميكي |
| categoryComputed | Computed | محسوب |
| categoryUserInput | User Input | إدخال مستخدم |
| tableHeaderName | Name | الاسم |
| tableHeaderKey | Key | المفتاح |
| tableHeaderType | Type | النوع |
| tableHeaderCategory | Category | الفئة |
| tableHeaderDefaultValue | Default Value | القيمة الافتراضية |
| tableHeaderTemplates | Templates | القوالب |
| tableHeaderActions | Actions | إجراءات |
| emptyStateTitle | No variables yet | لا توجد متغيرات بعد |
| emptyStateDescription | Create your first variable to get started | أنشئ أول متغير للبدء |
| emptyStateAction | Create Variable | إنشاء متغير |
| loading | Loading variables... | جاري تحميل المتغيرات... |
| errorLoad | Failed to load variables | فشل تحميل المتغيرات |
| retry | Retry | إعادة المحاولة |
| paginationRowsPerPage | Rows per page: | صفوف في الصفحة: |
| paginationOf | of | من |
| sortByName | Sort by Name | ترتيب حسب الاسم |
| sortByKey | Sort by Key | ترتيب حسب المفتاح |
| sortByType | Sort by Type | ترتيب حسب النوع |
| sortByCategory | Sort by Category | ترتيب حسب الفئة |
| sortByTemplates | Sort by Templates | ترتيب حسب القوالب |

#### certificates.variables.form

| Key | English | Arabic |
|-----|---------|--------|
| createTitle | Create Variable | إنشاء متغير |
| editTitle | Edit Variable | تعديل المتغير |
| viewTitle | Variable Details | تفاصيل المتغير |
| nameLabel | Variable Name * | اسم المتغير * |
| namePlaceholder | Enter variable name | أدخل اسم المتغير |
| nameHelper | Display name shown in UI | الاسم المعروض في الواجهة |
| keyLabel | Variable Key * | مفتاح المتغير * |
| keyPlaceholder | Enter unique key (e.g., student_name) | أدخل مفتاح فريد (مثال: student_name) |
| keyHelper | Unique identifier used in templates. Immutable after creation. | معرف فريد يستخدم في القوالب. لا يمكن تغييره بعد الإنشاء. |
| keyValidationExists | A variable with this key already exists | يوجد متغير بهذا المفتاح بالفعل |
| keyValidationSystem | This key is reserved for system variables | هذا المفتاح محجوز للمتغيرات النظامية |
| keyValidationPattern | Key must be lowercase with underscores only | المفتاح يجب أن يكون أحرف صغيرة وشرطات سفلية فقط |
| typeLabel | Data Type * | نوع البيانات * |
| typeHelper | Format of the variable value. Immutable after creation. | تنسيق قيمة المتغير. لا يمكن تغييره بعد الإنشاء. |
| categoryLabel | Source Category * | فئة المصدر * |
| categoryHelper | Where does this variable's value come from? | من أين تأتي قيمة هذا المتغير؟ |
| categoryStaticDesc | Fixed value set by admin | قيمة ثابتة يحددها المشرف |
| categoryDynamicDesc | Value fetched from external source at generation | قيمة تجلب من مصدر خارجي عند التوليد |
| categoryComputedDesc | Value calculated from other variables | قيمة تحسب من متغيرات أخرى |
| categoryUserInputDesc | Value entered by user during generation | قيمة يدخلها المستخدم أثناء التوليد |
| defaultValueLabel | Default Value | القيمة الافتراضية |
| defaultValuePlaceholder | Enter default value | أدخل القيمة الافتراضية |
| defaultValueHelper | Value used when no dynamic/computed value is available | القيمة المستخدمة عندما لا تتوفر قيمة ديناميكية/محسوبة |
| defaultValueDisabledComputed | Default value not used for computed variables | القيمة الافتراضية لا تستخدم للمتغيرات المحسوبة |
| defaultValueHintDynamic | Dynamic variables fetch value at generation time | المتغيرات الديناميكية تجلب القيمة عند التوليد |
| descriptionLabel | Description | الوصف |
| descriptionPlaceholder | Optional description | وصف اختياري |
| isRequiredLabel | Required Field | حقل مطلوب |
| isRequiredHelper | User must provide a value during certificate generation | يجب على المستخدم توفير قيمة أثناء توليد الشهادة |
| selectOptionsLabel | Options | الخيارات |
| selectOptionsHelper | Add options for select type. Drag to reorder. | أضف خيارات لنوع الاختيار. اسحب لإعادة الترتيب. |
| selectOptionsAddButton | Add Option | إضافة خيار |
| selectOptionsValueLabel | Value | القيمة |
| selectOptionsLabelLabel | Label | التسمية |
| selectOptionsRemoveTooltip | Remove option | إزالة الخيار |
| selectOptionsDragTooltip | Drag to reorder | اسحب لإعادة الترتيب |
| selectOptionsEmpty | No options added yet | لم تتم إضافة خيارات بعد |
| selectOptionsMinWarning | Select type requires at least 2 options | نوع الاختيار يتطلب خيارين على الأقل |
| validationRulesLabel | Validation Rules | قواعد التحقق |
| validationRulesMinLength | Minimum Length | الحد الأدنى للطول |
| validationRulesMaxLength | Maximum Length | الحد الأقصى للطول |
| validationRulesPattern | Regex Pattern | نمط التعبير العادي |
| validationRulesMin | Minimum Value | القيمة الدنيا |
| validationRulesMax | Maximum Value | القيمة العليا |
| validationRulesDecimalPlaces | Decimal Places | المنازل العشرية |
| validationRulesDateFormat | Date Format | تنسيق التاريخ |
| validationRulesCustomRegex | Custom Regex | تعبير عادي مخصص |
| validationRulesCustomMessage | Custom Error Message | رسالة خطأ مخصصة |
| cancelButton | Cancel | إلغاء |
| saveButton | Save Variable | حفظ المتغير |
| savingButton | Saving... | جاري الحفظ... |
| errorCreate | Failed to create variable | فشل إنشاء المتغير |
| errorUpdate | Failed to update variable | فشل تحديث المتغير |
| errorKeyImmutable | Key cannot be changed after creation | لا يمكن تغيير المفتاح بعد الإنشاء |
| errorTypeImmutable | Data type cannot be changed after creation | لا يمكن تغيير نوع البيانات بعد الإنشاء |

#### certificates.variables.delete

| Key | English | Arabic |
|-----|---------|--------|
| confirmTitle | Delete Variable | حذف المتغير |
| confirmMessage | Are you sure you want to delete "{name}"? | هل أنت متأكد من حذف "{name}"؟ |
| confirmWarning | This action cannot be undone. | لا يمكن التراجع عن هذا الإجراء. |
| impactTitle | Impact Warning | تحذير التأثير |
| impactMessage | This variable is used by {count} template element(s). Deleting it will break those templates. | هذا المتغير مستخدم في {count} عنصر قالب. حذفه سيكسر تلك القوالب. |
| impactZeroMessage | This variable is not used by any template element. Safe to delete. | هذا المتغير غير مستخدم في أي عنصر قالب. آمن للحذف. |
| impactListTitle | Affected Elements: | العناصر المتأثرة: |
| impactElementRow | {templateName} → {elementLabel} ({elementType}) | {templateName} → {elementLabel} ({elementType}) |
| confirmDeleteButton | Delete Variable | حذف المتغير |
| cancelButton | Cancel | إلغاء |
| deletingButton | Deleting... | جاري الحذف... |
| success | Variable deleted successfully | تم حذف المتغير بنجاح |
| error | Failed to delete variable | فشل حذف المتغير |
| errorInUse | Cannot delete variable in use by templates | لا يمكن حذف متغير مستخدم في قوالب |
| forceDeleteLabel | Force delete (break bindings) | حذف قسري (كسر الروابط) |
| forceDeleteWarning | This will permanently remove the variable from all templates | سيزيل هذا المتغير نهائياً من جميع القوالب |

#### certificates.variables.csv

| Key | English | Arabic |
|-----|---------|--------|
| dialogTitle | Import Variables from CSV | استيراد متغيرات من CSV |
| dragDropZone | Drag and drop CSV file here, or click to browse | اسحب وأفلت ملف CSV هنا، أو انقر للتصفح |
| dragDropActive | Drop file to upload | أسقط الملف للرفع |
| fileSelected | File selected: {fileName} ({fileSize}) | تم اختيار الملف: {fileName} ({fileSize}) |
| templateDownload | Download CSV Template | تحميل قالب CSV |
| templateDownloadDesc | Use this template for correct format | استخدم هذا القالب للتنسيق الصحيح |
| previewTitle | Import Preview ({validCount} valid, {errorCount} errors) | معاينة الاستيراد ({validCount} صالح، {errorCount} خطأ) |
| previewTableHeaderRow | Row | صف |
| previewTableHeaderName | Name | الاسم |
| previewTableHeaderKey | Key | المفتاح |
| previewTableHeaderType | Type | النوع |
| previewTableHeaderCategory | Category | الفئة |
| previewTableHeaderDefaultValue | Default Value | القيمة الافتراضية |
| previewTableHeaderStatus | Status | الحالة |
| previewStatusValid | Valid | صالح |
| previewStatusError | Error | خطأ |
| previewStatusWarning | Warning | تحذير |
| errorRow | Row {row}: {message} | الصف {row}: {message} |
| errorInvalidType | Invalid type: {value}. Must be: text, number, date, select, image | نوع غير صالح: {value}. يجب أن يكون: text, number, date, select, image |
| errorInvalidCategory | Invalid category: {value}. Must be: static, dynamic, computed, user_input | فئة غير صالحة: {value}. يجب أن تكون: static, dynamic, computed, user_input |
| errorDuplicateKey | Duplicate key in CSV: {key} | مفتاح مكرر في CSV: {key} |
| errorKeyExists | Key already exists in database: {key} | المفتاح موجود بالفعل في قاعدة البيانات: {key} |
| errorMissingRequired | Missing required field: {field} | حقل مطلوب مفقود: {field} |
| errorInvalidEnum | Invalid enum values format. Use semicolon-separated values. | تنسيق قيم enum غير صالح. استخدم قيم مفصولة بفاصلة منقوطة. |
| importButton | Import {count} Valid Variables | استيراد {count} متغيرات صالحة |
| importingButton | Importing... | جاري الاستيراد... |
| completeTitle | Import Complete | اكتمل الاستيراد |
| completeMessage | Successfully imported {imported} variable(s). {failed} failed. | تم استيراد {imported} متغير(ة) بنجاح. {failed} فشل. |
| completeButton | Done | تم |
| viewErrorsButton | View Errors ({count}) | عرض الأخطاء ({count}) |

#### certificates.variables.usage

| Key | English | Arabic |
|-----|---------|--------|
| title | Used By | مستخدم بواسطة |
| subtitle | Templates and elements using this variable | القوالب والعناصر المستخدمة لهذا المتغير |
| emptyState | This variable is not used by any template element | هذا المتغير غير مستخدم في أي عنصر قالب |
| tableHeaderTemplate | Template | القالب |
| tableHeaderElement | Element | العنصر |
| tableHeaderType | Type | النوع |
| tableHeaderStatus | Status | الحالة |
| tableHeaderLastUsed | Last Used | آخر استخدام |
| statusDraft | Draft | مسودة |
| statusPublished | Published | منشور |
| statusArchived | Archived | مؤرشف |
| navigateTooltip | Open in Template Editor | فتح في محرر القالب |
| loading | Loading usage... | جاري تحميل الاستخدام... |
| error | Failed to load usage | فشل تحميل الاستخدام |

#### certificates.variables.type (Type-specific labels)

| Key | English | Arabic |
|-----|---------|--------|
| text | Text | نص |
| number | Number | رقم |
| date | Date | تاريخ |
| select | Select | اختيار |
| image | Image | صورة |
| textDescription | Free-form text input | إدخال نص حر |
| numberDescription | Numeric value with optional decimals | قيمة رقمية مع منازل عشرية اختيارية |
| dateDescription | Date picker with optional time | منتقي تاريخ مع وقت اختياري |
| selectDescription | Dropdown with predefined options | قائمة منسدلة بخيارات محددة مسبقاً |
| imageDescription | Image upload with preview | رفع صورة مع معاينة |

#### certificates.variables.category (Category-specific labels)

| Key | English | Arabic |
|-----|---------|--------|
| static | Static | ثابت |
| dynamic | Dynamic | ديناميكي |
| computed | Computed | محسوب |
| user_input | User Input | إدخال مستخدم |
| staticDescription | Value set by administrator | قيمة يحددها المشرف |
| dynamicDescription | Value fetched from external API at generation | قيمة تجلب من واجهة برمجة خارجية عند التوليد |
| computedDescription | Value calculated from other variables via formula | قيمة تحسب من متغيرات أخرى عبر صيغة |
| userInputDescription | Value entered by user during certificate generation | قيمة يدخلها المستخدم أثناء توليد الشهادة |

### Mobile vs Desktop Differences (Complete Specification)

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **List View** | `DesktopAppDataGrid` with columns: Name, Key, Type, Category, Default Value, Templates, Actions | `MobileCardList` with cards showing: Name, Key (badge), Type (icon), Category (chip), Default Value (truncated), Template Count (badge) |
| **Filter Bar** | `FilterBar` component with: Search (text), Type (select), Category (select), PageSize (select), Sort (select) | `MobileFilterBar`: Search (text input), Type (chip group), Category (chip group), "More Filters" bottom sheet |
| **Create/Edit Dialog** | `Dialog` maxWidth="md" (600px), side-by-side label/input layout | `Dialog` fullScreen=true, stacked label/input layout, sticky header with title/close, sticky footer with actions |
| **Delete Confirm** | Standard `Dialog` | `Dialog` fullScreen=true, warning prominent |
| **CSV Import** | `Dialog` maxWidth="lg" (900px), preview table full width | `Dialog` fullScreen=true, preview table horizontal scroll, stepper for upload→preview→import |
| **Usage Display** | `Dialog` maxWidth="xl" (1200px), full table | `Dialog` fullScreen=true, card list for usages |
| **Type Selector** | `RadioGroup` horizontal with icons | `RadioGroup` vertical stacked, full width options |
| **Select Options** | `Sortable` list with drag handle, inline edit | `Sortable` list with drag handle, edit in bottom sheet |
| **Pagination** | `TablePagination` component | `MobilePagination` with prev/next + page indicator |
| **Empty State** | Centered illustration + action button | Full-screen illustration + FAB |
| **Loading** | Skeleton rows in grid | Skeleton cards in list |

### GraphQL Documents (Complete Specification)

```typescript
// File: frontend/common/graphql/sharedDocuments/variables.documents.ts

// ============ QUERIES ============

export const CertVariablesQueryDocument = gql`
  query CertVariables(
    $filter: VariableFilterInput
    $pagination: PaginationInput
    $sort: VariableSortInput
  ) {
    certVariables(filter: $filter, pagination: $pagination, sort: $sort) {
      items {
        id
        name
        key
        type
        category
        defaultValue
        description
        enumValues
        validationRules
        isRequired
        isSystem
        templateCount
        createdAt
        updatedAt
      }
      pageInfo {
        page
        pageSize
        total
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const CertVariableDetailQueryDocument = gql`
  query CertVariableDetail($id: ID!) {
    certVariable(id: $id) {
      id
      name
      key
      type
      category
      defaultValue
      description
      enumValues
      validationRules
      isRequired
      isSystem
      templateCount
      createdAt
      updatedAt
    }
  }
`;

export const CertVariableBindingsQueryDocument = gql`
  query CertVariableBindings($variableId: ID!) {
    certVariableBindings(variableId: $variableId) {
      id
      templateId
      templateName
      templateStatus
      elementId
      elementLabel
      elementType
      bindingPath
      lastUsedAt
    }
  }
`;

export const CertVariableKeyExistsQueryDocument = gql`
  query CertVariableKeyExists($key: String!, $excludeId: ID) {
    certVariableKeyExists(key: $key, excludeId: $excludeId)
  }
`;

// ============ MUTATIONS ============

export const CreateVariableMutationDocument = gql`
  mutation CreateVariable($input: CreateVariableInput!) {
    createVariable(input: $input) {
      id
      name
      key
      type
      category
      defaultValue
      description
      enumValues
      validationRules
      isRequired
      isSystem
      templateCount
      createdAt
      updatedAt
    }
  }
`;

export const UpdateVariableMutationDocument = gql`
  mutation UpdateVariable($id: ID!, $input: UpdateVariableInput!) {
    updateVariable(id: $id, input: $input) {
      id
      name
      key
      type
      category
      defaultValue
      description
      enumValues
      validationRules
      isRequired
      isSystem
      templateCount
      createdAt
      updatedAt
    }
  }
`;

export const DeleteVariableMutationDocument = gql`
  mutation DeleteVariable($id: ID!, $force: Boolean) {
    deleteVariable(id: $id, force: $force) {
      success
      deletedId
      brokenBindingsCount
    }
  }
`;

export const ReorderVariableEnumValuesMutationDocument = gql`
  mutation ReorderVariableEnumValues($variableId: ID!, $enumValues: [EnumValueInput!]!) {
    reorderVariableEnumValues(variableId: $variableId, enumValues: $enumValues) {
      id
      enumValues
    }
  }
`;

// ============ FRAGMENTS ============

export const VariableFieldsFragment = gql`
  fragment VariableFields on CertificateVariable {
    id
    name
    key
    type
    category
    defaultValue
    description
    enumValues
    validationRules
    isRequired
    isSystem
    templateCount
    createdAt
    updatedAt
  }
`;
```

### Interaction States (Complete Matrix)

| Component | State | Visual | Behavior |
|-----------|-------|--------|----------|
| **Variable List** | Loading | Skeleton rows (3-5) | `useQuery` loading state |
| | Error | Alert banner + retry button | `useQuery` error state |
| | Empty | Illustration + "Create Variable" button | `data.items.length === 0` |
| | Success | Fade-in rows | Apollo cache update |
| **Create/Edit Form** | Pristine | Disabled Save button | `!formDirty` |
| | Dirty | Enabled Save, "Unsaved changes" badge | `formDirty === true` |
| | Validating | Field-level inline errors | `onBlur` validation |
| | Submitting | Save button loading spinner | `mutation.loading` |
| | Success | Toast + close dialog | `onCompleted` callback |
| | Error | Toast + field errors | `onError` callback |
| **Delete Confirm** | Open | Dialog with warning icon + usage list | `deleteConfirmOpen` |
| | Loading | Dialog disabled, spinner on button | `mutation.loading` |
| | Success | Toast, list refresh | `onCompleted` |
| | Error | Toast, dialog stays open | `onError` |
| **CSV Import** | Upload | Drag-drop zone active | `stage === 'upload'` |
| | Preview | Table with validation badges | `stage === 'preview'` |
| | Importing | Progress bar + spinner | `stage === 'importing'` |
| | Complete | Summary stats + done button | `stage === 'complete'` |
| | Error | Error rows highlighted | `validationErrors.length > 0` |
| **Usage Display** | Loading | Skeleton cards | `useQuery` loading |
| | Empty | "Not used" message | `usages.length === 0` |
| | Error | Alert + retry | `useQuery` error |

### Error Handling Strategy

| Error Type | Source | Handling | User Feedback |
|------------|--------|----------|---------------|
| **Network** | Apollo link | Retry 3x with exponential backoff | Toast: "Connection issue. Retrying..." |
| **GraphQL Validation** | Server schema | Field errors mapped to form fields | Inline field errors + toast summary |
| **Key Conflict** | Unique constraint | Check via `CertVariableKeyExistsQuery` before submit | Inline: "Key already exists" |
| **Type Change** | Immutable field | Block in UI, confirm dialog if forced | Confirm dialog: "Changing type resets default value" |
| **Key Change** | Immutable field | Block in UI, confirm dialog shows binding count | Confirm dialog: "Used in X templates" |
| **Delete In Use** | FK constraint | `force` option in mutation | Warning dialog with impact list |
| **CSV Parse** | PapaParse | Row-level errors collected | Preview table with error badges |
| **CSV Import Partial** | Batch mutation | Continue on error, collect results | Summary: "X imported, Y failed" |
| **Permission** | Auth directive | Redirect to 403 or hide actions | Toast: "Insufficient permissions" |
| **Optimistic Update Rollback** | Apollo cache | Auto rollback on mutation error | Toast: "Change reverted. Please try again." |

### Design Decisions Documentation (Extended)

| # | Decision | Context | Alternatives Considered | Trade-offs |
|---|----------|---------|------------------------|------------|
| 11 | CSV Import via Dialog (not page) | Keep user in context | Separate import page | +Context preserved, -Less space for large imports |
| 12 | Enum values as JSON array in DB | Flexible, queryable | Separate table | +Simple, -No FK on enum values |
| 13 | ValidationRules as JSON object | Extensible per type | Columns per rule | +Type-specific rules, -Less queryable |
| 14 | `templateCount` computed in resolver | Real-time accuracy | Denormalized column | +Always accurate, -Join cost |
| 15 | System variables in same table | Single source of truth | Separate table | +Simple queries, -isSystem flag everywhere |
| 16 | Arabic pluralization via functions | Correct grammar | ICU MessageFormat | +Type-safe, -Custom implementation |
| 17 | Select options reorder via mutation | Server-authoritative order | Client-only reorder | +Persisted, -Extra round-trip |
| 18 | Image type stores URL only | External storage (S3) | Base64 in DB | +Scalable, -External dependency |
| 19 | Category drives default value UI | UX clarity | Single field with hints | +Clear affordance, -More complex form |
| 20 | Full-screen mobile dialogs | Native mobile UX | Bottom sheets | +Consistent, -More scroll |

---

## Variable Picker Dialog (Full Spec)

### Component: `VariablePickerDialog`
- **File:** `frontend/views/dashboard/cert/templates/variables/VariablePickerDialog.tsx`
- **Props:** `{ open: boolean, onClose: () => void, onSelect: (variable: VariableDef) => void, allowedCategories?: string[] }`

### Layout (MUI Dialog, maxWidth md, fullHeight)

- **Top:** Search bar (TextField with search icon, placeholder "Search variables...")
- **Middle-left:** Category tabs (vertical MUI Tabs): All | Student Info | Course Info | Academy Info | Date Fields | Custom
- **Middle-right:** Variable cards grid (2 columns):
  - Each card: variable name (bold), type badge (colored chip: text=blue, date=green, number=purple, boolean=orange, image=red), description, sample value in code font
  - Click selects and calls onSelect
- **Bottom:** Recently used variables horizontal scroll (chips)

### Keyboard Interaction
- Tab to navigate, Enter to select, Escape to close

### Empty State
- "No variables found. Try a different search or create a custom variable."

---

## Variable Panel (Editor Right Sidebar)

### Component: `VariablePanel`
- **File:** `frontend/views/dashboard/cert/templates/variables/VariablePanel.tsx`

### Two Sections

#### 1. System Variables (read-only list)
- Pre-populated: studentName, studentEmail, studentId, courseName, courseCode, courseDate, courseDuration, courseGrade, completionDate, expiryDate, academyName, academyLogo, academyAddress, academyWebsite, directorName, directorTitle
- Each entry: name, type badge, description tooltip
- Cannot edit or delete

#### 2. Custom Variables (CRUD)
- Add button (opens VariableEditorDialog)
- List: each row has name, type badge, edit icon, delete icon (with confirmation)
- Empty state: "No custom variables yet. Click + to create one."

---

## Variable Editor Dialog

### Component: `VariableEditorDialog`
- **File:** `frontend/views/dashboard/cert/templates/variables/VariableEditorDialog.tsx`
- **Props:** `{ open: boolean, variable: VariableDef | null (null = create mode), onSave, onClose }`

### Form Fields
- **Name** (TextField, required, must be unique, camelCase)
- **Display Name** (TextField, human readable)
- **Description** (TextField, multi-line)
- **Type** (Select: text | date | number | boolean | image)
- **Default Value** (varies by type — text: TextField, date: DatePicker, number: TextField with validation, boolean: Switch, image: URL upload)
- For date type: Format field (Select: ISO, localized, custom pattern), Locale field
- For number type: Min field, Max field
- For text type: MaxLength field, Pattern (regex) field
- Required toggle (Switch)

### Validation
- Name must not match system variable names
- Name must be camelCase

---

## Inline Autocomplete for Text Elements

### Component: `VariableAutocomplete`
- **File:** `frontend/views/dashboard/cert/templates/variables/VariableAutocomplete.tsx`

### Trigger
- Shows when user types `{{` in any text element's content field

### Dropdown
- List of available variables (system + custom) filtered by current text after `{{`
- Each item: variable name, type badge, description

### Keyboard
- Arrow Up/Down to navigate, Enter to insert, Escape to close

### Insert Behavior
- Completes as `{{variableName}}` and places cursor after `}}`
- Dismissed after insert or when user types `}}` manually or backspaces past `{{`

---

## Variable Binding State Machine

```
Unbound Text → User types "{{" → Autocomplete Opens → User selects variable →
Text becomes "{{variableName}}" (Bound) → In Preview Mode: shows resolved value
→ If variable deleted → Shows "{{DELETED:variableName}}" with warning indicator
```

---

## Variable Type Definitions

```typescript
type VariableType = 'text' | 'date' | 'number' | 'boolean' | 'image';

interface BaseVariableDef {
  id: string;
  name: string;              // camelCase identifier
  displayName: string;       // human readable
  description: string;
  category: 'student' | 'course' | 'academy' | 'date' | 'custom';
  isSystem: boolean;        // system = read-only
  isRequired: boolean;
}

interface TextVariableDef extends BaseVariableDef {
  type: 'text';
  defaultValue: string;
  maxLength?: number;
  pattern?: string;         // regex pattern
}

interface DateVariableDef extends BaseVariableDef {
  type: 'date';
  defaultValue: string;     // ISO date string
  format: string;           // e.g. 'DD/MM/YYYY'
  locale: string;           // e.g. 'en', 'ar'
}

interface NumberVariableDef extends BaseVariableDef {
  type: 'number';
  defaultValue: number;
  min?: number;
  max?: number;
}

interface BooleanVariableDef extends BaseVariableDef {
  type: 'boolean';
  defaultValue: boolean;
}

interface ImageVariableDef extends BaseVariableDef {
  type: 'image';
  defaultSrc?: string;
  width?: number;
  height?: number;
}

type VariableDef = TextVariableDef | DateVariableDef | NumberVariableDef | BooleanVariableDef | ImageVariableDef;
```

---

## Zustand Variable Store

```typescript
interface VariableState {
  systemVariables: VariableDef[];
  customVariables: VariableDef[];
  searchQuery: string;
  selectedCategory: string | 'all';
  recentVariableIds: string[];
  pickerOpen: boolean;
  editorOpen: boolean;
  editingVariable: VariableDef | null;
  // Actions
  setSearchQuery, setSelectedCategory, openPicker, closePicker,
  openEditor, closeEditor, saveVariable, deleteVariable, addRecent,
  resolveVariable: (name: string, context: Record<string, any>) => string
}
```
---

## Round 4 Enhancement — Production Hardening

> **Scope:** Extend variable management with enterprise-grade validation, type-specific rich editors, logical grouping, search/filter, CSV import/export, defaults/fallbacks, computed variables, usage tracking, autocomplete suggestions, multi-language values, accessibility, and performance optimizations.
> **Dependencies:** Round 2 (Complete Specs), Round 3 (Template Editor Components)
> **Last Updated:** 2026-08-02

---

### R4.1 Variable Validation Rules

#### Overview

Every variable definition carries a `ValidationRules` JSON object (introduced in Round 2 design decision #13) that governs how values are validated at render-time, import-time, and editor-time. Round 4 formalizes the rule schema and adds a validation engine on both frontend (Zustand middleware) and backend (service layer).

#### Validation Rule Schema

```typescript
interface ValidationRuleBase {
  required: boolean;                    // field must have a non-null value
  customValidationFn?: string;          // name of registered validator function
  errorMessageKey?: string;             // i18n key for custom error message
}

interface TextValidationRules extends ValidationRuleBase {
  type: 'text';
  minLength?: number;                   // minimum character count
  maxLength?: number;                   // maximum character count
  pattern?: string;                     // regex pattern (stored as string)
  allowEmpty?: boolean;                 // if required=false, allow empty string
}

interface NumberValidationRules extends ValidationRuleBase {
  type: 'number';
  min?: number;                         // minimum numeric value
  max?: number;                         // maximum numeric value
  integerOnly?: boolean;                // reject decimals
  step?: number;                        // valid increments
}

interface DateValidationRules extends ValidationRuleBase {
  type: 'date';
  format: string;                       // expected date format string (e.g. 'DD/MM/YYYY')
  minDate?: string;                     // ISO date string — earliest allowed
  maxDate?: string;                     // ISO date string — latest allowed
  disallowWeekends?: boolean;           // reject Saturdays/Sundays
}

interface BooleanValidationRules extends ValidationRuleBase {
  type: 'boolean';
  // booleans are inherently valid; required means must not be null/undefined
}

interface ImageValidationRules extends ValidationRuleBase {
  type: 'image';
  minWidth?: number;                    // minimum image width in pixels
  maxWidth?: number;                    // maximum image width in pixels
  minHeight?: number;                   // minimum image height in pixels
  maxHeight?: number;                   // maximum image height in pixels
  maxFileSizeKB?: number;               // maximum file size in kilobytes
  allowedFormats?: string[];             // ['png', 'jpg', 'webp']
}

interface UrlValidationRules extends ValidationRuleBase {
  type: 'url';
  allowedProtocols?: string[];           // ['https', 'http']
  allowedDomains?: string[];             // whitelist of domains
  disallowQueryParams?: boolean;
  disallowFragments?: boolean;
}

type ValidationRules =
  | TextValidationRules
  | NumberValidationRules
  | DateValidationRules
  | BooleanValidationRules
  | ImageValidationRules
  | UrlValidationRules;
```

#### Custom Validation Function Spec

Custom validators are registered in a shared registry (`shared/lib/variableValidators.ts`) so both frontend and backend can execute them:

```typescript
// shared/lib/variableValidators.ts
type CustomValidator = (value: unknown, context: Record<string, unknown>) =>
  { valid: true } | { valid: false; errorKey: string };

const validatorRegistry = new Map<string, CustomValidator>();

export function registerValidator(name: string, fn: CustomValidator): void {
  validatorRegistry.set(name, fn);
}

export function getValidator(name: string): CustomValidator | undefined {
  return validatorRegistry.get(name);
}

export function runValidation(
  value: unknown,
  rules: ValidationRules,
  context: Record<string, unknown>
): { valid: true } | { valid: false; errorKey: string } {
  // 1. Required check
  if (rules.required && (value === null || value === undefined || value === '')) {
    return { valid: false, errorKey: 'errors.validation.required' };
  }
  // 2. Type-specific checks (length, min/max, pattern, date format, etc.)
  // 3. Custom validator
  if (rules.customValidationFn) {
    const validator = getValidator(rules.customValidationFn);
    if (validator) return validator(value, context);
  }
  return { valid: true };
}
```

#### Validation Error Display

- **Inline form errors**: `FormHelperText` with `error` prop (red text) below each field in `VariableEditorDialog`.
- **CSV import errors**: per-row error badge in the import preview table with the `errorKey` resolved to localized text.
- **Render-time validation**: if a variable value fails validation during template preview, show a warning overlay on the canvas element (not a hard error — template still renders with fallback).
- **Backend validation**: the `variableResolutionService` logs a warning and uses the fallback value when validation fails.

---

### R4.2 Type-Specific Editors

Round 2 defined the `VariableEditorDialog` with basic per-type fields. Round 4 upgrades each type to a dedicated rich editor component, improving UX and correctness.

#### Text Variable — Rich Text Editor

- **File:** `frontend/views/dashboard/cert/templates/variables/editors/TextVariableEditor.tsx`
- **Component:** MUI `Tabs` with two tabs: "Plain" and "Rich"
- **Plain tab:** MUI `TextField` with multiline, rows=3, character counter (`{value.length}/{maxLength}`)
- **Rich tab:** Lightweight inline formatting toolbar (bold `**`, italic `*`, underline `__`) using a contentEditable div; output stored as markdown string
- **Toolbar buttons:** `IconButton` with `FormatBold`, `FormatItalic`, `FormatUnderlined` (MUI v9 icon names — `Outlined` suffix not needed for these)
- **sx prop usage:** `<IconButton sx={{ color: 'primary.main' }}>` (never direct color props)
- **Validation:** minLength/maxLength enforced live; character counter turns red when exceeding maxLength

#### Date Variable — MUI v9 DatePicker

- **File:** `frontend/views/dashboard/cert/templates/variables/editors/DateVariableEditor.tsx`
- **Component:** MUI v9 `DatePicker` from `@mui/x-date-pickers/DatePicker`
- **Props:** `value`, `onChange`, `format` (driven by variable's `format` field), `minDate`, `maxDate`
- **Locale adapter:** `LocalizationProvider` with `AdapterDayjs` and locale set from variable's `locale` field
- **Format selector:** MUI `Select` with options: `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, `DD MMM YYYY`, custom pattern `TextField`
- **Validation:** disabled weekends if `disallowWeekends` is true; min/max date enforcement
- **sx prop:** `<DatePicker sx={{ width: '100%', mt: 1 }} />`

#### Number Variable — Slider + Numeric Input

- **File:** `frontend/views/dashboard/cert/templates/variables/editors/NumberVariableEditor.tsx`
- **Component:** MUI `Slider` + MUI `TextField` (type="number") side by side
- **Layout:** `Stack` direction="row" spacing={2}; slider takes flex:1, TextField width 120px
- **Slider props:** `min`, `max`, `step` (from validation rules), `valueLabelDisplay="auto"`
- **TextField props:** type="number", inputProps with min/max/step, `onChange` clamps value
- **Integer enforcement:** if `integerOnly` is true, step=1 and decimal input rejected
- **sx prop:** `<Slider sx={{ flex: 1 }} />`, `<TextField sx={{ width: 120 }} />`

#### Boolean Variable — Toggle Switch

- **File:** `frontend/views/dashboard/cert/templates/variables/editors/BooleanVariableEditor.tsx`
- **Component:** MUI `Switch` with `FormControlLabel`
- **Props:** `checked`, `onChange`, label from displayName
- **Additional:** true/false label preview ("On"/"Off" localized) below the switch
- **sx prop:** `<FormControlLabel sx={{ mt: 1 }} control={<Switch />} />`

#### Image Variable — Upload + Preview

- **File:** `frontend/views/dashboard/cert/templates/variables/editors/ImageVariableEditor.tsx`
- **Component:** MUI `Button` (variant="outlined", component="label") for file upload + `Box` preview area
- **Upload:** hidden `<input type="file" accept="image/*">`; on change, read file, validate dimensions and size via `Image` object
- **Preview:** `Box` with `sx={{ width: 200, height: 200, border: '1px dashed grey.400', display: 'flex', justifyContent: 'center', alignItems: 'center' }}`; render `<img>` or placeholder
- **URL mode:** if the variable stores a URL (not base64), show a `TextField` for the URL with a "Load Preview" button
- **Validation:** check `allowedFormats`, `maxFileSizeKB`, dimension constraints

#### URL Variable — Link Validation

- **File:** `frontend/views/dashboard/cert/templates/variables/editors/UrlVariableEditor.tsx`
- **Component:** MUI `TextField` with `InputProps` start adornment (`Link` icon) + live validation indicator
- **Validation:** URL constructor try/catch; check `allowedProtocols`, `allowedDomains`, query/fragment restrictions
- **Visual feedback:** green checkmark `CheckCircleIcon` if valid, red `ErrorIcon` if invalid, with `FormHelperText` error message
- **Preview:** if valid, show a `Link` component (MUI) that opens the URL in a new tab

#### Editor Factory

```typescript
// frontend/views/dashboard/cert/templates/variables/editors/VariableEditorFactory.tsx
function VariableEditorFactory({ type, value, rules, onChange }: EditorProps) {
  switch (type) {
    case 'text':   return <TextVariableEditor value={value} rules={rules} onChange={onChange} />;
    case 'date':   return <DateVariableEditor value={value} rules={rules} onChange={onChange} />;
    case 'number': return <NumberVariableEditor value={value} rules={rules} onChange={onChange} />;
    case 'boolean': return <BooleanVariableEditor value={value} rules={rules} onChange={onChange} />;
    case 'image':  return <ImageVariableEditor value={value} rules={rules} onChange={onChange} />;
    case 'url':    return <UrlVariableEditor value={value} rules={rules} onChange={onChange} />;
  }
}
```

---

### R4.3 Variable Grouping

#### Overview

Variables can be organized into logical groups (Student Info, Course Info, Academy Info, etc.) for better UX in the picker, panel, and editor. Groups are collapsible, reorderable, color-tagged, and can carry group-level required indicators.

#### Group Data Model

```typescript
// backend/types/certVariableGroup.types.ts
interface CertVariableGroupSelectType {
  id: string;
  templateId: string | null;     // null = global group (available to all templates)
  name: string;                  // e.g. "Student Info"
  displayName: string;
  sortOrder: number;             // for drag-reorder
  colorTag: string | null;       // hex color or theme palette key
  isCollapsedByDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CertVariableGroupInsertType {
  templateId: string | null;
  name: string;
  displayName: string;
  sortOrder: number;
  colorTag: string | null;
  isCollapsedByDefault: boolean;
}
```

The `certVariables` table gets a new `groupId` column (nullable — ungrouped variables appear in "Ungrouped" section).

#### Group Management UI

- **Panel section:** `VariablePanel` renders groups as collapsible `Accordion` (MUI) sections; ungrouped variables in a "Ungrouped" accordion at the bottom.
- **Collapsible:** `Accordion` with `expanded` state managed in `variableStore`; `isCollapsedByDefault` sets initial state.
- **Drag to reorder:** `@dnd-kit/sortable` drag handles on each accordion header; `sortOrder` updated via batch mutation on drop.
- **Color tag:** colored dot `Box` (`sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: group.colorTag }}`) next to group name in accordion header.
- **Group-level required indicator:** if any variable in the group is `isRequired`, show a small badge "X required" in the accordion header.
- **Create/Edit group:** context menu on panel header → "New Group" dialog (name, color picker, collapse default toggle).
- **Assign variable to group:** drag variable card between accordion sections, or `Select` in `VariableEditorDialog`.

#### Zustand Store Additions

```typescript
interface VariableState {
  // ... existing fields ...
  groups: CertVariableGroupSelectType[];
  collapsedGroupIds: string[];
  // Actions
  setGroups: (groups: CertVariableGroupSelectType[]) => void;
  toggleGroupCollapse: (groupId: string) => void;
  reorderGroups: (orderedIds: string[]) => void;
  assignVariableToGroup: (variableId: string, groupId: string | null) => void;
  createGroup: (input: CertVariableGroupInsertType) => void;
  updateGroup: (id: string, patch: Partial<CertVariableGroupSelectType>) => void;
  deleteGroup: (id: string) => void; // reassigns variables to Ungrouped
}
```

---

### R4.4 Search & Filter

#### Overview

Enhance the `VariablePickerDialog` and `VariablePanel` with a full search and filter system, replacing the basic search bar from Round 2.

#### Search

- **Debounced search:** 300ms debounce using `useDebounce` hook (or manual `setTimeout` in `useEffect`); avoids per-keystroke recomputation.
- **Search fields:** variable `name`, `displayName`, `description` — case-insensitive substring match.
- **Search state:** `searchQuery` in `variableStore` (already exists from Round 2); debounce happens at the component level before dispatching to store.
- **Highlighting:** matching substring wrapped in `<mark>` tag (or MUI `Box` with `sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}`) within variable cards.

#### Filters

- **Filter by type:** MUI `ToggleButtonGroup` (exclusive) with type icons: text (`TextFields`), date (`CalendarMonth`), number (`Numbers`), boolean (`ToggleOn`), image (`Image`), url (`Link`). Multiple selection (non-exclusive) to allow filtering multiple types at once.
- **Filter by group:** MUI `Select` listing all groups + "Ungrouped" + "All".
- **Filter by required:** MUI `Switch` with label "Required only" — filters to `isRequired === true`.

#### Filter State in Store

```typescript
interface VariableState {
  // ... existing fields ...
  searchQuery: string;           // already exists
  debouncedSearchQuery: string;  // debounced version for actual filtering
  typeFilter: VariableType[];    // empty = all types
  groupFilter: string | 'all' | 'ungrouped';
  requiredOnly: boolean;
  // Actions
  setTypeFilter: (types: VariableType[]) => void;
  setGroupFilter: (groupId: string | 'all' | 'ungrouped') => void;
  setRequiredOnly: (value: boolean) => void;
  setDebouncedSearchQuery: (query: string) => void;
  // Selector
  filteredVariables: () => VariableDef[];  // computed from all filters
}
```

#### Search Result Highlighting

```typescript
function highlightMatch(text: string, query: string): React.ReactNode[] {
  if (!query) return [text];
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <Box key={i} component="mark" sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 0.5 }}>{part}</Box>
      : part
  );
}
```

---

### R4.5 CSV Import/Export

#### Overview

Provide CSV bulk import and export for variable definitions, including column mapping, per-row validation, error display, preview, and conflict resolution.

#### CSV Template Download

- **Button:** MUI `Button` startIcon=`<DownloadIcon />` in `VariablePanel` toolbar.
- **Flow:** `handleDownloadTemplate` generates a CSV string with headers matching the variable schema: `name, displayName, description, type, defaultValue, isRequired, groupName, validationRules`.
- **Implementation:** use `PapaParse` (`Papa.unparse`) to generate CSV; trigger download via `Blob` + temporary `<a>` element.
- **Sample rows:** include 2-3 example rows pre-filled with common variables (studentName, courseName, completionDate).

#### CSV Upload with Column Mapping

- **Dialog:** `CsvImportDialog` (`frontend/views/dashboard/cert/templates/variables/CsvImportDialog.tsx`)
- **Step 1 — Upload:** MUI `Button` component="label" with hidden file input; accept `.csv` only; parse with `Papa.parse` on file select.
- **Step 2 — Column Mapping:** table showing CSV headers on left, MUI `Select` dropdowns on right to map each CSV column to a variable field. Auto-match by header name (case-insensitive).
- **Step 3 — Validation & Preview:** table showing parsed rows with per-row validation status (green check / red error badge). Errors include: invalid type, name not camelCase, duplicate name, missing required field, invalid validation rules JSON.
- **Step 4 — Conflict Resolution:** for each row where `name` conflicts with an existing variable:
  - MUI `RadioGroup` with three options: "Skip", "Overwrite", "Rename to: [TextField]"
  - Default action: Skip
  - Batch conflict resolution: apply same action to all conflicts via `RadioGroup` "Apply to all"
- **Step 5 — Import:** call batch GraphQL mutation `CertVariableBatchImportMutation` with the resolved rows. Show progress bar during import.
- **Result:** Summary toast: "X imported, Y skipped, Z overwritten, W renamed, V failed".

#### CSV Export

- **Button:** MUI `Button` startIcon=`<UploadIcon />` in `VariablePanel` toolbar.
- **Flow:** query all custom variables (system variables excluded), flatten to CSV rows, `Papa.unparse`, download.
- **Options dialog:** checkboxes for which fields to include (name, displayName, description, type, defaultValue, isRequired, groupName, validationRules).

#### Error Display

| Error | Display |
|-------|---------|
| Invalid type | Red badge: "Invalid type: must be text/date/number/boolean/image/url" |
| Name not camelCase | Red badge: "Name must be camelCase" |
| Duplicate name | Yellow badge: "Conflict — choose resolution" |
| Missing required field | Red badge: "Missing required field: type" |
| Invalid validation JSON | Red badge: "Invalid validation rules JSON" |
| Invalid group name | Yellow badge: "Group not found — will be created" |

---

### R4.6 Variable Defaults & Fallbacks

#### Overview

Define a structured fallback chain for variable resolution, ensuring templates render gracefully even when recipient data is incomplete.

#### Fallback Chain

```
1. Recipient-provided value (from issuance context)
   ↓ (null/undefined)
2. Variable defaultValue (from variable definition)
   ↓ (null/undefined)
3. Template-level "no data" text (configurable per template)
   ↓ (not configured)
4. System fallback: "—" (em dash, indicating no data)
```

#### Data Model Changes

```typescript
// backend/types/certTemplate.types.ts additions
interface CertTemplateUpdateType {
  // ... existing fields ...
  noDataText?: string;           // e.g. "N/A" — rendered when variable has no value
  noDataTextStyle?: 'dash' | 'blank' | 'customText' | 'hidden';
}
```

#### Resolution Logic Update

```typescript
// backend/services/cert/variableResolutionService.ts
function resolveVariableWithFallback(
  name: string,
  context: Record<string, unknown>,
  variableDef: VariableDef | null,
  templateConfig: { noDataText?: string; noDataTextStyle?: string }
): { value: string; source: 'recipient' | 'default' | 'noData' | 'systemFallback' } {
  // 1. Check recipient-provided value
  if (context[name] !== null && context[name] !== undefined && context[name] !== '') {
    return { value: formatValue(context[name], variableDef), source: 'recipient' };
  }
  // 2. Check variable defaultValue
  if (variableDef?.defaultValue) {
    return { value: formatValue(variableDef.defaultValue, variableDef), source: 'default' };
  }
  // 3. Check template "no data" text
  if (templateConfig.noDataText && templateConfig.noDataTextStyle !== 'hidden') {
    return { value: templateConfig.noDataText, source: 'noData' };
  }
  // 4. System fallback
  return { value: '—', source: 'systemFallback' };
}
```

#### Null Handling in Rendering

- **Canvas (edit mode):** unbound or null variables render as `{{variableName}}` (placeholder visual).
- **Preview mode:** resolved via fallback chain; source indicator badge shown on hover ("Source: Default", "Source: Recipient", etc.).
- **Final PDF:** rendered value only, no badges or source indicators.

#### "No Data Found" Template Text

- **Field:** in template settings dialog, add "No Data Text" `TextField` and "No Data Style" `Select`.
- **Preview:** when a variable resolves to the noData source, the text is rendered in `text.disabled` color (grey) to visually distinguish from real data.
- **Final render:** rendered in normal color (grey is preview-only).

---

### R4.7 Computed Variables

#### Overview

Allow variables to be derived from other variables using a formula engine. Computed variables are not directly editable — they recalculate when their dependencies change.

#### Computed Variable Data Model

```typescript
// Extended VariableDef
interface ComputedVariableDef extends BaseVariableDef {
  type: 'computed';
  formula: string;                    // e.g. "concat(firstName, ' ', lastName)"
  dependencyKeys: string[];           // ['firstName', 'lastName'] — auto-detected from formula
  cacheable: boolean;                 // if true, result cached until dependencies change
}
```

#### Formula Editor

- **File:** `frontend/views/dashboard/cert/templates/variables/editors/ComputedVariableEditor.tsx`
- **Component:** MUI `TextField` (multiline, rows=2) for formula entry + live preview pane below.
- **Function library:**
  - `concat(...values)` — string concatenation
  - `formatDate(dateVar, format)` — date formatting
  - `toUpperCase(value)` — uppercase transform
  - `toLowerCase(value)` — lowercase transform
  - `substring(value, start, end)` — substring extraction
  - `padStart(value, length, char)` — left-pad string
  - `formatNumber(numVar, decimals)` — number formatting with decimal places
  - `conditional(condition, trueValue, falseValue)` — ternary
  - `add(a, b)`, `subtract(a, b)`, `multiply(a, b)`, `divide(a, b)` — arithmetic
- **Autocomplete:** when user types a function name prefix, show a dropdown with function signature and description.
- **Variable references:** typing `{{` inside the formula triggers the same `VariableAutocomplete` component from Round 3.
- **Live preview:** shows the computed result using sample dependency values; error message if formula is invalid.

#### Dependency Graph & Circular Reference Detection

```typescript
// shared/lib/computedVariableGraph.ts
interface ComputedVariableNode {
  variableName: string;
  dependencies: string[];
  isComputed: boolean;
}

function detectCircularReferences(nodes: ComputedVariableNode[]): string[] {
  // Topological sort; any nodes not in the sorted result are part of a cycle.
  // Returns list of variable names involved in circular references.
}

function getEvaluationOrder(nodes: ComputedVariableNode[]): string[] {
  // Returns variable names in dependency order (dependencies before dependents).
}
```

- **Validation on save:** when a computed variable is saved, run circular reference detection. If detected, block save with error: "Circular reference detected: A → B → C → A".
- **Dependency auto-detection:** parse the formula string for `{{variableName}}` patterns; extract variable names as `dependencyKeys`.
- **Cascade recalculation:** when a source variable changes, all computed variables depending on it (transitively) are recalculated. The evaluation order from the topological sort ensures correct sequencing.

#### Formula Engine (Backend)

```typescript
// backend/services/cert/computedVariableService.ts
function evaluateFormula(
  formula: string,
  context: Record<string, unknown>,
  variableDefs: Map<string, VariableDef>
): { value: string; error?: string } {
  // 1. Replace {{varName}} with resolved values
  // 2. Parse function calls
  // 3. Execute function library
  // 4. Return result or error
}
```

---

### R4.8 Variable Usage Tracking

#### Overview

Track which template elements use each variable, display usage counts, warn about unused variables, and provide "find all references" functionality.

#### Usage Tracking Data Model

```
certVariableUsage
  id          UUID PK
  variableId  UUID FK → certVariables
  templateId  UUID FK → certTemplates
  elementId   UUID FK → certTemplateElements
  elementType  text (text | image | date | computed)
  usageType   text (binding | formulaDependency | conditional)
  createdAt    timestamp
```

- **Population:** updated whenever a template element is saved with a variable binding. The `saveTemplateElement` service extracts all `{{varName}}` patterns and upserts usage records.
- **Cascade deletion:** when a template element is deleted, its usage records are removed.

#### Usage Count Display

- **In `VariablePanel`:** each variable row shows a usage count badge: `Box` with `sx={{ bgcolor: 'info.main', color: 'info.contrastText', borderRadius: '50%', minWidth: 24, height: 24, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}`.
- **Tooltip:** "Used in X templates, Y elements".
- **Zero usage:** badge in `text.disabled` color with tooltip "No usages — safe to delete".

#### Unused Variable Warnings

- **Warning icon:** `WarningAmberIcon` with `sx={{ color: 'warning.main' }}` next to variables with zero usage.
- **Filter:** "Unused only" `Switch` in the filter bar (complement of "Required only").
- **Warning toast:** when saving a new variable that has no immediate binding, show a non-blocking info toast: "Variable created. It is not yet used in any template."

#### Delete with Usage Confirmation

- **Confirmation dialog:** when deleting a variable with usage > 0, show a dialog with:
  - Warning text: "This variable is used in X templates and Y elements."
  - Table listing each usage: template name, element name, element type.
  - MUI `Checkbox`: "I understand and want to delete this variable and all its bindings."
  - Delete button disabled until checkbox is checked.
- **Backend:** `deleteVariable` mutation with `force: true` parameter cascades to remove `{{varName}}` from element content (replaced with `{{DELETED:varName}}`).

#### Find All References

- **Action:** context menu on variable row → "Find All References".
- **Dialog:** `VariableUsageDialog` listing all usages in a `Table` with columns: Template, Element, Element Type, Usage Type.
- **Navigation:** clicking a usage row navigates to the template editor with the element selected.

---

### R4.9 Variable Suggestions (Enhanced Autocomplete)

#### Overview

Enhance the `VariableAutocomplete` from Round 3 with fuzzy search, recently-used sorting, an insertion dropdown, and inline value preview.

#### Fuzzy Search

- **Library:** `fuse.js` for fuzzy matching on variable `name`, `displayName`, and `description`.
- **Configuration:** `threshold: 0.3` (moderate fuzziness), `includeScore: true`, sort by score.
- **Result display:** each item shows the matched text with highlighted match portions (same highlight technique as R4.4).

#### Recently Used at Top

- **Tracking:** `recentVariableIds` array in `variableStore` (already from Round 2). Updated on each variable insertion: moved to front of array, max 10 entries, oldest trimmed.
- **Sorting:** recently used variables appear first in the dropdown, then sorted by fuzzy score.
- **Visual:** recently used items have a small `HistoryIcon` prefix with `sx={{ color: 'text.secondary', fontSize: '0.875rem' }}`.

#### Variable Insertion Dropdown

- **Trigger:** `{{` in any text element content field (from Round 3).
- **Dropdown component:** MUI `Popper` with `Paper` containing a `List` of variable suggestions.
- **Positioning:** anchored to the cursor position in the text element; `Popper` with `placement="bottom-start"`.
- **Scroll:** virtualized list (`react-virtual` or `@tanstack/react-virtual`) for performance with > 100 variables.
- **Keyboard:** Arrow Up/Down navigate, Enter insert, Escape close, Tab insert first result.

#### Inline Preview of Variable Value

- **Preview column:** each suggestion item shows the variable's resolved value (or defaultValue) in a secondary text line, rendered in `sx={{ color: 'text.secondary', fontFamily: 'monospace' }}`.
- **Example:** `fullName` → "Ahmed Hassan" (from default or current context).
- **For computed variables:** show the computed result using current context values.
- **For image variables:** show a 24x24 thumbnail preview.

---

### R4.10 Multi-Language Variable Values

#### Overview

Variables can have values translated per locale (English and Arabic). The variable editor includes a locale selector, supports a fallback locale hierarchy, and handles RTL rendering for Arabic.

#### Multi-Language Value Storage

```typescript
// Extended variable value type
interface LocalizedValue {
  en?: string;
  ar?: string;
}

// In context (recipient data), values can be either plain strings or LocalizedValue:
type VariableValue = string | LocalizedValue | number | boolean;

// Variable definition gets per-locale defaults:
interface LocalizedVariableDef extends BaseVariableDef {
  defaultValues?: LocalizedValue;  // replaces single defaultValue for localized variables
  isLocalized: boolean;
}
```

#### Locale Selector in Variable Editor

- **Component:** MUI `Tabs` with two tabs: "English" and "العربية" at the top of the `VariableEditorDialog` when `isLocalized` is true.
- **Toggle:** `Switch` with label "Multi-language value" in the editor. When enabled, the `defaultValues` field becomes locale-aware.
- **Per-locale editing:** switching tabs swaps the editor fields. Each tab shows the appropriate editor (R4.2) for the selected locale's value.
- **Incomplete translation warning:** if a locale value is empty while another is filled, show a warning `FormHelperText`: "Arabic value is empty — will fall back to English."

#### Fallback Locale Hierarchy

```
Current render locale (e.g., 'ar')
   ↓ (value missing or null)
Default locale ('en')
   ↓ (value also missing)
Variable defaultValue for 'en'
   ↓ (also missing)
Template "no data" text for current locale
   ↓
System fallback "—"
```

#### RTL Support for Arabic Values

- **Direction detection:** the `variableResolutionService` checks the current render locale. If `ar`, text is wrapped in a `span` with `dir="rtl"`.
- **Mixed LTR/RTL rendering:** individual variable values carry their own direction. A variable with an Arabic value renders RTL even within an LTR template, and vice versa. This is handled by wrapping each resolved variable in `<span dir="auto">{{value}}</span>` in the server-rendered HTML.
- **Canvas editor:** the preview canvas uses `dir={locale === 'ar' ? 'rtl' : 'ltr'}` on the root container. Individual text elements inherit direction from their content.

#### Zustand Store Additions

```typescript
interface VariableState {
  // ... existing fields ...
  editingLocale: 'en' | 'ar';
  isLocalized: boolean;
  // Actions
  setEditingLocale: (locale: 'en' | 'ar') => void;
  setIsLocalized: (value: boolean) => void;
}
```

---

### R4.11 Accessibility

#### Overview

Ensure all variable-related components are fully accessible with keyboard navigation, ARIA labels, screen reader announcements, and proper focus management.

#### Variable Picker Dialog — Keyboard Navigation

- **Tab order:** search field → type filter toggle group → group filter select → required-only switch → variable cards (in list order) → recently used chips → close button.
- **Arrow keys:** within the variable card grid, arrow keys move between cards (grid pattern: up/down/left/right).
- **Enter:** selects the focused card and calls `onSelect`.
- **Escape:** closes dialog and returns focus to the triggering button.
- **Focus trap:** MUI `Dialog` with `aria-modal="true"`; focus is trapped within the dialog while open.

#### ARIA Labels

| Component | ARIA Label |
|-----------|------------|
| Search field | `aria-label="Search variables"` |
| Type filter | `aria-label="Filter by variable type"` |
| Group filter | `aria-label="Filter by group"` |
| Required-only switch | `aria-label="Show required variables only"` |
| Variable card | `aria-label="Variable: {displayName}, type: {type}, {required ? 'required' : 'optional'}"` |
| Recently used chip | `aria-label="Recently used: {name}"` |
| Editor name field | `aria-label="Variable name (camelCase)"` |
| Editor type select | `aria-label="Variable type"` |
| Delete button | `aria-label="Delete variable {name}"` |
| Edit button | `aria-label="Edit variable {name}"` |
| Group accordion | `aria-label="Variable group: {groupName}"` |
| Collapse/expand | `aria-label="Collapse group {groupName}"` / `"Expand group {groupName}"` |
| Drag handle | `aria-label="Drag to reorder group {groupName}"` |
| CSV import button | `aria-label="Import variables from CSV"` |
| CSV export button | `aria-label="Export variables to CSV"` |
| Computed formula field | `aria-label="Computed variable formula"` |
| Locale tab (EN) | `aria-label="English value"` |
| Locale tab (AR) | `aria-label="Arabic value"` |

#### Screen Reader for Variable Type Announcement

- **Live region:** an `aria-live="polite"` region in the variable picker announces the type of the currently focused variable card: "Text variable: Student Name" or "Date variable: Completion Date".
- **Role:** `role="status"` on the live region container.

#### Focus Management

- **Dialog open:** focus moves to the search input.
- **Dialog close:** focus returns to the triggering element (`onClose` handler calls `triggerRef.current.focus()`).
- **Variable editor open:** focus moves to the first form field (name).
- **Variable editor close:** focus returns to the edit/add button.
- **Toast after save/delete:** focus moves to the toast message (ARIA live region).
- **Skip links:** "Skip to variable list" link at the top of the picker dialog for screen reader users to skip filters.

---

### R4.12 Performance

#### Overview

Optimize for templates with large numbers of variables (>100) using list virtualization, debounced operations, lazy loading, and cached resolution.

#### Virtualized Variable List

- **Library:** `@tanstack/react-virtual` for virtualized lists.
- **Component:** `VirtualizedVariableList` wrapping the variable cards grid in `VariablePickerDialog` and the variable rows in `VariablePanel`.
- **Implementation:** `useVirtualizer` with `estimateSize: 80` (card height), `overscan: 5` (render 5 items above/below viewport).
- **Fallback:** if `@tanstack/react-virtual` is not available, load 50 variables at a time with "Load more" `Button` at the bottom of the list (infinite scroll pattern).
- **Threshold:** virtualization kicks in when variable count exceeds 50; below threshold, standard rendering for simplicity.

#### Debounced Search

- **Debounce timer:** 300ms for search queries, 500ms for filter changes (type, group, required).
- **Implementation:** a custom `useDebouncedCallback` hook wrapping the store setter:
  ```typescript
  const debouncedSetSearch = useDebouncedCallback((query: string) => {
    variableStore.setDebouncedSearchQuery(query);
  }, 300);
  ```
- **Cancel on unmount:** `useEffect` cleanup clears pending debounce timers.

#### Lazy Load Variable Definitions

- **Initial load:** when a template editor opens, load only variable `id`, `name`, `displayName`, `type`, and `isRequired` (lightweight query) for the picker and panel.
- **On-demand load:** when a variable is opened in the editor dialog, fetch the full definition (including `validationRules`, `defaultValue`, `formula`, `defaultValues`) via a separate `CertVariableDetailQueryDocument`.
- **Cache:** Apollo cache normalizes by `id`; subsequent opens of the same variable use cached data without re-fetching.

#### Cached Variable Resolution

- **Cache key:** hash of `variableName + contextHash + locale`.
- **Cache invalidation:** cache entry invalidated when the variable definition changes, the template changes, or the recipient context changes.
- **Implementation:** LRU cache in `variableResolutionService` (backend):
  ```typescript
  const resolutionCache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes
  });
  ```
- **Preview mode:** the frontend caches resolved values per canvas render cycle; invalidated when any variable definition or context value changes (tracked via Zustand selector).

#### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Variable picker open → render | <200ms | DevTools performance trace |
| Search type → result update | <100ms (after debounce) | Manual timing |
| Variable list scroll (100+ vars) | 60fps | React DevTools profiler |
| CSV import (100 rows) | <3s | Manual timing |
| Computed variable recalc | <50ms | Backend logs |
| Template preview with 50 vars | <500ms | DevTools performance trace |

#### Design Decisions (Round 4)

| # | Decision | Context | Alternatives Considered | Trade-offs |
|---|----------|---------|------------------------|------------|
| 21 | Validation rules as typed discriminated union | Type-safe per-type rules | Single flat interface | +Type safety, -More boilerplate |
| 22 | Custom validators in shared/lib registry | Both FE and BE can execute | BE-only validators | +Frontend preview, -Size of shared bundle |
| 23 | @dnd-kit for group drag reorder | Modern, accessible, lightweight | react-beautiful-dnd | +Maintained, -Small learning curve |
| 24 | fuse.js for fuzzy autocomplete search | Industry standard, small | Custom fuzzy impl | +Battle-tested, -Extra dependency |
| 25 | @tanstack/react-virtual for list virtualization | Same family as react-query | react-window | +Shared ecosystem, -Slightly larger |
| 26 | PapaParse for CSV import/export | Robust streaming parser | Custom CSV parser | +Edge cases handled, -Extra dependency |
| 27 | Computed variables as separate type | Clear distinction from source vars | Flag on existing types | +Explicit, -Type union grows |
| 28 | LRU cache for variable resolution | Bounded memory, TTL expiry | Unbounded Map | +Predictable memory, -Cache misses on eviction |
| 29 | Locale fallback chain (ar → en → default → noData → —) | Graceful degradation | Hard error on missing locale | +Always renders, -Fallback may show wrong language |
| 30 | Usage tracking table (not computed at query time | Fast lookups, historical audit | JOIN-computed count | +Fast, -Extra table to maintain |
| 31 | Virtualization threshold at 50 vars | Balance simplicity vs perf | Always virtualize | +Simple for small lists, -Threshold jump |
| 32 | Inline rich text via markdown (not HTML) | XSS-safe, portable | HTML contentEditable | +Safe, -Limited formatting |
| 33 | Formula engine with function library (not eval) | Security: no arbitrary code execution | JS eval() | +Secure, -Limited to library functions |
| 34 | Variable groups on separate DB table | Flexible, queryable | JSON array on template | +SQL queries, -Extra join |
| 35 | CSV conflict resolution via radio per-row | Granular control | All-or-nothing | +User flexibility, -More clicks for bulk |

