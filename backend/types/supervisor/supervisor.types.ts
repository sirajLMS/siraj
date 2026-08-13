import type { TeacherPendingDuesSummaryReturnType } from "@/backend/types";

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
  monthlySnapshot: SupervisorMonthlySnapshotReturnType;
}
