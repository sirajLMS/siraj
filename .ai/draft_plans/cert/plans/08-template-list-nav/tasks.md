# Plan 08 — Template List & Navigation: Tasks

> **Plan #:** 8 · **Title:** Template List & Navigation
> **Dependencies:** Plan 05 (GraphQL API for Certificate Templates), Plan 01 (Database Schema), Plan 02 (Types & Permissions)
> **Dependents:** Plan 09 (Category Management — blocked by sidebar), Plan 10 (Template Editor — blocked by create dialog), Plan 11 (Certificate Generation — blocked by Generate action), Plan 15 (Verification Log — blocked by sidebar), Plan 17 (Admin Dashboard — blocked by nav)
> **Estimate:** 11 tasks · ~32–40 hours total

---

## Document Info

| Field | Value |
|-------|-------|
| Plan | 08 — Template List & Navigation |
| Phase Count | 5 (Foundation, List Page, Interactions, Navigation & Knowledge, Testing & Verification) |
| Task Count | 13 (T01–T13) |
| Frontend Only | Yes — consumes GraphQL APIs from Plan 05/16 |
| Design Reference | `design.md` (same directory) |
| Requirements Reference | `requirements.md` (same directory — DO NOT MODIFY) |

---

## Dependency Graph

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                         │
                    │                    T01 (i18n + Store)                   │
                    │                    ┌──────┴──────┐                      │
                    │                    │             │                      │
                    │              T02 (GQL Docs)  T03 (Zustand Store)        │
                    │                    │             │                      │
                    │                    └──────┬──────┘                      │
                    │                           │                              │
                    │                     T04 (App Router + Container)       │
                    │                    ┌───────┴───────┐                    │
                    │                    │               │                    │
                    │              T05 (Desktop View)  T06 (Mobile View)      │
                    │              ┌─────┴─────┐         ┊                    │
                    │              │           │         ┊                    │
                    │        T07 (Create     T08 (Card   ┊                    │
                    │       Dialog)          Actions)    ┊                    │
                    │              │           │         ┊                    │
                    │              └─────┬─────┘         ┊                    │
                    │                    │               ┊                    │
                    │              T09 (Bulk + Filter Panel)                  │
                    │                    │                                     │
                    │              T10 (Sidebar Nav)                          │
                    │                    │                                     │
                    │              T11 (Knowledge Propagation)                │
                    │                    │                                     │
                    │              T12 (Testing — after T09)                  │
                    │                    │                                     │
                    │              T13 (Feature Enhancements)                 │
                    └─────────────────────────────────────────────────────────┘
```

**Chain:**
- T01 → T02 → T03 → T04 → {T05, T06} → {T07, T08} → T09 → T10 → T11 → T12 → T13
- T04 is the critical-path gate: all view/interaction tasks depend on the container
- T05 and T06 may run in parallel after T04
- T07 and T08 may run in parallel after T05 (T08 has soft dependency on T06 for mobile action wiring)
- T09 requires T05 (BulkActionBar component) and T08 (action handlers)
- T10 requires T01 (i18n sidebar keys) and can run concurrent with T05–T09
- T11 (knowledge propagation) depends on all prior tasks
- T12 (testing) depends on T09 (all components created) — can run parallel with T10/T11
- T13 (feature enhancements) depends on T05, T06, T08 (component files must exist)

---

## AGENTS.md & Instruction File References

| Task | Primary Layer | AGENTS.md Files | Instruction Files |
|------|---------------|-----------------|-------------------|
| T01 | Shared + Frontend Stores | `shared/AGENTS.md`, `shared/AGENTS.md` (locale rules), `frontend/common/stores/AGENTS.md` | `frontend.instructions.md` |
| T02 | Frontend GraphQL | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md` | `frontend.instructions.md` |
| T03 | Frontend Stores | `frontend/common/stores/AGENTS.md` | `frontend.instructions.md` |
| T04 | App Router + Frontend Views | `app/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md` | `frontend.instructions.md` |
| T05 | Frontend Desktop Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md` | `frontend.instructions.md` |
| T06 | Frontend Mobile Views | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md` | `frontend.instructions.md` |
| T07 | Frontend Views (Dialog) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| T08 | Frontend Views (Actions) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| T09 | Frontend Views (Bulk + Filter) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| T10 | App Router + Frontend (Sidebar) | `app/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| T11 | Cross-cutting (Docs) | Root `AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/common/graphql/AGENTS.md` | — |
| T12 | Testing (UI + E2E) | `test/ui/components/AGENTS.md`, `test/ui/e2e/AGENTS.md` | `tests.instructions.md` |
| T13 | Frontend Views (Enhancements) | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md` | `frontend.instructions.md` |

> **IMPORTANT:** Before starting any task, read ALL listed AGENTS.md and instruction files. The `scripts/health/sub-loop.ts` script auto-discovers and prints applicable files — use it for verification.

---

## Quality Loop (Per-File Verification)

Every task must run the progressive quality loop **per file** before marking the task complete. The standard loop is:

```bash
# 1. Type check (fast, safe to run concurrently)
bun tsgo

# 2. Biome formatting + lint (safe to run concurrently)
bun biome:check

# 3. ESLint via lint queue client (serialized — safe for parallel sub-agents)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-08-T<NN>","files":["<file-path>"]}'
```

For per-file progressive verification (tsgo → biome → lint → codescene, short-circuits at first failure):

```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>
```

**Stage options:** `tsgo`, `biome`, `lint`, `codescene`, `sonar-results` (sonar-results is same as codescene — no sonar-scan).

> **Lint Queue Server:** Must be running before any lint call. Start with `~/.bun/bin/bun run scripts/lint-queue-server.ts` (background). The port is in `scripts/lint-queue-config.ts`.

---

## Phase 1: Foundation (T01–T03)

These tasks build the infrastructure: i18n translations, GraphQL documents, and the Zustand store. No UI is created in this phase.

---

### T01: i18n Translations — Template List & Sidebar Namespaces

**Goal:** Define all translation keys for the template list page and the certificates sidebar navigation group, including Arabic pluralization for counts.

**Duration:** 3–4 hours

**Requirements covered:** REQ-08-01 (i18n page labels), REQ-08-02 (search placeholder), REQ-08-03 (filter labels), REQ-08-04 (pagination labels), REQ-08-06 (sidebar i18n), REQ-08-07 (create dialog labels), REQ-08-08 (bulk action labels)

**Dependencies:** None (first task in the plan)

**Subtasks:**

- [ ] 1.1 Create the translation type schema at `shared/locale/types/dashboard/certificates/templates/list.ts`
  - Define the `CertificatesTemplatesList` interface with sub-groups: `status`, `filters`, `pagination`, `actions`, `actionsConfirm`, `bulkActions`, `createDialog`, `empty`, `errors`, `toasts`
  - `pagination.count` — pluralized function: `(loaded: number, total: number) => string`
  - `bulkActions.selectedCount` — pluralized function: `(count: number) => string`
  - `actionsConfirm.deleteMessage` — interpolation: `(name: string, status: string) => string`
  - `toasts.duplicateSuccess` — interpolation: `(name: string) => string`
  - `toasts.deleteSuccess` — interpolation: `(name: string) => string`
  - `filters.activeCount` — pluralized function: `(count: number) => string`

- [ ] 1.2 Create the sidebar type schema at `shared/locale/types/dashboard/sidebar.ts`
  - Define the `DashboardSidebar` interface with a `certificates` group: `label`, `templates`, `categories`, `recipientGroups`, `certificates`, `verificationLog`
  - Each is a simple `string` key

- [ ] 1.3 Create the namespace registration at `shared/locale/namespaces/dashboard/certificates/templates/list.namespace.ts`
  - Register the `certificates.templates.list` namespace path
  - Reference the type from step 1.1

- [ ] 1.4 Create the sidebar namespace registration at `shared/locale/namespaces/dashboard/sidebar.namespace.ts`
  - Register the `certificates.sidebar` namespace (or `dashboard.sidebar` depending on existing structure)
  - Reference the type from step 1.2

- [ ] 1.5 Implement English translations at `shared/locale/en/dashboard/certificates/templates/list.ts`
  - All sub-groups from the type schema
  - `pagination.count`: `(loaded, total) => \`Showing ${loaded} of ${total} templates\``
  - `bulkActions.selectedCount`: `(count) => \`${count} selected\`` (English: simple plural with implicit "1 selected" singular)
  - `filters.activeCount`: `(count) => \`${count} active filter${count !== 1 ? 's' : ''}\``
  - All action labels: Edit, Preview, Duplicate, Delete, Generate from Template
  - Create dialog labels: nameLabel, categoryLabel, orientationLabel (Portrait/Landscape), pageSizeLabel (A4/Letter/Custom), cancelButton, createButton
  - Validation errors: nameRequired, nameTooLong
  - Empty states: noTemplates (title, description, cta), noResults (title, description, clearFilters)
  - Toast messages: createSuccess, duplicateSuccess, deleteSuccess, bulkArchiveSuccess, bulkDeleteSuccess, bulkChangeCategorySuccess

- [ ] 1.6 Implement English sidebar translations at `shared/locale/en/dashboard/sidebar.ts`
  - `certificates.label` = "Certificates"
  - `certificates.templates` = "Templates"
  - `certificates.categories` = "Categories"
  - `certificates.recipientGroups` = "Recipient Groups"
  - `certificates.certificates` = "Certificates"
  - `certificates.verificationLog` = "Verification Log"

- [ ] 1.7 Implement Arabic translations at `shared/locale/ar/dashboard/certificates/templates/list.ts`
  - All keys from step 1.5 in Arabic (RTL)
  - Arabic pluralization for `pagination.count` using 6-form CLDR:
    - `zero`: "لا توجد قوالب" (count = 0)
    - `one`: "قالب واحد من {total}" (count = 1)
    - `two`: "قالبان من {total}" (count = 2)
    - `few`: "{loaded} قوالب من {total}" (count = 3–10)
    - `many`: "{loaded} قالبًا من {total}" (count = 11–99)
    - `other`: "{loaded} قالب من {total}" (count = 100+)
  - Arabic pluralization for `bulkActions.selectedCount` — same 6-form pattern
  - Arabic pluralization for `filters.activeCount` — same 6-form pattern
  - All validation errors, empty states, toasts in Arabic

- [ ] 1.8 Implement Arabic sidebar translations at `shared/locale/ar/dashboard/sidebar.ts`
  - `certificates.label` = "الشهادات"
  - `certificates.templates` = "القوالب"
  - `certificates.categories` = "الفئات"
  - `certificates.recipientGroups` = "مجموعات المستلمين"
  - `certificates.certificates` = "الشهادات"
  - `certificates.verificationLog` = "سجل التحقق"

- [ ] 1.9 Run quality loop per file:
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"verify-08-T01","files":["shared/locale/types/dashboard/certificates/templates/list.ts","shared/locale/types/dashboard/sidebar.ts","shared/locale/namespaces/dashboard/certificates/templates/list.namespace.ts","shared/locale/namespaces/dashboard/sidebar.namespace.ts","shared/locale/en/dashboard/certificates/templates/list.ts","shared/locale/en/dashboard/sidebar.ts","shared/locale/ar/dashboard/certificates/templates/list.ts","shared/locale/ar/dashboard/sidebar.ts"]}'
  ```

- [ ] 1.10 Write outcome file: `.ai/plans/cert-plan-08/outcome/T01-i18n-translations-outcome.md`
  - List files created, key groups defined, pluralization rules implemented
  - Note any deviations from the design doc

**Files to create:**
- `shared/locale/types/dashboard/certificates/templates/list.ts`
- `shared/locale/types/dashboard/sidebar.ts`
- `shared/locale/namespaces/dashboard/certificates/templates/list.namespace.ts`
- `shared/locale/namespaces/dashboard/sidebar.namespace.ts`
- `shared/locale/en/dashboard/certificates/templates/list.ts`
- `shared/locale/en/dashboard/sidebar.ts`
- `shared/locale/ar/dashboard/certificates/templates/list.ts`
- `shared/locale/ar/dashboard/sidebar.ts`

**Instruction verification:**
- `shared/AGENTS.md` — i18n rules, no cross-layer imports, compile-time system rules
- `.github/instructions/frontend.instructions.md` — frontend conventions
- Read all before implementing

---

### T02: GraphQL Documents — Template List, Mutations & Category List

**Goal:** Define all GraphQL query and mutation documents needed by the template list page, including cursor pagination, search/filter, and bulk operations.

**Duration:** 2–3 hours

**Requirements covered:** REQ-08-01 (list query), REQ-08-02 (search param), REQ-08-03 (filter params), REQ-08-04 (cursor pagination), REQ-08-05 (duplicate/delete mutations), REQ-08-07 (create mutation), REQ-08-08 (bulk mutations)

**Dependencies:** T01 (i18n complete — no code dependency, but ensures naming alignment)

**Subtasks:**

- [ ] 2.1 Create `frontend/common/graphql/sharedDocuments/cert/template-list.documents.ts`
  - `CertTemplatesQueryDocument` — query `certTemplates` with variables:
    - `first: Int!` (page size, default 20)
    - `after: String` (cursor, nullable)
    - `search: String` (debounced search term, nullable)
    - `statusFilter: [TemplateStatus!]` (multi-select status filter, nullable)
    - `categoryId: String` (hierarchical category filter, nullable)
    - `sortBy: TemplateSortBy` (sort field, nullable — default: updatedAt desc)
  - Return type: `CertTemplateConnection` with `edges { node { ... } }`, `pageInfo { hasNextPage, endCursor }`, `totalCount`
  - Fields on each template node: `id`, `name`, `status`, `category { id, name }`, `backgroundImage { url }`, `orientation`, `pageSize`, `elementCount`, `variableCount`, `updatedAt`, `createdAt`
  - **CRITICAL:** Always include `id` field on every object type for Apollo cache normalization

- [ ] 2.2 Define `CategoryListQueryDocument` in same file
  - Query `categoryRoots` returning `Category[]` with fields: `id`, `name`, `parentId`, `childCount`
  - Or query nested categories with children (check Plan 05/09 API shape)
  - Used by FilterPanel and CreateTemplateDialog for category dropdown

- [ ] 2.3 Define mutation documents in same file:
  - `CreateTemplateMutationDocument` — `createTemplate(input: { name, categoryId?, orientation, pageSize })` → returns `CertTemplate` with `id`, `name`
  - `DuplicateTemplateMutationDocument` — `duplicateTemplate(id: ID!)` → returns `CertTemplate` with `id`, `name`
  - `DeleteTemplateMutationDocument` — `deleteTemplate(id: ID!)` → returns `Boolean`
  - `BulkArchiveTemplatesMutationDocument` — `bulkArchiveTemplates(ids: [ID!]!)` → returns `BatchResult { successCount, failedCount, errors }`
  - `BulkDeleteTemplatesMutationDocument` — `bulkDeleteTemplates(ids: [ID!]!)` → returns `BatchResult`
  - `BulkChangeCategoryMutationDocument` — `bulkChangeCategory(ids: [ID!]!, categoryId: String!)` → returns `BatchResult`

- [ ] 2.4 Verify naming conventions:
  - Documents named: `{EntityName}QueryDocument`, `{EntityName}MutationDocument`
  - No `useLazyQuery` imports — use stateful `useQuery` exclusively
  - Import hooks from `"@apollo/client/react"`, not `"@apollo/client"`

- [ ] 2.5 Run GraphQL code generation:
  ```bash
  bun run generate:gqlSchema
  bun codegen
  ```
  - Verify generated types in `frontend/common/graphql/generated/`
  - Ensure `CertTemplateConnection`, `BatchResult`, `TemplateStatus` types exist
  - Fix any missing types by coordinating with Plan 05 backend (cross-file dependency — report if blocked)

- [ ] 2.6 Run quality loop:
  ```bash
  bun tsgo
  bun biome:check
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d '{"id":"verify-08-T02","files":["frontend/common/graphql/sharedDocuments/cert/template-list.documents.ts"]}'
  ```

- [ ] 2.7 Write outcome file: `.ai/plans/cert-plan-08/outcome/T02-graphql-documents-outcome.md`
  - List documents created, field selections, codegen status
  - Note any API gaps from Plan 05

**Files to create:**
- `frontend/common/graphql/sharedDocuments/cert/template-list.documents.ts`

**Files modified (auto-generated):**
- `frontend/common/graphql/generated/` (via `bun codegen` — do not edit manually)

**Instruction verification:**
- `frontend/common/graphql/sharedDocuments/AGENTS.md` — document naming, id field requirement, no useLazyQuery
- `frontend/common/graphql/AGENTS.md` — Apollo hook conventions
- `.github/instructions/frontend.instructions.md`

---

### T03: Zustand Store — Template List State Management

**Goal:** Create the `templateListStore` Zustand store with URL hydration, debounced search state, filter management, view mode persistence, and bulk selection tracking.

**Duration:** 2–3 hours

**Requirements covered:** REQ-08-01 (view mode state), REQ-08-02 (search state), REQ-08-03 (filter state), REQ-08-04 (cursor state), REQ-08-08 (selection state), REQ-08-09 (view mode persistence)

**Dependencies:** T01 (i18n — for type alignment), T02 (GraphQL docs — for understanding query variable shapes)

**Subtasks:**

- [ ] 3.1 Define store types at `frontend/common/stores/templateListStore.types.ts`
  - `TemplateListState`: `searchQuery: string`, `debouncedSearch: string`, `statusFilter: TemplateStatus[]`, `categoryFilter: string | null`, `cursor: string | null`, `pageSize: number` (default 20), `viewMode: 'grid' | 'table'`, `selectedIds: Set<string>`, `bulkBarOpen: boolean`, `filterPanelOpen: boolean`, `createDialogOpen: boolean`, `deleteTargetId: string | null`
  - `TemplateListActions`: `setSearchQuery(query: string)`, `setDebouncedSearch(query: string)`, `setStatusFilter(statuses: TemplateStatus[])`, `setCategoryFilter(categoryId: string | null)`, `setCursor(cursor: string | null)`, `setViewMode(mode: 'grid' | 'table')`, `toggleSelection(id: string)`, `setSelection(ids: string[])`, `clearSelection()`, `selectAll(ids: string[])`, `deselectAll()`, `openCreateDialog()`, `closeCreateDialog()`, `setDeleteTarget(id: string | null)`, `openFilterPanel()`, `closeFilterPanel()`, `resetPagination()`, `clearAllFilters()`, `hydrateFromUrl(params: URLSearchParams)`
  - `TemplateListStore = TemplateListState & TemplateListActions`

- [ ] 3.2 Create `templateListStore` at `frontend/common/stores/templateListStore.ts`
  - Use `create` from `zustand`
  - `viewMode` persisted via `zustand/middleware` persist to localStorage key `cert-template-view-mode`
  - Only `viewMode` is persisted — all other state is ephemeral or URL-derived
  - `selectedIds` as `Set<string>` — ephemeral, cleared on page navigation
  - `bulkBarOpen` computed from `selectedIds.size > 0` (can be derived or stored)
  - `filterPanelOpen` ephemeral (UI state)

- [ ] 3.3 Implement `hydrateFromUrl(params: URLSearchParams)`:
  - Read `search` → set `searchQuery` and `debouncedSearch`
  - Read `status` (comma-separated) → set `statusFilter`
  - Read `category` → set `categoryFilter`
  - Read `cursor` → set `cursor`
  - Read `view` → set `viewMode` (if present, overrides persisted value)
  - Called by container on mount

- [ ] 3.4 Implement `clearAllFilters()`:
  - Reset `statusFilter` to `[]`
  - Reset `categoryFilter` to `null`
  - Reset `searchQuery` and `debouncedSearch` to `""`
  - Reset `cursor` to `null`

- [ ] 3.5 Implement `resetPagination()`:
  - Reset `cursor` to `null`
  - Does NOT reset filters or search

- [ ] 3.6 Create mock store at `frontend/common/stores/__mocks__/templateListStore.ts`
  - For Storybook usage
  - Pre-populated with sample state (grid mode, 3 selected IDs, filter panel open)
  - Overrideable via Storybook args

- [ ] 3.7 Run quality loop per file:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/stores/templateListStore.ts --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/stores/templateListStore.types.ts --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/stores/__mocks__/templateListStore.ts --lifecycle lint
  ```

