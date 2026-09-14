"use client";

import type { ErrorLike } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import {
  AppPermission,
  type CarryoverBalancesQuery_carryoverBalances_aggregates,
  type CarryoverBalancesQuery_carryoverBalances_rows,
  type CarryoverBalancesQueryVariables,
  type CarryoverFilter,
  type CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { carryoverBalancesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  CARRYOVER_PAGE_SIZE_OPTIONS,
  type CarryoverPaidStatusFilter,
  useCarryoverFilterStore,
} from "@/frontend/common/stores/carryoverFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover } from "@/shared/locale/namespaces";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/** Keystroke-to-query delay for the free-text search box. */
const SEARCH_DEBOUNCE_MS = 300;

/** Route that streams the filtered carryover list as a CSV download. */
const CARRYOVER_EXPORT_URL = "/api/carryover/export";

/** Used when the export response carries no Content-Disposition filename. */
const FALLBACK_EXPORT_FILENAME = "carryover-balances.csv";

/** One row of the carryover balance list. */
export type CarryoverRow = CarryoverBalancesQuery_carryoverBalances_rows;

/** Paid/unpaid row tallies for the full filtered set. */
interface CarryoverRowCountByPaid {
  readonly paid: number;
  readonly unpaid: number;
}

/** Aggregate footer data derived from the full filtered set, not just the visible page. */
export interface CarryoverAggregates {
  readonly totalPayable: string | null;
  readonly totalPaid: string | null;
  readonly dominantCurrency: CurrencyCode | null;
  readonly rowCountByPaid: CarryoverRowCountByPaid;
}

/** Filter fields exactly as the report consumes them (search already debounced). */
export interface CarryoverFilterFields {
  readonly teacherId: string | null;
  readonly paidStatus: CarryoverPaidStatusFilter;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly includeDisabledTeachers: boolean;
  readonly search: string;
}

/** Result of a completed CSV export download; null means the export failed. */
export interface CarryoverCsvExportOutcome {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

/** Filter, pagination, and bulk-selection state with store actions for the carryover list. */
interface CarryoverFilterSlice {
  readonly teacherId: string | null;
  /** Selected teacher option (drives the filter autocomplete's displayed selection). */
  readonly teacherOption: PersonOption | null;
  readonly paidStatus: CarryoverPaidStatusFilter;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly includeDisabledTeachers: boolean;
  /** Free-text search exactly as typed; the debounced value drives the query and export. */
  readonly search: string;
  /** 0-based server page index. */
  readonly page: number;
  readonly pageSize: number;
  /** Ids of the rows currently checked for bulk actions. */
  readonly selectedIds: readonly string[];
  readonly setTeacher: (teacher: PersonOption | null) => void;
  readonly setPaidStatus: (paidStatus: CarryoverPaidStatusFilter) => void;
  readonly setDateFrom: (dateFrom: string | null) => void;
  readonly setDateTo: (dateTo: string | null) => void;
  readonly setIncludeDisabledTeachers: (includeDisabledTeachers: boolean) => void;
  readonly setSearch: (search: string) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly clearFilters: () => void;
}

export interface CarryoverViewModel extends CarryoverFilterSlice {
  readonly labels: CarryoverLabels;
  readonly rows: readonly CarryoverRow[];
  /** Total rows matching the current filters, across all server pages. */
  readonly totalCount: number;
  readonly aggregates: CarryoverAggregates;
  readonly isLoading: boolean;
  readonly error: ErrorLike | null;
  readonly refetch: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly pageSizeOptions: readonly number[];
  /** True when the caller holds ACCOUNTING_CARRYOVER_VIEW (list access). */
  readonly canViewCarryover: boolean;
  /** True when the caller holds ACCOUNTING_CARRYOVER_MANAGE (Add/Edit/Bulk toolbar). */
  readonly canManageCarryover: boolean;
  readonly handleExportCsv: () => Promise<CarryoverCsvExportOutcome | null>;
}

function useCarryoverFilterSlice(): CarryoverFilterSlice {
  const teacherId = useCarryoverFilterStore(s => s.teacherId);
  const teacherOption = useCarryoverFilterStore(s => s.teacherOption);
  const paidStatus = useCarryoverFilterStore(s => s.paidStatus);
  const dateFrom = useCarryoverFilterStore(s => s.dateFrom);
  const dateTo = useCarryoverFilterStore(s => s.dateTo);
  const includeDisabledTeachers = useCarryoverFilterStore(s => s.includeDisabledTeachers);
  const search = useCarryoverFilterStore(s => s.search);
  const page = useCarryoverFilterStore(s => s.page);
  const pageSize = useCarryoverFilterStore(s => s.pageSize);
  const selectedIds = useCarryoverFilterStore(s => s.selectedIds);
  const setTeacher = useCarryoverFilterStore(s => s.setTeacher);
  const setPaidStatus = useCarryoverFilterStore(s => s.setPaidStatus);
  const setDateFrom = useCarryoverFilterStore(s => s.setDateFrom);
  const setDateTo = useCarryoverFilterStore(s => s.setDateTo);
  const setIncludeDisabledTeachers = useCarryoverFilterStore(s => s.setIncludeDisabledTeachers);
  const setSearch = useCarryoverFilterStore(s => s.setSearch);
  const setPage = useCarryoverFilterStore(s => s.setPage);
  const setPageSize = useCarryoverFilterStore(s => s.setPageSize);
  const toggleSelected = useCarryoverFilterStore(s => s.toggleSelected);
  const clearSelection = useCarryoverFilterStore(s => s.clearSelection);
  const clearFilters = useCarryoverFilterStore(s => s.clearFilters);
  return {
    teacherId,
    teacherOption,
    paidStatus,
    dateFrom,
    dateTo,
    includeDisabledTeachers,
    search,
    page,
    pageSize,
    selectedIds,
    setTeacher,
    setPaidStatus,
    setDateFrom,
    setDateTo,
    setIncludeDisabledTeachers,
    setSearch,
    setPage,
    setPageSize,
    toggleSelected,
    clearSelection,
    clearFilters,
  };
}

/** True when at least one filter is actively constraining the query. */
function hasAnyFilter(v: CarryoverFilterFields): boolean {
  return [
    v.teacherId !== null && v.teacherId !== "",
    v.paidStatus !== "Both",
    v.dateFrom !== null && v.dateFrom !== "",
    v.dateTo !== null && v.dateTo !== "",
    v.includeDisabledTeachers,
    v.search !== "",
  ].includes(true);
}

/** Maps the filter fields onto the GraphQL filter input (null when no filter is active). */
function buildCarryoverFilter(v: CarryoverFilterFields): CarryoverFilter | null {
  if (!hasAnyFilter(v)) return null;
  return {
    teacherId: v.teacherId,
    paidStatus: v.paidStatus === "Both" ? null : v.paidStatus,
    dateFrom: v.dateFrom,
    dateTo: v.dateTo,
    includeDisabledTeachers: v.includeDisabledTeachers,
    search: v.search !== "" ? v.search : null,
  };
}

/** Type guard for the JSON-scalar paid/unpaid tallies the API reports as `unknown`. */
function isRowCountByPaid(value: unknown): value is CarryoverRowCountByPaid {
  if (typeof value !== "object" || value === null) return false;
  return typeof Reflect.get(value, "paid") === "number" && typeof Reflect.get(value, "unpaid") === "number";
}

/** Normalizes the nullable aggregate block (JSON scalar included) into the footer-card shape. */
function toCarryoverAggregates(
  aggregates: CarryoverBalancesQuery_carryoverBalances_aggregates | null | undefined
): CarryoverAggregates {
  return {
    totalPayable: aggregates?.totalPayable ?? null,
    totalPaid: aggregates?.totalPaid ?? null,
    dominantCurrency: aggregates?.dominantCurrency ?? null,
    rowCountByPaid: isRowCountByPaid(aggregates?.rowCountByPaid) ? aggregates.rowCountByPaid : { paid: 0, unpaid: 0 },
  };
}

/** Pulls the server-provided filename out of a Content-Disposition header. */
function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? (match[1] ?? FALLBACK_EXPORT_FILENAME) : FALLBACK_EXPORT_FILENAME;
}

/**
 * Serializes the current filters onto the CSV export route. Param names mirror
 * the route contract one-to-one; "Both" is omitted (an absent paidStatus means
 * both on the server) and includeDisabledTeachers is always sent so the export
 * exactly matches the grid the operator is looking at.
 */
export function buildCarryoverExportCsvUrl(fields: CarryoverFilterFields): string {
  const params = new URLSearchParams();
  if (fields.teacherId !== null && fields.teacherId !== "") params.set("teacherId", fields.teacherId);
  if (fields.paidStatus !== "Both") params.set("paidStatus", fields.paidStatus);
  if (fields.dateFrom !== null && fields.dateFrom !== "") params.set("dateFrom", fields.dateFrom);
  if (fields.dateTo !== null && fields.dateTo !== "") params.set("dateTo", fields.dateTo);
  if (fields.search !== "") params.set("search", fields.search);
  params.set("includeDisabledTeachers", String(fields.includeDisabledTeachers));
  return `${CARRYOVER_EXPORT_URL}?${params.toString()}`;
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

/** Fetches one server page of the carryover list and derives its view data. */
function useCarryoverBalancesPage(
  filter: CarryoverFilter | null,
  page: number,
  pageSize: number,
  canViewCarryover: boolean
) {
  const variables = useMemo<CarryoverBalancesQueryVariables>(
    () => ({ filter, limit: pageSize, offset: page * pageSize }),
    [filter, page, pageSize]
  );
  const { data, loading, error, refetch } = useQuery(carryoverBalancesQueryDocument, {
    variables,
    fetchPolicy: "cache-and-network",
    skip: !canViewCarryover,
  });
  const list = data?.carryoverBalances ?? null;
  const rows = useMemo<readonly CarryoverRow[]>(() => list?.rows ?? [], [list]);
  const totalCount = list?.totalCount ?? 0;
  const aggregates = useMemo<CarryoverAggregates>(() => toCarryoverAggregates(list?.aggregates), [list]);
  return { rows, totalCount, aggregates, loading, error, refetch };
}

/**
 * Builds the CSV export handler. It downloads the exact filtered result set the
 * grid shows, reads the truncation header for the > 10 000-row notice, and
 * saves via a blob so the response headers stay readable (a plain anchor
 * cannot expose them). The caller surfaces the outcome as a warning toast.
 */
function useCarryoverCsvExport(fields: CarryoverFilterFields): () => Promise<CarryoverCsvExportOutcome | null> {
  return useCallback(async (): Promise<CarryoverCsvExportOutcome | null> => {
    const url = buildCarryoverExportCsvUrl(fields);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("Carryover CSV export request failed", { status: response.status, url });
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
      logger.error("Carryover CSV export failed", { error: exportError, url });
      return null;
    }
  }, [fields]);
}

export function useCarryoverViewModel(): CarryoverViewModel {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const filterSlice = useCarryoverFilterSlice();
  const { teacherId, paidStatus, dateFrom, dateTo, includeDisabledTeachers, search, page, pageSize } = filterSlice;
  const { setPage, setPageSize } = filterSlice;

  const hasPermission = useUserStore(s => s.hasPermission);
  const canViewCarryover = hasPermission(AppPermission.AccountingCarryoverView);
  const canManageCarryover = hasPermission(AppPermission.AccountingCarryoverManage);

  const debouncedSearch = useDebouncedSearch(search);

  const filterFields = useMemo<CarryoverFilterFields>(
    () => ({ teacherId, paidStatus, dateFrom, dateTo, includeDisabledTeachers, search: debouncedSearch }),
    [teacherId, paidStatus, dateFrom, dateTo, includeDisabledTeachers, debouncedSearch]
  );

  const filter = useMemo(() => buildCarryoverFilter(filterFields), [filterFields]);

  const { rows, totalCount, aggregates, loading, error, refetch } = useCarryoverBalancesPage(
    filter,
    page,
    pageSize,
    canViewCarryover
  );

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);
  const handlePageChange = useCallback((nextPage: number) => setPage(nextPage), [setPage]);
  const handlePageSizeChange = useCallback((nextPageSize: number) => setPageSize(nextPageSize), [setPageSize]);

  const handleExportCsv = useCarryoverCsvExport(filterFields);

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
    pageSizeOptions: CARRYOVER_PAGE_SIZE_OPTIONS,
    canViewCarryover,
    canManageCarryover,
    handleExportCsv,
  };
}
