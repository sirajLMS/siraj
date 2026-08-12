"use client";

import { SchoolOutlined, TimerOutlined, TrendingUpOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { StudentViewShellShared } from "@/frontend/common/views/dashboard/student/__shared__/studentViewShellShared";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { StudentPortalHistoryCalendar } from "@/frontend/desktop/views/dashboard/student/history/components/historyCalendar.desktop";

function HistoryMetricsRow({
  metrics,
  labels,
}: Readonly<{ metrics: StudentHistoryViewModel["metrics"]; labels: StudentHistoryViewModel["labels"] }>) {
  return (
    <Box sx={{ mb: 2 }}>
      <DesktopMetricCardGrid
        metrics={
          [
            {
              key: "total-classes",
              count: metrics.totalClasses,
              labelKey: "total-classes",
              label: labels.totalClasses,
              icon: SchoolOutlined,
            },
            {
              key: "attendance-rate",
              count: `${metrics.attendanceRate}%`,
              labelKey: "attendance-rate",
              label: labels.attendanceRate,
              icon: VerifiedUserOutlined,
            },
            {
              key: "hours-studied",
              count: `${metrics.hoursStudied}h`,
              labelKey: "hours-studied",
              label: labels.hoursStudied,
              icon: TimerOutlined,
            },
            {
              key: "performance",
              count: `${metrics.performance}%`,
              labelKey: "performance",
              label: labels.performance,
              icon: TrendingUpOutlined,
            },
          ] satisfies MetricItem[]
        }
        size={{ xs: 12, sm: 6, md: 3 }}
      />
    </Box>
  );
}

function calendarWeekdayLabels(labels: StudentHistoryViewModel["labels"]): readonly string[] {
  const weekdays = labels.calendarWeekdays;
  return [weekdays.sun, weekdays.mon, weekdays.tue, weekdays.wed, weekdays.thu, weekdays.fri, weekdays.sat];
}

export function StudentHistoryDesktopView({
  metrics,
  sessionsByDay,
  currentMonth,
  monthLabel,
  selectedDay,
  canGoNext,
  labels,
  locale,
  loading,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: Readonly<StudentHistoryViewModel>) {
  const weekdayLabels = calendarWeekdayLabels(labels);

  return (
    <StudentViewShellShared
      variant="desktop"
      pageTitle={labels.pageTitle}
      loading={loading && metrics.totalClasses === 0}
      loadingMessage={labels.loadingMessage}
      monthLabel={monthLabel}
      canGoNext={canGoNext}
      monthNavigatorLabels={labels}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
    >
      <HistoryMetricsRow metrics={metrics} labels={labels} />

      <DesktopSectionPanel title={labels.lessonHistory} contentPadding={false} sx={{ mb: 2, borderRadius: 0 }}>
        <StudentPortalHistoryCalendar
          currentMonth={currentMonth}
          sessionsByDay={sessionsByDay}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
          weekdayLabels={weekdayLabels}
          labels={labels}
          locale={locale}
        />
      </DesktopSectionPanel>
    </StudentViewShellShared>
  );
}
