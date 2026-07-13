"use client";

import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";
import type { SupervisorDashboardLabels } from "@/shared/messages/types/dashboard/supervisorPortal/supervisorDashboard";

export type { SupervisorDashboardViewModel };

export interface UseSupervisorDashboardViewModelProps {
  readonly userName: string | null;
  readonly pendingReviewCount: number;
  readonly pendingDuesSummary: {
    readonly totalCount: number;
    readonly totalAmount: number;
    readonly currency: string;
  };
  readonly monthlySnapshot: {
    readonly year: number;
    readonly month: number;
    readonly label: string;
  };
  readonly recentApprovals: readonly {
    readonly id: string;
    readonly lessonDate: string;
    readonly studentId: string;
    readonly teacherId: string;
    readonly reviewedAt: string;
  }[];
  readonly labels: SupervisorDashboardLabels;
  readonly loading: boolean;
  readonly onGoToReviews: () => void;
  readonly onGoToDues: () => void;
  readonly onGoToMonthlyReports: () => void;
  readonly onViewRecentApproval: (id: string) => void;
}

export function useSupervisorDashboardViewModel(
  props: Readonly<UseSupervisorDashboardViewModelProps>
): SupervisorDashboardViewModel {
  return {
    userName: props.userName,
    pendingReviewCount: props.pendingReviewCount,
    pendingDuesSummary: props.pendingDuesSummary,
    monthlySnapshot: props.monthlySnapshot,
    recentApprovals: props.recentApprovals,
    labels: props.labels,
    loading: props.loading,
    onGoToReviews: props.onGoToReviews,
    onGoToDues: props.onGoToDues,
    onGoToMonthlyReports: props.onGoToMonthlyReports,
    onViewRecentApproval: props.onViewRecentApproval,
  };
}
