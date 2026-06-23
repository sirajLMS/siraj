# Task H — Frontend Views: StatusTrackingContainer Migration

## Overview

**Objective:** Migrate `StatusTrackingContainer` from mock store data to real GraphQL data by replacing `mockStatusTrackingStore` imports with Apollo `useQuery` hook calling the new `statusTrackingSchedule` query.

**Dependencies:** Task F (Frontend GraphQL Documents — `statusTrackingScheduleQueryDocument` must exist)

**Target File:** `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` (Modify)

**Estimated Complexity:** Medium — requires data mapping between GraphQL response shape and existing `StatusSessionRow` interface

---

## Background

### Current State (Before This Task)

The `StatusTrackingContainer` component currently imports data from mock stores:

```typescript
// Current imports (to be removed)
import { useStatusTrackingStore, type StatusSessionRow } from "@/frontend/stores/mockStatusTrackingStore";
import { useRescheduleStore } from "@/frontend/stores/mockRescheduleStore";
```

The mock store provides a `StatusSessionRow` interface with this shape:

```typescript
export interface StatusSessionRow {
  id: string;
  studentName: string;
  studentInitials: string;
  studentAvatarUrl?: string;
  className: string;
  teacherName: string;
  schedule: string;
  status: SessionStatus;
  holdNote?: string;
}

export type SessionStatus = "regular" | "suspended_pending" | "on_leave" | "pending_verification";
```

### Target State (After This Task)

The `StatusTrackingContainer` will fetch real data from the GraphQL API using the `statusTrackingScheduleQueryDocument` created in Task F. The GraphQL response has this shape:

```typescript
{
  statusTrackingSchedule: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentInitials: string;
    studentStatus: string;  // "REGULAR" | "SUSPENDED" | "ON_LEAVE" | etc.
    teacherId: string;
    teacherName: string;
    scheduledStartAt: string;  // ISO datetime
    scheduledEndAt: string;    // ISO datetime
    durationMinutes: number;
    executionState: string;    // "NOT_ACTIVATED" | "ACTIVATED" | "RUNNING" | "COMPLETED"
    outcome: string;           // "PENDING" | "TAKEN" | "ABSENT" | "LEAVE"
    isFrozen: boolean;
  }>
}
```

### Key Challenge: Data Shape Mapping

The GraphQL response uses different field names and types than the existing `StatusSessionRow` interface:

| GraphQL Field | StatusSessionRow Field | Transformation Needed |
|---------------|------------------------|----------------------|
| `studentStatus` | `status` | Map to `SessionStatus` enum |
| `isFrozen` | `status` | Combine with `studentStatus` for mapping |
| `executionState` | `status` | Combine with above for mapping |
| `scheduledStartAt` + `scheduledEndAt` | `schedule` | Format as time range string |
| `teacherName` | `className` | Use teacher name as temporary class label |

---

## Implementation Steps

### Step 1: Understand the Status Mapping Logic

The core challenge is mapping the GraphQL fields to the `SessionStatus` type. The mapping rules are:

1. **`suspended_pending`**: Student status is `SUSPENDED` OR `isFrozen` is `true`
2. **`on_leave`**: Student status is `ON_LEAVE`
3. **`pending_verification`**: Execution state is `NOT_ACTIVATED` (and student is not suspended/on_leave)
4. **`regular`**: All other cases

This mapping is implemented as a pure function:

```typescript
function mapToSessionStatus(
  studentStatus: string,
  isFrozen: boolean,
  executionState: string
): SessionStatus {
  if (isFrozen || studentStatus === "SUSPENDED") {
    return "suspended_pending";
  }
  if (studentStatus === "ON_LEAVE") {
    return "on_leave";
  }
  if (executionState === "NOT_ACTIVATED") {
    return "pending_verification";
  }
  return "regular";
}
```

### Step 2: Add Time Formatting Helper

The GraphQL response provides ISO datetime strings for `scheduledStartAt` and `scheduledEndAt`. The `StatusSessionRow.schedule` field expects a formatted time range string like "09:00 AM - 10:00 AM".

