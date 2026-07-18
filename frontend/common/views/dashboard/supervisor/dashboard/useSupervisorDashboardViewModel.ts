"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { supervisorDashboardQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  RecentApproval,
  SupervisorDashboardViewModel,
  UseSupervisorDashboardViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

export type { SupervisorDashboardViewModel, UseSupervisorDashboardViewModelProps };

export function useSupervisorDashboardViewModel(
  _props: Readonly<UseSupervisorDashboardViewModelProps> = {}
): SupervisorDashboardViewModel {
  const t = useAppTranslation().dashboardTranslations.supervisorPortalDashboard;
  const router = useRouter();
  const userName = useUserStore(state => state.name);

  const { data, loading } = useQuery(supervisorDashboardQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const dashboard = data?.supervisorDashboard;

  const pendingReviewCount = dashboard?.pendingReviewCount ?? 0;

  const pendingDuesSummary = useMemo(
    () => ({
      totalCount: dashboard?.pendingDuesSummary?.totalCount ?? 0,
      totalAmount: Number(dashboard?.pendingDuesSummary?.totalAmount ?? 0),
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
    const rows = dashboard?.recentApprovals ?? [];
    return rows.map(r => ({
      id: r?.id ?? "",
      lessonDate: r?.lessonDate ?? "",
      studentId: r?.studentId ?? "",
      studentName: r?.studentName ?? "",
      teacherId: r?.teacherId ?? "",
      teacherName: r?.teacherName ?? "",
      reviewedAt: r?.reviewedAt ?? "",
    }));
  }, [dashboard?.recentApprovals]);

  return {
    userName: dashboard?.supervisorName ?? userName,
    pendingReviewCount,
    pendingDuesSummary,
    monthlySnapshot,
    recentApprovals,
    labels: t,
    loading,
    onGoToReviews: () => {
      router.push("/lesson-reports");
    },
    onGoToDues: () => {
      router.push("/supervisor/teacher-dues");
    },
    onGoToMonthlyReports: () => {
      router.push("/supervisor/monthly-reports");
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
