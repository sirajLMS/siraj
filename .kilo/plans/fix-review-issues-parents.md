# Fix Review Issues — Parents Pages

## Issue 1: Server-side status filter (removes broken client-side filter)

**Problem**: Client-side `statusFilter` applied after server pagination produces wrong results and mismatched `totalCount`.

**Decision**: Implement `statusFilter` as a server-side argument on the `parentDirectory` GraphQL query.

### Backend changes (bottom-up)

**1. Repository** (`backend/db/repo/parent.repository.ts:124-193`)
- Add `accountStatus` to `getParentDirectory` options: `{ search?, pagination?, accountStatus? }`
- When `accountStatus` is provided, add `eq(parents.status, accountStatus.toUpperCase())` to the `conditions` array
- This filter applies to both `rowsQuery` and `totalCount` query, so pagination stays correct
- Note: metrics query (line 131-137) should remain unfiltered (shows global counts)

**2. Service** (`backend/services/parent/parent-directory.service.ts:42-59`)
- Add `accountStatus: string | null` parameter to `getParentDirectory`
- Pass it through to `ParentRepository.getParentDirectory({ search, pagination, accountStatus })`

**3. GraphQL** (`backend/graphql/query/parent-directory.query.ts:17-43`)
- Add `statusFilter` arg: `t.arg.string({ required: false })`
- Pass `args.statusFilter ?? null` as the `accountStatus` param to the service call

### Frontend changes

**4. GraphQL document** (`frontend/graphql/sharedDocuments/parent-directory.documents.ts`)
- Add `statusFilter` variable to the query: `$statusFilter: String`
- Pass it as arg: `statusFilter: $statusFilter`

**5. Store** (`frontend/stores/parentsStore.ts`)
- Keep `statusFilter` and `setStatusFilter` as-is (already added)
- Remove `filterPanelOpen` and `setFilterPanelOpen` since the filter panel will use the store directly

**6. Container** (`frontend/views/dashboard/parents/home/ParentsContainer.tsx`)
- Remove `const rows = statusFilter ? allRows.filter(...) : allRows` (line 194) — use `allRows` directly as `rows`
- Add `statusFilter` to the `useQuery` variables: `statusFilter: statusFilter || null`
- Reset `page` to 0 when `statusFilter` changes (already handled by `setStatusFilter`)

**7. View** (`frontend/views/dashboard/parents/home/ParentsView.tsx`)
- Keep filter panel UI with Chips as-is
- No changes needed (filter chips already call `onStatusFilterChange`)

### After codegen
- Run `bun run generate:gqlSchema && bun codegen` after backend changes
- Regenerated types will include `statusFilter` arg

---

## Issue 2: Excel export (replaces CSV)

**Problem**: Current CSV export only exports current page and has no CSV injection escaping.

**Decision**: Use `xlsx-js-style` Excel export, following the pattern in `frontend/utils/excel-export/report-export.ts`.

### Implementation

**1. New utility** — `frontend/utils/excel-export/parent-directory-export.ts`
- Create `exportParentDirectory(data)` function using `xlsx-js-style`
- Use dynamic import: `const XLSX = await import("xlsx-js-style")`
- Build workbook with:
  - Title row (merged, styled with Cairo font, branded colors)
  - Header row (bold, primary color background)
  - Data rows (alternating row colors)
  - Column widths auto-calculated
  - RTL support for Arabic locale
- Accept rows (from the full query result, not the paginated subset — see below)

**2. Container** (`frontend/views/dashboard/parents/home/ParentsContainer.tsx`)
- Replace `handleExport` with Excel export call
- The export should query all parents without pagination for the current filter state
- Either: (a) make a separate `useQuery` with `first: totalCount` for export, or (b) export current page only and label button as "Export current view"
- Decision: **Export current view** — use the existing rows. Label change from "ExportButton" text to indicate "current view". For full export, a separate unpaginated query would be needed, which is out of scope.

