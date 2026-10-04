"use client";

import type { ErrorLike } from "@apollo/client";
import { useCallback, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { EXPENSE_PAGE_SIZE_OPTIONS } from "@/frontend/common/stores/expenseFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildExpenseFilter,
  type ExpenseAggregates,
  type ExpenseCsvExportOutcome,
  type ExpenseFilterFields,
  type ExpenseFilterSlice,
  type ExpenseRow,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel.helpers";
import {
  useExpenseCsvExport,
  useExpenseFilterSlice,
  useExpensesPage,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel.hooks";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

export type { ExpenseAggregates, ExpenseCsvExportOutcome, ExpenseRow };

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