- [ ] 3.8 Write outcome file: `.ai/plans/cert-plan-08/outcome/T03-zustand-store-outcome.md`
  - Document state shape, actions, persistence strategy, URL hydration logic
  - Note any deviations from the design doc contract

**Files to create:**
- `frontend/common/stores/templateListStore.types.ts`
- `frontend/common/stores/templateListStore.ts`
- `frontend/common/stores/__mocks__/templateListStore.ts`

**Instruction verification:**
- `frontend/common/stores/AGENTS.md` — Zustand store conventions, persist middleware usage, mock store patterns
- `frontend/AGENTS.md` — frontend general rules
- `.github/instructions/frontend.instructions.md`

---

## Phase 2: List Page (T04–T06)

These tasks build the visible UI: the App Router page, the container orchestration, and the desktop and mobile tier views.

---

### T04: App Router Page + Container + ViewModel

**Goal:** Create the server component page (auth guard + i18n) and the `TemplateListContainer` client component that orchestrates Apollo queries, store hydration, debounced search, URL sync, mutation handlers, and assembles the ViewModel for tier views.

**Duration:** 3–4 hours

**Requirements covered:** REQ-08-01 (page route + container), REQ-08-02 (debounced search orchestration), REQ-08-03 (filter orchestration), REQ-08-04 (pagination orchestration), REQ-08-05 (mutation handlers), REQ-08-07 (create handler), REQ-08-08 (bulk handlers), REQ-08-10 (loading/error/empty state orchestration)

**Dependencies:** T01 (i18n), T02 (GraphQL documents), T03 (Zustand store)

**Subtasks:**

- [ ] 4.1 Create `app/(dashboard)/certificates/templates/page.tsx`
  - Server component
  - Call `getServerUserContext()` for authentication
  - Call `requirePermissionForPage(userContext, 'CERT_TEMPLATE_VIEW')` — redirect to 403 if denied
  - Call `getTranslations(locale, 'certificates.templates.list')` for i18n labels
  - Generate page metadata (title, description) using translations
  - Render `<TemplateListContainer locale={locale} labels={t} />`
  - Wrap in error boundary for auth redirect fallback

- [ ] 4.2 Create `frontend/common/views/dashboard/certificates/templates/types.ts`
  - Export `TemplateListViewModel` interface (all data, handlers, store, labels fields per design.md §4.4)
  - Export `TemplateListContainerProps` type as `Record<string, never>` (Container takes no props)
  - Export `CardAction` union type (`'edit' | 'preview' | 'duplicate' | 'delete' | 'generate'`)
  - Export `CreateTemplateInput` type (`{ name: string; categoryId?: string; orientation: 'portrait' | 'landscape'; pageSize: 'A4' | 'letter' | 'custom' }`)

- [ ] 4.3 Create `frontend/common/views/dashboard/certificates/templates/useTemplatesViewModel.ts`
  - ViewModel hook — composed of private sub-hooks (useTemplatesTranslations, useTemplatesPermissions, useTemplateListStoreState, useTemplateListData, useTemplateListMutations)
  - Returns a flat plain object typed as `TemplateListViewModel` (per design.md §4.4)
  - All Apollo hooks: `useQuery(CertTemplatesQueryDocument)`, `useQuery(CategoryListQueryDocument)`, `useMutation` for all 6 mutations
  - All Zustand store selectors via `templateListStore` — read state selectors and action selectors
  - All handler functions with signatures per design.md §4.4
  - URL hydration via `useEffect` on mount → `hydrateFromUrl(useSearchParams())`
  - Store-to-URL sync: when store filters/search/cursor change → `router.replace` to update URL params without scroll
  - Debounced search: 300ms debounce for non-empty queries, immediate clear for empty query (DD-5)
  - `fetchMore` handler for "Load More" (DD-1: cursor-based) — append edges, update cursor from `pageInfo.endCursor`
  - Mutation handlers: `handleCreate`, `handleDuplicate`, `handleDelete`, `handleBulkArchive`, `handleBulkDelete`, `handleBulkChangeCategory` — all with Apollo cache updates and i18n toast feedback
  - Permission checks via `useUserStore(state => state.hasPermission)` — `canCreate`, `canDelete`, `canBulkArchive`, `canBulkDelete`, `canBulkChangeCategory`, `availableActions(template)` filtering
  - NO `useMediaQuery` or viewport checks — tier selection is handled by `ResponsiveViewSwitch`

- [ ] 4.4 Create `frontend/common/views/dashboard/certificates/templates/TemplateListView.tsx` (Switcher file)
  - Call `useTemplatesViewModel()` to get the ViewModel object
  - At module scope: `const lazyViews = createLazyView<TemplateListViewModel>(mobileImporter, desktopImporter)` where importers use `.then(m => ({ default: m.MobileTemplateListView }))` and `.then(m => ({ default: m.DesktopTemplateListView }))` shims (tier files use named exports)
  - Render `<ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />`

- [ ] 4.5 Create `frontend/common/views/dashboard/certificates/templates/TemplateListContainer.tsx`
  - Client component (`'use client'`)
  - No props (typed as `Record<string, never>`)
  - Render `<RequirePermission permissions={[AppPermission.CERT_TEMPLATE_VIEW]} fallback={null}>` wrapping `<TemplateListView />`
  - Render shared dialogs OUTSIDE the `<ResponsiveViewSwitch>` — they survive tier switches:
    - `<CreateTemplateDialog open={createDialogOpen} labels={labels} categories={categories} onCreate={handleCreate} />`
    - `<DeleteConfirmDialog targetId={deleteTargetId} labels={labels} onConfirm={handleDelete} />`
    - `<BulkChangeCategoryDialog labels={labels} categories={categories} selectedCount={selectedIds.size} onConfirm={handleBulkChangeCategory} />`
  - `<Snackbar>` for mutation success/error feedback rendered at Container level (survives tier switches)
  - Note: The Container does NOT call ViewModel hooks itself — it delegates to `TemplateListView.tsx` which calls `useTemplatesViewModel()` and passes the result to `ResponsiveViewSwitch`

- [ ] 4.6 Create `frontend/common/views/dashboard/certificates/templates/index.ts` (Barrel)
  - Re-export `TemplateListContainer` as default
  - Re-export `useTemplatesViewModel`, `TemplateListViewModel` type, `TemplateListContainerProps` type

- [ ] 4.7 Run quality loop:
  ```bash
  bun run scripts/health/sub-loop.ts app/\(dashboard\)/certificates/templates/page.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/types.ts --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/useTemplatesViewModel.ts --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/TemplateListView.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/TemplateListContainer.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/index.ts --lifecycle lint
  ```

- [ ] 4.8 Write outcome file: `.ai/plans/cert-plan-08/outcome/T04-container-viewmodel-outcome.md`
  - Document ViewModel shape, mutation handlers, URL sync logic, debounce implementation
  - Document the Container → Switcher → ViewModel pattern (matches billing domain)
  - Note any Apollo cache update strategies used

**Files to create:**
- `app/(dashboard)/certificates/templates/page.tsx`
- `frontend/common/views/dashboard/certificates/templates/types.ts`
- `frontend/common/views/dashboard/certificates/templates/useTemplatesViewModel.ts`
- `frontend/common/views/dashboard/certificates/templates/TemplateListView.tsx`
- `frontend/common/views/dashboard/certificates/templates/TemplateListContainer.tsx`
- `frontend/common/views/dashboard/certificates/templates/index.ts`

**Instruction verification:**
- `app/AGENTS.md` — App Router conventions, server component auth, i18n via `getTranslations`
- `frontend/views/AGENTS.md` — view conventions, ViewModel pattern
- `frontend/common/graphql/AGENTS.md` — `useQuery`/`useMutation` from `@apollo/client/react`
- `frontend/common/stores/AGENTS.md` — Zustand store usage in views
- `.github/instructions/frontend.instructions.md`

---

### T05: Desktop Template List View — Card Grid + Table Toggle

**Goal:** Create the desktop tier view with a card grid (3-column), table view toggle, search bar, filter button, load more, skeleton/error/empty states, and the bulk action bar.

**Duration:** 4–5 hours

**Requirements covered:** REQ-08-01 (card grid), REQ-08-03 (filter UI), REQ-08-04 (load more button), REQ-08-09 (desktop responsive grid), REQ-08-10 (loading/error/empty states)

**Dependencies:** T04 (container provides ViewModel)

**Subtasks:**

- [ ] 5.1 Create `frontend/desktop/views/dashboard/certificates/templates/templates.desktop.tsx` — exports `DesktopTemplateListView({ ... }: Readonly<TemplateListViewModel>)` (named export, per codebase convention of `.desktop.tsx` suffix)
  - Props: `Readonly<TemplateListViewModel>` (spread from ViewModel — all props readonly)
  - Render `<PageContainer>`, `<PageHeader>` (title from `labels.pageTitle`, subtitle from `labels.pageSubtitle`, primary action button "Create Template"), `<SectionPanel>` wrapper
  - Render `<TemplateToolbar>` (search, filter button with badge, view toggle, create button)
  - Conditionally render `<TemplateCardGrid>` or `<TemplateTable>` based on `store.viewMode`
  - Render `<LoadMoreButton>` when `viewModel.data.pageInfo.hasNextPage`
  - Render `<SkeletonGrid>` (6 skeleton cards in 3-col grid) during `viewModel.loading`
  - Render `<ErrorState>` (error banner + retry button) on `viewModel.error`
  - Render `<EmptyState>` (centered illustration) when `!loading && !error && edges.length === 0`
  - Render `<BulkActionBar>` (sticky bottom) when `store.selectedIds.size > 0`
  - ZERO business logic, ZERO hooks — all data via props from ViewModel

- [ ] 5.1a Create `frontend/desktop/views/dashboard/certificates/templates/components/TemplateToolbar.tsx`
  - Props: `Readonly<Pick<TemplateListViewModel, 'store' | 'handlers' | 'labels'>>`
  - Render `SearchBar` (TextField, debounced input — reads/writes `store.searchQuery` via handlers)
  - Render `FilterButton` with active count badge (`labels.filters.activeCount(count)`) → opens `FilterPanel` Popover
  - Render `ViewModeToggle` (MUI `ToggleButtonGroup` — grid/table segmented control) — reads/writes `store.viewMode` via handlers
  - Render `CreateButton` (PrimaryPageAction) — disabled when `!viewModel.canCreate`, calls `handlers.onOpenCreateDialog()`

- [ ] 5.2 Create `TemplateCard` at `frontend/common/views/dashboard/certificates/templates/components/TemplateCard.tsx` — shared card component used by both desktop grid and mobile list
  - Props: `template: CertTemplate`, `selected: boolean`, `onToggleSelect(id)`, `onCardClick(id)`, `onAction(action, id)`, `labels`, `permissions: { canManage, canPublish }`
  - Thumbnail area (16:9 aspect ratio) — template background image or placeholder icon
  - Template name (truncated with MUI `Tooltip` for full name)
  - `StatusBadge` — color by status: `draft` = neutral, `published` = success green, `archived` = default gray
  - `CategoryChip` — MUI `Chip` with category name (or "Uncategorized")
  - Element count + variable count with icons (`ElementCountOutlined`, `VariableCountOutlined` or similar)
  - Relative last-modified date (use `date-fns` `formatDistanceToNow` or similar)
  - `CardActionMenu` — dropdown menu (Edit, Preview, Duplicate, Delete, Generate from Template)
  - `SelectionCheckbox` — MUI `Checkbox` visible on hover or when any card is selected

- [ ] 5.3 Create `TemplateCardGrid` at `frontend/common/views/dashboard/certificates/templates/components/TemplateCardGrid.tsx`
  - MUI `Grid` container with `spacing={3}`, `columns={{ xs: 12 }}` → items `xs={4}` (3 columns at desktop)
  - Map `edges` to `TemplateCard` components
  - Responsive: `xs={12}` (1-col) on mobile, `sm={6}` (2-col) on tablet, `md={4}` (3-col) on desktop
  - Empty Grid when no items

- [ ] 5.4 Create `TemplateTable` at `frontend/common/views/dashboard/certificates/templates/components/TemplateTable.tsx`
  - MUI `TableContainer` with `TableHead` and `TableBody`
  - Columns: checkbox, name, category, status, elements, variables, last modified, actions
  - Header row: select-all checkbox (`store.selectAll` / `store.deselectAll`)
  - Body rows: clickable (navigate to editor on row click)
  - Checkbox column: `Checkbox` — clicking toggles selection (stops propagation to prevent row click)
  - Row action menu: same items as card menu
  - Row hover highlight
  - `TablePagination` NOT used — we use cursor-based "Load More" instead

- [ ] 5.5 Create `StatusBadge` at `frontend/common/views/dashboard/certificates/templates/components/StatusBadge.tsx`
  - MUI `Chip` with color variant based on `TemplateStatus`:
    - `DRAFT` → `color="default"` variant="outlined"
    - `PUBLISHED` → `color="success"` variant="filled"
    - `ARCHIVED` → `color="default"` variant="filled"
  - Label from i18n: `labels.status.draft` / `labels.status.published` / `labels.status.archived`

- [ ] 5.6 Create state components:
  - `SkeletonGrid` at `frontend/common/views/dashboard/certificates/templates/states/SkeletonGrid.tsx`
    - 6 MUI `Skeleton` cards in 3-col grid matching `TemplateCard` dimensions
  - `ErrorState` at `frontend/common/views/dashboard/certificates/templates/states/ErrorState.tsx`
    - Error icon, error message from `labels.errors.loadFailed`, "Retry" button calling `refetch`
  - `EmptyState` at `frontend/common/views/dashboard/certificates/templates/states/EmptyState.tsx`
    - Two variants via prop `variant: 'noTemplates' | 'noResults'`:
      - `noTemplates`: illustration, `labels.empty.noTemplates.title`, `.description`, `.cta` (Create button)
      - `noResults`: illustration, `labels.empty.noResults.title`, `.description`, "Clear Filters" button

- [ ] 5.7 Create `LoadMoreButton` at `frontend/common/views/dashboard/certificates/templates/components/LoadMoreButton.tsx`
  - MUI `Button` with `loading` prop — shows CircularProgress when fetching more
  - Label: `labels.pagination.loadMore`
  - Count text below: `labels.pagination.count(loadedCount, totalCount)`
  - Disabled when `!pageInfo.hasNextPage`

- [ ] 5.8 Create `BulkActionBar` at `frontend/common/views/dashboard/certificates/templates/components/BulkActionBar.tsx`
  - MUI `Paper` with `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `zIndex: 1100` (above content, below dialogs)
  - Theme palette background, box shadow for elevation
  - Slide-up animation on appear (MUI `Slide` or CSS transition)
  - Selected count text: `labels.bulkActions.selectedCount(selectedIds.size)` with Arabic pluralization
  - Action buttons:
    - "Archive" — calls `onBulkArchive(selectedIds)`, visible only if `canPublish`
    - "Delete" — calls `onBulkDelete(selectedIds)`, visible only if `canManage`
    - "Change Category" — opens `BulkChangeCategoryDialog`, visible only if `canManage`
    - "Cancel" — calls `store.clearSelection()`
  - Active action button shows `CircularProgress` during mutation

- [ ] 5.9 Run quality loop per file:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/templates.desktop.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/components/TemplateToolbar.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/TemplateCard.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/TemplateCardGrid.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/TemplateTable.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/StatusBadge.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/states/SkeletonGrid.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/states/ErrorState.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/states/EmptyState.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/LoadMoreButton.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/BulkActionBar.tsx --lifecycle lint
  ```

- [ ] 5.10 Write outcome file: `.ai/plans/cert-plan-08/outcome/T05-desktop-view-outcome.md`
  - Document component tree, card grid layout, table columns, state variants
  - Note MUI v9 patterns used (sx prop, icon naming)

**Files to create:**
- `frontend/desktop/views/dashboard/certificates/templates/templates.desktop.tsx` — exports `DesktopTemplateListView`
- `frontend/desktop/views/dashboard/certificates/templates/components/TemplateToolbar.tsx` — desktop toolbar (search, filter, view toggle, create button)
- `frontend/common/views/dashboard/certificates/templates/components/TemplateCard.tsx`
- `frontend/common/views/dashboard/certificates/templates/components/TemplateCardGrid.tsx`
- `frontend/common/views/dashboard/certificates/templates/components/TemplateTable.tsx`
- `frontend/common/views/dashboard/certificates/templates/components/StatusBadge.tsx`
- `frontend/common/views/dashboard/certificates/templates/states/SkeletonGrid.tsx`
- `frontend/common/views/dashboard/certificates/templates/states/ErrorState.tsx`
- `frontend/common/views/dashboard/certificates/templates/states/EmptyState.tsx`
- `frontend/common/views/dashboard/certificates/templates/components/LoadMoreButton.tsx`
- `frontend/common/views/dashboard/certificates/templates/components/BulkActionBar.tsx`

**Instruction verification:**
- `frontend/views/AGENTS.md` — view conventions, tier isolation
- `frontend/AGENTS.md` — MUI v9 rules (sx prop only, icon naming `*Outlined`), React 19 rules (SubmitEvent, FormData casting)
- `frontend/desktop/AGENTS.md` — desktop-specific rules (if exists)
- `.github/instructions/frontend.instructions.md`

