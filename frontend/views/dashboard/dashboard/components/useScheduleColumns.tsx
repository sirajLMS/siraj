"use client";

import { Box, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/dashboard/types/schedule";
import { formatScheduleTimeOnly } from "@/frontend/views/dashboard/dashboard/utils/formatScheduleTime";
import { ScheduleInstanceStatusBadge } from "./ScheduleInstanceStatusBadge";
import {
  StyledActionsCellBox,
  StyledGridDetailsIconButton,
  StyledMonospaceLabel,
  StyledScheduleNameLink,
  StyledScheduleTeacherLink,
  StyledStudentNameText,
  StyledTeacherNameText,
} from "./ScheduleOverviewDataGrid.styles";

interface UseScheduleColumnsParams {
  readonly headers: {
    readonly classId: string;
    readonly student: string;
    readonly teacher: string;
    readonly time: string;
    readonly yourTime: string;
    readonly teacherTime: string;
    readonly studentTime: string;
    readonly status: string;
    readonly actions: string;
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
  if (showTimezones) {
    return [
      {
        field: "yourTime",
        headerName: headers.yourTime,
        width: 150,
        flex: 1,
        renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.yourTime ?? ""}</StyledMonospaceLabel>,
      },
      {
        field: "teacherTime",
        headerName: headers.teacherTime,
        width: 150,
        flex: 1,
        renderCell: ({ row }) => (
          <StyledMonospaceLabel variant="labelMd">{formatScheduleTimeOnly(row.teacherTime, locale)}</StyledMonospaceLabel>
        ),
      },
      {
        field: "studentTime",
        headerName: headers.studentTime,
        width: 150,
        flex: 1,
        renderCell: ({ row }) => (
          <StyledMonospaceLabel variant="labelMd">{formatScheduleTimeOnly(row.studentTime, locale)}</StyledMonospaceLabel>
        ),
      },
    ];
  }

  return [
    {
      field: "yourTime",
      headerName: headers.time,
      width: 130,
      flex: 1,
      renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.yourTime ?? ""}</StyledMonospaceLabel>,
    },
  ];
}

function renderStudentCell(row: DailyScheduleRow, locale: string) {
  const studentName = row.student?.name ?? "Unknown Student";
  const studentId = row.student?.id;

  if (!studentId) {
    return <StyledStudentNameText variant="bodyMd">{studentName}</StyledStudentNameText>;
  }

  return (
    <StyledScheduleNameLink href={`/${locale}/students/${studentId}`}>{studentName}</StyledScheduleNameLink>
  );
}

function renderTeacherCell(row: DailyScheduleRow, locale: string) {
  const teacherName = row.teacher?.name ?? "Unknown Teacher";
  const teacherId = row.teacher?.id;

  if (!teacherId) {
    return <StyledTeacherNameText variant="bodyMd">{teacherName}</StyledTeacherNameText>;
  }

  return (
    <StyledScheduleTeacherLink href={`/${locale}/teachers/${teacherId}/profile`}>{teacherName}</StyledScheduleTeacherLink>
  );
}

function buildActionsColumn(
  headers: UseScheduleColumnsParams["headers"],
  detailsLabel: string,
  router: ReturnType<typeof useRouter>,
  locale: string
): GridColDef<DailyScheduleRow> {
  return {
    field: "actions",
    headerName: headers.actions,
    width: 90,
    sortable: false,
    align: "center",
    headerAlign: "center",
    flex: .5,
    renderCell: ({ row }) => (
      <StyledActionsCellBox>
        <Box>
          <Tooltip title={detailsLabel}>
            <StyledGridDetailsIconButton variant="text" size="small" onClick={() => router.push(`/${locale}/classes/${row.id ?? ""}`)}>
              {/* <DetailsIcon fontSize="small" /> */}
              {detailsLabel}
            </StyledGridDetailsIconButton>
          </Tooltip>
        </Box>
      </StyledActionsCellBox>
    ),
  };
}

export function useScheduleColumns({ headers, statusLabels, detailsLabel, showTimezones }: UseScheduleColumnsParams) {
  const router = useRouter();
  const locale = useLocale();

  return useMemo<GridColDef<DailyScheduleRow>[]>(() => {
    const baseCols: GridColDef<DailyScheduleRow>[] = [
      {
        field: "classId",
        headerName: headers.classId,
        width: 120,
        renderCell: ({ row }) => (
          <StyledMonospaceLabel variant="labelMd">{row.id ? `#CLS-${row.id}` : ""}</StyledMonospaceLabel>
        ),
      },
      {
        field: "student",
        headerName: headers.student,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => renderStudentCell(row, locale),
      },
      {
        field: "teacher",
        headerName: headers.teacher,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => renderTeacherCell(row, locale),
      },
    ];

    baseCols.push(
      ...buildTimeColumns(showTimezones, headers, locale),
      {
        field: "status",
        headerName: headers.status,
        width: 130,
        renderCell: ({ row }) => (
          <ScheduleInstanceStatusBadge
            outcome={row.outcome}
            executionState={row.executionState}
            statusLabels={statusLabels}
          />
        ),
      },
      buildActionsColumn(headers, detailsLabel, router, locale)
    );

    return baseCols;
  }, [detailsLabel, headers, statusLabels, showTimezones, router, locale]);
}