**3. View** (`frontend/views/dashboard/parents/home/ParentsView.tsx`)
- No changes needed; `ExportButton` already calls `onExport`

---

## Issue 3: Remove `values` prop from edit form

**Problem**: `useForm` with both `defaultValues` and `values` makes the form controlled, overwriting user input.

**Fix**: `frontend/views/dashboard/parents/profile/edit/ParentProfileEditContainer.tsx`
- Remove `values: defaultValues` from `useForm` options (line 58)
- Keep `defaultValues` only — the form populates on mount from query data, then becomes uncontrolled/editable

---

## Issue 4: Navigate away after deactivation

**Problem**: After deactivation success, user stays on the deactivated parent's profile.

**Fix**: `frontend/views/dashboard/parents/profile/ParentProfileActions.tsx`
- Import `useRouter` from `@/shared/i18n/routing`
- In `onCompleted` callback (line 98-103), add `router.push("/parents")` after showing snackbar
- Remove the previously deleted `setTimeout(() => router.back(), 1500)` — instead use the snackbar `autoHideDuration` (4s) for the user to see the message before navigation

---

## Issue 5: Clean up dead code

**Fix 5a**: `frontend/stores/parentsStore.ts`
- Remove `metrics: readonly MetricItem[]` from interface (line 6)
- Remove `totalParents: number` from interface (line 7)
- Remove `metrics: []` from initial state (line 23)
- Remove `totalParents: 0` from initial state (line 24)
- Remove `import type { MetricItem }` (line 3)

**Fix 5b**: `frontend/views/dashboard/parents/profile/edit/ParentProfileEditContainer.tsx`
- Remove `import { useParams } from "next/navigation"` (line 6)
- Replace `const parentId = typeof params?.id === "string" ? params.id : id || ""` with `const parentId = id`
- Fix `twitter: ""` to `twitter: profile?.twitter ?? ""` (though twitter isn't in the GraphQL profile type, the profile query does return it)

---

## Implementation Order

### Phase 1: Backend (Repository → Service → GraphQL)
1. Add `accountStatus` filter to `parent.repository.ts` `getParentDirectory`
2. Add `accountStatus` param to `parent-directory.service.ts` `getParentDirectory`
3. Add `statusFilter` arg to `parent-directory.query.ts` GraphQL query field
4. Run `bun run generate:gqlSchema && bun codegen`

### Phase 2: Frontend (Documents → Store → Container → View → Edit → Actions)
5. Add `statusFilter` to `parent-directory.documents.ts`
6. Remove client-side filter from `ParentsContainer.tsx`, pass `statusFilter` to query
7. Replace CSV export with Excel export utility
8. Fix `ParentProfileEditContainer.tsx` — remove `values` prop, remove `useParams`, fix `twitter`
9. Fix `ParentProfileActions.tsx` — add navigation after deactivation
10. Clean up `parentsStore.ts` — remove dead fields

### Phase 3: Quality checks
11. `bun tsgo`
12. `bun biome:check`
13. `bun lint`
14. Run parent-related tests: `bun run test:graphql` (parent tests) and `bun run test:db` (parent repo tests)

---

## Files Modified

### Backend (within our scope — parents domain)
- `backend/db/repo/parent.repository.ts` — add accountStatus filter
- `backend/services/parent/parent-directory.service.ts` — pass through accountStatus
- `backend/graphql/query/parent-directory.query.ts` — add statusFilter arg

### Frontend
- `frontend/graphql/sharedDocuments/parent-directory.documents.ts` — add statusFilter variable
- `frontend/stores/parentsStore.ts` — remove dead fields
- `frontend/views/dashboard/parents/home/ParentsContainer.tsx` — server-side filter, Excel export
- `frontend/views/dashboard/parents/profile/edit/ParentProfileEditContainer.tsx` — remove values prop, useParams
- `frontend/views/dashboard/parents/profile/ParentProfileActions.tsx` — add deactivation navigation

### New files
- `frontend/utils/excel-export/parent-directory-export.ts` — Excel export utility
