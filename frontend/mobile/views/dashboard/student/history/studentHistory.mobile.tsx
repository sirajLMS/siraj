"use client";

import {
  ArrowBackOutlined,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  SchoolOutlined,
  TimerOutlined,
  TrendingUpOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, type Theme, Typography } from "@mui/material";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  MobileCardList,
  MobileContentInset,
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { HistorySessionCardMobile } from "@/frontend/mobile/views/dashboard/student/history/components/historySessionCard.mobile";
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

function HistoryFilters({
  subjectFilter,
  statusFilter,
  subjectOptions,
  statusOptions,
  labels,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<{
  subjectFilter: string;
  statusFilter: string;
  subjectOptions: readonly string[];
  statusOptions: readonly string[];
  labels: StudentHistoryViewModel["labels"];
  onSubjectFilterChange: StudentHistoryViewModel["onSubjectFilterChange"];
  onStatusFilterChange: StudentHistoryViewModel["onStatusFilterChange"];
}>): React.ReactNode {
  return (
    <MobileContentInset sx={{ pt: 2.5 }}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="mobile-history-subject-filter" shrink>
            {labels.filterBySubject}
          </InputLabel>
          <Select
            labelId="mobile-history-subject-filter"
            label={labels.filterBySubject}
            value={subjectFilter}
            onChange={e => onSubjectFilterChange(e.target.value)}
          >
            <MenuItem value="">{labels.allSubjects}</MenuItem>
            {subjectOptions.map(subject => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="mobile-history-status-filter" shrink>
            {labels.filterByStatus}
          </InputLabel>
          <Select
            labelId="mobile-history-status-filter"
            label={labels.filterByStatus}
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
          >
            <MenuItem value="">{labels.allStatuses}</MenuItem>
            {statusOptions.map(status => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </MobileContentInset>
  );
}

function HistorySessionList({
  listRows,
  labels,
  locale,
  onOpenMeetingUrl,
}: Readonly<{
  listRows: readonly StudentHistorySessionRow[];
  labels: StudentHistoryViewModel["labels"];
  locale: string;
  onOpenMeetingUrl: StudentHistoryViewModel["onOpenMeetingUrl"];
}>): React.ReactNode {
  return (
    <MobileCardList<StudentHistorySessionRow>
      rows={listRows}
      emptyMessage={labels.noHistory}
      getKey={row => row.id}
      paginationOptions={{ mode: "client" }}
      renderItem={row => (
        <HistorySessionCardMobile row={row} labels={labels} locale={locale} onOpenMeetingUrl={onOpenMeetingUrl} />
      )}
    />
  );
}

function BackToDashboardButton({
  labels,
  onBackToDashboard,
}: Readonly<{
  labels: StudentHistoryViewModel["labels"];
  onBackToDashboard: () => void;
}>): React.ReactNode {
  return (
    <MobileContentInset>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<ArrowBackOutlined />}
        sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
        onClick={onBackToDashboard}
      >
        {labels.backToDashboard}
      </Button>
    </MobileContentInset>
  );
}

export function StudentHistoryMobileView({
  metrics,
  filteredSessions,
  sessionsByDay,
  subjectOptions,
  statusOptions,
  subjectFilter,
  statusFilter,
  currentMonth,
  monthLabel,
  selectedDay,
  selectedWeek,
  canGoNext,
  labels,
  locale,
  loading,
  onBackToDashboard,
  onOpenMeetingUrl,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onSelectWeek,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<StudentHistoryViewModel>) {
  const listRows = useMemo(() => {
    if (selectedDay == null) return filteredSessions;
    return filteredSessions.filter(s => s.dayOfMonth === selectedDay);
  }, [filteredSessions, selectedDay]);

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

        <MobileSectionPanel title={labels.sessionsList} contentInset={false} sx={{ mt: 2 }}>
          <HistoryFilters
            subjectFilter={subjectFilter}
            statusFilter={statusFilter}
            subjectOptions={subjectOptions}
            statusOptions={statusOptions}
            labels={labels}
            onSubjectFilterChange={onSubjectFilterChange}
            onStatusFilterChange={onStatusFilterChange}
          />
          <HistorySessionList listRows={listRows} labels={labels} locale={locale} onOpenMeetingUrl={onOpenMeetingUrl} />
        </MobileSectionPanel>

        <BackToDashboardButton labels={labels} onBackToDashboard={onBackToDashboard} />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
