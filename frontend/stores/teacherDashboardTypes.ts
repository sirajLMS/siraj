export type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherDashboardMetrics,
  TeacherScheduleRow,
  TeacherSessionStatus,
} from "@/frontend/types/shared.types";

import type { MissedClassAlert, TeacherDashboardMetrics, TeacherScheduleRow } from "@/frontend/types/shared.types";

export interface TeacherDashboardState {
  readonly metrics: TeacherDashboardMetrics;
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly missedAlert: MissedClassAlert | null;
  readonly scheduleDateLabel: string;
  readonly totalScheduledToday: number;
}
