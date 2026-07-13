import type { SupervisorDashboardLabels } from "@/shared/messages/types/dashboard/supervisorPortal/supervisorDashboard";

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
  readonly teacherId: string;
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

export type UseSupervisorDashboardViewModelProps = SupervisorDashboardViewModel;
