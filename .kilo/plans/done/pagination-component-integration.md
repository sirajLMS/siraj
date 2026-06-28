# Pagination Component & Server-Side Pagination Integration Plan

## Summary

Create a reusable `PaginationControls` component in `frontend/components/ui/`, then integrate server-side pagination across 10 pages that use DataGrid/CardList patterns. For each page, update all backend layers (types → repo → service → pothos) then frontend layers (documents → codegen → views/stores).

---

## Phase 1: Create Shared Pagination Component (Component Palette)

### Task 1.1: Create `PaginationControls` component

- Extract `ScheduleOverviewPaginationControls` from `frontend/views/dashboard/dashboard/components/ScheduleOverviewPagination.tsx` into a generic, reusable `PaginationControls` component at `frontend/components/ui/PaginationControls.tsx`
- Props: `page`, `pageCount`, `rowCount`, `pageSize`, `embedded?`, `onPageChange`, `translationNamespace?` (default: `"dashboard.admin"`)
- Also create `GridPagination` variant that uses MUI Grid API context (extracted from `ScheduleOverviewGridPagination`)
- Move `clampPage` helper into the component
- All styled sub-components (`StyledPaginationRoot`, `StyledPaginationActions`, `StyledPageInput`, `StyledPageNavButton`) move with it
- Use theme palette tokens — no hardcoded colors (already compliant)
- Create Storybook story: `PaginationControls.stories.tsx`

### Task 1.2: Export from `frontend/components/ui/index.ts`

- Add `PaginationControls` and `GridPagination` exports to `index.ts`
- Remove old `ScheduleOverviewPagination.tsx` and update `ScheduleOverviewSection.tsx` imports

### Task 1.3: Quality loop — tsgo, biome:check, lint

- Run `bun tsgo` → fix any type errors
- Run `bun biome:check` → fix formatting/lint issues
- Run `bun lint` → fix ESLint issues
- Repeat until a complete round passes with zero errors

---

## Phase 2: Admin Dashboard Schedule Overview Page

### Task 2.1: Update `.types` — Add pagination result wrapper types

- In `backend/types/scheduling.types.ts`, add `ScheduleOverviewPaginatedResult` type with `rows`, `totalCount`, `pageInfo: PageInfo`
- Ensure `PageInfo` import from `backend/types/pagination.types.ts`

### Task 2.2: Quality loop — tsgo, biome:check, lint

- Run all three; fix until clean round

### Task 2.3: Update repository — Add pagination params to schedule repo

- Locate the repository handling admin dashboard schedule queries
- Add `PaginationArgs` parameter to the relevant `findMany`/query method(s)
- Apply `LIMIT`/`OFFSET` using `pagination.perPage` and `pagination.offset`

### Task 2.4: Quality loop — tsgo, biome:check, lint

- Run all three; fix until clean round

### Task 2.5: Update service — Add pagination args to schedule service

- Update service method to accept `PaginationArgs | null`
- Pass pagination to repository
- Return `{ rows, totalCount, pageInfo }` instead of flat rows

### Task 2.6: Quality loop — tsgo, biome:check, lint

- Run all three; fix until clean round

### Task 2.7: Update Pothos — Add pagination args to admin dashboard query

- In the schedule-related Pothos file, add `paginationArgs` input argument to `adminDashboardSchedule` query
- Construct `PaginationArgs` from resolver args (same pattern as `student-directory.pothos.ts`)
- Update return type to include `totalCount` and optionally `pageInfo`
- Expose `PaginationArgs` input type reference

### Task 2.8: Quality loop — tsgo, biome:check, lint

- Run all three; fix until clean round

### Task 2.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/schedule.documents.ts` — add `$paginationArgs: PaginationArgs` variable to `adminDashboardSchedule` query and request `totalCount` + `pageInfo { count currentPage hasMorePages lastPage perPage total }` fields
- Run `bun codegen`

### Task 2.10: Update frontend — Container, View, Store, pagination integration

