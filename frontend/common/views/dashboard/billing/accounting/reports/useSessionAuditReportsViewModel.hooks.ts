import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import type {
  SessionAuditReportFilter,
  SessionAuditReportQuery_sessionAuditReport_rows,
  SessionAuditReportQueryVariables,
  SessionAuditReportSort,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { sessionAuditReportQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useSessionAuditFilterStore } from "@/frontend/common/stores/sessionAuditFilterStore";
import {
  downloadCsvExport,
  useDebouncedSearchWithDelay,
} from "@/frontend/common/views/dashboard/accounting/__shared__";
import { SEARCH_DEBOUNCE_MS } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.constants";
import {
  buildSessionAuditExportCsvUrl,
  extractDownloadFilename,
  toSessionAuditAggregates,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.helpers";
import type {
  SessionAuditCsvExportOutcome,
  SessionAuditExportParams,
  SessionAuditFilterSlice,
  SessionAuditReportAggregates,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.types";

export function useSessionAuditFilterSlice(): SessionAuditFilterSlice {
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

/** Debounces the raw search box text so only settled queries hit the server. */
export function useDebouncedSearch(search: string): string {
  return useDebouncedSearchWithDelay(search, SEARCH_DEBOUNCE_MS);
}

/** Fetches one server page of the session audit report and derives its view data. */
export function useSessionAuditReportPage(
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
  const rows = useMemo<readonly SessionAuditReportQuery_sessionAuditReport_rows[]>(() => report?.rows ?? [], [report]);
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
export function useSessionAuditCsvExport(
  p: SessionAuditExportParams
): () => Promise<SessionAuditCsvExportOutcome | null> {
  return useCallback(
    () =>
      downloadCsvExport({
        url: buildSessionAuditExportCsvUrl(p),
        resolveFilename: extractDownloadFilename,
        requestFailedMessage: "Session audit CSV export request failed",
        exportFailedMessage: "Session audit CSV export failed",
      }),
    [p]
  );
}
