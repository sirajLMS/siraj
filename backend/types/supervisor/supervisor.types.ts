import type { LessonReportReturnType } from "@/backend/types/classes/lesson-report.types";
import type { TeacherPendingDuesSummaryReturnType } from "@/backend/types/teachers/teacher-due.types";

export interface SupervisorMonthlySnapshotReturnType {
  year: number;
  /** 1-indexed calendar month (1 = January … 12 = December). */
  month: number;
  label: string;
}

export interface SupervisorDashboardReturnType {
  supervisorName: string;
  pendingReviewCount: number;
  pendingDuesSummary: TeacherPendingDuesSummaryReturnType;
  recentApprovals: LessonReportReturnType[];
  monthlySnapshot: SupervisorMonthlySnapshotReturnType;
}
