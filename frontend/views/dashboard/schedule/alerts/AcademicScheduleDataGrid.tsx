"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { ClassSessionActionButton } from "./ClassSessionActionButton";
import type { AcademicClassRow, ClassSessionStatus } from "./types";

export interface AcademicScheduleDataGridLabels {
  readonly className: string;
  readonly instructor: string;
  readonly time: string;
  readonly room: string;
  readonly status: string;
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly viewRecording: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly noEntries: string;
}

interface AcademicScheduleDataGridProps {
  readonly rows: readonly AcademicClassRow[];
  readonly labels: AcademicScheduleDataGridLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalClasses?: number;
  readonly onJoin: (id: string) => void;
  readonly onLeave: (id: string) => void;
  readonly onPageChange?: (page: number) => void;
}

const SESSION_STATUS_LABELS: Record<ClassSessionStatus, keyof AcademicScheduleDataGridLabels> = {
  active: "active",
  upcoming: "upcoming",
  missed: "missed",
};

export function AcademicScheduleDataGrid({
  rows,
  page = 0,
  pageSize = 10,
  totalClasses,
  labels,
  onJoin,
  onLeave,
  onPageChange,
}: AcademicScheduleDataGridProps) {
  const columns = useMemo<GridColDef<AcademicClassRow>[]>(() => {
    const actionLabels = {
      joinSession: labels.joinSession,
      leaveClass: labels.leaveClass,
      viewRecording: labels.viewRecording,
    };

    return [
      {
        field: "className",
        headerName: labels.className,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              height: "100%",
              justifyContent: "center",
            }}
          >
            <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
              {row.className}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              ID: {row.classId}
            </Typography>
          </Box>
        ),
      },
      {
        field: "instructor",
        headerName: labels.instructor,
        flex: 1,
        minWidth: 140,
      },
      {
        field: "time",
        headerName: labels.time,
        flex: 1,
        minWidth: 160,
      },
      {
        field: "room",
        headerName: labels.room,
        width: 130,
      },
      {
        field: "sessionStatus",
        headerName: labels.status,
        width: 280,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 2,
              width: "100%",
              height: "100%",
            }}
          >
            <StatusBadge
              category="classSession"
              status={row.sessionStatus}
              label={labels[SESSION_STATUS_LABELS[row.sessionStatus]]}
            />
            <ClassSessionActionButton
              action={row.action}
              classId={row.id}
              labels={actionLabels}
              onJoin={onJoin}
              onLeave={onLeave}
            />
          </Box>
        ),
      },
    ];
  }, [labels, onJoin, onLeave]);

  const isServerPagination = totalClasses !== undefined && onPageChange !== undefined;

  return (
    <AppDataGrid<AcademicClassRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      autoHeight
      rowHeight={100}
      ariaLabel="academic-schedule-table"
      emptyMessage={labels.noEntries}
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: totalClasses,
            paginationModel: { page, pageSize },
            onPaginationModelChange: model => {
              onPageChange(model.page);
            },
            pageSizeOptions: [pageSize],
            slots: { pagination: GridPagination },
          }
        : {})}
    />
  );
}
