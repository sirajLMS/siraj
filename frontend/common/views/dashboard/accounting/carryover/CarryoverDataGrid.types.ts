import type {
  CarryoverRow,
  CarryoverViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/** Container callbacks that open the lifted dialogs/drawer for a row or the selection. */
export interface CarryoverDialogCallbacks {
  /** Opens the form dialog in add mode (`null` row) or edit mode (row snapshot). */
  readonly onOpenForm: (row: CarryoverRow | null) => void;
  /** Opens the bulk-to-expense dialog for the current selection. */
  readonly onOpenBulkToExpense: () => void;
  /** Opens the delete confirmation for the given rows (single row or the selection). */
  readonly onOpenDelete: (rows: readonly CarryoverRow[]) => void;
  /** Opens the unpay confirmation; only offered for paid rows. */
  readonly onOpenUnpay: (row: CarryoverRow) => void;
  /** Opens the detail drawer with the linked sessions for the row. */
  readonly onOpenDrawer: (row: CarryoverRow) => void;
}

/** Column-builder inputs: labels, locale, the manager gate, and the dialog callbacks. */
export interface CarryoverColumnArgs extends CarryoverDialogCallbacks {
  readonly labels: CarryoverLabels;
  readonly actionsColumnLabel: string;
  readonly createdAtColumnLabel: string;
  readonly locale: string;
  readonly canManageCarryover: boolean;
}

/** View-model slice the carryover grid renders from, plus the dialog opener callbacks. */
export type CarryoverDataGridProps = Pick<
  CarryoverViewModel,
  | "labels"
  | "rows"
  | "totalCount"
  | "aggregates"
  | "isLoading"
  | "error"
  | "refetch"
  | "page"
  | "pageSize"
  | "onPageChange"
  | "onPageSizeChange"
  | "pageSizeOptions"
  | "selectedIds"
  | "toggleSelected"
  | "clearSelection"
  | "canManageCarryover"
  | "handleExportCsv"
> &
  CarryoverDialogCallbacks;
