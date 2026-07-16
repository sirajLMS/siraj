"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import {
  lessonReportCountQueryDocument,
  pendingLessonReportsQueryDocument,
  teacherPendingDuesSummaryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { SupervisorDashboardView } from "@/frontend/common/views/dashboard/supervisor/dashboard/supervisorDashboardView";
import type { RecentApproval } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";
import { useRouter } from "@/shared/i18n/routing";
import type { SupervisorDashboardLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function useCurrentMonth(): { year: number; month: number; label: string } {
  return useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return { year, month, label: `${MONTH_NAMES[month - 1]} ${year}` };
  }, []);
}

function useLabels(t: SupervisorDashboardLabels) {
  return useMemo(() => t, [t]);
}

export function SupervisorDashboardContainer() {
  const t = useAppTranslation().dashboardTranslations.supervisorPortalDashboard;
  const router = useRouter();
  const userName = useUserStore(state => state.name);

  const monthlySnapshot = useCurrentMonth();

  const { data: countData, loading: countLoading } = useQuery(lessonReportCountQueryDocument, {
    variables: { teacherId: null, studentId: null },
    fetchPolicy: "cache-and-network",
  });

  const { data: recentData, loading: recentLoading } = useQuery(pendingLessonReportsQueryDocument, {
    variables: {
      teacherId: null,
      studentId: null,
      paginationArgs: { first: 5, page: 1, after: null, before: null, last: null, maxCount: null, skip: null },
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: duesSummaryData, loading: duesLoading } = useQuery(teacherPendingDuesSummaryQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const loading = countLoading || recentLoading || duesLoading;

  const pendingReviewCount = useMemo(() => countData?.lessonReportCount?.pendingCount ?? 0, [countData]);

  const pendingDuesSummary = useMemo(
    () => ({
      totalCount: duesSummaryData?.teacherPendingDuesSummary?.totalCount ?? 0,
      totalAmount: Number(duesSummaryData?.teacherPendingDuesSummary?.totalAmount ?? 0),
      currency: duesSummaryData?.teacherPendingDuesSummary?.currency ?? "USD",
    }),
    [duesSummaryData]
  );

  const recentApprovals: RecentApproval[] = useMemo(() => {
    const rows = recentData?.pendingLessonReports ?? [];
    return rows
      .filter(r => r?.status === "APPROVED")
      .map(r => ({
        id: r?.id ?? "",
        lessonDate: r?.lessonDate ?? "",
        studentId: r?.studentId ?? "",
        teacherId: r?.teacherId ?? "",
        reviewedAt: r?.reviewedAt ?? "",
      }))
      .slice(0, 5);
  }, [recentData]);

  const labels = useLabels(t);

  const handlers = useMemo(
    () => ({
      handleGoToReviews: () => {
        router.push("/lesson-reports");
      },
      handleGoToDues: () => {
        router.push("/supervisor/teacher-dues");
      },
      handleGoToMonthlyReports: () => {
        router.push("/supervisor/monthly-reports");
      },
      handleViewRecentApproval: (id: string) => {
        if (!id) {
          logger.warn("handleViewRecentApproval called with empty id");
          return;
        }
        router.push(`/lesson-reports/${id}`);
      },
    }),
    [router]
  );

  return (
    <SupervisorDashboardView
      userName={userName}
      pendingReviewCount={pendingReviewCount}
      pendingDuesSummary={pendingDuesSummary}
      monthlySnapshot={monthlySnapshot}
      recentApprovals={recentApprovals}
      labels={labels}
      loading={loading}
      onGoToReviews={handlers.handleGoToReviews}
      onGoToDues={handlers.handleGoToDues}
      onGoToMonthlyReports={handlers.handleGoToMonthlyReports}
      onViewRecentApproval={handlers.handleViewRecentApproval}
    />
  );
}
