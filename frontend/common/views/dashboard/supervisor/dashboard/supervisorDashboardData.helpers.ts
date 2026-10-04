import { formatDate, formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import type {
  RecentApprovedLessonReportsQuery_recentApprovedLessonReports_rows,
  SupervisorDashboardQuery_supervisorDashboard_monthlySnapshot,
  SupervisorDashboardQuery_supervisorDashboard_pendingDuesSummary,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type { RecentApproval } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";
import type { useRouter } from "@/shared/i18n/navigation";

export function buildRecentApprovalsPaginationArgs(page: number, pageSize: number) {
  return {
    page: page + 1,
    first: pageSize,
    skip: null,
    after: null,
    before: null,
    last: null,
    maxCount: null,
  };
}

export function buildPendingDuesSummary(
  summary: SupervisorDashboardQuery_supervisorDashboard_pendingDuesSummary | null | undefined
) {
  return {
    totalCount: summary?.totalCount ?? 0,
    totalAmount: summary?.totalAmount ?? 0,
    currency: summary?.currency ?? "USD",
  };
}

export function resolveMonthlySnapshot(
  snapshot: SupervisorDashboardQuery_supervisorDashboard_monthlySnapshot | null | undefined
) {
  if (snapshot?.year != null && snapshot.month != null && snapshot.label) {
    return { year: snapshot.year, month: snapshot.month, label: snapshot.label };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    label: snapshot?.label ?? "",
  };
}

export function mapRecentApprovals(
  rows: RecentApprovedLessonReportsQuery_recentApprovedLessonReports_rows[] | null | undefined,
  locale: string
): RecentApproval[] {
  return (rows ?? []).map(r => ({
    id: r?.id ?? "",
    classInstanceId: r?.classInstanceId ?? "",
    subjectName: r?.subjectName?.trim() ?? "",
    classAvatarUrl: r?.classAvatarUrl ?? null,
    lessonDate: r?.lessonDate ? formatDate(r.lessonDate, locale) : "",
    lessonDateRaw: r?.lessonDate ?? null,
    durationMinutes: r?.durationMinutes ?? null,
    completionPercentage: r?.completionPercentage ?? null,
    status: r?.status ?? null,
    studentId: r?.studentId ?? "",
    studentName: r?.studentName?.trim() ?? "",
    studentAvatarUrl: r?.studentAvatarUrl ?? null,
    studentUserId: r?.studentUserId ?? null,
    teacherId: r?.teacherId ?? "",
    teacherName: r?.teacherName?.trim() ?? "",
    teacherAvatarUrl: r?.teacherAvatarUrl ?? null,
    teacherUserId: r?.teacherUserId ?? null,
    reviewedAt: r?.reviewedAt ? formatDateTime(r.reviewedAt, locale) : "",
    reviewedAtRaw: r?.reviewedAt ?? null,
  }));
}

export function createSupervisorDashboardNavigation(router: ReturnType<typeof useRouter>) {
  return {
    onGoToReviews: () => {
      router.push("/lesson-reports");
    },
    onGoToDues: () => {
      router.push("/teacher-dues");
    },
    onGoToMonthlyReports: () => {
      router.push("/monthly-reports");
    },
    onViewRecentApproval: (id: string) => {
      if (!id) {
        logger.warn("onViewRecentApproval called with empty id");
        return;
      }
      router.push(`/lesson-reports/${id}`);
    },
  };
}
