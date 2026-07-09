import type { DailyScheduleRow } from "@/frontend/views/dashboard/admin/home/types/schedule";
import { matchesDashboardMetricFilter } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export type { DailyScheduleMetricFilterKey } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export function resolveDailyScheduleMetricFilter(selectedStatus: string | null | undefined): string | null {
  if (!selectedStatus || selectedStatus === "total") {
    return null;
  }
  return selectedStatus;
}

/** Storybook mock helper — mirrors server metric filter rules. */
export function matchesDailyScheduleMetricFilter(
  row: DailyScheduleRow,
  metricFilter: string | null | undefined
): boolean {
  return matchesDashboardMetricFilter(row, metricFilter);
}
