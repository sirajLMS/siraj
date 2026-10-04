import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  ExpenseRow,
  ExpensesViewModel,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export {
  ELLIPSIZED_TEXT_SX,
  EMPTY_GRID_MIN_HEIGHT_SX as EXPENSES_EMPTY_GRID_MIN_HEIGHT_SX,
  EMPTY_VALUE_SX as EXPENSES_EMPTY_VALUE_SX,
  SCROLLBAR_CUE_SX as EXPENSES_SCROLLBAR_CUE_SX,
} from "@/frontend/common/views/dashboard/accounting/__shared__";

/**
 * The server reports `rowCountByType` keyed by the backend enum's display
 * value ("Salaries"), while grid rows carry the GraphQL codegen enum
 * ("SALARIES") — the footer maps back through this table to reuse the same
 * type badges the grid column renders.
 */
const AGGREGATE_KEY_BY_TYPE: Record<ExpenseType, string> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

/** Maps the codegen enum to the localized-label keys of the expenses namespace. */
const TYPE_LABEL_KEY_BY_TYPE: Record<ExpenseType, keyof ExpensesLabels["type"]> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

const EXPENSE_TYPES: readonly ExpenseType[] = [
  ExpenseType.Salaries,
  ExpenseType.Marketing,
  ExpenseType.Logistics,
  ExpenseType.Technology,
];

/** Localized label for an expense type, so badge cells carry the full copy. */
export function expenseTypeLabel(labels: ExpensesLabels, type: ExpenseType): string {
  return labels.type[TYPE_LABEL_KEY_BY_TYPE[type]];
}

/** Resolves a `rowCountByType` key to the codegen enum, or null when unknown. */
export function expenseTypeFromAggregateKey(key: string): ExpenseType | null {
  for (const type of EXPENSE_TYPES) {
    if (AGGREGATE_KEY_BY_TYPE[type] === key) return type;
  }
  return null;
}

/** Picks the visible rows whose ids sit in the store-backed bulk selection. */
export function selectedVisibleRows(rows: readonly ExpenseRow[], selectedIds: readonly string[]): ExpenseRow[] {
  const idSet = new Set(selectedIds);
  return rows.filter(row => row.id !== null && idSet.has(row.id));
}

/** Container callbacks that open the lifted dialogs/drawer for a row or the selection. */
export interface ExpensesDialogCallbacks {
  /** Opens the form dialog in add mode (`null` row) or edit mode (row snapshot). */
  readonly onOpenForm: (row: ExpenseRow | null) => void;
  /** Opens the delete confirmation for the given rows (single row or the selection). */
  readonly onOpenDelete: (rows: readonly ExpenseRow[]) => void;
  /** Opens the linked carryover detail drawer for the row's provenance id. */
  readonly onViewSource: (sourceEntityId: string) => void;
}

/** View-model slice the expenses grid renders from, plus the dialog opener callbacks. */
export type ExpensesDataGridProps = Pick<
  ExpensesViewModel,
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
  | "canManageExpenses"
  | "handleExportCsv"
> &
  ExpensesDialogCallbacks;
