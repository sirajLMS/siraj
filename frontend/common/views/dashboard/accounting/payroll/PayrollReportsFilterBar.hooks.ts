"use client";

import { type PersonFilterSelection, usePersonFilterBridge } from "@/frontend/common/views/dashboard/__shared__";
import { findRowPersonOption } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar.helpers";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";

/**
 * Binds the payroll report rows' person-option finder to the shared id-only
 * store filter bridge.
 */
export function usePersonFilterSelection(
  personId: string | null,
  rows: readonly PayrollReportRow[],
  idOf: (row: PayrollReportRow) => string | null,
  nameOf: (row: PayrollReportRow) => string | null,
  setPersonId: (personId: string | null) => void
): PersonFilterSelection {
  return usePersonFilterBridge(personId, rows, idOf, nameOf, setPersonId, findRowPersonOption);
}
