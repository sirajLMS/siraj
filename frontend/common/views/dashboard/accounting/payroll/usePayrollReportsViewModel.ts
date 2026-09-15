"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppPermission,
  CalculationStatus,
  type CurrencyCode,
  type PayrollReportFilter,
  type PayrollReportQuery_payrollReport_aggregates,
  type PayrollReportQuery_payrollReport_rows,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { payrollReportQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { usePayrollReportsFilterStore } from "@/frontend/common/stores/payrollReportsFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Keystroke-to-query delay for the free-text search box. */
const SEARCH_DEBOUNCE_MS = 300;

/** Route that streams the filtered report as a CSV download. */
const PAYROLL_EXPORT_URL = "/api/payroll/export";

/** Used when the export response carries no Content-Disposition filename. */
const FALLBACK_EXPORT_FILENAME = "payroll-report.csv";

/** Zero-filled per-status counts, shown while the report has not loaded yet. */
const EMPTY_ROW_COUNTS: Record<CalculationStatus, number> = {
  [CalculationStatus.NotCalculated]: 0,
  [CalculationStatus.Calculated]: 0,
  [CalculationStatus.Partially]: 0,
  [CalculationStatus.Refund]: 0,
  [CalculationStatus.WaitingPaid]: 0,
  [CalculationStatus.Paid]: 0,
};

/** One row of the payroll report (denormalized per-session pay view). */
export type PayrollReportRow = PayrollReportQuery_payrollReport_rows;

/** Filter fields exactly as the report consumes them (search already debounced). */
interface PayrollReportFilterFields {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly calculationStatuses: readonly CalculationStatus[];
  readonly search: string;
}

/** Aggregate footer data derived from the current filter's full result set. */
export interface PayrollReportAggregates {
  readonly totalPaidAmount: string | null;
  readonly totalPaidCurrency: CurrencyCode | null;
  readonly rowCountByStatus: Record<CalculationStatus, number>;
}

/** Result of a completed CSV export download; null means the export failed. */
interface PayrollCsvExportOutcome {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

/** Narrow store slice for the payroll report (filter fields + pagination state + actions). */
interface PayrollReportsFilterSlice {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly calculationStatuses: readonly CalculationStatus[];
  /** Free-text search exactly as typed; the debounced value drives the query and export. */
  readonly search: string;
  /** 0-based server page index. */
  readonly page: number;
  readonly pageSize: number;
  readonly setTeacherId: (teacherId: string | null) => void;
  readonly setStudentId: (studentId: string | null) => void;
  readonly setDateFrom: (dateFrom: string | null) => void;
  readonly setDateTo: (dateTo: string | null) => void;
  readonly setCalculationStatuses: (calculationStatuses: readonly CalculationStatus[]) => void;
  readonly setSearch: (search: string) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly clearFilters: () => void;
}

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

function usePayrollReportsFilterSlice(): PayrollReportsFilterSlice {
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

/** True when at least one report filter is actively constraining the query. */
function hasAnyReportFilter(v: PayrollReportFilterFields): boolean {
  return [
    v.teacherId !== null && v.teacherId !== "",
    v.studentId !== null && v.studentId !== "",
    v.dateFrom !== null && v.dateFrom !== "",
    v.dateTo !== null && v.dateTo !== "",
    v.calculationStatuses.length > 0,
    v.search !== "",
  ].includes(true);
}

/** Maps the report filter fields onto the GraphQL filter input (null when no filter is active). */
function buildReportFilter(v: PayrollReportFilterFields): PayrollReportFilter | null {
  if (!hasAnyReportFilter(v)) return null;
  return {
    teacherId: v.teacherId,
    studentId: v.studentId,
    dateFrom: v.dateFrom,
    dateTo: v.dateTo,
    calculationStatuses: v.calculationStatuses.length > 0 ? [...v.calculationStatuses] : null,
    search: v.search !== "" ? v.search : null,
  };
}

/** Bridges the locale status labels (literal keys) onto the generated enum keys the status chip consumes. */
function buildStatusLabels(status: PayrollLabels["status"]): Record<CalculationStatus, string> {
  return {
    [CalculationStatus.NotCalculated]: status.NOT_CALCULATED,
    [CalculationStatus.Calculated]: status.CALCULATED,
    [CalculationStatus.Partially]: status.PARTIALLY,
    [CalculationStatus.Refund]: status.REFUND,
    [CalculationStatus.WaitingPaid]: status.WAITING_PAID,
    [CalculationStatus.Paid]: status.PAID,
  };
}

/** Type guard for the JSON-scalar per-status row counts the API reports as `unknown`. */
function isRowCountByStatus(value: unknown): value is Record<CalculationStatus, number> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(CalculationStatus).every(status => typeof Reflect.get(value, status) === "number");
}

function toRowCountByStatus(value: unknown): Record<CalculationStatus, number> {
  return isRowCountByStatus(value) ? value : EMPTY_ROW_COUNTS;
}

/** Normalizes the nullable aggregate block into the footer-card shape. */
function toPayrollAggregates(
  aggregates: PayrollReportQuery_payrollReport_aggregates | null | undefined
): PayrollReportAggregates {
  return {
    totalPaidAmount: aggregates?.totalPaidAmount ?? null,
    totalPaidCurrency: aggregates?.totalPaidCurrency ?? null,
    rowCountByStatus: toRowCountByStatus(aggregates?.rowCountByStatus),
  };
}

/** Pulls the server-provided filename out of a Content-Disposition header. */
function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? match[1] : FALLBACK_EXPORT_FILENAME;
}

/**
 * Serializes the current report filters onto the CSV export route. Param names
 * mirror the report filter input one-to-one; statuses are comma-joined (the
 * route also accepts them as repeatable params).
 */
function buildPayrollExportCsvUrl(fields: PayrollReportFilterFields): string {
  const params = new URLSearchParams();
  if (fields.teacherId !== null && fields.teacherId !== "") params.set("teacherId", fields.teacherId);
  if (fields.studentId !== null && fields.studentId !== "") params.set("studentId", fields.studentId);
  if (fields.dateFrom !== null && fields.dateFrom !== "") params.set("dateFrom", fields.dateFrom);
  if (fields.dateTo !== null && fields.dateTo !== "") params.set("dateTo", fields.dateTo);
  if (fields.calculationStatuses.length > 0) {
    params.set("calculationStatuses", fields.calculationStatuses.join(","));
  }
  if (fields.search !== "") params.set("search", fields.search);
  const query = params.toString();
  return query === "" ? PAYROLL_EXPORT_URL : `${PAYROLL_EXPORT_URL}?${query}`;
}

/** Debounces the raw search box text so only settled queries hit the server. */
function useDebouncedReportSearch(search: string): string {
  const [debouncedSearch, setDebouncedSearch] = useState(() => search.trim());
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);
  return debouncedSearch;
}

/** Fetches one server page of the payroll report and derives its view data. */
function usePayrollReportPage(filter: PayrollReportFilter | null, page: number, pageSize: number) {
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
function usePayrollCsvExport(filterFields: PayrollReportFilterFields): () => Promise<PayrollCsvExportOutcome | null> {
  return useCallback(async (): Promise<PayrollCsvExportOutcome | null> => {
    const url = buildPayrollExportCsvUrl(filterFields);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("Payroll CSV export request failed", { status: response.status, url });
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
      logger.error("Payroll CSV export failed", { error: exportError, url });
      return null;
    }
  }, [filterFields]);
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
