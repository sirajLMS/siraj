# Refactor Plan: Student History Page (`students/[id]/history`)

## Scope

**Route files in scope:**
```
frontend/views/dashboard/students/history/
├── types.ts
├── StudentHistoryContainer.tsx
├── StudentHistoryView.tsx
├── StudentHistoryContainer.stories.tsx
└── components/
    ├── CalendarGrid.tsx
    ├── ClassSessionList.tsx
    ├── MobileWeeklyScroller.tsx
    ├── PerformanceStreak.tsx
    ├── StudentHistoryDesktop.tsx
    └── StudentHistoryMobile.tsx

frontend/stores/studentHistoryStore.ts
app/[locale]/(dashboard)/students/[id]/history/page.tsx
```

**Out of scope:** Backend Pothos/service/repo files, other student pages, `frontend/graphql/sharedDocuments/student-history.documents.ts`.

---

## User Decisions

| Decision | Choice |
|----------|--------|
| Month navigation | Prev/Next arrows with refetch; RTL: `sx: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)"` |
| PDF Export | Wire to `window.print()` with print-optimized stylesheet |
| PerformanceStreak | Accept streak data as prop; derive from sessions on parent; update GraphQL query to include `streakDays` field |
| State management | Use Zustand store for `currentMonth`, `selectedWeek`, `selectedDay` |

---

## Component Audit Report

### 1. `types.ts` — Frontend History Types
| Issue | Fix |
|-------|-----|
| `status: string` on `ClassSession` — should use enum | Add `AttendanceStatus` enum to `@/shared/lib/enum.ts` (cross-layer accessible) |
| `performance: number` in types, `string` in store | Align to `number` (match GraphQL generated type) |
| No component prop interfaces defined here | Define all component prop interfaces here (keep as single source for this feature) |

### 2. `StudentHistoryContainer.tsx`
| Issue | Fix |
|-------|-----|
| Hardcoded `new Date(2026, 5, 18)` | Change to `new Date()` |
| No refetch on month change | Add `refetch()` call after `setCurrentMonth()` in store |
| No error notification | Add `useNotifications` from `@toolpad/core/useNotifications`; show error on query failure |
| Inline error with hardcoded color `error.main` | Replace inline error with `useNotifications`; show empty state or redirect |
| Doesn't use Zustand store | Wire to `useStudentHistoryStore` for month/week/day state |

### 3. `StudentHistoryView.tsx`
| Issue | Fix |
|-------|-----|
| In-file `StudentHistoryViewProps` interface | Move to `types.ts` |
| Month change: `onChangeMonth?: () => void` — no direction, no date | Replace with `onPrevMonth` and `onNextMonth` callbacks |

### 4. `StudentHistoryDesktop.tsx`
| Issue | Fix |
|-------|-----|
| ExportButton non-functional | Wire to `window.print()` |
| Single `onChangeMonth` button | Replace with prev/next month arrows (ChevronLeft/ChevronRight) with RTL flip |
| In-file `StudentHistoryDesktopProps` interface | Move to `types.ts` |
| `session.status as "present" \| "absent" \| "late"` — unsafe cast | Use `AttendanceStatus` enum |

### 5. `StudentHistoryMobile.tsx`
| Issue | Fix |
|-------|-----|
| PDF button non-functional | Wire to `window.print()` |
| Single month-change button | Replace with month name + prev/next chevrons + RTL flip |
| Active day logic: always picks first key | Use `selectedDay` from store |
| Active class list is single item | Filter `classes` by `selectedDay`, show all sessions for that day |
| In-file interfaces | Move to `types.ts` |

### 6. `CalendarGrid.tsx`
| Issue | Fix |
|-------|-----|
| `status={session.status as "present" \| "absent" \| "late"}` | Use `AttendanceStatus` enum |
| In-file `CalendarGridProps` interface | Move to `types.ts` |

### 7. `ClassSessionList.tsx`
| Issue | Fix |
|-------|-----|
| `session.status === "present"` / `"absent"` string comparisons | Use `AttendanceStatus` enum |
| In-file `ClassSessionListProps` | Move to `types.ts` |

