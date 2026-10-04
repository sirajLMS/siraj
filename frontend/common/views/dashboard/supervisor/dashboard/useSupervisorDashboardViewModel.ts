"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { supervisorDashboardQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { recentApprovedLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useSupervisorDashboardRecentApprovalsStore } from "@/frontend/common/stores/supervisorDashboardRecentApprovalsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildPendingDuesSummary,
  buildRecentApprovalsPaginationArgs,
  createSupervisorDashboardNavigation,
  mapRecentApprovals,
  resolveMonthlySnapshot,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/supervisorDashboardData.helpers";
import type {
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

  const paginationArgs = useMemo(() => buildRecentApprovalsPaginationArgs(page, pageSize), [page, pageSize]);

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
    () => buildPendingDuesSummary(dashboard?.pendingDuesSummary),
    [dashboard?.pendingDuesSummary]
  );

  const monthlySnapshot = useMemo(
    () => resolveMonthlySnapshot(dashboard?.monthlySnapshot),
    [dashboard?.monthlySnapshot]
  );

  const recentApprovals = useMemo(
    () => mapRecentApprovals(recentApprovalsData?.recentApprovedLessonReports?.rows, locale),
    [recentApprovalsData?.recentApprovedLessonReports?.rows, locale]
  );

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
    ...createSupervisorDashboardNavigation(router),
  };
}
