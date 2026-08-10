# Tasks — Plan 14: Recipient Group Management

> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)

## Task Dependency Graph

```
T01 (i18n types + translations)
  ↓
T02 (Zustand store)          T03 (GraphQL documents)    T03b (Types + Schemas + Utils)
  ↓                            ↓                            ↓
T04 (List ViewModel +         T05 (Create dialog)          |
     Switcher + Container +   T05b (Group operations       |
     Desktop + Mobile +       dialogs: duplicate, delete,  |
     App Router page)         change template)              |
  ↓                          ↓                             |
T06 (Detail ViewModel +      T07 (Student assignment       |
     Switcher + Container +   flow + remove confirm)        |
     Desktop + Mobile +      T07b (Import/Export members)  |
     App Router page)        ←—————————————┘              |
  ↓                                                        |
T08 (Variable value editor   ←——————————————————————————————┘
     + desktop row + mobile dialog + status badge)
  ↓
T09 (Navigation config + permissions + breadcrumbs)
  ↓
T10 (Mobile variants verification + infinite scroll)
  ↓
T11 (Knowledge propagation)
```

**Execution order**: T01 → (T02, T03, T03b via parallel subagents) → (T04, T05, T05b via parallel subagents) → (T06, T07, T07b via parallel subagents) → T08 → T09 → T10 → T11

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T01
- Tasks: T01
- Rationale: Foundation task — i18n types and translations required by all subsequent tasks

### Wave 2: T02, T03, T03b
- Tasks: T02, T03, T03b
- Rationale: No interdependencies — all depend only on T01 (i18n). T02 (Zustand store), T03 (GraphQL documents), and T03b (types, schemas, utilities) produce independent files with no shared imports.

### Wave 3: T04, T05, T05b
- Tasks: T04, T05, T05b
- Rationale: T04 depends on T02 + T03 + T03b (list page needs store, GraphQL docs, and types). T05 and T05b depend on T03 + T03b (dialogs need GraphQL docs and schemas). No interdependencies among the three — each produces separate view/dialog files.

### Wave 4: T06, T07, T07b
- Tasks: T06, T07, T07b
- Rationale: T06 depends on T04 (detail page follows list page pattern) and T05 + T05b (dialogs rendered in detail). T07 and T07b depend on T03 + T03b (GraphQL docs and types for student assignment and import/export). All three produce separate components with no circular dependencies.

### Wave 5: T08
- Tasks: T08
- Rationale: Per-recipient variable value editor depends on T06 (detail desktop/mobile views provide inline expansion targets) and T07 + T07b (assignment and import components for integration). Single task — no parallelization at this level.

### Wave 6: T09
- Tasks: T09
- Rationale: Group operations menu and navigation config depend on T08 (detail view integration complete). Single task.

### Wave 7: T10
- Tasks: T10
- Rationale: Mobile variants verification depends on T09 (navigation and operations menu complete). Single task.

### Final Wave: Knowledge Propagation
- Task: T11
- Rationale: Must run after all other tasks complete — synthesizes learnings from all outcome files

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## Execution Rules

- **Before starting any task**: Read ALL files in `.ai/plans/14-recipient-group-mgmt/outcome/`
- **After completing a task**: Write `.ai/plans/14-recipient-group-mgmt/outcome/<task-id>-outcome.md`
- **Update progress**: Mark `[x]` in tasks.md after each subtask

---

## T01: i18n Type Definitions and Translations

**Depends on**: (none — foundation task)

- [ ] 1.1 Create i18n type file `shared/locale/types/certificates/recipient-groups.ts`
  - Define `RecipientGroupsLabels` interface with 10 nested sub-domains: `list`, `create`, `detail`, `variables`, `operations`, `errors`, `importExport`, `permissions`, `breadcrumbs`, `serverValidation`
  - String keys for all 120+ keys listed in requirements.md Section 3
  - Pluralization function signatures: `(count: number) => string` for studentCount, removeConfirmMessage, addSuccessMessage, removeSuccessMessage, importPreviewTitle, exportConfirmTitle
  - Interpolation function signatures: `(field: string) => string`, `(min: number) => string`, `(added: number, skipped: number) => string`, `(min: string, max: string) => string`, `(key: string) => string`
  - _Requirements: REQ-14-A1 through H7 (i18n inline)_
  - **Files to create**: `shared/locale/types/certificates/recipient-groups.ts`
  - **Instruction files**: `frontend.instructions.md`, `shared/AGENTS.md`

- [ ] 1.2 Create Arabic translation file `shared/locale/ar/certificates/recipient-groups.ts`
  - Implement all keys with Arabic translations from requirements.md Section 3
  - Implement Arabic pluralization with zero/one/two/few/many branching
  - Implement interpolation with named-arg template literals
  - **Files to create**: `shared/locale/ar/certificates/recipient-groups.ts`
  - **Instruction files**: `frontend.instructions.md`, `shared/AGENTS.md`

- [ ] 1.3 Create English translation file `shared/locale/en/certificates/recipient-groups.ts`
  - Implement all keys with English translations
  - Implement English pluralization (zero/one/many)
  - Implement interpolation with named-arg template literals
  - **Files to create**: `shared/locale/en/certificates/recipient-groups.ts`
  - **Instruction files**: `frontend.instructions.md`, `shared/AGENTS.md`

