# Design — Plan 14: Recipient Group Management

## Document Information

| Field | Value |
|---|---|
| **Feature Name** | Recipient Group Management |
| **Plan #** | 14 |
| **Dependencies** | Plan 5 (GraphQL API) |
| **Dependents** | Plan 17 (Certificate Generation Dialog) |
| **Permission** | `CertificateRecipientGroupManage` (`certificates.recipient_groups.manage`) |
| **View Permission** | `CertificateRecipientGroupView` (`certificates.recipient_groups.view`) |

---

## Architecture Position

This plan follows the Siraj three-tier Container/ViewModel/Switcher pattern (per `frontend/common/views/AGENTS.md` and `frontend/NEW_PAGE_WORKFLOW.md`).

```
App Router Pages (Server Components)
├── app/(dashboard)/certificates/recipient-groups/page.tsx
│   └── requirePermissionForPage(userId, [AppPermission.CertificateRecipientGroupManage], locale, context)
│       └── <RecipientGroupListContainer locale={locale} />
│
└── app/(dashboard)/certificates/recipient-groups/[id]/page.tsx
    └── requirePermissionForPage(userId, [AppPermission.CertificateRecipientGroupManage], locale, context)
        └── <RecipientGroupDetailContainer locale={locale} groupId={params.id} />

Tier-Neutral Home (frontend/common/views/dashboard/certificates/recipient-groups/)
├── RecipientGroupListContainer.tsx                  # "use client" → useRecipientGroupListViewModel → RequirePermission → <RecipientGroupListView>
├── useRecipientGroupListViewModel.ts                # ViewModel hook: Apollo queries, store, labels, handlers
├── RecipientGroupListView.tsx                       # Switcher: createLazyView + ResponsiveViewSwitch
├── RecipientGroupDetailContainer.tsx                # "use client" → useRecipientGroupDetailViewModel → RequirePermission → <RecipientGroupDetailView>
├── useRecipientGroupDetailViewModel.ts               # ViewModel hook for detail page
├── RecipientGroupDetailView.tsx                     # Switcher: createLazyView + ResponsiveViewSwitch
├── types/recipientGroup.types.ts                    # Row types, summary types (imports from graphql-types.ts)
├── schemas/recipientGroup.schema.ts                  # Zod validation schemas
├── utils/buildRecipientGroupLabels.ts                # Labels builder (Rule 7 pattern)
└── utils/mapRecipientGroupRows.ts                    # Apollo data → row mapping
│
├── shared/ (tier-neutral sub-components)
│   ├── CreateRecipientGroupDialog.tsx               # Create/edit dialog (shared desktop/mobile)
│   ├── StudentAssignmentDialog.tsx                   # Student search + multi-select + add
│   ├── RemoveStudentsConfirmDialog.tsx               # Removal confirmation (pluralized)
│   ├── VariableValueEditor.tsx                       # Variable value form (shared core)
│   ├── VariableStatusBadge.tsx                       # Filled/unfilled/partial badge
│   ├── GroupOperationsMenu.tsx                       # Duplicate/rename/delete/change template
│   ├── DeleteGroupConfirmDialog.tsx                  # Group deletion confirmation
│   ├── ChangeTemplateDialog.tsx                      # Template re-association with warning
│   └── RenameGroupDialog.tsx                         # Rename dialog (mobile fallback)

Desktop Tier (frontend/desktop/views/dashboard/certificates/recipient-groups/)
├── recipientGroupList.desktop.tsx                    # Desktop list: PageContainer→PageHeader→SectionPanel→DesktopAppDataGrid
├── recipientGroupDetail.desktop.tsx                  # Desktop detail: header + student table + inline variable row
└── components/
    ├── desktopVariableRow.tsx                        # Inline expandable variable row
    ├── desktopStudentTable.tsx                      # AppDataGrid with student columns
    └── desktopDetailHeader.tsx                       # Group detail header with inline edit

Mobile Tier (frontend/mobile/views/dashboard/certificates/recipient-groups/)
├── recipientGroupList.mobile.tsx                    # Mobile list: MobilePageContainer→MobilePageHeader→MobileCardList
├── recipientGroupDetail.mobile.tsx                  # Mobile detail: header + card list + full-screen dialog
└── components/
    ├── mobileVariableDialog.tsx                      # Full-screen variable dialog
    └── mobileStudentCard.tsx                         # Student card with expandable members

Zustand Store
└── frontend/common/stores/recipientGroupStore.ts    # Search, pagination, dialog flags, editor state

GraphQL Documents
└── frontend/common/graphql/sharedDocuments/certificates/
    ├── certificateRecipientGroup.documents.ts        # All recipient group queries/mutations (per INTER_PLAN_CONTRACTS §17)
    └── index.ts                                      # Barrel: export * from "./certificateRecipientGroup.documents"

Apollo Client Documents
├── recipientGroupListQueryDocument                  # Paginated list with search, sort, pageInfo
├── recipientGroupDetailQueryDocument                # Group + students + variable values + template variables
├── createRecipientGroupMutationDocument              # Create with name, description, templateId
├── updateRecipientGroupMutationDocument              # Update name/description/templateId
├── deleteRecipientGroupMutationDocument              # Soft delete (sets deletedAt)
├── duplicateRecipientGroupMutationDocument           # Deep copy (group + students + variable values)
├── addStudentsToGroupMutationDocument               # Batch add, returns addedCount + skipped[]
├── removeStudentsFromGroupMutationDocument           # Batch remove, returns removedCount
├── upsertVariableValuesMutationDocument              # Batch upsert per recipient with server validation
├── studentSearchQueryDocument                        # Server-side search excluding group members
└── templateListForSelectQueryDocument                # Published templates for dropdown

GraphQL API (Plan 5) — per INTER_PLAN_CONTRACTS §17
├── Query.recipientGroups (list, paginated, scoped by createdById for TEACHER)
├── Query.recipientGroup (single, by ID)
├── Query.searchStudents (server-side search, reuses student-field-acl)
├── Mutation.createRecipientGroup
├── Mutation.updateRecipientGroup
├── Mutation.deleteRecipientGroup (soft)
├── Mutation.duplicateRecipientGroup (idempotent via idempotency.service.ts)
├── Mutation.addStudentsToGroup (returns addedCount + skipped[])
├── Mutation.removeStudentsFromGroup (returns removedCount)
└── Mutation.upsertRecipientVariableValues (server-validated, returns valueErrors[])

Service Layer (Plan 4)
├── RecipientGroupService.* (CRUD, batch operations, deep copy)
├── StudentService.search (existing Siraj service, reuses student-field-acl)
└── TemplateService.listPublished (existing)

Repository Layer (Plan 3)
├── recipientGroupRepository.* (CRUD, pagination, scoped by createdById)
├── recipientGroupItemRepository.* (batch add/remove, UNIQUE(groupId, studentId))
└── recipientGroupItemVariableValueRepository.* (upsert, batch grouped query for variableStatus)
```

---

## Design Goals

1. **Apollo cache efficiency** — Add/remove students update the cache without full refetch; group operations (duplicate, rename, delete) update list cache incrementally.
2. **Type-appropriate variable editing** — Each variable type (text, number, date, select) gets its correct input component with validation constraints from the template variable definition.
3. **Desktop-inline vs Mobile-dialog** — Desktop uses inline expandable rows for variable editing; mobile uses full-screen dialogs for focused editing.
4. **Server-side search and pagination** — Student search is server-side with 300ms debounce; list views use cursor-based pagination.

---

## Key Design Decisions

### Decision 1: Apollo Cache Updates (Manual vs Refetch)

**Context:** Adding/removing students changes the group's student count and the student list. Full refetch is expensive.

**Options Considered:**
1. Full refetch after every mutation — Pros: simple / Cons: slow, loses scroll position
2. Manual cache update via `update` function — Pros: fast, preserves scroll / Cons: complex cache writing
3. `evict` + `refetchQueries` — Pros: simpler than manual / Cons: still slow

**Decision:** Manual cache update via Apollo `update` function for add/remove; `evict` for delete.

**Rationale:** Manual cache updates provide the best UX (no loading flicker, preserved scroll position). The `update` function modifies the cached query data directly. For group deletion, `evict` removes the group from the list cache.

### Decision 2: Variable Value Editing UX (Inline vs Dialog)

**Context:** Per-recipient variable values need an editing interface. Desktop has more screen space than mobile.

**Options Considered:**
1. Inline expandable row (desktop + mobile) — Pros: consistent / Cons: cramped on mobile
2. Dialog for both — Pros: focused / Cons: extra clicks on desktop
3. Inline expandable row (desktop) + full-screen dialog (mobile) — Pros: best UX per device / Cons: duplicated UI

**Decision:** Desktop = inline expandable row; Mobile = full-screen dialog

**Rationale:** Desktop users benefit from inline editing to see multiple recipients' values simultaneously. Mobile users need focused full-screen editing due to limited space.

### Decision 3: Student Assignment Flow (Dialog vs New Page)

**Context:** Adding students to a group requires searching and selecting from the student directory.

**Options Considered:**
1. Full-page student picker — Pros: more space / Cons: context switch, complex navigation
2. Modal dialog with search + select — Pros: in-context, simpler / Cons: less space for results
3. Bottom sheet (mobile) + dialog (desktop) — Pros: native mobile pattern / Cons: two components

**Decision:** Dialog (desktop) + Bottom sheet (mobile)

**Rationale:** Dialog keeps the user in the group detail context. The dialog contains a search Autocomplete + a selectable table/list of results. On mobile, a bottom sheet provides a native experience.

### Decision 4: Variable Status Column Computation

**Context:** Each recipient row shows whether their variable values are filled, unfilled, or partial.

**Options Considered:**
1. Compute client-side from loaded variable values — Pros: instant / Cons: may not reflect server state
2. Return computed status from GraphQL — Pros: authoritative / Cons: extra resolver computation
3. Compute in service layer and return as field — Pros: cached, performant / Cons: schema extension

**Decision:** Return computed `variableStatus` field from GraphQL (resolver computes from `recipientGroupItemVariableValues` existence per template variable)

**Rationale:** Server-side computation is authoritative and cached by Apollo. The status is computed per-query by joining `recipientGroupItemVariableValues` against template variables.

### Decision 5: Duplicate Group DeepCopy

**Context:** Duplicating a group should copy the group, its student assignments, and their per-recipient variable values.

**Options Considered:**
1. Shallow copy (group only, no students) — Pros: simple / Cons: user expects full copy
2. Deep copy (group + students + variable values) — Pros: complete / Cons: more server work
3. Configurable depth — Pros: flexible / Cons: unnecessary complexity

**Decision:** Deep copy (group + students + variable values)

**Rationale:** REQ-14-E1 explicitly states the duplicate operation copies the group with same student assignments and their variable values. The service performs a single transactional deep copy.

### Decision 6: Group Types

**Context:** Groups can be static (manual), class-based (auto-synced from class roster), or dynamic (query-based with scheduled recomputation).

**Options Considered:**
1. Single type (static only) — Pros: simple / Cons: limited flexibility
2. Multiple types with enum on `certificate_recipient_groups.type` — Pros: extensible, clear UX / Cons: more complex sync logic
3. Query-based only — Pros: powerful / Cons: overkill for common cases

**Decision:** Enum column `type` on `certificate_recipient_groups` with values: `STATIC` | `CLASS_BASED` | `DYNAMIC`

**Rationale:**
- Static: Default, manual add/remove only
- Class-based: `classId` FK column added, membership auto-synced via scheduled job (Plan 22) or event-driven
- Dynamic: `queryFilter` JSON column for filter definition, recomputed on schedule (Plan 22 cron)
- Create dialog: group type selector with descriptions
- List page: type badge/Chip column, filterable, sortable
- Future enhancement: Dynamic query builder UI (deferred)

### Decision 7: Member Count Pluralization

**Context:** Member count displayed in list table, detail header, mobile cards, dialogs, confirmations, import/export.

**Options Considered:**
1. Hardcoded pluralization in each component — Pros: simple / Cons: inconsistent, not translatable
2. Single translation function `studentCount(count: number) => string` used everywhere — Pros: consistent, translatable, maintainable / Cons: requires i18n infrastructure

**Decision:** Single `memberCount(count: number) => string` translation function from `labels.list.memberCount` / `labels.detail.studentCount` used consistently across all components.

**Rationale:** Ensures consistent pluralization (Arabic zero/one/two/few/many, English zero/one/many) everywhere. No component computes pluralization logic locally.

### Decision 8: Accessibility (WCAG 2.1 AA)

**Context:** All interactive components must meet accessibility standards.

**Options Considered:**
1. Ad-hoc accessibility — Pros: none / Cons: inconsistent, likely non-compliant
2. Systematic ARIA patterns across all components — Pros: compliant, maintainable / Cons: initial effort

**Decision:** Systematic ARIA implementation:
- All dialogs: `Dialog` with `disableEnforceFocus={false}`, proper `aria-labelledby`
- Tables: `role="grid"`, column headers `role="columnheader"`, row actions `aria-label`
- Form fields: `id` + `htmlFor` association, `aria-invalid`, `aria-describedby` for errors
- Chips: `aria-label` with full status text (not color alone)
- Loading: `aria-busy`, `aria-live="polite"` on container
- Errors: `role="alert"`, `aria-live="assertive"`
- Autocomplete: proper ARIA combobox pattern with `aria-controls`, `aria-expanded`, `aria-activedescendant`
- Focus trap on dialog open/close, restore focus to trigger
- Skip to main content link on pages
- Visible focus indicator (2px outline, theme primary color, 3:1 contrast)

### Decision 9: Delete Confirmation with Certificate Impact