- Update `AdminDashboardContainer.tsx`:
  - Add pagination state (`page`, `pageSize`) if not already in store
  - Pass `paginationArgs: { first: pageSize, page: page + 1 }` to query variables
  - Use `totalCount` and `pageInfo` from response instead of client-side slicing
  - Remove client-side `rows.slice(page * pageSize, ...)` — rely on server pagination
- Update `ScheduleOverviewSection.tsx` to import `PaginationControls` from `@/frontend/components/ui`
- Replace `ScheduleOverviewPaginationControls` with `PaginationControls`
- Replace `ScheduleOverviewGridPagination` with shared `GridPagination`
- Update `ScheduleOverviewDataGrid.tsx` to use shared `GridPagination`
- Remove `ScheduleOverviewPagination.tsx` file
- Update `ScheduleOverviewCardList.tsx` to accept and render `PaginationControls`

---

## Phase 3: Student Directory Page

### Task 3.1: Update `.types` — Verify pagination result wrapper exists

- `StudentDirectoryResult` already includes `rows` — verify it includes or add `totalCount` and `pageInfo: PageInfo`

### Task 3.2: Quality loop — tsgo, biome:check, lint

### Task 3.3: Update repository — Ensure pagination LIMIT/OFFSET applied

- Verify `StudentRepository.getDirectoryRows` applies pagination correctly
- Add `totalCount` query if missing

### Task 3.4: Quality loop — tsgo, biome:check, lint

### Task 3.5: Update service — Ensure service passes pagination through

- Verify `StudentDirectoryService.getStudentDirectory` returns `totalCount`/`pageInfo`

### Task 3.6: Quality loop — tsgo, biome:check, lint

### Task 3.7: Update Pothos — Already has `paginationArgs`; ensure `totalCount`/`pageInfo` in response

- Verify `studentDirectory` query exposes `totalCount` and `pageInfo` fields
- May need a wrapper object type for paginated response

### Task 3.8: Quality loop — tsgo, biome:check, lint

### Task 3.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/student-directory.documents.ts` — add `$paginationArgs: PaginationArgs` and request `totalCount` + `pageInfo` in selection
- Run `bun codegen`

### Task 3.10: Update frontend — Container, View, Store, DataGrid/CardList

- Add pagination state to `useStudentDirectoryStore` (`page`, `pageSize`, `setPage`)
- Update `StudentsContainer.tsx` — pass `paginationArgs` to query, use `totalCount` from response
- Update `StudentsDesktopView.tsx` / `StudentsMobileView.tsx` — add `PaginationControls`
- Update `StudentDirectoryDataGrid.tsx` — use `GridPagination` footer with server-side pagination
- Update `StudentDirectoryCardList.tsx` — render `PaginationControls` at bottom

---

## Phase 4: Parents Directory Page

### Task 4.1: Update `.types` — Add `ParentDirectoryPaginatedResult` with pagination

- Add `ParentDirectoryPaginatedResult` with `rows`, `metrics`, `totalCount`, `pageInfo`

### Task 4.2: Quality loop — tsgo, biome:check, lint

### Task 4.3: Update repository — Add pagination to `parent-directory` repository

- Add `PaginationArgs` parameter to parent directory repo method
- Apply LIMIT/OFFSET

### Task 4.4: Quality loop — tsgo, biome:check, lint

### Task 4.5: Update service — Add pagination args to `ParentDirectoryService`

- Accept and forward `PaginationArgs`
- Return `totalCount` and `pageInfo`

### Task 4.6: Quality loop — tsgo, biome:check, lint

### Task 4.7: Update Pothos — Add `paginationArgs` to `parentDirectory` query

- Add `PaginationArgsObject` input arg
- Update `parent-directory.pothos.ts` query to accept pagination

### Task 4.8: Quality loop — tsgo, biome:check, lint

### Task 4.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/parent-directory.documents.ts` — add pagination args and `totalCount`/`pageInfo` fields
- Run `bun codegen`

### Task 4.10: Update frontend — Container, View, DataGrid/CardList

- Add pagination state to `parentsStore` (or new `parentsDirectoryStore`) — `page`, `pageSize`, `setPage`, `totalCount`
- Update `ParentsContainer.tsx` — pass `paginationArgs` to query instead of `limit: 50, offset: 0`
- Update `ParentsView.tsx` — pass pagination props
- Update `ParentsDataGrid.tsx` — use `GridPagination` for server-side pagination
- Update `ParentCardList.tsx` — render `PaginationControls`