```typescript
function formatSchedule(start: string | Date, end: string | Date): string {
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(start)} - ${fmt(end)}`;
}
```

### Step 3: Update Imports

**Remove these imports:**
```typescript
// REMOVE - no longer needed
import { useStatusTrackingStore } from "@/frontend/stores/mockStatuschedulingStore";
```

**Add these imports:**
```typescript
import { useQuery } from "@apollo/client/react";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
```

**Keep these imports:**
```typescript
import { useRescheduleStore } from "@/frontend/stores/mockRescheduleStore";
import type { StatusSessionRow, SessionStatus } from "@/frontend/stores/mockStatusTrackingStore";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { StatusTrackingView } from "./StatusTrackingView";
import { useRouter } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
```

**Note:** The `StatusSessionRow` and `SessionStatus` types are still imported from `mockStatusTrackingStore` because they serve as the shared interface contract. Other components (`StatusTrackingDataGrid`, `StatusBadgeAction`, `StatusTrackingCardList`, `StatusTrackingView`) continue to use these types.

### Step 4: Replace Store Hook with Apollo useQuery

**Before:**
```typescript
const rows = useStatusTrackingStore(state => state.rows);
```

**After:**
```typescript
const today = useMemo(() => new Date().toISOString().split("T")[0], []);

const { data, loading: _loading } = useQuery(statusTrackingScheduleQueryDocument, {
  variables: { date: today },
  fetchPolicy: "cache-and-network",
});

const rawRows = data?.statusTrackingSchedule ?? [];
```

### Step 5: Transform GraphQL Data to StatusSessionRow

Map each GraphQL row to the `StatusSessionRow` interface:

```typescript
const rows: readonly StatusSessionRow[] = rawRows.map(r => ({
  id: r.id,
  studentName: r.studentName,
  studentInitials: r.studentInitials,
  className: r.teacherName, // using teacher name as class label until course name added
  teacherName: r.teacherName,
  schedule: formatSchedule(r.scheduledStartAt, r.scheduledEndAt),
  status: mapToSessionStatus(r.studentStatus, r.isFrozen, r.executionState),
}));
```

### Step 6: Update Metric Calculations

The metric counts must now be derived from the mapped rows:

```typescript
const suspendedCount = rows.filter(r => r.status === "suspended_pending").length;
const totalSessions = rawRows.length;

const metricCounts = useMemo(() => {
  const counts = { regular: 0, pending: 0, suspended: 0, on_leave: 0 };
  for (const row of rows) {
    if (row.status === "regular") counts.regular += 1;
    else if (row.status === "pending_verification") counts.pending += 1;
    else if (row.status === "suspended_pending") counts.suspended += 1;
    else if (row.status === "on_leave") counts.on_leave += 1;
  }
  return counts;
}, [rows]);
```

### Step 7: Complete Component Implementation

Below is the complete, final implementation of `StatusTrackingContainer.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { useRescheduleStore } from "@/frontend/stores/mockRescheduleStore";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
import type { StatusSessionRow, SessionStatus } from "@/frontend/stores/mockStatusTrackingStore";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { StatusTrackingView } from "./StatusTrackingView";

function mapToSessionStatus(
  studentStatus: string,
  isFrozen: boolean,
  executionState: string
): SessionStatus {
  if (isFrozen || studentStatus === "SUSPENDED") {
    return "suspended_pending";
  }
  if (studentStatus === "ON_LEAVE") {
    return "on_leave";
  }
  if (executionState === "NOT_ACTIVATED") {
    return "pending_verification";
  }
  return "regular";
}