**Context:** Deleting a group that has issued certificates or pending generation jobs requires clear warnings.

**Options Considered:**
1. Simple confirmation only — Pros: simple / Cons: users may not understand impact
2. Two-tier warning: member count + certificate count + pending jobs — Pros: transparent, informed consent / Cons: more complex dialog

**Decision:** Two-tier warning in `DeleteGroupConfirmDialog`:
1. Member count warning (existing pluralized)
2. Certificate count warning (pluralized, `Warning` icon, distinct color) — shows number of issued certificates, states they will not be affected
3. Pending jobs warning with explicit checkbox confirmation ("I understand pending jobs will be cancelled")

**Rationale:** Prevents accidental data loss, informs users of real impact, maintains trust.

---

## Interface Contracts

### Zustand Store: `recipientGroupStore`

Path: `frontend/common/stores/recipientGroupStore.ts`
Pattern: `create<RecipientGroupStoreState>(set => ({...}))` — no `persist` (all ephemeral UI state)

#### State Fields

| Field | Type | Description |
|---|---|---|
| `searchQuery` | `string` | Current search input (debounced 300ms via `useDebouncedValue` in ViewModel) |
| `page` | `number` | Current page number (0-based for Apollo `fetchMore` offset calc) |
| `pageSize` | `number` | Items per page (default 20, stored for cross-component sync) |
| `sortBy` | `'name' \| 'createdAt' \| 'studentCount'` | Active sort column |
| `sortDir` | `'asc' \| 'desc'` | Sort direction |
| `selectedGroupIds` | `Set<string>` | Multi-select set for bulk operations |
| `createDialogOpen` | `boolean` | Create dialog visibility |
| `editingGroupId` | `string \| null` | Group ID being edited (null = create mode, non-null = rename mode) |
| `assignmentDialogOpen` | `boolean` | Student assignment flow visibility (set by detail page) |
| `assignmentSelectedStudentIds` | `Set<string>` | Multi-select student IDs in assignment dialog |
| `assignmentSearchQuery` | `string` | Search text inside assignment Autocomplete (debounced) |
| `variableEditorState` | `Record<string, VariableEditorEntry>` | Per-recipient variable editing state keyed by `groupItemId` |
| `operationsMenuAnchor` | `HTMLElement \| null` | DOM anchor for operations dropdown menu |
| `deleteConfirmGroupId` | `string \| null` | Group ID pending deletion confirmation (null = closed) |
| `duplicateDialogGroupId` | `string \| null` | Group ID being duplicated (null = closed) |
| `importExportDialogOpen` | `boolean` | CSV import/export dialog visibility |
| `lastSkipped` | `SkippedEntry[] \| null` | Skipped students from last `addStudentsToGroup` operation (for snackbar display) |

Where:
- `VariableEditorEntry = { open: boolean; values: Record<string, unknown>; saving: boolean; errors: Record<string, string> }`
- `SkippedEntry = { studentId: string; studentName: string; reason: string }`

#### Actions

| Action | Signature | Description |
|---|---|---|
| `setSearchQuery` | `(query: string) => void` | Sets search query for list (debounce in ViewModel) |
| `setPage` | `(page: number) => void` | Sets current page |
| `setPageSize` | `(size: number) => void` | Sets page size (resets to page 0) |
| `setSort` | `(sortBy: SortField, sortDir: SortDir) => void` | Sets sort field and direction |
| `toggleGroupSelection` | `(id: string) => void` | Toggles a group ID in the multi-select set |
| `clearSelection` | `() => void` | Clears all selected group IDs |
| `openCreateDialog` | `() => void` | Opens create dialog (sets `editingGroupId = null`) |
| `openRenameDialog` | `(id: string) => void` | Opens dialog in rename mode |
| `closeCreateDialog` | `() => void` | Closes create/rename dialog |
| `openAssignmentDialog` | `() => void` | Opens student assignment flow |
| `closeAssignmentDialog` | `() => void` | Closes assignment dialog, clears selection |
| `toggleAssignmentStudent` | `(studentId: string) => void` | Toggles a student in assignment selection |
| `clearAssignmentSelection` | `() => void` | Clears all selected students |
| `setAssignmentSearchQuery` | `(query: string) => void` | Sets assignment Autocomplete search text |
| `openVariableEditor` | `(groupItemId: string) => void` | Opens variable editor for a recipient |
| `closeVariableEditor` | `(groupItemId: string) => void` | Closes editor, **deletes** entry from `variableEditorState` to prevent leaks |
| `setVariableValue` | `(groupItemId: string, variableKey: string, value: unknown) => void` | Sets a single variable value in the editor |
| `setVariableEditorSaving` | `(groupItemId: string, saving: boolean) => void` | Sets the `saving` flag on a variable editor entry |
| `setVariableEditorErrors` | `(groupItemId: string, errors: Record<string, string>) => void` | Sets validation errors from server response |
| `clearVariableEditorErrors` | `(groupItemId: string) => void` | Clears validation errors |
| `setOperationsMenuAnchor` | `(anchor: HTMLElement \| null) => void` | Sets/clears operations menu anchor |
| `openDeleteConfirm` | `(groupId: string) => void` | Opens delete confirmation for a group |
| `closeDeleteConfirm` | `() => void` | Closes delete confirmation |
| `openDuplicateDialog` | `(groupId: string) => void` | Opens duplication dialog |
| `closeDuplicateDialog` | `() => void` | Closes duplication dialog |
| `openImportExportDialog` | `() => void` | Opens CSV import/export dialog |
| `closeImportExportDialog` | `() => void` | Closes import/export dialog |
| `setLastSkipped` | `(entries: SkippedEntry[] \| null) => void` | Sets the skipped entries for snackbar display |
| `resetState` | `() => void` | Resets entire state to initial values (called on navigation away) |

### GraphQL Documents

All documents live in `frontend/common/graphql/sharedDocuments/certificates/certificateRecipientGroup.documents.ts` with barrel re-export from `certificates/index.ts`.

#### `RecipientGroupListQueryDocument` (Query)

Variables: `{ search: string; page: number; pageSize: number; sortBy: SortField; sortDir: SortDir }`
Returns: `{ recipientGroups: { id, totalCount, rows: [{ id, name, description, template: { id, name }, studentCount, status, createdAt, createdBy: { id, name } }], pageInfo: { hasNextPage, hasPrevPage, totalPages } } }`

#### `RecipientGroupDetailQueryDocument` (Query)

Variables: `{ id: string; studentPage: number; studentPageSize: number }`
Returns: `{ recipientGroup: { id, name, description, status, createdAt, updatedAt, createdBy: { id, name }, template: { id, name, status }, students: { totalCount, rows: [{ id, groupItemId, student: { id, name, email, grade, status }, variableStatus, variableValues: [{ variableId, value }] }], pageInfo: { hasNextPage, hasPrevPage, totalPages } }, template: { id, name, variables: [{ id, key, label, type, required, config }] } } }`

Content ref: Full fragment composition:
```
recipientGroup {
  id, name, description, status, createdAt, updatedAt
  createdBy { id, name }
  template { id, name, status
    variables { id, key, label, type, required, config }
  }
  students(limit: $studentPageSize, offset: $studentPage) {
    totalCount
    rows {
      id  # groupItem id
      student { id, name, email, grade, status }
      variableStatus  # "filled" | "unfilled" | "partial" (server-computed)
      variableValues { variableId, value }
    }
    pageInfo { hasNextPage, hasPrevPage, totalPages }
  }
}
```

#### `CreateRecipientGroupMutationDocument` (Mutation)

Variables: `{ name: string; description?: string; templateId: string }`
Returns: `{ createRecipientGroup: { id, name, description, status, template: { id, name }, studentCount, createdAt, createdBy: { id, name } } }`

#### `UpdateRecipientGroupMutationDocument` (Mutation)

Variables: `{ id: string; name?: string; description?: string; templateId?: string }`
Returns: `{ updateRecipientGroup: { id, name, description, template: { id, name } } }`

#### `DeleteRecipientGroupMutationDocument` (Mutation)

Variables: `{ id: string }`
Returns: `{ deleteRecipientGroup: { success: boolean } }`

#### `DuplicateRecipientGroupMutationDocument` (Mutation)

Variables: `{ id: string; newName: string; idempotencyKey: string }`
Returns: `{ duplicateRecipientGroup: { id, name, description, template: { id, name }, studentCount, createdAt, createdBy: { id, name } } }`

Note: `idempotencyKey` passed via Apollo mutation context header — consumed by `idempotency.service.ts` on the server.

#### `AddStudentsToGroupMutationDocument` (Mutation)

Variables: `{ groupId: string; studentIds: string[] }`
Returns: `{ addStudentsToGroup: { addedCount: number; skipped: [{ studentId: string; studentName: string; reason: string }] } }`

#### `RemoveStudentsFromGroupMutationDocument` (Mutation)

Variables: `{ groupId: string; studentIds: string[] }`
Returns: `{ removeStudentsFromGroup: { removedCount: number } }`

#### `UpsertVariableValuesMutationDocument` (Mutation)

Variables: `{ groupItemId: string; values: [{ variableId: string; value: unknown }] }`
Returns: `{ upsertVariableValues: { success: boolean; valueErrors: [{ variableId: string; errorKey: string }] } }`

Server validates each value against the template variable config (min/max for numbers, options for select, required). `valueErrors` is empty on success; if non-empty, no values are persisted (atomic).

#### `StudentSearchQueryDocument` (Query)

Variables: `{ search: string; excludeGroupId: string; page: number; pageSize: number }`
Returns: `{ searchStudents: { totalCount, rows: [{ id, name, email, grade, status }], pageInfo: { hasNextPage, hasPrevPage, totalPages } } }`

Note: Uses prefix-based `ILIKE 'term%'` (index-friendly) — not `ILIKE '%term%'`. Reuses `student-field-acl.ts` for authorization scoping. `excludeGroupId` uses `ANTI JOIN` against `certificate_recipient_group_items` (not `NOT IN` subquery).

#### `TemplateListForSelectQueryDocument` (Query)

Variables: `{ search?: string; status: "PUBLISHED" }`
Returns: `{ certificateTemplates: { rows: [{ id, name, status }], totalCount } }`

Used to populate the template dropdown in the Create/Edit dialog.

#### `ExportGroupMembersQueryDocument` (Query)

Variables: `{ id: string }`
Returns: `{ recipientGroup: { name, description, students: { totalCount, rows: [{ student: { id, name, email, grade } }] } } }`

Used for CSV export — fetches all members (no pagination) and triggers client-side CSV generation via `Blob`.

### ViewModel Return Types

#### `useRecipientGroupListViewModel(props) → RecipientGroupListViewModel`

Called by `RecipientGroupListContainer`. Returns a flat readonly object:

| Field | Type | Source | Description |
|---|---|---|---|
| `loading` | `boolean` | `listQuery.loading` | Apollo loading state |
| `error` | `ApolloError \| undefined` | `listQuery.error` | Apollo error |
| `groups` | `RecipientGroupRow[]` | `listQuery.data` mapped via `mapRecipientGroupRows` | Mapped list rows |
| `totalCount` | `number` | `listQuery.data.recipientGroups.totalCount` | Total groups matching query |
| `pageInfo` | `PageInfo` | `listQuery.data.recipientGroups.pageInfo` | Pagination info |
| `searchQuery` | `string` | `store.searchQuery` | Current search (debounced to Apollo) |
| `page` | `number` | `store.page` | Current page |
| `pageSize` | `number` | `store.pageSize` | Page size |
| `sortBy` | `SortField` | `store.sortBy` | Sort column |
| `sortDir` | `SortDir` | `store.sortDir` | Sort direction |
| `selectedGroupIds` | `Set<string>` | `store.selectedGroupIds` | Multi-select set |
| `permissions` | `{ canCreate, canDelete, canDuplicate, canEditAll }` | `useUserStore` role check | Role-based action capabilities |
| `labels` | `RecipientGroupListLabels` | `useMemo` | Translated labels (title, headers, actions, empty/error states) |
| `handlers` | `RecipientGroupListHandlers` | methods | Event handlers (see below) |

Handlers:
- `handleSearchChange(value: string): void`
- `handlePageChange(page: number): void`
- `handlePageSizeChange(size: number): void`
- `handleSortChange(field: SortField, dir: SortDir): void`
- `handleRowClick(groupId: string): void` — navigates to `/certificates/recipient-groups/[id]`
- `handleCreateClick(): void` — opens create dialog
- `handleEditClick(groupId: string): void` — opens rename dialog
- `handleDuplicateClick(groupId: string): void` — opens duplicate dialog
- `handleDeleteClick(groupId: string): void` — opens delete confirm
- `handleSelectionToggle(groupId: string): void`
- `handleClearSelection(): void`

#### `useRecipientGroupDetailViewModel(props) → RecipientGroupDetailViewModel`

Called by `RecipientGroupDetailContainer`. Returns:

