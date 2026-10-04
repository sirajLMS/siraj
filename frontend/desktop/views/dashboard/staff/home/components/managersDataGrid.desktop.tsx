"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { BaseManagersListProps, Manager } from "@/frontend/common/views/dashboard/staff/home/types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildManagerColumns } from "@/frontend/desktop/views/dashboard/staff/home/components/managersDataGrid.columns";

const StyledDataGridWrapper = styled(Box)({
  width: "100%",
});

// VARIANT JUSTIFICATION: extra field loading — desktop data grid needs a `loading` prop because AppDataGrid accepts a loading slot while the mobile card list doesn't render a separate loading state (Class C variant per specs §4.3).
interface ManagersDataGridDesktopProps extends BaseManagersListProps {
  readonly loading?: boolean;
}

export function ManagersDataGridDesktop({
  labels,
  managers,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ManagersDataGridDesktopProps>) {
  const t = labels;

  // RENDER OPT JUSTIFICATION: AppDataGrid re-renders excessively when its `columns` prop identity changes between renders; this useMemo preserves a stable column-array reference keyed on the translated labels so cells don't recompute unnecessarily.
  const columns = useMemo<GridColDef<Manager>[]>(() => buildManagerColumns(labels), [labels]);

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <StyledDataGridWrapper>
      <DesktopAppDataGrid<Manager>
        rows={managers}
        columns={columns}
        getRowId={row => row.userId}
        emptyMessage={t.noEntries}
        loading={loading}
        autoHeight
        rowHeight={80}
        paginationOptions={
          isServerPagination
            ? buildServerPaginationOptions({
                page,
                pageSize,
                totalCount,
                onPageChange,
                pageSizeOptions: [pageSize],
              })
            : { mode: "client" }
        }
      />
    </StyledDataGridWrapper>
  );
}
