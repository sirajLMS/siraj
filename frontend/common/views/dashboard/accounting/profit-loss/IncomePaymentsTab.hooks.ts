"use client";

import { useProfitLossCsvExport } from "@/frontend/common/views/dashboard/accounting/profit-loss/__shared__";

/** Route that streams the month's income payments as a CSV download. */
const CSV_EXPORT_URL = "/api/profit-loss/income/export";

/**
 * Runs one CSV download of the month's income payments. Resolves to null when
 * the download failed, so the caller's busy flag always clears; the server's
 * truncation header is passed through for the caller to surface.
 */
export function useIncomeCsvExport(month: string, currency: string): () => Promise<{ truncated: boolean } | null> {
  return useProfitLossCsvExport({
    exportUrl: CSV_EXPORT_URL,
    month,
    currency,
    requestFailedMessage: "Income payments CSV export request failed",
    failedMessage: "Income payments CSV export failed",
  });
}
