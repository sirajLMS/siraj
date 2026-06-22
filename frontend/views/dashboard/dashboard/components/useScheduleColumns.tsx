"use client";

import { Details as DetailsIcon } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";
import {
  StyledActionsCellBox,
  StyledGridDetailsIconButton,
  StyledMonospaceLabel,
  StyledStudentNameText,
  StyledTeacherNameText,
} from "./ScheduleOverviewDataGrid.styles";

const CLASS_STATUS_MAP: Record<ClassStatus, string> = {
  scheduled: "scheduled",
  in_progress: "in_progress",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
  absent: "absent",
};

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
  readonly statusLabels: Record<ClassStatus, string>;
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
}

function buildTimeColumns(
  showTimezones: boolean,
  headers: UseScheduleColumnsParams["headers"]
): GridColDef<ScheduleRow>[] {
  if (showTimezones) {
    return [
      {
        field: "yourTime",
        headerName: headers.yourTime,
        width: 150,
        flex: 1,
        renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.yourTime}</StyledMonospaceLabel>,
      },
      {
        field: "teacherTime",
        headerName: headers.teacherTime,
        width: 150,
        flex: 1,
        renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.teacherTime ?? ""}</StyledMonospaceLabel>,
      },
      {
        field: "studentTime",
        headerName: headers.studentTime,
        width: 150,
        flex: 1,
        renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.studentTime ?? ""}</StyledMonospaceLabel>,
      },
    ];
  }

  return [
    {
      field: "time",
      headerName: headers.time,
      width: 130,
      flex: 1,
      renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.time}</StyledMonospaceLabel>,
    },
  ];
}

function buildActionsColumn(
  headers: UseScheduleColumnsParams["headers"],
  detailsLabel: string,
  router: ReturnType<typeof useRouter>,
  locale: string
): GridColDef<ScheduleRow> {
  return {
    field: "actions",
    headerName: headers.actions,
    width: 90,
    sortable: false,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      <StyledActionsCellBox>
        <Box>
          <Tooltip title={detailsLabel}>
            <StyledGridDetailsIconButton size="small" onClick={() => router.push(`/${locale}/classes/${row.id}`)}>
              <DetailsIcon fontSize="small" />
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

  return useMemo<GridColDef<ScheduleRow>[]>(() => {
    const baseCols: GridColDef<ScheduleRow>[] = [
      {
        field: "classId",
        headerName: headers.classId,
        width: 120,
        renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.classId}</StyledMonospaceLabel>,
      },
      {
        field: "student",
        headerName: headers.student,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => <StyledStudentNameText variant="bodyMd">{row.student}</StyledStudentNameText>,
      },
      {
        field: "teacher",
        headerName: headers.teacher,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => <StyledTeacherNameText variant="bodyMd">{row.teacher}</StyledTeacherNameText>,
      },
    ];

    baseCols.push(...buildTimeColumns(showTimezones, headers));

    baseCols.push(
      {
        field: "status",
        headerName: headers.status,
        width: 130,
        renderCell: ({ row }) => (
          <StatusBadge category="classStatus" status={CLASS_STATUS_MAP[row.status]} label={statusLabels[row.status]} />
        ),
      },
      buildActionsColumn(headers, detailsLabel, router, locale)
    );

    return baseCols;
  }, [detailsLabel, headers, statusLabels, showTimezones, router, locale]);
}