function formatSchedule(start: string | Date, end: string | Date): string {
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(start)} - ${fmt(end)}`;
}

export function StatusTrackingContainer() {
  const t = useTranslations("dashboard.statusTracking");
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data, loading: _loading } = useQuery(statusTrackingScheduleQueryDocument, {
    variables: { date: today },
    fetchPolicy: "cache-and-network",
  });

  const rawRows = data?.statusTrackingSchedule ?? [];

  const rows: readonly StatusSessionRow[] = rawRows.map(r => ({
    id: r.id,
    studentName: r.studentName,
    studentInitials: r.studentInitials,
    className: r.teacherName, // using teacher name as class label until course name added
    teacherName: r.teacherName,
    schedule: formatSchedule(r.scheduledStartAt, r.scheduledEndAt),
    status: mapToSessionStatus(r.studentStatus, r.isFrozen, r.executionState),
  }));

  const suspendedCount = rows.filter(r => r.status === "suspended_pending").length;
  const totalSessions = rawRows.length;

  const metricCounts = useMemo(() => {
    const counts = { regular: 0, pending: 0, suspended: 0, on_leave: 0 };
    for (const row of rows) {
      if (row.status === "regular") counts.regular += 1;
      else if (row.status === "pending_verification") counts.pending += 1;
      else if (row.status === "suspended_pending") counts.suspended += 1;
      else if (row.status === "on_leave") counts.on_leave += 1;
    }
    return counts;
  }, [rows]);

  const subLabelMap: Record<string, string> = {
    regular: t("subLabels.regular"),
    pending: t("subLabels.pending"),
    suspended: t("subLabels.suspended"),
    on_leave: t("subLabels.onLeave"),
  };

  const rawMetrics: readonly { key: string; count: number; labelKey: string; icon: unknown; variant?: string }[] = [
    {
      key: "regular",
      count: metricCounts.regular,
      labelKey: "dashboard.statusTracking.metrics.regular",
      icon: CheckCircleOutlineOutlined,
    },
    {
      key: "pending",
      count: metricCounts.pending,
      labelKey: "dashboard.statusTracking.metrics.pending",
      icon: PendingActionsOutlined,
    },
    {
      key: "suspended",
      count: metricCounts.suspended,
      labelKey: "dashboard.statusTracking.metrics.suspended",
      icon: BlockOutlined,
      variant: "error",
    },
    {
      key: "on_leave",
      count: metricCounts.on_leave,
      labelKey: "dashboard.statusTracking.metrics.onLeave",
      icon: EventAvailableOutlined,
    },
  ];

  const metrics: readonly MetricItem[] = rawMetrics.map(m => ({
    ...m,
    subLabel: subLabelMap[m.key],
  }));

  const labels = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    filters: t("filters"),
    newReport: t("newReport"),
    todaysClassSchedule: t("todaysClassSchedule"),
    totalSessions: t.raw("totalSessions") as string,
    studentClass: t("table.studentClass"),
    teacher: t("table.teacher"),
    schedule: t("table.schedule"),
    status: t("table.status"),
    actions: t("table.actions"),
    showingOf: t.raw("showingOf") as string,
    previous: t("previous"),
    next: t("next"),
    joinSession: t("actions.joinSession"),
    activate: t("actions.activate"),
    reschedule: t("actions.reschedule"),
    verifyDocuments: t("actions.verifyDocuments"),
    sessionLocked: t("actions.sessionLocked"),
    administrativeHold: t("administrativeHold"),
    holdDescription: t("holdDescription"),
    seeAll: t("seeAll"),
    todaysSchedule: t("todaysSchedule"),
    regular: t("status.regular"),
    suspendedPending: t("status.suspendedPending"),
    onLeave: t("status.onLeave"),
    pendingVerification: t("status.pendingVerification"),
    regularSubLabel: t("subLabels.regular"),
    pendingSubLabel: t("subLabels.pending"),
    suspendedSubLabel: t("subLabels.suspended"),
    onLeaveSubLabel: t("subLabels.onLeave"),
    suspensionAnalytics: t("analytics.title"),
    analyticsNote: t("analytics.note"),
    urgentTask: t("analytics.urgentTask"),
    accountsLocked: t.raw("analytics.accountsLocked") as string,
    auditDescription: t("analytics.auditDescription"),
    openAuditLogs: t("analytics.openAuditLogs"),
    noEntries: t("noEntries"),
    days: [
      t("days.mon"),
      t("days.tue"),
      t("days.wed"),
      t("days.thu"),
      t("days.fri"),
      t("days.sat"),
      t("days.sun"),
    ] as const,
  };

  const handleNewReport = () => {
    // Navigate or open modal in future
  };

  const handleActivate = (_id: string) => {
    // Admin-only action — triggers status change mutation in future
  };

  const handleReschedule = (id: string) => {
    const row = rows.find(session => session.id === id);
    if (row) {
      setRescheduleSession({
        sessionId: id,
        teacherName: row.teacherName,
        studentName: row.studentName,
        teacherTimezone: "Africa/Cairo",
      });
    }
    router.push("/reschedule");
  };

  const handleVerify = (_id: string) => {
    // Verify documents action — future sprint
  };

  return (
    <StatusTrackingView
      metrics={metrics}
      rows={rows}
      totalSessions={totalSessions}
      suspendedCount={suspendedCount}
      labels={labels}
      onActivate={handleActivate}
      onReschedule={handleReschedule}
      onVerify={handleVerify}
      onNewReport={handleNewReport}
    />
  );
}
```

