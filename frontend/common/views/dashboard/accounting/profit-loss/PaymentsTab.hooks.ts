"use client";

import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useProfitLossCsvExport } from "@/frontend/common/views/dashboard/accounting/profit-loss/__shared__";

/** Route that streams the month's payments rows as a CSV download. */
const CSV_EXPORT_URL = "/api/profit-loss/payments/export";

/**
 * Runs one CSV download of the month's earned-revenue rows. Resolves to null
 * when the download failed, so the caller's busy flag always clears; the
 * server's truncation header is passed through for the caller to surface.
 */
export function usePaymentsCsvExport(
  month: string,
  currency: CurrencyCode
): () => Promise<{ truncated: boolean } | null> {
  return useProfitLossCsvExport({
    exportUrl: CSV_EXPORT_URL,
    month,
    currency,
    requestFailedMessage: "Payments CSV export request failed",
    failedMessage: "Payments CSV export failed",
  });
}
