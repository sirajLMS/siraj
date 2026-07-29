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
import { Box, Button, type Theme, Typography } from "@mui/material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { HistoryWeeklyScrollerMobile } from "@/frontend/mobile/views/dashboard/student/history/components/historyWeeklyScroller.mobile";

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
}>): React.ReactNode {
  const navButtonSx = (theme: Theme) => ({
    minWidth: 40,
    transform: theme.direction === "rtl" ? ("scaleX(-1)" as const) : undefined,
  });
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
      <Button aria-label={labels.previousMonth} onClick={onPrevMonth} sx={navButtonSx}>
        <ChevronLeft />
      </Button>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <CalendarToday sx={theme => ({ fontSize: 18, color: theme.palette.primary.main })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {monthLabel}
        </Typography>
      </Box>
      <Button
        aria-label={labels.nextMonth}
        onClick={onNextMonth}
        disabled={!canGoNext}
        sx={theme => ({ ...navButtonSx(theme), opacity: canGoNext ? 1 : 0.5 })}
      >
        <ChevronRight />
      </Button>
    </Box>
  );
}

export function StudentHistoryMobileView({
  metrics,
  sessionsByDay,
  currentMonth,
  monthLabel,
  selectedDay,
  selectedWeek,
  canGoNext,
  labels,
  loading,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onSelectWeek,
}: Readonly<StudentHistoryViewModel>) {
  const metricItems = useStudentHistoryMetricItems(metrics, labels);

  if (loading && metrics.totalClasses === 0) {
    return (
      <MobilePageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} titleVariant="headlineMd" />

        <MonthNavigator
          monthLabel={monthLabel}
          canGoNext={canGoNext}
          labels={labels}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />

        <MobileMetricCardGrid metrics={metricItems} />

        <Box sx={{ mt: 0 }}>
          <HistoryWeeklyScrollerMobile
            selectedWeek={selectedWeek}
            selectedDay={selectedDay}
            currentMonth={currentMonth}
            sessionsByDay={sessionsByDay}
            weeklyAttendanceLabel={labels.weeklyAttendance}
            weekLabel={labels.week(selectedWeek)}
            calendarWeekdays={labels.calendarWeekdays}
            onSelectWeek={onSelectWeek}
            onSelectDay={onSelectDay}
          />
        </Box>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
