"use client";

import { useCallback, useMemo } from "react";
import { AppPermission, type CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildReportFilter,
  buildStatusLabels,
  hasAnyReportFilter,
  type PayrollCsvExportOutcome,
  type PayrollReportAggregates,
  type PayrollReportFilterFields,
  type PayrollReportRow,
  type PayrollReportsFilterSlice,
} from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel.helpers";
import {
  useDebouncedReportSearch,
  usePayrollCsvExport,
  usePayrollReportPage,
  usePayrollReportsFilterSlice,
} from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel.hooks";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

export type { PayrollReportAggregates, PayrollReportRow };

export interface PayrollReportsViewModel extends PayrollReportsFilterSlice {
  readonly labels: PayrollLabels;
  /** Status labels keyed by the generated enum so the status chip needs no per-view mapping. */
  readonly statusLabels: Record<CalculationStatus, string>;
  readonly rows: readonly PayrollReportRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly onRetry: () => void;
  /** Total rows matching the current filters, across all server pages. */
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly aggregates: PayrollReportAggregates;
  /** True when at least one filter is actively constraining the query. */
  readonly hasActiveFilters: boolean;
  /** True when the caller holds ACCOUNTING_PAYROLL_MANAGE (row override actions). */
  readonly canManagePayroll: boolean;
  readonly onExportCsv: () => Promise<PayrollCsvExportOutcome | null>;
}

export function usePayrollReportsViewModel(): PayrollReportsViewModel {
  const t = useAppTranslation(DashboardBillingPayroll);
  const filterSlice = usePayrollReportsFilterSlice();
  const { teacherId, studentId, dateFrom, dateTo, calculationStatuses, search, page, pageSize } = filterSlice;
  const { setPage, setPageSize } = filterSlice;

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManagePayroll = hasPermission(AppPermission.AccountingPayrollManage);

  const debouncedSearch = useDebouncedReportSearch(search);

  const filterFields = useMemo<PayrollReportFilterFields>(
    () => ({ teacherId, studentId, dateFrom, dateTo, calculationStatuses, search: debouncedSearch }),
    [teacherId, studentId, dateFrom, dateTo, calculationStatuses, debouncedSearch]
  );

  const filter = useMemo(() => buildReportFilter(filterFields), [filterFields]);

  const { rows, totalCount, aggregates, loading, error, refetch } = usePayrollReportPage(filter, page, pageSize);

  const handlePageChange = useCallback((nextPage: number) => setPage(nextPage), [setPage]);
  const handlePageSizeChange = useCallback((nextPageSize: number) => setPageSize(nextPageSize), [setPageSize]);
  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleExportCsv = usePayrollCsvExport(filterFields);

  return {
    ...filterSlice,
    labels: t,
    statusLabels: buildStatusLabels(t.status),
    rows,
    loading,
    error: Boolean(error),
    onRetry: handleRetry,
    totalCount,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    aggregates,
    hasActiveFilters: hasAnyReportFilter(filterFields),
    canManagePayroll,
    onExportCsv: handleExportCsv,
  };
}
