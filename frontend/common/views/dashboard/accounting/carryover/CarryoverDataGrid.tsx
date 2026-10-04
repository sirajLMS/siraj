"use client";

import { Stack } from "@mui/material";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { usePageLocalRowSelection } from "@/frontend/common/components/ui/dataGrid/usePageLocalRowSelection";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ErrorState } from "@/frontend/common/components/ui/state";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useCarryoverColumns } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.columns.hooks";
import { CarryoverAggregateFooter } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.footer";
import {
  selectedVisibleRows,
  selectionIsAllUnpaid,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.helpers";
import { createCarryoverNoRowsOverlay } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.noRowsOverlay";
import {
  EMPTY_GRID_MIN_HEIGHT_SX,
  HEADER_WRAP_SX,
  SCROLLBAR_CUE_SX,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.styles";
import { CarryoverToolbar } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.toolbar";
import type {
  CarryoverDataGridProps,
  CarryoverDialogCallbacks,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.types";
import { useCarryoverExport } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverExport";
import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";

export type { CarryoverDataGridProps, CarryoverDialogCallbacks };

/**
 * Carryover balance list grid: teacher/students/duration/money columns, paid and
 * disabled-teacher chips, per-row action menu (View Sessions for viewers, the
 * write actions for managers only), a toolbar whose Export CSV is available to
 * every viewer while bulk actions and Add New stay manager-gated, store-backed
 * checkbox selection, and the aggregate footer. Selection clears on page turns
 * so the bulk actions always act on rows the operator can see.
 */
export function CarryoverDataGrid({
  labels,
  rows,
  totalCount,
  aggregates,
  isLoading,
  error,
  refetch,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  selectedIds,
  toggleSelected,
  clearSelection,
  canManageCarryover,
  handleExportCsv,
  onOpenForm,
  onOpenBulkToExpense,
  onOpenDelete,
  onOpenUnpay,
  onOpenDrawer,
}: Readonly<CarryoverDataGridProps>) {
  const locale = useAppLocale();
  const paymentsLabels = useAppTranslation(DashboardAccountingPayments);
  const { exporting, runExport } = useCarryoverExport(handleExportCsv, labels);

  const columns = useCarryoverColumns({
    labels,
    actionsColumnLabel: paymentsLabels.columns.actions,
    createdAtColumnLabel: paymentsLabels.columns.createdAt,
    locale,
    canManageCarryover,
    onOpenForm,
    onOpenBulkToExpense,
    onOpenDelete,
    onOpenUnpay,
    onOpenDrawer,
  });
  const selection = usePageLocalRowSelection({
    selectedIds,
    toggleSelected,
    clearSelection,
    onPageChange,
    onPageSizeChange,
  });

  const selectedRows = useMemo(() => selectedVisibleRows(rows, selectedIds), [rows, selectedIds]);
  const allUnpaidSelected = selectionIsAllUnpaid(selectedRows);

  const noRowsOverlay = useMemo(() => createCarryoverNoRowsOverlay(labels), [labels]);

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      <CarryoverToolbar
        labels={labels}
        exporting={exporting}
        selectedRows={selectedRows}
        selectionAllUnpaid={allUnpaidSelected}
        canManageCarryover={canManageCarryover}
        onOpenForm={onOpenForm}
        onOpenBulkToExpense={onOpenBulkToExpense}
        onOpenDelete={onOpenDelete}
        onExportCsv={runExport}
      />
      {error !== null ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <AppDataGrid<CarryoverRow>
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={row => row.id ?? ""}
          ariaLabel={labels.title}
          slots={{ noRowsOverlay }}
          sx={
            rows.length === 0
              ? [HEADER_WRAP_SX, SCROLLBAR_CUE_SX, EMPTY_GRID_MIN_HEIGHT_SX]
              : [HEADER_WRAP_SX, SCROLLBAR_CUE_SX]
          }
          disableColumnMenu
          disableRowSelectionOnClick
          checkboxSelection={canManageCarryover}
          rowSelectionModel={selection.rowSelectionModel}
          onRowSelectionModelChange={selection.onSelectionChange}
          paginationOptions={buildServerPaginationOptions({
            page,
            pageSize,
            totalCount,
            onPageChange: selection.onPageChange,
            onPageSizeChange: selection.onPageSizeChange,
            pageSizeOptions,
          })}
        />
      )}
      <CarryoverAggregateFooter aggregates={aggregates} totalCount={totalCount} labels={labels} />
    </Stack>
  );
}
