"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

interface QuotaListDesktopGridProps {
  readonly quotas: readonly QuotaItem[];
  readonly columns: GridColDef<QuotaItem>[];
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly t: QuotaLabels;
}

export function QuotaListDesktopGrid({
  quotas,
  columns,
  loading,
  page,
  pageSize,
  totalCount,
  setPage,
  setPageSize,
  t,
}: Readonly<QuotaListDesktopGridProps>) {
  return (
    <Box sx={{ width: "100%", height: 600 }}>
      <DesktopAppDataGrid<QuotaItem>
        rows={quotas}
        columns={columns}
        loading={loading}
        ariaLabel={t.listTitle}
        emptyMessage={t.noQuotas}
        paginationOptions={buildServerPaginationOptions({
          page,
          pageSize,
          totalCount,
          onPageChange: (newPage: number) => setPage(newPage),
          onPageSizeChange: (newPageSize: number) => setPageSize(newPageSize),
        })}
      />
    </Box>
  );
}
