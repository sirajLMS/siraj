"use client";

import { useCallback } from "react";
import { downloadCsvExport } from "@/frontend/common/views/dashboard/accounting/__shared__";

interface ProfitLossCsvExportOptions {
  readonly exportUrl: string;
  readonly month: string;
  readonly currency: string;
  readonly requestFailedMessage: string;
  readonly failedMessage: string;
}

/**
 * Runs one CSV download of a profit-loss month and resolves to the server's
 * truncation flag, or null when the download itself failed, so the caller's
 * busy flag always clears.
 */
export function useProfitLossCsvExport(
  options: Readonly<ProfitLossCsvExportOptions>
): () => Promise<{ truncated: boolean } | null> {
  const { exportUrl, month, currency, requestFailedMessage, failedMessage } = options;
  return useCallback(async () => {
    const params = new URLSearchParams({ month, currency });
    return downloadCsvExport({
      url: `${exportUrl}?${params.toString()}`,
      requestFailedMessage,
      exportFailedMessage: failedMessage,
    });
  }, [exportUrl, month, currency, requestFailedMessage, failedMessage]);
}
