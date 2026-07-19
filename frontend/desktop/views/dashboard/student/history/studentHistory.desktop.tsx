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
  VisibilityOutlined,
} from "@mui/icons-material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { StudentPortalHistoryCalendar } from "@/frontend/desktop/views/dashboard/student/history/components/historyCalendar.desktop";

const WEEKDAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_LABELS_AR = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] as const;

function statusBadgeValue(status: string): string {
  const lower = status.toLowerCase();
  if (lower === "completed" || lower === "present" || lower === "taken") return "completed";
  if (lower === "cancelled" || lower === "absent") return "cancelled";
  if (lower === "pending" || lower === "scheduled") return "pending";
  return "pending";
}

function buildColumns(
  labels: StudentHistoryViewModel["labels"],
  locale: string,
  onOpenMeetingUrl: StudentHistoryViewModel["onOpenMeetingUrl"]
): GridColDef<StudentHistorySessionRow>[] {
  return [
    {
      field: "time",
      headerName: labels.sessionDate,
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => {
        if (!row.time) return "—";
        try {
          return formatDate(row.time, locale);
        } catch {
          return row.time;
        }
      },
    },
    { field: "title", headerName: labels.subject, flex: 1.2, minWidth: 140 },
    { field: "instructor", headerName: labels.instructor, flex: 1, minWidth: 120 },
    {
      field: "duration",
      headerName: labels.duration,
      width: 100,
      valueGetter: (_value, row) => `${row.duration} min`,
    },
    {
      field: "status",
      headerName: labels.status,
      width: 140,
      renderCell: params => (
        <DesktopStatusBadge
          category="classStatus"
          status={statusBadgeValue(params.row.status)}
          label={params.row.status || "—"}
        />
      ),
    },
    { field: "outcome", headerName: labels.outcome, flex: 0.8, minWidth: 100 },
    { field: "notes", headerName: labels.notes, flex: 1.2, minWidth: 140 },
    {
      field: "meetingJoinUrl",
      headerName: labels.joinUrl,
      width: 140,
      sortable: false,
      renderCell: params =>
        params.row.meetingJoinUrl ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlined />}
            onClick={() => onOpenMeetingUrl(params.row.meetingJoinUrl)}
          >
            {labels.viewReport}
          </Button>
        ) : (
          "—"
        ),
    },
  ];
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
  onBackToDashboard,
  onOpenMeetingUrl,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<StudentHistoryViewModel>) {
  const weekdayLabels = locale.startsWith("ar") ? WEEKDAY_LABELS_AR : WEEKDAY_LABELS_EN;

  const columns = useMemo(() => buildColumns(labels, locale, onOpenMeetingUrl), [labels, locale, onOpenMeetingUrl]);

  const tableRows = useMemo(() => {
    if (selectedDay == null) return filteredSessions;
    return filteredSessions.filter(s => s.dayOfMonth === selectedDay);
  }, [filteredSessions, selectedDay]);

  if (loading && metrics.totalClasses === 0) {
    return (
      <DesktopPageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 3, gap: 2 }}>
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

      <Box sx={{ mb: 3 }}>
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

      <DesktopSectionPanel title={labels.lessonHistory} sx={{ mb: 3 }}>
        <StudentPortalHistoryCalendar
          currentMonth={currentMonth}
          sessionsByDay={sessionsByDay}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
          weekdayLabels={weekdayLabels}
        />
      </DesktopSectionPanel>

      <DesktopSectionPanel
        title={labels.lessonHistory}
        actions={
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="history-subject-filter">{labels.filterBySubject}</InputLabel>
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
              <InputLabel id="history-status-filter">{labels.filterByStatus}</InputLabel>
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
        }
      >
        <DesktopAppDataGrid
          rows={[...tableRows]}
          columns={columns}
          loading={loading}
          emptyMessage={labels.noHistory}
          getRowId={row => row.id}
          autoHeight
          ariaLabel={labels.lessonHistory}
          paginationOptions={{ mode: "client" }}
        />
      </DesktopSectionPanel>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onBackToDashboard}
        >
          {labels.backToDashboard}
        </Button>
      </Box>
    </DesktopPageContainer>
  );
}