---

## Phase 5: Teachers Directory Page

### Task 5.1: Update `.types` — Add `TeacherDirectoryPaginatedResult`

- Add `TeacherDirectoryPaginatedResult` with `rows`, `metrics`, `totalTeachers`, `pageInfo`

### Task 5.2: Quality loop — tsgo, biome:check, lint

### Task 5.3: Update repository — Add pagination to teacher directory repo

- Add `PaginationArgs` parameter to teacher directory repo method

### Task 5.4: Quality loop — tsgo, biome:check, lint

### Task 5.5: Update service — Add pagination args to `StaffDirectoryService`

- Update `StaffDirectoryService.getTeacherDirectory` to accept and forward `PaginationArgs`

### Task 5.6: Quality loop — tsgo, biome:check, lint

### Task 5.7: Update Pothos — Add `paginationArgs` to `teacherDirectory` query

- Currently uses `search`, `limit`, `offset` as separate args — refactor to use `PaginationArgsObject`

### Task 5.8: Quality loop — tsgo, biome:check, lint

### Task 5.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — change `teacherDirectory` query to use `PaginationArgs`
- Run `bun codegen`

### Task 5.10: Update frontend — Container, View, DataGrid/CardList

- Add pagination state to `teacherDirectoryStore` — `page`, `pageSize`, `setPage`
- Update `TeachersContainer.tsx` — use `paginationArgs` instead of `limit/offset`
- Update `TeachersView.tsx` — pass pagination props
- Add `TeacherCardList` pagination with `PaginationControls`
- Update `TeacherScheduleDataGrid` with `GridPagination` if applicable

---

## Phase 6: Managers Directory Page

### Task 6.1: Update `.types` — Add `ManagerDirectoryPaginatedResult`

- Add paginated result type with `rows`, `totalCount`, `pageInfo`

### Task 6.2: Quality loop — tsgo, biome:check, lint

### Task 6.3: Update repository — Add pagination to manager directory repo

- Update `StaffProfileRepository.getManagerDirectory` to accept `PaginationArgs`

### Task 6.4: Quality loop — tsgo, biome:check, lint

### Task 6.5: Update service — Add pagination to `ManagerDirectoryService`

- Accept and forward `PaginationArgs`; return `totalCount`/`pageInfo`

### Task 6.6: Quality loop — tsgo, biome:check, lint

### Task 6.7: Update Pothos — Add `paginationArgs` to `managerDirectory` query

- Currently has no pagination args — add `PaginationArgsObject`

### Task 6.8: Quality loop — tsgo, biome:check, lint

### Task 6.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — add pagination args to `managerDirectory` query
- Run `bun codegen`

### Task 6.10: Update frontend — Container, View, DataGrid/CardList

- Add pagination state to `managersDirectoryStore` — `page`, `pageSize`, `setPage`
- Update `ManagersContainer.tsx` — pass `paginationArgs` to query
- Replace ad-hoc footer in `ManagersDataGrid.tsx` with `GridPagination`
- Replace ad-hoc footer in `ManagersCardList.tsx` with `PaginationControls`
- Move from client-side filtering to server-side if pagination requires it

---

## Phase 7: Reschedule Tracking Page

### Task 7.1: Update `.types` — Add `RescheduleTrackingPaginatedResult`

- Add paginated result type for tracking rows with `totalCount`, `pageInfo`

### Task 7.2: Quality loop — tsgo, biome:check, lint

### Task 7.3: Update repository — Add pagination to reschedule tracking repo

### Task 7.4: Quality loop — tsgo, biome:check, lint

### Task 7.5: Update service — Add pagination args to reschedule tracking service

### Task 7.6: Quality loop — tsgo, biome:check, lint

### Task 7.7: Update Pothos — Add `paginationArgs` to `rescheduleTrackingRows` query

- Currently uses `input: { limit, offset, status, search }` — refactor to standard `PaginationArgs`

