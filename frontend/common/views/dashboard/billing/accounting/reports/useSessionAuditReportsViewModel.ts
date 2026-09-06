"use client";

import type { ErrorLike } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppPermission,
  type CurrencyCode,
  type OrderSortDirection,
  type SessionAuditReportFilter,
  type SessionAuditReportQuery_sessionAuditReport_aggregates,
  type SessionAuditReportQuery_sessionAuditReport_rows,
  type SessionAuditReportQueryVariables,
  type SessionAuditReportSort,
  type SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { sessionAuditReportQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { startSessionAuditUrlSync, useSessionAuditFilterStore } from "@/frontend/common/stores/sessionAuditFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** Keystroke-to-query delay for the free-text search box. */
const SEARCH_DEBOUNCE_MS = 300;

/** Route that renders the filtered report as a CSV download. */
const SESSION_AUDIT_EXPORT_URL = "/api/accounting/reports/export";

/** Used when the export response carries no Content-Disposition filename. */
const FALLBACK_EXPORT_FILENAME = "session-audit-report.csv";

/** Zero-filled per-status counts, shown while the report has not loaded yet. */
const EMPTY_ROW_COUNT_BY_STATUS: Record<SessionAuditStatus, number> = {
  [SessionAuditStatus.Open]: 0,
  [SessionAuditStatus.End]: 0,
  [SessionAuditStatus.Absent]: 0,
  [SessionAuditStatus.AbsentStudent]: 0,
};

/** Paid/unpaid row tallies for one report page. */
export interface SessionAuditRowCountByPaid {
  readonly paid: number;
  readonly unpaid: number;
}

/** Aggregate summary for the current report page, normalized from the raw JSON scalars. */
export interface SessionAuditReportAggregates {
  readonly rowCountByStatus: Record<SessionAuditStatus, number>;
  readonly rowCountByPaid: SessionAuditRowCountByPaid;
  readonly totalPaidAmount: string;
  readonly totalPaidCurrency: CurrencyCode | null;
}

/** Safe aggregates shown before the first response or after a failure. */
const EMPTY_AGGREGATES: SessionAuditReportAggregates = {
  rowCountByStatus: { ...EMPTY_ROW_COUNT_BY_STATUS },
  rowCountByPaid: { paid: 0, unpaid: 0 },
  totalPaidAmount: "0.00",
  totalPaidCurrency: null,
};

/** One row of the session audit report (denormalized per-session audit view). */
export type SessionAuditReportRow = SessionAuditReportQuery_sessionAuditReport_rows;

/** Filter fields exactly as the report consumes them (search already debounced). */
interface SessionAuditReportFilterFields {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly currentStatuses: readonly SessionAuditStatus[];
  readonly search: string;
}

/** Filter fields plus the sort pair, as consumed by the CSV export route. */
export interface SessionAuditExportParams extends SessionAuditReportFilterFields {
  readonly sortField: SessionAuditReportSortField;
  readonly sortDirection: OrderSortDirection;
}

/** Result of a completed CSV export download; null means the export failed. */
export interface SessionAuditCsvExportOutcome {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

/** Filter, sort, and pagination state with store actions for the session audit report. */
export interface SessionAuditFilterSlice {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly currentStatuses: readonly SessionAuditStatus[];
  /** Free-text search exactly as typed; the debounced value drives the query and export. */
  readonly search: string;
  readonly sortField: SessionAuditReportSortField;
  readonly sortDirection: OrderSortDirection;
  /** 0-based server page index. */
  readonly page: number;
  readonly pageSize: number;
  /** Ids of the rows currently checked for the carryover bulk action. */
  readonly selectedIds: readonly string[];
  readonly setTeacherId: (teacherId: string | null) => void;
  readonly setStudentId: (studentId: string | null) => void;
  readonly setDateFrom: (dateFrom: string | null) => void;
  readonly setDateTo: (dateTo: string | null) => void;
  readonly setCurrentStatuses: (currentStatuses: readonly SessionAuditStatus[]) => void;
  readonly setSearch: (search: string) => void;
  readonly setSort: (sortField: SessionAuditReportSortField, sortDirection: OrderSortDirection) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly clearFilters: () => void;
}

export interface SessionAuditReportsViewModel extends SessionAuditFilterSlice {
  readonly labels: SessionAuditLabels;
  readonly rows: readonly SessionAuditReportRow[];
  /** Total rows matching the current filters, across all server pages. */
  readonly totalCount: number;
  readonly aggregates: SessionAuditReportAggregates;
  readonly isLoading: boolean;
  readonly error: ErrorLike | null;
  readonly refetch: () => void;
  /**
   * True when at least one filter is set; the search box counts as typed
   * (immediately), ahead of the debounced value that drives the query.
   */
  readonly hasActiveFilters: boolean;
  /** True when the caller holds ACCOUNTING_REPORTS_MANAGE (per-row override access). */
  readonly canManageReports: boolean;
  /** True when the caller holds ACCOUNTING_CARRYOVER_MANAGE (bulk carryover toolbar + selection). */
  readonly canManageCarryover: boolean;
  readonly handleExportCsv: () => Promise<SessionAuditCsvExportOutcome | null>;
}

function useSessionAuditFilterSlice(): SessionAuditFilterSlice {
  const teacherId = useSessionAuditFilterStore(s => s.teacherId);
  const studentId = useSessionAuditFilterStore(s => s.studentId);
  const dateFrom = useSessionAuditFilterStore(s => s.dateFrom);
  const dateTo = useSessionAuditFilterStore(s => s.dateTo);
  const currentStatuses = useSessionAuditFilterStore(s => s.currentStatuses);
  const search = useSessionAuditFilterStore(s => s.search);
  const sortField = useSessionAuditFilterStore(s => s.sortField);
  const sortDirection = useSessionAuditFilterStore(s => s.sortDirection);
  const page = useSessionAuditFilterStore(s => s.page);
  const pageSize = useSessionAuditFilterStore(s => s.pageSize);
  const setTeacherId = useSessionAuditFilterStore(s => s.setTeacherId);
  const setStudentId = useSessionAuditFilterStore(s => s.setStudentId);
  const setDateFrom = useSessionAuditFilterStore(s => s.setDateFrom);
  const setDateTo = useSessionAuditFilterStore(s => s.setDateTo);
  const setCurrentStatuses = useSessionAuditFilterStore(s => s.setCurrentStatuses);
  const setSearch = useSessionAuditFilterStore(s => s.setSearch);
  const setSort = useSessionAuditFilterStore(s => s.setSort);
  const setPage = useSessionAuditFilterStore(s => s.setPage);
  const setPageSize = useSessionAuditFilterStore(s => s.setPageSize);
  const selectedIds = useSessionAuditFilterStore(s => s.selectedIds);
  const toggleSelected = useSessionAuditFilterStore(s => s.toggleSelected);
  const clearSelection = useSessionAuditFilterStore(s => s.clearSelection);
  const clearFilters = useSessionAuditFilterStore(s => s.clearFilters);
  return {
    teacherId,
    studentId,
    dateFrom,
    dateTo,
    currentStatuses,
    search,
    sortField,
    sortDirection,
    page,
    pageSize,
    setTeacherId,
    setStudentId,
    setDateFrom,
    setDateTo,
    setCurrentStatuses,
    setSearch,
    setSort,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelected,
    clearSelection,
    clearFilters,
  };
}

/** True when at least one report filter is actively constraining the query. */
function hasAnyReportFilter(f: SessionAuditReportFilterFields): boolean {
  return [
    f.teacherId !== null && f.teacherId !== "",
    f.studentId !== null && f.studentId !== "",
    f.dateFrom !== null && f.dateFrom !== "",
    f.dateTo !== null && f.dateTo !== "",
    f.currentStatuses.length > 0,
    f.search !== "",
  ].includes(true);
}

/** Maps the report filter fields onto the GraphQL filter input (null when no filter is active). */
function buildReportFilter(f: SessionAuditReportFilterFields): SessionAuditReportFilter | null {
  if (!hasAnyReportFilter(f)) return null;
  return {
    teacherId: f.teacherId,
    studentId: f.studentId,
    dateFrom: f.dateFrom,
    dateTo: f.dateTo,
    currentStatuses: f.currentStatuses.length > 0 ? [...f.currentStatuses] : null,
    search: f.search !== "" ? f.search : null,
    includeDeleted: null,
  };
}

/** Type guard for the JSON-scalar per-status row counts the API reports as `unknown`. */
function isRowCountByStatus(value: unknown): value is Record<SessionAuditStatus, number> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(SessionAuditStatus).every(status => typeof Reflect.get(value, status) === "number");
}

/** Type guard for the JSON-scalar paid/unpaid tallies the API reports as `unknown`. */
function isRowCountByPaid(value: unknown): value is SessionAuditRowCountByPaid {
  if (typeof value !== "object" || value === null) return false;
  return typeof Reflect.get(value, "paid") === "number" && typeof Reflect.get(value, "unpaid") === "number";
}

/** Normalizes the nullable aggregate block (JSON scalars included) into the footer-card shape. */
function toSessionAuditAggregates(
  aggregates: SessionAuditReportQuery_sessionAuditReport_aggregates | null | undefined
): SessionAuditReportAggregates {
  if (aggregates === null || aggregates === undefined) return EMPTY_AGGREGATES;
  const { rowCountByStatus, rowCountByPaid } = aggregates;
  return {
    rowCountByStatus: isRowCountByStatus(rowCountByStatus) ? rowCountByStatus : { ...EMPTY_ROW_COUNT_BY_STATUS },
    rowCountByPaid: isRowCountByPaid(rowCountByPaid) ? rowCountByPaid : { paid: 0, unpaid: 0 },
    totalPaidAmount: aggregates.totalPaidAmount ?? "0.00",
    totalPaidCurrency: aggregates.totalPaidCurrency ?? null,
  };
}

/** Pulls the server-provided filename out of a Content-Disposition header. */
function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? match[1] : FALLBACK_EXPORT_FILENAME;
}

