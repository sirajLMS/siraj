"use client";

import { Box, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ExportButton } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { PAGE_SIZE_OPTIONS } from "@/frontend/common/stores/payrollReportsFilterStore";
import { PayrollCsvExportShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/payrollCsvExportShared";
import { buildPayrollReportColumns } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid.columns";
import { AggregateFooter } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGridFooter.parts";
import type {
  PayrollReportRow,
  PayrollReportsViewModel,
} from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";

/**
 * View-model slice the payroll report grid renders from, plus the override
 * dialog opener. The override action only renders for operators holding the
 * payroll manage permission (`canManagePayroll`).
 */
export type PayrollReportsDataGridProps = Pick<
  PayrollReportsViewModel,
  | "labels"
  | "statusLabels"
  | "rows"
  | "loading"
  | "totalCount"
  | "page"
  | "pageSize"
  | "onPageChange"
  | "onPageSizeChange"
  | "aggregates"
  | "canManagePayroll"
  | "onExportCsv"
> & {
  readonly onOverride: (row: PayrollReportRow) => void;
};

export function PayrollReportsDataGrid({
  labels,
  statusLabels,
  rows,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  aggregates,
  canManagePayroll,
  onExportCsv,
  onOverride,
}: Readonly<PayrollReportsDataGridProps>) {
  const locale = useAppLocale();

  const columns = useMemo<GridColDef<PayrollReportRow>[]>(
    () => buildPayrollReportColumns({ labels, statusLabels, locale, canManagePayroll, onOverride }),
    [labels, statusLabels, locale, canManagePayroll, onOverride]
  );

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <PayrollCsvExportShared
          id="payroll-reports-export-csv"
          labels={labels}
          onExportCsv={onExportCsv}
          ButtonComponent={ExportButton}
        />
      </Box>
      <AppDataGrid<PayrollReportRow>
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={row => row.instanceId ?? row.id ?? ""}
        emptyMessage={labels.empty}
        ariaLabel={labels.title}
        disableColumnMenu
        paginationOptions={buildServerPaginationOptions({
          page,
          pageSize,
          totalCount,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        })}
      />
      <AggregateFooter aggregates={aggregates} labels={labels} statusLabels={statusLabels} />
    </Stack>
  );
}