| Field | Type | Source | Description |
|---|---|---|---|
| `loading` | `boolean` | `detailQuery.loading` | Apollo loading |
| `error` | `ApolloError \| undefined` | `detailQuery.error` | Apollo error |
| `group` | `RecipientGroupDetailData \| null` | `detailQuery.data` mapped | Group detail data |
| `students` | `GroupStudentRow[]` | `detailQuery.data.students.rows` | Student list with variableStatus |
| `studentPageInfo` | `PageInfo` | `detailQuery.data.students.pageInfo` | Student pagination |
| `studentPage` | `number` | `store.studentPage` (local) | Current student page |
| `searchStudentsLoading` | `boolean` | `searchQuery.loading` | Assignment Autocomplete loading |
| `searchStudents` | `StudentSearchRow[]` | `searchQuery.data` | Assignment Autocomplete results |
| `createDialogOpen` | `boolean` | `store.createDialogOpen` | Rename dialog visibility |
| `editingGroupId` | `string \| null` | `store.editingGroupId` | Edit mode ID |
| `assignmentDialogOpen` | `boolean` | `store.assignmentDialogOpen` | Assignment dialog visibility |
| `assignmentSelectedStudentIds` | `Set<string>` | `store.assignmentSelectedStudentIds` | Selected students in assignment |
| `assignmentSearchQuery` | `string` | `store.assignmentSearchQuery` | Assignment search text |
| `variableEditorState` | `Record<string, VariableEditorEntry>` | `store.variableEditorState` | Per-recipient variable editor state |
| `operationsMenuAnchor` | `HTMLElement \| null` | `store.operationsMenuAnchor` | Operations menu anchor |
| `deleteConfirmGroupId` | `string \| null` | `store.deleteConfirmGroupId` | Delete confirmation target |
| `duplicateDialogGroupId` | `string \| null` | `store.duplicateDialogGroupId` | Duplication target |
| `isOwner` | `boolean` | `useUserStore` check | Whether current user is group creator (TEACHER scope) |
| `permissions` | `{ canEdit, canDelete, canDuplicate, canAssignStudents, canEditVariables }` | `useUserStore` | Role + ownership action capabilities |
| `labels` | `RecipientGroupDetailLabels` | `useMemo` | Translated labels (header, student table, variable status, operations) |
| `mutations` | `DetailMutations` | Apollo hooks | Mutation functions (see below) |
| `handlers` | `DetailHandlers` | methods | Event handlers (see below) |

Mutations:
- `createGroup(input: CreateRecipientGroupInput): Promise<void>`
- `updateGroup(input: UpdateRecipientGroupInput): Promise<void>`
- `deleteGroup(id: string): Promise<void>`
- `duplicateGroup(id: string, newName: string): Promise<void>`
- `addStudents(groupId: string, studentIds: string[]): Promise<{ addedCount: number; skipped: SkippedEntry[] }>`
- `removeStudents(groupId: string, studentIds: string[]): Promise<{ removedCount: number }>`
- `upsertVariableValues(groupItemId: string, values: VariableValueInput[]): Promise<{ success: boolean; valueErrors: VariableValueError[] }>`

Handlers:
- `handleBackClick(): void` — navigates to `/certificates/recipient-groups`
- `handleStudentPageChange(page: number): void`
- `handleOpenRename(): void`
- `handleOpenAssignment(): void`
- `handleAssignmentSearchChange(value: string): void`
- `handleToggleAssignmentStudent(studentId: string): void`
- `handleClearAssignmentSelection(): void`
- `handleAddSelectedStudents(): Promise<void>` — calls mutation, updates Apollo cache, shows skipped snackbar
- `handleRemoveStudent(groupItemId: string, studentId: string): Promise<void>`
- `handleExportMembers(): void` — fetches full list and downloads CSV
- `handleImportMembers(rows: ImportedStudentRow[]): Promise<void>` — CSV import flow
- `handleOpenVariableEditor(groupItemId: string): void`
- `handleCloseVariableEditor(groupItemId: string): void`
- `handleVariableValueChange(groupItemId: string, variableKey: string, value: unknown): void`
- `handleVariableSave(groupItemId: string): Promise<void>` — calls mutation, sets errors from response
- `handleOperationsMenuOpen(event: React.SyntheticEvent<HTMLElement>): void`
- `handleOperationsMenuClose(): void`
- `handleDuplicateClick(): void`
- `handleDeleteClick(): void`
- `handleConfirmDelete(): Promise<void>`
- `handleConfirmDuplicate(newName: string): Promise<void>`

### Component Props — Complete Interfaces

#### RecipientGroupListContainer

| Prop | Type | Description |
|---|---|---|
| `locale` | `string` | Current locale from page params |

(must include `'"use client"'` directive, wraps ViewModel in `<RequirePermission permissions={[AppPermission.CertificateRecipientGroupView]} fallback={<NoPermissionView />}>`)

#### RecipientGroupDetailContainer

| Prop | Type | Description |
|---|---|---|
| `locale` | `string` | Current locale |
| `groupId` | `string` | Group ID from route params |

#### RecipientGroupListView (Switcher)

| Prop | Type | Description |
|---|---|---|
| `viewModel` | `RecipientGroupListViewModel` | Full ViewModel from Container |

#### RecipientGroupDetailView (Switcher)

| Prop | Type | Description |
|---|---|---|
| `viewModel` | `RecipientGroupDetailViewModel` | Full ViewModel from Container |

#### CreateRecipientGroupDialog

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `editingGroupId` | `string \| null` | Null = create mode, non-null = rename mode (prefills fields) |
| `initialValues` | `{ name?: string; description?: string; templateId?: string } \| undefined` | Prefill values for rename |
| `templateOptions` | `TemplateOption[]` | Published templates for dropdown (from `TemplateListForSelectQueryDocument`) |
| `onClose` | `() => void` | Close handler |
| `onSubmit` | `(input: CreateRecipientGroupInput) => Promise<void>` | Submit handler (routes to create or update mutation in ViewModel) |
| `submitting` | `boolean` | Mutation in-progress state (disables submit button) |
| `labels` | `CreateRecipientGroupDialogLabels` | Translated labels (title, fields, buttons, validation) |

#### StudentAssignmentDialog

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `groupId` | `string` | Group to add students to |
| `searchLoading` | `boolean` | Apollo search loading |
| `searchResults` | `StudentSearchRow[]` | Search results from `StudentSearchQueryDocument` |
| `selectedStudentIds` | `Set<string>` | Currently selected students |
| `searchQuery` | `string` | Current search text |
| `onSearchChange` | `(value: string) => void` | Search text change handler |
| `onToggleStudent` | `(studentId: string) => void` | Toggle student selection |
| `onClearSelection` | `() => void` | Clear all selected |
| `onSubmit` | `() => Promise<void>` | Add selected students (calls `addStudents` mutation) |
| `onClose` | `() => void` | Close dialog and clear selection |
| `submitting` | `boolean` | Mutation in-progress |
| `lastSkipped` | `SkippedEntry[] \| null` | Last operation skipped entries (for inline summary) |
| `labels` | `StudentAssignmentDialogLabels` | Translated labels |

#### RemoveStudentsConfirmDialog

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `studentCount` | `number` | Number of students being removed (for pluralized message) |
| `onConfirm` | `() => void` | Confirm removal |
| `onClose` | `() => void` | Cancel |
| `isLastMember` | `boolean` | Whether removal empties the group (shows extra warning) |
| `labels` | `RemoveStudentsConfirmDialogLabels` | Translated labels (includes pluralized `removeConfirmMessage(count)`) |

#### VariableValueEditor

| Prop | Type | Description |
|---|---|---|
| `groupItemId` | `string` | Recipient group item ID |
| `variables` | `TemplateVariableDefinition[]` | Template variable definitions (from detail query) |
| `existingValues` | `Record<string, unknown>` | Current per-recipient values from detail query |
| `editorState` | `VariableEditorEntry` | Editor state from Zustand (open, values, saving, errors) |
| `onValueChange` | `(variableKey: string, value: unknown) => void` | Sets a value in Zustand editor state |
| `onSave` | `() => Promise<void>` | Save handler (calls `upsertVariableValues` mutation) |
| `onCancel` | `() => void` | Cancel handler (closes editor, discards changes) |
| `labels` | `VariableValueEditorLabels` | Translated labels |

#### VariableStatusBadge

| Prop | Type | Description |
|---|---|---|
| `status` | `'filled' \| 'unfilled' \| 'partial'` | Server-computed status |
| `labels` | `{ filled: string; unfilled: string; partial: string }` | Translated status labels |

#### GroupOperationsMenu

| Prop | Type | Description |
|---|---|---|
| `anchorEl` | `HTMLElement \| null` | Menu anchor (null = closed) |
| `groupId` | `string` | Target group |
| `permissions` | `{ canDuplicate: boolean; canDelete: boolean; canRename: boolean; canChangeTemplate: boolean }` | Role-based menu item visibility |
| `onRename` | `() => void` | Rename action |
| `onDuplicate` | `() => void` | Duplicate action |
| `onChangeTemplate` | `() => void` | Change template action |
| `onDelete` | `() => void` | Delete action |
| `onClose` | `() => void` | Close menu |
| `labels` | `GroupOperationsMenuLabels` | Translated labels |

#### DeleteGroupConfirmDialog

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `groupName` | `string` | Group being deleted |
| `studentCount` | `number` | Member count warning |
| `onConfirm` | `() => void` | Confirm deletion |
| `onClose` | `() => void` | Cancel |
| `submitting` | `boolean` | Mutation in-progress |
| `labels` | `DeleteGroupConfirmDialogLabels` | Translated labels |

#### DuplicateGroupDialog

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `originalName` | `string` | Source group name |
| `onConfirm` | `(newName: string) => void` | Confirm with new name |
| `onClose` | `() => void` | Cancel |
| `submitting` | `boolean` | Mutation in-progress |
| `labels` | `DuplicateGroupDialogLabels` | Translated labels |

#### ImportMembersDialog

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `groupId` | `string` | Target group |
| `onSubmit` | `(rows: ImportedStudentRow[]) => Promise<void>` | Parse CSV rows and add students |
| `onClose` | `() => void` | Close dialog |
| `submitting` | `boolean` | Mutation in-progress |
| `labels` | `ImportMembersDialogLabels` | Translated labels |

#### ChangeTemplateDialog

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `currentTemplateId` | `string` | Current template |
| `templateOptions` | `TemplateOption[]` | Published templates for dropdown |
| `onConfirm` | `(newTemplateId: string) => void` | Confirm template change |
| `onClose` | `() => void` | Cancel |
| `submitting` | `boolean` | Mutation in-progress |
| `labels` | `ChangeTemplateDialogLabels` | Translated labels (includes warning about existing variable values) |

---

## Component Hierarchy

```
app/(dashboard)/certificates/recipient-groups/
├── page.tsx                                    # List page (Server Component)
│   └── getTranslations(locale) → title metadata
│   └── <RecipientGroupListContainer locale={locale} />
│
└── [id]/
    └── page.tsx                                # Detail page (Server Component)
        └── getTranslations(locale) → title metadata
        └── <RecipientGroupDetailContainer locale={locale} groupId={params.id} />

frontend/common/views/dashboard/certificates/recipient-groups/
├── recipientGroupListContainer.tsx             # "use client" → useRecipientGroupListViewModel → RequirePermission → <RecipientGroupListView>
├── useRecipientGroupListViewModel.ts            # Apollo useQuery, Zustand store, labels, handlers
├── recipientGroupListView.tsx                   # Switcher: createLazyView + ResponsiveViewSwitch
├── recipientGroupDetailContainer.tsx           # "use client" → useRecipientGroupDetailViewModel → RequirePermission → <RecipientGroupDetailView>
├── useRecipientGroupDetailViewModel.ts          # Apollo useQuery (detail + student search), mutations, labels, handlers
├── recipientGroupDetailView.tsx                 # Switcher: createLazyView + ResponsiveViewSwitch
├── types/
│   └── recipientGroup.types.ts                 # Row types, summary types (imports from graphql-types.ts)
├── schemas/
│   └── recipientGroup.schema.ts                # Zod validation schemas (create, rename, duplicate, import)
├── utils/
│   ├── buildRecipientGroupLabels.ts            # Labels builder (Rule 7 pattern)
│   ├── mapRecipientGroupRows.ts                # Apollo data → row mapping
│   └── exportGroupMembersCsv.ts                # CSV export utility (rows → Blob download)
└── shared/
    ├── createRecipientGroupDialog.tsx           # Create/edit dialog (shared desktop/mobile)
    ├── studentAssignmentDialog.tsx             # Student search Autocomplete + multi-select table
    ├── removeStudentsConfirmDialog.tsx         # Removal confirmation (pluralized)
    ├── variableValueEditor.tsx                 # Variable value form (shared core logic)
    ├── variableStatusBadge.tsx                 # Filled/unfilled/partial badge
    ├── groupOperationsMenu.tsx                 # Duplicate/rename/delete/change template menu
    ├── deleteGroupConfirmDialog.tsx            # Group deletion confirmation
    ├── duplicateGroupDialog.tsx               # Duplication dialog (new name input)
    ├── changeTemplateDialog.tsx               # Template re-association with warning
    └── importMembersDialog.tsx                 # CSV upload + preview + confirm

frontend/desktop/views/dashboard/certificates/recipient-groups/
├── recipientGroupList.desktop.tsx              # Desktop list: PageContainer→PageHeader→SectionPanel→DesktopAppDataGrid
├── recipientGroupDetail.desktop.tsx            # Desktop detail: header + student table + inline variable row
└── components/
    ├── desktopVariableRow.tsx                  # Inline expandable variable row (per student in detail)
    ├── desktopStudentTable.tsx                 # AppDataGrid with student columns + variable status
    └── desktopDetailHeader.tsx                 # Group detail header with inline rename + operations menu

frontend/mobile/views/dashboard/certificates/recipient-groups/
├── recipientGroupList.mobile.tsx              # Mobile list: MobilePageContainer→MobilePageHeader→MobileCardList
├── recipientGroupDetail.mobile.tsx            # Mobile detail: header + card list + full-screen dialog
└── components/
    ├── mobileVariableDialog.tsx                # Full-screen variable editing dialog
    ├── mobileStudentCard.tsx                   # Student card with expandable variable status accordion
    └── mobileAssignmentSheet.tsx               # Bottom sheet variant of student assignment

frontend/common/stores/
└── recipientGroupStore.ts                      # Zustand store (search, pagination, dialog flags, editor state)

frontend/common/graphql/sharedDocuments/certificates/
├── certificateRecipientGroup.documents.ts      # All recipient group queries/mutations (per INTER_PLAN_CONTRACTS §17)
└── index.ts                                    # Barrel: export * from "./certificateRecipientGroup.documents"

shared/locale/
├── types/certificates/recipient-groups.ts       # i18n type schema (all keys documented below)
├── ar/certificates/recipient-groups.ts           # Arabic implementation
├── en/certificates/recipient-groups.ts           # English implementation
└── namespaces/certificates/recipient-groups.namespace.ts  # Namespace handle
```

