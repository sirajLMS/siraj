"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import type { ExpenseFilter, ExpensesQueryVariables } from "@/frontend/common/graphql/generated/gql/graphql";
import { expensesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useExpenseFilterStore } from "@/frontend/common/stores/expenseFilterStore";
import { downloadCsvExport } from "@/frontend/common/views/dashboard/accounting/__shared__";
import {
  buildExpensesExportCsvUrl,
  type ExpenseAggregates,
  type ExpenseCsvExportOutcome,
  type ExpenseFilterFields,
  type ExpenseFilterSlice,
  type ExpenseRow,
  extractDownloadFilename,
  toExpenseAggregates,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel.helpers";

export function useExpenseFilterSlice(): ExpenseFilterSlice {
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

/** Fetches one server page of the expense list and derives its view data. */
export function useExpensesPage(
  filter: ExpenseFilter | null,
  page: number,
  pageSize: number,
  canViewExpenses: boolean
) {
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
export function useExpenseCsvExport(fields: ExpenseFilterFields): () => Promise<ExpenseCsvExportOutcome | null> {
  return useCallback(
    () =>
      downloadCsvExport({
        url: buildExpensesExportCsvUrl(fields),
        resolveFilename: extractDownloadFilename,
        requestFailedMessage: "Expense CSV export request failed",
        exportFailedMessage: "Expense CSV export failed",
      }),
    [fields]
  );
}