- [ ] 1.4 Create namespace handle `shared/locale/namespaces/certificates/recipient-groups.namespace.ts`
  - Export the namespace configuration for the compile-time i18n system
  - Register the type, AR, and EN implementations
  - **Files to create**: `shared/locale/namespaces/certificates/recipient-groups.namespace.ts`
  - **Instruction files**: `frontend.instructions.md`, `shared/AGENTS.md`

- [ ] 1.5 Register the namespace in the certificates locale barrel
  - Add export to `shared/locale/namespaces/certificates/index.ts`
  - Verify the compile-time type system picks up the new namespace
  - **Files to modify**: `shared/locale/namespaces/certificates/index.ts`
  - **Instruction files**: `frontend.instructions.md`, `shared/AGENTS.md`

- [ ] 1.6 Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts shared/locale/types/certificates/recipient-groups.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/ar/certificates/recipient-groups.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/en/certificates/recipient-groups.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/namespaces/certificates/recipient-groups.namespace.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/locale/namespaces/certificates/index.ts --lifecycle codescene
  ```

- [ ] 1.7 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t01-outcome.md`

_**AGENTS.md files**: `shared/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T02: Zustand Store for Recipient Group Management

**Depends on**: T01
> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T03, T03b.

- [ ] 2.1 Create `frontend/common/stores/certRecipientGroupsStore.ts`
  - Follow Siraj Zustand pattern: `create<State>(set => ({...}))`, no `persist`
  - State fields: `searchQuery`, `page`, `pageSize`, `sortBy`, `sortDir`, `selectedGroupIds`, `createDialogOpen`, `editingGroupId`, `assignmentDialogOpen`, `variableEditorState: Record<string, { open, values, saving, errors }>`
  - Detail state fields: `detailStudentPage`, `detailStudentPageSize`, `detailStudentSearchQuery`, `operationsMenuAnchor`, `detailOperationsMenuAnchor`
  - Dialog flags: `duplicateDialogOpen`, `duplicateSourceGroupId`, `deleteDialogOpen`, `deleteTargetGroupId`, `changeTemplateDialogOpen`, `changeTemplateTargetGroupId`, `importDialogOpen`, `importTargetGroupId`
  - Actions: `setSearchQuery`, `setPage`, `setPageSize`, `setSortBy`, `setSortDir`, `toggleGroupSelection`, `clearSelection`, `openCreateDialog`, `closeCreateDialog`, `openAssignmentDialog`, `closeAssignmentDialog`, `openVariableEditor`, `closeVariableEditor`, `setVariableValue`, `resetEditor`, `openDuplicateDialog`, `closeDuplicateDialog`, `openDeleteDialog`, `closeDeleteDialog`, `openChangeTemplateDialog`, `closeChangeTemplateDialog`, `openImportDialog`, `closeImportDialog`, `setDetailStudentPage`, `setDetailStudentSearchQuery`, `setOperationsMenuAnchor`
  - `closeVariableEditor` deletes entry from `variableEditorState` to prevent memory leaks (per SWE review)
  - Import entity types from `graphql-types.ts` (not `operations.ts`)
  - _Requirements: All (state management for list, detail, dialogs, editor, import/export)_
  - **Files to create**: `frontend/common/stores/certRecipientGroupsStore.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 2.2 Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/stores/certRecipientGroupsStore.ts --lifecycle codescene
  ```

- [ ] 2.3 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t02-outcome.md`

