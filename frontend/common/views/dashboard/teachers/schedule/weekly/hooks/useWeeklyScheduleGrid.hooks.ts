// NEW FOR PLAN v5 (newly created for the migration wave): Pure-data helpers +
// constants + a small per-item delete-confirmation hook lifted out of the
// byte-identical inline declarations in BOTH tier files
// `mobileScheduleList.mobile.tsx` + `weeklyScheduleGrid.desktop.tsx` per
// specs.md §3 N7 (state), N9 (pure-data helpers), N25 (`function useX`
// declarations in tier), and §5 (custom hooks live in `.../hooks/`).
//
// Both tier files previously declared byte-identical copies of:
//   - `isTerminalClassInstance` (pure-data helper)
//   - `DAYS` (7-entry weekday constant)
//   - `TIMES` (9-entry time-slot constant)
//   - per-item `useState<boolean>(false)` for the delete-confirmation dialog
// Both tier files now import this single shared implementation.

import { useCallback as _useCallback, useState } from "react";
import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";

// NEW FOR PLAN v5: isTerminalClassInstance — lifts the previously inline
// pure-data helper out of the tier files. Per specs.md §3 N9.
export function isTerminalClassInstance(
  executionState?: ClassExecutionState | null,
  outcome?: ClassOutcome | null
): boolean {
  return (
    executionState === ClassExecutionState.Completed ||
    outcome === ClassOutcome.Taken ||
    outcome === ClassOutcome.Absent ||
    outcome === ClassOutcome.Leave
  );
}

// NEW FOR PLAN v5: WEEKLY_SCHEDULE_DAYS — the previously inline 7-entry
// `DAYS` constant lifted out of both tier files per specs.md §3 N5.
export const WEEKLY_SCHEDULE_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

// NEW FOR PLAN v5: WEEKLY_SCHEDULE_TIMES — the previously inline 9-entry
// `TIMES` constant lifted out of both tier files per specs.md §3 N5.
export const WEEKLY_SCHEDULE_TIMES = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
] as const;

// NEW FOR PLAN v5: useDeleteConfirmDialog — lifts the previously inline per-
// item `useState<boolean>(false)` delete-confirmation dialog state out of
// the tier files. The hook body lives here (common), so the tier files do
// not themselves call `useState` (per specs.md §3 N7).
export function useDeleteConfirmDialog(): {
  readonly open: boolean;
  readonly openDialog: () => void;
  readonly closeDialog: () => void;
} {
  const [open, setOpen] = useState(false);
  const openDialog = _useCallback(() => setOpen(true), []);
  const closeDialog = _useCallback(() => setOpen(false), []);
  return { open, openDialog, closeDialog };
}

// NEW FOR PLAN v5: useSelectedDayFilter — lifts the previously inline
// `useState<string>("monday")` selected-day filter state out of the mobile
// tier file `mobileScheduleList.mobile.tsx` per specs.md §3 N7.
export function useSelectedDayFilter(initialDay = "monday"): {
  readonly selectedDay: string;
  readonly setSelectedDay: (day: string) => void;
} {
  const [selectedDay, setSelectedDay] = useState<string>(initialDay);
  return { selectedDay, setSelectedDay };
}
