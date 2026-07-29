import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";

export interface ScheduleOverviewShellLabels {
  readonly title: string;
  readonly emptyMessage: string;
}

export interface ScheduleOverviewFilterLabels {
  readonly searchPlaceholder: string;
  readonly dateLabel: string;
  readonly teacherPlaceholder: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
}

export interface ScheduleOverviewActionLabels {
  readonly detailsLabel: string;
}

export interface ScheduleOverviewLabelsBySection {
  readonly shell: ScheduleOverviewShellLabels;
  readonly filters: ScheduleOverviewFilterLabels;
  readonly columns: ScheduleOverviewDataHeaders;
  readonly status: ScheduleOverviewDataStatusLabels;
  readonly actions: ScheduleOverviewActionLabels;
}
