"use client";

import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import { Box, Chip, Stack } from "@mui/material";
import { DangerActionButton, ExportButton, FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface CarryoverToolbarProps {
  readonly labels: CarryoverLabels;
  readonly exporting: boolean;
  /** Visible rows that are part of the current bulk selection. */
  readonly selectedRows: readonly CarryoverRow[];
  /** True when every selected row is unpaid (bulk-to-expense precondition). */
  readonly selectionAllUnpaid: boolean;
  /** False hides the manager-only bulk actions and the Add New entry point. */
  readonly canManageCarryover: boolean;
  readonly onOpenForm: (row: CarryoverRow | null) => void;
  readonly onOpenBulkToExpense: () => void;
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  readonly onExportCsv: () => void;
}

/**
 * List toolbar: CSV export for every viewer (read-level operation) and, for
 * managers, the bulk actions on the store-driven selection plus the Add New
 * entry point. `marginInlineStart: "auto"` keeps the trailing edge RTL-correct.
 */
export function CarryoverToolbar({
  labels,
  exporting,
  selectedRows,
  selectionAllUnpaid,
  canManageCarryover,
  onOpenForm,
  onOpenBulkToExpense,
  onOpenDelete,
  onExportCsv,
}: Readonly<CarryoverToolbarProps>) {
  const hasSelection = selectedRows.length > 0;
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
      {canManageCarryover ? (
        <>
          <FilterButton
            id="carryover-bulk-to-expense"
            size="small"
            startIcon={<ReceiptLongOutlined />}
            disabled={!hasSelection || !selectionAllUnpaid}
            onClick={onOpenBulkToExpense}
          >
            {labels.action.bulkToExpense}
          </FilterButton>
          <DangerActionButton
            id="carryover-bulk-delete"
            size="small"
            startIcon={<DeleteOutlined />}
            disabled={!hasSelection}
            onClick={() => onOpenDelete(selectedRows)}
          >
            {labels.action.bulkDelete}
          </DangerActionButton>
          {hasSelection ? (
            <Chip
              id="carryover-selection-count"
              size="small"
              variant="outlined"
              label={labels.selectedCount(selectedRows.length)}
            />
          ) : null}
        </>
      ) : null}
      <Box sx={{ marginInlineStart: "auto", display: "flex", gap: 1 }}>
        <ExportButton
          id="carryover-export-csv"
          startIcon={<FileDownloadOutlined />}
          disabled={exporting}
          onClick={onExportCsv}
          size="small"
        >
          {labels.action.exportCsv}
        </ExportButton>
        {canManageCarryover ? (
          <PrimaryPageAction
            id="carryover-add-new"
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
