"use client";

import { VisibilityOutlined } from "@mui/icons-material";
import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { ActionIconLink } from "@/frontend/common/components/ui/button/ActionIconLink";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { StudentViewShellShared } from "@/frontend/common/views/dashboard/student/__shared__/studentViewShellShared";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  formatStudentHistoryDuration,
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import type { StudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function isSessionJoinable(row: StudentHistorySessionRow): boolean {
  return Boolean(row.meetingJoinUrl) && isJoinableClassInstance(undefined, row.outcome, { isFrozen: row.isFrozen });
}

function buildColumns(
  labels: StudentSessionsViewModel["labels"],
  locale: string,
  onOpenMeetingUrl: StudentSessionsViewModel["onOpenMeetingUrl"]
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
          href={profileHrefForTeacher({ teacherId: row.teacherId })}
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
          <ActionIconLink href={classHref(row.id)} aria-label={labels.viewClass}>
            <VisibilityOutlined fontSize="small" />
          </ActionIconLink>
        );
      },
    },
  ];
}

function SessionsFilters({
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
  labels: StudentSessionsViewModel["labels"];
  onSubjectFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}>) {
  return (
    <Stack direction="row" spacing={2}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="sessions-subject-filter" shrink>
          {labels.filterBySubject}
        </InputLabel>
        <Select
          labelId="sessions-subject-filter"
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
        <InputLabel id="sessions-status-filter" shrink>
          {labels.filterByStatus}
        </InputLabel>
        <Select
          labelId="sessions-status-filter"
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

export function StudentSessionsDesktopView({
  filteredSessions,
  subjectOptions,
  statusOptions,
  subjectFilter,
  statusFilter,
  monthLabel,
  selectedDay,
  canGoNext,
  labels,
  locale,
  loading,
  onOpenMeetingUrl,
  onPrevMonth,
  onNextMonth,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<StudentSessionsViewModel>) {
  const columns = useMemo(() => buildColumns(labels, locale, onOpenMeetingUrl), [labels, locale, onOpenMeetingUrl]);

  const tableRows = useMemo(() => {
    if (selectedDay == null) return filteredSessions;
    return filteredSessions.filter(s => s.dayOfMonth === selectedDay);
  }, [filteredSessions, selectedDay]);

  return (
    <StudentViewShellShared
      variant="desktop"
      pageTitle={labels.pageTitle}
      loading={loading && filteredSessions.length === 0}
      loadingMessage={labels.loadingMessage}
      monthLabel={monthLabel}
      canGoNext={canGoNext}
      monthNavigatorLabels={labels}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
    >
      <DesktopSectionPanel
        contentPadding={false}
        sx={{ borderRadius: 0 }}
        actions={
          <SessionsFilters
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
          ariaLabel={labels.pageTitle}
          paginationOptions={{ mode: "client" }}
          sx={{ borderRadius: 0 }}
        />
      </DesktopSectionPanel>
    </StudentViewShellShared>
  );
}
