"use client";

import { useCallback } from "react";
import { logger } from "@/frontend/common/utils/logger";

const CSV_EXPORT_URL = "/api/profit-loss/summary/export";

function buildSummaryExportUrl(month: string, currency: string): string {
  const params = new URLSearchParams({ month, currency });
  return `${CSV_EXPORT_URL}?${params.toString()}`;
}

/**
 * Runs one CSV download of the summary table. Failures are logged and resolve
 * normally so the export button's busy lock always clears; the wrapped fetch
 * never rejects past this hook.
 */
export function useSummaryCsvExport(month: string, currency: string): () => Promise<void> {
  return useCallback(async () => {
    const url = buildSummaryExportUrl(month, currency);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error("P&L summary CSV export request failed", { status: response.status, url });
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (exportError) {
      logger.error("P&L summary CSV export failed", { error: exportError, url });
    }
  }, [month, currency]);
}
