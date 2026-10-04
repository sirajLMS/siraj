"use client";

import type { GridCellParams, GridColDef, GridSortModel, MuiEvent } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { type ComponentType, type KeyboardEvent, useCallback, useMemo } from "react";
import { OrderSortDirection, SessionAuditReportSortField } from "@/frontend/common/graphql/generated/gql/graphql";
import { buildSessionAuditColumns } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.columns";
import {
  auditHref,
  auditOverrideHref,
  carryoverHref,
  GRID_FIELD_TO_SORT_FIELD,
  NON_NAVIGATING_FIELDS,
  SORT_DIRECTION_TO_GRID_SORT,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.constants";
import { createSessionAuditNoRowsOverlay } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.overlay";
import type { SessionAuditColumnArgs } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.types";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

export interface SessionAuditNavigation {
  readonly onCellClick: (params: GridCellParams<SessionAuditReportRow>) => void;
  readonly onCellKeyDown: (params: GridCellParams<SessionAuditReportRow>, event: MuiEvent<KeyboardEvent>) => void;
  readonly openAuditOverride: (row: SessionAuditReportRow) => void;
  readonly openCarryover: (carryoverBalanceId: string) => void;
}

/** Row navigation and deep links for the session audit grid. */
export function useSessionAuditNavigation(): SessionAuditNavigation {
  const router = useRouter();

  const navigateToAudit = useCallback(
    (instanceId: string | null) => {
      if (instanceId === null) return;
      router.push(auditHref(instanceId));
    },
    [router]
  );

  const openAuditOverride = useCallback(
    (row: SessionAuditReportRow) => {
      if (row.instanceId === null) return;
      router.push(auditOverrideHref(row.instanceId));
    },
    [router]
  );

  const openCarryover = useCallback(
    (carryoverBalanceId: string) => {
      router.push(carryoverHref(carryoverBalanceId));
    },
    [router]
  );

  const onCellClick = useCallback(
    (params: GridCellParams<SessionAuditReportRow>) => {
      if (NON_NAVIGATING_FIELDS.has(params.field)) return;
      navigateToAudit(params.row.instanceId);
    },
    [navigateToAudit]
  );

  const onCellKeyDown = useCallback(
    (params: GridCellParams<SessionAuditReportRow>, event: MuiEvent<KeyboardEvent>) => {
      if (event.key !== "Enter") return;
      if (NON_NAVIGATING_FIELDS.has(params.field)) return;
      navigateToAudit(params.row.instanceId);
    },
    [navigateToAudit]
  );

  return { onCellClick, onCellKeyDown, openAuditOverride, openCarryover };
}

export function useSessionAuditColumns(args: SessionAuditColumnArgs): GridColDef<SessionAuditReportRow>[] {
  const {
    labels,
    payrollLabels,
    calculationStatusLabels,
    locale,
    canManageReports,
    onOpenAuditOverride,
    onOpenCarryover,
  } = args;
  return useMemo(
    () =>
      buildSessionAuditColumns({
        labels,
        payrollLabels,
        calculationStatusLabels,
        locale,
        canManageReports,
        onOpenAuditOverride,
        onOpenCarryover,
      }),
    [labels, payrollLabels, calculationStatusLabels, locale, canManageReports, onOpenAuditOverride, onOpenCarryover]
  );
}

export interface SessionAuditSorting {
  readonly sortModel: GridSortModel;
  readonly onSortModelChange: (model: GridSortModel) => void;
}

export interface SessionAuditSortingArgs {
  readonly sortField: SessionAuditReportSortField;
  readonly sortDirection: OrderSortDirection;
  readonly setSort: (sortField: SessionAuditReportSortField, sortDirection: OrderSortDirection) => void;
}

/** Server sort model and its change handler, mapping grid fields onto API sort fields. */
export function useSessionAuditSorting(args: SessionAuditSortingArgs): SessionAuditSorting {
  const { sortField, sortDirection, setSort } = args;
  const sortModel = useMemo<GridSortModel>(
    () => [{ field: sortField, sort: SORT_DIRECTION_TO_GRID_SORT[sortDirection] }],
    [sortField, sortDirection]
  );

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      // A cleared model (third header click) falls back to the default server sort.
      if (model.length === 0) {
        setSort(SessionAuditReportSortField.ScheduledStartAt, OrderSortDirection.Desc);
        return;
      }
      const entry = model[0];
      if (!(entry.field in GRID_FIELD_TO_SORT_FIELD)) return;
      const field = GRID_FIELD_TO_SORT_FIELD[entry.field];
      setSort(field, entry.sort === "desc" ? OrderSortDirection.Desc : OrderSortDirection.Asc);
    },
    [setSort]
  );

  return { sortModel, onSortModelChange };
}

export function useSessionAuditNoRowsOverlay(
  labels: SessionAuditLabels["emptyState"],
  hasActiveFilters: boolean,
  onClearFilters: () => void
): ComponentType {
  return useMemo(
    () => createSessionAuditNoRowsOverlay(labels, hasActiveFilters, onClearFilters),
    [labels, hasActiveFilters, onClearFilters]
  );
}