/**
 * Serializes the current report filters and sort onto the CSV export route.
 * Statuses are comma-joined (the route also accepts them as repeatable
 * params) and the sort direction is lowercase per the route contract.
 */
export function buildSessionAuditExportCsvUrl(p: SessionAuditExportParams): string {
  const params = new URLSearchParams();
  if (p.teacherId !== null && p.teacherId !== "") params.set("teacherId", p.teacherId);
  if (p.studentId !== null && p.studentId !== "") params.set("studentId", p.studentId);
  if (p.dateFrom !== null && p.dateFrom !== "") params.set("dateFrom", p.dateFrom);
  if (p.dateTo !== null && p.dateTo !== "") params.set("dateTo", p.dateTo);
  if (p.currentStatuses.length > 0) params.set("currentStatuses", p.currentStatuses.join(","));
  if (p.search !== "") params.set("search", p.search);
  params.set("sortField", p.sortField);
  params.set("sortDirection", p.sortDirection.toLowerCase());
  return `${SESSION_AUDIT_EXPORT_URL}?${params.toString()}`;
}

/** Debounces the raw search box text so only settled queries hit the server. */
function useDebouncedSearch(search: string): string {
  const [debouncedSearch, setDebouncedSearch] = useState(() => search.trim());
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);
  return debouncedSearch;
}

