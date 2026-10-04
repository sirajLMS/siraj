import type {
  CurrencyCode,
  ExpenseFilter,
  ExpensesQuery_expenses,
  ExpensesQuery_expenses_rows,
  ExpenseType,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  EXPENSE_TYPE_EXPORT_VALUE,
  EXPENSES_EXPORT_URL,
  FALLBACK_EXPORT_FILENAME,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel.constants";

/** One row of the expense ledger list. */
export type ExpenseRow = ExpensesQuery_expenses_rows;

/** Aggregate footer data derived from the full filtered set, not just the visible page. */
export interface ExpenseAggregates {
  readonly totalValue: string | null;
  readonly dominantCurrency: CurrencyCode | null;
  /**
   * Row tallies per expense type, keyed by the type's display-form value
   * (e.g. "Salaries"); the backend reports every expense type, including
   * types with zero matching rows.
   */
  readonly rowCountByType: Readonly<Record<string, number>>;
}

/** Filter fields exactly as the report consumes them (title search already debounced). */
export interface ExpenseFilterFields {
  readonly title: string;
  readonly types: readonly ExpenseType[];
  readonly expenseDate: string | null;
  readonly paymentDateFrom: string | null;
  readonly paymentDateTo: string | null;
  readonly includeDeleted: boolean;
}

/** Result of a completed CSV export download; null means the export failed. */
export interface ExpenseCsvExportOutcome {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

/** Filter, pagination, and bulk-selection state with store actions for the expense list. */
export interface ExpenseFilterSlice {
  /** Free-text title search exactly as typed; the debounced value drives the query and export. */
  readonly title: string;
  readonly types: readonly ExpenseType[];
  readonly expenseDate: string | null;
  readonly paymentDateFrom: string | null;
  readonly paymentDateTo: string | null;
  readonly includeDeleted: boolean;
  /** 0-based server page index. */
  readonly page: number;
  readonly pageSize: number;
  /** Ids of the rows currently checked for bulk actions. */
  readonly selectedIds: readonly string[];
  readonly setTitle: (title: string) => void;
  readonly setTypes: (types: readonly ExpenseType[]) => void;
  readonly setExpenseDate: (expenseDate: string | null) => void;
  readonly setPaymentDateFrom: (paymentDateFrom: string | null) => void;
  readonly setPaymentDateTo: (paymentDateTo: string | null) => void;
  readonly setIncludeDeleted: (includeDeleted: boolean) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly clearFilters: () => void;
}

/** Type guard for the JSON-scalar per-type tallies the API reports as `unknown`. */
function isRowCountByType(value: unknown): value is Readonly<Record<string, number>> {
  if (typeof value !== "object" || value === null) return false;
  for (const key of Object.keys(value)) {
    if (typeof Reflect.get(value, key) !== "number") return false;
  }
  return true;
}

/** Normalizes the flattened page aggregate fields (JSON scalar included) into the footer-card shape. */
export function toExpenseAggregates(
  list: Pick<ExpensesQuery_expenses, "totalValue" | "dominantCurrency" | "rowCountByType"> | null | undefined
): ExpenseAggregates {
  return {
    totalValue: list?.totalValue ?? null,
    dominantCurrency: list?.dominantCurrency ?? null,
    rowCountByType: isRowCountByType(list?.rowCountByType) ? list.rowCountByType : {},
  };
}

/** Pulls the server-provided filename out of a Content-Disposition header. */
export function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? (match[1] ?? FALLBACK_EXPORT_FILENAME) : FALLBACK_EXPORT_FILENAME;
}

/**
 * Serializes the current filters onto the CSV export route. Param names mirror
 * the route contract one-to-one; includeDeleted is always sent so the export
 * exactly matches the grid the operator is looking at.
 */
export function buildExpensesExportCsvUrl(fields: ExpenseFilterFields): string {
  const params = new URLSearchParams();
  if (fields.title !== "") params.set("title", fields.title);
  if (fields.types.length > 0) {
    params.set("types", fields.types.map(type => EXPENSE_TYPE_EXPORT_VALUE[type]).join(","));
  }
  if (fields.expenseDate !== null && fields.expenseDate !== "") params.set("expenseDate", fields.expenseDate);
  if (fields.paymentDateFrom !== null && fields.paymentDateFrom !== "") {
    params.set("paymentDateFrom", fields.paymentDateFrom);
  }
  if (fields.paymentDateTo !== null && fields.paymentDateTo !== "") {
    params.set("paymentDateTo", fields.paymentDateTo);
  }
  params.set("includeDeleted", String(fields.includeDeleted));
  return `${EXPENSES_EXPORT_URL}?${params.toString()}`;
}

/** True when at least one filter is actively constraining the query. */
function hasAnyFilter(v: ExpenseFilterFields): boolean {
  return [
    v.title !== "",
    v.types.length > 0,
    v.expenseDate !== null && v.expenseDate !== "",
    v.paymentDateFrom !== null && v.paymentDateFrom !== "",
    v.paymentDateTo !== null && v.paymentDateTo !== "",
    v.includeDeleted,
  ].includes(true);
}

/** Maps the filter fields onto the GraphQL filter input (null when no filter is active). */
export function buildExpenseFilter(v: ExpenseFilterFields): ExpenseFilter | null {
  if (!hasAnyFilter(v)) return null;
  return {
    title: v.title !== "" ? v.title : null,
    types: v.types.length > 0 ? [...v.types] : null,
    expenseDate: v.expenseDate,
    paymentDateFrom: v.paymentDateFrom,
    paymentDateTo: v.paymentDateTo,
    includeDeleted: v.includeDeleted,
  };
}
