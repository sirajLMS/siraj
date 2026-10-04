"use client";

import { useState } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  useSessionAuditColumns,
  useSessionAuditNavigation,
  useSessionAuditNoRowsOverlay,
  useSessionAuditSorting,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.hooks";
import { SessionAuditGridLayout } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.parts";
import {
  type SessionAuditGridModel,
  useSessionAuditSelection,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.selection";
import type { SessionAuditDataGridProps } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.types";
import { useAppTranslation } from "@/shared/locale";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces";

export type { SessionAuditDataGridProps } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.types";

/**
 * Main session-audit grid: server-side sorting and pagination over the report
 * rows, drill-down navigation per row, permission-gated override deep link,
 * the carryover bulk-action toolbar with checkbox selection for carryover
 * managers, the linked-carryover chip column, and the aggregate footer card.
 * Interactive cells (note popover, actions, carryover chip, checkboxes) own
 * their clicks so they never trigger row navigation.
 */
export function SessionAuditDataGrid(props: Readonly<SessionAuditDataGridProps>) {
  const locale = useAppLocale();
  const payrollLabels = useAppTranslation(DashboardBillingPayroll);
  const calculationStatusLabels = payrollLabels.status;
  const [carryoverDialogOpen, setCarryoverDialogOpen] = useState(false);

  const navigation = useSessionAuditNavigation();
  const columns = useSessionAuditColumns({
    labels: props.labels,
    payrollLabels,
    calculationStatusLabels,
    locale,
    canManageReports: props.canManageReports,
    onOpenAuditOverride: navigation.openAuditOverride,
    onOpenCarryover: navigation.openCarryover,
  });
  const { selection, selectedRows } = useSessionAuditSelection({
    rows: props.rows,
    selectedIds: props.selectedIds,
    toggleSelected: props.toggleSelected,
    clearSelection: props.clearSelection,
    onPageChange: props.setPage,
    onPageSizeChange: props.setPageSize,
  });
  const { sortModel, onSortModelChange } = useSessionAuditSorting({
    sortField: props.sortField,
    sortDirection: props.sortDirection,
    setSort: props.setSort,
  });
  const noRowsOverlay = useSessionAuditNoRowsOverlay(
    props.labels.emptyState,
    props.hasActiveFilters,
    props.clearFilters
  );

  const model: SessionAuditGridModel = {
    ...props,
    locale,
    columns,
    selection,
    selectedRows,
    sortModel,
    onSortModelChange,
    onCellClick: navigation.onCellClick,
    onCellKeyDown: navigation.onCellKeyDown,
    noRowsOverlay,
    carryoverDialogOpen,
    onOpenCarryoverDialog: () => {
      setCarryoverDialogOpen(true);
    },
    onCloseCarryoverDialog: () => {
      setCarryoverDialogOpen(false);
    },
  };

  return <SessionAuditGridLayout model={model} />;
}