### 8. `MobileWeeklyScroller.tsx`
| Issue | Fix |
|-------|-----|
| Hardcoded `days` array with static dates | Derive from `classes` prop using `currentMonth` + `selectedWeek` |
| `isSelected = d.date === 15` hardcoded | Use `selectedDay` from store |
| `onSelectWeek(selectedWeek)` — no change | Accept `onSelectDay: (day: number) => void`, wire click to day selection |
| `"active"`, `"none"` non-standard statuses | Use `AttendanceStatus` enum or derived boolean flags |
| In-file `MobileWeeklyScrollerProps` | Move to `types.ts` |

### 9. `PerformanceStreak.tsx`
| Issue | Fix |
|-------|-----|
| Hardcoded `streakData` array | Accept `streakDays: number[]` prop (array of 7 values, one per day of current week) |
| No data dependency | Derive `streakDays` from `sessions` in Container/View, pass down |

### 10. `studentHistoryStore.ts`
| Issue | Fix |
|-------|-----|
| Duplicate `ClassSession` + `StudentHistoryMetrics` | Remove; import from `@/frontend/views/dashboard/students/history/types` |
| `performance: string` | Change to `number` |
| `duration: string` | Change to `number` |
| `day: number` | Change to `dayOfMonth: number` |
| `status: "present" \| "absent" \| "late"` | Use `AttendanceStatus` enum from `@/shared/lib/enum` |
| Store not used by container | Wire container to store for `currentMonth`, `selectedWeek`, `selectedDay` |

### 11. `StudentHistoryContainer.stories.tsx`
| Issue | Fix |
|-------|-----|
| Duplicate mock types / mapping | Use `ClassSession` and `StudentHistoryMetrics` from `@/frontend/views/dashboard/students/history/types` |
| Mock data fields don't match new types | Update mock data: `duration` → number, `dayOfMonth` → number, `performance` → number, `status` → `AttendanceStatus` |

### 12. `page.tsx` — No changes needed (already clean)

---

## Execution Plan

### IMPORTANT: Import Restriction
Frontend files MUST NOT import from `@/backend/*`. Allowed import sources:
- `@/frontend/*` — components, stores, graphql generated types
- `@/shared/*` — cross-layer enums, i18n routing, utils, messages
- Package imports (`@mui/material`, `@apollo/client`, etc.)

All shared enums go to `@/shared/lib/enum.ts`. All view-local types stay in `frontend/views/dashboard/students/history/types.ts`.

### Phase 1: Type Consolidation & Enum Adoption

**1.1** Add `AttendanceStatus` enum to `shared/lib/enum.ts` (alongside existing `ClassOutcome`, `ClassExecutionState`, etc.):
```ts
export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
}
```

**1.2** Refactor `frontend/views/dashboard/students/history/types.ts`:
- Keep as the single source of truth for this feature's types (matches sibling `status/types.ts` pattern)
- Update `ClassSession` interface: `status: AttendanceStatus` (from `@/shared/lib/enum`), keep `dayOfMonth: number`, `duration: number`
- Update `StudentHistoryMetrics` interface: `performance: number` (align with GraphQL generated type)
- Add all component prop interfaces here: `StudentHistoryViewProps`, `StudentHistoryDesktopProps`, `StudentHistoryMobileProps`, `CalendarGridProps`, `ClassSessionListProps`, `MobileWeeklyScrollerProps`, `PerformanceStreakProps`
- Re-export `AttendanceStatus` from `@/shared/lib/enum` for convenience

**1.3** Refactor `frontend/stores/studentHistoryStore.ts`:
- Remove `ClassSession` and `StudentHistoryMetrics` interfaces (duplicate of types.ts)
- Import `ClassSession`, `StudentHistoryMetrics` from `@/frontend/views/dashboard/students/history/types`
- Import `AttendanceStatus` from `@/shared/lib/enum`
- Fix field names/types: `duration: number`, `dayOfMonth: number`, `performance: number`, `status: AttendanceStatus`
- Add `selectedDay: number | null` + `setSelectedDay` action
- Store becomes the source of truth for UI state

**1.4** Update all component imports to reference `types.ts` (which now uses `AttendanceStatus` from `@/shared/lib/enum`).

### Phase 2: Functional Actions & Navigation

