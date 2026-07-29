"use client";

import {
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  SchoolOutlined,
  TimerOutlined,
  TrendingUpOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { StudentPortalHistoryCalendar } from "@/frontend/desktop/views/dashboard/student/history/components/historyCalendar.desktop";

function MonthNavigator({
  monthLabel,
  canGoNext,
  labels,
  onPrevMonth,
  onNextMonth,
}: Readonly<{
  monthLabel: string;
  canGoNext: boolean;
  labels: StudentHistoryViewModel["labels"];
  onPrevMonth: () => void;
  onNextMonth: () => void;
}>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2, gap: 2 }}>
      <Button
        aria-label={labels.previousMonth}
        onClick={onPrevMonth}
        sx={theme => ({
          minWidth: 40,
          transform: theme.direction === "rtl" ? "scaleX(-1)" : undefined,
        })}
      >
        <ChevronLeft />
      </Button>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarToday sx={theme => ({ fontSize: 20, color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {monthLabel}
        </Typography>
      </Box>
      <Button
        aria-label={labels.nextMonth}
        onClick={onNextMonth}
        disabled={!canGoNext}
        sx={theme => ({
          minWidth: 40,
          transform: theme.direction === "rtl" ? "scaleX(-1)" : undefined,
          opacity: canGoNext ? 1 : 0.5,
        })}
      >
        <ChevronRight />
      </Button>
    </Box>
  );
}

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

function LoadingHistoryView({ labels }: Readonly<{ labels: StudentHistoryViewModel["labels"] }>) {
  return (
    <DesktopPageContainer>
      <Typography variant="bodyMd" sx={{ p: 3 }}>
        {labels.loadingMessage}
      </Typography>
    </DesktopPageContainer>
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

  if (loading && metrics.totalClasses === 0) {
    return <LoadingHistoryView labels={labels} />;
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />

      <MonthNavigator
        monthLabel={monthLabel}
        canGoNext={canGoNext}
        labels={labels}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />

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
    </DesktopPageContainer>
  );
}
