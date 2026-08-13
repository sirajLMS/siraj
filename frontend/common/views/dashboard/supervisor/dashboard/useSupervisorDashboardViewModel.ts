"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { formatDate, formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import { supervisorDashboardQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { recentApprovedLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useSupervisorDashboardRecentApprovalsStore } from "@/frontend/common/stores/supervisorDashboardRecentApprovalsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  RecentApproval,
  RecentApprovalsPagination,
  SupervisorDashboardViewModel,
  UseSupervisorDashboardViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { SupervisorDashboardViewModel, UseSupervisorDashboardViewModelProps };

export function useSupervisorDashboardViewModel(
  _props: Readonly<UseSupervisorDashboardViewModelProps> = {}
): SupervisorDashboardViewModel {
  const t = useAppTranslation(Translation.Dashboard.SupervisorPortalDashboard);
  const locale = useAppLocale();
  const router = useRouter();
  const userName = useUserStore(state => state.name);

  const page = useSupervisorDashboardRecentApprovalsStore(state => state.page);
  const pageSize = useSupervisorDashboardRecentApprovalsStore(state => state.pageSize);
  const setPage = useSupervisorDashboardRecentApprovalsStore(state => state.setPage);

  const paginationArgs = useMemo(
    () => ({
      page: page + 1,
      first: pageSize,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    }),
    [page, pageSize]
  );

  const { data, loading } = useQuery(supervisorDashboardQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const { data: recentApprovalsData, loading: recentApprovalsLoading } = useQuery(
    recentApprovedLessonReportsQueryDocument,
    {
      variables: { paginationArgs },
      fetchPolicy: "cache-and-network",
    }
  );

  const dashboard = data?.supervisorDashboard;

  const pendingReviewCount = dashboard?.pendingReviewCount ?? 0;

  const pendingDuesSummary = useMemo(
    () => ({
      totalCount: dashboard?.pendingDuesSummary?.totalCount ?? 0,
      totalAmount: dashboard?.pendingDuesSummary?.totalAmount ?? 0,
      currency: dashboard?.pendingDuesSummary?.currency ?? "USD",
    }),
    [dashboard?.pendingDuesSummary]
  );

  const monthlySnapshot = useMemo(() => {
    const snapshot = dashboard?.monthlySnapshot;
    if (snapshot?.year != null && snapshot.month != null && snapshot.label) {
      return { year: snapshot.year, month: snapshot.month, label: snapshot.label };
    }
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      label: snapshot?.label ?? "",
    };
  }, [dashboard?.monthlySnapshot]);

  const recentApprovals: RecentApproval[] = useMemo(() => {
    const rows = recentApprovalsData?.recentApprovedLessonReports?.rows ?? [];
    return rows.map(r => ({
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
  }, [recentApprovalsData?.recentApprovedLessonReports?.rows, locale]);

  const totalCount = recentApprovalsData?.recentApprovedLessonReports?.totalCount ?? 0;

  const recentApprovalsPagination = useMemo<RecentApprovalsPagination>(
    () => ({
      page,
      pageSize,
      totalCount,
      onPageChange: setPage,
    }),
    [page, pageSize, totalCount, setPage]
  );

  return {
    userName: dashboard?.supervisorName ?? userName,
    pendingReviewCount,
    pendingDuesSummary,
    monthlySnapshot,
    recentApprovals,
    recentApprovalsPagination,
    labels: t,
    loading,
    recentApprovalsLoading,
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
