"use client";

import { useAccountingCsvExport } from "@/frontend/common/views/dashboard/accounting/__shared__";
import type { ExpenseCsvExportOutcome } from "@/frontend/common/views/dashboard/accounting/expenses/useExpensesViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface ExpensesExport {
  /** True while a download request is in flight. */
  readonly exporting: boolean;
  /** Runs the export and surfaces its outcome as a toast. */
  readonly runExport: () => void;
}

/**
 * Drives one CSV export run with a busy lock and outcome toasts: failure when
 * the download itself failed, the truncation notice when the server capped the
 * export at its row ceiling, and silence for a clean download.
 */
export function useExpensesExport(
  handleExportCsv: () => Promise<ExpenseCsvExportOutcome | null>,
  labels: ExpensesLabels
): ExpensesExport {
  return useAccountingCsvExport(handleExportCsv, labels);
}
