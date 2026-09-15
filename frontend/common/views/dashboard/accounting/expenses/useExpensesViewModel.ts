"use client";

import type { ErrorLike } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import {
  AppPermission,
  type CurrencyCode,
  type ExpenseFilter,
  type ExpensesQuery_expenses,
  type ExpensesQuery_expenses_rows,
  type ExpensesQueryVariables,
  ExpenseType,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { expensesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { EXPENSE_PAGE_SIZE_OPTIONS, useExpenseFilterStore } from "@/frontend/common/stores/expenseFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Route that streams the filtered expense list as a CSV download. */
const EXPENSES_EXPORT_URL = "/api/expenses/export";

/** Used when the export response carries no Content-Disposition filename. */
const FALLBACK_EXPORT_FILENAME = "expenses.csv";

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
interface ExpenseFilterFields {
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
interface ExpenseFilterSlice {
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

export interface ExpensesViewModel extends ExpenseFilterSlice {
  readonly labels: ExpensesLabels;
  readonly rows: readonly ExpenseRow[];
  /** Total rows matching the current filters, across all server pages. */
  readonly totalCount: number;
  readonly aggregates: ExpenseAggregates;
  readonly isLoading: boolean;
  readonly error: ErrorLike | null;
  readonly refetch: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly pageSizeOptions: readonly number[];
  /** True when the caller holds ACCOUNTING_EXPENSES_VIEW (list access). */
  readonly canViewExpenses: boolean;
  /** True when the caller holds ACCOUNTING_EXPENSES_MANAGE (Add/Edit/Bulk toolbar). */
  readonly canManageExpenses: boolean;
  readonly handleExportCsv: () => Promise<ExpenseCsvExportOutcome | null>;
}

function useExpenseFilterSlice(): ExpenseFilterSlice {
  const title = useExpenseFilterStore(s => s.title);
  const types = useExpenseFilterStore(s => s.types);
  const expenseDate = useExpenseFilterStore(s => s.expenseDate);
  const paymentDateFrom = useExpenseFilterStore(s => s.paymentDateFrom);
  const paymentDateTo = useExpenseFilterStore(s => s.paymentDateTo);
  const includeDeleted = useExpenseFilterStore(s => s.includeDeleted);
  const page = useExpenseFilterStore(s => s.page);
  const pageSize = useExpenseFilterStore(s => s.pageSize);
  const selectedIds = useExpenseFilterStore(s => s.selectedIds);
  const setTitle = useExpenseFilterStore(s => s.setTitle);
  const setTypes = useExpenseFilterStore(s => s.setTypes);
  const setExpenseDate = useExpenseFilterStore(s => s.setExpenseDate);
  const setPaymentDateFrom = useExpenseFilterStore(s => s.setPaymentDateFrom);
  const setPaymentDateTo = useExpenseFilterStore(s => s.setPaymentDateTo);
  const setIncludeDeleted = useExpenseFilterStore(s => s.setIncludeDeleted);
  const setPage = useExpenseFilterStore(s => s.setPage);
  const setPageSize = useExpenseFilterStore(s => s.setPageSize);
  const toggleSelected = useExpenseFilterStore(s => s.toggleSelected);
  const clearSelection = useExpenseFilterStore(s => s.clearSelection);
  const clearFilters = useExpenseFilterStore(s => s.clearFilters);
  return {
    title,
    types,
    expenseDate,
    paymentDateFrom,
    paymentDateTo,
    includeDeleted,
    page,
    pageSize,
    selectedIds,
    setTitle,
    setTypes,
    setExpenseDate,
    setPaymentDateFrom,
    setPaymentDateTo,
    setIncludeDeleted,
    setPage,
    setPageSize,
    toggleSelected,
    clearSelection,
    clearFilters,
  };
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
function toExpenseAggregates(
  list: Pick<ExpensesQuery_expenses, "totalValue" | "dominantCurrency" | "rowCountByType"> | null | undefined
): ExpenseAggregates {
  return {
    totalValue: list?.totalValue ?? null,
    dominantCurrency: list?.dominantCurrency ?? null,
    rowCountByType: isRowCountByType(list?.rowCountByType) ? list.rowCountByType : {},
  };
}

/** Pulls the server-provided filename out of a Content-Disposition header. */
function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? (match[1] ?? FALLBACK_EXPORT_FILENAME) : FALLBACK_EXPORT_FILENAME;
}

/**
 * The export route validates `types` against the backend enum's display values
 * ("Salaries", …), while the store and query variables carry the GraphQL enum
 * (serialized "SALARIES", …) — so only the export path needs to translate.
 */
const EXPENSE_TYPE_EXPORT_VALUE: Record<ExpenseType, string> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

/**
 * Serializes the current filters onto the CSV export route. Param names mirror
 * the route contract one-to-one; includeDeleted is always sent so the export
 * exactly matches the grid the operator is looking at.
 */
function buildExpensesExportCsvUrl(fields: ExpenseFilterFields): string {
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

/** Fetches one server page of the expense list and derives its view data. */
function useExpensesPage(filter: ExpenseFilter | null, page: number, pageSize: number, canViewExpenses: boolean) {
  const variables = useMemo<ExpensesQueryVariables>(
    () => ({ filter, limit: pageSize, offset: page * pageSize }),
    [filter, page, pageSize]
  );
  const { data, loading, error, refetch } = useQuery(expensesQueryDocument, {
    variables,
    fetchPolicy: "cache-and-network",
    skip: !canViewExpenses,
  });
  const list = data?.expenses ?? null;
  const rows = useMemo<readonly ExpenseRow[]>(() => list?.rows ?? [], [list]);
  const totalCount = list?.totalCount ?? 0;
  const aggregates = useMemo<ExpenseAggregates>(() => toExpenseAggregates(list), [list]);
  return { rows, totalCount, aggregates, loading, error, refetch };
}

/**
 * Builds the CSV export handler. It downloads the exact filtered result set the
 * grid shows, reads the truncation header for the > 10 000-row notice, and
 * saves via a blob so the response headers stay readable (a plain anchor
 * cannot expose them). The caller surfaces the outcome as a warning toast.
 */
function useExpenseCsvExport(fields: ExpenseFilterFields): () => Promise<ExpenseCsvExportOutcome | null> {
  return useCallback(async (): Promise<ExpenseCsvExportOutcome | null> => {
    const url = buildExpensesExportCsvUrl(fields);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("Expense CSV export request failed", { status: response.status, url });
        return null;
      }
      const truncated = response.headers.get("X-Export-Truncated") === "true";
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = extractDownloadFilename(response.headers.get("Content-Disposition"));
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      return { truncated };
    } catch (exportError) {
      logger.error("Expense CSV export failed", { error: exportError, url });
      return null;
    }
  }, [fields]);
}

export function useExpensesViewModel(): ExpensesViewModel {
  const labels = useAppTranslation(DashboardAccountingExpenses);
  const filterSlice = useExpenseFilterSlice();
  const { title, types, expenseDate, paymentDateFrom, paymentDateTo, includeDeleted, page, pageSize } = filterSlice;
  const { setPage, setPageSize } = filterSlice;

  const hasPermission = useUserStore(s => s.hasPermission);
  const canViewExpenses = hasPermission(AppPermission.AccountingExpensesView);
  const canManageExpenses = hasPermission(AppPermission.AccountingExpensesManage);

  const trimmedTitle = title.trim();

  const filterFields = useMemo<ExpenseFilterFields>(
    () => ({ title: trimmedTitle, types, expenseDate, paymentDateFrom, paymentDateTo, includeDeleted }),
    [trimmedTitle, types, expenseDate, paymentDateFrom, paymentDateTo, includeDeleted]
  );

  const filter = useMemo(() => buildExpenseFilter(filterFields), [filterFields]);

  const { rows, totalCount, aggregates, loading, error, refetch } = useExpensesPage(
    filter,
    page,
    pageSize,
    canViewExpenses
  );

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);
  const handlePageChange = useCallback((nextPage: number) => setPage(nextPage), [setPage]);
  const handlePageSizeChange = useCallback((nextPageSize: number) => setPageSize(nextPageSize), [setPageSize]);

  const handleExportCsv = useExpenseCsvExport(filterFields);

  return {
    ...filterSlice,
    labels,
    rows,
    totalCount,
    aggregates,
    isLoading: loading,
    error: error ?? null,
    refetch: handleRefetch,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    pageSizeOptions: EXPENSE_PAGE_SIZE_OPTIONS,
    canViewExpenses,
    canManageExpenses,
    handleExportCsv,
  };
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
function buildExpenseFilter(v: ExpenseFilterFields): ExpenseFilter | null {
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