### Container → ViewModel → Switcher → Tier View flow

```
Server Component (page.tsx)
  └── Container (recipientGroupListContainer.tsx)
      └── useRecipientGroupListViewModel({ locale })
          ├── useQuery(RecipientGroupListQueryDocument, { variables: { search, page, pageSize, sortBy, sortDir } })
          ├── useRecipientGroupStore (search, pagination, selection, dialog state)
          ├── useUserStore (role → permissions)
          ├── useAppTranslation(Translation.Certificates.RecipientGroups)
          ├── useMemo(() => buildRecipientGroupLabels(t), [t])
          ├── handlers (search, sort, page, row click, create, edit, delete)
          └── returns ReadonlyRecipientGroupListViewModel
      └── <RequirePermission permissions={[AppPermission.CertificateRecipientGroupView]} fallback={<NoPermissionView />}>
          └── <RecipientGroupListView viewModel={viewModel} />
              └── ResponsiveViewSwitch
                  ├── desktop: lazy(() => import(".../recipientGroupList.desktop.tsx"))
                  └── mobile: lazy(() => import(".../recipientGroupList.mobile.tsx"))
```

---

## Data Model References

### Tables Used (from Plan 1)

| Table | Usage |
|---|---|
| `certificate_recipient_groups` | Group metadata (name, description, templateId, status, deletedAt) |
| `certificate_recipient_group_items` | Student-group associations (groupId, studentId, addedAt) |
| `recipient_group_item_variable_values` | Per-recipient variable value overrides (groupItemId, variableId, value) |
| `certificate_templates` | Template info for association display |
| `certificate_template_variables` | Variable definitions for variable editing forms |

---

## Error Handling Strategy

| Error Scenario | Handling |
|---|---|
| Group not found | Navigate to 404 page, show toast "Group not found" |
| Permission denied | `RequirePermission` guard blocks rendering, redirects to dashboard |
| Create mutation fails | Keep dialog open, show `FormErrorSnackbar` with translated error, preserve field values |
| Add students fails | Keep assignment dialog open, show error in dialog |
| Remove students fails | Close confirmation, show error toast |
| Variable save fails | Keep editor open, show error in editor panel |
| Student search fails | Show error in Autocomplete dropdown |
| Duplicate fails | Close confirmation, show error toast |
| Delete fails (non-empty) | Delete button disabled with tooltip, no mutation attempted |
| Template change fails | Close confirmation, show error toast |

---

## i18n Design

### Namespace Structure

Translation keys for Plan 14 live in the `certificates` i18n namespace under the `recipientGroups` sub-domain.

**Type file**: `shared/locale/types/certificates/recipient-groups.ts`
**AR impl**: `shared/locale/ar/certificates/recipient-groups.ts`
**EN impl**: `shared/locale/en/certificates/recipient-groups.ts`
**Namespace handle**: `shared/locale/namespaces/certificates/recipient-groups.namespace.ts`

### Sub-Domains

| Sub-Domain | Keys | Purpose |
|---|---|---|
| `list` | 18 keys + 2 pluralized | List page: title, subtitle, search, table headers, empty/loading/error states, pagination, breadcrumbs, actions |
| `create` | 14 keys | Create/rename dialog: title, labels, placeholders, validation errors, success message |
| `detail` | 28 keys + 5 pluralized | Detail view: header, student table headers, variable status badge, add/remove confirm, import/export, operations |
| `variables` | 24 keys + 8 interpolated | Variable editor: labels, validation errors, hints, server validation errors, save success |
| `operations` | 18 keys | Group operations: duplicate, rename, delete, change template, menu labels, confirmations |
| `errors` | 16 keys + 1 interpolated | Error messages for all failure scenarios |
| `permissions` | 4 keys | Role-based access messages (noPermission, viewOnly, ownGroupsOnly) |

### Complete Key Listing

#### `list` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `pageTitle` | `string` | "Recipient Groups" | "مجموعات المستلمين" |
| `pageSubtitle` | `string` | "Manage certificate recipient groups" | "إدارة مجموعات مستلمي الشهادات" |
| `searchPlaceholder` | `string` | "Search by group name..." | "البحث باسم المجموعة..." |
| `createButton` | `string` | "Create Group" | "إنشاء مجموعة" |
| `columnName` | `string` | "Group Name" | "اسم المجموعة" |
| `columnTemplate` | `string` | "Template" | "القالب" |
| `columnMembers` | `string` | "Members" | "الأعضاء" |
| `columnStatus` | `string` | "Status" | "الحالة" |
| `columnCreatedBy` | `string` | "Created By" | "أنشأ بواسطة" |
| `columnCreated` | `string` | "Created Date" | "تاريخ الإنشاء" |
| `columnActions` | `string` | "Actions" | "إجراءات" |
| `statusActive` | `string` | "Active" | "نشط" |
| `statusArchived` | `string` | "Archived" | "مؤرشف" |
| `emptyTitle` | `string` | "No recipient groups yet" | "لا توجد مجموعات مستلمين بعد" |
| `emptyMessage` | `string` | "Create your first recipient group to get started" | "أنشئ أول مجموعة مستلمين للبدء" |
| `noResultsTitle` | `string` | "No matching groups" | "لا توجد مجموعات مطابقة" |
| `noResultsMessage` | `string` | "Try a different search term" | "جرّب كلمة بحث مختلفة" |
| `errorLoading` | `string` | "Failed to load recipient groups" | "فشل تحميل مجموعات المستلمين" |
| `paginationSummary` | `(from: number, to: number, total: number) => string` | "Showing {from}–{to} of {total}" | "عرض {from}–{to} من {total}" |
| `memberCount` | `(count: number) => string` | pluralized | pluralized (Arabic rules) |

#### `create` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `createTitle` | `string` | "Create Recipient Group" | "إنشاء مجموعة مستلمين" |
| `renameTitle` | `string` | "Rename Recipient Group" | "إعادة تسمية مجموعة المستلمين" |
| `nameLabel` | `string` | "Group Name" | "اسم المجموعة" |
| `namePlaceholder` | `string` | "Enter group name" | "أدخل اسم المجموعة" |
| `nameRequired` | `string` | "Group name is required" | "اسم المجموعة مطلوب" |
| `nameMaxLength` | `string` | "Maximum 100 characters" | "الحد الأقصى 100 حرف" |
| `descriptionLabel` | `string` | "Description" | "الوصف" |
| `descriptionPlaceholder` | `string` | "Optional description" | "وصف اختياري" |
| `descriptionMaxLength` | `string` | "Maximum 500 characters" | "الحد الأقصى 500 حرف" |
| `templateLabel` | `string` | "Certificate Template" | "قالب الشهادة" |
| `templatePlaceholder` | `string` | "Select a template" | "اختر قالباً" |
| `templateRequired` | `string` | "Template is required" | "القالب مطلوب" |
| `cancelButton` | `string` | "Cancel" | "إلغاء" |
| `createButton` | `string` | "Create Group" | "إنشاء المجموعة" |
| `renameButton` | `string` | "Save Changes" | "حفظ التغييرات" |
| `createSuccess` | `(name: string) => string` | "Group '{name}' created successfully" | "تم إنشاء المجموعة '{name}' بنجاح" |
| `renameSuccess` | `(name: string) => string` | "Group renamed to '{name}'" | "تمت إعادة تسمية المجموعة إلى '{name}'" |

#### `detail` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `backButton` | `string` | "Back to Groups" | "العودة للمجموعات" |
| `addStudents` | `string` | "Add Students" | "إضافة طلاب" |
| `importMembers` | `string` | "Import from CSV" | "استيراد من CSV" |
| `exportMembers` | `string` | "Export Members" | "تصدير الأعضاء" |
| `studentColumnName` | `string` | "Student Name" | "اسم الطالب" |
| `studentColumnEmail` | `string` | "Email" | "البريد الإلكتروني" |
| `studentColumnGrade` | `string` | "Grade" | "الصف" |
| `studentColumnStatus` | `string` | "Status" | "الحالة" |
| `studentColumnVariableStatus` | `string` | "Variable Status" | "حالة المتغيرات" |
| `studentColumnActions` | `string` | "Actions" | "إجراءات" |
| `removeStudentTooltip` | `string` | "Remove from group" | "إزالة من المجموعة" |
| `editVariablesTooltip` | `string` | "Edit variable values" | "تعديل قيم المتغيرات" |
| `expandVariablesTooltip` | `string` | "Show variable values" | "عرض قيم المتغيرات" |
| `templateVariablesTitle` | `string` | "Template Variables" | "متغيرات القالب" |
| `templateVariablesWarning` | `string` | "All recipients must fill required variables before certificate generation" | "يجب على جميع المستلمين تعبئة المتغيرات المطلوبة قبل إنشاء الشهادات" |
| `removeConfirmTitle` | `string` | "Remove Student" | "إزالة الطالب" |
| `removeConfirmMessage` | `(count: number) => string` | pluralized | pluralized |
| `lastMemberWarning` | `string` | "This is the last member. Removing will leave the group empty." | "هذا آخر عضو. الإزالة ستترك المجموعة فارغة." |
| `removeButton` | `string` | "Remove" | "إزالة" |
| `addSuccessMessage` | `(count: number) => string` | pluralized | pluralized |
| `removeSuccessMessage` | `(count: number) => string` | pluralized | pluralized |
| `someSkipped` | `(count: number) => string` | pluralized | pluralized |
| `variableStatus.filled` | `string` | "Filled" | "مكتمل" |
| `variableStatus.unfilled` | `string` | "Not Filled" | "غير مكتمل" |
| `variableStatus.partial` | `string` | "Partial" | "جزئي" |
| `errorLoadingDetail` | `string` | "Failed to load group details" | "فشل تحميل تفاصيل المجموعة" |
| `groupNotFound` | `string` | "Group not found" | "المجموعة غير موجودة" |
| `exportSuccess` | `string` | "Members exported successfully" | "تم تصدير الأعضاء بنجاح" |
| `exportButton` | `string` | "Export" | "تصدير" |
| `importButton` | `string` | "Import" | "استيراد" |
| `importSuccess` | `(count: number) => string` | pluralized | pluralized |
| `importSkipped` | `(count: number) => string` | pluralized | pluralized |

#### `variables` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `editorTitle` | `string` | "Variable Values" | "قيم المتغيرات" |
| `saveButton` | `string` | "Save Values" | "حفظ القيم" |
| `cancelButton` | `string` | "Cancel" | "إلغاء" |
| `requiredError` | `(field: string) => string` | "{field} is required" | "{field} مطلوب" |
| `minLengthError` | `(min: number) => string` | "Minimum {min} characters" | "الحد الأدنى {min} أحرف" |
| `maxLengthError` | `(max: number) => string` | "Maximum {max} characters" | "الحد الأقصى {max} حرف" |
| `minValueError` | `(min: number) => string` | "Minimum {min}" | "الحد الأدنى {min}" |
| `maxValueError` | `(max: number) => string` | "Maximum {max}" | "الحد الأقصى {max}" |
| `minDateError` | `(date: string) => string` | "Earliest date {date}" | "أقدم تاريخ {date}" |
| `maxDateError` | `(date: string) => string` | "Latest date {date}" | "أحدث تاريخ {date}" |
| `selectPlaceholder` | `string` | "Select an option" | "اختر خياراً" |
| `datePlaceholder` | `string` | "Select date" | "اختر التاريخ" |
| `numberPlaceholder` | `string` | "Enter number" | "أدخل رقماً" |
| `textPlaceholder` | `string` | "Enter text" | "أدخل النص" |
| `saveSuccess` | `string` | "Variable values saved" | "تم حفظ قيم المتغيرات" |
| `valueInvalid` | `string` | "Invalid value" | "قيمة غير صالحة" |
| `valueOutOfRange` | `string` | "Value is out of range" | "القيمة خارج النطاق" |
| `selectKeyMissing` | `string` | "Selected option is not available" | "الخيار المحدد غير متاح" |
| `serverValidationFailed` | `string` | "Server validation failed" | "فشل التحقق من الخادم" |

#### `operations` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `menuRename` | `string` | "Rename" | "إعادة تسمية" |
| `menuDuplicate` | `string` | "Duplicate" | "نسخ" |
| `menuChangeTemplate` | `string` | "Change Template" | "تغيير القالب" |
| `menuDelete` | `string` | "Delete" | "حذف" |
| `duplicateTitle` | `string` | "Duplicate Group" | "نسخ المجموعة" |
| `duplicateNewNameLabel` | `string` | "New Group Name" | "اسم المجموعة الجديد" |
| `duplicateConfirmButton` | `string` | "Duplicate" | "نسخ" |
| `duplicateSuccess` | `(name: string) => string` | "Group duplicated as '{name}'" | "تم نسخ المجموعة باسم '{name}'" |
| `deleteTitle` | `string` | "Delete Group" | "حذف المجموعة" |
| `deleteWarning` | `(name: string) => string` | "Are you sure you want to delete '{name}'?" | "هل أنت متأكد من حذف '{name}'?" |
| `deleteStudentCountWarning` | `(count: number) => string` | pluralized | pluralized |
| `deleteCannotUndo` | `string` | "This action cannot be undone" | "لا يمكن التراجع عن هذا الإجراء" |
| `deleteConfirmButton` | `string` | "Delete Group" | "حذف المجموعة" |
| `deleteSuccess` | `(name: string) => string` | "Group '{name}' deleted" | "تم حذف المجموعة '{name}'" |
| `changeTemplateTitle` | `string` | "Change Template" | "تغيير القالب" |
| `changeTemplateWarning` | `string` | "Changing the template will reset all variable values. This cannot be undone." | "تغيير القالب سيؤدي إلى إعادة تعيين جميع قيم المتغيرات. لا يمكن التراجع عن ذلك." |
| `changeTemplateConfirmButton` | `string` | "Change Template" | "تغيير القالب" |
| `changeTemplateSuccess` | `string` | "Template changed successfully" | "تم تغيير القالب بنجاح" |

