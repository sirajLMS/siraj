# Classes Pages: Make All Components Use Real GraphQL Data & Actions

## Scope

All files under `app/[locale]/(dashboard)/classes/` and their view components in `frontend/views/dashboard/classes/`.

**3 page routes:**
1. `classes/[id]` → ClassDetailsContainer
2. `classes/[id]/audit` → ClassAuditContainer
3. `classes/new` → CreateRecurringClassContainer

## Findings: Components with Fake/Non-functional Data or Actions

### 1. StatusTrackingContainer (`status/tracking/`)
**File:** `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx:52-56`

Three no-op handlers passed to `StatusTrackingView`:
```tsx
onActivate={(_id: string) => {}}
onVerify={(_id: string) => {}}
onNewReport={() => {}}
```

**Issues:**
- `onActivate` — does nothing. **Fix:** Call `activateClassMutationDocument` or navigate to class details page.
- `onVerify` — does nothing. **Fix:** Navigate to student status/verification page: `/${locale}/students/${id}/status`.
- `onNewReport` — does nothing. **Fix:** Navigate to `/${locale}/classes/new` (create recurring class page).

### 2. StatusBadgeAction (`status/tracking/`)
**File:** `frontend/views/dashboard/classes/status/tracking/StatusBadgeAction.tsx:135-137`

"Join Session" button for "regular" status has empty click handler:
```tsx
onClick={() => { /* join session */ }}
```

**Issue:** The "join session" action does nothing.  
**Fix:** Navigate to `/${locale}/classes/${rowId}` (class details page) where there's a "Join Zoom" button, OR open the `zoomMeetingUrl` from the row data if available. Need to check if `StatusTrackingRow` has a `zoomMeetingUrl` field — if not, add it to the GraphQL query and navigate instead.

### 3. StatusTrackingView — Mobile FAB
**File:** `frontend/views/dashboard/classes/status/tracking/StatusTrackingView.tsx:157`

The mobile FAB button has no `onClick` handler:
```tsx
<StyledMobileFab id="status-fab-btn" aria-label={labels.newReport}>
  <AddOutlined />
</StyledMobileFab>
```

**Issue:** The FAB does nothing when clicked.  
**Fix:** Add `onClick={onNewReport}` to the mobile FAB element.

### 4. ClassAuditContainer — "Edit Class" action
**File:** `frontend/views/dashboard/classes/audit/ClassAuditContainer.tsx:221`

```tsx
const handleEditClass = () => {
  router.push(`/${locale}/reschedule?classInstanceId=${id}`);
};
```

**Issue:** Navigates to `/reschedule` which is a real page, but the query parameter `classInstanceId` may not be handled.  
**Fix:** Verify the reschedule page reads `classInstanceId` from `searchParams` and pre-selects the class. If not, update the reschedule container to handle it. **This may be out of scope** if the reschedule page belongs to another agent.

### 5. ClassDetailsContainer — `handleInfoEdit` action
**File:** `frontend/views/dashboard/classes/details/ClassDetailsContainer.tsx:290`

```tsx
const handleInfoEdit = () => {
  router.push(`/${locale}/classes/${id}/audit`);
};
```

**Status:** This is REAL — it navigates to the audit page. ✅

### 6. ClassDetailsContainer — Delete action
**File:** `frontend/views/dashboard/classes/details/ClassDetailsContainer.tsx:267-275`

```tsx
const handleDeleteConfirm = async () => {
  await deleteClass({ variables: { classInstanceId: id } });
  router.push(`/${locale}/dashboard`);
};
```

**Status:** This is REAL — calls GraphQL mutation and navigates. ✅

### 7. ClassDetailsContainer — All other mutations
**Status:** All mutations (activateClass, activateOverrideClass, stopClass, startSession, markAbsent, processLeave, resetSession) are REAL — they call actual GraphQL mutations. ✅

### 8. CreateRecurringClassContainer
**Status:** This is REAL — calls `createRecurringClassMutationDocument` GraphQL mutation. ✅

