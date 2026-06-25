import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/dashboard/types/schedule";

export type DailyScheduleMetricFilterKey =
  | "total"
  | "regular"
  | "trial"
  | "advance"
  | "rescheduled"
  | "suspended"
  | "taken"
  | "pending"
  | "activated"
  | "running"
  | "absent"
  | "leave";

export function resolveDailyScheduleMetricFilter(selectedStatus: string | null | undefined): string | null {
  if (!selectedStatus || selectedStatus === "total") {
    return null;
  }
  return selectedStatus;
}

/**
 * Client-side metric filter for Storybook mocks and tests.
 * Mirrors backend outcome/executionState rules from scheduling-queries.repository.ts.
 * Class-type metrics (regular, trial, advance, rescheduled, suspended) require server filtering.
 */
export function matchesDailyScheduleMetricFilter(
  row: DailyScheduleRow,
  metricFilter: string | null | undefined
): boolean {
  if (!metricFilter || metricFilter === "total") {
    return true;
  }

  switch (metricFilter as DailyScheduleMetricFilterKey) {
    case "taken":
      return row.outcome === ClassOutcome.Taken;
    case "pending":
      return row.outcome === ClassOutcome.Pending;
    case "absent":
      return row.outcome === ClassOutcome.Absent;
    case "leave":
      return row.outcome === ClassOutcome.Leave;
    case "activated":
      return row.executionState === ClassExecutionState.Activated;
    case "running":
      return (
        row.executionState === ClassExecutionState.Running ||
        row.executionState === ClassExecutionState.Activated
      );
    default:
      return true;
  }
}
