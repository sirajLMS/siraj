import type { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SupervisorDashboardLabels } from "@/shared/locale";

interface PendingDuesSummary {
  readonly totalCount: number;
  readonly totalAmount: number;
  readonly currency: string;
}

interface MonthlySnapshot {
  readonly year: number;
  readonly month: number;
  readonly label: string;
}

export interface RecentApproval {
  readonly id: string;
  readonly classInstanceId: string;
  readonly subjectName: string;
  readonly classAvatarUrl: string | null;
  readonly lessonDate: string;
  readonly lessonDateRaw: string | null;
  readonly durationMinutes: number | null;
  readonly completionPercentage: number | null;
  readonly status: LessonReportStatus | null;
  readonly studentId: string;
  readonly studentName: string;
  readonly studentAvatarUrl: string | null;
  readonly studentUserId: string | null;
  readonly teacherId: string;
  readonly teacherName: string;
  readonly teacherAvatarUrl: string | null;
  readonly teacherUserId: string | null;
  readonly reviewedAt: string;
  readonly reviewedAtRaw: string | null;
}

export interface RecentApprovalsPagination {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

export interface SupervisorDashboardViewModel {
  readonly userName: string | null;
  readonly pendingReviewCount: number;
  readonly pendingDuesSummary: PendingDuesSummary;
  readonly monthlySnapshot: MonthlySnapshot;
  readonly recentApprovals: readonly RecentApproval[];
  readonly recentApprovalsPagination: RecentApprovalsPagination;
  readonly labels: SupervisorDashboardLabels;
  readonly loading: boolean;
  readonly recentApprovalsLoading: boolean;
  readonly onGoToReviews: () => void;
  readonly onGoToDues: () => void;
  readonly onGoToMonthlyReports: () => void;
  readonly onViewRecentApproval: (id: string) => void;
}

export type UseSupervisorDashboardViewModelProps = Record<string, never>;