### 9. ClassAuditContainer — All actions
**Status:** 
- `handleGenerateReport` — REAL (exports CSV) ✅
- `handleEditClass` — REAL (navigates to reschedule) ✅
- `handleExportStudents` — REAL (exports CSV) ✅
- `handleViewStudent` — REAL (navigates to student status) ✅
- `handleJoinMeeting` — REAL (opens zoom/meeting URL) ✅
- `handleResendNotifications` — REAL (calls `resendClassNotificationsMutationDocument`) ✅
- `handleSaveNote`/`handleOpenNoteDialog` — REAL (calls `updateClassAdminNoteMutationDocument`) ✅

---

## Summary: Items Requiring Fix

| # | Component | File | Issue | Suggested Fix |
|---|-----------|------|-------|---------------|
| 1 | StatusTrackingContainer | `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx:52` | `onActivate` is no-op | Call `activateClass` mutation or navigate to class details |
| 2 | StatusTrackingContainer | `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx:54` | `onVerify` is no-op | Navigate to `/${locale}/students/${id}/status` |
| 3 | StatusTrackingContainer | `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx:55` | `onNewReport` is no-op | Navigate to `/${locale}/classes/new` |
| 4 | StatusBadgeAction | `frontend/views/dashboard/classes/status/tracking/StatusBadgeAction.tsx:135-137` | "Join Session" button has empty `onClick` | Navigate to `/${locale}/classes/${rowId}` (class details page) |
| 5 | StatusTrackingView (mobile FAB) | `frontend/views/dashboard/classes/status/tracking/StatusTrackingView.tsx:157` | Mobile FAB has no `onClick` | Add `onClick={onNewReport}` |

## Implementation Plan

### Phase 1: Frontend Views Layer (Status Tracking)

1. **StatusTrackingContainer.tsx** — Implement the 3 no-op handlers:
   - `onActivate`: Import and call `activateClassMutationDocument`, then refetch the schedule query. Need to add `useMutation` for `activateClassMutationDocument` and use Apollo client to refetch. Alternative: navigate to `/${locale}/classes/${id}` where the user can activate from the details page. The simpler and more appropriate fix is to **navigate** to the class details page since activation from a list requires confirmation context that the details page provides.
   - `onVerify`: Navigate to `/${locale}/students/${studentId}/status` — but we need the student ID from the row. The `StatusTrackingRow` already has `studentId`, so we can use `router.push(\`/${locale}/students/${row.studentId}/status\`)`.
   - `onNewReport`: Navigate to `/${locale}/classes/new` via `router.push`.

2. **StatusBadgeAction.tsx** — Fix the "Join Session" empty onClick:
   - The `onActivate`, `onReschedule`, `onVerify` are already passed as props from the container. But the "Join Session" action for "regular" status doesn't use any prop.
   - **Fix:** Navigate to the class details page: use `useRouter` and `useLocale` from next-intl to call `router.push(\`/${locale}/classes/${rowId}\`)`.

3. **StatusTrackingView.tsx** — Fix the mobile FAB:
   - Add `onClick={onNewReport}` to `StyledMobileFab`.

### Phase 2: Quality Checks

- Run `bun tsgo` for type checking
- Run `bun biome:check` for lint/format
- Run `bun lint` for ESLint
- Run layer-specific tests for frontend views

### Files to Modify

| File | Change |
|------|--------|
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` | Implement `onActivate`, `onVerify`, `onNewReport` with real navigation/mutation |
| `frontend/views/dashboard/classes/status/tracking/StatusBadgeAction.tsx` | Implement "Join Session" click → navigate to class details |
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingView.tsx` | Add `onClick={onNewReport}` to mobile FAB |

### Dependencies

- These changes are purely frontend view-layer; they affect no backend services, repositories, or GraphQL schema.
- No new GraphQL documents needed — existing mutations and navigation patterns are sufficient.
- No changes needed to `classes/[id]`, `classes/[id]/audit`, or `classes/new` pages — they already use real data and actions.
