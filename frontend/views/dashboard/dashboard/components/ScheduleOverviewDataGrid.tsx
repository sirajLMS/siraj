"use client";

import { Details as DetailsIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";

// Monospace-styled label for IDs and time values in data grid cells
const StyledMonospaceLabel = styled(Typography)(({ theme }) => ({
  fontFamily: "monospace",
  color: theme.palette.text.secondary,
  fontWeight: 500,
  alignSelf: "center",
}));

// Student name displayed with medium weight in grid cell
const StyledStudentNameText = styled(Typography)({
  fontWeight: 500,
  alignSelf: "center",
});

// Teacher name displayed in secondary color in grid cell
const StyledTeacherNameText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  alignSelf: "center",
}));

// Centered container for action buttons inside a grid cell
const StyledActionsCellBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
  width: "100%",
  alignSelf: "center",
  height: "100%",
});

// Details icon button with primary color and subtle alpha hover background
const StyledGridDetailsIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));

interface ScheduleOverviewDataGridProps {
  readonly rows: readonly ScheduleRow[];
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
  readonly emptyMessage: string;
}

const CLASS_STATUS_MAP: Record<ClassStatus, string> = {
  scheduled: "scheduled",
  in_progress: "in_progress",
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
  absent: "absent",
};

export function ScheduleOverviewDataGrid({
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
}: ScheduleOverviewDataGridProps) {
  const router = useRouter();
  const locale = useLocale();
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);

  const columns = useMemo<GridColDef<ScheduleRow>[]>(() => {
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

    if (showTimezones) {
      baseCols.push(
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
          renderCell: ({ row }) => (
            <StyledMonospaceLabel variant="labelMd">{row.teacherTime ?? ""}</StyledMonospaceLabel>
          ),
        },
        {
          field: "studentTime",
          headerName: headers.studentTime,
          width: 150,
          flex: 1,
          renderCell: ({ row }) => (
            <StyledMonospaceLabel variant="labelMd">{row.studentTime ?? ""}</StyledMonospaceLabel>
          ),
        }
      );
    } else {
      baseCols.push({
        field: "time",
        headerName: headers.time,
        width: 130,
        flex: 1,
        renderCell: ({ row }) => <StyledMonospaceLabel variant="labelMd">{row.time}</StyledMonospaceLabel>,
      });
    }

    baseCols.push(
      {
        field: "status",
        headerName: headers.status,
        width: 130,
        renderCell: ({ row }) => (
          <StatusBadge category="classStatus" status={CLASS_STATUS_MAP[row.status]} label={statusLabels[row.status]} />
        ),
      },
      {
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
      }
    );

    return baseCols;
  }, [detailsLabel, headers, statusLabels, showTimezones, router, locale]);

  return (
    <AppDataGrid<ScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.classId}
      autoHeight
      rowHeight={60}
      hideFooter={rows.length <= 10}
      ariaLabel="schedule-overview-table"
      emptyMessage={emptyMessage}
      columnVisibilityModel={{
        teacher: true,
        time: !showTimezones,
        yourTime: showTimezones,
        teacherTime: showTimezones,
        studentTime: showTimezones,
      }}
      sx={{
        "& .MuiDataGrid-columnHeader[data-field='teacher'], & .MuiDataGrid-cell[data-field='teacher']": {
          display: { xs: "none", md: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='time'], & .MuiDataGrid-cell[data-field='time']": {
          display: { xs: "none", sm: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='yourTime'], & .MuiDataGrid-cell[data-field='yourTime']": {
          display: { xs: "none", sm: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='teacherTime'], & .MuiDataGrid-cell[data-field='teacherTime']": {
          display: { xs: "none", md: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='studentTime'], & .MuiDataGrid-cell[data-field='studentTime']": {
          display: { xs: "none", md: "flex" },
        },
      }}
    />
  );
}
