# Plan: Add Date Picker & Day Navigation to Teacher Dashboard

## Goal
Replace the hardcoded `todayDateStr` in `TeacherDashboardContainer` with a controllable date via:
1. `AppDatePicker` for date selection
2. Previous/next day buttons (< / >)
3. "Today" button to jump back to current day
4. A single query driven by the `filterDate` from `useTeacherDashboardStore`

This mirrors the pattern used in `AdminDashboardContainer` (single query from store date) and `ScheduleFilters` (date picker + nav buttons + today button).

---

## Changes

### 1. `TeacherDashboardContainer.tsx` — Main orchestrator

**Replace** the local `getTodayString()` + hardcoded `todayDateStr` with `useTeacherDashboardStore`:

```tsx
// REMOVE: const todayDateStr = getTodayString();
// REMOVE: const getTodayString = () => { ... };

// ADD: import store
import { useTeacherDashboardStore } from "@/frontend/stores/teacherDashboardStore";

// Inside component:
const { filterDate, setFilterDate } = useTeacherDashboardStore();
```

**Wire both queries** to `filterDate` instead of `todayDateStr`:

```tsx
const { data: standardData, refetch: refetchStandard } = useQuery(teacherDashboardQueryDocument, {
  variables: { date: filterDate },
  skip: mode !== "standard",
});

const { data: activeData, refetch: refetchActive } = useQuery(teacherActiveDashboardQueryDocument, {
  variables: { date: filterDate },
  skip: mode !== "active",
});
```

**Add date navigation handler**:

```tsx
import {
  getTodayScheduleFilterDate,
  isScheduleFilterDateToday,
  shiftScheduleFilterDate,
} from "@/frontend/views/dashboard/dashboard/utils/scheduleFilterDate";

const handleDateChange = (date: string) => {
  setFilterDate(date);
};
```

**Add i18n labels** for date filter controls:

```tsx
const tSchedule = useTranslations("dashboard.admin"); // Reuse admin date labels
// OR add teacher-specific keys — see i18n section below
```

**Pass date props down** to view components (see step 2).

### 2. `TeacherDashboardView.tsx` — Standard mode view

Add props for date controls:

```tsx
// New props:
readonly dateValue: string;
readonly todayLabel: string;
readonly previousDayLabel: string;
readonly nextDayLabel: string;
readonly onDateChange: (date: string) => void;
```

Render a `TeacherDateControls` component (new, see step 3) between the `PageHeader` and the `TeacherDashboardMetricsRow` on desktop, and between mobile title and metrics on mobile. Placement matches how `ScheduleFilters` sits above the schedule section in admin dashboard.

### 3. `TeacherDashboardActiveView.tsx` — Active mode view

Add the same date control props. Render `TeacherDateControls` between the `PageHeader` and `TeacherActiveMetricsRow` on desktop, and between the welcome section and metrics on mobile.

### 4. New component: `TeacherDateControls.tsx`

Create `frontend/views/dashboard/teachers/dashboard/components/TeacherDateControls.tsx`.

This is a simplified version of `ScheduleFilters` — just the date controls row (no teacher autocomplete, no submit button):

```tsx
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { format, isValid } from "date-fns";
import { AppDatePicker } from "@/frontend/components/ui/form/AppDatePicker";
import { rtlFlipIconSx } from "@/frontend/utils/rtlFlipIconSx";
import {
  getTodayScheduleFilterDate,
  isScheduleFilterDateToday,
  parseScheduleFilterDate,
  shiftScheduleFilterDate,
} from "@/frontend/views/dashboard/dashboard/utils/scheduleFilterDate";

// Reuse the same styled components from ScheduleFilters:
// - StyledDateControls (flex row, aligned bottom, gap 1)
// - StyledDateNavButton (icon button with border)

interface TeacherDateControlsProps {
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel?: string;
  readonly onDateChange: (date: string) => void;
}
```

Layout (same as `ScheduleFilters` date row):
- `[<] [DatePicker] [>] [Today]`

### 5. `TeacherDashboardLabels` — Add date filter labels

Add a `dateFilter` section to the type in `shared/messages/types/dashboard/teachers/dashboard.ts`:

```ts
readonly dateFilter: {
  readonly today: string;
  readonly previousDay: string;
  readonly nextDay: string;
  readonly dateLabel: string;
};
```

Add i18n keys (under `dashboard.teacherDashboard.dateFilter.*`) and build them in `buildTeacherDashboardLabels.ts`.

### 6. i18n translation files

Add keys to both `en.json` and `ar.json` under `dashboard.teacherDashboard.dateFilter`:

```json
"dateFilter": {
  "today": "Today",
  "previousDay": "Previous day",
  "nextDay": "Next day",
  "dateLabel": "Date"
}
```

### 7. Remove dead code

- Delete the local `getTodayString()` function from `TeacherDashboardContainer.tsx` (lines 34-40)
- The same function exists in `teacherDashboardStore.ts` already

### 8. Update wrapper components

- `StandardDashboardWrapper` — receive and forward date props to `TeacherDashboardView`
- `ActiveDashboardWrapper` — receive and forward date props to `TeacherDashboardActiveView`
- Both also replace `todayDateStr` with `filterDate` for the `scheduleDateLabel` / `welcomeDateSummary` props

---

## Summary of files to modify

| File | Changes |
|------|---------|
| `TeacherDashboardContainer.tsx` | Use `useTeacherDashboardStore.filterDate`, add `handleDateChange`, remove `getTodayString`, pass date props to wrappers |
| `TeacherDashboardView.tsx` | Add date control props, render `TeacherDateControls` |
| `TeacherDashboardActiveView.tsx` | Add date control props, render `TeacherDateControls` |
| **NEW** `TeacherDateControls.tsx` | Date picker + prev/next/today buttons |
| `shared/messages/types/dashboard/teachers/dashboard.ts` | Add `dateFilter` to `TeacherDashboardLabels` |
| `buildTeacherDashboardLabels.ts` | Build `dateFilter` labels |
| i18n `en.json` + `ar.json` | Add `dateFilter.*` keys |

---

## Pattern adherence

- **Single source of truth**: `useTeacherDashboardStore.filterDate` controls both queries (like `AdminDashboardContainer` uses `useDashboardStore.filters.date`)
- **Reusable utils**: `shiftScheduleFilterDate`, `isScheduleFilterDateToday`, `getTodayScheduleFilterDate` from existing `scheduleFilterDate.ts`
- **Component patterns**: Uses `AppDatePicker` (per COMPONENT_PATTERNS.md), styled identically to `ScheduleFilters` date row
- **No new external dependencies**: Everything uses existing MUI components, date-fns, and shared utilities
- **i18n**: All labels via `next-intl`, no hardcoded strings