### Task 7.8: Quality loop — tsgo, biome:check, lint

### Task 7.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update reschedule tracking documents with pagination args and `totalCount`/`pageInfo`
- Run `bun codegen`

### Task 7.10: Update frontend — Container, View, DataGrid/CardList

- Add pagination state to `rescheduleStore` (or new store)
- Update `RescheduleTrackingContainer.tsx` — pass pagination args to query
- Update `RescheduleTrackingView.tsx` — pass pagination props
- Update `RescheduleTrackingDataGrid.tsx` — use `GridPagination`
- Update `RescheduleTrackingCardList.tsx` — render `PaginationControls`

---

## Phase 8: Billing Admin Invoices Page

### Task 8.1: Update `.types` — Add `InvoiceHistoryPaginatedResult`

- Add paginated result for `parentInvoiceHistory` with `totalCount`, `pageInfo`

### Task 8.2: Quality loop — tsgo, biome:check, lint

### Task 8.3: Update repository — Add pagination to billing invoice repo

### Task 8.4: Quality loop — tsgo, biome:check, lint

### Task 8.5: Update service — Add pagination args to billing service

### Task 8.6: Quality loop — tsgo, biome:check, lint

### Task 8.7: Update Pothos — Add `paginationArgs` to `parentInvoiceHistory` query

### Task 8.8: Quality loop — tsgo, biome:check, lint

### Task 8.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/parent-billing-history.documents.ts`
- Run `bun codegen`

### Task 8.10: Update frontend — AdminBillingContainer, DataGrid/CardList

- Add pagination state to new `adminBillingStore` or `useState`
- Update `AdminBillingContainer.tsx` — pass pagination args
- Update `AdminInvoicesDataGrid.tsx` — use `GridPagination`
- Update `AdminInvoicesCardList.tsx` — render `PaginationControls`
- Update `ParentBillingContainer.tsx` similarly

---

## Phase 9: Parent Billing Invoices Page

### Task 9.1: Update `.types` — Reuse `InvoiceHistoryPaginatedResult` or create parent-specific type

### Task 9.2: Quality loop — tsgo, biome:check, lint

### Task 9.3: Update repository — Ensure pagination supported for parent invoice query

### Task 9.4: Quality loop — tsgo, biome:check, lint

### Task 9.5: Update service — Add pagination args to parent billing service

### Task 9.6: Quality loop — tsgo, biome:check, lint

### Task 9.7: Update Pothos — Verify pagination args on parent invoice query

### Task 9.8: Quality loop — tsgo, biome:check, lint

### Task 9.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Verify billing documents include pagination
- Run `bun codegen`

### Task 9.10: Update frontend — ParentBillingContainer, DataGrid/CardList

- Update `ParentBillingContainer.tsx` — pass pagination args
- Update `ParentInvoicesDataGrid.tsx` — use `GridPagination`
- Update `ParentInvoicesCardList.tsx` — render `PaginationControls`

---

## Phase 10: Schedule Alerts Page

### Task 10.1: Update `.types` — Add `AcademicSchedulePaginatedResult`

### Task 10.2: Quality loop — tsgo, biome:check, lint

### Task 10.3: Update repository — Add pagination to schedule alerts repo

### Task 10.4: Quality loop — tsgo, biome:check, lint

### Task 10.5: Update service — Add pagination args to schedule alerts service

### Task 10.6: Quality loop — tsgo, biome:check, lint

### Task 10.7: Update Pothos — Add `paginationArgs` to schedule alerts query

### Task 10.8: Quality loop — tsgo, biome:check, lint

### Task 10.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update schedule documents with pagination
- Run `bun codegen`

### Task 10.10: Update frontend — ScheduleAlertsView, DataGrid/CardList

- Update container (if exists) or create store for pagination state
- Update `ScheduleAlertsView.tsx` — pass pagination props to both mobile and desktop layouts
- Update `AcademicScheduleDataGrid.tsx` — use `GridPagination` with server-side pagination
- Update `AcademicScheduleCardList.tsx` — render `PaginationControls` at bottom

---

## Phase 11: Admin Complaints Page

### Task 11.1: Update `.types` — Add `ComplaintQueuePaginatedResult`

