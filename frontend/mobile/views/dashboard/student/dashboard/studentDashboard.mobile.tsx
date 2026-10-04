"use client";

import { HistoryOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import {
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import {
  StudentDashboardLoadingState,
  StudentDashboardNextClassSection,
  StudentDashboardNoUpcomingClassesMessage,
  StudentDashboardRecentLessonReportsSection,
} from "@/frontend/mobile/views/dashboard/student/dashboard/studentDashboard.parts";

function MetricsSection({
  metrics,
  onMetricClick,
}: Readonly<{
  metrics: readonly MetricItem[];
  onMetricClick: (key: string) => void;
}>) {
  return <MobileMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} />;
}

export function StudentDashboardMobileView({
  userName,
  locale,
  nextLesson,
  upcomingTodayCount,
  creditBalance,
  recentLessonReports,
  reportsPagination,
  labels,
  lessonReportStatusLabels,
  loading,
  onJoinLesson,
  onViewCredits,
  onAddReflection,
}: Readonly<StudentDashboardViewModel>) {
  const metrics: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "remaining",
        label: labels.classesRemaining,
        count: creditBalance.classesRemaining,
        icon: PaymentsOutlined,
        labelKey: "remaining",
      },
      {
        key: "classesTotal",
        label: labels.classesTotal,
        count: creditBalance.classesTotal,
        icon: SchoolOutlined,
        labelKey: "classesTotal",
      },
      {
        key: "upcomingToday",
        label: labels.upcomingToday,
        count: upcomingTodayCount,
        icon: HistoryOutlined,
        labelKey: "upcomingToday",
      },
    ],
    [creditBalance.classesRemaining, creditBalance.classesTotal, labels, upcomingTodayCount]
  );

  if (loading && !nextLesson && recentLessonReports.length === 0) {
    return <StudentDashboardLoadingState message={labels.loadingMessage} />;
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.welcomeMessage(userName ?? "")} subtitle={labels.pageTitle} />

        <StudentDashboardNextClassSection
          nextLesson={nextLesson}
          labels={labels}
          locale={locale}
          onJoin={onJoinLesson}
        />

        <MetricsSection
          metrics={metrics}
          onMetricClick={key => {
            if (key === "remaining") onViewCredits();
          }}
        />

        <StudentDashboardNoUpcomingClassesMessage labels={labels} />

        <StudentDashboardRecentLessonReportsSection
          recentLessonReports={recentLessonReports}
          reportsPagination={reportsPagination}
          labels={labels}
          lessonReportStatusLabels={lessonReportStatusLabels}
          locale={locale}
          onAddReflection={onAddReflection}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