---

## Important Design Decisions

### 1. Keep StatusSessionRow Interface in Mock Store

The `StatusSessionRow` interface remains in `mockStatusTrackingStore.ts` and is still imported by:
- `StatusTrackingDataGrid.tsx`
- `StatusBadgeAction.tsx`
- `StatusTrackingCardList.tsx`
- `StatusTrackingView.tsx`
- Storybook stories (e.g., `StatusTrackingContainer.stories.tsx`)

**Rationale:** These components don't care about the data source — they only need the interface shape. Moving the interface to a separate `types.ts` file would be a larger refactor that's out of scope for this task. The mock store serves as a convenient shared type location.

### 2. Use Teacher Name as Class Name

The mapping uses `teacherName` for the `className` field:
```typescript
className: r.teacherName, // using teacher name as class label until course name added
```

**Rationale:** The current GraphQL query doesn't include course/class name data. Using teacher name provides a meaningful label for now. A future task can add course name to the GraphQL schema and update this mapping.

### 3. Fetch Policy: cache-and-network

The Apollo query uses `fetchPolicy: "cache-and-network"`:
```typescript
const { data, loading: _loading } = useQuery(statusTrackingScheduleQueryDocument, {
  variables: { date: today },
  fetchPolicy: "cache-and-network",
});
```

**Rationale:** This policy provides immediate UI from cache (if available) while also fetching fresh data from the network. Status tracking is time-sensitive — teachers need to see current state, but shouldn't wait for network on every page load.

### 4. Loading State Handling

The loading state is captured but prefixed with underscore (`_loading`):
```typescript
const { data, loading: _loading } = useQuery(...);
```

**Rationale:** The current UI doesn't have a loading skeleton. The underscore prefix indicates it's intentionally unused for now. A future task can add loading UI. The `cache-and-network` policy means users see cached data immediately, reducing the need for loading states.

### 5. Error Handling

The component doesn't explicitly handle GraphQL errors in this implementation.

**Rationale:** Apollo Client's default error handling will log errors to console. The component gracefully handles missing data via `data?.statusTrackingSchedule ?? []`. A future task can add user-facing error UI if needed.

---

## Testing Requirements

### Manual Testing Checklist

1. **Page Load:**
   - Navigate to the status tracking dashboard
   - Verify the page loads without errors
   - Check browser console for GraphQL query execution

2. **Data Display:**
   - Verify class sessions appear in the table
   - Check that student names and teacher names display correctly
   - Confirm time ranges are formatted correctly (e.g., "09:00 AM - 10:00 AM")

3. **Status Badges:**
   - For a student with `status: "REGULAR"` and `isFrozen: false`: verify badge shows "Regular"
   - For a student with `status: "SUSPENDED"` or `isFrozen: true`: verify badge shows "Suspended" and is styled as error
   - For a student with `status: "ON_LEAVE"`: verify badge shows "On Leave"
   - For a class with `executionState: "NOT_ACTIVATED"` and regular student: verify badge shows "Pending Verification"

4. **Metrics:**
   - Verify metric cards show correct counts
   - Check that counts match the table rows
   - Confirm "Total Sessions" shows total row count

5. **Actions:**
   - Click "Reschedule" button on an ON_LEAVE session — verify it navigates to reschedule page
   - Verify "Activate" button is visible but non-functional (future task)
   - Verify "Join Session" button is visible but non-functional (future task)