#### `errors` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `groupNotFound(id)` | `(id: string) => string` | "Group not found: {id}" | "المجموعة غير موجودة: {id}" |
| `permissionDenied` | `string` | "You do not have permission to manage recipient groups" | "ليس لديك صلاحية لإدارة مجموعات المستلمين" |
| `createFailed` | `string` | "Failed to create group" | "فشل إنشاء المجموعة" |
| `updateFailed` | `string` | "Failed to update group" | "فشل تحديث المجموعة" |
| `deleteFailed` | `string` | "Failed to delete group" | "فشل حذف المجموعة" |
| `duplicateFailed` | `string` | "Failed to duplicate group" | "فشل نسخ المجموعة" |
| `addStudentsFailed` | `string` | "Failed to add students" | "فشل إضافة الطلاب" |
| `removeStudentsFailed` | `string` | "Failed to remove students" | "فشل إزالة الطلاب" |
| `saveVariablesFailed` | `string` | "Failed to save variable values" | "فشل حفظ قيم المتغيرات" |
| `searchStudentsFailed` | `string` | "Student search failed" | "فشل البحث عن الطلاب" |
| `exportFailed` | `string` | "Failed to export members" | "فشل تصدير الأعضاء" |
| `importFailed` | `string` | "Failed to import members" | "فشل استيراد الأعضاء" |
| `templateChangeFailed` | `string` | "Failed to change template" | "فشل تغيير القالب" |
| `csvParseError` | `string` | "Invalid CSV format" | "صيغة CSV غير صالحة" |
| `csvMissingHeader` | `(header: string) => string` | "CSV must include '{header}' column" | "يجب أن يحتوي CSV على عمود '{header}'" |
| `networkError` | `string` | "Network error. Please try again." | "خطأ في الشبكة. يرجى المحاولة مرة أخرى." |

#### `permissions` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `noPermission` | `string` | "You do not have permission to access recipient groups" | "ليس لديك صلاحية للوصول إلى مجموعات المستلمين" |
| `viewOnly` | `string` | "You have view-only access. Contact an admin to manage groups." | "لديك صلاحية العرض فقط. اتصل بالمسؤول لإدارة المجموعات." |
| `ownGroupsOnly` | `string` | "Showing your groups only" | "عرض مجموعاتك فقط" |

#### `breadcrumbs` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `dashboard` | `string` | "Dashboard" | "لوحة التحكم" |
| `certificates` | `string` | "Certificates" | "الشهادات" |
| `recipientGroups` | `string` | "Recipient Groups" | "مجموعات المستلمين" |

#### `groupTypes` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `static` | `string` | "Static" | "ثابتة" |
| `classBased` | `string` | "Class-based" | "قائمة على الفصل" |
| `dynamic` | `string` | "Dynamic" | "ديناميكية" |
| `staticDesc` | `string` | "Manually manage members" | "إدارة الأعضاء يدوياً" |
| `classBasedDesc` | `string` | "Automatically sync from class roster" | "المزامنة التلقائية من قائمة الفصل" |
| `dynamicDesc` | `string` | "Query-based with scheduled recomputation" | "استعلامية مع إعادة حساب مجدولة" |
| `typeLabel` | `string` | "Group Type" | "نوع المجموعة" |
| `typeRequired` | `string` | "Group type is required" | "نوع المجموعة مطلوب" |
| `classIdLabel` | `string` | "Class" | "الفصل" |
| `classIdRequired` | `string` | "Class is required for class-based groups" | "الفصل مطلوب للمجموعات القائمة على الفصل" |
| `queryFilterLabel` | `string` | "Dynamic Query Filter" | "مرشح الاستعلام الديناميكي" |

#### `accessibility` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `listPage` | `string` | "Recipient Groups List" | "قائمة مجموعات المستلمين" |
| `detailPage` | `string` | "Group Details" | "تفاصيل المجموعة" |
| `createDialog` | `string` | "Create Group Dialog" | "حوار إنشاء المجموعة" |
| `renameDialog` | `string` | "Rename Group Dialog" | "حوار إعادة تسمية المجموعة" |
| `deleteDialog` | `string` | "Delete Group Dialog" | "حوار حذف المجموعة" |
| `duplicateDialog` | `string` | "Duplicate Group Dialog" | "حوار نسخ المجموعة" |
| `changeTemplateDialog` | `string` | "Change Template Dialog" | "حوار تغيير القالب" |
| `assignmentDialog` | `string` | "Add Students Dialog" | "حوار إضافة الطلاب" |
| `importDialog` | `string` | "Import Members Dialog" | "حوار استيراد الأعضاء" |
| `variableEditorDialog` | `string` | "Edit Variables Dialog" | "حوار تعديل المتغيرات" |
| `searchLabel` | `string` | "Search" | "بحث" |
| `searchPlaceholder` | `string` | "Search by name, email, or grade" | "بحث بالاسم أو البريد الإلكتروني أو الصف" |
| `filterLabel` | `string` | "Filter by status" | "تصفية حسب الحالة" |
| `sortLabel` | `string` | "Sort by" | "ترتيب حسب" |
| `actionsMenu` | `string` | "Group actions" | "إجراءات المجموعة" |
| `removeAction` | `string` | "Remove {name} from group" | "إزالة {name} من المجموعة" |
| `editVariablesAction` | `string` | "Edit variable values for {name}" | "تعديل قيم المتغيرات لـ {name}" |
| `expandRowAction` | `string` | "Show variable values for {name}" | "عرض قيم المتغيرات لـ {name}" |
| `loadingAnnouncement` | `string` | "Loading, please wait" | "جاري التحميل، يرجى الانتظار" |
| `errorAnnouncement` | `string` | "Error occurred" | "حدث خطأ" |
| `successAnnouncement` | `string` | "Operation completed successfully" | "اكتملت العملية بنجاح" |
| `skipToMain` | `string` | "Skip to main content" | "تخطي للمحتوى الرئيسي" |

#### `loadingEmptyError` sub-domain

| Key | Type | EN | AR |
|---|---|---|---|
| `list.loading` | `string` | "Loading recipient groups..." | "جاري تحميل مجموعات المستلمين..." |
| `list.empty` | `string` | "No recipient groups yet" | "لا توجد مجموعات مستلمين بعد" |
| `list.emptyAction` | `string` | "Create your first group" | "أنشئ أول مجموعة لك" |
| `list.noResults` | `string` | "No groups match your search" | "لا توجد مجموعات تطابق بحثك" |
| `list.error` | `string` | "Failed to load groups. Please try again." | "فشل تحميل المجموعات. يرجى المحاولة مرة أخرى." |
| `list.retry` | `string` | "Retry" | "إعادة المحاولة" |
| `detail.loading` | `string` | "Loading group details..." | "جاري تحميل تفاصيل المجموعة..." |
| `detail.notFound` | `string` | "Group not found" | "المجموعة غير موجودة" |
| `detail.error` | `string` | "Failed to load group details" | "فشل تحميل تفاصيل المجموعة" |
| `detail.retry` | `string` | "Retry loading details" | "إعادة تحميل التفاصيل" |
| `studentTable.loading` | `string` | "Loading students..." | "جاري تحميل الطلاب..." |
| `studentTable.empty` | `string` | "No students in this group" | "لا يوجد طلاب في هذه المجموعة" |
| `studentTable.error` | `string` | "Failed to load students" | "فشل تحميل الطلاب" |
| `assignment.loading` | `string` | "Searching students..." | "جاري البحث عن الطلاب..." |
| `assignment.empty` | `string` | "No students available to add" | "لا يوجد طلاب متاحون للإضافة" |
| `assignment.error` | `string` | "Failed to search students" | "فشل البحث عن الطلاب" |
| `import.loading` | `string` | "Importing members..." | "جاري استيراد الأعضاء..." |
| `import.empty` | `string` | "No CSV file selected" | "لم يتم اختيار ملف CSV" |
| `import.error` | `string` | "Import failed. Please check your file." | "فشل الاستيراد. يرجى التحقق من الملف." |
| `import.previewEmpty` | `string` | "CSV preview is empty" | "معاينة CSV فارغة" |
| `export.loading` | `string` | "Exporting members..." | "جاري تصدير الأعضاء..." |
| `export.error` | `string` | "Export failed" | "فشل التصدير" |
| `variableEditor.loading` | `string` | "Saving variable values..." | "جاري حفظ قيم المتغيرات..." |
| `variableEditor.error` | `string` | "Failed to save variable values" | "فشل حفظ قيم المتغيرات" |

### Arabic Pluralization

Seven pluralized keys use Arabic plural rules:
- `list.memberCount(count)` — zero/one/two/few/many
- `detail.removeConfirmMessage(count)` — one/two/few/many
- `detail.addSuccessMessage(count)` — zero/one/two/few/many
- `detail.removeSuccessMessage(count)` — zero/one/two/few/many
- `detail.someSkipped(count)` — zero/one/two/few/many
- `detail.importSuccess(count)` — zero/one/two/few/many
- `detail.importSkipped(count)` — zero/one/two/few/many
- `operations.deleteStudentCountWarning(count)` — zero/one/two/few/many
- `operations.deleteCertificateCountWarning(count)` — zero/one/two/few/many

### Interpolation Functions

- `variables.requiredError(field: string) => string` — "{field} is required"
- `variables.minLengthError(min: number) => string` — "Minimum {min} characters"
- `variables.maxLengthError(max: number) => string` — "Maximum {max} characters"
- `variables.minValueError(min: number) => string` — "Minimum {min}"
- `variables.maxValueError(max: number) => string` — "Maximum {max}"
- `variables.minDateError(date: string) => string` — "Earliest date {date}"
- `variables.maxDateError(date: string) => string` — "Latest date {date}"
- `errors.groupNotFound(id: string) => string` — "Group not found: {id}"
- `errors.csvMissingHeader(header: string) => string` — "CSV must include '{header}' column"
- `create.createSuccess(name: string) => string` — "Group '{name}' created successfully"
- `create.renameSuccess(name: string) => string` — "Group renamed to '{name}'"
- `operations.duplicateSuccess(name: string) => string` — "Group duplicated as '{name}'"
- `operations.deleteWarning(name: string) => string` — "Are you sure you want to delete '{name}'?"
- `operations.deleteSuccess(name: string) => string` — "Group '{name}' deleted"
- `operations.deleteCertificateCountWarning(count: number, name: string) => string` — "{count} certificates issued from '{name}' will not be affected"
- `operations.pendingJobsWarning(count: number) => string` — "{count} pending certificate generation jobs will be cancelled"
- `accessibility.removeAction(name: string) => string` — "Remove {name} from group"
- `accessibility.editVariablesAction(name: string) => string` — "Edit variable values for {name}"
- `accessibility.expandRowAction(name: string) => string` — "Show variable values for {name}"

### Access Patterns

- **Server Components**: `getTranslations(locale).certTranslations.recipientGroups.list.pageTitle` (synchronous; `getTranslations` takes only `locale`)
- **Client Components**: `const t = useAppTranslation(Translation.Certificates.RecipientGroups); t.list.pageTitle` (the handle is an object, not a string)
- **GraphQL Resolvers**: `ctx.t().certTranslations.recipientGroups.errors.groupNotFound(id)` (`ctx.t()` returns the full `Translations` object; no namespace arg)

---

## UX/Navigation Specification

### Routes

| Route | Purpose | View Permission | Manage Permission |
|---|---|---|---|
| `app/(dashboard)/certificates/recipient-groups/page.tsx` | Recipient group list page | `CertificateRecipientGroupView` | `CertificateRecipientGroupManage` (for create/edit actions) |
| `app/(dashboard)/certificates/recipient-groups/[id]/page.tsx` | Group detail page | `CertificateRecipientGroupView` | `CertificateRecipientGroupManage` (for edit/delete/assign) |

### Sidebar Integration

| Item | Parent Group | Position | Icon | Permission |
|---|---|---|---|---|
| "Recipient Groups" | "Certificates" (from Plan 08) | 2nd (after "Templates") | `GroupOutlined` | `CertificateRecipientGroupView` |

Navigation entry added to `navigationConfig.ts` → `SIDEBAR_NAV_GROUPS.certificates` with `{ labelKey: "certifications.recipientGroups.list.pageTitle", iconKey: "GroupOutlined", href: "/certificates/recipient-groups", permission: AppPermission.CertificateRecipientGroupView }`.

### Breadcrumbs

- List page: "Dashboard › Certificates › Recipient Groups"
- Detail page: "Dashboard › Certificates › Recipient Groups › [Group Name]"

Breadcrumbs defined in `page.tsx` Server Component using `getTranslations(locale).certTranslations.recipientGroups.breadcrumbs.*`.

### Role-Based Access Matrix

