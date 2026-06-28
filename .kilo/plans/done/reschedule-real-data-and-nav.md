# Reschedule Page: Make Data & Actions Real

## Scope

**Route**: `app/[locale]/(dashboard)/reschedule`  
**Route**: `app/[locale]/(dashboard)/schedule/tracking/reschedule`

**Files in scope** (frontend views + stores for these routes):
- `frontend/views/dashboard/reschedule/home/` (all files)
- `frontend/views/dashboard/reschedule/tracking/` (all files)
- `frontend/stores/rescheduleStore.ts`
- `frontend/stores/rescheduleTrackingStore.ts`

**Backend files also in scope** (required to add `teacherTimezone` field):
- `backend/types/class-instance-detail.types.ts` — add `teacherTimezone` field
- `backend/graphql/pothos/class-session.pothos.ts` — expose `teacherTimezone`
- `frontend/graphql/sharedDocuments/class-session.documents.ts` — add `teacherTimezone` to query

**Files out of scope**: All other backend services, repos, mutations, and other frontend domains. No edits outside declared scope.

---

## Component Audit & Findings

### Home Route (`/reschedule`)

| # | Component | Status | Issue |
|---|-----------|--------|-------|
| 1 | `RescheduleContainer.tsx` | ⚠️ | `teacherTimezone` mapped to `studentTimezone` (bug); doesn't use `rescheduleStore` despite StatusTracking writing to it |
| 2 | `RescheduleView.tsx` | ✅ | No issues |
| 3 | `RescheduleDateTimeSection.tsx` | ✅ | No issues |
| 4 | `QuickAdjustSection.tsx` | ✅ | No issues |
| 5 | `ClassParticipantsSection.tsx` | ✅ | No issues |
| 6 | `TimezoneWarningBanner.tsx` | ⚠️ | Receives wrong timezone from parent (data source issue) |
| 7 | `NotificationPolicyCard.tsx` | ✅ | Static info card, no actions needed |
| 8 | `home/types.ts` | ⚠️ | `RescheduleSession` is local ad-hoc type instead of deriving from GraphQL generated types |
| 9 | `home/schemas/rescheduleSchema.ts` | ✅ | No issues |
| 10 | `home/utils/rescheduleDateTime.ts` | ✅ | No issues |

### Tracking Route (`/schedule/tracking/reschedule`)

| # | Component | Status | Issue |
|---|-----------|--------|-------|
| 11 | `RescheduleTrackingContainer.tsx` | ❌ | `handleApprove` only logs; `handleReject` only logs; `studentClass` maps `studentName`; no filter state |
| 12 | `RescheduleTrackingView.tsx` | ⚠️ | Mobile `FilterButton` has no `onClick` |
| 13 | `RescheduleTrackingDataGrid.tsx` | ⚠️ | Approve/reject button handlers are no-ops (inherited from container) |
| 14 | `RescheduleTrackingCardList.tsx` | ✅ | Only `onView` (acceptable UX for mobile) |
| 15 | `tracking/types.ts` | ⚠️ | `TrackingClassStatus` unnecessary alias; `studentClass` should be `studentName` |

### Stores

| # | File | Status | Issue |
|---|------|--------|-------|
| 16 | `rescheduleStore.ts` | ⚠️ | Used by `StatusTrackingContainer` but NOT read by `RescheduleContainer`. Store writes session data, but RescheduleContainer only reads from URL `classInstanceId` + GraphQL query |
| 17 | `rescheduleTrackingStore.ts` | ⚠️ | Only stores `page`/`pageSize`; missing filter state for status filter |

---

## User Decisions

1. **Approve/Reject** → Wire to existing `updateSessionStatusLeave` mutation (approve = process leave on original class, reject = navigate to class detail for admin to manually cancel)
2. **FilterButton** → Add inline filter popover with status filter dropdown
3. **rescheduleStore.ts** → Make use of it in production (integrate into `RescheduleContainer`)
4. **teacherTimezone** → Add to the GraphQL query (requires backend type + Pothos field)

---

## Implementation Plan

### Phase 1: Backend — Add `teacherTimezone` to ClassInstanceDetail (bottom layer first)

> Required because `RescheduleContainer` needs teacher timezone from the classInstance query.

**1.1** `backend/types/class-instance-detail.types.ts`
- Add `teacherTimezone: string | null` to `ClassInstanceDetailReturnType`

**1.2** `backend/graphql/utils/class-session.utils.ts`
- Already computes `teacherTimezone = instance.teacher?.timezone ?? null` (line 34)
- Add it to the return object: `teacherTimezone`

**1.3** `backend/graphql/pothos/class-session.pothos.ts`
- Add `teacherTimezone: t.exposeString("teacherTimezone", { nullable: true })` to `ClassInstanceDetailPothosObject`