/** Fetches one server page of the session audit report and derives its view data. */
function useSessionAuditReportPage(
  filter: SessionAuditReportFilter | null,
  sort: SessionAuditReportSort,
  page: number,
  pageSize: number
) {
  const variables = useMemo<SessionAuditReportQueryVariables>(
    () => ({ filter, sort, limit: pageSize, offset: page * pageSize }),
    [filter, sort, page, pageSize]
  );
  const { data, previousData, loading, error, refetch } = useQuery(sessionAuditReportQueryDocument, {
    variables,
    fetchPolicy: "cache-and-network",
  });
  // While a page/sort change is in flight the fresh result is briefly absent;
  // falling back to the previous report keeps `rowCount` stable so the grid
  // does not clamp the requested page back to 0 mid-fetch.
  const report = data?.sessionAuditReport ?? previousData?.sessionAuditReport ?? null;
  const rows = useMemo<readonly SessionAuditReportRow[]>(() => report?.rows ?? [], [report]);
  const totalCount = report?.totalCount ?? 0;
  const aggregates = useMemo<SessionAuditReportAggregates>(
    () => toSessionAuditAggregates(report?.aggregates),
    [report]
  );
  return { rows, totalCount, aggregates, loading, error, refetch };
}

/**
 * Builds the CSV export handler. It downloads the exact filtered result set the
 * grid shows, reads the truncation header for the > 10 000-row notice, and
 * saves via a blob so the response headers stay readable (a plain anchor
 * cannot expose them).
 */
