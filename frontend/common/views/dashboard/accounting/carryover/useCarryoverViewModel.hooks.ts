"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import type { CarryoverBalancesQueryVariables, CarryoverFilter } from "@/frontend/common/graphql/generated/gql/graphql";
import { carryoverBalancesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useCarryoverFilterStore } from "@/frontend/common/stores/carryoverFilterStore";
import {
  downloadCsvExport,
  useDebouncedSearchWithDelay,
} from "@/frontend/common/views/dashboard/accounting/__shared__";
import { SEARCH_DEBOUNCE_MS } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.constants";
import {
  buildCarryoverExportCsvUrl,
  extractDownloadFilename,
  toCarryoverAggregates,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.helpers";
import type {
  CarryoverAggregates,
  CarryoverCsvExportOutcome,
  CarryoverFilterFields,
  CarryoverFilterSlice,
  CarryoverRow,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.types";

export function useCarryoverFilterSlice(): CarryoverFilterSlice {
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

/** Debounces the raw search box text so only settled queries hit the server. */
export function useDebouncedSearch(search: string): string {
  return useDebouncedSearchWithDelay(search, SEARCH_DEBOUNCE_MS);
}

/** Fetches one server page of the carryover list and derives its view data. */
export function useCarryoverBalancesPage(
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
export function useCarryoverCsvExport(fields: CarryoverFilterFields): () => Promise<CarryoverCsvExportOutcome | null> {
  return useCallback(
    () =>
      downloadCsvExport({
        url: buildCarryoverExportCsvUrl(fields),
        resolveFilename: extractDownloadFilename,
        requestFailedMessage: "Carryover CSV export request failed",
        exportFailedMessage: "Carryover CSV export failed",
      }),
    [fields]
  );
}
