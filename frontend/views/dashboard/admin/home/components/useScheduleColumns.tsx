"use client";

import { HistoryOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { PersonProfileLinkCell, ActionIconLink as StyledHistoryIconLink } from "@/frontend/components/ui";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref } from "@/frontend/utils/profileHref";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/admin/home/types/schedule";
import {
  formatDurationMinutes,
  formatScheduleTimeOnly,
  formatScheduleYourTime,
} from "@/frontend/views/dashboard/admin/home/utils/formatScheduleTime";
import { ScheduleInstanceStatusBadge } from "./ScheduleInstanceStatusBadge";
import { StyledActionsCellBox, StyledGridDetailsLink, StyledMonospaceLabel } from "./ScheduleOverviewDataGrid.styles";

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
        <StyledMonospaceLabel variant="labelMd">{formatScheduleTimeOnly(row.teacherTime, locale)}</StyledMonospaceLabel>
      ),
    },
    {
      field: "studentTime",
      headerName: headers.studentTime,
      width: 130,
      flex: 1,
      minWidth: 110,
      renderCell: ({ row }) => (
        <StyledMonospaceLabel variant="labelMd">{formatScheduleTimeOnly(row.studentTime, locale)}</StyledMonospaceLabel>
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
              <StyledHistoryIconLink href={`${studentHref(studentId)}/history`} aria-label={historyLabel}>
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
  const locale = useLocale();

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
      buildActionsColumn(headers, detailsLabel, headers.history),
    ];
  }, [detailsLabel, headers, statusLabels, showTimezones, locale]);
}
