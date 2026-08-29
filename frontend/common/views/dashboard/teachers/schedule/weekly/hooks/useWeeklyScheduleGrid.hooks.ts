// NEW FOR PLAN v5 (newly created for the migration wave): Pure-data helpers +
// constants lifted out of the byte-identical inline declarations in BOTH tier
// files `mobileScheduleList.mobile.tsx` + `weeklyScheduleGrid.desktop.tsx` per
// specs.md §3 N9 (pure-data helpers) and N5 (constants).
//
// Both tier files previously declared byte-identical copies of:
//   - `isTerminalClassInstance` (pure-data helper)
//   - `DAYS` (7-entry weekday constant)
//   - `TIMES` (9-entry time-slot constant)
// Both tier files now import this single shared implementation.
//
// Note: dialog open state and the selected-day filter are NOT hook state —
// they live in `useWeeklyScheduleStore` (`frontend/common/stores/`) so they
// survive viewport tier switches per specs.md §3 N7.

import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";

export type WeeklyScheduleSlotStatusLabels = TeacherWeeklyScheduleLabels["grid"]["status"];

export function resolveWeeklyScheduleSlotStatus(
  classItem: {
    readonly executionState?: ClassExecutionState | null;
    readonly outcome?: ClassOutcome | null;
    readonly isFrozen?: boolean | null;
  },
  labels: WeeklyScheduleSlotStatusLabels
): string {
  if (classItem.isFrozen) {
    return labels.frozen;
  }

  const { executionState, outcome } = classItem;

  if (outcome === ClassOutcome.Absent) {
    return labels.absent;
  }
  if (outcome === ClassOutcome.Leave) {
    return labels.leave;
  }
  if (executionState === ClassExecutionState.Completed || outcome === ClassOutcome.Taken) {
    return labels.ended;
  }
  if (executionState === ClassExecutionState.Running) {
    return labels.running;
  }
  if (executionState === ClassExecutionState.Activated) {
    return labels.activated;
  }

  return labels.pending;
}

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
