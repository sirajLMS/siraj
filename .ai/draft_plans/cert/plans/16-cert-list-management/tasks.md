# Plan 16 — Certificate List & Management: Task Breakdown

## Document Info

| Field | Value |
|-------|-------|
| **Plan** | 16 — Certificate List & Management |
| **Dependencies** | Plan 5 (GraphQL API — `certificates` queries and mutations) |
| **Tasks** | 14 tasks |
| **Total Estimated Effort** | ~38 hours (5 working days) |

---

## Dependency Graph

```
Task 1 (i18n namespace)
  │
  ├─► Task 2 (Zustand store)
  │      │
  │      ├─► Task 3 (GraphQL documents)
  │      │      │
  │      │      ├─► Task 4 (Container + ViewModel)
  │      │      │      │
  │      │      │      ├─► Task 5 (Desktop view — AppDataGrid)
  │      │      │      │      │
  │      │      │      │      └─► Task 6 (Mobile view — card list)
  │      │      │      │
  │      │      │      ├─► Task 7 (Revoke dialog + batch confirm)
  │      │      │      │
  │      │      │      └─► Task 8 (FilterBar + FilterDrawer + metrics)
  │      │      │             │
  │      │      │             ├─► Task 9 (StatusBadge + CardItem)
  │      │      │             │      │
  │      │      │             │      └─► (referenced by Tasks 5, 6)
  │      │      │             │
  │      │      │             ├─► Task 10 (App Router page + sidebar)
  │      │      │             │
  │      │      │             └─► Task 11 (CSV export + batch re-download)
  │      │      │                    │
  │      │      │                    └─► Task 12 (Integration verification)
  │      │      │                           │
  │      │      │                           └─► Task 13 (Knowledge propagation) [FINAL]
```

### Execution Order

1. **Task 1**: i18n namespace (foundation — all components need labels)
2. **Task 2**: Zustand store (state management foundation — all views depend on it)
3. **Task 3**: GraphQL documents (data layer — container depends on these)
4. **Task 4**: Container + ViewModel (orchestrates queries, mutations, store)
5. **Task 5** + **Task 6**: Desktop view + Mobile view (parallel after container)
6. **Task 7**: Revoke dialog + batch confirm dialog
7. **Task 8**: FilterBar + FilterDrawer + DesktopMetricCardGrid + MobileMetricCardGrid
8. **Task 9**: CertificateStatusBadge + CertificateCardItem (shared sub-components)
9. **Task 10**: App Router page + sidebar navigation entry
10. **Task 11**: CSV export + batch re-download ZIP
11. **Task 12**: Integration verification (refetch, cache, navigation)
12. **Task 13**: Knowledge propagation (final)

---

## AGENTS.md & Instruction File References

For every file created/modified in this plan, read the applicable AGENTS.md and instruction files BEFORE writing code.

