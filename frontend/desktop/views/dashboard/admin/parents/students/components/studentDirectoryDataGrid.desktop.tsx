"use client";

import { HistoryOutlined, InfoOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, PersonProfileLinkCell } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { ClassesLeftProgress } from "@/frontend/common/views/dashboard/admin/parents/students/components/ClassesLeftProgress";
import type {
  StudentDirectoryDataGridLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";

interface StudentDirectoryDataGridProps {
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly labels: StudentDirectoryDataGridLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly onViewProfile: (id: string) => void;
  readonly onViewHistory: (id: string) => void;
  readonly loading?: boolean;
}

function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

export function StudentDirectoryDataGrid({
  rows,
  labels,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  onViewProfile,
  onViewHistory,
  loading = false,
}: Readonly<StudentDirectoryDataGridProps>) {
  const columns = useMemo<GridColDef<StudentDirectoryRowExtended>[]>(
    () => [
      {
        field: "index",
        headerName: labels.index,
        width: 72,
        sortable: false,
        renderCell: ({ row }) => (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {String(row.index).padStart(2, "0")}
          </Typography>
        ),
      },
      {
        field: "name",
        headerName: labels.student,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <PersonProfileLinkCell
            href={row.id ? studentHref(row.id) : undefined}
            name={row.name ?? ""}
            avatarUrl={row.avatarUrl}
            avatarSize={40}
            typographyVariant="bodyLg"
            fontWeight={600}
          />
        ),
      },
      {
        field: "email",
        headerName: labels.email,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.email}
          </Typography>
        ),
      },
      {
        field: "accountStatus",
        headerName: labels.status,
        width: 140,
        renderCell: ({ row }) => (
          <StatusBadge
            category="studentAccount"
            status={row.accountStatus}
            label={labels.statusLabels[row.accountStatus]}
          />
        ),
      },
      {
        field: "hoursPerWeek",
        headerName: labels.hoursPerWeek,
        width: 120,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 500, color: theme.palette.primary.main })}>
            {formatHours(row.hoursPerWeek ?? 0)}
          </Typography>
        ),
      },
      {
        field: "classesRemaining",
        headerName: labels.classesLeft,
        width: 160,
        sortable: false,
        renderCell: ({ row }) => (
          <ClassesLeftProgress
            remaining={row.classesRemaining ?? 0}
            total={row.classesTotal ?? 0}
            accountStatus={row.accountStatus}
          />
        ),
      },
      {
        field: "actions",
        headerName: labels.actions,
        width: 110,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "flex-end" }}>
            <Box
              sx={{ display: "flex", gap: 0.5 }}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <Tooltip title={labels.viewProfile}>
                <IconButton
                  id={`student-info-${row.id}`}
                  size="small"
                  onClick={() => {
                    onViewProfile(row.id ?? "");
                  }}
                  sx={theme => ({
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  })}
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={labels.viewHistory}>
                <IconButton
                  id={`student-history-${row.id}`}
                  size="small"
                  onClick={() => {
                    onViewHistory(row.id ?? "");
                  }}
                  sx={theme => ({
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  })}
                >
                  <HistoryOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ),
      },
    ],
    [labels, onViewHistory, onViewProfile]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <AppDataGrid<StudentDirectoryRowExtended>
      rows={rows}
      columns={columns}
      getRowId={row => row.id ?? ""}
      loading={loading}
      autoHeight
      ariaLabel="student-directory-table"
      emptyMessage={labels.noEntries}
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: totalCount,
            paginationModel: { page, pageSize },
            onPaginationModelChange: model => {
              onPageChange(model.page);
            },
            pageSizeOptions: [pageSize],
            slots: { pagination: GridPagination },
          }
        : {})}
      onRowClick={(params: GridRowParams<StudentDirectoryRowExtended>) => {
        onViewProfile(params.row.id ?? "");
      }}
      getRowClassName={({ row }) => (row.isDeactivated ? "student-row-deactivated" : "")}
      sx={{
        "& .student-row-deactivated": { opacity: 0.8 },
        "& .MuiDataGrid-row": { cursor: "pointer" },
      }}
    />
  );
}