---

### T06: Mobile Template List View — Compact Card List

**Goal:** Create the mobile tier view with a 1-column compact card list, sticky search, collapsible filter, mobile bulk action bar, and mobile-specific states.

**Duration:** 3–4 hours

**Requirements covered:** REQ-08-01 (card list), REQ-08-04 (mobile load more), REQ-08-09 (mobile responsive: 1-col compact), REQ-08-10 (mobile skeleton/error/empty states)

**Dependencies:** T04 (container provides ViewModel)

**Subtasks:**

- [ ] 6.1 Create `frontend/mobile/views/dashboard/certificates/templates/templates.mobile.tsx` — exports `MobileTemplateListView` (named export, per codebase convention of `.mobile.tsx` suffix)
  - Props: `viewModel: TemplateListViewModel`
  - Render `MobilePageHeader` (title, FAB for "Create Template" with `AddOutlined` icon)
  - Mobile search bar: MUI `TextField` sticky at top, debounced 300ms
  - Mobile filter button → opens bottom sheet `FilterPanel` (MUI `BottomSheet` or `Drawer` variant="bottom")
  - `MobileCardList` with compact `MobileTemplateCard` components
  - `MobileBulkActionBar` (sticky bottom, overflow menu)
  - `MobileLoadMoreButton`
  - Mobile-specific skeleton/error/empty states

- [ ] 6.2 Create `MobileTemplateCard` at `frontend/mobile/views/dashboard/certificates/templates/components/MobileTemplateCard.tsx`
  - Compact card: single row layout (icon/thumbnail left, content right, action menu right)
  - Thumbnail as small square placeholder (no 16:9 on mobile — too large)
  - Template name (1 line truncated)
  - Status badge + category chip (inline, compact)
  - Element/variable counts as small text (no icons — save space)
  - Relative date (small text)
  - Card action menu: truncated to top 3 actions (Edit, Duplicate, Delete) + "More" overflow (Preview, Generate)
  - Selection checkbox: visible at left edge when any card is selected
  - Minimum 44px touch targets on all interactive elements

- [ ] 6.3 Create `MobileSkeletonList` at `frontend/mobile/views/dashboard/certificates/templates/states/MobileSkeletonList.tsx`
  - 4 MUI `Skeleton` compact card rows matching `MobileTemplateCard` dimensions
  - 1-column layout

- [ ] 6.4 Create `MobileListStates` at `frontend/mobile/views/dashboard/certificates/templates/states/MobileListStates.tsx`
  - `variant: 'error' | 'empty' | 'noResults'`
  - Error: error icon, message, retry button (full width)
  - Empty: illustration, message, "Create Template" CTA (full width button)
  - NoResults: illustration, message, "Clear Filters" button

- [ ] 6.5 Create `MobileBulkActionBar` at `frontend/mobile/views/dashboard/certificates/templates/components/MobileBulkActionBar.tsx`
  - MUI `Paper` sticky bottom, full width
  - Selected count with Arabic pluralization
  - Actions collapsed into overflow `Menu` (Archive, Delete, Change Category)
  - "Cancel" button (text button, left-aligned)
  - Slide-up animation

- [ ] 6.6 Create `MobileLoadMoreButton` at `frontend/mobile/views/dashboard/certificates/templates/components/MobileLoadMoreButton.tsx`
  - Full-width `Button` with loading indicator
  - Count text: `labels.pagination.count(loadedCount, totalCount)`

- [ ] 6.7 Ensure `ResponsiveViewSwitch` utility exists or create it:
  - Check if `frontend/common/views/dashboard/_shared/ResponsiveViewSwitch.tsx` exists
  - If not: create it — uses `useMediaQuery(theme.breakpoints.up('md'))` to render desktop vs mobile
  - Desktop component rendered at `>= md` (960px), mobile below

- [ ] 6.8 Verify responsive breakpoints (design requirement):
  - Desktop: 3-col grid (default) or table toggle (≥ md = 960px)
  - Tablet: 2-col grid (sm = 600px to md = 960px) — via Grid responsive `sm={6} md={4}`
  - Mobile: 1-col compact (< sm = 600px)
  - `ResponsiveViewSwitch` switches at `md` breakpoint between Desktop/Mobile tier views

- [ ] 6.9 Run quality loop per file:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/templates.mobile.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/components/MobileTemplateCard.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/states/MobileSkeletonList.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/states/MobileListStates.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/components/MobileBulkActionBar.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/components/MobileLoadMoreButton.tsx --lifecycle lint
  ```

- [ ] 6.10 Write outcome file: `.ai/plans/cert-plan-08/outcome/T06-mobile-view-outcome.md`
  - Document mobile card layout, action truncation, touch target compliance, responsive breakpoints
  - Note any mobile-specific MUI patterns used

**Files to create:**
- `frontend/mobile/views/dashboard/certificates/templates/templates.mobile.tsx` — exports `MobileTemplateListView`
- `frontend/mobile/views/dashboard/certificates/templates/components/MobileTemplateCard.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/states/MobileSkeletonList.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/states/MobileListStates.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/components/MobileBulkActionBar.tsx`
- `frontend/mobile/views/dashboard/certificates/templates/components/MobileLoadMoreButton.tsx`
- Possibly: `frontend/common/views/dashboard/_shared/ResponsiveViewSwitch.tsx` (if not existing)

**Instruction verification:**
- `frontend/views/AGENTS.md` — view conventions, tier isolation
- `frontend/AGENTS.md` — MUI v9 rules, React 19 rules
- `frontend/mobile/AGENTS.md` — mobile-specific rules (if exists)
- `.github/instructions/frontend.instructions.md`

---

## Phase 3: Interactions (T07–T09)

These tasks implement user interactions: the create template dialog, card action menu with delete confirmation, and bulk actions with the filter panel.

---

### T07: Create Template Dialog

**Goal:** Implement the Create Template dialog with form validation, category dropdown (graceful degradation), orientation/page-size selection, and post-create navigation to the template editor.

**Duration:** 2–3 hours

**Requirements covered:** REQ-08-07 (create template dialog)

**Dependencies:** T01 (i18n create dialog labels), T02 (create mutation document), T04 (container mutation handler)

**Subtasks:**

- [ ] 7.1 Create `CreateTemplateDialog` at `frontend/common/views/dashboard/certificates/templates/components/CreateTemplateDialog.tsx`
  - MUI `Dialog` with `open` controlled by `viewModel.store.createDialogOpen`
  - `DialogTitle`: `labels.createDialog.title`
  - `DialogContent` form fields:
    - Name: MUI `TextField`, `required`, `maxLength=100`, `autoFocus`
    - Category: MUI `Autocomplete` populated from `viewModel.categories`
    - Orientation: MUI `RadioGroup` — Portrait (default), Landscape
    - Page Size: MUI `RadioGroup` — A4 (default), Letter, Custom
  - `DialogActions`:
    - "Cancel" button: `labels.createDialog.cancelButton`, calls `store.closeCreateDialog()`
    - "Create" button: `labels.createDialog.createButton`, loading state during mutation
  - React 19 form handling: use `formData.get("name") as string | null` pattern (no `FormEvent`)

- [ ] 7.2 Create `frontend/common/views/dashboard/certificates/templates/schemas/createTemplateSchema.ts`
  - Zod or Yup schema for CreateTemplateDialog form validation
  - `name`: required, min 1 char (after trim), max 100 chars
  - `categoryId`: optional string (nullable for uncategorized)
  - `orientation`: enum `'portrait' | 'landscape'`
  - `pageSize`: enum `'A4' | 'letter' | 'custom'`
  - Export `createTemplateSchema` and `CreateTemplateFormValues` type

- [ ] 7.3 Implement form validation using the schema:
  - Name required (non-empty after `trim()`) → error: `labels.createDialog.nameRequired`
  - Name max 100 characters → error: `labels.createDialog.nameTooLong(max)` (interpolated)
  - Display i18n-localized error messages below the TextField
  - Disable "Create" button when validation fails

- [ ] 7.4 Handle category dropdown graceful degradation:
  - If `viewModel.categories` is empty or not loaded: show "Uncategorized" as the only option
  - If categories loaded: populate Autocomplete with category names
  - Autocomplete `onChange` sets `categoryId` in form state (or `null` for uncategorized)

- [ ] 7.5 Implement submit handler:
  - On form submit: gather form data (name, categoryId, orientation, pageSize)
  - Call `viewModel.handlers.onCreate({ name, categoryId, orientation, pageSize })`
  - On success: container navigates to `/[locale]/certificates/templates/{newId}/editor`
  - On error: show error message in dialog (snackbar or inline)
  - Close dialog on success

- [ ] 7.6 Run quality loop:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/schemas/createTemplateSchema.ts --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/CreateTemplateDialog.tsx --lifecycle lint
  ```

- [ ] 7.7 Write outcome file: `.ai/plans/cert-plan-08/outcome/T07-create-dialog-outcome.md`
  - Document form fields, validation rules, category degradation strategy, post-create navigation

**Files to create:**
- `frontend/common/views/dashboard/certificates/templates/schemas/createTemplateSchema.ts`
- `frontend/common/views/dashboard/certificates/templates/components/CreateTemplateDialog.tsx`

**Instruction verification:**
- `frontend/views/AGENTS.md` — dialog conventions
- `frontend/AGENTS.md` — MUI v9 form conventions, React 19 event handling (SubmitEvent, FormData casting)
- `.github/instructions/frontend.instructions.md`

---

### T08: Card Actions Menu + Delete Confirmation

**Goal:** Implement the `CardActionMenu` component with permission-filtered actions (Edit, Preview, Duplicate, Delete, Generate from Template) and the `DeleteConfirmDialog` for soft-delete confirmation.

**Duration:** 2–3 hours

**Requirements covered:** REQ-08-05 (card actions: Edit, Preview, Duplicate, Delete, Generate)

**Dependencies:** T04 (container mutation handlers), T05 (card component), T06 (mobile card)

**Subtasks:**

- [ ] 8.1 Create `CardActionMenu` at `frontend/common/views/dashboard/certificates/templates/components/CardActionMenu.tsx`
  - MUI `Menu` anchored to an `IconButton` (MoreVert)
  - Menu items with conditional rendering based on permission flags:
    - Edit → `router.push('/[locale]/certificates/templates/{id}/editor')` — requires `CERT_TEMPLATE_MANAGE`
    - Preview → `router.push('/[locale]/certificates/templates/{id}/preview')` — requires `CERT_TEMPLATE_VIEW`
    - Duplicate → calls `onDuplicate(id)` — requires `CERT_TEMPLATE_MANAGE`
    - Delete → calls `store.setDeleteTarget(id)` (opens DeleteConfirmDialog) — requires `CERT_TEMPLATE_MANAGE`
    - Generate from Template → `router.push('/[locale]/certificates/generate/{id}')` — requires `CERT_TEMPLATE_VIEW`, **only shown when template status is PUBLISHED**
  - Each menu item: icon, label from `labels.actions.*`, `data-testid` for E2E
  - Menu closes on item click

- [ ] 8.2 Wire `CardActionMenu` into `TemplateCard` (desktop) and `MobileTemplateCard` (mobile):
  - Desktop: full menu with all 5 items (permission-filtered)
  - Mobile: truncated to top 3 (Edit, Duplicate, Delete) + "More" overflow (Preview, Generate)
  - Pass `permissions` object from container/ViewModel

- [ ] 8.3 Create `DeleteConfirmDialog` at `frontend/common/views/dashboard/certificates/templates/components/DeleteConfirmDialog.tsx`
  - MUI `Dialog` open when `viewModel.store.deleteTargetId !== null`
  - `DialogTitle`: `labels.actionsConfirm.deleteTitle`
  - `DialogContent`:
    - For draft templates: `labels.actionsConfirm.deleteDraftMessage(name)`
    - For published/archived: `labels.actionsConfirm.deletePublishedMessage(name, status)` with interpolated status
    - Warning icon
  - `DialogActions`:
    - "Cancel" button: `store.setDeleteTarget(null)` (closes dialog)
    - "Delete" button: destructive `color="error"`, loading state during mutation
  - On confirm: call `viewModel.handlers.onDelete(deleteTargetId)` → mutation → close dialog → toast

- [ ] 8.4 Wire `DeleteConfirmDialog` into `TemplateListContainer` (from T04 step 4.10):
  - Container already renders `<DeleteConfirmDialog>` — ensure props match
  - Pass `targetId={store.deleteTargetId}`, `labels`, `onConfirm={handleDelete}`

- [ ] 8.5 Run quality loop per file:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/CardActionMenu.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/DeleteConfirmDialog.tsx --lifecycle lint
  ```

- [ ] 8.6 Write outcome file: `.ai/plans/cert-plan-08/outcome/T08-card-actions-outcome.md`
  - Document menu items, permission gating, status-conditional rendering (Generate for published only)
  - Document delete confirmation flow

**Files to create:**
- `frontend/common/views/dashboard/certificates/templates/components/CardActionMenu.tsx`
- `frontend/common/views/dashboard/certificates/templates/components/DeleteConfirmDialog.tsx`

**Files to modify:**
- `frontend/common/views/dashboard/certificates/templates/components/TemplateCard.tsx` (wire CardActionMenu)
- `frontend/mobile/views/dashboard/certificates/templates/components/MobileTemplateCard.tsx` (wire truncated CardActionMenu)

**Instruction verification:**
- `frontend/views/AGENTS.md` — component conventions
- `frontend/AGENTS.md` — MUI v9 rules, React 19 rules
- `.github/instructions/frontend.instructions.md`

---

### T09: Bulk Actions + Filter Panel + Bulk Change Category Dialog

**Goal:** Implement bulk selection wiring, the `FilterPanel` component (status multi-select + category hierarchical dropdown), and the `BulkChangeCategoryDialog` for bulk category reassignment.

**Duration:** 3–4 hours

**Requirements covered:** REQ-08-03 (filter panel with AND logic), REQ-08-08 (bulk actions: archive, delete, change category)

**Dependencies:** T03 (store selection state), T04 (container bulk handlers), T05 (BulkActionBar component)

**Subtasks:**

- [ ] 9.1 Create `FilterPanel` at `frontend/common/views/dashboard/certificates/templates/components/FilterPanel.tsx`
  - MUI `Popover` or `Drawer` (desktop: `Popover` anchored to filter button; mobile: bottom `Drawer`)
  - Status multi-select as MUI `Autocomplete` with `multiple` and `disableCloseOnSelect`:
    - Options: Draft, Published, Archived (from `TemplateStatus` enum)
    - Chip rendering with status labels
    - Reads/writes `store.statusFilter`
  - Category hierarchical dropdown:
    - MUI `Autocomplete` with grouped categories (or custom `TreeView` if available)
    - Options from `viewModel.categories` (root categories + children)
    - Reads/writes `store.categoryFilter`
    - **Graceful degradation**: if no categories loaded (Plan 09 not ready), show disabled Autocomplete with tooltip `labels.filters.categoryDisabled`
  - Orientation filter: MUI `ToggleButtonGroup` with Portrait / Landscape / All options
    - Reads/writes `store.orientationFilter`
    - Label: `labels.filters.orientation`
  - "Owned by me" filter: MUI `FormControlLabel` with `Checkbox`
    - Reads/writes `store.ownedByMe`
    - Label: `labels.filters.ownedByMe`
  - "Clear all filters" button: calls `store.clearAllFilters()` and closes panel
  - Active filter count badge on triggering button (computed from `store.statusFilter.length + (store.categoryFilter ? 1 : 0) + (store.orientationFilter !== 'all' ? 1 : 0) + (store.ownedByMe ? 1 : 0)`)
  - AND logic: filters apply together (`statusFilter` AND `categoryFilter` AND `orientationFilter` AND `ownedByMe`)
  - Interaction states:
    | State | Checkbox Chip | Clear Button | Filter Button (trigger) |
    |-------|--------------|--------------|------------------------|
    | Default | `mui-theme.action.active` | `text.secondary` | `text.secondary` |
    | Hover | `mui-theme.action.hover` | `primary.main` | `action.hover` |
    | Focus | `primary.main` ring | `primary.main` ring | `primary.main` ring |
    | Disabled (no categories) | N/A (Autocomplete disabled) | N/A | `action.disabled` |
    | Error (fetch failed) | N/A (shows error tooltip) | N/A | `error.main` badge |

- [ ] 9.2 Wire `FilterPanel` into desktop and mobile views:
  - Desktop: `Popover` anchored to `FilterButton` in `DesktopTemplateListView`
  - Mobile: bottom `Drawer` (MUI `Drawer` variant="bottom") opened by mobile filter button
  - Both read/write `store.filterPanelOpen`

- [ ] 9.3 Wire bulk action handlers in container (verify from T04 step 4.7):
  - `handleBulkArchive(ids: string[])` → `BulkArchiveTemplatesMutationDocument` → cache update → `store.clearSelection()` → toast `labels.toasts.bulkArchiveSuccess`
  - `handleBulkDelete(ids: string[])` → `BulkDeleteTemplatesMutationDocument` → cache evict → `store.clearSelection()` → toast
  - `handleBulkChangeCategory(ids: string[], categoryId: string)` → open dialog → on confirm: mutation → cache update → `store.clearSelection()` → toast

- [ ] 9.4 Create `BulkChangeCategoryDialog` at `frontend/common/views/dashboard/certificates/templates/components/BulkChangeCategoryDialog.tsx`
  - MUI `Dialog` with `open` controlled by store flag (e.g., `bulkChangeCategoryOpen` — add to store or use local state in container)
  - `DialogTitle`: `labels.bulkActions.changeCategoryTitle`
  - `DialogContent`:
    - Selected count text: `labels.bulkActions.selectedCount(selectedIds.size)` with Arabic pluralization
    - MUI `Autocomplete` for category selection (same component as FilterPanel category dropdown)
    - Graceful degradation: if no categories loaded, show "Uncategorized" option
  - `DialogActions`:
    - "Cancel" button
    - "Apply" button: loading state during mutation
  - On confirm: call `viewModel.handlers.onBulkChangeCategory(Array.from(store.selectedIds), categoryId)`

- [ ] 9.5 Implement "Select All" behavior:
  - Desktop `TemplateTable` header: checkbox toggles between `selectAll(loadedIds)` and `deselectAll()`
  - Desktop `TemplateCardGrid`: add a "Select All" button in the header area (or rely on table view for bulk selection)
  - Mobile: "Select All" button in mobile bulk action bar or list header
  - `selectAll(ids)` adds all currently loaded template IDs to `store.selectedIds`
  - `deselectAll()` calls `store.clearSelection()`

- [ ] 9.6 Implement permission gating for bulk bar action buttons (verify from T05 step 5.8):
  - "Archive" button: visible only if `permissions.canPublish` (CERT_TEMPLATE_PUBLISH)
  - "Delete" button: visible only if `permissions.canManage` (CERT_TEMPLATE_MANAGE)
  - "Change Category" button: visible only if `permissions.canManage` (CERT_TEMPLATE_MANAGE)
  - If no bulk permissions: bar still shows count but action buttons are hidden (or bar hidden entirely)

- [ ] 9.7 Run quality loop per file:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/FilterPanel.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/BulkChangeCategoryDialog.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/BulkActionBar.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/templates.desktop.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/templates.mobile.tsx --lifecycle lint
  ```