| Role | List View | Detail View | Create | Edit Variables | Delete | Duplicate | Assign Students | Import/Export |
|---|---|---|---|---|---|---|---|---|
| SUPER_ADMIN | ✅ (all) | ✅ (all) | ✅ | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ |
| ACADEMY_ADMIN | ✅ (all) | ✅ (all) | ✅ | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ |
| TEACHER | ✅ (own groups via `createdById`) | ✅ (own) | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own, students via `student-field-acl`) | ✅ (own) |
| PARENT | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| STUDENT | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Ownership enforcement**: TEACHER scoping is enforced at the GraphQL resolver level by filtering `WHERE createdById = ctx.userId`. ADMIN roles have no filter. The `createdById` column (INTER_PLAN_CONTRACTS §14) is required.

**Student search authorization**: `StudentSearch` resolver reuses `backend/services/student/student-field-acl.ts` to scope results to students the TEACHER is authorized to see.

**Student-side exposure**: Students/parents never see group membership — Plan 18 (certificate view) and Plan 19 (verification page) expose certificates, not groups. No `Query.recipientGroup(s)` field is exposed to the student audience.

### Mobile vs Desktop Variants

| Feature | Desktop | Mobile |
|---|---|---|
| Group list | `DesktopAppDataGrid` (sortable columns) | `MobileCardList` + `MobileCardListItem` |
| Student table | `DesktopAppDataGrid` (inline variable status column) | `MobileCardList` (tap to expand) |
| Variable editing | Inline expandable row | Full-screen dialog |
| Student assignment | Modal dialog (wide Autocomplete + table) | Bottom sheet (`mobileAssignmentSheet.tsx`) |
| Rename | Inline edit (double-click name in detail header) | Dialog with text field |
| Operations menu | Dropdown menu (3-dot icon in header) | Overflow menu in app bar |
| Delete confirmation | Centered dialog | Full-width dialog |
| CSV import/export | Dialog with file upload + preview | Bottom sheet with file upload |

---

## Desktop View Specification

### List Page (`recipientGroupList.desktop.tsx`)

Layout: `PageContainer` → `PageHeader` → `SectionPanel` → `DesktopAppDataGrid`

#### PageHeader

| Element | Content | Action |
|---|---|---|
| Title | `labels.pageTitle` ("Recipient Groups") | — |
| Subtitle | `labels.pageSubtitle` ("Manage certificate recipient groups") | — |
| Create Button | `labels.createButton` ("Create Group") with `AddOutlined` icon, `variant="contained"` | `viewModel.handlers.handleCreateClick()` — visible only if `viewModel.permissions.canCreate` is true |

#### Filter Bar (inside SectionPanel header or above AppDataGrid)

Components from left to right:
1. `TextField` with `InputProps={{ startAdornment: <SearchOutlined /> }}` — bound to `viewModel.searchQuery`, placeholder `labels.searchPlaceholder`. Debounce handled by `useDebouncedValue` in ViewModel (300ms).
2. `FormControl` + `Select` for status filter (All / Active / Archived) — optional, direct `Select` component styled via `sx`.
3. `FormControl` + `Select` for type filter (All / Static / Class-based / Dynamic) — optional, direct `Select` component styled via `sx`. Visible only if `viewModel.permissions.canManageTypes`.
4. `SortIndicator` — current sort column/direction display with toggle.

#### DesktopAppDataGrid Column Definitions

| Column | Field | Width | Sortable | Render |
|---|---|---|---|---|
| Name | `name` | flex: 2 | ✅ (sortBy='name') | Text, bold |
| Template | `template.name` | 150px | ❌ | Text |
| Type | `type` | 120px | ✅ (sortBy='type') | `Chip` (color by type: static=default, classBased=info, dynamic=primary) with `labels.groupTypes.{type}` |
| Members | `studentCount` | 100px | ✅ (sortBy='studentCount') | `labels.memberCount(count)` pluralized |
| Status | `status` | 120px | ❌ | `Chip` (color by status: active=success, archived=default) |
| Created By | `createdBy.name` | 150px | ❌ | Text (hidden for TEACHER scope — only sees own) |
| Created | `createdAt` | 150px | ✅ (sortBy='createdAt') | `DateText` formatted by locale |
| Actions | — | 80px | ❌ | `IconButton` 3-dot → `GroupOperationsMenu` |

Row click: `viewModel.handlers.handleRowClick(groupId)` → navigates to `/certificates/recipient-groups/[id]`.
Row cheesy hover background: `theme.palette.action.hover`.

#### Pagination

Server-side pagination via `paginationOptions` prop on `DesktopAppDataGrid`:
- `page`, `pageSize`, `totalRows`, `onPageChange`, `onPageSizeChange`
- Page size options: [10, 20, 50]
- Shows "Showing X–Y of Z" text from `labels.paginationSummary`

#### Empty State

When `groups.length === 0` and `!loading`:
- `EmptyState` component with `GroupOutlined` icon, `labels.emptyTitle` ("No recipient groups yet"), `labels.emptyMessage` ("Create your first recipient group to get started"), and Create button.

#### Loading State

When `loading === true`:
- `DesktopAppDataGrid` shows skeleton rows (5 rows with pulse animation).

#### Error State

When `error` is truthy:
- `ErrorBanner` component above the table with `labels.errorLoading` message and Retry button.

### Detail Page (`recipientGroupDetail.desktop.tsx`)

Layout: `PageContainer` → `PageHeader` (back + group header + operations) → `SectionPanel` (student table) → `SectionPanel` (template variables info)

#### DesktopDetailHeader (`desktopDetailHeader.tsx`)

| Element | Content | Action |
|---|---|---|
| Back Button | `ArrowBackOutlined` + `labels.back` | `viewModel.handlers.handleBackClick()` |
| Group Name | Large `Typography` (editable on double-click if `permissions.canEdit`) | Double-click → inline `TextField` → `handleOpenRename()` |
| Template Name | `Typography` with `AssignmentOutlined` icon | Shows "Template: [name]" |
| Student Count | `labels.memberCount(count)` | — |
| Add Students Button | `PersonAddOutlined` + `labels.addStudents` | `viewModel.handlers.handleOpenAssignment()` — visible if `permissions.canAssignStudents` |
| Import Button | `UploadOutlined` + `labels.importMembers` | Opens `ImportMembersDialog` |
| Export Button | `DownloadOutlined` + `labels.exportMembers` | `viewModel.handlers.handleExportMembers()` |
| Operations Menu | `MoreVertOutlined` `IconButton` | Opens `GroupOperationsMenu` (3-dot) |

#### DesktopStudentTable (`desktopStudentTable.tsx`)

Uses `DesktopAppDataGrid` with columns:

| Column | Field | Width | Render |
|---|---|---|---|
| Name | `student.name` | flex: 2 | Text, bold |
| Email | `student.email` | 200px | Text |
| Grade | `student.grade` | 100px | Text |
| Status | `student.status` | 100px | `Chip` |
| Variable Status | `variableStatus` | 120px | `VariableStatusBadge` component |
| Actions | — | 80px per action | Remove `IconButton` (`DeleteOutlined`) with tooltip + Expand `IconButton` (`ExpandMoreOutlined`) to open variable row |

Remove button: calls `viewModel.handlers.handleRemoveStudent(groupItemId, studentId)`.
Expand button: toggles `VariableValueEditor` inline row (see Decision 2).

Row expand: clicking the expand icon opens `desktopVariableRow.tsx` inline below the student row. The row contains `VariableValueEditor` with the template's variables.

#### DesktopVariableRow (`desktopVariableRow.tsx`)

Inline expandable row below each student in the table. Contains:
- `VariableValueEditor` component (shared) with the template variables
- Save/Cancel buttons
- Validation errors displayed inline per field
- `saving` state shows `CircularProgress` in the save button

#### Template Variables Info Panel (bottom SectionPanel)

Shows the template's variable definitions (read-only summary):
- Variable key, label, type, required flag
- "All recipients must fill required variables before certificate generation" warning

#### Student Pagination

Below the student table: same `paginationOptions` pattern as list page, with `studentPageInfo.hasNextPage`, `studentPageInfo.hasPrevPage`, and `onPageChange` routed to `viewModel.handlers.handleStudentPageChange`.

---

## Mobile View Specification

### List Page (`recipientGroupList.mobile.tsx`)

Layout: `MobilePageContainer` → `MobilePageHeader` → `MobileCardList` (with FAB)

#### MobilePageHeader

| Element | Content | Action |
|---|---|---|
| Title | `labels.pageTitle` | — |
| Search Icon | `SearchOutlined` `IconButton` | Toggles search input overlay |
| Sort Icon | `SortOutlined` `IconButton` | Opens sort `BottomSheet` (by name/count/date) |

Search: Tapping search icon opens a `TextField` overlay at the top of the card list.

#### MobileCardList + MobileCardListItem

Each card shows:
- **Primary**: Group name (bold)
- **Secondary**: Template name + `labels.memberCount(count)` pluralized
- **Type Badge**: `Chip` (color by type: static=default, classBased=info, dynamic=primary) with `labels.groupTypes.{type}` — shown only for non-static types
- **Badge**: Status `Chip` (active/archived)
- **Chevron**: `ChevronRightOutlined` (tap navigates to detail)
- **Context actions**: Long-press or swipe-to-reveal → edit/rename | duplicate | delete icons

Card tap: `viewModel.handlers.handleRowClick(groupId)` → navigate to detail.
Card long-press: opens `GroupOperationsMenu` as a `BottomSheet`.

#### Create FAB

`FloatingActionButton` with `AddOutlined` icon, bottom-right (16px margins), visible if `permissions.canCreate`.

#### Filter/Sort BottomSheet

Mobile filter/sort accessed via `SortOutlined` `IconButton` in header:
- Sort options: Name, Member Count, Created Date, Type
- Filter options: Status (All/Active/Archived), Type (All/Static/Class-based/Dynamic)
- Applied client-side to cached results or triggers server refetch

#### Infinite Scroll (mobile pattern)

`MobileCardList` uses `IntersectionObserver` on the bottom sentinel. When visible and `pageInfo.hasNextPage`, calls `viewModel.handlers.handlePageChange(page + 1)`. Shows `CircularProgress` at bottom while loading.

#### Empty State

`MobileEmptyState` component: `GroupOutlined` icon, `labels.emptyTitle`, `labels.emptyMessage`, and FAB for create.

### Detail Page (`recipientGroupDetail.mobile.tsx`)

Layout: `MobilePageContainer` → `MobilePageHeader` (back + name + operations) → `MobileCardList` (students)

#### MobilePageHeader

| Element | Content | Action |
|---|---|---|
| Back Icon | `ArrowBackOutlined` `IconButton` | `viewModel.handlers.handleBackClick()` |
| Group Name | `Typography` (truncated, 1 line) | Tap → opens `RenameGroupDialog` |
| Overflow Menu | `MoreVertOutlined` `IconButton` | Opens `GroupOperationsMenu` as `BottomSheet` |

Below header: template name and student count shown as `Typography` subtitle.

#### MobileStudentCard (`mobileStudentCard.tsx`)

Each card shows:
- Student name (bold)
- Email + Grade in secondary text
- Status `Chip`
- `VariableStatusBadge`
- Expandable accordion: tap to reveal variable values list + edit button
- Edit variables button: opens `mobileVariableDialog.tsx` (full-screen)
- Remove button: opens `RemoveStudentsConfirmDialog`

Card expand: uses `Accordion`/`AccordionSummary`/`AccordionDetails` from MUI.

#### MobileVariableDialog (`mobileVariableDialog.tsx`)

Full-screen `Dialog` with:
- Title: student name + "Variable Values"
- Content: `VariableValueEditor` component (shared core logic)
- Save/Cancel buttons at bottom (`AppBar` action row)

#### MobileAssignmentSheet (`mobileAssignmentSheet.tsx`)

Bottom-sheet variant of `StudentAssignmentDialog`:
- `SwipeableDrawer` with `anchor="bottom"`
- Search `TextField` with `Autocomplete` simplification (list of `StudentSearchRow`)
- Selected students shown as `Chip` list
- "Add Selected" button

#### FAB Actions on Detail Page

- Main FAB: `PersonAddOutlined` (Add Students) — opens `MobileAssignmentSheet`

---

## Create/Edit Dialog Specification

### CreateRecipientGroupDialog (`createRecipientGroupDialog.tsx`)

Shared component used by both desktop (modal) and mobile (full-screen dialog via responsive `Dialog` props).

#### Fields

| Field | Component | Validation (Zod) | Required | Notes |
|---|---|---|---|---|
| Name | `TextField` | `z.string().min(1).max(100)` | ✅ | Error: `labels.nameRequired`, `labels.nameMaxLength` |
| Description | `TextField` (multiline, rows=3) | `z.string().max(500).optional()` | ❌ | Error: `labels.descriptionMaxLength` |
| Template | `Autocomplete` + `TextField` | `z.string().min(1)` | ✅ | Options from `TemplateListForSelectQueryDocument`; Error: `labels.templateRequired` |
| Group Type | `RadioGroup` + `Radio` (3 options) | `z.enum(['STATIC', 'CLASS_BASED', 'DYNAMIC'])` | ✅ | Default: STATIC; Error: `labels.groupTypes.typeRequired` |
| Class | `Autocomplete` + `TextField` | `z.string().min(1)` | Conditional | Required if type=CLASS_BASED; options from `ClassListForSelectQueryDocument`; Error: `labels.groupTypes.classIdRequired` |
| Dynamic Query | `TextArea` (JSON) | `z.string().optional()` | Conditional | Required if type=DYNAMIC; Error: `labels.groupTypes.queryFilterLabel` |

