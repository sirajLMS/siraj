import type { ComponentType } from "react";
import { SessionAuditEmptyState } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditEmptyState";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** Builds the zero-row slot component with the empty-state copy and handlers bound. */
export function createSessionAuditNoRowsOverlay(
  labels: SessionAuditLabels["emptyState"],
  hasActiveFilters: boolean,
  onClearFilters: () => void
): ComponentType {
  return function SessionAuditNoRowsOverlay() {
    return (
      <SessionAuditEmptyState labels={labels} hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
    );
  };
}
