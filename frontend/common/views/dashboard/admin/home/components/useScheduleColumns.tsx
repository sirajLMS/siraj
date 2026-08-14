"use client";

import { HistoryOutlined } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { PersonProfileLinkCell, ActionIconLink as StyledHistoryIconLink } from "@/frontend/common/components/ui";
import { ClassProfileLinkCell } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLinkCell";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  classHref,
  profileHrefForTeacher,
  studentHref,
  studentProfileTabHref,
} from "@/frontend/common/utils/profileHref";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import {
  StyledActionsCellBox,
  StyledGridDetailsLink,
  StyledMonospaceLabel,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid.styles";
import { ScheduleTimezoneOffsetCell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleOverviewHeaders } from "@/frontend/common/views/dashboard/admin/home/types/scheduleColumns.types";
import {
  formatDurationMinutes,
  formatScheduleYourTime,
} from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";

interface UseScheduleColumnsParams {
  readonly headers: ScheduleOverviewHeaders;
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
      width: 110,
      flex: 0.6,
      minWidth: 96,
      renderCell: ({ row }) => (
        <ScheduleTimezoneOffsetCell
          timeValue={row.teacherTime}
          timezone={row.teacherTimezone}
          at={row.scheduledStartAt}
        />
      ),
    },
    {
      field: "studentTime",
      headerName: headers.studentTime,
      width: 110,
      flex: 0.6,
      minWidth: 96,
      renderCell: ({ row }) => (
        <ScheduleTimezoneOffsetCell
          timeValue={row.studentTime}
          timezone={row.studentTimezone}
          at={row.scheduledStartAt}
        />
      ),
    },
  ];
}

function renderClassCell(row: DailyScheduleRow) {
  const classId = row.id ?? "";
  const courseName = row.courseName?.trim() ?? "—";

  return (
    <ClassProfileLinkCell
      href={classId ? classHref(classId) : undefined}
      name={courseName}
      avatarUrl={row.avatarUrl}
      avatarSize={40}
      typographyVariant="bodyMd"
      fontWeight={700}
    />
  );
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
      {
        field: "courseName",
        headerName: headers.className,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => renderClassCell(row),
      },
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