### Task 11.2: Quality loop — tsgo, biome:check, lint

### Task 11.3: Update repository — Add pagination to complaint queue repo

### Task 11.4: Quality loop — tsgo, biome:check, lint

### Task 11.5: Update service — Add pagination args to complaint service

### Task 11.6: Quality loop — tsgo, biome:check, lint

### Task 11.7: Update Pothos — Add `paginationArgs` to `adminComplaintQueue` query

- Currently uses `filter: { search, status, limit, offset }` — add `PaginationArgs`

### Task 11.8: Quality loop — tsgo, biome:check, lint

### Task 11.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/complaint.documents.ts`
- Run `bun codegen`

### Task 11.10: Update frontend — AdminComplaintsContainer, CardList components

- Add pagination state to `adminComplaintsStore`
- Update `AdminComplaintsContainer.tsx` — pass pagination args to query
- Update `AdminComplaintsDesktopView.tsx` — add `ComplaintQueueCardList` pagination
- Update `AdminComplaintsMobileView.tsx` — add `PaginationControls`
- Update `ComplaintQueueCardList.tsx` — render `PaginationControls` at bottom

---

## Phase 12: Parent Complaints Page

### Task 12.1: Update `.types` — Reuse or extend `ComplaintQueuePaginatedResult`

### Task 12.2: Quality loop — tsgo, biome:check, lint

### Task 12.3: Update repository — Ensure pagination for parent complaint query

### Task 12.4: Quality loop — tsgo, biome:check, lint

### Task 12.5: Update service — Add pagination to parent complaint service

### Task 12.6: Quality loop — tsgo, biome:check, lint

### Task 12.7: Update Pothos — Verify pagination on parent complaint queries

### Task 12.8: Quality loop — tsgo, biome:check, lint

### Task 12.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update complaint documents for parent pagination
- Run `bun codegen`

### Task 12.10: Update frontend — ParentComplaintsContainer, CardList/RecordCard

- Update `ParentComplaintsContainer.tsx` — pass pagination args
- Update `ComplaintRecordCardList.tsx` — render `PaginationControls`
- Update parent complaint views to show pagination

---

## Phase 13: Teacher Dashboard Active Schedule

### Task 13.1: Update `.types` — Add `TeacherDashboardPaginatedResult`

- Paginated wrapper for teacher schedule rows

### Task 13.2: Quality loop — tsgo, biome:check, lint

### Task 13.3: Update repository — Add pagination to teacher schedule repo

### Task 13.4: Quality loop — tsgo, biome:check, lint

### Task 13.5: Update service — Add pagination args to teacher dashboard service

### Task 13.6: Quality loop — tsgo, biome:check, lint

### Task 13.7: Update Pothos — Add `paginationArgs` to teacher dashboard queries

- Update `teacherDashboard` and `teacherActiveDashboard` queries

### Task 13.8: Quality loop — tsgo, biome:check, lint

### Task 13.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts`
- Run `bun codegen`

### Task 13.10: Update frontend — TeacherDashboardContainer, DataGrid/CardList

- Add pagination state to `teacherDashboardStore`
- Update `TeacherDashboardContainer.tsx` — pass pagination args
- Update `TeacherDashboardActiveView.tsx` — add `PaginationControls`
- Update `TeacherDashboardView.tsx` — add `PaginationControls`
- Update `TeacherActiveScheduleDataGrid.tsx` — use `GridPagination`
- Update `TeacherScheduleCardList.tsx` — render `PaginationControls`

---

## Phase 14: Parent Dashboard Schedule

### Task 14.1: Update `.types` — Add `ParentDashboardPaginatedResult`

### Task 14.2: Quality loop — tsgo, biome:check, lint

### Task 14.3: Update repository — Add pagination to parent schedule repo

### Task 14.4: Quality loop — tsgo, biome:check, lint

### Task 14.5: Update service — Add pagination to parent dashboard service

### Task 14.6: Quality loop — tsgo, biome:check, lint

### Task 14.7: Update Pothos — Add `paginationArgs` to parent dashboard schedule query

### Task 14.8: Quality loop — tsgo, biome:check, lint

