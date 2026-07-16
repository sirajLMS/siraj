"use client";

import { HistoryOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { PersonProfileLinkCell, ActionIconLink as StyledHistoryIconLink } from "@/frontend/common/components/ui";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import {
  StyledActionsCellBox,
  StyledGridDetailsLink,
  StyledMonospaceLabel,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid.styles";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import {
  formatDurationMinutes,
  formatScheduleTimeOnly,
  formatScheduleYourTime,
} from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";

interface UseScheduleColumnsParams {
  readonly headers: {
    readonly student: string;
    readonly teacher: string;
    readonly time: string;
    readonly yourTime: string;
    readonly teacherTime: string;
    readonly studentTime: string;
    readonly duration: string;
    readonly status: string;
    readonly actions: string;
    readonly history: string;
    readonly joinVideo: string;
  };
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
}

function buildTimeColumns(
  showTimezones: boolean,
  headers: UseScheduleColumnsParams["headers"],
  locale: string
): GridColDef<DailyScheduleRow>[] {
  const yourTimeColumn: GridColDef<DailyScheduleRow> = {
    field: "yourTime",
    headerName: headers.yourTime,
    width: 190,
    flex: 1,
    minWidth: 160,
    renderCell: ({ row }) => (
      <StyledMonospaceLabel variant="labelMd">
        {formatScheduleYourTime(row.yourTime, row.studentTime ?? row.teacherTime, locale)}
      </StyledMonospaceLabel>
    ),
  };

  if (!showTimezones) {
    return [yourTimeColumn];
  }

  return [
    yourTimeColumn,
    {
      field: "teacherTime",
      headerName: headers.teacherTime,
      width: 130,
      flex: 1,
      minWidth: 110,
      renderCell: ({ row }) => (
        <Stack spacing={0.25}>
          <StyledMonospaceLabel variant="labelMd">
            {formatScheduleTimeOnly(row.teacherTime, locale)}
          </StyledMonospaceLabel>
          {row.teacherTimezone ? <TimezoneDisplay timezone={row.teacherTimezone} typographyVariant="labelMd" /> : null}
        </Stack>
      ),
    },
    {
      field: "studentTime",
      headerName: headers.studentTime,
      width: 130,
      flex: 1,
      minWidth: 110,
      renderCell: ({ row }) => (
        <Stack spacing={0.25}>
          <StyledMonospaceLabel variant="labelMd">
            {formatScheduleTimeOnly(row.studentTime, locale)}
          </StyledMonospaceLabel>
          {row.studentTimezone ? <TimezoneDisplay timezone={row.studentTimezone} typographyVariant="labelMd" /> : null}
        </Stack>
      ),
    },
  ];
}

function renderStudentCell(row: DailyScheduleRow) {
  const studentName = row.student?.name ?? "Unknown Student";
  const studentId = row.student?.id;

  return (
    <PersonProfileLinkCell
      href={studentId ? studentHref(studentId) : undefined}
      name={studentName}
      avatarUrl={row.student?.avatarUrl}
      avatarSize={32}
      typographyVariant="bodyMd"
      fontWeight={600}
    />
  );
}

function renderTeacherCell(row: DailyScheduleRow) {
  const teacherName = row.teacher?.name ?? "Unknown Teacher";
  const teacherId = row.teacher?.id;

  return (
    <PersonProfileLinkCell
      href={teacherId ? profileHrefForTeacher({ teacherId }) : undefined}
      name={teacherName}
      avatarUrl={row.teacher?.avatarUrl}
      avatarSize={32}
      typographyVariant="bodyMd"
      fontWeight={600}
      emphasizeLink={Boolean(teacherId)}
    />
  );
}

function buildActionsColumn(
  headers: UseScheduleColumnsParams["headers"],
  detailsLabel: string,
  historyLabel: string
): GridColDef<DailyScheduleRow> {
  return {
    field: "actions",
    headerName: headers.actions,
    width: 140,
    sortable: false,
    align: "center",
    headerAlign: "center",
    flex: 0.6,
    minWidth: 120,
    renderCell: ({ row }) => {
      const studentId = row.student?.id;
      const classId = row.id ?? "";

      return (
        <StyledActionsCellBox>
          {studentId ? (
            <Tooltip title={historyLabel}>
              <StyledHistoryIconLink href={studentProfileTabHref(studentId, "history")} aria-label={historyLabel}>
                <HistoryOutlined fontSize="small" />
              </StyledHistoryIconLink>
            </Tooltip>
          ) : null}
          {classId ? (
            <Tooltip title={detailsLabel}>
              <StyledGridDetailsLink href={`/classes/${classId}`}>{detailsLabel}</StyledGridDetailsLink>
            </Tooltip>
          ) : null}
        </StyledActionsCellBox>
      );
    },
  };
}

export function useScheduleColumns({ headers, statusLabels, detailsLabel, showTimezones }: UseScheduleColumnsParams) {
  const locale = useAppLocale();

  return useMemo<GridColDef<DailyScheduleRow>[]>(() => {
    return [
      ...buildTimeColumns(showTimezones, headers, locale),
      {
        field: "duration",
        headerName: headers.duration,
        width: 90,
        flex: 0.5,
        minWidth: 80,
        renderCell: ({ row }) => (
          <StyledMonospaceLabel variant="labelMd">{formatDurationMinutes(row.duration)}</StyledMonospaceLabel>
        ),
      },
      {
        field: "status",
        headerName: headers.status,
        width: 130,
        renderCell: ({ row }) => (
          <ScheduleInstanceStatusBadge
            outcome={row.outcome}
            executionState={row.executionState}
            scheduledEndAt={row.scheduledEndAt}
            scheduledStartAt={row.scheduledStartAt}
            durationMinutes={row.duration}
            statusLabels={statusLabels}
          />
        ),
      },
      {
        field: "teacher",
        headerName: headers.teacher,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => renderTeacherCell(row),
      },
      {
        field: "student",
        headerName: headers.student,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => renderStudentCell(row),
      },
      {
        field: "join",
        headerName: "",
        width: 56,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}>
            {isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false }) ? (
              <MeetingJoinAction
                variant="icon"
                joinUrl={row.meetingJoinUrl}
                meeting={row.effectiveMeeting}
                label={headers.joinVideo}
                emptyRole="class"
              />
            ) : null}
          </Box>
        ),
      },
      buildActionsColumn(headers, detailsLabel, headers.history),
    ];
  }, [detailsLabel, headers, statusLabels, showTimezones, locale]);
}
