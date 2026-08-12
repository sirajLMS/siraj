"use client";

import { SchoolOutlined, TimerOutlined, TrendingUpOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { StudentViewShellShared } from "@/frontend/common/views/dashboard/student/__shared__/studentViewShellShared";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import { HistoryDayScheduleSectionMobile } from "@/frontend/mobile/views/dashboard/student/history/components/historyDayScheduleSection.mobile";
import { HistoryDayTabNavMobile } from "@/frontend/mobile/views/dashboard/student/history/components/historyDayTabNav.mobile";

function useStudentHistoryMetricItems(
  metrics: StudentHistoryViewModel["metrics"],
  labels: StudentHistoryViewModel["labels"]
): readonly MetricItem[] {
  return useMemo(
    () => [
      {
        key: "totalClasses",
        label: labels.totalClasses,
        count: metrics.totalClasses,
        icon: SchoolOutlined,
        labelKey: "totalClasses",
      },
      {
        key: "attendanceRate",
        label: labels.attendanceRate,
        count: `${metrics.attendanceRate}%`,
        icon: VerifiedUserOutlined,
        labelKey: "attendanceRate",
      },
      {
        key: "hoursStudied",
        label: labels.hoursStudied,
        count: `${metrics.hoursStudied}h`,
        icon: TimerOutlined,
        labelKey: "hoursStudied",
      },
      {
        key: "performance",
        label: labels.performance,
        count: `${metrics.performance}%`,
        icon: TrendingUpOutlined,
        labelKey: "performance",
      },
    ],
    [labels, metrics]
  );
}

export function StudentHistoryMobileView({
  metrics,
  currentMonth,
  monthLabel,
  effectiveSelectedDay,
  daysWithSessions,
  sessionsForSelectedDay,
  canGoNext,
  labels,
  locale,
  loading,
  onPrevMonth,
  onNextMonth,
  onTabChange,
}: Readonly<StudentHistoryViewModel>) {
  const metricItems = useStudentHistoryMetricItems(metrics, labels);

  return (
    <StudentViewShellShared
      variant="mobile"
      pageTitle={labels.pageTitle}
      loading={loading && metrics.totalClasses === 0}
      loadingMessage={labels.loadingMessage}
      monthLabel={monthLabel}
      canGoNext={canGoNext}
      monthNavigatorLabels={labels}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
    >
      <MobileMetricCardGrid metrics={metricItems} />

      <HistoryDayTabNavMobile
        currentMonth={currentMonth}
        effectiveSelectedDay={effectiveSelectedDay}
        daysWithSessions={daysWithSessions}
        labels={labels}
        onTabChange={onTabChange}
      />

      <HistoryDayScheduleSectionMobile
        currentMonth={currentMonth}
        effectiveSelectedDay={effectiveSelectedDay}
        sessions={sessionsForSelectedDay}
        labels={labels}
        locale={locale}
      />
    </StudentViewShellShared>
  );
}