### Task 14.9: Generate GraphQL schema & update documents

- Run `bun run generate:gqlSchema`
- Update parent dashboard documents
- Run `bun codegen`

### Task 14.10: Update frontend — ParentDashboardContainer, DataGrid/CardList

- Add pagination state to `parentDashboardStore`
- Update `ParentDashboardContainer.tsx`
- Update `ParentDashboardView.tsx`
- Update `ParentScheduleDataGrid.tsx` — use `GridPagination`
- Update `ParentScheduleCardList.tsx` — render `PaginationControls`

---

## Phase 15: Final Cleanup & Integration

### Task 15.1: Remove all deleted pagination files

- Delete `ScheduleOverviewPagination.tsx` (replaced by shared component)
- Verify no dead imports remain

### Task 15.2: Update Storybook stories

- Add `PaginationControls` story
- Update any existing stories that reference old pagination components

### Task 15.3: Run full quality gate

- `bun quality-gate:fresh` — ensure complete pass across tsgo, biome, lint, codescene, sonar

### Task 15.4: Verify all generated types

- Run `bun run generate:gqlSchema && bun codegen` one final time
- Ensure no TypeScript errors in generated files

### Task 15.5: Manual smoke test checklist

- Verify each of the 10 pages renders correctly with pagination on desktop
- Verify each of the 10 pages renders correctly with pagination on mobile
- Verify pagination controls navigate between pages
- Verify DataGrid pagination syncs with GraphQL query variables
- Verify CardList pagination syncs with GraphQL query variables

---

## Task Count Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| 1 | Shared Pagination Component | 3 |
| 2 | Admin Dashboard Schedule Overview | 10 |
| 3 | Student Directory | 10 |
| 4 | Parents Directory | 10 |
| 5 | Teachers Directory | 10 |
| 6 | Managers Directory | 10 |
| 7 | Reschedule Tracking | 10 |
| 8 | Billing Admin Invoices | 10 |
| 9 | Parent Billing Invoices | 10 |
| 10 | Schedule Alerts | 10 |
| 11 | Admin Complaints | 10 |
| 12 | Parent Complaints | 10 |
| 13 | Teacher Dashboard Active Schedule | 10 |
| 14 | Parent Dashboard Schedule | 10 |
| 15 | Final Cleanup & Integration | 5 |
| **Total** | | **148** |

---

## Key Patterns & Conventions

### Backend Pagination Pattern (follow `student-directory` as reference)
- **Types**: `{Entity}PaginatedResult = { rows: {Entity}ReturnType[], totalCount: number, pageInfo: PageInfo }`
- **Repo**: Accept `PaginationArgs`, apply `LIMIT = pagination.perPage`, `OFFSET = pagination.offset`, add `COUNT(*)` for `totalCount`
- **Service**: Accept `PaginationArgs | null`, forward to repo, return paginated result
- **Pothos**: Add `paginationArgs: t.arg({ type: PaginationArgsObject, required: false })`, construct `new PaginationArgs({...})` in resolver

### Frontend Pagination Pattern
- **Store**: Add `page: number`, `pageSize: number`, `setPage`, `totalCount` to Zustand store
- **Container**: Pass `paginationArgs: { first: pageSize, page: page + 1 }` to query variables; use `totalCount`/`pageInfo` from response
- **DataGrid**: Use `GridPagination` component from `@/frontend/components/ui` for `slots.pagination`
- **CardList**: Render `<PaginationControls>` at bottom of card list

### Quality Loop (repeat until clean)
```bash
bun tsgo
bun biome:check
bun lint
```

### Schema & Codegen (after backend changes)
```bash
bun run generate:gqlSchema
bun codegen
```

### Rules Compliance
- All types in `backend/types/` — never local definitions in Pothos files
- All user-facing strings via `next-intl` — never hardcoded
- All colors from theme palette — never hardcoded
- `console.*` forbidden — use `logger`
- No `useLazyQuery` — use `useQuery`
- Import hooks from `"@apollo/client/react"`
- Always include `id` field in GraphQL query selections
- MUI v9: style props go in `sx`, not as direct props
