import type { AcademicClassRow, ScheduleAlertsLabels } from "@/frontend/common/views/dashboard/schedule/alerts/types";

/** Shared props for the schedule alerts body — used by both desktop and mobile views. */
export interface ScheduleAlertsViewCommonProps<TLabels> {
  readonly loading: boolean | undefined;
  readonly labels: ScheduleAlertsLabels;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly contentLabels: TLabels;
}
