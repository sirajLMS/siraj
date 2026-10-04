"use client";

import type { ErrorLike } from "@apollo/client";
import { useCallback, useEffect, useMemo } from "react";
import {
  AppPermission,
  type SessionAuditReportQuery_sessionAuditReport_rows,
  type SessionAuditReportSort,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { startSessionAuditUrlSync, useSessionAuditFilterStore } from "@/frontend/common/stores/sessionAuditFilterStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  buildReportFilter,
  hasAnyReportFilter,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.helpers";
import {
  useDebouncedSearch,
  useSessionAuditCsvExport,
  useSessionAuditFilterSlice,
  useSessionAuditReportPage,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.hooks";
import type {
  SessionAuditCsvExportOutcome,
  SessionAuditExportParams,
  SessionAuditFilterSlice,
  SessionAuditReportAggregates,
  SessionAuditReportFilterFields,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.types";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** One row of the session audit report (denormalized per-session audit view). */
export type SessionAuditReportRow = SessionAuditReportQuery_sessionAuditReport_rows;

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
