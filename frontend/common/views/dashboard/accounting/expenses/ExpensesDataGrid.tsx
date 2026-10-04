"use client";

import { Stack } from "@mui/material";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { usePageLocalRowSelection } from "@/frontend/common/components/ui/dataGrid/usePageLocalRowSelection";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ErrorState } from "@/frontend/common/components/ui/state";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useExpensesColumns } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.columns";
import { ExpensesEmptyState } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.empty";
import { ExpensesAggregateFooter } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.footer";
import {
  EXPENSES_EMPTY_GRID_MIN_HEIGHT_SX,
  EXPENSES_SCROLLBAR_CUE_SX,
  type ExpensesDataGridProps,
  type ExpensesDialogCallbacks,
  selectedVisibleRows,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.helpers";
import { useExpensesExport } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.hooks";
import { ExpensesToolbar } from "@/frontend/common/views/dashboard/accounting/expenses/ExpensesDataGrid.toolbar";
import type { ExpenseRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export type { ExpensesDataGridProps, ExpensesDialogCallbacks };

/**
 * Builds the zero-row slot component with the empty-state copy bound. Mirroring
 * the data-grid overlay factories, the slot component is built by a
 * module-scope factory: oxlint forbids defining components inline inside a
 * render function.
 */
function createExpensesNoRowsOverlay(labels: ExpensesLabels): React.ComponentType {
  return function ExpensesNoRowsOverlay() {
    return <ExpensesEmptyState heading={labels.title} hint={labels.empty} />;
  };
}

/**
 * Expense ledger list grid: title/type/teacher/money/dates/source/note columns
 * with a deleted banner row state, per-row action menu (View Source for every
 * viewer, Edit/Delete for managers), a toolbar whose Export CSV is available to
 * every viewer while Bulk Delete and Add New stay manager-gated, store-backed
 * checkbox selection, and the aggregate footer. Selection clears on page turns
 * so the bulk actions always act on rows the operator can see.
 */
export function ExpensesDataGrid({
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
  canManageExpenses,
  handleExportCsv,
  onOpenForm,
  onOpenDelete,
  onViewSource,
}: Readonly<ExpensesDataGridProps>) {
  const locale = useAppLocale();
  const { exporting, runExport } = useExpensesExport(handleExportCsv, labels);

  const columns = useExpensesColumns({
    labels,
    locale,
    canManageExpenses,
    onOpenForm,
    onOpenDelete,
    onViewSource,
  });
  const selection = usePageLocalRowSelection({
    selectedIds,
    toggleSelected,
    clearSelection,
    onPageChange,
    onPageSizeChange,
  });

  const selectedRows = useMemo(() => selectedVisibleRows(rows, selectedIds), [rows, selectedIds]);
  const noRowsOverlay = useMemo(() => createExpensesNoRowsOverlay(labels), [labels]);

  return (
    <Stack sx={{ gap: 1.5, width: "100%" }}>
      <ExpensesToolbar
        labels={labels}
        exporting={exporting}
        selectedRows={selectedRows}
        canManageExpenses={canManageExpenses}
        onOpenForm={onOpenForm}
        onOpenDelete={onOpenDelete}
        onExportCsv={runExport}
      />
      {error !== null ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <AppDataGrid<ExpenseRow>
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={row => row.id ?? ""}
          ariaLabel={labels.title}
          slots={{ noRowsOverlay }}
          sx={
            rows.length === 0
              ? [EXPENSES_EMPTY_GRID_MIN_HEIGHT_SX, EXPENSES_SCROLLBAR_CUE_SX]
              : EXPENSES_SCROLLBAR_CUE_SX
          }
          disableColumnMenu
          disableRowSelectionOnClick
          checkboxSelection={canManageExpenses}
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
      <ExpensesAggregateFooter aggregates={aggregates} totalCount={totalCount} labels={labels} />
    </Stack>
  );
}