- [ ] 9.8 Write outcome file: `.ai/plans/cert-plan-08/outcome/T09-bulk-filter-outcome.md`
  - Document filter panel layout, AND logic implementation, hierarchical category dropdown, bulk selection flow
  - Note permission gating strategy

**Files to create:**
- `frontend/common/views/dashboard/certificates/templates/components/FilterPanel.tsx`
- `frontend/common/views/dashboard/certificates/templates/components/BulkChangeCategoryDialog.tsx`

**Files to modify:**
- `frontend/desktop/views/dashboard/certificates/templates/templates.desktop.tsx` (wire FilterPanel popover, select all)
- `frontend/mobile/views/dashboard/certificates/templates/templates.mobile.tsx` (wire FilterPanel bottom drawer, mobile select all)
- `frontend/common/views/dashboard/certificates/templates/components/BulkActionBar.tsx` (wire bulk handlers from props, permissions)

**Instruction verification:**
- `frontend/views/AGENTS.md` — component conventions
- `frontend/AGENTS.md` — MUI v9 rules (Autocomplete, Popover, Drawer)
- `.github/instructions/frontend.instructions.md`

---

## Phase 4: Navigation & Knowledge (T10–T11)

These tasks add the sidebar navigation and capture all learnings in the knowledge base.

---

### T10: Sidebar Navigation — Certificates Group

**Goal:** Add the "Certificates" sidebar group with 5 navigation items (Templates, Categories, Recipient Groups, Certificates, Verification Log) to the sidebar configuration, with permission-based visibility and active state logic.

**Duration:** 2–3 hours

**Requirements covered:** REQ-08-06 (sidebar navigation — Certificates group with 5 items)

**Dependencies:** T01 (i18n sidebar keys)

**Subtasks:**

- [ ] 10.1 Locate the sidebar configuration source in the Siraj codebase:
  - Search for existing sidebar groups/items configuration (likely in `frontend/common/` or `app/(dashboard)/layout.tsx`)
  - Understand the pattern: group structure, item structure, icon mapping, permission gating
  - Check `frontend/common/components/navigation/` or similar directories
  - Read the existing sidebar component and its data source

- [ ] 10.2 Add "Certificates" group to sidebar configuration:
  - Group ID: `certificates`
  - Group label: i18n key `certificates.sidebar.label` (from T01)
  - Group icon: `WorkspacePremiumOutlined` (MUI icon, imported from `@mui/icons-material`)
  - Collapsible: yes, default expanded when on `/certificates/*` routes
  - Permission gate for entire group: `CERT_TEMPLATE_VIEW`
  - Order: after existing groups (e.g., after "Settings" or "Dashboard")
  - Group hidden entirely when user lacks `CERT_TEMPLATE_VIEW`

- [ ] 10.3 Add 5 navigation items to the group:
  - Templates:
    - Icon: `ArticleOutlined`
    - Path: `/[locale]/certificates/templates`
    - Permission: `CERT_TEMPLATE_VIEW`
    - Label: `certificates.sidebar.templates`
  - Categories:
    - Icon: `CategoryOutlined`
    - Path: `/[locale]/certificates/categories`
    - Permission: `CERT_TEMPLATE_VIEW`
    - Label: `certificates.sidebar.categories`
  - Recipient Groups:
    - Icon: `GroupsOutlined`
    - Path: `/[locale]/certificates/recipient-groups`
    - Permission: `CERT_TEMPLATE_VIEW`
    - Label: `certificates.sidebar.recipientGroups`
  - Certificates:
    - Icon: `WorkspacePremiumOutlined`
    - Path: `/[locale]/certificates`
    - Permission: `CERT_TEMPLATE_VIEW`
    - Label: `certificates.sidebar.certificates`
  - Verification Log:
    - Icon: `VerifiedOutlined`
    - Path: `/[locale]/certificates/verification`
    - Permission: `CERT_TEMPLATE_VIEW`
    - Label: `certificates.sidebar.verificationLog`

- [ ] 10.4 Implement active state logic:
  - "Templates" highlighted (active) when route matches `/certificates/templates*` (including sub-routes like editor)
  - "Categories" highlighted when route matches `/certificates/categories*`
  - "Recipient Groups" highlighted when route matches `/certificates/recipient-groups*`
  - "Certificates" highlighted when route matches `/certificates` exactly (not sub-routes — those belong to their own items)
  - "Verification Log" highlighted when route matches `/certificates/verification*`
  - Group auto-expanded when on any `/certificates/*` route
  - Use `usePathname()` or `useSelectedLayoutSegment()` from Next.js

- [ ] 10.5 Implement permission-based visibility:
  - Entire group hidden when user lacks `CERT_TEMPLATE_VIEW` permission
  - Individual items: initially all gated by `CERT_TEMPLATE_VIEW` (can be refined later when each item has its own permission constant in dependent plans)
  - Check existing permission-checking pattern in sidebar (e.g., `hasPermission(user, 'CERT_TEMPLATE_VIEW')`)

