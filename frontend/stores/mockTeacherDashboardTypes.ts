export type {
  StudentProgressFeedItem,
  TeacherSessionStatus,
} from "@/frontend/views/dashboard/types/dashboard";

import type {
  MissedClassAlert,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
} from "@/frontend/views/dashboard/types/dashboard";

export type { MissedClassAlert, TeacherDashboardMetrics, TeacherScheduleRow };

export interface TeacherDashboardState {
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly missedAlert: MissedClassAlert | null;
  readonly scheduleDateLabel: string;
  readonly totalScheduledToday: number;
}
