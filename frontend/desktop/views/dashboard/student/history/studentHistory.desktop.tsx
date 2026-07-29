"use client";

import {
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  SchoolOutlined,
  TimerOutlined,
  TrendingUpOutlined,
  VerifiedUserOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { classHref } from "@/frontend/common/utils/profileHref";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  formatStudentHistoryDuration,
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopActionIconLink } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import { StudentPortalHistoryCalendar } from "@/frontend/desktop/views/dashboard/student/history/components/historyCalendar.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function isSessionJoinable(row: StudentHistorySessionRow): boolean {
  return Boolean(row.meetingJoinUrl) && isJoinableClassInstance(undefined, row.outcome, { isFrozen: row.isFrozen });
}

function buildColumns(
  labels: StudentHistoryViewModel["labels"],
  locale: string,
  onOpenMeetingUrl: StudentHistoryViewModel["onOpenMeetingUrl"]
): GridColDef<StudentHistorySessionRow>[] {
  return [
    {
      field: "title",
      headerName: labels.subject,
      flex: 1.2,
      minWidth: 160,
      renderCell: ({ row }) => (
        <DesktopClassProfileLinkCell
          href={classHref(row.id)}
          name={row.title?.trim() || "—"}
          avatarSize={40}
          typographyVariant="bodyMd"
          fontWeight={700}
        />
      ),
    },
    {
      field: "time",
      headerName: labels.sessionDate,
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.time,
      renderCell: ({ row }) => <DateTimeTooltipDisplay value={row.time} locale={locale} />,
    },
    {
      field: "instructor",
      headerName: labels.instructor,
      flex: 1.1,
      minWidth: 160,
      renderCell: ({ row }) => (
        <DesktopPersonProfileLinkCell
          name={row.instructor?.trim() || "—"}
          avatarSize={36}
          typographyVariant="bodyMd"
          fontWeight={700}
        />
      ),
    },
    {
      field: "duration",
      headerName: labels.duration,
      flex: 0.7,
      minWidth: 90,
      renderCell: ({ row }) => (
        <Typography variant="bodyMd">{formatStudentHistoryDuration(row.duration, labels)}</Typography>
      ),
    },
    {
      field: "status",
      headerName: labels.status,
      flex: 0.9,
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <DesktopStatusBadge
          category="classStatus"
          status={mapStudentHistoryStatusToBadge(row.status, row.outcome)}
          label={resolveStudentHistoryStatusLabel(row, labels.statusLabels)}
        />
      ),
    },
    {
      field: "notes",
      headerName: labels.notes,
      flex: 1.2,
      minWidth: 140,
      renderCell: ({ row }) => (
        <Typography variant="bodyMd" noWrap title={row.notes || undefined}>
          {row.notes?.trim() || "—"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 72,
      sortable: false,
      renderCell: ({ row }) => {
        if (isSessionJoinable(row)) {
          return (
            <MeetingJoinAction
              joinUrl={row.meetingJoinUrl}
              meeting={row.effectiveMeeting}
              onJoinAction={() => onOpenMeetingUrl(row.meetingJoinUrl)}
              variant="icon"
              label={labels.joinSession}
              emptyRole="class"
            />
          );
        }
        return (
          <DesktopActionIconLink href={classHref(row.id)} aria-label={labels.viewClass}>
            <VisibilityOutlined fontSize="small" />
          </DesktopActionIconLink>
        );
      },
    },
  ];
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
  onSubjectFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}>) {
  return (
    <Stack direction="row" spacing={2}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="history-subject-filter" shrink>
          {labels.filterBySubject}
        </InputLabel>
        <Select
          labelId="history-subject-filter"
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
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="history-status-filter" shrink>
          {labels.filterByStatus}
        </InputLabel>
        <Select
          labelId="history-status-filter"
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
  filteredSessions,
  sessionsByDay,
  subjectOptions,
  statusOptions,
  subjectFilter,
  statusFilter,
  currentMonth,
  monthLabel,
  selectedDay,
  canGoNext,
  labels,
  locale,
  loading,
  onOpenMeetingUrl,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<StudentHistoryViewModel>) {
  const weekdayLabels = calendarWeekdayLabels(labels);

  const columns = useMemo(() => buildColumns(labels, locale, onOpenMeetingUrl), [labels, locale, onOpenMeetingUrl]);

  const tableRows = useMemo(() => {
    if (selectedDay == null) return filteredSessions;
    return filteredSessions.filter(s => s.dayOfMonth === selectedDay);
  }, [filteredSessions, selectedDay]);

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

      <DesktopSectionPanel title={labels.lessonHistory} contentPadding={false} sx={{ mb: 2 }}>
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

      <DesktopSectionPanel
        contentPadding={false}
        title={labels.sessionsList}
        sx={{ borderRadius: 0 }}
        actions={
          <HistoryFilters
            subjectFilter={subjectFilter}
            statusFilter={statusFilter}
            subjectOptions={subjectOptions}
            statusOptions={statusOptions}
            labels={labels}
            onSubjectFilterChange={onSubjectFilterChange}
            onStatusFilterChange={onStatusFilterChange}
          />
        }
      >
        <DesktopAppDataGrid
          rows={[...tableRows]}
          columns={columns}
          loading={loading}
          emptyMessage={labels.noHistory}
          getRowId={row => row.id}
          autoHeight
          rowHeight={72}
          ariaLabel={labels.sessionsList}
          paginationOptions={{ mode: "client" }}
          sx={{ borderRadius: 0 }}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