**2.1** Fix `StudentHistoryContainer.tsx`:
- Import `useStudentHistoryStore` for `currentMonth`, `selectedWeek`, `selectedDay`
- Use `useQuery` with store-derived `year`/`month`
- Add `handlePrevMonth` and `handleNextMonth`:
  - Call `setCurrentMonth(new Date(...))`
  - Call `refetch({ studentId, year: newYear, month: newMonth })`
- Add `handlePrint` → `window.print()`
- Add `useNotifications` for error reporting
- Map `data?.studentClassHistory?.sessions` to `ClassSession`, mapping `status` string to `AttendanceStatus` enum

**2.2** Fix `StudentHistoryView.tsx`:
- Replace `onChangeMonth?: () => void` with `onPrevMonth: () => void` + `onNextMonth: () => void`
- Pass both to desktop and mobile

**2.3** Fix `StudentHistoryDesktop.tsx`:
- Replace single `PrimaryPageAction` with prev/next month chevron buttons
- Add `ChevronLeft` and `ChevronRight` icons with RTL flip: `sx={theme => ({ transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)" })`
- Show current month/year label between arrows
- Wire `ExportButton onClick` to `onPrint` callback
- Replace `onChangeMonth?: () => void` prop with `onPrevMonth` + `onNextMonth` + `onPrint`

**2.4** Fix `StudentHistoryMobile.tsx`:
- Replace single `HistoryMobileActions` month-change button with month label + prev/next chevrons (with RTL flip)
- Wire PDF button to `onPrint` callback
- Fix active day: use `selectedDay` from store instead of `Object.keys(classes).find(...)`
- Filter sessions by selected day: `classes[selectedDay]` → all sessions for that day
- Add `onSelectDay` prop for day selection from weekly scroller

**2.5** Fix `MobileWeeklyScroller.tsx`:
- Accept `classes` and `currentMonth` props to derive actual week data
- Compute 7 dates for the selected week from `currentMonth` + `selectedWeek`
- Map each date to session status from `classes` (using `AttendanceStatus` enum)
- Fix `isSelected` to use `selectedDay` from store
- Wire `onClick` to `onSelectDay(day)` callback
- Remove all hardcoded mock data

**2.6** Fix `PerformanceStreak.tsx`:
- Accept `streakDays: number[]` prop (7 values representing attendance intensity per day of the week)
- Derive `streakDays` in `StudentHistoryMobile` from sessions data (e.g., count of present sessions per day, or hours studied)
- Replace hardcoded `streakData` with prop-driven rendering
- Note: For full backend support, add `streakDays` to the GraphQL query in a future phase. For now, derive on the frontend from session data.

**2.7** Fix `CalendarGrid.tsx`:
- Replace `status as "present" | "absent" | "late"` with `AttendanceStatus` enum
- Update `StatusBadge` styled component to use `AttendanceStatus` enum values

**2.8** Fix `ClassSessionList.tsx`:
- Replace `session.status === "present"` / `"absent"` with `AttendanceStatus.PRESENT` / `AttendanceStatus.ABSENT`

### Phase 3: Notification System

**3.1** Add `useNotifications` to `StudentHistoryContainer.tsx`:
```ts
import { useNotifications } from "@toolpad/core/useNotifications";
const notifications = useNotifications();
```

**3.2** On query error: `notifications.show(t("errors.loadFailed"), { severity: "error", autoHideDuration: 4000 })`

**3.3** On `window.print()` call: No notification needed (browser handles it).

**3.4** Replace inline error Box with notification-only approach: show empty state or loading spinner, emit notification for error.

### Phase 4: Store Integration

**4.1** Wire `StudentHistoryContainer` to `useStudentHistoryStore`:
- `currentMonth` → from store
- `selectedWeek` → from store
- `selectedDay` → from store (new)
- `setCurrentMonth`, `setSelectedWeek`, `setSelectedDay` → from store

**4.2** Refetch logic: when `currentMonth` changes in store, container calls `refetch()` with new year/month.

