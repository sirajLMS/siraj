import { type PersonFilterSelection, usePersonFilterBridge } from "@/frontend/common/views/dashboard/__shared__";
import { findRowPersonOption } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar.helpers";
import type { SessionAuditReportRow } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

/**
 * Binds the session-audit report rows' person-option finder to the shared
 * id-only store filter bridge.
 */
export function usePersonFilterSelection(
  personId: string | null,
  rows: readonly SessionAuditReportRow[],
  idOf: (row: SessionAuditReportRow) => string | null,
  nameOf: (row: SessionAuditReportRow) => string | null,
  setPersonId: (personId: string | null) => void
): PersonFilterSelection {
  return usePersonFilterBridge(personId, rows, idOf, nameOf, setPersonId, findRowPersonOption);
}