**1.4** Regenerate GraphQL schema + codegen:
```bash
bun run generate:gqlSchema && bun codegen
```

**1.5** `frontend/graphql/sharedDocuments/class-session.documents.ts`
- Add `teacherTimezone` to `classInstanceQueryDocument` query selection

**1.6** Quality gate: `bun tsgo` (type check only)

---

### Phase 2: Frontend Views — Fix Data & Navigation

**2.1** `frontend/views/dashboard/reschedule/home/types.ts`
- Replace local `RescheduleSession` type with one derived from GraphQL generated types
- Keep `sessionId`, `teacherName`, `studentName`, `teacherTimezone` fields but reference generated types for structure

**2.2** `frontend/views/dashboard/reschedule/tracking/types.ts`
- Remove `TrackingClassStatus` type alias, use `GqlLeaveRequestStatus` directly
- Rename `studentClass` → `studentName` in `TrackingRow`
- Add `originalClassId: string | null` field (needed for approve action)

**2.3** `frontend/views/dashboard/reschedule/home/RescheduleContainer.tsx`
- Fix: **only show `TimezoneWarningBanner` after query has loaded**
  - Add loading state guard
  - Only render banner when `classInstance?.teacherTimezone` is available
- Fix: `teacherTimezone: classInstance.teacherTimezone ?? "UTC"` (use the new field)
- Integrate `useRescheduleStore`:
  ```ts
  const classInstanceId = searchParams.get("classInstanceId") ??"";
  const store = useRescheduleStore();
  const fallbackClassInstanceId = store.session.sessionId;
  ```
  - When `classInstanceId` from URL is empty, use `fallbackClassInstanceId`
  - When the GraphQL query resolves, overwrite the fallback with real data
- Map `RescheduleSession` prefetch (fast pre-render while query loads):
  ```ts
  const fallbackSession = useMemo(() => ({
    sessionId: store.session.sessionId,
    teacherName: store.session.teacherName || "",
    studentName: store.session.studentName || "",
    teacherTimezone: store.session.teacherTimezone || "UTC",
  }), [store.session]);

  const session = data?.classInstance
    ? {
        sessionId: data.classInstance.id ?? "",
        teacherName: data.classInstance.teacher?.name ?? "",
        studentName: data.classInstance.student?.name ?? "",
        teacherTimezone: data.classInstance.teacherTimezone ?? "UTC",
      }
    : fallbackSession;
  ```