**4.3** Update Storybook (`StudentHistoryContainer.stories.tsx`):
- Use `ClassSession` and `StudentHistoryMetrics` from `@/frontend/views/dashboard/students/history/types`
- Import `AttendanceStatus` from `@/shared/lib/enum`
- Fix mock data to match: `duration: 90`, `dayOfMonth: 2`, `performance: 85`, `status: AttendanceStatus.PRESENT`
- Remove mapping between store types and view types (they'll be the same now)

### Phase 5: Print Stylesheet

**5.1** Add `@media print` CSS rules (via MUI `sx` or global CSS):
- Hide navigation, sidebar, buttons
- Show calendar grid full-width
- Hide mobile-specific elements (since print ≈ desktop layout)
- Ensure calendar cells render with borders and no backgrounds

### Phase 6: Validation

**6.1** Run `bun tsgo` — type check
**6.2** Run `bun biome:check` — lint/format
**6.3** Run `bun lint` (via queue server) — ESLint
**6.4** Run `bun quality-gate` — full quality gate

---

## AttendanceStatus Enum Mapping

The backend repository maps `classInstances.executionState` to `status` in `SessionSummary`. Currently, the repo returns raw `executionState` values (`NOT_ACTIVATED`, `ACTIVATED`, `RUNNING`, `COMPLETED`). 

The frontend needs attendance semantics (`present`, `absent`, `late`). The mapping should happen in the **backend service** before returning to GraphQL:

| `classInstances.outcome` | `attendance` |
|---|---|
| `TAKEN` | `AttendanceStatus.PRESENT` |
| `ABSENT` | `AttendanceStatus.ABSENT` |
| `LEAVE` | `AttendanceStatus.LATE` |
| `PENDING` | Not shown (upcoming) |

**Decision:** Since the backend repo currently returns `executionState` not `outcome`, we need to update the repo to return `outcome` instead, or map at the service layer. Since this is **out of scope** (backend files), we'll:

1. Define `AttendanceStatus` enum in `shared/lib/enum.ts` (cross-layer accessible by frontend and backend)
2. Map the raw `status` string to `AttendanceStatus` on the **frontend** in the Container using a helper function (e.g., `mapStatusToAttendance(rawStatus: string): AttendanceStatus`)
3. File a note/TODO that the backend should eventually return `outcome` instead of `executionState`

This keeps frontend types correct while not touching backend out-of-scope files.

---

## PerformanceStreak Derivation

The `streakDays` prop will be an array of 7 numbers (0–48 px heights), derived in `StudentHistoryMobile` from sessions:
- For each day of the selected week, count sessions with `AttendanceStatus.PRESENT`
- Scale the bar height proportionally (0 sessions = 0, 1 session = 24, 2+ sessions = 48)
- Days with no scheduled classes get height 0

---

## File Change Summary

| File | Action |
|------|--------|
| `shared/lib/enum.ts` | **EDIT** — Add `AttendanceStatus` enum |
| `frontend/views/dashboard/students/history/types.ts` | **REWRITE** — Use `AttendanceStatus` enum, add all component prop interfaces, update `ClassSession` and `StudentHistoryMetrics` |
| `frontend/stores/studentHistoryStore.ts` | **REWRITE** — Use types from `types.ts`, add `selectedDay` |
| `frontend/views/dashboard/students/history/StudentHistoryContainer.tsx` | **REWRITE** — Store integration, refetch, notifications, month nav |
| `frontend/views/dashboard/students/history/StudentHistoryView.tsx` | **EDIT** — Prop changes for prev/next month, print |
| `frontend/views/dashboard/students/history/StudentHistoryContainer.stories.tsx` | **EDIT** — Align mock data with new types |
| `frontend/views/dashboard/students/history/components/StudentHistoryDesktop.tsx` | **REWRITE** — Month arrows, print, enum status |
| `frontend/views/dashboard/students/history/components/StudentHistoryMobile.tsx` | **REWRITE** — Month chevrons, print, day selection, streak props |
| `frontend/views/dashboard/students/history/components/CalendarGrid.tsx` | **EDIT** — Enum status |
| `frontend/views/dashboard/students/history/components/ClassSessionList.tsx` | **EDIT** — Enum status |
| `frontend/views/dashboard/students/history/components/MobileWeeklyScroller.tsx` | **REWRITE** — Real data, day selection |
| `frontend/views/dashboard/students/history/components/PerformanceStreak.tsx` | **REWRITE** — Accept `streakDays` prop |
