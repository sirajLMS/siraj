"use client";

import type { GridRowParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  ParentDirectoryRow,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { buildParentDirectoryColumns } from "@/frontend/desktop/views/dashboard/admin/parents/home/components/parentsDataGrid.columns";

// The desktop variant renders a data grid over `ParentDirectoryRow`; the mobile
// twin is `ParentCardListMobile` with a different label contract. The row shape
// lives once in `directory.ts`.
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
  // Pre-computed by the ViewModel (`useParentsViewModel`); gates the lifecycle
  // management IconButton that was previously wrapped in `<RequirePermission>`.
  canParentManageStatus,
}: Readonly<ParentsDataGridDesktopProps>) {
  const columns = useMemo(
    () => buildParentDirectoryColumns({ labels, onOpenSettings, canParentManageStatus }),
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
