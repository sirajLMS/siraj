"use client";

import {
  CheckCircleOutlined as CheckIcon,
  ErrorOutlined as ErrorIcon,
  TuneOutlined as LifecycleIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type {
  ParentDirectoryRow,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/directory";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";
import { Link } from "@/shared/i18n";

export type { ParentsDataGridLabels };

// VARIANT JUSTIFICATION: Class C card-list vs data-grid sibling per specs §4.3 — `ParentsDataGridDesktopProps` renders a desktop data grid (taking the type-specific `ParentsDataGridLabels`). The mobile twin is the `ParentCardListMobile` rendering single-row mobile cards with a different label contract. The shared row shape (`ParentDirectoryRow`) already lives once in `directory.ts`.
//
// NEW FOR PLAN v5: added the `canParentManageStatus` boolean (lifted from the
// previously-inline `<RequirePermission permissions={[AppPermission.ParentManageStatus]}>`
// wrapper per specs.md §3 N3 + §6.1).
interface ParentsDataGridDesktopProps {
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsDataGridLabels;
  readonly onOpenSettings: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
  readonly canParentManageStatus: boolean;
}

export function ParentsDataGridDesktop({
  rows,
  labels,
  onOpenSettings,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading = false,
  // NEW FOR PLAN v5: replaces the inline `<RequirePermission>` wrapper that
  // used to enclose the lifecycle-management IconButton. The gate is computed
  // once by the ViewModel (`useParentsViewModel`) and handed down as a prop.
  canParentManageStatus,
}: Readonly<ParentsDataGridDesktopProps>) {
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
          <DesktopPersonProfileLinkCell
            href={profileHrefForParent({ userId: row.userId, parentId: row.id })}
            name={row.name}
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
          <DesktopStatusBadge
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
          <DesktopStatusBadge
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
            {canParentManageStatus ? (
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
            ) : null}
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
    [labels, onOpenSettings, canParentManageStatus]
  );

  return (
    <DesktopAppDataGrid<ParentDirectoryRow>
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
      paginationOptions={
        totalCount !== undefined && page !== undefined && pageSize !== undefined && onPageChange
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [10, 25, 50],
            })
          : { mode: "client" }
      }
      sx={{
        "& .MuiDataGrid-row": { cursor: "pointer" },
      }}
    />
  );
}
