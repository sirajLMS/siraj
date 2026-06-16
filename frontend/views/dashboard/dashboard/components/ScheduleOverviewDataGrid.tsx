"use client";

import { Details as DetailsIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { ClassStatus, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";

interface ScheduleOverviewDataGridProps {
  readonly rows: readonly ScheduleRow[];
  readonly headers: {
    readonly classId: string;
    readonly student: string;
    readonly teacher: string;
    readonly time: string;
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
  const columns = useMemo<GridColDef<ScheduleRow>[]>(
    () => [
      {
        field: "classId",
        headerName: headers.classId,
        width: 120,
        renderCell: ({ row }) => <MonospaceLabel value={row.classId} />,
      },
      {
        field: "student",
        headerName: headers.student,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={{ fontWeight: 500, alignSelf: "center" }}>
            {row.student}
          </Typography>
        ),
      },
      {
        field: "teacher",
        headerName: headers.teacher,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, alignSelf: "center" })}>
            {row.teacher}
          </Typography>
        ),
      },
      {
        field: "time",
        headerName: headers.time,
        width: 130,
        flex: 1,
        renderCell: ({ row }) => <MonospaceLabel value={row.time} />,
      },
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
        renderCell: () => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", alignSelf: "center", height: "100%" }}>
            <Box>
              <Tooltip title={detailsLabel}>
                <IconButton
                  size="small"
                  sx={theme => ({
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  })}
                >
                  <DetailsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ),
      },
    ],
    [detailsLabel, headers, statusLabels]
  );

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
        time: true,
      }}
      sx={{
        "& .MuiDataGrid-columnHeader[data-field='teacher'], & .MuiDataGrid-cell[data-field='teacher']": {
          display: { xs: "none", md: "flex" },
        },
        "& .MuiDataGrid-columnHeader[data-field='time'], & .MuiDataGrid-cell[data-field='time']": {
          display: { xs: "none", sm: "flex" },
        },
      }}
    />
  );
}

function MonospaceLabel({ value }: Readonly<{ value: string }>) {
  return (
    <Typography
      variant="labelMd"
      sx={theme => ({
        fontFamily: "monospace",
        color: theme.palette.text.secondary,
        fontWeight: 500,
        alignSelf: "center",
      })}
    >
      {value}
    </Typography>
  );
}
