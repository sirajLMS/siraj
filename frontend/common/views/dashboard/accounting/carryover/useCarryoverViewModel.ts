"use client";

import { useCallback, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { CARRYOVER_PAGE_SIZE_OPTIONS } from "@/frontend/common/stores/carryoverFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { buildCarryoverFilter } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.helpers";
import {
  useCarryoverBalancesPage,
  useCarryoverCsvExport,
  useCarryoverFilterSlice,
  useDebouncedSearch,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.hooks";
import type {
  CarryoverFilterFields,
  CarryoverViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover } from "@/shared/locale/namespaces";

export type {
  CarryoverAggregates,
  CarryoverCsvExportOutcome,
  CarryoverRow,
  CarryoverViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.types";

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