- [ ] 10.6 Verify route accessibility:
  - All 5 routes should resolve to their respective pages (or 404 if page not yet built — that's expected for dependent plans)
  - Active state logic works on the templates page (built in T04)
  - Sidebar collapses/expands correctly on cert routes
  - Mobile sidebar (if different component) also shows the Certificates group

- [ ] 10.7 Run quality loop:
  ```bash
  bun run scripts/health/sub-loop.ts <sidebar-config-file> --lifecycle lint
  bun run scripts/health/sub-loop.ts <sidebar-component-file> --lifecycle lint
  ```
  (Replace `<sidebar-config-file>` and `<sidebar-component-file>` with actual paths discovered in 10.1)

- [ ] 10.8 Write outcome file: `.ai/plans/cert-plan-08/outcome/T10-sidebar-nav-outcome.md`
  - Document sidebar configuration file location, group structure, 5 items, active state logic, permission gating
  - Note any existing patterns followed or extended

**Files to modify:**
- Sidebar configuration file (location discovered in 10.1)
- Sidebar component file (if active state logic lives in the component rather than config)
- Potentially: `frontend/common/components/navigation/` files (depending on structure)

**Instruction verification:**
- `app/AGENTS.md` — App Router navigation conventions, `usePathname`, `useSelectedLayoutSegment`
- `frontend/AGENTS.md` — MUI v9 icon naming (`*Outlined`), hasPermission pattern
- `.github/instructions/frontend.instructions.md`

---

### T11: Knowledge Propagation

**Goal:** Consolidate all learnings from Plan 08 into the project's permanent knowledge base — documentation files and AGENTS.md updates.

**Duration:** 2 hours

**Requirements covered:** All (cross-cutting knowledge capture)

**Dependencies:** All prior tasks (T01–T10) must be complete

**Subtasks:**

- [ ] 11.1 Read all outcome files in `.ai/plans/cert-plan-08/outcome/` to synthesize learnings from T01–T10

- [ ] 11.2 Create canonical reference doc at `docs/frontend/template-list-pattern.md`:
  - Pattern for cursor-based pagination with Apollo `fetchMore` and relay-style connections
  - URL-persisted filter state pattern (search params ↔ Zustand store sync via `useSearchParams` + `router.replace`)
  - Card grid vs table toggle with persisted view mode (localStorage via Zustand persist middleware)
  - Bulk action bar pattern (sticky bottom, permission gating, selection management)
  - Responsive view switch pattern (desktop/mobile tier isolation via `useMediaQuery`)
  - Debounced search with conditional debounce (300ms for non-empty, immediate for clear)
  - Hierarchical category dropdown with graceful degradation (fallback to "Uncategorized")
  - Arabic 6-form CLDR pluralization for counts (pagination, selected, filter active)

- [ ] 11.3 Update `frontend/views/AGENTS.md` with new patterns:
  - Add "Template List Pattern" section referencing `docs/frontend/template-list-pattern.md`
  - Add cursor-based pagination rule (use `fetchMore` with `endCursor`, not offset/limit)
  - Add URL filter persistence rule (filters/search/cursor in URL, view mode in localStorage)
  - Add bulk action bar rule (sticky bottom, permission-gated buttons)
  - Add responsive tier isolation rule (desktop/mobile views via `ResponsiveViewSwitch`)

- [ ] 11.4 Update `frontend/common/stores/AGENTS.md` with:
  - Zustand `persist` middleware pattern for single-field persistence (viewMode only, not filters/search)
  - Store hydration from URL params pattern (`hydrateFromUrl(searchParams)`)
  - Sorrow-based selection management (`Set<string>` for selectedIds, ephemeral)

- [ ] 11.5 Update `frontend/common/graphql/AGENTS.md` with:
  - Apollo `fetchMore` cache merge pattern for cursor pagination (append edges, update pageInfo)
  - `BatchResult` type handling for bulk mutations (successCount, failedCount, errors)
  - Mutation cache updates: add to front (duplicate), evict (delete), refetch (bulk)

- [ ] 11.6 Update root `AGENTS.md` Important References section:
  - Add `docs/frontend/template-list-pattern.md` to the "Important References" list
  - Ensure it's listed under frontend documentation

- [ ] 11.7 Run global quality check:
  ```bash
  bun tsgo
  bun biome:check
  bun run lint
  ```
  - Ensure 0 errors, 0 warnings
  - Fix any issues found in files modified by this task

- [ ] 11.8 Write outcome file: `.ai/plans/cert-plan-08/outcome/T11-knowledge-propagation-outcome.md`
  - List docs created, AGENTS.md files updated, patterns documented
  - Summary of all knowledge captured

- [ ] 11.9 Update progress: Mark all tasks T01–T11 as `[x]` in this `tasks.md` file

**Files to create:**
- `docs/frontend/template-list-pattern.md`

**Files to modify:**
- `frontend/views/AGENTS.md`
- `frontend/common/stores/AGENTS.md`
- `frontend/common/graphql/AGENTS.md`
- Root `AGENTS.md`

**Instruction verification:**
- Root `AGENTS.md` — check Important References section is updated
- All layer AGENTS.md files that were modified — ensure consistency

---

## Phase 5: Testing & Verification (T12)

These tasks cover component testing (Happy DOM), E2E testing (Playwright), and incremental feature enrichment for patterns surfaced in the design review (sort selector, orientation filter, owned-by-me filter, Plan 17 feature flag, optimistic updates).

---

### T12: Component Tests + E2E Tests

**Goal:** Write and validate component tests (Happy DOM + mocked Apollo) for all view-layer components, and E2E tests (Playwright) for the full template list navigation flow.

**Duration:** 6–8 hours

**Requirements covered:** REQ-08-01 through REQ-08-10 (all UI requirements)

**Dependencies:** All prior tasks (T01–T09 must be complete; component files must exist; T10 sidebar is not a gating dependency)

**Subtasks:**

- [ ] 12.1 Create `test/ui/components/templates/TemplateCard.test.tsx`:
  - Test template card rendering: name, description, status badge, category, updated date
  - Test permission-gated action visibility (publish/manage/view)
  - Test status-variant rendering (draft/published/archived badge colors per theme palette)
  - Test CardActionMenu integration (menu opens on click, items conditional on permissions)
  - Test skeleton loading variant (`isLoading={true}`)
  - Mock Apollo: wrap with `MockedProvider` per `test/ui/components/` conventions
  - Use `render` from `@testing-library/react`

- [ ] 12.2 Create `test/ui/components/templates/TemplateCardGrid.test.tsx`:
  - Test grid layout at 3 columns desktop / 2 tablet / 1 mobile (via container `sx` prop)
  - Test empty state: renders `EmptyState` with no-templates illustration
  - Test "Load More" button visibility (hidden when `hasNextPage === false`)
  - Test grid display with 20 items: verify all cards rendered

- [ ] 12.3 Create `test/ui/components/templates/TemplateTable.test.tsx`:
  - Test table layout: columns (name, status, category, orientation, last modified, actions)
  - Test sort selector: clicking column header triggers `onSort` callback with sortBy/sortDirection
  - Test "Select All" checkbox: toggles all row checkboxes
  - Test row checkbox selection flow

- [ ] 12.4 Create `test/ui/components/templates/FilterPanel.test.tsx`:
  - Test filter open/close behavior (Popover for desktop, Drawer for mobile)
  - Test status autocomplete: multi-select chips toggle
  - Test category autocomplete: hierarchical grouping
  - Test orientation ToggleButtonGroup: all / portrait / landscape
  - Test "Owned by me" checkbox: toggle on/off
  - Test "Clear all" resets all filters
  - Test active filter badge count: 1 chip / 2 chips / etc.
  - Test category graceful degradation (disabled autocomplete with tooltip when empty)

- [ ] 12.5 Create `test/ui/components/templates/CreateTemplateDialog.test.tsx`:
  - Test dialog open/close via `open` prop
  - Test form validation: empty name → error, name > 100 chars → error
  - Test category autocomplete population
  - Test orientation radio group: portrait default, landscape selectable
  - Test page size radio group: A4 default, letter, custom selectable
  - Test create button disabled during mutation (loading state)
  - Test cancel button resets form

- [ ] 12.6 Create `test/ui/components/templates/DeleteConfirmDialog.test.tsx`:
  - Test dialog open when `deleteTargetId !== null`
  - Test draft message renders interpolated template name
  - Test published message renders with status badge
  - Test cancel button closes dialog
  - Test confirm button: loading state, calls `onDelete(deleteTargetId)`

- [ ] 12.7 Create `test/ui/components/templates/BulkActionBar.test.tsx`:
  - Test selected count with Arabic 6-form pluralization (`selectedCount(0)` → "zero", `selectedCount(1)` → "one")
  - Test action buttons visibility: Archive (permission-gated), Delete (permission-gated), Change Category (permission-gated)
  - Test action button click calls correct handler
  - Test "Clear" deselect button

- [ ] 12.8 Create `test/ui/components/templates/MobileTemplateCard.test.tsx`:
  - Test card rendering: name, description, status badge, updated date
  - Test compact layout (MUI `Card`)
  - Test truncated CardActionMenu (top 3 + More overflow)
  - Test skeleton loading state
  - Test swipe-left for quick actions (if implemented)

- [ ] 12.9 Create `test/ui/e2e/templates-list.spec.ts` (Playwright E2E):
  - Test full navigation flow: sidebar certificates → templates page loads
  - Test search: type template name → 300ms debounce → searchParams URL update → results filtered
  - Test filter: open filter panel → select status Published + category → URL updated → filtered results
  - Test sort: press sort button → grid reordered → URL reflects sort
  - Test grid/table toggle: switch view → persisted across refresh (localStorage)
  - Test create template flow: create button → dialog → fill form → submit → navigate to editor
  - Test card actions: ellipsis menu → edit → navigate to editor; duplicate → toast + new card
  - Test delete: ellipsis → delete → confirmation dialog → confirm → toast + card removed
  - Test bulk: select 3 cards → bulkArchiveBar appears → archive → toast + cards removed
  - Test empty state: search for nonexistent template → no-results illustration
  - Test error state: mock GraphQL error → error banner → retry button → re-fetch
  - Test responsiveness: resize from desktop 1920 → 1024 → 768 → 480
  - Test mobile: bottom MobileBulkActionBar, drawer filter, single-column list

- [ ] 12.10 Run quality loop on all test files:
  ```bash
  bun run scripts/health/sub-loop.ts test/ui/components/templates/TemplateCard.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/components/templates/TemplateCardGrid.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/components/templates/FilterPanel.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/components/templates/CreateTemplateDialog.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/components/templates/DeleteConfirmDialog.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/components/templates/BulkActionBar.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/components/templates/MobileTemplateCard.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/components/templates/TemplateTable.test.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts test/ui/e2e/templates-list.spec.ts --lifecycle lint
  ```

- [ ] 12.11 Write outcome file: `.ai/plans/cert-plan-08/outcome/T12-testing-outcome.md`
  - Document test coverage: component tests (8 suites), E2E test (1 spec, ~13 scenarios)
  - Report coverage gaps and edge-case handling

**Files to create:**
- `test/ui/components/templates/TemplateCard.test.tsx`
- `test/ui/components/templates/TemplateCardGrid.test.tsx`
- `test/ui/components/templates/TemplateTable.test.tsx`
- `test/ui/components/templates/FilterPanel.test.tsx`
- `test/ui/components/templates/CreateTemplateDialog.test.tsx`
- `test/ui/components/templates/DeleteConfirmDialog.test.tsx`
- `test/ui/components/templates/BulkActionBar.test.tsx`
- `test/ui/components/templates/MobileTemplateCard.test.tsx`
- `test/ui/e2e/templates-list.spec.ts`

**Instruction verification:**
- `test/ui/components/AGENTS.md` — Happy DOM patterns, MockedProvider
- `test/ui/e2e/AGENTS.md` — Playwright patterns, login helpers
- `.github/instructions/tests.instructions.md`

---

### T13: Feature Flag & Sort/Optimistic/Filter Enhancements

**Goal:** Wire the Plan 17 feature flag (`CERT_TEMPLATE_GENERATE`) into the sidebar, add the sort selector to the desktop and mobile views, wire orientation & own-by-me filters, and apply optimistic UI mutation semantics (DD-6) to create, duplicate, and delete mutations.

**Duration:** 3–4 hours

**Requirements covered:** REQ-08-05e (Generate action per Plan 17 flag), REQ-08-03 (filter enhancements), DD-6 (optimistic UI for mutations)

**Dependencies:** T05 (desktop view files exist), T06 (mobile view files exist), T08 (CardActionMenu wired)

**Subtasks:**

- [ ] 13.1 Wire Plan 17 `CERT_TEMPLATE_GENERATE` feature flag:
  - In `CardActionMenu.tsx`: wrap "Generate from Template" menu item with `FeatureFlag`
    - Only visible when `CERT_TEMPLATE_GENERATE` flag is enabled AND permissions includes `CERT_TEMPLATE_VIEW` AND template status is `PUBLISHED`
  - In `TemplatesSidebarConfig` (T10): wrap "Certificates/Generation" sidebar item (or a sub-item) with `FeatureFlag`
  - Read feature flag from `next.config.ts` `flags` at build time (SSR-safe)
  - **Graceful degradation**: when flag is disabled, the nav path `/certificates/templates/{id}/generate` returns 404 (expected — no page yet)

- [ ] 13.2 Wire `SortSelector` into desktop toolbar:
  - Replace the simple table-sort on the `TemplateToolbar` with `SortSelector` from design.md
  - Desktop: MUI `ButtonGroup` with 4 buttons:  (newest created, oldest created, A-Z name, Z-A name)
  - Each button reads/writes combo of `store.sortBy` + `store.sortDirection`
  - Active button state with `contained` variant for active, `outline` for inactive
showSorting `outlined` for inactive
  - Label: `labels.sort.createdNewest`, `labels.sort.createdOldest`, `labels.sort.nameAZ`, `labels.sort.nameZA`

- [ ] 13.3 Wire MobileSortSelector into `MobileTemplateList` toolbar:
  - MUI `Button` with current sort label + DownArrow icon
  - Tap → open `Popup` (or bottom sheet) with same 4 sort options
  - Label: `labels.sort.label` (`"Sort by"`)
  - Close on selection

- [ ] 13.4 Wire `orientationFilter` and `ownedByMe` filters into `T04` container:
  - In `useTemplatesViewModel`: pass `store.orientationFilter`, `store.ownedByMe` to the query variables
  - GraphQL query must accept `orientation` and `ownedByMe` as optional filter arguments
  - When filters change → refetch + update URL search params (consistent with existing pattern)

- [ ] 13.5 Wire `FilterOptionsPanelOrientation + ownedByMe` filters 5 into desktop `FilterPanel` (T09) Verify orientation & owned-by-me controls:
  - Verify MUI `ToggleButtonGroup` visual with Portrait / Landscape / All renders
  - Verify `FormControlLabel` with `Checkbox` visual `ownedByMe` renders
  - Verify on toggle/checkbox → store state update → refetch + URL sync

- [ ] 13.6 Apply DD-6 (optimistic UI for mutations):
  - **Create**: on `CERTThis.createTemplate`, add an optimistic template into Apollo cache with `__APOLLO-OPTIMISTIC__` marker + status `PENDING`
  - On success: replace optimistic entry with actual template `vs`
  - On failure: remove optimistic entry, display mutation error toast
  - **Duplicate**: Insert optimistic duplicate with incremented index name ("You (N)") in same category
  - Mark status `PENDING`
  - On success: replace with real duplicated template
  - On failure: remove duplicate mockup + error toast
  - **Delete**: evict template from cache immediately (instant removal from UI)
  - On mutation failure: refetchFailed refetch + toast "Deletion failed, please try again"

- [  ] 13.7 Run quality loop on enhanced files:
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/components/CardActionMenu.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/templates/useTemplatesViewModel.ts --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/templates/components/TemplateToolbar.tsx --lifecycle lint
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/templates/components/MobileToolbar.tsx --lifecycle lint
  ```

- [ ] 13. Write outcome file `.ai/plans/cert-plan-08/outcome/T13-feature-enhancements.md`

**Files to modify:**
- `frontend/common/views/dashboard/certificates/templates/components/CardActionMenu.tsx` (feature flag)
- `frontend/common/views/dashboard/certificates/templates/useTemplatesViewModel.ts` (orientation/ownedByMe filter vars)
- `frontend/common/views/dashboard/certificates/templates/components/FilterPanel.tsx` (orientation + ownedByMe controls)
- `frontend/desktop/views/dashboard/certificates/templates/components/TemplateToolbar.tsx` (sort selector)
- `frontend/mobile/views/dashboard/certificates/templates/components/MobileToolbar.tsx` (mobile sort selector)
- `frontend/common/views/dashboard/certificates/templates/TemplateListContainer.tsx` (optimistic caching)
- `frontend/common/graphql/sharedDocuments/cert/template-list.documents.ts` (include orientation/ownedByMe query vars)

**Instruction verification:**
- `frontend/views/AGENTS.md` — component conventions, Props pattern
- `frontend/AGENTS.md` — MUI v9 style system, React 19 event handling
- `frontend/common/stores/AGENTS.md` — store hydration pattern, selector hooks
- `frontend/common/graphql/sharedDocuments/AGENTS.md` — query document pattern, field selection
- `.github/instructions/frontend.instructions.md`

---

## AC → Task Mapping

| AC ID | Requirement Description | Primary Task(s) | Supporting Task(s) |
|-------|------------------------|-----------------|---------------------|
| AC-08-01a | Template list page renders card grid with all templates | T04, T05 | T01 (labels), T02 (query) |
| AC-08-01b | Responsive: desktop 3-col grid, tablet 2-col, mobile 1-col | T05, T06 | T03 (viewMode state) |
| AC-08-01c | Card grid & table toggle button (desktop only) | T05 | T03 (viewMode persist) |
| AC-08-02 | Debounced server-side search by template name (300ms) | T04, T05 | T01 (placeholder), T03 (search state) |
| AC-08-03a | Status multi-select filter with AND logic | T05, T09 | T01 (filter labels), T03 (filter state) |
| AC-08-03b | Category hierarchical dropdown filter | T09 | T01 (labels), T02 (category query) |
| AC-08-03c | Filter state persisted in URL (shareable links) | T04 | T03 (hydrateFromUrl) |
| AC-08-03d | Orientation filter (portrait/landscape/all) | T09, T13 | T03 (orientationFilter state), T13 (wire to query) |
| AC-08-03e | "Owned by me" filter checkbox | T09, T13 | T03 (ownedByMe state), T13 (wire to query) |
| AC-08-04a | Cursor-based "Load More" button, 20 items per page | T04, T05 | T02 (connection query) |
| AC-08-04b | Load More appends items without full reload | T04 | T05 (LoadMoreButton) |
| AC-08-04c | Sort selector (newest/oldest created, A-Z/Z-A name) | T05, T13 | T03 (sort state), T13 (sort selector UI) |
| AC-08-05a | Card actions: Edit (navigate to editor) | T08 | T04 (navigation) |
| AC-08-05b | Card actions: Preview (open preview route) | T08 | T04 (navigation) |
| AC-08-05c | Card actions: Duplicate (mutation + toast) | T08 | T04 (mutation handler) |
| AC-08-05d | Card actions: Delete (soft-delete with confirmation) | T08 | T04 (mutation handler) |
| AC-08-05e | Card actions: Generate from Template (published only, feature-flagged) | T08, T13 | T04 (navigation), T13 (Plan 17 feature flag) |
| AC-08-06 | Sidebar: "Certificates" group with 5 items | T10 | T01 (sidebar i18n) |
| AC-08-07a | Create Template dialog (name, category, orientation, page size) | T07 | T01 (dialog labels), T02 (mutation) |
| AC-08-07b | Dialog navigates to editor on create | T07 | T04 (navigation handler) |
| AC-08-07c | Category dropdown graceful degradation | T07 | T02 (category query) |
| AC-08-08a | Bulk: multi-select checkboxes in cards/table | T05, T09 | T03 (selection state) |
| AC-08-08b | Bulk: archive action with confirmation | T09 | T04 (bulk handler), T05 (BulkActionBar) |
| AC-08-08c | Bulk: delete action with confirmation | T09 | T04, T05, T08 (DeleteConfirmDialog) |
| AC-08-08d | Bulk: change category action with dialog | T09 | T04 (bulk handler) |
| AC-08-08e | Bulk: permission-gated action buttons | T09 | T05 (permission gating) |
| AC-08-09 | Responsive: desktop 3-col grid/table toggle, tablet 2-col, mobile 1-col compact | T05, T06 | — |
| AC-08-10a | Loading state: skeleton cards (desktop) / skeleton list (mobile) | T05, T06 | — |
| AC-08-10b | Error state: error banner with retry button | T05, T06 | T04 (refetch handler) |
| AC-08-10c | Empty state: illustrations for no-templates and no-results | T05, T06 | T01 (empty labels) |
| AC-08-09g | Tier view files use `.desktop.tsx` / `.mobile.tsx` naming with named exports | T05, T06 | — |
| AC-08-09h | `createLazyView` + `ResponsiveViewSwitch` pattern for lazy tier loading | T04 | T05, T06 (tier files must exist) |
| AC-08-09i | Desktop uses `AppDataGrid` (table mode) or card grid; Mobile uses `MobileCardList` | T05, T06 | — |
| AC-08-09j | View mode toggle (grid/table) persisted in Zustand store, desktop only | T05 | T03 (viewMode persist) |
| AC-08-09k | Tier views contain ZERO business logic — all from ViewModel props | T05, T06 | T04 (ViewModel) |
| AC-08-09l | Shared dialogs (Create, Delete, BulkCategory) rendered in Container, outside switcher | T04 | T07, T08, T09 (dialog components) |
| AC-08-09m | Container wraps content in `RequirePermission` with AppPermission gate | T04 | — |
| AC-08-09n | `createLazyView` importers use `.then(m => ({ default: m.X }))` shim for named exports | T04 | T05, T06 |
| AC-08-10h | Loading: skeleton card grid (desktop) / skeleton list rows (mobile) | T05, T06 | — |
| AC-08-10i | Success: snackbar toast after create, duplicate, archive, delete, bulk operations | T04 | T07, T08, T09 (mutation triggers) |
| AC-08-10j | Error: snackbar with GraphQLError message + retry action on mutation failure | T04 | T05, T06 (error rendering) |
| AC-08-10k | Partial bulk failure: aggregated error summary with per-template status | T04, T09 | — |
| AC-08-10l | Disabled state: action buttons disabled when permission check fails | T08, T09 | T04 (permissions in ViewModel) |
| AC-08-10m | Permission-gated actions: hidden entirely when user lacks permission (not just disabled) | T08, T09 | T04 (permissions in ViewModel) |
| AC-08-i18n-a | All user-facing strings consumed via typed `useAppTranslation(Translation.Dashboard.X)` | T04, T05, T06, T07, T08, T09 | T01 (namespace creation) |
| AC-08-i18n-b | Arabic pluralization uses 6-form system (zero, one, two, few, many, other) | T01 | — |
| AC-08-i18n-c | English pluralization uses one/other binary system | T01 | — |
| AC-08-i18n-d | Interpolation functions defined as `(param: T) => string` in type schema, implemented in both locales | T01 | T04 (consumption) |
| AC-08-i18n-e | `TemplateListLabels` type schema registered in `Translation` enum constant | T01 | T04 (import) |
| AC-08-i18n-f | Sidebar labels: `sidebar.certificates.*` keys with English and Arabic implementations | T01, T10 | — |
| AC-08-i18n-g | Status badge labels: `statusLabel(draft)` / `(published)` / `(archived)` mapped via `Record<TemplateStatus, string>` | T01, T05 | — |
| AC-08-a11y-a | All interactive elements keyboard-navigable (Tab, Enter, Escape, Arrow keys) | T05, T06, T07, T08, T09 | T12 (test coverage) |
| AC-08-a11y-b | Focus indicators visible (theme `focusVisible` ring) | T05, T06, T07, T08, T09 | T12 (test coverage) |
| AC-08-a11y-c | ARIA labels/roles on all icon-only buttons (Filter, Sort, Actions, Create) | T05, T06, T07, T08, T09 | T12 (test coverage) |
| AC-08-a11y-d | Status badges use `role="status"` + `aria-label` with translated text | T05 | T12 (test coverage) |
| AC-08-a11y-e | Table header cells use `scope="col"`; row checkboxes use `role="checkbox"` + `aria-checked` | T05, T12 | T12 (test coverage) |
| AC-08-a11y-f | Dialogs trap focus (MUI `Dialog` default), Escape closes, modal on mobile | T07, T08, T09 | T12 (test coverage) |
| AC-08-a11y-g | Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components (MUI theme palette) | T05, T06, T12 | T12 (test coverage) |
| AC-08-a11y-h | Live regions for toast/snackbar announcements (`aria-live="polite"`) | T04, T07, T08, T09 | T12 (test coverage) |
| AC-08-a11y-i | RTL layout mirroring verified for Arabic locale | T05, T06, T12 | T12 (test coverage) |
| AC-08-a11y-j | Minimum touch target 48×48dp on mobile | T06, T12 | T12 (test coverage) |
| AC-08-a11y-k | Screen reader test with NVDA/VoiceOver for critical flows | T12 | — |
| AC-08-mob-a | Mobile: bottom-sheet FilterPanel (Drawer), sticky MobileBulkActionBar | T06, T09 | T12 (E2E mobile flow) |
| AC-08-mob-b | Mobile: single-column list (no table view), compact card with status badge inline | T06 | T12 (E2E mobile flow) |
| AC-08-mob-c | Mobile: hamburger triggers sidebar (Plan 08 shared), mobile sort via popup | T06, T13 | T12 (E2E mobile flow) |
| AC-08-mob-d | Mobile: create dialog full-screen (MUI `Dialog` fullScreen `smDown`) | T07 | T12 (E2E mobile flow) |
| AC-08-mob-e | Orientation auto-rotation handled (no fixed orientation lock) | T07 | T12 (E2E mobile flow) |
| AC-08-mob-f | Pull-to-refresh not implemented (no native app wrapper) — use Load More | T06 | — |
| AC-08-mob-g | Viewport meta tag correct (Next.js default) | T04 | — |
| AC-08-p17-a | Plan 17 feature flag `CERT_TEMPLATE_GENERATE` gates Generate action in CardActionMenu | T08, T13 | T13 (feature flag wiring) |
| AC-08-p17-b | Plan 17 feature flag gates Generate sidebar item | T10, T13 | T13 (feature flag wiring) |
| AC-08-p17-c | Graceful degradation: flag disabled → Generate action hidden, route 404s | T08, T10, T13 | T13 (feature flag wiring) |
| AC-08-opt-a | Create mutation: optimistic insert with PENDING status → replaced on success | T13 | T04 (mutation handler), T12 (test coverage) |
| AC-08-opt-b | Duplicate mutation: optimistic insert with incremented name → replaced on success | T13 | T04 (mutation handler), T12 (test coverage) |
| AC-08-opt-c | Delete mutation: optimistic eviction → refetch on failure | T13 | T04 (mutation handler), T12 (test coverage) |
| AC-08-pag-a | Pagination uses cursor-based `after` with relay-style connection (not offset/limit) | T02, T04 | — |
| AC-08-pag-b | Pagination contract deviation documented in design.md §6.7 (SWE Expert Review) | design.md | — |
| AC-08-perm-a | Permission keys use codebase `CERT_TEMPLATE_*` (underscore) format | T04, T08, T09, T10 | — |
| AC-08-perm-b | Permission contract deviation documented in design.md §6.8 (SWE Expert Review) | design.md | — |

---

## Instruction File Verification

| Task | Files to Create/Modify | Layer | Instruction Files | AGENTS.md Files |
|------|-----------------------|-------|-------------------|-----------------|
| T01 | `shared/locale/types/dashboard/certificates/templates/list.ts`, `shared/locale/types/dashboard/sidebar.ts`, `shared/locale/namespaces/...`, `shared/locale/en/...`, `shared/locale/ar/...` | Shared | `frontend.instructions.md` | `shared/AGENTS.md` (locale rules), `frontend/common/stores/AGENTS.md` |
| T02 | `frontend/common/graphql/sharedDocuments/cert/template-list.documents.ts` | Frontend GraphQL | `frontend.instructions.md` | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md` |
| T03 | `frontend/common/stores/templateListStore.ts`, `templateListStore.types.ts`, `__mocks__/templateListStore.ts` | Frontend Stores | `frontend.instructions.md` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` |
| T04 | `app/(dashboard)/certificates/templates/page.tsx`, `frontend/common/views/dashboard/certificates/templates/types.ts`, `useTemplatesViewModel.ts`, `TemplateListView.tsx` (switcher), `TemplateListContainer.tsx`, `index.ts` | App Router + Frontend Views | `frontend.instructions.md` | `app/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/common/stores/AGENTS.md` |
| T05 | Desktop tier view: `templates.desktop.tsx`; Desktop components: `components/TemplateToolbar.tsx`; Common: `components/TemplateCard.tsx`, `components/TemplateCardGrid.tsx`, `components/TemplateTable.tsx`, `components/StatusBadge.tsx`, states (3), `components/LoadMoreButton.tsx`, `components/BulkActionBar.tsx` | Frontend Desktop + Common | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md` |
| T06 | Mobile tier view: `templates.mobile.tsx`; Mobile components: `components/MobileTemplateCard.tsx`, states (2), `components/MobileBulkActionBar.tsx`, `components/MobileLoadMoreButton.tsx` | Frontend Mobile + Common | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md` |
| T07 | `frontend/common/views/dashboard/certificates/templates/components/CreateTemplateDialog.tsx`; `frontend/common/views/dashboard/certificates/templates/schemas/createTemplateSchema.ts` | Frontend Views (Dialog) | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T08 | `components/CardActionMenu.tsx`, `components/DeleteConfirmDialog.tsx`; Modify: `components/TemplateCard.tsx`, mobile `components/MobileTemplateCard.tsx` | Frontend Views (Actions) | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T09 | `components/FilterPanel.tsx`, `components/BulkChangeCategoryDialog.tsx`; Modify: Desktop + Mobile tier views, `components/BulkActionBar.tsx` | Frontend Views (Bulk + Filter) | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| T10 | Sidebar config file + sidebar component file | App Router + Frontend Navigation | `frontend.instructions.md` | `app/AGENTS.md`, `frontend/AGENTS.md` |
| T11 | `docs/frontend/template-list-pattern.md`; Modify: `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, root `AGENTS.md` | Cross-cutting (Docs) | — | Root `AGENTS.md`, all layer AGENTS.md modified |
| T12 | `test/ui/components/templates/TemplateCard.test.tsx`, `TemplateCardGrid.test.tsx`, `TemplateTable.test.tsx`, `FilterPanel.test.tsx`, `CreateTemplateDialog.test.tsx`, `DeleteConfirmDialog.test.tsx`, `BulkActionBar.test.tsx`, `MobileTemplateCard.test.tsx`; `test/ui/e2e/templates-list.spec.ts` | Testing (UI + E2E) | `tests.instructions.md` | `test/ui/components/AGENTS.md`, `test/ui/e2e/AGENTS.md` |
| T13 | `CardActionMenu.tsx` (feature flag), `useTemplatesViewModel.ts` (filter vars), `FilterPanel.tsx` (orientation + ownedByMe), `TemplateToolbar.tsx` (sort selector), `MobileToolbar.tsx` (mobile sort), `TemplateListContainer.tsx` (optimistic), `template-list.documents.ts` (query vars) | Frontend Views (Enhancements) | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md` |

---

## Execution Summary

### Phase Ordering

| Phase | Tasks | Duration | Parallelism |
|-------|-------|----------|-------------|
| Phase 1: Foundation | T01, T02, T03 | ~8–10 hours | T01 → T02, T03 (T02/T03 can overlap if separate sub-agents) |
| Phase 2: List Page | T04, T05, T06 | ~10–13 hours | T04 → T05, T06 (T05/T06 in parallel) |
| Phase 3: Interactions | T07, T08, T09 | ~7–10 hours | T07, T08 parallel after T05; T09 after T08 |
| Phase 4: Navigation & Knowledge | T10, T11 | ~4–5 hours | T10 can run parallel with T05–T09; T11 last |
| Phase 5: Testing & Verification | T12, T13 | ~9–12 hours | T12 can run parallel with T11; T13 after T05/T06/T08 |
| **Total** | **13 tasks** | **~38–50 hours** | — |

### Critical Path

```
T01 → T04 → T05 → T08 → T09 → T11 → T12
```

- T01 (i18n) is the initial gate — blocks T02, T03, T04, T10
- T04 (container) is the critical gate — blocks all view/interaction tasks
- T05 (desktop view) blocks T07, T08, T09 (they need card components and BulkActionBar)
- T11 (knowledge) depends on all others
- T12 (testing) depends on T09 (all components created) — can run parallel with T11
- T13 (feature enhancements) depends on T05, T06, T08

### Parallelization Opportunities

1. **T02 + T03** can run in parallel after T01 (separate sub-agents for GraphQL docs and Zustand store)
2. **T05 + T06** can run in parallel after T04 (separate sub-agents for desktop and mobile views)
3. **T07 + T08** can run in parallel after T05 (create dialog and card actions are independent)
4. **T10** can run in parallel with T05–T09 (sidebar only depends on T01)
5. **T11 + T12** can run in parallel after T09 (knowledge propagation doesn't need test files; tests don't need docs)
6. **T13** can run in parallel with T11/T12 after T05/T06/T08 complete

### Outcome File Directory

All outcome files are written to: `.ai/plans/cert-plan-08/outcome/`

| Task | Outcome File |
|------|-------------|
| T01 | `T01-i18n-translations-outcome.md` |
| T02 | `T02-graphql-documents-outcome.md` |
| T03 | `T03-zustand-store-outcome.md` |
| T04 | `T04-container-outcome.md` |
| T05 | `T05-desktop-view-outcome.md` |
| T06 | `T06-mobile-view-outcome.md` |
| T07 | `T07-create-dialog-outcome.md` |
| T08 | `T08-card-actions-outcome.md` |
| T09 | `T09-bulk-filter-outcome.md` |
| T10 | `T10-sidebar-nav-outcome.md` |
| T11 | `T11-knowledge-propagation-outcome.md` |
| T12 | `T12-testing-outcome.md` |
| T13 | `T13-feature-enhancements-outcome.md` |

---

## Quality Gate Reference

### Per-File Progressive Verification

```bash
# Run the sub-loop script for progressive verification (tsgo → biome → lint → codescene)
# Short-circuits at first failure; --lifecycle controls target stage
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
```

### Global Quality Commands

```bash
# Type check (safe to run concurrently)
bun tsgo

# Biome formatting + lint (safe to run concurrently)
bun biome:check

# Full-repo ESLint via lint queue server (safe for parallel sub-agents)
bun run lint

# Full quality gate (tsgo → biome → lint → codescene → sonar)
bun quality-gate

# Fresh quality gate (reset state and run from scratch)
bun quality-gate:fresh
```

### Lint Queue Server (Required for `bun run lint`)

```bash
# Start the lint queue server (background — required before any lint call)
~/.bun/bin/bun run scripts/lint-queue-server.ts

# Health check
curl -s http://localhost:${LINT_QUEUE_PORT}/status
# Returns: { running: true, queueLength: N }

# File-scoped lint (faster for sub-agents)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-08-T<NN>","files":["<file-path-1>","<file-path-2>"]}'
```

> **Port configuration:** The port is defined in `scripts/lint-queue-config.ts`. Set `export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)` or override with `LINT_QUEUE_PORT=<port>`.

### Sonar-Scan Prohibition

**Sub-agents must NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts`.** Only the quality-gate orchestrator handles sonar stages. Sub-agents work with existing results in `.scannerwork/sonar-result.json` (read-only queries only).

