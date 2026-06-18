import type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
  TeacherSessionStatus,
} from "@/frontend/views/dashboard/types/dashboard";

export type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
  TeacherSessionStatus,
};

export interface TeacherDashboardState {
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly missedAlert: MissedClassAlert | null;
  readonly scheduleDateLabel: string;
  readonly totalScheduledToday: number;
}