- Add null guard: if `classInstance` is null/undefined after query, show error (don't render form)

**2.4** Update all consumers of `studentClass` → `studentName`:
- `RescheduleTrackingContainer.tsx` — rename field in `buildTrackingRows`
- `RescheduleTrackingDataGrid.tsx` — update column field and header
- `RescheduleTrackingCardList.tsx` — update field reference
- `RescheduleTrackingContainer.stories.tsx` — update mock data
- `RescheduleTrackingView.tsx` — update label pass-through

---

### Phase 3: Frontend Views — Wire Real Actions

**3.1** `frontend/stores/rescheduleTrackingStore.ts`
- Add `statusFilter: LeaveRequestStatus | null`
- Add `setStatusFilter: (filter: LeaveRequestStatus | null) => void`
- Reset `page` to 0 when filter changes (UX rule: changing filter resets to first page)

**3.2** `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingContainer.tsx`
- Add import: `updateSessionStatusLeaveMutationDocument` from `@/frontend/graphql/sharedDocuments/class-session.documents.ts`
- **handleApprove**:  
  ```ts
  const [updateSessionStatusLeave] = useMutation(updateSessionStatusLeaveMutationDocument);
  ```
  Wire to call `updateSessionStatusLeave` **on `originalClassId`** (NOT `id`), with:
  ```ts
  await updateSessionStatusLeave({
    variables: {
      classInstanceId: row.originalClassId,
      leaveReason: "Admin approved leave request",
    },
  });
  ```
  After mutation success: refetch the tracking rows via `useQuery({ fetchPolicy: 'network-only' })`, not `refetch()` — network-only avoids stale cache on refetch
- **handleReject**: 
  ```ts
  router.push(`/classes/${row.originalClassId}`);
  ```
  Consider adding hash to highlight the outcome field: `#outcome`
- **handleFilter**: Accept `status: LeaveRequestStatus | null` prop
  ```ts
  const { data } = useQuery(rescheduleTrackingRowsQueryDocument, {
    variables: {
      search: null,
      status: statusFilter,
      paginationArgs: { first: pageSize, page: page + 1 },
    },
  });
  ```
- **buildTrackingRows**: Map `originalClassId` from raw row data
  ```ts
  return {
    ...rawRow,
    originalClassId: rawRow.originalClassId,
  };
  ```


**3.3** `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingView.tsx`
- **Desktop**: Move `ExportButton` to action bar, add new `Select` filter component:
  ```tsx
  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
    <Select<LeaveRequestStatus | "">
      value={statusFilter || ""}
      onChange={(e) => onFilterChange(e.target.value === "" ? null : e.target.value)}
      size="small"
      displayEmpty
      renderValue={value => value ? t(`status.${value.toLowerCase()}`) : t("filterAll")}
    >
      <MenuItem value="">{t("filterAll")}</MenuItem>
      {Object.values(LeaveRequestStatus).map(status => (
        <MenuItem key={status} value={status}>{t(`status.${status.toLowerCase()}`)}</MenuItem>
      ))}
    </Select>
    <ExportButton onClick={onExport} />
  </Box>
  ```
- **Mobile**: Wire the existing `FilterButton` to toggle a filter popover/dialog
  - Use `aria-expanded`, `aria-controls`, `aria-haspopup` for accessibility
  - Close popover on selection or backdrop click
- Extract filter UI state from `rescheduleTrackingStore` for reusability
- Pass `statusFilter` and `onFilterChange` props from container

**3.4** `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingDataGrid.tsx`
- No changes needed — approve/reject buttons already call `onApprove`/`onReject` which will now work

**3.5** `frontend/graphql/sharedDocuments/class-session.documents.ts`
- Already has `updateSessionStatusLeaveMutationDocument` — import it in tracking container

---

### Phase 4: Store Integration

**4.1** `frontend/stores/rescheduleStore.ts`
- The store is already used by `StatusTrackingContainer` to write session data before navigating to `/reschedule`
- Make `RescheduleContainer` read from the store as a fallback:
  - If `searchParams.get("classInstanceId")` is empty, use `useRescheduleStore(state => state.session).sessionId`
  - This bridges the StatusTracking → Reschedule navigation flow
- Update store types to use GraphQL generated types (per AGENTS.md: stores must use generated types)

---

### Phase 5: Storybook & Quality

**5.1** Update `RescheduleContainer.stories.tsx`
- Adjust to use updated store/props structure

**5.2** Update `RescheduleTrackingContainer.stories.tsx`
- Rename `studentClass` → `studentName`
- Remove local `TrackingRow` type, import from `./types.ts`
- Add `originalClassId` to mock data
- Update mock approve/reject handlers

**5.3** Quality gates (in order):
```bash
bun tsgo
bun biome:check
bun lint
```

**5.4** Tests (layer-specific, only run affected test files):
- No unit tests exist for reschedule views
- Run `frontend/graphql/test/class-session.test.ts` if we modified GraphQL documents (phase 1)
- Run component tests if any exist for these components

---

## Files to Modify (Final List)

### Backend (Phase 1)
1. `backend/types/class-instance-detail.types.ts` — add `teacherTimezone`
2. `backend/graphql/utils/class-session.utils.ts` — add `teacherTimezone` to return
3. `backend/graphql/pothos/class-session.pothos.ts` — expose `teacherTimezone` field

### Frontend GraphQL Documents (Phase 1)
4. `frontend/graphql/sharedDocuments/class-session.documents.ts` — add `teacherTimezone` to query

### Frontend Views (Phase 2-3)
5. `frontend/views/dashboard/reschedule/home/types.ts` — derive from generated types
6. `frontend/views/dashboard/reschedule/tracking/types.ts` — remove alias, rename field, add `originalClassId`
7. `frontend/views/dashboard/reschedule/home/RescheduleContainer.tsx` — fix timezone, integrate store
8. `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingContainer.tsx` — wire approve/reject/filter, rename `studentClass`
9. `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingView.tsx` — add filter UI

### Frontend Stores (Phase 3-4)
10. `frontend/stores/rescheduleTrackingStore.ts` — add filter state
11. `frontend/stores/rescheduleStore.ts` — update types to use generated types

### Storybook (Phase 5)
12. `frontend/views/dashboard/reschedule/home/RescheduleContainer.stories.tsx` — update props
13. `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingContainer.stories.tsx` — rename fields, update types

### Data files affected by `studentClass` → `studentName` rename (Phase 2)
14. `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingDataGrid.tsx` — update field name
15. `frontend/views/dashboard/reschedule/tracking/RescheduleTrackingCardList.tsx` — update field name

---

## Enum Consistency

- `LeaveRequestStatus` and `RescheduleDateLabel` are already properly shared from `shared/lib/enum.ts` through all layers ✅
- Frontend correctly uses codegen-generated enum types ✅
- No enum drift detected ✅