---

## Notes

- **Frontend-only plan:** No backend files are created. All GraphQL APIs are assumed to exist from Plan 05.
- **Cross-plan dependencies:** If Plan 05 hasn't implemented certain mutations (e.g., `bulkChangeCategory`), T02 will surface a cross-file dependency. Report it — do not implement backend code in this plan.
- **Plan 09 dependency:** The category hierarchical dropdown in `FilterPanel` and `CreateTemplateDialog` gracefully degrades to "Uncategorized" when categories are not yet available (Plan 09 not complete).
- **Plan 10 dependency:** The template editor route (`/[locale]/certificates/templates/{id}/editor`) is expected to be built by Plan 10. Navigation to it in T07 and T08 will 404 until Plan 10 is complete — that's expected.
- **i18n INLINE:** Every task includes i18n work as part of the task, not as a separate pre-step. Translation keys are created in T01, consumed by all subsequent tasks.
- **No code snippets:** This document contains only bash quality loop commands as code blocks. No TypeScript/React/GraphQL code snippets are included — refer to `design.md` for interface contracts and component props.
---

## Tasks — Additional UI Component & Navigation Tasks

> The following tasks extend the original task list with detailed component-level work for the template list page, card, table, create dialog, navigation, mobile, tests, and quality loops. All tasks depend on the original tasks (T01–T11) having progressed sufficiently (store exists, GraphQL documents exist, types exist).

### T12 — TemplateListPage Component

**Description:** Create the `TemplateListPage` client component — the page-level container that renders the header, filter bar, view-mode toggle, and conditionally the grid or table view. Wire to `useTemplateListStore` for state.

**Files:**
- `frontend/views/dashboard/cert/templates/list/TemplateListPage.tsx` (new)

**Sub-tasks:**
1. Create `TemplateListPage.tsx` with `"use client"` directive.
2. Import and call `useTemplateListStore` to read `searchQuery`, `categoryFilter`, `statusFilter`, `sortBy`, `viewMode`, `loading`, `error`, and actions `setSearchQuery`, `setCategoryFilter`, `setStatusFilter`, `setSortBy`, `setViewMode`, `loadTemplates`, `openCreateDialog`.
3. On mount `useEffect`, read URL search params (`?status=`, `?category=`) and set store filters accordingly; call `loadTemplates()`.
4. Render `PageHeader` section: title "Certificate Templates" (i18n: `templateList.pageTitle`), subtitle with count (i18n: `templateList.pageSubtitle.count` — pluralized), "Create Template" button (MUI `Button` variant="contained" startIcon `<AddOutlined />`), permission-gated via `RequirePermission` wrapper with `cert.template.create`.
5. Render `FilterBar` horizontal `Stack` with: search `TextField` (placeholder `templateList.searchPlaceholder`, startAdornment `<SearchOutlined />`, width 300px), category `Select`, status `Select`, sort `Select` — all i18n labels.
6. Render `ToggleButtonGroup` with Grid (`<ViewModuleOutlined />`) and List (`<ViewListOutlined />`) toggle buttons bound to `viewMode`.
7. Conditionally render `<TemplateGrid>` (when viewMode==='card') or `<TemplateListTable>` (when viewMode==='table').
8. Render `<CreateTemplateDialog>` when `createDialogOpen` is true.
9. Render error `Alert` when `error` is non-null.
10. Render loading `Skeleton` grid when `loading` is true.

**i18n keys (add to `shared/locale/`):**
- `templateList.pageTitle` — "Certificate Templates"
- `templateList.pageSubtitle` — pluralized count
- `templateList.searchPlaceholder` — "Search templates..."
- `templateList.filters.category.all` — "All"
- `templateList.filters.category.academic` — "Academic"
- `templateList.filters.category.achievement` — "Achievement"
- `templateList.filters.category.completion` — "Completion"
- `templateList.filters.category.participation` — "Participation"
- `templateList.filters.category.custom` — "Custom"
- `templateList.filters.status.all` — "All"
- `templateList.filters.status.draft` — "Draft"
- `templateList.filters.status.published` — "Published"
- `templateList.filters.status.archived` — "Archived"
- `templateList.sortBy.modified` — "Last Modified"
- `templateList.sortBy.nameAsc` — "Name A-Z"
- `templateList.sortBy.nameDesc` — "Name Z-A"
- `templateList.sortBy.newest` — "Newest First"
- `templateList.createButton` — "Create Template"

**Dependencies:** T04 (store), T05 (sharedDocuments), T06 (types).

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T12","files":["frontend/views/dashboard/cert/templates/list/TemplateListPage.tsx"]}'
```

---

### T13 — TemplateCard Component (Grid View)

**Description:** Create the `TemplateCard` client component — an individual card showing a template's thumbnail, name, category badge, status badge, last modified date, variable count, and action buttons. Handles click-to-edit, duplicate, more-menu actions, and delete confirmation dialog.

**Files:**
- `frontend/views/dashboard/cert/templates/list/TemplateCard.tsx` (new)

**Sub-tasks:**
1. Create `TemplateCard.tsx` with `"use client"` directive.
2. Define props interface: `{ template: CertTemplateReturnType; onEdit: (id: string) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void; onView: (id: string) => void; onArchive: (id: string) => void; onPublish: (id: string) => void; onExport: (id: string) => void }`.
3. Render `Card` with `sx={{ maxWidth: 320, cursor: 'pointer', transition: (theme) => theme.transitions.create('box-shadow') }}`.
4. Implement hover state: local `useState` for `elevated`, set `elevation={elevated ? 8 : 1}`.
5. `CardMedia` — thumbnail preview, 16:10 aspect ratio (`sx={{ aspectRatio: '16/10' }}`), shows `template.thumbnailUrl` or a placeholder gradient.
6. `CardContent`:
   - Template name: `Typography` variant="h6" `sx={{ fontWeight: 600 }}` — `template.name`.
   - Category badge: `Chip` size="small" with color per category mapping (Academic=info, Achievement=secondary, Completion=primary, Participation=success, Custom=default).
   - Status badge: `Chip` size="small" with color per status mapping (Draft=warning, Published=success, Archived=default).
   - Last modified: `Typography` variant="caption" color="text.secondary" — formatted date.
   - Variable count: `Typography` variant="caption" — `"{N} variables"` (i18n pluralized: `templateList.card.variables`).
7. `CardActions`:
   - Edit `IconButton` with `Tooltip` "Edit".
   - Duplicate `IconButton` with `Tooltip` "Duplicate".
   - More `IconButton` (`MoreVertOutlined`) opening a `Menu` with MenuItems: Preview, Export, Publish/Unpublish, Archive, Delete (red text).
8. Card body `onClick` calls `onEdit(template.id)` — but NOT when clicking action buttons (stopPropagation on action buttons).
9. Delete menu item opens confirmation `Dialog` with template name — confirm calls `onDelete(template.id)`.
10. All user-facing text via i18n: `templateList.card.edit`, `.duplicate`, `.preview`, `.export`, `.publish`, `.unpublish`, `.archive`, `.delete`, `.deleteConfirmTitle`, `.deleteConfirmMessage`, `.variables`.

**i18n keys:**
- `templateList.card.edit` — "Edit"
- `templateList.card.duplicate` — "Duplicate"
- `templateList.card.preview` — "Preview"
- `templateList.card.export` — "Export"
- `templateList.card.publish` — "Publish"
- `templateList.card.unpublish` — "Unpublish"
- `templateList.card.archive` — "Archive"
- `templateList.card.delete` — "Delete"
- `templateList.card.deleteConfirmTitle` — "Delete Template"
- `templateList.card.deleteConfirmMessage` — "Are you sure you want to delete \"{name}\"? This action cannot be undone."
- `templateList.card.variables` — pluralized: (count) => `${count} variables` / `${count} variable`

**Dependencies:** T06 (types), T07 (GraphQL documents for thumbnail/publish/export).

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T13","files":["frontend/views/dashboard/cert/templates/list/TemplateCard.tsx"]}'
```

---

### T14 — TemplateListTable Component (List View)

**Description:** Create the `TemplateListTable` client component — a MUI `Table` (or `AppDataGrid` — see T15) showing templates in a sortable, paginateable, selectable table with a bulk actions bar.

**Files:**
- `frontend/views/dashboard/cert/templates/list/TemplateListTable.tsx` (new)

**Sub-tasks:**
1. Create `TemplateListTable.tsx` with `"use client"` directive.
2. Define props: `{ templates, loading, onEdit, onDuplicate, onDelete, onView, onArchive, onPublish, onExport, selectedIds, onToggleSelection, onClearSelection, onBulkArchive, onBulkDelete, onBulkExport }`.
3. Manage local state: `orderBy` (column key), `orderDirection` ('asc' | 'desc'), `page` (0-based), `rowsPerPage` (default 25).
4. Render bulk actions bar (`Toolbar` with `sx={{ bgcolor: 'action.selected' }}`) when `selectedIds.length > 0` — shows "{N} selected", Archive, Export, Delete buttons, Clear button.
5. Table columns:
   - Checkbox (header "select all" + per-row checkbox).
   - Thumbnail (`Avatar` variant="rounded" 60×40px or `Box` with `img`).
   - Name (Typography primary=name, secondary=description truncated).
   - Category (Chip size="small" with category color).
   - Status (Chip size="small" with status color).
   - Variables (Typography body2).
   - Modified (Typography body2 formatted date).
   - Actions (Edit IconButton, Duplicate IconButton, More menu — same as card T13).
6. Sortable columns: Name, Category, Status, Modified — clicking header cell toggles sort; show `ArrowUpwardOutlined`/`ArrowDownwardOutlined` icon.
7. Row `onClick` navigates to editor — stopPropagation on action buttons.
8. `TablePagination` with rowsPerPageOptions `[10, 25, 50]`, default 25, `count={templates.length}`, `page`, `onPageChange`, `rowsPerPage`, `onRowsPerPageChange`.
9. All user-facing text via i18n: `templateList.table.columns.*`, `templateList.table.bulkActions.*`, `templateList.table.rowsPerPage`.

**i18n keys:**
- `templateList.table.columns.name` — "Name"
- `templateList.table.columns.category` — "Category"
- `templateList.table.columns.status` — "Status"
- `templateList.table.columns.variables` — "Variables"
- `templateList.table.columns.modified` — "Modified"
- `templateList.table.columns.actions` — "Actions"
- `templateList.table.bulkActions.selected` — "{count} selected"
- `templateList.table.bulkActions.archive` — "Archive"
- `templateList.table.bulkActions.export` — "Export"
- `templateList.table.bulkActions.delete` — "Delete"
- `templateList.table.bulkActions.clear` — "Clear"
- `templateList.table.rowsPerPage` — "Rows per page:"

**Dependencies:** T06 (types), T13 (TemplateCard for component patterns / shared menu logic).

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T14","files":["frontend/views/dashboard/cert/templates/list/TemplateListTable.tsx"]}'
```

---

### T15 — AppDataGrid Integration for Table View

**Description:** Evaluate whether `TemplateListTable` should use the project's shared `AppDataGrid` component instead of raw MUI `Table`. The `AppDataGrid` (in `frontend/components/ui/`) wraps MUI DataGrid with standardized theming, pagination, sorting, and selection. If the DataGrid approach is used, configure it for the template list columns.

**Files:**
- `frontend/views/dashboard/cert/templates/list/TemplateListTable.tsx` (modified — replace raw Table with AppDataGrid, OR extend to accept AppDataGrid config)

**Sub-tasks:**
1. Read `frontend/components/ui/AppDataGrid.tsx` to understand the component's props interface (`columns`, `rows`, `pageSizeOptions`, `checkboxSelection`, `disableRowSelectionOnClick`, `slots`, `sortingMode`, etc.).
2. Read `frontend/components/ui/AGENTS.md` for AppDataGrid conventions and limitations.
3. Define DataGrid columns array mapping to the template list columns (Checkbox built-in, Thumbnail via `renderCell`, Name, Category via `renderCell` with Chip, Status via `renderCell` with Chip, Variables, Modified, Actions via `renderCell`).
4. Configure `checkboxSelection={true}`, `rowsPerPageOptions={[10, 25, 50]}`, `paginationMode="client"`, `sortingMode="client"` (or "server" if pagination is server-side — depends on T04 store decision).
5. Implement `onRowSelectionModelChange` to sync with `selectedIds` in the store.
6. Implement `onRowClick` to navigate to editor.
7. Render bulk actions bar above the DataGrid when selection is non-empty.
8. If `AppDataGrid` does not support a needed feature (e.g., per-row action menu), fall back to a `renderCell` custom column rendering the action buttons.

**Decision Point:**
- If `AppDataGrid` is a thin wrapper around MUI DataGrid Pro, use it — leverage built-in sorting, pagination, checkbox selection.
- If `AppDataGrid` is too opinionated or lacks features needed (e.g., custom action menu per row), keep raw `Table` from T14 and document the rationale.

**Dependencies:** T14 (base table), `frontend/components/ui/AppDataGrid.tsx` (existing).

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T15","files":["frontend/views/dashboard/cert/templates/list/TemplateListTable.tsx"]}'
```

---

### T16 — CreateTemplateDialog Component

**Description:** Create the `CreateTemplateDialog` client component — a modal dialog for creating a new template with name, category, description, orientation, size, and "start from" (blank or copy existing) fields. Uses `LoadingButton` for async submit and shows validation errors inline.

**Files:**
- `frontend/views/dashboard/cert/templates/list/CreateTemplateDialog.tsx` (new)

**Sub-tasks:**
1. Create `CreateTemplateDialog.tsx` with `"use client"` directive.
2. Define props: `{ open: boolean; onClose: () => void; onCreated: (template: CertTemplateReturnType) => void }`.
3. Local form state: `name`, `category`, `description`, `orientation` ('landscape' | 'portrait', default 'landscape'), `size` ('A4' | 'Letter' | 'Legal' | 'A3' | 'Custom'), `customWidth`, `customHeight`, `startFrom` ('blank' | 'copy', default 'blank'), `copyFromId` (string | null).
4. Validation:
   - Name required, max 100 chars — inline error on blur.
   - Name unique (case-insensitive) — debounced async check against existing template names — error "A template with this name already exists" (i18n: `templateList.createDialog.errors.nameExists`).
   - Category required — `Select` error if empty.
   - If size="Custom": customWidth and customHeight required (integers, 50–2000 mm).
5. Render `Dialog` (maxWidth="sm", fullWidth) with `DialogTitle`, `DialogContent` (dividers), `DialogActions`.
6. Form fields:
   - `TextField` for name (label "Template Name", required).
   - `FormControl` + `Select` for category (required).
   - `TextField` multiline rows={3} for description (optional, max 500 chars with counter).
   - `ToggleButtonGroup` exclusive for orientation (Landscape / Portrait).
   - `FormControl` + `Select` for size (A4, Letter, Legal, A3, Custom).
   - If size="Custom": two `TextField`s for width and height (mm).
   - `RadioGroup` for startFrom: "Blank Template" / "Copy Existing Template".
   - If startFrom="copy": `Autocomplete` for selecting an existing published template (search by name).
