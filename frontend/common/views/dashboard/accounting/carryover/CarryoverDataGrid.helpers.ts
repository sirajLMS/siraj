import type { CarryoverRow } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel";

/** Picks the visible rows whose ids sit in the store-backed bulk selection. */
export function selectedVisibleRows(rows: readonly CarryoverRow[], selectedIds: readonly string[]): CarryoverRow[] {
  const idSet = new Set(selectedIds);
  return rows.filter(row => row.id !== null && idSet.has(row.id));
}

/** True when every selected row is unpaid, so the selection can convert to expenses. */
export function selectionIsAllUnpaid(selectedRows: readonly CarryoverRow[]): boolean {
  return selectedRows.every(row => row.isPaid !== true);
}
