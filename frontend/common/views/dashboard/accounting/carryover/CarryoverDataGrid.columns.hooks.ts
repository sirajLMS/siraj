"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildCarryoverColumns } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.columns";
import type { CarryoverColumnArgs } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.types";
import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";

/** Memoized column set for the carryover grid, rebuilt only when an input changes. */
export function useCarryoverColumns(args: CarryoverColumnArgs): GridColDef<CarryoverRow>[] {
  const { labels, actionsColumnLabel, createdAtColumnLabel, locale, canManageCarryover } = args;
  const { onOpenForm, onOpenBulkToExpense, onOpenDelete, onOpenUnpay, onOpenDrawer } = args;
  return useMemo<GridColDef<CarryoverRow>[]>(
    () =>
      buildCarryoverColumns({
        labels,
        actionsColumnLabel,
        createdAtColumnLabel,
        locale,
        canManageCarryover,
        onOpenForm,
        onOpenBulkToExpense,
        onOpenDelete,
        onOpenUnpay,
        onOpenDrawer,
      }),
    [
      labels,
      actionsColumnLabel,
      createdAtColumnLabel,
      locale,
      canManageCarryover,
      onOpenForm,
      onOpenBulkToExpense,
      onOpenDelete,
      onOpenUnpay,
      onOpenDrawer,
    ]
  );
}