| File Pattern | AGENTS.md Files | Instruction Files |
|--------------|-----------------|-------------------|
| `app/(dashboard)/certificates/**/*.tsx` | `AGENTS.md`, `app/AGENTS.md` | `frontend.instructions.md` |
| `shared/locale/**` | `AGENTS.md`, `shared/AGENTS.md` | — |
| `frontend/common/views/dashboard/cert-list/**` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md` |
| `frontend/desktop/views/dashboard/cert-list/**` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md` |
| `frontend/mobile/views/dashboard/cert-list/**` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md` |
| `frontend/common/stores/certListStore.ts` | `AGENTS.md`, `frontend/common/stores/AGENTS.md` | `frontend.instructions.md` |
| `frontend/common/graphql/sharedDocuments/certificates/**` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md` | `frontend.instructions.md` |
| `test/ui/components/cert-list/**` | `AGENTS.md`, `test/ui/AGENTS.md` | `tests.instructions.md` |

### Quality Loop (Per File)

After creating or modifying each file, run the per-file verification loop BEFORE moving to the next task:

1. **tsgo**: `bun tsgo` — type checking (safe to run concurrently)
2. **biome**: `bun biome:check` — formatting + lint (safe to run concurrently)
3. **lint** (via queue client): Submit file to lint queue for ESLint check

```bash
# Start lint queue server (background) — once at start of plan
~/.bun/bin/bun run scripts/lint-queue-server.ts &

# Per-file lint (example)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task1-certlist","files":["shared/locale/types/dashboard/certificates/list.ts","shared/locale/en/dashboard/certificates/list.ts"]}'
```

---

## Task 1: Create i18n Certificate List Namespace

**Estimated time**: 3-4 hours
**Dependencies**: None
**Requirements**: REQ-16.50 (outcome tracking), §3.1–3.12 (all i18n translation keys)

### Subtasks

#### 1.1 Create CertificateListLabels type interface

**File to create**: `shared/locale/types/dashboard/certificates/list.ts`

**Content**: Define the `CertificateListLabels` TypeScript interface with all key groups from design.md §i18n Design. The interface must use `labelsBySection` multi-area pattern (ViewModel Rule 7) with these sections:
- `shell`: `pageTitle`, `pageSubtitle`
- `columns`: `certificateNumber`, `templateName`, `recipientName`, `issueDate`, `expiryDate`, `status`, `verificationCode`, `actions`, `category`
- `filters`: `searchPlaceholder`, `template`, `status`, `dateRange`, `fromDate`, `toDate`, `recipient`, `clearAll`, `apply`, `activeCount`, `allStatuses`, `allTemplates`, `allCategories`
- `dialogs`: `revokeTitle`, `revokeBulkTitle`, `revokeReasonLabel`, `revokeReasonPlaceholder`, `revokeReasonRequired`, `revokeWarning`, `cancel`, `confirm`, `confirmTitle`, `confirmCount`, `confirmRevoke`, `confirmReissue`, `confirmDelete`, `confirmRedownload`
- `actions`: `viewDetail`, `revoke`, `reissue`, `download`, `redownload`, `delete`, `copyVerificationCode`, `export`, `generate`, `deselectAll`
- `notifications`: `revokeSuccess`, `reissueSuccess`, `deleteSuccess`, `redownloadSuccess`, `exportSuccess`, `loadFailed`, `revokeFailed`, `invalidStatusTransition`, `reissueFailed`, `deleteFailed`, `redownloadFailed`, `exportFailed`, `noPermission`, `pdfMissing`
- `states`: `loading`, `error`, `empty`, `emptyFiltered`, `noResultsForFilters`, `batchProcessing`, `pullToRefresh`, `loadMore`
- `metrics`: `total`, `issued`, `revoked`, `pending`, `failed`, `expired`, `issuedThisMonth`
- `batch`: `selectedCount`, `batchRevoke`, `batchRedownload`, `batchReissue`, `batchDelete`
- `status`: `pending`, `issued`, `revoked`, `expired`, `failed`

**Function-signature keys**:
- `showingOf` → `(shown: number, total: number) => string`
- `selectedCount` → `(count: number) => string` (pluralized — zero/one/few/many for AR, one/other for EN)
- `confirmCount` → `(count: number) => string` (pluralized)
- `activeCount` → `(count: number) => string` (pluralized)

**Instruction files to read**: `shared/AGENTS.md` (i18n namespace pattern, layer isolation rules, type schema rules)

**Quality loop**: tsgo + biome + lint on the new file

#### 1.2 Create Arabic translation implementation

**File to create**: `shared/locale/ar/dashboard/certificates/list.ts`

**Content**: Implement `certificateListAr` object matching the `CertificateListLabels` interface with all Arabic strings from design.md §i18n Design. Implement Arabic pluralization for `selectedCount`, `confirmCount`, and `activeCount` (zero/one/two/few/many/other rules per Arabic CLDR). All 5 certificate statuses (`pending`/`issued`/`revoked`/`expired`/`failed`) must have Arabic labels. NO `draft` key — use `failed` instead.

**Quality loop**: tsgo + biome + lint

#### 1.3 Create English translation implementation

**File to create**: `shared/locale/en/dashboard/certificates/list.ts`

**Content**: Implement `certificateListEn` object matching the `CertificateListLabels` interface with all English strings. Implement English pluralization for `selectedCount`, `confirmCount`, and `activeCount` (one/other rules). All 5 certificate statuses must have English labels. NO `draft` key — use `failed` instead.

**Quality loop**: tsgo + biome + lint

#### 1.4 Create namespace registration file

**File to create**: `shared/locale/namespaces/dashboard/certificates/list.namespace.ts`

**Content**: Call `defineNamespace("dashboard.certificates.list", { load: { en, ar } })` with dynamic imports for the en/ar implementations (e.g., `() => import("@/shared/locale/en/dashboard/certificates/list")`). Follow the exact pattern from an existing namespace file (e.g., `shared/locale/namespaces/dashboard/students/directory.namespace.ts`). Export as `DashboardCertificateList`.

**Quality loop**: tsgo + biome + lint

#### 1.5 Register namespace in Translation registry

**File to edit**: `shared/locale/namespaces/translation.ts`

**Changes**:
- Import `DashboardCertificateList` from the new namespace file
- Add to the `Dashboard` export object: `CertificateList: DashboardCertificateList,` (matching the existing pattern where `StudentDirectory: DashboardStudentDirectory`)

**Quality loop**: tsgo + biome + lint on `translation.ts`

#### 1.6 Add to MessageSchema type

**File to edit**: `shared/locale/types/message.ts`

**Changes**:
- Import `CertificateListLabels` from the new types file
- Add a flat entry to the `DashboardTranslations` interface: `certificateList: CertificateListLabels;` (matching the existing pattern where `studentDirectory: StudentDirectoryLabels`)

**Quality loop**: tsgo + biome + lint on `message.ts`

#### 1.7 Verify namespace compiles

**Action**: Run `bun tsgo` to verify the entire i18n namespace compiles correctly and all type references resolve. Also verify `shared/locale/namespaces/index.ts` re-exports the new namespace (if the barrel file pattern requires it — check existing entries like `export * from "./dashboard/students/directory.namespace"`).

**AGENTS.md files to read for this task**:
- `shared/AGENTS.md` (i18n namespace registration steps, layer isolation, barrel re-export rules)

---

## Task 2: Create Zustand Certificate List Store

**Estimated time**: 2-3 hours
**Dependencies**: Task 1 (i18n namespace — for type references)
**Requirements**: §2.1–2.6 (list view, metrics, search, filters, pagination, column config)

### Subtasks

#### 2.1 Create certListStore

**File to create**: `frontend/common/stores/certListStore.ts`

**Content**: Create a Zustand store using `create<CertListStoreState>(set => ({ ... }))`. NO `persist` — directory stores are session-scoped. State fields and actions match design.md §Zustand Store Design exactly:

**State fields**:
- `searchQuery: string` (immediate input value)
- `debouncedSearch: string` (debounced — used in query variables)
- `page: number` (1-based — matches `PageInfo.currentPage`)
- `pageSize: number` (default `10`)
- `sortField: CertificateSortField` (default `createdAt`)
- `sortOrder: SortOrder` (default `desc`)
- `statusFilter: CertificateStatus[]` (multi-select, default `[]` = all)
- `templateId: string | null`
- `categoryId: string | null`
- `recipientName: string` (filter by recipient name)
- `dateFrom: string | null` (ISO date string — issue date range start)
- `dateTo: string | null` (ISO date string — issue date range end)
- `selectedIds: Set<string>` (current selection set)
- `columnVisibility: Record<string, boolean>` (user-toggled column show/hide)

**Actions** (all filter-changing actions reset `page` to 1):
- `setSearchQuery(query: string)` — sets `searchQuery`
- `setDebouncedSearch(query: string)` — sets `debouncedSearch`
- `setStatusFilter(statuses: CertificateStatus[])` — sets `statusFilter`, resets `page` to 1
- `setTemplateFilter(templateId: string | null)` — sets `templateId`, resets `page` to 1
- `setCategoryFilter(categoryId: string | null)` — sets `categoryId`, resets `page` to 1
- `setRecipientName(name: string)` — sets `recipientName`, resets `page` to 1
- `setDateRange(from: string | null, to: string | null)` — sets `dateFrom`/`dateTo`, resets `page` to 1
- `clearFilters()` — resets all filters to defaults, resets `page` to 1
- `setPage(page: number)` — sets `page`
- `setPageSize(size: number)` — sets `pageSize`, resets `page` to 1
- `setSort(field: CertificateSortField, order: SortOrder)` — sets `sortField`/`sortOrder`, resets `page` to 1
- `toggleSelection(id: string)` — add/remove from `selectedIds`
- `setSelection(ids: string[])` — replace `selectedIds`
- `clearSelection()` — empty `selectedIds`
- `toggleColumnVisibility(columnKey: string)` — flip visibility flag
- `resetColumnConfig()` — all columns visible

**Derived values** (computed in store or ViewModel, NOT stored):
- `activeFilterCount` — number of active filters (status + template + category + recipient + date range)

**AGENTS.md files to read**:
- `AGENTS.md` (root — logging, path aliases)
- `frontend/common/stores/AGENTS.md` (Zustand store conventions, no persistence for directory stores, minimal store guidance)

**Quality loop**: tsgo + biome + lint

#### 2.2 Create types file for store

**File to create**: `frontend/common/stores/certListStore.types.ts`

**Content**: Define the types used by the store:
- `CertificateStatus` — import from `shared/constants/` or `@/backend/enum` (the canonical 5-value enum: `pending`/`issued`/`revoked`/`expired`/`failed`)
- `CertificateSortField` — union: `"createdAt" | "certificateNumber" | "recipientName" | "issueDate" | "expiryDate" | "status"`
- `SortOrder` — `"asc" | "desc"`
- `BatchActionType` — `"revoke" | "reissue" | "redownload" | "delete"`
- `CertListStoreState` — full interface matching the store shape above

Do NOT define `CertificateFilters` here — the store uses individual fields (not a nested filters object) for simpler granular updates.

**Quality loop**: tsgo + biome + lint

---

## Task 3: Create GraphQL Documents

**Estimated time**: 2-3 hours
**Dependencies**: Task 2 (store types for filter/pagination shapes), Plan 5 (GraphQL schema defined)
**Requirements**: §2.1 (list query), §2.2 (metrics query), §2.7 (batch actions), §2.9 (export), §2.10 (batch re-download)

### Subtasks

#### 3.1 Create certificates documents file

**File to create**: `frontend/common/graphql/sharedDocuments/certificates/certificates.documents.ts`

**Content**: Define the following GraphQL documents using `gql` from `@apollo/client` and export as `TypedDocumentNode<Operations.XQuery, Types.QueryXArgs>` (follow the exact typing pattern from existing domain documents):

**Queries**:
- `CertificatesQueryDocument` — query `certificates(page, perPage, search?, filters?, sort?)` returning `CertificateListResult { items: [CertificateFields...], pageInfo: { currentPage, hasMorePages, lastPage, perPage, total } }`. Certificate fields: `id`, `certificateNumber`, `verificationCode`, `status`, `issueDate`, `expiryDate`, `createdAt`, `recipientName`, `recipientEmail`, `template { id, name }`, `category { id, name }`, `fileUrl`
- `CertificateCountQueryDocument` — query `certificateCount(filters?)` returning `{ total, issued, pending, revoked, expired, failed, issuedThisMonth }`. Uses a single `SELECT count(*) FILTER` query (per DD-5, Performance note).
- `TemplatesForFilterQueryDocument` — query `templates(filter: { status: PUBLISHED })` returning `[{ id, name }]` for the template dropdown filter options.

**Mutations**:
- `RevokeCertificateMutationDocument` — mutation `revokeCertificate(id, reason)` returning `{ id, status }`
- `ReissueCertificateMutationDocument` — mutation `reissueCertificate(id)` returning `{ id, status }`
- `DeleteCertificateMutationDocument` — mutation `deleteCertificate(id)` returning `Boolean`
- `BatchRevokeMutationDocument` — mutation `batchRevokeCertificates(ids, reason)` returning `BatchResult { successCount, failureCount, failures [{ id, code, message }] }`
- `BatchReissueMutationDocument` — mutation `batchReissueCertificates(ids)` returning `BatchResult`
- `BatchDeleteMutationDocument` — mutation `batchDeleteCertificates(ids)` returning `BatchResult`
- `BatchRedownloadMutationDocument` — mutation `batchRedownloadCertificates(ids)` returning `DownloadResult { successCount, failureCount, failures [{ id, code, message }], downloadUrl? }`

**Fragment**: Define a `CertificateFieldsFragment` fragment on `Certificate` with all fields listed above. Include `id` on every object type. Reuse the fragment in `CertificatesQueryDocument`.

**Conventions** (from `frontend/common/graphql/AGENTS.md` and `sharedDocuments/AGENTS.md`):
- Include `id` field on all object types for Apollo cache normalization
- Use `useQuery` and `useMutation` (NOT `useLazyQuery`) — import hooks from `@apollo/client/react`
- Import `gql` from `@apollo/client` (NOT `@apollo/client/core`)
- Naming: `{EntityName}QueryDocument`, `{EntityName}MutationDocument`
- Page-number offset pagination: `page` (1-based), `perPage`, `PageInfo { currentPage, hasMorePages, lastPage, perPage, total }` — NOT relay-style `edges`/`node`/`after`/`fetchMore`

**AGENTS.md files to read**:
- `frontend/common/graphql/AGENTS.md` (document conventions, useQuery rules)
- `frontend/common/graphql/sharedDocuments/AGENTS.md` (file naming, organization)

**Quality loop**: tsgo + biome + lint

#### 3.2 Add barrel re-export

**File to edit**: `frontend/common/graphql/sharedDocuments/index.ts`

**Changes**: Add `export * from "./certificates";` to the barrel file so documents are importable from the sharedDocuments root.

**Quality loop**: tsgo + biome + lint

#### 3.3 Run GraphQL codegen

**Action**: Run `bun codegen` to generate TypeScript types from the GraphQL schema. Verify that `CertificatesQuery`, `CertificatesQueryVariables`, `CertificateCountQuery`, `BatchRevokeMutation`, `BatchRedownloadMutation`, etc. types are generated. If Plan 5's schema is not yet defined, coordinate with Plan 5 to add the required types first.

**Quality loop**: tsgo (verify codegen types resolve)

---

## Task 4: Create Container + ViewModel

**Estimated time**: 3-4 hours
**Dependencies**: Task 1 (i18n), Task 2 (store), Task 3 (GraphQL documents)
**Requirements**: REQ-16.1–16.21 (list display, search, filter, pagination), REQ-16.25–16.30 (bulk actions)

### Subtasks

#### 4.1 Create types file for container

**File to create**: `frontend/common/views/dashboard/certificates/list/types.ts`

**Content**: Define the `CertificateListContainerProps`, `CertificateListViewProps`, `CertificatePermissions`, `BulkActionAvailability`, `CertificateListViewModel` types. Import the generated Apollo types for query and mutation results. Define the `BulkActionType` union type.

**Quality loop**: tsgo + biome + lint

#### 4.2 Create CertificateListContainer

**File to create**: `frontend/common/views/dashboard/certificates/list/CertificateListContainer.tsx`

**Content**: Client component (`"use client"`) that:
- Props: `userContext`, `locale`, `labels`
- Uses `useAppTranslation(Translation.Dashboard.CertificateList)` for i18n labels
- Reads store state via `useCertListStore` hook
- Derives Apollo query variables from store state (filters, pagination, sort) via `useMemo`
- Calls `useQuery(CertificateListQueryDocument, { variables, fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true })`
- Calls `useQuery(CertificateMetricsQueryDocument, { variables: filterOnly, fetchPolicy: 'cache-first' })`
- Calls `useMutation` for revoke, reissue, delete, batchRevoke, batchReissue, batchDelete with optimistic updates and cache refetch
- Debounces search query (300ms) using a `useEffect` timer — sets `debouncedSearch` in store
- Computes `bulkActionAvailability` from selected IDs and cached query data
- Handles mutation results: success → refetch list + metrics; failure → snackbar error
- Handles batch mutation results: partial failures → results dialog state
- Passes all data, handlers, and labels to `CertificateListView`

**Instruction files**: `frontend.instructions.md`
**AGENTS.md files**: `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md`

**Quality loop**: tsgo + biome + lint

#### 4.3 Create CertificateListView (responsive switch)

**File to create**: `frontend/common/views/dashboard/certificates/list/CertificateListView.tsx`

**Content**: Client component that:
- Uses MUI `useMediaQuery` to detect mobile/desktop
- Delegates to `CertificateListDesktop` or `CertificateListMobile` based on screen size
- Renders shared components: `MetricCardGrid`, `EmptyState`, `ErrorState`, `RevokeDialog`, `ConfirmDialog`
- Passes all props through to the tier views

**Quality loop**: tsgo + biome + lint

---

## Task 5: Create Desktop View (AppDataGrid)

**Estimated time**: 3-4 hours
**Dependencies**: Task 4 (container + view)
**Requirements**: REQ-16.7 (desktop grid columns), REQ-16.22–16.24 (column config), REQ-16.36 (status badges)

### Subtasks

#### 5.1 Create CertificateListDesktop component

**File to create**: `frontend/desktop/views/dashboard/certificates/list/CertificateListDesktop.tsx`

**Content**: Desktop tier view component that renders:
- `CertificateTableToolbar` (search bar, filter button, column config button, bulk action bar)
- `AppDataGrid` with column definitions, checkbox selection, row click handler, pagination controls, sort handlers

**Column definitions** (derived from labels and column config):
- `certificateId` — text column, sortable
- `recipientName` — text column, sortable
- `templateName` — text column (from template relation)
- `issueDate` — date column, sortable, locale-formatted via Intl.DateTimeFormat
- `status` — custom renderer with `StatusBadge` component
- `verificationCode` — text column (mono font)
- `category` — text column (from category relation, optional)
- `actions` — custom renderer with `RowActionMenu` component

**MUI v9 compliance**:
- All style props go through `sx` prop (no `fontWeight`, `mb`, `mt` etc. as direct props)
- Icon names use `Outlined` suffix (e.g., `workspacePremiumOutlined`)

**Quality loop**: tsgo + biome + lint

#### 5.2 Create StatusBadge component

**File to create**: `frontend/desktop/views/dashboard/certificates/list/StatusBadge.tsx`

**Content**: MUI Chip component with status-based color from theme palette. Props: `status`, `label`, `size`. Uses `sx` prop for coloring. `aria-label` with status prefix. Color mapping per design.md §Status Badge Mapping.

**Quality loop**: tsgo + biome + lint

#### 5.3 Create RowActionMenu component

**File to create**: `frontend/desktop/views/dashboard/certificates/list/RowActionMenu.tsx`

**Content**: MUI Menu (popover) with menu items: View Details, Revoke (conditional on status + permission), Reissue (conditional), Download (conditional), Copy Verification Code, Delete (conditional). Each item triggers a callback. Menu opens from a MoreVert icon button.

**Quality loop**: tsgo + biome + lint

#### 5.4 Create BulkActionBar component

**File to create**: `frontend/desktop/views/dashboard/certificates/list/BulkActionBar.tsx`

**Content**: MUI Toolbar (sticky) appearing when selection count > 0. Shows: selected count chip (pluralized), Revoke button, Reissue button, Download button, Delete button, Clear Selection button. Each button disabled per `bulkActionAvailability` validation. Uses `labels.bulkActions.*` translation keys.

**Quality loop**: tsgo + biome + lint

---

## Task 6: Create Mobile View (Card List)

**Estimated time**: 2-3 hours
**Dependencies**: Task 4 (container + view)
**Requirements**: REQ-16.8 (mobile card list), REQ-16.39–16.40 (navigation)

### Subtasks

#### 6.1 Create CertificateListMobile component

**File to create**: `frontend/mobile/views/dashboard/certificates/list/CertificateListMobile.tsx`

**Content**: Mobile tier view component that renders:
- Sticky search bar at top
- Filter button (opens `FilterBottomSheet`)
- Mobile bulk action bar (when selection > 0)
- `MobileCardList` — list of `CertificateCard` components
- Load more / infinite scroll button at bottom

**Quality loop**: tsgo + biome + lint

#### 6.2 Create CertificateCard component

**File to create**: `frontend/mobile/views/dashboard/certificates/list/CertificateCard.tsx`

**Content**: MUI Card for a single certificate showing:
- `StatusBadge` (top-right corner)
- Recipient name (Typography, bold, primary)
- Template name (Typography, secondary)
- Issue date (Typography, caption, locale-formatted)
- Verification code (Typography, monospace, with copy icon button)
- Checkbox (for multi-select)
- Card action menu (MoreVert icon → same options as desktop RowActionMenu)
- Entire card clickable → navigates to `/certificates/[id]`

**MUI v9 compliance**: All style via `sx` prop. Touch targets ≥ 44px.

**Quality loop**: tsgo + biome + lint

#### 6.3 Create FilterBottomSheet component

**File to create**: `frontend/mobile/views/dashboard/certificates/list/FilterBottomSheet.tsx`

**Content**: MUI BottomSheet (SwipeableDrawer anchor bottom) with filter form. Same filter options as desktop FilterPanel but optimized for mobile: full-width inputs, larger touch targets, apply/clear buttons.

**Quality loop**: tsgo + biome + lint

---

## Task 7: Create Revoke Dialog + Bulk Confirm Dialog

**Estimated time**: 2-3 hours
**Dependencies**: Task 4 (container + view)
**Requirements**: §2.8 (revoke workflow), REQ-16.30 (bulk action confirmation)

### Subtasks

#### 7.1 Create RevokeDialog component

**File to create**: `frontend/common/views/dashboard/certificates/list/RevokeDialog.tsx`

**Content**: MUI Dialog component:
- Props: `open`, `selectedCount`, `onConfirm(reason)`, `onCancel`, `labels`
- Title: `revokeDialog.title` (single) or `revokeDialog.bulkTitle` (count > 1)
- Warning text: `revokeDialog.warning`
- Reason text field (required, multiline, min 10 chars)
- Validation: if reason empty on submit → show `revokeDialog.reasonRequired` error
- Cancel button: `revokeDialog.cancel`
- Confirm button: `revokeDialog.confirm` (red/error color)
- Loading state when revoke mutation is in progress (disable both buttons)

**Quality loop**: tsgo + biome + lint

#### 7.2 Create ConfirmDialog component

**File to create**: `frontend/common/views/dashboard/certificates/list/ConfirmDialog.tsx`

**Content**: MUI Dialog for generic bulk action confirmation:
- Props: `open`, `action` (BulkActionType), `count`, `onConfirm`, `onCancel`, `labels`
- Title: `bulkActions.confirmTitle`
- Message: `bulkActions.confirmCount(count)` (pluralized) + action-specific message (`confirmReissue`, `confirmDelete`, `confirmDownload`)
- Cancel button: `bulkActions.cancel`
- Confirm button: `bulkActions.confirm`
- Loading state during mutation

**Quality loop**: tsgo + biome + lint

#### 7.3 Create BatchResultDialog component

**File to create**: `frontend/common/views/dashboard/certificates/list/BatchResultDialog.tsx`

**Content**: MUI Dialog showing batch action results:
- Props: `open`, `result` (BatchResult), `onClose`, `labels`
- Shows success count, failure count
- If failures: table/list of failed items with per-item error message (translated)
- Close button
- No retry button in this task (individual retries happen from the list row actions)

**Quality loop**: tsgo + biome + lint

---

## Task 8: Create Filter Panel + Metric Card Grid

**Estimated time**: 2-3 hours
**Dependencies**: Task 4 (container + view)
**Requirements**: REQ-16.10–16.11 (metrics), REQ-16.15–16.18 (filters)

### Subtasks

#### 8.1 Create FilterPanel component (desktop)

**File to create**: `frontend/desktop/views/dashboard/certificates/list/FilterPanel.tsx`

**Content**: MUI Popover or Drawer with filter form:
- Status multi-select (checkboxes or chips for draft, pending, issued, revoked, expired)
- Template dropdown (select from published templates — query provided by container)
- Category dropdown (select from categories)
- Date range picker (from date, to date)
- Apply button: `filters.apply`
- Clear All button: `filters.clearAll`

On apply: calls `onFilterChange` with partial filters. On clear: calls `onClearAll`. Both reset pagination to page 0.

**Quality loop**: tsgo + biome + lint

#### 8.2 Create MetricCardGrid component

**File to create**: `frontend/common/views/dashboard/certificates/list/MetricCardGrid.tsx`

**Content**: Grid of MetricCard components showing:
- Total (neutral icon)
- Issued (success icon)
- Revoked (error icon)
- Pending (warning icon)
- Draft (secondary icon)

Each card: count number (bold), label (caption), icon matching status type. Skeleton loading state when `loading=true`. Error placeholder when metrics query fails.

Uses existing `MetricCard` pattern from `frontend/components/ui/` — import and reuse if available, or create cert-specific variant.

**Quality loop**: tsgo + biome + lint

#### 8.3 Create EmptyState + ErrorState components

**File to create**: `frontend/common/views/dashboard/certificates/list/CertificateListStates.tsx`

**Content**: Export two components:
- `CertificateEmptyState` — shows `noCertificatesFound` or `emptyFilteredMessage` depending on whether filters are active. Includes an illustration (MUI Icon, large, muted) and translated text. If filters active, includes a "Clear Filters" button.
- `CertificateErrorState` — shows `errors.loadFailed` with a retry button. Retry calls `refetch()` from the Apollo query.

**Quality loop**: tsgo + biome + lint

---

## Task 9: Create App Router Page + Sidebar Navigation

**Estimated time**: 2-3 hours
**Dependencies**: Task 4 (container), Task 8 (filter panel)
**Requirements**: REQ-16.1–16.2 (page access), REQ-16.39 (sidebar), REQ-16.40 (mobile nav)

### Subtasks

#### 9.1 Create App Router page

**File to create**: `app/(dashboard)/certificates/page.tsx`

**Content**: Server component that:
- Calls `getServerUserContext()` to get authenticated user and permissions
- Calls `requirePermissionForPage(userContext, 'CERTIFICATES_VIEW')` — redirects to `/dashboard` if permission denied
- Extracts locale from `getLocale()`
- Calls `getTranslations(locale)` for layout labels
- Renders `<CertificateListContainer>` with `userContext`, `locale`, and `labels` props
- Exports `metadata` object with localized page title

**MUI v9 compliance**: All style via `sx` prop. No `console.*` — use `logger` from `@/frontend/common/utils/logger` if needed.

**Instruction files**: `frontend.instructions.md`
**AGENTS.md files**: `AGENTS.md`, `app/AGENTS.md`

**Quality loop**: tsgo + biome + lint

#### 9.2 Add sidebar navigation entry

**Files to edit**: Sidebar navigation configuration file (locate the existing sidebar config — likely in `frontend/common/components/navigation/` or `app/(dashboard)/layout.tsx`).

**Changes**: Add "Certificates" item to the sidebar:
- Label key: `sidebar.certificates` (translation: "Certificates" / "الشهادات")
- Route: `/certificates`
- Icon: `workspacePremiumOutlined`
- Permission gate: `CERTIFICATES_VIEW`
- Nav group: Content group

Also add translation key for `sidebar.certificates` in the sidebar i18n namespace (EN + AR).

**Quality loop**: tsgo + biome + lint on modified files

#### 9.3 Add mobile bottom navigation entry (conditional)

**Files to edit**: Bottom navigation configuration file (if separate from sidebar config).

**Changes**: Add "Certificates" as a bottom nav item for admin and teacher roles only. Use the same icon and label. If the bottom nav already has 5 items, evaluate whether to replace the least-used item or omit certificates.

**Quality loop**: tsgo + biome + lint

---

## Task 10: Integration Verification

**Estimated time**: 2-3 hours
**Dependencies**: Tasks 4-9 (all components built)
**Requirements**: All requirements (verify end-to-end)

### Subtasks

#### 10.1 Verify type checking

**Action**: Run `bun tsgo` to verify all TypeScript types resolve correctly across the entire plan. Fix any type errors in any file.

#### 10.2 Verify Biome formatting

**Action**: Run `bun biome:check` to verify all files are properly formatted. Fix any issues.

#### 10.3 Verify ESLint

**Action**: Run `bun run lint` (full-repo lint via queue client) to verify no ESLint violations in any file. Fix all violations.

> The lint queue server must be running. Start it with:
> `~/.bun/bin/bun run scripts/lint-queue-server.ts` (background process)

#### 10.4 Verify dev server renders

**Action**: Run `bun run dev` and navigate to `/certificates`:
- Verify the page loads without errors
- Verify the sidebar has a "Certificates" entry
- Verify the data grid (or card list on mobile) renders
- Verify search, filter, pagination work
- Verify clicking a row navigates to `/certificates/[id]` (will 404 until Plan 18 is built — that's OK, just verify the navigation triggers)

#### 10.5 Verify mutations

**Action**: In the dev server:
- Select certificates and verify bulk action toolbar appears
- Verify bulk action availability validation (mixed statuses disable buttons)
- Click Revoke → verify dialog opens → enter reason → confirm → verify status updates
- Click Reissue on a revoked cert → verify it becomes issued
- Click Delete on a draft → verify it disappears from list (soft-deleted)
- Verify error handling: attempt invalid transition and verify error toast/snackbar

#### 10.6 Verify i18n

**Action**: Switch locale to Arabic (change cookie or URL param):
- Verify all labels render in Arabic
- Verify status badges show Arabic status labels
- Verify pluralization for selected count (select 0, 1, 2, 3, and 11 certificates)
- Verify RTL layout is correct (grid, filter panel, dialogs)

---

## Task 11: Knowledge Propagation

**Estimated time**: 2-3 hours
**Dependencies**: Task 10 (verification complete)
**Requirements**: REQ-16.50 (outcome knowledge base)

### Subtasks

#### 11.1 Document key decisions

**Action**: Record key implementation decisions, patterns used, and challenges encountered during implementation. Log to the session `todos` table with a `deviation` label for any pattern deviations from `siraj_analysis/05-frontend-patterns.md`.

#### 11.2 Document patterns for Plan 21

**Content**: Prepare the knowledge artifacts listed in design.md §Outcome & Knowledge Transfer Protocol for incorporation into Plan 21 (Knowledge Propagation):
- Certificate list column definitions and renderers pattern
- Bulk action validation pattern (status-based enable/disable)
- Zustand store pattern for list pages (filters + pagination + selection)
- Cursor pagination with Apollo `fetchMore` for certificate list
- Status badge color mapping
- i18n keys for list page (already created in Task 1)
- Sidebar navigation entry pattern

#### 11.3 Verify quality gate

**Action**: Run the full quality gate to verify the entire plan passes:
```bash
bun tsgo
bun biome:check
bun run lint
```

All three must pass clean. Fix any failures before marking this task complete.

---

## Execution Summary

```
Phase A (sequential):  Task 1 (i18n)
Phase B (sequential):  Task 2 (Zustand store)
Phase C (sequential):  Task 3 (GraphQL documents)
Phase D (sequential):  Task 4 (Container + ViewModel)
Phase E (parallel):    Task 5 (Desktop), Task 6 (Mobile), Task 7 (Dialogs), Task 8 (Filters + Metrics)
Phase F (sequential):  Task 9 (App Router + sidebar)
Phase G (sequential):  Task 10 (Integration verification)
Phase H (sequential):  Task 11 (Knowledge propagation)
```

**Total estimated time**: 38 hours (parallelizable to ~24 wall-clock hours with 4-way parallelism in Phase E and K)

---

## Task 12: Create CertificateListPage Component

**Estimated time**: 3-4 hours
**Dependencies**: Task 9 (App Router page exists), Task 4 (Container + ViewModel)
**Requirements**: §Component Hierarchy (PageContainer/PageHeader/FilterBar/ViewToggle), REQ-16.1–16.21

### Subtasks

#### 12.1 Create CertificateListPage

**File to create**: `frontend/views/dashboard/cert/certificates/list/CertificateListPage.tsx`

**Content**: Build the top-level desktop page wrapper consumed by the App Router page:
- `"use client"` directive at the top of the file.
- Render `<PageContainer>` → `<PageHeader>` with title "Certificates" and subtitle "Manage all issued certificates" (both via i18n keys from Task 1).
- "Generate Certificates" button in `PageHeader` actions slot, using `next/link` to `/[locale]/certificates/generate` (Plan 17 route).
- Render the existing `FilterBar` (see §Component Hierarchy for `FilterBar` contract).
- Render a `<ToggleButtonGroup>` for view-mode toggle (Table | Grid) that dispatches `setViewMode` on the store.
- Render `<CertificateTable>` (Task 13) when `viewMode === 'table'`, otherwise render `<CertificateGrid>` composed of `<CertificateCard>` (Task 14).
- Wire FilterBar changes (search, status, template, date range, sort) to the corresponding store actions; the store triggers the Apollo refetch.

**AGENTS.md files to read**:
- `AGENTS.md` (root — logging, path aliases)
- `frontend/views/AGENTS.md` (view conventions, MUI v9 style props)
- `frontend/AGENTS.md` (MUI v9, icon names, theme)

**Quality loop**: tsgo + biome + lint (per `[scripts/health/sub-loop.ts](scripts/health/sub-loop.ts)` with `--lifecycle lint`).

#### 12.2 Wire FilterBar to store

**Action**: Ensure each FilterBar control dispatches the matching store action:
- Search → `setSearchQuery` (with the existing 300ms debounce → `setDebouncedSearch`).
- Status filter → `setStatusFilter`.
- Template filter → `setTemplateFilter` (options sourced from `TemplatesForFilterQueryDocument`).
- Date range → `setDateRange`.
- Sort field → `setSortBy` (payload from `CertificateSortField`).
- Export button → `openExportDialog([])` (filtered export).

**Quality loop**: tsgo + biome + lint.

---

## Task 13: Create CertificateTable (AppDataGrid primary view)

**Estimated time**: 4-5 hours
**Dependencies**: Task 4 (Container + ViewModel — exports the row props), Task 12 (page hosts the table)
**Requirements**: REQ-16.1–16.7 (columns, sort), REQ-16.19–16.21 (pagination), REQ-16.25–16.30 (bulk action bar), §B (column spec)

### Subtasks

#### 13.1 Create CertificateTable

**File to create**: `frontend/views/dashboard/cert/certificates/list/CertificateTable.tsx`

**Content**: Server-driven paginated table built on `AppDataGrid` (existing component under `frontend/components/ui/`):
- Pin the checkbox column on the left and the actions column on the right (`AppDataGrid` supports column pinning — use the existing prop pattern).
- Columns (exact contract in §B): checkbox, certificateNumber (mono font), recipientName, recipientEmail, template, status (via `CertificateStatusBadge`), issueDate, expiryDate, actions.
- Header click on a sortable column dispatches `setSort(field, 'asc' | 'desc')` on the store.
- Row click navigates to `/certificates/[id]` (Plan 18). Action buttons stop propagation.
- Row actions rendered as `IconButton`s (per §B table): View (`VisibilityOutlined`), Download (`DownloadOutlined`), Revoke (`BlockOutlined`, `color="error"`), Verify (`OpenInNewOutlined` to the public verification URL).
- Page-size selector uses the standard options `[10, 25, 50, 100]` (default 10 per §Zustand Store Design). Dispatching `setPageSize` triggers refetch with the new `perPage`.
- When `selectedIds.size >= 1` the `BatchOperationsBar` (existing component — see §Component Hierarchy for `BatchOperationsBar`) renders with Download All, Revoke All, Export Selected and a pluralized "N selected" count label (i18n `selectedCount`).

**AGENTS.md files to read**:
- `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/components/ui/AGENTS.md` (if present), root `AGENTS.md`.

**Quality loop**: tsgo + biome + lint (`sub-loop.ts --lifecycle lint`).

---

## Task 14: Create CertificateCard (grid view)

**Estimated time**: 3-4 hours
**Dependencies**: Task 4 (Container — same Props shape as the mobile `CertificateCardItem`), Task 12 (page swaps to grid view)
**Requirements**: REQ-16.1 (list view alt), §C (card spec)

### Subtasks

#### 14.1 Create CertificateCard

**File to create**: `frontend/views/dashboard/cert/certificates/list/CertificateCard.tsx`

**Content**: Single-card component per §C:
- `<Card>` with `CardActionArea` wrapping the body (navigates to the detail page on click — propagation stops at action buttons).
- `<CardContent>` renders:
  - Certificate number as `<Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>`.
  - Recipient name as `<Typography variant="h6">`.
  - `<CertificateStatusBadge>` (StatusBadge alias) using the existing status mapping.
  - Issue date — Expiry date row as `<Typography variant="caption">` (spacer via `sx={{ mr: 1 }}`).
  - Template name as `<Typography variant="caption" sx={{ color: 'text.secondary' }}>`.
- `<CardActions>` row with `IconButton`s for View (`VisibilityOutlined`), Download (`DownloadOutlined`), Revoke (`BlockOutlined`, `color="error"`) and Verify (`OpenInNewOutlined`). The first child of the actions row matches the mobile card action set.
- Thumbnail at the top of the card uses the template preview image or a placeholder div at a 4:3 aspect ratio (use `sx={{ aspectRatio: '4 / 3', ... }}`).

#### 14.2 Create CertificateGrid

**File to create**: `frontend/views/dashboard/cert/certificates/list/CertificateGrid.tsx`

**Content**: Map the current-page items to `<CertificateCard>` inside `<Grid container spacing={{ xs: 2, md: 3 }}>` — each item wrapped in `<Grid item xs={12} sm={6} md={4} lg={3}>`. Below the grid render the same page-size selector and pager used by `CertificateTable` so both views share pagination state from the store.

**Quality loop**: tsgo + biome + lint (`sub-loop.ts --lifecycle lint`).

---

## Task 15: Create RevokeCertificateDialog

**Estimated time**: 3-4 hours
**Dependencies**: Task 4 (Container calls `openRevokeDialog`), Task 13 (table single-row Revoke action), Plan 5 (revoke/batch-revoke GraphQL mutations — see Task 3 documents)
**Requirements**: REQ-16.31–16.35 (revoke workflow), §D (dialog spec)

### Subtasks

#### 15.1 Create RevokeCertificateDialog

**File to create**: `frontend/views/dashboard/cert/certificates/list/RevokeCertificateDialog.tsx`

**Content**: Controlled `Dialog` per §D with props `{ open, certificateIds: string[], onClose, onRevoked }`:
- `<Alert severity="warning">` explaining that revoking N certificate(s) cannot be undone; use the singular/plural i18n key form from §i18n Design.
- When `certificateIds.length > 1`, render a scrollable `<List>` of certificate numbers being bulk-revoked (`maxHeight: 200, overflow: 'auto'`).
- Reason `<Select>` with options Incorrect Information, Fraudulent, Requested by Recipient, Academic Violation, Other.
- When "Other" is selected, render an additional required `<TextField>` for the custom reason; the Revoke button stays disabled until this is non-empty.
- Notify recipient `<Switch>` (default on).
- Revoke button: `<Button color="error" variant="contained">`.
- On confirm: call `revokeCertificates({ ids, reason, customReason, notifyRecipient })` on the store (Task 16). For a single ID this dispatches `RevokeCertificateMutationDocument`; for multiple IDs it dispatches `BatchRevokeMutationDocument` (see Task 3).
- After success call `onRevoked(ids)` so the parent clears selection and refetches; display a success toast and close the dialog.

**Read existing revoke workflow**: §Revoke Workflow as a Dialog (DD-7) and §Error Handling Strategy from design.md. The dialog must NOT navigate away — it returns the result via `onRevoked`.

**AGENTS.md files to read**:
- `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`.
- Cross-check §Status Badge Mapping to ensure the list re-renders with the new status badge after a successful revoke.

**Quality loop**: tsgo + biome + lint (`sub-loop.ts --lifecycle lint`).

---

## Task 16: Create CertificateExportDialog

**Estimated time**: 3-4 hours
**Dependencies**: Task 4 (Container calls `openExportDialog`), Task 13 (table Export button), Plan 5 (export query/mutation)
**Requirements**: REQ-16.36–16.40 (export workflow), §E (dialog spec)

### Subtasks

#### 16.1 Create CertificateExportDialog

**File to create**: `frontend/views/dashboard/cert/certificates/list/CertificateExportDialog.tsx`

**Content**: Controlled `Dialog` per §E with props `{ open, certificateIds: string[], onClose }`:
- `<RadioGroup>` with options CSV, PDF (combined), PDF (individual ZIP), Excel.
- When format is CSV or Excel show a `<FormGroup>` column-selection checkbox set: Certificate #, Recipient, Email, Template, Status, Issue Date, Expiry Date.
- When format is PDF (combined or ZIP) show an "Include preview thumbnails" `<Switch>`.
- Export button starts the export with a `CircularProgress size={20}` spinner when in flight; for ZIP exports the dialog stays open until the server download URL is ready.
- On confirm: call `exportCertificates({ format, columns, includeThumbnails, certificateIds })` on the store (Task 16 store actions). When `certificateIds` is `[]` the export uses the current filters; when it is non-empty it is scoped to the selection.
- Open the returned download URL via `window.open(downloadUrl, '_blank')`.
- Show a brief success snackbar; on error show the i18n `export.error` message.

**Quality loop**: tsgo + biome + lint (`sub-loop.ts --lifecycle lint`).

---

## Task 17: Create useCertificateListStore Zustand store

**Estimated time**: 3-4 hours
**Dependencies**: Task 2 (existing certListStore — see §Zustand Store Design), Task 3 (GraphQL documents), Task 16 (annotations to revoke/export actions)
**Requirements**: §F (enhanced store interface), REQ-16.25–16.40 (bulk actions + export state)

### Subtasks

#### 17.1 Add enhanced store actions

**File to edit**: `frontend/common/stores/certListStore.ts`

**Changes**: Extend the existing `certListStore` (defined in §Zustand Store Design — do NOT replace it) with the actions declared in §F:
- `loadCertificates(): void` — triggers the Apollo query refetch using the current state (search, filters, sort, page, pageSize).
- `viewMode`, `setViewMode(mode)` — toggles between the Table and Grid views (used by Task 12 view toggle and Task 13/Task 14).
- `revokeDialogOpen`, `revokeTargetIds`, `openRevokeDialog(ids)`, `closeRevokeDialog()`, `revokeCertificates({ ids, reason, customReason, notifyRecipient })` — used by Task 15 dialog. `revokeCertificates` dispatches the single or batch mutation based on the IDs array length.
- `exportDialogOpen`, `openExportDialog(ids)`, `closeExportDialog()`, `exportCertificates({ format, columns, includeThumbnails, certificateIds })` — used by Task 16 dialog.
- `selectedIds` selection helpers (`toggleSelection`, `setSelection`, `clearSelection`) — already in §Zustand Store Design; ensure they emit the array form for JSON-logging where logs are produced.

**Existing state fields** already declared by the existing store (`searchQuery`, `debouncedSearch`, `page`, `pageSize`, `sortField`, `sortOrder`, `statusFilter`, `templateId`, `categoryId`, `recipientName`, `dateFrom`, `dateTo`, `selectedIds`, `columnVisibility`) MUST NOT be duplicated. Migrate the new dialog/view-mode fields into the existing interface rather than creating a parallel store.

#### 17.2 Add new types to the types file

**File to edit**: `frontend/common/stores/certListStore.types.ts`

**Changes**: Add the type declarations used by the new actions:
- `CertificateImportViewMode = 'table' | 'grid'` (or reuse `CertificateViewMode`).
- `CertificateExportFormat = 'csv' | 'pdf-combined' | 'pdf-zip' | 'excel'`.
- `RevokeReason = 'incorrect-information' | 'fraudulent' | 'requested-by-recipient' | 'academic-violation' | 'other'`.
- `RevokeCertificateParams = { ids: string[]; reason: RevokeReason; customReason?: string; notifyRecipient: boolean }`.
- `ExportCertificateParams = { format: CertificateExportFormat; columns?: string[]; includeThumbnails?: boolean; certificateIds: string[] }`.
- Extend `CertListStoreState` with the new dialog/view-mode state and the `loadCertificates`, `revokeCertificates`, `exportCertificates` actions (`CertificateListState` in §F).

**AGENTS.md files to read**:
- `frontend/common/stores/AGENTS.md` (Zustand conventions, no persistence for directory stores).
- `frontend/common/graphql/AGENTS.md` for the query/mutation imports used by the new actions.

**Quality loop**: tsgo + biome + lint (`sub-loop.ts --lifecycle lint`).

---

## Task 18: Create Component Tests (5 test files)

**Estimated time**: 5-6 hours
**Dependencies**: Tasks 12–17 (all components exist), Plan 5 (mock Apollo providers)
**Requirements**: REQ-16.1–16.40 (behavioural coverage), §Component test conventions

### Subtasks

> All component tests use Happy DOM + mocked Apollo (per existing `test/ui/components/` conventions; see `test/ui/AGENTS.md`). Use the existing Storybook mock stores; do NOT spin up the dev server here.

#### 18.1 CertificateListPage test

**File to create**: `test/ui/components/cert/CertificateListPage.test.tsx`

**Coverage**:
- Renders PageHeader with "Certificates" title and "Manage all issued certificates" subtitle.
- "Generate Certificates" button links to `/[locale]/certificates/generate`.
- FilterBar controls dispatch the corresponding store actions.
- View-mode toggle switches between table and grid representation.

#### 18.2 CertificateTable test

**File to create**: `test/ui/components/cert/CertificateTable.test.tsx`

**Coverage**:
- Renders all columns in §B (certificateNumber, recipientName, recipientEmail, template, status, issueDate, expiryDate, actions).
- Header click toggles sort and dispatches `setSort`.
- Row click navigates to the detail URL (`/certificates/[id]`).
- Row action buttons render and invoke the correct handler (View/Download/Revoke/Verify).
- `BatchOperationsBar` appears when 1+ row selected; Bulk Revoke opens `RevokeCertificateDialog` with the selected IDs.
- Page-size selector offers `[10, 25, 50, 100]` and dispatches `setPageSize`.

#### 18.3 CertificateCard test

**File to create**: `test/ui/components/cert/CertificateCard.test.tsx`

**Coverage**:
- Renders certificate number, recipient name, status badge, dates, template name.
- CardActionArea click invokes the `onView` handler.
- Each CardActions button invokes its own handler; none propagate to the card click.
- Thumbnail region uses a 4:3 aspect ratio style.

#### 18.4 RevokeCertificateDialog test

**File to create**: `test/ui/components/cert/RevokeCertificateDialog.test.tsx`

**Coverage**:
- Renders the warning `<Alert>` with singular/plural copy based on `certificateIds.length`.
- Bulk list of certificate numbers scrollable.
- "Other" reason reveals the custom reason field; Revoke stays disabled until filled.
- Notify recipient `Switch` toggles state.
- Confirm dispatches `revokeCertificates({ ids, reason, customReason, notifyRecipient })` and calls `onRevoked`.

#### 18.5 CertificateExportDialog test

**File to create**: `test/ui/components/cert/CertificateExportDialog.test.tsx`

**Coverage**:
- Renders all four format options.
- CSV/Excel reveal column-selection checkboxes.
- PDF formats reveal the "Include preview thumbnails" Switch.
- Confirm dispatches `exportCertificates({ format, columns, includeThumbnails, certificateIds })` with the current selection.

**AGENTS.md files to read**:
- `test/ui/AGENTS.md` and `tests.instructions.md` (component-test conventions, mock Apollo, no server).
- `frontend/AGENTS.md` (for MUI v9 style notes when writing assertions).

**Quality loop per file**: tsgo + biome + lint via `sub-loop.ts --lifecycle lint`. For per-test-file run use `bun run scripts/run-test/run-test.ts <test-path>`.

---

## Task 19: Create E2E Tests (6 tests)

**Estimated time**: 4-5 hours
**Dependencies**: Task 10 (dev server integration verified), Tasks 12–17 (page, table, card, dialogs)
**Requirements**: REQ-16.1–16.40 (end-to-end verification on a production build)

### Prerequisites

- Run `bun run build:test` before executing E2E tests (per `package.json` → `test:ui:e2e`).
- Tests run against the production-style test bundle (`.next-test-prod`) on the test port range 3001, 3020–3199 (never the dev:3000 server).
- Use the project's Playwright helpers — see `test/ui/AGENTS.md`.

### Subtasks

#### 19.1 E2E: View certificate list in table mode

**File to create**: `test/ui/e2e/cert/list-view-table.spec.ts`

**Coverage**: Load `/certificates`, verify the table renders with column headers, page-size selector defaults and at least one row visible.

#### 19.2 E2E: View certificate list in grid mode

**File to create**: `test/ui/e2e/cert/list-view-grid.spec.ts`

**Coverage**: Click the view-mode toggle to Grid, verify the grid renders cards in 1-3 columns by breakpoint and that the page navigation matches the table pager.

#### 19.3 E2E: Filter certificates by status

**File to create**: `test/ui/e2e/cert/filter-by-status.spec.ts`

**Coverage**: Select each status option (Issued, Revoked, Expired, Pending) and verify the visible rows reflect the filter; reset the filter to "All".

#### 19.4 E2E: Search certificates

**File to create**: `test/ui/e2e/cert/search-certificates.spec.ts`

**Coverage**: Type a recipient name / certificate number / email fragment into the search field and verify the list narrows to matching rows (respecting the 300ms debounce).

#### 19.5 E2E: Revoke certificate

**File to create**: `test/ui/e2e/cert/revoke-certificate.spec.ts`

**Coverage**:
- Single revoke: open row actions → click Revoke → dialog appears with singular copy → select "Incorrect Information" → set notify on → confirm → toast success → row status changes to Revoked.
- Bulk revoke: select two rows via checkboxes → `BatchOperationsBar` appears → click "Revoke All" → dialog appears with plural copy → choose "Academic Violation" → confirm → both rows now show Revoked status.

#### 19.6 E2E: Export certificates

**File to create**: `test/ui/e2e/cert/export-certificates.spec.ts`

**Coverage**:
- Open the Export dialog from the FilterBar with no rows selected; choose CSV with a subset of columns; verify the export triggers a download request (mock the export endpoint).
- Select two rows → Bulk bar → "Export Selected" → choose PDF (combined) → enable thumbnails → confirm → verify the download URL is requested.
- Verify CSV column-selection checkboxes are hidden for PDF (combined/zip), and that the thumbnail Switch is hidden for CSV/Excel.

**AGENTS.md files to read**:
- `test/ui/AGENTS.md` and `tests.instructions.md` (Playwright conventions, the `build:test` prerequisite, test-port range).
- `frontend/AGENTS.md`, root `AGENTS.md`.

**Quality loop**: run E2E tests via `bun run test:ui:e2e` after `bun run build:test`. For per-file log capture use `bun run scripts/run-test/run-test.ts <test-path>`.

---

## Task 20: Quality Loop Per File

**Estimated time**: 1-2 hours
**Dependencies**: Tasks 12–19 (all new files exist)
**Requirements**: §Relevant Quality Commands, quality-gate workflow

### Subtasks

#### 20.1 Per-file progressive quality gate

Run the progressive per-file loop on every new file to catch issues at the file level before they propagate to the full quality gate:

```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
```

Where `<file-path>` is one of:
- `frontend/views/dashboard/cert/certificates/list/CertificateListPage.tsx`
- `frontend/views/dashboard/cert/certificates/list/CertificateTable.tsx`
- `frontend/views/dashboard/cert/certificates/list/CertificateCard.tsx`
- `frontend/views/dashboard/cert/certificates/list/CertificateGrid.tsx`
- `frontend/views/dashboard/cert/certificates/list/RevokeCertificateDialog.tsx`
- `frontend/views/dashboard/cert/certificates/list/CertificateExportDialog.tsx`
- `frontend/common/stores/certListStore.ts`
- `frontend/common/stores/certListStore.types.ts`
- `test/ui/components/cert/CertificateListPage.test.tsx`
- `test/ui/components/cert/CertificateTable.test.tsx`
- `test/ui/components/cert/CertificateCard.test.tsx`
- `test/ui/components/cert/RevokeCertificateDialog.test.tsx`
- `test/ui/components/cert/CertificateExportDialog.test.tsx`
- `test/ui/e2e/cert/list-view-table.spec.ts`
- `test/ui/e2e/cert/list-view-grid.spec.ts`
- `test/ui/e2e/cert/filter-by-status.spec.ts`
- `test/ui/e2e/cert/search-certificates.spec.ts`
- `test/ui/e2e/cert/revoke-certificate.spec.ts`
- `test/ui/e2e/cert/export-certificates.spec.ts`

The loop runs tsgo → biome → lint-queue-client and short-circuits at the first failing check. Fix errors at the file level before advancing.

#### 20.2 Full-plan quality gate

**Action**: After per-file loops pass, run the full-repo quality gate to ensure no regressions elsewhere:

```bash
bun tsgo
bun biome:check
bun run lint
```

All three must pass clean before this task is marked complete. Do NOT run `bun sonar-scan` (subagents are prohibited from running the SonarQube scan; the orchestrator handles that stage).

---

## Task 21: Knowledge Propagation (Certificate List UI)

**Estimated time**: 2-3 hours
**Dependencies**: Task 20 (quality gate clean), Plan 21 (Knowledge Propagation target)
**Requirements**: §Outcome & Knowledge Transfer Protocol (knowledge artifacts for Plan 21)

### Subtasks

#### 21.1 Record decisions for the list-page UI

**Action**: Log to the session `todos` table with a `deviation` label for any pattern deviation from the spec committed during this plan's component build-out (e.g. AppDataGrid pivoting modifications, `CertificateCard` thumbnail integration, optimistic-update shape for revoke).

#### 21.2 Prepare knowledge artifacts

**Content**: Package the following actionable artifacts for incorporation into Plan 21 (Knowledge Propagation):
- `CertificateTable` column map + row-action builder (icon → handler) pattern (Task 13).
- `CertificateCard` grid-card composition for the desktop grid view (Task 14).
- The enhanced `certListStore` shape for list pages with revoke + export dialog state (Task 17).
- `RevokeCertificateDialog` (single vs. bulk) and `CertificateExportDialog` (format + column/options) reusable dialog pattern (Tasks 15/16).
- FilterBar → store action wiring sequence + 300ms debounce pattern (Task 12.2).
- View-mode toggle (Table | Grid) wiring using `setViewMode` (Task 12).
- Component test fixtures (mock Apollo + Storybook mock store) used by Tasks 18.1–18.5.
- E2E test layout under `test/ui/e2e/cert/` for Plan 21 reference (Tasks 19.1–19.6).

#### 21.3 Verify quality gate

**Action**: Run the full quality gate to verify the entire plan passes clean:

```bash
bun tsgo
bun biome:check
bun run lint
```

All three must pass clean. Fix any failures before marking this task complete.

---

## Revised Execution Summary

```
Phase A (sequential):  Task 1  (i18n)
Phase B (sequential):  Task 2  (Zustand store — base)
Phase C (sequential):  Task 3  (GraphQL documents)
Phase D (sequential):  Task 4  (Container + ViewModel)
Phase E (parallel):    Task 5  (Desktop), Task 6 (Mobile), Task 7 (Dialogs), Task 8 (Filters + Metrics)
Phase F (sequential):  Task 9  (App Router + sidebar)
Phase G (sequential):  Task 10 (Integration verification)
Phase H (sequential):  Task 11 (Knowledge propagation — base)
Phase I (sequential):  Task 12 (CertificateListPage)
Phase J (parallel):    Task 13 (CertificateTable), Task 14 (CertificateCard + Grid)
Phase K (parallel):     Task 15 (RevokeCertificateDialog), Task 16 (CertificateExportDialog)
Phase L (sequential):  Task 17 (useCertificateListStore enhanced)
Phase M (parallel):    Task 18 (5 component tests)
Phase N (sequential):  Task 19 (6 E2E tests) — requires build:test, runs on the test port range
Phase O (sequential):  Task 20 (Quality loop per file)
Phase P (sequential):  Task 21 (Knowledge propagation — list UI)
```

**Total estimated time**: 38 hours (parallelizable to ~24 wall-clock hours with 4-way parallelism in Phase E and K)

## Round 4 Enhancement Tasks

### R4-T1: Advanced Search & Multi-Filter System
- [ ] Create `frontend/views/dashboard/certificates/cert-list/components/AdvancedSearchBar.tsx`
  - Full-text search: debounced TextField (300ms) across recipient name, certificate ID, template name
  - Filter chips: MUI v9 Chip components showing active filters with remove (X) button
  - Saved searches: name + save button, dropdown to load saved searches
  - Search history: last 10 searches in autocomplete dropdown
  - Clear all filters: button to reset all filters
  - Filter persistence: save to URLSearchParams for shareable links
  - _Store: `certListStore` adds `savedSearches: SavedSearch[], searchHistory: string[]`_
  - **Quality loop**: tsgo + biome + lint queue client

### R4-T2: Multi-Column Sorting
- [ ] Update `frontend/views/dashboard/certificates/cert-list/components/CertDataGrid.tsx`
  - Sort by: issue date, recipient name, template name, status, expiry date
  - Multi-column sort: Shift+click header to add secondary sort
  - Sort indicator: arrows in header (↑↓ for multi-sort showing priority number)
  - Sort direction: ascending/descending toggle on click
  - Default sort: issue date descending
  - Persist sort state in URL query params
  - **Quality loop**: tsgo + biome + lint

### R4-T3: Bulk Operations Enhancement
- [ ] Create `frontend/views/dashboard/certificates/cert-list/components/BulkOperationsBar.tsx`
  - Sticky action bar: appears when ≥1 row selected, shows count "X selected"
  - Bulk actions: Download (ZIP), Revoke, Delete, Export CSV, Email, Tag
  - Select all across pages: checkbox + "Select all N certificates" link
  - Clear selection: button to deselect all
  - Progress modal: per-item progress for bulk download/revoke
  - Confirmation dialogs: "Revoke N certificates?" "Delete N certificates?"
  - Undo bulk delete: snackbar with undo action (10 second timeout)
  - **Quality loop**: tsgo + biome + lint

### R4-T4: Column Visibility & Customization
- [ ] Create `frontend/views/dashboard/certificates/cert-list/components/ColumnConfig.tsx`
  - Column toggle popover: checkbox list of available columns
  - Drag to reorder columns: DnD within the popover list
  - Column width resize: drag handle on header right edge
  - Column pin: pin left/right (sticky columns)
  - Save column config: per-user preference in localStorage + server sync
  - Reset to default: button to restore default column layout
  - Available columns: ID, Recipient, Template, Issue Date, Expiry Date, Status, Tags, Created By, Created At
  - **Quality loop**: tsgo + biome + lint

### R4-T5: Row Expansion & Inline Preview
- [ ] Update `frontend/views/dashboard/certificates/cert-list/components/CertDataGrid.tsx`
  - Expandable rows: chevron icon to expand/collapse
  - Inline preview: thumbnail of certificate in expanded area
  - Quick actions in expanded row: View, Download, Revoke, Share
  - Metadata display: issue date, expiry, status, verification URL
  - Recipient info: name, email, phone
  - Template info: name, version, thumbnail
  - **Quality loop**: tsgo + biome + lint

### R4-T6: Virtual Scrolling for Large Lists
- [ ] Update `frontend/views/dashboard/certificates/cert-list/components/CertDataGrid.tsx`
  - Virtualization: render only visible rows + buffer (5 above, 5 below)
  - Scroll position restoration: maintain scroll on data refresh
  - Infinite scroll: load more on scroll near bottom (page size: 50)
  - Skeleton rows: MUI v9 Skeleton during loading
  - Scroll to top: floating action button when scrolled down
  - Total count display: "Showing X-Y of Z certificates"
  - **Quality loop**: tsgo + biome + lint

### R4-T7: Certificate Tags & Labels
- [ ] Create `frontend/views/dashboard/certificates/cert-list/components/TagManager.tsx`
  - Add tag: input with autocomplete from existing tags
  - Color-coded tags: ColorPicker per tag, colored chip display
  - Bulk tag: select rows → add tag to all selected
  - Filter by tag: click tag chip to filter list by that tag
  - Tag suggestions: based on template name, recipient group
  - Rename tag: edit tag name across all certificates
  - Delete tag: remove tag from all certificates
  - _Store: `certListStore` adds `tags: Tag[], addTag(), bulkTag(ids, tagId)`_
  - **Quality loop**: tsgo + biome + lint

### R4-T8: Export Options
- [ ] Create `frontend/views/dashboard/certificates/cert-list/components/ExportDialog.tsx`
  - Export as CSV: with column selection checkboxes
  - Export as Excel: `.xlsx` with formatting (server-side via API route)
  - Export as JSON: complete certificate data with metadata
  - Export as PDF report: summary report with charts (issue count by month, status distribution)
  - Export selected only: checkbox to export only selected rows
  - Date range filter: optional date picker for export scope
  - **Quality loop**: tsgo + biome + lint

### R4-T9: Activity Timeline
- [ ] Create `frontend/views/dashboard/certificates/cert-list/components/ActivityTimeline.tsx`
  - Per-certificate timeline: creation, generation, download, share, revoke, reissue
  - Timeline UI: vertical timeline with icons per event type
  - User info: who performed each action (avatar + name)
  - Timestamp: relative time ("2 hours ago") + absolute on hover
  - Filter timeline by event type: dropdown to filter shown events
  - Export timeline: download as audit report PDF
  - **Quality loop**: tsgo + biome + lint

### R4-T10: Accessibility
- [ ] Update `frontend/views/dashboard/certificates/cert-list/components/CertDataGrid.tsx`
  - ARIA roles: `role="grid"`, `role="row"`, `role="columnheader"`
  - Sort announcement: `aria-sort="ascending|descending"` on headers
  - Selection announcement: `aria-selected="true"` on selected rows
  - Bulk actions bar: `aria-label="Bulk operations for N selected certificates"`
  - Keyboard navigation: arrow keys between rows, Enter to expand, Space to select
  - Screen reader: row count announcement on data load
  - **Quality loop**: tsgo + biome + lint

### R4-T11: Empty & Error States
- [ ] Create `frontend/views/dashboard/certificates/cert-list/components/EmptyState.tsx`
  - No certificates: illustration + "No certificates yet" + "Create your first certificate" CTA
  - No search results: "No certificates match your filters" + "Clear filters" button
  - Loading error: "Failed to load certificates" + retry button
  - Permission denied: "You don't have permission to view certificates" + contact admin
  - **Quality loop**: tsgo + biome + lint

### R4-T12: Performance Budgets
- [ ] Performance targets:
  - Initial list render: < 500ms for 100 certificates
  - Virtual scroll frame: < 16ms (60fps)
  - Search response: < 200ms debounce + < 300ms server response
  - Bulk operations: < 2s for 100 certificates
  - Export CSV 1000 rows: < 5s
  - Memory usage: < 50MB for 10,000 certificates in virtual list

### R4-T13: Component Tests
- [ ] Create `test/ui/components/cert-list/AdvancedSearchBar.test.tsx`
  - Test full-text search
  - Test filter chips
  - Test saved searches
  - Test search persistence in URL
- [ ] Create `test/ui/components/cert-list/BulkOperationsBar.test.tsx`
  - Test selection count display
  - Test bulk download
  - Test bulk revoke confirmation
  - Test undo bulk delete
- [ ] Create `test/ui/components/cert-list/ColumnConfig.test.tsx`
  - Test column toggle
  - Test column reorder
  - Test column resize
- [ ] Create `test/ui/components/cert-list/TagManager.test.tsx`
  - Test add tag
  - Test bulk tag
  - Test filter by tag
- [ ] Create `test/ui/components/cert-list/EmptyState.test.tsx`
  - Test each empty state variant
  - Test retry button

### R4-T14: Knowledge Propagation
- [ ] Create `docs/frontend/certificate-list-management-patterns.md`
  - Update `frontend/AGENTS.md` with reference
  - Run quality checks
