"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import type { PayrollReportFilter } from "@/frontend/common/graphql/generated/gql/graphql";
import { payrollReportQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { usePayrollReportsFilterStore } from "@/frontend/common/stores/payrollReportsFilterStore";
import {
  downloadCsvExport,
  useDebouncedSearchWithDelay,
} from "@/frontend/common/views/dashboard/accounting/__shared__";
import {
  buildPayrollExportCsvUrl,
  type PayrollCsvExportOutcome,
  type PayrollReportAggregates,
  type PayrollReportFilterFields,
  type PayrollReportRow,
  type PayrollReportsFilterSlice,
  toPayrollAggregates,
} from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel.helpers";

/** Keystroke-to-query delay for the free-text search box. */
const SEARCH_DEBOUNCE_MS = 300;

/** Used when the export response carries no Content-Disposition filename. */
const FALLBACK_EXPORT_FILENAME = "payroll-report.csv";

/** Pulls the server-provided filename out of a Content-Disposition header. */
function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? match[1] : FALLBACK_EXPORT_FILENAME;
}

export function usePayrollReportsFilterSlice(): PayrollReportsFilterSlice {
  const teacherId = usePayrollReportsFilterStore(s => s.teacherId);
  const studentId = usePayrollReportsFilterStore(s => s.studentId);
  const dateFrom = usePayrollReportsFilterStore(s => s.dateFrom);
  const dateTo = usePayrollReportsFilterStore(s => s.dateTo);
  const calculationStatuses = usePayrollReportsFilterStore(s => s.calculationStatuses);
  const search = usePayrollReportsFilterStore(s => s.search);
  const page = usePayrollReportsFilterStore(s => s.page);
  const pageSize = usePayrollReportsFilterStore(s => s.pageSize);
  const setTeacherId = usePayrollReportsFilterStore(s => s.setTeacherId);
  const setStudentId = usePayrollReportsFilterStore(s => s.setStudentId);
  const setDateFrom = usePayrollReportsFilterStore(s => s.setDateFrom);
  const setDateTo = usePayrollReportsFilterStore(s => s.setDateTo);
  const setCalculationStatuses = usePayrollReportsFilterStore(s => s.setCalculationStatuses);
  const setSearch = usePayrollReportsFilterStore(s => s.setSearch);
  const setPage = usePayrollReportsFilterStore(s => s.setPage);
  const setPageSize = usePayrollReportsFilterStore(s => s.setPageSize);
  const clearFilters = usePayrollReportsFilterStore(s => s.clearFilters);
  return {
    teacherId,
    studentId,
    dateFrom,
    dateTo,
    calculationStatuses,
    search,
    page,
    pageSize,
    setTeacherId,
    setStudentId,
    setDateFrom,
    setDateTo,
    setCalculationStatuses,
    setSearch,
    setPage,
    setPageSize,
    clearFilters,
  };
}

/** Debounces the raw search box text so only settled queries hit the server. */
export function useDebouncedReportSearch(search: string): string {
  return useDebouncedSearchWithDelay(search, SEARCH_DEBOUNCE_MS);
}

/** Fetches one server page of the payroll report and derives its view data. */
export function usePayrollReportPage(filter: PayrollReportFilter | null, page: number, pageSize: number) {
  const { data, loading, error, refetch } = useQuery(payrollReportQueryDocument, {
    variables: {
      filter,
      limit: pageSize,
      offset: page * pageSize,
    },
    fetchPolicy: "cache-and-network",
  });
  const report = data?.payrollReport ?? null;
  const rows = useMemo<readonly PayrollReportRow[]>(() => report?.rows ?? [], [report]);
  const totalCount = report?.totalCount ?? 0;
  const aggregates = useMemo<PayrollReportAggregates>(() => toPayrollAggregates(report?.aggregates), [report]);
  return { rows, totalCount, aggregates, loading, error, refetch };
}

/**
 * Builds the CSV export handler. It downloads the exact filtered result set the
 * grid shows, reads the truncation header for the > 10 000-row notice, and
 * saves via a blob so the response headers stay readable (a plain anchor
 * cannot expose them).
 */
export function usePayrollCsvExport(
  filterFields: PayrollReportFilterFields
): () => Promise<PayrollCsvExportOutcome | null> {
  return useCallback(
    () =>
      downloadCsvExport({
        url: buildPayrollExportCsvUrl(filterFields),
        resolveFilename: extractDownloadFilename,
        requestFailedMessage: "Payroll CSV export request failed",
        exportFailedMessage: "Payroll CSV export failed",
      }),
    [filterFields]
  );
}
