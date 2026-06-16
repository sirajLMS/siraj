"use client";

import {
  CheckCircleOutlined as CheckIcon,
  ErrorOutlined as ErrorIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { ParentAccountStatus, ParentDirectoryRow } from "@/frontend/stores/parentsStore";

export interface ParentsDataGridLabels {
  readonly index: string;
  readonly image: string;
  readonly name: string;
  readonly email: string;
  readonly time: string;
  readonly status: string;
  readonly unpaidInvoices: string;
  readonly options: string;
  readonly noEntries: string;
  readonly guardianOf: (name: string) => string;
  readonly statusLabels: Record<ParentAccountStatus, string>;
}

interface ParentsDataGridProps {
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsDataGridLabels;
  readonly onOpenSettings: (id: string) => void;
}

export function ParentsDataGrid({ rows, labels, onOpenSettings }: Readonly<ParentsDataGridProps>) {
  const columns = useMemo<GridColDef<ParentDirectoryRow>[]>(
    () => [
      {
        field: "index",
        headerName: labels.index,
        width: 72,
        sortable: false,
        renderCell: ({ row }) => (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.index}
          </Typography>
        ),
      },
      {
        field: "image",
        headerName: labels.image,
        width: 80,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Avatar
              src={row.avatarUrl}
              alt={row.name}
              sx={{ width: 40, height: 40, border: theme => `1px solid ${theme.palette.border.light}` }}
            />
          </Box>
        ),
      },
      {
        field: "name",
        headerName: labels.name,
        flex: 1.5,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Stack sx={{ justifyContent: "center", height: "100%" }}>
            <Typography variant="bodyLg" sx={theme => ({ fontWeight: 600, color: theme.palette.primary.main })}>
              {row.name}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontSize: "12px" })}>
              {labels.guardianOf(row.guardianOf)}
            </Typography>
          </Stack>
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
        field: "time",
        headerName: labels.time,
        width: 120,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.time}
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
        field: "unpaidInvoices",
        headerName: labels.unpaidInvoices,
        width: 160,
        renderCell: ({ row }) => {
          const hasUnpaid = row.unpaidInvoices > 0;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: "100%" }}>
              {hasUnpaid ? (
                <>
                  <ErrorIcon sx={theme => ({ color: theme.palette.error.main, fontSize: 18 })} />
                  <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main, fontWeight: 700 })}>
                    Yes ({row.unpaidInvoices})
                  </Typography>
                </>
              ) : (
                <>
                  <CheckIcon sx={theme => ({ color: theme.palette.success.main, fontSize: 18 })} />
                  <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.success.main })}>
                    No
                  </Typography>
                </>
              )}
            </Box>
          );
        },
      },
      {
        field: "actions",
        headerName: labels.options,
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onOpenSettings(row.id);
              }}
              sx={theme => ({
                bgcolor: alpha(theme.palette.info.main, 0.08),
                color: theme.palette.info.main,
                borderRadius: 1.5,
                "&:hover": {
                  bgcolor: theme.palette.info.main,
                  color: theme.palette.onInfo,
                },
              })}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    [labels, onOpenSettings]
  );

  return (
    <AppDataGrid<ParentDirectoryRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      autoHeight
      ariaLabel="parents-directory-table"
      emptyMessage={labels.noEntries}
      onRowClick={(params: GridRowParams<ParentDirectoryRow>) => {
        onOpenSettings(params.row.id);
      }}
      sx={{
        "& .MuiDataGrid-row": { cursor: "pointer" },
      }}
    />
  );
}