6. **Suspension Lock UI:**
   - For a frozen session (isFrozen: true): verify action buttons are hidden/disabled
   - Verify the session shows "Session Locked" or similar indicator

### Automated Testing

Run component tests:
```bash
bun run test:ui:components
```

Run GraphQL integration tests:
```bash
bun run test:graphql
```

**Expected Results:**
- All existing component tests pass (they use mock data via Storybook)
- GraphQL tests confirm `statusTrackingSchedule` query returns correct data
- No TypeScript errors in the container component

---

## Migration Verification

### Before/After Comparison

**Before (Mock Store):**
```typescript
import { useStatusTrackingStore } from "@/frontend/stores/mockStatusTrackingStore";

const rows = useStatusTrackingStore(state => state.rows);
```

**After (Apollo useQuery):**
```typescript
import { useQuery } from "@apollo/client/react";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";

const { data } = useQuery(statusTrackingScheduleQueryDocument, {
  variables: { date: today },
  fetchPolicy: "cache-and-network",
});

const rawRows = data?.statusTrackingSchedule ?? [];
const rows = rawRows.map(r => ({ ... })); // Transform to StatusSessionRow
```

### Verification Commands

1. **Check GraphQL Query Execution:**
```bash
# Open browser dev tools → Network tab
# Navigate to status tracking page
# Filter by "graphql" requests
# Verify request payload includes:
# {
#   "query": "query statusTrackingSchedule($date: String!, ...) { ... }",
#   "variables": { "date": "2026-06-22" }
# }
```

2. **Verify No Mock Store Usage:**
```bash
# Search for mockStatusTrackingStore imports in StatusTrackingContainer
grep -r "useStatusTrackingStore" frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx
# Expected: No matches (or only type imports)
```

3. **Check TypeScript Compilation:**
```bash
bun tsgo
# Expected: 0 errors
```

---

## Rollback Plan

If issues arise, revert the changes:

1. **Restore mock store import:**
```typescript
import { useStatusTrackingStore } from "@/frontend/stores/mockStatusTrackingStore";
```

2. **Remove Apollo useQuery:**
```typescript
// Remove this
import { useQuery } from "@apollo/client/react";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
```

3. **Restore mock data usage:**
```typescript
const rows = useStatusTrackingStore(state => state.rows);
```

4. **Remove mapping functions:**
   - Delete `mapToSessionStatus()`
   - Delete `formatSchedule()`

5. **Restore original metric calculations** (if they differed)

---

## Success Criteria

- [ ] `StatusTrackingContainer` no longer imports `useStatusTrackingStore` (only type imports remain)
- [ ] `StatusTrackingContainer` uses Apollo `useQuery` with `statusTrackingScheduleQueryDocument`
- [ ] GraphQL response is correctly mapped to `StatusSessionRow` interface
- [ ] Status badges display correctly for all student statuses (REGULAR, SUSPENDED, ON_LEAVE)
- [ ] Frozen sessions (isFrozen: true) show `suspended_pending` status
- [ ] Time ranges are formatted correctly (e.g., "09:00 AM - 10:00 AM")
- [ ] Metric cards show accurate counts derived from real data
- [ ] Component renders without errors when GraphQL returns empty array
- [ ] Component handles missing data gracefully (`data?.statusTrackingSchedule ?? []`)
- [ ] Existing Storybook stories continue to work (they use mock data)
- [ ] No TypeScript errors in the modified file
- [ ] Manual testing confirms UI displays real data from database

---

## Quality Gate — Per-File Validation

After modifying `StatusTrackingContainer.tsx`:

- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings
- [ ] Loop over tsgo, biome:check, lint, codescene on working files till no issues at all

---

## Quality Gate — Task Completion Validation

After completing all steps in Task H:

- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings
- [ ] Loop over tsgo, biome:check, lint, codescene on working files till no issues at all

---

## Files Modified

| File | Action | Lines Changed |
|------|--------|---------------|
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` | Modify | ~150 lines |

**Total Files Modified:** 1

---

## Next Steps

After completing Task H:

1. Run all tests: `bun run test`
2. Manually test the status tracking dashboard in browser
3. Proceed to **Section 7: Final Verification & Integrity Protocol**
