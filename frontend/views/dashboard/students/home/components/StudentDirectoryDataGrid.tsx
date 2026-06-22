"use client";

import { HistoryOutlined, InfoOutlined } from "@mui/icons-material";
import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { StudentAccountStatus, StudentDirectoryRow } from "../types";
import { ClassesLeftProgress } from "./ClassesLeftProgress";

export interface StudentDirectoryDataGridLabels {
  readonly index: string;
  readonly student: string;
  readonly email: string;
  readonly status: string;
  readonly hoursPerWeek: string;
  readonly classesLeft: string;
  readonly actions: string;
  readonly viewProfile: string;
  readonly viewHistory: string;
  readonly noEntries: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
}

interface StudentDirectoryDataGridProps {
  readonly rows: readonly StudentDirectoryRow[];
  readonly labels: StudentDirectoryDataGridLabels;
  readonly onViewProfile: (id: string) => void;
  readonly onViewHistory: (id: string) => void;
}

function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

export function StudentDirectoryDataGrid({
  rows,
  labels,
  onViewProfile,
  onViewHistory,
}: StudentDirectoryDataGridProps) {
  const columns = useMemo<GridColDef<StudentDirectoryRow>[]>(
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
            <Avatar src={row.avatarUrl} alt={row.name} sx={{ width: 40, height: 40 }} />
            <Typography variant="bodyLg" sx={theme => ({ fontWeight: 600, color: theme.palette.primary.main })}>
              {row.name}
            </Typography>
          </Box>
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
            {formatHours(row.hoursPerWeek)}
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
            remaining={row.classesRemaining}
            total={row.classesTotal}
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
                    onViewProfile(row.id);
                  }}
                  sx={theme => ({
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
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
                    onViewHistory(row.id);
                  }}
                  sx={theme => ({
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
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

  return (
    <AppDataGrid<StudentDirectoryRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      autoHeight
      ariaLabel="student-directory-table"
      emptyMessage={labels.noEntries}
      onRowClick={(params: GridRowParams<StudentDirectoryRow>) => {
        onViewProfile(params.row.id);
      }}
      getRowClassName={({ row }) => (row.isDeactivated ? "student-row-deactivated" : "")}
      sx={{
        "& .student-row-deactivated": { opacity: 0.8 },
        "& .MuiDataGrid-row": { cursor: "pointer" },
      }}
    />
  );
}