Zod schema in `schemas/recipientGroup.schema.ts`:
```
createRecipientGroupSchema = z.object({
  name: z.string().min(1, "nameRequired").max(100, "nameMaxLength"),
  description: z.string().max(500, "descriptionMaxLength").optional(),
  templateId: z.string().min(1, "templateRequired"),
  type: z.enum(['STATIC', 'CLASS_BASED', 'DYNAMIC']).default('STATIC'),
  classId: z.string().optional(),
  queryFilter: z.string().optional(),
}).refine((data) => {
  if (data.type === 'CLASS_BASED' && !data.classId) return false;
  if (data.type === 'DYNAMIC' && !data.queryFilter) return false;
  return true;
}, { message: "groupTypes.typeRequired", path: ['type'] });
```

#### Accessibility Attributes

- `Dialog`: `aria-labelledby="dialog-title"`, `disableEnforceFocus={false}`, `onClose={handleClose}`
- `DialogTitle`: `id="dialog-title"`
- `TextField` (Name): `id="group-name"`, `aria-invalid={!!errors.name}`, `aria-describedby={errors.name ? 'group-name-error' : undefined}`
- `FormHelperText` (Name error): `id="group-name-error"`, `role="alert"`
- `RadioGroup` (Type): `aria-label="Group type"`
- `Radio` (each): `aria-label={labels.groupTypes.{type}}`, `aria-describedby="type-{type}-desc"`
- `Autocomplete` (Template): `id="template-select"`, `aria-invalid={!!errors.templateId}`, `aria-controls="template-popup"`, `aria-expanded`
- `Autocomplete` (Class): `id="class-select"`, `aria-invalid={!!errors.classId}`, `aria-controls="class-popup"`, `aria-expanded`
- `TextArea` (Query): `id="query-filter"`, `aria-invalid={!!errors.queryFilter}`, `aria-describedby={errors.queryFilter ? 'query-filter-error' : undefined}`

#### Actions

- Cancel: `onClose()` — closes dialog, resets form
- Submit: `onSubmit(parsedValues)` — disabled while `submitting === true` or form invalid

#### Dialog Mode

- Create mode (`editingGroupId === null`): title = `labels.createTitle`, submit calls `mutations.createGroup`
- Rename mode (`editingGroupId !== null`): title = `labels.renameTitle`, prefills `initialValues`, submit calls `mutations.updateGroup`

#### Responsive Behavior

Desktop: `Dialog` with `maxWidth="sm"`, centered.
Mobile: `Dialog` with `fullScreen={true}` or `fullWidth={true}` with `TransitionComponent` slide-up.

---

## Member Management Specification

### Add Students (StudentAssignmentDialog)

**Flow:**
1. User taps "Add Students" in detail view → `handlers.handleOpenAssignment()` sets `assignmentDialogOpen = true`
2. Dialog opens with Autocomplete search input + empty results
3. User types search text → 300ms debounce → `StudentSearchQueryDocument` fires with `{ search, excludeGroupId, page, pageSize }`
4. Results displayed as a table (desktop) or list (mobile) with checkbox column
5. User selects students (checkbox or tap) → `store.assignmentSelectedStudentIds` updated
6. Selected students shown as `Chip` list at top of dialog
7. User taps "Add Selected" → `mutations.addStudents(groupId, [...selectedIds])` calls mutation
8. Response contains `addedCount` + `skipped[]` → snackbar shows `labels.addSuccessMessage(addedCount)` + `labels.someSkipped(skipped.length)` if any skipped
9. Apollo cache updated: new student rows inserted into `RecipientGroupDetailQueryDocument` cache (manual `update` function)
10. Dialog closes, `clearAssignmentSelection()` called

**Optimistic update:** Before mutation resolves, optimistically insert selected students into the cached student list. On error, roll back (evict inserted rows). On success, server's `addedCount` is authoritative — replace optimistic rows with server data.

### Remove Students

**Flow:**
1. User taps remove icon next to a student in the table/card
2. `RemoveStudentsConfirmDialog` opens with `studentCount=1` (single removal) or `studentCount=N` (bulk)
3. If `isLastMember === true`, additional warning shown: `labels.lastMemberWarning` ("This is the last member. Removing will leave the group empty.")
4. Confirm → `mutations.removeStudents(groupId, [studentId])` calls mutation
5. Apollo cache updated: removed student rows evicted from cache (manual `update` function)
6. Snackback shows `labels.removeSuccessMessage(count)` (pluralized)

**Optimistic update:** Before mutation resolves, optimistically remove the row from the cached student list. On error, restore the row. On success, server data is authoritative.


## Dialog Specifications

### GroupOperationsMenu (`groupOperationsMenu.tsx`)

Desktop: `Menu` component anchored to `IconButton` (`MoreVertOutlined`).
Mobile: `BottomSheet` variant.

Menu items (conditionally shown based on `permissions`):
1. Rename — `EditOutlined` + `labels.rename` — `onRename()`
2. Duplicate — `FileCopyOutlined` + `labels.duplicate` — `onDuplicate()`
3. Import Members — `FileUploadOutlined` + `labels.importMembers` — `onImportMembers()`
4. Export Members — `FileDownloadOutlined` + `labels.exportMembers` — `onExportMembers()`

### ImportMembersDialog (`ImportMembersDialog.tsx`)

A full-screen dialog (mobile) / max-width `lg` dialog (desktop) for bulk adding members via CSV upload.

