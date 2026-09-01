"use client";

import { useCallback, useMemo } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { toCsvValue } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/optin/optInHistoryHelpers";
import type { WhatsappOptInAuditEntry } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/** Date range filter shape used by the opt-in history table. */
interface OptInDateRange {
  readonly from: string | null;
  readonly to: string | null;
}

/** Labels required by the export hook (subset of `WhatsappLabels`). */
interface OptInHistoryExportLabels {
  readonly optInHistoryDate: string;
  readonly optInHistoryAction: string;
  readonly optInHistoryChangedBy: string;
  readonly optInActionOptedIn: string;
  readonly optInActionOptedOut: string;
}

/** Parameters for the `useOptInHistoryExport` hook. */
export interface UseOptInHistoryExportParams {
  readonly auditEntries: readonly WhatsappOptInAuditEntry[];
  readonly dateRange: OptInDateRange;
  readonly onExportCsv: () => void;
  readonly labels: OptInHistoryExportLabels;
}

/** Return type of the `useOptInHistoryExport` hook. */
export interface UseOptInHistoryExportResult {
  readonly filteredEntries: readonly WhatsappOptInAuditEntry[];
  readonly handleExport: () => void;
}

/**
 * Encapsulates the date-range filter memo and CSV export callback shared by
 * the desktop and mobile opt-in history sections.
 */
export function useOptInHistoryExport({
  auditEntries,
  dateRange,
  onExportCsv,
  labels,
}: Readonly<UseOptInHistoryExportParams>): UseOptInHistoryExportResult {
  const filteredEntries = useMemo(() => {
    const fromTime = dateRange.from ? new Date(dateRange.from).getTime() : null;
    const toTime = dateRange.to ? new Date(dateRange.to).getTime() : null;
    return auditEntries.filter(e => {
      const entryTime = new Date(e.date).getTime();
      if (fromTime !== null && entryTime < fromTime) {
        return false;
      }
      if (toTime !== null && entryTime > toTime + 86_399_999) {
        return false;
      }
      return true;
    });
  }, [auditEntries, dateRange]);

  const handleExport = useCallback(() => {
    onExportCsv();
    try {
      const header = [labels.optInHistoryDate, labels.optInHistoryAction, labels.optInHistoryChangedBy]
        .map(toCsvValue)
        .join(",");
      const rows = filteredEntries.map(e =>
        [e.date, e.action === "optIn" ? labels.optInActionOptedIn : labels.optInActionOptedOut, e.changedBy]
          .map(toCsvValue)
          .join(",")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "opt-in-history.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("Failed to export opt-in history CSV", { error });
    }
  }, [filteredEntries, onExportCsv, labels]);

  return { filteredEntries, handleExport };
}