function useSessionAuditCsvExport(p: SessionAuditExportParams): () => Promise<SessionAuditCsvExportOutcome | null> {
  return useCallback(async (): Promise<SessionAuditCsvExportOutcome | null> => {
    const url = buildSessionAuditExportCsvUrl(p);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("Session audit CSV export request failed", { status: response.status, url });
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
      logger.error("Session audit CSV export failed", { error: exportError, url });
      return null;
    }
  }, [p]);
}

export function useSessionAuditReportsViewModel(): SessionAuditReportsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.SessionAudit);
  const filterSlice = useSessionAuditFilterSlice();
  const { teacherId, studentId, dateFrom, dateTo, currentStatuses, search, sortField, sortDirection, page, pageSize } =
    filterSlice;

  const hydrateFromUrl = useSessionAuditFilterStore(s => s.hydrateFromUrl);
  useEffect(() => {
    hydrateFromUrl();
    return startSessionAuditUrlSync();
  }, [hydrateFromUrl]);

  const hasPermission = useUserStore(s => s.hasPermission);
  const canManageReports = hasPermission(AppPermission.AccountingReportsManage);
  const canManageCarryover = hasPermission(AppPermission.AccountingCarryoverManage);

  const debouncedSearch = useDebouncedSearch(search);

  const filterFields = useMemo<SessionAuditReportFilterFields>(
    () => ({ teacherId, studentId, dateFrom, dateTo, currentStatuses, search: debouncedSearch }),
    [teacherId, studentId, dateFrom, dateTo, currentStatuses, debouncedSearch]
  );

  const filter = useMemo(() => buildReportFilter(filterFields), [filterFields]);
  const sort = useMemo<SessionAuditReportSort>(
    () => ({ field: sortField, direction: sortDirection }),
    [sortField, sortDirection]
  );

  const { rows, totalCount, aggregates, loading, error, refetch } = useSessionAuditReportPage(
    filter,
    sort,
    page,
    pageSize
  );

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  // The clear affordance tracks the search box as typed, not the debounced
  // query value, so "Clear filters" appears the instant the operator types.
  const hasActiveFilters = hasAnyReportFilter({ ...filterFields, search: search.trim() });

  const viewLabels = useMemo<SessionAuditLabels>(
    () => ({
      ...labels,
      // With no filter narrowing the result, an empty report means the account
      // simply has no session events yet, so the copy must not blame filters.
      emptyState: {
        ...labels.emptyState,
        title: hasActiveFilters ? labels.emptyState.title : labels.emptyState.titleNoFilters,
      },
    }),
    [labels, hasActiveFilters]
  );

  const exportParams = useMemo<SessionAuditExportParams>(
    () => ({ ...filterFields, sortField, sortDirection }),
    [filterFields, sortField, sortDirection]
  );
  const handleExportCsv = useSessionAuditCsvExport(exportParams);

  return {
    ...filterSlice,
    labels: viewLabels,
    rows,
    totalCount,
    aggregates,
    isLoading: loading,
    error: error ?? null,
    refetch: handleRefetch,
    hasActiveFilters,
    canManageReports,
    canManageCarryover,
    handleExportCsv,
  };
}
