"use client";

import { useProfitLossCsvExport } from "@/frontend/common/views/dashboard/accounting/profit-loss/__shared__";

/** Route that streams the month's expense ledger as a CSV download. */
const CSV_EXPORT_URL = "/api/profit-loss/expenses/export";

/**
 * Runs one CSV download of the month's expense ledger and resolves to the
 * server's truncation flag, or null when the download itself failed, so the
 * busy flag always clears.
 */
export function useExpensesCsvExport(month: string, currency: string): () => Promise<{ truncated: boolean } | null> {
  return useProfitLossCsvExport({
    exportUrl: CSV_EXPORT_URL,
    month,
    currency,
    requestFailedMessage: "Expenses CSV export request failed",
    failedMessage: "Expenses CSV export failed",
  });
}
