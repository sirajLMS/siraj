"use client";

import {
  CheckCircleOutlined as CheckIcon,
  ErrorOutlined as ErrorIcon,
  TuneOutlined as LifecycleIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { ViewAsUserButton } from "@/frontend/components/auth/ViewAsUserButton";
import { GridPagination, PersonProfileLinkCell } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { AppDataGrid } from "@/frontend/components/ui/dataGrid/AppDataGrid";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { profileHrefForParent } from "@/frontend/utils/profileHref";
import type {
  ParentAccountStatusKey,
  ParentDirectoryRow,
} from "@/frontend/views/dashboard/admin/parents/home/directory";
import type { ParentLifecycleStatus } from "@/frontend/views/dashboard/types/parent.types";
import { Link } from "@/shared/i18n/routing";

export interface ParentsDataGridLabels {
  readonly index: string;
  readonly image: string;
  readonly name: string;
  readonly email: string;
  readonly time: string;
  readonly status: string;
  readonly accountStatus: string;
  readonly unpaidInvoices: string;
  readonly options: string;
  readonly noEntries: string;
  readonly guardianOf: (name: string) => string;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly accountStatusLabels: Record<ParentAccountStatusKey, string>;
  readonly manageLifecycle: string;
}

interface ParentsDataGridProps {
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsDataGridLabels;
  readonly onOpenSettings: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

export function ParentsDataGrid({
  rows,
  labels,
  onOpenSettings,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ParentsDataGridProps>) {
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
        field: "name",
        headerName: labels.name,
        flex: 1.5,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Stack sx={{ justifyContent: "center", height: "100%" }}>
            <PersonProfileLinkCell
              href={profileHrefForParent({ userId: row.userId, parentId: row.id })}
              name={row.name}
              avatarUrl={row.avatarUrl}
              avatarSize={40}
              typographyVariant="bodyLg"
              fontWeight={600}
            />
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
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
        field: "lifecycleStatus",
        headerName: labels.status,
        width: 130,
        renderCell: ({ row }) => (
          <StatusBadge
            category="studentAccount"
            status={row.lifecycleStatus}
            label={labels.statusLabels[row.lifecycleStatus]}
          />
        ),
      },
      {
        field: "accountStatus",
        headerName: labels.accountStatus,
        width: 120,
        renderCell: ({ row }) => (
          <StatusBadge
            category="staffAccount"
            status={row.accountStatus}
            label={labels.accountStatusLabels[row.accountStatus]}
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
        width: 220,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", gap: 1 }}>
            {row.userId ? (
              <ViewAsUserButton variant="link" targetUserId={row.userId} targetUserName={row.name} />
            ) : null}
            <RequirePermission permissions={[AppPermission.ParentManageStatus]}>
              <Tooltip title={labels.manageLifecycle}>
                <IconButton
                  component={Link}
                  href={`/parents/${row.id}/lifecycle`}
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  sx={theme => ({
                    backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                    color: theme.palette.secondary.main,
                    borderRadius: 1.5,
                    "&:hover": {
                      backgroundColor: theme.palette.secondary.main,
                      color: theme.palette.onSecondary,
                    },
                  })}
                >
                  <LifecycleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </RequirePermission>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onOpenSettings(row.id);
              }}
              sx={theme => ({
                backgroundColor: alpha(theme.palette.info.main, 0.08),
                color: theme.palette.info.main,
                borderRadius: 1.5,
                "&:hover": {
                  backgroundColor: theme.palette.info.main,
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
      loading={loading}
      autoHeight
      ariaLabel="parents-directory-table"
      emptyMessage={labels.noEntries}
      onRowClick={(params: GridRowParams<ParentDirectoryRow>) => {
        onOpenSettings(params.row.id);
      }}
      {...(totalCount !== undefined && page !== undefined && pageSize !== undefined && onPageChange
        ? {
            paginationMode: "server",
            rowCount: totalCount,
            paginationModel: { page, pageSize },
            onPaginationModelChange: model => {
              onPageChange(model.page);
            },
            pageSizeOptions: [10, 25, 50],
            slots: { pagination: GridPagination },
          }
        : {})}
      sx={{
        "& .MuiDataGrid-row": { cursor: "pointer" },
      }}
    />
  );
}
