"use client";

import type { GridCellParams, GridColDef, GridSortModel, MuiEvent } from "@mui/x-data-grid";
import { type ComponentType, type KeyboardEvent, useMemo } from "react";
import { usePageLocalRowSelection } from "@/frontend/common/components/ui/dataGrid/usePageLocalRowSelection";
import type { SessionAuditDataGridProps } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.types";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

type SessionAuditRowSelection = ReturnType<typeof usePageLocalRowSelection>;

export interface SessionAuditSelectionArgs {
  readonly rows: readonly SessionAuditReportRow[];
  readonly selectedIds: readonly string[];
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export interface SessionAuditSelection {
  readonly selection: SessionAuditRowSelection;
  readonly selectedRows: readonly SessionAuditReportRow[];
}

/** Checkbox selection plus the selected rows resolved against the visible page. */
export function useSessionAuditSelection(args: SessionAuditSelectionArgs): SessionAuditSelection {
  const { rows, selectedIds, toggleSelected, clearSelection, onPageChange, onPageSizeChange } = args;
  const selection = usePageLocalRowSelection({
    selectedIds,
    toggleSelected,
    clearSelection,
    onPageChange,
    onPageSizeChange,
  });
  const selectedRows = useMemo(() => {
    const idSet = new Set(selectedIds);
    return rows.filter(row => idSet.has(row.instanceId ?? row.id ?? ""));
  }, [rows, selectedIds]);
  return { selection, selectedRows };
}

/** Everything the session audit grid layout renders from. */
export interface SessionAuditGridModel extends SessionAuditDataGridProps {
  readonly locale: string;
  readonly columns: GridColDef<SessionAuditReportRow>[];
  readonly selection: SessionAuditRowSelection;
  readonly selectedRows: readonly SessionAuditReportRow[];
  readonly sortModel: GridSortModel;
  readonly onSortModelChange: (model: GridSortModel) => void;
  readonly onCellClick: (params: GridCellParams<SessionAuditReportRow>) => void;
  readonly onCellKeyDown: (params: GridCellParams<SessionAuditReportRow>, event: MuiEvent<KeyboardEvent>) => void;
  readonly noRowsOverlay: ComponentType;
  readonly carryoverDialogOpen: boolean;
  readonly onOpenCarryoverDialog: () => void;
  readonly onCloseCarryoverDialog: () => void;
}
