import type { SupervisorDashboardLabels } from "@/shared/locale";

export interface PendingDuesSummary {
  readonly totalCount: number;
  readonly totalAmount: number;
  readonly currency: string;
}

export interface MonthlySnapshot {
  readonly year: number;
  readonly month: number;
  readonly label: string;
}

export interface RecentApproval {
  readonly id: string;
  readonly lessonDate: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly teacherId: string;
  readonly teacherName: string;
  readonly reviewedAt: string;
}

export interface SupervisorDashboardViewModel {
  readonly userName: string | null;
  readonly pendingReviewCount: number;
  readonly pendingDuesSummary: PendingDuesSummary;
  readonly monthlySnapshot: MonthlySnapshot;
  readonly recentApprovals: readonly RecentApproval[];
  readonly labels: SupervisorDashboardLabels;
  readonly loading: boolean;
  readonly onGoToReviews: () => void;
  readonly onGoToDues: () => void;
  readonly onGoToMonthlyReports: () => void;
  readonly onViewRecentApproval: (id: string) => void;
}

export type UseSupervisorDashboardViewModelProps = Record<string, never>;