**Props:**
```ts
interface ImportMembersDialogProps {
  groupId: string;
  groupName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**State (internal):**
| State | Type | Description |
|-------|------|-------------|
| `step` | `'upload' \| 'preview' \| 'confirm' \| 'complete'` | Wizard step |
| `file` | `File \| null` | Selected CSV file |
| `previewRows` | `ImportPreviewRow[]` | Parsed rows with validation status |
| `importedCount` | `number` | Number of successfully imported members |
| `failedRows` | `ImportPreviewRow[]` | Rows that failed validation or import |
| `isImporting` | `boolean` | Mutation in progress |

**CSV Format:**
```csv
studentId,firstName,lastName,email,phone,metadata
STU-001,Ahmed,Hassan,ahmed@example.com,+966501234567,"{""class"":""10A""}"
STU-002,Fatima,Ali,fatima@example.com,+966501234568,"{""class"":""10B""}"
```

Only `studentId` is required. Other columns are optional and merged into `metadata` JSON.

**Validation Rules:**
1. File must be `.csv` or `.txt`, max 5MB
2. Each row must have a valid `studentId` that exists in the database
3. Duplicate `studentId` within the same file → error
4. Student already in group → warning (can skip or overwrite)
5. Max 5000 rows per import

**Step 1 — Upload:**
- Dropzone (`input[type=file]` + click to browse) with `accept=".csv,.txt"`
- Drag-and-drop support
- File name and size displayed
- "Next" button disabled until valid file selected
- Accessibility: `role="dialog"`, `aria-labelledby="import-title"`, `aria-describedby="import-desc"`, `aria-live="polite"` for file validation feedback

**Step 2 — Preview:**
- Table with columns: Row #, Student ID, Name, Email, Status (Valid / Warning / Error), Actions
- Status badges: `Chip` with `variant="outlined"` + color (green/warning/red)
- "Back" to re-upload, "Import" to proceed
- Row count summary: `labels.importPreviewSummary(validCount, warningCount, errorCount)` (pluralized)
- Accessibility: Table has `role="table"`, `aria-label="import preview"`, column headers have `scope="col"`, status cells have `aria-live="polite"`

**Step 3 — Confirm & Import:**
- Confirmation text: `labels.importConfirmMessage(validCount)` (pluralized)
- Checkbox: "Skip students already in group" (default checked)
- "Import" button with `LoadingButton` showing `labels.importing`
- Mutation: `ImportMembersMutation(groupId, rows, skipExisting)`
- On progress: `labels.importProgress(current, total)` via `aria-live="assertive"`
- Accessibility: `role="dialog"`, `aria-labelledby="confirm-title"`, progress announced via `aria-live="assertive"`

**Step 4 — Complete:**
- Summary: `labels.importCompleteMessage(successCount, failedCount)` (pluralized)
- If failures: expandable "View Errors" section with table of failed rows + error messages
- "Done" button closes dialog and calls `onSuccess()`
- "Download Error Report" button generates CSV of failed rows
- Accessibility: Success announced via `aria-live="polite"`, errors via `aria-live="assertive"`

**Error Handling:**
- Network error: `labels.importNetworkError` + retry button
- Validation error (server): display in Step 2 table
- Partial success: show both success and failure counts

**Optimistic Update:** None — server-authoritative.

### ExportMembersDialog (`ExportMembersDialog.tsx`)

A modal dialog for exporting group members to CSV.

**Props:**
```ts
interface ExportMembersDialogProps {
  groupId: string;
  groupName: string;
  open: boolean;
  onClose: () => void;
}
```

**Options:**
- Include metadata columns (default: on)
- Date range filter (optional)
- Encoding: UTF-8 (default) / UTF-16

**Flow:**
1. Dialog opens with options form
2. User clicks "Export" → `LoadingButton` shows `labels.exporting`
3. Query: `ExportMembersQuery(groupId, options)` → returns CSV blob
4. Auto-download via `<a href={blobUrl} download={filename}>` 
5. Filename: `{groupName}-members-{YYYY-MM-DD}.csv`
6. Snackbar: `labels.exportSuccessMessage(count)` (pluralized)
7. Dialog closes

**Accessibility:** `role="dialog"`, `aria-labelledby="export-title"`, export progress via `aria-live="polite"`

**Error Handling:**
- Network error: `labels.exportNetworkError` + retry
- Empty group: `labels.exportEmptyGroup` — export still works (headers only)

### GroupOperationsMenu (`groupOperationsMenu.tsx`) — Updated

Desktop: `Menu` component anchored to `IconButton` (`MoreVertOutlined`).
Mobile: `BottomSheet` variant.

Menu items (conditionally shown based on `permissions`):
1. Rename — `EditOutlined` + `labels.rename` — `onRename()`
2. Duplicate — `FileCopyOutlined` + `labels.duplicate` — `onDuplicate()`
3. Import Members — `FileUploadOutlined` + `labels.importMembers` — `onImportMembers()`
4. Export Members — `FileDownloadOutlined` + `labels.exportMembers` — `onExportMembers()`
5. Delete — `DeleteOutlined` + `labels.delete` — `onDelete()`
3. Change Template — `SwapHorizOutlined` + `labels.changeTemplate` — `onChangeTemplate()`
4. Delete — `DeleteOutlined` + `labels.delete` (red text) — `onDelete()`

### DeleteGroupConfirmDialog (`deleteGroupConfirmDialog.tsx`)

Fields:
- Warning text: `labels.deleteWarning(groupName)` interpolated
- Student count warning: `labels.deleteStudentCountWarning(studentCount)` pluralized
- Certificate count warning (if issuedCertificates > 0): `labels.deleteCertificateCountWarning(issuedCertificates, groupName)` pluralized with `WarningOutlined` icon, distinct color
- Pending jobs warning (if pendingJobs > 0): `labels.pendingJobsWarning(pendingJobs)` pluralized with explicit checkbox confirmation — `Checkbox` with `labels.confirmPendingJobsCancellation` ("I understand these jobs will be cancelled and cannot be recovered")
- "This action cannot be undone" text

Actions: Cancel | Confirm Delete (red `contained` button) — disabled until checkbox checked when pendingJobs > 0

Accessibility:
- `Dialog`: `aria-labelledby="delete-dialog-title"`, `aria-describedby="delete-dialog-description"`
- `DialogTitle`: `id="delete-dialog-title"`
- Warning texts: `role="alert"` for certificate/pending warnings
- Checkbox: `id="confirm-pending-jobs"`, `aria-required={pendingJobs > 0}`

### DuplicateGroupDialog (`duplicateGroupDialog.tsx`)

Fields:
- New name `TextField` prefilled with `originalName + " (Copy)"`
- Validation: `z.string().min(1).max(100)`

Actions: Cancel | Confirm Duplicate

### ChangeTemplateDialog (`changeTemplateDialog.tsx`)

Fields:
- Warning: `labels.changeTemplateWarning` ("Changing the template will reset all variable values. This cannot be undone.")
- Template `Autocomplete` with published templates

Actions: Cancel | Confirm Change (disabled until a different template is selected)

---

## Interaction States

### List Page States

| State | Trigger | Display |
|---|---|---|
| Initial load | First `useQuery` fetch | `DesktopAppDataGrid` skeleton rows (desktop) / `MobileCardSkeleton` (mobile) — 5 skeleton rows |
| Search loading | `searchQuery` changed, debouncing | `CircularProgress` in search field (desktop) / `LinearProgress` overlay (mobile) |
| Search results empty | `groups.length === 0 && searchQuery !== ""` | `EmptyState` with `labels.noResultsTitle` ("No matching groups") + `labels.noResultsMessage` |
| Fully empty | `groups.length === 0 && searchQuery === ""` | `EmptyState` with `labels.emptyTitle` + `labels.emptyMessage` + Create button |
| Error loading | `error` truthy | `ErrorBanner` with `labels.errorLoading` + Retry button |
| Creating in progress | `createMutation.loading` | `CreateRecipientGroupDialog` submit button shows `CircularProgress`, disabled |
| Deleting in progress | `duplicateMutation.loading` | `DuplicateGroupDialog` submit button shows `CircularProgress`, disabled |
| Pagination loading | `fetchMore` in progress | `LinearProgress` at bottom of table area |

### Detail Page States

| State | Trigger | Display |
|---|---|---|
| Initial load | `detailQuery.loading` | `PageContainer` with `Skeleton` for header + table (5 skeleton rows) |
| Not found | `detailQuery.data.recipientGroup === null` | `NotFoundState` with `labels.groupNotFound` + back button |
| Error loading | `detailQuery.error` truthy | `ErrorBanner` with `labels.errorLoadingDetail` + Retry |
| Add students loading | `addStudentsMutation.loading` | Assignment dialog submit button shows `CircularProgress`, disabled |
| Remove students loading | `removeStudentsMutation.loading` | Row shows `CircularProgress` on remove button |
| Variable save loading | `upsertVariableValuesMutation.loading` | Variable editor save button shows `CircularProgress`, disabled |
| Variable save error | `upsertVariableValuesMutation.error` or `valueErrors.length > 0` | Errors displayed inline per variable field via `FormHelperText` with `error: true` |
| Student search loading | `searchStudentsQuery.loading` | `Autocomplete` shows `CircularProgress` in end adornment |
| Export loading | `exportQuery.loading` (if separate) or inline | Export button shows `CircularProgress`, disabled |
| Import loading | `importMutation.loading` | Import dialog submit shows `CircularProgress`, disabled |
| Delete loading | `deleteMutation.loading` | Delete confirm dialog button shows `CircularProgress`, disabled |
| Duplicate loading | `duplicateMutation.loading` | Duplicate dialog button shows `CircularProgress`, disabled |

### Toast/Snackbar States

| Event | Snackbar Message | Severity |
|---|---|---|
| Group created | `labels.createSuccess(name)` interpolated | success |
| Group renamed | `labels.renameSuccess(name)` interpolated | success |
| Group deleted | `labels.deleteSuccess(name)` interpolated | success |
| Group duplicated | `labels.duplicateSuccess(name)` interpolated | success |
| Students added | `labels.addSuccessMessage(addedCount)` pluralized + `labels.someSkipped(skippedCount)` if skipped > 0 | success (or warning if all skipped) |
| Students removed | `labels.removeSuccessMessage(removedCount)` pluralized | success |
| Variable values saved | `labels.variableSaveSuccess` | success |
| Import complete | `labels.importSuccess(addedCount)` + `labels.importSkipped(skippedCount)` | success (or warning if skipped > 0) |
| Export complete | `labels.exportSuccess` | info |
| Template changed | `labels.changeTemplateSuccess` | success |
| Mutation error | Translated error from `error.message` | error |

---

## Outcome & Knowledge Transfer Protocol

- **Before Execution:** Read all files in `.ai/plans/14-recipient-group-mgmt/outcome/`
- **After Execution:** Create `.ai/plans/14-recipient-group-mgmt/outcome/<task-id>-outcome.md`
- **Progress Tracking:** Update task checkboxes `[ ]` → `[x]` in `tasks.md`

---

## Reality Check Notes

Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified correct (no change needed)
- **Zustand store path**: `frontend/common/stores/` exists (a `frontend/stores/` directory does NOT exist). `recipientGroupStore.ts` follows the camelCase `{entity}Store.ts` convention. `frontend/common/stores/AGENTS.md` documents Zustand rules (import entity types from `graphql-types.ts`, not `operations.ts`).
- **App Router**: `app/(dashboard)/certificates/recipient-groups/{page.tsx,[id]/page.tsx}` matches the existing `app/(dashboard)/<domain>/` convention (verified `students/`, `billing/`).
- **Shared views**: `frontend/common/views/dashboard/certificates/recipient-groups/` matches `frontend/common/views/dashboard/<domain>/` (verified `students/`, `billing/`).
- **Namespace handle file**: `shared/locale/namespaces/certificates/recipient-groups.namespace.ts` matches the verified `<leaf>.namespace.ts` pattern (cf. `dashboard/students/directory.namespace.ts`).
- **Parallel trees**: type at `shared/locale/types/certificates/recipient-groups.ts`, ar/en at `shared/locale/{ar,en}/certificates/recipient-groups.ts` mirror the `types/` ↔ `{ar,en}/` verified structure.
- **sharedDocuments domain organization** and **backend `types/`/`pothos/`/`services/` domain-folder conventions** verified (see Plan 13 notes); any backend file references for this plan must use `certificates/` domain sub-folders.

### Corrections made in this plan file
- **Tier view paths**: `frontend/{desktop,mobile}/views/certificates/recipient-groups/` → `frontend/{desktop,mobile}/views/dashboard/certificates/recipient-groups/` (all desktop/mobile views live under a `dashboard` segment — verified `frontend/desktop/views/` and `frontend/mobile/views/` contain only a `dashboard/` child).
- **i18n access signatures (Plan 14 design had hypothetical signatures)**:
  - `getTranslations(locale).dashboardTranslations.certificate` → `getTranslations(locale).certTranslations.recipientGroups.list.pageTitle` (synchronous; only `locale` arg).
  - `useAppTranslation(Translation.Dashboard.Certificate)` → `useAppTranslation(Translation.Certificates.RecipientGroups)` then `t.list.pageTitle` (handle is an object, not a string).
  - `ctx.t().certTranslations` → `ctx.t().certTranslations.recipientGroups.errors.groupNotFound(id)` (`ctx.t()` returns the full `Translations`, no namespace arg — verified `backend/graphql/gqlContext.ts:30,96` and `server-graphql.ts`).
- The Plan 14 **requirements.md** already used the correct signatures (`getTranslations(locale).certTranslations...`, `useAppTranslation(Translation.Certificates.RecipientGroups)`, `ctx.t().certTranslations...`); this design was brought into line with requirements.

### i18n convention reminder (cross-plan)
No `certificates` namespace exists yet in `shared/locale/` (verified). It is introduced by the cert program as a new top-level `certTranslations` key per `siraj_analysis/06-i18n-system.md` §13. Usage signatures are dictated by the actual code: `getTranslations(locale)` returns the whole `Translations` and `ctx.t()` is `() => getServerTranslations(locale)` — both synchronous, neither accepts a namespace argument.


---

## SWE Expert Review Notes

> Added 2026-08-02 by Staff SWE architectural review (Part A: spec analysis × Part B: codebase reality check).

### 1. Group-to-student relationship

- **Model is correct**: `certificate_recipient_groups (1)─→(N) certificate_recipient_group_items (N)─→(1) students` with a join table carrying `addedAt`. **Gap:** the relationship lacks a **uniqueness constraint** — without `UNIQUE(groupId, studentId)` the same student can be added twice (add-students mutation is "batch add", idempotency not guaranteed). Add `UNIQUE(groupId, studentId)` (or a composite index + service-level dedup) in Plan 1/Plan 3. Also specify `ON DELETE` behavior: when a student is removed from Siraj entirely (soft-deleted), should the group item be `CASCADE`d, `RESTRICT`ed, or left dangling? Unspecified — flag for Plan 1.
- **Per-recipient variable override** uses `recipient_group_item_variable_values(groupItemId, variableId, value)` — correct one-row-per-(item,variable). **Gap:** `value` is generic (no type) — like Plan 13's `default_value` it should encode per-variable-type values and validate against the template variable's config (min/max, select options). The design says the editor uses "validation constraints from the template variable definition" (good) but the **server-side upsert mutation must also validate** — currently `UpsertVariableValues` returns only `{success}`. Add server validation returning per-field errors (`{valueErrors: [{variableId, errorKey}]}`) so an invalid override (e.g. number below min, select key not in options) is rejected atomically. Right now a bad value would silently persist and break generation.
- **`variableStatus` computed resolver** (Decision 4) is fine, but it joins `recipient_group_item_variable_values` × template variables **per row per query**. For large groups (100s of students × many variables) this N×M join should be a **single grouped query** (`GROUP BY groupItemId`) or a DataLoader batch — the spec says "computed in resolver" which risks N+1. Specify batched computation.

### 2. Bulk import (CSV)

- **Not specified.** The task brief asks about CSV bulk import; this plan has NO teacher-friendly bulk-add for classes/cohorts. Student assignment is one-by-one search-and-select. **Recommendation (out of MVP scope but flag):** add `addStudentsToGroup` accepting a CSV/`[studentId]` bulk input — the mutation already takes `studentIds: [ID!]!` so the backend supports it; the gap is the **UI** (no CSV upload, no "add by class/cohort" picker). At minimum document that bulk-by-class is deferred and ensure the mutation is wired so a future "Add entire class" button reuses it without schema change.

### 3. Student search performance (FTS / autocomplete)

- `StudentSearch(search, excludeGroupId, page, pageSize)` is **server-side, debounced 300ms** — correct approach. **Gap:** the plan does not say **how** search is implemented. The codebase `student.repository.ts` uses `StudentFilterUtils` with `name`/`nameStartsWith` etc. (LIKE-based, verified) — there is **NO PostgreSQL FTS (`tsvector`/`tsquery`) or trigram index** in the existing students schema. So "performant" student search for cert recipients will be `ILIKE '%term%'` — fine for ≤10k students, but the plan should **state the expected index** (btree on `name` + `nameStartsWith` preferred over `%term%` which can't use an index). Recommend the autocomplete use `nameStartsWith` (prefix, index-friendly) rather than `name` (contains, full scan). The StudentSearch document/excludeGroupId should also clarify: is `excludeGroupId` a `NOT IN (SELECT studentId ...)` subquery? For large groups this is slow — prefer an `ANTI JOIN` or temporary set. Flag for Plan 3.

### 4. State management

- `recipientGroupStore` is correctly scoped (search query, dialog flags, per-item editor map). Confirms `frontend/common/stores/AGENTS.md` (camelCase, no `persist` for ephemeral UI state — verify tasks.md creates it without `persist`). **Risk:** `variableEditorState: Record<itemId, {open, values}>` could grow unbounded for big groups; clear entries on `closeVariableEditor` to avoid leaks. The `Set<string>` for `selectedGroupIds` is fine in-memory. **Gap:** no optimistic-update spec for `AddStudentsToGroup`/`RemoveStudentsToGroup` beyond "manual cache update" (Decision 1) — the plan should specify the optimistic insertion of new rows + rollback on error, mirroring Plan 13's pattern, and that `addedCount`/`removedCount` is authoritative on response (server wins over optimistic count).

### 5. GraphQL design

- `AddStudentsToGroup` returns `{addedCount}` — **good** but should also return `skipped: [{studentId, reason}]` (already-member, forbidden, soft-deleted student) so the UI can show "5 added, 2 already in group". Currently partial-failure is silent. `removeStudents` same.
- `UpsertVariableValues(groupItemId, values: [{variableId, value}])` is per-item — but the editor may save multiple recipients at once; **add a bulk variant** `upsertVariableValuesBulk(items: [{groupItemId, values}])` or accept that the loop over items is fine (N mutations). Decide and document.
- `DuplicateRecipientGroup(id, newName)` does a server deep copy (Decision 5) — **add idempotency** (the codebase has `idempotency.service.ts` verified in `backend/services/`); a double-click of "Duplicate" must not create two copies. Use the existing idempotency-key header pattern.

### 6. Security

- **TEACHER scope ("own" groups) is unenforceable without an ownership column** — same gap as Plan 13. `certificate_recipient_groups` needs `createdById`/`ownerTeacherId`; resolvers must scope list/detail/CRUD by it. **Verified risk:** codebase has no `tenantId`/`academyId` global guard — all scoping is per-row `teacherId` (e.g. `teacher_assignments.teacherId`). Plan 1 must add the ownership column; Plan 14 resolvers must enforce it. **Block until Plan 1 confirms.**
- **Can students see their own groups?** The role matrix (§UX) correctly says STUDENT/PARENT = ❌ for all. Good — but the plan should state explicitly that the **verification page (Plan 19) and certificate view (Plan 18)** expose certs, not groups, so student-side exposure of group membership is by design zero. Confirm no `Query.recipientGroup(s)` field is exposed to the student audience.
- **Cross-teacher access:** a TEACHER must not read/assign students they don't teach. `StudentSearch` must respect the teacher's visible students (the codebase `student-field-acl.ts` exists — verified `backend/services/student/`. **Reuse `student-field-acl` for the search resolver**, don't write a new ACL). Flag: Plan 14 should import the existing `student-field-acl.ts` rather than reimplement.

### 7. i18n

- All listed error/label keys are present and access signatures are correct (verified in existing Reality Check Notes). **Gap:** the labels for `variableStatus` badge (`filled`/`unfilled`/`partial`) are not listed among the 18 detail keys — add them (`detail.variableStatus.filled|unfilled|partial`). **Gap:** `UpsertVariableValues` server validation errors (proposed above) need i18n keys (`variables.valueInvalid`, `variables.valueOutOfRange`, `variables.selectKeyMissing`) — currently only client-side validation keys exist; server-side validation errors must be translatable too.

### Reality-check corrections applied in this review
- Reuse of `backend/services/student/student-field-acl.ts` for student search authorization (verified file exists) — do NOT build a new ACL.
- Reuse of `backend/services/idempotency.service.ts` for duplicate-group idempotency (verified exists).
- `student.repository.ts` uses `StudentFilterUtils` (LIKE-based, prefix preferred) — no FTS in codebase; do not assume `tsvector` is available unless Plan 3 adds it.

### Remaining risks
1. **Ownership column on `certificate_recipient_groups`** for TEACHER scope — unverified in Plan 1; critical for the "own groups" matrix. **Block until Plan 1 confirms.**
2. **UNIQUE(groupId, studentId)** + student soft-delete cascade behavior — unspecified; risk of duplicate memberships and dangling refs.
3. **Server-side validation of per-recipient variable values** against the template variable config — currently missing; invalid values silently persist and break generation.
4. **`variableStatus` N+1** — must be batched/grouped, not per-row resolver computation.
5. **Student search index strategy** — `ILIKE '%term%'` full scans; recommend prefix search + reuse of `student-field-acl`.
