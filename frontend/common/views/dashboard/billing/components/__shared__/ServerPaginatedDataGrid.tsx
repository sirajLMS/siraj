"use client";

import type { GridColDef, GridValidRowModel } from "@mui/x-data-grid";
import { AppDataGrid } from "@/frontend/common/components/ui";
import { getServerPaginationOptions } from "@/frontend/common/components/ui/filter/serverPaginationProps";

export interface ServerPaginatedDataGridProps<R extends GridValidRowModel> {
  readonly rows: readonly R[];
  readonly columns: readonly GridColDef<R>[];
  readonly emptyMessage?: string;
  readonly ariaLabel?: string;
  readonly getRowId?: (row: R) => string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

export function ServerPaginatedDataGrid<R extends GridValidRowModel>({
  rows,
  columns,
  emptyMessage,
  ariaLabel,
  getRowId,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ServerPaginatedDataGridProps<R>>) {
  return (
    <AppDataGrid<R>
      rows={rows as R[]}
      columns={columns as GridColDef<R>[]}
      loading={loading}
      getRowId={getRowId}
      emptyMessage={emptyMessage}
      ariaLabel={ariaLabel}
      paginationOptions={
        getServerPaginationOptions({ page, pageSize }, totalCount, onPageChange) || { mode: "client" }
      }
    />
  );
}