7. Error `Alert` within dialog if creation mutation fails.
8. Submit handler:
   - Validate all fields.
   - Call `useTemplateListStore.createTemplate(input)`.
   - On success: `onCreated(template)` (parent navigates to editor), reset form, `onClose()`.
   - On error: set error state.
9. "Create" button: MUI `LoadingButton` from `@mui/lab`, variant="contained", `loading={creating}`.
10. "Cancel" button: `Button` onClick `onClose`.
11. All user-facing text via i18n: `templateList.createDialog.*`.

**i18n keys:**
- `templateList.createDialog.title` — "Create Template"
- `templateList.createDialog.fields.name` — "Template Name"
- `templateList.createDialog.fields.category` — "Category"
- `templateList.createDialog.fields.description` — "Description"
- `templateList.createDialog.fields.orientation` — "Orientation"
- `templateList.createDialog.fields.orientationLandscape` — "Landscape"
- `templateList.createDialog.fields.orientationPortrait` — "Portrait"
- `templateList.createDialog.fields.size` — "Size"
- `templateList.createDialog.fields.customWidth` — "Width (mm)"
- `templateList.createDialog.fields.customHeight` — "Height (mm)"
- `templateList.createDialog.fields.startFrom` — "Start From"
- `templateList.createDialog.fields.blankTemplate` — "Blank Template"
- `templateList.createDialog.fields.copyExisting` — "Copy Existing Template"
- `templateList.createDialog.fields.copyFromPlaceholder` — "Search published templates..."
- `templateList.createDialog.errors.nameRequired` — "Template name is required"
- `templateList.createDialog.errors.nameExists` — "A template with this name already exists"
- `templateList.createDialog.errors.categoryRequired` — "Category is required"
- `templateList.createDialog.errors.customSizeRequired` — "Width and height are required for custom size"
- `templateList.createDialog.createButton` — "Create"
- `templateList.createDialog.cancelButton` — "Cancel"

**Dependencies:** T04 (store — `openCreateDialog`, `closeCreateDialog`, `createTemplate`), T06 (types — `CertTemplateCreateInput`).

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T16","files":["frontend/views/dashboard/cert/templates/list/CreateTemplateDialog.tsx"]}'
```

---

### T17 — useTemplateListStore Zustand Store

**Description:** Create the `useTemplateListStore` Zustand store managing template list page state: templates data, loading, error, filter/search/sort/viewMode state, selected IDs, create dialog open state, and actions for loading, filter changes, selection toggling, CRUD operations (create, duplicate, delete, archive), and dialog open/close. Persists `viewMode` to `localStorage`.

**Files:**
- `frontend/stores/cert/templateListStore.ts` (new)

**Sub-tasks:**
1. Create `templateListStore.ts`.
2. Read `frontend/stores/AGENTS.md` and `frontend/common/stores/AGENTS.md` for Zustand conventions (serialization of `Set`, persist middleware, selector usage).
3. Define `TemplateListState` interface as specified in design.md §10.9.
4. Initialize state: `templates: []`, `loading: false`, `error: null`, `searchQuery: ''`, `categoryFilter: 'all'`, `statusFilter: 'all'`, `sortBy: 'modified'`, `viewMode: 'card'`, `selectedIds: []`, `createDialogOpen: false`.
5. Implement `loadTemplates`:
   - Set `loading=true`, `error=null`.
   - Call Apollo `useQuery`/`client.query` with `CERT_TEMPLATES_QUERY` and filter/sort variables derived from store state.
   - On success: set `templates`, set `loading=false`.
   - On error: set `error`, set `loading=false`.
6. Implement filter setters: `setSearchQuery`, `setCategoryFilter`, `setStatusFilter`, `setSortBy` — each resets `selectedIds=[]` and triggers `loadTemplates()` via `useEffect` subscriber.
7. Implement `setViewMode` — sets `viewMode`; persisted to localStorage.
8. Implement selection: `toggleSelection(id)` — add/remove from a `Set<string>` internally, serialize to `string[]`; `clearSelection()` — empties the set.
9. Implement `openCreateDialog` / `closeCreateDialog` — set boolean state.
10. Implement `createTemplate(input)`:
    - Call `CERT_TEMPLATE_CREATE_MUTATION`.
    - On success: prepend to `templates`, call `closeCreateDialog()`, return created template.
    - On error: set error, rethrow.
11. Implement `duplicateTemplate(id)`:
    - Optimistic: add a placeholder to `templates` (optional).
    - Call `CERT_TEMPLATE_DUPLICATE_MUTATION`.
    - On success: refetch or add returned template to `templates`.
    - On error: rollback optimistic entry.
12. Implement `deleteTemplate(id)`:
    - Optimistic: remove from `templates`.
    - Call `CERT_TEMPLATE_DELETE_MUTATION`.
    - On error: rollback, restore in `templates`.
13. Implement `archiveTemplate(id)`:
    - Call `CERT_TEMPLATE_ARCHIVE_MUTATION` (or update status via mutation).
    - Update status of template in `templates`.
14. Configure `persist` middleware: persist ONLY `viewMode` with `name: 'cert-template-list-preferences'`, `partialize` to extract `viewMode`.
15. Use `createJSONStorage(() => localStorage)` for persistence.

**Dependencies:** T05 (GraphQL documents), T06 (types).

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T17","files":["frontend/stores/cert/templateListStore.ts"]}'
```

---

### T18 — Sidebar Navigation Entries

**Description:** Add the "Certificates" group with "Templates", "Certificates", and "Recipient Groups" items to the dashboard sidebar navigation. Templates item has sub-items: All Templates, Drafts, Published. Wire navigation to the correct routes and use the specified icons.

**Files:**
- `frontend/components/layout/Sidebar.tsx` (modified — or the sidebar config file, depending on the pattern)
- `frontend/common/navigation/sidebarConfig.ts` (or equivalent config file — check existing pattern)

**Sub-tasks:**
1. Read existing sidebar navigation configuration to understand the pattern (is it a config file, a component tree, or a registry?).
2. Add "Certificates" as a `group` with label (i18n: `sidebar.certificates`).
3. Add "Templates" as an `item` under "Certificates":
   - Rout: `/[locale]/dashboard/cert/templates`
   - Icon: `DescriptionOutlined`
   - Permission gate: `cert.template.read`
4. Add "Templates" sub-items:
   - "All Templates" → `/[locale]/dashboard/cert/templates` (no query param)
   - "Drafts" → `/[locale]/dashboard/cert/templates?status=draft`
   - "Published" → `/[locale]/dashboard/cert/templates?status=published`
5. Add "Certificates" as an `item`:
   - Route: `/[locale]/dashboard/cert/certificates`
   - Icon: `VerifiedOutlined`
   - Permission gate: `cert.certificate.read`
6. Add "Recipient Groups" as an `item`:
   - Route: `/[locale]/dashboard/cert/recipient-groups`
   - Icon: `GroupOutlined`
   - Permission gate: `cert.recipient-group.read`
7. i18n labels for all sidebar entries.

**i18n keys:**
- `sidebar.certificates` — "Certificates"
- `sidebar.cert.templates` — "Templates"
- `sidebar.cert.templates.all` — "All Templates"
- `sidebar.cert.templates.drafts` — "Drafts"
- `sidebar.cert.templates.published` — "Published"
- `sidebar.cert.certificates` — "Certificates"
- `sidebar.cert.recipientGroups` — "Recipient Groups"

**Dependencies:** Existing sidebar navigation infrastructure.

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T18","files":["frontend/components/layout/Sidebar.tsx"]}'
```

---

### T19 — Mobile Responsive Layout

**Description:** Implement responsive behavior for the template list page on mobile/tablet breakpoints. Grid view collapses to single column, table view switches to card list, filter bar collapses into a bottom sheet, and search becomes a full-width sticky bar.

**Files:**
- `frontend/views/dashboard/cert/templates/list/TemplateListPage.tsx` (modified)
- `frontend/views/dashboard/cert/templates/list/TemplateGrid.tsx` (modified — if separate component, or inline in TemplateListPage)

**Sub-tasks:**
1. In `TemplateListPage.tsx`:
   - Add mobile sticky search `TextField` with `sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', display: { xs: 'block', md: 'none' } }}`.
   - Add mobile Filter `IconButton` with `sx={{ display: { xs: 'flex', md: 'none' } }}` that opens a bottom `Drawer`.
   - Render `FilterBar` Stack with `direction={{ xs: 'column', md: 'row' }}` so it wraps on mobile.
2. Mobile filter bottom sheet: `Drawer` anchor="bottom" with `Select`s for Category, Status, Sort and an "Apply Filters" `Button`.
3. Grid view responsive: use `Grid` container with `xs={12} sm={6} md={4} lg={3}` so it shows 1 card on mobile, 2 on tablet, 3-4 on desktop.
4. List view responsive: on mobile (`display: { xs: 'block', md: 'none' }`), render a card list (reuse `TemplateCard` in single-column `Grid`); on desktop (`display: { xs: 'none', md: 'block' }`), render the `TemplateListTable`.
5. Mobile bottom navigation bar: render the four-tab `BottomNavigation` for Templates, Certificates, Recipients, Generate — use `sx={{ display: { xs: 'flex', md: 'none' } }}` to show only on mobile.
6. Add `IconButton` with `FilterListOutlined` for mobile filter trigger.
7. Hide columns "Variables" in table view on tablet (md).
8. All labels via i18n.

**i18n keys:**
- `templateList.mobile.filters` — "Filters"
- `templateList.mobile.applyFilters` — "Apply Filters"
- `templateList.bottomNav.templates` — "Templates"
- `templateList.bottomNav.certificates` — "Certificates"
- `templateList.bottomNav.recipients` — "Recipients"
- `templateList.bottomNav.generate` — "Generate"

**Dependencies:** T12 (TemplateListPage), T13 (TemplateCard), T14 (TemplateListTable).

**Verification:**
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-T19","files":["frontend/views/dashboard/cert/templates/list/TemplateListPage.tsx"]}'
```

---

### T20 — Component Tests (5 Test Files)

**Description:** Write comprehensive component-level tests for each new UI component using the project's test conventions (Vitest + Happy DOM + mocked Apollo). Each component test file covers rendering, user interactions, and edge cases.

**Files:**
1. `test/ui/components/cert/templates/TemplateListPage.test.tsx` (new)
2. `test/ui/components/cert/templates/TemplateCard.test.tsx` (new)
3. `test/ui/components/cert/templates/TemplateListTable.test.tsx` (new)
4. `test/ui/components/cert/templates/CreateTemplateDialog.test.tsx` (new)
5. `test/ui/components/cert/templates/templateListStore.test.ts` (new — store unit test)

**Sub-tasks:**

#### Test File 1: TemplateListPage.test.tsx
- Render with mocked Apollo provider returning a list of 3 templates.
- Renders title, subtitle with count.
- Renders search field, category select, status select, sort select.
- Renders view-mode toggle.
- Clicking "Create Template" button opens `CreateTemplateDialog`.
- Changing search field updates store `searchQuery`.
- Changing category filter updates store `categoryFilter`.
- Switching view mode from grid to table renders `TemplateListTable`.
- Renders error Alert when store error is set.
- Renders loading skeleton when `loading=true`.
- Reads URL params on mount (status=draft) and sets store filter.
- Each test: mock Apollo `useQuery` to return controlled data, assert rendered output.

#### Test File 2: TemplateCard.test.tsx
- Render a single `TemplateCard` with a mock template.
- Shows template name.
- Shows category chip with correct color.
- Shows status chip with correct color (Draft=warning, Published=success, Archived=default).
- Shows last modified date formatted.
- Shows variable count.
- Click on card body calls `onEdit`.
- Click on Edit IconButton calls `onEdit` (not card body click propagation).
- Click on Duplicate IconButton calls `onDuplicate`.
- Click on More menu opens menu with Preview, Export, Publish, Archive, Delete.
- Click on Delete menu item opens confirmation dialog.
- Confirm in delete dialog calls `onDelete`.
- Hover effect sets elevation (optional — test via `data-testid` or mock).

#### Test File 3: TemplateListTable.test.tsx
- Render with a list of 5 templates.
- Shows all 5 rows.
- Header "select all" checkbox selects all rows.
- Clicking individual row checkbox toggles selection.
- Bulk actions bar appears when selection non-empty.
- Bulk actions bar shows "{N} selected".
- Clicking "Clear" in bulk bar clears selection.
- Row click calls `onEdit`.
- Sort on "Name" column toggles asc/desc sort icon.
- Pagination changes page when clicking next page.
- Changing rows per page updates the table.
- Action buttons (Edit, Duplicate, More menu) render per row.

#### Test File 4: CreateTemplateDialog.test.tsx
- Render with `open=true`.
- Shows all form fields: name, category, description, orientation toggle, size select.
- Shows "Start From" radio group.
- Validation: empty name shows error on blur.
- Validation: name not unique shows "A template with this name already exists" error.
- Validation: category required shows error.
- Selecting "Custom" size reveals width and height fields.
- Selecting "Copy Existing Template" reveals the template picker Autocomplete.
- Fill + click "Create" calls `createTemplate` — shows loading spinner on button.
- On success: `onCreated` callback called, dialog closed.
- On error: error Alert shown within dialog.
- Click "Cancel" closes dialog without calling create.

#### Test File 5: templateListStore.test.ts
- Initial state assertions (templates=[], loading=false, etc.).
- `setSearchQuery('hello')` updates `searchQuery`.
- `setCategoryFilter('academic')` updates `categoryFilter` and clears `selectedIds`.
- `setStatusFilter('draft')` updates `statusFilter` and clears `selectedIds`.
- `setSortBy('name-asc')` updates `sortBy`.
- `setViewMode('table')` updates `viewMode`.
- `toggleSelection('id1')` adds to selectedIds; calling again removes.
- `clearSelection()` empties selectedIds.
- `openCreateDialog()` sets `createDialogOpen=true`.
- `closeCreateDialog()` sets `createDialogOpen=false`.
- `loadTemplates` sets loading=true during fetch, sets templates on success, sets error on failure (mock Apollo client).
- `createTemplate` adds to templates array and closes dialog.
- `deleteTemplate` removes from templates (optimistic), rollback on error.
- `duplicateTemplate` adds to templates.
- `viewMode` persistence: verify `localStorage` key is read/written.
- Use `renderHook` from `@testing-library/react` for Zustand store tests.

**Dependencies:** T12, T13, T14, T16, T17.

**Testing Conventions:**
- Read `test/ui/AGENTS.md` before writing tests.
- Use Vitest + Happy DOM + `@testing-library/react`.
- Mock Apollo provider with `MockedProvider`.
- No real server — all data mocked.
- Test file location: `test/ui/components/cert/templates/`.

**Verification:**
```bash
# Run all 5 test files together with log capture
for test_file in \
  test/ui/components/cert/templates/TemplateListPage.test.tsx \
  test/ui/components/cert/templates/TemplateCard.test.tsx \
  test/ui/components/cert/templates/TemplateListTable.test.tsx \
  test/ui/components/cert/templates/CreateTemplateDialog.test.tsx \
  test/ui/components/cert/templates/templateListStore.test.ts; do
  bun run scripts/run-test/run-test.ts "$test_file"
done
```

---

### T21 — E2E Tests (6 Test Files)

**Description:** Write end-to-end (E2E) tests using Playwright against a production build server. Tests cover: creating a template (dialog flow), listing in grid view, listing in table view, filtering/searching, duplicating a template, and deleting a template. Each E2E test file uses the project's E2E conventions.

**Prerequisites:** `bun run build:test` must be run before E2E tests to generate the production bundle in `.next-test-prod`.

**Files:**
1. `test/ui/e2e/cert/templates/create-template.spec.ts` (new)
2. `test/ui/e2e/cert/templates/list-grid-view.spec.ts` (new)
3. `test/ui/e2e/cert/templates/list-table-view.spec.ts` (new)
4. `test/ui/e2e/cert/templates/filter-search.spec.ts` (new)
5. `test/ui/e2e/cert/templates/duplicate-template.spec.ts` (new)
6. `test/ui/e2e/cert/templates/delete-template.spec.ts` (new)

**Sub-tasks:**

#### E2E Test 1: create-template.spec.ts
- Navigate to `/dashboard/cert/templates`.
- Click "Create Template" button.
- Verify dialog opens.
- Fill in name "E2E Test Template".
- Select category "Academic".
- Select orientation "Landscape".
- Select size "A4".
- Click "Create" button.
- Verify navigation to editor page.
- Verify the template appears in the sidebar or template list.

#### E2E Test 2: list-grid-view.spec.ts
- Navigate to `/dashboard/cert/templates`.
- Verify grid view is the default (or stored preference).
- Verify template cards render.
- Verify each card shows name, category chip, status chip, modified date, variable count.
- Click on a card — verify navigation to editor page.
- Verify hover effect (card elevation changes) — optional, via mouse hover.

#### E2E Test 3: list-table-view.spec.ts
- Navigate to `/dashboard/cert/templates`.
- Switch to table (list) view using the toggle button.
- Verify table renders with columns: checkbox, thumbnail, name, category, status, variables, modified, actions.
- Verify pagination control is visible.
- Click "select all" checkbox — verify all rows selected and bulk actions bar appears.
- Click row — verify navigation to editor.
- Change rows per page to 50 — verify table updates.

#### E2E Test 4: filter-search.spec.ts
- Navigate to `/dashboard/cert/templates`.
- Type in search field — verify template list filters by name.
- Select category filter — verify only templates of that category show.
- Select status filter — verify only templates of that status show.
- Change sort — verify order changes.
- Navigate via sidebar to "Drafts" — verify status=draft filter applied.
- Navigate via sidebar to "Published" — verify status=published filter applied.
- Navigate via URL `?category=academic` — verify category filter applied on load.

#### E2E Test 5: duplicate-template.spec.ts
- Navigate to `/dashboard/cert/templates`.
- Click "Duplicate" button on a template card (or table row).
- Verify a new template appears with "(Copy)" or similar suffix in the name.
- Verify the duplicate has the same category and size.
- Verify the duplicate status is "Draft".
- Verify a success snackbar/toast appears.

#### E2E Test 6: delete-template.spec.ts
- Navigate to `/dashboard/cert/templates`.
- Click "More" menu on a template card, then click "Delete".
- Verify confirmation dialog appears with the template name.
- Click "Cancel" — verify dialog closes and template still exists.
- Reopen delete dialog, click "Delete" confirm button.
- Verify the template no longer appears in the list.
- Verify success snackbar/toast appears.
- Also test bulk delete: select multiple rows, click bulk "Delete", confirm, verify all deleted.

**E2E Test Conventions:**
- Read `test/ui/AGENTS.md` before writing E2E tests.
- Use Playwright test runner against production server (`.next-test-prod`).
- Run `bun run build:test` before the test suite.
- Test files in `test/ui/e2e/cert/templates/`.
- Use realistic seed data or create data via API/test setup.
- Each test should be independent and idempotent — clean up created data.

**Verification:**
```bash
# Build production bundle for E2E first
bun run build:test

