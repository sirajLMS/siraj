"use client";

import { Box } from "@mui/material";
import { useMemo } from "react";
import type { ReportsDataGridProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui";
import { buildReportsDataGridColumns } from "@/frontend/desktop/views/dashboard/reports/components/reportsDataGridColumns.desktop";

export function ReportsDataGridDesktop({
  rows,
  labels,
  reportType,
  loading = false,
  onRowClick,
  showFinancials,
  formatPaidAmounts,
}: Readonly<ReportsDataGridProps>) {
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — the columns array contains
  // renderCell closures that capture labels/locale/handlers; without memo
  // every render produces a new column-array identity and forces the data
  // grid to re-mount its virtualized row slices. Memoizing preserves JSX
  // identity ONLY; no data derivation happens here.
  const columns = useMemo(
    () => buildReportsDataGridColumns({ labels, reportType, showFinancials, formatPaidAmounts }),
    [labels, reportType, showFinancials, formatPaidAmounts]
  );

  return (
    <Box sx={{ px: { xs: 0, md: 1 }, pb: 1 }}>
      <DesktopAppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={labels.noEntries}
        autoHeight
        disableColumnMenu
        paginationOptions={{ mode: "client" }}
        onRowClick={
          onRowClick
            ? params => {
                onRowClick(params.row);
              }
            : undefined
        }
        sx={{ "& .MuiDataGrid-row": onRowClick ? { cursor: "pointer" } : {} }}
      />
    </Box>
  );
}
