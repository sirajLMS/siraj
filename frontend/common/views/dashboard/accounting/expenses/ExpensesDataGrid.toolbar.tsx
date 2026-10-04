"use client";

import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { Box, Chip, Stack } from "@mui/material";
import { DangerActionButton, ExportButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { ExpenseRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface ExpensesToolbarProps {
  readonly labels: ExpensesLabels;
  readonly exporting: boolean;
  /** Visible rows that are part of the current bulk selection. */
  readonly selectedRows: readonly ExpenseRow[];
  /** False hides the manager-only bulk action and the Add New entry point. */
  readonly canManageExpenses: boolean;
  readonly onOpenForm: (row: ExpenseRow | null) => void;
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  readonly onExportCsv: () => void;
}

/**
 * List toolbar: CSV export for every viewer (read-level operation) and, for
 * managers, the bulk delete on the store-driven selection plus the Add New
 * entry point. `marginInlineStart: "auto"` keeps the trailing edge RTL-correct.
 */
export function ExpensesToolbar({
  labels,
  exporting,
  selectedRows,
  canManageExpenses,
  onOpenForm,
  onOpenDelete,
  onExportCsv,
}: Readonly<ExpensesToolbarProps>) {
  const hasSelection = selectedRows.length > 0;
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
      {canManageExpenses ? (
        <>
          <DangerActionButton
            id="expenses-bulk-delete"
            size="small"
            startIcon={<DeleteOutlined />}
            disabled={!hasSelection}
            onClick={() => onOpenDelete(selectedRows)}
          >
            {labels.action.bulkDelete}
          </DangerActionButton>
          {hasSelection ? (
            <Chip
              id="expenses-selection-count"
              size="small"
              variant="outlined"
              label={labels.selectedCount(selectedRows.length)}
            />
          ) : null}
        </>
      ) : null}
      <Box sx={{ marginInlineStart: "auto", display: "flex", gap: 1 }}>
        <ExportButton
          id="expenses-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting}
          onClick={onExportCsv}
          size="small"
        >
          {labels.action.exportCsv}
        </ExportButton>
        {canManageExpenses ? (
          <PrimaryPageAction
            id="expenses-add-new"
            size="small"
            startIcon={<AddOutlined />}
            onClick={() => onOpenForm(null)}
          >
            {labels.action.addNew}
          </PrimaryPageAction>
        ) : null}
      </Box>
    </Stack>
  );
}