# Run each E2E test file
for test_file in \
  test/ui/e2e/cert/templates/create-template.spec.ts \
  test/ui/e2e/cert/templates/list-grid-view.spec.ts \
  test/ui/e2e/cert/templates/list-table-view.spec.ts \
  test/ui/e2e/cert/templates/filter-search.spec.ts \
  test/ui/e2e/cert/templates/duplicate-template.spec.ts \
  test/ui/e2e/cert/templates/delete-template.spec.ts; do
  bun run scripts/run-test/run-test.ts "$test_file"
done
```

---

### T22 — Quality Loop Per File

**Description:** For every file created or modified in T12–T21, run the project's per-file quality loop (`scripts/health/sub-loop.ts`) to ensure each file passes tsgo → biome → lint-queue-client → codescene progressively. Fix any failures before moving to the next file.

**Files:** All files created in T12–T21.

**Sub-tasks:**
1. Start the lint queue server in background: `~/.bun/bin/bun run scripts/lint-queue-server.ts`.
2. Health check: `curl -s http://localhost:${LINT_QUEUE_PORT}/status`.
3. For each file created, run:
   ```bash
   bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
   ```
4. The sub-loop runs progressive checks (tsgo → biome → lint → codescene) and short-circuits at the first failing check.
5. Fix any issues found, re-run the sub-loop until exit code 0.
6. For instruction-file / AGENTS.md discovery: the sub-loop automatically prints applicable instruction files (`.github/instructions/*.instructions.md`) and AGENTS.md files. Read ALL listed files before fixing.
7. After all individual files pass, run `bun quality-gate` for full-project verification.
8. If CODESCENE fails on a file: run `bun run codescene --file <path>` to get detailed report and fix.
9. If SONAR_RESULTS fails: use `bun scripts/sonar-manager.ts` (read-only queries) — but sub-agents never run sonar-scan.

**File List for Quality Loop:**

| Task | File(s) |
|------|---------|
| T12 | `frontend/views/dashboard/cert/templates/list/TemplateListPage.tsx` |
| T13 | `frontend/views/dashboard/cert/templates/list/TemplateCard.tsx` |
| T14 | `frontend/views/dashboard/cert/templates/list/TemplateListTable.tsx` |
| T15 | (same as T14) |
| T16 | `frontend/views/dashboard/cert/templates/list/CreateTemplateDialog.tsx` |
| T17 | `frontend/stores/cert/templateListStore.ts` |
| T18 | sidebar config files (TBD) |
| T19 | `frontend/views/dashboard/cert/templates/list/TemplateListPage.tsx` (modified) |
| T20 | 5 test files in `test/ui/components/cert/templates/` |
| T21 | 6 E2E test files in `test/ui/e2e/cert/templates/` |

**Verification:**
```bash
# Each file passes the sub-loop
for file in \
  frontend/views/dashboard/cert/templates/list/TemplateListPage.tsx \
  frontend/views/dashboard/cert/templates/list/TemplateCard.tsx \
  frontend/views/dashboard/cert/templates/list/TemplateListTable.tsx \
  frontend/views/dashboard/cert/templates/list/CreateTemplateDialog.tsx \
  frontend/stores/cert/templateListStore.ts; do
  bun run scripts/health/sub-loop.ts "$file" --lifecycle codescene
done

# Full quality gate
bun quality-gate
```

---

### T23 — Knowledge Propagation

**Description:** Ensure knowledge from this plan's implementation is propagated to relevant documentation, AGENTS.md files, and cross-plan dependencies so future plans can integrate correctly.

**Files:**
- `frontend/views/dashboard/cert/AGENTS.md` (create or update — document the templates directory structure)
- `frontend/stores/AGENTS.md` (update — document the `templateListStore` in the store registry)
- Cross-plan handoff notes (inline in each dependent plan's design.md):

**Sub-tasks:**
1. **Document directory structure in frontend/views/dashboard/cert/AGENTS.md:**
   - List the `templates/list/` directory and its components (`TemplateListPage`, `TemplateCard`, `TemplateListTable`, `CreateTemplateDialog`).
   - Document the props interfaces and store integration for each.
   - Note the route: `/[locale]/dashboard/cert/templates`.
   - Document the query-param-based filtering (`?status=`, `?category=`).

2. **Document the store in frontend/stores/AGENTS.md:**
   - Register `templateListStore` in the store registry section.
   - Document persisted state (`viewMode` to `localStorage`).
   - Document the `Set<string>` selection pattern and serialization rule.
   - Document Apollo cache eviction patterns used in CRUD actions.

3. **Cross-plan handoff notes for dependent plans:**
   - **Plan 10 (Desktop Editor):** The editor route `/[locale]/dashboard/cert/templates/[id]/edit` is the navigation target for card click and Edit buttons. Template data is passed via Apollo cache or refetch. The editor should call `loadTemplates` after save to refresh the list.
   - **Plan 11 (Mobile Editor):** Same as Plan 10 but for mobile. The mobile bottom navigation "Generate" tab links to Plan 17's generation flow.
   - **Plan 09 (Categories):** The category filter and `CreateTemplateDialog` category select should use the categories from Plan 09. Until Plan 09 is complete, the category select shows a hardcoded list (Academic, Achievement, Completion, Participation, Custom) with graceful degradation.
   - **Plan 14 (Recipient Groups):** Sidebar "Recipient Groups" item links to Plan 14's route. Until Plan 14 is complete, the sidebar item is permission-gated and may 404.
   - **Plan 16 (Certificate List):** Sidebar "Certificates" item links to Plan 16's route. Same caveat.
   - **Plan 17 (Certificate Generation):** Mobile bottom navigation "Generate" tab and card "More" menu "Export" action link to Plan 17. Until complete, these are disabled (feature flag or "coming soon").

4. **i18n key catalog update:**
   - Ensure all i18n keys created in T12–T19 are documented in the shared/locale i18n key catalog (if one exists) or referenced in this plan's design.md §8 (key catalog section).
   - Verify all keys exist in both `en/` and `ar/` locale files.
   - Verify pluralization rules are correctly implemented (e.g., `templateList.card.variables` pluralized for 0, 1, 2-10, 11+ in Arabic).

5. **Permission constants:**
   - Verify `cert.template.read`, `cert.template.create`, `cert.template.update`, `cert.template.delete` are defined in the `AppPermission` enum in `backend/enum/`.
   - If any are missing, raise a cross-file dependency to the backend plan (Plan 02).

6. **Document the route table:**
   - Ensure the routes table (design.md §10.7) is referenced in the app router `app/AGENTS.md` or the frontend routing config documentation.
   - This helps future plans know which routes exist and their permissions.

7. **Lessons learned:**
   - After T12–T21 are complete, document any interesting patterns, gotchas, or issues encountered in this section.
   - Examples: "MUI DataGrid vs raw Table decision rationale for T15", "Optimistic delete rollback pattern in T17", "Mobile bottom sheet animation gotchas in T19".

**Dependencies:** All prior tasks (T12–T22) should be complete or in progress.

**Verification:**
```bash
# Verify AGENTS.md files are updated
bun tsgo
bun biome:check
bun run lint

# Verify no broken cross-references
grep -r "dashboard/cert/templates" frontend/views/dashboard/cert/AGENTS.md
grep -r "templateListStore" frontend/stores/AGENTS.md
```

---

## Task Dependency Graph Summary (T12–T23)

```
T04 (store - original) ──┬──> T17 (useTemplateListStore)
                         │         │
T05 (documents) ─────────┼─────────┤
                         │         │
T06 (types) ─────────────┼─────────┤
                         │         ├──> T12 (TemplateListPage) ──> T19 (Mobile)
                         │         │         │
                         │         ├──> T13 (TemplateCard) ────────┤
                         │         │         │                       ├──> T20 (Component Tests)
                         │         ├──> T14 (TemplateListTable) ────┤       │
                         │         │         │                       │       ├──> T21 (E2E Tests)
                         │         ├──> T15 (AppDataGrid) ───────────┘       │       │
                         │         │                                         │       │
                         │         ├──> T16 (CreateTemplateDialog) ──────────┘       │
                         │         │                                                 │
                         │         ├──> T18 (Sidebar Nav) ────────────────────────────┤
                         │         │                                                 │
                         │         └────────────────────────────────────────────> T22 (Quality Loop) ──> T23 (Knowledge)
```

| Task | Depends On | Blocks | Lifecycle |
|------|-----------|--------|-----------|
| T12 | T04, T05, T06 | T19, T20, T21 | UI |
| T13 | T06, T07 | T12, T20, T21 | UI |
| T14 | T06, T13 | T12, T15, T20, T21 | UI |
| T15 | T14 | T20, T21 | UI |
| T16 | T04, T06 | T12, T20, T21 | UI |
| T17 | T05, T06 | T12, T16, T20 | Store |
| T18 | (sidebar infra) | T21 | Navigation |
| T19 | T12, T13, T14 | T21 | UI |
| T20 | T12, T13, T14, T16, T17 | T22 | Testing |
| T21 | T19, T16 | T22 | E2E |
| T22 | T12–T21 | T23 | Quality |
| T23 | T22 | — | Documentation |

## Round 4 Enhancement Tasks

### R4-T1: Accessibility & ARIA Implementation
- [ ] Create `frontend/views/dashboard/certificates/template-list/components/AccessibleList.tsx`
  - Implement tab order management with `tabIndex` and `onKeyDown` handlers
  - Add `aria-label` to all interactive elements (buttons, links, checkboxes)
  - Add `aria-live="polite"` region for dynamic list updates (filter changes, new items)
  - Add `aria-busy` on list container during loading
  - Add `role="list"` and `role="listitem"` on card/grid views
  - Add `aria-selected` on selectable items
  - Add `role="status"` for toast notifications
  - Implement focus trap in modals (create dialog, delete confirmation)
  - Add `prefers-reduced-motion` media query for animations
  - _sx prop usage: `sx={{ '& .MuiCard-root:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}`_
  - **Quality loop**: `bun run scripts/health/sub-loop.ts frontend/views/dashboard/certificates/template-list/components/AccessibleList.tsx --lifecycle codescene`
  - **Instructions**: Read `frontend/AGENTS.md`, `.github/instructions/frontend.instructions.md`

### R4-T2: Loading & Skeleton States
- [ ] Create `frontend/views/dashboard/certificates/template-list/components/ListSkeleton.tsx`
  - MUI v9 Skeleton components matching card/table layout dimensions
  - `skeletonType` prop: 'card' | 'table-row' | 'sidebar'
  - Progressive loading with IntersectionObserver on scroll container
  - Shimmer animation via `sx={{ animation: 'shimmer 1.5s infinite' }}`
  - Stale-while-revalidate: show skeleton only on first load, show stale data on refetch with opacity reduction
  - Optimistic updates: immediate card update with revert on error
  - _Example skeleton: `<Skeleton variant="rectangular" sx={{ width: '100%', height: 200, borderRadius: 2 }} />`_
  - **Quality loop**: tsgo + biome + lint queue client

### R4-T3: Empty State Components
- [ ] Create `frontend/views/dashboard/certificates/template-list/components/EmptyStates.tsx`
  - `NoTemplatesState`: illustration SVG + "Create Your First Template" CTA button
  - `NoSearchResultsState`: "No results for '{query}'" + suggestions chips + clear filters button
  - `NoFavoritesState`: "No favorited templates yet" + browse templates link
  - `FilteredEmptyState`: "No templates match your filters" + reset filters button
  - `ErrorState`: error icon + message + retry button with `onClick` handler
  - Each state uses MUI v9 Stack with `sx={{ textAlign: 'center', py: 8, gap: 2 }}`
  - Illustrations as inline SVG (no external deps)
  - **Quality loop**: tsgo + biome + lint

### R4-T4: Error Boundaries
- [ ] Create `frontend/views/dashboard/certificates/template-list/components/ListErrorBoundary.tsx`
  - React error boundary class component with `componentDidCatch`
  - Fallback UI: error icon + message + "Try Again" button
  - Network error recovery: detect network errors, show offline indicator
  - Toast notification via Material UI Snackbar
  - Offline indicator bar at top of page (yellow background)
  - Retry queue: failed requests stored in Zustand, auto-retry on reconnect
  - _Store update: `templateListStore` adds `retryQueue: ErrorEntry[]` and `addRetry()` action_
  - **Quality loop**: tsgo + biome + lint

### R4-T5: Pagination & Virtualization
- [ ] Create `frontend/views/dashboard/certificates/template-list/components/VirtualizedList.tsx`
  - Infinite scroll with IntersectionObserver (root margin 100px)
  - Page size selector: 12 / 24 / 48 items (SegmentedControl or Select)
  - Total count display: "Showing {n} of {total} templates"
  - Virtualized table view with `react-window` FixedSizeList
  - Virtualized card grid with `react-window` VariableSizeGrid
  - Each virtualized row/card receives `index` and `style` props
  - Scroll restoration on filter change (reset to top)
  - _Store update: `templateListStore` adds `pageSize`, `cursor`, `hasMore`, `totalCount`_
  - **Quality loop**: tsgo + biome + lint

### R4-T6: Advanced Search & Filters
- [ ] Create `frontend/views/dashboard/certificates/template-list/components/AdvancedFilters.tsx`
  - Full-text search input with MUI v9 TextField (debounced 300ms via `useDeferredValue`)
  - Filter chips: removable chips for each active filter (status, category, date)
  - Saved filter presets: name input + save button + preset dropdown
  - Filter URL sync: `useSearchParams` from `next/navigation` to persist filters in URL
  - Date range picker: MUI v9 DatePicker with `minDate`/`maxDate`
  - Multi-select status filter: Checkbox list with "Active", "Draft", "Archived"
  - Category filter: Tree select from category hierarchy
  - Reset all filters button
  - _Store update: `templateListStore` adds `searchQuery`, `filters`, `savedPresets`_
  - **Quality loop**: tsgo + biome + lint

### R4-T7: Bulk Actions
- [ ] Create `frontend/views/dashboard/certificates/template-list/components/BulkActions.tsx`
  - Select-all checkbox with indeterminate state (partially selected)
  - Bulk action toolbar (appears when > 0 selected): Archive, Delete, Duplicate, Export
  - Confirmation dialog showing count: "Archive 12 templates?" with Cancel/Confirm
  - Undo toast with 10s timeout: "12 templates archived" + Undo button
  - Bulk export: triggers export with selected template IDs
  - _Store update: `templateListStore` adds `selectedIds: string[]`, `selectAll()`, `toggleSelect()`, `clearSelection()`_
  - **Quality loop**: tsgo + biome + lint

### R4-T8: Responsive Breakpoint Implementation
- [ ] Update `frontend/views/dashboard/certificates/template-list/TemplateListPage.tsx`
  - Mobile (< 768px): single column cards, bottom navigation bar, simplified filters
  - Tablet (768-1024px): 2-column grid, collapsible sidebar
  - Desktop (> 1024px): 3-4 column grid or table view toggle, full sidebar
  - 4K (> 2560px): max-width container (1400px) centered with auto margins
  - Use MUI v9 `useMediaQuery` + theme breakpoints
  - Toggle between card/table views visible only on desktop
  - _Example: `const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))`_
  - **Quality loop**: tsgo + biome + lint

### R4-T9: Keyboard Shortcuts
- [ ] Create `frontend/views/dashboard/certificates/template-list/hooks/useListShortcuts.ts`
  - `/` → focus search input
  - `n` → open create template dialog
  - `r` → refresh list (refetch Apollo query)
  - `Esc` → clear all filters + deselect
  - `Cmd+A` → select all (desktop only)
  - `ArrowDown` / `ArrowUp` → navigate table rows (table view)
  - `Enter` → open selected template
  - `Delete` → archive selected (with confirmation)
  - Global keyboard handler with `useEffect` and event listener
  - Conflict prevention: check if focus is in input/textarea before triggering
  - **Quality loop**: tsgo + biome + lint

### R4-T10: Performance Budget Tests
- [ ] Create `test/ui/components/template-list/Performance.test.tsx`
  - Test: list of 100 items renders in < 16ms per item
  - Test: filter apply completes in < 100ms
  - Test: search debounced at 300ms
  - Test: virtualized list renders only visible items (mock IntersectionObserver)
  - Test: bundle import is < 50KB (bundle analyzer mock)
  - **Quality loop**: tsgo + biome + lint

### R4-T11: Component Tests for New States
- [ ] Create `test/ui/components/template-list/LoadingStates.test.tsx`
  - Test skeleton renders correct shape for card view
  - Test skeleton renders correct shape for table view
  - Test stale-while-revalidate shows old data during refetch
  - Test optimistic update shows immediately
  - Test optimistic rollback on error
- [ ] Create `test/ui/components/template-list/EmptyStates.test.tsx`
  - Test each empty state renders correct illustration and CTA
  - Test CTA button triggers correct action
  - Test clear filters button resets all filters
  - Test retry button calls refetch
- [ ] Create `test/ui/components/template-list/ErrorStates.test.tsx`
  - Test error boundary catches render errors
  - Test network error shows offline indicator
  - Test retry queue stores failed requests
  - Test toast notification appears on error
  - **Quality loop**: tsgo + biome + lint

### R4-T12: E2E Tests for Keyboard Shortcuts & Bulk Actions
- [ ] Create `test/ui/e2e/template-list-keyboard.spec.ts`
  - Navigate list with keyboard only
  - Press `/` to focus search, type query, verify results
  - Press `n` to open create dialog
  - Press `Esc` to clear filters
  - Select all with `Cmd+A`, verify count in toolbar
  - Bulk archive, verify undo toast, click undo, verify restoration
  - **Quality loop**: tsgo + biome + lint

### R4-T13: Knowledge Propagation
- [ ] Read all outcome files and synthesize learnings
  - Create `docs/frontend/template-list-patterns.md` with patterns: accessibility, loading states, virtualization, bulk actions
  - Update `frontend/AGENTS.md` with reference to new doc
  - Update root `AGENTS.md` Important References
  - Run `bun tsgo`, `bun biome:check`, `bun run lint`
  - Write outcome to `.ai/plans/cert-08-template-list/outcome/r4-knowledge-outcome.md`