_**AGENTS.md files**: `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T03: GraphQL Documents

**Depends on**: T01
> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T02, T03b.

- [ ] 3.1 Create `frontend/common/graphql/sharedDocuments/certificates/certificateRecipientGroup.documents.ts`
  - Define all GraphQL documents listed in the design.md Interface Contracts section
  - `RecipientGroupListQueryDocument` — paginated list with search, sort, pageInfo
  - `RecipientGroupDetailQueryDocument` — group + students + variable values + template variables
  - `CreateRecipientGroupMutationDocument`
  - `UpdateRecipientGroupMutationDocument`
  - `DeleteRecipientGroupMutationDocument`
  - `DuplicateRecipientGroupMutationDocument` — includes `clientRequestId` for idempotency
  - `AddStudentsToGroupMutationDocument` — returns `{ addedCount, skipped: [{studentId, studentName, reason}] }`
  - `RemoveStudentsFromGroupMutationDocument` — returns `{ removedCount }`
  - `UpsertVariableValuesMutationDocument` — returns `{ success, valueErrors: [{variableId, errorKey}] }`
  - `ImportGroupMembersMutationDocument` — accepts `{ groupId, csvData }`, returns `{ addedCount, skipped: [{studentId, studentName, reason}] }`
  - `StudentSearchQueryDocument` — server-side search excluding students already in group
  - `TemplateListForSelectQueryDocument` — published templates for dropdown
  - All queries include `id` field on every object type for Apollo cache normalization
  - Use `@apollo/client/react` import pattern (not `@apollo/client`)
  - NO `useLazyQuery` — use stateful `useQuery` exclusively
  - _Requirements: All (data layer for all features)_
  - **Files to create**: `frontend/common/graphql/sharedDocuments/certificates/certificateRecipientGroup.documents.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 3.2 Run per-file quality loop (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/certificates/certificateRecipientGroup.documents.ts --lifecycle codescene
  ```

- [ ] 3.3 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t03-outcome.md`

_**AGENTS.md files**: `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T03b: Types, Schemas, and Utilities

**Depends on**: T01
> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T02, T03.

- [ ] 3b.1 Create types file `frontend/common/views/dashboard/certificates/recipient-groups/types/recipientGroup.types.ts`
  - Define ViewModel return types: `RecipientGroupListViewModel`, `RecipientGroupDetailViewModel`
  - Define component prop interfaces: `RecipientGroupListContainerProps`, `RecipientGroupDetailViewContainerProps`
  - Define row types: `RecipientGroupListRow`, `RecipientGroupStudentRow`
  - Define `VariableEditorState` interface: `{ open: boolean, values: Record<string, unknown>, saving: boolean, errors: Array<{ variableId: string, errorKey: string }> }`
  - Import entity types from `graphql-types.ts`
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/types/recipientGroup.types.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 3b.2 Create Zod schemas file `frontend/common/views/dashboard/certificates/recipient-groups/schemas/recipientGroup.schema.ts`
  - `createRecipientGroupSchema`: name (min 1, max 100), description (optional, max 500), templateVersionId (required)
  - `duplicateRecipientGroupSchema`: newName (min 1, max 100), templateVersionId (required)
  - `variableValueSchema`: dynamic schema built from template variable definitions (text/number/date/select with constraints)
  - `importMembersSchema`: csvData (string, required)
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/schemas/recipientGroup.schema.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 3b.3 Create labels utility `frontend/common/views/dashboard/certificates/recipient-groups/utils/buildRecipientGroupLabels.ts`
  - `buildRecipientGroupLabels(t)` — accepts translation function, returns object with all labels grouped by sub-domain
  - Returns: `{ list: {...}, create: {...}, detail: {...}, variables: {...}, operations: {...}, errors: {...}, importExport: {...}, permissions: {...}, breadcrumbs: {...}, serverValidation: {...} }`
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/utils/buildRecipientGroupLabels.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 3b.4 Create row mapper utility `frontend/common/views/dashboard/certificates/recipient-groups/utils/mapRecipientGroupRows.ts`
  - `mapRecipientGroupListRows(data)` — maps GraphQL list response to `RecipientGroupListRow[]` for AppDataGrid
  - `mapStudentRows(data)` — maps GraphQL detail response to `RecipientGroupStudentRow[]`
  - Handles pluralization label generation for student counts
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/utils/mapRecipientGroupRows.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 3b.5 Create CSV export utility `frontend/common/views/dashboard/certificates/recipient-groups/utils/exportGroupMembersCsv.ts`
  - `exportGroupMembersCsv(group, students, variables, existingValues)` — generates CSV string and triggers download
  - Columns: name, email, grade, status, then one column per template variable (key as header)
  - Uses Blob + URL.createObjectURL for client-side download
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/utils/exportGroupMembersCsv.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 3b.6 Run quality loop on all new files
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/types/recipientGroup.types.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/schemas/recipientGroup.schema.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/utils/buildRecipientGroupLabels.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/utils/mapRecipientGroupRows.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/utils/exportGroupMembersCsv.ts --lifecycle codescene
  ```

- [ ] 3b.7 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t03b-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T04: Recipient Group List Page (ViewModel + Switcher + Container + Desktop + Mobile)

**Depends on**: T02, T03, T03b
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T05, T05b.

- [ ] 4.1 Create App Router page `app/(dashboard)/certificates/recipient-groups/page.tsx`
  - Server component calling `requirePermissionForPage(userId, [AppPermission.CertificateRecipientGroupView], locale, context)`
  - Pass `locale` to `<RecipientGroupListContainer locale={locale} />`
  - Get translations via `getTranslations(locale).certTranslations.recipientGroups.list` for page metadata
  - _Requirements: REQ-14-A1, REQ-14-F1_
  - **Files to create**: `app/(dashboard)/certificates/recipient-groups/page.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 4.2 Create ViewModel `frontend/common/views/dashboard/certificates/recipient-groups/useRecipientGroupListViewModel.ts`
  - Returns flat readonly object: `{ loading, error, groups, totalCount, pageInfo, searchQuery, page, pageSize, sortBy, sortDir, selectedGroupIds, permissions, labels, handlers }`
  - Uses `useQuery(RecipientGroupListQueryDocument)` from `@apollo/client/react` with stateful variables from Zustand store
  - Uses `useAppTranslation(Translation.Certificates.RecipientGroups)` for translations
  - Labels grouped via `useMemo(() => buildRecipientGroupLabels(t), [t])`
  - `handlers.openCreateDialog`, `handlers.handleSearchChange`, `handlers.handlePageChange`, `handlers.handleSortChange`, `handlers.handleRowClick`, `handlers.handleOpenOperations`
  - `permissions` object: `{ canCreate, canEdit, canDelete, canImport, canExport }` based on role
  - _Requirements: REQ-14-A1, A4, A5_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/useRecipientGroupListViewModel.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 4.3 Create Switcher `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupListView.tsx`
  - Uses `createLazyView<RecipientGroupListViewModel>()` pattern
  - Lazy imports: `() => import('./recipientGroupList.desktop.tsx')` and `() => import('./recipientGroupList.mobile.tsx')`
  - Passes to `<ResponsiveViewSwitch>`
  - _Requirements: REQ-14-A1_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupListView.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 4.4 Create Container `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupListContainer.tsx`
  - `"use client"` directive
  - Calls `useRecipientGroupViewModel(props)` hook
  - Wraps in `<RequirePermission permissions={[AppPermission.CertificateRecipientGroupView]}>`
  - Renders `<RecipientGroupView {...viewModel} />`
  - _Requirements: REQ-14-A1, REQ-14-F2_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupListContainer.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 4.5 Create desktop view `frontend/desktop/views/dashboard/certificates/recipient-groups/recipientGroupList.desktop.tsx`
  - Layout: `PageContainer` → `PageHeader` (title, subtitle, Create button) → `SectionPanel` → `DesktopAppDataGrid`
  - DesktopAppDataGrid columns: name (sortable), template, memberCount (sortable, pluralized), status (`Chip`), createdBy (hidden for TEACHER), createdAt (sortable), actions (3-dot `IconButton`)
  - Column header click → server-side sort; Search input with 300ms debounce → server-side filter
  - Row click → navigate to `/certificates/recipient-groups/[id]`
  - Empty state: translated title + subtitle + "Create Group" button
  - No-results state: different translated heading + message
  - Loading state: skeleton rows (5 rows with pulse animation)
  - Error state: `ErrorBanner` with Retry button
  - Server-side pagination via `paginationOptions` prop on `DesktopAppDataGrid`
  - Include `CreateRecipientGroupDialog` (controlled by store `createDialogOpen`)
  - Include `GroupOperationsMenu` per row
  - `useAppTranslation(Translation.Certificates.RecipientGroups)` for all labels
  - Use `sx` prop for styling (no style props on MUI v9 components)
  - _Requirements: REQ-14-A1, A2, A3, A4, A5, A6, E1-E6, H1_
  - **Files to create**: `frontend/desktop/views/dashboard/certificates/recipient-groups/recipientGroupList.desktop.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 4.6 Create mobile view `frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupList.mobile.tsx`
  - Layout: `MobilePageContainer` → `MobilePageHeader` (title, search icon, sort icon) → `MobileCardList` (with FAB)
  - Card: group name, template badge, member count (pluralized), status `Chip`, chevron icon
  - Long-press on card → bottom sheet with operations (Duplicate, Change Template, Delete)
  - Search input with debounce
  - Empty state with illustration and CTA
  - FAB (`FloatingActionButton` with `AddOutlined`) for "Create Group"
  - Card tap → navigate to detail
  - Server-side pagination via cursor-based infinite scroll
  - `useAppTranslation(Translation.Certificates.RecipientGroups)` for all labels
  - _Requirements: REQ-14-A1, A3, A4, A5, A6, H1, H2_
  - **Files to create**: `frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupList.mobile.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 4.7 Run quality loop on all new files
  ```bash
  bun run scripts/health/sub-loop.ts app/(dashboard)/certificates/recipient-groups/page.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/useRecipientGroupListViewModel.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupListView.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupListContainer.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/recipient-groups/recipientGroupList.desktop.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupList.mobile.tsx --lifecycle codescene
  ```

- [ ] 4.8 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t04-outcome.md`

_**AGENTS.md files**: `app/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T05: Create Recipient Group Dialog

**Depends on**: T03, T03b
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T04, T05b.

- [ ] 5.1 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/createRecipientGroupDialog.tsx`
  - Dialog form: name (required, min 1, max 100 chars), description (optional multiline, max 500), template selection (Autocomplete)
  - Template Autocomplete fetches published templates via `TemplateListForSelectQueryDocument`
  - Zod validation via `schemas/recipientGroup.schema.ts` (`createRecipientGroupSchema`)
  - On submit: call `CreateRecipientGroupMutationDocument`, update Apollo cache (prepend new group to list), close dialog, show success snackbar
  - On error: keep dialog open, show `FormErrorSnackbar` with translated message, preserve field values
  - Desktop: `Dialog` with `maxWidth="sm"`; Mobile: `Dialog` with `fullScreen={true}`
  - Submit button disabled while `submitting === true`
  - Use `useAppTranslation(Translation.Certificates.RecipientGroups)` for all labels
  - Shared component used by both desktop and mobile
  - _Requirements: REQ-14-B1, B2, B3, B4_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/createRecipientGroupDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 5.2 Run quality loop
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/createRecipientGroupDialog.tsx --lifecycle codescene
  ```

- [ ] 5.3 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t05-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T05b: Group Operation Dialogs (Duplicate, Delete, Change Template)

**Depends on**: T03, T03b
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T04, T05.

- [ ] 5b.1 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/duplicateGroupDialog.tsx`
  - Fields: newName (default: "{originalName} (Copy)"), template (default: same template)
  - Zod validation via `duplicateRecipientGroupSchema`
  - Calls `DuplicateRecipientGroupMutationDocument` with `sourceGroupId`, `newName`, `templateVersionId`, `clientRequestId`
  - On success: close dialog, prepend new group to Apollo cache, success snackbar
  - Idempotency: `clientRequestId` generated via `crypto.randomUUID()`
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/duplicateGroupDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 5b.2 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/deleteGroupConfirmDialog.tsx`
  - Warning message with pluralized member count
  - Cancel / Confirm buttons
  - Calls `DeleteRecipientGroupMutationDocument` with `id`
  - On success: evict from Apollo cache, success snackbar; if on detail page, navigate back
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/deleteGroupConfirmDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 5b.3 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/changeTemplateDialog.tsx`
  - Current template name + new template Autocomplete
  - Warning about clearing incompatible variable values
  - Cancel / Confirm buttons
  - Calls `UpdateRecipientGroupMutationDocument` with new `templateVersionId`
  - On success: evict stale variable values from cache, success snackbar
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/changeTemplateDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 5b.4 Run quality loop on all new files
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/duplicateGroupDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/deleteGroupConfirmDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/changeTemplateDialog.tsx --lifecycle codescene
  ```

- [ ] 5b.5 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t05b-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T06: Group Detail Page (ViewModel + Switcher + Container + Desktop + Mobile)

**Depends on**: T04, T05, T05b
> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T07, T07b.

- [ ] 6.1 Create App Router page `app/(dashboard)/certificates/recipient-groups/[id]/page.tsx`
  - Server component calling `requirePermissionForPage(userId, [AppPermission.CertificateRecipientGroupView], locale, context)`
  - Pass `locale` and `groupId` (from params) to `<RecipientGroupDetailContainer locale={locale} groupId={groupId} />`
  - _Requirements: REQ-14-C1, F1_
  - **Files to create**: `app/(dashboard)/certificates/recipient-groups/[id]/page.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 6.2 Create ViewModel `frontend/common/views/dashboard/certificates/recipient-groups/useRecipientGroupDetailViewModel.ts`
  - Returns flat readonly object: `{ loading, error, group, students, studentPageInfo, createDialogOpen, assignmentDialogOpen, variableEditorState, operationsMenuAnchor, permissions, labels, mutations, handlers }`
  - Uses `useQuery(RecipientGroupDetailQueryDocument)` with `cache-and-network` policy
  - `mutations.addStudents`, `mutations.removeStudents`, `mutations.upsertVariableValues`, `mutations.deleteGroup`, `mutations.duplicateGroup`, `mutations.updateGroup`
  - `handlers.handleAddStudents`, `handlers.handleRemoveStudents`, `handlers.handleOpenVariableEditor`, `handlers.handleSaveVariableValues`, `handlers.handleDeleteGroup`, `handlers.handleDuplicateGroup`, `handlers.handleChangeTemplate`
  - Optimistic updates on add/remove students (cache modification before mutation resolves, rollback on error)
  - `permissions` object: `{ canEdit, canDelete, canAddStudents, canImport, canExport }`
  - _Requirements: REQ-14-C1, C2, C3, C5, F2, F4, F5, F6_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/useRecipientGroupDetailViewModel.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 6.3 Create Switcher `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupDetailView.tsx`
  - Uses `createLazyView<RecipientGroupDetailViewModel>()` pattern
  - Lazy imports: `() => import('./recipientGroupDetail.desktop.tsx')` and `() => import('./recipientGroupDetail.mobile.tsx')`
  - Passes to `<ResponsiveViewSwitch>`
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupDetailView.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 6.4 Create Container `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupDetailContainer.tsx`
  - `"use client"` directive
  - Calls `useRecipientGroupDetailViewModel(props)` hook
  - Wraps in `<RequirePermission permissions={[AppPermission.CertificateRecipientGroupView]}>`
  - Renders `<RecipientGroupDetailView {...viewModel} />`
  - Handles 404 (group not found) with `notFound()` from `next/navigation`
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupDetailContainer.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 6.5 Create desktop view `frontend/desktop/views/dashboard/certificates/recipient-groups/recipientGroupDetail.desktop.tsx`
  - Header: `desktopDetailHeader` with back button, inline-renameable group name, template name, student count, Add Students / Import / Export / Operations buttons
  - Student table via `DesktopAppDataGrid`: name, email, grade, status, variableStatus badge, actions (remove + expand)
  - Row expand: `desktopVariableRow` for inline variable editing
  - Server-side pagination for students with `studentPageInfo`
  - Include `StudentAssignmentDialog`, `RemoveStudentsConfirmDialog`, `GroupOperationsMenu`, `ImportMembersDialog`, `ChangeTemplateDialog`, `DuplicateGroupDialog`, `DeleteGroupConfirmDialog`
  - Breadcrumbs: Dashboard › Certificates › Recipient Groups › [Group Name]
  - Use `sx` prop for styling (MUI v9)
  - _Requirements: REQ-14-C1 through C7, E1-E6, F8_
  - **Files to create**: `frontend/desktop/views/dashboard/certificates/recipient-groups/recipientGroupDetail.desktop.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 6.6 Create mobile view `frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupDetail.mobile.tsx`
  - Header: `MobilePageHeader` with back icon, group name (tap for rename), overflow menu
  - Student list: `MobileCardList` with `MobileStudentCard` — expandable accordion showing variable values + edit/remove actions
  - Add Students FAB (`PersonAddOutlined`) → `mobileAssignmentSheet` (bottom sheet)
  - Edit Variables on card → `mobileVariableDialog` (full-screen `Dialog`)
  - Operations via long-press / overflow menu
  - Infinite scroll via cursor-based pagination
  - Breadcrumbs: `MobileBreadcrumbBar`
  - _Requirements: REQ-14-C1 through C7, E1-E6, F8, H4, H5, H6, H7_
  - **Files to create**: `frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupDetail.mobile.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 6.7 Run quality loop on all new files
  ```bash
  bun run scripts/health/sub-loop.ts app/(dashboard)/certificates/recipient-groups/[id]/page.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/useRecipientGroupDetailViewModel.ts --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupDetailView.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/recipientGroupDetailContainer.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/recipient-groups/recipientGroupDetail.desktop.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupDetail.mobile.tsx --lifecycle codescene
  ```

- [ ] 6.8 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t06-outcome.md`

_**AGENTS.md files**: `app/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T07: Student Assignment Flow

**Depends on**: T03, T03b
> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T06, T07b.

- [ ] 7.1 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/studentAssignmentDialog.tsx`
  - Dialog (desktop) / bottom sheet `mobileAssignmentSheet` (mobile) for searching and selecting students
  - Search Autocomplete: server-side via `StudentSearchQueryDocument` with 300ms debounce
  - Search excludes students already in the group (`excludeGroupId` param)
  - Student search uses existing `student-field-acl.ts` service for authorization (TEACHER scoping)
  - Autocomplete shows: student name, ID, grade in dropdown items
  - Multi-select: checkboxes on each result, Chip list of selected, "Add Selected" button
  - On add: call `AddStudentsToGroupMutationDocument` with selected student IDs
  - Optimistic update: insert new students to cache before mutation resolves; rollback on error
  - Server returns `{ addedCount, skipped: [{studentId, studentName, reason}] }`
  - Show success snackbar (pluralized addedCount), show skipped summary if any
  - Dialog state controlled by store `assignmentDialogOpen`
  - _Requirements: REQ-14-C2, C3, C6, F4, H5_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/studentAssignmentDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 7.2 Create remove students confirmation dialog `frontend/common/views/dashboard/certificates/recipient-groups/shared/removeStudentsConfirmDialog.tsx`
  - Shared component for confirming student removal
  - Pluralized confirmation message based on selected count
  - Last-member warning if emptying the group (all students selected)
  - On confirm: call `RemoveStudentsFromGroupMutationDocument` — returns `{ removedCount }`
  - Optimistic update: remove from cache; rollback on error
  - Show success toast (pluralized)
  - _Requirements: REQ-14-C4_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/removeStudentsConfirmDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 7.3 Run quality loop
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/studentAssignmentDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/removeStudentsConfirmDialog.tsx --lifecycle codescene
  ```

- [ ] 7.4 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t07-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T07b: Member Import/Export

**Depends on**: T03, T03b
> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T06, T07.

- [ ] 7b.1 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/importMembersDialog.tsx`
  - CSV file upload dropzone (accepts `.csv` only, max 1MB)
  - "Download Template" link — generates blank CSV with expected headers
  - Client-side CSV parse and preview (first 5 rows in `DesktopAppDataGrid` or `MobileCardList`)
  - Total row count display, "Import" button enabled after valid preview
  - On confirm import: call `ImportGroupMembersMutationDocument` with `{ groupId, csvData }`
  - Server returns `{ addedCount, skipped: [{studentId, studentName, reason}] }`
  - Results summary: success count + skipped breakdown by reason ("already_member", "student_not_found", "invalid_email")
  - Invalid format error: `FormErrorSnackbar` with translated message, Import button disabled
  - Missing email column error: specific translated message
  - File too large error: specific translated message
  - Dialog state controlled by store `importDialogOpen`, `importTargetGroupId`
  - _Requirements: REQ-14-G1, G2, G3, G4_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/importMembersDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 7b.2 Verify CSV export utility `frontend/common/views/dashboard/certificates/recipient-groups/utils/exportGroupMembersCsv.ts`
  - Already created in T03b.5 — verify integration in detail view
  - Export triggered from detail page "Export" button
  - Warning dialog for >500 members before generating
  - Columns: name, email, grade, status, then one column per template variable
  - _Requirements: REQ-14-G5, G6_
  - **Files to modify**: Integrate in `recipientGroupDetail.desktop.tsx` and `recipientGroupDetail.mobile.tsx` (T06)
  - **Instruction files**: `frontend.instructions.md`

- [ ] 7b.3 Run quality loop
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/importMembersDialog.tsx --lifecycle codescene
  ```

- [ ] 7b.4 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t07b-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T08: Per-Recipient Variable Value Editor

**Depends on**: T06, T07, T07b
> **Parallelizable**: This task runs as a subagent in Wave 5 (sole task in this wave — no siblings).

- [ ] 8.1 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/variableValueEditor.tsx`
  - Core variable editing form (shared logic for desktop inline + mobile dialog)
  - Props: `{ groupItemId, variables, existingValues, editorState, onValueChange, onSave, onCancel, labels }`
  - Renders one input per variable with correct type:
    - `text`: TextField with minLength/maxLength/pattern constraints
    - `number`: number input with minValue/maxValue/decimalPlaces
    - `date`: DatePicker with minDate/maxDate and format
    - `select`: Select dropdown with options; `multiple` → Autocomplete multi with chips
  - Required validation: prevent save until all required variables have valid values (client-side Zod + server-side)
  - Default value hint for unset non-required variables (helper text under field)
  - On save: call `UpsertVariableValuesMutationDocument`
  - Server returns `{ success, valueErrors: [{variableId, errorKey}] }`
  - If `valueErrors` is non-empty: display each error inline under corresponding field via `FormHelperText` with `error: true`, no values persisted (atomic)
  - On success: update Apollo cache for the recipient row, show success toast, update variable status
  - Editor state managed in Zustand: `variableEditorState[itemId] = { open, values, saving, errors }`
  - _Requirements: REQ-14-D1 through D9_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/variableValueEditor.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 8.2 Create `frontend/desktop/views/dashboard/certificates/recipient-groups/desktopVariableRow.tsx`
  - Inline expandable row in the `DesktopAppDataGrid`
  - Click expand icon → row expands to show `<VariableValueEditor>` inline
  - Collapse on save or cancel
  - _Requirements: REQ-14-D1_
  - **Files to create**: `frontend/desktop/views/dashboard/certificates/recipient-groups/desktopVariableRow.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 8.3 Create `frontend/mobile/views/dashboard/certificates/recipient-groups/mobileVariableDialog.tsx`
  - Full-screen `Dialog` for variable editing on mobile
  - App bar with title, Save/Cancel buttons
  - Contains `<VariableValueEditor>` in scrollable form
  - Opened from student card "Edit Variables" action
  - _Requirements: REQ-14-D1, H6_
  - **Files to create**: `frontend/mobile/views/dashboard/certificates/recipient-groups/mobileVariableDialog.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 8.4 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/variableStatusBadge.tsx`
  - Props: `{ status: "filled" | "unfilled" | "partial", labels }`
  - Badge showing variable fill status: filled (success color), unfilled (error color), partial (warning color)
  - Status from GraphQL `variableStatus` field
  - Uses theme palette colors (no hardcoded colors)
  - _Requirements: REQ-14-C7_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/variableStatusBadge.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 8.5 Run quality loop on all new files
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/variableValueEditor.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/certificates/recipient-groups/desktopVariableRow.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/recipient-groups/mobileVariableDialog.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/variableStatusBadge.tsx --lifecycle codescene
  ```

- [ ] 8.6 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t08-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T09: Group Operations Menu

**Depends on**: T08
> **Parallelizable**: This task runs as a subagent in Wave 6 (sole task in this wave — no siblings).

- [ ] 9.1 Create `frontend/common/views/dashboard/certificates/recipient-groups/shared/groupOperationsMenu.tsx`
  - `Popover` with `MenuList` — items: Duplicate, Change Template, Delete (with divider), Edit Description
  - Each item visible per `permissions` flags from ViewModel
  - Props: `{ anchorEl, onClose, group, permissions, onDuplicate, onDelete, onChangeTemplate, onEditDescription, labels }`
  - Desktop: 3-dot `IconButton` opens Popover; Mobile: long-press opens bottom sheet
  - All operations open their respective dialogs (created in T05b)
  - All labels from `labels.operations.*` keys
  - _Requirements: REQ-14-E1 through E6_
  - **Files to create**: `frontend/common/views/dashboard/certificates/recipient-groups/shared/groupOperationsMenu.tsx`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 9.2 Update sidebar navigation configuration
  - Add "Recipient Groups" item under "Certificates" nav group in `frontend/common/views/dashboard/config/navigationConfig.ts`
  - `SIDEBAR_NAV_ITEMS` entry: `{ labelKey: "recipientGroups", iconKey: "GroupOutlined", href: "/certificates/recipient-groups", permission: AppPermission.CertificateRecipientGroupView }`
  - Position: 2nd item (after "Templates")
  - Icon: `GroupOutlined` (MUI v9 naming, NOT `GroupOutline`)
  - **Files to modify**: `frontend/common/views/dashboard/config/navigationConfig.ts`
  - **Instruction files**: `frontend.instructions.md`

- [ ] 9.3 Run quality loop
  ```bash
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/certificates/recipient-groups/shared/groupOperationsMenu.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene
  ```

- [ ] 9.4 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t09-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T10: Mobile Variants Integration

**Depends on**: T09
> **Parallelizable**: This task runs as a subagent in Wave 7 (sole task in this wave — no siblings).

- [ ] 10.1 Verify mobile list view (`recipientGroupList.mobile.tsx`) connects to the same Apollo queries as desktop
  - Ensure `MobileCardList` renders paginated results
  - Ensure search debounce works on mobile
  - Ensure create dialog (shared) works on mobile in `fullScreen` mode
  - Ensure long-press context menu opens bottom sheet with operations
  - Ensure FAB opens create dialog
  - _Requirements: REQ-14-A1-A6, H1, H2, H3_

- [ ] 10.2 Verify mobile detail view (`recipientGroupDetail.mobile.tsx`) renders correctly
  - `MobileStudentCard` with variable status badge
  - Variable editing via `mobileVariableDialog` (full screen)
  - Student assignment via `mobileAssignmentSheet` (bottom sheet)
  - Group operations via long-press / overflow menu
  - Infinite scroll via cursor-based pagination
  - Breadcrumbs via `MobileBreadcrumbBar`
  - _Requirements: REQ-14-C1-C7, D1-D9, H4, H5, H6, H7_

- [ ] 10.3 Run quality loop on mobile-specific files
  ```bash
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupList.mobile.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/recipient-groups/recipientGroupDetail.mobile.tsx --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/certificates/recipient-groups/mobileVariableDialog.tsx --lifecycle codescene
  ```

- [ ] 10.4 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t10-outcome.md`

_**AGENTS.md files**: `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## T11: Knowledge Propagation & Documentation

**Depends on**: T10
> **Parallelizable**: This task runs as a subagent in the Final Wave (sole task — knowledge propagation must run after all other tasks complete).

- [ ] 11.1 Read all outcome files in `.ai/plans/14-recipient-group-mgmt/outcome/` to synthesize learnings

- [ ] 11.2 Create canonical reference doc `docs/frontend/recipient-group-management.md`
  - Apollo cache update patterns for group/student joins (manual update functions)
  - Variable value form validation with type-appropriate inputs
  - Mobile/desktop variable editing patterns (inline vs dialog)
  - Student server-side search with debounce
  - Import/export CSV patterns (parse, preview, batch mutation)
  - Idempotency pattern for duplicate operation (`clientRequestId` flow)
  - `student-field-acl` reuse for student column visibility scoping
  - Server validation `valueErrors[]` handling in forms
  - Rules and anti-patterns

- [ ] 11.3 Update layer AGENTS.md files with new patterns:
  - `frontend/views/AGENTS.md`: Add recipient group management patterns (list+detail+variable editor)
  - `frontend/AGENTS.md`: Add Apollo cache update patterns for join tables, idempotency for duplicate
  - Root `AGENTS.md`: Add `docs/frontend/recipient-group-management.md` to Important References

- [ ] 11.4 Update `.agents/instructions/frontend.instructions.md` if new conventions discovered

- [ ] 11.5 Run global quality check
  ```bash
  bun tsgo
  bun biome:check
  bun run lint
  ```

- [ ] 11.6 Write outcome file: `.ai/plans/14-recipient-group-mgmt/outcome/t11-knowledge-propagation-outcome.md`

- [ ] 11.7 Mark all tasks `[x]` in `tasks.md`

_**AGENTS.md files**: root `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md`_
_**Instruction files**: `frontend.instructions.md`_

---

## Acceptance Criteria → Task Mapping

| AC | Tasks Covering |
|---|---|
| Group list renders with DesktopAppDataGrid / MobileCardList | T04 |
| Server-side pagination returns canonical list shape | T03, T04 |
| Search resets page to 0 and produces server-filtered results | T04 |
| Empty state shows translated heading + CTA | T04 |
| Row click navigates to detail route | T04 |
| Name validation: min 3, max 255, Arabic-aware (Zod) | T05, T03b |
| Template Autocomplete fetches Published templates | T03, T05 |
| On success: dialog closes, cache updated, success toast | T05 |
| On error: dialog remains open, error snackbar, values preserved | T05 |
| Group detail loads with cache-and-network | T06 |
| Add/remove operations update Apollo cache without full refetch | T07 |
| Confirmation dialog for removing students | T07 |
| Add returns `skipped[]` with reason per student | T03, T07 |
| Variable status computed from variableValues existence | T08, T03b |
| Four input types with constraints | T08 |
| Required validation prevents save | T08 |
| Server validation returns `valueErrors[]` displayed inline | T08, T03 |
| Upsert mutation persists to variableValues table | T08 |
| Default value hint for unset non-required variables | T08 |
| `closeVariableEditor` prevents memory leaks on unmount | T02, T08 |
| Duplicate: idempotency via `clientRequestId` | T03, T05b |
| Duplicate: new group with students + variable values copied | T05b, T09 |
| Delete: disabled when studentCount > 0 | T05b, T09 |
| Delete: soft-delete sets deletedAt | T05b, T09 |
| Change template: confirmation with warning | T05b, T09 |
| CSV import: upload, parse, preview, confirm | T07b |
| CSV import: batch mutation returns inserted/skipped counts | T03, T07b |
| CSV export: download member list as CSV | T07b, T03b |
| Mobile: MobilePageContainer + MobileCardList | T04 |
| Mobile: long-press context menu opens bottom sheet | T09, T10 |
| Mobile: FAB opens create dialog (full screen) | T04, T05 |
| Mobile: expandable card accordion for member list | T10 |
| Mobile: variable editing full-screen dialog | T08, T10 |
| Mobile: infinite scroll via cursor pagination | T10 |
| student-field-acl reuse for student column visibility | T03b, T06 |
| Permission: `CertificateRecipientGroupManage` for create/edit/delete | T03b, T04, T05, T07, T05b |
| Permission: `CertificateRecipientGroupView` for list/detail | T03b, T04, T06, T09 |
| TEACHER ownership scoping via `createdById` | T03 |
| Breadcrumbs via `MobileBreadcrumbBar` / desktop breadcrumb component | T04, T06 |
| App Router page calls requirePermissionForPage | T04, T06 |
| Container wraps in RequirePermission | T04, T06 |
| Sidebar nav includes "Recipient Groups" under "Certificates" | T09 |

---

## Instruction File Verification Table

| Task | Instruction Files | AGENTS.md Files |
|---|---|---|
| T01 | `frontend.instructions.md` | `shared/AGENTS.md`, root |
| T02 | `frontend.instructions.md` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md`, root |
| T03 | `frontend.instructions.md` | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md`, root |
| T03b | `frontend.instructions.md`, `backend.instructions.md` | `backend/types/AGENTS.md`, `frontend/AGENTS.md`, root |
| T04 | `frontend.instructions.md` | `app/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T05 | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T05b | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T06 | `frontend.instructions.md` | `app/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T07 | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T07b | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T08 | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T09 | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T10 | `frontend.instructions.md` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root |
| T11 | `frontend.instructions.md` | root `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
